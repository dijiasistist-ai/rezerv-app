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
const newSubscriptionButton = document.querySelector("#new-subscription-button");
const transactionsBody = document.querySelector("#transactions-body");
const sidebarSummaryTitle = document.querySelector(".sidebar-summary strong");
const sidebarSummaryMeta = document.querySelector(".sidebar-summary small");
const reportSummaryGrid = document.querySelector("#report-summary-grid");
const reportsSummaryGrid = document.querySelector("#reports-summary-grid");
const venueReportDocument = document.querySelector("#venue-report-document");
const venueReportPeriod = document.querySelector("#venue-report-period");
const refreshVenueReport = document.querySelector("#refresh-venue-report");
const settingsTabs = document.querySelector("#settings-tabs");
const settingsOnboardingForm = document.querySelector("#settings-onboarding-form");
const profileCard = document.querySelector("#profile-card");
const profileFormGrid = document.querySelector("#profile-form-grid");
const reviewsShell = document.querySelector("#reviews-shell");
const billingBody = document.querySelector("#billing-body");
const billingAddButton = document.querySelector(".billing-add-button");
const navGroups = document.querySelectorAll(".venue-nav-group");
const navGroupTriggers = document.querySelectorAll(".venue-nav-heading");
const navItems = document.querySelectorAll(".venue-nav-item");
const sections = document.querySelectorAll(".view-section");
const authWall = document.querySelector("#venue-auth-wall");

const venueState = {
  selectedSlotKey: "",
  slotModes: {},
  manualEntries: {},
  slotServices: {},
  currentWeekOffset: 0,
  activeSettingsTab: "İşletme Bilgileri",
  salesDraftSlotKey: "",
  venueId: "zincirlikuyu-arena",
  dashboard: null,
};

const DEFAULT_LOCATION_CENTER = { lat: 41.0082, lng: 28.9784 };
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
const DEFAULT_SETTINGS_TABS = [
  "İşletme Bilgileri",
  "Ödeme & Sözleşme",
];
const FACILITY_FEATURES = [
  { id: "shower", label: "Duş", icon: "🚿" },
  { id: "male-restroom", label: "Erkek tuvaleti", icon: "🚹" },
  { id: "female-restroom", label: "Kadın tuvaleti", icon: "🚺" },
  { id: "food", label: "Yemek", icon: "🍽️" },
  { id: "parking", label: "Otopark", icon: "🅿️" },
  { id: "card", label: "Kredi kartı", icon: "💳" },
  { id: "camera", label: "Kamera", icon: "🎥" },
  { id: "equipment", label: "Ekipman / ayakkabı", icon: "🎒" },
  { id: "goalkeeper", label: "Kaleci", icon: "🥅" },
  { id: "kids", label: "Çocuk oyun alanı", icon: "🧒" },
  { id: "cafe", label: "Cafe", icon: "☕" },
  { id: "prayer", label: "İbadet alanı", icon: "🌙" },
  { id: "wifi", label: "İnternet", icon: "📶" },
  { id: "locker", label: "Soyunma odası", icon: "🔐" },
];

const BUSINESS_CONTRACT_VERSION = "İşletme Sözleşmesi v1.0 - 08.06.2026";
const BUSINESS_CONTRACT_SECTIONS = [
  {
    title: "1. Taraflar, kapsam ve elektronik kabul",
    body: [
      "Bu sözleşme, tyee.app rezervasyon platformunu işleten tyee ile platformda işletme hesabı açan gerçek veya tüzel kişi işletme arasında kurulur. İşletme hesabını oluşturan, panelde sözleşmeyi onaylayan veya platform üzerinden hizmet yayınlayan kişi, işletmeyi temsile yetkili olduğunu kabul eder.",
      "Sözleşme; işletmenin platformda listelenmesi, rezervasyon alması, ödeme modeli seçmesi, müşteri verilerini işlemesi, bildirim alması, kampanya yürütmesi ve tyee tarafından sağlanan panel, takvim, rapor, bildirim, harita ve entegrasyon hizmetlerini kullanması için geçerlidir.",
      "Elektronik onay, tarih-saat, kullanıcı, IP, cihaz, sözleşme versiyonu ve işlem kaydı ile saklanabilir. İşletme, paneldeki onay kayıtlarının yazılı delil başlangıcı ve ticari kayıt niteliğinde kullanılabileceğini kabul eder.",
    ],
  },
  {
    title: "2. Tanımlar ve platformun rolü",
    body: [
      "tyee bir rezervasyon, keşif, işletme yönetimi ve ödeme akışı platformudur. tyee, işletmenin sunduğu hizmetin doğrudan sağlayıcısı, işvereni, acentesi, bayisi, garantörü veya temsilcisi değildir.",
      "İşletme; pet kuaför, spor tesisi, padel kortu, güzellik merkezi, masaj ve spa, direksiyon dersi, özel ders, fizyoterapi, yoga-pilates veya platformda açılabilecek diğer kategorilerde hizmet veren bağımsız hizmet sağlayıcıdır.",
      "Müşteri, platform üzerinden işletmeyi bulan, rezervasyon yapan, ödeme yapan veya işletme ile iletişime geçen gerçek ya da tüzel kişidir. İşletme, müşteriye karşı hizmetin ifası, kalite standardı, güvenliği, iptali, iadesi ve mevzuata uygunluğundan sorumludur.",
    ],
  },
  {
    title: "3. İşletme hesabı, doğrulama ve yetki",
    body: [
      "İşletme, kayıt sırasında verdiği ticaret unvanı, vergi bilgileri, IBAN, adres, harita konumu, iletişim bilgileri, kategori, ruhsat, sertifika, yetkili kişi ve görsellerin doğru, güncel ve hukuka uygun olduğunu taahhüt eder.",
      "tyee; kimlik, şirket, vergi, faaliyet belgesi, ruhsat, mesleki yeterlilik, banka hesabı, marka kullanım yetkisi ve benzeri doğrulama belgelerini talep edebilir. Belge sunulmaması, yanlış bilgi verilmesi veya şüpheli işlem halinde hesap askıya alınabilir.",
      "Aynı e-posta, telefon, vergi numarası veya işletme için birden fazla hesap açılması tyee onayına bağlıdır. Yanlışlıkla bireysel hesap açan işletme kullanıcılarının hesap türü admin panelinden düzeltilebilir; ancak aynı e-posta ile mükerrer hesap oluşturulamaz.",
    ],
  },
  {
    title: "4. Hizmet bilgileri, fiyat, müsaitlik ve rezervasyon",
    body: [
      "İşletme; hizmet açıklaması, fiyat, süre, kontenjan, alan bilgisi, çalışan bilgisi, çalışma saati, müsaitlik, iptal politikası ve özel koşulları doğru yayınlamakla yükümlüdür. Yanlış fiyat, yanlış müsaitlik veya eksik bilgilendirme nedeniyle doğacak talepler işletmeye aittir.",
      "İşletme, platform takvimini güncel tutar. Dolu alanı açık göstermek, teyitsiz randevu almak, müşteriyi platform dışına yönlendirerek komisyonu bertaraf etmek veya yanıltıcı kampanya yayınlamak sözleşmeye aykırıdır.",
      "Rezervasyonun kabulü, reddi, değişikliği, iptali ve no-show süreçleri paneldeki kurallara göre yürütülür. İşletme, müşteriye sunulan iptal ve iade şartlarını rezervasyon anından sonra müşteri aleyhine tek taraflı ağırlaştıramaz.",
    ],
  },
  {
    title: "5. Ödeme modelleri ve tyee komisyonu",
    body: [
      "Platformda temel komisyon oranı, aksi yazılı olarak kararlaştırılmadıkça rezervasyon veya paket tutarının yüzde yedisidir. Örnek olarak 4.000 TL tutarlı bir rezervasyonda tyee platform payı 280 TL'dir.",
      "Ön ödeme modelinde, müşteriden rezervasyon sırasında yüzde yedilik tutar online alınır. Kalan hizmet bedeli işletme tarafından hizmet yerinde veya işletmenin kendi ödeme yöntemiyle tahsil edilir.",
      "Tam online ödeme modelinde, müşteriden hizmet bedelinin tamamı alınır. tyee yüzde yedilik platform payını mahsup eder; kalan hakediş, kart ödeme kuruluşu ve banka süreçleri tamamlandıktan sonra işletmenin kayıtlı IBAN hesabına aktarılır.",
      "Sadece rezervasyon modelinde online tahsilat yapılmaz. Hizmet bedeli işletme tarafından tahsil edilir. tyee, ay sonunda işletmeye rezervasyon listesini ve komisyon tutarını bildirir. İşletme bildirilen komisyonu FAST/EFT ile öder.",
      "Ay sonu FAST modelinde ödeme bildirimi sonrası işletmeye on beş gün süre tanınır. Bu sürede ödeme yapılmazsa hatırlatma bildirimi gönderilebilir, hesap pasife çekilebilir, yeni rezervasyon alma yetkisi sınırlandırılabilir ve alacak takibi başlatılabilir.",
    ],
  },
  {
    title: "6. İade, iptal, ters ibraz ve mutabakat",
    body: [
      "İade ve iptal kuralları, tüketici mevzuatı ve müşteriye rezervasyon sırasında gösterilen koşullarla uyumlu olmalıdır. İşletme, kendi kusurundan, hizmeti sunamamasından veya yanlış bilgilendirmeden doğan iade taleplerinden sorumludur.",
      "Kartlı ödemelerde chargeback, ters ibraz, dolandırıcılık incelemesi, banka komisyonu, ödeme kuruluşu kesintisi ve vergi yükümlülükleri ödeme modeli ve kusur durumuna göre işletmeye yansıtılabilir.",
      "tyee, işletmeye panel üzerinden finansal ve operasyonel rapor sunar. İşletme, raporları makul sürede kontrol etmek ve itirazını yazılı olarak bildirmekle yükümlüdür. Süresinde itiraz edilmeyen mutabakat kayıtları kabul edilmiş sayılabilir.",
    ],
  },
  {
    title: "7. Vergi, fatura ve yasal izinler",
    body: [
      "İşletme, kendi hizmet satışından doğan vergi, fatura, e-arşiv/e-fatura, belge düzeni, ruhsat, mesleki yeterlilik, belediye, sağlık, spor, eğitim, ulaşım ve sektör bazlı izinlerden tek başına sorumludur.",
      "tyee yalnızca kendi platform payı için fatura düzenler. Müşteriye sunulan hizmetin faturası, ilgili mevzuat gerektiriyorsa işletme tarafından düzenlenir.",
      "İşletme, yasaklı, ruhsatsız, yanıltıcı, sağlığı veya güvenliği riske atan, üçüncü kişi haklarını ihlal eden hizmetleri platformda yayınlayamaz.",
    ],
  },
  {
    title: "8. Müşteri deneyimi, yorumlar ve kalite",
    body: [
      "İşletme, müşterilere dürüst, ayrımcılık yapmayan, güvenli ve profesyonel hizmet sunar. Şikayet, geç kalma, no-show, hijyen, güvenlik, ödeme uyuşmazlığı veya kötü hizmet tekrar ederse tyee görünürlüğü azaltabilir ya da hesabı askıya alabilir.",
      "Müşteri yorumları ve puanları, platform güveni için yayınlanabilir. İşletme sahte yorum, zorla yorum değiştirme, rakibi kötüleme veya müşteriye baskı kurma davranışında bulunamaz.",
      "tyee, arama sıralamasında kategori, konum, müsaitlik, kalite sinyalleri, iptal oranı, müşteri memnuniyeti, profil doluluğu, ödeme uyumu ve kampanya performansı gibi kriterleri kullanabilir.",
    ],
  },
  {
    title: "9. KVKK, veri güvenliği ve ticari ileti",
    body: [
      "Taraflar, 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili ikincil mevzuata uygun hareket eder. tyee, platform hesabı, rezervasyon ve ödeme akışı için kendi veri sorumluluğu kapsamında; işletme ise müşteriye hizmet sunumu ve kendi kayıtları bakımından veri sorumlusu sıfatıyla hareket edebilir.",
      "İşletme, platformdan aldığı müşteri verilerini yalnızca rezervasyonu ifa etmek, müşteri ile hizmet hakkında iletişim kurmak, yasal kayıt tutmak ve meşru operasyonel amaçlar için kullanır. Müşteri verileri izinsiz pazarlama, üçüncü kişiye satış, toplu mesaj veya platform dışı kampanya amacıyla kullanılamaz.",
      "SMS, e-posta, WhatsApp ve benzeri ticari elektronik iletiler ancak gerekli izinler, aydınlatma ve ret imkanı sağlanarak gönderilebilir. İşletme, kendi ticari ileti kampanyalarından ve izin kayıtlarından sorumludur.",
      "İşletme; panel kullanıcı şifrelerini korur, yetkisiz erişimi önler, veri ihlali veya şüpheli durumları gecikmeksizin tyee'ye bildirir. tyee, güvenlik amacıyla oturum, IP, cihaz ve işlem kayıtlarını tutabilir.",
    ],
  },
  {
    title: "10. Entegrasyonlar, harita, bildirim ve üçüncü taraflar",
    body: [
      "Platform; ödeme kuruluşları, harita sağlayıcıları, SMS/WhatsApp servisleri, e-posta altyapıları, bulut barındırma ve analitik araçlarıyla çalışabilir. Bu hizmetlerdeki kesinti, kota, mevzuat değişikliği veya sağlayıcı kaynaklı sorunlar nedeniyle makul gecikmeler yaşanabilir.",
      "İşletme, harita konumunu doğru işaretlemekle yükümlüdür. Yanlış konum, yanlış adres veya eksik ulaşım bilgisi nedeniyle müşterinin uğrayacağı zarar ve şikayetlerden işletme sorumludur.",
      "tyee, bildirimlerin ulaşacağını mutlak garanti etmez; işletme kritik rezervasyonları panelden takip etmekle yükümlüdür.",
    ],
  },
  {
    title: "11. Fikri mülkiyet, marka ve içerik hakları",
    body: [
      "tyee markası, yazılımı, tasarımı, algoritması, paneli, rapor formatları ve platform içerikleri tyee'ye veya lisans verenlerine aittir. İşletmeye yalnızca sözleşme süresince sınırlı kullanım hakkı verilir.",
      "İşletme, yüklediği logo, fotoğraf, video, açıklama, fiyat listesi ve kampanya metinleri üzerinde gerekli haklara sahip olduğunu taahhüt eder. Üçüncü kişi hak ihlali iddiasında işletme tyee'yi zarar, talep ve masraftan korur.",
      "tyee, işletmenin adını, logosunu ve profil görsellerini platform içinde, arama sonuçlarında, kampanya alanlarında ve tyee'nin işletme keşif akışında gösterebilir.",
    ],
  },
  {
    title: "12. Hizmet seviyesi, bakım ve sorumluluk sınırı",
    body: [
      "tyee, platformu makul ticari özenle çalıştırır; ancak kesintisiz, hatasız, her cihazda aynı performansta veya her zaman gelir sağlayacak şekilde çalışacağını garanti etmez.",
      "Planlı bakım, güvenlik güncellemesi, altyapı kesintisi, ödeme kuruluşu sorunu, internet kesintisi, siber saldırı, mücbir sebep veya üçüncü taraf kaynaklı aksaklıklarda hizmet geçici olarak sınırlanabilir.",
      "Kanunen yasaklanmadığı ölçüde tyee'nin toplam sorumluluğu, uyuşmazlığa konu olaydan önceki son üç ayda işletmeden tahsil edilen platform payı ile sınırlıdır. Dolaylı zarar, kar kaybı, itibar kaybı ve veri kaybı iddiaları için tyee sorumlu tutulamaz.",
    ],
  },
  {
    title: "13. Askıya alma, fesih ve veri çıkışı",
    body: [
      "İşletme; mevzuata aykırı işlem, ödeme ihlali, sahte bilgi, müşteri şikayetleri, güvenlik riski, komisyon kaçırma, kötüye kullanım veya platform itibarını zedeleyen davranış halinde geçici ya da kalıcı olarak pasife alınabilir.",
      "Taraflardan biri makul bildirimle sözleşmeyi feshedebilir. Devam eden rezervasyonlar, tahakkuk etmiş komisyonlar, iade/chargeback süreçleri, gizlilik ve KVKK yükümlülükleri fesih sonrasında da geçerliliğini korur.",
      "İşletme, hesabın kapanması halinde makul süre içinde kendi ticari kayıtlarını dışa aktarmaktan sorumludur. Yasal saklama süreleri ve güvenlik gerekleri saklıdır.",
    ],
  },
  {
    title: "14. Gizlilik, rekabet ve dürüst kullanım",
    body: [
      "Taraflar, ticari sır, fiyatlama, müşteri listesi, rapor, algoritma, teknik doküman ve finansal bilgileri gizli tutar. Bu bilgiler yalnızca sözleşmenin ifası için kullanılabilir.",
      "İşletme, tyee üzerinden gelen müşterileri sistematik biçimde platform dışına taşıyarak komisyonu bertaraf edemez. Müşterinin işletmeyle doğal ilişki kurması engellenmez; ancak platformun rezervasyon akışını kötüye kullanım yasaktır.",
      "tyee, platform bütünlüğünü korumak için kötüye kullanım tespiti, fraud kontrolü, hız limiti, görünürlük sınırlaması ve manuel inceleme uygulayabilir.",
    ],
  },
  {
    title: "15. Uyuşmazlık, uygulanacak hukuk ve değişiklik",
    body: [
      "Bu sözleşmeye Türkiye Cumhuriyeti hukuku uygulanır. Taraflar, ticari uyuşmazlıklarda zorunlu arabuluculuk hükümleri saklı kalmak üzere İstanbul Merkez Mahkemeleri ve İcra Dairelerinin yetkili olduğunu kabul eder.",
      "tyee, mevzuat, ödeme altyapısı, ürün kapsamı veya operasyonel ihtiyaçlar nedeniyle sözleşmeyi güncelleyebilir. Esaslı değişiklikler işletmeye panel, e-posta veya bildirim yoluyla duyurulur. İşletmenin değişiklik sonrası platformu kullanmaya devam etmesi güncel metni kabul ettiği anlamına gelir.",
      "Bu metin operasyonel sözleşme taslağıdır. Şirket bilgileri, vergi/fatura düzeni, ödeme kuruluşu sözleşmeleri, KVKK aydınlatma metni ve sektör bazlı izinler avukat tarafından son kez kontrol edilerek yayınlanmalıdır.",
    ],
  },
];

function getToken() {
  return localStorage.getItem("tyee_token") || "";
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function venueApiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "İşlem tamamlanamadı.");
  }
  return payload;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeSettings(settings = {}) {
  const businessType = settings.selects?.find((item) => item.label === "İşletme Tipi")?.value || "";
  const savedFacilities = Array.isArray(settings.facilities) ? settings.facilities : [];
  const savedFacilityMap = new Map(savedFacilities.map((item) => [item.id, item]));

  return {
    ...settings,
    tabs: DEFAULT_SETTINGS_TABS,
    businessName: settings.businessName || "",
    questions: Array.isArray(settings.questions) ? settings.questions : [],
    selects: Array.isArray(settings.selects) ? settings.selects : [],
    contact: {
      authorizedName: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      instagram: "",
      ...(settings.contact || {}),
    },
    details: {
      category: businessType,
      district: "",
      description: "",
      workingHours: "",
      cancellationPolicy: "",
      ...(settings.details || {}),
    },
    media: {
      logoUrl: "",
      coverUrl: "",
      gallery: [],
      ...(settings.media || {}),
      gallery: Array.isArray(settings.media?.gallery) ? settings.media.gallery : [],
    },
    areas: Array.isArray(settings.areas) && settings.areas.length
      ? settings.areas
      : [{ name: "Ana alan", type: "Saha / oda / masa", capacity: "", price: "", isActive: true }],
    facilities: FACILITY_FEATURES.map((feature) => ({
      ...feature,
      enabled: Boolean(savedFacilityMap.get(feature.id)?.enabled),
    })),
    payment: {
      invoiceTitle: "",
      taxOffice: "",
      taxNumber: "",
      iban: "",
      paymentMethod: "Ön ödeme",
      ...(settings.payment || {}),
    },
    contracts: {
      termsAccepted: false,
      kvkkAccepted: false,
      notes: "",
      ...(settings.contracts || {}),
    },
  };
}

function getInitials(value = "") {
  const words = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "Z";
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

function getVenueDisplayName() {
  const settingsName = venueState.dashboard?.settings?.businessName?.trim();
  const venueFallback = venueState.dashboard?.venue?.name?.trim();
  return settingsName || venueFallback || "tyee işletme";
}

function toCoordinate(value, fallback) {
  const number = Number(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : fallback;
}

function locationPickerMarkup(location = {}) {
  return `
    <div class="settings-map-picker">
      <div class="settings-map-toolbar">
        <div>
          <strong>Haritada konumu seç</strong>
          <span>Haritada işletmenin yerini tıkla, pin ve koordinatlar otomatik güncellensin.</span>
        </div>
        <button class="ghost-button settings-location-use-me" type="button">Konumumu kullan</button>
      </div>
      <div class="settings-map-canvas" id="settings-location-map" aria-label="İşletme konumu haritası">
        <div class="settings-map-surface">
          <span>Harita yükleniyor...</span>
        </div>
      </div>
      <small class="settings-map-hint">Pin seçildikten sonra Ayarları kaydet butonuna basınca konum ana sayfadaki Yakınımda haritasına eklenir.</small>
    </div>
  `;
}

function updateLocationInputs(lat, lng) {
  const latInput = document.querySelector("#settings-location-lat");
  const lngInput = document.querySelector("#settings-location-lng");
  const status = document.querySelector(".settings-location-status");
  if (latInput) latInput.value = Number(lat).toFixed(6);
  if (lngInput) lngInput.value = Number(lng).toFixed(6);
  if (status) status.textContent = "Konum seçildi";
}

function setupLocationPicker(settings) {
  const container = document.querySelector("#settings-location-map");
  if (!container) return;

  if (!window.L) {
    container.innerHTML = "<span>Harita kütüphanesi yüklenemedi. Enlem ve boylamı manuel girebilirsin.</span>";
    return;
  }

  const location = settings.location || {};
  const lat = toCoordinate(location.lat, DEFAULT_LOCATION_CENTER.lat);
  const lng = toCoordinate(location.lng, DEFAULT_LOCATION_CENTER.lng);
  container.innerHTML = `<div class="settings-map-surface"></div>`;
  const surface = container.querySelector(".settings-map-surface");

  const map = L.map(surface, {
    center: [lat, lng],
    zoom: location.lat && location.lng ? 15 : 11,
    scrollWheelZoom: true,
    attributionControl: false,
    zoomControl: true,
  });

  const tileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    keepBuffer: 4,
    updateWhenIdle: false,
  }).addTo(map);
  tileLayer.on("tileerror", () => setTimeout(() => tileLayer.redraw(), 300));
  L.control.attribution({ prefix: false }).addAttribution("&copy; OpenStreetMap &copy; CARTO").addTo(map);

  const marker = L.marker([lat, lng], {
    draggable: true,
    title: "İşletme konumu",
  }).addTo(map);

  const setPoint = (point) => {
    marker.setLatLng(point);
    updateLocationInputs(point.lat, point.lng);
  };

  map.on("click", (event) => setPoint(event.latlng));
  marker.on("dragend", () => setPoint(marker.getLatLng()));

  document.querySelector(".settings-location-use-me")?.addEventListener("click", () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const point = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      map.setView([point.lat, point.lng], 16);
      setPoint(point);
    });
  });

  const refresh = () => {
    map.invalidateSize({ pan: false });
    tileLayer.redraw();
  };
  requestAnimationFrame(refresh);
  [160, 420, 900].forEach((delay) => setTimeout(refresh, delay));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        refresh();
      },
      { threshold: 0.15 },
    );
    observer.observe(container);
  }

  container.addEventListener("mouseenter", refresh);
  window.addEventListener("scroll", refresh, { passive: true });
}

function renderVenueIdentity() {
  if (!venueState.dashboard) return;

  const displayName = getVenueDisplayName();
  venueTitle.textContent = `${displayName} yönetim paneli`;
  venueAvatar.textContent = getInitials(displayName);
  venueName.textContent = displayName;
  venueBranch.textContent = venueState.dashboard.venue?.branch || "";
}

async function requireVenueAccess() {
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
    localStorage.removeItem("tyee_token");
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

function parseSalesDateTime(value = "") {
  const match = String(value).match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}:\d{2})/);
  if (!match) {
    return {
      day: "-",
      startDate: "-",
      time: value || "-",
      expiry: "-",
    };
  }

  const [, day, month, year, time] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const weekday = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][date.getDay()];
  const expiryDate = addDays(date, 7);

  return {
    day: weekday,
    startDate: `${day}.${month}.${year}`,
    time,
    expiry: `${String(expiryDate.getDate()).padStart(2, "0")}.${String(expiryDate.getMonth() + 1).padStart(2, "0")}.${expiryDate.getFullYear()} ${time}`,
  };
}

function buildManualMeta(entry) {
  if (!entry) return "İşletme tarafından girilir";
  if (entry.isSubscription && entry.phone) return `Abone • ${entry.phone}`;
  if (entry.isSubscription) return "Abonelik müşterisi";
  if (entry.phone) return entry.phone;
  if (entry.total) return `Toplam ${entry.total} TL`;
  return "İşletme tarafından girilir";
}

function getActiveServiceAreas() {
  const areas = venueState.dashboard?.settings?.areas;
  const activeAreas = Array.isArray(areas)
    ? areas
        .filter((area) => area && area.isActive !== false)
        .map((area) => ({
          name: String(area.name || "").trim() || "Ana alan",
          type: String(area.type || "").trim() || "Hizmet alanı",
          capacity: String(area.capacity || "").trim(),
        }))
    : [];

  return activeAreas.length
    ? activeAreas
    : [{ name: "Ana alan", type: "Saha / oda / kişi", capacity: "" }];
}

function getSlotServiceInfo(slotKey, slot = null, manualEntry = null) {
  const saved = venueState.slotServices[slotKey];
  const areas = getActiveServiceAreas();
  const fallbackName = saved?.name || manualEntry?.field || slot?.field || areas[0]?.name || "Ana alan";
  const matchedArea =
    areas.find((area) => area.name === fallbackName) ||
    areas.find((area) => slot?.field && area.name === slot.field) ||
    areas[0];

  return {
    name: saved?.name || matchedArea?.name || fallbackName,
    type: saved?.type || matchedArea?.type || "Hizmet alanı",
    capacity: saved?.capacity || matchedArea?.capacity || "",
  };
}

function buildServiceMeta(serviceInfo) {
  const parts = [serviceInfo.type, serviceInfo.capacity].filter(Boolean);
  return parts.length ? parts.join(" • ") : "Hizmet/alan";
}

function buildSlotBadge(label, className) {
  return `<em class="slot-channel-badge ${className}">${label}</em>`;
}

function openSalesModal(day = null, time = "", slotKey = "", options = {}) {
  const existingEntry = slotKey ? venueState.manualEntries[slotKey] : null;
  const fallbackDay = day || buildDisplayWeek(venueState.dashboard?.weekDays || [])[0];
  const fallbackTime = time || "19:00";
  venueState.salesDraftSlotKey = slotKey;
  salesTime.value = fallbackDay ? formatSlotDateTime(fallbackDay, fallbackTime) : fallbackTime;
  salesDeposit.value = existingEntry?.deposit || "50";
  salesPhone.value = existingEntry?.phone || "";
  salesPayout.value = existingEntry?.payout || "100";
  salesName.value = existingEntry?.name || "";
  salesTotal.value = existingEntry?.total || "150";
  salesNotes.value = existingEntry?.notes || "";
  salesSubscription.checked = Boolean(options.isSubscription || existingEntry?.isSubscription);
  salesModal.classList.remove("hidden");
}

function addSubscriptionFromSalesModal() {
  if (!venueState.dashboard) return;
  const parsed = parseSalesDateTime(salesTime.value);
  const nextSubscription = {
    id: Math.floor(Date.now() % 1000000),
    customer: salesName.value.trim() || "Yeni abonelik",
    field: "Ana alan",
    day: parsed.day,
    startDate: parsed.startDate,
    time: parsed.time,
    status: "Aktif",
    expiry: parsed.expiry,
  };

  venueState.dashboard.subscriptions = [nextSubscription, ...(venueState.dashboard.subscriptions || [])];
  renderSubscriptions(venueState.dashboard.subscriptions);
}

function closeSalesModal() {
  venueState.salesDraftSlotKey = "";
  salesModal.classList.add("hidden");
}

async function saveSlotState() {
  const payload = await venueApiRequest("/api/venue/slot-state", {
    method: "PATCH",
    body: JSON.stringify({
      venueId: venueState.venueId,
      slotModes: venueState.slotModes,
      manualEntries: venueState.manualEntries,
      slotServices: venueState.slotServices,
    }),
  });

  venueState.slotModes = payload.slotState?.slotModes || venueState.slotModes;
  venueState.manualEntries = payload.slotState?.manualEntries || venueState.manualEntries;
  venueState.slotServices = payload.slotState?.slotServices || venueState.slotServices;
}

function renderWeeklySchedule(board, days) {
  const displayDays = buildDisplayWeek(days);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const times = buildTimeSlots();
  const rows = times
    .map((time, timeIndex) => {
      const cells = displayDays
        .map((day, dayIndex) => {
          const dayKey = `${day.dateObj.getFullYear()}-${day.dateObj.getMonth()}-${day.dateObj.getDate()}`;
          const isToday = dayKey === todayKey;
          const slot = day.slots.find((item) => item.time === time);
          const slotKey = `${dayIndex}-${time}`;
          const selectedClass = venueState.selectedSlotKey === slotKey ? " is-selected" : "";
          const todayClass = isToday ? " is-today-column" : "";
          const explicitMode = venueState.slotModes[slotKey];
          const mode = explicitMode || getDefaultMode(slot);
          const explicitRezervClass = explicitMode === "rezerv" ? " slot-explicit-rezerv" : "";
          const manualEntry = venueState.manualEntries[slotKey];
          const serviceInfo = getSlotServiceInfo(slotKey, slot, manualEntry);
          const serviceMeta = buildServiceMeta(serviceInfo);

          let modeLabel = "Açık";
          let modeMeta = "";
          let modeClass = "is-tyee";
          let actionLabel = "tyee satışına aç";
          let badgeMarkup = buildSlotBadge("R", "is-tyee");

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
          const popoverEdgeClass = dayIndex >= displayDays.length - 2 ? " is-popover-right" : "";
          const popoverVerticalClass = timeIndex >= times.length - 5 ? " is-popover-above" : "";
          const popoverClass = `slot-popover${popoverEdgeClass}${popoverVerticalClass}`;
          const slotMainMarkup =
            mode === "rezerv"
              ? `
                <div class="open-slot-summary" aria-label="Rezervasyona açık hizmet">
                  <strong>Satışa açık</strong>
                  <span>${escapeHtml(serviceInfo.name)}</span>
                  <small>${escapeHtml(serviceMeta)}</small>
                </div>
              `
              : `<strong>${modeLabel}</strong>${badgeMarkup}${modeMeta ? `<span>${modeMeta}</span>` : ""}`;
          const serviceOptionsMarkup = getActiveServiceAreas()
            .map((area) => {
              const isActive = area.name === serviceInfo.name;
              return `
                <button
                  class="slot-service-option ${isActive ? "is-active" : ""}"
                  type="button"
                  data-slot-service="true"
                  data-slot-key="${slotKey}"
                  data-service-name="${escapeHtml(area.name)}"
                  data-service-type="${escapeHtml(area.type)}"
                  data-service-capacity="${escapeHtml(area.capacity)}"
                >
                  <strong>${escapeHtml(area.name)}</strong>
                  <span>${escapeHtml(buildServiceMeta(area))}</span>
                </button>
              `;
            })
            .join("");

          return `
            <td class="schedule-slot-cell ${compactStatusClass}${explicitRezervClass}${selectedClass}${todayClass}" data-slot-key="${slotKey}" data-day-index="${dayIndex}" data-time="${time}">
              <div class="schedule-choice ${modeClass}">
                ${slotMainMarkup}
                ${
                  venueState.selectedSlotKey === slotKey
                    ? `
                      <div class="${popoverClass}">
                        <div class="slot-popover-head">
                          <strong>${time}</strong>
                          <span>${actionLabel}</span>
                        </div>
                        <div class="slot-options" aria-label="Slot durumu seç">
                          <button class="slot-option slot-option-tyee ${mode === "rezerv" ? "is-active" : ""}" type="button" data-mode="rezerv" data-slot-key="${slotKey}" aria-label="tyee">
                            <span class="slot-option-icon">R</span>
                            <span>Satışa aç</span>
                          </button>
                          <button class="slot-option slot-option-closed ${mode === "closed" ? "is-active" : ""}" type="button" data-mode="closed" data-slot-key="${slotKey}" aria-label="Kapalı">
                            <span class="slot-option-icon">K</span>
                            <span>Kapalı</span>
                          </button>
                          <button class="slot-option slot-option-manual ${mode === "manual" ? "is-active" : ""}" type="button" data-mode="manual" data-slot-key="${slotKey}" data-time="${time}" data-day-index="${dayIndex}" aria-label="Manuel rezerv">
                            <span class="slot-option-icon">M</span>
                            <span>Manuel rezerv</span>
                          </button>
                        </div>
                        ${
                          mode === "rezerv"
                            ? `
                              <div class="slot-service-picker">
                                <p>Açılacak hizmet / alan</p>
                                ${serviceOptionsMarkup}
                              </div>
                            `
                            : ""
                        }
                        ${
                          mode === "manual"
                            ? `
                              <button
                                class="slot-popover-edit"
                                type="button"
                                data-edit-manual="true"
                                data-slot-key="${slotKey}"
                                data-time="${time}"
                                data-day-index="${dayIndex}"
                              >Manuel kaydı düzenle</button>
                            `
                            : ""
                        }
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
  if (!items.length) {
    quickActions.innerHTML = `
      <div class="quick-action is-empty">
        <strong>Henüz hızlı işlem yok</strong>
        <span>Boş</span>
      </div>
    `;
    return;
  }

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

function renderOverview(payload) {
  if (payload.isFreshVenue) {
    overviewList.innerHTML = `
      <article class="overview-item is-empty">
        <div>
          <strong>Henüz operasyon verisi yok</strong>
          <p>Rezervasyon, abonelik ve tahsilat kaydı oluştuğunda bu alan otomatik dolacak.</p>
        </div>
        <span>0 işlem</span>
      </article>
    `;
    return;
  }

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

function renderSidebarSummary(payload) {
  if (!sidebarSummaryTitle || !sidebarSummaryMeta) return;
  if (payload.isFreshVenue) {
    sidebarSummaryTitle.textContent = "Başlangıç";
    sidebarSummaryMeta.textContent = "Henüz slot açılmadı";
    return;
  }
  sidebarSummaryTitle.textContent = "Bugün müsait";
  sidebarSummaryMeta.textContent = "18 slot marketplace'e açık";
}

function statusPill(status) {
  const isActive = status === "Aktif" || status === "Tamamlandı";
  return `<span class="status-pill ${isActive ? "is-active" : "is-passive"}">${status}</span>`;
}

function renderSubscriptions(items) {
  if (!items.length) {
    subscriptionsBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table-cell">Henüz abonelik kaydı yok.</td>
      </tr>
    `;
    return;
  }

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
  if (!items.length) {
    transactionsBody.innerHTML = `
      <tr>
        <td colspan="18" class="empty-table-cell">Henüz işlem kaydı yok.</td>
      </tr>
    `;
    return;
  }

  const displayName = getVenueDisplayName();
  transactionsBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>#${item.id}</td>
          <td>${item.type}</td>
          <td>${statusPill(item.status)}</td>
          <td>${displayName || item.venue}</td>
          <td>${item.field}</td>
          <td><span class="channel-pill">${item.channel}</span></td>
          <td>${item.customer}</td>
          <td>${item.businessType}</td>
          <td>${item.amount}</td>
          <td>${item.deposit}</td>
          <td>${item.commission}</td>
          <td>${item.date}</td>
          <td>${item.time}</td>
          <td>${item.createdAt}</td>
          <td>${item.monthlyPackageActive ? "Evet" : "Hayır"}</td>
          <td>${item.packageName || "-"}</td>
          <td>${item.withdrawalCount ?? 0}</td>
          <td>
            ${item.reservationId && item.status !== "Tamamlandı" && item.status !== "Pasif"
              ? `<button class="table-action-button" type="button" data-complete-reservation="${item.reservationId}">Tamamla</button>`
              : `<span class="muted-table-text">${item.reviewStatus === "received" ? "Yorum alındı" : "-"}</span>`}
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderReportSummary(items) {
  const markup = items
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

  if (reportSummaryGrid) reportSummaryGrid.innerHTML = markup;
  if (reportsSummaryGrid) reportsSummaryGrid.innerHTML = markup;
}

function renderVenueMetricCards(items = []) {
  return items
    .map(
      (item) => `
        <article class="venue-report-metric">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.note || "")}</small>
        </article>
      `,
    )
    .join("");
}

function renderVenueReport(report) {
  if (!venueReportDocument) return;

  venueReportDocument.innerHTML = `
    <header class="venue-report-cover">
      <div>
        <span>tyee kurum raporu</span>
        <h3>${escapeHtml(report.title)}</h3>
        <p>${escapeHtml(report.scope)} · ${escapeHtml(report.period)}</p>
      </div>
      <time>${new Date(report.generatedAt).toLocaleString("tr-TR")}</time>
    </header>

    <section class="venue-report-section">
      <h4>Yönetici özeti</h4>
      <ul>
        ${(report.executiveSummary || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>

    <section class="venue-report-section">
      <h4>Finansal görünüm</h4>
      <div class="venue-report-metric-grid">${renderVenueMetricCards(report.financial)}</div>
    </section>

    <section class="venue-report-section">
      <h4>Operasyonel görünüm</h4>
      <div class="venue-report-metric-grid">${renderVenueMetricCards(report.operational)}</div>
    </section>

    <section class="venue-report-section">
      <h4>Müşteri deneyimi</h4>
      <div class="venue-report-metric-grid">${renderVenueMetricCards(report.customerExperience)}</div>
    </section>

    <section class="venue-report-section">
      <h4>Rezervasyon satır özeti</h4>
      <div class="venue-report-table">
        <div class="venue-report-table-head">
          <span>Hizmet</span>
          <span>Müşteri</span>
          <span>Tarih</span>
          <span>Tutar</span>
          <span>Durum</span>
        </div>
        ${(report.rows || []).length
          ? report.rows
              .map(
                (row) => `
                  <div class="venue-report-table-row">
                    <span>${escapeHtml(row.service)}</span>
                    <span>${escapeHtml(row.customer)}</span>
                    <span>${escapeHtml(row.date)}</span>
                    <span>${escapeHtml(row.amount)}</span>
                    <span>${escapeHtml(row.status)}</span>
                  </div>
                `,
              )
              .join("")
          : `<div class="venue-report-table-row is-empty"><span>Henüz rapora düşen rezervasyon yok.</span></div>`}
      </div>
    </section>

    <section class="venue-report-section">
      <h4>Aksiyon önerileri</h4>
      <ol>
        ${(report.recommendations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </section>
  `;
}

async function loadVenueReport() {
  if (!venueReportDocument || !venueState.venueId) return;

  venueReportDocument.innerHTML = `<span class="empty-copy">Rapor hazırlanıyor...</span>`;
  const params = new URLSearchParams({
    venueId: venueState.venueId,
    period: venueReportPeriod?.value || "Bu ay",
  });
  const report = await venueApiRequest(`/api/venue/reports?${params.toString()}`);
  renderVenueReport(report);
}

function renderSettingsTabs(items) {
  const safeItems = DEFAULT_SETTINGS_TABS;
  const activeTab = safeItems.includes(venueState.activeSettingsTab) ? venueState.activeSettingsTab : safeItems[0];
  venueState.activeSettingsTab = activeTab;
  settingsTabs.innerHTML = safeItems
    .map(
      (item) => `
        <button class="settings-tab ${item === activeTab ? "is-active" : ""}" type="button" data-settings-tab="${escapeHtml(item)}">${item}</button>
      `,
    )
    .join("");
}

function renderSettingsOnboarding(settings) {
  const normalized = normalizeSettings(settings);
  const activeTab = venueState.activeSettingsTab;
  const renderers = {
    "İşletme Bilgileri": renderBusinessInfoSettings,
    "Ödeme & Sözleşme": renderPaymentContractSettings,
  };
  settingsOnboardingForm.innerHTML = (renderers[activeTab] || renderBusinessInfoSettings)(normalized);
  if (activeTab === "İşletme Bilgileri") {
    requestAnimationFrame(() => setupLocationPicker(normalized));
  }
}

function settingsSection(title, subtitle, body) {
  return `
    <section class="settings-section">
      <div class="settings-section-head">
        <h3>${escapeHtml(title)}</h3>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
      <div class="settings-section-body">${body}</div>
    </section>
  `;
}

function mediaSettingsFields(settings) {
  const media = settings.media;
  const galleryMarkup = media.gallery.length
    ? media.gallery
        .map(
          (item, index) => `
            <article class="settings-media-card">
              <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name || "İşletme görseli")}" />
              <div>
                <strong>${escapeHtml(item.name || `Görsel ${index + 1}`)}</strong>
                <button class="ghost-button" type="button" data-media-remove="${index}">Kaldır</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="settings-empty-box">Henüz görsel eklenmedi.</div>`;

  return `
    <div class="settings-form-grid">
      <label class="settings-input-field">
        <span>Logo URL</span>
        <input id="settings-media-logo-url" type="url" value="${escapeHtml(media.logoUrl)}" placeholder="https://..." />
      </label>
      <label class="settings-input-field">
        <span>Kapak görseli URL</span>
        <input id="settings-media-cover-url" type="url" value="${escapeHtml(media.coverUrl)}" placeholder="https://..." />
      </label>
    </div>
    <label class="settings-upload-box">
      <span>Resim ekle</span>
      <input type="file" accept="image/*" multiple data-media-upload />
      <small>Görseller önizleme için küçültülerek kaydedilir.</small>
    </label>
    <div class="settings-media-grid">${galleryMarkup}</div>
  `;
}

function areaSettingsFields(settings) {
  const areasMarkup = settings.areas
    .map(
      (area, index) => `
        <article class="settings-area-card" data-area-card="${index}">
          <div class="settings-area-head">
            <strong>Alan ${index + 1}</strong>
            <label class="settings-switch">
              <input type="checkbox" data-area-active="${index}" ${area.isActive ? "checked" : ""} />
              <span>Aktif</span>
            </label>
          </div>
          <div class="settings-form-grid">
            <label class="settings-input-field">
              <span>Alan adı</span>
              <input data-area-name="${index}" type="text" value="${escapeHtml(area.name)}" placeholder="Saha 1, Oda 2, Masa A..." />
            </label>
            <label class="settings-input-field">
              <span>Alan tipi</span>
              <input data-area-type="${index}" type="text" value="${escapeHtml(area.type)}" placeholder="Saha, oda, masa, eğitmen..." />
            </label>
            <label class="settings-input-field">
              <span>Kapasite</span>
              <input data-area-capacity="${index}" type="text" value="${escapeHtml(area.capacity)}" placeholder="2 kişi, 12 kişi..." />
            </label>
            <label class="settings-input-field">
              <span>Başlangıç fiyatı</span>
              <input data-area-price="${index}" type="text" value="${escapeHtml(area.price)}" placeholder="₺750 / saat" />
            </label>
          </div>
        </article>
      `,
    )
    .join("");

  return `
    <div class="settings-area-list">${areasMarkup}</div>
    <button class="ghost-button settings-inline-action" type="button" data-area-add>+ Alan ekle</button>
  `;
}

function facilitySettingsFields(settings) {
  const selectedCount = (settings.facilities || []).filter((item) => item.enabled).length;
  const facilitiesMarkup = (settings.facilities || [])
    .map(
      (item) => `
        <label class="settings-feature-card">
          <input type="checkbox" data-facility-id="${escapeHtml(item.id)}" ${item.enabled ? "checked" : ""} />
          <span class="settings-feature-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
          <span class="settings-feature-label">${escapeHtml(item.label)}</span>
        </label>
      `,
    )
    .join("");

  return `
    <div class="settings-feature-summary">
      <strong>${selectedCount} özellik seçili</strong>
      <span>Müşteri tesis detayında yalnızca işaretlediğin özellikleri görecek.</span>
    </div>
    <div class="settings-feature-grid">${facilitiesMarkup}</div>
  `;
}

function renderBusinessInfoSettings(settings) {
  const contact = settings.contact;
  const location = settings.location || {};
  const details = settings.details;

  return `
    ${settingsSection(
      "Temel bilgiler",
      "Marketplace'te görünen ana işletme bilgileri.",
      `
        <div class="settings-form-grid">
          <label class="settings-input-field">
            <span>İşletme adı</span>
            <input id="settings-business-name" type="text" value="${escapeHtml(settings.businessName)}" />
          </label>
          <label class="settings-select-field">
            <span>Kategori</span>
            <select id="settings-detail-category">
              ${["Pet Kuaför", "Güzellik Merkezi", "Halı Saha", "Padel Kort", "Direksiyon Dersi", "Özel Ders", "Masaj & Spa", "Yoga & Pilates", "Diğer"]
                .map((option) => `<option ${option === details.category ? "selected" : ""}>${option}</option>`)
                .join("")}
            </select>
          </label>
          <label class="settings-input-field">
            <span>İlçe / bölge</span>
            <input id="settings-detail-district" type="text" value="${escapeHtml(details.district)}" placeholder="Kadıköy, Beşiktaş..." />
          </label>
          <label class="settings-input-field">
            <span>Çalışma saatleri</span>
            <input id="settings-detail-working-hours" type="text" value="${escapeHtml(details.workingHours)}" placeholder="Hafta içi 09:00 - 22:00" />
          </label>
        </div>
        <label class="settings-input-field">
          <span>İşletme açıklaması</span>
          <textarea id="settings-detail-description" rows="4" placeholder="Müşterinin göreceği kısa açıklama">${escapeHtml(details.description)}</textarea>
        </label>
        <label class="settings-input-field">
          <span>İptal politikası</span>
          <input id="settings-detail-cancellation" type="text" value="${escapeHtml(details.cancellationPolicy)}" placeholder="Rezervasyondan 2 saat öncesine kadar" />
        </label>
      `,
    )}

    ${settingsSection(
      "İletişim ve konum",
      "Müşteri iletişimi ve yakınımdaki işletmeler haritası için gerekli alanlar.",
      `
        <div class="settings-form-grid">
          <label class="settings-input-field">
            <span>Yetkili kişi</span>
            <input id="settings-contact-authorized-name" type="text" value="${escapeHtml(contact.authorizedName)}" />
          </label>
          <label class="settings-input-field">
            <span>Telefon</span>
            <input id="settings-contact-phone" type="tel" value="${escapeHtml(contact.phone)}" placeholder="05xx xxx xx xx" />
          </label>
          <label class="settings-input-field">
            <span>WhatsApp</span>
            <input id="settings-contact-whatsapp" type="tel" value="${escapeHtml(contact.whatsapp)}" placeholder="05xx xxx xx xx" />
          </label>
          <label class="settings-input-field">
            <span>E-posta</span>
            <input id="settings-contact-email" type="email" value="${escapeHtml(contact.email)}" />
          </label>
          <label class="settings-input-field">
            <span>Web sitesi</span>
            <input id="settings-contact-website" type="url" value="${escapeHtml(contact.website)}" placeholder="https://..." />
          </label>
          <label class="settings-input-field">
            <span>Instagram</span>
            <input id="settings-contact-instagram" type="text" value="${escapeHtml(contact.instagram)}" placeholder="@isletme" />
          </label>
        </div>
        <div class="settings-location-block">
          <strong>Adres ve harita konumu</strong>
          <div class="settings-location-status">${escapeHtml(settings.locationStatus || "Girilmemiş")}</div>
          <label class="settings-select-field">
            <span>Açık adres</span>
            <input id="settings-location-address" type="text" value="${escapeHtml(location.address || "")}" placeholder="Cadde, sokak, bina no" />
          </label>
          ${locationPickerMarkup(location)}
          <div class="settings-form-grid">
            <label class="settings-select-field">
              <span>Enlem</span>
              <input id="settings-location-lat" type="text" value="${escapeHtml(location.lat || "")}" placeholder="41.0082" />
            </label>
            <label class="settings-select-field">
              <span>Boylam</span>
              <input id="settings-location-lng" type="text" value="${escapeHtml(location.lng || "")}" placeholder="28.9784" />
            </label>
          </div>
        </div>
      `,
    )}

    ${settingsSection("Görseller", "Logo, kapak ve galeri görselleri.", mediaSettingsFields(settings))}
    ${settingsSection("Tesis özellikleri", "Müşterinin rezervasyon öncesi göreceği imkanlar.", facilitySettingsFields(settings))}
    ${settingsSection("Hizmet alanları", "Saha, oda, masa, eğitmen veya hizmet kapasitesi.", areaSettingsFields(settings))}
    ${settingsSaveMarkup()}
  `;
}

function renderPaymentContractSettings(settings) {
  return `
    ${settingsSection("Ödeme bilgileri", "Tahsilat modeli, hakediş ve fatura bilgileri.", renderPaymentSettings(settings, false))}
    ${settingsSection("Sözleşmeler", "İşletme onayları ve yasal takip notları.", renderContractSettings(settings, false))}
    ${settingsSaveMarkup()}
  `;
}

function renderGeneralSettings(settings) {
  const questionsMarkup = settings.questions
    .map(
      (item, index) => `
        <div class="settings-question">
          <strong>${item.label}</strong>
          <div class="settings-radio-row">
            <label class="settings-radio">
              <input type="radio" name="settings-q-${index}" value="true" ${item.value ? "checked" : ""} />
              <span>Evet</span>
            </label>
            <label class="settings-radio">
              <input type="radio" name="settings-q-${index}" value="false" ${!item.value ? "checked" : ""} />
              <span>Hayır</span>
            </label>
          </div>
        </div>
      `,
    )
    .join("");

  const selectsMarkup = settings.selects
    .map(
      (item, index) => `
        <label class="settings-select-field">
          <span>${item.label}${item.info ? ' <em class="settings-info">i</em>' : ""}</span>
          <select data-settings-select-index="${index}">
            ${item.options
              .map(
                (option) =>
                  `<option ${option === item.value ? "selected" : ""}>${escapeHtml(option)}</option>`,
              )
              .join("")}
          </select>
        </label>
      `,
    )
    .join("");

  return `
    <label class="settings-input-field">
      <span>İşletme Adı</span>
      <input id="settings-business-name" type="text" value="${escapeHtml(settings.businessName)}" />
    </label>

    ${questionsMarkup}

    ${selectsMarkup}

    <div class="settings-save-row">
      <button class="solid-button" data-settings-save type="button">Ayarları kaydet</button>
      <span class="venue-save-status" data-settings-status></span>
    </div>
  `;
}

function renderContactSettings(settings) {
  const contact = settings.contact;
  const location = settings.location || {};
  return `
    <div class="settings-form-grid">
      <label class="settings-input-field">
        <span>Yetkili kişi</span>
        <input id="settings-contact-authorized-name" type="text" value="${escapeHtml(contact.authorizedName)}" />
      </label>
      <label class="settings-input-field">
        <span>Telefon</span>
        <input id="settings-contact-phone" type="tel" value="${escapeHtml(contact.phone)}" placeholder="05xx xxx xx xx" />
      </label>
      <label class="settings-input-field">
        <span>WhatsApp</span>
        <input id="settings-contact-whatsapp" type="tel" value="${escapeHtml(contact.whatsapp)}" placeholder="05xx xxx xx xx" />
      </label>
      <label class="settings-input-field">
        <span>E-posta</span>
        <input id="settings-contact-email" type="email" value="${escapeHtml(contact.email)}" />
      </label>
      <label class="settings-input-field">
        <span>Web sitesi</span>
        <input id="settings-contact-website" type="url" value="${escapeHtml(contact.website)}" placeholder="https://..." />
      </label>
      <label class="settings-input-field">
        <span>Instagram</span>
        <input id="settings-contact-instagram" type="text" value="${escapeHtml(contact.instagram)}" placeholder="@isletme" />
      </label>
    </div>
    <div class="settings-location-block">
      <strong>Adres ve harita konumu</strong>
      <div class="settings-location-status">${escapeHtml(settings.locationStatus || "Girilmemiş")}</div>
      <label class="settings-select-field">
        <span>Açık adres</span>
        <input id="settings-location-address" type="text" value="${escapeHtml(location.address || "")}" placeholder="Cadde, sokak, bina no" />
      </label>
      ${locationPickerMarkup(location)}
      <div class="settings-form-grid">
        <label class="settings-select-field">
          <span>Enlem</span>
          <input id="settings-location-lat" type="text" value="${escapeHtml(location.lat || "")}" placeholder="41.0082" />
        </label>
        <label class="settings-select-field">
          <span>Boylam</span>
          <input id="settings-location-lng" type="text" value="${escapeHtml(location.lng || "")}" placeholder="28.9784" />
        </label>
      </div>
    </div>
    ${settingsSaveMarkup()}
  `;
}

function renderDetailSettings(settings) {
  const details = settings.details;
  return `
    <div class="settings-form-grid">
      <label class="settings-select-field">
        <span>Kategori</span>
        <select id="settings-detail-category">
          ${["Pet Kuaför", "Güzellik Merkezi", "Halı Saha", "Padel Kort", "Direksiyon Dersi", "Özel Ders", "Masaj & Spa", "Yoga & Pilates", "Diğer"]
            .map((option) => `<option ${option === details.category ? "selected" : ""}>${option}</option>`)
            .join("")}
        </select>
      </label>
      <label class="settings-input-field">
        <span>İlçe / bölge</span>
        <input id="settings-detail-district" type="text" value="${escapeHtml(details.district)}" placeholder="Kadıköy, Beşiktaş..." />
      </label>
    </div>
    <label class="settings-input-field">
      <span>İşletme açıklaması</span>
      <textarea id="settings-detail-description" rows="4" placeholder="Müşterinin göreceği kısa açıklama">${escapeHtml(details.description)}</textarea>
    </label>
    <div class="settings-form-grid">
      <label class="settings-input-field">
        <span>Çalışma saatleri</span>
        <input id="settings-detail-working-hours" type="text" value="${escapeHtml(details.workingHours)}" placeholder="Hafta içi 09:00 - 22:00" />
      </label>
      <label class="settings-input-field">
        <span>İptal politikası</span>
        <input id="settings-detail-cancellation" type="text" value="${escapeHtml(details.cancellationPolicy)}" placeholder="Rezervasyondan 2 saat öncesine kadar" />
      </label>
    </div>
    ${settingsSaveMarkup()}
  `;
}

function renderMediaSettings(settings) {
  const media = settings.media;
  const galleryMarkup = media.gallery.length
    ? media.gallery
        .map(
          (item, index) => `
            <article class="settings-media-card">
              <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name || "İşletme görseli")}" />
              <div>
                <strong>${escapeHtml(item.name || `Görsel ${index + 1}`)}</strong>
                <button class="ghost-button" type="button" data-media-remove="${index}">Kaldır</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="settings-empty-box">Henüz görsel eklenmedi.</div>`;

  return `
    <div class="settings-form-grid">
      <label class="settings-input-field">
        <span>Logo URL</span>
        <input id="settings-media-logo-url" type="url" value="${escapeHtml(media.logoUrl)}" placeholder="https://..." />
      </label>
      <label class="settings-input-field">
        <span>Kapak görseli URL</span>
        <input id="settings-media-cover-url" type="url" value="${escapeHtml(media.coverUrl)}" placeholder="https://..." />
      </label>
    </div>
    <label class="settings-upload-box">
      <span>Resim ekle</span>
      <input type="file" accept="image/*" multiple data-media-upload />
      <small>Görseller önizleme için küçültülerek kaydedilir.</small>
    </label>
    <div class="settings-media-grid">${galleryMarkup}</div>
    ${settingsSaveMarkup()}
  `;
}

function renderAreaSettings(settings) {
  const areasMarkup = settings.areas
    .map(
      (area, index) => `
        <article class="settings-area-card" data-area-card="${index}">
          <div class="settings-area-head">
            <strong>Alan ${index + 1}</strong>
            <label class="settings-switch">
              <input type="checkbox" data-area-active="${index}" ${area.isActive ? "checked" : ""} />
              <span>Aktif</span>
            </label>
          </div>
          <div class="settings-form-grid">
            <label class="settings-input-field">
              <span>Alan adı</span>
              <input data-area-name="${index}" type="text" value="${escapeHtml(area.name)}" placeholder="Saha 1, Oda 2, Masa A..." />
            </label>
            <label class="settings-input-field">
              <span>Alan tipi</span>
              <input data-area-type="${index}" type="text" value="${escapeHtml(area.type)}" placeholder="Saha, oda, masa, eğitmen..." />
            </label>
            <label class="settings-input-field">
              <span>Kapasite</span>
              <input data-area-capacity="${index}" type="text" value="${escapeHtml(area.capacity)}" placeholder="2 kişi, 12 kişi..." />
            </label>
            <label class="settings-input-field">
              <span>Başlangıç fiyatı</span>
              <input data-area-price="${index}" type="text" value="${escapeHtml(area.price)}" placeholder="₺750 / saat" />
            </label>
          </div>
        </article>
      `,
    )
    .join("");

  return `
    <div class="settings-note">Bu alan halı saha, güzellik odası, pet kuaför masası, derslik veya eğitmen gibi tüm sektörlerde kullanılacak jenerik kapasite bilgisidir.</div>
    <div class="settings-area-list">${areasMarkup}</div>
    <div class="settings-save-row">
      <button class="ghost-button" type="button" data-area-add>+ Alan ekle</button>
      <button class="solid-button" data-settings-save type="button">Ayarları kaydet</button>
      <span class="venue-save-status" data-settings-status></span>
    </div>
  `;
}

function renderPaymentSettings(settings, includeSave = true) {
  const payment = settings.payment;
  return `
    <label class="settings-input-field">
      <span>Fatura ünvanı</span>
      <input id="settings-payment-invoice-title" type="text" value="${escapeHtml(payment.invoiceTitle)}" />
    </label>
    <div class="settings-form-grid">
      <label class="settings-input-field">
        <span>Vergi dairesi</span>
        <input id="settings-payment-tax-office" type="text" value="${escapeHtml(payment.taxOffice)}" />
      </label>
      <label class="settings-input-field">
        <span>Vergi numarası</span>
        <input id="settings-payment-tax-number" type="text" value="${escapeHtml(payment.taxNumber)}" />
      </label>
    </div>
    <label class="settings-input-field">
      <span>IBAN</span>
      <input id="settings-payment-iban" type="text" value="${escapeHtml(payment.iban)}" placeholder="TR..." />
    </label>
    <label class="settings-select-field">
      <span>Ödeme yöntemi</span>
      <select id="settings-payment-method">
        ${[
            "Ön ödeme",
            "Tam online ödeme (%7 tyee + hakediş)",
            "Sadece rezervasyon (ay sonu FAST)",
          ]
          .map((option) => `<option ${option === payment.paymentMethod ? "selected" : ""}>${option}</option>`)
          .join("")}
      </select>
    </label>
    ${includeSave ? settingsSaveMarkup() : ""}
  `;
}

function renderContractSettings(settings, includeSave = true) {
  const contracts = settings.contracts;
  return `
    <section class="contract-hero">
      <div>
        <span>İşletme sözleşmesi taslağı</span>
        <h3>tyee işletme kullanım ve rezervasyon aracılık sözleşmesi</h3>
        <p>Ödeme, komisyon, KVKK, iptal, raporlama, kalite, askıya alma ve uyuşmazlık maddeleri tek metinde toplandı.</p>
      </div>
      <strong>${escapeHtml(BUSINESS_CONTRACT_VERSION)}</strong>
    </section>
    <div class="contract-summary-grid">
      <div>
        <strong>%7</strong>
        <span>Varsayılan platform payı</span>
      </div>
      <div>
        <strong>3 model</strong>
        <span>Ön ödeme, tam online, sadece rezervasyon</span>
      </div>
      <div>
        <strong>15 gün</strong>
        <span>Ay sonu FAST ödeme süresi</span>
      </div>
      <div>
        <strong>KVKK</strong>
        <span>Veri ve ticari ileti yükümlülüğü</span>
      </div>
    </div>
    <article class="business-contract-reader" aria-label="İşletme sözleşmesi metni">
      ${BUSINESS_CONTRACT_SECTIONS.map(
        (section) => `
          <section>
            <h4>${escapeHtml(section.title)}</h4>
            ${section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </section>
        `,
      ).join("")}
    </article>
    <div class="settings-question">
      <strong>Sözleşme durumları</strong>
      <label class="settings-radio">
        <input id="settings-contract-terms" type="checkbox" ${contracts.termsAccepted ? "checked" : ""} />
        <span>İşletme kullanım ve rezervasyon aracılık sözleşmesi okundu, onaylandı</span>
      </label>
      <label class="settings-radio">
        <input id="settings-contract-kvkk" type="checkbox" ${contracts.kvkkAccepted ? "checked" : ""} />
        <span>KVKK, veri güvenliği ve ticari ileti yükümlülükleri onaylandı</span>
      </label>
    </div>
    <label class="settings-input-field">
      <span>Sözleşme / evrak notu</span>
      <textarea id="settings-contract-notes" rows="5" placeholder="Eksik evrak, özel madde veya takip notu">${escapeHtml(contracts.notes)}</textarea>
    </label>
    ${includeSave ? settingsSaveMarkup() : ""}
  `;
}

function settingsSaveMarkup() {
  return `
    <div class="settings-save-row">
      <button class="solid-button" data-settings-save type="button">Ayarları kaydet</button>
      <span class="venue-save-status" data-settings-status></span>
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
      <input data-profile-field="fullName" type="text" value="${escapeHtml(profile.fullName)}" />
    </label>
    <label class="profile-field">
      <span>Cep Telefonu Numaranız</span>
      <input data-profile-field="phone" type="text" value="${escapeHtml(profile.phone)}" />
    </label>
    <label class="profile-field">
      <span>Eposta Adresiniz</span>
      <input data-profile-field="email" type="email" value="${escapeHtml(profile.email)}" />
    </label>
    <label class="profile-field">
      <span>TC Kimlik Numaranız</span>
      <input data-profile-field="identityNumber" type="text" value="${escapeHtml(profile.identityNumber)}" />
    </label>
    <label class="profile-field profile-field-wide">
      <span>Doğum Tarihiniz</span>
      <input data-profile-field="birthDate" type="text" value="${escapeHtml(profile.birthDate)}" />
    </label>
    <div class="profile-save-row">
      <button class="solid-button" data-profile-save type="button">Profili kaydet</button>
      <span class="venue-save-status" data-profile-status></span>
    </div>
  `;
}

function renderReviews(items, summary = {}) {
  const average = summary.average || "-";
  const total = Number(summary.total || items.length || 0);
  const waitingRequests = Number(summary.waitingRequests || 0);

  if (!items.length) {
    reviewsShell.innerHTML = `
      <div class="reviews-summary-grid">
        <article class="review-score-card">
          <span>Ortalama puan</span>
          <strong>${average}</strong>
          <small>${total} yorum</small>
        </article>
        <article class="review-score-card">
          <span>Bekleyen anket</span>
          <strong>${waitingRequests}</strong>
          <small>Tamamlanan rezervasyon sonrası</small>
        </article>
      </div>
      <div class="review-request-note">
        <strong>Kısa anket akışı</strong>
        <p>Rezervasyon hizmeti tamamlanınca işletme işlemi kapatır. Ardından bireysel müşteriye memnuniyet bildirimi gider; puan ve not bıraktığında yorum burada listelenir.</p>
      </div>
      <div class="reviews-empty-state">
        <h3>Henüz değerlendirme yok</h3>
        <p>Tamamlanan rezervasyonlardan sonra gelen puanlar ve kısa yorumlar bu alanda görünecek.</p>
      </div>
    `;
    return;
  }

  reviewsShell.innerHTML = `
    <div class="reviews-summary-grid">
      <article class="review-score-card">
        <span>Ortalama puan</span>
        <strong>${average}</strong>
        <small>${total} yorum</small>
      </article>
      <article class="review-score-card">
        <span>Bekleyen anket</span>
        <strong>${waitingRequests}</strong>
        <small>Tamamlanan rezervasyon sonrası</small>
      </article>
    </div>
    <div class="review-request-note">
      <strong>Kısa anket akışı</strong>
      <p>Rezervasyon hizmeti tamamlanınca işletme işlemi kapatır. Ardından bireysel müşteriye memnuniyet bildirimi gider; puan ve not bıraktığında yorum burada listelenir.</p>
    </div>
    <div class="reviews-list">
      ${items
        .map(
          (item) => `
            <article class="review-card">
              <div class="review-card-head">
                <div>
                  <strong>${escapeHtml(item.author)}</strong>
                  <small>${escapeHtml(item.service || "Rezervasyon")} · ${escapeHtml(item.date)}</small>
                </div>
                <span>${escapeHtml(item.rating)}/5</span>
              </div>
              <p>${escapeHtml(item.comment)}</p>
              <div class="review-card-meta">
                <span>${escapeHtml(item.status || "Yayınlandı")}</span>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
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

function collectSettingsPayload() {
  const current = normalizeSettings(venueState.dashboard.settings);
  const valueOf = (selector) => document.querySelector(selector)?.value.trim() || "";
  const checked = (selector) => Boolean(document.querySelector(selector)?.checked);
  const next = { ...current };

  if (venueState.activeSettingsTab === "İşletme Bilgileri") {
    next.businessName = valueOf("#settings-business-name");
    next.selects = (current.selects || []).map((item) =>
      item.label === "İşletme Tipi" ? { ...item, value: valueOf("#settings-detail-category") || item.value } : item,
    );
    next.contact = {
      authorizedName: valueOf("#settings-contact-authorized-name"),
      phone: valueOf("#settings-contact-phone"),
      whatsapp: valueOf("#settings-contact-whatsapp"),
      email: valueOf("#settings-contact-email"),
      website: valueOf("#settings-contact-website"),
      instagram: valueOf("#settings-contact-instagram"),
    };
    const hasLocation = Boolean(valueOf("#settings-location-address") || (valueOf("#settings-location-lat") && valueOf("#settings-location-lng")));
    next.locationStatus = hasLocation ? "Girilmiş" : "Girilmemiş";
    next.location = {
      ...(current.location || {}),
      address: valueOf("#settings-location-address"),
      lat: valueOf("#settings-location-lat"),
      lng: valueOf("#settings-location-lng"),
      mapUrl: valueOf("#settings-location-map-url"),
    };
    next.details = {
      category: valueOf("#settings-detail-category"),
      district: valueOf("#settings-detail-district"),
      description: valueOf("#settings-detail-description"),
      workingHours: valueOf("#settings-detail-working-hours"),
      cancellationPolicy: valueOf("#settings-detail-cancellation"),
    };
    next.media = {
      ...current.media,
      logoUrl: valueOf("#settings-media-logo-url"),
      coverUrl: valueOf("#settings-media-cover-url"),
    };
    next.facilities = (current.facilities || FACILITY_FEATURES).map((item) => ({
      ...item,
      enabled: checked(`[data-facility-id="${item.id}"]`),
    }));
    next.areas = Array.from(document.querySelectorAll("[data-area-card]")).map((card) => {
      const index = card.dataset.areaCard;
      return {
        name: valueOf(`[data-area-name="${index}"]`),
        type: valueOf(`[data-area-type="${index}"]`),
        capacity: valueOf(`[data-area-capacity="${index}"]`),
        price: valueOf(`[data-area-price="${index}"]`),
        isActive: checked(`[data-area-active="${index}"]`),
      };
    });
  }

  if (venueState.activeSettingsTab === "Ödeme & Sözleşme") {
    next.payment = {
      invoiceTitle: valueOf("#settings-payment-invoice-title"),
      taxOffice: valueOf("#settings-payment-tax-office"),
      taxNumber: valueOf("#settings-payment-tax-number"),
      iban: valueOf("#settings-payment-iban"),
      paymentMethod: valueOf("#settings-payment-method"),
    };
    next.contracts = {
      termsAccepted: checked("#settings-contract-terms"),
      kvkkAccepted: checked("#settings-contract-kvkk"),
      notes: valueOf("#settings-contract-notes"),
    };
  }

  return normalizeSettings(next);
}

function collectProfilePayload() {
  return Array.from(document.querySelectorAll("[data-profile-field]")).reduce((payload, input) => {
    payload[input.dataset.profileField] = input.value.trim();
    return payload;
  }, {});
}

function setSaveStatus(selector, message, isError = false) {
  const node = document.querySelector(selector);
  if (!node) return;
  node.textContent = message;
  node.classList.toggle("is-error", isError);
}

function setView(viewId) {
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === viewId && !item.dataset.action);
  });
  sections.forEach((section) => section.classList.toggle("hidden", section.id !== `${viewId}-view`));
}

function setNavGroupOpen(activeGroup) {
  navGroups.forEach((group) => {
    const shouldOpen = group === activeGroup && !group.classList.contains("is-open");
    group.classList.toggle("is-open", shouldOpen);
    group.querySelector(".venue-nav-heading")?.setAttribute("aria-expanded", String(shouldOpen));
  });
}

function imageFileToGalleryItem(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 900;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({
          name: file.name,
          src: canvas.toDataURL("image/jpeg", 0.76),
        });
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadVenueDashboard() {
  await requireVenueAccess();
  const response = await fetch("/api/venue/bootstrap", {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    authWall.classList.remove("hidden");
    throw new Error("İşletme paneli verisi yüklenemedi.");
  }
  const payload = await response.json();
  payload.settings = normalizeSettings(payload.settings || {});
  venueState.dashboard = payload;
  venueState.venueId = payload.id || "";
  venueState.slotModes = payload.slotState?.slotModes || {};
  venueState.manualEntries = payload.slotState?.manualEntries || {};
  venueState.slotServices = payload.slotState?.slotServices || {};

  renderVenueIdentity();
  renderSidebarSummary(payload);

  renderStats(payload.stats);
  renderOverview(payload);
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
  renderReviews(payload.reviews || [], payload.reviewSummary || {});
  renderBillingAddresses(payload.billingAddresses || []);
  loadVenueReport().catch((error) => {
    if (venueReportDocument) {
      venueReportDocument.innerHTML = `<span class="empty-copy">${escapeHtml(error.message)}</span>`;
    }
  });
}

function bindVenueInteractions() {
  navGroupTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const group = trigger.closest(".venue-nav-group");
      if (group) setNavGroupOpen(group);
    });
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (item.dataset.action === "logout") {
        localStorage.removeItem("tyee_token");
        window.location.href = "/index.html";
        return;
      }

      const target = item.dataset.view;
      if (target) setView(target);
    });
  });

  calendarBoardSecondary?.addEventListener("click", (event) => {
    if (!venueState.dashboard) return;

    const serviceOption = event.target.closest("[data-slot-service]");
    if (serviceOption) {
      event.stopPropagation();
      const slotKey = serviceOption.dataset.slotKey;
      venueState.slotServices[slotKey] = {
        name: serviceOption.dataset.serviceName || "Ana alan",
        type: serviceOption.dataset.serviceType || "Hizmet alanı",
        capacity: serviceOption.dataset.serviceCapacity || "",
      };
      venueState.slotModes[slotKey] = "rezerv";
      renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
      saveSlotState().catch((error) => {
        console.error(error);
      });
      return;
    }

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
        return;
      }
      venueState.slotModes[option.dataset.slotKey] =
        nextMode === "rezerv" ? "rezerv" : nextMode;
      if (nextMode === "rezerv") {
        venueState.slotServices[option.dataset.slotKey] = getSlotServiceInfo(option.dataset.slotKey);
      }
      venueState.selectedSlotKey = "";
      renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
      saveSlotState().catch((error) => {
        console.error(error);
      });
      return;
    }

    const cell = event.target.closest(".schedule-slot-cell");
    if (!cell) return;

    venueState.selectedSlotKey =
      venueState.selectedSlotKey === cell.dataset.slotKey ? "" : cell.dataset.slotKey;
    renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".schedule-slot-cell") && venueState.dashboard) {
      if (venueState.selectedSlotKey) {
        venueState.selectedSlotKey = "";
        renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
      }
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

  newSubscriptionButton?.addEventListener("click", () => {
    openSalesModal(null, "19:00", "", { isSubscription: true });
  });

  refreshVenueReport?.addEventListener("click", () => {
    loadVenueReport().catch((error) => {
      if (venueReportDocument) {
        venueReportDocument.innerHTML = `<span class="empty-copy">${escapeHtml(error.message)}</span>`;
      }
    });
  });

  venueReportPeriod?.addEventListener("change", () => {
    loadVenueReport().catch((error) => {
      if (venueReportDocument) {
        venueReportDocument.innerHTML = `<span class="empty-copy">${escapeHtml(error.message)}</span>`;
      }
    });
  });

  transactionsBody?.addEventListener("click", async (event) => {
    const completeButton = event.target.closest("[data-complete-reservation]");
    if (!completeButton || !venueState.dashboard) return;

    completeButton.disabled = true;
    completeButton.textContent = "Kapanıyor...";
    try {
      const payload = await venueApiRequest(
        `/api/venue/reservations/${completeButton.dataset.completeReservation}/complete`,
        {
          method: "POST",
          body: JSON.stringify({ venueId: venueState.venueId }),
        },
      );

      venueState.dashboard.transactions = (venueState.dashboard.transactions || []).map((item) =>
        item.reservationId === payload.transaction.reservationId ? payload.transaction : item,
      );
      venueState.dashboard.reviews = payload.reviews || venueState.dashboard.reviews || [];
      venueState.dashboard.reviewSummary = payload.reviewSummary || venueState.dashboard.reviewSummary || {};
      renderTransactions(venueState.dashboard.transactions);
      renderReviews(venueState.dashboard.reviews, venueState.dashboard.reviewSummary);
      loadVenueReport().catch(() => null);
    } catch (error) {
      completeButton.disabled = false;
      completeButton.textContent = error.message || "Hata";
    }
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
    } else if (salesSubscription.checked) {
      addSubscriptionFromSalesModal();
    }
    if (venueState.dashboard) {
      renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
    }
    saveSlotState().catch((error) => {
      console.error(error);
    });
    closeSalesModal();
  });

  settingsTabs?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-settings-tab]");
    if (!tab || !venueState.dashboard) return;
    venueState.dashboard.settings = collectSettingsPayload();
    venueState.activeSettingsTab = tab.dataset.settingsTab;
    renderSettingsTabs(venueState.dashboard.settings.tabs);
    renderSettingsOnboarding(venueState.dashboard.settings);
  });

  settingsOnboardingForm?.addEventListener("click", async (event) => {
    const removeMediaButton = event.target.closest("[data-media-remove]");
    if (removeMediaButton && venueState.dashboard) {
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      settings.media.gallery.splice(Number(removeMediaButton.dataset.mediaRemove), 1);
      venueState.dashboard.settings = settings;
      renderSettingsOnboarding(settings);
      return;
    }

    const addAreaButton = event.target.closest("[data-area-add]");
    if (addAreaButton && venueState.dashboard) {
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      settings.areas.push({
        name: `Alan ${settings.areas.length + 1}`,
        type: "Saha / oda / masa",
        capacity: "",
        price: "",
        isActive: true,
      });
      venueState.dashboard.settings = settings;
      renderSettingsOnboarding(settings);
      return;
    }

    const button = event.target.closest("[data-settings-save]");
    if (!button || !venueState.dashboard) return;

    setSaveStatus("[data-settings-status]", "Kaydediliyor...");
    try {
      const settings = collectSettingsPayload();
      const payload = await venueApiRequest("/api/venue/settings", {
        method: "PATCH",
        body: JSON.stringify({ venueId: venueState.venueId, settings }),
      });
      venueState.dashboard.settings = normalizeSettings(payload.settings);
      renderVenueIdentity();
      renderSettingsTabs(venueState.dashboard.settings.tabs);
      renderSettingsOnboarding(venueState.dashboard.settings);
      renderTransactions(venueState.dashboard.transactions || []);
      setSaveStatus("[data-settings-status]", "Kaydedildi");
    } catch (error) {
      setSaveStatus("[data-settings-status]", error.message, true);
    }
  });

  settingsOnboardingForm?.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-media-upload]");
    if (!input || !venueState.dashboard || !input.files?.length) return;

    setSaveStatus("[data-settings-status]", "Görsel hazırlanıyor...");
    try {
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      const files = Array.from(input.files).filter((file) => file.type.startsWith("image/"));
      const nextImages = await Promise.all(files.map(imageFileToGalleryItem));
      settings.media.gallery = [...settings.media.gallery, ...nextImages];
      venueState.dashboard.settings = settings;
      renderSettingsOnboarding(settings);
      setSaveStatus("[data-settings-status]", "Görsel eklendi. Kaydetmeyi unutma.");
    } catch (error) {
      setSaveStatus("[data-settings-status]", "Görsel eklenemedi.", true);
    }
  });

  profileFormGrid?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-profile-save]");
    if (!button || !venueState.dashboard) return;

    setSaveStatus("[data-profile-status]", "Kaydediliyor...");
    try {
      const profile = collectProfilePayload();
      const payload = await venueApiRequest("/api/venue/profile", {
        method: "PATCH",
        body: JSON.stringify({ venueId: venueState.venueId, profile }),
      });
      venueState.dashboard.profile = payload.profile;
      renderProfile(payload.profile);
      setSaveStatus("[data-profile-status]", "Kaydedildi");
    } catch (error) {
      setSaveStatus("[data-profile-status]", error.message, true);
    }
  });

  billingAddButton?.addEventListener("click", async () => {
    if (!venueState.dashboard) return;

    const label = window.prompt("Adres adı", "Merkez fatura adresi");
    if (!label) return;

    const address = window.prompt("Açık adres", "");
    if (address === null) return;

    try {
      const payload = await venueApiRequest("/api/venue/billing-addresses", {
        method: "POST",
        body: JSON.stringify({
          venueId: venueState.venueId,
          label,
          address,
          type: "Kurumsal",
          city: "İstanbul",
          name: venueState.dashboard.venue?.name || "",
        }),
      });
      venueState.dashboard.billingAddresses = payload.billingAddresses;
      renderBillingAddresses(payload.billingAddresses);
    } catch (error) {
      window.alert(error.message);
    }
  });
}

bindVenueInteractions();

loadVenueDashboard().catch((error) => {
  console.error(error);
  if (!venueState.dashboard) {
    venueTitle.textContent = "Panel yüklenemedi";
  }
});
