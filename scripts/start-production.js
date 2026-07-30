"use strict";

const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const http = require("node:http");

let shuttingDown = false;
let worker = null;
let restartTimer = null;
const internalPort = process.env.PORT || "10000";
const serviceEnv = {
  ...process.env,
  AVAX_DASHBOARD_INGEST_TOKEN:
    process.env.AVAX_DASHBOARD_INGEST_TOKEN || randomBytes(32).toString("hex"),
  AVAX_BOT_DASHBOARD_URL: `http://127.0.0.1:${internalPort}`,
};

function startWorker() {
  if (shuttingDown || serviceEnv.AVAX_BOT_ENABLED !== "true") return;

  worker = spawn(".venv/bin/python", ["futures-worker/run.py"], {
    env: serviceEnv,
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

function startWorkerWhenWebIsReady() {
  if (shuttingDown || serviceEnv.AVAX_BOT_ENABLED !== "true") return;
  const request = http.get(
    {
      host: "127.0.0.1",
      port: internalPort,
      path: "/",
      timeout: 1_000,
    },
    (response) => {
      response.resume();
      startWorker();
    },
  );
  request.on("timeout", () => request.destroy());
  request.on("error", () => {
    if (!shuttingDown) restartTimer = setTimeout(startWorkerWhenWebIsReady, 500);
  });
}

const web = spawn(process.execPath, ["server.js"], {
  env: serviceEnv,
  stdio: "inherit",
});

restartTimer = setTimeout(startWorkerWhenWebIsReady, 250);

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
