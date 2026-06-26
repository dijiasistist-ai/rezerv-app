const nodemailer = require("nodemailer");
const dns = require("dns").promises;
const net = require("net");
const { appendDevEmail } = require("../data/runtime-store");

let smtpTransporter = null;
let smtpTransporterKey = "";

function firstEnv(...keys) {
  return keys.map((key) => process.env[key]).find((value) => String(value || "").trim()) || "";
}

function getEmailFrom() {
  return firstEnv("EMAIL_FROM", "SMTP_FROM", "SENDGRID_FROM", "RESEND_FROM", "MAIL_FROM") || "tyee <info@tyee.app>";
}

function getReplyTo() {
  return firstEnv("EMAIL_REPLY_TO", "SMTP_REPLY_TO", "REPLY_TO");
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function shouldForceSmtpIpv4() {
  return String(process.env.SMTP_FORCE_IPV4 || "true").toLowerCase() !== "false";
}

async function getSmtpConnectionTarget() {
  const host = String(process.env.SMTP_HOST || "").trim();
  if (!host || net.isIP(host) || !shouldForceSmtpIpv4()) {
    return { host, servername: process.env.SMTP_SERVERNAME || (net.isIP(host) ? "" : host) };
  }

  try {
    const addresses = await dns.resolve4(host);
    const ipv4Address = addresses.find(Boolean);
    if (ipv4Address) return { host: ipv4Address, servername: process.env.SMTP_SERVERNAME || host };
  } catch (error) {
    throw new Error(`SMTP IPv4 çözümleme hatası: ${error.message}`);
  }

  throw new Error(`SMTP için IPv4 adresi bulunamadı: ${host}`);
}

async function getSmtpTransporter() {
  if (!hasSmtpConfig()) return null;

  const target = await getSmtpConnectionTarget();
  const connectionKey = JSON.stringify({
    host: target.host,
    port: process.env.SMTP_PORT || "587",
    secure: process.env.SMTP_SECURE || "",
    user: process.env.SMTP_USER || "",
    servername: target.servername || "",
  });

  if (smtpTransporter && smtpTransporterKey === connectionKey) return smtpTransporter;

  smtpTransporter = nodemailer.createTransport({
    host: target.host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    family: Number(process.env.SMTP_FAMILY || 4),
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 5000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 5000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 8000),
    tls: target.servername ? { servername: target.servername } : undefined,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  smtpTransporterKey = connectionKey;

  return smtpTransporter;
}

function resolveEmailProvider() {
  const explicit = String(process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (hasSmtpConfig()) return "smtp";
  return "dev-log";
}

async function sendResendEmail(message) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [message.to],
      reply_to: getReplyTo() || undefined,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Resend e-posta hatası (${response.status})`);
  }
  return payload.id || "";
}

async function sendSendgridEmail(message) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: message.to }] }],
      from: parseEmailAddress(getEmailFrom()),
      reply_to: getReplyTo() ? parseEmailAddress(getReplyTo()) : undefined,
      subject: message.subject,
      content: [
        { type: "text/plain", value: message.text || "" },
        { type: "text/html", value: message.html || message.text || "" },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `SendGrid e-posta hatası (${response.status})`);
  }
  return response.headers.get("x-message-id") || "";
}

function parseEmailAddress(value = "") {
  const raw = String(value).trim();
  const match = raw.match(/^(.*?)<([^>]+)>$/);
  if (!match) return { email: raw };
  return {
    name: match[1].trim().replace(/^"|"$/g, "") || undefined,
    email: match[2].trim(),
  };
}

async function sendSmtpEmail(message) {
  const transporter = await getSmtpTransporter();
  if (!transporter) throw new Error("SMTP ayarı eksik.");

  const result = await transporter.sendMail({
    from: getEmailFrom(),
    to: message.to,
    replyTo: getReplyTo() || undefined,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments || undefined,
  });

  return result.messageId || "";
}

async function sendEmail(message) {
  const provider = resolveEmailProvider();
  const baseMessage = {
    provider,
    to: message.to,
    template: message.template || "email",
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments || [],
  };

  if (!message.to || !message.subject || (!message.text && !message.html)) {
    return appendDevEmail({
      ...baseMessage,
      status: "skipped",
      error: "E-posta alıcısı, konusu veya içeriği eksik.",
    });
  }

  if (provider === "dev-log") {
    return appendDevEmail({ ...baseMessage, status: "dev-queued" });
  }

  try {
    const providerMessageId =
      provider === "resend"
        ? await sendResendEmail(message)
        : provider === "sendgrid"
          ? await sendSendgridEmail(message)
          : await sendSmtpEmail(message);

    return appendDevEmail({
      ...baseMessage,
      status: "sent",
      providerMessageId,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    return appendDevEmail({
      ...baseMessage,
      status: "failed",
      error: error.message,
    });
  }
}

function getEmailStatus() {
  return {
    provider: resolveEmailProvider(),
    from: getEmailFrom(),
    configured: resolveEmailProvider() !== "dev-log",
  };
}

function redactSecret(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("@")) return raw;
  if (raw.length <= 6) return "******";
  return `${raw.slice(0, 3)}...${raw.slice(-3)}`;
}

function probeTcpConnection(host, port, timeoutMs = 7000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = net.createConnection({ host, port: Number(port) });
    let settled = false;

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        ...payload,
        durationMs: Date.now() - startedAt,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish({ ok: true }));
    socket.once("timeout", () => finish({ ok: false, error: "Connection timeout" }));
    socket.once("error", (error) => finish({ ok: false, error: error.message }));
  });
}

async function diagnoseEmailTransport() {
  const provider = resolveEmailProvider();
  const status = getEmailStatus();
  const diagnostics = {
    provider,
    from: status.from,
    configured: status.configured,
    smtp: null,
  };

  if (provider !== "smtp") return diagnostics;

  const host = String(process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
  const servername = process.env.SMTP_SERVERNAME || "";

  diagnostics.smtp = {
    host,
    port,
    secure,
    user: redactSecret(process.env.SMTP_USER || ""),
    from: getEmailFrom(),
    replyTo: getReplyTo() || "",
    forceIpv4: shouldForceSmtpIpv4(),
    family: Number(process.env.SMTP_FAMILY || 4),
    servername,
    hasPassword: Boolean(process.env.SMTP_PASS),
    dns4: [],
    target: null,
    tcp: null,
    verify: null,
  };

  if (host && !net.isIP(host)) {
    try {
      diagnostics.smtp.dns4 = await dns.resolve4(host);
    } catch (error) {
      diagnostics.smtp.dns4Error = error.message;
    }
  }

  try {
    const target = await getSmtpConnectionTarget();
    diagnostics.smtp.target = target;
    diagnostics.smtp.tcp = await probeTcpConnection(target.host, port);

    if (diagnostics.smtp.tcp.ok) {
      const startedAt = Date.now();
      try {
        const transporter = await getSmtpTransporter();
        await transporter.verify();
        diagnostics.smtp.verify = { ok: true, durationMs: Date.now() - startedAt };
      } catch (error) {
        diagnostics.smtp.verify = {
          ok: false,
          error: error.message,
          durationMs: Date.now() - startedAt,
        };
      }
    }
  } catch (error) {
    diagnostics.smtp.targetError = error.message;
  }

  return diagnostics;
}

module.exports = {
  diagnoseEmailTransport,
  getEmailStatus,
  sendEmail,
};
