const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const commit = String(process.argv[2] || "").trim();
if (!/^[a-f0-9]{40}$/i.test(commit)) {
  throw new Error("Usage: node scripts/restore-avax-tournament.js <40-character-backup-commit>");
}

const token = process.env.TYEE_GITHUB_BACKUP_TOKEN || process.env.GITHUB_RUNTIME_BACKUP_TOKEN || "";
const repo = process.env.TYEE_GITHUB_BACKUP_REPO || process.env.GITHUB_REPOSITORY || "";
const secret = process.env.TYEE_GITHUB_BACKUP_SECRET || process.env.TYEE_RUNTIME_BACKUP_SECRET || "";
const prefix = (process.env.TYEE_GITHUB_BACKUP_PREFIX || "runtime").replace(/^\/+|\/+$/g, "");
const runtimeDir =
  process.env.TYEE_RUNTIME_DIR ||
  process.env.RENDER_DISK_MOUNT_PATH ||
  path.join(__dirname, "..", "data", "runtime");

if (!token || !repo.includes("/") || !secret) {
  throw new Error("GitHub runtime-backup token, repo and encryption secret are required");
}

const strategyKeys = [
  "trend_breakout",
  "pullback_reclaim",
  "liquidity_sweep",
  "selective_trend_pullback",
  "bollinger_reversion",
];

function decryptBackup(content) {
  const payload = JSON.parse(content);
  if (payload?.version !== 1 || payload?.algorithm !== "aes-256-gcm") {
    throw new Error("Unsupported runtime backup format");
  }
  const key = crypto.createHash("sha256").update(secret).digest();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function download(name) {
  const filePath = `${prefix}/${name}`;
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodedPath}?ref=${commit}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "tyee-avax-recovery",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Cannot download ${filePath} at ${commit}: HTTP ${response.status}`);
  }
  const body = await response.json();
  return JSON.parse(decryptBackup(Buffer.from(body.content, "base64").toString("utf8")));
}

function validateState(state) {
  if (!state || ![4, 5, 6, 7, 8, 9].includes(Number(state.version))) {
    throw new Error("Backup does not contain a tournament state");
  }
  if (!strategyKeys.every((key) => state.strategies?.[key])) {
    throw new Error("Tournament backup is missing one or more strategies");
  }
  const trades = strategyKeys.reduce(
    (sum, key) => sum + (Array.isArray(state.strategies[key].trades) ? state.strategies[key].trades.length : 0),
    0,
  );
  if (trades < 1) throw new Error("Refusing to restore an empty tournament state");
  return trades;
}

function validateSnapshots(snapshots) {
  if (!Array.isArray(snapshots) || !snapshots.some((row) => row?.strategies)) {
    throw new Error("Backup does not contain tournament snapshots");
  }
  return snapshots.length;
}

function atomicWrite(filePath, value) {
  const temporary = `${filePath}.restore-${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, filePath);
}

async function main() {
  const [state, snapshots] = await Promise.all([
    download("avax-paper-state.json"),
    download("avax-paper-snapshots.json"),
  ]);
  const tradeCount = validateState(state);
  const snapshotCount = validateSnapshots(snapshots);

  fs.mkdirSync(runtimeDir, { recursive: true });
  const recoveryDir = path.join(runtimeDir, "recovery-backups", new Date().toISOString().replace(/[:.]/g, "-"));
  fs.mkdirSync(recoveryDir, { recursive: true });
  for (const name of ["avax-paper-state.json", "avax-paper-snapshots.json"]) {
    const current = path.join(runtimeDir, name);
    if (fs.existsSync(current)) fs.copyFileSync(current, path.join(recoveryDir, name));
  }

  atomicWrite(path.join(runtimeDir, "avax-paper-state.json"), state);
  atomicWrite(path.join(runtimeDir, "avax-paper-snapshots.json"), snapshots);
  console.log(
    JSON.stringify({
      restored: true,
      commit,
      state_version: Number(state.version),
      trades: tradeCount,
      snapshots: snapshotCount,
      previous_files: recoveryDir,
    }),
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
