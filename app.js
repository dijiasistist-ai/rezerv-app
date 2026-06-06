const listingGrid = document.querySelector("#listing-grid");
const filterPillsContainer = document.querySelector("#filter-pills");
const categoryRail = document.querySelector("#category-rail");
const searchPanel = document.querySelector("#search-panel");
const queryInput = document.querySelector("#search-query");
const citySelect = document.querySelector("#search-city");
const timeInput = document.querySelector("#search-time");
const heroMetrics = document.querySelector("#hero-metrics");
const hotSlots = document.querySelector("#hot-slots");
const resultsSummary = document.querySelector("#results-summary");
const mosaicCards = document.querySelectorAll("[data-mosaic-category]");
const loginTrigger = document.querySelector("#login-trigger");
const accountLabel = document.querySelector(".account-label");
const avatarMini = document.querySelector(".avatar-mini");
const accountMenu = document.querySelector("#account-menu");
const accountMenuCopy = document.querySelector("#account-menu-copy");
const accountEnableVenue = document.querySelector("#account-enable-venue");
const accountDashboard = document.querySelector("#account-dashboard");
const accountAdmin = document.querySelector("#account-admin");
const accountLogout = document.querySelector("#account-logout");
const authModal = document.querySelector("#auth-modal");
const authClose = document.querySelector("#auth-close");
const authCloseButton = document.querySelector("#auth-close-button");
const authTitle = document.querySelector("#auth-title");
const authTabs = document.querySelectorAll(".auth-tab");
const authForm = document.querySelector("#auth-form");
const authStepEntry = document.querySelector("#auth-step-entry");
const authName = document.querySelector("#auth-name");
const authPhone = document.querySelector("#auth-phone");
const authEmail = document.querySelector("#auth-email");
const authPassword = document.querySelector("#auth-password");
const authSubmit = document.querySelector("#auth-submit");
const authFeedback = document.querySelector("#auth-feedback");
const nameField = document.querySelector("#name-field");
const phoneField = document.querySelector("#phone-field");
const authStepForm = document.querySelector("#auth-step-form");
const authStepRole = document.querySelector("#auth-step-role");
const authBackToForm = document.querySelector("#auth-back-to-form");
const authEntryBack = document.querySelector("#auth-entry-back");
const authRoleChoices = document.querySelectorAll("[data-role-choice]");
const authEntryChoices = document.querySelectorAll("[data-entry-choice]");
const popularSearches = document.querySelector(".popular-searches");
const nearbyMapTrigger = document.querySelector("#nearby-map-trigger");
const nearbyMapModal = document.querySelector("#nearby-map-modal");
const nearbyMapClose = document.querySelector("#nearby-map-close");
const nearbyMapDismiss = document.querySelector("#nearby-map-dismiss");
const nearbyLocate = document.querySelector("#nearby-locate");
const nearbyMapStatus = document.querySelector("#nearby-map-status");
const nearbyResults = document.querySelector("#nearby-results");

const state = {
  category: "all",
  city: "all",
  query: "",
  time: "Bugün, 19:00",
  categories: [],
  featuredListings: [],
  authMode: "login",
  authEntry: "customer",
  authStep: "form",
  pendingRegistration: null,
  token: localStorage.getItem("zuvu_token") || "",
  user: null,
  nearbyMap: null,
  nearbyMarkers: [],
  nearbyUserMarker: null,
  nearbyOrigin: { lat: 41.0351, lng: 29.0268 },
};

function normalize(value = "") {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatPrice(value) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function getInitials(name = "Dilek Yıldız") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

function getActiveCategory() {
  const active = document.querySelector(".filter-pill.is-active");
  return active ? active.dataset.filter : "all";
}

function setActiveCategory(categoryId) {
  document.querySelectorAll("[data-filter]").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.filter === categoryId);
  });
}

function setNearbyStatus(message) {
  if (nearbyMapStatus) nearbyMapStatus.textContent = message;
}

function buildMapIcon(item) {
  return L.divIcon({
    className: "zuvu-map-pin",
    html: `<span>${item.icon || "✦"}</span>`,
    iconSize: [42, 52],
    iconAnchor: [21, 50],
    popupAnchor: [0, -44],
  });
}

function buildUserIcon() {
  return L.divIcon({
    className: "zuvu-user-pin",
    html: "<span>⌖</span>",
    iconSize: [54, 54],
    iconAnchor: [27, 27],
  });
}

function ensureNearbyMap() {
  if (!window.L) {
    setNearbyStatus("Harita kütüphanesi yüklenemedi. İnternet bağlantısını kontrol et.");
    return null;
  }

  if (state.nearbyMap) {
    setTimeout(() => state.nearbyMap.invalidateSize(), 80);
    return state.nearbyMap;
  }

  state.nearbyMap = L.map("nearby-map", {
    center: [state.nearbyOrigin.lat, state.nearbyOrigin.lng],
    zoom: 12,
    zoomControl: false,
  });

  L.control.zoom({ position: "bottomright" }).addTo(state.nearbyMap);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 19,
  }).addTo(state.nearbyMap);

  setTimeout(() => state.nearbyMap.invalidateSize(), 80);

  return state.nearbyMap;
}

function clearNearbyMarkers() {
  state.nearbyMarkers.forEach((marker) => marker.remove());
  state.nearbyMarkers = [];
  if (state.nearbyUserMarker) {
    state.nearbyUserMarker.remove();
    state.nearbyUserMarker = null;
  }
}

function renderNearbyResults(items = []) {
  nearbyResults.innerHTML = items.length
    ? items
        .slice(0, 6)
        .map(
          (item) => `
            <button class="nearby-result" data-marker-id="${item.id}" type="button">
              <span>${item.icon || "✦"}</span>
              <strong>${item.name}</strong>
              <small>${item.categoryLabel} · ${item.cityLabel} · ${item.distanceLabel}</small>
              <em>${item.nextSlot} müsait · ₺${item.priceLabel}</em>
            </button>
          `,
        )
        .join("")
    : `
      <article class="nearby-empty">
        <strong>Yakında işletme yok</strong>
        <span>Bu bölgede yayına alınmış işletme bulunamadı.</span>
      </article>
    `;
}

async function loadNearbyMap(origin = state.nearbyOrigin) {
  const map = ensureNearbyMap();
  if (!map) return;

  state.nearbyOrigin = origin;
  setNearbyStatus("Yakındaki işletmeler hesaplanıyor...");

  const params = new URLSearchParams({
    lat: String(origin.lat),
    lng: String(origin.lng),
  });
  const payload = await fetchJson(`/api/nearby?${params.toString()}`);
  const items = payload.items || [];

  clearNearbyMarkers();
  state.nearbyUserMarker = L.marker([origin.lat, origin.lng], { icon: buildUserIcon() })
    .addTo(map)
    .bindPopup("Konumun");

  items.forEach((item) => {
    const marker = L.marker([item.lat, item.lng], { icon: buildMapIcon(item) })
      .addTo(map)
      .bindPopup(`<strong>${item.name}</strong><br>${item.categoryLabel}<br>${item.distanceLabel}`);
    marker.zuvuId = item.id;
    state.nearbyMarkers.push(marker);
  });

  const bounds = L.latLngBounds([[origin.lat, origin.lng], ...items.map((item) => [item.lat, item.lng])]);
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [42, 42], maxZoom: 13 });

  renderNearbyResults(items);
  setNearbyStatus(
    items.length
      ? `${items.length} işletme kategori ikonlarıyla haritada gösteriliyor.`
      : "Bu konuma yakın işletme bulunamadı.",
  );
}

function requestNearbyLocation() {
  if (!navigator.geolocation) {
    loadNearbyMap();
    setNearbyStatus("Tarayıcı konum desteği vermiyor; İstanbul merkeziyle gösteriliyor.");
    return;
  }

  setNearbyStatus("Konum izni bekleniyor...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      loadNearbyMap({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    () => {
      loadNearbyMap();
      setNearbyStatus("Konum izni verilmedi; İstanbul merkeziyle gösteriliyor.");
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
  );
}

function openNearbyMap(event) {
  if (event) event.preventDefault();
  nearbyMapModal.classList.remove("hidden");
  nearbyMapModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  if (state.nearbyMap) setTimeout(() => state.nearbyMap.invalidateSize(), 80);
  requestNearbyLocation();
}

function closeNearbyMap() {
  nearbyMapModal.classList.add("hidden");
  nearbyMapModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function renderHeroMetrics(items = []) {
  heroMetrics.innerHTML = items
    .map(
      (item) => `
        <article>
          <span class="metric-icon">✦</span>
          <strong>${item.value}</strong>
          <small>${item.label}</small>
        </article>
      `,
    )
    .join("");
}

function renderHotSlots(items = []) {
  hotSlots.innerHTML = items
    .map(
      (item) => `
        <article class="evening-card">
          <div class="evening-thumb ${item.mediaClass || "media-pet"}"></div>
          <div>
            <strong>${item.time}</strong>
            <span>${item.title}</span>
            <small>${item.venue || ""}</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderCities(items = []) {
  citySelect.innerHTML = items
    .map((item) => `<option value="${item.id}">${item.label}</option>`)
    .join("");

  const istanbul = items.find((item) => item.id === "istanbul");
  if (istanbul) citySelect.value = "istanbul";
  state.city = citySelect.value || "all";
}

function renderCategories(items = []) {
  state.categories = items;
  const filterItems = [{ id: "all", label: "Hepsi" }, ...items.slice(0, 8)];

  filterPillsContainer.innerHTML = filterItems
    .map(
      (item) => `
        <button class="filter-pill${item.id === state.category ? " is-active" : ""}" data-filter="${item.id}" type="button">
          ${item.label}
        </button>
      `,
    )
    .join("");

  categoryRail.innerHTML = items
    .map(
      (item) => `
        <button class="category-card${item.id === state.category ? " is-active" : ""}" data-filter="${item.id}" type="button">
          <span>${item.icon || "✦"}</span>
          <strong>${item.label}</strong>
          <small>${item.count || ""}</small>
        </button>
      `,
    )
    .join("");
}

function renderMosaicCounts(items = []) {
  const categoriesById = new Map(items.map((item) => [item.id, item]));

  mosaicCards.forEach((card) => {
    const category = categoriesById.get(card.dataset.mosaicCategory);
    const countNode = card.querySelector("small");
    if (!category || !countNode) return;

    const noun = card.dataset.mosaicCategory === "direksiyon" ? "öğretmen" : "işletme";
    countNode.textContent = `${category.count || "0"} ${noun}`;
  });
}

function renderResultsSummary(total) {
  const queryText = state.query ? `"${state.query}" için ` : "";
  resultsSummary.textContent = `${queryText}${total} işletme gösteriliyor`;
}

function renderListings(items = []) {
  if (!items.length) {
    listingGrid.innerHTML = `
      <article class="empty-state">
        <h3>Sonuç bulunamadı</h3>
        <p>Filtreleri biraz genişletip tekrar deneyin.</p>
      </article>
    `;
    return;
  }

  listingGrid.innerHTML = items
    .map(
      (item) => {
        const badges = (item.rankBadges || item.tags || [])
          .filter((badge) => !normalize(badge).includes("musait"))
          .slice(0, 2)
          .map((badge) => `<span>${badge}</span>`)
          .join("");
        const availabilityLabel = item.availability?.today
          ? `${item.availability.nextSlot || item.eveningTime} müsait`
          : item.availability?.nextSlot || "Yakında müsait";

        return `
        <article class="listing-card" data-id="${item.id}">
          <div class="listing-media ${item.mediaClass || "media-pet"}">
            <span>${availabilityLabel}</span>
            <button type="button" aria-label="Kaydet">♡</button>
          </div>
          <div class="listing-body">
            <div class="rating-row">
              <span>★ ${item.rating.toFixed(1)}</span>
              <small>(${item.reviews || 0})</small>
            </div>
            <h3>${item.name}</h3>
            <p>${item.cityLabel} · ${item.distance || "0.9 km"}</p>
            <div class="rank-badges">${badges}</div>
            <div class="listing-price">
              <strong>₺${item.priceLabel || formatPrice(item.price)}</strong>
              <span>/ ${item.priceUnit}</span>
            </div>
            <button class="solid-button card-cta" type="button">${item.cta}</button>
          </div>
        </article>
      `;
      },
    )
    .join("");
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function apiRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "İstek başarısız oldu.");
  }

  return payload;
}

async function loadBootstrap() {
  const payload = await fetchJson("/api/bootstrap");
  renderCities(payload.cities);
  renderCategories(payload.categories);
  renderMosaicCounts(payload.categories);
  renderHeroMetrics(payload.heroMetrics);
  renderHotSlots(payload.hotSlots);
  state.featuredListings = payload.featuredListings || [];
  renderListings(state.featuredListings);
  renderResultsSummary(state.featuredListings.length);
}

async function loadListings() {
  const params = new URLSearchParams({
    category: state.category,
    city: state.city,
    query: state.query,
    time: state.time,
  });

  const payload = await fetchJson(`/api/listings?${params.toString()}`);
  renderListings(payload.items);
  renderResultsSummary(payload.total);
}

function setAuthMode(mode) {
  state.authMode = mode;
  state.authStep = mode === "login" ? "entry" : "form";
  state.pendingRegistration = null;
  authTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
  const isRegister = mode === "register";
  authTitle.textContent = isRegister ? "Kayıt ol" : "Giriş yap";
  authSubmit.textContent = isRegister ? "Devam Et" : "Giriş Yap";
  nameField.classList.toggle("hidden", !isRegister);
  phoneField.classList.toggle("hidden", !isRegister);
  authStepEntry.classList.toggle("hidden", !(!isRegister && state.authStep === "entry"));
  authStepForm.classList.toggle("hidden", !isRegister && state.authStep === "entry");
  authStepRole.classList.add("hidden");
  authEntryBack.classList.toggle("hidden", isRegister || state.authStep === "entry");
  authFeedback.textContent = "";
  authFeedback.classList.remove("is-success");
}

function openAuthModal(mode = "login") {
  setAuthMode(mode);
  closeAccountMenu();
  authModal.classList.remove("hidden");
  authModal.setAttribute("aria-hidden", "false");
}

function closeAuthModal() {
  authModal.classList.add("hidden");
  authModal.setAttribute("aria-hidden", "true");
  state.authStep = "form";
  state.pendingRegistration = null;
}

function showAuthFormStep() {
  authStepEntry.classList.add("hidden");
  authStepRole.classList.add("hidden");
  authStepForm.classList.remove("hidden");
  authEntryBack.classList.toggle("hidden", state.authMode !== "login");
}

function closeAccountMenu() {
  accountMenu.classList.add("hidden");
  accountMenu.setAttribute("aria-hidden", "true");
  loginTrigger.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  const willOpen = accountMenu.classList.contains("hidden");
  if (!willOpen) {
    closeAccountMenu();
    return;
  }

  accountMenu.classList.remove("hidden");
  accountMenu.setAttribute("aria-hidden", "false");
  loginTrigger.setAttribute("aria-expanded", "true");
}

function updateAuthUi() {
  if (state.user) {
    const needsVerification = !state.user.emailVerified || (state.user.phone && !state.user.phoneVerified);
    accountLabel.textContent = state.user.name;
    avatarMini.textContent = getInitials(state.user.name);
    loginTrigger.classList.add("is-authenticated");
    accountMenuCopy.innerHTML = `
      <strong>${state.user.name}</strong>
      <span>${
        state.user.canManageVenue
          ? "Bireysel rezervasyonlarını kullanabilir veya işletme paneline geçebilirsin."
          : "Hesabın bireysel kullanım için hazır. İstersen aynı hesapta işletme modunu da açabilirsin."
      }</span>
      ${
        needsVerification
          ? `<em class="account-verify-note">Doğrulama bekliyor: ${
              !state.user.emailVerified ? "e-posta" : ""
            }${!state.user.emailVerified && state.user.phone && !state.user.phoneVerified ? " + " : ""}${
              state.user.phone && !state.user.phoneVerified ? "SMS" : ""
            }</em>`
          : `<em class="account-verify-note is-ok">Hesap doğrulandı</em>`
      }
    `;
    accountDashboard.classList.toggle("hidden", !state.user.canManageVenue);
    accountEnableVenue.classList.toggle("hidden", state.user.canManageVenue);
    accountAdmin.classList.toggle("hidden", !state.user.canAccessAdmin);
  } else {
    accountLabel.textContent = "Giriş Yap";
    avatarMini.textContent = "R";
    loginTrigger.classList.remove("is-authenticated");
    accountDashboard.classList.add("hidden");
    accountEnableVenue.classList.add("hidden");
    accountAdmin.classList.add("hidden");
    accountMenuCopy.innerHTML = `
      <strong>Hesap</strong>
      <span>Rezervasyonlarını ve oturumunu yönet.</span>
    `;
    closeAccountMenu();
  }
}

async function loadCurrentUser() {
  if (!state.token) {
    updateAuthUi();
    return;
  }

  try {
    const payload = await apiRequest("/api/auth/me", { method: "GET" });
    state.user = payload.user;
    updateAuthUi();
  } catch (error) {
    localStorage.removeItem("zuvu_token");
    state.token = "";
    state.user = null;
    updateAuthUi();
  }
}

function handleCategoryClick(event) {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  state.category = button.dataset.filter;
  setActiveCategory(state.category);
  loadListings();
}

filterPillsContainer.addEventListener("click", handleCategoryClick);
categoryRail.addEventListener("click", handleCategoryClick);

popularSearches.addEventListener("click", (event) => {
  const button = event.target.closest("[data-search]");
  if (!button) return;

  queryInput.value = button.dataset.search;
  state.query = queryInput.value.trim();
  state.category = "all";
  setActiveCategory("all");
  loadListings();
});

searchPanel.addEventListener("submit", (event) => {
  event.preventDefault();
  state.query = queryInput.value.trim();
  state.city = citySelect.value;
  state.time = timeInput.value.trim();
  state.category = getActiveCategory();
  loadListings();
  listingGrid.scrollIntoView({ behavior: "smooth", block: "start" });
});

queryInput.addEventListener("input", () => {
  state.query = queryInput.value.trim();
  loadListings();
});

citySelect.addEventListener("change", () => {
  state.city = citySelect.value;
  loadListings();
});

timeInput.addEventListener("change", () => {
  state.time = timeInput.value.trim();
  loadListings();
});

nearbyMapTrigger.addEventListener("click", openNearbyMap);
nearbyLocate.addEventListener("click", requestNearbyLocation);
nearbyMapClose.addEventListener("click", closeNearbyMap);
nearbyMapDismiss.addEventListener("click", closeNearbyMap);
nearbyResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-marker-id]");
  if (!button || !state.nearbyMap) return;
  const marker = state.nearbyMarkers.find((item) => item.zuvuId === button.dataset.markerId);
  if (!marker) return;
  state.nearbyMap.setView(marker.getLatLng(), 15, { animate: true });
  marker.openPopup();
});

loginTrigger.addEventListener("click", () => {
  if (state.user) {
    toggleAccountMenu();
    return;
  }

  openAuthModal("login");
});

accountDashboard.addEventListener("click", () => {
  closeAccountMenu();
  window.location.href = "/venue.html";
});

accountAdmin.addEventListener("click", () => {
  closeAccountMenu();
  window.location.href = "/admin.html";
});

accountEnableVenue.addEventListener("click", async () => {
  try {
    const response = await apiRequest("/api/auth/enable-venue", {
      method: "POST",
      body: JSON.stringify({}),
    });

    state.user = response.user;
    updateAuthUi();
    closeAccountMenu();
    window.location.href = "/venue.html";
  } catch (error) {
    closeAccountMenu();
    openAuthModal("login");
    authFeedback.textContent = error.message;
    authFeedback.classList.remove("is-success");
  }
});

accountLogout.addEventListener("click", () => {
  localStorage.removeItem("zuvu_token");
  state.token = "";
  state.user = null;
  authForm.reset();
  updateAuthUi();
});

authClose.addEventListener("click", closeAuthModal);
authCloseButton.addEventListener("click", closeAuthModal);

document.addEventListener("click", (event) => {
  if (!state.user) return;
  if (event.target.closest(".account-shell")) return;
  closeAccountMenu();
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.mode));
});

authBackToForm.addEventListener("click", () => {
  state.authStep = "form";
  authStepRole.classList.add("hidden");
  authStepForm.classList.remove("hidden");
});

authEntryBack.addEventListener("click", () => {
  state.authStep = "entry";
  authFeedback.textContent = "";
  authFeedback.classList.remove("is-success");
  authStepForm.classList.add("hidden");
  authStepRole.classList.add("hidden");
  authStepEntry.classList.remove("hidden");
  authEntryBack.classList.add("hidden");
});

authEntryChoices.forEach((button) => {
  button.addEventListener("click", () => {
    state.authEntry = button.dataset.entryChoice;
    state.authStep = "form";
    authTitle.textContent = state.authEntry === "venue" ? "İşletme girişi" : "Bireysel giriş";
    showAuthFormStep();
  });
});

authRoleChoices.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!state.pendingRegistration) return;

    authFeedback.textContent = "";
    authFeedback.classList.remove("is-success");

    try {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...state.pendingRegistration,
          role: button.dataset.roleChoice,
        }),
      });

      state.token = response.token;
      state.user = response.user;
      localStorage.setItem("zuvu_token", response.token);
      updateAuthUi();
      authFeedback.textContent = response.nextStep || "Hesap oluşturuldu. Giriş yapıldı.";
      authFeedback.classList.add("is-success");
      authForm.reset();
      setTimeout(closeAuthModal, 900);
    } catch (error) {
      authStepRole.classList.add("hidden");
      authStepForm.classList.remove("hidden");
      authFeedback.textContent = error.message;
      authFeedback.classList.remove("is-success");
    }
  });
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authFeedback.textContent = "";
  authFeedback.classList.remove("is-success");

  const isRegister = state.authMode === "register";
  const payload = {
    email: authEmail.value.trim(),
    password: authPassword.value,
  };

  if (isRegister) {
    payload.name = authName.value.trim();
    payload.phone = authPhone.value.trim();
    state.pendingRegistration = payload;
    state.authStep = "role";
    authStepForm.classList.add("hidden");
    authStepRole.classList.remove("hidden");
    return;
  }

  try {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    state.token = response.token;
    state.user = response.user;
    localStorage.setItem("zuvu_token", response.token);
    updateAuthUi();
    authFeedback.textContent = "Giriş başarılı.";
    authFeedback.classList.add("is-success");
    authForm.reset();
    setTimeout(() => {
      if (response.user.canAccessAdmin) {
        closeAuthModal();
        window.location.href = "/admin.html";
        return;
      }

      if (state.authEntry === "venue") {
        if (response.user.canManageVenue) {
          closeAuthModal();
          window.location.href = "/venue.html";
          return;
        }

        authFeedback.textContent =
          "Bu hesapta işletme modu açık değil. Bireysel giriş kullanabilir veya işletme modunu açabilirsin.";
        authFeedback.classList.remove("is-success");
        return;
      }

      closeAuthModal();
    }, 500);
  } catch (error) {
    authFeedback.textContent = error.message;
    authFeedback.classList.remove("is-success");
  }
});

Promise.all([loadBootstrap(), loadCurrentUser()]).catch((error) => {
  console.error(error);
  listingGrid.innerHTML = `
    <article class="empty-state">
      <h3>Veriler yüklenemedi</h3>
      <p>Backend cevap vermedi. Sunucuyu kontrol edip tekrar deneyin.</p>
    </article>
  `;
});

const verifiedState = new URLSearchParams(window.location.search).get("verified");
if (verifiedState) {
  openAuthModal("login");
  authFeedback.textContent =
    verifiedState === "success"
      ? "E-posta doğrulandı. Artık hesabına giriş yapabilirsin."
      : "Doğrulama bağlantısı geçersiz veya süresi dolmuş.";
  authFeedback.classList.toggle("is-success", verifiedState === "success");
  window.history.replaceState({}, "", window.location.pathname);
}
