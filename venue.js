const venueTitle = document.querySelector("#venue-title");
const venueTopbarSubtitle = document.querySelector("#venue-topbar-subtitle");
const venueAvatar = document.querySelector("#venue-avatar");
const venueName = document.querySelector("#venue-name");
const venueBranch = document.querySelector("#venue-branch");
const venueGlobalAccount = document.querySelector("#venue-global-account");
const venueGlobalAvatar = document.querySelector("#venue-global-avatar");
const venueGlobalAccountLabel = document.querySelector("#venue-global-account-label");
const statGrid = document.querySelector("#stat-grid");
const quickActions = document.querySelector("#quick-actions");
const calendarBoardSecondary = document.querySelector("#calendar-board-secondary");
const calendarFieldPills = document.querySelector("#calendar-field-pills");
const calendarOpsStrip = document.querySelector("#calendar-ops-strip");
const salesProductsLayout = document.querySelector("#sales-products-layout");
const crmSummaryGrid = document.querySelector("#crm-summary-grid");
const crmCustomerList = document.querySelector("#crm-customer-list");
const crmCustomerFocus = document.querySelector("#crm-customer-focus");
const campaignsKpiGrid = document.querySelector("#campaigns-kpi-grid");
const campaignsBoard = document.querySelector("#campaigns-board");
const financeKpiGrid = document.querySelector("#finance-kpi-grid");
const financeCardStack = document.querySelector("#finance-card-stack");
const financePnlShell = document.querySelector("#finance-pnl-shell");
const financeExpenseAdd = document.querySelector("#finance-expense-add");
const weekRange = document.querySelector("#week-range");
const weekTodayButton = document.querySelector("#week-today");
const weekPrevButton = document.querySelector("#week-prev");
const weekNextButton = document.querySelector("#week-next");
const weekNextMonthButton = document.querySelector("#week-next-month");
const calendarNewAppointment = document.querySelector("#calendar-new-appointment");
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
const goCalendarButton = document.querySelector("#go-calendar-button");
const subscriptionsBody = document.querySelector("#subscriptions-body");
const newSubscriptionButton = document.querySelector("#new-subscription-button");
const transactionsBody = document.querySelector("#transactions-body");
const venueGuidesChecklist = document.querySelector("#venue-guides-checklist");
const venueSidebarGuide = document.querySelector("#venue-sidebar-guide");
const venueSetupProgress = document.querySelector("#venue-setup-progress");
const venueNextAppointments = document.querySelector("#venue-next-appointments");
const venueWaitlist = document.querySelector("#venue-waitlist");
const venueOpsNotes = document.querySelector("#venue-ops-notes");
const venueSideRail = document.querySelector("#venue-side-rail");
const workspaceFlow = document.querySelector("#workspace-flow");
const appointmentDrawer = document.querySelector("#appointment-drawer");
const appointmentDrawerClose = document.querySelector("#appointment-drawer-close");
const appointmentDrawerDismiss = document.querySelector("#appointment-drawer-dismiss");
const appointmentDrawerTitle = document.querySelector("#appointment-drawer-title");
const appointmentDrawerBody = document.querySelector("#appointment-drawer-body");
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
const adaAssistant = document.querySelector("#ada-assistant");
const adaLauncher = document.querySelector("#ada-launcher");
const adaLauncherHint = document.querySelector("#ada-launcher-hint");
const adaPanel = document.querySelector("#ada-panel");
const adaClose = document.querySelector("#ada-close");
const adaSpeech = document.querySelector("#ada-speech");
const adaActions = document.querySelector("#ada-actions");
const adaChatLog = document.querySelector("#ada-chat-log");
const adaChatForm = document.querySelector("#ada-chat-form");
const adaChatInput = document.querySelector("#ada-chat-input");
const adaLiveButton = document.querySelector("#ada-live-button");
const adaStage = document.querySelector("#ada-stage");
const adaDefaultStageMarkup = adaStage?.innerHTML || "";
const adaStatus = document.querySelector("#ada-status");
const adaStatusTitle = document.querySelector("#ada-status-title");
const setupRoadmap = document.querySelector(".venue-setup-roadmap");
const setupRoadmapToggle = document.querySelector("[data-setup-roadmap-toggle]");
const navGroups = document.querySelectorAll(".venue-nav-group");
const navGroupTriggers = document.querySelectorAll(".venue-nav-heading");
const navItems = document.querySelectorAll(".venue-nav-item");
const sections = document.querySelectorAll(".view-section");
const authWall = document.querySelector("#venue-auth-wall");
const sessionRecoveryStorageKey = "tyee_session_recovery_v1";
const venueBackupStorageKey = "tyee_venue_backup_v1";

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
  activeAppointment: null,
  selectedServiceIndex: 0,
  selectedServiceCategory: "all",
  serviceSearch: "",
  customerSubview: "list",
  selectedCustomerIndex: 0,
  customerSearch: "",
  calendarFilter: "all",
  calendarTeam: "all",
  setupRoadmapOpen: false,
  pendingFacilitySelections: {},
  adaOpen: false,
  adaInsights: [],
  campaignDraft: null,
  campaignFeedback: "",
  campaignSending: false,
};

let venueToastTimer = null;

const VENUE_GALLERY_LIMIT = 6;
const VENUE_GALLERY_ROLES = [
  "Dış görünüş",
  "Dükkan içi",
  "Çalışanlar",
  "Hizmet alanı",
  "Bekleme alanı",
  "Detay",
];

const VIEW_META = {
  overview: {
    title: "Kontrol Merkezi",
    subtitle: "Günün durumu, boş saatler ve işletmenin kısa performans özeti.",
    railVisible: false,
  },
  calendar: {
    title: "Takvim",
    subtitle: "Rezervasyon, müsaitlik, müşteri ve checkout akışının başladığı ana operasyon ekranı.",
    railVisible: false,
  },
  transactions: {
    title: "Checkout & Satış",
    subtitle: "Kapora, kalan ödeme, satış kapanışı ve rezervasyondan tahsilata giden akış.",
    railVisible: false,
  },
  customers: {
    title: "Müşteriler",
    subtitle: "Müşteri kartları, ziyaret geçmişi, notlar ve tekrar rezervasyon fırsatları.",
    railVisible: false,
  },
  "sales-products": {
    title: "Hizmet Menüsü",
    subtitle: "Rezervasyona açılan hizmetlerin fiyat, süre, kapora ve görünürlük ayarları.",
    railVisible: false,
  },
  campaigns: {
    title: "Pazarlama",
    subtitle: "Geri çağırma, hatırlatma ve müşteri tekrarını artıran kampanya akışları.",
    railVisible: false,
  },
  subscriptions: {
    title: "Üyelikler",
    subtitle: "Aktif üyelikler, kullanım hakları ve tekrar eden gelir tarafı.",
    railVisible: false,
  },
  finance: {
    title: "Performans",
    subtitle: "Ciro, gider, net görünüm ve işletmenin ekonomik fotoğrafı.",
    railVisible: false,
  },
  reviews: {
    title: "Değerlendirmeler",
    subtitle: "Puanlar, yorumlar ve müşteri memnuniyetini etkileyen sinyaller.",
    railVisible: false,
  },
  reports: {
    title: "Raporlar",
    subtitle: "İşletme sahibinin hızlıca okuyacağı yönetici görünümü ve dönemsel çıktılar.",
    railVisible: false,
  },
  settings: {
    title: "İşletme Ayarları",
    subtitle: "Profil, çalışma saatleri, ödeme modeli ve temel işletme kurgusu.",
    railVisible: false,
  },
};

const venueCampaignKpis = [
  { label: "Aktif akış", value: "6", meta: "3 otomatik, 3 manuel" },
  { label: "Geri kazanılan müşteri", value: "38", meta: "Son 30 gün" },
  { label: "Kampanya cirosu", value: "₺0", meta: "Henüz kampanya satışı yok" },
  { label: "Mesaj teslim oranı", value: "%93", meta: "WhatsApp + SMS" },
];

const venueCampaignFlows = [
  {
    title: "No-show sonrası geri çağırma",
    channel: "WhatsApp",
    status: "Aktif",
    detail: "48 saat içinde hatırlatma ve yüzde 10 dönüş kampanyası",
  },
  {
    title: "30 gün gelmeyen müşteriler",
    channel: "SMS",
    status: "Hazır",
    detail: "Eski müşterilere boş saat kampanyası",
  },
  {
    title: "Doğum günü sadakat akışı",
    channel: "WhatsApp",
    status: "Aktif",
    detail: "Kişisel mesaj + ekstra avantaj kodu",
  },
  {
    title: "İlk ziyaretten 7 gün sonra tekrar çağırma",
    channel: "E-posta",
    status: "Taslak",
    detail: "İlk deneyim sonrası ikinci rezervasyonu tetikleme",
  },
];

const venueOperationalNotes = [
  {
    title: "Akşam prime-time doluluğu",
    body: "18:00 sonrası slotların çoğu hızlı doluyor. Boş kalan saha veya personel saatleri için erken gün içi kampanya açılabilir.",
  },
  {
    title: "Kapora ve kalan tahsilat dengesi",
    body: "Kaporalı rezervasyonları checkout akışına bağlı tut. Açık hesap ve tesiste ödeme kalanlarını aynı panelden takip et.",
  },
  {
    title: "Müşteri kartını rezervasyonun merkezine al",
    body: "Tekrar gelen müşterilerde notlar, son hizmet ve harcama geçmişi görünür kalmalı. Operasyon bağımlılığı burada oluşur.",
  },
];

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
function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);
  return start;
}

const BASE_WEEK_START = getWeekStart();
const DEFAULT_SETTINGS_TABS = [
  "İşletme Bilgileri",
  "Sektör Modülleri",
  "Ödeme & Sözleşme",
];

const BUSINESS_CATEGORY_OPTIONS = [
  "Restoran",
  "Dövmeci",
  "Pet Kuaför",
  "Bayan Kuaför",
  "Erkek Berber",
  "Kadın Güzellik Merkezi",
  "Güzellik Merkezi",
  "Halı Saha",
  "Tenis Kortu",
  "Tenis Hocası",
  "Yoga & Pilates",
  "Padel Kort",
  "Direksiyon Dersi",
  "Özel Ders",
  "Masaj & Spa",
  "Diğer",
];

const OPERATION_MODULES = [
  {
    id: "marketplace-profile",
    label: "Marketplace profili",
    description: "Konum, görsel, yorum, kategori ve rezervasyon görünürlüğü.",
  },
  {
    id: "service-menu",
    label: "Hizmet menüsü",
    description: "Hizmet, süre, fiyat, varyant, eklenti ve satışa açıklık.",
  },
  {
    id: "availability-calendar",
    label: "Takvim & müsaitlik",
    description: "Slot, vardiya, blok saat, online rezervasyon ve operasyon takibi.",
  },
  {
    id: "resource-booking",
    label: "Kaynak rezervasyonu",
    description: "Masa, kort, saha, koltuk, oda, cihaz veya stüdyo çakışmasını önleme.",
  },
  {
    id: "team-scheduling",
    label: "Ekip / uzman planı",
    description: "Berber, sanatçı, eğitmen, terapist veya garson ekip uygunluğu.",
  },
  {
    id: "client-crm",
    label: "Müşteri CRM",
    description: "Profil, ziyaret geçmişi, not, tercih, pet/sağlık/alışkanlık bilgisi.",
  },
  {
    id: "forms-waivers",
    label: "Form & onam",
    description: "KVKK, sağlık beyanı, dövme onamı, patch test veya pet bakım notu.",
  },
  {
    id: "deposit-cancellation",
    label: "Kapora & iptal kuralı",
    description: "No-show riskini azaltan depozito, iade ve son dakika iptal politikası.",
  },
  {
    id: "checkout-payments",
    label: "Checkout & ödeme",
    description: "Online ödeme, tesiste ödeme, kalan tahsilat, indirim ve makbuz.",
  },
  {
    id: "group-sessions",
    label: "Grup seansı / sınıf",
    description: "Yoga dersi, tenis grup dersi, takım rezervasyonu veya kontenjanlı etkinlik.",
  },
  {
    id: "packages-memberships",
    label: "Paket / üyelik",
    description: "Seans paketi, aylık üyelik, abonelik, prepaid hak ve tekrar gelir.",
  },
  {
    id: "inventory",
    label: "Stok & ürün",
    description: "Sarf malzeme, ürün satışı, düşük stok, tedarik ve tüketim takibi.",
  },
  {
    id: "messaging",
    label: "Mesaj & bildirim",
    description: "Randevu hatırlatma, bekleme listesi, değişiklik ve geri çağırma mesajları.",
  },
  {
    id: "reviews",
    label: "Yorum & puan",
    description: "Rezervasyon sonrası değerlendirme, kalite takibi ve marketplace güveni.",
  },
  {
    id: "reports",
    label: "Raporlar",
    description: "Ciro, doluluk, personel, kanal, müşteri ve operasyon performansı.",
  },
  {
    id: "portfolio-media",
    label: "Portfolyo & medya",
    description: "Dövme, güzellik, pet bakım ve mekan görselleriyle dönüşüm artırma.",
  },
  {
    id: "waitlist",
    label: "Bekleme listesi",
    description: "Dolulukta alternatif saat, iptal yakalama ve boş slot doldurma.",
  },
];

const INDUSTRY_PRESETS = [
  {
    id: "restoran",
    label: "Restoran",
    aliases: ["restoran", "restaurant", "lokanta", "cafe", "kafe"],
    primaryObject: "Masa rezervasyonu",
    resourceLabel: "Masa / salon",
    teamLabel: "Servis ekibi",
    capacityUnit: "Kişi",
    bookingMode: "Masa, saat ve kişi sayısı",
    depositRule: "Kalabalık masa veya yoğun saat için kapora opsiyonel",
    requiredForms: "Alerji / özel not opsiyonel",
    notes: "Restoran için temel fark masa çakışmasını önlemek ve no-show riskini yönetmek.",
    requiredModules: [
      "marketplace-profile",
      "availability-calendar",
      "resource-booking",
      "client-crm",
      "deposit-cancellation",
      "checkout-payments",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["service-menu", "packages-memberships", "inventory", "waitlist"],
  },
  {
    id: "dovmeci",
    label: "Dövmeci",
    aliases: ["dovmeci", "dövmeci", "tattoo", "tattoo studio"],
    primaryObject: "Danışma / dövme randevusu",
    resourceLabel: "Sanatçı koltuğu / steril oda",
    teamLabel: "Sanatçı",
    capacityUnit: "Kişi",
    bookingMode: "Sanatçı, seans süresi ve danışma notu",
    depositRule: "Randevu kesinleşmesi için kapora zorunlu önerilir",
    requiredForms: "KVKK, yaş beyanı, sağlık/onam formu",
    notes: "Dövme stüdyosunda portfolyo, onam ve kapora ana güvenlik hattıdır.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "resource-booking",
      "team-scheduling",
      "client-crm",
      "forms-waivers",
      "deposit-cancellation",
      "checkout-payments",
      "messaging",
      "reviews",
      "reports",
      "portfolio-media",
    ],
    optionalModules: ["inventory", "waitlist"],
  },
  {
    id: "pet-kuafor",
    label: "Pet Kuaför",
    aliases: ["pet kuafor", "pet kuaför", "pet", "kedi", "kopek", "köpek"],
    primaryObject: "Pet bakım randevusu",
    resourceLabel: "Bakım masası / yıkama alanı",
    teamLabel: "Bakım uzmanı",
    capacityUnit: "Pet",
    bookingMode: "Pet türü, boyutu, hizmet ve süre",
    depositRule: "Uzun bakım veya yoğun günlerde kapora önerilir",
    requiredForms: "Pet davranış/sağlık notu, teslim alma notu",
    notes: "Pet kuaförde müşteri kartı kadar pet profili ve özel bakım notu önemlidir.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "resource-booking",
      "team-scheduling",
      "client-crm",
      "forms-waivers",
      "deposit-cancellation",
      "checkout-payments",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["inventory", "packages-memberships", "portfolio-media", "waitlist"],
  },
  {
    id: "bayan-kuafor",
    label: "Bayan Kuaför",
    aliases: ["bayan kuafor", "bayan kuaför", "kadin kuafor", "kadın kuaför", "hair salon"],
    primaryObject: "Koltuk / stilist randevusu",
    resourceLabel: "Koltuk / bakım alanı",
    teamLabel: "Stilist",
    capacityUnit: "Kişi",
    bookingMode: "Stilist, hizmet, süre ve bakım notu",
    depositRule: "Boya, ombre ve uzun uygulamalarda kapora önerilir",
    requiredForms: "Müşteri tercih notu, alerji/patch test notu opsiyonel",
    notes: "Bayan kuaförde stilist takvimi, hizmet süresi ve işlem geçmişi birlikte yönetilmeli.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "resource-booking",
      "team-scheduling",
      "client-crm",
      "forms-waivers",
      "deposit-cancellation",
      "checkout-payments",
      "packages-memberships",
      "messaging",
      "reviews",
      "reports",
      "portfolio-media",
    ],
    optionalModules: ["inventory", "waitlist"],
  },
  {
    id: "erkek-kuafor",
    label: "Erkek Berber",
    aliases: ["erkek kuafor", "erkek kuaför", "erkek berber", "berber", "barber"],
    primaryObject: "Koltuk / uzman randevusu",
    resourceLabel: "Koltuk",
    teamLabel: "Berber",
    capacityUnit: "Kişi",
    bookingMode: "Uzman, hizmet ve kısa slot",
    depositRule: "No-show yoğun ise düşük kapora opsiyonel",
    requiredForms: "Müşteri tercih notu opsiyonel",
    notes: "Berber akışında hız, tekrar rezervasyon ve paket sadakati öne çıkar.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "resource-booking",
      "team-scheduling",
      "client-crm",
      "checkout-payments",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["packages-memberships", "inventory", "waitlist"],
  },
  {
    id: "kadin-guzellik",
    label: "Kadın Güzellik Merkezi",
    aliases: ["kadin guzellik", "kadın güzellik", "guzellik merkezi", "güzellik merkezi", "beauty", "nail", "tırnak"],
    primaryObject: "Bakım / uygulama randevusu",
    resourceLabel: "Oda / cihaz / koltuk",
    teamLabel: "Uzman",
    capacityUnit: "Kişi",
    bookingMode: "Uzman, oda/cihaz, hizmet ve süre",
    depositRule: "Uzun uygulama ve cihaz kullanımı için kapora önerilir",
    requiredForms: "KVKK, sağlık beyanı, patch test/onam",
    notes: "Güzellik merkezinde oda, cihaz, uzman ve onam formu birlikte yönetilmeli.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "resource-booking",
      "team-scheduling",
      "client-crm",
      "forms-waivers",
      "deposit-cancellation",
      "checkout-payments",
      "packages-memberships",
      "messaging",
      "reviews",
      "reports",
      "portfolio-media",
    ],
    optionalModules: ["inventory", "waitlist"],
  },
  {
    id: "hali-saha",
    label: "Halı Saha",
    aliases: ["hali saha", "halı saha", "futbol", "saha"],
    primaryObject: "Saha rezervasyonu",
    resourceLabel: "Saha",
    teamLabel: "Operasyon ekibi",
    capacityUnit: "Takım / kişi",
    bookingMode: "Saha, saat, süre ve takım bilgisi",
    depositRule: "Prime-time saha için kapora zorunlu önerilir",
    requiredForms: "Takım kaptanı ve telefon bilgisi",
    notes: "Halı sahada kaynak çakışması, kapora ve bekleme listesi ana modüldür.",
    requiredModules: [
      "marketplace-profile",
      "availability-calendar",
      "resource-booking",
      "client-crm",
      "deposit-cancellation",
      "checkout-payments",
      "group-sessions",
      "messaging",
      "reviews",
      "reports",
      "waitlist",
    ],
    optionalModules: ["packages-memberships", "service-menu", "inventory"],
  },
  {
    id: "tenis-kortu",
    label: "Tenis Kortu",
    aliases: ["tenis kortu", "tenis", "kort"],
    primaryObject: "Kort rezervasyonu",
    resourceLabel: "Kort",
    teamLabel: "Kort görevlisi / antrenör",
    capacityUnit: "Kişi",
    bookingMode: "Kort, saat, süre ve ekipman notu",
    depositRule: "Kort rezervasyonu için kapora opsiyonel",
    requiredForms: "Ekipman/partner notu opsiyonel",
    notes: "Kort işletmesinde kaynak rezervasyonu ve eğitmen opsiyonu birlikte düşünülür.",
    requiredModules: [
      "marketplace-profile",
      "availability-calendar",
      "resource-booking",
      "client-crm",
      "deposit-cancellation",
      "checkout-payments",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["team-scheduling", "group-sessions", "packages-memberships", "waitlist"],
  },
  {
    id: "tenis-hocasi",
    label: "Tenis Hocası",
    aliases: ["tenis hocasi", "tenis hocası", "tenis antrenor", "tenis antrenör"],
    primaryObject: "Ders randevusu",
    resourceLabel: "Kort / ders alanı",
    teamLabel: "Hoca",
    capacityUnit: "Kişi",
    bookingMode: "Hoca, seviye, ders süresi ve kort",
    depositRule: "Özel ders için kapora önerilir",
    requiredForms: "Seviye, hedef ve sakatlık notu",
    notes: "Hoca akışında kişi takvimi, seviye bilgisi ve paket ders satışı kritik.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "team-scheduling",
      "client-crm",
      "forms-waivers",
      "deposit-cancellation",
      "checkout-payments",
      "packages-memberships",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["resource-booking", "group-sessions", "waitlist"],
  },
  {
    id: "yoga-pilates",
    label: "Yoga & Pilates",
    aliases: ["yoga", "pilates", "yoga & pilates", "stüdyo", "studio"],
    primaryObject: "Ders / sınıf rezervasyonu",
    resourceLabel: "Stüdyo / mat kontenjanı",
    teamLabel: "Eğitmen",
    capacityUnit: "Kontenjan",
    bookingMode: "Ders, eğitmen, sınıf kapasitesi ve üyelik",
    depositRule: "Drop-in ders için ön ödeme, üyelikte hak düşümü önerilir",
    requiredForms: "Sağlık/sakatlık beyanı",
    notes: "Yoga ve pilates için grup dersleri, kapasite ve üyelik paketi olmazsa olmaz.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "resource-booking",
      "team-scheduling",
      "client-crm",
      "forms-waivers",
      "checkout-payments",
      "group-sessions",
      "packages-memberships",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["deposit-cancellation", "waitlist", "inventory"],
  },
  {
    id: "padel-kort",
    label: "Padel Kort",
    aliases: ["padel", "padel kort"],
    primaryObject: "Kort rezervasyonu",
    resourceLabel: "Kort",
    teamLabel: "Operasyon ekibi",
    capacityUnit: "Kişi",
    bookingMode: "Kort, saat, süre ve oyuncu sayısı",
    depositRule: "Prime-time kort için kapora önerilir",
    requiredForms: "Oyuncu sayısı ve ekipman notu",
    notes: "Padel akışı tenis kortuna benzer; ekipman ve grup kontenjanı daha görünür olmalı.",
    requiredModules: [
      "marketplace-profile",
      "availability-calendar",
      "resource-booking",
      "client-crm",
      "deposit-cancellation",
      "checkout-payments",
      "group-sessions",
      "messaging",
      "reviews",
      "reports",
      "waitlist",
    ],
    optionalModules: ["packages-memberships", "team-scheduling", "inventory"],
  },
  {
    id: "ozel-ders",
    label: "Özel Ders",
    aliases: ["ozel ders", "özel ders", "direksiyon dersi", "ders"],
    primaryObject: "Ders randevusu",
    resourceLabel: "Ders alanı / araç",
    teamLabel: "Eğitmen",
    capacityUnit: "Öğrenci",
    bookingMode: "Eğitmen, ders tipi, seviye ve süre",
    depositRule: "Paket ders veya özel slot için kapora önerilir",
    requiredForms: "Seviye, hedef ve iletişim notu",
    notes: "Eğitim akışında eğitmen takvimi, paket ders ve öğrenci notları önceliklidir.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "team-scheduling",
      "client-crm",
      "forms-waivers",
      "deposit-cancellation",
      "checkout-payments",
      "packages-memberships",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["resource-booking", "group-sessions", "waitlist"],
  },
  {
    id: "masaj-spa",
    label: "Masaj & Spa",
    aliases: ["masaj", "spa", "masaj & spa"],
    primaryObject: "Terapi randevusu",
    resourceLabel: "Oda",
    teamLabel: "Terapist",
    capacityUnit: "Kişi",
    bookingMode: "Terapist, oda, hizmet ve süre",
    depositRule: "Uzun seanslarda kapora önerilir",
    requiredForms: "Sağlık beyanı ve onam",
    notes: "Spa akışında oda, terapist, sağlık notu ve paket satışı aynı yerde olmalı.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "resource-booking",
      "team-scheduling",
      "client-crm",
      "forms-waivers",
      "deposit-cancellation",
      "checkout-payments",
      "packages-memberships",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["inventory", "portfolio-media", "waitlist"],
  },
  {
    id: "diger",
    label: "Diğer",
    aliases: ["diger", "diğer"],
    primaryObject: "Rezervasyon",
    resourceLabel: "Alan / kaynak",
    teamLabel: "Ekip üyesi",
    capacityUnit: "Kişi",
    bookingMode: "Hizmet, kaynak, saat ve müşteri",
    depositRule: "No-show riskine göre kapora opsiyonel",
    requiredForms: "KVKK ve hizmete özel not",
    notes: "Genel hizmet işletmeleri için temel marketplace, takvim, CRM ve ödeme hattı yeterli başlangıçtır.",
    requiredModules: [
      "marketplace-profile",
      "service-menu",
      "availability-calendar",
      "client-crm",
      "deposit-cancellation",
      "checkout-payments",
      "messaging",
      "reviews",
      "reports",
    ],
    optionalModules: ["resource-booking", "team-scheduling", "forms-waivers", "packages-memberships", "inventory", "waitlist"],
  },
];

const FACILITY_FEATURES = [
  { id: "card", label: "Kredi kartı", icon: "💳", scopes: ["all"] },
  { id: "camera", label: "Kamera", icon: "🎥", scopes: ["all"] },
  { id: "parking", label: "Otopark", icon: "🅿️", scopes: ["all"] },
  { id: "wifi", label: "İnternet", icon: "📶", scopes: ["all"] },
  { id: "cafe", label: "Cafe", icon: "☕", scopes: ["all"] },
  { id: "food", label: "Yemek", icon: "🍽️", scopes: ["restoran", "hali-saha", "padel-kort", "masaj-spa"] },
  { id: "kids", label: "Çocuk oyun alanı", icon: "🧒", scopes: ["kadin-guzellik", "masaj-spa", "yoga-pilates", "ozel-ders"] },
  { id: "prayer", label: "İbadet alanı", icon: "🌙", scopes: ["hali-saha", "padel-kort"] },
  { id: "shower", label: "Duş", icon: "🚿", scopes: ["hali-saha", "padel-kort", "masaj-spa"] },
  { id: "male-restroom", label: "Erkek tuvaleti", icon: "🚹", scopes: ["hali-saha", "padel-kort", "restoran", "erkek-kuafor"] },
  { id: "female-restroom", label: "Kadın tuvaleti", icon: "🚺", scopes: ["hali-saha", "padel-kort", "restoran", "kadin-guzellik"] },
  { id: "equipment", label: "Ekipman / ayakkabı", icon: "🎒", scopes: ["hali-saha", "padel-kort", "tenis-kortu", "tenis-hocasi", "ozel-ders"] },
  { id: "goalkeeper", label: "Kaleci", icon: "🥅", scopes: ["hali-saha"] },
  { id: "locker", label: "Soyunma odası", icon: "🔐", scopes: ["hali-saha", "padel-kort", "masaj-spa", "yoga-pilates"] },
  { id: "pet-waiting", label: "Bekleme alanı", icon: "🐶", scopes: ["pet-kuafor"] },
  { id: "pet-safe-care", label: "Güvenli bakım alanı", icon: "🫧", scopes: ["pet-kuafor"] },
  { id: "sterile-tools", label: "Steril ekipman", icon: "🧼", scopes: ["bayan-kuafor", "kadin-guzellik", "dovmeci", "pet-kuafor", "erkek-kuafor"] },
  { id: "private-room", label: "Özel bakım odası", icon: "🛏️", scopes: ["masaj-spa", "kadin-guzellik", "dovmeci"] },
];

function normalizeCategoryKey(value = "") {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function foldSearchValue(value = "") {
  return normalizeCategoryKey(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function getIndustryPresetByKey(key = "") {
  return INDUSTRY_PRESETS.find((preset) => preset.id === key) || INDUSTRY_PRESETS[INDUSTRY_PRESETS.length - 1];
}

function getIndustryPreset(value = "") {
  const folded = foldSearchValue(value);
  if (!folded) return getIndustryPresetByKey("diger");
  const candidates = INDUSTRY_PRESETS.flatMap((preset) =>
    (preset.aliases || []).map((alias) => ({
      preset,
      alias: foldSearchValue(alias),
    })),
  )
    .filter(({ alias }) => alias && (folded === alias || folded.includes(alias) || alias.includes(folded)))
    .sort((a, b) => {
      const exactScore = Number(b.alias === folded) - Number(a.alias === folded);
      return exactScore || b.alias.length - a.alias.length;
    });

  return candidates[0]?.preset || getIndustryPresetByKey("diger");
}

function extractOperationModuleIds(modules = []) {
  return (Array.isArray(modules) ? modules : [])
    .map((item) => (typeof item === "string" ? item : item?.id))
    .filter(Boolean);
}

function normalizeOperations(settings = {}) {
  const category =
    settings?.details?.category || settings?.selects?.find((item) => item.label === "İşletme Tipi")?.value || "";
  const preset = getIndustryPreset(category);
  const saved = settings.operations && typeof settings.operations === "object" ? settings.operations : {};
  const sameIndustry = saved.industryKey === preset.id;
  const savedModuleIds = sameIndustry ? extractOperationModuleIds(saved.modules) : [];
  const enabledModuleIds = new Set([...(preset.requiredModules || []), ...savedModuleIds]);

  return {
    industryKey: preset.id,
    industryLabel: preset.label,
    primaryObject: sameIndustry && saved.primaryObject ? saved.primaryObject : preset.primaryObject,
    resourceLabel: sameIndustry && saved.resourceLabel ? saved.resourceLabel : preset.resourceLabel,
    teamLabel: sameIndustry && saved.teamLabel ? saved.teamLabel : preset.teamLabel,
    capacityUnit: sameIndustry && saved.capacityUnit ? saved.capacityUnit : preset.capacityUnit,
    bookingMode: sameIndustry && saved.bookingMode ? saved.bookingMode : preset.bookingMode,
    depositRule: sameIndustry && saved.depositRule ? saved.depositRule : preset.depositRule,
    requiredForms: sameIndustry && saved.requiredForms ? saved.requiredForms : preset.requiredForms,
    notes: sameIndustry && saved.notes ? saved.notes : preset.notes,
    modules: OPERATION_MODULES.filter((module) => enabledModuleIds.has(module.id)).map((module) => module.id),
  };
}

function getOperationsBlueprint(settings = {}) {
  const operations = normalizeOperations(settings);
  const preset = getIndustryPresetByKey(operations.industryKey);
  const enabledSet = new Set(operations.modules || []);
  const requiredSet = new Set(preset.requiredModules || []);
  const optionalSet = new Set(preset.optionalModules || []);

  return {
    ...operations,
    requiredCount: requiredSet.size,
    enabledCount: enabledSet.size,
    moduleCards: OPERATION_MODULES.map((module) => ({
      ...module,
      required: requiredSet.has(module.id),
      recommended: optionalSet.has(module.id),
      enabled: enabledSet.has(module.id),
    })),
  };
}

function getFacilityCategoryKey(settings = {}) {
  return getIndustryPreset(
    settings?.details?.category || settings?.selects?.find((item) => item.label === "İşletme Tipi")?.value || "",
  ).id;
}

function getVisibleFacilityFeatures(settings = {}) {
  const categoryKey = getFacilityCategoryKey(settings);
  const savedFacilities = Array.isArray(settings.facilities) ? settings.facilities : [];
  const savedFacilityMap = new Map(savedFacilities.map((item) => [item.id, item]));
  return FACILITY_FEATURES.filter((feature) => {
    const scopes = Array.isArray(feature.scopes) ? feature.scopes : ["all"];
    return scopes.includes("all") || (categoryKey && scopes.includes(categoryKey));
  }).map((feature) => ({
    ...feature,
    enabled: Boolean(savedFacilityMap.get(feature.id)?.enabled),
  }));
}

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

async function recoverAuthSession() {
  const recoveryToken = localStorage.getItem(sessionRecoveryStorageKey) || getToken();
  if (!recoveryToken) return null;
  const response = await fetch("/api/auth/recover-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: recoveryToken }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.token) return null;
  localStorage.setItem("tyee_token", payload.token);
  localStorage.setItem(sessionRecoveryStorageKey, payload.token);
  return payload.user || null;
}

function getVenueBackup() {
  try {
    return JSON.parse(localStorage.getItem(venueBackupStorageKey) || "null");
  } catch (_error) {
    return null;
  }
}

function hasMeaningfulVenueSettings(settings = {}) {
  return Boolean(
    settings.businessName ||
      settings.details?.category ||
      settings.contact?.phone ||
      settings.location?.address ||
      (Array.isArray(settings.areas) && settings.areas.length),
  );
}

function saveVenueBackup() {
  if (!venueState.dashboard?.settings) return;
  const user = venueState.dashboard.user || {};
  const backup = {
    venueId: venueState.venueId || venueState.dashboard.id || "",
    userId: user.id || "",
    email: user.email || "",
    settings: venueState.dashboard.settings,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(venueBackupStorageKey, JSON.stringify(backup));
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

function getSafeMediaUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/assets/")) return url;
  return "";
}

function getGalleryRole(index = 0) {
  return VENUE_GALLERY_ROLES[index] || `Görsel ${index + 1}`;
}

function normalizeMediaGallery(gallery = []) {
  return (Array.isArray(gallery) ? gallery : [])
    .map((item, index) => {
      const src = getSafeMediaUrl(typeof item === "string" ? item : item?.src);
      if (!src) return null;
      const role = String(item?.role || getGalleryRole(index)).trim();
      const name = String(item?.name || role || `Görsel ${index + 1}`).trim();
      return {
        ...(typeof item === "object" && item ? item : {}),
        src,
        name,
        role,
      };
    })
    .filter(Boolean)
    .slice(0, VENUE_GALLERY_LIMIT);
}

function normalizeSettings(settings = {}) {
  const businessType = settings.selects?.find((item) => item.label === "İşletme Tipi")?.value || "";
  const savedFacilities = Array.isArray(settings.facilities) ? settings.facilities : [];
  const savedFacilityMap = new Map(savedFacilities.map((item) => [item.id, item]));
  const normalizedDetails = {
    category: businessType,
    district: "",
    description: "",
    workingHours: "",
    cancellationPolicy: "",
    ...(settings.details || {}),
  };
  const normalizedSettings = {
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
    details: normalizedDetails,
    media: {
      profileUrl: "",
      logoUrl: "",
      coverUrl: "",
      gallery: [],
      ...(settings.media || {}),
      gallery: normalizeMediaGallery(settings.media?.gallery),
    },
    areas: Object.prototype.hasOwnProperty.call(settings, "areas")
      ? (Array.isArray(settings.areas) ? settings.areas : [])
      : [{ name: "Ana hizmet", type: "Hizmet", capacity: "", price: "", isActive: true }],
    facilities: FACILITY_FEATURES.map((feature) => ({
      ...feature,
      enabled: Boolean(savedFacilityMap.get(feature.id)?.enabled),
    })),
    payment: {
      invoiceTitle: "",
      taxOffice: "",
      taxNumber: "",
      iban: "",
      paymentMethod: "Ön ödeme (kapora)",
      ...(settings.payment || {}),
    },
    contracts: {
      termsAccepted: false,
      kvkkAccepted: false,
      notes: "",
      ...(settings.contracts || {}),
    },
  };

  normalizedSettings.operations = normalizeOperations(normalizedSettings);
  return normalizedSettings;
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

function getVenueProfileImage(settings = {}) {
  const media = settings.media || {};
  const gallery = Array.isArray(media.gallery) ? media.gallery : [];
  return (
    getSafeMediaUrl(media.profileUrl) ||
    getSafeMediaUrl(media.logoUrl) ||
    getSafeMediaUrl(media.coverUrl) ||
    getSafeMediaUrl(gallery.find((item) => item?.src)?.src)
  );
}

function renderAvatarNode(node, label, imageUrl = "") {
  if (!node) return;
  const safeImageUrl = getSafeMediaUrl(imageUrl);
  node.classList.toggle("has-image", Boolean(safeImageUrl));
  if (safeImageUrl) {
    node.innerHTML = `<img src="${escapeHtml(safeImageUrl)}" alt="${escapeHtml(label)} profil görseli" />`;
    return;
  }

  node.textContent = getInitials(label);
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

  const tileLayer = L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    maxZoom: 19,
    attribution: "&copy; Google",
    keepBuffer: 4,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    updateWhenIdle: false,
  }).addTo(map);
  tileLayer.on("tileerror", () => setTimeout(() => tileLayer.redraw(), 300));
  L.control.attribution({ prefix: false }).addAttribution("&copy; Google").addTo(map);

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
  const settings = venueState.dashboard.settings || {};
  const location = settings.location || {};
  const hasLocation = Boolean(
    settings.locationStatus === "Girilmiş" ||
      location.address ||
      (location.lat && location.lng),
  );
  const profileImage = getVenueProfileImage(settings);
  renderAvatarNode(venueAvatar, displayName, profileImage);
  renderAvatarNode(venueGlobalAvatar, displayName, profileImage);
  venueName.textContent = displayName;
  venueBranch.textContent = hasLocation
    ? settings.details?.district || location.address || "Konum girildi"
    : venueState.dashboard.venue?.branch || "Konum bilgisi bekleniyor";
}

function renderGlobalAccount(user = null) {
  if (!venueGlobalAccount || !venueGlobalAvatar || !venueGlobalAccountLabel) return;

  if (!user) {
    venueGlobalAccount.classList.remove("is-authenticated");
    venueGlobalAvatar.classList.add("hidden");
    venueGlobalAvatar.classList.remove("has-image");
    venueGlobalAvatar.textContent = "";
    venueGlobalAccountLabel.textContent = "Giriş Yap / Kayıt Ol";
    venueGlobalAccount.href = "/index.html";
    return;
  }

  const displayName = user.name || user.email || "Hesap";
  venueGlobalAccount.classList.add("is-authenticated");
  venueGlobalAvatar.classList.remove("hidden");
  renderAvatarNode(venueGlobalAvatar, displayName);
  venueGlobalAccountLabel.textContent = displayName;
  venueGlobalAccount.href = "/index.html";
}

async function requireVenueAccess() {
  const token = getToken();
  const response = await fetch("/api/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const recoveredUser = await recoverAuthSession().catch(() => null);
    if (recoveredUser?.canManageVenue) {
      renderGlobalAccount(recoveredUser);
      return recoveredUser;
    }
    renderGlobalAccount(null);
    authWall.classList.remove("hidden");
    localStorage.removeItem("tyee_token");
    setTimeout(() => {
      window.location.href = "/index.html?auth=venue-login";
    }, 1200);
    throw new Error("Invalid session");
  }

  const payload = await response.json();
  renderGlobalAccount(payload.user || null);
  if (!payload.user || !payload.user.canManageVenue) {
    authWall.classList.remove("hidden");
    setTimeout(() => {
      window.location.href = "/index.html?auth=venue-login";
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
  if (!slot) return "closed";
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

function getDayHeaderParts(date) {
  return {
    weekday: WEEKDAY_SHORT[date.getDay()],
    date: String(date.getDate()).padStart(2, "0"),
    month: MONTH_SHORT[date.getMonth()],
  };
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
          name: String(area.name || "").trim() || "Ana hizmet",
          type: String(area.type || "").trim() || "Hizmet alanı",
          capacity: String(area.capacity || "").trim(),
        }))
    : [];

  return activeAreas.length
    ? activeAreas
    : [{ name: "Ana hizmet", type: "Hizmet", capacity: "" }];
}

function getSlotServiceInfo(slotKey, slot = null, manualEntry = null) {
  const saved = venueState.slotServices[slotKey];
  const areas = getActiveServiceAreas();
  const fallbackName = saved?.name || manualEntry?.field || slot?.field || areas[0]?.name || "Ana hizmet";
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

function renderCalendarFieldPills() {
  if (!calendarFieldPills) return;
  calendarFieldPills.innerHTML = getActiveServiceAreas()
    .map(
      (area, index) => `
        <button class="calendar-field-pill ${index === 0 ? "is-active" : ""}" type="button">
          ${escapeHtml(area.name)}
        </button>
      `,
    )
    .join("");
}

function getCalendarOpsPayload() {
  const ops = venueState.dashboard?.calendarOps || {};
  const waitlist = ops.waitlist || {};
  return {
    preferences: ops.preferences || {},
    controls: Array.isArray(ops.controls) ? ops.controls : [],
    filters: Array.isArray(ops.filters) ? ops.filters : [],
    team: Array.isArray(ops.team) ? ops.team : [],
    quickAdd: Array.isArray(ops.quickAdd) ? ops.quickAdd : [],
    waitlist: {
      items: Array.isArray(waitlist.items) ? waitlist.items : [],
      summary: waitlist.summary || {},
    },
  };
}

function renderCalendarOpsStrip() {
  if (!calendarOpsStrip) return;
  const ops = getCalendarOpsPayload();
  const activeFilter = venueState.calendarFilter || ops.preferences.activeFilter || "all";
  const selectedTeam = venueState.calendarTeam || ops.preferences.selectedTeam || "all";
  const waitCount = ops.waitlist.summary?.waiting || 0;

  calendarOpsStrip.innerHTML = `
    <div class="calendar-ops-group" aria-label="Takvim filtreleri">
      ${(ops.filters.length ? ops.filters : [{ id: "all", label: "Tümü" }])
        .map(
          (filter) => `
            <button class="calendar-ops-pill ${activeFilter === filter.id ? "is-active" : ""}" type="button" data-calendar-filter="${escapeHtml(filter.id)}">
              ${escapeHtml(filter.label)}
            </button>
          `,
        )
        .join("")}
    </div>
    <div class="calendar-ops-group" aria-label="Takvim aksiyonları">
      <button class="calendar-ops-pill" type="button" data-calendar-action="team">Ekip: ${escapeHtml(
        ops.team.find((item) => item.id === selectedTeam)?.name || "Tüm ekip",
      )}</button>
      <button class="calendar-ops-pill" type="button" data-calendar-action="waitlist">Bekleme ${waitCount ? `(${waitCount})` : ""}</button>
      <button class="calendar-ops-pill" type="button" data-calendar-action="settings">Takvim ayarı</button>
      <button class="calendar-ops-pill" type="button" data-calendar-action="reset">Sıfırla</button>
      <button class="calendar-ops-pill is-primary" type="button" data-calendar-action="quick-add">Yeni</button>
    </div>
  `;
}

function renderWaitlistRail() {
  if (!venueWaitlist) return;
  const { waitlist } = getCalendarOpsPayload();
  const items = waitlist.items || [];

  venueWaitlist.innerHTML = items.length
    ? items
        .slice(0, 4)
        .map(
          (item) => `
            <article class="rail-waitlist-card">
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.service)} · ${escapeHtml(item.preferredWindow)}</small>
              </div>
              <span>${escapeHtml(item.statusLabel || "Bekliyor")}</span>
              <div class="rail-waitlist-actions">
                <button class="text-button" type="button" data-waitlist-open="${escapeHtml(item.id)}">Aç</button>
                <button class="text-button" type="button" data-waitlist-match="${escapeHtml(item.id)}">Slot öner</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="rail-waitlist-card is-empty"><strong>Bekleyen talep yok</strong><small>Talep geldiğinde uygun slota bağlayabilirsin.</small></article>`;
}

function renderCalendarOperations() {
  renderCalendarOpsStrip();
  renderWaitlistRail();
}

function getSlotFilterId(mode, slot = null, manualEntry = null) {
  if (mode === "rezerv") return "open";
  if (mode === "closed") return "closed";
  if (mode === "manual") return manualEntry?.isSubscription ? "subscription" : "manual";
  if (mode === "reserved") return "booked";
  if (slot?.payment && String(slot.payment).toLocaleLowerCase("tr-TR").includes("online")) return "online";
  return mode || "booked";
}

async function saveCalendarPreferences() {
  const payload = await venueApiRequest("/api/venue/calendar-preferences", {
    method: "PATCH",
    body: JSON.stringify({
      venueId: venueState.venueId,
      preferences: {
        ...(venueState.dashboard?.calendarOps?.preferences || {}),
        activeFilter: venueState.calendarFilter,
        selectedTeam: venueState.calendarTeam,
      },
    }),
  });
  venueState.dashboard.calendarOps = payload;
  renderCalendarOperations();
}

async function refreshCalendarOps() {
  const params = new URLSearchParams({ venueId: venueState.venueId });
  const payload = await venueApiRequest(`/api/venue/calendar-ops?${params.toString()}`);
  venueState.dashboard.calendarOps = payload;
  venueState.calendarFilter = payload.preferences?.activeFilter || venueState.calendarFilter || "all";
  venueState.calendarTeam = payload.preferences?.selectedTeam || venueState.calendarTeam || "all";
  renderCalendarOperations();
}

async function addWaitlistItemFromCalendar() {
  const service = getActiveServiceAreas()[0]?.name || "Ana hizmet";
  const payload = await venueApiRequest("/api/venue/waitlist", {
    method: "POST",
    body: JSON.stringify({
      venueId: venueState.venueId,
      name: "Yeni bekleyen müşteri",
      service,
      preferredWindow: "İlk uygun slot",
      priority: "normal",
      note: "Takvimden hızlı eklenen bekleme listesi kaydı.",
    }),
  });
  venueState.dashboard.calendarOps = payload;
  renderCalendarOperations();
}

async function updateWaitlistStatus(id, status) {
  const payload = await venueApiRequest(`/api/venue/waitlist/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ venueId: venueState.venueId, status }),
  });
  venueState.dashboard.calendarOps = payload;
  renderCalendarOperations();
}

function openWaitlistDrawer(id = "") {
  const item = getCalendarOpsPayload().waitlist.items.find((entry) => entry.id === id);
  if (!item) return;
  openAppointmentDrawer({
    title: item.name,
    service: item.service,
    serviceType: "Bekleme listesi",
    datetime: item.preferredWindow,
    status: item.statusLabel || "Bekliyor",
    paymentStatus: item.priority === "high" ? "Öncelikli" : "Normal",
    total: "—",
    commission: "—",
    channel: "Bekleme listesi",
    notes: item.note || "Müşteriye uygun slot bulunduğunda rezervasyona çevrilebilir.",
  });
}

function renderSalesProducts(settings) {
  if (!salesProductsLayout) return;
  const normalized = normalizeSettings(settings);
  const activeAreas = normalized.areas.filter((area) => area.isActive);
  const totalCount = normalized.areas.length;
  const categories = [...new Set(normalized.areas.map((area) => String(area.type || "Hizmet").trim() || "Hizmet"))];
  if (venueState.selectedServiceCategory !== "all" && !categories.includes(venueState.selectedServiceCategory)) {
    venueState.selectedServiceCategory = "all";
  }
  const searchQuery = foldSearchValue(venueState.serviceSearch || "");
  const visibleAreas = normalized.areas
    .map((area, index) => ({ area, index }))
    .filter(({ area }) => {
      const matchesCategory =
        venueState.selectedServiceCategory === "all" ||
        String(area.type || "Hizmet").trim() === venueState.selectedServiceCategory;
      const haystack = foldSearchValue([area.name, area.type, area.capacity, area.price].filter(Boolean).join(" "));
      return matchesCategory && (!searchQuery || haystack.includes(searchQuery));
    });
  if (visibleAreas.length && !visibleAreas.some((item) => item.index === venueState.selectedServiceIndex)) {
    venueState.selectedServiceIndex = visibleAreas[0].index;
  }
  const selectedIndex = totalCount ? Math.min(venueState.selectedServiceIndex, totalCount - 1) : 0;
  venueState.selectedServiceIndex = selectedIndex;
  const selectedArea = normalized.areas[selectedIndex] || normalized.areas[0];
  const operations = getOperationsBlueprint(normalized);
  const operationModuleChips = operations.moduleCards
    .filter((module) => module.enabled)
    .slice(0, 5)
    .map((module) => `<span>${escapeHtml(module.label)}</span>`)
    .join("");
  const summary = `${activeAreas.length} / ${totalCount} kalem satışta`;
  const categoryButtons = [
    { id: "all", label: "Tüm kategoriler", count: totalCount },
    ...categories.map((category) => ({
      id: category,
      label: category,
      count: normalized.areas.filter((area) => String(area.type || "Hizmet").trim() === category).length,
    })),
  ]
    .map(
      (category) => `
        <button class="service-category-item ${venueState.selectedServiceCategory === category.id ? "is-active" : ""}" type="button" data-service-category="${escapeHtml(category.id)}">
          <span>${escapeHtml(category.label)}</span>
          <em>${category.count}</em>
        </button>
      `,
    )
    .join("");
  const cardsMarkup = visibleAreas.length
    ? visibleAreas
    .map(({ area, index }) => {
      const priceLabel = area.price ? `₺${String(area.price).replace(/^₺\s*/, "")}` : "";
      const durationLabel = area.capacity || "60 dk";
      const meta = [area.type || "Hizmet", durationLabel].filter(Boolean).join(" · ");
      return `
        <article class="service-row-card ${area.isActive ? "is-active" : ""} ${index === selectedIndex ? "is-selected" : ""}" data-product-card="${index}">
          <div class="service-row-accent"></div>
          <div class="service-row-main">
            <strong>${escapeHtml(area.name || `Hizmet ${index + 1}`)}</strong>
            <span>${escapeHtml(meta)}</span>
          </div>
          <div class="service-row-price">${escapeHtml(priceLabel || "₺0")}</div>
        </article>
      `;
    })
    .join("")
    : `<div class="service-empty-state">Bu filtrede hizmet bulunamadı.</div>`;

  const categoryName =
    venueState.selectedServiceCategory === "all"
      ? activeAreas[0]?.type || normalized.details?.category || "Tüm kategoriler"
      : venueState.selectedServiceCategory;
  const selectedMeta = [selectedArea?.type || "Hizmet", selectedArea?.capacity || "60 dk"].filter(Boolean).join(" · ");

  salesProductsLayout.innerHTML = `
    <aside class="service-catalog-sidebar">
      <div class="service-catalog-card">
        <strong>Kategoriler</strong>
        <div class="service-category-list">${categoryButtons}</div>
        <button class="service-link-button" type="button" data-service-category-add>Kategori ekle</button>
      </div>
      <div class="service-blueprint-card">
        <span>Sektör akışı</span>
        <strong>${escapeHtml(operations.primaryObject)}</strong>
        <small>${escapeHtml(operations.bookingMode)}</small>
        <div>${operationModuleChips}</div>
      </div>
    </aside>
    <section class="service-catalog-main">
      <div class="service-catalog-toolbar">
        <div class="service-search-shell">
          <input class="service-search-input" type="search" placeholder="Hizmet ara" value="${escapeHtml(venueState.serviceSearch || "")}" data-service-search />
        </div>
      </div>

      <div class="service-catalog-summary">
        <div>
          <strong>${escapeHtml(categoryName)}</strong>
          <span>${summary}</span>
        </div>
      </div>

      <div class="service-catalog-rows">${cardsMarkup}</div>

      ${
        selectedArea
          ? `
              <div class="service-editor-shell">
                <div class="service-editor-head">
                  <div>
                    <span class="service-editor-kicker">Hizmet Detayı</span>
                    <strong>${escapeHtml(selectedArea.name || "Yeni hizmet")}</strong>
                    <span>${escapeHtml(selectedMeta)}</span>
                  </div>
                  <div class="service-editor-actions">
                    <label class="service-status-toggle">
                      <input type="checkbox" data-area-active="${selectedIndex}" ${selectedArea.isActive ? "checked" : ""} />
                      <span>${selectedArea.isActive ? "Satışta" : "Pasif"}</span>
                    </label>
                    <button class="ghost-button danger" type="button" data-area-delete="${selectedIndex}">Sil</button>
                  </div>
                </div>
                <div class="service-editor-grid" data-area-card="${selectedIndex}">
                  ${serviceEditorFields(selectedArea, selectedIndex)}
                </div>
              </div>
          `
          : `
            <div class="service-editor-shell">
              <div class="settings-empty-box">Henüz hizmet yok. Yeni hizmet ekleyip ad, fiyat veya süre bilgisi gir.</div>
              <button class="solid-button" type="button" data-area-add>Hizmet ekle</button>
            </div>
          `
      }
    </section>
  `;
}

function serviceEditorFields(area = {}, index = 0) {
  const paymentMode = area.paymentMode || "commission_deposit";
  const depositType = area.depositType || "percent";
  const depositValue = area.depositValue || "";
  const price = parseFinanceAmount(area.price);
  const rawDeposit = parseFinanceAmount(depositValue);
  const depositAmount =
    paymentMode === "full_online"
      ? price
      : paymentMode === "venue_payment"
        ? 0
        : depositValue
          ? Math.min(depositType === "fixed" ? rawDeposit : price * (rawDeposit / 100), price)
          : price * 0.07;
  const venueAmount = Math.max(price - depositAmount, 0);
  const paymentSummary =
    paymentMode === "full_online"
      ? `Müşteri online ${formatFinanceCurrency(price)} öder, işletmede ödeme kalmaz.`
      : paymentMode === "venue_payment"
        ? `Online ödeme alınmaz, müşteri işletmede ${formatFinanceCurrency(price)} öder.`
        : `Müşteri online ${formatFinanceCurrency(depositAmount)} öder, işletmede ${formatFinanceCurrency(venueAmount)} kalır.`;
  return `
    <label class="settings-input-field service-field-wide">
      <span>Hizmet adı</span>
      <input data-area-name="${index}" type="text" value="${escapeHtml(area.name || "")}" placeholder="Örn. Küçük ırk bakım, Saç kesimi, Saha kiralama" />
    </label>
    <label class="settings-input-field">
      <span>Kategori</span>
      <input data-area-type="${index}" type="text" value="${escapeHtml(area.type || "")}" placeholder="Örn. Bakım, Kuaför, Saha" />
    </label>
    <label class="settings-input-field">
      <span>Süre / kontenjan</span>
      <input data-area-capacity="${index}" type="text" value="${escapeHtml(area.capacity || "")}" placeholder="Örn. 60 dk, 1 kişi, 1 pet" />
    </label>
    <label class="settings-input-field">
      <span>Satış fiyatı</span>
      <input data-area-price="${index}" type="text" value="${escapeHtml(area.price || "")}" placeholder="₺0" inputmode="decimal" />
    </label>
    <div class="service-payment-box service-field-wide">
      <div class="service-payment-head">
        <strong>Ödeme kuralı</strong>
        <span>Bu hizmet için müşteriden ne zaman, ne kadar alınacağını belirler.</span>
      </div>
      <div class="service-payment-grid">
        <label class="settings-input-field">
          <span>Tahsilat modeli</span>
          <select data-area-payment-mode="${index}">
            <option value="venue_payment" ${paymentMode === "venue_payment" ? "selected" : ""}>Sadece rezervasyon</option>
            <option value="commission_deposit" ${paymentMode === "commission_deposit" ? "selected" : ""}>Kapora al</option>
            <option value="full_online" ${paymentMode === "full_online" ? "selected" : ""}>Tam ödeme al</option>
          </select>
        </label>
        <label class="settings-input-field">
          <span>Kapora tipi</span>
          <select data-area-deposit-type="${index}">
            <option value="percent" ${depositType === "percent" ? "selected" : ""}>Yüzde</option>
            <option value="fixed" ${depositType === "fixed" ? "selected" : ""}>Sabit tutar</option>
          </select>
        </label>
        <label class="settings-input-field">
          <span>Kapora değeri</span>
          <input data-area-deposit-value="${index}" type="text" value="${escapeHtml(depositValue)}" placeholder="${depositType === "fixed" ? "₺500" : "20"}" inputmode="decimal" />
        </label>
      </div>
      <div class="service-payment-summary">${escapeHtml(paymentSummary)}</div>
    </div>
    <div class="service-editor-helper">
      <strong>Marketplace görünümü</strong>
      <span>Aktif hizmetler müşteriye gösterilir. Hizmet adı ve fiyat ya da süre bilgisi girildiğinde kurulum adımı tamamlanır.</span>
    </div>
  `;
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
  salesDeposit.value = existingEntry?.deposit || "0";
  salesPhone.value = existingEntry?.phone || "";
  salesPayout.value = existingEntry?.payout || "0";
  salesName.value = existingEntry?.name || "";
  salesTotal.value = existingEntry?.total || "0";
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
    field: "Ana hizmet",
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
  if (venueState.dashboard) {
    venueState.dashboard.slotState = {
      slotModes: venueState.slotModes,
      manualEntries: venueState.manualEntries,
      slotServices: venueState.slotServices,
    };
    refreshAdaAssistant().catch(() => renderAdaAssistant());
  }
}

function renderWeeklySchedule(board, days) {
  const displayDays = buildDisplayWeek(days);
  const today = new Date();
  const todayKey = formatDateKey(today);
  const times = buildTimeSlots();
  const rows = times
    .map((time, timeIndex) => {
      const cells = displayDays
        .map((day, dayIndex) => {
          const dayKey = formatDateKey(day.dateObj);
          const isToday = dayKey === todayKey;
          const slot = day.slots.find((item) => item.time === time);
          const slotKey = `${dayKey}-${time}`;
          const legacySlotKey = `${dayIndex}-${time}`;
          const selectedClass = venueState.selectedSlotKey === slotKey ? " is-selected" : "";
          const todayClass = isToday ? " is-today-column" : "";
          const explicitMode = venueState.slotModes[slotKey] ?? venueState.slotModes[legacySlotKey];
          const mode = explicitMode || getDefaultMode(slot);
          const explicitRezervClass = explicitMode === "rezerv" ? " slot-explicit-rezerv" : "";
          const manualEntry = venueState.manualEntries[slotKey] ?? venueState.manualEntries[legacySlotKey];
          const serviceInfo = getSlotServiceInfo(slotKey, slot, manualEntry);
          const serviceMeta = buildServiceMeta(serviceInfo);

          let modeLabel = "Açık";
          let modeMeta = "";
          let modeClass = "is-tyee";
          let actionLabel = "Müşteri rezervasyonuna aç";
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

          const filterId = getSlotFilterId(mode, slot, manualEntry);
          const filterDimmedClass =
            venueState.calendarFilter && venueState.calendarFilter !== "all" && venueState.calendarFilter !== filterId
              ? " is-filter-dimmed"
              : "";
          const compactStatusClass = modeClass
            .split(" ")
            .map((className) => `slot-${className.replace(/^is-/, "")}`)
            .join(" ");
          const popoverEdgeClass = dayIndex >= displayDays.length - 2 ? " is-popover-right" : "";
          const popoverVerticalClass = timeIndex >= times.length - 5 ? " is-popover-above" : "";
          const popoverClass = `slot-popover${popoverEdgeClass}${popoverVerticalClass}`;
          const slotMainMarkup =
            mode === "rezerv"
              ? `<span class="open-slot-dot" aria-label="Rezervasyona açık"></span><strong class="open-slot-title">tyee</strong><span class="open-slot-meta">${escapeHtml(serviceMeta)}</span>`
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
            <td class="schedule-slot-cell ${compactStatusClass}${explicitRezervClass}${selectedClass}${todayClass}${filterDimmedClass}" data-slot-key="${slotKey}" data-day-index="${dayIndex}" data-time="${time}">
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
                          <button class="slot-option slot-option-tyee ${mode === "rezerv" ? "is-active" : ""}" type="button" data-mode="rezerv" data-slot-key="${slotKey}" aria-label="Açık satış">
                            <span class="slot-option-icon">R</span>
                            <span>Açık satış</span>
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
                        <button
                          class="slot-open-appointment"
                          type="button"
                          data-open-slot-drawer="${slotKey}"
                        >Rezervasyon detayını aç</button>
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
          <th class="schedule-time-head"><span>Saat</span></th>
          ${displayDays
            .map((day) => {
              const dayKey = formatDateKey(day.dateObj);
              const isToday = dayKey === todayKey;
              const parts = getDayHeaderParts(day.dateObj);
              return `
                <th class="${isToday ? "is-today-head" : ""}">
                  <span class="schedule-day-name">${escapeHtml(parts.weekday)}</span>
                  <span class="schedule-day-date">${escapeHtml(parts.date)}</span>
                  <span class="schedule-day-month">${escapeHtml(parts.month)}</span>
                </th>
              `;
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

function normalizeClientQuery(value = "") {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getVenueClientsPayload() {
  const clients = venueState.dashboard?.clients || {};
  return {
    items: Array.isArray(clients.items) ? clients.items : [],
    segments: Array.isArray(clients.segments) ? clients.segments : [],
    loyalty: Array.isArray(clients.loyalty) ? clients.loyalty : [],
  };
}

function getFilteredVenueClients() {
  const { items } = getVenueClientsPayload();
  const query = normalizeClientQuery(venueState.customerSearch);
  if (!query) return items;
  return items.filter((item) =>
    [item.name, item.email, item.phone, item.segment, item.nextAction]
      .map(normalizeClientQuery)
      .some((value) => value.includes(query)),
  );
}

function renderClientsEmptyState(title, copy) {
  return `
    <article class="clients-empty-state">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(copy)}</p>
    </article>
  `;
}

function renderCustomersView() {
  const clientsPayload = getVenueClientsPayload();
  const filteredClients = getFilteredVenueClients();

  if (crmSummaryGrid) {
    crmSummaryGrid.innerHTML = `
      <div class="clients-nav-card">
        <span class="clients-nav-label">Clients</span>
        <button class="clients-nav-link ${venueState.customerSubview === "list" ? "is-active" : ""}" type="button" data-client-subview="list">Müşteri listesi</button>
        <button class="clients-nav-link ${venueState.customerSubview === "segments" ? "is-active" : ""}" type="button" data-client-subview="segments">Müşteri segmentleri</button>
        <button class="clients-nav-link ${venueState.customerSubview === "loyalty" ? "is-active" : ""}" type="button" data-client-subview="loyalty">Sadakat görünümü</button>
      </div>
    `;
  }

  if (!crmCustomerList) return;

  if (venueState.customerSubview === "segments") {
    crmCustomerList.innerHTML = `
      <div class="clients-page-head">
        <div>
          <h2>Müşteri segmentleri</h2>
          <p>Yeniden rezervasyon, geri çağırma ve kampanya hedeflemesi için segmentleri kullan.</p>
        </div>
        <div class="clients-page-actions">
          <button class="ghost-button" type="button">Export</button>
          <button class="solid-button" type="button">Yeni segment</button>
        </div>
      </div>
      <div class="clients-segment-grid">
        ${
          clientsPayload.segments.length
            ? clientsPayload.segments
          .map(
            (item) => `
              <article class="clients-segment-card">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.count)}</span>
                <p>${escapeHtml(item.detail)}</p>
              </article>
            `,
          )
          .join("")
            : renderClientsEmptyState("Henüz segment yok", "İlk rezervasyonlardan sonra segmentler otomatik oluşacak.")
        }
      </div>
    `;
    return;
  }

  if (venueState.customerSubview === "loyalty") {
    crmCustomerList.innerHTML = `
      <div class="clients-page-head">
        <div>
          <h2>Sadakat görünümü</h2>
          <p>Tekrar gelen müşterileri ve ödül haklarını tek listede takip et.</p>
        </div>
        <div class="clients-page-actions">
          <button class="ghost-button" type="button">Kurallar</button>
          <button class="solid-button" type="button">Kampanya başlat</button>
        </div>
      </div>
      <div class="clients-loyalty-grid">
        ${
          clientsPayload.loyalty.length
            ? clientsPayload.loyalty
          .map(
            (item) => `
              <article class="clients-loyalty-card">
                <div class="clients-loyalty-head">
                  <strong>${escapeHtml(item.name)}</strong>
                  <span>${escapeHtml(item.tier)}</span>
                </div>
                <p>${escapeHtml(item.progress)}</p>
                <small>${escapeHtml(item.reward)}</small>
              </article>
            `,
          )
          .join("")
            : renderClientsEmptyState("Sadakat kaydı bekleniyor", "Müşteri ziyaretleri arttıkça sadakat görünümü dolacak.")
        }
      </div>
    `;
    return;
  }

  crmCustomerList.innerHTML = `
    <div class="clients-page-head">
      <div>
        <div class="clients-title-row">
          <h2>Müşteri listesi</h2>
          <span class="clients-count-badge">${clientsPayload.items.length}</span>
        </div>
        <p>Müşteri detaylarını görüntüle, düzenle ve operasyon içinde kullan.</p>
      </div>
      <div class="clients-page-actions">
        <button class="ghost-button" type="button" data-customer-options>Seçenekler</button>
        <button class="solid-button" type="button" data-customer-add>Müşteri ekle</button>
      </div>
    </div>
    <div class="clients-toolbar">
      <label class="clients-search-field">
        <span>Arama</span>
        <input type="text" placeholder="Ad, e-posta veya telefon" data-customer-search value="${escapeHtml(venueState.customerSearch)}" />
      </label>
      <button class="ghost-button" type="button">Filtreler</button>
      <button class="ghost-button" type="button">Oluşturulma tarihi (en yeni)</button>
    </div>
    <div class="clients-table-shell">
      <table class="clients-table">
        <thead>
          <tr>
            <th></th>
            <th>Müşteri adı</th>
            <th>Telefon</th>
            <th>Yorumlar</th>
            <th>Toplam satış</th>
            <th>Oluşturulma</th>
          </tr>
        </thead>
        <tbody>
          ${
            filteredClients.length
              ? filteredClients
            .map(
              (item, index) => `
                <tr class="clients-row" data-customer-open="${escapeHtml(item.id || String(index))}">
                  <td><span class="clients-avatar-cell">${escapeHtml(item.initials)}</span></td>
                  <td>
                    <strong>${escapeHtml(item.name)}</strong>
                    <small>${escapeHtml(item.email)}</small>
                  </td>
                  <td>${escapeHtml(item.phone)}</td>
                  <td>${escapeHtml(item.reviews)}</td>
                  <td>${escapeHtml(item.spend)}</td>
                  <td>${escapeHtml(item.createdAt)}</td>
                </tr>
              `,
            )
            .join("")
              : `<tr><td colspan="6">${renderClientsEmptyState("Sonuç bulunamadı", "Arama kriterini değiştir veya ilk müşteri kaydını rezervasyonla oluştur.")}</td></tr>`
          }
        </tbody>
      </table>
      <div class="clients-table-foot">${filteredClients.length ? `1 - ${filteredClients.length}` : "0"} / ${clientsPayload.items.length} müşteri gösteriliyor</div>
    </div>
  `;
}

function renderCampaignsView() {
  const draft = venueState.campaignDraft;
  const feedback = venueState.campaignFeedback;
  if (campaignsKpiGrid) {
    campaignsKpiGrid.innerHTML = venueCampaignKpis
      .map(
        (item) => `
          <article class="report-summary-card">
            <small>${escapeHtml(item.label)}</small>
            <strong>${escapeHtml(item.value)}</strong>
            <span>${escapeHtml(item.meta)}</span>
          </article>
        `,
      )
      .join("");
  }

  if (campaignsBoard) {
    const draftCard = `
      <article class="campaign-sms-card" id="campaign-sms-draft">
        <div class="campaign-sms-head">
          <div>
            <small>ADA AKILLI KAMPANYA</small>
            <strong>Boş saat SMS taslağı</strong>
          </div>
          <button class="soft-button" type="button" data-campaign-action="draft-sms">Taslak hazırla</button>
        </div>
        ${
          draft
            ? `
              <div class="campaign-sms-grid">
                <label>
                  <span>Hedef kitle</span>
                  <select id="campaign-sms-segment">
                    ${[
                      ["all", "Telefonu kayıtlı tüm müşteriler"],
                      ["lost", "30+ gündür gelmeyenler"],
                      ["loyal", "Sadık müşteriler"],
                      ["new", "Yeni müşteriler"],
                    ]
                      .map(
                        ([value, label]) =>
                          `<option value="${value}" ${draft.segment === value ? "selected" : ""}>${label}</option>`,
                      )
                      .join("")}
                  </select>
                </label>
                <div class="campaign-sms-count">
                  <span>Alıcı</span>
                  <strong>${escapeHtml(String(draft.recipientCount || 0))}</strong>
                </div>
              </div>
              <textarea id="campaign-sms-text" maxlength="320">${escapeHtml(draft.message || "")}</textarea>
              <div class="campaign-sms-preview">
                ${
                  draft.recipients?.length
                    ? draft.recipients
                        .map((recipient) => `<span>${escapeHtml(recipient.name)} · ${escapeHtml(recipient.phone)}</span>`)
                        .join("")
                    : "<span>Telefonu kayıtlı müşteri bulunamadı.</span>"
                }
              </div>
              <p class="campaign-sms-note">${escapeHtml(draft.consentNote || "")}</p>
              <div class="campaign-sms-actions">
                <button class="soft-button" type="button" data-campaign-action="refresh-draft">Alıcıyı güncelle</button>
                <button class="primary-button" type="button" data-campaign-action="send-sms" ${draft.canSend && !venueState.campaignSending ? "" : "disabled"}>
                  ${venueState.campaignSending ? "Gönderiliyor..." : "Onayla ve gönder"}
                </button>
              </div>
            `
            : `
              <p>Tyee, takvim ve müşteri kayıtlarına göre kısa bir SMS metni hazırlar. Gönderim son onaydan önce yapılmaz.</p>
            `
        }
        ${feedback ? `<div class="campaign-sms-feedback">${escapeHtml(feedback)}</div>` : ""}
      </article>
    `;

    campaignsBoard.innerHTML =
      draftCard +
      venueCampaignFlows
      .map(
        (flow) => `
          <article class="campaign-flow-card">
            <div class="campaign-flow-head">
              <strong>${escapeHtml(flow.title)}</strong>
              <span>${escapeHtml(flow.status)}</span>
            </div>
            <p>${escapeHtml(flow.detail)}</p>
            <small>${escapeHtml(flow.channel)}</small>
          </article>
        `,
      )
      .join("");
  }
}

async function requestCampaignSmsDraft({ announce = true } = {}) {
  venueState.campaignFeedback = "";
  const segment = document.querySelector("#campaign-sms-segment")?.value || venueState.campaignDraft?.segment || "all";
  const message = document.querySelector("#campaign-sms-text")?.value || venueState.campaignDraft?.message || "";
  try {
    const payload = await venueApiRequest("/api/venue/assistant/sms-draft", {
      method: "POST",
      body: JSON.stringify({
        venueId: venueState.venueId,
        segment,
        message,
      }),
    });
    venueState.campaignDraft = payload.draft;
    renderCampaignsView();
    focusAdaTarget("#campaign-sms-draft");
    if (announce) {
      appendAdaChatMessage("ada", `${payload.draft.recipientCount} alıcı için SMS taslağı hazırladım. Metni kontrol edip son onayı verebilirsin.`);
    }
  } catch (error) {
    venueState.campaignFeedback = error.message || "SMS taslağı hazırlanamadı.";
    renderCampaignsView();
    appendAdaChatMessage("ada", venueState.campaignFeedback);
  }
}

async function sendCampaignSmsDraft() {
  if (!venueState.campaignDraft || venueState.campaignSending) return;
  const message = document.querySelector("#campaign-sms-text")?.value.trim() || "";
  const segment = document.querySelector("#campaign-sms-segment")?.value || venueState.campaignDraft.segment || "all";
  venueState.campaignSending = true;
  venueState.campaignFeedback = "";
  renderCampaignsView();
  try {
    const payload = await venueApiRequest("/api/venue/assistant/sms-send", {
      method: "POST",
      body: JSON.stringify({
        venueId: venueState.venueId,
        segment,
        message,
        confirm: true,
      }),
    });
    venueState.campaignFeedback =
      payload.status === "sent"
        ? `${payload.deliveredCount} SMS Twilio üzerinden gönderildi.`
        : `${payload.deliveredCount} SMS kaydı oluşturuldu. Twilio canlı değilse dev SMS kutusunda görünür.`;
    venueState.campaignDraft = {
      ...venueState.campaignDraft,
      message,
      segment,
      recipientCount: payload.recipientCount,
      canSend: false,
    };
    appendAdaChatMessage("ada", payload.message || venueState.campaignFeedback);
  } catch (error) {
    venueState.campaignFeedback = error.message || "SMS gönderimi tamamlanamadı.";
    appendAdaChatMessage("ada", venueState.campaignFeedback);
  } finally {
    venueState.campaignSending = false;
    renderCampaignsView();
    focusAdaTarget("#campaign-sms-draft");
  }
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseFinanceAmount(value = "") {
  const parsed = Number(String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatFinanceCurrency(value = 0) {
  return `₺${new Intl.NumberFormat("tr-TR").format(Math.round(Number(value || 0)))}`;
}

function getFinancePayload(finance = {}) {
  return {
    month: finance.month || getCurrentMonthKey(),
    kpis: Array.isArray(finance.kpis)
      ? finance.kpis
      : [
          { label: "Bu ay gelir", value: "₺0", meta: "0 işlem" },
          { label: "Bu ay gider", value: "₺0", meta: "0 gider" },
          { label: "Net kalan", value: "₺0", meta: "Gelir - gider" },
          { label: "Kar marjı", value: "%0", meta: "Bu ay" },
        ],
    rows: Array.isArray(finance.rows)
      ? finance.rows
      : [
          { label: "Rezervasyon geliri", value: "₺0" },
          { label: "Aylık gider", value: "₺0" },
          { label: "Net kalan", value: "₺0" },
        ],
    expenses: Array.isArray(finance.expenses) ? finance.expenses : [],
    allExpenses: Array.isArray(finance.allExpenses) ? finance.allExpenses : Array.isArray(finance.expenses) ? finance.expenses : [],
  };
}

function getFinanceExpenseFormPayload() {
  const findField = (name) => financeCardStack?.querySelector(`[data-finance-expense-field="${name}"]`);
  return {
    title: findField("title")?.value.trim() || "",
    amount: findField("amount")?.value.trim() || "",
    month: findField("month")?.value.trim() || getCurrentMonthKey(),
    category: findField("category")?.value.trim() || "Genel",
  };
}

function setFinanceExpenseStatus(message = "", isError = false) {
  const status = financeCardStack?.querySelector("[data-finance-expense-status]");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function renderFinanceView(finance = venueState.dashboard?.finance || {}) {
  const financePayload = getFinancePayload(finance);
  if (financeKpiGrid) {
    financeKpiGrid.innerHTML = financePayload.kpis
      .map(
        (item) => `
          <article class="report-summary-card">
            <small>${escapeHtml(item.label)}</small>
            <strong>${escapeHtml(item.value)}</strong>
            <span>${escapeHtml(item.meta)}</span>
          </article>
        `,
      )
      .join("");
  }

  if (financeCardStack) {
    const visibleExpenses = financePayload.expenses.length ? financePayload.expenses : financePayload.allExpenses.slice(0, 8);
    const expenseListTitle = financePayload.expenses.length ? "Bu ay gider kalemleri" : "Son gider kalemleri";
    const expenseEmptyCopy = financePayload.allExpenses.length
      ? "Bu ay için gider yok. Son kayıtların aşağıda listelendi."
      : "Henüz gider girilmedi.";
    const expenseRows = visibleExpenses.length
      ? visibleExpenses
          .map(
            (item) => `
              <div class="finance-expense-row">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.category)} · ${escapeHtml(item.month)}</span>
                </div>
                <b>${escapeHtml(item.amountLabel || item.amount || "₺0")}</b>
              </div>
            `,
          )
          .join("")
      : `<p class="finance-empty-copy">${expenseEmptyCopy}</p>`;

    financeCardStack.innerHTML = `
      <article class="finance-insight-card finance-expense-entry">
        <div>
          <strong>Aylık gider ekle</strong>
          <p>Kira, personel, sarf, reklam veya benzeri aylık giderleri buradan işle.</p>
        </div>
        <div class="finance-expense-form">
          <label>
            <span>Gider adı</span>
            <input data-finance-expense-field="title" type="text" placeholder="Örn: Kira, personel, sarf" />
          </label>
          <label>
            <span>Tutar</span>
            <input data-finance-expense-field="amount" type="text" inputmode="decimal" placeholder="0" />
          </label>
          <label>
            <span>Ay</span>
            <input data-finance-expense-field="month" type="month" value="${escapeHtml(financePayload.month)}" />
          </label>
          <label>
            <span>Kategori</span>
            <select data-finance-expense-field="category">
              <option>Genel</option>
              <option>Kira</option>
              <option>Personel</option>
              <option>Sarf</option>
              <option>Reklam</option>
              <option>Platform</option>
            </select>
          </label>
        </div>
        <div class="finance-expense-actions">
          <button class="solid-button" type="button" data-finance-expense-save>Gideri kaydet</button>
          <span class="venue-save-status" data-finance-expense-status></span>
        </div>
      </article>
      <article class="finance-insight-card finance-expense-list">
        <strong>${expenseListTitle}</strong>
        <div>${expenseRows}</div>
      </article>
    `;
  }

  if (financePnlShell) {
    financePnlShell.innerHTML = `
      <div class="finance-pnl-card">
        <div class="panel-head compact">
          <div>
            <p class="eyebrow">Aylık görünüm</p>
            <h2>Basit kar / zarar</h2>
          </div>
        </div>
        <div class="finance-pnl-rows">
          ${financePayload.rows
            .map(
              (item) => `
                <div class="detail-row">
                  <span>${escapeHtml(item.label)}</span>
                  <strong>${escapeHtml(item.value)}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }
}

function renderOverview(payload) {
  if (payload.isFreshVenue) {
    overviewList.innerHTML = `
      <article class="overview-item is-empty">
        <div>
          <strong>Henüz canlı operasyon verisi yok</strong>
          <p>Rezervasyon, checkout ve müşteri hareketleri geldikçe dashboard otomatik dolacak.</p>
        </div>
        <span>0 kayıt</span>
      </article>
    `;
    return;
  }

  const transactions = payload?.transactions || [];
  const openSlots = Object.values(payload?.slotState?.slotModes || {}).filter((state) => state === "rezerv").length;
  const manualSlots = Object.values(payload?.slotState?.manualEntries || {}).length;
  const completedSales = transactions.filter((item) => item.status === "Tamamlandı").length;
  const reviewCount = Number(payload?.reviewSummary?.total || 0);
  const notes = [
    {
      title: "Satışa açık takvim",
      body: openSlots ? "Müşterinin rezervasyon yapabileceği saatler satışa açık." : "Satışa açılan saatler burada görünecek.",
      meta: `${openSlots} slot`,
    },
    {
      title: "Manuel rezervasyon",
      body: manualSlots ? "Takvime elle eklenen rezervasyonlar ve notlar takip ediliyor." : "Manuel rezervasyon eklenirse burada takip edilir.",
      meta: `${manualSlots} kayıt`,
    },
    {
      title: "Checkout durumu",
      body: completedSales ? "Tamamlanan satışlar performans ve rapora işleniyor." : "Tamamlanan satış olmadığında tutarlar sıfır kalır.",
      meta: `${completedSales} işlem`,
    },
    {
      title: "Değerlendirmeler",
      body: reviewCount ? "Müşteri yorumları ve firma iç notları değerlendirme ekranında tutuluyor." : "İlk yorum geldiğinde burada özetlenecek.",
      meta: `${reviewCount} yorum`,
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

function getAdaOpenSlotCount(payload = {}) {
  return Object.values(payload?.slotState?.slotModes || {}).filter((state) => state === "rezerv").length;
}

function getAdaManualSlotCount(payload = {}) {
  return Object.keys(payload?.slotState?.manualEntries || {}).length;
}

function getAdaActiveServices(settings = {}) {
  const normalized = normalizeSettings(settings || {});
  return normalized.areas.filter((area) => area?.isActive !== false);
}

function getAdaGalleryCount(settings = {}) {
  const normalized = normalizeSettings(settings || {});
  return normalizeMediaGallery(normalized.media?.gallery).length;
}

const TYEE_ASSISTANT_TOPIC_KEYWORDS = {
  marketplace: ["marketplace", "pazar", "müşteri bul", "yakınımda", "arama", "liste", "vitrin", "profil", "yayın"],
  setup: ["kurulum", "profil", "işletme bilg", "adres", "konum", "telefon", "tamamla", "ayar"],
  services: ["hizmet", "fiyat", "ücret", "kapora", "ödeme", "satış", "menü", "aktif", "pasif", "sil", "süre"],
  calendar: ["takvim", "slot", "saat", "müsait", "boş", "rezervasyon aç", "çalışma saati", "randevu"],
  reservations: ["rezervasyon", "checkout", "tamamla", "işlem", "iptal", "müşteri geldi", "ödendi"],
  customers: ["müşteri", "crm", "sadakat", "tekrar", "not", "segment", "liste"],
  campaigns: ["sms", "kampanya", "pazarlama", "reklam", "geri çağır", "mesaj"],
  finance: ["gider", "gelir", "performans", "rapor", "kar", "kâr", "komisyon", "muhasebe"],
  reviews: ["yorum", "değerlendirme", "puan", "şikayet", "memnuniyet"],
  media: ["görsel", "foto", "resim", "galeri", "kapak", "logo"],
  help: ["ne yap", "nasıl çalış", "neler var", "anlat", "yardım", "özellik"],
};

function adaTextIncludesAny(text = "", keywords = []) {
  return keywords.some((keyword) => text.includes(keyword));
}

function matchTyeeAssistantTopic(question = "") {
  const normalized = String(question || "").toLocaleLowerCase("tr-TR");
  return Object.entries(TYEE_ASSISTANT_TOPIC_KEYWORDS).find(([, keywords]) => adaTextIncludesAny(normalized, keywords))?.[0] || "help";
}

function getTyeeAssistantWelcome(payload = venueState.dashboard || {}) {
  const settings = normalizeSettings(payload.settings || {});
  const venueName = settings.businessName || payload.venue?.name || "işletmen";
  const activeServices = getAdaActiveServices(settings).length;
  const openSlots = getAdaOpenSlotCount(payload);
  const servicePart = activeServices ? `${activeServices} aktif hizmetini` : "hizmet menünü";
  const slotPart = openSlots ? `${openSlots} satışa açık saatini` : "takvimde satışa açılacak saatlerini";

  return `Tyee.app işletme paneline hoş geldin. Ben Tyee; ${venueName} için ${servicePart}, ${slotPart}, müşteri akışını ve rezervasyon hazırlığını birlikte yönetmene yardım ederim. Bana "hizmet nasıl eklenir", "kapora nasıl ayarlanır" veya "marketplace'te nasıl görünürüm" diye sorabilirsin.`;
}

function getTyeeAssistantOverview() {
  return "Tyee.app, müşterinin yakındaki işletmeleri bulup hizmet seçerek rezervasyon oluşturduğu; işletmenin ise takvim, hizmet menüsü, ödeme modeli, müşteri listesi, kampanya, yorum, görsel ve performans akışını tek panelden yönettiği bir rezervasyon altyapısıdır. Ben burada adım adım eşlik ederim: önce vitrini ve hizmeti netleştiririz, sonra takvimi satışa açar, rezervasyonları ve müşteri iletişimini düzenli tutarız.";
}

function buildTyeeTopicAnswer(topic = "help", context = {}) {
  const { openSlots = 0, activeServices = 0, expenseCount = 0, waitingReviews = 0, galleryCount = 0, venueName = "işletmen" } = context;

  if (topic === "marketplace") {
    return "Marketplace tarafında müşteri kategori, konum ve arama üzerinden işletmeleri görür; işletme kartında görseller, hizmetler, fiyat, süre, uygun saatler, puanlar ve rezervasyon akışı öne çıkar. İyi bir vitrin için net işletme bilgisi, doğru kategori, güçlü görseller, fiyatı belli hizmetler ve satışa açık takvim gerekir.";
  }

  if (topic === "setup") {
    return "İşletme kurulumunda kritik alanlar işletme adı, sektör/kategori, telefon, adres/konum, en az bir yayınlanabilir hizmet ve müşterinin rezervasyon yapabileceği saatlerdir. Çalışma saatleri faydalıdır ama tek başına engel olmamalı; asıl amaç müşteriye güven veren bir profil ve rezerve edilebilir hizmet oluşturmaktır.";
  }

  if (topic === "services") {
    return `${activeServices} aktif hizmet görünüyor. Hizmet menüsünde her hizmet için ad, tür/kategori, süre, satış fiyatı ve ödeme modeli net olmalı. Ödeme modelinde işletmede ödenecek tutar, kapora veya tamamı online ödeme gibi seçenekleri tüm sektörlerde aynı mantıkla kullanırız; aktif/pasif ayarı da hizmetin marketplace'te görünüp görünmeyeceğini belirler.`;
  }

  if (topic === "calendar") {
    return openSlots
      ? `${venueName} için ${openSlots} satışa açık saat var. Takvimde amaç müşterinin gerçek uygunluk görmesi: açık saatleri düzenli tut, dolan saatleri kapat, manuel rezervasyonları da panele işle ki çakışma olmasın.`
      : `${venueName} için şu an satışa açık saat görünmüyor. Takvimden müşterinin alabileceği gün ve saatleri açınca marketplace'teki hizmetlerin gerçek rezervasyona dönüşebilir.`;
  }

  if (topic === "reservations") {
    return "Rezervasyon akışında müşteri hizmeti ve saati seçer; ödeme modeline göre kapora, tamamı online ödeme veya işletmede ödeme uygulanır. İşletme panelinde rezervasyonları takip edip hizmet tamamlandığında işlemi kapatmak, gelir ve yorum akışının doğru çalışmasını sağlar.";
  }

  if (topic === "customers") {
    return "Müşteri alanı tekrar gelenleri, son ziyaretleri, notları ve sadakat sinyallerini düzenli tutmak için var. Buradan müşteri geçmişini görüp uygun kampanya veya geri çağırma fikri çıkarabiliriz; amaç sadece liste tutmak değil, ilişkiyi canlı bırakmak.";
  }

  if (topic === "campaigns") {
    return "Pazarlama tarafında boş saat, geri çağırma ve sadakat kampanyaları için SMS taslakları hazırlanır. Tyee metni ve alıcı segmentini önerebilir; gönderim ise işletme sahibi son onayı vermeden yapılmaz.";
  }

  if (topic === "finance") {
    return expenseCount
      ? `Bu ay ${expenseCount} gider kaydı var. Performans ekranı rezervasyon geliri, giderler, net kalan ve platform payı gibi işletmenin karar almasını kolaylaştıran özetleri gösterir.`
      : "Performans ekranının doğru konuşması için kira, personel, sarf ve reklam gibi giderleri eklemek gerekir. Gelir rezervasyonlardan gelir; giderler tamamlanınca net tablo daha güvenilir olur.";
  }

  if (topic === "reviews") {
    return waitingReviews
      ? `${waitingReviews} değerlendirme isteği bekliyor. Yorumlar sadece puan toplamak için değil; müşterinin güvenini artırmak ve işletmenin neyi iyileştireceğini görmek için de önemli.`
      : "Rezervasyon tamamlandıktan sonra müşteri değerlendirme bırakabilir. Güçlü yorumlar marketplace vitrininin güvenini artırır; olumsuz yorumlar da nerede iyileştirme gerektiğini gösterir.";
  }

  if (topic === "media") {
    return `Şu anda ${galleryCount}/6 görsel hazır. Kapak ve galeri görselleri müşterinin ilk güven temasını oluşturur; dış cephe, iç mekan, ekip/ekipman ve hizmet sonucunu gösteren net fotoğraflar en iyi çalışır.`;
  }

  return getTyeeAssistantOverview();
}

function buildAdaInsights(payload = venueState.dashboard || {}) {
  if (!payload) return [];
  const settings = normalizeSettings(payload.settings || {});
  const activeServices = getAdaActiveServices(settings);
  const pricedServices = activeServices.filter((area) => parseFinanceAmount(area.price) > 0);
  const openSlots = getAdaOpenSlotCount(payload);
  const manualSlots = getAdaManualSlotCount(payload);
  const transactions = payload.transactions || [];
  const finance = payload.finance || {};
  const expenseCount = Array.isArray(finance.expenses) ? finance.expenses.length : 0;
  const waitingReviews = Number(payload.reviewSummary?.waitingRequests || 0);
  const waitlistCount = Number(payload.calendarOps?.waitlist?.summary?.waiting || 0);
  const galleryCount = getAdaGalleryCount(settings);
  const insights = [];

  if (!activeServices.length || !pricedServices.length) {
    insights.push({
      id: "services",
      icon: "₺",
      title: "Hizmet menüsünü tamamla",
      detail: pricedServices.length ? `${activeServices.length} aktif hizmet var.` : "Fiyatı girilmemiş hizmetler var.",
      message: "Satışa çıkmadan önce hizmet adı, süre, fiyat ve ödeme modelini netleştirelim.",
      actionLabel: "Hizmetlere git",
      view: "sales-products",
      focus: "#sales-products-layout",
    });
  }

  if (!openSlots) {
    insights.push({
      id: "calendar-open",
      icon: "SA",
      title: "Takvim satışa kapalı",
      detail: "Satışa açık slot yok.",
      message: "Takvimde müşterinin rezerve edebileceği saat açarsan marketplace görünürlüğü anlam kazanır.",
      actionLabel: "Takvimi aç",
      view: "calendar",
      focus: "#calendar-board-secondary",
    });
  } else if (!transactions.length) {
    insights.push({
      id: "campaign-empty-slots",
      icon: "SMS",
      title: "Boş saatlerin var",
      detail: `${openSlots} satışa açık slot bekliyor.`,
      message: "Boş saatler görünüyor. İstersen yakın müşterilere kısa bir reklam SMS akışı hazırlayalım.",
      actionLabel: "SMS kampanyası",
      view: "campaigns",
      focus: "#campaigns-board",
    });
  }

  if (waitlistCount > 0) {
    insights.push({
      id: "waitlist",
      icon: "BL",
      title: "Bekleyen talep var",
      detail: `${waitlistCount} müşteri uygun saat bekliyor.`,
      message: "Bekleme listesindeki müşterileri açık saatlerle eşleştirirsek hızlı rezervasyon kazanabiliriz.",
      actionLabel: "Beklemeyi aç",
      view: "calendar",
      focus: "#venue-waitlist",
    });
  }

  if (!expenseCount) {
    insights.push({
      id: "expenses",
      icon: "₺",
      title: "Bu ay gider girilmemiş",
      detail: "Kar zarar gerçek görünmeyebilir.",
      message: "Kira, personel ve sarf giderlerini girersek işletmenin net performansı temiz görünür.",
      actionLabel: "Gider ekle",
      view: "finance",
      focus: '[data-finance-expense-field="title"]',
    });
  }

  if (waitingReviews > 0) {
    insights.push({
      id: "reviews",
      icon: "Y",
      title: "Yorum takibi bekliyor",
      detail: `${waitingReviews} değerlendirme isteği açık.`,
      message: "Bekleyen yorumları takip edelim. Güçlü yorumlar marketplace sıralamasında kritik sinyal olur.",
      actionLabel: "Yorumları aç",
      view: "reviews",
      focus: "#reviews-shell",
    });
  }

  if (galleryCount < 3) {
    insights.push({
      id: "media",
      icon: "G",
      title: "Galeri güçlendirilmeli",
      detail: `${galleryCount}/6 görsel hazır.`,
      message: "Dış görünüş, iç mekan ve çalışan görselleri eklenirse rezervasyon sayfası daha güven verir.",
      actionLabel: "Görsel ekle",
      view: "settings",
      focus: ".settings-media-grid",
    });
  }

  if (manualSlots > 0) {
    insights.push({
      id: "manual",
      icon: "M",
      title: "Manuel kayıtlar aktif",
      detail: `${manualSlots} manuel rezervasyon var.`,
      message: "Manuel kayıtları checkout ile kapatırsan satış ve performans raporu temiz kalır.",
      actionLabel: "Checkout aç",
      view: "transactions",
      focus: "#transactions-body",
    });
  }

  if (!insights.length) {
    insights.push({
      id: "healthy",
      icon: "OK",
      title: "Operasyon sağlıklı",
      detail: "Temel kurulum tamam görünüyor.",
      message: "Panel iyi durumda. Şimdi tekrar müşteri kampanyası veya doluluk artırma akışı planlayabiliriz.",
      actionLabel: "Pazarlamaya git",
      view: "campaigns",
      focus: "#campaigns-board",
    });
  }

  return insights.slice(0, 6);
}

function renderAdaAssistant(assistantPayload = {}) {
  if (!adaAssistant || !venueState.dashboard) return;
  const insights = Array.isArray(assistantPayload.insights) && assistantPayload.insights.length
    ? assistantPayload.insights
    : buildAdaInsights(venueState.dashboard);
  const primary = insights[0];
  venueState.adaInsights = insights;

  if (adaLauncherHint) {
    adaLauncherHint.textContent = "Sana nasıl yardımcı olayım?";
  }
  if (adaSpeech) {
    adaSpeech.textContent = primary?.message || getTyeeAssistantOverview();
  }
  if (adaStatusTitle) {
    adaStatusTitle.textContent = assistantPayload.summary?.title || "Tyee işletme paneline hoş geldin";
  }
  if (adaStatus) {
    adaStatus.textContent =
      assistantPayload.summary?.detail ||
      `${insights.length} öneri hazır. Takvim, hizmet, ödeme, müşteri, yorum ve kampanya akışını birlikte toparlayabiliriz.`;
  }
  if (adaActions) {
    adaActions.innerHTML = insights
      .map(
        (item) => `
          <button class="ada-action" type="button" data-ada-action="${escapeHtml(item.id)}">
            <span class="ada-action-icon">${escapeHtml(item.icon || "A")}</span>
            <span class="ada-action-copy">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.detail)}</span>
            </span>
            <span class="ada-action-next">›</span>
          </button>
        `,
      )
      .join("");
  }
}

async function refreshAdaAssistant() {
  if (!venueState.dashboard) return;
  const fallback = {
    insights: buildAdaInsights(venueState.dashboard),
    summary: null,
  };
  try {
    const payload = await venueApiRequest(`/api/venue/assistant?venueId=${encodeURIComponent(venueState.venueId || "")}`);
    renderAdaAssistant({
      insights: payload.insights?.length ? payload.insights : fallback.insights,
      summary: payload.summary || fallback.summary,
    });
  } catch (error) {
    renderAdaAssistant(fallback);
  }
}

function openAdaPanel() {
  venueState.adaOpen = true;
  adaAssistant?.classList.add("is-open");
  adaPanel?.classList.remove("hidden");
  adaLauncher?.setAttribute("aria-expanded", "true");
  if (adaChatLog && !adaChatLog.dataset.ready) {
    appendAdaChatMessage("ada", getTyeeAssistantWelcome());
    appendAdaChatMessage("ada", getTyeeAssistantOverview());
    adaChatLog.dataset.ready = "true";
  }
}

function closeAdaPanel() {
  venueState.adaOpen = false;
  resetAdaLivePanel();
  adaAssistant?.classList.remove("is-open");
  adaPanel?.classList.add("hidden");
  adaLauncher?.setAttribute("aria-expanded", "false");
}

function resetAdaLivePanel() {
  adaAssistant?.classList.remove("is-live");
  if (adaStage?.querySelector("iframe")) {
    adaStage.innerHTML = adaDefaultStageMarkup;
  }
  if (adaLiveButton) {
    adaLiveButton.disabled = false;
    adaLiveButton.classList.remove("is-waiting");
    adaLiveButton.textContent = "Canlı görüşmeyi başlat";
  }
}

function toggleAdaPanel() {
  if (venueState.adaOpen) {
    closeAdaPanel();
  } else {
    openAdaPanel();
  }
}

function focusAdaTarget(selector = "") {
  if (!selector) return;
  window.requestAnimationFrame(() => {
    const target = document.querySelector(selector);
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
    target?.focus?.({ preventScroll: true });
  });
}

function runAdaAction(actionId = "") {
  const action = (venueState.adaInsights || []).find((item) => item.id === actionId);
  if (!action) return;
  if (action.view) setView(action.view);
  focusAdaTarget(action.focus);
  showVenueToast(`${action.actionLabel || action.title} açıldı.`);
  appendAdaChatMessage("ada", action.message || `${action.title} ekranını açtım.`);
  if (action.id === "campaign-empty-slots" || action.id === "healthy") {
    requestCampaignSmsDraft({ announce: true });
  }
}

function appendAdaChatMessage(role = "ada", message = "") {
  if (!adaChatLog || !message) return;
  const node = document.createElement("div");
  node.className = `ada-chat-message ${role === "user" ? "is-user" : "is-ada"}`;
  node.textContent = message;
  adaChatLog.appendChild(node);
  adaChatLog.scrollTo({ top: adaChatLog.scrollHeight, behavior: "smooth" });
}

function answerAdaQuestion(question = "") {
  const payload = venueState.dashboard || {};
  const openSlots = getAdaOpenSlotCount(payload);
  const activeServices = getAdaActiveServices(payload.settings || {});
  const expenseCount = payload.finance?.expenses?.length || 0;
  const waitingReviews = Number(payload.reviewSummary?.waitingRequests || 0);
  const galleryCount = getAdaGalleryCount(payload.settings || {});
  const venueName = normalizeSettings(payload.settings || {}).businessName || payload.venue?.name || "işletmen";
  const topic = matchTyeeAssistantTopic(question);

  return buildTyeeTopicAnswer(topic, {
    openSlots,
    activeServices: activeServices.length,
    expenseCount,
    waitingReviews,
    galleryCount,
    venueName,
  });
}

async function connectAdaLive() {
  if (!adaLiveButton) return;
  adaLiveButton.disabled = true;
  adaLiveButton.classList.add("is-waiting");
  adaLiveButton.textContent = "Tyee bağlantısı kontrol ediliyor...";
  if (adaStatus) adaStatus.textContent = "Simli oturumu hazırlanıyor.";

  try {
    const payload = await venueApiRequest("/api/venue/avatar/session", {
      method: "POST",
      body: JSON.stringify({ venueId: venueState.venueId, provider: "simli", avatarName: "Tyee" }),
    });
    const sessionUrl = String(payload.sessionUrl || payload.stageUrl || "").trim();

    if (sessionUrl && adaStage) {
      adaAssistant?.classList.add("is-live");
      adaStage.innerHTML = `<iframe title="Tyee canlı avatar" src="${escapeHtml(sessionUrl)}" allow="camera; microphone; autoplay; clipboard-write"></iframe>`;
      adaLiveButton.textContent = "Tyee canlı bağlantıda";
      appendAdaChatMessage("ada", "Canlı avatar sahnesini açtım. Simli bağlantısı burada çalışacak.");
      return;
    }

    if (adaStatusTitle) adaStatusTitle.textContent = "Canlı avatar hazır değil";
    if (adaStatus) adaStatus.textContent = payload.message || "Simli ortam bilgileri tamamlanınca Tyee burada canlı açılacak.";
    adaLiveButton.textContent = "Simli yapılandırması bekleniyor";
    appendAdaChatMessage("ada", payload.message || "Simli bağlantısı henüz hazır değil. Yine de panel önerilerini vermeye devam ediyorum.");
  } catch (error) {
    if (adaStatusTitle) adaStatusTitle.textContent = "Bağlantı kurulamadı";
    if (adaStatus) adaStatus.textContent = error.message || "Canlı avatar bağlantısı şu an hazır değil.";
    adaLiveButton.textContent = "Tekrar dene";
    adaLiveButton.disabled = false;
    appendAdaChatMessage("ada", error.message || "Canlı avatar bağlantısı şu an kurulamadı.");
  }
}

function hasCompletedServiceDefinition(area = {}) {
  if (!area?.isActive) return false;
  const name = String(area.name || "").trim();
  const normalizedName = name.toLocaleLowerCase("tr-TR");
  const isPlaceholderName = !name || normalizedName === "ana hizmet" || /^hizmet\s+\d+$/i.test(name);
  const hasPrice = parseFinanceAmount(area.price) > 0;
  const hasDurationOrCapacity = Boolean(String(area.capacity || "").trim());
  return !isPlaceholderName && (hasPrice || hasDurationOrCapacity);
}

function getGuideSteps(payload) {
  const settings = normalizeSettings(payload?.settings || {});
  const activeAreas = Array.isArray(settings.areas) ? settings.areas.filter((area) => area?.isActive) : [];
  const hasCompletedService = activeAreas.some(hasCompletedServiceDefinition);
  const transactions = payload?.transactions || [];
  const completedSales = transactions.filter((item) => item.status === "Tamamlandı");
  const manualEntries = payload?.slotState?.manualEntries || venueState.manualEntries || {};
  const firstBooking = transactions.length > 0 || Object.keys(manualEntries).length > 0;
  const category = settings.details?.category || "";
  const hasCategory = Boolean(category && category !== "Kategori seçilmedi");
  const hasContactPhone = Boolean(settings.contact?.phone || settings.contact?.whatsapp || payload?.user?.phone);
  const hasLocation = Boolean(
    settings.locationStatus === "Girilmiş" ||
      settings.location?.address ||
      (settings.location?.lat && settings.location?.lng) ||
      settings.details?.district,
  );
  const hasCriticalProfile = Boolean(settings.businessName && hasCategory && hasContactPhone && hasLocation);

  return [
    {
      title: "İşletme profilini tamamla",
      shortTitle: "Profil",
      detail: "İşletme adı, kategori, telefon ve bölge/konum bilgisi yeterli.",
      shortDetail: "Ad, kategori, telefon, konum",
      done: hasCriticalProfile,
      view: "settings",
      tab: "İşletme Bilgileri",
      focus: "#settings-business-name",
    },
    {
      title: "İlk hizmetini oluştur",
      shortTitle: "Hizmet menüsü",
      detail: "Rezervasyona açık en az bir hizmete ad ve fiyat veya süre/kontenjan bilgisi gir.",
      shortDetail: "Ad + fiyat veya süre",
      done: hasCompletedService,
      view: "sales-products",
      focus: "#sales-products-view [data-area-add]",
    },
    {
      title: "İlk rezervasyonu oluştur",
      shortTitle: "İlk rezervasyon",
      detail: "Takvime ilk randevuyu düşür ve slot düzenini doğrula.",
      shortDetail: "Takvime test randevusu",
      done: firstBooking,
      view: "calendar",
      focus: "#calendar-new-appointment",
    },
    {
      title: "İlk tahsilatı tamamla",
      shortTitle: "İlk tahsilat",
      detail: "Checkout akışını canlı test et ve ilk satışı kapat.",
      shortDetail: "Checkout kapatma testi",
      done: completedSales.length > 0,
      view: "transactions",
      focus: "#transactions-body",
    },
  ];
}

function renderSidebarSetupGuide(steps) {
  if (!venueSidebarGuide) return;
  const completedCount = steps.filter((step) => step.done).length;
  if (venueSetupProgress) venueSetupProgress.textContent = `${completedCount}/${steps.length}`;
  setSetupRoadmapOpen(venueState.setupRoadmapOpen);

  venueSidebarGuide.innerHTML = steps
    .map(
      (step, index) => `
        <button class="venue-setup-step ${step.done ? "is-complete" : ""}" type="button" data-guide-view="${escapeHtml(step.view)}" data-guide-tab="${escapeHtml(step.tab || "")}" data-guide-focus="${escapeHtml(step.focus || "")}">
          <span class="venue-setup-step-index">${step.done ? "✓" : index + 1}</span>
          <span class="venue-setup-step-copy">
            <strong>${escapeHtml(step.shortTitle || step.title)}</strong>
            <small>${escapeHtml(step.shortDetail || step.detail)}</small>
          </span>
        </button>
      `,
    )
    .join("");
}

function setSetupRoadmapOpen(isOpen = false) {
  venueState.setupRoadmapOpen = Boolean(isOpen);
  setupRoadmap?.classList.toggle("is-collapsed", !venueState.setupRoadmapOpen);
  setupRoadmap?.classList.toggle("is-open", venueState.setupRoadmapOpen);
  setupRoadmapToggle?.setAttribute("aria-expanded", String(venueState.setupRoadmapOpen));
}

function renderGuidanceRail(payload) {
  const steps = getGuideSteps(payload);
  renderSidebarSetupGuide(steps);

  if (venueGuidesChecklist) {
    venueGuidesChecklist.innerHTML = steps
      .map(
        (step, index) => `
          <article class="guide-step ${step.done ? "is-complete" : ""}">
            <div class="guide-step-head">
              <span class="guide-step-index">${step.done ? "✓" : index + 1}</span>
              <div>
                <div class="guide-step-title">${escapeHtml(step.title)}</div>
                <small>${escapeHtml(step.detail)}</small>
              </div>
            </div>
            <button class="guide-step-action" type="button" data-guide-view="${escapeHtml(step.view)}" data-guide-tab="${escapeHtml(step.tab || "")}" data-guide-focus="${escapeHtml(step.focus || "")}">${step.done ? "Gözden geçir" : "Bu adıma git"}</button>
          </article>
        `,
      )
      .join("");
  }

  if (venueNextAppointments) {
    const upcoming = (payload?.transactions || [])
      .filter((item) => item.status !== "Tamamlandı" && item.status !== "İptal")
      .slice(0, 4);

    venueNextAppointments.innerHTML = upcoming.length
      ? upcoming
          .map(
            (item) => `
              <article class="rail-appointment-card">
                <strong>${escapeHtml(item.customer || "Yeni rezervasyon")}</strong>
                <small>${escapeHtml(item.field || "Ana hizmet")} · ${escapeHtml(item.businessType || "Rezervasyon")}</small>
                <div class="rail-appointment-meta">
                  <span>${escapeHtml(item.date || "-")} · ${escapeHtml(item.time || "-")}</span>
                  <span>${escapeHtml(item.amount || "₺0")}</span>
                </div>
                <button class="guide-step-action" type="button" data-open-transaction="${escapeHtml(String(item.id || ""))}">Detayı aç</button>
              </article>
            `,
          )
          .join("")
      : `<article class="rail-appointment-card"><strong>Bugün sırada rezervasyon yok</strong><small>İlk rezervasyonu takvimden oluşturabilirsin.</small></article>`;
  }

  if (venueOpsNotes) {
    venueOpsNotes.innerHTML = venueOperationalNotes
      .map(
        (item) => `
          <article class="rail-note-card">
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.body)}</small>
          </article>
        `,
      )
      .join("");
  }
}

function buildAppointmentFromTransaction(transaction = {}) {
  return {
    title: transaction.customer || "Rezervasyon",
    service: transaction.field || "Ana hizmet",
    serviceType: transaction.businessType || "Rezervasyon",
    datetime: `${transaction.date || "-"} · ${transaction.time || "-"}`,
    status: transaction.status || "Bekliyor",
    paymentStatus: transaction.deposit || "₺0",
    total: transaction.amount || "₺0",
    commission: transaction.commission || "₺0",
    channel: transaction.channel || "Platform",
    notes:
      transaction.monthlyPackageActive
        ? "Müşteri aktif paket kullanıyor. Kalan hakları checkout sonrası kontrol et."
        : "Rezervasyon sonrası müşteri notu, tekrar ziyaret ve ödeme kapanışı aynı akıştan yönetilebilir.",
  };
}

function buildAppointmentFromSlot(slotKey = "") {
  if (!venueState.dashboard) return null;
  const match = String(slotKey).match(/^(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2})$/);
  const dateKey = match?.[1] || "";
  const time = match?.[2] || "";
  const displayDays = buildDisplayWeek(venueState.dashboard.weekDays || []);
  const dayIndex = displayDays.findIndex((item) => formatDateKey(item.dateObj) === dateKey);
  const rawDay = venueState.dashboard.weekDays?.[dayIndex];
  const manualEntry = venueState.manualEntries[slotKey];
  const transaction = (venueState.dashboard.transactions || []).find(
    (item) => String(item.time || "") === time && String(item.date || "").includes(dateKey.split("-").reverse().join(".")),
  );
  if (transaction) return buildAppointmentFromTransaction(transaction);

  const serviceInfo = getSlotServiceInfo(slotKey, rawDay?.slots?.find((item) => item.time === time), manualEntry);
  return {
    title: manualEntry?.name || "Yeni rezervasyon",
    service: serviceInfo.name,
    serviceType: serviceInfo.type,
    datetime: `${dateKey || "-"} · ${time || "-"}`,
    status: manualEntry ? "Manuel giriş" : "Rezervasyona açık",
    paymentStatus: manualEntry?.deposit ? `Kapora ${manualEntry.deposit} TL` : "Kapora yok",
    total: manualEntry?.total ? `${manualEntry.total} TL` : "₺0",
    commission: "Yüzde 7",
    channel: manualEntry?.isSubscription ? "Paket / abonelik" : manualEntry ? "Manuel" : "Marketplace",
    notes: manualEntry?.notes || "Bu slotu drawer içinden müşteri, hizmet ve tahsilat detaylarıyla yönetebilirsin.",
  };
}

function renderAppointmentDrawer(appointment) {
  if (!appointmentDrawerBody || !appointmentDrawerTitle) return;
  appointmentDrawerTitle.textContent = appointment.title || "Rezervasyon detayı";
  appointmentDrawerBody.innerHTML = `
    <section class="drawer-card">
      <div class="drawer-card-head">
        <div>
          <strong>${escapeHtml(appointment.title)}</strong>
          <span>${escapeHtml(appointment.service)} · ${escapeHtml(appointment.serviceType)}</span>
        </div>
        ${statusPill(escapeHtml(appointment.status))}
      </div>
      <div class="drawer-metrics">
        <article class="drawer-metric">
          <span>Tarih / saat</span>
          <strong>${escapeHtml(appointment.datetime)}</strong>
        </article>
        <article class="drawer-metric">
          <span>Kanal</span>
          <strong>${escapeHtml(appointment.channel)}</strong>
        </article>
        <article class="drawer-metric">
          <span>Toplam</span>
          <strong>${escapeHtml(appointment.total)}</strong>
        </article>
        <article class="drawer-metric">
          <span>Kapora / ödeme</span>
          <strong>${escapeHtml(appointment.paymentStatus)}</strong>
        </article>
      </div>
    </section>

    <section class="drawer-card">
      <div class="drawer-card-head">
        <div>
          <strong>Operasyon akışı</strong>
          <span>Fresha mantığına yakın sade rezervasyon drawer’ı</span>
        </div>
      </div>
      <div class="drawer-list">
        <div class="drawer-line"><span>Hizmet / kaynak</span><strong>${escapeHtml(appointment.service)}</strong></div>
        <div class="drawer-line"><span>Checkout hedefi</span><strong>${escapeHtml(appointment.total)}</strong></div>
        <div class="drawer-line"><span>Tyee payı</span><strong>${escapeHtml(appointment.commission)}</strong></div>
        <div class="drawer-line"><span>Sonraki adım</span><strong>Checkout veya müşteri kartı</strong></div>
      </div>
    </section>

    <section class="drawer-card">
      <div class="drawer-card-head">
        <div>
          <strong>Müşteri ve notlar</strong>
          <span>Rezervasyonun çevresindeki CRM katmanı</span>
        </div>
      </div>
      <div class="drawer-list">
        <div class="drawer-line"><span>Müşteri kartı</span><strong>${escapeHtml(appointment.title)}</strong></div>
        <div class="drawer-line"><span>Not</span><strong>${escapeHtml(appointment.notes)}</strong></div>
      </div>
      <div class="drawer-cta-row">
        <button class="ghost-button" type="button" data-drawer-view="customers">Müşteri kartına git</button>
        <button class="solid-button" type="button" data-drawer-view="transactions">Checkout aç</button>
      </div>
    </section>
  `;
}

function openAppointmentDrawer(appointment) {
  if (!appointmentDrawer || !appointment) return;
  venueState.activeAppointment = appointment;
  renderAppointmentDrawer(appointment);
  appointmentDrawer.classList.remove("hidden");
}

function closeAppointmentDrawer() {
  venueState.activeAppointment = null;
  appointmentDrawer?.classList.add("hidden");
}

function statusPill(status) {
  const isActive = status === "Aktif" || status === "Tamamlandı";
  return `<span class="status-pill ${isActive ? "is-active" : "is-passive"}">${status}</span>`;
}

function renderSubscriptions(items) {
  if (!items.length) {
    subscriptionsBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table-cell">Henüz üyelik veya paket kaydı yok.</td>
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
        <td colspan="18" class="empty-table-cell">Henüz checkout veya satış kaydı yok.</td>
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
            <div class="table-action-stack">
              <button class="table-action-button is-secondary" type="button" data-open-transaction="${item.id}">Detay</button>
              ${
                item.reservationId && item.status !== "Tamamlandı" && item.status !== "Pasif"
                  ? `<button class="table-action-button" type="button" data-complete-reservation="${item.reservationId}">Tamamla</button>`
                  : `<span class="muted-table-text">${item.reviewStatus === "received" ? "Yorum alındı" : "-"}</span>`
              }
            </div>
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
    "Sektör Modülleri": renderOperationsSettings,
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

function profileImageSettingsMarkup(settings) {
  const media = settings.media || {};
  const profileImage = getVenueProfileImage(settings);
  const preview = profileImage
    ? `<img src="${escapeHtml(profileImage)}" alt="${escapeHtml(getVenueDisplayName())} profil resmi" />`
    : `<span>${escapeHtml(getInitials(getVenueDisplayName()))}</span>`;

  return `
    <div class="settings-profile-image-card">
      <div class="settings-profile-image-preview">${preview}</div>
      <div class="settings-profile-image-copy">
        <strong>Profil resmi</strong>
        <small>Kontrol Merkezi sağ üstte ve işletme kimliğinde görünür.</small>
        <label class="settings-input-field settings-profile-url-field">
          <span>Profil resmi URL</span>
          <input id="settings-media-profile-url" type="url" value="${escapeHtml(media.profileUrl || "")}" placeholder="https://..." />
        </label>
        <label class="settings-profile-upload-button">
          <span>Resim yükle</span>
          <input type="file" accept="image/*" data-profile-image-upload />
        </label>
      </div>
    </div>
  `;
}

function mediaSettingsFields(settings) {
  const media = settings.media;
  const gallery = normalizeMediaGallery(media.gallery);
  const remainingSlots = Math.max(0, VENUE_GALLERY_LIMIT - gallery.length);
  const galleryMarkup = gallery.length
    ? gallery
        .map(
          (item, index) => `
            <article class="settings-media-card${index === 0 ? " is-cover-source" : ""}">
              <div class="settings-media-thumb">
                <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.role || item.name || "İşletme görseli")}" />
                ${index === 0 ? `<span class="settings-media-badge">Kapak</span>` : ""}
              </div>
              <div class="settings-media-card-body">
                <div class="settings-media-card-copy">
                  <strong>${escapeHtml(item.role || getGalleryRole(index))}</strong>
                  <small>${escapeHtml(item.name || `Görsel ${index + 1}`)}</small>
                </div>
                <div class="settings-media-actions">
                  <button class="ghost-button" type="button" data-media-move="${index}" data-media-direction="-1"${index === 0 ? " disabled" : ""}>Yukarı</button>
                  <button class="ghost-button" type="button" data-media-move="${index}" data-media-direction="1"${index === gallery.length - 1 ? " disabled" : ""}>Aşağı</button>
                  <button class="ghost-button danger" type="button" data-media-remove="${index}">Kaldır</button>
                </div>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="settings-empty-box">Henüz mekan fotoğrafı eklenmedi. İlk fotoğraf marketplace kartında kapak olarak görünür.</div>`;

  return `
    ${profileImageSettingsMarkup(settings)}
    <div class="settings-media-intro">
      <div>
        <strong>Mekan fotoğrafları</strong>
        <span>Dükkan dışı, iç görünüş, çalışanlar ve hizmet alanlarını göster. En fazla ${VENUE_GALLERY_LIMIT} fotoğraf.</span>
      </div>
      <output>${gallery.length} / ${VENUE_GALLERY_LIMIT}</output>
    </div>
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
    <label class="settings-upload-box${remainingSlots === 0 ? " is-disabled" : ""}">
      <span>${remainingSlots === 0 ? "Galeri dolu" : "Mekan fotoğrafı ekle"}</span>
      <input type="file" accept="image/png,image/jpeg,image/webp" multiple data-media-upload${remainingSlots === 0 ? " disabled" : ""} />
      <small>${remainingSlots === 0 ? "Yeni görsel eklemek için önce bir fotoğraf kaldır." : `${remainingSlots} fotoğraf daha ekleyebilirsin. PNG, JPG ve WebP dosyaları 1600px'e kadar kaliteli ölçeklenir.`}</small>
    </label>
    <div class="settings-media-grid">${galleryMarkup}</div>
  `;
}

function areaSettingsFields(settings, startIndex = 0) {
  const areasMarkup = settings.areas
    .map(
      (area, localIndex) => {
        const index = startIndex + localIndex;
        return `
        <article class="settings-area-card" data-area-card="${index}">
          <div class="settings-area-head">
            <strong>Satış kalemi ${index + 1}</strong>
            <button class="ghost-button danger" type="button" data-area-delete="${index}">Sil</button>
          </div>
          <div class="settings-form-grid">
            <label class="settings-input-field">
              <span>Hizmet adı</span>
              <input data-area-name="${index}" type="text" value="${escapeHtml(area.name)}" placeholder="Küçük ırk bakım, Saha 1, Stüdyo A..." />
            </label>
            <label class="settings-input-field">
              <span>Hizmet türü</span>
              <input data-area-type="${index}" type="text" value="${escapeHtml(area.type)}" placeholder="Bakım paketi, saha, oda, ders, seans..." />
            </label>
            <label class="settings-input-field">
              <span>Kontenjan / not</span>
              <input data-area-capacity="${index}" type="text" value="${escapeHtml(area.capacity)}" placeholder="İsteğe bağlı: 1 pet, 2 kişi, 60 dk..." />
            </label>
            <label class="settings-input-field">
              <span>Satış fiyatı</span>
              <input data-area-price="${index}" type="text" value="${escapeHtml(area.price)}" placeholder="₺0" />
            </label>
          </div>
        </article>
      `;
      },
    )
    .join("");

  return `
    <div class="settings-area-list">${areasMarkup}</div>
    <button class="ghost-button settings-inline-action" type="button" data-area-add>+ Alan ekle</button>
  `;
}

function facilitySettingsFields(settings) {
  const visibleFeatures = getVisibleFacilityFeatures(settings);
  const selectedCount = visibleFeatures.filter((item) => item.enabled).length;
  const facilitiesMarkup = visibleFeatures
    .map(
      (item) => `
        <label class="settings-feature-card${item.enabled ? " is-selected" : ""}" data-facility-card="${escapeHtml(item.id)}">
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
      <span>Müşteri tesis detayında yalnızca kategoriye uygun ve işaretlediğin özellikleri görecek.</span>
    </div>
    <div class="settings-feature-grid">${facilitiesMarkup}</div>
  `;
}

function operationModuleFields(settings) {
  const blueprint = getOperationsBlueprint(settings);
  const moduleCards = blueprint.moduleCards
    .map(
      (module) => `
        <label class="settings-module-card ${module.required ? "is-required" : ""} ${module.enabled ? "is-enabled" : ""}">
          <input
            type="checkbox"
            data-operation-module="${escapeHtml(module.id)}"
            ${module.enabled ? "checked" : ""}
            ${module.required ? "disabled" : ""}
          />
          <span class="settings-module-badge">${module.required ? "Olmazsa olmaz" : module.recommended ? "Önerilen" : "Opsiyonel"}</span>
          <strong>${escapeHtml(module.label)}</strong>
          <small>${escapeHtml(module.description)}</small>
        </label>
      `,
    )
    .join("");

  return `
    <div class="settings-ops-hero">
      <div>
        <span>Sektör şeması</span>
        <h3>${escapeHtml(blueprint.industryLabel)}</h3>
        <p>${escapeHtml(blueprint.notes)}</p>
      </div>
      <div class="settings-ops-score">
        <strong>${blueprint.requiredCount}</strong>
        <span>zorunlu modül</span>
      </div>
    </div>

    <div class="settings-ops-meta-grid">
      <label class="settings-input-field">
        <span>Rezervasyon nesnesi</span>
        <input id="settings-operation-primary-object" type="text" value="${escapeHtml(blueprint.primaryObject)}" />
      </label>
      <label class="settings-input-field">
        <span>Kaynak adı</span>
        <input id="settings-operation-resource-label" type="text" value="${escapeHtml(blueprint.resourceLabel)}" />
      </label>
      <label class="settings-input-field">
        <span>Ekip / uzman adı</span>
        <input id="settings-operation-team-label" type="text" value="${escapeHtml(blueprint.teamLabel)}" />
      </label>
      <label class="settings-input-field">
        <span>Kontenjan birimi</span>
        <input id="settings-operation-capacity-unit" type="text" value="${escapeHtml(blueprint.capacityUnit)}" />
      </label>
    </div>

    <label class="settings-input-field">
      <span>Rezervasyon akışı</span>
      <input id="settings-operation-booking-mode" type="text" value="${escapeHtml(blueprint.bookingMode)}" />
    </label>
    <label class="settings-input-field">
      <span>Kapora / iptal kuralı</span>
      <input id="settings-operation-deposit-rule" type="text" value="${escapeHtml(blueprint.depositRule)}" />
    </label>
    <label class="settings-input-field">
      <span>Gerekli form / not</span>
      <textarea id="settings-operation-required-forms" rows="3">${escapeHtml(blueprint.requiredForms)}</textarea>
    </label>
    <label class="settings-input-field">
      <span>Operasyon notu</span>
      <textarea id="settings-operation-notes" rows="3">${escapeHtml(blueprint.notes)}</textarea>
    </label>

    <div class="settings-module-summary">
      <strong>${blueprint.enabledCount} modül aktif</strong>
      <span>Zorunlu modüller kilitli gelir; önerilenleri işletme modeline göre açıp kapatabilirsin.</span>
    </div>
    <div class="settings-module-grid">${moduleCards}</div>
  `;
}

function renderOperationsSettings(settings) {
  return `
    ${settingsSection(
      "Türkiye sektör modülleri",
      "Restoran, dövmeci, pet kuaför, berber, güzellik merkezi, saha, kort, hoca ve stüdyo akışlarını aynı çekirdeğe bağlayan kurgu.",
      operationModuleFields(settings),
    )}
    ${settingsSaveMarkup()}
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
        <div class="settings-form-grid settings-business-info-grid">
          <label class="settings-input-field">
            <span>İşletme adı</span>
            <input id="settings-business-name" type="text" value="${escapeHtml(settings.businessName)}" />
          </label>
          <label class="settings-select-field">
            <span>Kategori</span>
            <select id="settings-detail-category">
              ${BUSINESS_CATEGORY_OPTIONS
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
          <label class="settings-input-field settings-business-description-field">
            <span>İşletme açıklaması</span>
            <textarea id="settings-detail-description" rows="3" placeholder="Müşterinin göreceği kısa açıklama">${escapeHtml(details.description)}</textarea>
          </label>
          <label class="settings-input-field settings-business-policy-field">
            <span>İptal politikası</span>
            <input id="settings-detail-cancellation" type="text" value="${escapeHtml(details.cancellationPolicy)}" placeholder="Rezervasyondan 2 saat öncesine kadar" />
          </label>
        </div>
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
          ${BUSINESS_CATEGORY_OPTIONS
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
  return `
    ${mediaSettingsFields(settings)}
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
            <div class="settings-area-actions">
              <label class="settings-switch">
                <input type="checkbox" data-area-active="${index}" ${area.isActive ? "checked" : ""} />
                <span>Aktif</span>
              </label>
              <button class="ghost-button danger" type="button" data-area-delete="${index}">Sil</button>
            </div>
          </div>
          <div class="settings-form-grid">
            <label class="settings-input-field">
              <span>Hizmet adı</span>
              <input data-area-name="${index}" type="text" value="${escapeHtml(area.name)}" placeholder="Küçük ırk bakım, Saha 1, Stüdyo A..." />
            </label>
            <label class="settings-input-field">
              <span>Hizmet türü</span>
              <input data-area-type="${index}" type="text" value="${escapeHtml(area.type)}" placeholder="Bakım paketi, saha, oda, ders, seans..." />
            </label>
            <label class="settings-input-field">
              <span>Kontenjan / not</span>
              <input data-area-capacity="${index}" type="text" value="${escapeHtml(area.capacity)}" placeholder="İsteğe bağlı: 1 pet, 2 kişi, 60 dk..." />
            </label>
            <label class="settings-input-field">
              <span>Satış fiyatı</span>
              <input data-area-price="${index}" type="text" value="${escapeHtml(area.price)}" placeholder="₺0" />
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
            "Sadece randevu",
            "Ön ödeme (kapora)",
            "Ödemenin tamamını al",
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
    <div class="settings-question settings-contract-status">
      <strong>Sözleşme durumları</strong>
      <label class="settings-radio settings-contract-check">
        <input id="settings-contract-terms" type="checkbox" ${contracts.termsAccepted ? "checked" : ""} />
        <span>İşletme kullanım ve rezervasyon aracılık sözleşmesi okundu, onaylandı</span>
      </label>
      <label class="settings-radio settings-contract-check">
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
              <label class="review-note-editor">
                <span>İşletme notu</span>
                <textarea data-review-note="${escapeHtml(item.id)}" rows="2" placeholder="Bu yorumla ilgili iç not...">${escapeHtml(item.businessNote || "")}</textarea>
              </label>
              <div class="review-note-actions">
                <button class="ghost-button" type="button" data-review-note-save="${escapeHtml(item.id)}">Notu kaydet</button>
                <span class="venue-save-status" data-review-note-status="${escapeHtml(item.id)}"></span>
              </div>
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
  const visibleAreaScope = Array.from(document.querySelectorAll(".view-section:not(.hidden)"))
    .map((section) => section.querySelector("[data-area-card], [data-area-active]") ? section : null)
    .find(Boolean);
  const scopedValueOf = (root, selector) => root?.querySelector(selector)?.value.trim() || "";
  const scopedChecked = (root, selector, fallback = false) => {
    const input = root?.querySelector(selector);
    return input ? Boolean(input.checked) : fallback;
  };

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
    next.operations = normalizeOperations(next);
    next.media = {
      ...current.media,
      profileUrl: valueOf("#settings-media-profile-url"),
      logoUrl: valueOf("#settings-media-logo-url"),
      coverUrl: valueOf("#settings-media-cover-url"),
    };
    const pendingFacilitySelections = venueState.pendingFacilitySelections || {};
    next.facilities = (current.facilities || FACILITY_FEATURES).map((item) => {
      const hasPendingSelection = Object.prototype.hasOwnProperty.call(pendingFacilitySelections, item.id);
      return {
        ...item,
        enabled: hasPendingSelection ? Boolean(pendingFacilitySelections[item.id]) : checked(`[data-facility-id="${item.id}"]`),
      };
    });
    const allowedFeatureIds = new Set(getVisibleFacilityFeatures(next).map((item) => item.id));
    next.facilities = next.facilities.map((item) => ({
      ...item,
      enabled: allowedFeatureIds.has(item.id) ? item.enabled : false,
    }));
  }

  if (venueState.activeSettingsTab === "Sektör Modülleri") {
    const currentOperations = normalizeOperations(current);
    const enabledModuleIds = Array.from(document.querySelectorAll("[data-operation-module]"))
      .filter((input) => input.checked)
      .map((input) => input.dataset.operationModule)
      .filter(Boolean);

    next.operations = {
      ...currentOperations,
      primaryObject: valueOf("#settings-operation-primary-object") || currentOperations.primaryObject,
      resourceLabel: valueOf("#settings-operation-resource-label") || currentOperations.resourceLabel,
      teamLabel: valueOf("#settings-operation-team-label") || currentOperations.teamLabel,
      capacityUnit: valueOf("#settings-operation-capacity-unit") || currentOperations.capacityUnit,
      bookingMode: valueOf("#settings-operation-booking-mode") || currentOperations.bookingMode,
      depositRule: valueOf("#settings-operation-deposit-rule") || currentOperations.depositRule,
      requiredForms: valueOf("#settings-operation-required-forms") || currentOperations.requiredForms,
      notes: valueOf("#settings-operation-notes") || currentOperations.notes,
      modules: enabledModuleIds,
    };
  }

  if (visibleAreaScope?.querySelector("[data-area-card]")) {
    const mergedAreas = Array.isArray(current.areas) ? [...current.areas] : [];
    Array.from(visibleAreaScope.querySelectorAll("[data-area-card]")).forEach((card) => {
      const index = card.dataset.areaCard;
      const currentArea = mergedAreas[index] || {};
      mergedAreas[index] = {
        name: scopedValueOf(card, `[data-area-name="${index}"]`),
        type: scopedValueOf(card, `[data-area-type="${index}"]`),
        capacity: scopedValueOf(card, `[data-area-capacity="${index}"]`),
        price: scopedValueOf(card, `[data-area-price="${index}"]`),
        paymentMode: scopedValueOf(card, `[data-area-payment-mode="${index}"]`) || currentArea.paymentMode || "commission_deposit",
        depositType: scopedValueOf(card, `[data-area-deposit-type="${index}"]`) || currentArea.depositType || "percent",
        depositValue: scopedValueOf(card, `[data-area-deposit-value="${index}"]`) || currentArea.depositValue || "",
        isActive: scopedChecked(visibleAreaScope, `[data-area-active="${index}"]`, currentArea.isActive !== false),
      };
    });
    next.areas = mergedAreas;
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

function addSalesProductDraft() {
  if (!venueState.dashboard) return;
  venueState.dashboard.settings = collectSettingsPayload();
  const settings = normalizeSettings(venueState.dashboard.settings);
  const selectedCategory = venueState.selectedServiceCategory && venueState.selectedServiceCategory !== "all"
    ? venueState.selectedServiceCategory
    : "Hizmet";
  settings.areas.push({
    name: `Hizmet ${settings.areas.length + 1}`,
    type: selectedCategory,
    capacity: "",
    price: "",
    paymentMode: "commission_deposit",
    depositType: "percent",
    depositValue: "",
    isActive: true,
  });
  venueState.selectedServiceIndex = settings.areas.length - 1;
  venueState.dashboard.settings = settings;
  renderSalesProducts(settings);
  renderCalendarFieldPills();
  renderGuidanceRail(venueState.dashboard);
}

async function saveVenueSettings() {
  setSaveStatus("[data-settings-status]", "Kaydediliyor...");
  const settings = collectSettingsPayload();
  const payload = await venueApiRequest("/api/venue/settings", {
    method: "PATCH",
    body: JSON.stringify({ venueId: venueState.venueId, settings }),
  });
  venueState.dashboard.settings = normalizeSettings(payload.settings);
  saveVenueBackup();
  venueState.pendingFacilitySelections = {};
  renderVenueIdentity();
  renderSettingsTabs(venueState.dashboard.settings.tabs);
  renderSettingsOnboarding(venueState.dashboard.settings);
  renderSalesProducts(venueState.dashboard.settings);
  renderCalendarFieldPills();
  renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
  renderTransactions(venueState.dashboard.transactions || []);
  renderGuidanceRail(venueState.dashboard);
  refreshCalendarOps().catch(() => renderCalendarOperations());
  setSaveStatus("[data-settings-status]", "Ayarlar kaydedildi");
  showVenueToast("Ayarlar kaydedildi");
}

async function restoreVenueSettingsFromBackup(payload, user) {
  const backup = getVenueBackup();
  if (!backup?.settings || !hasMeaningfulVenueSettings(backup.settings)) return payload;
  const sameVenue = backup.venueId && payload.id && backup.venueId === payload.id;
  const sameUser = backup.userId && user?.id && backup.userId === user.id;
  const sameEmail = backup.email && user?.email && backup.email === user.email;
  if (!sameVenue && !sameUser && !sameEmail) return payload;
  if (hasMeaningfulVenueSettings(payload.settings || {})) return payload;

  const restored = await venueApiRequest("/api/venue/settings", {
    method: "PATCH",
    body: JSON.stringify({ venueId: payload.id, settings: backup.settings }),
  });
  return {
    ...payload,
    settings: normalizeSettings(restored.settings || backup.settings),
  };
}

function setSaveStatus(selector, message, isError = false) {
  const node = document.querySelector(selector);
  if (!node) return;
  const isSuccess = !isError && /kaydedildi|eklendi|güncellendi/i.test(message);
  node.textContent = message;
  node.classList.toggle("is-error", isError);
  node.classList.toggle("is-success", isSuccess);
  node.setAttribute("role", isError ? "alert" : "status");
}

function showVenueToast(message, isError = false) {
  if (!message) return;
  let toast = document.querySelector("[data-venue-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "venue-toast";
    toast.dataset.venueToast = "";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }

  window.clearTimeout(venueToastTimer);
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  venueToastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2800);
}

function syncFacilityFeatureSelection(input) {
  if (!input?.dataset?.facilityId || !venueState.dashboard) return;
  venueState.pendingFacilitySelections = {
    ...(venueState.pendingFacilitySelections || {}),
    [input.dataset.facilityId]: input.checked,
  };
  const form = input.closest("#settings-onboarding-form") || settingsOnboardingForm || document;
  const facilityInputs = Array.from(form.querySelectorAll("[data-facility-id]"));
  facilityInputs.forEach((featureInput) => {
    featureInput.closest(".settings-feature-card")?.classList.toggle("is-selected", featureInput.checked);
  });
  venueState.dashboard.settings = collectSettingsPayload();
  const selectedCount = facilityInputs.filter((featureInput) => featureInput.checked).length;
  const summary = form.querySelector(".settings-feature-summary strong");
  if (summary) summary.textContent = `${selectedCount} özellik seçili`;
}

function openNavGroupForView(viewId) {
  const activeItem = [...navItems].find((item) => item.dataset.view === viewId);
  const parentGroup = activeItem?.closest(".venue-nav-group");
  if (!parentGroup) return;
  if (parentGroup.dataset.navAccordion) return;
  navGroups.forEach((group) => {
    const shouldOpen = group === parentGroup;
    setNavGroupExpanded(group, shouldOpen);
  });
}

function setView(viewId) {
  const meta = VIEW_META[viewId] || VIEW_META.calendar;
  document.body.dataset.venueView = viewId;
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === viewId && !item.dataset.action);
  });
  sections.forEach((section) => section.classList.toggle("hidden", section.id !== `${viewId}-view`));
  if (venueTitle) venueTitle.textContent = meta.title;
  if (venueTopbarSubtitle) venueTopbarSubtitle.textContent = meta.subtitle;
  venueSideRail?.classList.toggle("is-hidden", !meta.railVisible);
  workspaceFlow?.classList.toggle("is-hidden", viewId !== "calendar");
  document.querySelector(".venue-main")?.scrollTo({ top: 0, behavior: "smooth" });
  openNavGroupForView(viewId);
}

function navigateGuideButton(button) {
  const target = button.dataset.guideView;
  if (!target) return;

  if (button.dataset.guideTab && venueState.dashboard) {
    venueState.dashboard.settings = collectSettingsPayload();
    venueState.activeSettingsTab = button.dataset.guideTab;
    renderSettingsTabs(venueState.dashboard.settings.tabs);
    renderSettingsOnboarding(venueState.dashboard.settings);
  }

  setView(target);

  if (button.dataset.guideFocus) {
    requestAnimationFrame(() => {
      const targetNode = document.querySelector(button.dataset.guideFocus);
      targetNode?.scrollIntoView({ block: "center", behavior: "smooth" });
      targetNode?.focus?.({ preventScroll: true });
    });
  }

  button.closest(".venue-sidebar")?.scrollTo({ top: 0, behavior: "auto" });
}

function setNavGroupOpen(activeGroup) {
  navGroups.forEach((group) => {
    const shouldOpen = group === activeGroup && !group.classList.contains("is-open");
    setNavGroupExpanded(group, shouldOpen);
  });
}

function setNavGroupExpanded(group, isOpen = false) {
  if (!group) return;
  group.classList.toggle("is-open", Boolean(isOpen));
  group.classList.toggle("is-collapsed", !isOpen && Boolean(group.dataset.navAccordion));
  group.querySelector(".venue-nav-heading")?.setAttribute("aria-expanded", String(Boolean(isOpen)));
}

function imageFileToGalleryItem(file, galleryIndex = 0) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 1600;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const src = canvas.toDataURL("image/jpeg", 0.86);
        resolve({
          name: file.name,
          role: getGalleryRole(galleryIndex),
          src,
          width: canvas.width,
          height: canvas.height,
          originalWidth: image.width,
          originalHeight: image.height,
          sizeKb: Math.round((src.length * 0.75) / 1024),
          preparedAt: new Date().toISOString(),
        });
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function imageFileToProfileItem(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const sourceX = Math.max(0, Math.round((image.width - size) / 2));
        const sourceY = Math.max(0, Math.round((image.height - size) / 2));
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, sourceX, sourceY, size, size, 0, 0, canvas.width, canvas.height);
        const src = canvas.toDataURL("image/jpeg", 0.9);
        resolve({
          name: file.name,
          src,
          width: canvas.width,
          height: canvas.height,
          originalWidth: image.width,
          originalHeight: image.height,
          sizeKb: Math.round((src.length * 0.75) / 1024),
          preparedAt: new Date().toISOString(),
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
  const user = await requireVenueAccess();
  const response = await fetch("/api/venue/bootstrap", {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    authWall.classList.remove("hidden");
    throw new Error("İşletme paneli verisi yüklenemedi.");
  }
  let payload = await response.json();
  payload.settings = normalizeSettings(payload.settings || {});
  payload = await restoreVenueSettingsFromBackup(payload, user).catch(() => payload);
  venueState.dashboard = payload;
  venueState.venueId = payload.id || "";
  venueState.slotModes = payload.slotState?.slotModes || {};
  venueState.manualEntries = payload.slotState?.manualEntries || {};
  venueState.slotServices = payload.slotState?.slotServices || {};
  saveVenueBackup();

  renderVenueIdentity();
  renderGuidanceRail(payload);

  renderStats(payload.stats);
  renderOverview(payload);
  renderQuickActions(payload.quickActions);
  renderCalendarFieldPills();
  venueState.calendarFilter = payload.calendarOps?.preferences?.activeFilter || "all";
  venueState.calendarTeam = payload.calendarOps?.preferences?.selectedTeam || "all";
  renderCalendarOperations();
  renderSalesProducts(payload.settings);
  renderCustomersView();
  renderCampaignsView();
  renderFinanceView(payload.finance);
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
  refreshAdaAssistant().catch(() => renderAdaAssistant());
  loadVenueReport().catch((error) => {
    if (venueReportDocument) {
      venueReportDocument.innerHTML = `<span class="empty-copy">${escapeHtml(error.message)}</span>`;
    }
  });
}

function bindVenueInteractions() {
  setView("overview");

  adaLauncher?.addEventListener("click", toggleAdaPanel);

  adaClose?.addEventListener("click", closeAdaPanel);

  adaActions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ada-action]");
    if (!button) return;
    runAdaAction(button.dataset.adaAction);
  });

  adaChatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = adaChatInput?.value.trim() || "";
    if (!question) return;
    appendAdaChatMessage("user", question);
    adaChatInput.value = "";
    try {
      const payload = await venueApiRequest("/api/venue/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ venueId: venueState.venueId, question }),
      });
      if (payload.context) renderAdaAssistant(payload.context);
      appendAdaChatMessage("ada", payload.answer || answerAdaQuestion(question));
      if (/(sms|kampanya|reklam|toplu|müşteri)/i.test(question)) {
        setView("campaigns");
        requestCampaignSmsDraft({ announce: false });
      }
    } catch (error) {
      appendAdaChatMessage("ada", answerAdaQuestion(question));
    }
  });

  adaLiveButton?.addEventListener("click", connectAdaLive);

  campaignsBoard?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-campaign-action]");
    if (!button) return;
    const action = button.dataset.campaignAction;
    if (action === "draft-sms" || action === "refresh-draft") {
      requestCampaignSmsDraft({ announce: action === "draft-sms" });
    }
    if (action === "send-sms") {
      sendCampaignSmsDraft();
    }
  });

  setupRoadmapToggle?.addEventListener("click", () => {
    setSetupRoadmapOpen(!venueState.setupRoadmapOpen);
  });

  navGroupTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const group = trigger.closest(".venue-nav-group");
      if (group) setNavGroupOpen(group);
    });
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (item.dataset.action === "logout") {
        const token = getToken();
        fetch("/api/auth/logout", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          keepalive: true,
        }).catch(() => {});
        localStorage.removeItem("tyee_token");
        localStorage.removeItem(sessionRecoveryStorageKey);
        localStorage.removeItem(venueBackupStorageKey);
        window.location.href = "/index.html";
        return;
      }

      const target = item.dataset.view;
      if (target) {
        const accordionGroup = item.closest("[data-nav-accordion]");
        setView(target);
        if (accordionGroup) setNavGroupExpanded(accordionGroup, false);
      }
    });
  });

  venueGuidesChecklist?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-guide-view]");
    if (!button) return;
    navigateGuideButton(button);
  });

  venueSidebarGuide?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-guide-view]");
    if (!button) return;
    navigateGuideButton(button);
    setSetupRoadmapOpen(false);
  });

  workspaceFlow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-guide-view]");
    if (!button) return;
    navigateGuideButton(button);
  });

  venueNextAppointments?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-transaction]");
    if (!button || !venueState.dashboard) return;
    const transaction = (venueState.dashboard.transactions || []).find((item) => String(item.id) === String(button.dataset.openTransaction));
    if (transaction) openAppointmentDrawer(buildAppointmentFromTransaction(transaction));
  });

  goCalendarButton?.addEventListener("click", () => {
    setView("calendar");
  });

  calendarOpsStrip?.addEventListener("click", (event) => {
    if (!venueState.dashboard) return;

    const filterButton = event.target.closest("[data-calendar-filter]");
    if (filterButton) {
      venueState.calendarFilter = filterButton.dataset.calendarFilter || "all";
      venueState.dashboard.calendarOps = {
        ...(venueState.dashboard.calendarOps || {}),
        preferences: {
          ...(venueState.dashboard.calendarOps?.preferences || {}),
          activeFilter: venueState.calendarFilter,
        },
      };
      renderCalendarOperations();
      renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
      saveCalendarPreferences().catch((error) => console.error(error));
      return;
    }

    const actionButton = event.target.closest("[data-calendar-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.calendarAction;

    if (action === "quick-add") {
      openSalesModal(null, "19:00", "");
      return;
    }

    if (action === "waitlist") {
      const firstItem = getCalendarOpsPayload().waitlist.items[0];
      if (firstItem) openWaitlistDrawer(firstItem.id);
      return;
    }

    if (action === "settings") {
      setView("settings");
      return;
    }

    if (action === "reset") {
      venueState.currentWeekOffset = 0;
      venueState.selectedSlotKey = "";
      venueState.calendarFilter = "all";
      renderCalendarOperations();
      renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
      saveCalendarPreferences().catch((error) => console.error(error));
      return;
    }

    if (action === "team") {
      const teams = getCalendarOpsPayload().team;
      const currentIndex = Math.max(teams.findIndex((item) => item.id === venueState.calendarTeam), 0);
      const nextTeam = teams[(currentIndex + 1) % Math.max(teams.length, 1)];
      venueState.calendarTeam = nextTeam?.id || "all";
      renderCalendarOperations();
      saveCalendarPreferences().catch((error) => console.error(error));
    }
  });

  venueWaitlist?.addEventListener("click", async (event) => {
    if (!venueState.dashboard) return;

    const addButton = event.target.closest("[data-waitlist-add]");
    if (addButton) {
      addButton.disabled = true;
      try {
        await addWaitlistItemFromCalendar();
      } catch (error) {
        console.error(error);
      } finally {
        addButton.disabled = false;
      }
      return;
    }

    const openButton = event.target.closest("[data-waitlist-open]");
    if (openButton) {
      openWaitlistDrawer(openButton.dataset.waitlistOpen);
      return;
    }

    const matchButton = event.target.closest("[data-waitlist-match]");
    if (matchButton) {
      matchButton.disabled = true;
      try {
        await updateWaitlistStatus(matchButton.dataset.waitlistMatch, "matched");
      } catch (error) {
        console.error(error);
      } finally {
        matchButton.disabled = false;
      }
    }
  });

  document.querySelector("[data-waitlist-add]")?.addEventListener("click", async (event) => {
    if (!venueState.dashboard) return;
    event.currentTarget.disabled = true;
    try {
      await addWaitlistItemFromCalendar();
    } catch (error) {
      console.error(error);
    } finally {
      event.currentTarget.disabled = false;
    }
  });

  calendarBoardSecondary?.addEventListener("click", (event) => {
    if (!venueState.dashboard) return;

    const serviceOption = event.target.closest("[data-slot-service]");
    if (serviceOption) {
      event.stopPropagation();
      const slotKey = serviceOption.dataset.slotKey;
      venueState.slotServices[slotKey] = {
        name: serviceOption.dataset.serviceName || "Ana hizmet",
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

    const openDrawerButton = event.target.closest("[data-open-slot-drawer]");
    if (openDrawerButton) {
      event.stopPropagation();
      const appointment = buildAppointmentFromSlot(openDrawerButton.dataset.openSlotDrawer);
      if (appointment) openAppointmentDrawer(appointment);
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

  weekTodayButton?.addEventListener("click", () => {
    if (!venueState.dashboard) return;
    venueState.currentWeekOffset = 0;
    venueState.selectedSlotKey = "";
    renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
  });

  weekNextMonthButton?.addEventListener("click", () => {
    if (!venueState.dashboard) return;
    venueState.currentWeekOffset += 4;
    venueState.selectedSlotKey = "";
    renderWeeklySchedule(calendarBoardSecondary, venueState.dashboard.weekDays);
  });

  calendarNewAppointment?.addEventListener("click", () => {
    if (!venueState.dashboard) return;
    openSalesModal(null, "19:00", "");
  });

  [salesModalClose, salesCancel].forEach((element) => {
    element?.addEventListener("click", closeSalesModal);
  });

  newSubscriptionButton?.addEventListener("click", () => {
    openSalesModal(null, "19:00", "", { isSubscription: true });
  });

  financeExpenseAdd?.addEventListener("click", () => {
    setView("finance");
    window.requestAnimationFrame(() => {
      const titleField = financeCardStack?.querySelector('[data-finance-expense-field="title"]');
      titleField?.scrollIntoView({ behavior: "smooth", block: "center" });
      titleField?.focus();
    });
  });

  financeCardStack?.addEventListener("click", async (event) => {
    const saveButton = event.target.closest("[data-finance-expense-save]");
    if (!saveButton || !venueState.dashboard) return;

    const expense = getFinanceExpenseFormPayload();
    if (!expense.title) {
      setFinanceExpenseStatus("Gider adı gerekli.", true);
      return;
    }
    if (parseFinanceAmount(expense.amount) <= 0) {
      setFinanceExpenseStatus("Tutar sıfırdan büyük olmalı.", true);
      return;
    }

    saveButton.disabled = true;
    setFinanceExpenseStatus("Kaydediliyor...");
    try {
      const payload = await venueApiRequest("/api/venue/expenses", {
        method: "POST",
        body: JSON.stringify({ venueId: venueState.venueId, ...expense }),
      });
      venueState.dashboard.finance = payload.finance;
      renderFinanceView(payload.finance);
      renderOverview(venueState.dashboard);
      refreshAdaAssistant().catch(() => renderAdaAssistant());
      showVenueToast("Gider eklendi.");
    } catch (error) {
      setFinanceExpenseStatus(error.message || "Gider kaydedilemedi.", true);
      saveButton.disabled = false;
    }
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
    const openButton = event.target.closest("[data-open-transaction]");
    if (openButton && venueState.dashboard) {
      const transaction = (venueState.dashboard.transactions || []).find((item) => String(item.id) === String(openButton.dataset.openTransaction));
      if (transaction) openAppointmentDrawer(buildAppointmentFromTransaction(transaction));
      return;
    }

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
      renderGuidanceRail(venueState.dashboard);
      refreshAdaAssistant().catch(() => renderAdaAssistant());
      loadVenueReport().catch(() => null);
    } catch (error) {
      completeButton.disabled = false;
      completeButton.textContent = error.message || "Hata";
    }
  });

  reviewsShell?.addEventListener("click", async (event) => {
    const saveButton = event.target.closest("[data-review-note-save]");
    if (!saveButton || !venueState.dashboard) return;

    const reviewId = saveButton.dataset.reviewNoteSave;
    const noteField = Array.from(reviewsShell.querySelectorAll("[data-review-note]")).find(
      (field) => field.dataset.reviewNote === reviewId,
    );
    const statusNode = Array.from(reviewsShell.querySelectorAll("[data-review-note-status]")).find(
      (field) => field.dataset.reviewNoteStatus === reviewId,
    );
    const note = noteField?.value.trim() || "";

    saveButton.disabled = true;
    if (statusNode) statusNode.textContent = "Kaydediliyor...";
    try {
      const payload = await venueApiRequest(`/api/venue/reviews/${encodeURIComponent(reviewId)}/note`, {
        method: "PATCH",
        body: JSON.stringify({ venueId: venueState.venueId, note }),
      });
      venueState.dashboard.reviews = payload.reviews || venueState.dashboard.reviews || [];
      venueState.dashboard.reviewSummary = payload.reviewSummary || venueState.dashboard.reviewSummary || {};
      renderReviews(venueState.dashboard.reviews, venueState.dashboard.reviewSummary);
      refreshAdaAssistant().catch(() => renderAdaAssistant());
      showVenueToast(note ? "Not kaydedildi." : "Not temizlendi.");
    } catch (error) {
      saveButton.disabled = false;
      if (statusNode) {
        statusNode.textContent = error.message || "Not kaydedilemedi.";
        statusNode.classList.add("is-error");
      }
    }
  });

  crmCustomerList?.addEventListener("click", (event) => {
    const subviewButton = event.target.closest("[data-client-subview]");
    if (subviewButton) {
      venueState.customerSubview = subviewButton.dataset.clientSubview || "list";
      renderCustomersView();
      return;
    }

    const actionButton = event.target.closest("[data-customer-add], [data-customer-options]");
    if (actionButton) {
      const copy = actionButton.hasAttribute("data-customer-add")
        ? {
            title: "Yeni müşteri ekle",
            notes: "Ad, telefon, e-posta ve pazarlama izni ile yeni müşteri kartı oluşturulur.",
          }
        : {
            title: "Müşteri seçenekleri",
            notes: "Sıralama, export, toplu etiketleme ve kampanya izni aksiyonları burada toplanır.",
          };
      openAppointmentDrawer({
        title: copy.title,
        service: "Müşteri operasyonu",
        serviceType: "Clients workspace",
        datetime: "Bugün",
        status: "Hazır",
        paymentStatus: "—",
        total: "—",
        commission: "—",
        channel: "Tyee Business",
        notes: copy.notes,
      });
      return;
    }

    const button = event.target.closest("[data-customer-open]");
    if (!button) return;
    const customer = getVenueClientsPayload().items.find((item) => String(item.id) === String(button.dataset.customerOpen));
    if (!customer) return;
    openAppointmentDrawer({
      title: customer.name,
      service: "Müşteri kartı",
      serviceType: customer.segment,
      datetime: customer.visits,
      status: "CRM görünümü",
      paymentStatus: customer.spend,
      total: customer.spend,
      commission: "Takip modu",
      channel: "Tyee CRM",
      notes: customer.note,
    });
  });

  crmCustomerList?.addEventListener("input", (event) => {
    const searchInput = event.target.closest("[data-customer-search]");
    if (!searchInput) return;
    venueState.customerSearch = searchInput.value.trim();
    renderCustomersView();
    document.querySelector("[data-customer-search]")?.focus();
  });

  crmSummaryGrid?.addEventListener("click", (event) => {
    const subviewButton = event.target.closest("[data-client-subview]");
    if (!subviewButton) return;
    venueState.customerSubview = subviewButton.dataset.clientSubview || "list";
    renderCustomersView();
  });

  [appointmentDrawerClose, appointmentDrawerDismiss].forEach((node) =>
    node?.addEventListener("click", closeAppointmentDrawer),
  );

  appointmentDrawerBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-drawer-view]");
    if (!button) return;
    setView(button.dataset.drawerView);
    closeAppointmentDrawer();
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
      renderGuidanceRail(venueState.dashboard);
      refreshAdaAssistant().catch(() => renderAdaAssistant());
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

  settingsOnboardingForm?.addEventListener("change", (event) => {
    const facilityInput = event.target.closest("[data-facility-id]");
    if (facilityInput) {
      syncFacilityFeatureSelection(facilityInput);
      return;
    }

    const categoryField = event.target.closest("#settings-detail-category");
    if (!categoryField || !venueState.dashboard) return;
    venueState.dashboard.settings = collectSettingsPayload();
    renderSettingsOnboarding(venueState.dashboard.settings);
  });

  settingsOnboardingForm?.addEventListener("click", async (event) => {
    const facilityCard = event.target.closest("[data-facility-card]");
    if (facilityCard && !event.target.closest("button, a")) {
      const facilityInput = facilityCard.querySelector("[data-facility-id]");
      if (facilityInput) requestAnimationFrame(() => syncFacilityFeatureSelection(facilityInput));
      return;
    }

    const removeMediaButton = event.target.closest("[data-media-remove]");
    if (removeMediaButton && venueState.dashboard) {
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      settings.media.gallery.splice(Number(removeMediaButton.dataset.mediaRemove), 1);
      settings.media.gallery = normalizeMediaGallery(settings.media.gallery);
      venueState.dashboard.settings = settings;
      renderSettingsOnboarding(settings);
      return;
    }

    const moveMediaButton = event.target.closest("[data-media-move]");
    if (moveMediaButton && venueState.dashboard) {
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      const fromIndex = Number(moveMediaButton.dataset.mediaMove);
      const direction = Number(moveMediaButton.dataset.mediaDirection);
      const toIndex = fromIndex + direction;
      if (
        Number.isInteger(fromIndex) &&
        Number.isInteger(toIndex) &&
        settings.media.gallery[fromIndex] &&
        settings.media.gallery[toIndex]
      ) {
        const nextGallery = [...settings.media.gallery];
        [nextGallery[fromIndex], nextGallery[toIndex]] = [nextGallery[toIndex], nextGallery[fromIndex]];
        settings.media.gallery = normalizeMediaGallery(nextGallery);
        venueState.dashboard.settings = settings;
        renderSettingsOnboarding(settings);
        setSaveStatus("[data-settings-status]", "Galeri sırası güncellendi. Kaydetmeyi unutma.");
      }
      return;
    }

    const addAreaButton = event.target.closest("[data-area-add]");
    if (addAreaButton && venueState.dashboard) {
      addSalesProductDraft();
      renderSettingsOnboarding(venueState.dashboard.settings);
      return;
    }

    const deleteAreaButton = event.target.closest("[data-area-delete]");
    if (deleteAreaButton && venueState.dashboard) {
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      const deleteIndex = Number(deleteAreaButton.dataset.areaDelete);
      if (!Number.isInteger(deleteIndex) || !settings.areas[deleteIndex]) return;
      settings.areas.splice(deleteIndex, 1);
      venueState.selectedServiceIndex = Math.max(0, Math.min(deleteIndex, settings.areas.length - 1));
      venueState.dashboard.settings = settings;
      renderSettingsOnboarding(settings);
      renderSalesProducts(settings);
      renderCalendarFieldPills();
      renderGuidanceRail(venueState.dashboard);
      setSaveStatus("[data-settings-status]", "Hizmet silindi. Kaydetmeyi unutma.");
      return;
    }

    const button = event.target.closest("[data-settings-save]");
    if (!button || !venueState.dashboard) return;

    setSaveStatus("[data-settings-status]", "Kaydediliyor...");
    try {
      await saveVenueSettings();
      refreshAdaAssistant().catch(() => renderAdaAssistant());
    } catch (error) {
      setSaveStatus("[data-settings-status]", error.message, true);
      showVenueToast(error.message || "Ayarlar kaydedilemedi.", true);
    }
  });

  document.querySelector("#sales-products-view")?.addEventListener("click", async (event) => {
    const categoryButton = event.target.closest("[data-service-category]");
    if (categoryButton && venueState.dashboard) {
      venueState.dashboard.settings = collectSettingsPayload();
      venueState.selectedServiceCategory = categoryButton.dataset.serviceCategory || "all";
      renderSalesProducts(venueState.dashboard.settings);
      return;
    }

    const addCategoryButton = event.target.closest("[data-service-category-add]");
    if (addCategoryButton && venueState.dashboard) {
      const categoryName = window.prompt("Yeni kategori adı", "Yeni kategori");
      if (!categoryName?.trim()) return;
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      settings.areas.push({
        name: `${categoryName.trim()} hizmeti`,
        type: categoryName.trim(),
        capacity: "",
        price: "",
        paymentMode: "commission_deposit",
        depositType: "percent",
        depositValue: "",
        isActive: true,
      });
      venueState.selectedServiceCategory = categoryName.trim();
      venueState.selectedServiceIndex = settings.areas.length - 1;
      venueState.dashboard.settings = settings;
      renderSalesProducts(settings);
      renderCalendarFieldPills();
      renderGuidanceRail(venueState.dashboard);
      return;
    }

    const productCard = event.target.closest("[data-product-card]");
    if (productCard && venueState.dashboard) {
      venueState.selectedServiceIndex = Number(productCard.dataset.productCard) || 0;
      venueState.dashboard.settings = collectSettingsPayload();
      renderSalesProducts(venueState.dashboard.settings);
      return;
    }

    const addAreaButton = event.target.closest("[data-area-add]");
    if (addAreaButton && venueState.dashboard) {
      addSalesProductDraft();
      return;
    }

    const deleteAreaButton = event.target.closest("[data-area-delete]");
    if (deleteAreaButton && venueState.dashboard) {
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      const deleteIndex = Number(deleteAreaButton.dataset.areaDelete);
      if (!Number.isInteger(deleteIndex) || !settings.areas[deleteIndex]) return;
      settings.areas.splice(deleteIndex, 1);
      venueState.selectedServiceIndex = Math.max(0, Math.min(deleteIndex, settings.areas.length - 1));
      venueState.dashboard.settings = settings;
      renderSalesProducts(settings);
      renderCalendarFieldPills();
      renderGuidanceRail(venueState.dashboard);
      setSaveStatus("[data-settings-status]", "Hizmet silindi. Kaydetmeyi unutma.");
      showVenueToast("Hizmet silindi. Kaydetmeyi unutma.");
      return;
    }

    const button = event.target.closest("[data-settings-save]");
    if (!button || !venueState.dashboard) return;

    try {
      await saveVenueSettings();
      refreshAdaAssistant().catch(() => renderAdaAssistant());
    } catch (error) {
      setSaveStatus("[data-settings-status]", error.message, true);
      showVenueToast(error.message || "Ayarlar kaydedilemedi.", true);
    }
  });

  document.querySelector("#sales-products-view")?.addEventListener("input", (event) => {
    const searchInput = event.target.closest("[data-service-search]");
    if (!searchInput || !venueState.dashboard) return;
    venueState.serviceSearch = searchInput.value || "";
    venueState.dashboard.settings = collectSettingsPayload();
    renderSalesProducts(venueState.dashboard.settings);
    const nextSearchInput = document.querySelector("[data-service-search]");
    nextSearchInput?.focus();
    if (nextSearchInput) {
      const length = nextSearchInput.value.length;
      nextSearchInput.setSelectionRange?.(length, length);
    }
  });

  document.querySelector("#sales-products-view")?.addEventListener("change", (event) => {
    const paymentField = event.target.closest("[data-area-payment-mode], [data-area-deposit-type], [data-area-deposit-value], [data-area-price]");
    if (!paymentField || !venueState.dashboard) return;
    venueState.dashboard.settings = collectSettingsPayload();
    renderSalesProducts(venueState.dashboard.settings);
  });

  settingsOnboardingForm?.addEventListener("change", async (event) => {
    const profileInput = event.target.closest("[data-profile-image-upload]");
    if (profileInput && venueState.dashboard && profileInput.files?.length) {
      setSaveStatus("[data-settings-status]", "Profil resmi hazırlanıyor...");
      try {
        venueState.dashboard.settings = collectSettingsPayload();
        const settings = normalizeSettings(venueState.dashboard.settings);
        const file = Array.from(profileInput.files).find((item) => item.type.startsWith("image/"));
        if (!file) throw new Error("Görsel seçilemedi.");
        const profileImage = await imageFileToProfileItem(file);
        settings.media.profileUrl = profileImage.src;
        settings.media.profileImage = profileImage;
        venueState.dashboard.settings = settings;
        renderVenueIdentity();
        renderSettingsOnboarding(settings);
        setSaveStatus("[data-settings-status]", "Profil resmi eklendi. Kaydetmeyi unutma.");
      } catch (error) {
        setSaveStatus("[data-settings-status]", error.message || "Profil resmi eklenemedi.", true);
      }
      return;
    }

    const input = event.target.closest("[data-media-upload]");
    if (!input || !venueState.dashboard || !input.files?.length) return;

    setSaveStatus("[data-settings-status]", "Görsel hazırlanıyor...");
    try {
      venueState.dashboard.settings = collectSettingsPayload();
      const settings = normalizeSettings(venueState.dashboard.settings);
      const remainingSlots = Math.max(0, VENUE_GALLERY_LIMIT - settings.media.gallery.length);
      if (!remainingSlots) throw new Error("Galeri en fazla 6 fotoğraf alır. Önce bir fotoğraf kaldır.");
      const files = Array.from(input.files)
        .filter((file) => /^image\/(png|jpe?g|webp)$/i.test(file.type))
        .slice(0, remainingSlots);
      if (!files.length) throw new Error("PNG, JPG veya WebP formatında bir görsel seç.");
      const nextImages = await Promise.all(
        files.map((file, index) => imageFileToGalleryItem(file, settings.media.gallery.length + index)),
      );
      if (!settings.media.profileUrl && nextImages[0]?.src) {
        const firstFile = files[0];
        const profileImage = firstFile ? await imageFileToProfileItem(firstFile) : null;
        if (profileImage) {
          settings.media.profileUrl = profileImage.src;
          settings.media.profileImage = profileImage;
        }
      }
      settings.media.gallery = normalizeMediaGallery([...settings.media.gallery, ...nextImages]);
      venueState.dashboard.settings = settings;
      renderVenueIdentity();
      renderSettingsOnboarding(settings);
      const clippedCount = input.files.length - files.length;
      setSaveStatus(
        "[data-settings-status]",
        clippedCount > 0
          ? `${files.length} görsel eklendi, ${clippedCount} dosya 6 fotoğraf limiti nedeniyle alınmadı. Kaydetmeyi unutma.`
          : "Görsel eklendi. Kaydetmeyi unutma.",
      );
    } catch (error) {
      setSaveStatus("[data-settings-status]", error.message || "Görsel eklenemedi.", true);
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
