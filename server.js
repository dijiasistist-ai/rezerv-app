const crypto = require("crypto");
const express = require("express");
const path = require("path");

const {
  filterListings,
  getAdminDashboardPayload,
  getBootstrapPayload,
  getListingById,
  getNearbyMapPayload,
  getVenueDashboardPayload,
} = require("./data/store");

const {
  addReview,
  addReservation,
  deleteAdminAccessRule,
  deleteUserById,
  deleteVenueRecord,
  findUserByEmail,
  findUserByEmailVerificationToken,
  findUserById,
  getAdminAccessRules,
  getDeletedVenueIds,
  getReservations,
  getReviews,
  getUsers,
  getVenues,
  getDevOutbox,
  getVenueOverlay,
  hashPassword,
  migrateLegacyUsers,
  normalizeEmail,
  saveVenueOverlay,
  upsertAdminAccessRule,
  upsertUser,
  updateReservation,
  verifyPassword,
  ensureSeedUser,
} = require("./data/runtime-store");
const { diagnoseEmailTransport, getEmailStatus, sendEmail } = require("./services/email");
const { getMessagingStatus, normalizePhoneNumber, sendMessage } = require("./services/messaging");
const {
  PAYMENT_MODES,
  calculateReservationBilling,
  summarizeMonthlyCommission,
} = require("./services/reservation-billing");
const { customerReservationTerms, venuePartnerTerms } = require("./data/legal-terms");

const app = express();
const port = Number(process.env.PORT || 8091);
const sessions = new Map();
const adaLiveSessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000;
const ADA_LIVE_SESSION_TTL_MS = 20 * 60 * 1000;
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SHARED_SECRET || "tyee-local-session-secret";
const HIDE_PUBLIC_VENUES = process.env.HIDE_PUBLIC_VENUES === "1";
const ASSISTANT_DISPLAY_NAME = "Tyee";
const DEFAULT_SIMLI_FACE_ID = "b1f6ad8f-ed78-430b-85ef-2ec672728104";
const OPENAI_TTS_SAMPLE_RATE = 24000;
const SIMLI_AUDIO_SAMPLE_RATE = 16000;
const SIMLI_AUDIO_CHUNK_BYTES = 6000;
const CALENDAR_BASE_DATE = new Date(2026, 4, 11, 12, 0, 0);
const VENUE_GALLERY_LIMIT = 6;
const CALENDAR_SLOT_TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
  "01:00",
];

app.set("trust proxy", true);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin =
    origin && /^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?|https:\/\/tyee\.app)$/.test(origin)
      ? origin
      : "";
  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

function createToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex");
}

function createSmsCode() {
  return String(crypto.randomInt(100000, 999999));
}

function encodeSessionPart(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signSessionPayload(payload) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function createSignedSessionToken(user) {
  const payload = encodeSessionPart({
    userId: user.id,
    exp: Date.now() + SESSION_TTL_MS,
  });
  return `${payload}.${signSessionPayload(payload)}`;
}

function parseSignedSessionToken(token = "") {
  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) return null;
  const expected = signSessionPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.userId || Number(parsed.exp || 0) < Date.now()) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: normalizeEmail(user.email),
    phone: user.phone || "",
    canManageVenue: Boolean(user.canManageVenue),
    canAccessAdmin: Boolean(user.isAdmin),
    isAdmin: Boolean(user.isAdmin),
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    venueId: getUserVenueId(user),
  };
}

function createVenueIdFromUser(user) {
  const base = user?.id || normalizeEmail(user?.email || "venue");
  return `venue-${String(base).replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

function getUserVenueId(user) {
  if (!user?.canManageVenue) return "";
  const email = normalizeEmail(user.email || "");
  const reservedDefaultOwners = new Set(["firma@tyee.app", "admin@tyee.app"]);
  if (user.venueId && (user.venueId !== "zincirlikuyu-arena" || reservedDefaultOwners.has(email) || user.isAdmin)) {
    return user.venueId;
  }
  return createVenueIdFromUser(user);
}

function resolveVenueIdForRequest(req, requestedVenueId = "") {
  const requested = String(requestedVenueId || "").trim();
  if (req.user?.isAdmin && requested) return requested;
  return getUserVenueId(req.user) || "zincirlikuyu-arena";
}

function getInitials(value = "") {
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("tr-TR") || "İ";
}

function publicBaseUrl(req) {
  const configured = process.env.PUBLIC_BASE_URL || process.env.PUBLIC_URL;
  if (configured) return configured.replace(/\/$/, "");
  const requestHost = req.get("x-forwarded-host") || req.get("host");
  if (requestHost) return `${req.protocol}://${requestHost}`;
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  return "";
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function verificationEmailTemplate({ name, verifyUrl, accountType = "customer" }) {
  const safeName = escapeHtml(name);
  const safeVerifyUrl = escapeHtml(verifyUrl);
  const isVenue = accountType === "venue";
  const headline = isVenue ? "İşletme hesabın hazır." : "Bireysel hesabın hazır.";
  const intro = isVenue
    ? "İşletme hesabın başarıyla oluşturuldu."
    : "Seni gördüğümüze çok sevindik. Artık yakınındaki hizmetleri keşfetmeye, karşılaştırmaya ve zamanı geldiğinde kolayca rezervasyon yapmaya hazırsın.";
  const nextStep = isVenue
    ? "Şimdi profilini, lokasyonunu ve hizmetlerini tamamlayarak müşterilerin tarafından keşfedilmeye başlayabilirsin."
    : "Başlamak için e-postanı doğrula; sonra tyee deneyimini senin için daha kişisel hale getireceğiz.";
  const detail = isVenue
    ? "Tyee, rezervasyonlarını yönetmeni, görünürlüğünü artırmanı ve müşterilerinle daha kolay buluşmanı sağlar."
    : "Tyee hesabınla rezervasyonlarını, favorilerini, değerlendirmelerini, fatura adreslerini ve ödeme adımlarını tek yerden takip edebilirsin.";
  const ctaLabel = isVenue ? "İşletmeni Aktifleştir" : "E-postamı doğrula";
  const extraTitle = isVenue ? "Ek Bilgi" : "Hesabınla neler yapabilirsin?";
  const extraFirst = isVenue
    ? "Profilini tamamlamak yalnızca birkaç dakika sürer."
    : "Yakınındaki işletmeleri keşfedebilir, fiyat ve müsaitlikleri karşılaştırabilir, rezervasyonlarını hesabından takip edebilirsin.";
  const extraSecond = isVenue
    ? "Herhangi bir sorunda ekibimiz yanında."
    : "E-postanı doğruladıktan sonra hesabın daha güvenli şekilde kullanılabilir.";

  return {
    subject: isVenue ? "tyee işletme hesabına hoş geldin" : "tyee hesabını doğrula",
    text: `Merhaba ${name},\n\n${intro}\n\n${nextStep}\n\n${detail}\n\n${ctaLabel}: ${verifyUrl}\n\n${extraTitle}\n${extraFirst}\n\n${extraSecond}\n\nTyee Ekibi`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#111827;background:#ffffff">
        <div style="border:1px solid #e7edf5;border-radius:18px;padding:30px;background:#fbfdff">
          <img src="cid:tyee-logo" width="132" alt="tyee" style="display:block;width:132px;max-width:42%;height:auto;margin:0 0 22px;border:0;outline:none;text-decoration:none" />
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;color:#07123d">${headline}</h1>
          <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#344054">Merhaba ${safeName},</p>
          <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#344054">${intro}</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#344054">${nextStep}</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#344054">${detail}</p>
          <a href="${safeVerifyUrl}" target="_blank" rel="noopener" style="display:inline-block;margin:0 0 26px;padding:13px 20px;border-radius:12px;background:#248be8;color:#fff;text-decoration:none;font-weight:800">${ctaLabel}</a>
          <div style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:0 0 24px;padding:20px 0">
            <p style="margin:0 0 12px;font-size:18px;line-height:1.45;color:#111827;font-weight:800">${extraTitle}</p>
            <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#344054">${extraFirst}</p>
            <p style="margin:0;font-size:16px;line-height:1.65;color:#344054">${extraSecond}</p>
          </div>
          <p style="margin:0;font-size:14px;line-height:1.55;color:#667085"><strong style="color:#111827">Tyee Ekibi</strong></p>
        </div>
      </div>
    `,
  };
}

function passwordResetEmailTemplate({ name, resetToken, resetUrl }) {
  const safeName = escapeHtml(name || "tyee kullanıcısı");
  const safeResetToken = escapeHtml(resetToken);
  const safeResetUrl = escapeHtml(resetUrl);
  return {
    subject: "tyee şifre sıfırlama",
    text: `Merhaba ${name},\n\ntyee şifreni yenilemek için aşağıdaki bağlantıyı kullanabilirsin. Bağlantı 30 dakika geçerlidir.\n\nŞifre yenileme bağlantısı: ${resetUrl}\n\nBağlantı açılmazsa bu tek kullanımlık kodu forma yapıştırabilirsin: ${resetToken}\n\nBu işlem sana ait değilse bu e-postayı yok sayabilirsin.\n\nTyee Ekibi`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#101828;background:#ffffff">
        <div style="border:1px solid #e7edf5;border-radius:18px;padding:30px;background:#fbfdff">
          <h1 style="margin:0 0 12px;font-size:24px;color:#07123d">Şifreni yenile</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#344054">Merhaba ${safeName}, tyee hesabın için şifre yenileme isteği aldık.</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#344054">Aşağıdaki bağlantı 30 dakika geçerlidir ve yalnızca bir kez kullanılabilir.</p>
          <a href="${safeResetUrl}" target="_blank" rel="noopener" style="display:inline-block;margin:0 0 22px;padding:13px 20px;border-radius:12px;background:#248be8;color:#fff;text-decoration:none;font-weight:800">Şifremi yenile</a>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#667085">Bağlantı açılmazsa bu tek kullanımlık kodu forma yapıştırabilirsin:</p>
          <code style="display:block;word-break:break-all;margin:0 0 20px;padding:12px 14px;border-radius:12px;background:#eef5ff;color:#07123d;font-size:13px;line-height:1.45">${safeResetToken}</code>
          <p style="margin:0;font-size:13px;line-height:1.55;color:#667085">Bu işlem sana ait değilse bu e-postayı yok sayabilirsin.</p>
        </div>
      </div>
    `,
  };
}

function sendVerificationEmailForBaseUrl(baseUrl, user) {
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(
    user.emailVerificationToken,
  )}`;
  const email = verificationEmailTemplate({
    name: user.name,
    verifyUrl,
    accountType: user.canManageVenue ? "venue" : "customer",
  });
  return sendEmail({
    to: user.email,
    template: "email-verification",
    attachments: [
      {
        filename: "tyee.png",
        path: path.join(__dirname, "assets", "tyee.png"),
        cid: "tyee-logo",
      },
    ],
    ...email,
  });
}

function sendVerificationEmail(req, user) {
  return sendVerificationEmailForBaseUrl(publicBaseUrl(req), user);
}

function describeEmailDelivery(emailDelivery, sentMessage, devMessage) {
  if (emailDelivery?.status === "sent") return sentMessage;
  if (emailDelivery?.status === "dev-queued") return devMessage;
  if (emailDelivery?.status === "failed") {
    return "E-posta sağlayıcısına bağlanılamadı; doğrulama gönderimi admin posta kutusuna hata olarak kaydedildi.";
  }
  return "E-posta gönderim durumu kaydedildi.";
}

function summarizeNotificationDelivery(delivery) {
  if (!delivery) return { status: "skipped" };
  return {
    provider: delivery.provider || "dev-log",
    channel: delivery.channel || "email",
    status: delivery.status || "queued",
    to: delivery.to || "",
    template: delivery.template || "notification",
    error: delivery.error || "",
  };
}

function describeSmsDelivery(smsDelivery, phone) {
  if (!phone) return "";
  if (!smsDelivery) return " SMS gönderimi atlandı.";
  if (smsDelivery.provider === "twilio" && smsDelivery.status !== "failed") return " Hoş geldin SMS'i gönderildi.";
  if (smsDelivery.status === "dev-queued") {
    return " SMS sağlayıcısı tanımlı olmadığı için hoş geldin mesajı admin SMS kutusuna kaydedildi.";
  }
  if (smsDelivery.status === "failed") {
    return " SMS hazırlandı ancak gönderim sağlayıcısında hata oluştu.";
  }
  return " SMS gönderim durumu kaydedildi.";
}

function describeRegistrationDelivery(emailDelivery, smsDelivery, phone) {
  const parts = [
    "Hesap oluşturuldu.",
    describeEmailDelivery(
      emailDelivery,
      "E-posta doğrulama linki gönderildi.",
      "E-posta sağlayıcısı dev modda olduğu için doğrulama admin posta kutusuna kaydedildi.",
    ),
    describeSmsDelivery(smsDelivery, phone).trim(),
  ].filter(Boolean);

  return parts.join(" ");
}

async function sendRegistrationWelcomeSms(user) {
  if (!user.phone) return null;
  const firstName = String(user.name || "").trim().split(/\s+/)[0] || "Merhaba";
  const body = user.canManageVenue
    ? `Merhaba ${firstName}, tyee işletme hesabın oluşturuldu. Profilini, hizmetlerini ve çalışma saatlerini tamamlayarak satışa başlayabilirsin.`
    : `Merhaba ${firstName}, tyee hesabın oluşturuldu. Yakınındaki işletmeleri keşfedebilir, rezervasyonlarını kolayca takip edebilirsin.`;

  return sendMessage({
    channel: "sms",
    to: user.phone,
    template: "registration-welcome",
    body,
  });
}

function getVenueOwnerContact(venueId = "") {
  const overlay = venueId ? getVenueOverlay(venueId) : {};
  const settings = overlay.settings || {};
  const contact = settings.contact || {};
  const owner = getUsers().find((user) => getUserVenueId(user) === venueId && user.canManageVenue);

  return {
    name: contact.authorizedName || owner?.name || settings.businessName || "İşletme yetkilisi",
    phone: contact.whatsapp || contact.phone || owner?.phone || "",
    email: contact.email || owner?.email || "",
  };
}

function createReservationSmsMessages(reservation) {
  const when = [formatDateTr(reservation.serviceDate), reservation.serviceTime].filter(Boolean).join(" ");
  const service = reservation.serviceLabel || reservation.categoryLabel || "Rezervasyon";
  const total = formatCurrency(reservation.totalAmount);

  return {
    customer: `tyee: ${reservation.venueName} rezervasyonun ${when} için alındı. Hizmet: ${service}. Tutar: ${total}.`,
    owner: `tyee: Yeni rezervasyon. ${reservation.customerName}, ${service}, ${when}. Tutar: ${total}. Müşteri tel: ${reservation.customerPhone}.`,
  };
}

const DEMO_MARKETPLACE_SEED_VERSION = "2026-06-23-marketplace-v3-closed-calendar";
const NEMO_DETAIL_SEED_VERSION = "2026-06-24-nemo-gallery-v1";
const NEMO_DEFAULT_GALLERY = [
  {
    src: "/assets/pet-kuafor-grooming.png",
    role: "Dış görünüş",
    name: "pet-kuafor-grooming.png",
  },
  {
    src: "/assets/pet-kuafor-poodle.jpg",
    role: "Dükkan içi",
    name: "pet-kuafor-poodle.jpg",
  },
  {
    src: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1400&q=82",
    role: "Çalışanlar",
    name: "pet-bakim-ekibi",
  },
];

function createDemoSlots() {
  return { slotModes: {}, slotServices: {} };
}

function createDemoFacilities(items = []) {
  return items.map((item) => ({
    id: String(item.id || item.label || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    label: item.label,
    icon: item.icon || "✓",
    enabled: true,
  }));
}

function getValidGallerySource(item) {
  return typeof item === "string" ? item : item?.src;
}

function hasUsableGallery(media = {}) {
  return (Array.isArray(media.gallery) ? media.gallery : []).some((item) => getSafeMediaUrl(getValidGallerySource(item)));
}

function getNemoSeedGallery(media = {}) {
  return hasUsableGallery(media) ? media.gallery : NEMO_DEFAULT_GALLERY;
}

function ensureDemoVenueUser(email, demo) {
  const normalizedEmail = normalizeEmail(email);
  const existing = findUserByEmail(normalizedEmail);
  const user = upsertUser({
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    name: demo.name,
    email: normalizedEmail,
    phone: demo.phone || existing?.phone || "",
    passwordHash: existing?.passwordHash || hashPassword("123456"),
    canManageVenue: true,
    isAdmin: false,
    venueId: demo.venueId,
    emailVerified: true,
    phoneVerified: true,
    emailVerificationToken: existing?.emailVerificationToken || "",
    phoneVerificationCode: existing?.phoneVerificationCode || "",
    passwordResetToken: existing?.passwordResetToken || "",
  });

  const existingOverlay = getVenueOverlay(demo.venueId);
  if (existingOverlay._demoSeedVersion === DEMO_MARKETPLACE_SEED_VERSION) return user;

  const { slotModes, slotServices } = createDemoSlots();
  saveVenueOverlay(demo.venueId, {
    _demoSeedVersion: DEMO_MARKETPLACE_SEED_VERSION,
    settings: {
      businessName: demo.name,
      contact: {
        authorizedName: demo.owner || demo.name,
        phone: demo.phone || "",
        whatsapp: demo.phone || "",
        email: normalizedEmail,
        website: demo.website || "",
        instagram: demo.instagram || "",
      },
      details: {
        category: demo.category,
        district: demo.district,
        description: demo.description,
        workingHours: demo.workingHours || "Her gün 10:00 - 20:00",
        cancellationPolicy: demo.cancellationPolicy || "Randevudan 12 saat öncesine kadar ücretsiz değişiklik yapılabilir.",
      },
      locationStatus: "Girilmiş",
      location: {
        address: demo.address,
        lat: String(demo.lat),
        lng: String(demo.lng),
        mapUrl: "",
      },
      media: {
        logoUrl: "",
        coverUrl: demo.coverUrl || "",
        gallery: [],
      },
      areas: (demo.areas || []).map((area) => ({
        name: area.name,
        type: area.type || demo.category,
        capacity: area.capacity || "1",
        price: area.price,
        isActive: area.isActive !== false,
      })),
      facilities: createDemoFacilities(demo.facilities || []),
      payment: {
        invoiceTitle: demo.name,
        taxOffice: "Kadıköy",
        taxNumber: demo.taxNumber || "1111111111",
        iban: "TR00 0000 0000 0000 0000 0000 00",
        paymentMethod: demo.paymentMethod,
      },
      contracts: {
        termsAccepted: true,
        kvkkAccepted: true,
        notes: "Demo işletme sözleşmesi onaylıdır.",
      },
      operations: demo.operations || {},
    },
    slotModes,
    slotServices,
    manualEntries: {},
    calendarPreferences: {
      slotStepMinutes: 60,
      openDays: [],
      publicBookingEnabled: true,
    },
  });

  return user;
}

function seedDemoVenues() {
  const demos = [
    {
      email: "mira@tyee.app",
      venueId: "mira-makeup-studio",
      name: "Mira Makeup & Beauty Studio",
      owner: "Mira Studio",
      phone: "+90 532 000 34 01",
      instagram: "@mirabeautystudio",
      category: "Kadın güzellik merkezi",
      district: "Nişantaşı",
      address: "Teşvikiye Mah. Vali Konağı Cad. No: 18, Şişli / İstanbul",
      lat: 41.0504,
      lng: 28.9921,
      paymentMethod: "Ön ödeme (kapora)",
      coverUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=82",
      description: "Makyaj, tırnak, saç ve kirpik hizmetlerini tek profilde yöneten premium güzellik stüdyosu.",
      facilities: [
        { id: "private-room", label: "Özel oda", icon: "✦" },
        { id: "women-only", label: "Kadın ekibi", icon: "✓" },
        { id: "card", label: "Kartla ödeme", icon: "₺" },
      ],
      areas: [
        { name: "Kalıcı Oje + Manikür", type: "Tırnak bakımı", price: "850" },
        { name: "Protez Tırnak", type: "Tırnak bakımı", price: "1600" },
        { name: "Nail Art Tasarım", type: "Tırnak tasarım", price: "450" },
        { name: "İpek Kirpik", type: "Kirpik", price: "1900" },
        { name: "Lash Lifting", type: "Kirpik", price: "1100" },
        { name: "Kaş Laminasyon", type: "Kaş", price: "900" },
        { name: "Profesyonel Makyaj", type: "Makyaj", price: "2500" },
        { name: "Gelin Makyajı Prova Dahil", type: "Gelin makyajı", price: "6500" },
        { name: "Saç Boyama", type: "Saç", price: "3200" },
        { name: "Fön & Saç Şekillendirme", type: "Saç", price: "950" },
      ],
    },
    {
      email: "masa34@tyee.app",
      venueId: "masa-34-restaurant",
      name: "Masa 34 Restaurant",
      owner: "Masa 34",
      phone: "+90 532 000 34 03",
      category: "Restaurant",
      district: "Karaköy",
      address: "Kemankeş Cad. No: 12, Beyoğlu / İstanbul",
      lat: 41.0245,
      lng: 28.9776,
      paymentMethod: "Sadece randevu",
      coverUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=82",
      description: "Akşam yemeği, brunch ve grup masaları için rezervasyon alan modern restaurant.",
      facilities: [
        { id: "terrace", label: "Teras", icon: "✦" },
        { id: "group", label: "Grup masası", icon: "✓" },
        { id: "valet", label: "Vale", icon: "⌖" },
      ],
      areas: [
        { name: "2 Kişilik Akşam Masası", type: "Masa", capacity: "2", price: "1200" },
        { name: "4 Kişilik Akşam Masası", type: "Masa", capacity: "4", price: "2400" },
        { name: "6-8 Kişilik Grup Masası", type: "Grup", capacity: "8", price: "4800" },
        { name: "Hafta Sonu Brunch", type: "Brunch", capacity: "2", price: "1600" },
      ],
    },
    {
      email: "inkline@tyee.app",
      venueId: "inkline-tattoo",
      name: "Inkline Tattoo Studio",
      owner: "Inkline",
      phone: "+90 532 000 34 04",
      category: "Dövmeci",
      district: "Beşiktaş",
      address: "Sinanpaşa Mah. Şair Nedim Cad. No: 21, Beşiktaş / İstanbul",
      lat: 41.0431,
      lng: 29.0056,
      paymentMethod: "Ön ödeme (kapora)",
      coverUrl: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1400&q=82",
      description: "Fine line, minimal dövme ve kapama danışmanlığı için randevulu çalışan stüdyo.",
      facilities: [
        { id: "sterile", label: "Steril ekipman", icon: "✓" },
        { id: "consult", label: "Ön görüşme", icon: "✦" },
        { id: "aftercare", label: "Bakım notu", icon: "⌖" },
      ],
      areas: [
        { name: "Ön Görüşme", type: "Danışmanlık", price: "300" },
        { name: "Minimal Tattoo", type: "Dövme", price: "1500" },
        { name: "Fine Line Seans", type: "Dövme", price: "2800" },
        { name: "Kapama Danışmanlığı", type: "Kapama", price: "500" },
        { name: "Büyük Parça Seans", type: "Dövme", price: "6000" },
      ],
    },
    {
      email: "barber@tyee.app",
      venueId: "barber-republic",
      name: "Barber Republic",
      owner: "Barber Republic",
      phone: "+90 532 000 34 05",
      category: "Erkek Berber",
      district: "Ataşehir",
      address: "Barbaros Mah. Mor Sümbül Sok. No: 7, Ataşehir / İstanbul",
      lat: 40.9928,
      lng: 29.1244,
      paymentMethod: "Sadece randevu",
      coverUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=82",
      description: "Saç kesim, sakal tasarım, cilt bakım ve damat hazırlığı için randevulu erkek berberi.",
      facilities: [
        { id: "coffee", label: "İkram", icon: "✦" },
        { id: "card", label: "Kartla ödeme", icon: "₺" },
      ],
      areas: [
        { name: "Saç Kesim", type: "Kuaför", price: "550" },
        { name: "Sakal Tasarım", type: "Barber", price: "350" },
        { name: "Saç + Sakal Paket", type: "Paket", price: "800" },
        { name: "Cilt Bakım", type: "Bakım", price: "700" },
        { name: "Damat Hazırlık Paketi", type: "Paket", price: "2200" },
      ],
    },
    {
      email: "primefield@tyee.app",
      venueId: "kadikoy-prime-hali-saha",
      name: "Kadıköy Prime Halı Saha",
      owner: "Prime Field",
      phone: "+90 532 000 34 06",
      category: "Halı saha",
      district: "Fikirtepe",
      address: "Fikirtepe Mah. Spor Sok. No: 10, Kadıköy / İstanbul",
      lat: 40.9962,
      lng: 29.0536,
      paymentMethod: "Ön ödeme (kapora)",
      coverUrl: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1400&q=82",
      description: "Gece aydınlatmalı saha, soyunma odası ve prime saat rezervasyonu.",
      facilities: [
        { id: "locker", label: "Soyunma odası", icon: "✓" },
        { id: "parking", label: "Otopark", icon: "⌖" },
      ],
      areas: [
        { name: "Saha 1 Prime Saat", type: "Halı saha", capacity: "14", price: "3000" },
        { name: "Saha 2 Standart", type: "Halı saha", capacity: "14", price: "2400" },
        { name: "Kaleci + Ekipman", type: "Ek hizmet", capacity: "1", price: "600" },
      ],
    },
    {
      email: "tenislab@tyee.app",
      venueId: "tenislab-kort-hoca",
      name: "TennisLab Kort & Hoca",
      owner: "TennisLab",
      phone: "+90 532 000 34 07",
      category: "Tenis hoca ve kort",
      district: "Etiler",
      address: "Nispetiye Mah. Sporcular Cad. No: 5, Beşiktaş / İstanbul",
      lat: 41.0853,
      lng: 29.0351,
      paymentMethod: "Ödemenin tamamını al",
      coverUrl: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=82",
      description: "Kort kiralama, özel ders ve ekipman seçeneklerini tek takvimde yöneten tenis merkezi.",
      facilities: [
        { id: "equipment", label: "Raket kiralama", icon: "✓" },
        { id: "coach", label: "Antrenör", icon: "✦" },
      ],
      areas: [
        { name: "Açık Kort Kiralama", type: "Kort", capacity: "2", price: "900" },
        { name: "Özel Ders", type: "Hoca", capacity: "1", price: "1600" },
        { name: "Çift Kişilik Ders", type: "Hoca", capacity: "2", price: "2200" },
        { name: "Raket + Top Seti", type: "Ekipman", capacity: "1", price: "250" },
      ],
    },
    {
      email: "flow@tyee.app",
      venueId: "flow-yoga-pilates",
      name: "Flow Yoga & Pilates",
      owner: "Flow Studio",
      phone: "+90 532 000 34 08",
      category: "Yoga ve pilates",
      district: "Caddebostan",
      address: "Bağdat Cad. No: 320, Kadıköy / İstanbul",
      lat: 40.9632,
      lng: 29.0637,
      paymentMethod: "Ödemenin tamamını al",
      coverUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=1400&q=82",
      description: "Yoga, mat pilates, reformer ve özel ders akışlarını sınıf kapasitesiyle yöneten stüdyo.",
      facilities: [
        { id: "studio", label: "Sessiz stüdyo", icon: "✦" },
        { id: "shower", label: "Duş", icon: "✓" },
      ],
      areas: [
        { name: "Drop-in Yoga", type: "Grup ders", capacity: "12", price: "450" },
        { name: "Mat Pilates", type: "Grup ders", capacity: "10", price: "500" },
        { name: "Reformer Pilates", type: "Ekipmanlı ders", capacity: "4", price: "950" },
        { name: "Özel Ders", type: "Bire bir", capacity: "1", price: "1800" },
        { name: "Aylık Üyelik", type: "Üyelik", capacity: "1", price: "4200" },
      ],
    },
  ];

  demos.forEach((demo) => ensureDemoVenueUser(demo.email, demo));
}

function seedExistingNemoVenue() {
  const venueId = "venue-d7aa7820-733b-4b72-8779-0b53604c0cf1";
  const existingOverlay = getVenueOverlay(venueId);
  const existingName = String(existingOverlay.settings?.businessName || "").toLocaleLowerCase("tr-TR");
  if (existingOverlay._nemoDetailVersion === NEMO_DETAIL_SEED_VERSION && hasUsableGallery(existingOverlay.settings?.media)) return;
  if (existingName && !existingName.includes("nemo")) return;

  const { slotModes, slotServices } = createDemoSlots();
  const existingMedia = existingOverlay.settings?.media || {};
  const nemoGallery = getNemoSeedGallery(existingMedia);
  saveVenueOverlay(venueId, {
    _nemoDetailVersion: NEMO_DETAIL_SEED_VERSION,
    settings: {
      ...(existingOverlay.settings || {}),
      businessName: "nemo",
      contact: {
        authorizedName: "Nemo Pet",
        phone: "+90 532 000 34 02",
        whatsapp: "+90 532 000 34 02",
        email: "hysnyildiz@gmail.com",
        website: "",
        instagram: "@nemopetkuafor",
      },
      details: {
        category: "Pet kuaför",
        district: "Balmumcu",
        description: "Kedi ve köpekler için sakin bakım alanı, banyo, tıraş, tarama ve tırnak hizmetleri.",
        workingHours: "Her gün 10:00 - 20:00",
        cancellationPolicy: "Randevudan 12 saat öncesine kadar ücretsiz değişiklik yapılabilir.",
      },
      locationStatus: "Girilmiş",
      location: {
        address: "Balmumcu Mah. Barbaros Bulvarı No: 42, Beşiktaş / İstanbul",
        lat: "41.075764",
        lng: "29.019785",
        mapUrl: "",
      },
      media: {
        ...(existingMedia || {}),
        logoUrl: existingMedia.logoUrl || "",
        coverUrl: existingMedia.coverUrl || getValidGallerySource(nemoGallery[0]) || "",
        gallery: nemoGallery,
      },
      areas: [
        { name: "Küçük Irk Banyo & Tıraş", type: "Köpek bakımı", capacity: "1", price: "900", isActive: true },
        { name: "Büyük Irk Bakım Paketi", type: "Köpek bakımı", capacity: "1", price: "1600", isActive: true },
        { name: "Kedi Tüy Bakımı", type: "Kedi bakımı", capacity: "1", price: "1300", isActive: true },
        { name: "Tırnak Kesimi", type: "Hızlı bakım", capacity: "1", price: "250", isActive: true },
        { name: "Kulak ve Göz Temizliği", type: "Hızlı bakım", capacity: "1", price: "300", isActive: true },
      ],
      facilities: createDemoFacilities([
        { id: "pet-safe", label: "Pet güvenli ekipman", icon: "✓" },
        { id: "waiting", label: "Bekleme alanı", icon: "⌖" },
        { id: "camera", label: "Süreç fotoğrafı", icon: "✦" },
      ]),
      payment: {
        invoiceTitle: "nemo",
        taxOffice: "Beşiktaş",
        taxNumber: "1111111111",
        iban: "TR00 0000 0000 0000 0000 0000 00",
        paymentMethod: "Ödemenin tamamını al",
      },
      contracts: {
        termsAccepted: true,
        kvkkAccepted: true,
        notes: "Demo işletme sözleşmesi onaylıdır.",
      },
      operations: existingOverlay.settings?.operations || {},
    },
    slotModes,
    slotServices,
    manualEntries: {},
    calendarPreferences: {
      slotStepMinutes: 60,
      openDays: [],
      publicBookingEnabled: true,
    },
  });
}

function seedUsers() {
  migrateLegacyUsers();
  const demoVenueUser = ensureSeedUser("demo@tyee.app", { name: "Demo İşletme", password: "123456" });
  upsertUser({
    ...demoVenueUser,
    name: "Demo İşletme",
    email: "demo@tyee.app",
    passwordHash: hashPassword("123456"),
    canManageVenue: true,
    isAdmin: false,
    venueId: "mira-makeup-studio",
    emailVerified: true,
    phoneVerified: true,
    emailVerificationToken: "",
    phoneVerificationCode: "",
    passwordResetToken: "",
  });
  ensureSeedUser("firma@tyee.app", {
    name: "Zincirlikuyu Arena",
    password: "123456",
    canManageVenue: true,
  });
  ensureSeedUser("admin@tyee.app", {
    name: "admin",
    password: "123456",
    canManageVenue: true,
    isAdmin: true,
  });

  const adminUser = findUserByEmail("admin@tyee.app");
  if (adminUser && (!adminUser.isAdmin || !adminUser.canManageVenue || adminUser.name !== "admin")) {
    upsertUser({
      ...adminUser,
      name: "admin",
      canManageVenue: true,
      isAdmin: true,
      emailVerified: true,
    });
  }

  seedDemoVenues();
  seedExistingNemoVenue();
}

seedUsers();

app.use(express.json({ limit: "16mb" }));

const publicStaticFiles = new Set([
  "admin.css",
  "admin.html",
  "admin.js",
  "app.js",
  "checkout.html",
  "checkout-page.js",
  "index.html",
  "review.html",
  "reservation.html",
  "reservation-page.js",
  "styles.css",
  "venue.css",
  "venue.html",
  "venue.js",
]);

function setStaticHeaders(res, filePath) {
  if (/\.(?:css|js|html)$/i.test(filePath)) {
    res.setHeader("Cache-Control", "no-cache");
  }
}

app.use(
  "/assets",
  express.static(path.join(__dirname, "assets"), {
    setHeaders: setStaticHeaders,
  }),
);

function sendIndex(res) {
  const filePath = path.join(__dirname, "index.html");
  setStaticHeaders(res, filePath);
  res.sendFile(filePath);
}

app.head("/", (_req, res) => {
  res.status(200).end();
});

app.get("/", (_req, res) => {
  sendIndex(res);
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "tyee", checkedAt: new Date().toISOString() });
});

app.get("/:file", (req, res, next) => {
  const fileName = String(req.params.file || "");
  if (!publicStaticFiles.has(fileName)) {
    next();
    return;
  }

  const filePath = path.join(__dirname, fileName);
  setStaticHeaders(res, filePath);
  res.sendFile(filePath);
});

function isLocalDemoRequest(req) {
  const host = String(req.hostname || req.get("host") || "").toLocaleLowerCase("tr-TR");
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function splitEnvList(value = "") {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getClientIp(req) {
  const forwarded = String(req.get("x-forwarded-for") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];
  return String(forwarded || req.ip || req.socket?.remoteAddress || "")
    .replace(/^::ffff:/, "")
    .replace(/^::1$/, "127.0.0.1");
}

function getEnvAdminAccessRules() {
  const emails = splitEnvList(process.env.ADMIN_ALLOWED_EMAILS).map(normalizeEmail);
  const emailForRule = (email = "") => normalizeEmail(email || emails[0] || "");
  const ipRules = splitEnvList(process.env.ADMIN_ALLOWED_IPS).map((ipAddress, index) => ({
    id: `env-ip-${index}`,
    label: `Render env IP ${index + 1}`,
    email: emailForRule(),
    ipAddress,
    mobileToken: "",
    note: "Environment variable ile tanımlandı.",
    isActive: true,
    source: "env",
  }));
  const mobileRules = splitEnvList(process.env.ADMIN_MOBILE_ACCESS_TOKENS || process.env.ADMIN_MOBILE_ACCESS_TOKEN).map(
    (mobileToken, index) => ({
      id: `env-mobile-${index}`,
      label: `Mobil uygulama ${index + 1}`,
      email: emailForRule(),
      ipAddress: "",
      mobileToken,
      note: "Mobil uygulama erişimi için environment variable.",
      isActive: true,
      source: "env",
    }),
  );

  return [...ipRules, ...mobileRules];
}

function getAllAdminAccessRules() {
  return [...getEnvAdminAccessRules(), ...getAdminAccessRules()];
}

function hasConfiguredAdminAccessRules() {
  return getAllAdminAccessRules().some((rule) => rule?.isActive);
}

function safeAdminAccessRule(rule) {
  return {
    ...rule,
    mobileToken: rule.mobileToken ? "••••••••" : "",
    source: rule.source || "panel",
  };
}

function matchesAdminAccessRule(rule, { user, ipAddress, mobileToken }) {
  if (!rule?.isActive) return false;
  const ruleEmail = normalizeEmail(rule.email || "");
  const userEmail = normalizeEmail(user?.email || "");
  const emailMatches = !ruleEmail || ruleEmail === userEmail;
  const ipMatches = Boolean(rule.ipAddress) && String(rule.ipAddress).trim() === ipAddress;
  const mobileMatches = Boolean(rule.mobileToken) && String(rule.mobileToken) === String(mobileToken || "");

  return emailMatches && (ipMatches || mobileMatches);
}

function hasAdminNetworkAccess(req, user) {
  const ipAddress = getClientIp(req);
  const mobileToken = String(req.get("x-admin-mobile-token") || "").trim();
  return getAllAdminAccessRules().some((rule) => matchesAdminAccessRule(rule, { user, ipAddress, mobileToken }));
}

function getUserFromRequest(req) {
  const header = req.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const session = sessions.get(token);
  if (session) {
    if (Number(session.expiresAt || 0) < Date.now()) {
      sessions.delete(token);
      return null;
    }
    return findUserById(session.userId);
  }

  const signedSession = parseSignedSessionToken(token);
  if (!signedSession) return null;
  return findUserById(signedSession.userId);
}

function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Oturum bulunamadı." });
    return;
  }
  req.user = user;
  next();
}

function requireVenueAccess(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "İşletme paneli için giriş yapmalısın." });
    return;
  }
  if (!user.canManageVenue) {
    res.status(403).json({ error: "Bu hesapta işletme paneli yetkisi yok." });
    return;
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Yönetici girişi gerekli." });
    return;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: "Yönetici yetkin yok." });
    return;
  }
  if (!isLocalDemoRequest(req) && hasConfiguredAdminAccessRules() && !hasAdminNetworkAccess(req, user)) {
    res.status(403).json({
      error: "Bu IP veya mobil cihaz admin erişim listesinde değil.",
      ipAddress: getClientIp(req),
    });
    return;
  }
  req.user = user;
  req.adminAccess = { local: isLocalDemoRequest(req), ipAddress: getClientIp(req) };
  next();
}

function createSession(user) {
  const token = createSignedSessionToken(user);
  sessions.set(token, { userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function mergeVenuePayload(venueId, user = null) {
  const payload = getVenueDashboardPayload(venueId);
  const overlay = getVenueOverlay(venueId);
  const isTemplateFallback = payload.id !== venueId;
  const email = normalizeEmail(user?.email || "");
  const isDemoVenueOwner = user?.isAdmin || email === "firma@tyee.app";
  const isRealVenueAccount = Boolean(user?.canManageVenue && !isDemoVenueOwner);
  const shouldStartEmpty = isTemplateFallback || isRealVenueAccount;

  if (shouldStartEmpty) {
    payload.id = venueId;
    payload.isFreshVenue = true;
    payload.venue = {
      ...(payload.venue || {}),
      name: user?.name || "Yeni İşletme",
      branch: "Konum bilgisi bekleniyor",
      sport: "Kategori seçimi bekleniyor",
      avatarLabel: getInitials(user?.name || "İşletme"),
    };
    payload.settings = {
      ...(payload.settings || {}),
      businessName: user?.name || "",
      contact: {
        ...((payload.settings || {}).contact || {}),
        authorizedName: user?.name || ((payload.settings || {}).contact || {}).authorizedName || "",
        phone: user?.phone || ((payload.settings || {}).contact || {}).phone || "",
        email: user?.email || ((payload.settings || {}).contact || {}).email || "",
      },
      locationStatus: "Girilmemiş",
    };
    payload.subscriptions = [];
    payload.transactions = [];
    payload.quickActions = [];
    payload.weekDays = (payload.weekDays || []).map((day) => ({ ...day, slots: [] }));
  } else {
    payload.isFreshVenue = false;
  }

  if (overlay.settings) {
    payload.settings = {
      ...(payload.settings || {}),
      ...overlay.settings,
      contact: {
        ...((payload.settings || {}).contact || {}),
        ...(overlay.settings.contact || {}),
      },
      details: {
        ...((payload.settings || {}).details || {}),
        ...(overlay.settings.details || {}),
      },
      location: {
        ...((payload.settings || {}).location || {}),
        ...(overlay.settings.location || {}),
      },
    };
  }
  if (overlay.profile) payload.profile = overlay.profile;
  if (overlay.billingAddresses) payload.billingAddresses = overlay.billingAddresses;
  if (overlay.media) payload.media = overlay.media;

  const venueReservations = getReservationsForVenue(venueId);
  if (venueReservations.length) {
    const reservationTransactions = venueReservations.map(formatReservationTransaction);
    payload.transactions = [...reservationTransactions, ...(payload.transactions || [])];
    payload.reportSummary = buildReservationSummary(venueReservations);
    payload.stats = [
      { label: "Bu hafta ciro", value: payload.reportSummary[0].value, delta: `${venueReservations.length} işlem` },
      { label: "Toplam rezervasyon", value: String(venueReservations.length), delta: "+ canlı" },
      { label: "Tyee komisyonu", value: payload.reportSummary[1].value, delta: "platform payı" },
      { label: "Online tahsilat", value: formatCurrency(venueReservations.reduce((total, reservation) => {
        const billing = reservation.billing || calculateReservationBilling(reservation);
        return total + billing.customerOnlinePayment;
      }, 0)), delta: "müşteriden alınan" },
    ];
  }

  const venueReviews = getReviewsForVenue(venueId);
  const existingReviews = (payload.reviews || []).map(formatVenueReview);
  const formattedRuntimeReviews = venueReviews.map(formatVenueReview);
  const reviewSummary = buildReviewSummary([...venueReviews, ...existingReviews], venueReservations);
  payload.reviewSummary = reviewSummary;
  payload.reviews = applyVenueReviewNotes([...formattedRuntimeReviews, ...existingReviews], overlay);

  payload.slotState = {
    slotModes: overlay.slotModes || {},
    manualEntries: overlay.manualEntries || {},
    slotServices: overlay.slotServices || {},
  };
  payload.clients = buildVenueClientsPayload({
    transactions: payload.transactions || [],
    reservations: venueReservations,
    reviews: payload.reviews || [],
    weekDays: payload.weekDays || [],
  });
  payload.calendarOps = buildVenueCalendarOpsPayload({
    payload,
    overlay,
    reservations: venueReservations,
  });
  payload.finance = buildVenueFinancePayload({
    payload,
    overlay,
    reservations: venueReservations,
  });

  return payload;
}

function resolveLoginEmail(value = "") {
  const normalized = normalizeEmail(value);
  if (normalized === "admin") return "admin@tyee.app";
  return normalized;
}

function formatCurrency(value) {
  return `₺${new Intl.NumberFormat("tr-TR").format(Number(value || 0))}`;
}

function formatCount(value) {
  return new Intl.NumberFormat("tr-TR").format(Number(value || 0));
}

function parseMoney(value = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePaymentMode(value = "") {
  const normalized = String(value || "").toLocaleLowerCase("tr-TR");
  if (Object.values(PAYMENT_MODES).includes(value)) return value;
  if (normalized.includes("tam")) return PAYMENT_MODES.FULL_ONLINE;
  if (normalized.includes("sadece") || normalized.includes("fast") || normalized.includes("rezervasyon")) {
    return PAYMENT_MODES.VENUE_PAYMENT;
  }
  return PAYMENT_MODES.COMMISSION_DEPOSIT;
}

function resolveVenuePaymentPolicy(venueId) {
  const overlay = venueId ? getVenueOverlay(venueId) : {};
  const payment = overlay.settings?.payment || {};
  const paymentMode = normalizePaymentMode(payment.paymentMethod || "");

  return {
    paymentMode,
  };
}

function getPaymentModeChannel(paymentMode) {
  if (paymentMode === PAYMENT_MODES.FULL_ONLINE) return "Ödemenin tamamını al";
  if (paymentMode === PAYMENT_MODES.VENUE_PAYMENT) return "Sadece randevu";
  return "Ön ödeme (kapora)";
}

function formatDateTr(value) {
  if (!value) return "-";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function formatDateTimeTr(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatReservationTransaction(reservation) {
  const billing = reservation.billing || calculateReservationBilling(reservation);
  const statusLabel = reservation.status === "completed"
    ? "Tamamlandı"
    : reservation.status === "cancelled"
      ? "Pasif"
      : "Aktif";
  return {
    reservationId: reservation.id,
    id: reservation.shortId || String(reservation.id || "").slice(0, 8),
    type: "Rezervasyon",
    status: statusLabel,
    venue: reservation.venueName || "İşletme",
    field: reservation.serviceLabel || reservation.categoryLabel || "Hizmet",
    channel: getPaymentModeChannel(reservation.paymentMode),
    customer: reservation.customerName || reservation.customerEmail || "Misafir",
    businessType: billing.paymentModeLabel,
    amount: formatCurrency(billing.totalAmount),
    deposit: formatCurrency(billing.customerOnlinePayment),
    commission: formatCurrency(billing.commissionAmount),
    payout: formatCurrency(billing.venuePayoutAmount),
    date: formatDateTr(reservation.serviceDate),
    time: reservation.serviceTime || "-",
    createdAt: formatDateTimeTr(reservation.createdAt),
    monthlyPackageActive: false,
    packageName: reservation.paymentMode === PAYMENT_MODES.VENUE_PAYMENT ? "Ay sonu FAST" : "-",
    withdrawalCount: 0,
    reviewStatus: reservation.reviewStatus || "pending",
  };
}

function parseDisplayDate(value = "") {
  const match = String(value || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatClientCreatedAt(value = "") {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function createClientKey({ name = "", email = "", phone = "" } = {}) {
  const safeEmail = normalizeEmail(email);
  if (safeEmail) return `email:${safeEmail}`;
  const safePhone = String(phone || "").replace(/\D/g, "");
  if (safePhone) return `phone:${safePhone}`;
  return `name:${normalizeTextKey(name || "misafir")}`;
}

function normalizeTextKey(value = "") {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ğüşöçıİ-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "misafir";
}

function getClientInitials(name = "") {
  return getInitials(name || "Müşteri").slice(0, 2);
}

function createEmptyClient(partial = {}) {
  const name = partial.name || "Misafir";
  return {
    key: createClientKey(partial),
    name,
    initials: getClientInitials(name),
    email: partial.email || "",
    phone: partial.phone || "",
    visitCount: 0,
    spendAmount: 0,
    reviewScores: [],
    firstSeenAt: partial.createdAt || "",
    lastVisitAt: "",
    lastService: "",
    channels: new Set(),
    paymentModes: new Set(),
    notes: [],
  };
}

function upsertVenueClient(clientsByKey, partial = {}) {
  const key = createClientKey(partial);
  const current = clientsByKey.get(key) || createEmptyClient({ ...partial, key });
  current.name = partial.name || current.name;
  current.initials = getClientInitials(current.name);
  current.email = partial.email || current.email;
  current.phone = partial.phone || current.phone;
  if (partial.createdAt && (!current.firstSeenAt || new Date(partial.createdAt) < new Date(current.firstSeenAt))) {
    current.firstSeenAt = partial.createdAt;
  }
  clientsByKey.set(key, current);
  return current;
}

function attachClientVisit(client, visit = {}) {
  client.visitCount += 1;
  client.spendAmount += parseMoney(visit.amount);
  if (visit.channel) client.channels.add(visit.channel);
  if (visit.paymentMode) client.paymentModes.add(visit.paymentMode);
  if (visit.note) client.notes.push(visit.note);
  if (visit.service) client.lastService = visit.service;

  const date = visit.dateObj || parseDisplayDate(visit.date);
  if (date && (!client.lastVisitAt || date > new Date(client.lastVisitAt))) {
    client.lastVisitAt = date.toISOString();
  }
}

function resolveClientSegment(client) {
  if (client.spendAmount >= 12000 || client.visitCount >= 6) return "VIP müşteri";
  if (client.visitCount >= 2) return "Sadık müşteri";
  if (client.visitCount === 1) return "Yeni müşteri";
  return "Takip edilecek";
}

function resolveClientNextAction(client) {
  const segment = resolveClientSegment(client);
  if (segment === "VIP müşteri") return "Ayrıcalıklı paket veya öncelikli slot öner";
  if (segment === "Sadık müşteri") return "Sadakat akışına dahil et";
  if (segment === "Yeni müşteri") return "İlk ziyaret sonrası follow-up gönder";
  return "Müşteri kartını tamamla";
}

function buildVenueClientsPayload({ transactions = [], reservations = [], reviews = [], weekDays = [] } = {}) {
  const clientsByKey = new Map();
  const phonesByName = new Map();

  weekDays.forEach((day) => {
    (day.slots || []).forEach((slot) => {
      if (slot.title && slot.phone) phonesByName.set(normalizeTextKey(slot.title), slot.phone);
    });
  });

  reservations.forEach((reservation) => {
    const billing = reservation.billing || calculateReservationBilling(reservation);
    const client = upsertVenueClient(clientsByKey, {
      name: reservation.customerName || reservation.customerEmail || "Misafir",
      email: reservation.customerEmail || "",
      phone: reservation.customerPhone || "",
      createdAt: reservation.createdAt || "",
    });
    attachClientVisit(client, {
      amount: billing.totalAmount,
      channel: getPaymentModeChannel(reservation.paymentMode),
      paymentMode: billing.paymentModeLabel,
      service: reservation.serviceLabel || reservation.categoryLabel || "Rezervasyon",
      dateObj: reservation.serviceDate ? new Date(`${reservation.serviceDate}T12:00:00`) : null,
      note: reservation.note || "",
    });
  });

  transactions
    .filter((transaction) => !transaction.reservationId)
    .forEach((transaction) => {
      const phone = phonesByName.get(normalizeTextKey(transaction.customer || ""));
      const client = upsertVenueClient(clientsByKey, {
        name: transaction.customer || "Misafir",
        phone,
        createdAt: transaction.createdAt ? parseDisplayDate(String(transaction.createdAt).slice(0, 10))?.toISOString() : "",
      });
      attachClientVisit(client, {
        amount: transaction.amount,
        channel: transaction.channel,
        paymentMode: transaction.businessType,
        service: transaction.field,
        date: transaction.date,
        note: transaction.packageName && transaction.packageName !== "-" ? transaction.packageName : "",
      });
    });

  reviews.forEach((review) => {
    const client = upsertVenueClient(clientsByKey, {
      name: review.author || review.customerName || "Müşteri",
    });
    if (Number(review.rating) > 0) client.reviewScores.push(Number(review.rating));
  });

  const items = [...clientsByKey.values()]
    .map((client) => {
      const averageReview = client.reviewScores.length
        ? (client.reviewScores.reduce((total, rating) => total + rating, 0) / client.reviewScores.length).toFixed(1)
        : "-";
      const segment = resolveClientSegment(client);
      const lastVisitLabel = client.lastVisitAt ? formatClientCreatedAt(client.lastVisitAt) : "-";
      const daysSinceLastVisit = client.lastVisitAt
        ? Math.max(0, Math.round((Date.now() - new Date(client.lastVisitAt).getTime()) / 86400000))
        : null;
      const noteBase = client.notes.find(Boolean) || `${client.lastService || "Rezervasyon"} için müşteri geçmişi oluşturuldu.`;

      return {
        id: client.key,
        name: client.name,
        initials: client.initials,
        email: client.email || "E-posta yok",
        phone: client.phone || "Telefon yok",
        segment,
        visits: `${client.visitCount} ziyaret`,
        visitCount: client.visitCount,
        spend: formatCurrency(client.spendAmount),
        spendAmount: client.spendAmount,
        reviews: averageReview,
        createdAt: formatClientCreatedAt(client.firstSeenAt || client.lastVisitAt),
        lastVisit: lastVisitLabel,
        daysSinceLastVisit,
        nextAction: resolveClientNextAction(client),
        note: noteBase,
      };
    })
    .sort((a, b) => b.spendAmount - a.spendAmount || b.visitCount - a.visitCount || a.name.localeCompare(b.name, "tr"));

  const countBy = (predicate) => items.filter(predicate).length;
  const segments = [
    { title: "Sadık müşteriler", count: String(countBy((item) => item.visitCount >= 2)), detail: "Son işlemlerden 2+ ziyaret yapanlar" },
    { title: "Riskli kayıp", count: String(countBy((item) => item.daysSinceLastVisit !== null && item.daysSinceLastVisit > 30)), detail: "30+ gündür geri dönmeyen müşteriler" },
    { title: "Yeni müşteriler", count: String(countBy((item) => item.daysSinceLastVisit !== null && item.daysSinceLastVisit <= 14)), detail: "İlk rezervasyon sonrası follow-up bekleyenler" },
    { title: "VIP müşteriler", count: String(countBy((item) => item.spendAmount >= 12000 || item.visitCount >= 6)), detail: "Yüksek harcama veya sık ziyaret yapanlar" },
  ];

  const loyalty = items.slice(0, 6).map((client) => {
    const tier = client.spendAmount >= 12000 || client.visitCount >= 6 ? "Black" : client.visitCount >= 2 ? "Gold" : "Starter";
    const target = tier === "Black" ? 12 : tier === "Gold" ? 10 : 4;
    return {
      name: client.name,
      tier,
      progress: `${Math.min(client.visitCount, target)} / ${target} ziyaret`,
      reward: tier === "Black" ? "Premium paket ve öncelikli slot" : tier === "Gold" ? "Bir sonraki rezervasyonda sadakat avantajı" : "İkinci ziyarette hoş geldin indirimi",
    };
  });

  return {
    items,
    segments,
    loyalty,
    summary: {
      total: items.length,
      repeat: countBy((item) => item.visitCount >= 2),
      vip: countBy((item) => item.spendAmount >= 12000 || item.visitCount >= 6),
    },
  };
}

function getVenueServiceOptions(payload = {}) {
  const areas = payload.settings?.areas;
  const activeAreas = Array.isArray(areas)
    ? areas
        .filter((area) => area && area.isActive !== false)
        .map((area) => ({
          id: normalizeTextKey(area.name || "ana-hizmet"),
          name: String(area.name || "Ana hizmet").trim(),
          type: String(area.type || "Hizmet").trim(),
          duration: String(area.capacity || "60 dk").trim(),
        }))
    : [];

  return activeAreas.length
    ? activeAreas
    : [{ id: "ana-hizmet", name: "Ana hizmet", type: "Hizmet", duration: "60 dk" }];
}

function normalizeCalendarPreferences(value = {}) {
  const visibleStatuses = Array.isArray(value.visibleStatuses) && value.visibleStatuses.length
    ? value.visibleStatuses.map((item) => String(item || "").trim()).filter(Boolean)
    : ["open", "online", "manual", "subscription", "closed"];

  return {
    viewMode: ["day", "week"].includes(value.viewMode) ? value.viewMode : "day",
    selectedTeam: String(value.selectedTeam || "all").trim() || "all",
    activeFilter: String(value.activeFilter || "all").trim() || "all",
    visibleStatuses,
  };
}

function createDefaultWaitlistItems(payload = {}) {
  if (payload.isFreshVenue) return [];
  const services = getVenueServiceOptions(payload);
  const firstService = services[0]?.name || "Ana hizmet";
  const secondService = services[1]?.name || firstService;

  return [
    {
      id: "demo-waitlist-evening",
      name: "Akşam slotu isteyen müşteri",
      service: firstService,
      preferredWindow: "Bugün 18:00 sonrası",
      status: "waiting",
      priority: "high",
      note: "İlk boşalan uygun slota alınabilir.",
      createdAt: "2026-06-23T09:30:00.000Z",
    },
    {
      id: "demo-waitlist-weekend",
      name: "Hafta sonu talebi",
      service: secondService,
      preferredWindow: "Bu hafta sonu",
      status: "matched",
      priority: "normal",
      note: "Uygun hizmet ve saat eşleşmesi bekliyor.",
      createdAt: "2026-06-22T13:10:00.000Z",
    },
  ];
}

function normalizeWaitlistItem(item = {}, index = 0, payload = {}) {
  const services = getVenueServiceOptions(payload);
  const serviceNames = new Set(services.map((service) => service.name));
  const status = ["waiting", "matched", "booked", "cancelled"].includes(item.status) ? item.status : "waiting";
  const priority = ["high", "normal", "low"].includes(item.priority) ? item.priority : "normal";

  return {
    id: String(item.id || crypto.randomUUID()),
    name: String(item.name || `Bekleyen müşteri ${index + 1}`).trim(),
    phone: String(item.phone || "").trim(),
    service: serviceNames.has(item.service) ? item.service : services[0]?.name || "Ana hizmet",
    preferredWindow: String(item.preferredWindow || "İlk uygun slot").trim(),
    status,
    priority,
    note: String(item.note || "").trim(),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
  };
}

function formatWaitlistStatus(status = "waiting") {
  if (status === "matched") return "Slot önerildi";
  if (status === "booked") return "Rezervasyona döndü";
  if (status === "cancelled") return "İptal";
  return "Bekliyor";
}

function buildVenueCalendarOpsPayload({ payload = {}, overlay = {}, reservations = [] } = {}) {
  const preferences = normalizeCalendarPreferences(overlay.calendarPreferences || {});
  const services = getVenueServiceOptions(payload);
  const rawWaitlist = Array.isArray(overlay.waitlist)
    ? overlay.waitlist
    : createDefaultWaitlistItems(payload);
  const waitlistItems = rawWaitlist.map((item, index) => {
    const normalized = normalizeWaitlistItem(item, index, payload);
    return {
      ...normalized,
      statusLabel: formatWaitlistStatus(normalized.status),
    };
  });
  const pendingCount = waitlistItems.filter((item) => item.status === "waiting").length;
  const matchedCount = waitlistItems.filter((item) => item.status === "matched").length;
  const bookedToday = reservations.filter((reservation) => {
    const created = reservation.createdAt ? new Date(reservation.createdAt) : null;
    return created && !Number.isNaN(created.getTime()) && Date.now() - created.getTime() < 86400000;
  }).length;

  return {
    preferences,
    controls: [
      { id: "today", label: "Bugün", action: "today" },
      { id: "team", label: "Planlı ekip", action: "team" },
      { id: "visibility", label: "Görünürlük", action: "visibility" },
      { id: "filters", label: "Filtreler", action: "filters" },
      { id: "settings", label: "Takvim ayarı", action: "settings" },
      { id: "waitlist", label: "Bekleme", action: "waitlist", count: pendingCount },
      { id: "reset", label: "Görünümü sıfırla", action: "reset" },
      { id: "add", label: "Yeni", action: "quick-add" },
    ],
    filters: [
      { id: "all", label: "Tümü" },
      { id: "open", label: "Müsait" },
      { id: "booked", label: "Dolu" },
      { id: "manual", label: "Manuel" },
      { id: "closed", label: "Kapalı" },
    ],
    team: [
      { id: "all", name: "Tüm ekip", role: "Takvim görünümü", selected: preferences.selectedTeam === "all" },
      ...services.map((service) => ({
        id: service.id,
        name: service.name,
        role: service.type,
        selected: preferences.selectedTeam === service.id,
      })),
    ],
    quickAdd: [
      { id: "appointment", label: "Rezervasyon", detail: "Müşteri, hizmet ve ödeme notu ile manuel kayıt" },
      { id: "blocked-time", label: "Bloklu zaman", detail: "Slotu satışa kapat" },
      { id: "waitlist", label: "Bekleme listesi", detail: "Talebi uygun slota bağla" },
    ],
    waitlist: {
      items: waitlistItems,
      summary: {
        waiting: pendingCount,
        matched: matchedCount,
        bookedToday,
      },
    },
  };
}

function formatCustomerReservation(reservation) {
  const billing = reservation.billing || calculateReservationBilling(reservation);
  const statusLabel = reservation.status === "completed"
    ? "Tamamlandı"
    : reservation.status === "cancelled"
      ? "İptal"
      : "Yaklaşan";
  return {
    id: reservation.id,
    venueName: reservation.venueName || "İşletme",
    serviceLabel: reservation.serviceLabel || reservation.categoryLabel || "Rezervasyon",
    serviceDate: reservation.serviceDate || "",
    serviceDateLabel: formatDateTr(reservation.serviceDate),
    serviceTime: reservation.serviceTime || "",
    status: reservation.status || "confirmed",
    statusLabel,
    totalAmount: billing.totalAmount,
    totalAmountLabel: formatCurrency(billing.totalAmount),
    onlineAmountLabel: formatCurrency(billing.customerOnlinePayment),
    venueAmountLabel: formatCurrency(billing.customerVenuePayment),
    paymentModeLabel: billing.paymentModeLabel,
    reviewStatus: reservation.reviewStatus || "pending",
  };
}

function buildReservationSummary(reservations = []) {
  const totals = reservations.reduce(
    (summary, reservation) => {
      const billing = reservation.billing || calculateReservationBilling(reservation);
      summary.volume += billing.totalAmount;
      summary.commission += billing.commissionAmount;
      summary.online += billing.customerOnlinePayment;
      return summary;
    },
    { volume: 0, commission: 0, online: 0 },
  );

  return [
    { label: "Toplam işlem hacmi", value: formatCurrency(totals.volume), meta: `${reservations.length} işlem` },
    { label: "Tyee komisyonu", value: formatCurrency(totals.commission), meta: "Platform payı" },
    { label: "Online tahsilat", value: formatCurrency(totals.online), meta: "Müşteriden alınan" },
  ];
}

function getMonthKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeExpenseMonth(value = "") {
  const month = String(value || "").trim();
  return /^\d{4}-\d{2}$/.test(month) ? month : getMonthKey();
}

function normalizeVenueExpense(item = {}) {
  const amount = Math.max(0, parseMoney(item.amount));
  return {
    id: String(item.id || crypto.randomUUID()),
    title: String(item.title || item.label || "Gider").trim(),
    category: String(item.category || "Genel").trim(),
    amount,
    amountLabel: formatCurrency(amount),
    month: normalizeExpenseMonth(item.month),
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

function getVenueExpenseItems(overlay = {}) {
  return Array.isArray(overlay.expenses) ? overlay.expenses.map(normalizeVenueExpense) : [];
}

function buildVenueFinancePayload({ payload = {}, overlay = {}, reservations = [] } = {}) {
  const month = getMonthKey();
  const expenses = getVenueExpenseItems(overlay);
  const monthlyExpenses = expenses.filter((expense) => expense.month === month);
  const reservationIncome = reservations.reduce((total, reservation) => {
    const billing = reservation.billing || calculateReservationBilling(reservation);
    return total + Number(billing.totalAmount || 0);
  }, 0);
  const transactionIncome = reservations.length
    ? reservationIncome
    : (payload.transactions || []).reduce((total, transaction) => total + parseMoney(transaction.amount), 0);
  const expenseTotal = monthlyExpenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
  const netTotal = transactionIncome - expenseTotal;
  const margin = transactionIncome > 0 ? Math.round((netTotal / transactionIncome) * 100) : 0;

  return {
    month,
    kpis: [
      { label: "Bu ay gelir", value: formatCurrency(transactionIncome), meta: `${reservations.length || (payload.transactions || []).length} işlem` },
      { label: "Bu ay gider", value: formatCurrency(expenseTotal), meta: `${monthlyExpenses.length} gider` },
      { label: "Net kalan", value: formatCurrency(netTotal), meta: "Gelir - gider" },
      { label: "Kar marjı", value: `%${margin}`, meta: "Bu ay" },
    ],
    rows: [
      { label: "Rezervasyon geliri", value: formatCurrency(transactionIncome), type: "income" },
      { label: "Aylık gider", value: formatCurrency(expenseTotal), type: "expense" },
      { label: "Net kalan", value: formatCurrency(netTotal), type: "net" },
    ],
    expenses: monthlyExpenses,
    allExpenses: expenses,
  };
}

function countVenueOpenSlots(payload = {}) {
  return Object.values(payload?.slotState?.slotModes || {}).filter((state) => state === "rezerv").length;
}

function countVenueManualSlots(payload = {}) {
  return Object.keys(payload?.slotState?.manualEntries || {}).length;
}

function buildVenueAssistantPayload(payload = {}) {
  const settings = payload.settings || {};
  const activeAreas = getActiveVenueAreas(settings);
  const pricedAreas = activeAreas.filter((area) => Number(area.numericPrice || 0) > 0);
  const openSlots = countVenueOpenSlots(payload);
  const manualSlots = countVenueManualSlots(payload);
  const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];
  const expenseCount = Array.isArray(payload.finance?.expenses) ? payload.finance.expenses.length : 0;
  const waitingReviews = Number(payload.reviewSummary?.waitingRequests || 0);
  const waitlistCount = Number(payload.calendarOps?.waitlist?.summary?.waiting || 0);
  const galleryCount = getVenueGallery(settings).length;
  const insights = [];

  if (!activeAreas.length || !pricedAreas.length) {
    insights.push({
      id: "services",
      icon: "₺",
      title: "Hizmet menüsünü tamamla",
      detail: pricedAreas.length ? `${activeAreas.length} aktif hizmet var.` : "Fiyatı girilmemiş hizmetler var.",
      message: "Satışa çıkmadan önce hizmet adı, süre, fiyat ve ödeme modelini netleştirelim.",
      actionLabel: "Hizmetlere git",
      view: "sales-products",
      focus: "#sales-products-layout",
    });
  }

  if (!openSlots) {
    insights.push({
      id: "calendar-open",
      icon: "SA",
      title: "Takvim satışa kapalı",
      detail: "Satışa açık slot yok.",
      message: "Takvimde müşterinin rezerve edebileceği saat açarsan marketplace görünürlüğü anlam kazanır.",
      actionLabel: "Takvimi aç",
      view: "calendar",
      focus: "#calendar-board-secondary",
    });
  } else if (!transactions.length) {
    insights.push({
      id: "campaign-empty-slots",
      icon: "SMS",
      title: "Boş saatlerin var",
      detail: `${openSlots} satışa açık slot bekliyor.`,
      message: "Boş saatler görünüyor. İstersen yakın müşterilere kısa bir reklam SMS akışı hazırlayalım.",
      actionLabel: "SMS kampanyası",
      view: "campaigns",
      focus: "#campaigns-board",
    });
  }

  if (waitlistCount > 0) {
    insights.push({
      id: "waitlist",
      icon: "BL",
      title: "Bekleyen talep var",
      detail: `${waitlistCount} müşteri uygun saat bekliyor.`,
      message: "Bekleme listesindeki müşterileri açık saatlerle eşleştirirsek hızlı rezervasyon kazanabiliriz.",
      actionLabel: "Beklemeyi aç",
      view: "calendar",
      focus: "#venue-waitlist",
    });
  }

  if (!expenseCount) {
    insights.push({
      id: "expenses",
      icon: "₺",
      title: "Bu ay gider girilmemiş",
      detail: "Kar zarar gerçek görünmeyebilir.",
      message: "Kira, personel ve sarf giderlerini girersek işletmenin net performansı temiz görünür.",
      actionLabel: "Gider ekle",
      view: "finance",
      focus: '[data-finance-expense-field="title"]',
    });
  }

  if (waitingReviews > 0) {
    insights.push({
      id: "reviews",
      icon: "Y",
      title: "Yorum takibi bekliyor",
      detail: `${waitingReviews} değerlendirme isteği açık.`,
      message: "Bekleyen yorumları takip edelim. Güçlü yorumlar marketplace sıralamasında kritik sinyal olur.",
      actionLabel: "Yorumları aç",
      view: "reviews",
      focus: "#reviews-shell",
    });
  }

  if (galleryCount < 3) {
    insights.push({
      id: "media",
      icon: "G",
      title: "Galeri güçlendirilmeli",
      detail: `${galleryCount}/6 görsel hazır.`,
      message: "Dış görünüş, iç mekan ve çalışan görselleri eklenirse rezervasyon sayfası daha güven verir.",
      actionLabel: "Görsel ekle",
      view: "settings",
      focus: ".settings-media-grid",
    });
  }

  if (manualSlots > 0) {
    insights.push({
      id: "manual",
      icon: "M",
      title: "Manuel kayıtlar aktif",
      detail: `${manualSlots} manuel rezervasyon var.`,
      message: "Manuel kayıtları checkout ile kapatırsan satış ve performans raporu temiz kalır.",
      actionLabel: "Checkout aç",
      view: "transactions",
      focus: "#transactions-body",
    });
  }

  if (!insights.length) {
    insights.push({
      id: "healthy",
      icon: "OK",
      title: "Operasyon sağlıklı",
      detail: "Temel kurulum tamam görünüyor.",
      message: "Panel iyi durumda. Şimdi tekrar müşteri kampanyası veya doluluk artırma akışı planlayabiliriz.",
      actionLabel: "Pazarlamaya git",
      view: "campaigns",
      focus: "#campaigns-board",
    });
  }

  return {
    assistant: {
      name: ASSISTANT_DISPLAY_NAME,
      role: "Operasyon koçu",
      provider: "tyee-rules",
    },
    summary: {
      title: "İşletmeni izliyorum",
      detail: `${insights.length} aksiyon önerisi hazır. Takvim, gider, yorum ve kampanya sinyallerini takip ediyorum.`,
    },
    insights: insights.slice(0, 6),
  };
}

function buildVenueAssistantAnswer(question = "", payload = {}) {
  const normalized = String(question || "").toLocaleLowerCase("tr-TR");
  const openSlots = countVenueOpenSlots(payload);
  const activeAreas = getActiveVenueAreas(payload.settings || {});
  const expenseCount = Array.isArray(payload.finance?.expenses) ? payload.finance.expenses.length : 0;
  const waitingReviews = Number(payload.reviewSummary?.waitingRequests || 0);
  const galleryCount = getVenueGallery(payload.settings || {}).length;
  const venueName = payload.venue?.name || payload.settings?.businessName || "işletmen";

  if (normalized.includes("boş") || normalized.includes("slot") || normalized.includes("takvim")) {
    return openSlots
      ? `${venueName} için ${openSlots} satışa açık slot görünüyor. Doluluk düşükse Pazarlama ekranından boş saat SMS akışı hazırlayabiliriz.`
      : `${venueName} için satışa açık slot görünmüyor. Takvim ekranında uygun saatleri Tyee olarak satışa açmalısın.`;
  }

  if (normalized.includes("sms") || normalized.includes("reklam") || normalized.includes("kampanya")) {
    if (normalized.includes("toplu") || normalized.includes("müşterilere") || normalized.includes("son mesaj")) {
      return "Toplu SMS için Pazarlama ekranında izinli müşteri segmenti, mesaj metni ve son onay adımı gerekir. Tyee mesajı taslak olarak hazırlar; işletme sahibi onaylamadan gönderim yapılmaz.";
    }
    return "Pazarlama ekranında geri çağırma, boş saat ve tekrar müşteri kampanyalarını yönetebiliriz. Açık slot varsa yakın müşterilere kısa SMS iyi çalışır.";
  }

  if (normalized.includes("gider") || normalized.includes("gelir") || normalized.includes("performans")) {
    return expenseCount
      ? `Bu ay ${expenseCount} gider kaydı var. Performans ekranı gelir, gider ve net kalan hesabını bu kayıtlarla çıkarıyor.`
      : "Bu ay gider kaydı yok. Performans ekranında Gider ekle ile kira, personel ve sarf giderlerini girmelisin.";
  }

  if (normalized.includes("hizmet") || normalized.includes("fiyat") || normalized.includes("kapora") || normalized.includes("ödeme")) {
    return `${activeAreas.length} aktif hizmet görünüyor. Her hizmet için süre, fiyat ve ödeme modelini Hizmet Menüsü veya İşletme Ayarları ekranından tamamlayabilirsin.`;
  }

  if (normalized.includes("yorum") || normalized.includes("değerlendirme") || normalized.includes("puan")) {
    return waitingReviews
      ? `${waitingReviews} değerlendirme isteği bekliyor. Değerlendirmeler ekranında yorumları ve işletme iç notlarını takip edebilirsin.`
      : "Bekleyen değerlendirme görünmüyor. Rezervasyon tamamlanınca yorum isteği akışı buraya düşer.";
  }

  if (normalized.includes("resim") || normalized.includes("foto") || normalized.includes("görsel")) {
    return `Şu anda ${galleryCount}/6 görsel hazır. İşletme Ayarları içinde dış görünüş, dükkan içi ve çalışan görsellerini ekleyebilirsin.`;
  }

  if (normalized.includes("mağaza") || normalized.includes("işletme") || normalized.includes("nerede tanıml")) {
    return "Mağaza bilgisi İşletme Ayarları ekranında tanımlanır. Tyee bu kayıtla birlikte hizmetleri, takvimi, fotoğrafları, yorumları ve performans verilerini okur.";
  }

  return "Takvim, hizmet menüsü, gider, yorum, müşteri ve kampanya tarafını okuyabiliyorum. Bana belirli bir ekranı sorabilir veya öneri kartlarından birini açabilirsin.";
}

function getVenueSmsRecipients(payload = {}, segment = "all") {
  const clients = Array.isArray(payload.clients?.items) ? payload.clients.items : [];
  const seen = new Set();
  return clients
    .filter((client) => {
      const phone = String(client.phone || "");
      if (!/\d{10,}/.test(phone.replace(/\D/g, ""))) return false;
      if (segment === "lost" && !(Number(client.daysSinceLastVisit) > 30)) return false;
      if (segment === "loyal" && !(Number(client.visitCount) >= 2)) return false;
      if (segment === "new" && !(Number(client.visitCount) <= 1)) return false;
      return true;
    })
    .map((client) => ({
      id: client.id,
      name: client.name || "Müşteri",
      phone: client.phone,
      segment: client.segment || "Müşteri",
      lastVisit: client.lastVisit || "-",
    }))
    .filter((client) => {
      const key = String(client.phone || "").replace(/\D/g, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50);
}

function buildVenueSmsDraft(payload = {}, options = {}) {
  const settings = payload.settings || {};
  const venueName = settings.businessName || payload.venue?.name || "Tyee işletmen";
  const segment = String(options.segment || "all");
  const openSlots = countVenueOpenSlots(payload);
  const recipients = getVenueSmsRecipients(payload, segment);
  const defaultMessage =
    openSlots > 0
      ? `Merhaba, ${venueName} için bu hafta sınırlı uygun saatler açıldı. Uygun zamanı seçip rezervasyonunu Tyee üzerinden kolayca oluşturabilirsin.`
      : `Merhaba, ${venueName} yeni randevu taleplerini Tyee üzerinden almaya başladı. Uygun hizmet ve saatleri görmek için profilimizi ziyaret edebilirsin.`;
  const message = String(options.message || defaultMessage).trim().slice(0, 320);
  const segmentLabels = {
    all: "Telefonu kayıtlı tüm müşteriler",
    lost: "30+ gündür gelmeyen müşteriler",
    loyal: "Sadık müşteriler",
    new: "Yeni müşteriler",
  };

  return {
    id: crypto.randomUUID(),
    channel: "sms",
    segment,
    segmentLabel: segmentLabels[segment] || segmentLabels.all,
    message,
    recipientCount: recipients.length,
    recipients: recipients.slice(0, 8),
    totalRecipients: recipients.length,
    requiresApproval: true,
    canSend: recipients.length > 0 && message.length >= 10,
    consentNote: "Gönderim, yalnızca işletmenin ticari ileti izni olduğunu kabul ettiği telefonlu müşteri kayıtlarına yapılmalıdır.",
  };
}

function purgeExpiredAdaLiveSessions() {
  const now = Date.now();
  for (const [id, session] of adaLiveSessions.entries()) {
    if (Number(session.expiresAt || 0) <= now) adaLiveSessions.delete(id);
  }
}

function createAdaLiveSession({ scope, assistantContext, greetingText, avatarName = ASSISTANT_DISPLAY_NAME }) {
  purgeExpiredAdaLiveSessions();
  const id = crypto.randomUUID();
  const session = {
    id,
    scope,
    avatarName,
    assistantContext,
    greetingText,
    createdAt: Date.now(),
    expiresAt: Date.now() + ADA_LIVE_SESSION_TTL_MS,
  };
  adaLiveSessions.set(id, session);
  return session;
}

function getAdaLiveSession(id = "") {
  purgeExpiredAdaLiveSessions();
  const session = adaLiveSessions.get(String(id || ""));
  if (!session) return null;
  session.expiresAt = Date.now() + ADA_LIVE_SESSION_TTL_MS;
  return session;
}

async function readProviderError(response) {
  try {
    return await response.text();
  } catch (_error) {
    return response.statusText || "";
  }
}

async function requestOpenAiSpeechPcm(text = "") {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: String(process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts").trim(),
      voice: String(process.env.OPENAI_TTS_VOICE_TYEE || process.env.OPENAI_TTS_VOICE || "nova").trim(),
      input: String(text || "").slice(0, 900),
      response_format: "pcm",
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI speech request failed: ${response.status} ${await readProviderError(response)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function requestSimliSessionToken(simliFaceId = "") {
  const apiKey = String(process.env.SIMLI_API_KEY || "").trim();
  const faceId = String(simliFaceId || process.env.SIMLI_FACE_ID_TYEE || DEFAULT_SIMLI_FACE_ID || "").trim();
  if (!apiKey) throw new Error("SIMLI_API_KEY missing");
  if (!faceId) throw new Error("SIMLI_FACE_ID missing");

  const baseUrl = String(process.env.SIMLI_BASE_URL || "https://api.simli.ai").trim().replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/compose/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-simli-api-key": apiKey,
    },
    body: JSON.stringify({
      faceId,
      handleSilence: true,
      maxSessionLength: Number(process.env.SIMLI_MAX_SESSION_SECONDS || 900),
      maxIdleTime: Number(process.env.SIMLI_MAX_IDLE_SECONDS || 180),
      model: process.env.SIMLI_MODEL || "fasttalk",
    }),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Simli session token request failed: ${response.status} ${text || response.statusText}`);
  }

  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch (_error) {
    throw new Error("Simli session token response is not JSON");
  }
  const token = parsed.session_token || parsed.sessionToken || parsed.token;
  if (!String(token || "").trim()) throw new Error("Simli session token response did not include a token");
  return String(token).trim();
}

function buildAdaLiveStagePage({ sessionToken, adaSessionId, avatarName = ASSISTANT_DISPLAY_NAME, greetingText = "" }) {
  const safeAvatarName = String(avatarName || ASSISTANT_DISPLAY_NAME).replace(/\s+/g, " ").trim().slice(0, 24) || ASSISTANT_DISPLAY_NAME;
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>tyee ${safeAvatarName}</title>
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: transparent;
        color: #fff;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .avatar-shell {
        position: fixed;
        top: 0;
        left: 50%;
        width: min(280px, 100vw);
        height: calc(100% - 58px);
        transform: translateX(-50%);
        filter: drop-shadow(0 26px 38px rgba(3, 15, 38, 0.24));
        pointer-events: none;
      }
      video, audio {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
        background: transparent;
        clip-path: ellipse(47% 50% at 50% 50%);
      }
      audio {
        opacity: 0;
        pointer-events: none;
        clip-path: none;
      }
      .status {
        position: fixed;
        left: 14px;
        right: 14px;
        bottom: 64px;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 999px;
        padding: 11px 13px;
        background: rgba(3,15,38,.62);
        color: rgba(255,255,255,.82);
        text-align: center;
        font-size: 12px;
        backdrop-filter: blur(18px);
        transition: opacity .2s ease, transform .2s ease;
      }
      .status.ready {
        opacity: 0;
        transform: translateY(8px);
        pointer-events: none;
      }
      .mic {
        position: fixed;
        left: 50%;
        bottom: 8px;
        width: auto;
        min-width: 178px;
        height: 44px;
        padding: 0 18px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 999px;
        background: rgba(255,255,255,.92);
        box-shadow: 0 16px 42px rgba(3, 15, 38, 0.24);
        color: #061a42;
        font-weight: 800;
        font-size: 13px;
        transform: translateX(-50%);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        backdrop-filter: blur(18px);
      }
      .mic::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9aa7b8;
      }
      .mic.listening {
        background: #2f7ee6;
        color: #fff;
      }
      .mic.listening::before {
        background: #34d399;
        box-shadow: 0 0 0 6px rgba(52, 211, 153, 0.18);
      }
      .fallback {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        text-align: center;
        background: transparent;
      }
      .fallback strong { display: block; margin-bottom: 8px; font-size: 20px; }
      .fallback span { color: rgba(255,255,255,.72); font-size: 13px; line-height: 1.45; }
    </style>
  </head>
  <body>
    <div class="avatar-shell">
      <video id="simli-video" autoplay playsinline></video>
      <audio id="simli-audio" autoplay></audio>
    </div>
    <div id="fallback" class="fallback">
      <div><strong>${safeAvatarName} bağlanıyor</strong><span>Canlı yüz ve ses sahnesi hazırlanıyor.</span></div>
    </div>
    <button id="mic" class="mic" type="button" aria-label="Konuş">Konuşmak için bas</button>
    <div id="status" class="status">${safeAvatarName} bağlanıyor...</div>
    <script type="module">
      import { SimliClient, LogLevel } from "https://esm.sh/simli-client@3.0.1?bundle";
      const sessionToken = ${JSON.stringify(sessionToken)};
      const adaSessionId = ${JSON.stringify(adaSessionId)};
      const avatarName = ${JSON.stringify(safeAvatarName)};
      const greetingText = ${JSON.stringify(greetingText || `Merhaba, ben ${safeAvatarName}. Buradayım.`)};
      const openAiTtsSampleRate = ${OPENAI_TTS_SAMPLE_RATE};
      const simliAudioSampleRate = ${SIMLI_AUDIO_SAMPLE_RATE};
      const simliAudioChunkBytes = ${SIMLI_AUDIO_CHUNK_BYTES};
      const videoEl = document.getElementById("simli-video");
      const audioEl = document.getElementById("simli-audio");
      const statusEl = document.getElementById("status");
      const fallbackEl = document.getElementById("fallback");
      const micEl = document.getElementById("mic");
      let simliClient = null;
      let recognition = null;
      let speaking = false;
      let listening = false;
      let voiceLoopActive = false;
      let recognitionSupported = false;
      let recognitionRestartTimer = null;
      let simliStarted = false;

      function setStatus(message, ready = false) {
        statusEl.textContent = message;
        statusEl.classList.toggle("ready", ready);
      }

      function setMicLabel(text, active = false) {
        micEl.textContent = text;
        micEl.classList.toggle("listening", active);
      }

      function sleep(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
      }

      function waitUntilSimliStarted() {
        if (simliStarted) return Promise.resolve();
        return new Promise((resolve) => {
          const startedAt = Date.now();
          const timer = window.setInterval(() => {
            if (simliStarted || Date.now() - startedAt > 5000) {
              window.clearInterval(timer);
              resolve();
            }
          }, 80);
        });
      }

      function toInt16Samples(audioBuffer) {
        const evenLength = audioBuffer.byteLength - (audioBuffer.byteLength % 2);
        return new Int16Array(audioBuffer.slice(0, evenLength));
      }

      function downsamplePcm16(input, inputRate, outputRate) {
        if (inputRate === outputRate) return input;
        const ratio = inputRate / outputRate;
        const outputLength = Math.floor(input.length / ratio);
        const output = new Int16Array(outputLength);
        for (let i = 0; i < outputLength; i += 1) {
          const sourceIndex = i * ratio;
          const lower = Math.floor(sourceIndex);
          const upper = Math.min(input.length - 1, lower + 1);
          const weight = sourceIndex - lower;
          output[i] = Math.round(input[lower] * (1 - weight) + input[upper] * weight);
        }
        return output;
      }

      function appendTailSilence(input, sampleRate) {
        const tailSamples = Math.round(sampleRate * 0.16);
        const output = new Int16Array(input.length + tailSamples);
        output.set(input, 0);
        return output;
      }

      async function streamPcmToSimli(pcm16, sampleRate) {
        if (!simliClient?.sendAudioData) throw new Error("simli audio stream unavailable");
        const prepared = appendTailSilence(pcm16, sampleRate);
        const audioBytes = new Uint8Array(prepared.buffer, prepared.byteOffset, prepared.byteLength);
        const evenChunkBytes = Math.max(2, simliAudioChunkBytes - (simliAudioChunkBytes % 2));
        const playbackDone = waitForSimliPlayback(prepared.length, sampleRate);
        simliClient?.ClearBuffer?.();
        await sleep(80);
        for (let offset = 0; offset < audioBytes.length; offset += evenChunkBytes) {
          const chunk = audioBytes.subarray(offset, Math.min(offset + evenChunkBytes, audioBytes.length));
          if (offset === 0 && simliClient?.sendAudioDataImmediate) {
            simliClient.sendAudioDataImmediate(chunk);
          } else {
            simliClient.sendAudioData(chunk);
          }
        }
        await playbackDone;
      }

      function waitForSimliPlayback(sampleCount, sampleRate) {
        const estimatedMs = Math.max(900, Math.round((sampleCount / sampleRate) * 1000) + 1400);
        return new Promise((resolve) => {
          let settled = false;
          let sawSpeaking = false;
          const cleanup = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            simliClient?.off?.("speaking", onSpeaking);
            simliClient?.off?.("silent", onSilent);
            resolve();
          };
          const onSpeaking = () => {
            sawSpeaking = true;
            setStatus(avatarName + " konuşuyor...");
          };
          const onSilent = () => {
            if (sawSpeaking) window.setTimeout(cleanup, 120);
          };
          const timer = window.setTimeout(cleanup, estimatedMs);
          simliClient?.on?.("speaking", onSpeaking);
          simliClient?.on?.("silent", onSilent);
        });
      }

      async function speakWithDeviceVoice(text) {
        if (!("speechSynthesis" in window)) return;
        await new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(String(text || ""));
          utterance.lang = "tr-TR";
          utterance.rate = 0.96;
          utterance.pitch = 1.02;
          utterance.onend = resolve;
          utterance.onerror = resolve;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        });
      }

      async function speakAda(text) {
        const normalizedText = String(text || "").trim();
        if (!normalizedText) return;
        speaking = true;
        setStatus(avatarName + " konuşuyor...");
        try {
          await waitUntilSimliStarted();
          if (!simliStarted) throw new Error("simli did not start");
          const response = await fetch("/api/ada/live/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adaSessionId, text: normalizedText }),
          });
          if (!response.ok) throw new Error("speech failed");
          const audioBuffer = await response.arrayBuffer();
          const headerSampleRate = Number(response.headers.get("X-Audio-Sample-Rate"));
          const sourceRate = Number.isFinite(headerSampleRate) && headerSampleRate > 0 ? headerSampleRate : openAiTtsSampleRate;
          const sourcePcm = toInt16Samples(audioBuffer);
          const simliPcm = downsamplePcm16(sourcePcm, sourceRate, simliAudioSampleRate);
          await streamPcmToSimli(simliPcm, simliAudioSampleRate);
        } catch (error) {
          console.error("[ada-live-speech]", error);
          setStatus(avatarName + " sesi üretilemedi; dudak senkronu için tekrar dene.");
          await sleep(900);
        } finally {
          speaking = false;
          if (voiceLoopActive) {
            setStatus("Cevap bitti. Seni tekrar dinliyorum...");
            window.setTimeout(startListening, 420);
          } else {
            setStatus("Konuşmak için aşağıdaki butona bas.", true);
            setMicLabel("Konuşmak için bas");
          }
        }
      }

      async function askAda(message) {
        const cleanMessage = String(message || "").trim();
        if (!cleanMessage || speaking) return;
        setStatus(avatarName + " düşünüyor...");
        try {
          const response = await fetch("/api/ada/live/reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adaSessionId, message: cleanMessage }),
          });
          if (!response.ok) throw new Error("reply failed");
          const payload = await response.json();
          await speakAda(payload.replyText || "Buradayım, dinliyorum.");
        } catch (error) {
          await speakAda("Bağlantı zorlandı. Bir kez daha söyler misin?");
        }
      }

      function setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setStatus("Bu tarayıcıda sesli dinleme desteklenmiyor.");
          setMicLabel("Ses desteklenmiyor");
          micEl.disabled = true;
          return;
        }
        recognitionSupported = true;
        recognition = new SpeechRecognition();
        recognition.lang = "tr-TR";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => {
          window.clearTimeout(recognitionRestartTimer);
          listening = true;
          setMicLabel("Dinliyorum...");
          setStatus("Seni dinliyorum...");
        };
        recognition.onend = () => {
          listening = false;
          setMicLabel(voiceLoopActive ? "Dinlemeyi durdur" : "Konuşmak için bas", false);
          if (voiceLoopActive && !speaking) {
            recognitionRestartTimer = window.setTimeout(startListening, 420);
            return;
          }
          if (!speaking) setStatus("Konuşmak için aşağıdaki butona bas.", true);
        };
        recognition.onerror = (event) => {
          listening = false;
          const errorName = event?.error || "";
          if (errorName === "not-allowed" || errorName === "service-not-allowed") {
            voiceLoopActive = false;
            setMicLabel("Mikrofon izni gerekli");
            setStatus("Mikrofon izni kapalı. Chrome adres çubuğundaki izinlerden mikrofonu aç.");
            return;
          }
          setMicLabel(voiceLoopActive ? "Dinlemeyi durdur" : "Konuşmak için bas", false);
          if (errorName === "no-speech" && voiceLoopActive && !speaking) {
            setStatus("Ses alamadım. Tekrar dinliyorum...");
            recognitionRestartTimer = window.setTimeout(startListening, 650);
            return;
          }
          if (!speaking) setStatus("Tekrar basıp konuşabilirsin.");
        };
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results || [])
            .map((result) => result[0]?.transcript || "")
            .join(" ")
            .trim();
          if (transcript) {
            setStatus("Duydum: " + transcript);
            askAda(transcript);
          }
        };
      }

      async function ensureMicrophonePermission() {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }

      function startListening() {
        if (!recognition || speaking || listening || !voiceLoopActive) return;
        try {
          recognition.start();
        } catch (_error) {
          setStatus("Mikrofon hazırlanıyor. Bir saniye sonra tekrar dene.");
        }
      }

      async function toggleListening() {
        if (!recognitionSupported || !recognition || speaking) return;
        if (voiceLoopActive || listening) {
          voiceLoopActive = false;
          window.clearTimeout(recognitionRestartTimer);
          if (listening) recognition.stop();
          setMicLabel("Konuşmak için bas");
          setStatus("Dinleme durdu. Devam etmek için tekrar bas.");
          return;
        }
        try {
          await ensureMicrophonePermission();
          voiceLoopActive = true;
          setMicLabel("Dinliyorum...", true);
          startListening();
        } catch (_error) {
          voiceLoopActive = false;
          setMicLabel("Mikrofon izni gerekli");
          setStatus("Mikrofon izni verilmedi. Chrome izinlerinden mikrofonu açmalısın.");
        }
      }

      async function start() {
        try {
          simliClient = new SimliClient(sessionToken, videoEl, audioEl, null, LogLevel.INFO, "livekit", "websockets", "wss://api.simli.ai", simliAudioChunkBytes);
          simliClient.on("start", () => {
            simliStarted = true;
            fallbackEl.style.display = "none";
            setStatus(avatarName + " hazır.", true);
          });
          simliClient.on("error", () => setStatus(avatarName + " bağlantısı hata verdi."));
          simliClient.on("speaking", () => setStatus(avatarName + " konuşuyor..."));
          simliClient.on("silent", () => {
            if (!speaking && voiceLoopActive) {
              setStatus("Cevap bitti. Seni tekrar dinliyorum...");
            } else if (!speaking) {
              setStatus("Konuşmak için aşağıdaki butona bas.", true);
            }
          });
          await simliClient.start();
          fallbackEl.style.display = "none";
          setupSpeechRecognition();
          await speakAda(greetingText);
        } catch (error) {
          console.error("[ada-live]", error);
          setStatus(avatarName + " bağlantısı başlatılamadı.");
        }
      }

      micEl.addEventListener("click", toggleListening);
      window.addEventListener("pagehide", () => simliClient?.stop?.());
      start();
    </script>
  </body>
</html>`;
}

async function buildDirectSimliSessionResponse({ scope, assistantContext, sourcePayload = null, greetingText, avatarName = ASSISTANT_DISPLAY_NAME, simliFaceId = "" }) {
  const sessionToken = await requestSimliSessionToken(simliFaceId);
  const liveSession = createAdaLiveSession({ scope, assistantContext: sourcePayload || assistantContext, greetingText, avatarName });
  const stageUrl = `/ada-live.html?${new URLSearchParams({
    sessionToken,
    adaSessionId: liveSession.id,
    avatarName,
  }).toString()}`;
  return {
    provider: "simli",
    status: "ready",
    mode: "direct-simli",
    assistantName: avatarName,
    sessionToken,
    stageUrl,
    sessionUrl: stageUrl,
    contextEndpoint: scope === "venue" ? "/api/venue/assistant" : "/api/customer/assistant",
    chatEndpoint: scope === "venue" ? "/api/venue/assistant/chat" : "/api/customer/assistant/chat",
    assistantContext,
    message: `${avatarName} canlı avatar oturumu hazır.`,
  };
}

function getCustomerAssistantListings({ category = "all", city = "istanbul", query = "" } = {}) {
  if (HIDE_PUBLIC_VENUES) return [];
  return mergeListingItems(
    getRuntimeVenueListingsForSearch({ category, city, query }),
    filterListings({ category, city, query }),
  ).slice(0, 12);
}

function buildCustomerAssistantPayload({ user = null, category = "all", city = "istanbul", query = "" } = {}) {
  const listings = getCustomerAssistantListings({ category, city, query });
  const reservations = user
    ? getReservations()
        .filter(
          (reservation) =>
            reservation.customerId === user.id ||
            normalizeEmail(reservation.customerEmail) === normalizeEmail(user.email),
        )
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    : [];
  const upcoming = reservations.filter((reservation) => reservation.status !== "completed" && reservation.status !== "cancelled");
  const bestListing = listings
    .slice()
    .sort(
      (a, b) =>
        Number(b.rating || 0) - Number(a.rating || 0) ||
        Number(b.reviews || 0) - Number(a.reviews || 0),
    )[0];

  const insights = [
    bestListing
      ? {
          id: "best-match",
          title: "En uygun işletmeyi aç",
          detail: `${bestListing.name} · ${bestListing.categoryLabel}`,
          listingId: bestListing.id,
        }
      : {
          id: "search",
          title: "Aramayı genişlet",
          detail: "Kategori veya konum seçerek başlayabilirsin.",
        },
    {
      id: "nearby",
      title: "Yakınımdaki işletmeler",
      detail: `${listings.length} seçenek bulundu`,
    },
    user
      ? {
          id: "reservations",
          title: "Rezervasyonlarım",
          detail: `${upcoming.length} yaklaşan rezervasyon`,
        }
      : {
          id: "login",
          title: "Giriş yap",
          detail: "Rezervasyonlarını takip et",
        },
  ];

  return {
    assistant: {
      name: ASSISTANT_DISPLAY_NAME,
      role: "Rezervasyon asistanı",
      provider: "tyee-rules",
    },
    user: user ? normalizeUser(user) : null,
    summary: {
      title: user ? "Hesabını ve seçenekleri okuyorum" : "Yakınındaki seçenekleri okuyorum",
      detail: `${listings.length} işletme ve ${upcoming.length} yaklaşan rezervasyon bağlamı hazır.`,
    },
    listings: listings.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      categoryLabel: item.categoryLabel,
      cityLabel: item.cityLabel,
      rating: item.rating,
      reviews: item.reviews,
      priceLabel: item.priceLabel,
      nextSlot: item.availability?.nextSlot || item.eveningTime || "",
    })),
    reservations: {
      upcoming: upcoming.map(formatCustomerReservation),
      total: reservations.length,
    },
    insights,
  };
}

function buildCustomerAssistantAnswer(question = "", context = {}) {
  const normalized = normalizeSearchText(question);
  const listings = context.listings || [];
  const bestListing = listings[0];

  if (normalized.includes("rezervasyon") || normalized.includes("randevu")) {
    return context.user
      ? `Hesabında ${context.reservations?.upcoming?.length || 0} yaklaşan rezervasyon görünüyor. Rezervasyonlarım alanından takip edebilirsin.`
      : "Rezervasyonlarını görmek için bireysel hesabına giriş yapmalısın.";
  }

  if (normalized.includes("yakın") || normalized.includes("harita") || normalized.includes("konum")) {
    return `${listings.length} yakın seçenek hazırlanmış görünüyor. Harita alanından mesafeye göre karşılaştırabilirsin.`;
  }

  if (normalized.includes("favori") || normalized.includes("kaydedilen")) {
    return context.user
      ? "Favorilerim alanında kalp ile kaydettiğin işletmeleri takip edebilirsin."
      : "Favorilerini saklamak için bireysel hesabına giriş yapmalısın.";
  }

  if (bestListing) {
    return `${bestListing.name} iyi bir başlangıç olabilir. Kategori, puan, mesafe ve uygun saate göre daha da daraltabilirim.`;
  }

  return "Kategori, konum veya işletme adı yazarsan sana en uygun seçenekleri listeleyebilirim.";
}

function getReservationsForVenue(venueId) {
  return getReservations().filter((reservation) => reservation.venueId === venueId);
}

function getReviewsForVenue(venueId) {
  return getReviews().filter((review) => review.venueId === venueId);
}

function formatVenueReview(review) {
  return {
    id: review.id,
    author: review.customerName || review.author || "Müşteri",
    rating: Number(review.rating || 0),
    comment: review.comment || "Yorum bırakılmadı.",
    date: review.createdAt ? formatDateTimeTr(review.createdAt) : review.date || "",
    service: review.serviceLabel || review.categoryLabel || review.service || "Rezervasyon",
    reservationId: review.reservationId || "",
    status: review.status || "Yayınlandı",
    businessNote: review.businessNote || "",
  };
}

function applyVenueReviewNotes(reviews = [], overlay = {}) {
  const notes = overlay.reviewNotes && typeof overlay.reviewNotes === "object" ? overlay.reviewNotes : {};
  return reviews.map((review) => ({
    ...review,
    businessNote: notes[review.id]?.note || review.businessNote || "",
  }));
}

function buildReviewSummary(reviews = [], reservations = []) {
  const ratedReviews = reviews.filter((review) => Number(review.rating) > 0);
  const average = ratedReviews.length
    ? ratedReviews.reduce((total, review) => total + Number(review.rating || 0), 0) / ratedReviews.length
    : 0;
  const waitingRequests = reservations.filter(
    (reservation) => reservation.status === "completed" && reservation.reviewStatus !== "received",
  ).length;

  return {
    average: average ? average.toFixed(1) : "-",
    total: ratedReviews.length,
    waitingRequests,
  };
}

function countOpenMarketplaceSlots(weekDays = []) {
  return weekDays.reduce((total, day) => total + (day.slots || []).filter((slot) => slot.status === "open").length, 0);
}

function createVenueReport({ venueId, user = null, period = "Bu ay" } = {}) {
  const payload = mergeVenuePayload(venueId, user);
  const reservations = getReservationsForVenue(venueId);
  const reviews = getReviewsForVenue(venueId);
  const summary = buildReservationSummary(reservations);
  const reviewSummary = payload.reviewSummary || buildReviewSummary(reviews, reservations);
  const totalSlots = (payload.weekDays || []).reduce((total, day) => total + (day.slots || []).length, 0);
  const openSlots = countOpenMarketplaceSlots(payload.weekDays || []);
  const completedReservations = reservations.filter((reservation) => reservation.status === "completed").length;
  const onlineReservations = reservations.filter((reservation) => reservation.paymentMode !== PAYMENT_MODES.VENUE_PAYMENT).length;
  const onlineShare = reservations.length ? Math.round((onlineReservations / reservations.length) * 100) : 0;
  const capacityRate = totalSlots ? Math.round((openSlots / totalSlots) * 100) : 0;
  const venueName = payload.venue?.name || payload.settings?.businessName || "Kurum";
  const venueBranch = payload.venue?.branch || payload.settings?.locationStatus || "Konum bilgisi bekleniyor";
  const category = payload.venue?.sport || payload.settings?.selects?.find((item) => item.label === "İşletme Tipi")?.value || "Kategori";

  return {
    title: `${venueName} Yönetici Raporu`,
    period,
    generatedAt: new Date().toISOString(),
    scope: `${venueBranch} · ${category}`,
    executiveSummary: [
      reservations.length
        ? `${reservations.length} rezervasyon kaydı üzerinden işlem hacmi, ödeme modeli ve operasyon kapanışı birlikte izleniyor.`
        : "Henüz canlı rezervasyon kaydı yok; rapor şimdilik kurum profil kalitesi ve yayına hazırlık durumunu özetler.",
      completedReservations
        ? `${completedReservations} rezervasyon işletme tarafından tamamlandı; tamamlanan işlemler müşteri değerlendirme akışını tetikler.`
        : "Rezervasyonlar hizmet sonrası işletme tarafından tamamlandığında değerlendirme isteği otomatik hazırlanır.",
      `Müşteri deneyimi tarafında ortalama puan ${reviewSummary.average}; bekleyen anket sayısı ${reviewSummary.waitingRequests}.`,
      "Rapor kurumun kendi operasyonunu görmesi içindir; Tyee iç muhasebe kırılımları ve tesise ödenecek hesaplar bu ekranda gösterilmez.",
    ],
    financial: [
      summary[0] || { label: "Toplam işlem hacmi", value: formatCurrency(0), meta: "0 işlem" },
      summary[1] || { label: "Tyee komisyonu", value: formatCurrency(0), meta: "Platform payı" },
      summary[2] || { label: "Online tahsilat", value: formatCurrency(0), meta: "Müşteriden alınan" },
      { label: "Online kanal payı", value: `%${onlineShare}`, meta: `${onlineReservations} online işlem` },
    ].map((item) => ({ label: item.label, value: item.value, note: item.meta })),
    operational: [
      { label: "Rezervasyon", value: String(reservations.length), note: `${completedReservations} tamamlanan işlem` },
      { label: "tyee satışına açık slot", value: String(openSlots), note: `${totalSlots} toplam slot içinde` },
      { label: "Kapasite görünürlüğü", value: `%${capacityRate}`, note: "Marketplace'e açılmış slot oranı" },
      { label: "Aktif abonelik", value: String((payload.subscriptions || []).length), note: "Panelde takip edilen abonelik" },
    ],
    customerExperience: [
      { label: "Ortalama puan", value: String(reviewSummary.average), note: `${reviewSummary.total || 0} yorum` },
      { label: "Bekleyen anket", value: String(reviewSummary.waitingRequests || 0), note: "Tamamlanan rezervasyon sonrası" },
      { label: "Yorum sayısı", value: String((payload.reviews || []).length), note: "Kurum değerlendirme havuzu" },
      { label: "Kapanan işlem", value: String(completedReservations), note: "Hizmet tamamlandı" },
    ],
    rows: (payload.transactions || []).slice(0, 8).map((transaction) => ({
      service: transaction.field || "-",
      customer: transaction.customer || "-",
      date: `${transaction.date || "-"} ${transaction.time || ""}`.trim(),
      amount: transaction.amount || "-",
      status: transaction.status || "-",
    })),
    recommendations: [
      openSlots ? "Açık slotları kategori ve saat bazında izleyip dolmayan prime-time saatlere kampanya bağla." : "Marketplace'e açılacak slotları tanımlayarak raporda kapasite görünürlüğünü başlat.",
      reservations.length ? "Tamamlanan işlemleri düzenli kapat; değerlendirme isteği ancak bu adımdan sonra anlamlı çalışır." : "İlk rezervasyonlardan sonra ödeme modeli ve kategori kırılımını raporda takip et.",
      reviewSummary.waitingRequests ? "Bekleyen anketleri takip edip müşteri deneyimi puanını düzenli olarak ölç." : "Yorum sayısını artırmak için tamamlanan her rezervasyon sonrası kısa anket akışını kullan.",
      "İşletme bilgileri, medya ve konum alanlarını güncel tutarak arama ve rezervasyon dönüşümünü güçlendir.",
    ],
  };
}

function formatAdminUser(user) {
  const role = user.isAdmin ? "admin" : user.canManageVenue ? "venue" : "customer";

  return {
    id: user.id,
    name: user.name || user.email,
    email: normalizeEmail(user.email),
    phone: user.phone || "",
    role,
    type: role === "admin" ? "Admin" : role === "venue" ? "İşletme yetkilisi" : "Bireysel müşteri",
    canManageVenue: Boolean(user.canManageVenue),
    isAdmin: Boolean(user.isAdmin),
    venueId: user.venueId || "",
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    createdAt: user.createdAt || "",
    updatedAt: user.updatedAt || "",
  };
}

function getAdminBusinessDirectory() {
  const deletedVenueIds = new Set(getDeletedVenueIds());
  const staticVenues = getAdminDashboardPayload().venues || [];
  const staticVenueById = new Map(staticVenues.map((venue) => [venue.id, venue]));
  const venueIds = new Set(staticVenues.map((venue) => venue.id));
  const users = getUsers();
  const overlays = getVenues();

  users
    .filter((user) => user.canManageVenue)
    .forEach((user) => {
      const venueId = getUserVenueId(user);
      if (venueId) venueIds.add(venueId);
    });

  Object.keys(overlays || {}).forEach((venueId) => venueIds.add(venueId));

  return [...venueIds]
    .filter((venueId) => venueId && !deletedVenueIds.has(venueId))
    .map((venueId) => formatAdminBusiness(venueId, staticVenueById.get(venueId)))
    .sort((a, b) => {
      if (b.reservationCount !== a.reservationCount) return b.reservationCount - a.reservationCount;
      if (b.readinessScore !== a.readinessScore) return b.readinessScore - a.readinessScore;
      return a.name.localeCompare(b.name, "tr");
    });
}

function getAdminVenueOwner(venueId) {
  const users = getUsers().filter((user) => user.canManageVenue && getUserVenueId(user) === venueId);
  return users.find((user) => !user.isAdmin) || users[0] || null;
}

function getBusinessCategory(settings = {}, payload = {}, fallback = "") {
  const selectedType = (settings.selects || []).find((item) => item.label === "İşletme Tipi")?.value;
  const rawCategory = settings.details?.category || selectedType || payload.venue?.sport || fallback || "Kategori seçilmedi";
  return normalizeVenueCategory(rawCategory).label || rawCategory;
}

function getBusinessBranch(settings = {}, payload = {}, fallback = "") {
  const details = settings.details || {};
  const location = settings.location || {};
  return details.district || location.address || payload.venue?.branch || fallback || "Konum bilgisi bekleniyor";
}

function countSlotState(overlay = {}, expectedState = "") {
  return Object.values(overlay.slotModes || {}).filter((state) => state === expectedState).length;
}

function getAdminBusinessReadiness({ settings = {}, overlay = {}, owner = null, payload = {} } = {}) {
  const contact = settings.contact || {};
  const details = settings.details || {};
  const location = settings.location || {};
  const payment = settings.payment || {};
  const contracts = settings.contracts || {};
  const activeAreas = getActiveVenueAreas(settings);
  const galleryCount = getVenueGallery(settings).length;
  const openSlots = countSlotState(overlay, "rezerv");
  const category = getBusinessCategory(settings, payload, "");
  const hasPayment = Boolean(payment.paymentMethod && (payment.iban || payment.invoiceTitle || payment.paymentMethod === "Sadece randevu"));

  const checklist = [
    { id: "profile", label: "Profil adı ve kategori", done: Boolean(settings.businessName && category && category !== "Kategori seçilmedi") },
    { id: "contact", label: "Yetkili telefon/e-posta", done: Boolean((contact.phone || contact.whatsapp || owner?.phone) && (contact.email || owner?.email)) },
    { id: "location", label: "Konum", done: Boolean(settings.locationStatus === "Girilmiş" || location.address || (location.lat && location.lng) || details.district) },
    { id: "services", label: "Hizmet ve fiyat", done: activeAreas.some((area) => area.numericPrice > 0) },
    { id: "calendar", label: "Satışa açık takvim", done: openSlots > 0 },
    { id: "media", label: "Görsel galeri", done: galleryCount > 0 },
    { id: "payment", label: "Ödeme modeli", done: hasPayment },
    { id: "contracts", label: "Sözleşme onayı", done: Boolean(contracts.termsAccepted && contracts.kvkkAccepted) },
  ];
  const completed = checklist.filter((item) => item.done).length;
  const score = Math.round((completed / checklist.length) * 100);
  const missing = checklist.filter((item) => !item.done).map((item) => item.label);

  return {
    score,
    completed,
    total: checklist.length,
    label: score >= 88 ? "Yayına hazır" : score >= 63 ? "Hazırlıkta" : "Eksik",
    missing,
    checklist,
  };
}

function getReservationFinancials(reservations = []) {
  return reservations.reduce(
    (totals, reservation) => {
      const billing = reservation.billing || calculateReservationBilling(reservation);
      totals.volume += billing.totalAmount || 0;
      totals.commission += billing.commissionAmount || 0;
      totals.online += billing.customerOnlinePayment || 0;
      totals.venuePayment += billing.customerVenuePayment || 0;
      totals.venueDebt += billing.venueCommissionDebt || 0;
      totals.venuePayout += billing.venuePayoutAmount || 0;
      return totals;
    },
    { volume: 0, commission: 0, online: 0, venuePayment: 0, venueDebt: 0, venuePayout: 0 },
  );
}

function formatAdminBusiness(venueId, staticVenue = {}) {
  const owner = getAdminVenueOwner(venueId);
  const payload = mergeVenuePayload(venueId, owner);
  const overlay = getVenueOverlay(venueId);
  const settings = payload.settings || {};
  const contact = settings.contact || {};
  const activeAreas = getActiveVenueAreas(settings);
  const reservations = getReservationsForVenue(venueId);
  const financials = getReservationFinancials(reservations);
  const readiness = getAdminBusinessReadiness({ settings, overlay, owner, payload });
  const category = getBusinessCategory(settings, payload, staticVenue.category);
  const branch = getBusinessBranch(settings, payload, staticVenue.branch);
  const openSlots = countSlotState(overlay, "rezerv");
  const manualSlots = countSlotState(overlay, "manual");
  const closedSlots = countSlotState(overlay, "closed");
  const capacityBase = reservations.length + openSlots + manualSlots;
  const occupancyRate = capacityBase ? Math.round((reservations.length / capacityBase) * 100) : 0;
  const paymentMode = resolveVenuePaymentPolicy(venueId).paymentMode;
  const nextSlot = getVenueNextSlotInfo(venueId);

  return {
    ...staticVenue,
    id: venueId,
    name: settings.businessName || payload.venue?.name || staticVenue.name || owner?.name || "İşletme",
    branch,
    category,
    status: readiness.label,
    occupancy: `%${occupancyRate}`,
    occupancyRate,
    weeklyRevenue: formatCurrency(financials.volume),
    revenueAmount: financials.volume,
    commissionAmount: financials.commission,
    onlineAmount: financials.online,
    venueDebtAmount: financials.venueDebt,
    venuePayoutAmount: financials.venuePayout,
    openIssues: readiness.missing.length,
    manager: contact.authorizedName || owner?.name || staticVenue.manager || "",
    contactName: contact.authorizedName || owner?.name || staticVenue.manager || "",
    contactEmail: contact.email || owner?.email || "",
    contactPhone: contact.whatsapp || contact.phone || owner?.phone || "",
    ownerEmail: owner?.email || "",
    ownerPhone: owner?.phone || "",
    sport: category,
    settingsStatus: settings.locationStatus || "Kontrol bekliyor",
    health: readiness.score >= 88 ? "İyi" : readiness.score >= 63 ? "Takip gerekli" : "Eksik",
    readinessScore: readiness.score,
    readinessLabel: readiness.label,
    readinessCompleted: readiness.completed,
    readinessTotal: readiness.total,
    missingActions: readiness.missing,
    reservationCount: reservations.length,
    completedReservationCount: reservations.filter((reservation) => reservation.status === "completed").length,
    cancelledReservationCount: reservations.filter((reservation) => reservation.status === "cancelled").length,
    openSlots,
    manualSlots,
    closedSlots,
    serviceCount: activeAreas.length,
    galleryCount: getVenueGallery(settings).length,
    paymentMode,
    paymentModeLabel: getPaymentModeChannel(paymentMode),
    nextSlot: nextSlot.time || "",
    nextDate: nextSlot.date || "",
    createdAt: owner?.createdAt || "",
    updatedAt: owner?.updatedAt || payload.updatedAt || "",
    reportUrl: `/api/admin/reports?venueId=${encodeURIComponent(venueId)}`,
  };
}

function toAdminTimestamp(value = "") {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isWithinDays(value = "", days = 7) {
  const timestamp = toAdminTimestamp(value);
  return Boolean(timestamp && Date.now() - timestamp <= days * 86400000);
}

function buildCategoryPerformance(businesses = [], reservations = []) {
  const byCategory = new Map();
  businesses.forEach((business) => {
    const key = business.category || "Kategori seçilmedi";
    const item = byCategory.get(key) || { label: key, businesses: 0, reservations: 0, revenue: 0 };
    item.businesses += 1;
    byCategory.set(key, item);
  });
  reservations.forEach((reservation) => {
    const label = reservation.categoryLabel || reservation.category || "Kategori seçilmedi";
    const item = byCategory.get(label) || { label, businesses: 0, reservations: 0, revenue: 0 };
    const billing = reservation.billing || calculateReservationBilling(reservation);
    item.reservations += 1;
    item.revenue += billing.totalAmount || 0;
    byCategory.set(label, item);
  });
  return [...byCategory.values()]
    .sort((a, b) => b.reservations - a.reservations || b.businesses - a.businesses || b.revenue - a.revenue)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      revenueLabel: formatCurrency(item.revenue),
      meta: `${item.businesses} işletme · ${item.reservations} rezervasyon`,
    }));
}

function buildPaymentBreakdown(reservations = []) {
  const byMode = new Map();
  reservations.forEach((reservation) => {
    const billing = reservation.billing || calculateReservationBilling(reservation);
    const label = billing.paymentModeLabel || getPaymentModeChannel(reservation.paymentMode);
    const item = byMode.get(label) || { label, count: 0, volume: 0, online: 0, commission: 0 };
    item.count += 1;
    item.volume += billing.totalAmount || 0;
    item.online += billing.customerOnlinePayment || 0;
    item.commission += billing.commissionAmount || 0;
    byMode.set(label, item);
  });
  return [...byMode.values()]
    .sort((a, b) => b.volume - a.volume)
    .map((item) => ({
      ...item,
      volumeLabel: formatCurrency(item.volume),
      onlineLabel: formatCurrency(item.online),
      commissionLabel: formatCurrency(item.commission),
      meta: `${item.count} işlem`,
    }));
}

function buildOutboxHealth() {
  const outbox = getDevOutbox();
  const messages = [
    ...(outbox.emails || []).map((item) => ({ ...item, channel: "email" })),
    ...(outbox.sms || []).map((item) => ({ ...item, channel: item.channel || "sms" })),
  ];
  const countBy = (predicate) => messages.filter(predicate).length;
  return {
    total: messages.length,
    sent: countBy((item) => item.status === "sent"),
    queued: countBy((item) => String(item.status || "").includes("queued")),
    failed: countBy((item) => item.status === "failed"),
    skipped: countBy((item) => item.status === "skipped"),
    recent: messages
      .sort((a, b) => toAdminTimestamp(b.createdAt) - toAdminTimestamp(a.createdAt))
      .slice(0, 8)
      .map((item) => ({
        channel: item.channel || "email",
        template: item.template || "-",
        to: item.to || "-",
        status: item.status || "-",
        createdAt: formatDateTimeTr(item.createdAt),
      })),
  };
}

function buildAdminOwnerDashboard({ users = [], businesses = [], reservations = [], reviews = [] } = {}) {
  const customers = users.filter((user) => user.role === "customer");
  const venueUsers = users.filter((user) => user.role === "venue");
  const admins = users.filter((user) => user.role === "admin");
  const liveBusinesses = businesses.filter((business) => business.readinessScore >= 88);
  const riskyBusinesses = businesses.filter((business) => business.readinessScore < 63 || business.openIssues > 2);
  const last7Reservations = reservations.filter((reservation) => isWithinDays(reservation.createdAt, 7));
  const allFinancials = getReservationFinancials(reservations);
  const weekFinancials = getReservationFinancials(last7Reservations);
  const outbox = buildOutboxHealth();
  const emailStatus = getEmailStatus();
  const messagingStatus = getMessagingStatus();
  const accessRules = getAllAdminAccessRules();
  const completedReservations = reservations.filter((reservation) => reservation.status === "completed").length;
  const cancelledReservations = reservations.filter((reservation) => reservation.status === "cancelled").length;
  const averageReadiness = businesses.length
    ? Math.round(businesses.reduce((total, business) => total + business.readinessScore, 0) / businesses.length)
    : 0;
  const categoryPerformance = buildCategoryPerformance(businesses, reservations);
  const paymentBreakdown = buildPaymentBreakdown(reservations);

  const riskQueue = [
    ...riskyBusinesses.slice(0, 6).map((business) => ({
      title: business.name,
      detail: `${business.readinessScore}/100 hazırlık · Eksik: ${business.missingActions.slice(0, 3).join(", ") || "kontrol gerekli"}`,
      action: "İşletme detayını aç",
      tone: business.readinessScore < 40 ? "danger" : "warning",
      targetId: business.id,
    })),
    ...(!emailStatus.configured
      ? [{
          title: "E-posta canlı sağlayıcıda değil",
          detail: `Şu an ${emailStatus.provider} kullanılıyor. Render env'de SMTP/Resend/SendGrid tanımı kontrol edilmeli.`,
          action: "Mail ayarını kontrol et",
          tone: "warning",
        }]
      : []),
    ...(messagingStatus.sms !== "twilio"
      ? [{
          title: "SMS canlı sağlayıcıda değil",
          detail: "Twilio env değişkenleri yoksa SMS dev kuyruğa düşer; gerçek telefonlara gitmez.",
          action: "Twilio ayarını ekle",
          tone: "warning",
        }]
      : []),
    ...(outbox.failed
      ? [{
          title: "Başarısız bildirim var",
          detail: `${outbox.failed} bildirim sağlayıcı hatasıyla kaydedilmiş.`,
          action: "Bildirim kuyruğunu incele",
          tone: "danger",
        }]
      : []),
  ].slice(0, 8);

  return {
    summary: [
      { label: "Toplam işletme", value: formatCount(businesses.length), meta: `${liveBusinesses.length} yayına hazır, ${businesses.length - liveBusinesses.length} hazırlıkta` },
      { label: "Rezervasyon", value: formatCount(reservations.length), meta: `${last7Reservations.length} son 7 gün` },
      { label: "İşlem hacmi", value: formatCurrency(allFinancials.volume), meta: `${formatCurrency(allFinancials.commission)} platform payı` },
      { label: "Riskli alan", value: formatCount(riskQueue.length), meta: `${riskyBusinesses.length} işletme, ${outbox.failed} bildirim hatası` },
    ],
    overview: [
      { label: "Kullanıcı", value: formatCount(users.length), note: `${customers.length} müşteri · ${venueUsers.length} işletme · ${admins.length} admin` },
      { label: "Canlı işletme", value: formatCount(liveBusinesses.length), note: `Ortalama hazırlık skoru %${averageReadiness}` },
      { label: "Son 7 gün hacim", value: formatCurrency(weekFinancials.volume), note: `${last7Reservations.length} rezervasyon` },
      { label: "Yorum", value: formatCount(reviews.length), note: `${completedReservations} tamamlanan işlem · ${cancelledReservations} iptal` },
    ],
    finance: [
      { label: "Toplam GMV", value: formatCurrency(allFinancials.volume), note: "Tüm rezervasyon bedeli" },
      { label: "Tyee komisyonu", value: formatCurrency(allFinancials.commission), note: "Platform payı" },
      { label: "Online tahsilat", value: formatCurrency(allFinancials.online), note: "Müşteriden online alınan" },
      { label: "İşletmede tahsil", value: formatCurrency(allFinancials.venuePayment), note: "Kapora sonrası veya sadece randevu" },
      { label: "FAST alacak", value: formatCurrency(allFinancials.venueDebt), note: "Ay sonu işletmeden tahsil edilecek" },
      { label: "İşletmeye ödeme", value: formatCurrency(allFinancials.venuePayout), note: "Tam ödeme modelinde net aktarım" },
    ],
    activationFunnel: [
      { label: "İşletme hesabı", value: formatCount(venueUsers.length), note: "Rolü işletme olan kullanıcı" },
      { label: "Profil tamam", value: formatCount(businesses.filter((business) => business.readinessScore >= 63).length), note: "Temel bilgiler dolu" },
      { label: "Takvim açık", value: formatCount(businesses.filter((business) => business.openSlots > 0).length), note: "Satışa açık slot var" },
      { label: "Hizmet/fiyat", value: formatCount(businesses.filter((business) => business.serviceCount > 0).length), note: "En az bir aktif hizmet" },
      { label: "Görsel", value: formatCount(businesses.filter((business) => business.galleryCount > 0).length), note: "Galeri veya kapak var" },
    ],
    notificationHealth: [
      { label: "E-posta", value: emailStatus.configured ? "Canlı" : "Dev-log", note: `${emailStatus.provider} · ${emailStatus.from}`, tone: emailStatus.configured ? "good" : "warn" },
      { label: "SMS", value: messagingStatus.sms === "twilio" ? "Canlı" : "Dev-log", note: messagingStatus.sms, tone: messagingStatus.sms === "twilio" ? "good" : "warn" },
      { label: "WhatsApp", value: messagingStatus.whatsapp === "twilio" ? "Canlı" : "Dev-log", note: messagingStatus.whatsapp, tone: messagingStatus.whatsapp === "twilio" ? "good" : "warn" },
      { label: "Kuyruk", value: formatCount(outbox.total), note: `${outbox.queued} kuyruk · ${outbox.failed} hata`, tone: outbox.failed ? "danger" : "good" },
      { label: "Admin erişimi", value: formatCount(accessRules.filter((rule) => rule.isActive !== false).length), note: `${accessRules.length} toplam kural`, tone: accessRules.length ? "good" : "warn" },
    ],
    categoryPerformance,
    paymentBreakdown,
    riskQueue,
    recentReservations: reservations
      .slice()
      .sort((a, b) => toAdminTimestamp(b.createdAt) - toAdminTimestamp(a.createdAt))
      .slice(0, 8)
      .map((reservation) => {
        const billing = reservation.billing || calculateReservationBilling(reservation);
        return {
          id: reservation.id,
          venueName: reservation.venueName || "İşletme",
          customerName: reservation.customerName || reservation.customerEmail || "Müşteri",
          serviceLabel: reservation.serviceLabel || reservation.categoryLabel || "Rezervasyon",
          date: `${formatDateTr(reservation.serviceDate)} ${reservation.serviceTime || ""}`.trim(),
          amount: formatCurrency(billing.totalAmount),
          paymentMode: billing.paymentModeLabel,
          status: reservation.status || "confirmed",
          createdAt: formatDateTimeTr(reservation.createdAt),
        };
      }),
    recentUsers: users
      .slice()
      .sort((a, b) => toAdminTimestamp(b.createdAt) - toAdminTimestamp(a.createdAt))
      .slice(0, 8)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        phone: user.phone || "-",
        verified: `${user.emailVerified ? "E-posta tamam" : "E-posta bekliyor"} · ${user.phone ? "Telefon kayıtlı" : "Telefon yok"}`,
        createdAt: formatDateTimeTr(user.createdAt),
      })),
    businessHealth: businesses.slice(0, 12).map((business) => ({
      id: business.id,
      name: business.name,
      category: business.category,
      branch: business.branch,
      readinessScore: `%${business.readinessScore}`,
      status: business.readinessLabel,
      reservations: business.reservationCount,
      revenue: formatCurrency(business.revenueAmount),
      missing: business.missingActions.slice(0, 3).join(", ") || "Kritik eksik yok",
    })),
    outbox,
  };
}

function buildAdminBootstrap(req = null) {
  const users = getUsers().map(formatAdminUser);
  const businesses = getAdminBusinessDirectory();
  const customers = users.filter((user) => !user.isAdmin && !user.canManageVenue);
  const reservations = getReservations();
  const reviews = getReviews();
  const dashboard = getAdminDashboardPayload();
  const ownerDashboard = buildAdminOwnerDashboard({ users, businesses, reservations, reviews });

  return {
    ...dashboard,
    summary: ownerDashboard.summary,
    alerts: ownerDashboard.riskQueue.map((item) => ({
      title: item.title,
      detail: item.detail,
      action: item.action,
    })),
    venues: businesses,
    users,
    customers,
    businesses,
    reservations: ownerDashboard.recentReservations,
    ownerDashboard,
    access: {
      currentIp: req ? getClientIp(req) : "",
      isLocal: req ? Boolean(req.adminAccess?.local) : false,
      rules: getAllAdminAccessRules().map(safeAdminAccessRule),
    },
    messaging: {
      email: getEmailStatus(),
      sms: getMessagingStatus().sms,
      whatsapp: getMessagingStatus().whatsapp,
    },
    reportDefaults: {
      periods: ["Bu ay", "Son 30 gün", "Bu çeyrek", "Yıllık"],
      venues: [{ id: "all", name: "Tüm kurumlar" }, ...businesses.map((item) => ({ id: item.id, name: item.name }))],
    },
  };
}

function normalizeSearchText(value = "") {
  return String(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesQuery(record, query) {
  if (!query) return true;
  return normalizeSearchText(Object.values(record).join(" ")).includes(query);
}

function getAdminSearchResults({ type = "all", query = "" } = {}) {
  const normalizedQuery = normalizeSearchText(query);
  const payload = buildAdminBootstrap();
  const results = [];
  const seen = new Set();

  const pushUnique = (item) => {
    const key =
      item.resultType === "business"
        ? `business:${item.id || item.name}`
        : `user:${normalizeEmail(item.email || "") || item.id || item.name}`;

    if (seen.has(key)) return;
    seen.add(key);
    results.push(item);
  };

  if (type === "all" || type === "business") {
    payload.businesses.filter((item) => matchesQuery(item, normalizedQuery)).forEach((item) => {
      pushUnique({ resultType: "business", ...item });
    });
  }

  if (type === "all" || type === "customer") {
    payload.customers.filter((item) => matchesQuery(item, normalizedQuery)).forEach((item) => {
      pushUnique({ resultType: "customer", ...item });
    });
  }

  if (type === "user") {
    payload.users.filter((item) => matchesQuery(item, normalizedQuery)).forEach((item) => {
      pushUnique({ resultType: "user", ...item });
    });
  }

  return results.slice(0, 50);
}

function createAdminReport({ venueId = "all", period = "Bu ay" } = {}) {
  const businesses = getAdminBusinessDirectory();
  const selectedBusinesses =
    venueId === "all" ? businesses : businesses.filter((business) => business.id === venueId);
  const selectedIds = new Set(selectedBusinesses.map((business) => business.id));
  const reservations = getReservations().filter(
    (reservation) => venueId === "all" || selectedIds.has(reservation.venueId),
  );
  const financials = getReservationFinancials(reservations);
  const onlineReservations = reservations.filter((reservation) => reservation.paymentMode !== PAYMENT_MODES.VENUE_PAYMENT).length;
  const openSlots = selectedBusinesses.reduce((total, business) => total + business.openSlots, 0);
  const manualSlots = selectedBusinesses.reduce((total, business) => total + business.manualSlots, 0);
  const readinessAverage = selectedBusinesses.length
    ? Math.round(selectedBusinesses.reduce((total, business) => total + business.readinessScore, 0) / selectedBusinesses.length)
    : 0;
  const riskCount = selectedBusinesses.filter((business) => business.readinessScore < 63 || business.openIssues > 2).length;
  const paymentBreakdown = buildPaymentBreakdown(reservations);
  const categoryPerformance = buildCategoryPerformance(selectedBusinesses, reservations);

  return {
    title: venueId === "all" ? "Kurum Bazlı Platform Raporu" : `${selectedBusinesses[0]?.name || "Kurum"} Raporu`,
    period,
    generatedAt: new Date().toISOString(),
    scope: selectedBusinesses.map((item) => item.name).join(", ") || "Kurum bulunamadı",
    executiveSummary: [
      `${selectedBusinesses.length} işletme ve ${reservations.length} rezervasyon üzerinden platform hacmi, ödeme kanalı ve onboarding sağlığı birlikte okunuyor.`,
      `Toplam işlem hacmi ${formatCurrency(financials.volume)}, platform komisyonu ${formatCurrency(financials.commission)} seviyesinde.`,
      `Ortalama işletme hazırlık skoru %${readinessAverage}; takip gerektiren işletme sayısı ${riskCount}.`,
      paymentBreakdown.length
        ? `En baskın ödeme modeli: ${paymentBreakdown[0].label} (${paymentBreakdown[0].meta}).`
        : "Henüz ödeme modeli kırılımı oluşturacak rezervasyon kaydı yok.",
    ],
    financial: [
      { label: "Toplam işlem hacmi", value: formatCurrency(financials.volume), note: `${reservations.length} işlem` },
      { label: "Platform komisyonu", value: formatCurrency(financials.commission), note: "Tyee payı" },
      { label: "Online tahsilat", value: formatCurrency(financials.online), note: "Müşteriden online alınan" },
      { label: "Online kanal payı", value: `%${reservations.length ? Math.round((onlineReservations / reservations.length) * 100) : 0}`, note: `${onlineReservations} online işlem` },
    ],
    operational: [
      { label: "Ortalama hazırlık", value: `%${readinessAverage}`, note: "Profil, hizmet, medya ve ödeme kontrolü" },
      { label: "tyee satışına açık slot", value: formatCount(openSlots), note: "Marketplace'e açılmış kapasite" },
      { label: "Manuel slot", value: formatCount(manualSlots), note: "İşletme panelinden manuel yönetilen" },
      { label: "Riskli işletme", value: formatCount(riskCount), note: "Eksik onboarding veya düşük hazırlık" },
    ],
    recommendations: [
      categoryPerformance.length ? `${categoryPerformance[0].label} kategorisinde arz/talep sinyalini öne al; ${categoryPerformance[0].meta}.` : "Kategori kırılımı oluşması için işletme ve rezervasyon verisini artır.",
      openSlots ? "Satışa açık slotu olan işletmelerde dolmayan saatler için kampanya ve bildirim kuralı tanımla." : "İşletmelerden en az bir satışa açık takvim slotu açmalarını iste.",
      riskCount ? "Riskli işletmeleri onboarding kontrol listesine al; eksik medya, hizmet/fiyat ve ödeme alanlarını tamamlat." : "Yayına hazır işletmelerde değerlendirme ve tekrar rezervasyon akışını büyüt.",
      "Mail/SMS sağlayıcı durumunu admin üst ekranında düzenli kontrol et; dev-log kalan kanal canlı müşteriye ulaşmaz.",
    ],
    rows: selectedBusinesses.map((business) => ({
      kurum: business.name,
      lokasyon: business.branch,
      kategori: business.category,
      doluluk: business.occupancy,
      haftalikCiro: business.weeklyRevenue,
      acikKonu: business.openIssues,
      saglik: business.health,
    })),
  };
}

app.get("/api/bootstrap", (_req, res) => {
  const payload = getBootstrapPayload();
  const runtimeFeaturedListings = getRuntimeVenueListingsForSearch({ city: "istanbul" }).slice(0, 8);
  res.json({
    ...payload,
    featuredListings: HIDE_PUBLIC_VENUES ? [] : mergeListingItems(runtimeFeaturedListings, payload.featuredListings),
    hotSlots: HIDE_PUBLIC_VENUES ? [] : payload.hotSlots,
    categories: withActiveVenueCategoryCounts(payload.categories || []),
    brand: {
      name: "tyee",
      tagline: "Rezervasyon marketplace",
    },
  });
});

app.get("/api/legal/customer-terms", (_req, res) => {
  res.json(customerReservationTerms);
});

app.get("/api/legal/venue-terms", (_req, res) => {
  res.json(venuePartnerTerms);
});

app.get("/api/listings", (req, res) => {
  if (HIDE_PUBLIC_VENUES) {
    res.json({ total: 0, items: [] });
    return;
  }

  const items = filterListings({
    category: String(req.query.category || "all"),
    city: String(req.query.city || "all"),
    query: String(req.query.query || ""),
    time: String(req.query.time || ""),
  });
  const runtimeItems = getRuntimeVenueListingsForSearch({
    category: String(req.query.category || "all"),
    city: String(req.query.city || "all"),
    query: String(req.query.query || ""),
  });
  const mergedItems = mergeListingItems(runtimeItems, items);
  res.json({ total: mergedItems.length, items: mergedItems });
});

app.get("/api/listings/:id", (req, res) => {
  if (HIDE_PUBLIC_VENUES) {
    res.status(404).json({ error: "İşletme bulunamadı." });
    return;
  }

  const id = String(req.params.id || "");
  const listing = getListingById(id) || getRuntimeVenueListingById(id);
  if (!listing) {
    res.status(404).json({ error: "İşletme bulunamadı." });
    return;
  }
  res.json({
    item: {
      ...listing,
      facilities: listing.facilities || [],
    },
  });
});

app.get("/api/listings/:id/availability", (req, res) => {
  const id = String(req.params.id || "");
  const listing = getListingById(id) || getRuntimeVenueListingById(id);
  if (!listing) {
    res.status(404).json({ error: "İşletme bulunamadı." });
    return;
  }

  const serviceDate = String(req.query.date || new Date().toISOString().slice(0, 10));
  const serviceLabel = String(req.query.service || "");
  const slots = getListingAvailabilitySlots({ listing, date: serviceDate, serviceLabel });
  const firstAvailable = slots.find((slot) => slot.available);

  res.json({
    date: serviceDate,
    venueId: listing.venueId || listing.id,
    slots,
    openSlots: slots.filter((slot) => slot.available).length,
    nextSlot: firstAvailable?.time || "",
  });
});

function getDistanceKm(origin, target) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(target.lat - origin.lat);
  const dLng = toRad(target.lng - origin.lng);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(target.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeVenueCategory(value = "") {
  const normalized = String(value || "").toLocaleLowerCase("tr-TR");
  if (normalized.includes("restaurant") || normalized.includes("restoran") || normalized.includes("cafe")) {
    return { id: "restaurant", label: "Restaurant", icon: "🍽️" };
  }
  if (normalized.includes("dövme") || normalized.includes("dovme") || normalized.includes("tattoo")) {
    return { id: "tattoo", label: "Dövmeci", icon: "✒️" };
  }
  if (normalized.includes("erkek kuaf") || normalized.includes("berber") || normalized.includes("barber")) {
    return { id: "erkek-berber", label: "Erkek Berber", icon: "💈" };
  }
  if (normalized.includes("bayan kuaf") || normalized.includes("kadın kuaf") || normalized.includes("kadin kuaf") || normalized.includes("hair")) {
    return { id: "bayan-kuafor", label: "Bayan Kuaför", icon: "💇‍♀️" };
  }
  if (normalized.includes("kadın") || normalized.includes("kadin") || normalized.includes("makeup") || normalized.includes("makyaj") || normalized.includes("tırnak") || normalized.includes("tirnak")) {
    return { id: "guzellik", label: "Güzellik Merkezi", icon: "💄" };
  }
  if (normalized.includes("pet")) return { id: "pet-kuafor", label: "Pet Kuaför", icon: "🐾" };
  if (normalized.includes("güzellik") || normalized.includes("guzellik")) return { id: "guzellik", label: "Güzellik Merkezi", icon: "💄" };
  if (normalized.includes("tenis") || normalized.includes("tennis")) return { id: "tenis", label: "Tenis", icon: "🎾" };
  if (normalized.includes("halı") || normalized.includes("hali") || normalized.includes("futbol")) return { id: "hali-saha", label: "Halı Saha", icon: "⚽" };
  if (normalized.includes("padel")) return { id: "padel", label: "Padel Kort", icon: "🎾" };
  if (normalized.includes("direksiyon")) return { id: "direksiyon", label: "Direksiyon Dersi", icon: "🚘" };
  if (normalized.includes("ders")) return { id: "ozel-ders", label: "Özel Ders", icon: "🎓" };
  if (normalized.includes("masaj") || normalized.includes("spa")) return { id: "masaj", label: "Masaj & Spa", icon: "🪷" };
  if (normalized.includes("fizyoterapi")) return { id: "fizyoterapi", label: "Fizyoterapi", icon: "🧘" };
  if (normalized.includes("yoga") || normalized.includes("pilates")) return { id: "yoga", label: "Yoga & Pilates", icon: "🧘‍♀️" };
  return { id: "diger", label: value || "İşletme", icon: "📍" };
}

function getVenueCategoryMediaClass(categoryId = "") {
  const mediaByCategory = {
    "pet-kuafor": "media-pet",
    guzellik: "media-beauty",
    restaurant: "media-restaurant",
    tattoo: "media-tattoo",
    "bayan-kuafor": "media-hair",
    "erkek-berber": "media-barber",
    "hali-saha": "media-field",
    tenis: "media-padel",
    padel: "media-padel",
    direksiyon: "media-driving",
    "ozel-ders": "media-lesson",
    masaj: "media-spa",
    fizyoterapi: "media-physio",
    yoga: "media-yoga",
  };

  return mediaByCategory[categoryId] || "media-field";
}

function formatPriceLabel(value = 0) {
  return new Intl.NumberFormat("tr-TR").format(Math.round(Number(value || 0)));
}

function getSafeMediaUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/assets/")) return url;
  return "";
}

function getVenueMediaUrl(settings = {}) {
  const media = settings.media || {};
  const gallery = getVenueGallery(settings);
  return (
    gallery[0]?.src ||
    getSafeMediaUrl(media.coverUrl) ||
    getSafeMediaUrl(media.profileUrl) ||
    getSafeMediaUrl(media.logoUrl)
  );
}

function getVenueGallery(settings = {}) {
  const media = settings.media || {};
  const seen = new Set();
  const items = [];
  const addItem = (item = {}, fallbackRole = "") => {
    const src = getSafeMediaUrl(getValidGallerySource(item));
    if (!src || seen.has(src)) return;
    seen.add(src);
    const role = String(item?.role || fallbackRole || `Görsel ${items.length + 1}`).trim();
    const name = String(item?.name || role).trim();
    items.push({
      ...(typeof item === "object" && item ? item : {}),
      src,
      role,
      name,
      width: Number(item?.width || 0),
      height: Number(item?.height || 0),
    });
  };

  (Array.isArray(media.gallery) ? media.gallery : []).forEach((item, index) => {
    addItem(item, index === 0 ? "Kapak" : `Görsel ${index + 1}`);
  });
  addItem({ src: media.coverUrl, role: "Kapak" }, "Kapak");
  addItem({ src: media.profileUrl, role: "Profil" }, "Profil");
  addItem({ src: media.logoUrl, role: "Logo" }, "Logo");

  return items.slice(0, VENUE_GALLERY_LIMIT);
}

function getActiveVenueAreas(settings = {}) {
  const areas = Array.isArray(settings.areas) ? settings.areas : [];
  return areas
    .filter((area) => area && area.isActive !== false)
    .map((area) => ({
      ...area,
      name: String(area.name || "").trim(),
      type: String(area.type || "").trim(),
      capacity: String(area.capacity || "").trim(),
      numericPrice: parseMoney(area.price),
    }))
    .filter((area) => area.name);
}

function getVenuePriceInfo(settings = {}) {
  const pricedAreas = getActiveVenueAreas(settings).filter((area) => area.numericPrice > 0);
  const representativePrice = pricedAreas[0]?.numericPrice || 0;
  return {
    price: representativePrice,
    priceLabel: representativePrice ? formatPriceLabel(representativePrice) : "0",
    priceUnit: "hizmet",
  };
}

function getVenueNextSlot(venueId) {
  return getVenueNextSlotInfo(venueId).time || "Yakında";
}

function getVenueNextSlotInfo(venueId) {
  const slotModes = getVenueOverlay(venueId)?.slotModes || {};
  const openKey = Object.keys(slotModes)
    .sort()
    .find((key) => slotModes[key] === "rezerv");
  if (!openKey) return { date: "", time: "" };
  const dateKeyMatch = openKey.match(/^(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2})$/);
  if (dateKeyMatch) return { date: dateKeyMatch[1], time: dateKeyMatch[2] };
  return { date: "", time: getSlotTimeFromStateKey(openKey) };
}

function getEnabledSettingsFacilities(settings = {}) {
  const facilities = Array.isArray(settings.facilities) ? settings.facilities : [];
  return facilities
    .filter((item) => item?.enabled)
    .map((item) => ({
      id: String(item.id || "").trim(),
      label: String(item.label || "").trim(),
      icon: String(item.icon || "").trim(),
    }))
    .filter((item) => item.id && item.label);
}

function getRuntimeVenueMapItems(origin) {
  if (HIDE_PUBLIC_VENUES) return [];

  const deletedVenueIds = new Set(getDeletedVenueIds());
  return getUsers()
    .filter((user) => user.canManageVenue && !user.isAdmin)
    .map((user) => {
      const venueId = getUserVenueId(user);
      if (deletedVenueIds.has(venueId)) return null;
      const overlay = getVenueOverlay(venueId);
      const settings = overlay.settings || {};
      const location = settings.location || {};
      const lat = Number(location.lat);
      const lng = Number(location.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (lat < 35 || lat > 43 || lng < 25 || lng > 45) return null;

      const details = settings.details || {};
      const category = normalizeVenueCategory(details.category || settings.venue?.sport || "");
      const activeAreas = getActiveVenueAreas(settings);
      const priceInfo = getVenuePriceInfo(settings);
      const serviceTypes = [...new Set(activeAreas.map((area) => area.type || category.label).filter(Boolean))].slice(0, 6);
      const serviceCatalog = getRuntimeVenueServiceCatalog(venueId).slice(0, 16);
      const serviceOptions = serviceCatalog.map((service) => service.name);
      const distanceKm = getDistanceKm(origin, { lat, lng });
      const nextSlotInfo = getVenueNextSlotInfo(venueId);
      const gallery = getVenueGallery(settings);
      return {
        id: venueId,
        name: settings.businessName || user.name || "İşletme",
        category: category.id,
        categoryLabel: category.label,
        icon: category.icon,
        cityLabel: details.district || location.address || "Konum seçildi",
        lat,
        lng,
        distanceKm: Number(distanceKm.toFixed(2)),
        distanceLabel: `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`,
        nextSlot: nextSlotInfo.time || "Yakında",
        nextDate: nextSlotInfo.date,
        price: priceInfo.price,
        priceLabel: priceInfo.priceLabel,
        priceUnit: priceInfo.priceUnit,
        paymentMode: resolveVenuePaymentPolicy(venueId).paymentMode,
        mediaClass: getVenueCategoryMediaClass(category.id),
        mediaUrl: getVenueMediaUrl(settings),
        gallery,
        facilities: getEnabledSettingsFacilities(settings),
        summary: details.description || `${category.label} hizmetleri ve müsaitlik bilgileri işletme panelinden yönetiliyor.`,
        serviceTypes: serviceTypes.length ? serviceTypes : [category.label],
        serviceOptions: serviceOptions.length ? serviceOptions : [category.label],
        serviceCatalog,
        source: "venue-settings",
      };
    })
    .filter(Boolean);
}

function getRuntimeVenueListingById(id) {
  const item = getRuntimeVenueMapItems({ lat: 41.0351, lng: 29.0268 }).find((venue) => venue.id === id);
  if (!item) return null;
  const listingPrice = item.price || Number(String(item.priceLabel || "0").replace(/[^\d]/g, "")) || 1000;

  return {
    id: item.id,
    venueId: item.id,
    name: item.name,
    category: item.category,
    categoryLabel: item.categoryLabel,
    city: "istanbul",
    cityLabel: item.cityLabel || "İstanbul",
    rating: 4.8,
    reviews: 0,
    distance: item.distanceLabel || "",
    price: listingPrice,
    priceUnit: item.priceUnit || "hizmet",
    summary: item.summary || `${item.categoryLabel || "Hizmet"} · Canlı işletme profili`,
    tags: ["Yakında müsait", "Tyee işletmesi", "Güvenli rezervasyon"],
    cta: "Rezerv et",
    mediaClass: item.mediaClass || "media-field",
    mediaUrl: item.mediaUrl || "",
    gallery: item.gallery || [],
    featured: true,
    eveningTime: item.nextSlot || "19:30",
    availability: { today: true, nextSlot: item.nextSlot || "19:30", nextDate: item.nextDate || "", openSlots: 4 },
    profileScore: 86,
    conversionScore: 80,
    responseMinutes: 12,
    boost: false,
    serviceTypes: item.serviceTypes || [item.categoryLabel || "hizmet"],
    priceLabel: item.price ? item.priceLabel : formatPriceLabel(listingPrice),
    facilities: item.facilities || [],
    serviceOptions: item.serviceOptions?.length ? item.serviceOptions : getRuntimeVenueServiceOptions(item.id),
    serviceCatalog: item.serviceCatalog || getRuntimeVenueServiceCatalog(item.id),
  };
}

function getRuntimeVenueListingsForSearch({ category = "all", city = "all", query = "" } = {}) {
  const normalizedCategory = String(category || "all");
  const normalizedCity = String(city || "all");
  const queryTerms = normalizeSearchText(query).split(/\s+/).filter(Boolean);

  return getRuntimeVenueMapItems({ lat: 41.0351, lng: 29.0268 })
    .map((item) => getRuntimeVenueListingById(item.id))
    .filter(Boolean)
    .filter((listing) => {
      const matchesCategory = normalizedCategory === "all" || listing.category === normalizedCategory;
      const matchesCity = normalizedCity === "all" || normalizedCity === "istanbul";
      const searchable = normalizeSearchText(
        [
          listing.name,
          listing.categoryLabel,
          listing.cityLabel,
          listing.summary,
          ...(listing.tags || []),
          ...(listing.serviceTypes || []),
          ...(listing.serviceOptions || []),
        ].join(" "),
      );
      const matchesQuery = !queryTerms.length || queryTerms.every((term) => searchable.includes(term));
      return matchesCategory && matchesCity && matchesQuery;
    });
}

function mergeListingItems(...groups) {
  const byId = new Map();
  groups.flat().filter(Boolean).forEach((item) => {
    if (!byId.has(item.id)) byId.set(item.id, item);
  });
  return [...byId.values()];
}

function getRuntimeVenueServiceOptions(venueId) {
  const catalogOptions = getRuntimeVenueServiceCatalog(venueId).map((item) => item.name);
  if (catalogOptions.length) return catalogOptions;

  const overlay = getVenueOverlay(venueId);
  const settings = overlay?.settings || {};
  const areas = Array.isArray(settings.areas) ? settings.areas : [];
  const areaOptions = areas
    .filter((area) => area && area.isActive !== false)
    .map((area) => String(area.name || "").trim())
    .filter(Boolean);
  const slotOptions = Object.values(overlay?.slotServices || {})
    .map((item) => String(item?.name || "").trim())
    .filter(Boolean);
  const options = [...new Set([...areaOptions, ...slotOptions])];
  const specificOptions = options.filter((item) => !isGenericServiceLabel(item));
  return specificOptions.length ? specificOptions : options;
}

function getRuntimeVenueServiceCatalog(venueId) {
  const overlay = getVenueOverlay(venueId);
  const settings = overlay?.settings || {};
  const areaCatalog = getActiveVenueAreas(settings)
    .map((area) => ({
      name: area.name,
      type: area.type || "Hizmet",
      duration: area.capacity || "60 dk",
      price: area.numericPrice || 0,
      priceLabel: area.numericPrice ? formatPriceLabel(area.numericPrice) : "0",
    }))
    .filter((area) => !isGenericServiceLabel(area.name));

  if (areaCatalog.length) return areaCatalog;

  const slotOptions = Object.values(overlay?.slotServices || {})
    .map((item) => String(item?.name || "").trim())
    .filter((name) => name && !isGenericServiceLabel(name));

  return [...new Set(slotOptions)].map((name) => ({
    name,
    type: "Hizmet",
    duration: "60 dk",
    price: 0,
    priceLabel: "0",
  }));
}

function isGenericServiceLabel(value = "") {
  const normalized = normalizeSearchText(value);
  return !normalized || normalized === "ana alan" || normalized === "ana hizmet" || normalized === "hizmet" || normalized === "hizmet alani";
}

function withActiveVenueCategoryCounts(categories = []) {
  const formatter = new Intl.NumberFormat("tr-TR");

  if (HIDE_PUBLIC_VENUES) {
    return categories.map((category) => ({
      ...category,
      count: "0",
      businessCount: 0,
      orderCount: 0,
      popularityScore: 0,
    }));
  }

  const listings = mergeListingItems(
    getRuntimeVenueListingsForSearch({ city: "istanbul" }),
    filterListings({ city: "istanbul" }),
    filterListings({ city: "all" }),
  );
  const businessCounts = listings.reduce((totals, item) => {
    if (!item.category) return totals;
    totals[item.category] = (totals[item.category] || 0) + 1;
    return totals;
  }, {});
  const orderCounts = getReservations().reduce((totals, reservation) => {
    const category = String(reservation.category || "").trim();
    if (!category) return totals;
    totals[category] = (totals[category] || 0) + 1;
    return totals;
  }, {});

  return categories.map((category) => ({
    ...category,
    count: formatter.format(businessCounts[category.id] || 0),
    businessCount: businessCounts[category.id] || 0,
    orderCount: orderCounts[category.id] || 0,
    popularityScore: (orderCounts[category.id] || 0) * 100 + (businessCounts[category.id] || 0) * 10,
  }));
}

function parseServiceDate(value = "") {
  const date = new Date(`${String(value || "").slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function formatServiceDateKey(value = "") {
  const date = parseServiceDate(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getSlotTimeFromStateKey(key = "") {
  const value = String(key || "");
  const dateKeyMatch = value.match(/^\d{4}-\d{2}-\d{2}-(\d{2}:\d{2})$/);
  if (dateKeyMatch) return dateKeyMatch[1];
  const legacyKeyMatch = value.match(/^\d+-(\d{2}:\d{2})$/);
  if (legacyKeyMatch) return legacyKeyMatch[1];
  return value.split("-").pop() || "";
}

function getCalendarDayIndex(value = "") {
  const date = parseServiceDate(value);
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round((date - CALENDAR_BASE_DATE) / dayMs);
  return ((diff % 7) + 7) % 7;
}

function addCalendarHour(value = "") {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  return `${String((hour + 1) % 24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getPublicSlotMode(slot, explicitMode, hasCalendarState) {
  if (explicitMode) return explicitMode;
  if (!slot) return hasCalendarState ? "closed" : "";
  if (slot.status === "marketplace") return "rezerv";
  if (slot.status === "maintenance") return "closed";
  return "reserved";
}

function getListingAvailabilitySlots({ listing, date, serviceLabel = "" }) {
  const venueId = listing.venueId || listing.id;
  const overlay = getVenueOverlay(venueId);
  const slotModes = overlay.slotModes || {};
  const manualEntries = overlay.manualEntries || {};
  const slotServices = overlay.slotServices || {};
  const hasCalendarState =
    Object.keys(slotModes).length > 0 ||
    Object.keys(manualEntries).length > 0 ||
    Object.keys(slotServices).length > 0;
  const isRuntimeVenue = Boolean(getRuntimeVenueListingById(venueId)) || String(venueId).startsWith("venue-");
  const dashboard = mergeVenuePayload(venueId);
  const dayIndex = getCalendarDayIndex(date);
  const dateKey = formatServiceDateKey(date);
  const day = (dashboard.weekDays || [])[dayIndex] || {};
  const daySlots = Array.isArray(day.slots) ? day.slots : [];
  const hasSeedCalendar = !isRuntimeVenue && daySlots.length > 0;

  if (!hasCalendarState && !hasSeedCalendar) return [];

  const normalizedService = normalizeSearchText(serviceLabel);
  return CALENDAR_SLOT_TIMES.map((time) => {
    const slotKey = `${dateKey}-${time}`;
    const legacySlotKey = `${dayIndex}-${time}`;
    const explicitMode = slotModes[slotKey] ?? slotModes[legacySlotKey];
    const explicitService = slotServices[slotKey] ?? slotServices[legacySlotKey];
    const explicitServiceLabel = explicitService?.name || "";
    const matchingSlot =
      daySlots.find((slot) => {
        if (slot.time !== time) return false;
        if (!normalizedService) return true;
        return normalizeSearchText(explicitServiceLabel || slot.field || slot.meta || "").includes(normalizedService);
      }) || daySlots.find((slot) => slot.time === time);
    const mode = getPublicSlotMode(matchingSlot, explicitMode, hasCalendarState);
    const manualEntry = manualEntries[slotKey] ?? manualEntries[legacySlotKey];
    const hasExplicitService = Boolean(explicitServiceLabel) && !isGenericServiceLabel(explicitServiceLabel);
    const serviceMatches =
      !normalizedService ||
      !hasExplicitService ||
      normalizeSearchText(explicitServiceLabel || matchingSlot?.field || matchingSlot?.meta || "").includes(normalizedService);
    const available = mode === "rezerv" && serviceMatches;

    return {
      time,
      endTime: addCalendarHour(time),
      available,
      status: available ? "available" : "unavailable",
      label: available ? "Müsait" : manualEntry ? "Dolu" : mode === "closed" ? "Kapalı" : "Dolu",
      serviceLabel: explicitServiceLabel || matchingSlot?.field || "",
    };
  }).filter((slot) => slot.available || hasCalendarState || hasSeedCalendar);
}

app.get("/api/nearby", (req, res) => {
  const lat = Number(req.query.lat || 41.0351);
  const lng = Number(req.query.lng || 29.0268);
  const origin = { lat, lng };

  if (HIDE_PUBLIC_VENUES) {
    res.json({
      origin: {
        lat: Number.isFinite(origin.lat) ? origin.lat : 41.0351,
        lng: Number.isFinite(origin.lng) ? origin.lng : 29.0268,
      },
      items: [],
    });
    return;
  }

  const payload = getNearbyMapPayload(origin);
  const runtimeItems = getRuntimeVenueMapItems(payload.origin);
  const sourceItems = runtimeItems.length ? runtimeItems : payload.items;
  const byKey = new Map();

  sourceItems.forEach((item) => {
    const key = [
      normalizeSearchText(item.name || ""),
      item.category || "",
      Number(item.lat).toFixed(5),
      Number(item.lng).toFixed(5),
    ].join(":");
    byKey.set(key, item);
  });

  res.json({
    ...payload,
    items: [...byKey.values()].sort((a, b) => a.distanceKm - b.distanceKm),
  });
});

app.get("/api/reservations/billing-preview", (_req, res) => {
  const sampleTotal = 4000;
  const examples = [
    PAYMENT_MODES.COMMISSION_DEPOSIT,
    PAYMENT_MODES.FULL_ONLINE,
    PAYMENT_MODES.VENUE_PAYMENT,
  ].map((paymentMode) =>
    calculateReservationBilling({
      totalAmount: sampleTotal,
      paymentMode,
    }),
  );

  res.json({
    commissionRate: 0.07,
    sampleTotal,
    examples,
    monthlyFastExample: summarizeMonthlyCommission({
      reservations: [{ totalAmount: sampleTotal, paymentMode: PAYMENT_MODES.VENUE_PAYMENT }],
      periodEnd: new Date("2026-06-30T20:59:59.000Z"),
      now: new Date("2026-07-10T12:00:00.000Z"),
    }),
    overdueFastExample: summarizeMonthlyCommission({
      reservations: [{ totalAmount: sampleTotal, paymentMode: PAYMENT_MODES.VENUE_PAYMENT }],
      periodEnd: new Date("2026-06-30T20:59:59.000Z"),
      now: new Date("2026-07-20T12:00:00.000Z"),
    }),
  });
});

app.get("/api/reservations/payment-options", (req, res) => {
  const totalAmount = Math.max(parseMoney(req.query.totalAmount || req.query.total || 0), 0);
  const examples = [
    PAYMENT_MODES.VENUE_PAYMENT,
    PAYMENT_MODES.COMMISSION_DEPOSIT,
    PAYMENT_MODES.FULL_ONLINE,
  ].map((paymentMode) => calculateReservationBilling({ totalAmount, paymentMode }));

  res.json({
    commissionRate: 0.07,
    totalAmount,
    options: examples,
  });
});

app.get("/api/reservations/payment-policy", (req, res) => {
  const venueId = String(req.query.venueId || req.query.listingId || "").trim();
  const totalAmount = Math.max(parseMoney(req.query.totalAmount || req.query.total || 0), 0);
  const policy = resolveVenuePaymentPolicy(venueId);
  const billing = calculateReservationBilling({ totalAmount, ...policy });

  res.json({
    venueId,
    commissionRate: 0.07,
    ...policy,
    paymentModeLabel: billing.paymentModeLabel,
    billing,
  });
});

app.get("/api/customer/dashboard", requireAuth, (req, res) => {
  const user = req.user;
  const reservations = getReservations()
    .filter(
      (reservation) =>
        reservation.customerId === user.id ||
        normalizeEmail(reservation.customerEmail) === normalizeEmail(user.email),
    )
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  const upcoming = reservations.filter((reservation) => reservation.status !== "completed" && reservation.status !== "cancelled");
  const past = reservations.filter((reservation) => reservation.status === "completed" || reservation.status === "cancelled");

  res.json({
    user: normalizeUser(user),
    reservations: {
      upcoming: upcoming.map(formatCustomerReservation),
      past: past.map(formatCustomerReservation),
    },
    purchases: [],
    reviews: getReviews()
      .filter((review) => review.customerId === user.id || normalizeEmail(review.customerEmail) === normalizeEmail(user.email))
      .map((review) => ({
        id: review.id,
        venueName: review.venueName || "İşletme",
        serviceLabel: review.serviceLabel || review.categoryLabel || "Hizmet",
        rating: review.rating,
        comment: review.comment || "",
        date: formatDateTimeTr(review.createdAt),
        status: review.status || "Yayınlandı",
      })),
    favorites: [],
    billingAddresses: [],
    cards: [],
  });
});

app.post("/api/reservations", async (req, res) => {
  const body = req.body || {};
  const user = getUserFromRequest(req);
  const venueId = String(body.venueId || body.listingId || "").trim();
  const totalAmount = Math.max(parseMoney(body.totalAmount), 0);
  const policy = resolveVenuePaymentPolicy(venueId);
  const billing = calculateReservationBilling({ totalAmount, ...policy });
  const paymentMode = policy.paymentMode;
  const customerName = String(body.customerName || user?.name || "").trim();
  const customerEmail = normalizeEmail(body.customerEmail || user?.email || "");
  const customerPhoneInput = String(body.customerPhone || user?.phone || "").trim();
  const customerPhone = normalizePhoneNumber(customerPhoneInput);
  const serviceDate = String(body.serviceDate || "").trim();
  const serviceTime = String(body.serviceTime || "").trim();

  if (!venueId) {
    res.status(400).json({ error: "Rezervasyon için işletme bilgisi eksik." });
    return;
  }

  if (!customerName || !customerPhone) {
    res.status(400).json({ error: "Ad soyad ve telefon gerekli." });
    return;
  }

  if (!/^\+905\d{9}$/.test(customerPhone)) {
    res.status(400).json({ error: "Cep telefonunu 5xxxxxxxxx formatında gir." });
    return;
  }

  if (!serviceDate || !serviceTime) {
    res.status(400).json({ error: "Rezervasyon tarihi ve saati gerekli." });
    return;
  }

  if (totalAmount <= 0) {
    res.status(400).json({ error: "Rezervasyon bedeli 0'dan büyük olmalı." });
    return;
  }

  const reservation = addReservation({
    id: crypto.randomUUID(),
    shortId: String(Date.now()).slice(-6),
    venueId,
    listingId: String(body.listingId || venueId),
    venueName: String(body.venueName || body.listingName || "İşletme").trim(),
    category: String(body.category || "").trim(),
    categoryLabel: String(body.categoryLabel || "").trim(),
    serviceLabel: String(body.serviceLabel || body.categoryLabel || "Rezervasyon").trim(),
    serviceDate,
    serviceTime,
    customerId: user?.id || "",
    customerName,
    customerEmail,
    customerPhone,
    note: String(body.note || "").trim(),
    totalAmount: billing.totalAmount,
    paymentMode,
    paymentModeLabel: billing.paymentModeLabel,
    paymentStatus:
      paymentMode === PAYMENT_MODES.VENUE_PAYMENT ? "no_online_payment" : "sandbox_collected",
    status: "confirmed",
    billing,
  });

  const venueOwnerContact = getVenueOwnerContact(venueId);
  const reservationSmsMessages = createReservationSmsMessages(reservation);
  const [emailDelivery, customerSmsDelivery, ownerSmsDelivery] = await Promise.all([
    sendEmail({
      to: customerEmail || "info@tyee.app",
      template: "reservation-confirmation",
      subject: `tyee rezervasyonun alındı: ${reservation.venueName}`,
      text: `Merhaba ${customerName},\n\n${reservation.venueName} için ${serviceDate} ${serviceTime} rezervasyonun alındı.\n\nÖdeme modeli: ${billing.paymentModeLabel}\nToplam bedel: ${formatCurrency(billing.totalAmount)}\ntyee komisyonu: ${formatCurrency(billing.commissionAmount)}\n\n${billing.settlement}\n\ntyee ekibi`,
    }),
    sendMessage({
      channel: "sms",
      to: customerPhone,
      template: "reservation-confirmation-customer",
      body: reservationSmsMessages.customer,
    }),
    sendMessage({
      channel: "sms",
      to: venueOwnerContact.phone,
      template: "reservation-notification-owner",
      body: reservationSmsMessages.owner,
    }),
  ]);

  res.status(201).json({
    message: "Rezervasyon oluşturuldu.",
    reservation,
    transaction: formatReservationTransaction(reservation),
    notifications: {
      email: summarizeNotificationDelivery(emailDelivery),
      customerSms: summarizeNotificationDelivery(customerSmsDelivery),
      ownerSms: summarizeNotificationDelivery(ownerSmsDelivery),
    },
  });
});

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email || "");
  const phoneInput = String(req.body.phone || "").trim();
  const phone = phoneInput ? normalizePhoneNumber(phoneInput) : "";
  const password = String(req.body.password || "");
  const role = req.body.role === "venue" ? "venue" : "customer";

  if (!name || !email || password.length < 6) {
    res.status(400).json({ error: "Ad, e-posta ve en az 6 karakter şifre gerekli." });
    return;
  }

  if (phoneInput && !/^\+905\d{9}$/.test(phone)) {
    res.status(400).json({ error: "Cep telefonunu 05xxxxxxxxx veya +905xxxxxxxxx formatında gir." });
    return;
  }

  if (findUserByEmail(email)) {
    res.status(409).json({
      code: "EMAIL_EXISTS",
      error: "Bu e-posta ile kayıtlı hesap var. Kayıt yerine giriş yapabilir veya şifreni yenileyebilirsin.",
    });
    return;
  }

  const userId = crypto.randomUUID();
  const user = upsertUser({
    id: userId,
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    canManageVenue: role === "venue",
    isAdmin: false,
    venueId: role === "venue" ? createVenueIdFromUser({ id: userId, email }) : "",
    emailVerified: false,
    phoneVerified: false,
    emailVerificationToken: createToken(18),
    phoneVerificationCode: "",
    passwordResetToken: "",
  });

  const baseUrl = publicBaseUrl(req);
  const token = createSession(user);
  const [emailDelivery, smsDeliveryResult] = await Promise.all([
    sendVerificationEmailForBaseUrl(baseUrl, user),
    sendRegistrationWelcomeSms(user),
  ]);
  const smsDelivery = smsDeliveryResult || { status: "skipped" };

  res.status(201).json({
    token,
    user: normalizeUser(user),
    nextStep: describeRegistrationDelivery(emailDelivery, smsDelivery, phone),
    emailDelivery,
    smsDelivery,
  });
});

app.post("/api/auth/login", (req, res) => {
  const email = resolveLoginEmail(req.body.email || "");
  const password = String(req.body.password || "");
  const loginType = req.body.loginType === "venue" ? "venue" : req.body.loginType === "customer" ? "customer" : "";
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash || user.password)) {
    res.status(401).json({ error: "Kullanıcı bulunamadı veya şifre hatalı." });
    return;
  }

  if (loginType === "customer" && user.canManageVenue && !user.isAdmin) {
    res.status(403).json({
      error: "Bu e-posta işletme hesabı olarak kayıtlı. Lütfen İşletme girişi ile devam et.",
    });
    return;
  }

  if (loginType === "venue" && !user.canManageVenue && !user.isAdmin) {
    res.status(403).json({
      error: "Bu e-posta bireysel müşteri hesabı olarak kayıtlı. İşletme paneli için işletme hesabı gerekli.",
    });
    return;
  }

  const token = createSession(user);
  res.json({ token, user: normalizeUser(user) });
});

app.post("/api/auth/admin-login", (req, res) => {
  const email = resolveLoginEmail(req.body.email || "");
  const password = String(req.body.password || "");
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash || user.password)) {
    res.status(401).json({ error: "E-posta veya şifre hatalı." });
    return;
  }

  if (!user.isAdmin) {
    res.status(403).json({ error: "Bu kullanıcı admin paneli için yetkili değil." });
    return;
  }

  if (!isLocalDemoRequest(req) && hasConfiguredAdminAccessRules() && !hasAdminNetworkAccess(req, user)) {
    res.status(403).json({
      error: "Bu IP veya mobil cihaz admin erişim listesinde değil.",
      ipAddress: getClientIp(req),
    });
    return;
  }

  const token = createSession(user);
  res.json({ token, user: normalizeUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: normalizeUser(req.user) });
});

app.post("/api/auth/enable-venue", requireAuth, (req, res) => {
  res.status(403).json({
    error: "Bireysel hesap işletme hesabına çevrilemez. İşletme paneli için ayrı işletme hesabı gerekir.",
  });
});

app.get("/verify-email", (req, res) => {
  const token = String(req.query.token || "");
  const user = token ? findUserByEmailVerificationToken(token) : null;
  const redirectPath = user?.canManageVenue ? "/venue.html" : "/";

  if (user) {
    upsertUser({
      ...user,
      emailVerified: true,
      emailVerificationToken: "",
    });
  }

  res.redirect(`${redirectPath}?verified=${user ? "success" : "invalid"}`);
});

app.post("/api/auth/verify-email", (req, res) => {
  const token = String(req.body.token || "").trim();
  const target = token ? findUserByEmailVerificationToken(token) : null;

  if (!target) {
    res.status(400).json({ error: "Doğrulama bağlantısı geçersiz veya süresi dolmuş." });
    return;
  }

  const updated = upsertUser({
    ...target,
    emailVerified: true,
    emailVerificationToken: "",
  });
  res.json({ user: normalizeUser(updated), message: "E-posta doğrulandı." });
});

app.post("/api/auth/resend-verification", requireAuth, async (req, res) => {
  let user = req.user;
  if (!user.emailVerificationToken) {
    user = upsertUser({ ...user, emailVerificationToken: createToken(18) });
  }
  const emailDelivery = await sendVerificationEmail(req, user);
  res.json({
    message: describeEmailDelivery(
      emailDelivery,
      "Doğrulama e-postası tekrar gönderildi.",
      "E-posta sağlayıcısı tanımlı olmadığı için doğrulama linki admin posta kutusuna kaydedildi.",
    ),
    emailDelivery: {
      provider: emailDelivery.provider,
      status: emailDelivery.status,
      error: emailDelivery.error || "",
    },
  });
});

app.post("/api/auth/password-reset/request", async (req, res) => {
  const email = normalizeEmail(req.body.email || "");
  const user = findUserByEmail(email);
  if (user) {
    const resetToken = createToken(24);
    const resetUrl = `${publicBaseUrl(req)}/index.html?resetEmail=${encodeURIComponent(email)}&resetToken=${encodeURIComponent(resetToken)}`;
    const updated = upsertUser({
      ...user,
      passwordResetToken: resetToken,
      passwordResetExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    const emailDelivery = await sendEmail({
      to: updated.email,
      template: "password-reset",
      ...passwordResetEmailTemplate({ name: updated.name, resetToken, resetUrl }),
    });
    res.json({
      message: describeEmailDelivery(
        emailDelivery,
        "Şifre yenileme bağlantısı e-posta adresine gönderildi.",
        "Şifre yenileme bağlantısı hazırlandı. Geliştirme ortamında admin posta kutusuna kaydedildi.",
      ),
    });
    return;
  }
  res.json({ message: "Hesap varsa şifre sıfırlama e-postası gönderildi." });
});

app.post("/api/auth/password-reset/confirm", (req, res) => {
  const email = normalizeEmail(req.body.email || "");
  const resetToken = String(req.body.token || "").trim();
  const password = String(req.body.password || "");
  const user = findUserByEmail(email);
  const expiresAt = user?.passwordResetExpiresAt ? new Date(user.passwordResetExpiresAt).getTime() : 0;
  const isExpired = !expiresAt || expiresAt < Date.now();

  if (!user || !user.passwordResetToken || user.passwordResetToken !== resetToken || isExpired || password.length < 6) {
    res.status(400).json({ error: "Kod geçersiz, süresi dolmuş veya şifre en az 6 karakter değil." });
    return;
  }

  upsertUser({
    ...user,
    passwordHash: hashPassword(password),
    passwordResetToken: "",
    passwordResetExpiresAt: "",
  });
  res.json({ message: "Şifre güncellendi." });
});

app.get("/api/venue/bootstrap", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.query.venue);
  res.json(mergeVenuePayload(venueId, req.user));
});

app.get("/api/venue/assistant", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.query.venueId || req.query.venue);
  const payload = mergeVenuePayload(venueId, req.user);
  res.json(buildVenueAssistantPayload(payload));
});

app.post("/api/venue/assistant/chat", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId || req.query.venueId);
  const payload = mergeVenuePayload(venueId, req.user);
  const question = String(req.body?.question || "").trim();
  res.json({
    answer: buildVenueAssistantAnswer(question, payload),
    context: buildVenueAssistantPayload(payload),
  });
});

app.post("/api/venue/assistant/sms-draft", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId || req.query.venueId);
  const payload = mergeVenuePayload(venueId, req.user);
  res.json({
    draft: buildVenueSmsDraft(payload, {
      segment: req.body?.segment,
      message: req.body?.message,
    }),
  });
});

app.post("/api/venue/assistant/sms-send", requireVenueAccess, async (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId || req.query.venueId);
  const payload = mergeVenuePayload(venueId, req.user);
  const confirm = req.body?.confirm === true;
  const segment = String(req.body?.segment || "all");
  const message = String(req.body?.message || "").trim().slice(0, 320);
  const recipients = getVenueSmsRecipients(payload, segment);

  if (!confirm) {
    res.status(400).json({ error: "Toplu SMS göndermek için son onay gerekli." });
    return;
  }

  if (!message || message.length < 10) {
    res.status(400).json({ error: "SMS metni en az 10 karakter olmalı." });
    return;
  }

  if (!recipients.length) {
    res.status(400).json({ error: "Telefonu kayıtlı uygun müşteri bulunamadı." });
    return;
  }

  const deliveries = (
    await Promise.all(
      recipients.map((recipient) =>
        sendMessage({
          channel: "sms",
          to: recipient.phone,
          template: "venue-bulk-campaign",
          body: message,
        }),
      ),
    )
  ).filter(Boolean);

  res.json({
    message: `${deliveries.length} müşteriye SMS gönderim kaydı oluşturuldu.`,
    status: getMessagingStatus().sms === "twilio" ? "sent" : "dev-queued",
    deliveredCount: deliveries.length,
    recipientCount: recipients.length,
    deliveries: deliveries.slice(0, 8).map((delivery) => ({
      id: delivery.id,
      provider: delivery.provider,
      status: delivery.status,
      to: delivery.to,
      sid: delivery.sid || "",
      error: delivery.error || "",
    })),
  });
});

app.post("/api/venue/avatar/session", requireVenueAccess, async (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId || req.query.venueId);
  const simliFaceId = process.env.SIMLI_FACE_ID_TYEE || DEFAULT_SIMLI_FACE_ID;
  const hasDirectSimli = Boolean(String(process.env.SIMLI_API_KEY || "").trim() && String(simliFaceId || "").trim());
  const simliEnabled =
    hasDirectSimli || ["1", "true", "yes", "ready"].includes(String(process.env.SIMLI_ENABLED || "").toLowerCase());
  const sessionEndpoint = String(process.env.SIMLI_SESSION_ENDPOINT || "").trim();
  const configuredStageUrl = String(process.env.SIMLI_STAGE_URL || "").trim();
  const payload = mergeVenuePayload(venueId, req.user);
  const assistantContext = buildVenueAssistantPayload(payload);

  if (!simliEnabled) {
    res.json({
      provider: "simli",
      status: "not_configured",
      assistantName: ASSISTANT_DISPLAY_NAME,
      message: `Simli canlı avatar bağlantısı için ortam yapılandırması bekleniyor. ${ASSISTANT_DISPLAY_NAME} operasyon önerilerini vermeye devam ediyor.`,
      contextEndpoint: "/api/venue/assistant",
      chatEndpoint: "/api/venue/assistant/chat",
      assistantContext,
    });
    return;
  }

  if (sessionEndpoint) {
    try {
      const response = await fetch(sessionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.SIMLI_SERVER_TOKEN ? { Authorization: `Bearer ${process.env.SIMLI_SERVER_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          provider: "simli",
          avatarName: req.body?.avatarName || ASSISTANT_DISPLAY_NAME,
          avatarVoice: req.body?.avatarVoice || "shimmer",
          simliFaceId,
          language: "tr",
          context: assistantContext,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Simli oturumu başlatılamadı.");
      }
      res.json({
        provider: "simli",
        status: "ready",
        assistantName: ASSISTANT_DISPLAY_NAME,
        sessionUrl: data.sessionUrl || data.stageUrl || data.url || "",
        message: data.message || `${ASSISTANT_DISPLAY_NAME} canlı avatar oturumu hazır.`,
        contextEndpoint: "/api/venue/assistant",
        chatEndpoint: "/api/venue/assistant/chat",
        assistantContext,
      });
      return;
    } catch (error) {
      res.status(502).json({
        error: error.message || "Simli bağlantısı kurulamadı.",
        provider: "simli",
        status: "failed",
      });
      return;
    }
  }

  if (hasDirectSimli) {
    try {
      res.json(
        await buildDirectSimliSessionResponse({
          scope: "venue",
          assistantContext,
          sourcePayload: payload,
          avatarName: req.body?.avatarName || ASSISTANT_DISPLAY_NAME,
          simliFaceId,
          greetingText: `Merhaba, ben ${ASSISTANT_DISPLAY_NAME}. İşletme panelini okuyorum; boş saat, müşteri ve kampanya tarafında sana yardımcı olacağım.`,
        }),
      );
      return;
    } catch (error) {
      res.status(502).json({
        error: error.message || "Simli bağlantısı kurulamadı.",
        provider: "simli",
        status: "failed",
      });
      return;
    }
  }

  if (configuredStageUrl) {
    res.json({
      provider: "simli",
      status: "ready",
      assistantName: ASSISTANT_DISPLAY_NAME,
      stageUrl: configuredStageUrl,
      message: `${ASSISTANT_DISPLAY_NAME} canlı avatar sahnesi hazır.`,
      contextEndpoint: "/api/venue/assistant",
      chatEndpoint: "/api/venue/assistant/chat",
      assistantContext,
    });
    return;
  }

  res.json({
    provider: "simli",
    status: "waiting_for_stage",
    assistantName: ASSISTANT_DISPLAY_NAME,
    message: "Simli açık görünüyor ama oturum sahnesi için SIMLI_SESSION_ENDPOINT veya SIMLI_STAGE_URL eksik.",
    contextEndpoint: "/api/venue/assistant",
    chatEndpoint: "/api/venue/assistant/chat",
    assistantContext,
  });
});

app.get("/api/customer/assistant", (req, res) => {
  const user = getUserFromRequest(req);
  const category = String(req.query.category || "all");
  const city = String(req.query.city || "istanbul");
  const query = String(req.query.query || "");
  res.json(buildCustomerAssistantPayload({ user, category, city, query }));
});

app.post("/api/customer/assistant/chat", (req, res) => {
  const user = getUserFromRequest(req);
  const category = String(req.body?.category || "all");
  const city = String(req.body?.city || "istanbul");
  const query = String(req.body?.query || "");
  const question = String(req.body?.question || "").trim();
  const context = buildCustomerAssistantPayload({ user, category, city, query });
  res.json({
    answer: buildCustomerAssistantAnswer(question, context),
    context,
  });
});

app.post("/api/customer/avatar/session", async (req, res) => {
  const user = getUserFromRequest(req);
  const category = String(req.body?.category || "all");
  const city = String(req.body?.city || "istanbul");
  const query = String(req.body?.query || "");
  const simliFaceId = process.env.SIMLI_FACE_ID_TYEE || DEFAULT_SIMLI_FACE_ID;
  const hasDirectSimli = Boolean(String(process.env.SIMLI_API_KEY || "").trim() && String(simliFaceId || "").trim());
  const simliEnabled =
    hasDirectSimli || ["1", "true", "yes", "ready"].includes(String(process.env.SIMLI_ENABLED || "").toLowerCase());
  const sessionEndpoint = String(process.env.SIMLI_SESSION_ENDPOINT || "").trim();
  const configuredStageUrl = String(process.env.SIMLI_STAGE_URL || "").trim();
  const assistantContext = buildCustomerAssistantPayload({ user, category, city, query });

  if (!simliEnabled) {
    res.json({
      provider: "simli",
      status: "not_configured",
      assistantName: ASSISTANT_DISPLAY_NAME,
      message: `Simli canlı avatar bağlantısı için ortam yapılandırması bekleniyor. ${ASSISTANT_DISPLAY_NAME} rezervasyon önerilerini vermeye devam ediyor.`,
      contextEndpoint: "/api/customer/assistant",
      chatEndpoint: "/api/customer/assistant/chat",
      assistantContext,
    });
    return;
  }

  if (sessionEndpoint) {
    try {
      const response = await fetch(sessionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.SIMLI_SERVER_TOKEN ? { Authorization: `Bearer ${process.env.SIMLI_SERVER_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          provider: "simli",
          avatarName: req.body?.avatarName || ASSISTANT_DISPLAY_NAME,
          avatarVoice: req.body?.avatarVoice || "shimmer",
          simliFaceId,
          language: "tr",
          context: assistantContext,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Simli oturumu başlatılamadı.");
      }
      res.json({
        provider: "simli",
        status: "ready",
        assistantName: ASSISTANT_DISPLAY_NAME,
        sessionUrl: data.sessionUrl || data.stageUrl || data.url || "",
        message: data.message || `${ASSISTANT_DISPLAY_NAME} canlı avatar oturumu hazır.`,
        contextEndpoint: "/api/customer/assistant",
        chatEndpoint: "/api/customer/assistant/chat",
        assistantContext,
      });
      return;
    } catch (error) {
      res.status(502).json({
        error: error.message || "Simli bağlantısı kurulamadı.",
        provider: "simli",
        status: "failed",
      });
      return;
    }
  }

  if (hasDirectSimli) {
    try {
      res.json(
        await buildDirectSimliSessionResponse({
          scope: "customer",
          assistantContext,
          avatarName: req.body?.avatarName || ASSISTANT_DISPLAY_NAME,
          simliFaceId,
          greetingText: `Merhaba, ben ${ASSISTANT_DISPLAY_NAME}. Yakınındaki işletmeleri, kategorileri ve rezervasyonlarını birlikte yönetebiliriz.`,
        }),
      );
      return;
    } catch (error) {
      res.status(502).json({
        error: error.message || "Simli bağlantısı kurulamadı.",
        provider: "simli",
        status: "failed",
      });
      return;
    }
  }

  if (configuredStageUrl) {
    res.json({
      provider: "simli",
      status: "ready",
      assistantName: ASSISTANT_DISPLAY_NAME,
      stageUrl: configuredStageUrl,
      message: `${ASSISTANT_DISPLAY_NAME} canlı avatar sahnesi hazır.`,
      contextEndpoint: "/api/customer/assistant",
      chatEndpoint: "/api/customer/assistant/chat",
      assistantContext,
    });
    return;
  }

  res.json({
    provider: "simli",
    status: "waiting_for_stage",
    assistantName: ASSISTANT_DISPLAY_NAME,
    message: "Simli açık görünüyor ama oturum sahnesi için SIMLI_SESSION_ENDPOINT veya SIMLI_STAGE_URL eksik.",
    contextEndpoint: "/api/customer/assistant",
    chatEndpoint: "/api/customer/assistant/chat",
    assistantContext,
  });
});

app.get("/ada-live.html", (req, res) => {
  const sessionToken = String(req.query.sessionToken || "").trim();
  const adaSessionId = String(req.query.adaSessionId || "").trim();
  const avatarName = String(req.query.avatarName || ASSISTANT_DISPLAY_NAME).trim() || ASSISTANT_DISPLAY_NAME;
  const liveSession = getAdaLiveSession(adaSessionId);

  if (!sessionToken || !liveSession) {
    res.status(400).type("html").send(`<!doctype html><meta charset="utf-8"><body>${ASSISTANT_DISPLAY_NAME} canlı oturumu bulunamadı.</body>`);
    return;
  }

  res
    .set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
    })
    .type("html")
    .send(
      buildAdaLiveStagePage({
        sessionToken,
        adaSessionId,
        avatarName,
        greetingText: liveSession.greetingText,
      }),
    );
});

app.post("/api/ada/live/reply", (req, res) => {
  const liveSession = getAdaLiveSession(req.body?.adaSessionId);
  const message = String(req.body?.message || "").trim();

  if (!liveSession) {
    res.status(404).json({ error: `${ASSISTANT_DISPLAY_NAME} canlı oturumu bulunamadı.` });
    return;
  }

  if (!message) {
    res.status(400).json({ error: "Mesaj gerekli." });
    return;
  }

  const context = liveSession.assistantContext || {};
  const replyText =
    liveSession.scope === "venue"
      ? buildVenueAssistantAnswer(message, context.payload || context)
      : buildCustomerAssistantAnswer(message, context);
  res.json({ replyText });
});

app.post("/api/ada/live/speech", async (req, res) => {
  const liveSession = getAdaLiveSession(req.body?.adaSessionId);
  const text = String(req.body?.text || "").trim();

  if (!liveSession) {
    res.status(404).json({ error: `${ASSISTANT_DISPLAY_NAME} canlı oturumu bulunamadı.` });
    return;
  }

  if (!text) {
    res.status(400).json({ error: "Ses için metin gerekli." });
    return;
  }

  try {
    const audio = await requestOpenAiSpeechPcm(text);
    res.set({
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Audio-Format": "pcm_s16le",
      "X-Audio-Sample-Rate": String(OPENAI_TTS_SAMPLE_RATE),
      "X-Simli-Audio-Sample-Rate": String(SIMLI_AUDIO_SAMPLE_RATE),
    });
    res.send(audio);
  } catch (error) {
    res.status(503).json({ error: error.message || `${ASSISTANT_DISPLAY_NAME} sesi üretilemedi.` });
  }
});

app.get("/api/venue/clients", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.query.venueId);
  const payload = mergeVenuePayload(venueId, req.user);
  res.json(payload.clients || { items: [], segments: [], loyalty: [] });
});

app.get("/api/venue/calendar-ops", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.query.venueId);
  const payload = mergeVenuePayload(venueId, req.user);
  res.json(payload.calendarOps || buildVenueCalendarOpsPayload({ payload }));
});

app.patch("/api/venue/calendar-preferences", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId);
  const overlay = saveVenueOverlay(venueId, {
    calendarPreferences: normalizeCalendarPreferences(req.body?.preferences || {}),
  });
  const payload = mergeVenuePayload(venueId, req.user);
  res.json(payload.calendarOps || buildVenueCalendarOpsPayload({ payload, overlay }));
});

app.post("/api/venue/waitlist", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId);
  const payload = mergeVenuePayload(venueId, req.user);
  const overlay = getVenueOverlay(venueId);
  const currentItems = Array.isArray(overlay.waitlist)
    ? overlay.waitlist.map((item, index) => normalizeWaitlistItem(item, index, payload))
    : payload.calendarOps?.waitlist?.items || [];
  const item = normalizeWaitlistItem({
    id: crypto.randomUUID(),
    name: req.body?.name,
    phone: req.body?.phone,
    service: req.body?.service,
    preferredWindow: req.body?.preferredWindow,
    status: req.body?.status || "waiting",
    priority: req.body?.priority || "normal",
    note: req.body?.note,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, 0, payload);
  const savedOverlay = saveVenueOverlay(venueId, {
    waitlist: [item, ...currentItems].slice(0, 50),
  });
  const nextPayload = mergeVenuePayload(venueId, req.user);
  res.status(201).json(nextPayload.calendarOps || buildVenueCalendarOpsPayload({ payload: nextPayload, overlay: savedOverlay }));
});

app.patch("/api/venue/waitlist/:id", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId);
  const payload = mergeVenuePayload(venueId, req.user);
  const overlay = getVenueOverlay(venueId);
  const currentItems = Array.isArray(overlay.waitlist)
    ? overlay.waitlist.map((item, index) => normalizeWaitlistItem(item, index, payload))
    : payload.calendarOps?.waitlist?.items || [];
  const index = currentItems.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    res.status(404).json({ error: "Bekleme listesi kaydı bulunamadı." });
    return;
  }
  currentItems[index] = normalizeWaitlistItem({
    ...currentItems[index],
    status: req.body?.status || currentItems[index].status,
    priority: req.body?.priority || currentItems[index].priority,
    note: req.body?.note ?? currentItems[index].note,
    updatedAt: new Date().toISOString(),
  }, index, payload);
  const savedOverlay = saveVenueOverlay(venueId, { waitlist: currentItems });
  const nextPayload = mergeVenuePayload(venueId, req.user);
  res.json(nextPayload.calendarOps || buildVenueCalendarOpsPayload({ payload: nextPayload, overlay: savedOverlay }));
});

app.get("/api/venue/reports", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.query.venueId);
  res.json(createVenueReport({
    venueId,
    user: req.user,
    period: String(req.query.period || "Bu ay"),
  }));
});

app.post("/api/venue/expenses", requireVenueAccess, (req, res) => {
  const body = req.body || {};
  const venueId = resolveVenueIdForRequest(req, body.venueId);
  const title = String(body.title || "").trim();
  const amount = parseMoney(body.amount);

  if (!title) {
    res.status(400).json({ error: "Gider adı gerekli." });
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "Gider tutarı sıfırdan büyük olmalı." });
    return;
  }

  const overlay = getVenueOverlay(venueId);
  const expenses = getVenueExpenseItems(overlay);
  const expense = normalizeVenueExpense({
    id: crypto.randomUUID(),
    title,
    amount,
    category: body.category,
    month: body.month,
    createdAt: new Date().toISOString(),
  });

  saveVenueOverlay(venueId, {
    expenses: [expense, ...expenses].slice(0, 240),
  });

  const payload = mergeVenuePayload(venueId, req.user);
  res.status(201).json({ finance: payload.finance });
});

app.patch("/api/venue/reviews/:id/note", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId);
  const reviewId = String(req.params.id || "").trim();
  const note = String(req.body?.note || "").trim();
  const currentPayload = mergeVenuePayload(venueId, req.user);
  const reviewExists = (currentPayload.reviews || []).some((review) => String(review.id) === reviewId);

  if (!reviewId || !reviewExists) {
    res.status(404).json({ error: "Değerlendirme bulunamadı." });
    return;
  }

  const overlay = getVenueOverlay(venueId);
  const reviewNotes = overlay.reviewNotes && typeof overlay.reviewNotes === "object" ? { ...overlay.reviewNotes } : {};
  if (note) {
    reviewNotes[reviewId] = { note, updatedAt: new Date().toISOString() };
  } else {
    delete reviewNotes[reviewId];
  }

  saveVenueOverlay(venueId, { reviewNotes });
  const payload = mergeVenuePayload(venueId, req.user);
  res.json({
    reviews: payload.reviews || [],
    reviewSummary: payload.reviewSummary || {},
    message: note ? "Not kaydedildi." : "Not temizlendi.",
  });
});

app.post("/api/venue/reservations/:id/complete", requireVenueAccess, async (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.body?.venueId);
  const reservation = getReservations().find(
    (item) => item.id === req.params.id && item.venueId === venueId,
  );

  if (!reservation) {
    res.status(404).json({ error: "Rezervasyon bulunamadı." });
    return;
  }

  if (reservation.status === "completed") {
    const payload = mergeVenuePayload(venueId, req.user);
    res.json({
      reservation,
      transaction: formatReservationTransaction(reservation),
      reviews: payload.reviews || [],
      reviewSummary: payload.reviewSummary || {},
    });
    return;
  }

  const reviewToken = reservation.reviewToken || createToken(18);
  const nextReservation = updateReservation(reservation.id, {
    status: "completed",
    completedAt: new Date().toISOString(),
    reviewStatus: "requested",
    reviewRequestedAt: new Date().toISOString(),
    reviewToken,
  });
  const reviewUrl = `${req.protocol}://${req.get("host")}/review.html?token=${reviewToken}`;

  await sendEmail({
    to: nextReservation.customerEmail || "info@tyee.app",
    template: "reservation-review-request",
    subject: `${nextReservation.venueName} deneyimini puanlar mısın?`,
    text: `Merhaba ${nextReservation.customerName || "Tyee kullanıcısı"},\n\n${nextReservation.venueName} rezervasyonun tamamlandı olarak işaretlendi.\n\nTesisten veya hizmet verenden memnun kaldın mı? Kısa bir puan ve yorum bırakırsan diğer kullanıcılar için çok değerli olur.\n\nDeğerlendirme bağlantısı: ${reviewUrl}\n\ntyee ekibi`,
  }).catch(() => null);

  const payload = mergeVenuePayload(venueId, req.user);
  res.json({
    message: "Rezervasyon tamamlandı ve değerlendirme isteği gönderildi.",
    reservation: nextReservation,
    transaction: formatReservationTransaction(nextReservation),
    reviewRequest: { status: "requested", reviewUrl },
    reviews: payload.reviews || [],
    reviewSummary: payload.reviewSummary || {},
  });
});

app.post("/api/reviews", (req, res) => {
  const body = req.body || {};
  const token = String(body.token || "").trim();
  const rating = Number(body.rating);
  const comment = String(body.comment || "").trim();
  const reservation = getReservations().find((item) => item.reviewToken === token);

  if (!reservation || reservation.status !== "completed") {
    res.status(404).json({ error: "Değerlendirme isteği bulunamadı." });
    return;
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Puan 1 ile 5 arasında olmalı." });
    return;
  }

  if (reservation.reviewStatus === "received") {
    res.status(409).json({ error: "Bu rezervasyon için değerlendirme zaten alınmış." });
    return;
  }

  const review = addReview({
    reservationId: reservation.id,
    venueId: reservation.venueId,
    venueName: reservation.venueName,
    customerId: reservation.customerId,
    customerName: reservation.customerName || "Müşteri",
    customerEmail: reservation.customerEmail,
    rating,
    comment,
    serviceLabel: reservation.serviceLabel,
    categoryLabel: reservation.categoryLabel,
    status: "Yayınlandı",
  });

  updateReservation(reservation.id, {
    reviewStatus: "received",
    reviewedAt: review.createdAt,
  });

  res.status(201).json({
    message: "Değerlendirmen alındı.",
    review: formatVenueReview(review),
  });
});

app.patch("/api/venue/slot-state", requireVenueAccess, (req, res) => {
  const body = req.body || {};
  const venueId = resolveVenueIdForRequest(req, body.venueId);
  const overlay = saveVenueOverlay(venueId, {
    slotModes: body.slotModes && typeof body.slotModes === "object" ? body.slotModes : {},
    manualEntries:
      body.manualEntries && typeof body.manualEntries === "object" ? body.manualEntries : {},
    slotServices:
      body.slotServices && typeof body.slotServices === "object" ? body.slotServices : {},
  });
  res.json({
    slotState: {
      slotModes: overlay.slotModes || {},
      manualEntries: overlay.manualEntries || {},
      slotServices: overlay.slotServices || {},
    },
  });
});

app.patch("/api/venue/settings", requireVenueAccess, (req, res) => {
  const body = req.body || {};
  const venueId = resolveVenueIdForRequest(req, body.venueId);
  const settings = body.settings;
  if (!settings || typeof settings !== "object") {
    res.status(400).json({ error: "Ayar bilgisi eksik." });
    return;
  }
  const overlay = saveVenueOverlay(venueId, { settings });
  res.json({ settings: overlay.settings });
});

app.patch("/api/venue/profile", requireVenueAccess, (req, res) => {
  const body = req.body || {};
  const venueId = resolveVenueIdForRequest(req, body.venueId);
  const profile = body.profile;
  if (!profile || typeof profile !== "object") {
    res.status(400).json({ error: "Profil bilgisi eksik." });
    return;
  }
  const overlay = saveVenueOverlay(venueId, { profile });
  res.json({ profile: overlay.profile });
});

app.post("/api/venue/billing-addresses", requireVenueAccess, (req, res) => {
  const body = req.body || {};
  const venueId = resolveVenueIdForRequest(req, body.venueId);
  const overlay = getVenueOverlay(venueId);
  const billingAddresses = Array.isArray(overlay.billingAddresses) ? overlay.billingAddresses : [];
  const item = {
    id: crypto.randomUUID(),
    label: String(body.label || "Yeni adres").trim(),
    type: String(body.type || "Bireysel").trim(),
    city: String(body.city || "İstanbul").trim(),
    district: String(body.district || "").trim(),
    name: String(body.name || "").trim(),
    identityNumber: String(body.identityNumber || "").trim(),
    taxOffice: String(body.taxOffice || "").trim(),
    taxNumber: String(body.taxNumber || "").trim(),
    address: String(body.address || "").trim(),
  };
  const nextAddresses = [item, ...billingAddresses];
  saveVenueOverlay(venueId, { billingAddresses: nextAddresses });
  res.status(201).json({ billingAddresses: nextAddresses });
});

app.get("/api/admin/bootstrap", requireAdmin, (req, res) => {
  res.json(buildAdminBootstrap(req));
});

app.get("/api/admin/search", requireAdmin, (req, res) => {
  res.json({
    items: getAdminSearchResults({
      type: String(req.query.type || "all"),
      query: String(req.query.q || ""),
    }),
  });
});

app.patch("/api/admin/users/:id/role", requireAdmin, (req, res) => {
  const target = findUserById(String(req.params.id || ""));
  const role = String(req.body.role || "");

  if (!target) {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
    return;
  }

  if (!["customer", "venue"].includes(role)) {
    res.status(400).json({ error: "Rol bireysel veya işletme olmalı." });
    return;
  }

  if (target.isAdmin) {
    res.status(400).json({ error: "Admin hesabının rolü bu ekrandan değiştirilemez." });
    return;
  }

  const updated = upsertUser({
    ...target,
    canManageVenue: role === "venue",
    isAdmin: false,
    venueId: role === "venue" ? getUserVenueId({ ...target, canManageVenue: true }) : target.venueId || "",
  });

  res.json({
    message: role === "venue" ? "Kullanıcı işletme yetkilisi yapıldı." : "Kullanıcı bireysel müşteri yapıldı.",
    user: formatAdminUser(updated),
  });
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const target = findUserById(String(req.params.id || ""));

  if (!target) {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
    return;
  }

  if (target.isAdmin) {
    res.status(400).json({ error: "Admin hesabı silinemez." });
    return;
  }

  const deleted = deleteUserById(target.id);
  if (!deleted || deleted.protected) {
    res.status(400).json({ error: "Kullanıcı silinemedi." });
    return;
  }

  sessions.forEach((session, token) => {
    if (session.userId === target.id) sessions.delete(token);
  });

  res.json({
    message: "Kullanıcı hesabı silindi.",
    user: formatAdminUser(target),
  });
});

app.delete("/api/admin/businesses/:id", requireAdmin, (req, res) => {
  const venueId = String(req.params.id || "").trim();
  const business = getAdminBusinessDirectory().find((item) => item.id === venueId);

  if (!business) {
    res.status(404).json({ error: "İşletme kaydı bulunamadı." });
    return;
  }

  deleteVenueRecord(venueId);

  res.json({
    message: "İşletme kaydı dizinden kaldırıldı. Bağlı kullanıcı hesabı ayrıca silinebilir.",
    business,
  });
});

app.post("/api/admin/access-rules", requireAdmin, (req, res) => {
  const body = req.body || {};
  const label = String(body.label || "").trim();
  const email = normalizeEmail(body.email || "");
  const ipAddress = String(body.ipAddress || "").trim();
  const mobileToken = String(body.mobileToken || "").trim();
  const note = String(body.note || "").trim();
  const isActive = body.isActive !== false;

  if (!label) {
    res.status(400).json({ error: "Yetkili adı gerekli." });
    return;
  }

  if (!ipAddress && !mobileToken) {
    res.status(400).json({ error: "IP adresi veya mobil uygulama anahtarı gerekli." });
    return;
  }

  const rule = upsertAdminAccessRule({
    label,
    email,
    ipAddress,
    mobileToken,
    note,
    isActive,
  });

  res.status(201).json({
    message: "Admin erişim yetkilisi eklendi.",
    rule: safeAdminAccessRule(rule),
    access: {
      currentIp: getClientIp(req),
      rules: getAllAdminAccessRules().map(safeAdminAccessRule),
    },
  });
});

app.delete("/api/admin/access-rules/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id || "");
  const rule = getAllAdminAccessRules().find((item) => item.id === id);

  if (!rule) {
    res.status(404).json({ error: "Yetkili erişim kaydı bulunamadı." });
    return;
  }

  if (rule.source === "env") {
    res.status(400).json({ error: "Environment variable ile gelen kayıt panelden silinemez." });
    return;
  }

  deleteAdminAccessRule(id);

  res.json({
    message: "Admin erişim yetkilisi silindi.",
    access: {
      currentIp: getClientIp(req),
      rules: getAllAdminAccessRules().map(safeAdminAccessRule),
    },
  });
});

app.post("/api/admin/password-reset", requireAdmin, async (req, res) => {
  const target =
    (req.body.userId && findUserById(String(req.body.userId))) ||
    (req.body.email && findUserByEmail(resolveLoginEmail(req.body.email))) ||
    null;
  const password = String(req.body.password || createSmsCode()).trim();

  if (!target) {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Yeni şifre en az 6 karakter olmalı." });
    return;
  }

  const updated = upsertUser({
    ...target,
    passwordHash: hashPassword(password),
    passwordResetToken: "",
  });

  const emailDelivery = await sendEmail({
    to: updated.email,
    template: "admin-password-reset",
    subject: "tyee geçici şifre",
    text: `Merhaba ${updated.name}, tyee hesabın için geçici şifre: ${password}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#101828">
        <h1 style="margin:0 0 12px;font-size:24px">Geçici şifre oluşturuldu</h1>
        <p>Merhaba ${updated.name}, tyee hesabın için geçici şifren aşağıdadır.</p>
        <strong style="display:inline-block;font-size:22px;letter-spacing:2px">${password}</strong>
      </div>
    `,
  });

  res.json({
    message: "Şifre güncellendi ve e-posta gönderimi hazırlandı.",
    user: formatAdminUser(updated),
    temporaryPassword: password,
    emailDelivery: {
      provider: emailDelivery.provider,
      status: emailDelivery.status,
      error: emailDelivery.error || "",
    },
  });
});

app.post("/api/admin/notifications", requireAdmin, async (req, res) => {
  const body = req.body || {};
  const channel = ["sms", "whatsapp", "email"].includes(body.channel) ? body.channel : "email";
  const targetType = String(body.targetType || "all");
  const subject = String(body.subject || "tyee bildirimi").trim();
  const message = String(body.message || "").trim();

  if (!message) {
    res.status(400).json({ error: "Bildirim mesajı gerekli." });
    return;
  }

  const users = buildAdminBootstrap().users;
  let recipients = users;
  if (targetType === "customer") recipients = users.filter((user) => !user.isAdmin && !user.canManageVenue);
  if (targetType === "venue") recipients = users.filter((user) => user.canManageVenue);
  if (body.targetId) recipients = users.filter((user) => user.id === body.targetId || user.venueId === body.targetId);

  const delivered = (
    await Promise.all(
      recipients.map((recipient) => {
        if (channel === "sms") {
          if (!recipient.phone) return null;
          return sendMessage({
            channel: "sms",
            to: recipient.phone,
            template: "admin-notification",
            body: message,
          });
        }

        if (channel === "whatsapp") {
          if (!recipient.phone) return null;
          return sendMessage({
            channel: "whatsapp",
            to: recipient.phone,
            template: "admin-notification",
            body: message,
          });
        }

        return sendEmail({
          to: recipient.email,
          template: "admin-notification",
          subject,
          text: message,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#101828">
              <h1 style="margin:0 0 12px;font-size:24px">${subject}</h1>
              <p>${message}</p>
            </div>
          `,
        });
      }),
    )
  )
    .filter(Boolean);
  const skippedCount = recipients.length - delivered.length;

  res.status(201).json({
    message: `${delivered.length} bildirim hazırlandı${
      skippedCount ? `, ${skippedCount} alıcıda telefon olmadığı için atlandı` : ""
    }. E-posta: ${getEmailStatus().provider}, SMS: ${getMessagingStatus().sms}, WhatsApp: ${getMessagingStatus().whatsapp}.`,
    deliveredCount: delivered.length,
    skippedCount,
  });
});

app.get("/api/admin/reports", requireAdmin, (req, res) => {
  res.json(
    createAdminReport({
      venueId: String(req.query.venueId || "all"),
      period: String(req.query.period || "Bu ay"),
    }),
  );
});

app.get("/api/admin/dev-outbox", requireAdmin, (_req, res) => {
  res.json(getDevOutbox());
});

app.get("/api/admin/email-diagnostics", requireAdmin, async (_req, res) => {
  res.json(await diagnoseEmailTransport());
});

app.post("/api/admin/email-test", requireAdmin, async (req, res) => {
  const to = normalizeEmail(req.body.to || "info@tyee.app");
  if (!to) {
    res.status(400).json({ error: "Test e-postasi icin alici adres gerekli." });
    return;
  }

  const sentAt = new Date().toISOString();
  const emailDelivery = await sendEmail({
    to,
    template: "admin-email-test",
    subject: "tyee mail gonderim testi",
    text: `tyee mail gonderim testi basarili.\n\nAlici: ${to}\nZaman: ${sentAt}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#101828">
        <img src="https://tyee.app/assets/tyee.png" alt="tyee" style="height:34px;margin-bottom:24px" />
        <h1 style="margin:0 0 12px;font-size:24px">tyee mail gönderim testi</h1>
        <p>Bu e-posta, admin panelinden canlı gönderim kanalını doğrulamak için oluşturuldu.</p>
        <p><strong>Alıcı:</strong> ${to}</p>
        <p><strong>Zaman:</strong> ${sentAt}</p>
      </div>
    `,
  });

  const sent = emailDelivery.status === "sent";
  const queued = emailDelivery.status === "dev-queued";
  res.status(sent ? 201 : queued ? 202 : 502).json({
    message: sent
      ? "Test e-postasi gonderildi."
      : queued
        ? "Test e-postasi gelistirme posta kutusuna kaydedildi."
        : "Test e-postasi gonderilemedi.",
    delivery: {
      provider: emailDelivery.provider,
      status: emailDelivery.status,
      to: emailDelivery.to,
      template: emailDelivery.template,
      error: emailDelivery.error || "",
      sentAt: emailDelivery.sentAt || "",
    },
  });
});

app.use((req, res, next) => {
  if (req.method !== "GET") {
    next();
    return;
  }
  sendIndex(res);
});

app.listen(port, () => {
  console.log(`tyee local server: http://127.0.0.1:${port}`);
});
