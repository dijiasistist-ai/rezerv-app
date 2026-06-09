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
const facilities = document.querySelector("#booking-facilities");
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
const accountLink = document.querySelector("#booking-account-link");
const accountAvatar = document.querySelector("#booking-account-avatar");
const accountLabel = document.querySelector("#booking-account-label");

const state = {
  listing: null,
  policy: null,
  slots: [],
  availabilityLoading: false,
  selectedSlot: "",
  token: localStorage.getItem("tyee_token") || "",
  user: null,
};

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

function getInitials(name = "") {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR") || "T";
}

function formatLocalDateIso(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function todayIso(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatLocalDateIso(date);
}

function shiftDate(days) {
  const date = new Date(`${dateInput.value || todayIso()}T12:00:00`);
  date.setDate(date.getDate() + days);
  dateInput.value = formatLocalDateIso(date);
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

function renderAccountState() {
  if (!state.user) {
    accountLink.classList.remove("is-authenticated");
    accountAvatar.classList.add("hidden");
    accountAvatar.textContent = "";
    accountLabel.textContent = "Giriş Yap / Kayıt Ol";
    accountLink.href = "/index.html";
    return;
  }

  accountLink.classList.add("is-authenticated");
  accountAvatar.classList.remove("hidden");
  accountAvatar.textContent = getInitials(state.user.name);
  accountLabel.textContent = state.user.name;
  accountLink.href = "/index.html";
}

function prefillCustomerFields() {
  if (!state.user) return;
  if (!nameInput.value) nameInput.value = state.user.name || "";
  if (!phoneInput.value) phoneInput.value = state.user.phone || "";
  if (!emailInput.value) emailInput.value = state.user.email || "";
}

async function loadCurrentUser() {
  if (!state.token) {
    renderAccountState();
    return;
  }

  try {
    const payload = await fetchJson("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${state.token}` },
    });
    state.user = payload.user;
    renderAccountState();
    prefillCustomerFields();
  } catch (_error) {
    localStorage.removeItem("tyee_token");
    state.token = "";
    state.user = null;
    renderAccountState();
  }
}

function buildServices(listing) {
  if (Array.isArray(listing.serviceOptions) && listing.serviceOptions.length) {
    return listing.serviceOptions;
  }
  const baseLabel = listing.categoryLabel || "Hizmet";
  if (listing.category === "hali-saha") return ["Saha 1", "Saha 2", "Kapalı saha"];
  if (listing.category === "padel") return ["Kort 1", "Kort 2", "Ekipmanlı kort"];
  if (listing.category === "pet-kuafor") return ["Küçük ırk bakım", "Büyük ırk bakım", "Kedi bakım"];
  if (listing.category === "guzellik") return ["Cilt bakımı", "Lazer", "Kaş & kirpik"];
  return [baseLabel, `${baseLabel} 2`, "Özel hizmet"];
}

function isTimeValue(value = "") {
  return /^\d{1,2}:\d{2}$/.test(String(value || ""));
}

function renderSlots() {
  if (state.availabilityLoading) {
    slotGrid.innerHTML = `<div class="booking-slot-empty">İşletme takvimi okunuyor...</div>`;
    return;
  }

  const slots = (state.slots || []).filter((slot) => slot.available);
  if (!slots.length) {
    state.selectedSlot = "";
    slotGrid.innerHTML = `
      <div class="booking-slot-empty">
        Bu tarih için işletme takviminde rezervasyona açık saat yok.
      </div>
    `;
    return;
  }

  const selectedIsAvailable = slots.some((slot) => slot.time === state.selectedSlot);
  if (!selectedIsAvailable) {
    state.selectedSlot = slots[0]?.time || "";
  }

  slotGrid.innerHTML = slots
    .map((slot) => {
      const active = state.selectedSlot === slot.time;
      return `
        <button class="${active ? "is-active" : ""}" type="button" data-slot="${escapeHtml(slot.time)}">
          <span>${escapeHtml(slot.time)}</span>
          <small>${escapeHtml(slot.endTime || addHour(slot.time))}</small>
        </button>
      `;
    })
    .join("");
}

function addHour(value) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
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

function renderFacilities(listing) {
  const items = Array.isArray(listing.facilities) ? listing.facilities : [];
  if (!items.length) {
    facilities.innerHTML = `
      <div class="booking-empty-info">
        İşletme henüz tesis özelliklerini işaretlemedi. İşletme panelinde seçildikçe burada görünecek.
      </div>
    `;
    return;
  }

  facilities.innerHTML = `
    <div class="booking-facility-grid">
      ${items
        .map(
          (item) => `
            <div class="booking-facility-item">
              <span aria-hidden="true">${escapeHtml(item.icon || "✓")}</span>
              <strong>${escapeHtml(item.label)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
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

async function loadAvailability() {
  if (!state.listing) return;
  state.availabilityLoading = true;
  renderSlots();

  const query = new URLSearchParams({
    date: dateInput.value,
    service: serviceSelect.value || "",
  });
  try {
    const payload = await fetchJson(
      `/api/listings/${encodeURIComponent(state.listing.id)}/availability?${query.toString()}`,
    );
    state.slots = Array.isArray(payload.slots) ? payload.slots : [];
    state.selectedSlot = payload.nextSlot || "";
  } catch (error) {
    state.slots = [];
    feedback.textContent = error.message;
  } finally {
    state.availabilityLoading = false;
    renderSlots();
  }
}

function renderListing(listing) {
  state.listing = listing;
  state.selectedSlot = "";
  state.slots = [];
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
  renderFacilities(listing);
  renderReviews(listing);
}

async function loadPage() {
  dateInput.min = todayIso(0);
  dateInput.value = todayIso(0);
  await loadCurrentUser();
  const payload = await fetchJson(`/api/listings/${encodeURIComponent(listingId)}`);
  renderListing(payload.item);
  await loadAvailability();
  await loadPolicy();
}

slotGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-slot]");
  if (!button || button.disabled) return;
  state.selectedSlot = button.dataset.slot;
  renderSlots();
});

prevDay.addEventListener("click", () => {
  shiftDate(-1);
  loadAvailability();
});
nextDay.addEventListener("click", () => {
  shiftDate(1);
  loadAvailability();
});
dateInput.addEventListener("change", () => loadAvailability());
serviceSelect.addEventListener("change", () => loadAvailability());

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.listing || !state.selectedSlot) return;

  feedback.textContent = "";
  feedback.classList.remove("is-success");
  try {
    if (!state.selectedSlot) throw new Error("Lütfen işletme takviminden açık bir saat seç.");
    await loadPolicy();
    const selectedSlot = state.slots.find((slot) => slot.time === state.selectedSlot);
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
      serviceEndTime: selectedSlot?.endTime || addHour(state.selectedSlot),
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
