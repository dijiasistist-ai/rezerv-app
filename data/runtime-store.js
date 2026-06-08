const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const runtimeDir = path.join(__dirname, "runtime");
const usersPath = path.join(runtimeDir, "users.json");
const legacyUsersPath = path.join(__dirname, "users.json");
const mailboxPath = path.join(runtimeDir, "dev-mailbox.json");
const smsPath = path.join(runtimeDir, "dev-sms.json");
const venuesPath = path.join(runtimeDir, "venues.json");
const adminAccessPath = path.join(runtimeDir, "admin-access.json");
const deletedVenuesPath = path.join(runtimeDir, "deleted-venues.json");
const reservationsPath = path.join(runtimeDir, "reservations.json");

const bundledLegacyUsers = [
  {
    id: "d7aa7820-733b-4b72-8779-0b53604c0cf1",
    name: "Hüseyin Yıldız",
    email: "hysnyildiz@gmail.com",
    passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
    modes: ["customer", "venue"],
  },
  {
    id: "79e143c4-dd2d-43ab-9bbf-7d1b89db8806",
    name: "Hüseyin Yıldız",
    email: "huseyyil79@icloud.com",
    passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
    modes: ["customer", "venue", "admin"],
  },
];

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
  if (/^[a-f0-9]{64}$/i.test(storedPassword)) {
    const actualHash = crypto.createHash("sha256").update(String(password)).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(storedPassword, "hex"));
  }

  if (!storedPassword.includes(":")) return password === storedPassword;
  const [salt, expectedHash] = storedPassword.split(":");
  const actualHash = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

function getUsers() {
  const users = readJson(usersPath, []);
  const uniqueUsers = mergeUsersByEmail(users);
  if (uniqueUsers.length !== users.length) saveUsers(uniqueUsers);
  return uniqueUsers;
}

function saveUsers(users) {
  writeJson(usersPath, users);
}

function deleteUserById(id) {
  const users = getUsers();
  const target = users.find((user) => user.id === id);
  if (!target) return null;
  if (target.isAdmin) return { protected: true, user: target };
  saveUsers(users.filter((user) => user.id !== id));
  return { protected: false, user: target };
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return getUsers().find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

function mergeUsersByEmail(users = []) {
  const byEmail = new Map();
  const withoutEmail = [];

  users.forEach((user) => {
    const email = normalizeEmail(user.email || "");
    if (!email) {
      withoutEmail.push(user);
      return;
    }

    const existing = byEmail.get(email);
    if (!existing) {
      byEmail.set(email, { ...user, email });
      return;
    }

    byEmail.set(email, {
      ...existing,
      ...user,
      id: existing.id || user.id,
      name: existing.name || user.name,
      email,
      phone: existing.phone || user.phone || "",
      passwordHash: existing.passwordHash || user.passwordHash || "",
      password: existing.password || user.password || "",
      canManageVenue: Boolean(existing.canManageVenue || user.canManageVenue),
      isAdmin: Boolean(existing.isAdmin || user.isAdmin),
      venueId: existing.venueId || user.venueId || "",
      emailVerified: Boolean(existing.emailVerified || user.emailVerified),
      phoneVerified: Boolean(existing.phoneVerified || user.phoneVerified),
      emailVerificationToken: existing.emailVerificationToken || user.emailVerificationToken || "",
      phoneVerificationCode: existing.phoneVerificationCode || user.phoneVerificationCode || "",
      passwordResetToken: existing.passwordResetToken || user.passwordResetToken || "",
      createdAt: existing.createdAt || user.createdAt,
      updatedAt: user.updatedAt || existing.updatedAt,
    });
  });

  return [...withoutEmail, ...byEmail.values()];
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
    name: overrides.name || "tyee Demo",
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

function migrateLegacyUsers() {
  const legacyUsers = [...bundledLegacyUsers, ...readJson(legacyUsersPath, [])];

  legacyUsers.forEach((legacyUser) => {
    const email = normalizeEmail(legacyUser.email || "");
    if (!email) return;

    const modes = Array.isArray(legacyUser.modes) ? legacyUser.modes : [];
    const existingUser = findUserByEmail(email);

    upsertUser({
      ...(existingUser || {}),
      id: legacyUser.id || crypto.randomUUID(),
      name: legacyUser.name || email,
      email,
      phone: legacyUser.phone || existingUser?.phone || "",
      passwordHash: legacyUser.passwordHash || legacyUser.password || "",
      canManageVenue: modes.includes("venue") || modes.includes("admin"),
      isAdmin: modes.includes("admin"),
      venueId: legacyUser.venueId || existingUser?.venueId || "zincirlikuyu-arena",
      emailVerified: true,
      phoneVerified: Boolean(legacyUser.phone || existingUser?.phoneVerified),
      emailVerificationToken: existingUser?.emailVerificationToken || "",
      phoneVerificationCode: existingUser?.phoneVerificationCode || "",
      passwordResetToken: existingUser?.passwordResetToken || "",
    });
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

function getDeletedVenueIds() {
  return readJson(deletedVenuesPath, []);
}

function deleteVenueRecord(venueId) {
  const id = String(venueId || "").trim();
  if (!id) return false;
  const deleted = new Set(getDeletedVenueIds());
  deleted.add(id);
  writeJson(deletedVenuesPath, [...deleted]);
  return true;
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

function getAdminAccessRules() {
  return readJson(adminAccessPath, []);
}

function upsertAdminAccessRule(rule) {
  const rules = getAdminAccessRules();
  const id = rule.id || crypto.randomUUID();
  const index = rules.findIndex((item) => item.id === id);
  const nextRule = {
    id,
    label: String(rule.label || "Yetkili erişim").trim(),
    email: normalizeEmail(rule.email || ""),
    ipAddress: String(rule.ipAddress || "").trim(),
    mobileToken: String(rule.mobileToken || "").trim(),
    note: String(rule.note || "").trim(),
    isActive: rule.isActive !== false,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    rules[index] = {
      ...rules[index],
      ...nextRule,
      createdAt: rules[index].createdAt || new Date().toISOString(),
    };
  } else {
    rules.unshift({
      ...nextRule,
      createdAt: new Date().toISOString(),
    });
  }

  writeJson(adminAccessPath, rules);
  return rules[index >= 0 ? index : 0];
}

function deleteAdminAccessRule(id) {
  const rules = getAdminAccessRules();
  const nextRules = rules.filter((rule) => rule.id !== id);
  writeJson(adminAccessPath, nextRules);
  return nextRules.length !== rules.length;
}

function getReservations() {
  return readJson(reservationsPath, []);
}

function saveReservations(reservations) {
  writeJson(reservationsPath, reservations);
}

function addReservation(reservation) {
  const reservations = getReservations();
  const nextReservation = {
    id: reservation.id || crypto.randomUUID(),
    createdAt: reservation.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...reservation,
  };
  saveReservations([nextReservation, ...reservations].slice(0, 1000));
  return nextReservation;
}

module.exports = {
  addReservation,
  appendDevEmail,
  appendDevSms,
  deleteAdminAccessRule,
  deleteUserById,
  deleteVenueRecord,
  findUserByEmail,
  findUserByEmailVerificationToken,
  findUserById,
  getAdminAccessRules,
  getDeletedVenueIds,
  getReservations,
  getUsers,
  getDevOutbox,
  getVenueOverlay,
  hashPassword,
  normalizeEmail,
  migrateLegacyUsers,
  saveVenueOverlay,
  upsertAdminAccessRule,
  upsertUser,
  verifyPassword,
  ensureSeedUser,
};
