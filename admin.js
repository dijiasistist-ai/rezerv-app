const authWall = document.querySelector("#admin-auth-wall");
const summaryGrid = document.querySelector("#summary-grid");
const directoryCount = document.querySelector("#directory-count");
const directoryResults = document.querySelector("#directory-results");
const detailBody = document.querySelector("#detail-body");
const searchForm = document.querySelector("#admin-search-form");
const searchQuery = document.querySelector("#admin-search-query");
const searchType = document.querySelector("#admin-search-type");
const resetForm = document.querySelector("#password-reset-form");
const resetEmail = document.querySelector("#reset-email");
const resetPassword = document.querySelector("#reset-password");
const resetFeedback = document.querySelector("#reset-feedback");
const notificationForm = document.querySelector("#notification-form");
const notificationTarget = document.querySelector("#notification-target");
const notificationChannel = document.querySelector("#notification-channel");
const notificationSubject = document.querySelector("#notification-subject");
const notificationMessage = document.querySelector("#notification-message");
const notificationFeedback = document.querySelector("#notification-feedback");
const reportForm = document.querySelector("#report-form");
const reportVenue = document.querySelector("#report-venue");
const reportPeriod = document.querySelector("#report-period");
const reportDocument = document.querySelector("#report-document");
const printReport = document.querySelector("#print-report");
const adminRefresh = document.querySelector("#admin-refresh");

const token = localStorage.getItem("zuvu_token") || "";

const state = {
  data: null,
  selected: null,
  results: [],
};

function isLocalDemoHost() {
  return ["127.0.0.1", "localhost"].includes(window.location.hostname);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "İstek tamamlanamadı.");
  return payload;
}

function showAuthWall(message = "Bu alan yalnızca admin kullanıcısı ile açılır.") {
  authWall.classList.remove("hidden");
  authWall.querySelector("p").textContent = message;
}

function renderSummary(items = []) {
  summaryGrid.innerHTML = items
    .map(
      (item) => `
        <article class="summary-card">
          <small>${escapeHtml(item.label)}</small>
          <strong>${escapeHtml(item.value)}</strong>
          <span>${escapeHtml(item.meta)}</span>
        </article>
      `,
    )
    .join("");
}

function resultTitle(item) {
  if (item.resultType === "business") return item.name;
  return item.name || item.email;
}

function resultMeta(item) {
  if (item.resultType === "business") {
    return `${item.branch || "-"} · ${item.category || "-"} · ${item.status || "-"}`;
  }
  return `${item.email || "-"} · ${item.type || "-"}`;
}

function renderResults(items = []) {
  state.results = items;
  directoryCount.textContent = `${items.length} kayıt`;
  directoryResults.innerHTML = items.length
    ? items
        .map(
          (item, index) => `
            <button class="result-item${state.selected?.id === item.id ? " is-active" : ""}" type="button" data-result-index="${index}">
              <span>${item.resultType === "business" ? "İşletme" : item.resultType === "customer" ? "Müşteri" : "Kullanıcı"}</span>
              <strong>${escapeHtml(resultTitle(item))}</strong>
              <small>${escapeHtml(resultMeta(item))}</small>
            </button>
          `,
        )
        .join("")
    : `<div class="empty-copy">Kayıt bulunamadı.</div>`;
}

function detailRows(rows) {
  return rows
    .map(
      ([label, value]) => `
        <div class="detail-row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "-")}</strong>
        </div>
      `,
    )
    .join("");
}

function renderDetail(item) {
  state.selected = item;
  if (!item) {
    detailBody.innerHTML = `<span class="empty-copy">Arama sonucundan bir kayıt seç.</span>`;
    return;
  }

  if (item.email) resetEmail.value = item.email;

  const rows =
    item.resultType === "business"
      ? [
          ["Kurum", item.name],
          ["Lokasyon", item.branch],
          ["Kategori", item.category],
          ["Yetkili", item.contactName || item.manager],
          ["E-posta", item.contactEmail],
          ["Telefon", item.contactPhone],
          ["Doluluk", item.occupancy],
          ["Haftalık ciro", item.weeklyRevenue],
          ["Sağlık", item.health],
        ]
      : [
          ["Ad", item.name],
          ["E-posta", item.email],
          ["Telefon", item.phone],
          ["Tip", item.type],
          ["E-posta doğrulama", item.emailVerified ? "Doğrulandı" : "Bekliyor"],
          ["SMS doğrulama", item.phoneVerified ? "Doğrulandı" : "Bekliyor"],
          ["İşletme yetkisi", item.canManageVenue ? "Var" : "Yok"],
          ["Admin", item.isAdmin ? "Evet" : "Hayır"],
        ];

  detailBody.innerHTML = `
    <div class="detail-title">
      <span>${item.resultType === "business" ? "İşletme kaydı" : "Kullanıcı kaydı"}</span>
      <h3>${escapeHtml(resultTitle(item))}</h3>
    </div>
    ${detailRows(rows)}
  `;
  renderResults(state.results);
}

async function runSearch() {
  const params = new URLSearchParams({
    q: searchQuery.value.trim(),
    type: searchType.value,
  });
  const payload = await apiRequest(`/api/admin/search?${params.toString()}`);
  renderResults(payload.items || []);
  if (payload.items?.length) renderDetail(payload.items[0]);
}

function renderReportOptions(defaults = {}) {
  reportVenue.innerHTML = (defaults.venues || [])
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
    .join("");
  reportPeriod.innerHTML = (defaults.periods || [])
    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join("");
}

function renderMetricCards(items = []) {
  return items
    .map(
      (item) => `
        <article class="report-metric">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.note)}</small>
        </article>
      `,
    )
    .join("");
}

function renderReport(report) {
  reportDocument.innerHTML = `
    <header class="report-cover">
      <div>
        <span>zuvu profesyonel rapor</span>
        <h3>${escapeHtml(report.title)}</h3>
        <p>${escapeHtml(report.scope)} · ${escapeHtml(report.period)}</p>
      </div>
      <time>${new Date(report.generatedAt).toLocaleString("tr-TR")}</time>
    </header>

    <section class="report-section">
      <h4>Yönetici özeti</h4>
      <ul>
        ${(report.executiveSummary || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>

    <section class="report-section">
      <h4>Finansal görünüm</h4>
      <div class="report-metric-grid">${renderMetricCards(report.financial)}</div>
    </section>

    <section class="report-section">
      <h4>Operasyonel görünüm</h4>
      <div class="report-metric-grid">${renderMetricCards(report.operational)}</div>
    </section>

    <section class="report-section">
      <h4>Kurum bazlı satır özeti</h4>
      <div class="report-table">
        <div class="report-table-head">
          <span>Kurum</span>
          <span>Lokasyon</span>
          <span>Doluluk</span>
          <span>Finans</span>
          <span>Sağlık</span>
        </div>
        ${(report.rows || [])
          .map(
            (row) => `
              <div class="report-table-row">
                <span>${escapeHtml(row.kurum)}</span>
                <span>${escapeHtml(row.lokasyon)}</span>
                <span>${escapeHtml(row.doluluk)}</span>
                <span>${escapeHtml(row.haftalikCiro)}</span>
                <span>${escapeHtml(row.saglik)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="report-section">
      <h4>Aksiyon önerileri</h4>
      <ol>
        ${(report.recommendations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </section>
  `;
}

async function loadReport() {
  const params = new URLSearchParams({
    venueId: reportVenue.value || "all",
    period: reportPeriod.value || "Bu ay",
  });
  const report = await apiRequest(`/api/admin/reports?${params.toString()}`);
  renderReport(report);
}

async function loadAdmin() {
  if (!token && !isLocalDemoHost()) {
    showAuthWall();
    return;
  }

  const data = await apiRequest("/api/admin/bootstrap");
  state.data = data;
  renderSummary(data.summary || []);
  renderReportOptions(data.reportDefaults || {});
  renderResults([...(data.businesses || []).map((item) => ({ ...item, resultType: "business" })), ...(data.customers || []).map((item) => ({ ...item, resultType: "customer" }))]);
  if (state.results.length) renderDetail(state.results[0]);
  await loadReport();
}

directoryResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-result-index]");
  if (!button) return;
  renderDetail(state.results[Number(button.dataset.resultIndex)]);
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runSearch().catch((error) => {
    directoryResults.innerHTML = `<div class="empty-copy">${escapeHtml(error.message)}</div>`;
  });
});

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetFeedback.textContent = "";
  try {
    const payload = await apiRequest("/api/admin/password-reset", {
      method: "POST",
      body: JSON.stringify({
        email: resetEmail.value.trim(),
        password: resetPassword.value.trim(),
      }),
    });
    resetFeedback.textContent = `${payload.message} Geçici şifre: ${payload.temporaryPassword}`;
    resetFeedback.classList.add("is-success");
    resetPassword.value = "";
  } catch (error) {
    resetFeedback.textContent = error.message;
    resetFeedback.classList.remove("is-success");
  }
});

notificationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  notificationFeedback.textContent = "";
  try {
    const payload = await apiRequest("/api/admin/notifications", {
      method: "POST",
      body: JSON.stringify({
        targetType: notificationTarget.value,
        channel: notificationChannel.value,
        subject: notificationSubject.value.trim(),
        message: notificationMessage.value.trim(),
      }),
    });
    notificationFeedback.textContent = payload.message;
    notificationFeedback.classList.add("is-success");
    notificationMessage.value = "";
  } catch (error) {
    notificationFeedback.textContent = error.message;
    notificationFeedback.classList.remove("is-success");
  }
});

reportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadReport();
});

printReport.addEventListener("click", () => window.print());
adminRefresh.addEventListener("click", () => window.location.reload());

loadAdmin().catch((error) => {
  showAuthWall(error.message);
});
