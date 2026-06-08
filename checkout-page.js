const draft = JSON.parse(sessionStorage.getItem("tyee_checkout_draft") || "null");

const venueName = document.querySelector("#checkout-venue");
const serviceName = document.querySelector("#checkout-service");
const dateText = document.querySelector("#checkout-date");
const timeText = document.querySelector("#checkout-time");
const onlineLabel = document.querySelector("#checkout-online-label");
const onlineAmount = document.querySelector("#checkout-online-amount");
const venueAmount = document.querySelector("#checkout-venue-amount");
const totalAmount = document.querySelector("#checkout-total-amount");
const countdown = document.querySelector("#checkout-countdown");
const extendButton = document.querySelector("#checkout-extend");
const submitButton = document.querySelector("#checkout-submit");
const feedback = document.querySelector("#checkout-feedback");
const cardForm = document.querySelector("#checkout-card-form");
const transferBox = document.querySelector("#checkout-transfer");
const paymentTabs = document.querySelectorAll("[data-payment-tab]");

let remainingSeconds = 300;

function formatCurrency(value = 0) {
  return `${new Intl.NumberFormat("tr-TR").format(Math.round(Number(value || 0)))} TL`;
}

function formatDate(value = "") {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "long",
  }).format(date);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "İşlem tamamlanamadı.");
  return payload;
}

function renderSummary() {
  if (!draft) {
    document.querySelector(".checkout-layout").innerHTML = `
      <div class="checkout-missing">
        <h1>Rezervasyon bilgisi bulunamadı</h1>
        <p>Lütfen işletme sayfasından tekrar saat seçerek ilerleyin.</p>
        <a class="solid-button" href="/index.html#featured">Tesislere dön</a>
      </div>
    `;
    return;
  }

  const billing = draft.billing || {};
  venueName.textContent = draft.venueName || "İşletme";
  serviceName.textContent = draft.serviceLabel || "Hizmet";
  dateText.textContent = formatDate(draft.serviceDate);
  timeText.textContent = `${draft.serviceTime} - ${draft.serviceEndTime || ""}`.trim();
  onlineLabel.textContent = billing.customerOnlinePayment > 0 ? "Kartınızdan Çekilecek Tutar" : "Online Tahsilat";
  onlineAmount.textContent = formatCurrency(billing.customerOnlinePayment || 0);
  venueAmount.textContent = formatCurrency(billing.customerVenuePayment || 0);
  totalAmount.textContent = formatCurrency(billing.totalAmount || draft.totalAmount || 0);
}

function renderTimer() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  countdown.textContent = `${minutes} dakika ${String(seconds).padStart(2, "0")} saniye`;
}

function setPaymentTab(tab) {
  paymentTabs.forEach((button) => button.classList.toggle("is-active", button.dataset.paymentTab === tab));
  cardForm.classList.toggle("hidden", tab !== "card");
  transferBox.classList.toggle("hidden", tab !== "transfer");
}

paymentTabs.forEach((button) => {
  button.addEventListener("click", () => setPaymentTab(button.dataset.paymentTab));
});

extendButton?.addEventListener("click", () => {
  remainingSeconds = 300;
  renderTimer();
});

submitButton?.addEventListener("click", async () => {
  if (!draft) return;

  feedback.textContent = "";
  feedback.classList.remove("is-success");
  submitButton.disabled = true;
  submitButton.textContent = "Onaylanıyor...";

  try {
    const response = await fetchJson("/api/reservations", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    sessionStorage.removeItem("tyee_checkout_draft");
    feedback.textContent = response.message || "Rezervasyon oluşturuldu.";
    feedback.classList.add("is-success");
    submitButton.textContent = "Rezervasyon Alındı";
  } catch (error) {
    feedback.textContent = error.message;
    submitButton.disabled = false;
    submitButton.textContent = "Rezervasyonu Onayla";
  }
});

renderSummary();
renderTimer();
setInterval(() => {
  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
    renderTimer();
  }
}, 1000);
