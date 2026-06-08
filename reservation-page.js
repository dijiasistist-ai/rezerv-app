const params = new URLSearchParams(window.location.search);
const listingId = params.get("id") || "kadikoy-arena-hali-saha";

const page = document.querySelector("#booking-page");
const heroMedia = document.querySelector("#booking-hero-media");
const rating = document.querySelector("#booking-rating");
const category = document.querySelector("#booking-category");
const title = document.querySelector("#booking-title");
const locationText = document.querySelector("#booking-location");
const summary = document.querySelector("#booking-summary");
const tags = document.querySelector("#booking-tags");
const reviewsTitle = document.querySelector("#booking-reviews-title");
const reviews = document.querySelector("#booking-reviews");
const form = document.querySelector("#booking-form");
const dateInput = document.querySelector("#booking-date");
const prevDay = document.querySelector("#booking-prev-day");
const nextDay = document.querySelector("#booking-next-day");
const serviceSelect = document.querySelector("#booking-service");
const slotGrid = document.querySelector("#booking-slots");
const nameInput = document.querySelector("#booking-name");
const phoneInput = document.querySelector("#booking-phone");
const emailInput = document.querySelector("#booking-email");
const onlineLabel = document.querySelector("#booking-online-label");
const onlineAmount = document.querySelector("#booking-online-amount");
const totalAmount = document.querySelector("#booking-total-amount");
const policy = document.querySelector("#booking-policy");
const feedback = document.querySelector("#booking-feedback");
const findSlotButton = document.querySelector("#find-slot-button");

const state = {
  listing: null,
  policy: null,
  selectedSlot: "",
};

const fallbackSlots = [
  "08:30",
  "09:30",
  "10:30",
  "11:30",
  "12:30",
  "13:30",
  "14:30",
  "15:30",
  "16:30",
  "17:30",
  "18:30",
  "19:30",
  "20:30",
  "21:30",
  "22:30",
];

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCurrency(value = 0) {
  return `₺${new Intl.NumberFormat("tr-TR").format(Math.round(Number(value || 0)))}`;
}

function todayIso(offset = 1) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function shiftDate(days) {
  const date = new Date(`${dateInput.value || todayIso()}T12:00:00`);
  date.setDate(date.getDate() + days);
  dateInput.value = date.toISOString().slice(0, 10);
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

function buildServices(listing) {
  const baseLabel = listing.categoryLabel || "Hizmet";
  if (listing.category === "hali-saha") return ["Saha 1", "Saha 2", "Kapalı saha"];
  if (listing.category === "padel") return ["Kort 1", "Kort 2", "Ekipmanlı kort"];
  if (listing.category === "pet-kuafor") return ["Küçük ırk bakım", "Büyük ırk bakım", "Kedi bakım"];
  if (listing.category === "guzellik") return ["Cilt bakımı", "Lazer", "Kaş & kirpik"];
  return [baseLabel, `${baseLabel} 2`, "Özel hizmet"];
}

function renderSlots() {
  const listing = state.listing;
  const preferred = listing?.availability?.nextSlot || listing?.eveningTime || "19:30";
  const slots = [...new Set([preferred, ...fallbackSlots])].slice(0, 16);

  slotGrid.innerHTML = slots
    .map((slot, index) => {
      const disabled = index < 4;
      const active = state.selectedSlot === slot;
      return `
        <button class="${active ? "is-active" : ""}" type="button" data-slot="${slot}" ${disabled ? "disabled" : ""}>
          <span>${slot}</span>
          <small>${addHour(slot)}</small>
        </button>
      `;
    })
    .join("");
}

function addHour(value) {
  const [hour, minute] = value.split(":").map(Number);
  return `${String((hour + 1) % 24).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
}

function renderReviews(listing) {
  const sampleReviews = [
    {
      author: "M***** K*****",
      body: "Saatinde başladık, ortam temizdi ve ekip ilgiliydi.",
      date: "16 gün önce",
      stars: "★★★★★",
    },
    {
      author: "İ**** I****",
      body: "Rezervasyon akışı hızlıydı. Konum ve karşılama netti, tekrar tercih ederiz.",
      date: "2 ay önce",
      stars: "★★★★★",
    },
    {
      author: "S**** E****",
      body: "Hizmet kalitesi iyi, fiyat ve müsaitlik bilgisi rezervasyon öncesi açık görünüyor.",
      date: "2 ay önce",
      stars: "★★★★☆",
    },
  ];

  reviewsTitle.textContent = `Yorumlar (${listing.reviews || sampleReviews.length})`;
  reviews.innerHTML = sampleReviews
    .map(
      (item) => `
        <article class="booking-review">
          <div>
            <strong>${escapeHtml(item.author)}</strong>
            <p>${escapeHtml(item.body)}</p>
          </div>
          <aside>
            <span>${escapeHtml(item.date)}</span>
            <strong>${escapeHtml(item.stars)}</strong>
          </aside>
        </article>
      `,
    )
    .join("");
}

async function loadPolicy() {
  if (!state.listing) return;
  policy.textContent = "Ödeme politikası hazırlanıyor.";
  const query = new URLSearchParams({
    venueId: state.listing.venueId || state.listing.id,
    totalAmount: String(state.listing.price || 0),
  });
  const payload = await fetchJson(`/api/reservations/payment-policy?${query.toString()}`);
  state.policy = payload;

  const billing = payload.billing || {};
  onlineLabel.textContent = billing.customerOnlinePayment > 0 ? "Online ödenecek" : "Online ödeme";
  onlineAmount.textContent = formatCurrency(billing.customerOnlinePayment || 0);
  totalAmount.textContent = formatCurrency(billing.totalAmount || state.listing.price || 0);
  policy.textContent = billing.settlement || payload.paymentModeLabel || "İşletme ödeme politikası hazır.";
}

function renderListing(listing) {
  state.listing = listing;
  state.selectedSlot = listing.availability?.nextSlot || listing.eveningTime || "19:30";
  heroMedia.className = `booking-hero-media ${listing.mediaClass || "media-field"}`;
  rating.textContent = listing.rating || "-";
  category.textContent = listing.categoryLabel || "Rezervasyon";
  title.textContent = listing.name;
  locationText.textContent = `${listing.cityLabel || "İstanbul"} · ${listing.distance || ""}`;
  summary.textContent = listing.summary || "Hizmet ve müsaitlik bilgileri işletme tarafından güncellenir.";
  tags.innerHTML = (listing.tags || [])
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");
  serviceSelect.innerHTML = buildServices(listing)
    .map((item) => `<option>${escapeHtml(item)}</option>`)
    .join("");
  renderSlots();
  renderReviews(listing);
}

async function loadPage() {
  dateInput.min = todayIso(0);
  dateInput.value = todayIso(1);
  const payload = await fetchJson(`/api/listings/${encodeURIComponent(listingId)}`);
  renderListing(payload.item);
  await loadPolicy();
}

slotGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-slot]");
  if (!button || button.disabled) return;
  state.selectedSlot = button.dataset.slot;
  renderSlots();
});

prevDay.addEventListener("click", () => shiftDate(-1));
nextDay.addEventListener("click", () => shiftDate(1));
findSlotButton.addEventListener("click", () => {
  const available = slotGrid.querySelector("[data-slot]:not(:disabled)");
  available?.scrollIntoView({ behavior: "smooth", block: "center" });
  available?.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.listing || !state.selectedSlot) return;

  feedback.textContent = "";
  feedback.classList.remove("is-success");
  try {
    await loadPolicy();
    const draft = {
      venueId: state.listing.venueId || state.listing.id,
      listingId: state.listing.id,
      venueName: state.listing.name,
      listingName: state.listing.name,
      category: state.listing.category,
      categoryLabel: state.listing.categoryLabel,
      serviceLabel: serviceSelect.value,
      customerName: nameInput.value.trim(),
      customerPhone: phoneInput.value.trim(),
      customerEmail: emailInput.value.trim(),
      totalAmount: state.listing.price,
      serviceDate: dateInput.value,
      serviceTime: state.selectedSlot,
      serviceEndTime: addHour(state.selectedSlot),
      note: "",
      billing: state.policy?.billing || null,
      paymentModeLabel: state.policy?.paymentModeLabel || "",
    };
    sessionStorage.setItem("tyee_checkout_draft", JSON.stringify(draft));
    window.location.href = "/checkout.html";
  } catch (error) {
    feedback.textContent = error.message;
  }
});

loadPage().catch((error) => {
  page.innerHTML = `<div class="booking-error">${escapeHtml(error.message)}</div>`;
});
