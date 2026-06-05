const summaryGrid = document.querySelector("#summary-grid");
const alertList = document.querySelector("#alert-list");
const venueList = document.querySelector("#venue-list");

async function loadAdmin() {
  const token = localStorage.getItem("zuvu_token") || "";
  const response = await fetch("/api/admin/bootstrap", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Admin verisi yüklenemedi.");
  const data = await response.json();

  summaryGrid.innerHTML = data.summary
    .map(
      (item) => `
        <article class="summary-card">
          <small>${item.label}</small>
          <strong>${item.value}</strong>
          <span>${item.meta}</span>
        </article>
      `,
    )
    .join("");

  alertList.innerHTML = data.alerts
    .map(
      (item) => `
        <article class="item">
          <strong>${item.title}</strong>
          <span>${item.detail}</span>
        </article>
      `,
    )
    .join("");

  venueList.innerHTML = data.venues
    .map(
      (item) => `
        <article class="item">
          <strong>${item.name}</strong>
          <span>${item.branch} · ${item.category} · ${item.occupancy} doluluk · ${item.weeklyRevenue}</span>
        </article>
      `,
    )
    .join("");
}

loadAdmin().catch((error) => {
  summaryGrid.innerHTML = `<article class="summary-card"><strong>Hata</strong><span>${error.message}</span></article>`;
});
