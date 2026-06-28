const listingGrid = document.querySelector("#listing-grid");
const filterPillsContainer = document.querySelector("#filter-pills");
const categoryRail = document.querySelector("#category-rail");
const categoryNext = document.querySelector("#category-next");
const searchPanel = document.querySelector("#search-panel");
const searchShell = document.querySelector(".search-shell");
const searchFieldMain = document.querySelector(".search-field-main");
const searchCategoryPopover = document.querySelector("#search-category-popover");
const searchCategoryList = document.querySelector("#search-category-list");
const searchCategoryTabs = document.querySelectorAll("[data-search-type]");
const queryInput = document.querySelector("#search-query");
const citySelect = document.querySelector("#search-city");
const heroMetrics = document.querySelector("#hero-metrics");
const heroProofCount = document.querySelector("#hero-proof-count");
const hotSlots = document.querySelector("#hot-slots");
const resultsSummary = document.querySelector("#results-summary");
const mosaicCards = document.querySelectorAll("[data-mosaic-category]");
const loginTrigger = document.querySelector("#login-trigger");
const accountLabel = document.querySelector(".account-label");
const avatarMini = document.querySelector(".avatar-mini");
const accountMenu = document.querySelector("#account-menu");
const accountMenuCopy = document.querySelector("#account-menu-copy");
const accountDashboard = document.querySelector("#account-dashboard");
const accountAdmin = document.querySelector("#account-admin");
const accountLogout = document.querySelector("#account-logout");
const customerHeaderOnlyItems = document.querySelectorAll(".customer-header-only");
const customerAccountOnlyItems = document.querySelectorAll(".customer-account-only");
const customerPanel = document.querySelector("#customer-panel");
const customerPanelClose = document.querySelector("#customer-panel-close");
const customerPanelDismiss = document.querySelector("#customer-panel-dismiss");
const customerPanelTitle = document.querySelector("#customer-panel-title");
const customerPanelSubtitle = document.querySelector("#customer-panel-subtitle");
const customerPanelContent = document.querySelector("#customer-panel-content");
const customerPanelTabs = document.querySelectorAll("[data-customer-panel-tab]");
const customerPanelTriggers = document.querySelectorAll("[data-customer-panel]");
const authModal = document.querySelector("#auth-modal");
const authDialog = document.querySelector(".auth-dialog");
const authClose = document.querySelector("#auth-close");
const authCloseButton = document.querySelector("#auth-close-button");
const authTitle = document.querySelector("#auth-title");
const authTabs = document.querySelectorAll(".auth-tab");
const authForm = document.querySelector("#auth-form");
const authStepEntry = document.querySelector("#auth-step-entry");
const authStepReset = document.querySelector("#auth-step-reset");
const authName = document.querySelector("#auth-name");
const authPhone = document.querySelector("#auth-phone");
const authEmail = document.querySelector("#auth-email");
const authPassword = document.querySelector("#auth-password");
const authSubmit = document.querySelector("#auth-submit");
const authFeedback = document.querySelector("#auth-feedback");
const authForgotPassword = document.querySelector("#auth-forgot-password");
const authResetEmail = document.querySelector("#auth-reset-email");
const authResetCode = document.querySelector("#auth-reset-code");
const authResetPassword = document.querySelector("#auth-reset-password");
const authResetRequest = document.querySelector("#auth-reset-request");
const authResetConfirm = document.querySelector("#auth-reset-confirm");
const authResetBack = document.querySelector("#auth-reset-back");
const authResetFeedback = document.querySelector("#auth-reset-feedback");
const nameField = document.querySelector("#name-field");
const phoneField = document.querySelector("#phone-field");
const authStepForm = document.querySelector("#auth-step-form");
const authEntryBack = document.querySelector("#auth-entry-back");
const authEntryChoices = document.querySelectorAll("[data-entry-choice]");
const authTermsPanel = document.querySelector("#auth-customer-terms");
const authCustomerTermsText = document.querySelector("#auth-customer-terms-text");
const authCustomerTermsAccept = document.querySelector("#auth-customer-terms-accept");
const authTermsAcceptLabel = document.querySelector("#auth-terms-accept-label");
const authRoleHelper = document.querySelector("#auth-role-helper");
const popularSearches = document.querySelector(".popular-searches");
const businessNavLinks = document.querySelectorAll('a[href="/venue.html"]');
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
const reservationModal = document.querySelector("#reservation-modal");
const reservationClose = document.querySelector("#reservation-close");
const reservationDismiss = document.querySelector("#reservation-dismiss");
const reservationForm = document.querySelector("#reservation-form");
const reservationTitle = document.querySelector("#reservation-title");
const reservationSubtitle = document.querySelector("#reservation-subtitle");
const reservationName = document.querySelector("#reservation-name");
const reservationPhone = document.querySelector("#reservation-phone");
const reservationEmail = document.querySelector("#reservation-email");
const reservationTotal = document.querySelector("#reservation-total");
const reservationDate = document.querySelector("#reservation-date");
const reservationTime = document.querySelector("#reservation-time");
const reservationPolicy = document.querySelector("#reservation-policy");
const reservationPreview = document.querySelector("#reservation-preview");
const reservationNote = document.querySelector("#reservation-note");
const reservationFeedback = document.querySelector("#reservation-feedback");
const customerAda = document.querySelector("#customer-ada");
const customerAdaLauncher = document.querySelector("#customer-ada-launcher");
const customerAdaHint = document.querySelector("#customer-ada-hint");
const customerAdaPanel = document.querySelector("#customer-ada-panel");
const customerAdaClose = document.querySelector("#customer-ada-close");
const customerAdaStatusTitle = document.querySelector("#customer-ada-status-title");
const customerAdaStatus = document.querySelector("#customer-ada-status");
const customerAdaStage = document.querySelector("#customer-ada-stage");
const customerAdaSpeech = document.querySelector("#customer-ada-speech");
const customerAdaActions = document.querySelector("#customer-ada-actions");
const customerAdaChatLog = document.querySelector("#customer-ada-chat-log");
const customerAdaForm = document.querySelector("#customer-ada-form");
const customerAdaInput = document.querySelector("#customer-ada-input");
const customerAdaLive = document.querySelector("#customer-ada-live");
const notificationStorageKey = "tyee_read_notifications_v1";
let notificationReadTimer = null;

const state = {
  category: "all",
  city: "all",
  query: "",
  searchType: "all",
  categories: [],
  featuredListings: [],
  authMode: "login",
  authEntry: "customer",
  authStep: "entry",
  authRequestInFlight: false,
  authTerms: {
    customer: null,
    venue: null,
  },
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
  customerDashboard: null,
  customerPanelTab: "reservations",
  nearbyUserMarker: null,
  nearbyOrigin: { lat: 41.0351, lng: 29.0268 },
  reservationDraft: null,
  reservationPolicy: null,
  reservationPolicyRequest: 0,
  heroMetrics: [],
  customerAdaOpen: false,
  customerAdaActions: [],
};

const fallbackCategories = [
  { id: "pet-kuafor", label: "Pet Kuaför", icon: "🐾", count: "0" },
  { id: "bayan-kuafor", label: "Bayan Kuaför", icon: "💇‍♀️", count: "0" },
  { id: "erkek-berber", label: "Erkek Berber", icon: "💈", count: "0" },
  { id: "guzellik", label: "Güzellik", icon: "💄", count: "0" },
  { id: "masaj", label: "Masaj", icon: "🪷", count: "0" },
  { id: "hali-saha", label: "Halı Saha", icon: "⚽", count: "0" },
  { id: "tenis", label: "Tenis", icon: "🎾", count: "0" },
  { id: "padel", label: "Padel", icon: "🎾", count: "0" },
  { id: "yoga", label: "Yoga", icon: "🧘", count: "0" },
  { id: "ozel-ders", label: "Özel Ders", icon: "🎓", count: "0" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️", count: "0" },
  { id: "tattoo", label: "Tattoo", icon: "🖋️", count: "0" },
];

const categoryShowcaseMeta = {
  "pet-kuafor": { mediaClass: "showcase-pet" },
  "bayan-kuafor": { mediaClass: "showcase-hair" },
  "erkek-berber": { mediaClass: "showcase-barber" },
  guzellik: { mediaClass: "showcase-beauty" },
  masaj: { mediaClass: "showcase-spa" },
  "hali-saha": { mediaClass: "showcase-field" },
  tenis: { mediaClass: "showcase-padel" },
  padel: { mediaClass: "showcase-padel" },
  yoga: { mediaClass: "showcase-spa" },
  "ozel-ders": { mediaClass: "showcase-field" },
  restaurant: { mediaClass: "showcase-restaurant" },
  tattoo: { mediaClass: "showcase-tattoo" },
};

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
    .replace(/\bsac salonu\b/g, "bayan kuafor")
    .replace(/\bsac kuafor\b/g, "bayan kuafor")
    .replace(/\berkek kuafor\b/g, "erkek berber")
    .replace(/\bguzelligi\b/g, "guzellik")
    .replace(/\bmasaji\b/g, "masaj")
    .replace(/\brestoran\b/g, "restaurant")
    .replace(/\bdovme\b/g, "tattoo")
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

function parseMoney(value = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value = 0) {
  return `₺${formatPrice(Math.round(Number(value || 0)))}`;
}

function safeMediaUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/assets/")) return url;
  return "";
}

function mediaStyleAttribute(value = "") {
  const url = safeMediaUrl(value);
  if (!url) return "";
  const cssUrl = url.replace(/["\\]/g, "");
  return ` style="background-image: linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.24)), url('${escapeHtml(cssUrl)}')"`;
}

function getListingGallerySources(item = {}) {
  const seen = new Set();
  const urls = [];
  const addUrl = (value = "") => {
    const url = safeMediaUrl(value);
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  (Array.isArray(item.gallery) ? item.gallery : []).forEach((photo) => {
    addUrl(typeof photo === "string" ? photo : photo?.src);
  });
  addUrl(item.mediaUrl);
  return urls.slice(0, 6);
}

function listingMediaStyleAttribute(item = {}) {
  return mediaStyleAttribute(getListingGallerySources(item)[0] || item.mediaUrl);
}

function galleryDotsMarkup(item = {}) {
  const gallery = getListingGallerySources(item);
  if (gallery.length < 2) return "";
  return `
    <div class="listing-gallery-dots" aria-label="${gallery.length} fotoğraf">
      ${gallery.map((_, index) => `<i class="${index === 0 ? "is-active" : ""}" aria-hidden="true"></i>`).join("")}
    </div>
  `;
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
  const petPawIcon = `
    <span aria-label="Pet kuaför">
      <svg class="pet-paw-marker" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle cx="18" cy="23" r="8"></circle>
        <circle cx="30" cy="16" r="8"></circle>
        <circle cx="42" cy="16" r="8"></circle>
        <circle cx="52" cy="25" r="8"></circle>
        <path d="M17.5 44.5c0-10.2 7.7-18.5 18.5-18.5s18.5 8.3 18.5 18.5c0 6.4-4.3 10.8-10.5 10.8-3.1 0-5.4-1.4-8-1.4s-4.9 1.4-8 1.4c-6.2 0-10.5-4.4-10.5-10.8Z"></path>
      </svg>
    </span>
  `;

  return L.divIcon({
    className: `tyee-map-pin${isPet ? " is-pet-pin" : ""}`,
    html: isPet ? petPawIcon : `<span>${item.icon || "✦"}</span>`,
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

function getReservationUrl(itemOrId = {}) {
  const listingId = typeof itemOrId === "string" ? itemOrId : itemOrId.listingId || itemOrId.id;
  return listingId ? `/reservation.html?id=${encodeURIComponent(listingId)}` : "/reservation.html";
}

function openReservationPage(itemOrId = {}) {
  window.location.href = getReservationUrl(itemOrId);
}

function buildMapPreviewPopup(item = {}) {
  const reservationUrl = getReservationUrl(item);
  return `
    <article class="map-preview-card">
      <div class="map-preview-head">
        <span class="map-preview-icon">${escapeHtml(item.icon || "✦")}</span>
        <div>
          <strong>${escapeHtml(item.name || "İşletme")}</strong>
          <small>${escapeHtml(item.categoryLabel || "Hizmet")} · ${escapeHtml(item.cityLabel || "Konum seçildi")}</small>
        </div>
      </div>
      <div class="map-preview-meta">
        <span>${escapeHtml(item.distanceLabel || "Yakında")}</span>
        <span>${escapeHtml(item.nextSlot || "Yakında")} müsait</span>
        <span>₺${escapeHtml(item.priceLabel || "0")}</span>
      </div>
      <a class="map-preview-link" href="${escapeHtml(reservationUrl)}">Detaya git</a>
    </article>
  `;
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
      .bindPopup(buildMapPreviewPopup(item), {
        autoPan: true,
        autoPanPaddingTopLeft: [24, 124],
        autoPanPaddingBottomRight: [24, 24],
        maxWidth: 260,
      });
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
  if (shouldRenderNearbyListings()) renderNearbyListings(items);
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
  state.heroMetrics = Array.isArray(items) ? items : [];
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

  const totalReservationsMetric = state.heroMetrics.find((item) => normalize(item.label || "") === "toplam rezervasyon");
  if (heroProofCount) {
    heroProofCount.textContent = totalReservationsMetric?.value || "0";
  }
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

function parseMetricCount(value = 0) {
  const normalized = String(value ?? "0").replace(/[^\d]/g, "");
  return Number(normalized || 0);
}

function formatCountLabel(value = 0, singular = "işletme") {
  return `${new Intl.NumberFormat("tr-TR").format(Number(value || 0))} ${singular}`;
}

function getPopularCategoryItems(items = [], featuredByCategory = new Map()) {
  return [...items]
    .map((item) => {
      const liveListing = featuredByCategory.get(item.id);
      const businessCount = Number(item.businessCount ?? parseMetricCount(item.count));
      const orderCount = Number(item.orderCount ?? 0);
      const reviewCount = Number(liveListing?.reviews || 0);
      const popularityScore = Number(item.popularityScore ?? orderCount * 100 + businessCount * 10 + reviewCount / 100);
      return {
        ...item,
        businessCount,
        orderCount,
        popularityScore,
      };
    })
    .sort(
      (a, b) =>
        b.popularityScore - a.popularityScore ||
        b.orderCount - a.orderCount ||
        b.businessCount - a.businessCount ||
        String(a.label || "").localeCompare(String(b.label || ""), "tr"),
    );
}

function getFeaturedByCategoryMap() {
  const featuredByCategory = new Map();

  (state.featuredListings || []).forEach((listing) => {
    if (!listing?.category || featuredByCategory.has(listing.category)) return;
    featuredByCategory.set(listing.category, listing);
  });

  return featuredByCategory;
}

function getSearchBusinessItems() {
  const byId = new Map();

  [...(state.featuredListings || []), ...(state.nearbyItems || [])].forEach((item) => {
    if (!item?.id || byId.has(item.id)) return;
    byId.set(item.id, item);
  });

  return [...byId.values()]
    .sort(
      (a, b) =>
        Number(b.reviews || 0) - Number(a.reviews || 0) ||
        Number(a.distanceKm ?? Number.MAX_SAFE_INTEGER) - Number(b.distanceKm ?? Number.MAX_SAFE_INTEGER) ||
        String(a.name || "").localeCompare(String(b.name || ""), "tr"),
    )
    .slice(0, 18);
}

function syncSearchCategoryTabs() {
  searchCategoryTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.searchType === state.searchType);
  });
}

function renderSearchCategoryOption(item) {
  return `
    <button class="search-category-option${item.id === state.category ? " is-active" : ""}" data-filter="${escapeHtml(item.id)}" data-category-label="${escapeHtml(item.id === "all" ? "" : item.label)}" type="button">
      <span>${escapeHtml(item.icon || "✦")}</span>
      <strong>${escapeHtml(item.label)}</strong>
      <small>${formatCountLabel(item.businessCount, "işletme")} · ${formatCountLabel(item.orderCount, "sipariş")}</small>
    </button>
  `;
}

function renderSearchBusinessOption(item) {
  const details = [item.categoryLabel, item.cityLabel, item.distanceLabel || item.distance].filter(Boolean).join(" · ");

  return `
    <button class="search-category-option search-business-option" data-business-id="${escapeHtml(item.id)}" data-business-category="${escapeHtml(item.category || "all")}" data-business-name="${escapeHtml(item.name || "İşletme")}" type="button">
      <span>${escapeHtml(item.icon || "⌁")}</span>
      <strong>${escapeHtml(item.name || "İşletme")}</strong>
      <small>${escapeHtml(details || "İşletme")}</small>
    </button>
  `;
}

function renderSearchCategoryPopover() {
  if (!searchCategoryList) return;

  const safeItems = state.categories.length ? state.categories : fallbackCategories;
  const allSearchItems = getPopularCategoryItems(safeItems, getFeaturedByCategoryMap());
  const allBusinessCount = allSearchItems.reduce((total, item) => total + Number(item.businessCount || 0), 0);
  const allOrderCount = allSearchItems.reduce((total, item) => total + Number(item.orderCount || 0), 0);
  const businessItems = getSearchBusinessItems();

  syncSearchCategoryTabs();

  if (state.searchType === "business") {
    searchCategoryList.innerHTML = businessItems.length
      ? businessItems.map(renderSearchBusinessOption).join("")
      : `<p class="search-category-empty">İşletme bulunamadı.</p>`;
    return;
  }

  const categoryItems =
    state.searchType === "category"
      ? allSearchItems
      : [
          {
            id: "all",
            label: "Tüm hizmetler",
            icon: "⌕",
            businessCount: allBusinessCount,
            orderCount: allOrderCount,
          },
          ...allSearchItems,
        ];

  searchCategoryList.innerHTML = categoryItems.length
    ? categoryItems.map(renderSearchCategoryOption).join("")
    : `<p class="search-category-empty">Kategori bulunamadı.</p>`;
}

function renderCategories(items = []) {
  const safeItems = items.length ? items : fallbackCategories;
  state.categories = safeItems;
  const filterItems = [{ id: "all", label: "Hepsi" }, ...safeItems];
  const featuredByCategory = getFeaturedByCategoryMap();

  filterPillsContainer.innerHTML = filterItems
    .map(
      (item) => `
        <button class="filter-pill${item.id === state.category ? " is-active" : ""}" data-filter="${item.id}" type="button">
          ${item.label}
        </button>
      `,
    )
    .join("");

  const popularItems = getPopularCategoryItems(safeItems, featuredByCategory).slice(0, 7);

  categoryRail.innerHTML = popularItems
    .map((item) => {
      const meta = categoryShowcaseMeta[item.id] || {};
      return `
        <button class="category-card ${meta.mediaClass || ""}${item.id === state.category ? " is-active" : ""}" data-filter="${escapeHtml(item.id)}" type="button">
          <span class="category-card-badge">${escapeHtml(item.icon || "✦")}</span>
          <div class="category-card-copy">
            <strong>${escapeHtml(item.label)}</strong>
            <small>${formatCountLabel(item.businessCount, "işletme")} · ${formatCountLabel(item.orderCount, "sipariş")}</small>
          </div>
        </button>
      `;
    })
    .join("");

  renderSearchCategoryPopover();
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

function shouldRenderNearbyListings() {
  return state.category === "all" && !state.query && (state.city === "all" || state.city === "istanbul");
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
          item.category === "bayan-kuafor" ? "bayan kuafor kadin kuafor" : "",
          item.category === "erkek-berber" ? "erkek berber barber" : "",
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
        (item) => {
          const nextSlot = normalize(item.nextSlot || "");
          const hasSpecificSlot = item.nextSlot && !nextSlot.includes("yakinda") && !nextSlot.includes("yakında");
          const nextSlotLabel = hasSpecificSlot ? `${item.nextSlot} müsait` : "Müsait";
          return `
          <article class="nearby-facility-card" data-marker-id="${item.id}">
            <div class="nearby-facility-media ${item.mediaClass || "media-field"}"${listingMediaStyleAttribute(item)}>${galleryDotsMarkup(item)}</div>
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
                <small>${nextSlotLabel}</small>
                <button class="solid-button" data-reservation-id="${item.id}" type="button">Rezerv et</button>
              </div>
            </div>
          </article>
        `;
        },
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
    renderCustomerAda();
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
          <div class="listing-media ${item.mediaClass || "media-pet"}"${listingMediaStyleAttribute(item)}>
            <span>${availabilityLabel}</span>
            <button type="button" aria-label="Kaydet">♡</button>
            ${galleryDotsMarkup(item)}
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
            <button class="solid-button card-cta" data-listing-reservation-id="${item.id}" type="button">${item.cta}</button>
          </div>
        </article>
      `;
      },
    )
    .join("");
  renderCustomerAda();
}

function getVisibleListingItems() {
  const normalizedQuery = normalizeSearchQuery(state.query);
  return (state.featuredListings || []).filter((item) => {
    const matchesCategory = state.category === "all" || item.category === state.category;
    const matchesCity = state.city === "all" || item.city === state.city;
    const haystack = normalizeSearchQuery(`${item.name} ${item.categoryLabel} ${item.cityLabel} ${(item.tags || []).join(" ")}`);
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesCategory && matchesCity && matchesQuery;
  });
}

function buildCustomerAdaActions() {
  const visibleItems = getVisibleListingItems();
  const bestItem = [...visibleItems].sort(
    (a, b) =>
      Number(b.rating || 0) - Number(a.rating || 0) ||
      Number(a.distanceKm ?? Number.MAX_SAFE_INTEGER) - Number(b.distanceKm ?? Number.MAX_SAFE_INTEGER),
  )[0];
  const categoryLabel =
    state.categories.find((item) => item.id === state.category)?.label ||
    (state.category === "all" ? "Tüm kategoriler" : "Seçili kategori");
  const actions = [];

  if (bestItem) {
    actions.push({
      id: "best-match",
      icon: "EN",
      title: "En uygun işletmeyi aç",
      detail: `${bestItem.name} · ${bestItem.rating?.toFixed ? bestItem.rating.toFixed(1) : bestItem.rating}`,
      message: `${bestItem.name} şu an listendeki en güçlü eşleşme görünüyor.`,
      type: "reservation",
      listingId: bestItem.id,
    });
  }

  actions.push({
    id: "nearby",
    icon: "YK",
    title: "Yakınımdaki işletmeler",
    detail: `${visibleItems.length || state.featuredListings.length} seçenek hazır`,
    message: "Yakınındaki işletmeleri harita ve liste olarak açıyorum.",
    type: "nearby",
  });

  actions.push({
    id: "categories",
    icon: "KT",
    title: "Kategori seç",
    detail: categoryLabel,
    message: "Arama alanındaki kategori listesini açtım. İstersen hizmet tipini seç.",
    type: "categories",
  });

  if (state.user) {
    actions.push({
      id: "reservations",
      icon: "R",
      title: "Rezervasyonlarım",
      detail: "Yaklaşan ve geçmiş randevular",
      message: "Rezervasyonlarını açıyorum.",
      type: "customer-panel",
      tab: "reservations",
    });
    actions.push({
      id: "favorites",
      icon: "F",
      title: "Favorilerim",
      detail: "Kaydettiğin işletmeler",
      message: "Favorilerini açıyorum.",
      type: "customer-panel",
      tab: "favorites",
    });
  } else {
    actions.push({
      id: "login",
      icon: "G",
      title: "Giriş yap",
      detail: "Rezervasyonlarını takip et",
      message: "Bireysel giriş ekranını açıyorum.",
      type: "login",
    });
  }

  return actions.slice(0, 5);
}

function renderCustomerAda() {
  if (!customerAda) return;
  const actions = buildCustomerAdaActions();
  const visibleCount = getVisibleListingItems().length;
  const primary = actions[0];
  state.customerAdaActions = actions;

  if (customerAdaHint) customerAdaHint.textContent = primary?.title || "Rezervasyon asistanın";
  if (customerAdaStatusTitle) {
    customerAdaStatusTitle.textContent = state.user ? "Hesabını ve seçenekleri okuyorum" : "Yakınındaki seçenekleri okuyorum";
  }
  if (customerAdaStatus) {
    customerAdaStatus.textContent = `${visibleCount || state.featuredListings.length || 0} işletme, kategori ve konum bilgisine göre öneri hazırladım.`;
  }
  if (customerAdaSpeech) {
    customerAdaSpeech.textContent =
      primary?.message ||
      "Yakınında uygun işletme bulabilir, rezervasyonlarını açabilir veya favorilerini gösterebilirim.";
  }
  if (customerAdaActions) {
    customerAdaActions.innerHTML = actions
      .map(
        (item) => `
          <button class="customer-ada-action" type="button" data-customer-ada-action="${escapeHtml(item.id)}">
            <em>${escapeHtml(item.icon)}</em>
            <span>
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.detail)}</span>
            </span>
            <span>›</span>
          </button>
        `,
      )
      .join("");
  }
}

function openCustomerAda() {
  state.customerAdaOpen = true;
  customerAdaPanel?.classList.remove("hidden");
  customerAdaLauncher?.setAttribute("aria-expanded", "true");
  if (customerAdaChatLog && !customerAdaChatLog.dataset.ready) {
    appendCustomerAdaMessage("ada", "Ben Ada. Sana uygun işletme bulabilir, rezervasyonlarını açabilir ve arama seçimlerini hızlandırabilirim.");
    customerAdaChatLog.dataset.ready = "true";
  }
}

function closeCustomerAda() {
  state.customerAdaOpen = false;
  customerAdaPanel?.classList.add("hidden");
  customerAdaLauncher?.setAttribute("aria-expanded", "false");
}

function toggleCustomerAda() {
  if (state.customerAdaOpen) closeCustomerAda();
  else openCustomerAda();
}

function appendCustomerAdaMessage(role = "ada", message = "") {
  if (!customerAdaChatLog || !message) return;
  const node = document.createElement("div");
  node.className = `customer-ada-message ${role === "user" ? "is-user" : "is-ada"}`;
  node.textContent = message;
  customerAdaChatLog.appendChild(node);
  customerAdaChatLog.scrollTo({ top: customerAdaChatLog.scrollHeight, behavior: "smooth" });
}

function runCustomerAdaAction(actionId = "") {
  const action = (state.customerAdaActions || []).find((item) => item.id === actionId);
  if (!action) return;

  if (action.type === "reservation" && action.listingId) {
    const listing = state.featuredListings.find((item) => String(item.id) === String(action.listingId));
    if (listing) openReservationPage(listing);
  } else if (action.type === "nearby") {
    document.querySelector("#featured")?.scrollIntoView({ behavior: "smooth", block: "start" });
    loadInlineNearbyMap().catch(() => null);
  } else if (action.type === "categories") {
    searchCategoryPopover?.classList.remove("hidden");
    searchCategoryPopover?.setAttribute("aria-hidden", "false");
    queryInput?.focus();
  } else if (action.type === "customer-panel") {
    openCustomerPanel(action.tab || "reservations").catch(() => openAuthModal("login"));
  } else if (action.type === "login") {
    openAuthModal("login");
  }

  appendCustomerAdaMessage("ada", action.message);
}

function answerCustomerAda(question = "") {
  const normalized = normalizeSearchQuery(question);
  const visibleItems = getVisibleListingItems();
  const bestItem = visibleItems[0] || state.featuredListings[0];

  if (normalized.includes("rezervasyonlar") || normalized.includes("randevular")) {
    if (state.user) {
      openCustomerPanel("reservations").catch(() => null);
      return "Rezervasyonlarını açıyorum. Yaklaşan ve geçmiş randevularını buradan takip edebilirsin.";
    }
    openAuthModal("login");
    return "Rezervasyonlarını görmek için önce bireysel hesabına giriş yapmalısın.";
  }

  if (normalized.includes("favori") || normalized.includes("kaydedilen")) {
    if (state.user) {
      openCustomerPanel("favorites").catch(() => null);
      return "Favorilerini açıyorum. Kaydettiğin işletmeler burada görünecek.";
    }
    return "Favorilerini hesapla eşleştirmek için giriş yapman gerekiyor.";
  }

  const matchedCategory = (state.categories.length ? state.categories : fallbackCategories).find((item) =>
    normalized.includes(normalizeSearchQuery(item.label)),
  );
  if (matchedCategory) {
    state.category = matchedCategory.id;
    if (queryInput) queryInput.value = matchedCategory.label;
    setActiveCategory(state.category);
    loadListings();
    document.querySelector("#featured")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return `${matchedCategory.label} için sonuçları listeledim. İstersen en yüksek puanlı işletmeye birlikte gidelim.`;
  }

  if (normalized.includes("yakın") || normalized.includes("harita") || normalized.includes("konum")) {
    loadInlineNearbyMap().catch(() => null);
    document.querySelector("#featured")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return "Yakınındaki işletmeleri harita üzerinde yeniliyorum.";
  }

  if (bestItem) {
    return `${bestItem.name} iyi bir başlangıç olabilir. Kategori, puan ve mesafeye göre listeyi daraltabilirim.`;
  }

  return "Kategori, konum veya işletme adı yazarsan sana en uygun seçenekleri listelerim.";
}

async function connectCustomerAdaLive() {
  if (!customerAdaLive) return;
  customerAdaLive.disabled = true;
  customerAdaLive.classList.add("is-waiting");
  customerAdaLive.textContent = "Ada bağlantısı kontrol ediliyor...";
  if (customerAdaStatus) customerAdaStatus.textContent = "Simli canlı avatar sahnesi hazırlanıyor.";

  try {
    const payload = await apiRequest("/api/customer/avatar/session", {
      method: "POST",
      body: JSON.stringify({
        avatarName: "Ada",
        query: state.query,
        category: state.category,
        city: state.city,
      }),
    });
    const sessionUrl = String(payload.sessionUrl || payload.stageUrl || "").trim();

    if (sessionUrl && customerAdaStage) {
      customerAdaStage.innerHTML = `<iframe title="Ada canlı avatar" src="${escapeHtml(sessionUrl)}" allow="camera; microphone; autoplay; clipboard-write"></iframe>`;
      customerAdaLive.textContent = "Ada canlı bağlantıda";
      appendCustomerAdaMessage("ada", "Canlı avatar sahnesini açtım. Simli bağlantısı burada çalışacak.");
      return;
    }

    if (customerAdaStatusTitle) customerAdaStatusTitle.textContent = "Canlı avatar hazır değil";
    if (customerAdaStatus) customerAdaStatus.textContent = payload.message || "Simli ortam bilgileri tamamlanınca Ada burada canlı açılacak.";
    customerAdaLive.textContent = "Simli yapılandırması bekleniyor";
    appendCustomerAdaMessage("ada", payload.message || "Simli bağlantısı henüz hazır değil. Yine de arama ve rezervasyon yönlendirmesi yapabilirim.");
  } catch (error) {
    if (customerAdaStatusTitle) customerAdaStatusTitle.textContent = "Bağlantı kurulamadı";
    if (customerAdaStatus) customerAdaStatus.textContent = error.message || "Canlı avatar bağlantısı şu an hazır değil.";
    customerAdaLive.textContent = "Tekrar dene";
    customerAdaLive.disabled = false;
    appendCustomerAdaMessage("ada", error.message || "Canlı avatar bağlantısı şu an kurulamadı.");
  }
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
    const error = new Error(payload.error || "İstek başarısız oldu.");
    error.status = response.status;
    error.code = payload.code || "";
    error.payload = payload;
    throw error;
  }

  return payload;
}

function getFriendlyErrorMessage(error, fallback = "İşlem tamamlanamadı.") {
  const rawMessage = String(error?.message || "").trim();
  const isNetworkError =
    !error?.status &&
    (/failed to fetch/i.test(rawMessage) ||
      /networkerror/i.test(rawMessage) ||
      /load failed/i.test(rawMessage) ||
      /internet connection/i.test(rawMessage));

  if (isNetworkError) {
    return "Sunucuya bağlanılamadı. Lütfen birkaç saniye sonra tekrar dene.";
  }

  return rawMessage || fallback;
}

function getLoginErrorMessage(error) {
  if (error?.status === 401) return "Kullanıcı bulunamadı veya şifre hatalı.";
  return getFriendlyErrorMessage(error, "Giriş yapılamadı. Lütfen bilgilerini kontrol et.");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
            <h4>${escapeHtml(section.title)}</h4>
            ${(section.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </section>
        `,
      )
      .join("")}
  `;
}

function getAuthEntryType() {
  return state.authEntry === "venue" ? "venue" : "customer";
}

function getAuthEntryLabel(role = getAuthEntryType()) {
  return role === "venue" ? "İşletme" : "Bireysel";
}

function getAuthRegisterButtonLabel(role = getAuthEntryType()) {
  return role === "venue" ? "İşletme hesabı oluştur" : "Bireysel hesap oluştur";
}

function getAuthSubmitLabel() {
  if (state.authMode === "register") return getAuthRegisterButtonLabel();
  if (state.authMode === "reset") return "Şifreyi yenile";
  return "Giriş Yap";
}

function setAuthFeedback(message = "", tone = "error") {
  if (!authFeedback) return;
  authFeedback.textContent = message;
  authFeedback.classList.toggle("is-success", tone === "success");
  authFeedback.classList.toggle("is-info", tone === "info");
}

function setAuthSubmitLoading(isLoading, label = "") {
  state.authRequestInFlight = Boolean(isLoading);
  if (authSubmit) {
    authSubmit.textContent = isLoading ? label || "İşlem yapılıyor..." : getAuthSubmitLabel();
    authSubmit.classList.toggle("is-loading", Boolean(isLoading));
  }
  updateAuthSubmitState();
}

function updateAuthChoiceCards() {
  authEntryChoices.forEach((button) => {
    const isSelected = button.dataset.entryChoice === getAuthEntryType();
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function updateAuthSubmitState() {
  if (!authSubmit) return;
  const needsTerms = state.authMode === "register" && state.authStep === "form";
  authSubmit.disabled = state.authRequestInFlight || (needsTerms && !authCustomerTermsAccept?.checked);
  if (authRoleHelper) {
    authRoleHelper.textContent = needsTerms && !authCustomerTermsAccept?.checked
      ? "Sözleşmeyi onaylayınca kayıt butonu aktif olur."
      : "";
  }
}

function updateAuthTermsCopy(role = getAuthEntryType()) {
  if (!authTermsAcceptLabel) return;
  authTermsAcceptLabel.textContent =
    role === "venue"
      ? "İşletme Paneli ve Marketplace Kullanım Sözleşmesi'ni okudum ve kabul ediyorum."
      : "Bireysel Kullanıcı ve Rezervasyon Sözleşmesi'ni okudum ve kabul ediyorum.";
}

async function loadTermsForRole(role = getAuthEntryType()) {
  const normalizedRole = role === "venue" ? "venue" : "customer";
  updateAuthTermsCopy(normalizedRole);
  if (!state.authTerms[normalizedRole]) {
    const endpoint = normalizedRole === "venue" ? "/api/legal/venue-terms" : "/api/legal/customer-terms";
    state.authTerms[normalizedRole] = await fetchJson(endpoint);
  }
  renderLegalTerms(authCustomerTermsText, state.authTerms[normalizedRole]);
  authCustomerTermsText?.scrollTo({ top: 0 });
}

function normalizeReservationItem(item = {}) {
  const totalAmount = parseMoney(item.price || item.priceLabel || 1000) || 1000;
  const time = String(item.nextSlot || item.availability?.nextSlot || item.eveningTime || "19:00").match(/\d{1,2}:\d{2}/)?.[0] || "19:00";

  return {
    id: item.id,
    venueId: item.venueId || item.id,
    listingId: item.listingId || item.id,
    name: item.name || "İşletme",
    category: item.category || "",
    categoryLabel: item.categoryLabel || "Hizmet",
    cityLabel: item.cityLabel || "Konum seçildi",
    totalAmount,
    serviceTime: time,
  };
}

function getTomorrowIsoDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getPaymentPolicyText(policy) {
  const mode = policy?.paymentMode || "commission_deposit";
  if (mode === "venue_payment") {
    return {
      title: "Sadece rezervasyon",
      body: "Bu işletme online ödeme istemiyor. Tutar işletmede ödenecek.",
    };
  }
  if (mode === "full_online") {
    return {
      title: "Tam online ödeme",
      body: "Rezervasyon tutarı online alınacak, işletme hakedişi panelde oluşacak.",
    };
  }
  return {
    title: "Ön ödeme",
    body: "Rezervasyonu tamamlamak için küçük bir online ön ödeme alınacak. Kalan tutar işletmede ödenecek.",
  };
}

function renderReservationPolicy() {
  const policyText = getPaymentPolicyText(state.reservationPolicy);
  if (reservationPolicy) {
    reservationPolicy.innerHTML = `
      <strong>${policyText.title}</strong>
      <span>${policyText.body}</span>
    `;
  }

  const billing = state.reservationPolicy?.billing;
  if (!reservationPreview || !billing) {
    if (reservationPreview) {
      reservationPreview.innerHTML = `
        <article>
          <small>Ödeme özeti</small>
          <strong>Hazırlanıyor</strong>
        </article>
      `;
    }
    return;
  }

  const onlineLabel = billing.customerOnlinePayment > 0 ? "Online alınacak" : "Online ödeme";
  const venueLabel = billing.customerVenuePayment > 0 ? "İşletmede ödenecek" : "İşletmede ödeme";
  reservationPreview.innerHTML = `
    <article>
      <small>${onlineLabel}</small>
      <strong>${formatCurrency(billing.customerOnlinePayment)}</strong>
    </article>
    <article>
      <small>${venueLabel}</small>
      <strong>${formatCurrency(billing.customerVenuePayment)}</strong>
    </article>
    <article>
      <small>Toplam hizmet bedeli</small>
      <strong>${formatCurrency(billing.totalAmount)}</strong>
    </article>
    <article>
      <small>Rezervasyon modeli</small>
      <strong>${billing.paymentModeLabel}</strong>
    </article>
  `;
}

async function loadReservationPolicy() {
  if (!state.reservationDraft) return;
  const requestId = state.reservationPolicyRequest + 1;
  state.reservationPolicyRequest = requestId;
  state.reservationPolicy = null;
  renderReservationPolicy();

  const params = new URLSearchParams({
    venueId: state.reservationDraft.venueId,
    totalAmount: String(parseMoney(reservationTotal?.value || state.reservationDraft.totalAmount)),
  });

  try {
    const payload = await fetchJson(`/api/reservations/payment-policy?${params.toString()}`);
    if (state.reservationPolicyRequest !== requestId) return;
    state.reservationPolicy = payload;
    renderReservationPolicy();
  } catch (error) {
    if (reservationPolicy) {
      reservationPolicy.innerHTML = `
        <strong>Ödeme politikası alınamadı</strong>
        <span>Lütfen birazdan tekrar dene.</span>
      `;
    }
  }
}

function openReservationModal(item = {}) {
  const draft = normalizeReservationItem(item);
  state.reservationDraft = draft;
  state.reservationPolicy = null;
  closeHeaderPopovers();
  closeAccountMenu();

  if (reservationTitle) reservationTitle.textContent = draft.name;
  if (reservationSubtitle) {
    reservationSubtitle.textContent = `${draft.categoryLabel} · ${draft.cityLabel}`;
  }
  if (reservationName) reservationName.value = state.user?.name || "";
  if (reservationPhone) reservationPhone.value = state.user?.phone || "";
  if (reservationEmail) reservationEmail.value = state.user?.email || "";
  if (reservationTotal) reservationTotal.value = String(Math.round(draft.totalAmount));
  if (reservationDate) {
    reservationDate.min = new Date().toISOString().slice(0, 10);
    reservationDate.value = getTomorrowIsoDate();
  }
  if (reservationTime) reservationTime.value = draft.serviceTime;
  if (reservationNote) reservationNote.value = "";
  if (reservationFeedback) {
    reservationFeedback.textContent = "";
    reservationFeedback.classList.remove("is-success");
  }

  reservationModal?.classList.remove("hidden");
  reservationModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  loadReservationPolicy();
}

function closeReservationModal() {
  reservationModal?.classList.add("hidden");
  reservationModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  state.reservationDraft = null;
  state.reservationPolicy = null;
}

async function loadBootstrap() {
  const payload = await fetchJson("/api/bootstrap");
  state.featuredListings = payload.featuredListings || [];
  renderCities(payload.cities);
  renderCategories(payload.categories);
  renderMosaicCounts(payload.categories);
  renderHeroMetrics(payload.heroMetrics);
  renderHotSlots(payload.hotSlots);
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
  state.authStep = "entry";
  authTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
  const isRegister = mode === "register";
  authTitle.textContent = isRegister ? "Kayıt Ol" : "Giriş yap";
  authSubmit.textContent = isRegister ? "Kayıt Ol" : "Giriş Yap";
  nameField.classList.toggle("hidden", !isRegister);
  phoneField.classList.toggle("hidden", !isRegister);
  authStepEntry.classList.remove("hidden");
  authStepForm.classList.add("hidden");
  authStepReset?.classList.add("hidden");
  authEntryBack.classList.add("hidden");
  authForgotPassword?.classList.add("hidden");
  authTermsPanel?.classList.add("hidden");
  authDialog?.classList.add("is-choice-step");
  authDialog?.classList.remove("is-form-step");
  authModal.dataset.mode = mode;
  setAuthSubmitLoading(false);
  setAuthFeedback("");
  if (authCustomerTermsAccept) authCustomerTermsAccept.checked = false;
  updateAuthChoiceCards();
  updateAuthSubmitState();
}

function setResetFeedback(message = "", isSuccess = false) {
  if (!authResetFeedback) return;
  authResetFeedback.textContent = message;
  authResetFeedback.classList.toggle("is-success", Boolean(isSuccess));
}

function openAuthModal(mode = "login") {
  setAuthMode(mode);
  closeAccountMenu();
  authModal.classList.remove("hidden");
  authModal.setAttribute("aria-hidden", "false");
}

function openPasswordResetStep({ email = "", token = "" } = {}) {
  state.authMode = "reset";
  state.authStep = "reset";
  closeAccountMenu();
  authTabs.forEach((tab) => tab.classList.remove("is-active"));
  authTitle.textContent = "Şifremi unuttum";
  authStepEntry.classList.add("hidden");
  authStepForm.classList.add("hidden");
  authStepReset?.classList.remove("hidden");
  authEntryBack.classList.add("hidden");
  authForgotPassword?.classList.add("hidden");
  authTermsPanel?.classList.add("hidden");
  authDialog?.classList.remove("is-choice-step");
  authDialog?.classList.add("is-form-step");
  authModal.dataset.mode = "reset";
  authModal.classList.remove("hidden");
  authModal.setAttribute("aria-hidden", "false");
  if (authResetEmail) authResetEmail.value = email || authEmail.value.trim();
  if (authResetCode) authResetCode.value = token;
  if (authResetPassword) authResetPassword.value = "";
  setAuthSubmitLoading(false);
  setAuthFeedback("");
  setResetFeedback(
    token ? "Şifre yenileme bağlantısı doğrulandı. Yeni şifreni yazıp işlemi tamamlayabilirsin." : "",
    Boolean(token),
  );
  window.setTimeout(() => (token ? authResetPassword : authResetEmail)?.focus(), 40);
}

function returnToLoginFromReset(message = "") {
  setAuthMode("login");
  state.authStep = "form";
  showAuthFormStep();
  if (message) {
    setAuthFeedback(message, "success");
  }
}

function openVenueLoginModal(message = "") {
  openAuthModal("login");
  state.authEntry = "venue";
  state.authStep = "form";
  authTitle.textContent = "İşletme girişi";
  showAuthFormStep();
  setAuthFeedback(message);
}

function closeAuthModal() {
  authModal.classList.add("hidden");
  authModal.setAttribute("aria-hidden", "true");
  state.authStep = "entry";
  authForm.reset();
  authStepReset?.classList.add("hidden");
  if (authCustomerTermsAccept) authCustomerTermsAccept.checked = false;
  setAuthSubmitLoading(false);
  updateAuthSubmitState();
}

function clearAuthSession() {
  localStorage.removeItem("tyee_token");
  state.token = "";
  state.user = null;
  state.customerDashboard = null;
  updateAuthUi();
}

function showAuthFormStep() {
  state.authStep = "form";
  const role = getAuthEntryType();
  const isRegister = state.authMode === "register";
  authStepEntry.classList.add("hidden");
  authStepForm.classList.remove("hidden");
  authStepReset?.classList.add("hidden");
  authEntryBack.classList.remove("hidden");
  authDialog?.classList.remove("is-choice-step");
  authDialog?.classList.add("is-form-step");
  authTitle.textContent = isRegister ? `${getAuthEntryLabel(role)} kayıt` : `${getAuthEntryLabel(role)} giriş`;
  authSubmit.textContent = isRegister ? getAuthRegisterButtonLabel(role) : "Giriş Yap";
  nameField.classList.toggle("hidden", !isRegister);
  phoneField.classList.toggle("hidden", !isRegister);
  authForgotPassword?.classList.toggle("hidden", isRegister);
  authTermsPanel?.classList.toggle("hidden", !isRegister);
  setAuthSubmitLoading(false);
  setAuthFeedback("");
  if (authCustomerTermsAccept) authCustomerTermsAccept.checked = false;
  updateAuthSubmitState();
  if (isRegister) {
    loadTermsForRole(role).catch(() => {
      if (authCustomerTermsText) authCustomerTermsText.innerHTML = "<p>Sözleşme metni şu anda yüklenemedi.</p>";
    });
  }
}

function closeAccountMenu() {
  accountMenu.classList.add("hidden");
  accountMenu.setAttribute("aria-hidden", "true");
  loginTrigger.setAttribute("aria-expanded", "false");
}

const CUSTOMER_PANEL_META = {
  reservations: {
    title: "Rezervasyonlarım",
    subtitle: "Yaklaşan ve geçmiş rezervasyonlarını tek yerden takip et.",
  },
  purchases: {
    title: "Satın Aldıklarım",
    subtitle: "Paket, abonelik ve online satın almalarını burada göreceksin.",
  },
  reviews: {
    title: "Değerlendirmelerim",
    subtitle: "Rezervasyon sonrası verdiğin puan ve yorumları yönet.",
  },
  favorites: {
    title: "Favorilerim",
    subtitle: "Kaydettiğin işletmelere hızlıca geri dön.",
  },
  billing: {
    title: "Fatura Adreslerim",
    subtitle: "Bireysel ve kurumsal fatura adreslerini düzenle.",
  },
  cards: {
    title: "Kayıtlı Kartlarım",
    subtitle: "Ödeme sırasında kullanacağın kartları güvenle yönet.",
  },
};

function closeCustomerPanel() {
  customerPanel?.classList.add("hidden");
  customerPanel?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function setCustomerPanelLoading(message = "Bilgiler yükleniyor...") {
  if (customerPanelContent) customerPanelContent.innerHTML = `<div class="customer-empty-state">${escapeHtml(message)}</div>`;
}

async function loadCustomerDashboard() {
  const payload = await apiRequest("/api/customer/dashboard", { method: "GET" });
  state.customerDashboard = payload;
  return payload;
}

function customerEmpty(title, text) {
  return `
    <div class="customer-empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
    </div>
  `;
}

function renderCustomerReservationList(items = [], emptyText) {
  if (!items.length) return customerEmpty("Kayıt bulunamadı", emptyText);
  return `
    <div class="customer-card-list">
      ${items
        .map(
          (item) => `
            <article class="customer-record-card">
              <div>
                <span class="customer-record-status">${escapeHtml(item.statusLabel)}</span>
                <h3>${escapeHtml(item.venueName)}</h3>
                <p>${escapeHtml(item.serviceLabel)} · ${escapeHtml(item.serviceDateLabel)} · ${escapeHtml(item.serviceTime)}</p>
              </div>
              <aside>
                <strong>${escapeHtml(item.totalAmountLabel)}</strong>
                <span>${escapeHtml(item.paymentModeLabel)}</span>
              </aside>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCustomerPanelContent(tab = state.customerPanelTab) {
  const dashboard = state.customerDashboard || {};
  const meta = CUSTOMER_PANEL_META[tab] || CUSTOMER_PANEL_META.reservations;
  customerPanelTitle.textContent = meta.title;
  customerPanelSubtitle.textContent = meta.subtitle;
  customerPanelTabs.forEach((button) => button.classList.toggle("is-active", button.dataset.customerPanelTab === tab));

  if (tab === "reservations") {
    const upcoming = dashboard.reservations?.upcoming || [];
    const past = dashboard.reservations?.past || [];
    customerPanelContent.innerHTML = `
      <div class="customer-panel-block">
        <div class="customer-panel-block-head">
          <h3>Gelecek rezervasyonlarım</h3>
          <span>${upcoming.length} kayıt</span>
        </div>
        ${renderCustomerReservationList(upcoming, "Henüz yaklaşan rezervasyonun yok.")}
      </div>
      <div class="customer-panel-block">
        <div class="customer-panel-block-head">
          <h3>Geçmiş rezervasyonlarım</h3>
          <span>${past.length} kayıt</span>
        </div>
        ${renderCustomerReservationList(past, "Geçmiş rezervasyon kaydı bulunamadı.")}
      </div>
    `;
    return;
  }

  if (tab === "reviews") {
    const reviews = dashboard.reviews || [];
    customerPanelContent.innerHTML = reviews.length
      ? `<div class="customer-card-list">${reviews
          .map(
            (item) => `
              <article class="customer-record-card">
                <div>
                  <span class="customer-record-status">${escapeHtml(item.status)}</span>
                  <h3>${escapeHtml(item.venueName)}</h3>
                  <p>${"★".repeat(Number(item.rating || 0))} · ${escapeHtml(item.comment || "Yorum yok")}</p>
                </div>
                <aside><span>${escapeHtml(item.date)}</span></aside>
              </article>
            `,
          )
          .join("")}</div>`
      : customerEmpty("Değerlendirme bulunamadı", "Rezervasyon tamamlandıktan sonra puan ve yorumların burada görünecek.");
    return;
  }

  const emptyCopy = {
    purchases: ["Satın alma bulunamadı", "Paket ve abonelik satın alımların burada listelenecek."],
    favorites: ["Favori bulunamadı", "Kalp ikonuyla kaydettiğin işletmeler burada görünecek."],
    billing: ["Fatura adresi bulunamadı", "Ödeme adımında eklediğin bireysel veya kurumsal adresleri burada yöneteceksin."],
    cards: ["Kayıtlı kart bulunamadı", "Kart saklama ödeme kuruluşu devreye alındığında burada yönetilecek."],
  }[tab] || ["Kayıt bulunamadı", "Bu alandaki bilgiler hazır olduğunda burada görünecek."];

  customerPanelContent.innerHTML = customerEmpty(emptyCopy[0], emptyCopy[1]);
}

async function openCustomerPanel(tab = "reservations") {
  if (!state.user) {
    openAuthModal("login");
    return;
  }

  state.customerPanelTab = tab;
  closeAccountMenu();
  customerPanel?.classList.remove("hidden");
  customerPanel?.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setCustomerPanelLoading();

  try {
    await loadCustomerDashboard();
    renderCustomerPanelContent(tab);
  } catch (error) {
    setCustomerPanelLoading(error.message || "Hesap bilgileri yüklenemedi.");
  }
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
    const needsVerification = !state.user.emailVerified;
    const isVenueUser = Boolean(state.user.canManageVenue);
    accountLabel.textContent = state.user.name;
    avatarMini.textContent = getInitials(state.user.name);
    avatarMini.classList.remove("hidden");
    loginTrigger.classList.add("is-authenticated");
    accountMenuCopy.innerHTML = `
      <div class="account-menu-profile">
        <span class="account-menu-avatar">${getInitials(state.user.name)}</span>
        <div>
          <strong>${state.user.name}</strong>
          <span>${isVenueUser ? "İşletme hesabı" : "Bireysel hesap"}</span>
        </div>
      </div>
      ${
        needsVerification
          ? `<div class="account-verification-card">
              <em class="account-verify-note">E-posta doğrulaması bekliyor</em>${
              !state.user.emailVerified
                ? `<button class="account-inline-action" data-resend-verification type="button">Tekrar gönder</button>`
                : ""
            }
            </div>`
          : `<em class="account-verify-note is-ok">Hesap doğrulandı</em>`
      }
    `;
    accountDashboard.classList.toggle("hidden", !isVenueUser);
    accountAdmin.classList.toggle("hidden", !state.user.canAccessAdmin);
    customerHeaderOnlyItems.forEach((item) => item.classList.toggle("hidden", isVenueUser));
    customerAccountOnlyItems.forEach((item) => item.classList.toggle("hidden", isVenueUser));
  } else {
    accountLabel.textContent = "Giriş Yap / Kayıt Ol";
    avatarMini.textContent = "";
    avatarMini.classList.add("hidden");
    loginTrigger.classList.remove("is-authenticated");
    accountDashboard.classList.add("hidden");
    accountAdmin.classList.add("hidden");
    customerHeaderOnlyItems.forEach((item) => item.classList.remove("hidden"));
    customerAccountOnlyItems.forEach((item) => item.classList.remove("hidden"));
    accountMenuCopy.innerHTML = `
      <div class="account-menu-profile">
        <span class="account-menu-avatar">TY</span>
        <div>
          <strong>Hesap</strong>
          <span>Rezervasyonlarını ve oturumunu yönet.</span>
        </div>
      </div>
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

function getCategoryLabel(categoryId = "all") {
  if (categoryId === "all") return "";
  return state.categories.find((item) => item.id === categoryId)?.label || "";
}

function openSearchCategoryPopover() {
  if (!searchCategoryPopover) return;
  renderSearchCategoryPopover();
  searchCategoryPopover.classList.remove("hidden");
  searchCategoryPopover.setAttribute("aria-hidden", "false");
}

function closeSearchCategoryPopover() {
  if (!searchCategoryPopover) return;
  searchCategoryPopover.classList.add("hidden");
  searchCategoryPopover.setAttribute("aria-hidden", "true");
}

function handleCategoryClick(event) {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  state.category = button.dataset.filter || "all";
  setActiveCategory(state.category);
  loadListings();
}

function handleSearchCategoryClick(event) {
  const businessButton = event.target.closest("[data-business-id]");
  if (businessButton) {
    state.category = businessButton.dataset.businessCategory || "all";
    state.query = businessButton.dataset.businessName || "";
    queryInput.value = state.query;
    setActiveCategory(state.category);
    closeSearchCategoryPopover();
    loadListings();
    return;
  }

  const button = event.target.closest("[data-filter]");
  if (!button) return;

  state.category = button.dataset.filter || "all";
  state.query = "";
  queryInput.value = button.dataset.categoryLabel || "";
  setActiveCategory(state.category);
  closeSearchCategoryPopover();
  loadListings();
}

filterPillsContainer.addEventListener("click", handleCategoryClick);
categoryRail.addEventListener("click", handleCategoryClick);
searchCategoryList?.addEventListener("click", handleSearchCategoryClick);
searchCategoryTabs.forEach((button) => {
  button.addEventListener("click", () => {
    state.searchType = button.dataset.searchType || "all";
    renderSearchCategoryPopover();
    openSearchCategoryPopover();
  });
});
categoryNext?.addEventListener("click", () => {
  categoryRail.scrollBy({
    left: Math.max(320, categoryRail.clientWidth * 0.72),
    behavior: "smooth",
  });
});

searchFieldMain?.addEventListener("click", openSearchCategoryPopover);
queryInput.addEventListener("focus", openSearchCategoryPopover);

customerAdaLauncher?.addEventListener("click", toggleCustomerAda);
customerAdaClose?.addEventListener("click", closeCustomerAda);
customerAdaActions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-customer-ada-action]");
  if (!button) return;
  runCustomerAdaAction(button.dataset.customerAdaAction);
});
customerAdaForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = customerAdaInput?.value.trim() || "";
  if (!question) return;
  appendCustomerAdaMessage("user", question);
  customerAdaInput.value = "";
  try {
    const payload = await apiRequest("/api/customer/assistant/chat", {
      method: "POST",
      body: JSON.stringify({
        question,
        query: state.query,
        category: state.category,
        city: state.city,
      }),
    });
    appendCustomerAdaMessage("ada", payload.answer || answerCustomerAda(question));
  } catch (error) {
    appendCustomerAdaMessage("ada", answerCustomerAda(question));
  }
});
customerAdaLive?.addEventListener("click", connectCustomerAdaLive);

popularSearches.addEventListener("click", (event) => {
  const button = event.target.closest("[data-search]");
  if (!button) return;

  queryInput.value = button.dataset.search;
  state.query = queryInput.value.trim();
  state.category = "all";
  setActiveCategory("all");
  closeSearchCategoryPopover();
  loadListings();
});

searchPanel.addEventListener("submit", (event) => {
  event.preventDefault();
  const activeCategory = getActiveCategory();
  const queryValue = queryInput.value.trim();
  const activeCategoryLabel = getCategoryLabel(activeCategory);
  state.query = activeCategory !== "all" && queryValue === activeCategoryLabel ? "" : queryValue;
  state.city = citySelect.value;
  state.category = activeCategory;
  closeSearchCategoryPopover();
  loadListings();
  listingGrid.scrollIntoView({ behavior: "smooth", block: "start" });
});

queryInput.addEventListener("input", () => {
  state.query = queryInput.value.trim();
  state.category = "all";
  setActiveCategory("all");
  openSearchCategoryPopover();
  loadListings();
});

citySelect.addEventListener("change", () => {
  state.city = citySelect.value;
  closeSearchCategoryPopover();
  loadListings();
});

citySelect.addEventListener("focus", closeSearchCategoryPopover);

document.addEventListener("click", (event) => {
  if (event.target.closest(".search-shell")) return;
  closeSearchCategoryPopover();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSearchCategoryPopover();
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
  const item = state.nearbyItems.find((candidate) => candidate.id === button.dataset.markerId);
  openReservationPage(item || button.dataset.markerId);
});
inlineNearbyResults?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-marker-id]");
  if (!button) return;
  const item = state.nearbyItems.find((candidate) => candidate.id === button.dataset.markerId);
  openReservationPage(item || button.dataset.markerId);
});

listingGrid?.addEventListener("click", (event) => {
  const reservationButton = event.target.closest("[data-reservation-id], [data-listing-reservation-id]");
  if (reservationButton) {
    event.preventDefault();
    const itemId = reservationButton.dataset.reservationId || reservationButton.dataset.listingReservationId;
    const item =
      state.nearbyItems.find((candidate) => candidate.id === itemId) ||
      state.featuredListings.find((candidate) => candidate.id === itemId);
    openReservationPage(item || itemId);
    return;
  }

  const card = event.target.closest(".nearby-facility-card[data-marker-id]");
  if (!card) return;
  const item = state.nearbyItems.find((candidate) => candidate.id === card.dataset.markerId);
  openReservationPage(item || card.dataset.markerId);
});

reservationClose?.addEventListener("click", closeReservationModal);
reservationDismiss?.addEventListener("click", closeReservationModal);
reservationTotal?.addEventListener("input", () => {
  window.clearTimeout(reservationTotal.refreshTimer);
  reservationTotal.refreshTimer = window.setTimeout(loadReservationPolicy, 250);
});

reservationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.reservationDraft) return;

  reservationFeedback.textContent = "";
  reservationFeedback.classList.remove("is-success");

  try {
    const response = await apiRequest("/api/reservations", {
      method: "POST",
      body: JSON.stringify({
        venueId: state.reservationDraft.venueId,
        listingId: state.reservationDraft.listingId,
        venueName: state.reservationDraft.name,
        listingName: state.reservationDraft.name,
        category: state.reservationDraft.category,
        categoryLabel: state.reservationDraft.categoryLabel,
        serviceLabel: state.reservationDraft.categoryLabel,
        customerName: reservationName.value.trim(),
        customerPhone: reservationPhone.value.trim(),
        customerEmail: reservationEmail.value.trim(),
        totalAmount: reservationTotal.value,
        serviceDate: reservationDate.value,
        serviceTime: reservationTime.value,
        note: reservationNote.value.trim(),
      }),
    });

    state.reservationPolicy = {
      paymentMode: response.reservation.paymentMode,
      paymentModeLabel: response.reservation.paymentModeLabel,
      billing: response.reservation.billing,
    };
    renderReservationPolicy();
    reservationFeedback.textContent = response.message || "Rezervasyon oluşturuldu.";
    reservationFeedback.classList.add("is-success");
    window.setTimeout(closeReservationModal, 900);
  } catch (error) {
    reservationFeedback.textContent = error.message;
    reservationFeedback.classList.remove("is-success");
  }
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

accountMenu.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-resend-verification]");
  if (!button) return;

  const note = accountMenuCopy.querySelector(".account-verify-note");
  button.disabled = true;
  button.textContent = "Gönderiliyor...";
  if (note) note.textContent = "E-posta hazırlanıyor";

  try {
    await apiRequest("/api/auth/resend-verification", { method: "POST" });
    if (note) note.textContent = "Doğrulama e-postası gönderildi";
    button.textContent = "Tekrar gönder";
  } catch (error) {
    if (note) note.textContent = "E-posta gönderilemedi";
    button.textContent = "Tekrar dene";
  } finally {
    button.disabled = false;
  }
});

customerPanelTriggers.forEach((button) => {
  button.addEventListener("click", () => openCustomerPanel(button.dataset.customerPanel));
});

customerPanelTabs.forEach((button) => {
  button.addEventListener("click", () => {
    state.customerPanelTab = button.dataset.customerPanelTab;
    renderCustomerPanelContent(state.customerPanelTab);
  });
});

customerPanelClose?.addEventListener("click", closeCustomerPanel);
customerPanelDismiss?.addEventListener("click", closeCustomerPanel);

accountLogout.addEventListener("click", () => {
  clearAuthSession();
  authForm.reset();
  closeAccountMenu();
  closeCustomerPanel();
});

businessNavLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (state.user?.canManageVenue) return;

    event.preventDefault();
    if (state.user && !state.user.canManageVenue) {
      openVenueLoginModal("Bu hesap bireysel müşteri hesabı. İşletme paneli için işletme hesabı ile giriş yapmalısın.");
      return;
    }

    openVenueLoginModal("İşletme paneline girmek için işletme hesabı ile giriş yapmalısın.");
  });
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

authEntryBack.addEventListener("click", () => {
  state.authStep = "entry";
  setAuthSubmitLoading(false);
  setAuthFeedback("");
  authStepForm.classList.add("hidden");
  authStepEntry.classList.remove("hidden");
  authEntryBack.classList.add("hidden");
  authTermsPanel?.classList.add("hidden");
  authDialog?.classList.add("is-choice-step");
  authDialog?.classList.remove("is-form-step");
  if (authCustomerTermsAccept) authCustomerTermsAccept.checked = false;
  updateAuthSubmitState();
});

authEntryChoices.forEach((button) => {
  button.addEventListener("click", () => {
    state.authEntry = button.dataset.entryChoice === "venue" ? "venue" : "customer";
    updateAuthChoiceCards();
    showAuthFormStep();
  });
});

authCustomerTermsAccept?.addEventListener("change", updateAuthSubmitState);

authForgotPassword?.addEventListener("click", () => {
  openPasswordResetStep({ email: authEmail.value.trim() });
});

authResetBack?.addEventListener("click", () => {
  returnToLoginFromReset();
});

authResetRequest?.addEventListener("click", async () => {
  const email = authResetEmail?.value.trim();
  setResetFeedback("");
  if (!email) {
    setResetFeedback("E-posta adresini yazmalısın.");
    return;
  }

  authResetRequest.disabled = true;
  authResetRequest.textContent = "Gönderiliyor...";
  try {
    const payload = await apiRequest("/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setResetFeedback(payload.message || "Şifre yenileme bağlantısı gönderildi.", true);
    authResetCode?.focus();
  } catch (error) {
    setResetFeedback(error.message || "Şifre yenileme isteği gönderilemedi.");
  } finally {
    authResetRequest.disabled = false;
    authResetRequest.textContent = "Reset linki gönder";
  }
});

authResetConfirm?.addEventListener("click", async () => {
  const email = authResetEmail?.value.trim();
  const token = authResetCode?.value.trim();
  const password = authResetPassword?.value || "";
  setResetFeedback("");

  if (!email || !token || password.length < 6) {
    setResetFeedback("E-posta, kod ve en az 6 karakter yeni şifre gerekli.");
    return;
  }

  authResetConfirm.disabled = true;
  authResetConfirm.textContent = "Güncelleniyor...";
  try {
    const payload = await apiRequest("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ email, token, password }),
    });
    authForm.reset();
    if (authEmail) authEmail.value = email;
    returnToLoginFromReset(payload.message || "Şifre güncellendi. Yeni şifrenle giriş yapabilirsin.");
  } catch (error) {
    setResetFeedback(error.message || "Şifre güncellenemedi.");
  } finally {
    authResetConfirm.disabled = false;
    authResetConfirm.textContent = "Şifreyi yenile";
  }
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.authMode === "reset") return;
  if (state.authRequestInFlight) return;
  setAuthFeedback("");

  const isRegister = state.authMode === "register";
  const payload = {
    email: authEmail.value.trim(),
    password: authPassword.value,
    loginType: state.authEntry === "venue" ? "venue" : "customer",
  };

  if (isRegister) {
    payload.name = authName.value.trim();
    payload.phone = authPhone.value.trim();
    payload.role = getAuthEntryType();

    if (!authCustomerTermsAccept?.checked) {
      setAuthFeedback(
        payload.role === "venue"
          ? "İşletme sözleşmesini okuyup kabul etmelisin."
          : "Bireysel kullanıcı sözleşmesini okuyup kabul etmelisin.",
      );
      updateAuthSubmitState();
      return;
    }

    setAuthSubmitLoading(true, "Hesap oluşturuluyor...");
    setAuthFeedback("Hesap oluşturuluyor...", "info");

    try {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      state.token = response.token;
      state.user = response.user;
      localStorage.setItem("tyee_token", response.token);
      updateAuthUi();
      const emailStatus = response.emailDelivery?.status || "";
      const smsStatus = response.smsDelivery?.status || "";
      const emailAccepted = ["sent", "queued", "dev-queued"].includes(emailStatus);
      const smsAccepted = !payload.phone || ["sent", "queued", "accepted", "sending", "dev-queued"].includes(smsStatus);
      const deliveryAccepted = emailAccepted && smsAccepted;
      setAuthFeedback(
        response.nextStep || "Hesap oluşturuldu. Giriş yapıldı.",
        deliveryAccepted ? "success" : "error",
      );
      authForm.reset();
      if (authCustomerTermsAccept) authCustomerTermsAccept.checked = false;
      updateAuthSubmitState();
      if (deliveryAccepted) {
        setTimeout(() => {
          if (response.user?.canManageVenue) {
            closeAuthModal();
            window.location.href = "/venue.html";
            return;
          }
          closeAuthModal();
        }, 900);
      }
    } catch (error) {
      if (error.code === "EMAIL_EXISTS" || error.status === 409) {
        const existingEmail = payload.email;
        clearAuthSession();
        setAuthMode("login");
        state.authEntry = payload.role === "venue" ? "venue" : "customer";
        updateAuthChoiceCards();
        showAuthFormStep();
        if (authEmail) authEmail.value = existingEmail;
        if (authPassword) authPassword.value = payload.password;
        setAuthFeedback(getFriendlyErrorMessage(error, "Bu e-posta ile kayıt bulunuyor."));
        updateAuthSubmitState();
        return;
      }
      setAuthFeedback(getFriendlyErrorMessage(error, "Hesap oluşturulamadı."));
      updateAuthSubmitState();
    } finally {
      setAuthSubmitLoading(false);
    }
    return;
  }

  setAuthSubmitLoading(true, "Giriş yapılıyor...");
  setAuthFeedback("Giriş yapılıyor...", "info");

  try {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    state.token = response.token;
    state.user = response.user;
    localStorage.setItem("tyee_token", response.token);
    updateAuthUi();
    setAuthFeedback("Giriş başarılı.", "success");
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

        setAuthFeedback("Bu hesap bireysel müşteri hesabı. İşletme paneli için işletme hesabı ile giriş yapmalısın.");
        return;
      }

      closeAuthModal();
    }, 500);
  } catch (error) {
    setAuthFeedback(getLoginErrorMessage(error));
  } finally {
    setAuthSubmitLoading(false);
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

loadTermsForRole("customer").catch(() => {
  if (authCustomerTermsText) authCustomerTermsText.innerHTML = "<p>Sözleşme metni şu anda yüklenemedi.</p>";
});

syncInfoViewWithHash();

const initialParams = new URLSearchParams(window.location.search);
const resetEmailParam = initialParams.get("resetEmail") || "";
const resetTokenParam = initialParams.get("resetToken") || "";
const authParam = initialParams.get("auth") || "";
const verifiedState = initialParams.get("verified");
if (resetEmailParam || resetTokenParam) {
  openPasswordResetStep({ email: resetEmailParam, token: resetTokenParam });
  initialParams.delete("resetEmail");
  initialParams.delete("resetToken");
  const nextQuery = initialParams.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`);
} else if (authParam === "venue-login") {
  openVenueLoginModal("İşletme paneline girmek için işletme hesabı ile giriş yapmalısın.");
  initialParams.delete("auth");
  const nextQuery = initialParams.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`);
} else if (verifiedState) {
  openAuthModal("login");
  setAuthFeedback(
    verifiedState === "success"
      ? "E-posta doğrulandı. Artık hesabına giriş yapabilirsin."
      : "Doğrulama bağlantısı geçersiz veya süresi dolmuş.",
    verifiedState === "success" ? "success" : "error",
  );
  window.history.replaceState({}, "", window.location.pathname);
}
