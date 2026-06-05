const crypto = require("crypto");
const express = require("express");
const path = require("path");

const {
  filterListings,
  getAdminDashboardPayload,
  getBootstrapPayload,
  getVenueDashboardPayload,
} = require("./data/store");

const {
  appendDevEmail,
  appendDevSms,
  findUserByEmail,
  findUserByEmailVerificationToken,
  findUserById,
  getDevOutbox,
  getVenueOverlay,
  hashPassword,
  normalizeEmail,
  saveVenueOverlay,
  upsertUser,
  verifyPassword,
  ensureSeedUser,
} = require("./data/runtime-store");

const app = express();
const port = Number(process.env.PORT || 8091);
const sessions = new Map();

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
    email: user.email,
    phone: user.phone || "",
    canManageVenue: Boolean(user.canManageVenue),
    canAccessAdmin: Boolean(user.isAdmin),
    isAdmin: Boolean(user.isAdmin),
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    venueId: user.venueId || "zincirlikuyu-arena",
  };
}

function publicBaseUrl(req) {
  const configured = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  if (configured) return configured.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

function verificationEmailTemplate({ name, verifyUrl }) {
  return {
    subject: "rezerv.app e-posta doğrulama",
    text: `Merhaba ${name}, rezerv.app hesabını doğrulamak için bu bağlantıyı aç: ${verifyUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#101828">
        <h1 style="margin:0 0 12px;font-size:24px">rezerv.app hesabını doğrula</h1>
        <p>Merhaba ${name}, hesabını tamamlamak için aşağıdaki bağlantıya tıkla.</p>
        <a href="${verifyUrl}" style="display:inline-block;margin:18px 0;padding:12px 18px;border-radius:10px;background:#ff4d16;color:#fff;text-decoration:none;font-weight:700">E-postamı doğrula</a>
        <p style="font-size:13px;color:#667085">Bu e-posta geliştirme ortamında dev posta kutusuna kaydedilir. Gerçek gönderim için mail sağlayıcısı bağlanacak.</p>
      </div>
    `,
  };
}

function passwordResetEmailTemplate({ name, resetToken }) {
  return {
    subject: "rezerv.app şifre sıfırlama",
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
  const email = verificationEmailTemplate({ name: user.name, verifyUrl });
  return appendDevEmail({
    to: user.email,
    template: "email-verification",
    ...email,
  });
}

function sendPhoneVerification(user) {
  if (!user.phone || !user.phoneVerificationCode) return null;
  return appendDevSms({
    to: user.phone,
    template: "phone-verification",
    body: `rezerv.app doğrulama kodun: ${user.phoneVerificationCode}`,
  });
}

function seedUsers() {
  ensureSeedUser("demo@rezerv.app", { name: "Demo Kullanıcı", password: "123456" });
  ensureSeedUser("firma@rezerv.app", {
    name: "Zincirlikuyu Arena",
    password: "123456",
    canManageVenue: true,
  });
  ensureSeedUser("admin@rezerv.app", {
    name: "Rezerv App Admin",
    password: "123456",
    canManageVenue: true,
    isAdmin: true,
  });
}

seedUsers();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function isLocalDemoRequest(req) {
  const host = String(req.hostname || req.get("host") || "").toLocaleLowerCase("tr-TR");
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
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
  if (isLocalDemoRequest(req)) {
    req.user = findUserByEmail("firma@rezerv.app");
    next();
    return;
  }

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
  if (isLocalDemoRequest(req)) {
    req.user = findUserByEmail("admin@rezerv.app");
    next();
    return;
  }

  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Yönetici girişi gerekli." });
    return;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: "Yönetici yetkin yok." });
    return;
  }
  req.user = user;
  next();
}

function createSession(user) {
  const token = createToken();
  sessions.set(token, { userId: user.id, createdAt: Date.now() });
  return token;
}

function mergeVenuePayload(venueId) {
  const payload = getVenueDashboardPayload(venueId);
  const overlay = getVenueOverlay(venueId);

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

app.get("/api/bootstrap", (_req, res) => {
  const payload = getBootstrapPayload();
  res.json({
    ...payload,
    brand: {
      name: "rezerv.app",
      tagline: "Rezervasyon marketplace",
    },
  });
});

app.get("/api/listings", (req, res) => {
  const items = filterListings({
    category: String(req.query.category || "all"),
    city: String(req.query.city || "all"),
    query: String(req.query.query || ""),
  });
  res.json({ total: items.length, items });
});

app.post("/api/auth/register", (req, res) => {
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

  const user = upsertUser({
    id: crypto.randomUUID(),
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    canManageVenue: role === "venue",
    isAdmin: false,
    venueId: "zincirlikuyu-arena",
    emailVerified: false,
    phoneVerified: !phone,
    emailVerificationToken: createToken(18),
    phoneVerificationCode: phone ? createSmsCode() : "",
    passwordResetToken: "",
  });

  sendVerificationEmail(req, user);
  sendPhoneVerification(user);

  const token = createSession(user);
  res.status(201).json({
    token,
    user: normalizeUser(user),
    nextStep: phone
      ? "E-posta doğrulama linki ve SMS kodu gönderildi."
      : "E-posta doğrulama linki gönderildi.",
  });
});

app.post("/api/auth/login", (req, res) => {
  const email = normalizeEmail(req.body.email || "");
  const password = String(req.body.password || "");
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash || user.password)) {
    res.status(401).json({ error: "E-posta veya şifre hatalı." });
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
    venueId: req.user.venueId || "zincirlikuyu-arena",
  });
  res.json({ user: normalizeUser(user) });
});

app.get("/verify-email", (req, res) => {
  const token = String(req.query.token || "");
  const user = token ? findUserByEmailVerificationToken(token) : null;

  if (user) {
    upsertUser({
      ...user,
      emailVerified: true,
      emailVerificationToken: "",
    });
  }

  res.redirect(`/?verified=${user ? "success" : "invalid"}`);
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

app.post("/api/auth/resend-verification", requireAuth, (req, res) => {
  let user = req.user;
  if (!user.emailVerificationToken) {
    user = upsertUser({ ...user, emailVerificationToken: createToken(18) });
  }
  sendVerificationEmail(req, user);
  res.json({ message: "Doğrulama e-postası tekrar gönderildi." });
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

app.post("/api/auth/password-reset/request", (req, res) => {
  const email = normalizeEmail(req.body.email || "");
  const user = findUserByEmail(email);
  if (user) {
    const resetToken = createSmsCode();
    const updated = upsertUser({ ...user, passwordResetToken: resetToken });
    appendDevEmail({
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
  const venueId = String(req.query.venue || req.user?.venueId || "zincirlikuyu-arena");
  res.json(mergeVenuePayload(venueId));
});

app.patch("/api/venue/slot-state", requireVenueAccess, (req, res) => {
  const body = req.body || {};
  const venueId = String(body.venueId || req.user?.venueId || "zincirlikuyu-arena");
  const overlay = saveVenueOverlay(venueId, {
    slotModes: body.slotModes && typeof body.slotModes === "object" ? body.slotModes : {},
    manualEntries:
      body.manualEntries && typeof body.manualEntries === "object" ? body.manualEntries : {},
  });
  res.json({ slotState: { slotModes: overlay.slotModes || {}, manualEntries: overlay.manualEntries || {} } });
});

app.patch("/api/venue/settings", requireVenueAccess, (req, res) => {
  const body = req.body || {};
  const venueId = String(body.venueId || req.user?.venueId || "zincirlikuyu-arena");
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
  const venueId = String(body.venueId || req.user?.venueId || "zincirlikuyu-arena");
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
  const venueId = String(body.venueId || req.user?.venueId || "zincirlikuyu-arena");
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

app.get("/api/admin/bootstrap", requireAdmin, (_req, res) => {
  res.json(getAdminDashboardPayload());
});

app.get("/api/admin/dev-outbox", requireAdmin, (_req, res) => {
  res.json(getDevOutbox());
});

app.use((req, res, next) => {
  if (req.method !== "GET") {
    next();
    return;
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`rezerv.app local server: http://127.0.0.1:${port}`);
});
