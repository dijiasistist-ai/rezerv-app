const listingGrid = document.querySelector("#listing-grid");
const filterPillsContainer = document.querySelector("#filter-pills");
const categoryRail = document.querySelector("#category-rail");
const categoryNext = document.querySelector("#category-next");
const searchPanel = document.querySelector("#search-panel");
const queryInput = document.querySelector("#search-query");
const citySelect = document.querySelector("#search-city");
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
const businessNavLink = document.querySelector("#business-nav-link");
const nearbyMapTrigger = document.querySelector("#nearby-map-trigger");
const nearbyMapModal = document.querySelector("#nearby-map-modal");
const nearbyMapClose = document.querySelector("#nearby-map-close");
const nearbyMapDismiss = document.querySelector("#nearby-map-dismiss");
const nearbyLocate = document.querySelector("#nearby-locate");
const nearbyMapStatus = document.querySelector("#nearby-map-status");
const nearbyResults = document.querySelector("#nearby-results");
const inlineNearbyMap = document.querySelector("#inline-nearby-map");
const inlineNearbyResults = document.querySelector("#inline-nearby-results");
const inlineNearbyLocate = document.querySelector("#inline-nearby-locate");
const inlineMapExpand = document.querySelector("#inline-map-expand");
const inlineMapStatus = document.querySelector("#inline-map-status");
const notificationShell = document.querySelector("#notification-shell");
const notificationCount = document.querySelector("#notification-count");
const notificationStatus = document.querySelector("#notification-status");
const notificationItems = document.querySelectorAll("[data-notification-id]");
const infoView = document.querySelector("#info-view");
const infoClose = document.querySelector("#info-close");
const infoLinks = document.querySelectorAll("[data-info-link]");
const infoTabs = document.querySelectorAll("[data-info-tab]");
const infoPanels = document.querySelectorAll("[data-info-panel]");
const infoHomeLinks = document.querySelectorAll("[data-info-home]");
const infoAuthButtons = document.querySelectorAll("[data-info-auth]");
const notificationStorageKey = "tyee_read_notifications_v1";
let notificationReadTimer = null;

const state = {
  category: "all",
  city: "all",
  query: "",
  categories: [],
  featuredListings: [],
  authMode: "login",
  authEntry: "customer",
  authStep: "form",
  pendingRegistration: null,
  token: localStorage.getItem("tyee_token") || "",
  user: null,
  nearbyMarkers: {
    modal: [],
    inline: [],
  },
  nearbyMapInstances: {
    modal: null,
    inline: null,
  },
  nearbyItems: [],
  nearbyUserMarker: null,
  nearbyOrigin: { lat: 41.0351, lng: 29.0268 },
};

const fallbackCategories = [
  { id: "pet-kuafor", label: "Pet Kuaför", icon: "🐾", count: "0" },
  { id: "guzellik", label: "Güzellik Merkezi", icon: "💄", count: "0" },
  { id: "hali-saha", label: "Halı Saha", icon: "⚽", count: "0" },
  { id: "padel", label: "Padel Kort", icon: "🎾", count: "0" },
  { id: "direksiyon", label: "Direksiyon Dersi", icon: "🚘", count: "0" },
  { id: "ozel-ders", label: "Özel Ders", icon: "🎓", count: "0" },
  { id: "masaj-spa", label: "Masaj & Spa", icon: "🪷", count: "0" },
  { id: "kisisel-bakim", label: "Kişisel Bakım", icon: "🧴", count: "0" },
  { id: "fizyoterapi", label: "Fizyoterapi", icon: "🧘", count: "0" },
  { id: "yoga-pilates", label: "Yoga & Pilates", icon: "🧘‍♀️", count: "0" },
];

const infoHashAliases = {
  hakkimizda: "about",
  about: "about",
  "kullanim-sartlari": "terms",
  terms: "terms",
  gizlilik: "privacy",
  privacy: "privacy",
  iletisim: "contact",
  contact: "contact",
  guvenlik: "security",
  security: "security",
  sss: "faq",
  faq: "faq",
  blog: "blog",
};

function normalize(value = "") {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeSearchQuery(value = "") {
  return normalize(value)
    .replace(/\bkuaforu\b/g, "kuafor")
    .replace(/\bguzelligi\b/g, "guzellik")
    .replace(/\bmasaji\b/g, "masaj")
    .replace(/\s+/g, " ")
    .trim();
}

function getInfoTabFromHash() {
  const match = window.location.hash.match(/^#bilgi\/(.+)$/);
  if (!match) return "";
  return infoHashAliases[decodeURIComponent(match[1])] || "";
}

function setInfoTab(tab = "contact") {
  const activeTab = infoPanels.length
    ? [...infoPanels].some((panel) => panel.dataset.infoPanel === tab)
      ? tab
      : "contact"
    : tab;

  infoTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.infoTab === activeTab);
  });

  infoPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.infoPanel === activeTab);
  });
}

function openInfoView(tab = "contact", shouldPushHash = true) {
  if (!infoView) return;

  setInfoTab(tab);
  infoView.classList.remove("hidden");
  infoView.setAttribute("aria-hidden", "false");
  document.body.classList.add("info-view-open");

  if (shouldPushHash) {
    const hashValue =
      Object.entries(infoHashAliases).find(([, value]) => value === tab)?.[0] || tab;
    window.history.pushState({}, "", `#bilgi/${hashValue}`);
  }
}

function closeInfoView(shouldClearHash = true) {
  if (!infoView) return;

  infoView.classList.add("hidden");
  infoView.setAttribute("aria-hidden", "true");
  document.body.classList.remove("info-view-open");

  if (shouldClearHash && window.location.hash.startsWith("#bilgi/")) {
    window.history.pushState({}, "", `${window.location.pathname}${window.location.search}`);
  }
}

function syncInfoViewWithHash() {
  const tab = getInfoTabFromHash();
  if (tab) {
    openInfoView(tab, false);
    return;
  }

  closeInfoView(false);
}

function leaveInfoViewForAnchor(href = "/#hero") {
  const targetUrl = new URL(href, window.location.origin);
  closeInfoView(false);
  window.history.pushState({}, "", `${targetUrl.pathname}${targetUrl.hash}`);

  if (targetUrl.hash) {
    document.querySelector(targetUrl.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
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

function setInlineNearbyStatus(message) {
  if (inlineMapStatus) inlineMapStatus.textContent = message;
}

function getReadNotificationIds() {
  try {
    const value = JSON.parse(localStorage.getItem(notificationStorageKey) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch (error) {
    return new Set();
  }
}

function saveReadNotificationIds(readIds) {
  localStorage.setItem(notificationStorageKey, JSON.stringify([...readIds]));
}

function updateNotificationUi() {
  if (!notificationItems.length) return;

  const readIds = getReadNotificationIds();
  let unreadCount = 0;

  notificationItems.forEach((item) => {
    const isRead = readIds.has(item.dataset.notificationId);
    item.classList.toggle("is-read", isRead);
    item.setAttribute("aria-pressed", isRead ? "true" : "false");
    if (!isRead) unreadCount += 1;
  });

  if (notificationCount) {
    notificationCount.textContent = String(unreadCount);
    notificationCount.classList.toggle("is-hidden", unreadCount === 0);
  }

  const bellButton = notificationShell?.querySelector(".bell-button");
  if (bellButton) {
    bellButton.setAttribute(
      "aria-label",
      unreadCount ? `Bildirimler, ${unreadCount} okunmamış` : "Bildirimler, okunmamış bildirim yok",
    );
  }

  if (notificationStatus) {
    notificationStatus.textContent = unreadCount
      ? `${unreadCount} okunmamış bildirim var.`
      : "Tüm bildirimler okundu.";
  }
}

function markNotificationRead(notificationId) {
  if (!notificationId) return;
  const readIds = getReadNotificationIds();
  readIds.add(notificationId);
  saveReadNotificationIds(readIds);
  updateNotificationUi();
}

function markAllNotificationsRead() {
  if (!notificationItems.length) return;
  const readIds = getReadNotificationIds();
  notificationItems.forEach((item) => readIds.add(item.dataset.notificationId));
  saveReadNotificationIds(readIds);
  updateNotificationUi();
}

function clearNearbyMarkers() {
  Object.values(state.nearbyMapInstances).forEach((slot) => {
    if (!slot?.map) return;
    (slot.markers || []).forEach((marker) => marker.remove());
    if (slot.userMarker) slot.userMarker.remove();
    slot.markers = [];
    slot.userMarker = null;
  });
  state.nearbyMarkers.modal = [];
  state.nearbyMarkers.inline = [];
  state.nearbyUserMarker = null;
}

function getNearbyBounds(origin, items = []) {
  const points = [origin, ...items];
  const lats = points.map((item) => item.lat);
  const lngs = points.map((item) => item.lng);
  const latSpread = Math.max(Math.max(...lats) - Math.min(...lats), 0.018);
  const lngSpread = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.028);
  const latPad = latSpread * 0.28;
  const lngPad = lngSpread * 0.28;

  return {
    minLat: Math.min(...lats) - latPad,
    maxLat: Math.max(...lats) + latPad,
    minLng: Math.min(...lngs) - lngPad,
    maxLng: Math.max(...lngs) + lngPad,
  };
}

function projectNearbyPoint(point, bounds) {
  const x = ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = (1 - (point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
  return {
    x: Math.min(94, Math.max(6, x)),
    y: Math.min(90, Math.max(10, y)),
  };
}

function buildMapIcon(item) {
  const isPet = item.category === "pet-kuafor";

  return L.divIcon({
    className: `tyee-map-pin${isPet ? " is-pet-pin" : ""}`,
    html: isPet
      ? `<span aria-label="Pet kuaför"><i></i><b></b><b></b><b></b><b></b></span>`
      : `<span>${item.icon || "✦"}</span>`,
    iconSize: isPet ? [48, 56] : [42, 52],
    iconAnchor: isPet ? [24, 54] : [21, 50],
    popupAnchor: [0, -42],
  });
}

function buildUserIcon() {
  return L.divIcon({
    className: "tyee-user-pin",
    html: "<span>⌖</span>",
    iconSize: [54, 54],
    iconAnchor: [27, 27],
  });
}

function refreshMapSlot(slot) {
  if (!slot?.map) return;

  const refresh = () => {
    slot.map.invalidateSize({ pan: false });
    if (slot.tileLayer) slot.tileLayer.redraw();
  };

  requestAnimationFrame(refresh);
  [120, 360, 720, 1200].forEach((delay) => setTimeout(refresh, delay));
}

function ensureInteractiveMap(container, markerGroup = "modal") {
  if (!container || !window.L) return null;

  if (!state.nearbyMapInstances[markerGroup]) {
    container.innerHTML = `
      ${
        markerGroup === "inline"
          ? `<button class="map-expand-button" id="inline-map-expand" type="button" aria-label="Haritayı büyüt">🔍</button>`
          : ""
      }
      <div class="leaflet-map-surface"></div>
    `;

    const surface = container.querySelector(".leaflet-map-surface");
    const map = L.map(surface, {
      center: [state.nearbyOrigin.lat, state.nearbyOrigin.lng],
      zoom: markerGroup === "inline" ? 12 : 13,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    const tileLayer = L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      attribution: "&copy; Google",
      maxZoom: 19,
      keepBuffer: 6,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      updateWhenIdle: false,
      updateWhenZooming: false,
    });
    tileLayer.addTo(map);
    tileLayer.on("tileerror", () => setTimeout(() => tileLayer.redraw(), 300));

    L.control.attribution({ prefix: false }).addAttribution("&copy; Google").addTo(map);

    state.nearbyMapInstances[markerGroup] = {
      map,
      tileLayer,
      markers: [],
      userMarker: null,
    };

    if (markerGroup === "inline") {
      container.querySelector("#inline-map-expand")?.addEventListener("click", openNearbyMap);
    }
  }

  refreshMapSlot(state.nearbyMapInstances[markerGroup]);
  return state.nearbyMapInstances[markerGroup];
}

function renderNearbyMapCanvas(map, origin, items = [], markerGroup = "modal") {
  if (!map) return;

  if (!window.L) {
    map.innerHTML = `
      <div class="nearby-map-art">
        <span>Harita yüklenemedi</span>
      </div>
    `;
    return;
  }

  const slot = ensureInteractiveMap(map, markerGroup);
  if (!slot?.map) return;

  (slot.markers || []).forEach((marker) => marker.remove());
  if (slot.userMarker) slot.userMarker.remove();
  slot.markers = [];

  slot.map.setView([origin.lat, origin.lng], markerGroup === "inline" ? 12 : 13, { animate: false });
  slot.userMarker = L.marker([origin.lat, origin.lng], { icon: buildUserIcon(), interactive: false }).addTo(slot.map);

  items.forEach((item) => {
    const marker = L.marker([item.lat, item.lng], {
      icon: buildMapIcon(item),
      title: item.name,
    })
      .addTo(slot.map)
      .bindPopup(
        `<strong>${item.name}</strong><br /><span>${item.categoryLabel} · ${item.cityLabel}</span><br /><small>${item.distanceLabel}</small>`,
      );
    marker.tyeeId = item.id;
    slot.markers.push(marker);
  });

  const points = [origin, ...items].map((item) => [item.lat, item.lng]);
  if (points.length > 1) {
    slot.map.fitBounds(points, {
      padding: markerGroup === "inline" ? [18, 18] : [28, 28],
      maxZoom: markerGroup === "inline" ? 13 : 14,
      animate: false,
    });
  }

  state.nearbyMarkers[markerGroup] = slot.markers;
  refreshMapSlot(slot);
}

function renderNearbyResults(target, items = [], limit = 6) {
  if (!target) return;

  target.innerHTML = items.length
    ? items
        .slice(0, limit)
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

async function getNearbyItems(origin = state.nearbyOrigin) {
  state.nearbyOrigin = origin;

  const params = new URLSearchParams({
    lat: String(origin.lat),
    lng: String(origin.lng),
  });
  const payload = await fetchJson(`/api/nearby?${params.toString()}`);
  return payload.items || [];
}

async function loadNearbyMap(origin = state.nearbyOrigin) {
  setNearbyStatus("Yakındaki işletmeler hesaplanıyor...");
  const items = await getNearbyItems(origin);
  state.nearbyItems = items;

  clearNearbyMarkers();
  renderNearbyMapCanvas(document.querySelector("#nearby-map"), origin, items, "modal");
  renderNearbyMapCanvas(inlineNearbyMap, origin, items, "inline");

  renderNearbyResults(nearbyResults, items, 6);
  renderNearbyResults(inlineNearbyResults, items, 4);
  renderNearbyListings(items);
  setNearbyStatus(
    items.length
      ? `${items.length} işletme haritada konuma göre hesaplandı.`
      : "Bu konuma yakın işletme bulunamadı.",
  );
  setInlineNearbyStatus(items.length ? `${items.length} yakın seçenek` : "Yakın işletme bulunamadı");
}

async function loadInlineNearbyMap(origin = state.nearbyOrigin) {
  setInlineNearbyStatus("Yakındaki işletmeler hesaplanıyor...");
  const items = await getNearbyItems(origin);
  state.nearbyItems = items;
  renderNearbyMapCanvas(inlineNearbyMap, origin, items, "inline");
  renderNearbyResults(inlineNearbyResults, items, 4);
  renderNearbyListings(items);
  setInlineNearbyStatus(items.length ? `${items.length} yakın seçenek` : "Yakın işletme bulunamadı");
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
  if (!hotSlots) return;
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
  const safeItems = items.length ? items : fallbackCategories;
  state.categories = safeItems;
  const filterItems = [{ id: "all", label: "Hepsi" }, ...safeItems.slice(0, 8)];

  filterPillsContainer.innerHTML = filterItems
    .map(
      (item) => `
        <button class="filter-pill${item.id === state.category ? " is-active" : ""}" data-filter="${item.id}" type="button">
          ${item.label}
        </button>
      `,
    )
    .join("");

  categoryRail.innerHTML = safeItems
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

function getFilteredNearbyItems(items = state.nearbyItems) {
  const normalizedQuery = normalizeSearchQuery(state.query);
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  return [...items]
    .filter((item) => {
      const matchesCategory = state.category === "all" || item.category === state.category;
      const searchable = normalizeSearchQuery(
        [
          item.name,
          item.category,
          item.categoryLabel,
          item.cityLabel,
          item.category === "pet-kuafor" ? "pet kuafor pet kuaforu" : "",
        ].join(" "),
      );
      const matchesQuery = !queryTerms.length || queryTerms.every((term) => searchable.includes(term));
      const matchesCity = state.city === "all" || state.city === "istanbul";
      return matchesCategory && matchesQuery && matchesCity;
    })
    .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));
}

function renderNearbyListings(items = state.nearbyItems) {
  const nearbyListings = getFilteredNearbyItems(items);
  listingGrid.classList.add("is-nearby-list");

  if (!nearbyListings.length) {
    renderListings([]);
  } else {
    listingGrid.innerHTML = nearbyListings
      .map(
        (item) => `
          <article class="nearby-facility-card" data-marker-id="${item.id}">
            <div class="nearby-facility-media ${item.mediaClass || "media-field"}">
              <span>Yakında</span>
            </div>
            <div class="nearby-facility-body">
              <div class="nearby-facility-title">
                <h3>${item.name}</h3>
                <strong>${item.rating || "4.8"}</strong>
              </div>
              <p>${item.cityLabel || "Konum seçildi"} · ${item.categoryLabel} · ${item.distanceLabel}</p>
              <div class="nearby-facility-icons" aria-label="Öne çıkan özellikler">
                <span>${item.icon || "✦"}</span>
                <span>⌖</span>
                <span>✓</span>
                <span>₺</span>
              </div>
              <div class="nearby-facility-foot">
                <em>₺${item.priceLabel || "0"}</em>
                <small>${item.nextSlot || "Yakında"} müsait</small>
                <button class="solid-button" type="button">Tesise Git</button>
              </div>
            </div>
          </article>
        `,
      )
      .join("");
  }

  const queryText = state.query ? `"${state.query}" için ` : "";
  resultsSummary.textContent = `${queryText}${nearbyListings.length} işletme yakınlık sırasına göre gösteriliyor`;
}

function renderListings(items = []) {
  listingGrid.classList.remove("is-nearby-list");

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

function highlightNearbyMarker(markerId, group = "modal") {
  const item = state.nearbyItems.find((nearbyItem) => nearbyItem.id === markerId);
  const target = group === "inline" ? inlineNearbyMap : document.querySelector("#nearby-map");
  if (!item || !target) return;
  renderNearbyMapCanvas(target, { lat: item.lat, lng: item.lng }, state.nearbyItems, group);
  const marker = state.nearbyMapInstances[group]?.markers?.find((candidate) => candidate.tyeeId === markerId);
  if (marker) marker.openPopup();
  const message = `${item.name} haritada seçildi.`;
  if (group === "inline") setInlineNearbyStatus(message);
  else setNearbyStatus(message);
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
  loadInlineNearbyMap().catch(() => setInlineNearbyStatus("Harita yüklenemedi"));
}

async function loadListings() {
  const params = new URLSearchParams({
    category: state.category,
    city: state.city,
    query: state.query,
  });

  const payload = await fetchJson(`/api/listings?${params.toString()}`);
  if (payload.items?.length) {
    renderListings(payload.items);
    renderResultsSummary(payload.total);
    return;
  }

  if (state.nearbyItems.length) {
    renderNearbyListings(state.nearbyItems);
    return;
  }

  const nearbyItems = await getNearbyItems(state.nearbyOrigin);
  state.nearbyItems = nearbyItems;
  renderNearbyMapCanvas(inlineNearbyMap, state.nearbyOrigin, nearbyItems, "inline");
  renderNearbyResults(inlineNearbyResults, nearbyItems, 4);
  renderNearbyListings(nearbyItems);

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

function openVenueLoginModal(message = "") {
  openAuthModal("login");
  state.authEntry = "venue";
  state.authStep = "form";
  authTitle.textContent = "İşletme girişi";
  showAuthFormStep();
  authFeedback.textContent = message;
  authFeedback.classList.remove("is-success");
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

function closeHeaderPopovers() {
  document.querySelectorAll(".header-popover-shell[open]").forEach((node) => {
    node.removeAttribute("open");
  });
}

function toggleAccountMenu() {
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

function updateAuthUi() {
  if (state.user) {
    const needsVerification = !state.user.emailVerified || (state.user.phone && !state.user.phoneVerified);
    accountLabel.textContent = state.user.name;
    avatarMini.textContent = getInitials(state.user.name);
    avatarMini.classList.remove("hidden");
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
    accountLabel.textContent = "Giriş Yap / Kayıt Ol";
    avatarMini.textContent = "";
    avatarMini.classList.add("hidden");
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
    localStorage.removeItem("tyee_token");
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
categoryNext?.addEventListener("click", () => {
  categoryRail.scrollBy({
    left: Math.max(320, categoryRail.clientWidth * 0.72),
    behavior: "smooth",
  });
});

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

nearbyMapTrigger?.addEventListener("click", openNearbyMap);
nearbyLocate?.addEventListener("click", requestNearbyLocation);
inlineNearbyLocate?.addEventListener("click", requestNearbyLocation);
inlineMapExpand?.addEventListener("click", openNearbyMap);
nearbyMapClose?.addEventListener("click", closeNearbyMap);
nearbyMapDismiss?.addEventListener("click", closeNearbyMap);
nearbyResults?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-marker-id]");
  if (!button) return;
  highlightNearbyMarker(button.dataset.markerId, "modal");
});
inlineNearbyResults?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-marker-id]");
  if (!button) return;
  highlightNearbyMarker(button.dataset.markerId, "inline");
});

listingGrid?.addEventListener("click", (event) => {
  const card = event.target.closest(".nearby-facility-card[data-marker-id]");
  if (!card) return;
  highlightNearbyMarker(card.dataset.markerId, "inline");
});

infoLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openInfoView(link.dataset.infoLink || "contact");
  });
});

infoTabs.forEach((button) => {
  button.addEventListener("click", () => {
    openInfoView(button.dataset.infoTab || "contact");
  });
});

infoHomeLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    leaveInfoViewForAnchor(link.getAttribute("href") || "/#hero");
  });
});

infoAuthButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeInfoView();
    openAuthModal(button.dataset.infoAuth || "login");
  });
});

infoClose?.addEventListener("click", () => closeInfoView());

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !infoView?.classList.contains("hidden")) {
    closeInfoView();
  }
});

window.addEventListener("hashchange", syncInfoViewWithHash);
window.addEventListener("popstate", syncInfoViewWithHash);

notificationItems.forEach((item) => {
  item.addEventListener("click", () => {
    markNotificationRead(item.dataset.notificationId);
  });
});
updateNotificationUi();

document.querySelectorAll(".header-popover-shell").forEach((shell) => {
  shell.addEventListener("toggle", () => {
    if (shell === notificationShell) {
      window.clearTimeout(notificationReadTimer);
      if (shell.open) {
        notificationReadTimer = window.setTimeout(() => {
          if (notificationShell?.open) markAllNotificationsRead();
        }, 800);
      }
    }

    if (!shell.open) return;
    closeAccountMenu();
    document.querySelectorAll(".header-popover-shell[open]").forEach((node) => {
      if (node !== shell) node.removeAttribute("open");
    });
  });
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
  localStorage.removeItem("tyee_token");
  state.token = "";
  state.user = null;
  authForm.reset();
  closeAccountMenu();
  updateAuthUi();
});

businessNavLink?.addEventListener("click", (event) => {
  if (state.user?.canManageVenue) return;

  event.preventDefault();
  if (state.user && !state.user.canManageVenue) {
    openVenueLoginModal("Bu hesapta işletme modu açık değil. İşletme paneli için işletme hesabı ile giriş yapmalısın.");
    return;
  }

  openVenueLoginModal("İşletme paneline girmek için giriş yapmalısın.");
});

authClose.addEventListener("click", closeAuthModal);
authCloseButton.addEventListener("click", closeAuthModal);

document.addEventListener("click", (event) => {
  if (event.target.closest(".account-shell")) return;
  if (event.target.closest(".header-popover-shell")) return;
  closeAccountMenu();
  closeHeaderPopovers();
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
      localStorage.setItem("tyee_token", response.token);
      updateAuthUi();
      const emailWasSent = response.emailDelivery?.status === "sent";
      authFeedback.textContent = response.nextStep || "Hesap oluşturuldu. Giriş yapıldı.";
      authFeedback.classList.toggle("is-success", emailWasSent);
      authForm.reset();
      if (emailWasSent) {
        setTimeout(closeAuthModal, 900);
      }
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
    loginType: state.authEntry === "venue" ? "venue" : "customer",
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
    localStorage.setItem("tyee_token", response.token);
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

syncInfoViewWithHash();

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
