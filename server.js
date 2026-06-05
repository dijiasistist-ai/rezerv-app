const crypto = require("crypto");
const express = require("express");
const path = require("path");

const {
  filterListings,
  getAdminDashboardPayload,
  getBootstrapPayload,
  getVenueDashboardPayload,
} = require("./data/store");

const app = express();
const port = Number(process.env.PORT || 8091);
const sessions = new Map();
const usersByEmail = new Map();

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    canManageVenue: Boolean(user.canManageVenue),
    isAdmin: Boolean(user.isAdmin),
    venueId: user.venueId || "zincirlikuyu-arena",
  };
}

function seedUser(email, overrides = {}) {
  const normalizedEmail = email.toLocaleLowerCase("tr-TR");
  const user = {
    id: crypto.randomUUID(),
    name: overrides.name || "Rezerv App Demo",
    email: normalizedEmail,
    password: overrides.password || "123456",
    canManageVenue: Boolean(overrides.canManageVenue),
    isAdmin: Boolean(overrides.isAdmin),
    venueId: overrides.venueId || "zincirlikuyu-arena",
  };
  usersByEmail.set(normalizedEmail, user);
}

seedUser("demo@rezerv.app", { name: "Demo Kullanıcı", password: "123456" });
seedUser("firma@rezerv.app", {
  name: "Zincirlikuyu Arena",
  password: "123456",
  canManageVenue: true,
});
seedUser("admin@rezerv.app", {
  name: "Rezerv App Admin",
  password: "123456",
  canManageVenue: true,
  isAdmin: true,
});

app.use(express.json());
app.use(express.static(__dirname));

function getUserFromRequest(req) {
  const header = req.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  return sessions.get(token) || null;
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
  const email = String(req.body.email || "").trim().toLocaleLowerCase("tr-TR");
  const password = String(req.body.password || "");
  const role = req.body.role === "venue" ? "venue" : "customer";

  if (!name || !email || password.length < 6) {
    res.status(400).json({ error: "Ad, e-posta ve en az 6 karakter şifre gerekli." });
    return;
  }

  if (usersByEmail.has(email)) {
    res.status(409).json({ error: "Bu e-posta ile kayıtlı hesap var." });
    return;
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    canManageVenue: role === "venue",
    isAdmin: false,
    venueId: "zincirlikuyu-arena",
  };
  usersByEmail.set(email, user);
  const token = createToken();
  sessions.set(token, user);
  res.status(201).json({ token, user: normalizeUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLocaleLowerCase("tr-TR");
  const password = String(req.body.password || "");
  const user = usersByEmail.get(email);

  if (!user || user.password !== password) {
    res.status(401).json({ error: "E-posta veya şifre hatalı." });
    return;
  }

  const token = createToken();
  sessions.set(token, user);
  res.json({ token, user: normalizeUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: normalizeUser(req.user) });
});

app.post("/api/auth/enable-venue", requireAuth, (req, res) => {
  req.user.canManageVenue = true;
  req.user.venueId = req.user.venueId || "zincirlikuyu-arena";
  res.json({ user: normalizeUser(req.user) });
});

app.get("/api/venue/bootstrap", (req, res) => {
  const venueId = String(req.query.venue || "zincirlikuyu-arena");
  res.json(getVenueDashboardPayload(venueId));
});

app.get("/api/admin/bootstrap", (_req, res) => {
  res.json(getAdminDashboardPayload());
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
