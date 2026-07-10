const params = new URLSearchParams(window.location.search);
const listingId = params.get("id") || "kadikoy-arena-hali-saha";

const page = document.querySelector("#booking-page");
const heroMedia = document.querySelector("#booking-hero-media");
const bookingGallery = document.querySelector("#booking-gallery");
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
const servicePreviewTitle = document.querySelector("#booking-service-preview-title");
const servicePreviewCopy = document.querySelector("#booking-service-preview-copy");
const servicePrice = document.querySelector("#booking-service-price");
const servicePicker = document.querySelector("#booking-service-picker");
const serviceTrigger = document.querySelector("#booking-service-trigger");
const serviceTriggerTitle = document.querySelector("#booking-service-trigger-title");
const serviceTriggerMeta = document.querySelector("#booking-service-trigger-meta");
const serviceOptions = document.querySelector("#booking-service-options");
const loginTrigger = document.querySelector("#login-trigger");
const accountLabel = document.querySelector(".account-label");
const accountAvatar = document.querySelector(".avatar-mini");
const accountMenu = document.querySelector("#account-menu");
const accountMenuCopy = document.querySelector("#account-menu-copy");
const accountDashboard = document.querySelector("#account-dashboard");
const accountAdmin = document.querySelector("#account-admin");
const accountLogout = document.querySelector("#account-logout");
const customerHeaderOnlyItems = document.querySelectorAll(".customer-header-only");
const customerAccountOnlyItems = document.querySelectorAll(".customer-account-only");
const customerPanelTriggers = document.querySelectorAll("[data-customer-panel]");

const state = {
  listing: null,
  policy: null,
  slots: [],
  galleryItems: [],
  selectedGalleryIndex: 0,
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

function safeMediaUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/assets/")) return url;
  return "";
}

function getListingGallery(listing = {}) {
  const seen = new Set();
  const items = [];
  const addItem = (item = {}, fallbackRole = "") => {
    const src = safeMediaUrl(item.src || item);
    if (!src || seen.has(src)) return;
    seen.add(src);
    items.push({
      src,
      role: String(item.role || fallbackRole || `Fotoğraf ${items.length + 1}`).trim(),
      name: String(item.name || "").trim(),
    });
  };

  (Array.isArray(listing.gallery) ? listing.gallery : []).forEach((item, index) => {
    addItem(item, index === 0 ? "Kapak" : `Fotoğraf ${index + 1}`);
  });
  addItem(listing.mediaUrl, "Kapak");
  return items.slice(0, 6);
}

function setHeroMedia(src = "", mediaClass = "media-field") {
  if (!heroMedia) return;
  heroMedia.className = `booking-hero-media ${mediaClass || "media-field"}`;
  const mediaUrl = safeMediaUrl(src);
  heroMedia.style.backgroundImage = "";
  heroMedia.innerHTML = mediaUrl
    ? `
      <img class="booking-hero-backdrop" src="${escapeHtml(mediaUrl)}" alt="" aria-hidden="true" />
      <img class="booking-hero-image" src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(state.listing?.name || "İşletme fotoğrafı")}" />
    `
    : "";
}

function renderBookingGallery(listing = {}) {
  if (!bookingGallery) return;
  state.galleryItems = getListingGallery(listing);
  state.selectedGalleryIndex = 0;
  if (!state.galleryItems.length) {
    bookingGallery.innerHTML = "";
    bookingGallery.hidden = true;
    setHeroMedia(listing.mediaUrl, listing.mediaClass);
    return;
  }

  bookingGallery.hidden = state.galleryItems.length < 2;
  bookingGallery.innerHTML = state.galleryItems
    .map(
      (item, index) => `
        <button class="${index === 0 ? "is-active" : ""}" type="button" data-gallery-index="${index}" aria-label="${escapeHtml(item.role || `Fotoğraf ${index + 1}`)}">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.role || item.name || "İşletme fotoğrafı")}" />
        </button>
      `,
    )
    .join("");
  setHeroMedia(state.galleryItems[0].src, listing.mediaClass);
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

function closeHeaderPopovers() {
  document.querySelectorAll(".header-popover-shell[open]").forEach((node) => {
    node.removeAttribute("open");
  });
}

function closeAccountMenu() {
  if (!accountMenu || !loginTrigger) return;
  accountMenu.classList.add("hidden");
  accountMenu.setAttribute("aria-hidden", "true");
  loginTrigger.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  if (!accountMenu || !loginTrigger) return;
  const willOpen = accountMenu.classList.contains("hidden");
  if (!willOpen) {
    closeAccountMenu();
    return;
  }

  closeHeaderPopovers();
  accountMenu.classList.remove("hidden");
  accountMenu.setAttribute("aria-hidden", "false");
  loginTrigger.setAttribute("aria-expanded", "true");
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
  if (!loginTrigger || !accountLabel || !accountAvatar) return;

  if (!state.user) {
    loginTrigger.classList.remove("is-authenticated");
    accountAvatar.classList.add("hidden");
    accountAvatar.textContent = "";
    accountLabel.textContent = "Giriş Yap / Kayıt Ol";
    accountDashboard?.classList.add("hidden");
    accountAdmin?.classList.add("hidden");
    customerHeaderOnlyItems.forEach((item) => item.classList.remove("hidden"));
    customerAccountOnlyItems.forEach((item) => item.classList.remove("hidden"));
    if (accountMenuCopy) {
      accountMenuCopy.innerHTML = `
        <strong>Hesap</strong>
        <span>Rezervasyonlarını ve oturumunu yönet.</span>
      `;
    }
    closeAccountMenu();
    return;
  }

  const isVenueUser = Boolean(state.user.canManageVenue);
  const needsVerification = !state.user.emailVerified;
  loginTrigger.classList.add("is-authenticated");
  accountAvatar.classList.remove("hidden");
  accountAvatar.textContent = getInitials(state.user.name);
  accountLabel.textContent = state.user.name;
  accountDashboard?.classList.toggle("hidden", !isVenueUser);
  accountAdmin?.classList.toggle("hidden", !state.user.canAccessAdmin);
  customerHeaderOnlyItems.forEach((item) => item.classList.toggle("hidden", isVenueUser));
  customerAccountOnlyItems.forEach((item) => item.classList.toggle("hidden", isVenueUser));
  if (accountMenuCopy) {
    accountMenuCopy.innerHTML = `
      <strong>${escapeHtml(state.user.name)}</strong>
      <span>${
        isVenueUser
          ? "İşletme operasyonunu, satış hizmetlerini ve rezervasyon akışını panelden yönetebilirsin."
          : "Hesabın bireysel kullanım için hazır. İşletme paneli için ayrı bir işletme hesabı gerekir."
      }</span>
      ${
        needsVerification
          ? `<em class="account-verify-note">Doğrulama bekliyor: e-posta</em>`
          : `<em class="account-verify-note is-ok">Hesap doğrulandı</em>`
      }
    `;
  }
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
  const serviceCatalog = getServiceCatalog(listing);
  if (serviceCatalog.length) {
    return serviceCatalog.map((service) => service.name);
  }
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

function getListingBasePrice(listing) {
  return Number(listing?.price || 0);
}

function getServiceCatalog(listing) {
  return (Array.isArray(listing?.serviceCatalog) ? listing.serviceCatalog : [])
    .map((service) => ({
      name: String(service?.name || "").trim(),
      type: String(service?.type || "").trim(),
      duration: String(service?.duration || "").trim(),
      price: Number(service?.price || 0),
    }))
    .filter((service) => service.name);
}

function getSelectedServiceItem(listing = state.listing) {
  const selectedService = serviceSelect.value || "";
  return getServiceCatalog(listing).find((service) => service.name === selectedService) || null;
}

function getSelectedServicePrice(listing = state.listing) {
  const selectedService = getSelectedServiceItem(listing);
  return selectedService?.price || getListingBasePrice(listing);
}

function getServiceMeta(serviceName = "", listing = state.listing) {
  const catalogItem = getServiceCatalog(listing).find((service) => service.name === serviceName);
  const price = catalogItem?.price || getListingBasePrice(listing);
  const meta = [price ? formatCurrency(price) : "", catalogItem?.type, catalogItem?.duration].filter(Boolean);
  return {
    item: catalogItem,
    price,
    metaLabel: meta.join(" · ") || "Detaylar işletmede netleşir",
  };
}

function closeServicePicker() {
  serviceOptions?.classList.add("hidden");
  serviceTrigger?.setAttribute("aria-expanded", "false");
}

function openServicePicker() {
  if (!serviceOptions || !serviceTrigger) return;
  serviceOptions.classList.remove("hidden");
  serviceTrigger.setAttribute("aria-expanded", "true");
}

function renderServicePicker(listing = state.listing) {
  if (!serviceOptions || !serviceTrigger || !serviceSelect) return;
  const services = buildServices(listing || {});
  const selectedService = serviceSelect.value || services[0] || "";
  const selectedMeta = getServiceMeta(selectedService, listing);

  if (serviceTriggerTitle) serviceTriggerTitle.textContent = selectedService || "Hizmet seç";
  if (serviceTriggerMeta) serviceTriggerMeta.textContent = selectedMeta.metaLabel;

  serviceOptions.innerHTML = services
    .map((serviceName) => {
      const isSelected = serviceName === selectedService;
      const serviceMeta = getServiceMeta(serviceName, listing);
      return `
        <button class="booking-service-option ${isSelected ? "is-selected" : ""}" type="button" role="option" aria-selected="${isSelected ? "true" : "false"}" data-service-option="${escapeHtml(serviceName)}">
          <span>
            <strong>${escapeHtml(serviceName)}</strong>
            <small>${escapeHtml(serviceMeta.metaLabel)}</small>
          </span>
          <em>${isSelected ? "✓" : ""}</em>
        </button>
      `;
    })
    .join("");
}

function selectBookingService(serviceName = "") {
  if (!serviceName || !serviceSelect) return;
  serviceSelect.value = serviceName;
  state.selectedSlot = "";
  renderServicePicker();
  updateServicePreview();
  closeServicePicker();
  loadAvailability();
  loadPolicy();
}

function updateServicePreview() {
  if (!state.listing) return;
  const selectedService = serviceSelect.value || state.listing.categoryLabel || "Hizmet";
  const selectedServiceItem = getSelectedServiceItem();
  const slotCount = (state.slots || []).filter((slot) => slot.available).length;
  if (servicePreviewTitle) servicePreviewTitle.textContent = selectedService;
  if (servicePreviewCopy) {
    servicePreviewCopy.textContent =
      slotCount > 0
        ? `${dateInput.value} için ${slotCount} uygun saat bulundu.`
        : "Müsait saatler yükleniyor veya bu tarih için uygun saat bulunmuyor.";
  }
  if (servicePrice) {
    const meta = [selectedServiceItem?.type, selectedServiceItem?.duration].filter(Boolean).join(" · ");
    servicePrice.textContent = [formatCurrency(getSelectedServicePrice()), meta].filter(Boolean).join(" · ");
  }
  renderServicePicker();
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
    updateServicePreview();
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

  updateServicePreview();

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
  const selectedTotal = getSelectedServicePrice(state.listing);
  const query = new URLSearchParams({
    venueId: state.listing.venueId || state.listing.id,
    totalAmount: String(selectedTotal || 0),
  });
  const payload = await fetchJson(`/api/reservations/payment-policy?${query.toString()}`);
  state.policy = payload;

  const billing = payload.billing || {};
  onlineLabel.textContent = billing.customerOnlinePayment > 0 ? "Online ödenecek" : "Online ödeme";
  onlineAmount.textContent = formatCurrency(billing.customerOnlinePayment || 0);
  totalAmount.textContent = formatCurrency(billing.totalAmount || selectedTotal || 0);
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
  renderBookingGallery(listing);
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
  renderServicePicker(listing);
  const nextAvailableDate = listing.availability?.nextDate || listing.nextDate || "";
  if (nextAvailableDate && (!dateInput.min || nextAvailableDate >= dateInput.min)) {
    dateInput.value = nextAvailableDate;
  }
  updateServicePreview();
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
serviceSelect.addEventListener("change", () => selectBookingService(serviceSelect.value));

serviceTrigger?.addEventListener("click", () => {
  const willOpen = serviceOptions?.classList.contains("hidden");
  if (willOpen) {
    openServicePicker();
    return;
  }
  closeServicePicker();
});

serviceOptions?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-service-option]");
  if (!option) return;
  selectBookingService(option.dataset.serviceOption || "");
});

bookingGallery?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gallery-index]");
  if (!button || !state.listing) return;
  const index = Number(button.dataset.galleryIndex);
  const item = state.galleryItems[index];
  if (!item) return;
  state.selectedGalleryIndex = index;
  setHeroMedia(item.src, state.listing.mediaClass);
  bookingGallery.querySelectorAll("[data-gallery-index]").forEach((node) => {
    node.classList.toggle("is-active", Number(node.dataset.galleryIndex) === index);
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.listing) return;

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
      rating: state.listing.rating,
      locationLabel: `${state.listing.cityLabel || "Istanbul"}${state.listing.distance ? ` · ${state.listing.distance}` : ""}`,
      mediaClass: state.listing.mediaClass || "media-field",
      serviceLabel: serviceSelect.value,
      customerName: nameInput.value.trim(),
      customerPhone: phoneInput.value.trim(),
      customerEmail: emailInput.value.trim(),
      totalAmount: getSelectedServicePrice(state.listing),
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

document.querySelectorAll(".header-popover-shell").forEach((shell) => {
  shell.addEventListener("toggle", () => {
    if (!shell.open) return;
    closeAccountMenu();
    document.querySelectorAll(".header-popover-shell[open]").forEach((node) => {
      if (node !== shell) node.removeAttribute("open");
    });
  });
});

loginTrigger?.addEventListener("click", () => {
  if (state.user) {
    toggleAccountMenu();
    return;
  }

  window.location.href = "/index.html";
});

accountDashboard?.addEventListener("click", () => {
  closeAccountMenu();
  window.location.href = "/venue.html";
});

accountAdmin?.addEventListener("click", () => {
  closeAccountMenu();
  window.location.href = "/admin.html";
});

customerPanelTriggers.forEach((button) => {
  button.addEventListener("click", () => {
    closeAccountMenu();
    window.location.href = `/index.html#${button.dataset.customerPanel || "hero"}`;
  });
});

accountLogout?.addEventListener("click", () => {
  localStorage.removeItem("tyee_token");
  state.token = "";
  state.user = null;
  closeAccountMenu();
  renderAccountState();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".booking-service-picker")) {
    closeServicePicker();
  }
  if (event.target.closest(".account-shell")) return;
  if (event.target.closest(".header-popover-shell")) return;
  closeAccountMenu();
  closeHeaderPopovers();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeServicePicker();
});

loadPage().catch((error) => {
  page.innerHTML = `<div class="booking-error">${escapeHtml(error.message)}</div>`;
});
