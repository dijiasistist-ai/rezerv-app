const venueTitle = document.querySelector("#venue-title");
const venueAvatar = document.querySelector("#venue-avatar");
const venueName = document.querySelector("#venue-name");
const venueBranch = document.querySelector("#venue-branch");
const statGrid = document.querySelector("#stat-grid");
const quickActions = document.querySelector("#quick-actions");
const calendarBoardSecondary = document.querySelector("#calendar-board-secondary");
const weekRange = document.querySelector("#week-range");
const weekPrevButton = document.querySelector("#week-prev");
const weekNextButton = document.querySelector("#week-next");
const salesModal = document.querySelector("#sales-modal");
const salesModalClose = document.querySelector("#sales-modal-close");
const salesCancel = document.querySelector("#sales-cancel");
const salesSave = document.querySelector("#sales-save");
const salesTime = document.querySelector("#sales-time");
const salesDeposit = document.querySelector("#sales-deposit");
const salesPhone = document.querySelector("#sales-phone");
const salesPayout = document.querySelector("#sales-payout");
const salesName = document.querySelector("#sales-name");
const salesTotal = document.querySelector("#sales-total");
const salesNotes = document.querySelector("#sales-notes");
const salesSubscription = document.querySelector("#sales-subscription");
const overviewList = document.querySelector("#overview-list");
const subscriptionsBody = document.querySelector("#subscriptions-body");
const transactionsBody = document.querySelector("#transactions-body");
const reportSummaryGrid = document.querySelector("#report-summary-grid");
const settingsTabs = document.querySelector("#settings-tabs");
const settingsOnboardingForm = document.querySelector("#settings-onboarding-form");
const profileCard = document.querySelector("#profile-card");
const profileFormGrid = document.querySelector("#profile-form-grid");
const reviewsShell = document.querySelector("#reviews-shell");
const billingBody = document.querySelector("#billing-body");
const managerMenuItems = document.querySelector("#manager-menu-items");
const managerMenu = document.querySelector("#manager-menu");
const managerMenuTrigger = document.querySelector("#manager-menu-trigger");
const topbarLinks = document.querySelectorAll(".topbar-link");
const navItems = document.querySelectorAll(".venue-nav-item");
const sections = document.querySelectorAll(".view-section");
const authWall = document.querySelector("#venue-auth-wall");

const venueState = {
  selectedSlotKey: "",
  slotModes: {},
  manualEntries: {},
  currentWeekOffset: 0,
  isManagerMenuOpen: false,
  salesDraftSlotKey: "",
  dashboard: null,
};

const WEEKDAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
const MONTH_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];
const BASE_WEEK_START = new Date(2026, 4, 11);
const DEFAULT_MANAGER_MENU = ["Takvim", "Haftalık Abonelik Satış", "İşlemler", "Raporlama", "Ayarlar", "Çıkış Yap"];

function getToken() {
  return localStorage.getItem("rezerv_token") || "";
}

function isDemoHost() {
  return ["127.0.0.1", "localhost", "rezerv-app.onrender.com"].includes(window.location.hostname);
}

async function requireVenueAccess() {
  if (isDemoHost()) {
    return {
      name: "Demo Venue",
      canManageVenue: true,
    };
  }

  const token = getToken();

  if (!token) {
    authWall.classList.remove("hidden");
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1200);
    throw new Error("No auth token");
  }

  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    authWall.classList.remove("hidden");
    localStorage.removeItem("rezerv_token");
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1200);
    throw new Error("Invalid session");
  }

  const payload = await response.json();
  if (!payload.user || !payload.user.canManageVenue) {
    authWall.classList.remove("hidden");
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1400);
    throw new Error("Not a venue user");
  }

  return payload.user;
}

function renderStats(items) {
  statGrid.innerHTML = items
    .map(
      (item) => `
        <article class="stat-card">
          <small>${item.label}</small>
          <strong>${item.value}</strong>
          <span>${item.delta}</span>
        </article>
      `,
    )
    .join("");
}

function slotClass(status) {
  return `status-${status}`;
}

function renderCalendar(board, items) {
  board.innerHTML = items
    .map(
      (day) => `
        <article class="day-column">
          <div class="day-head">
            <strong>${day.label}</strong>
          </div>
          <div class="day-slots">
            ${day.slots
              .map(
                (slot) => `
                  <div class="slot-card ${slotClass(slot.status)}">
                    <small>${slot.time}</small>
                    <strong>${slot.title}</strong>
                    <span>${slot.meta}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function buildTimeSlots() {
  const slots = [];
  let hour = 8;

  while (true) {
    const label = `${String(hour).padStart(2, "0")}:00`;
    slots.push(label);

    if (hour === 1) {
      break;
    }

    hour += 1;
    if (hour === 24) hour = 0;
  }

  return slots;
}

function getDefaultMode(slot) {
  if (!slot) return "rezerv";
  if (slot.status === "marketplace") return "rezerv";
  if (slot.status === "maintenance") return "closed";
  return "reserved";
}

function getReservedSource(slot) {
  const payment = (slot?.payment || "").toLocaleLowerCase("tr-TR");

  if (payment.includes("online")) {
    return { label: "Online", className: "is-online" };
  }
  if (payment.includes("eft")) {
    return { label: "EFT", className: "is-eft" };
  }
  if (payment.includes("nakit")) {
    return { label: "Nakit", className: "is-cash" };
  }
  if (payment.includes("manuel") || payment.includes("işletme")) {
    return { label: "Manuel", className: "is-manual-reserved" };
  }
  if (payment.includes("abonelik") || payment.includes("paket")) {
    return { label: "Abonelik", className: "is-subscription-reserved" };
  }
  if (payment.includes("kurumsal")) {
    return { label: "Kurumsal", className: "is-corporate" };
  }

  return { label: "Rezervasyon", className: "is-reserved" };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDayLabel(date) {
  return `${WEEKDAY_SHORT[date.getDay()]} ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
}

function formatWeekRange(startDate, endDate) {
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const startMonth = MONTH_SHORT[startDate.getMonth()];
  const endMonth = MONTH_SHORT[endDate.getMonth()];
  return sameMonth
    ? `${startDate.getDate()} - ${endDate.getDate()} ${endMonth}`
    : `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth}`;
}

function buildDisplayWeek(days) {
  const weekStart = addDays(BASE_WEEK_START, venueState.currentWeekOffset * 7);
  const weekEnd = addDays(weekStart, days.length - 1);

  if (weekRange) {
    weekRange.textContent = formatWeekRange(weekStart, weekEnd);
  }

  return days.map((day, index) => ({
    ...day,
    label: formatDayLabel(addDays(weekStart, index)),
    dateObj: addDays(weekStart, index),
  }));
}

function formatSlotDateTime(day, time) {
  const endHour = (Number.parseInt(time.slice(0, 2), 10) + 1) % 24;
  return `${day.dateObj.getDate().toString().padStart(2, "0")}.${(day.dateObj.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${day.dateObj.getFullYear()} ${time} - ${String(endHour).padStart(2, "0")}:00`;
}

function buildManualMeta(entry) {
  if (!entry) return "İşletme tarafından girilir";
  if (entry.isSubscription && entry.phone) return `Abone • ${entry.phone}`;
  if (entry.isSubscription) return "Abonelik müşterisi";
  if (entry.phone) return entry.phone;
  if (entry.total) return `Toplam ${entry.total} TL`;
  return "İşletme tarafından girilir";
}

function buildSlotBadge(label, className) {
  return `<em class="slot-channel-badge ${className}">${label}</em>`;
}

function openSalesModal(day, time, slotKey) {
  const existingEntry = venueState.manualEntries[slotKey];
  venueState.salesDraftSlotKey = slotKey;
  salesTime.value = formatSlotDateTime(day, time);
  salesDeposit.value = existingEntry?.deposit || "50";
  salesPhone.value = existingEntry?.phone || "";
  salesPayout.value = existingEntry?.payout || "100";
  salesName.value = existingEntry?.name || "";
  salesTotal.value = existingEntry?.total || "150";
  salesNotes.value = existingEntry?.notes || "";
  salesSubscription.checked = Boolean(existingEntry?.isSubscription);
  salesModal.classList.remove("hidden");
}

function closeSalesModal() {
  venueState.salesDraftSlotKey = "";
  salesModal.classList.add("hidden");
}

function renderWeeklySchedule(board, days) {
  const displayDays = buildDisplayWeek(days);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const times = buildTimeSlots();
  const rows = times
    .map((time) => {
      const cells = displayDays
        .map((day, dayIndex) => {
          const dayKey = `${day.dateObj.getFullYear()}-${day.dateObj.getMonth()}-${day.dateObj.getDate()}`;
          const isToday = dayKey === todayKey;
          const slot = day.slots.find((item) => item.time === time);
          const slotKey = `${dayIndex}-${time}`;
          const selectedClass = venueState.selectedSlotKey === slotKey ? " is-selected" : "";
          const todayClass = isToday ? " is-today-column" : "";
          const mode = venueState.slotModes[slotKey] || getDefaultMode(slot);
          const manualEntry = venueState.manualEntries[slotKey];

          let modeLabel = "Açık";
          let modeMeta = "";
          let modeClass = "is-hissingo";
          let actionLabel = "rezerv.app satışına aç";
          let badgeMarkup = buildSlotBadge("R", "is-hissingo");

          if (mode === "closed") {
            modeLabel = "Kapalı";
            modeMeta = "";
            modeClass = "is-closed";
            actionLabel = "Satışa kapalı tut";
            badgeMarkup = buildSlotBadge("K", "is-closed");
          } else if (mode === "manual") {
            modeLabel = manualEntry?.name || "Manuel giriş";
            modeMeta = buildManualMeta(manualEntry);
            modeClass = "is-manual";
            actionLabel = manualEntry ? "Manuel kaydı düzenle" : "Manuel giriş yap";
            badgeMarkup = buildSlotBadge(manualEntry?.isSubscription ? "Abone" : "Manuel", "is-manual");
          } else if (mode === "reserved") {
            const reservedSource = getReservedSource(slot);
            modeLabel = slot?.title || "Rezervasyon";
            modeMeta = slot?.field || "Dolu";
            modeClass = `is-reserved ${reservedSource.className}`;
            actionLabel = "Rezervasyon dolu";
            badgeMarkup = buildSlotBadge(reservedSource.label, reservedSource.className);
          }

          const compactStatusClass = modeClass
            .split(" ")
            .map((className) => `slot-${className.replace(/^is-/, "")}`)
            .join(" ");
          const slotMainMarkup =
            mode === "rezerv"
              ? `<span class="open-slot-dot" aria-label="Rezervasyona açık">+</span>`
              : `<strong>${modeLabel}</strong>${badgeMarkup}${modeMeta ? `<span>${modeMeta}</span>` : ""}`;

          return `
            <td class="schedule-slot-cell ${compactStatusClass}${selectedClass}${todayClass}" data-slot-key="${slotKey}" data-day-index="${dayIndex}" data-time="${time}">
              <div class="schedule-choice ${modeClass}">
                ${slotMainMarkup}
                ${
                  venueState.selectedSlotKey === slotKey
                    ? `
                      <div class="slot-popover">
                        <button
                          class="slot-popover-bubble ${mode === "manual" ? "is-actionable" : ""}"
                          type="button"
                          ${mode === "manual" ? `data-edit-manual="true" data-slot-key="${slotKey}" data-time="${time}" data-day-index="${dayIndex}"` : "disabled"}
                        >${actionLabel}</button>
                        <div class="slot-options">
                          <button class="slot-option slot-option-hissingo ${mode === "rezerv" ? "is-active" : ""}" type="button" data-mode="rezerv" data-slot-key="${slotKey}" aria-label="rezerv.app">R</button>
                          <button class="slot-option slot-option-closed ${mode === "closed" ? "is-active" : ""}" type="button" data-mode="closed" data-slot-key="${slotKey}" aria-label="Kapalı">K</button>
                          <button class="slot-option slot-option-manual ${mode === "manual" ? "is-active" : ""}" type="button" data-mode="manual" data-slot-key="${slotKey}" data-time="${time}" data-day-index="${dayIndex}" aria-label="Manuel">M</button>
                        </div>
                      </div>
                    `
                    : ""
                }
              </div>
            </td>
          `;
        })
        .join("");

      return `
        <tr>
          <td class="time-cell">${time}</td>
          ${cells}
        </tr>
      `;
    })
    .join("");

  board.innerHTML = `
    <table class="schedule-table">
      <thead>
        <tr>
          <th>Saat</th>
          ${displayDays
            .map((day) => {
              const dayKey = `${day.dateObj.getFullYear()}-${day.dateObj.getMonth()}-${day.dateObj.getDate()}`;
              const isToday = dayKey === todayKey;
              return `<th class="${isToday ? "is-today-head" : ""}">${day.label}</th>`;
            })
            .join("")}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderQuickActions(items) {
  quickActions.innerHTML = items
    .map(
      (item) => `
        <div class="quick-action">
          <strong>${item}</strong>
          <span>Aç</span>
        </div>
      `,
    )
    .join("");
}

function renderOverview(items) {
  const notes = [
    {
      title: "En yoğun pencere",
      body: "18:00–22:00 arasında doluluk yüzde 92 seviyesine çıkıyor.",
      meta: "Bu akşam",
    },
    {
      title: "Boş kalan alan",
      body: "Perşembe 20:00 sonrası için 3 slot satışa açılabilir.",
      meta: "3 slot",
    },
    {
      title: "Abonelik yenileme",
      body: "Bu hafta biten 6 aktif abonelik için teklif hazırlanmalı.",
      meta: "6 müşteri",
    },
    {
      title: "Tahsilat özeti",
      body: "Bugün online tahsilat ağırlıklı, EFT takibi gereken 2 işlem var.",
      meta: "2 işlem",
    },
  ];

  overviewList.innerHTML = notes
    .map(
      (item) => `
        <article class="overview-item">
          <div>
            <strong>${item.title}</strong>
            <p>${item.body}</p>
          </div>
          <span>${item.meta}</span>
        </article>
      `,
    )
    .join("");
}

function statusPill(status) {
  const isActive = status === "Aktif";
  return `<span class="status-pill ${isActive ? "is-active" : "is-passive"}">${status}</span>`;
}

function renderSubscriptions(items) {
  subscriptionsBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>#${item.id}</td>
          <td>${item.customer}</td>
          <td>${item.field}</td>
          <td>${item.day}</td>
          <td>${item.startDate}</td>
          <td>${item.time}</td>
          <td>${statusPill(item.status)}</td>
          <td>${item.expiry}</td>
        </tr>
      `,
    )
    .join("");
}

function renderTransactions(items) {
  transactionsBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>#${item.id}</td>
          <td>${item.type}</td>
          <td>${statusPill(item.status)}</td>
          <td>${item.venue}</td>
          <td>${item.field}</td>
          <td><span class="channel-pill">${item.channel}</span></td>
          <td>${item.customer}</td>
          <td>${item.businessType}</td>
          <td>${item.amount}</td>
          <td>${item.deposit}</td>
          <td>${item.commission}</td>
          <td>${item.payout}</td>
          <td>${item.date}</td>
          <td>${item.time}</td>
          <td>${item.createdAt}</td>
          <td>${item.monthlyPackageActive ? "Evet" : "Hayır"}</td>
          <td>${item.packageName || "-"}</td>
          <td>${item.withdrawalCount ?? 0}</td>
        </tr>
      `,
    )
    .join("");
}

function renderReportSummary(items) {
  reportSummaryGrid.innerHTML = items
    .map(
      (item) => `
        <article class="report-summary-card">
          <small>${item.label}</small>
          <strong>${item.value}</strong>
          <span>${item.meta}</span>
        </article>
      `,
    )
    .join("");
}

function renderSettingsTabs(items) {
  settingsTabs.innerHTML = items
    .map(
      (item, index) => `
        <button class="settings-tab ${index === 0 ? "is-active" : ""}" type="button">${item}</button>
      `,
    )
    .join("");
}

function renderSettingsOnboarding(settings) {
  const questionsMarkup = settings.questions
    .map(
      (item, index) => `
        <div class="settings-question">
          <strong>${item.label}</strong>
          <div class="settings-radio-row">
            <label class="settings-radio">
              <input type="radio" name="settings-q-${index}" ${item.value ? "checked" : ""} />
              <span>Evet</span>
            </label>
            <label class="settings-radio">
              <input type="radio" name="settings-q-${index}" ${!item.value ? "checked" : ""} />
              <span>Hayır</span>
            </label>
          </div>
        </div>
      `,
    )
    .join("");

  const selectsMarkup = settings.selects
    .map(
      (item) => `
        <label class="settings-select-field">
          <span>${item.label}${item.info ? ' <em class="settings-info">i</em>' : ""}</span>
          <select>
            ${item.options
              .map((option) => `<option ${option === item.value ? "selected" : ""}>${option}</option>`)
              .join("")}
          </select>
        </label>
      `,
    )
    .join("");

  settingsOnboardingForm.innerHTML = `
    <label class="settings-input-field">
      <span>İşletme Adı</span>
      <input type="text" value="${settings.businessName}" />
    </label>

    ${questionsMarkup}

    ${selectsMarkup}

    <div class="settings-location-block">
      <strong>İşletme Konumu</strong>
      <div class="settings-location-status">${settings.locationStatus}</div>
      <div class="settings-map-placeholder">
        <span>Harita entegrasyonu burada konum akışıyla bağlanacak</span>
      </div>
    </div>
  `;
}

function renderProfile(profile) {
  profileCard.innerHTML = `
    <div class="profile-avatar-shell">
      <div class="profile-avatar-icon">
        <div class="profile-avatar-head"></div>
        <div class="profile-avatar-body"></div>
      </div>
    </div>
    <button class="ghost-button profile-action" type="button">Parola Değiştir</button>
    <button class="profile-danger-button" type="button">Hesabımı Sil</button>
  `;

  profileFormGrid.innerHTML = `
    <label class="profile-field">
      <span>Adınız ve Soyadınız</span>
      <input type="text" value="${profile.fullName}" />
    </label>
    <label class="profile-field">
      <span>Cep Telefonu Numaranız</span>
      <input type="text" value="${profile.phone}" />
    </label>
    <label class="profile-field">
      <span>Eposta Adresiniz</span>
      <input type="email" value="${profile.email}" />
    </label>
    <label class="profile-field">
      <span>TC Kimlik Numaranız</span>
      <input type="text" value="${profile.identityNumber}" />
    </label>
    <label class="profile-field profile-field-wide">
      <span>Doğum Tarihiniz</span>
      <input type="text" value="${profile.birthDate}" />
    </label>
  `;
}

function renderReviews(items) {
  if (!items.length) {
    reviewsShell.innerHTML = `
      <div class="reviews-empty-state">
        <h3>Değerlendirme bulunamadı</h3>
        <p>Tesisiniz yayınlandıktan ve rezervasyonlar tamamlandıktan sonra kullanıcı yorumları burada listelenecek.</p>
      </div>
    `;
    return;
  }

  reviewsShell.innerHTML = items
    .map(
      (item) => `
        <article class="review-card">
          <div class="review-card-head">
            <strong>${item.author}</strong>
            <span>${item.rating}/5</span>
          </div>
          <p>${item.comment}</p>
          <small>${item.date}</small>
        </article>
      `,
    )
    .join("");
}

function renderBillingAddresses(items) {
  if (!items.length) {
    billingBody.innerHTML = `
      <tr>
        <td colspan="10" class="billing-empty-cell">Henüz kayıtlı fatura adresi bulunmuyor</td>
      </tr>
    `;
    return;
  }

  billingBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td><button class="ghost-button billing-edit-button" type="button">Düzenle</button></td>
          <td>${item.label}</td>
          <td>${item.type}</td>
          <td>${item.city}</td>
          <td>${item.name}</td>
          <td>${item.district}</td>
          <td>${item.identityNumber || "-"}</td>
          <td>${item.taxOffice || "-"}</td>
          <td>${item.taxNumber || "-"}</td>
          <td>${item.address}</td>
        </tr>
      `,
    )
    .join("");
}

function renderDropdown(container, items) {
  const viewMap = {
    "Profil Ayarları": "profile",
    Değerlendirmeler: "reviews",
    "Fatura Adresleri": "billing",
    Takvim: "calendar",
    "Haftalık Abonelik Satış": "subscriptions",
    İşlemler: "transactions",
    Raporlama: "transactions",
    Ayarlar: "settings",
  };

  container.innerHTML = items
    .map((item) => {
      if (item === "Çıkış Yap") {
        return `<button class="dropdown-item dropdown-item-danger" type="button" data-action="logout">${item}</button>`;
      }

      const target = viewMap[item] || "overview";
      return `<button class="dropdown-item" type="button" data-view-target="${target}">${item}</button>`;
    })
    .join("");
}

function setView(viewId) {
  navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewId));
  sections.forEach((section) => section.classList.toggle("hidden", section.id !== `${viewId}-view`));
}

function setManagerMenuOpen(isOpen) {
  venueState.isManagerMenuOpen = isOpen;
  managerMenu?.classList.toggle("is-open", isOpen);
  managerMenuTrigger?.setAttribute("aria-expanded", isOpen ? "true" : "false");
  managerMenuItems?.classList.toggle("is-visible", isOpen);
}

async function loadVenueDashboard() {
  await requireVenueAccess();
  const venueId = new URLSearchParams(window.location.search).get("venue") || "zincirlikuyu-arena";
  const response = await fetch(`/api/venue/bootstrap?venue=${encodeURIComponent(venueId)}`);
  const payload = await response.json();
  venueState.dashboard = payload;

  venueTitle.textContent = `${payload.venue.name} yönetim paneli`;
  venueAvatar.textContent = payload.venue.avatarLabel;
  venueName.textContent = payload.venue.name;
  venueBranch.textContent = payload.venue.branch;

  renderDropdown(managerMenuItems, payload.managerMenu?.length ? payload.managerMenu : DEFAULT_MANAGER_MENU);
  renderStats(payload.stats);
  renderOverview(payload.stats);
  renderQuickActions(payload.quickActions);
  renderWeeklySchedule(calendarBoardSecondary, payload.weekDays);
  renderSubscriptions(payload.subscriptions);
  renderReportSummary(payload.reportSummary || []);
  renderTransactions(payload.transactions || []);
  if (payload.settings?.tabs) {
    renderSettingsTabs(payload.settings.tabs);
  }
  if (payload.settings) {
    renderSettingsOnboarding(payload.settings);
  }
  if (payload.profile) {
    renderProfile(payload.profile);
  }
  renderReviews(payload.reviews || []);
  renderBillingAddresses(payload.billingAddresses || []);
}

function bindVenueInteractions() {
  topbarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.viewTarget;
      if (target) {
        setView(target);
      }
    });
  });

  managerMenuTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    setManagerMenuOpen(!venueState.isManagerMenuOpen);
  });

  managerMenuItems?.addEventListener("click", (event) => {
    const button = event.target.closest(".dropdown-item");
    if (!button) return;

    if (button.dataset.action === "logout") {
      localStorage.removeItem("rezerv_token");
      setManagerMenuOpen(false);
      window.location.href = "/index.html";
      return;
    }

    const target = button.dataset.viewTarget;
    if (target) {
      setView(target);
    }

    setManagerMenuOpen(false);
  });

  calendarBoardSecondary?.addEventListener("click", (event) => {
    if (!venueState.dashboard) return;

    const bubbleAction = event.target.closest("[data-edit-manual]");
    if (bubbleAction) {
      event.stopPropagation();
      const day = buildDisplayWeek(venueState.dashboard.weekDays)[Number(bubbleAction.dataset.dayIndex)];
      openSalesModal(day, bubbleAction.dataset.time, bubbleAction.dataset.slotKey);
      return;
    }

    const option = event.target.closest(".slot-option");
    if (option) {
      event.stopPropagation();
      const nextMode = option.dataset.mode;
      if (nextMode === "manual") {
        const day = buildDisplayWeek(venueState.dashboard.weekDays)[Number(option.dataset.dayIndex)];
        openSalesModal(day, option.dataset.time, option.dataset.slotKey);
      }
      venueState.slotModes[option.dataset.slotKey] =
        nextMode === "rezerv" ? "rezerv" : nextMode;
      renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
      return;
    }

    const cell = event.target.closest(".schedule-slot-cell");
    if (!cell) return;

    venueState.selectedSlotKey =
      venueState.selectedSlotKey === cell.dataset.slotKey ? "" : cell.dataset.slotKey;
    renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#manager-menu") && venueState.isManagerMenuOpen) {
      setManagerMenuOpen(false);
    }

    if (!event.target.closest(".schedule-slot-cell") && venueState.dashboard) {
      if (venueState.selectedSlotKey) {
        venueState.selectedSlotKey = "";
        renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
      }
    }
  });

  window.addEventListener("resize", () => {
    if (venueState.isManagerMenuOpen) {
      setManagerMenuOpen(true);
    }
  });

  window.addEventListener("scroll", () => {
    if (venueState.isManagerMenuOpen) {
      setManagerMenuOpen(true);
    }
  });

  weekPrevButton?.addEventListener("click", () => {
    if (!venueState.dashboard) return;
    venueState.currentWeekOffset -= 1;
    venueState.selectedSlotKey = "";
    renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
  });

  weekNextButton?.addEventListener("click", () => {
    if (!venueState.dashboard) return;
    venueState.currentWeekOffset += 1;
    venueState.selectedSlotKey = "";
    renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
  });

  [salesModalClose, salesCancel].forEach((element) => {
    element?.addEventListener("click", closeSalesModal);
  });

  salesSave?.addEventListener("click", () => {
    if (venueState.salesDraftSlotKey) {
      venueState.manualEntries[venueState.salesDraftSlotKey] = {
        name: salesName.value.trim(),
        phone: salesPhone.value.trim(),
        deposit: salesDeposit.value.trim(),
        payout: salesPayout.value.trim(),
        total: salesTotal.value.trim(),
        notes: salesNotes.value.trim(),
        isSubscription: salesSubscription.checked,
      };
      venueState.slotModes[venueState.salesDraftSlotKey] = "manual";
    }
    if (venueState.dashboard) {
      renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
    }
    closeSalesModal();
  });
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    setView(item.dataset.view);
  });
});

bindVenueInteractions();

loadVenueDashboard().catch((error) => {
  console.error(error);
  if (!venueState.dashboard) {
    venueTitle.textContent = "Panel yüklenemedi";
  }
});
