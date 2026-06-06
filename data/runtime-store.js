const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const runtimeDir = path.join(__dirname, "runtime");
const usersPath = path.join(runtimeDir, "users.json");
const mailboxPath = path.join(runtimeDir, "dev-mailbox.json");
const smsPath = path.join(runtimeDir, "dev-sms.json");
const venuesPath = path.join(runtimeDir, "venues.json");

function ensureRuntimeDir() {
  fs.mkdirSync(runtimeDir, { recursive: true });
}

function readJson(filePath, fallback) {
  ensureRuntimeDir();
  if (!fs.existsSync(filePath)) return fallback;

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureRuntimeDir();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeEmail(email = "") {
  return String(email)
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\u0307/g, "")
    .replace(/\u0131/g, "i");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword = "") {
  if (!storedPassword.includes(":")) return password === storedPassword;
  const [salt, expectedHash] = storedPassword.split(":");
  const actualHash = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

function getUsers() {
  return readJson(usersPath, []);
}

function saveUsers(users) {
  writeJson(usersPath, users);
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return getUsers().find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

function findUserById(id) {
  return getUsers().find((user) => user.id === id) || null;
}

function findUserByEmailVerificationToken(token) {
  return getUsers().find((user) => user.emailVerificationToken === token) || null;
}

function upsertUser(nextUser) {
  const users = getUsers();
  const normalizedEmail = nextUser.email ? normalizeEmail(nextUser.email) : "";
  const userToSave = normalizedEmail ? { ...nextUser, email: normalizedEmail } : nextUser;
  const index = users.findIndex(
    (user) => user.id === userToSave.id || (normalizedEmail && normalizeEmail(user.email) === normalizedEmail),
  );
  if (index >= 0) {
    users[index] = { ...users[index], ...userToSave, updatedAt: new Date().toISOString() };
  } else {
    users.push({ ...userToSave, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveUsers(users);
  return index >= 0 ? users[index] : users[users.length - 1];
}

function ensureSeedUser(email, overrides = {}) {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = findUserByEmail(normalizedEmail);
  if (existingUser) return existingUser;

  return upsertUser({
    id: crypto.randomUUID(),
    name: overrides.name || "zuvu Demo",
    email: normalizedEmail,
    phone: overrides.phone || "",
    passwordHash: hashPassword(overrides.password || "123456"),
    canManageVenue: Boolean(overrides.canManageVenue),
    isAdmin: Boolean(overrides.isAdmin),
    venueId: overrides.venueId || "zincirlikuyu-arena",
    emailVerified: true,
    phoneVerified: Boolean(overrides.phone),
    emailVerificationToken: "",
    phoneVerificationCode: "",
    passwordResetToken: "",
  });
}

function appendDevEmail(message) {
  const mailbox = readJson(mailboxPath, []);
  const savedMessage = {
    id: crypto.randomUUID(),
    provider: process.env.EMAIL_PROVIDER || "dev-log",
    createdAt: new Date().toISOString(),
    ...message,
  };
  mailbox.unshift(savedMessage);
  writeJson(mailboxPath, mailbox.slice(0, 100));
  return savedMessage;
}

function appendDevSms(message) {
  const sms = readJson(smsPath, []);
  const savedMessage = {
    id: crypto.randomUUID(),
    provider: process.env.SMS_PROVIDER || "dev-log",
    createdAt: new Date().toISOString(),
    ...message,
  };
  sms.unshift(savedMessage);
  writeJson(smsPath, sms.slice(0, 100));
  return savedMessage;
}

function getDevOutbox() {
  return {
    emails: readJson(mailboxPath, []),
    sms: readJson(smsPath, []),
  };
}

function getVenues() {
  return readJson(venuesPath, {});
}

function getVenueOverlay(venueId) {
  const venues = getVenues();
  return venues[venueId] || {};
}

function saveVenueOverlay(venueId, patch) {
  const venues = getVenues();
  venues[venueId] = {
    ...(venues[venueId] || {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeJson(venuesPath, venues);
  return venues[venueId];
}

module.exports = {
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
};
