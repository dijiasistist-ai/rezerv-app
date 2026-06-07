const { appendDevSms } = require("../data/runtime-store");

let twilioClient = null;

function normalizePhoneNumber(phone = "") {
  const raw = String(phone).trim();
  if (!raw) return "";

  if (raw.startsWith("+")) return `+${raw.replace(/[^\d]/g, "")}`;

  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+${digits}`;
}

function normalizeWhatsappAddress(phone = "") {
  const e164 = normalizePhoneNumber(phone);
  return e164 ? `whatsapp:${e164}` : "";
}

function normalizeTwilioWhatsappFrom(value = "") {
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.startsWith("whatsapp:")) return raw;
  const e164 = normalizePhoneNumber(raw);
  return e164 ? `whatsapp:${e164}` : "";
}

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;

  const twilio = require("twilio");
  twilioClient = twilio(sid, token);
  return twilioClient;
}

function shouldUseTwilio(channel) {
  const client = getTwilioClient();
  if (!client) return false;
  if (channel === "sms") return Boolean(process.env.TWILIO_SMS_FROM || process.env.TWILIO_MESSAGING_SERVICE_SID);
  if (channel === "whatsapp") return Boolean(process.env.TWILIO_WHATSAPP_FROM);
  return false;
}

function buildTwilioPayload({ channel, to, body }) {
  const payload = { body };

  if (channel === "whatsapp") {
    payload.from = normalizeTwilioWhatsappFrom(process.env.TWILIO_WHATSAPP_FROM);
    payload.to = normalizeWhatsappAddress(to);
    return payload;
  }

  payload.to = normalizePhoneNumber(to);
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    payload.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  } else {
    payload.from = normalizePhoneNumber(process.env.TWILIO_SMS_FROM);
  }
  return payload;
}

async function sendTwilioMessage({ channel, to, body, template = "message" }) {
  const client = getTwilioClient();
  const payload = buildTwilioPayload({ channel, to, body });

  if (!payload.to || (!payload.from && !payload.messagingServiceSid)) {
    throw new Error(`${channel} gönderimi için Twilio numara ayarı eksik.`);
  }

  const result = await client.messages.create(payload);
  return appendDevSms({
    provider: "twilio",
    channel,
    to: payload.to,
    from: payload.from || payload.messagingServiceSid,
    template,
    body,
    status: result.status,
    sid: result.sid,
  });
}

async function sendMessage({ channel = "sms", to, body, template = "message" }) {
  const normalizedChannel = channel === "whatsapp" ? "whatsapp" : "sms";
  const fallbackTo = normalizedChannel === "whatsapp" ? normalizeWhatsappAddress(to) : normalizePhoneNumber(to);

  if (!to || !body) return null;

  if (!shouldUseTwilio(normalizedChannel)) {
    return appendDevSms({
      channel: normalizedChannel,
      to: fallbackTo || to,
      template,
      body,
      status: "dev-queued",
    });
  }

  try {
    return await sendTwilioMessage({ channel: normalizedChannel, to, body, template });
  } catch (error) {
    return appendDevSms({
      provider: "twilio-error",
      channel: normalizedChannel,
      to: fallbackTo || to,
      template,
      body,
      status: "failed",
      error: error.message,
    });
  }
}

function getMessagingStatus() {
  return {
    sms: shouldUseTwilio("sms") ? "twilio" : "dev-log",
    whatsapp: shouldUseTwilio("whatsapp") ? "twilio" : "dev-log",
  };
}

module.exports = {
  getMessagingStatus,
  normalizePhoneNumber,
  normalizeWhatsappAddress,
  sendMessage,
};
