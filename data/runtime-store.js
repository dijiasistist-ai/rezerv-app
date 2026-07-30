const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const runtimeDir = process.env.TYEE_RUNTIME_DIR || process.env.RENDER_DISK_MOUNT_PATH || path.join(__dirname, "runtime");
const runtimeFileNames = [
  "users.json",
  "dev-mailbox.json",
  "dev-sms.json",
  "venues.json",
  "admin-access.json",
  "deleted-venues.json",
  "reservations.json",
  "reviews.json",
  "avax-paper-snapshots.json",
  "avax-paper-state.json",
  "avax-copy-state.json",
  "avax-signal-observations.jsonl",
];
const usersPath = path.join(runtimeDir, "users.json");
const legacyUsersPath = path.join(__dirname, "users.json");
const mailboxPath = path.join(runtimeDir, "dev-mailbox.json");
const smsPath = path.join(runtimeDir, "dev-sms.json");
const venuesPath = path.join(runtimeDir, "venues.json");
const adminAccessPath = path.join(runtimeDir, "admin-access.json");
const deletedVenuesPath = path.join(runtimeDir, "deleted-venues.json");
const reservationsPath = path.join(runtimeDir, "reservations.json");
const reviewsPath = path.join(runtimeDir, "reviews.json");
const avaxPaperSnapshotsPath = path.join(runtimeDir, "avax-paper-snapshots.json");
const avaxPaperStatePath = path.join(runtimeDir, "avax-paper-state.json");
const avaxCopyStatePath = path.join(runtimeDir, "avax-copy-state.json");
const avaxSignalObservationsPath = path.join(runtimeDir, "avax-signal-observations.jsonl");
const AVAX_OBSERVATION_MAX_BYTES = 8 * 1024 * 1024;
const AVAX_OBSERVATION_KEEP_BYTES = 6 * 1024 * 1024;
let avaxObservationStatsCache = null;
let avaxObservationKeysCache = null;
const runtimeBackupState = {
  initialized: false,
  isRestoring: false,
  branchReady: false,
  timers: new Map(),
  warnedMissingSecret: false,
};

function getRuntimeBackupConfig() {
  const token = process.env.TYEE_GITHUB_BACKUP_TOKEN || process.env.GITHUB_RUNTIME_BACKUP_TOKEN || "";
  const repo = process.env.TYEE_GITHUB_BACKUP_REPO || process.env.GITHUB_REPOSITORY || "";
  const secret = process.env.TYEE_GITHUB_BACKUP_SECRET || process.env.TYEE_RUNTIME_BACKUP_SECRET || "";
  if (!token || !repo || !repo.includes("/")) return null;
  if (!secret) {
    if (!runtimeBackupState.warnedMissingSecret) {
      console.warn("[runtime-backup] TYEE_GITHUB_BACKUP_SECRET is required so GitHub backups stay encrypted");
      runtimeBackupState.warnedMissingSecret = true;
    }
    return null;
  }
  return {
    token,
    repo,
    secret,
    branch: process.env.TYEE_GITHUB_BACKUP_BRANCH || "runtime-backup",
    baseBranch: process.env.TYEE_GITHUB_BACKUP_BASE_BRANCH || "main",
    prefix: (process.env.TYEE_GITHUB_BACKUP_PREFIX || "runtime").replace(/^\/+|\/+$/g, ""),
  };
}

function runtimeBackupHeaders(config) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
    "User-Agent": "tyee-runtime-backup",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function githubApiUrl(config, pathname) {
  return `https://api.github.com/repos/${config.repo}${pathname}`;
}

async function githubRequest(config, pathname, options = {}) {
  const response = await fetch(githubApiUrl(config, pathname), {
    ...options,
    headers: {
      ...runtimeBackupHeaders(config),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || `GitHub backup request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function runtimeBackupPath(config, filePath) {
  const name = path.basename(filePath);
  return `${config.prefix}/${name}`;
}

function runtimeBackupKey(config) {
  return crypto.createHash("sha256").update(config.secret).digest();
}

function encryptRuntimeBackup(content, config) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", runtimeBackupKey(config), iv);
  const encrypted = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
  return `${JSON.stringify(
    {
      version: 1,
      algorithm: "aes-256-gcm",
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: encrypted.toString("base64"),
    },
    null,
    2,
  )}\n`;
}

function decryptRuntimeBackup(content, config) {
  const payload = JSON.parse(content);
  if (payload?.version !== 1 || payload?.algorithm !== "aes-256-gcm") {
    throw new Error("Unsupported runtime backup format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    runtimeBackupKey(config),
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function ensureRuntimeBackupBranch(config) {
  if (runtimeBackupState.branchReady) return;
  try {
    await githubRequest(config, `/git/ref/heads/${encodeURIComponent(config.branch)}`);
    runtimeBackupState.branchReady = true;
    return;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const baseRef = await githubRequest(config, `/git/ref/heads/${encodeURIComponent(config.baseBranch)}`);
  await githubRequest(config, "/git/refs", {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${config.branch}`,
      sha: baseRef.object.sha,
    }),
  });
  runtimeBackupState.branchReady = true;
}

async function getRuntimeBackupFile(config, filePath) {
  const backupPath = runtimeBackupPath(config, filePath);
  try {
    return await githubRequest(
      config,
      `/contents/${backupPath}?ref=${encodeURIComponent(config.branch)}`,
    );
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function readRuntimeBackupContent(config, backupFile) {
  if (backupFile?.content) {
    return Buffer.from(String(backupFile.content).replace(/\s/g, ""), "base64").toString("utf8");
  }
  if (!backupFile?.download_url) return "";
  const response = await fetch(backupFile.download_url, {
    headers: runtimeBackupHeaders(config),
  });
  if (!response.ok) {
    throw new Error(`GitHub backup download failed (${response.status})`);
  }
  return response.text();
}

async function restoreRuntimeBackupFile(config, filePath) {
  const backupFile = await getRuntimeBackupFile(config, filePath);
  const encrypted = await readRuntimeBackupContent(config, backupFile);
  if (!encrypted) return false;
  const decoded = decryptRuntimeBackup(encrypted, config);
  if (filePath.endsWith(".jsonl")) {
    for (const line of decoded.split("\n")) {
      if (line.trim()) JSON.parse(line);
    }
  } else {
    JSON.parse(decoded);
  }
  ensureRuntimeDir();
  fs.writeFileSync(filePath, decoded.endsWith("\n") ? decoded : `${decoded}\n`);
  return true;
}

async function pushRuntimeBackupFile(filePath) {
  const config = getRuntimeBackupConfig();
  if (!config || runtimeBackupState.isRestoring || !fs.existsSync(filePath)) return;

  try {
    await ensureRuntimeBackupBranch(config);
    const backupPath = runtimeBackupPath(config, filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const encryptedContent = encryptRuntimeBackup(content, config);
    let backupFile = await getRuntimeBackupFile(config, filePath);
    const body = {
      message: `Backup ${path.basename(filePath)}`,
      content: Buffer.from(encryptedContent).toString("base64"),
      branch: config.branch,
      ...(backupFile?.sha ? { sha: backupFile.sha } : {}),
    };

    try {
      await githubRequest(config, `/contents/${backupPath}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (error) {
      if (error.status !== 409) throw error;
      backupFile = await getRuntimeBackupFile(config, filePath);
      await githubRequest(config, `/contents/${backupPath}`, {
        method: "PUT",
        body: JSON.stringify({ ...body, sha: backupFile?.sha }),
      });
    }
  } catch (error) {
    console.warn(`[runtime-backup] ${path.basename(filePath)} backup failed: ${error.message}`);
  }
}

function queueRuntimeBackup(filePath, delayMs = 1200) {
  const config = getRuntimeBackupConfig();
  if (!config || runtimeBackupState.isRestoring) return;
  const existingTimer = runtimeBackupState.timers.get(filePath);
  if (existingTimer && delayMs > 1200) return;
  if (existingTimer) clearTimeout(existingTimer);
  const timer = setTimeout(() => {
    runtimeBackupState.timers.delete(filePath);
    pushRuntimeBackupFile(filePath);
  }, delayMs);
  runtimeBackupState.timers.set(filePath, timer);
}

async function initializeRuntimeStore() {
  if (runtimeBackupState.initialized) return;
  runtimeBackupState.initialized = true;
  const config = getRuntimeBackupConfig();
  ensureRuntimeDir();
  if (!config) return;

  runtimeBackupState.isRestoring = true;
  try {
    await ensureRuntimeBackupBranch(config);
    const results = await Promise.allSettled(
      runtimeFileNames.map((fileName) => restoreRuntimeBackupFile(config, path.join(runtimeDir, fileName))),
    );
    const restoredCount = results.filter((result) => result.status === "fulfilled" && result.value).length;
    if (restoredCount) console.log(`[runtime-backup] restored ${restoredCount} file(s) from GitHub`);
  } catch (error) {
    console.warn(`[runtime-backup] restore failed: ${error.message}`);
  } finally {
    runtimeBackupState.isRestoring = false;
  }
}

async function recoverVenueFromRuntimeBackup({
  venueId,
  venueCommit,
  userCommit,
  recoveryVersion,
}) {
  const id = String(venueId || "").trim();
  const config = getRuntimeBackupConfig();
  if (!id || !config) return false;
  const existingVenue = getVenueOverlay(id);
  if (recoveryVersion && existingVenue._historicalRecoveryVersion === recoveryVersion) return false;

  async function readHistoricalFile(fileName, commit) {
    const backupPath = runtimeBackupPath(config, path.join(runtimeDir, fileName));
    const backupFile = await githubRequest(
      config,
      `/contents/${backupPath}?ref=${encodeURIComponent(commit)}`,
    );
    const encrypted = await readRuntimeBackupContent(config, backupFile);
    return JSON.parse(decryptRuntimeBackup(encrypted, config));
  }

  try {
    const [historicalVenues, historicalUsers] = await Promise.all([
      readHistoricalFile("venues.json", venueCommit),
      userCommit ? readHistoricalFile("users.json", userCommit) : Promise.resolve([]),
    ]);
    const venue = historicalVenues?.[id];
    const user = Array.isArray(historicalUsers)
      ? historicalUsers.find((item) => String(item?.venueId || "") === id)
      : null;
    if (!venue || (userCommit && !user)) return false;

    const venues = getVenues();
    venues[id] = {
      ...venue,
      ...(recoveryVersion ? { _historicalRecoveryVersion: recoveryVersion } : {}),
    };
    writeJson(venuesPath, venues);
    if (user) {
      const users = getUsers();
      if (!users.some((item) => String(item?.venueId || "") === id)) {
        saveUsers([user, ...users]);
      }
    }
    console.log(`[runtime-backup] restored protected venue ${id} from history`);
    return true;
  } catch (error) {
    console.warn(`[runtime-backup] protected venue recovery failed: ${error.message}`);
    return false;
  }
}

async function recoverVenueFromRuntimeHistory({
  venueId,
  expectedName = "",
  preferLargestGallery = false,
  preferMostComplete = false,
  excludedGallerySources = [],
  recoveryVersion,
}) {
  const id = String(venueId || "").trim();
  const config = getRuntimeBackupConfig();
  if (!id || !config) return false;
  if (getVenueOverlay(id)._historicalRecoveryVersion === recoveryVersion) return false;

  try {
    const backupPath = runtimeBackupPath(config, path.join(runtimeDir, "venues.json"));
    const commits = await githubRequest(
      config,
      `/commits?sha=${encodeURIComponent(config.branch)}&path=${encodeURIComponent(backupPath)}&per_page=40`,
    );
    let selected = null;
    let selectedScore = -1;
    const excludedSources = new Set(excludedGallerySources.map((source) => String(source || "")));
    const normalizedExpectedName = String(expectedName).trim().toLocaleLowerCase("tr-TR");

    for (const commit of commits || []) {
      const backupFile = await githubRequest(
        config,
        `/contents/${backupPath}?ref=${encodeURIComponent(commit.sha)}`,
      );
      const encrypted = await readRuntimeBackupContent(config, backupFile);
      const venues = JSON.parse(decryptRuntimeBackup(encrypted, config));
      const candidate = venues?.[id];
      if (!candidate) continue;
      const businessName = String(candidate.settings?.businessName || "").toLocaleLowerCase("tr-TR");
      const galleryCount = (Array.isArray(candidate.settings?.media?.gallery)
        ? candidate.settings.media.gallery
        : []
      ).filter((item) => !excludedSources.has(String(typeof item === "string" ? item : item?.src || ""))).length;
      const completenessScore =
        (candidate.settings?.businessName ? 5 : 0) +
        (candidate.settings?.location?.lat && candidate.settings?.location?.lng ? 20 : 0) +
        galleryCount * 3 +
        (Array.isArray(candidate.settings?.areas) ? candidate.settings.areas.length : 0);
      if (preferMostComplete && completenessScore > selectedScore) {
        selected = candidate;
        selectedScore = completenessScore;
        continue;
      }
      if (normalizedExpectedName && businessName.includes(normalizedExpectedName)) {
        selected = candidate;
        break;
      }
      if (preferLargestGallery && galleryCount > selectedScore) {
        selected = candidate;
        selectedScore = galleryCount;
        if (galleryCount >= 3) break;
      }
    }

    if (!selected) return false;
    const venues = getVenues();
    venues[id] = {
      ...selected,
      _historicalRecoveryVersion: recoveryVersion,
    };
    writeJson(venuesPath, venues);
    console.log(`[runtime-backup] restored ${id} from matching backup history`);
    return true;
  } catch (error) {
    console.warn(`[runtime-backup] history recovery failed for ${id}: ${error.message}`);
    return false;
  }
}

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
  queueRuntimeBackup(filePath);
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

function deleteVenueOverlay(venueId) {
  const id = String(venueId || "").trim();
  if (!id) return false;
  const venues = getVenues();
  if (!Object.prototype.hasOwnProperty.call(venues, id)) return false;
  delete venues[id];
  writeJson(venuesPath, venues);
  return true;
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

function updateReservation(id, updater) {
  const reservations = getReservations();
  const index = reservations.findIndex((reservation) => reservation.id === id);
  if (index < 0) return null;

  const currentReservation = reservations[index];
  const patch = typeof updater === "function" ? updater(currentReservation) : updater;
  const nextReservation = {
    ...currentReservation,
    ...(patch || {}),
    updatedAt: new Date().toISOString(),
  };
  reservations[index] = nextReservation;
  saveReservations(reservations);
  return nextReservation;
}

function getReviews() {
  return readJson(reviewsPath, []);
}

function deleteReviewsByVenueIds(venueIds = []) {
  const ids = new Set(venueIds.map((id) => String(id || "").trim()).filter(Boolean));
  if (!ids.size) return 0;
  const reviews = getReviews();
  const nextReviews = reviews.filter((review) => !ids.has(String(review.venueId || "").trim()));
  const deletedCount = reviews.length - nextReviews.length;
  if (deletedCount) writeJson(reviewsPath, nextReviews);
  return deletedCount;
}

function saveReviews(reviews) {
  writeJson(reviewsPath, reviews);
}

function addReview(review) {
  const reviews = getReviews();
  const nextReview = {
    id: review.id || crypto.randomUUID(),
    createdAt: review.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...review,
  };
  saveReviews([nextReview, ...reviews].slice(0, 1000));
  return nextReview;
}

function getAvaxPaperSnapshots() {
  return readJson(avaxPaperSnapshotsPath, []);
}

function saveAvaxPaperSnapshots(snapshots) {
  writeJson(avaxPaperSnapshotsPath, Array.isArray(snapshots) ? snapshots : []);
}

function getAvaxPaperState() {
  return readJson(avaxPaperStatePath, null);
}

function saveAvaxPaperState(state) {
  writeJson(avaxPaperStatePath, state && typeof state === "object" ? state : null);
}

function getAvaxCopyState() {
  return readJson(avaxCopyStatePath, null);
}

function saveAvaxCopyState(state) {
  writeJson(avaxCopyStatePath, state && typeof state === "object" ? state : null);
}

function compactJsonLines(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.size <= AVAX_OBSERVATION_MAX_BYTES) return false;
  const start = Math.max(0, stats.size - AVAX_OBSERVATION_KEEP_BYTES);
  const handle = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(stats.size - start);
  try {
    fs.readSync(handle, buffer, 0, buffer.length, start);
  } finally {
    fs.closeSync(handle);
  }
  const firstNewline = buffer.indexOf(10);
  const retained = firstNewline >= 0 ? buffer.subarray(firstNewline + 1) : buffer;
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, retained);
  fs.renameSync(temporary, filePath);
  return true;
}

function loadAvaxObservationStats() {
  if (avaxObservationStatsCache && avaxObservationKeysCache) {
    return avaxObservationStatsCache;
  }
  ensureRuntimeDir();
  if (!fs.existsSync(avaxSignalObservationsPath)) {
    avaxObservationStatsCache = { bytes: 0, records: 0, latest: null };
    avaxObservationKeysCache = new Set();
    return avaxObservationStatsCache;
  }
  const content = fs.readFileSync(avaxSignalObservationsPath, "utf8");
  const lines = content.split("\n").filter(Boolean);
  const parsed = lines.map((line) => JSON.parse(line));
  avaxObservationStatsCache = {
    bytes: Buffer.byteLength(content),
    records: lines.length,
    latest: parsed.at(-1) || null,
  };
  avaxObservationKeysCache = new Set(
    parsed.map((row) => `${row.event}|${row.observation_id}`),
  );
  return avaxObservationStatsCache;
}

function appendAvaxSignalObservations(observations) {
  ensureRuntimeDir();
  const currentStats = loadAvaxObservationStats();
  const rows = Array.isArray(observations) ? observations.slice(0, 500) : [];
  const newKeys = new Set();
  const validRows = rows.filter((row) => {
    if (!row || typeof row !== "object") return false;
    const key = `${row.event}|${row.observation_id}`;
    if (avaxObservationKeysCache.has(key) || newKeys.has(key)) return false;
    newKeys.add(key);
    return true;
  });
  if (!validRows.length) return { accepted: 0, bytes: currentStats.bytes };
  const payload = validRows.map((row) => JSON.stringify(row)).join("\n");
  fs.appendFileSync(avaxSignalObservationsPath, `${payload}\n`);
  for (const key of newKeys) avaxObservationKeysCache.add(key);
  const compacted = compactJsonLines(avaxSignalObservationsPath);
  if (compacted) {
    avaxObservationStatsCache = null;
    avaxObservationKeysCache = null;
    loadAvaxObservationStats();
  } else {
    avaxObservationStatsCache = {
      bytes: fs.statSync(avaxSignalObservationsPath).size,
      records: currentStats.records + validRows.length,
      latest: validRows.at(-1),
    };
  }
  queueRuntimeBackup(avaxSignalObservationsPath, 6 * 60 * 60 * 1000);
  return {
    accepted: validRows.length,
    bytes: avaxObservationStatsCache.bytes,
  };
}

function getAvaxSignalObservationSummary() {
  return { ...loadAvaxObservationStats() };
}

module.exports = {
  addReview,
  addReservation,
  appendAvaxSignalObservations,
  appendDevEmail,
  appendDevSms,
  deleteAdminAccessRule,
  deleteReviewsByVenueIds,
  deleteUserById,
  deleteVenueOverlay,
  deleteVenueRecord,
  findUserByEmail,
  findUserByEmailVerificationToken,
  findUserById,
  getAdminAccessRules,
  getAvaxPaperSnapshots,
  getAvaxPaperState,
  getAvaxSignalObservationSummary,
  getAvaxCopyState,
  getDeletedVenueIds,
  getReservations,
  getReviews,
  getUsers,
  getVenues,
  getDevOutbox,
  getVenueOverlay,
  hashPassword,
  initializeRuntimeStore,
  recoverVenueFromRuntimeBackup,
  recoverVenueFromRuntimeHistory,
  normalizeEmail,
  migrateLegacyUsers,
  saveVenueOverlay,
  saveAvaxPaperSnapshots,
  saveAvaxPaperState,
  saveAvaxCopyState,
  upsertAdminAccessRule,
  upsertUser,
  updateReservation,
  verifyPassword,
  ensureSeedUser,
};
