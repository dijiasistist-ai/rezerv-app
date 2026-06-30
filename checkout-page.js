const draft = JSON.parse(sessionStorage.getItem("tyee_checkout_draft") || "null");

const venueName = document.querySelector("#checkout-venue");
const serviceName = document.querySelector("#checkout-service");
const dateText = document.querySelector("#checkout-date");
const timeText = document.querySelector("#checkout-time");
const ratingText = document.querySelector("#checkout-rating");
const locationText = document.querySelector("#checkout-location");
const summaryMedia = document.querySelector("#checkout-summary-media");
const onlineLabel = document.querySelector("#checkout-online-label");
const onlineAmount = document.querySelector("#checkout-online-amount");
const venueAmount = document.querySelector("#checkout-venue-amount");
const totalAmount = document.querySelector("#checkout-total-amount");
const servicePrice = document.querySelector("#checkout-service-price");
const serviceSubline = document.querySelector("#checkout-service-subline");
const payNowAmount = document.querySelector("#checkout-pay-now-amount");
const payLaterAmount = document.querySelector("#checkout-pay-later-amount");
const payLaterCopy = document.querySelector("#checkout-pay-later-copy");
const choiceFullPrice = document.querySelector("#checkout-choice-full-price");
const choiceDepositPrice = document.querySelector("#checkout-choice-deposit-price");
const choiceFullCopy = document.querySelector("#checkout-choice-full-copy");
const choiceDepositCopy = document.querySelector("#checkout-choice-deposit-copy");
const countdown = document.querySelector("#checkout-countdown");
const extendButton = document.querySelector("#checkout-extend");
const submitButton = document.querySelector("#checkout-submit");
const feedback = document.querySelector("#checkout-feedback");
const contractAccept = document.querySelector("#checkout-contract-accept");
const checkoutContract = document.querySelector("#checkout-contract");
const cardForm = document.querySelector("#checkout-card-form");
const transferBox = document.querySelector("#checkout-transfer");
const checkoutLogin = document.querySelector(".checkout-login");
const paymentTabs = document.querySelectorAll("[data-payment-tab]");
const paymentChoices = document.querySelectorAll("[data-payment-choice]");
const authToken = localStorage.getItem("tyee_token") || "";

let remainingSeconds = 300;
let selectedPaymentChoice = "deposit";

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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getInitials(name = "") {
  const parts = String(name || "Tyee")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR") || "")
    .join("");
}

function renderCheckoutAccount(user = null) {
  if (!checkoutLogin) return;
  if (!user) {
    checkoutLogin.classList.remove("is-authenticated");
    checkoutLogin.href = "/index.html";
    checkoutLogin.textContent = "Giriş Yap / Kayıt Ol";
    return;
  }

  const name = user.name || "Hesabım";
  checkoutLogin.classList.add("is-authenticated");
  checkoutLogin.href = user.canManageVenue ? "/venue.html" : "/index.html#account";
  checkoutLogin.innerHTML = `
    <span class="checkout-login-avatar" aria-hidden="true">${escapeHtml(getInitials(name))}</span>
    <span>${escapeHtml(name)}</span>
  `;
}

async function loadCheckoutAccount() {
  if (!authToken) {
    renderCheckoutAccount(null);
    return;
  }

  try {
    const payload = await fetchJson("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    renderCheckoutAccount(payload.user);
  } catch (error) {
    renderCheckoutAccount(null);
  }
}

function renderLegalTerms(container, terms) {
  if (!container || !terms?.sections?.length) return;
  container.innerHTML = `
    <p><strong>${escapeHtml(terms.title || "Bireysel Kullanıcı ve Rezervasyon Sözleşmesi")}</strong></p>
    <p class="legal-version">Versiyon: ${escapeHtml(terms.version || "-")}</p>
    ${terms.sections
      .map(
        (section) => `
          <section>
            <h3>${escapeHtml(section.title)}</h3>
            ${(section.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </section>
        `,
      )
      .join("")}
  `;
}

async function loadCustomerTerms() {
  const terms = await fetchJson("/api/legal/customer-terms");
  renderLegalTerms(checkoutContract, terms);
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
  const total = billing.totalAmount || draft.totalAmount || 0;
  const online = billing.customerOnlinePayment || 0;
  const venue = billing.customerVenuePayment || 0;
  venueName.textContent = draft.venueName || "İşletme";
  serviceName.textContent = draft.serviceLabel || "Hizmet";
  serviceSubline.textContent = draft.categoryLabel || "Seçilen hizmet";
  dateText.textContent = formatDate(draft.serviceDate);
  timeText.textContent = `${draft.serviceTime} - ${draft.serviceEndTime || ""}`.trim();
  ratingText.textContent = draft.rating ? `${draft.rating} ★★★★★` : "5.0 ★★★★★";
  locationText.textContent = draft.locationLabel || "Konum bilgisi yakında";
  if (summaryMedia) {
    summaryMedia.className = `checkout-summary-media ${draft.mediaClass || "media-field"}`;
  }
  onlineLabel.textContent = online > 0 ? "Kartınızdan çekilecek tutar" : "Online tahsilat";
  onlineAmount.textContent = formatCurrency(online);
  venueAmount.textContent = formatCurrency(venue);
  totalAmount.textContent = formatCurrency(total);
  servicePrice.textContent = formatCurrency(total);
  choiceFullPrice.textContent = formatCurrency(total);
  choiceDepositPrice.textContent = formatCurrency(online || total);
  choiceFullCopy.textContent = "Tek işlemde tamamla";
  choiceDepositCopy.textContent = venue > 0 ? "Minimum tutar tahsil edilir" : "Şimdi ödeyerek tamamla";
  payLaterAmount.textContent = venue > 0 ? formatCurrency(venue) : "Tesiste ödeme yok";
  payLaterCopy.textContent = venue > 0 ? "Kalan tutarı tesiste ödersin" : "Rezervasyonun tamamen ödenmiş olur";
  setPaymentChoice(selectedPaymentChoice);
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

function setPaymentChoice(choice) {
  selectedPaymentChoice = choice === "full" ? "full" : "deposit";
  const billing = draft?.billing || {};
  const total = billing.totalAmount || draft?.totalAmount || 0;
  const online = billing.customerOnlinePayment || 0;
  const venue = billing.customerVenuePayment || 0;
  const payNow = selectedPaymentChoice === "full" ? total : online || total;
  const payLater = selectedPaymentChoice === "full" ? 0 : venue;

  paymentChoices.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.paymentChoice === selectedPaymentChoice);
    button.setAttribute("aria-checked", String(button.dataset.paymentChoice === selectedPaymentChoice));
  });

  payNowAmount.textContent = formatCurrency(payNow);
  payLaterAmount.textContent = payLater > 0 ? formatCurrency(payLater) : "Tesiste ödeme yok";
  submitButton.textContent = `${formatCurrency(payNow)} öde`;
}

paymentTabs.forEach((button) => {
  button.addEventListener("click", () => setPaymentTab(button.dataset.paymentTab));
});

paymentChoices.forEach((button) => {
  button.addEventListener("click", () => setPaymentChoice(button.dataset.paymentChoice));
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
    if (!contractAccept?.checked) {
      throw new Error("Devam etmek için sözleşmeyi okuyup kabul etmelisin.");
    }

    const response = await fetchJson("/api/reservations", {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: JSON.stringify({
        ...draft,
        selectedPaymentChoice,
      }),
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

loadCheckoutAccount();
renderSummary();
loadCustomerTerms().catch(() => {
  if (checkoutContract) checkoutContract.innerHTML = "<p>Sözleşme metni şu anda yüklenemedi.</p>";
});
renderTimer();
setInterval(() => {
  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
    renderTimer();
  }
}, 1000);
