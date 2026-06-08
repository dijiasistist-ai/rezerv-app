const authWall = document.querySelector("#admin-auth-wall");
const adminLoginForm = document.querySelector("#admin-login-form");
const adminLoginEmail = document.querySelector("#admin-login-email");
const adminLoginPassword = document.querySelector("#admin-login-password");
const adminLoginFeedback = document.querySelector("#admin-login-feedback");
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
const accessRuleForm = document.querySelector("#access-rule-form");
const accessLabel = document.querySelector("#access-label");
const accessEmail = document.querySelector("#access-email");
const accessIp = document.querySelector("#access-ip");
const accessMobileToken = document.querySelector("#access-mobile-token");
const accessNote = document.querySelector("#access-note");
const accessActive = document.querySelector("#access-active");
const accessFeedback = document.querySelector("#access-feedback");
const accessList = document.querySelector("#access-list");
const accessCurrentIp = document.querySelector("#access-current-ip");
const adminLogout = document.querySelector("#admin-logout");

let token = localStorage.getItem("tyee_token") || "";

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
  if (!response.ok) {
    const error = new Error(payload.error || "İstek tamamlanamadı.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function showAuthWall(message = "Bu alan yalnızca admin kullanıcısı ile açılır.") {
  authWall.classList.remove("hidden");
  authWall.querySelector("p").textContent = message;
  if (adminLoginFeedback) {
    adminLoginFeedback.textContent = "";
    adminLoginFeedback.classList.remove("is-success");
  }
  window.setTimeout(() => adminLoginEmail?.focus(), 40);
}

function hideAuthWall() {
  authWall.classList.add("hidden");
  if (adminLoginPassword) adminLoginPassword.value = "";
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

function getRoleBadge(item) {
  if (item.resultType === "business") return { className: "business", label: "İşletme kaydı" };
  if (item.isAdmin || item.role === "admin") return { className: "admin", label: "Admin" };
  if (item.canManageVenue || item.role === "venue") return { className: "venue", label: "İşletme hesabı" };
  return { className: "customer", label: "Bireysel hesap" };
}

function renderResults(items = []) {
  const uniqueItems = [];
  const seen = new Set();

  items.forEach((item) => {
    const key =
      item.resultType === "business"
        ? `business:${item.id || item.name}`
        : `user:${(item.email || "").toLocaleLowerCase("tr-TR") || item.id || item.name}`;

    if (seen.has(key)) return;
    seen.add(key);
    uniqueItems.push(item);
  });

  state.results = uniqueItems;
  directoryCount.textContent = `${uniqueItems.length} kayıt`;
  directoryResults.innerHTML = uniqueItems.length
    ? uniqueItems
        .map((item, index) => {
          const badge = getRoleBadge(item);
          return `
            <button class="result-item result-item-${badge.className}${state.selected?.id === item.id ? " is-active" : ""}" type="button" data-result-index="${index}">
              <span class="role-badge role-badge-${badge.className}">${escapeHtml(badge.label)}</span>
              <strong>${escapeHtml(resultTitle(item))}</strong>
              <small>${escapeHtml(resultMeta(item))}</small>
            </button>
          `;
        })
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

function renderRoleEditor(item) {
  if (item.resultType === "business") return "";
  if (item.isAdmin) {
    return `
      <div class="role-editor is-disabled">
        <strong>Rol değiştir</strong>
        <span>Admin hesapları bu hızlı kontrolden değiştirilemez.</span>
      </div>
    `;
  }

  return `
    <form class="role-editor" id="role-editor-form" data-user-id="${escapeHtml(item.id)}">
      <label>
        Rol değiştir
        <select id="role-editor-select">
          <option value="customer"${item.role === "customer" ? " selected" : ""}>Bireysel müşteri</option>
          <option value="venue"${item.role === "venue" ? " selected" : ""}>İşletme yetkilisi</option>
        </select>
      </label>
      <button type="submit">Rolü kaydet</button>
      <p class="form-feedback" id="role-editor-feedback"></p>
    </form>
  `;
}

function renderDangerActions(item) {
  if (item.resultType === "business") {
    return `
      <div class="danger-zone">
        <strong>Tehlikeli işlem</strong>
        <span>Bu işletme kaydı platform dizininden kaldırılır. Bağlı kullanıcı hesabı ayrıca silinir.</span>
        <button class="danger-button" type="button" data-delete-business-id="${escapeHtml(item.id)}">İşletmeyi sil</button>
        <p class="form-feedback" id="delete-feedback"></p>
      </div>
    `;
  }

  if (item.isAdmin) return "";

  return `
    <div class="danger-zone">
      <strong>Tehlikeli işlem</strong>
      <span>Kullanıcı hesabı ve aktif oturumları silinir. Bu işlem geri alınamaz.</span>
      <button class="danger-button" type="button" data-delete-user-id="${escapeHtml(item.id)}">Kullanıcıyı sil</button>
      <p class="form-feedback" id="delete-feedback"></p>
    </div>
  `;
}

function renderDetail(item) {
  state.selected = item;
  if (!item) {
    detailBody.innerHTML = `<span class="empty-copy">Arama sonucundan bir kayıt seç.</span>`;
    return;
  }

  if (item.email) resetEmail.value = item.email;
  const badge = getRoleBadge(item);

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
      <span class="role-badge role-badge-${badge.className}">${escapeHtml(badge.label)}</span>
      <h3>${escapeHtml(resultTitle(item))}</h3>
    </div>
    ${detailRows(rows)}
    ${renderRoleEditor(item)}
    ${renderDangerActions(item)}
  `;
  renderResults(state.results);
}

function renderAccessRules(access = {}) {
  if (!accessList || !accessCurrentIp) return;
  accessCurrentIp.textContent = access.currentIp ? `Bu oturum IP: ${access.currentIp}` : "IP okunamadı";
  const rules = access.rules || [];
  accessList.innerHTML = rules.length
    ? rules
        .map(
          (rule) => `
            <article class="access-item${rule.isActive ? "" : " is-passive"}">
              <div>
                <strong>${escapeHtml(rule.label)}</strong>
                <span>${escapeHtml(rule.email || "E-posta sınırı yok")}</span>
              </div>
              <div>
                <small>IP</small>
                <span>${escapeHtml(rule.ipAddress || "-")}</span>
              </div>
              <div>
                <small>Mobil</small>
                <span>${escapeHtml(rule.mobileToken || "-")}</span>
              </div>
              <div>
                <small>Kaynak</small>
                <span>${escapeHtml(rule.source === "env" ? "Render env" : "Panel")}</span>
              </div>
              <p>${escapeHtml(rule.note || (rule.isActive ? "Aktif" : "Pasif"))}</p>
              ${
                rule.source === "env"
                  ? `<span class="access-lock">Env kaydı</span>`
                  : `<button class="danger-button is-compact" type="button" data-delete-access-id="${escapeHtml(rule.id)}">Sil</button>`
              }
            </article>
          `,
        )
        .join("")
    : `<div class="empty-copy">Henüz admin erişim yetkilisi yok. Canlı ortamda en az bir IP veya mobil anahtar tanımlanmalı.</div>`;
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
        <span>tyee profesyonel rapor</span>
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
  if (!token) {
    showAuthWall();
    return;
  }

  const data = await apiRequest("/api/admin/bootstrap");
  state.data = data;
  renderSummary(data.summary || []);
  renderReportOptions(data.reportDefaults || {});
  renderAccessRules(data.access || {});
  renderResults([...(data.businesses || []).map((item) => ({ ...item, resultType: "business" })), ...(data.customers || []).map((item) => ({ ...item, resultType: "customer" }))]);
  if (state.results.length) renderDetail(state.results[0]);
  await loadReport();
}

directoryResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-result-index]");
  if (!button) return;
  renderDetail(state.results[Number(button.dataset.resultIndex)]);
});

detailBody.addEventListener("submit", async (event) => {
  const form = event.target.closest("#role-editor-form");
  if (!form) return;

  event.preventDefault();
  const feedback = form.querySelector("#role-editor-feedback");
  feedback.textContent = "";
  feedback.classList.remove("is-success");

  try {
    const payload = await apiRequest(`/api/admin/users/${encodeURIComponent(form.dataset.userId)}/role`, {
      method: "PATCH",
      body: JSON.stringify({
        role: form.querySelector("#role-editor-select").value,
      }),
    });
    const currentResultType = payload.user.role === "customer" ? "customer" : "user";
    const nextUser = { ...payload.user, resultType: currentResultType };
    state.results = state.results.map((item) => (item.id === nextUser.id ? nextUser : item));
    feedback.textContent = payload.message;
    feedback.classList.add("is-success");
    renderDetail(nextUser);
    const nextFeedback = detailBody.querySelector("#role-editor-feedback");
    if (nextFeedback) {
      nextFeedback.textContent = payload.message;
      nextFeedback.classList.add("is-success");
    }
  } catch (error) {
    feedback.textContent = error.message;
  }
});

detailBody.addEventListener("click", async (event) => {
  const userButton = event.target.closest("[data-delete-user-id]");
  const businessButton = event.target.closest("[data-delete-business-id]");
  if (!userButton && !businessButton) return;

  const feedback = detailBody.querySelector("#delete-feedback");
  if (feedback) {
    feedback.textContent = "";
    feedback.classList.remove("is-success");
  }

  const isBusiness = Boolean(businessButton);
  const id = isBusiness ? businessButton.dataset.deleteBusinessId : userButton.dataset.deleteUserId;
  const label = resultTitle(state.selected || {});
  const confirmed = window.confirm(`${label} kaydı silinsin mi? Bu işlem geri alınamaz.`);
  if (!confirmed) return;

  try {
    const payload = await apiRequest(
      isBusiness
        ? `/api/admin/businesses/${encodeURIComponent(id)}`
        : `/api/admin/users/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (feedback) {
      feedback.textContent = payload.message;
      feedback.classList.add("is-success");
    }
    await loadAdmin();
  } catch (error) {
    if (feedback) feedback.textContent = error.message;
  }
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

if (accessRuleForm) {
  accessRuleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    accessFeedback.textContent = "";
    accessFeedback.classList.remove("is-success");

    try {
      const payload = await apiRequest("/api/admin/access-rules", {
        method: "POST",
        body: JSON.stringify({
          label: accessLabel.value.trim(),
          email: accessEmail.value.trim(),
          ipAddress: accessIp.value.trim(),
          mobileToken: accessMobileToken.value.trim(),
          note: accessNote.value.trim(),
          isActive: accessActive.checked,
        }),
      });
      accessFeedback.textContent = payload.message;
      accessFeedback.classList.add("is-success");
      accessRuleForm.reset();
      accessActive.checked = true;
      renderAccessRules(payload.access || {});
    } catch (error) {
      accessFeedback.textContent = error.message;
    }
  });
}

if (accessList) {
  accessList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-access-id]");
    if (!button) return;
    const confirmed = window.confirm("Bu admin erişim yetkilisi silinsin mi?");
    if (!confirmed) return;

    try {
      const payload = await apiRequest(`/api/admin/access-rules/${encodeURIComponent(button.dataset.deleteAccessId)}`, {
        method: "DELETE",
      });
      renderAccessRules(payload.access || {});
    } catch (error) {
      accessFeedback.textContent = error.message;
      accessFeedback.classList.remove("is-success");
    }
  });
}

reportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadReport();
});

printReport.addEventListener("click", () => window.print());
adminRefresh.addEventListener("click", () => window.location.reload());

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    adminLoginFeedback.textContent = "";
    adminLoginFeedback.classList.remove("is-success");

    try {
      const payload = await apiRequest("/api/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({
          email: adminLoginEmail.value.trim(),
          password: adminLoginPassword.value,
        }),
      });
      token = payload.token;
      localStorage.setItem("tyee_token", token);
      hideAuthWall();
      await loadAdmin();
    } catch (error) {
      adminLoginFeedback.textContent = error.message;
      adminLoginFeedback.classList.remove("is-success");
    }
  });
}

if (adminLogout) {
  adminLogout.addEventListener("click", () => {
    token = "";
    localStorage.removeItem("tyee_token");
    showAuthWall("Admin oturumu kapatıldı.");
  });
}

loadAdmin().catch((error) => {
  if (error.status === 401 || error.status === 403) {
    localStorage.removeItem("tyee_token");
    token = "";
  }
  showAuthWall(error.message);
});
