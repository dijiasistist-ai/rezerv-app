"use strict";

const { spawn } = require("node:child_process");

let shuttingDown = false;
let worker = null;
let restartTimer = null;

function startWorker() {
  if (shuttingDown || process.env.AVAX_BOT_ENABLED !== "true") return;

  worker = spawn("python", ["futures-worker/run.py"], {
    env: process.env,
    stdio: "inherit",
  });

  worker.on("exit", (code, signal) => {
    worker = null;
    if (shuttingDown) return;
    console.error(
      `[futures-worker] exited code=${code ?? "null"} signal=${signal ?? "null"}; restarting in 15s`,
    );
    restartTimer = setTimeout(startWorker, 15_000);
  });
}

const web = spawn(process.execPath, ["server.js"], {
  env: process.env,
  stdio: "inherit",
});

startWorker();

function stop(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (restartTimer) clearTimeout(restartTimer);
  if (worker && !worker.killed) worker.kill(signal);
  if (!web.killed) web.kill(signal);
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => stop(signal));
}

web.on("exit", (code, signal) => {
  stop("SIGTERM");
  process.exitCode = code ?? (signal ? 1 : 0);
});
