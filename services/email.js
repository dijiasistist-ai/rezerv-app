const nodemailer = require("nodemailer");
const { appendDevEmail } = require("../data/runtime-store");

let smtpTransporter = null;

function firstEnv(...keys) {
  return keys.map((key) => process.env[key]).find((value) => String(value || "").trim()) || "";
}

function getEmailFrom() {
  return firstEnv("EMAIL_FROM", "SMTP_FROM", "SENDGRID_FROM", "RESEND_FROM", "MAIL_FROM") || "tyee <noreply@tyee.app>";
}

function getReplyTo() {
  return firstEnv("EMAIL_REPLY_TO", "SMTP_REPLY_TO", "REPLY_TO");
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;
  if (!hasSmtpConfig()) return null;

  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    family: Number(process.env.SMTP_FAMILY || 4),
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

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
  const transporter = getSmtpTransporter();
  if (!transporter) throw new Error("SMTP ayarı eksik.");

  const result = await transporter.sendMail({
    from: getEmailFrom(),
    to: message.to,
    replyTo: getReplyTo() || undefined,
    subject: message.subject,
    text: message.text,
    html: message.html,
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

module.exports = {
  getEmailStatus,
  sendEmail,
};
