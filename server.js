const crypto = require("crypto");
const express = require("express");
const path = require("path");

const {
  filterListings,
  getAdminDashboardPayload,
  getBootstrapPayload,
  getNearbyMapPayload,
  getVenueDashboardPayload,
} = require("./data/store");

const {
  deleteAdminAccessRule,
  deleteUserById,
  deleteVenueRecord,
  findUserByEmail,
  findUserByEmailVerificationToken,
  findUserById,
  getAdminAccessRules,
  getDeletedVenueIds,
  getUsers,
  getDevOutbox,
  getVenueOverlay,
  hashPassword,
  migrateLegacyUsers,
  normalizeEmail,
  saveVenueOverlay,
  upsertAdminAccessRule,
  upsertUser,
  verifyPassword,
  ensureSeedUser,
} = require("./data/runtime-store");
const { getEmailStatus, sendEmail } = require("./services/email");
const { getMessagingStatus, sendMessage } = require("./services/messaging");
const {
  PAYMENT_MODES,
  calculateReservationBilling,
  summarizeMonthlyCommission,
} = require("./services/reservation-billing");

const app = express();
const port = Number(process.env.PORT || 8091);
const sessions = new Map();

app.set("trust proxy", true);

function createToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex");
}

function createSmsCode() {
  return String(crypto.randomInt(100000, 999999));
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
  if (!user?.canManageVenue) return user?.venueId || "";
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
  const configured = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  if (configured) return configured.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
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
  const headline = isVenue ? "İşletme hesabın hazır." : "tyee'a hoş geldin.";
  const intro = isVenue
    ? "İşletme hesabın başarıyla oluşturuldu."
    : "Seni gördüğümüze çok sevindik. Artık yakınındaki hizmetleri keşfetmeye, karşılaştırmaya ve zamanı geldiğinde kolayca rezervasyon yapmaya hazırsın.";
  const nextStep = isVenue
    ? "Şimdi profilini, lokasyonunu ve hizmetlerini tamamlayarak müşterilerin tarafından keşfedilmeye başlayabilirsin."
    : "Başlamak için e-postanı doğrula; sonra tyee deneyimini senin için daha kişisel hale getireceğiz.";
  const detail = isVenue
    ? "Tyee, rezervasyonlarını yönetmeni, görünürlüğünü artırmanı ve müşterilerinle daha kolay buluşmanı sağlar."
    : "";
  const ctaLabel = isVenue ? "İşletmeni Aktifleştir" : "E-postamı doğrula";

  return {
    subject: isVenue ? "tyee işletme hesabına hoş geldin" : "tyee'a hoş geldin",
    text: isVenue
      ? `Merhaba ${name},\n\n${intro}\n\n${nextStep}\n\n${detail}\n\n${ctaLabel}: ${verifyUrl}\n\nEk Bilgi\nProfilini tamamlamak yalnızca birkaç dakika sürer.\n\nHerhangi bir sorunda ekibimiz yanında.\n\nTyee Ekibi`
      : `Merhaba ${name},\n\n${intro}\n\n${nextStep}\n\nE-postanı doğrula: ${verifyUrl}\n\ntyee ekibi`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#111827;background:#ffffff">
        <div style="border:1px solid #e7edf5;border-radius:18px;padding:30px;background:#fbfdff">
          <img src="cid:tyee-logo" width="132" alt="tyee" style="display:block;width:132px;max-width:42%;height:auto;margin:0 0 22px;border:0;outline:none;text-decoration:none" />
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;color:#07123d">${headline}</h1>
          <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#344054">Merhaba ${safeName},</p>
          <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#344054">${intro}</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#344054">${nextStep}</p>
          ${isVenue ? `<p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#344054">${detail}</p>` : ""}
          <a href="${safeVerifyUrl}" target="_blank" rel="noopener" style="display:inline-block;margin:0 0 26px;padding:13px 20px;border-radius:12px;background:#248be8;color:#fff;text-decoration:none;font-weight:800">${ctaLabel}</a>
          ${
            isVenue
              ? `<div style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:0 0 24px;padding:20px 0">
                  <p style="margin:0 0 12px;font-size:18px;line-height:1.45;color:#111827;font-weight:800">Ek Bilgi</p>
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#344054">Profilini tamamlamak yalnızca birkaç dakika sürer.</p>
                  <p style="margin:0;font-size:16px;line-height:1.65;color:#344054">Herhangi bir sorunda ekibimiz yanında.</p>
                </div>`
              : ""
          }
          <p style="margin:0;font-size:14px;line-height:1.55;color:#667085">${isVenue ? "" : "Sevgiler,<br />"}<strong style="color:#111827">Tyee Ekibi</strong></p>
        </div>
      </div>
    `,
  };
}

function passwordResetEmailTemplate({ name, resetToken }) {
  return {
    subject: "tyee şifre sıfırlama",
    text: `Merhaba ${name}, şifre sıfırlama kodun: ${resetToken}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#101828">
        <h1 style="margin:0 0 12px;font-size:24px">Şifre sıfırlama</h1>
        <p>Merhaba ${name}, şifre sıfırlama kodun:</p>
        <strong style="display:inline-block;font-size:22px;letter-spacing:2px">${resetToken}</strong>
      </div>
    `,
  };
}

function sendVerificationEmail(req, user) {
  const verifyUrl = `${publicBaseUrl(req)}/verify-email?token=${encodeURIComponent(
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

function describeEmailDelivery(emailDelivery, sentMessage, devMessage) {
  if (emailDelivery?.status === "sent") return sentMessage;
  if (emailDelivery?.status === "dev-queued") return devMessage;
  if (emailDelivery?.status === "failed") return "E-posta hazırlandı ancak gönderim sağlayıcısında hata oluştu.";
  return "E-posta gönderim durumu kaydedildi.";
}

async function sendPhoneVerification(user) {
  if (!user.phone || !user.phoneVerificationCode) return null;
  return sendMessage({
    channel: "sms",
    to: user.phone,
    template: "phone-verification",
    body: `tyee doğrulama kodun: ${user.phoneVerificationCode}`,
  });
}

function seedUsers() {
  migrateLegacyUsers();
  ensureSeedUser("demo@tyee.app", { name: "Demo Kullanıcı", password: "123456" });
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
}

seedUsers();

app.use(express.json({ limit: "8mb" }));

const publicStaticFiles = new Set([
  "admin.css",
  "admin.html",
  "admin.js",
  "app.js",
  "index.html",
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
  if (!session) return null;
  return findUserById(session.userId);
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
  if (!isLocalDemoRequest(req) && !hasAdminNetworkAccess(req, user)) {
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
  const token = createToken();
  sessions.set(token, { userId: user.id, createdAt: Date.now() });
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
      locationStatus: "Girilmemiş",
    };
    payload.subscriptions = [];
    payload.transactions = [];
    payload.quickActions = [];
    payload.weekDays = (payload.weekDays || []).map((day) => ({ ...day, slots: [] }));
  } else {
    payload.isFreshVenue = false;
  }

  if (overlay.settings) payload.settings = overlay.settings;
  if (overlay.profile) payload.profile = overlay.profile;
  if (overlay.billingAddresses) payload.billingAddresses = overlay.billingAddresses;
  if (overlay.media) payload.media = overlay.media;

  payload.slotState = {
    slotModes: overlay.slotModes || {},
    manualEntries: overlay.manualEntries || {},
  };

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
  return getAdminDashboardPayload().venues
    .filter((venue) => !deletedVenueIds.has(venue.id))
    .map((venue) => {
      const dashboard = getVenueDashboardPayload(venue.id);
      return {
        ...venue,
        contactName: dashboard.profile?.fullName || venue.manager || "",
        contactEmail: dashboard.profile?.email || "",
        contactPhone: dashboard.profile?.phone || "",
        sport: dashboard.venue?.sport || venue.category,
        settingsStatus: dashboard.settings?.locationStatus || "Kontrol bekliyor",
        reportUrl: `/api/admin/reports?venueId=${encodeURIComponent(venue.id)}`,
      };
    });
}

function buildAdminBootstrap(req = null) {
  const users = getUsers().map(formatAdminUser);
  const businesses = getAdminBusinessDirectory();
  const customers = users.filter((user) => !user.isAdmin && !user.canManageVenue);
  const dashboard = getAdminDashboardPayload();

  return {
    ...dashboard,
    users,
    customers,
    businesses,
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

  if (type === "customer") {
    payload.customers.filter((item) => matchesQuery(item, normalizedQuery)).forEach((item) => {
      pushUnique({ resultType: "customer", ...item });
    });
  }

  if (type === "all" || type === "user") {
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

  return {
    title: venueId === "all" ? "Kurum Bazlı Platform Raporu" : `${selectedBusinesses[0]?.name || "Kurum"} Raporu`,
    period,
    generatedAt: new Date().toISOString(),
    scope: selectedBusinesses.map((item) => item.name).join(", ") || "Kurum bulunamadı",
    executiveSummary: [
      "Rapor finansal hacim, ödeme kanalı, kapasite kullanımı ve operasyon sağlığını birlikte okur.",
      "Henüz canlı rezervasyon ve ödeme verisi bağlanmadığı için finansal ve operasyonel metrikler 0 gösterilir.",
      "Canlı veri bağlandığında bu alanlar otomatik olarak kurum, dönem ve kanal bazında hesaplanacak.",
      "Aksiyon önerileri yalnızca tablo vermek yerine yönetim kararını hızlandıracak şekilde sunulur.",
    ],
    financial: [
      { label: "Toplam işlem hacmi", value: formatCurrency(0), note: "0 işlem" },
      { label: "Platform komisyonu", value: formatCurrency(0), note: "Tahsil edilen komisyon" },
      { label: "Tesise ödenecek", value: formatCurrency(0), note: "Hakediş toplamı" },
      { label: "Online kanal payı", value: "%0", note: "0 online işlem" },
    ],
    operational: [
      { label: "Kapasite kullanımı", value: "%0", note: "0/0 dolu slot" },
      { label: "tyee satışına açık slot", value: "0", note: "Marketplace'e açılmış kapasite" },
      { label: "Manuel işlem", value: "0", note: "İşletme veya nakit/EFT kanalı" },
      { label: "Aktif abonelik", value: "0", note: "0 toplam abonelik" },
    ],
    recommendations: [
      "Online ödeme payı düşük kurumlarda resepsiyon akışını tyee rezervasyona taşı.",
      "Boş prime-time slotları için son dakika kampanya ve bildirim kuralı tanımla.",
      "Abonelik müşterilerini kurum bazlı yenileme raporuna bağla.",
      "Eksik profil, lokasyon ve medya alanlarını yayına almadan önce kalite kontrol listesine ekle.",
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
  res.json({
    ...payload,
    categories: withActiveVenueCategoryCounts(payload.categories || []),
    brand: {
      name: "tyee",
      tagline: "Rezervasyon marketplace",
    },
  });
});

app.get("/api/listings", (req, res) => {
  const items = filterListings({
    category: String(req.query.category || "all"),
    city: String(req.query.city || "all"),
    query: String(req.query.query || ""),
    time: String(req.query.time || ""),
  });
  res.json({ total: items.length, items });
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
  if (normalized.includes("pet")) return { id: "pet-kuafor", label: "Pet Kuaför", icon: "🐾" };
  if (normalized.includes("güzellik") || normalized.includes("guzellik")) return { id: "guzellik", label: "Güzellik Merkezi", icon: "💄" };
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
    "hali-saha": "media-field",
    padel: "media-padel",
    direksiyon: "media-driving",
    "ozel-ders": "media-lesson",
    masaj: "media-spa",
    fizyoterapi: "media-physio",
    yoga: "media-yoga",
  };

  return mediaByCategory[categoryId] || "media-field";
}

function getRuntimeVenueMapItems(origin) {
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
      const distanceKm = getDistanceKm(origin, { lat, lng });
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
        nextSlot: "Yakında",
        priceLabel: "0",
        mediaClass: getVenueCategoryMediaClass(category.id),
        source: "venue-settings",
      };
    })
    .filter(Boolean);
}

function withActiveVenueCategoryCounts(categories = []) {
  const counts = getRuntimeVenueMapItems({ lat: 41.0351, lng: 29.0268 }).reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + 1;
    return totals;
  }, {});
  const formatter = new Intl.NumberFormat("tr-TR");

  return categories.map((category) => ({
    ...category,
    count: formatter.format(counts[category.id] || 0),
  }));
}

app.get("/api/nearby", (req, res) => {
  const lat = Number(req.query.lat || 41.0351);
  const lng = Number(req.query.lng || 29.0268);
  const origin = { lat, lng };
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

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email || "");
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");
  const role = req.body.role === "venue" ? "venue" : "customer";

  if (!name || !email || password.length < 6) {
    res.status(400).json({ error: "Ad, e-posta ve en az 6 karakter şifre gerekli." });
    return;
  }

  if (findUserByEmail(email)) {
    res.status(409).json({ error: "Bu e-posta ile kayıtlı hesap var." });
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
    phoneVerified: !phone,
    emailVerificationToken: createToken(18),
    phoneVerificationCode: phone ? createSmsCode() : "",
    passwordResetToken: "",
  });

  const emailDelivery = await sendVerificationEmail(req, user);
  await sendPhoneVerification(user);

  const token = createSession(user);
  res.status(201).json({
    token,
    user: normalizeUser(user),
    nextStep: `${describeEmailDelivery(
      emailDelivery,
      "E-posta doğrulama linki gönderildi.",
      "E-posta sağlayıcısı tanımlı olmadığı için doğrulama linki admin posta kutusuna kaydedildi.",
    )}${phone ? " SMS doğrulama kodu hazırlandı." : ""}`,
    emailDelivery: {
      provider: emailDelivery.provider,
      status: emailDelivery.status,
      error: emailDelivery.error || "",
    },
  });
});

app.post("/api/auth/login", (req, res) => {
  const email = resolveLoginEmail(req.body.email || "");
  const password = String(req.body.password || "");
  const loginType = req.body.loginType === "venue" ? "venue" : req.body.loginType === "customer" ? "customer" : "";
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash || user.password)) {
    res.status(401).json({ error: "E-posta veya şifre hatalı." });
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

  if (!isLocalDemoRequest(req) && !hasAdminNetworkAccess(req, user)) {
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
  const user = upsertUser({
    ...req.user,
    canManageVenue: true,
    venueId: getUserVenueId({ ...req.user, canManageVenue: true }),
  });
  res.json({ user: normalizeUser(user) });
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

app.post("/api/auth/verify-phone", requireAuth, (req, res) => {
  const code = String(req.body.code || "").trim();
  if (!req.user.phone || !req.user.phoneVerificationCode || req.user.phoneVerificationCode !== code) {
    res.status(400).json({ error: "SMS doğrulama kodu hatalı." });
    return;
  }

  const user = upsertUser({
    ...req.user,
    phoneVerified: true,
    phoneVerificationCode: "",
  });
  res.json({ user: normalizeUser(user), message: "Telefon doğrulandı." });
});

app.post("/api/auth/password-reset/request", async (req, res) => {
  const email = normalizeEmail(req.body.email || "");
  const user = findUserByEmail(email);
  if (user) {
    const resetToken = createSmsCode();
    const updated = upsertUser({ ...user, passwordResetToken: resetToken });
    await sendEmail({
      to: updated.email,
      template: "password-reset",
      ...passwordResetEmailTemplate({ name: updated.name, resetToken }),
    });
  }
  res.json({ message: "Hesap varsa şifre sıfırlama e-postası gönderildi." });
});

app.post("/api/auth/password-reset/confirm", (req, res) => {
  const email = normalizeEmail(req.body.email || "");
  const resetToken = String(req.body.token || "").trim();
  const password = String(req.body.password || "");
  const user = findUserByEmail(email);

  if (!user || !user.passwordResetToken || user.passwordResetToken !== resetToken || password.length < 6) {
    res.status(400).json({ error: "Kod geçersiz veya şifre en az 6 karakter değil." });
    return;
  }

  upsertUser({
    ...user,
    passwordHash: hashPassword(password),
    passwordResetToken: "",
  });
  res.json({ message: "Şifre güncellendi." });
});

app.get("/api/venue/bootstrap", requireVenueAccess, (req, res) => {
  const venueId = resolveVenueIdForRequest(req, req.query.venue);
  res.json(mergeVenuePayload(venueId, req.user));
});

app.patch("/api/venue/slot-state", requireVenueAccess, (req, res) => {
  const body = req.body || {};
  const venueId = resolveVenueIdForRequest(req, body.venueId);
  const overlay = saveVenueOverlay(venueId, {
    slotModes: body.slotModes && typeof body.slotModes === "object" ? body.slotModes : {},
    manualEntries:
      body.manualEntries && typeof body.manualEntries === "object" ? body.manualEntries : {},
  });
  res.json({ slotState: { slotModes: overlay.slotModes || {}, manualEntries: overlay.manualEntries || {} } });
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
