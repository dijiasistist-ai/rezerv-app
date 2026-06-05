const categories = [
  { id: "pet-kuafor", label: "Pet Kuaför", featuredLabel: "Pet Kuaför", icon: "🐾", count: "1.245", cityFocus: "istanbul" },
  { id: "guzellik", label: "Güzellik Merkezi", featuredLabel: "Güzellik Merkezi", icon: "💄", count: "1.013", cityFocus: "istanbul" },
  { id: "hali-saha", label: "Halı Saha", featuredLabel: "Halı Saha", icon: "⚽", count: "704", cityFocus: "istanbul" },
  { id: "padel", label: "Padel Kort", featuredLabel: "Padel Kort", icon: "🎾", count: "523", cityFocus: "istanbul" },
  { id: "direksiyon", label: "Direksiyon Dersi", featuredLabel: "Direksiyon Dersi", icon: "🚘", count: "486", cityFocus: "istanbul" },
  { id: "ozel-ders", label: "Özel Ders", featuredLabel: "Özel Ders", icon: "🎓", count: "1.782", cityFocus: "istanbul" },
  { id: "masaj", label: "Masaj & Spa", featuredLabel: "Masaj & Spa", icon: "🪷", count: "892", cityFocus: "istanbul" },
  { id: "kisisel-bakim", label: "Kişisel Bakım", featuredLabel: "Kişisel Bakım", icon: "🧴", count: "1.135", cityFocus: "istanbul" },
  { id: "fizyoterapi", label: "Fizyoterapi", featuredLabel: "Fizyoterapi", icon: "🧘", count: "312", cityFocus: "istanbul" },
  { id: "yoga", label: "Yoga & Pilates", featuredLabel: "Yoga & Pilates", icon: "🧘‍♀️", count: "267", cityFocus: "istanbul" },
];

const cities = [
  { id: "all", label: "Tüm şehirler" },
  { id: "istanbul", label: "İstanbul" },
  { id: "izmir", label: "İzmir" },
  { id: "antalya", label: "Antalya" },
  { id: "muğla", label: "Muğla" },
  { id: "ankara", label: "Ankara" },
];

const listings = [
  {
    id: "pet-house-grooming",
    name: "Pet House Grooming",
    category: "pet-kuafor",
    city: "istanbul",
    cityLabel: "Kadıköy",
    rating: 4.9,
    reviews: 812,
    distance: "0.6 km",
    price: 450,
    priceUnit: "den başlayan fiyatlar",
    summary: "Canlı müsaitlik · Köpek ve kedi bakım paketleri",
    tags: ["Bugün müsait", "Anında rezervasyon", "Güvenli ödeme"],
    cta: "Rezervasyon Yap",
    mediaClass: "media-pet",
    featured: true,
    eveningTime: "19:30",
  },
  {
    id: "moda-padel-club",
    name: "Moda Padel Club",
    category: "padel",
    city: "istanbul",
    cityLabel: "Kadıköy",
    rating: 4.8,
    reviews: 643,
    distance: "1.2 km",
    price: 600,
    priceUnit: "saat",
    summary: "Açık ve kapalı kort · Ekipman ekleme seçeneği",
    tags: ["Bugün müsait", "Canlı takvim", "Partner bul"],
    cta: "Rezervasyon Yap",
    mediaClass: "media-padel",
    featured: true,
    eveningTime: "19:00",
  },
  {
    id: "luna-beauty-center",
    name: "Luna Beauty Center",
    category: "guzellik",
    city: "istanbul",
    cityLabel: "Kadıköy",
    rating: 4.9,
    reviews: 1021,
    distance: "0.8 km",
    price: 750,
    priceUnit: "den başlayan fiyatlar",
    summary: "Cilt bakımı, lazer ve güzellik paketleri",
    tags: ["Bugün müsait", "Uzman seçimi", "Paket fiyat"],
    cta: "Rezervasyon Yap",
    mediaClass: "media-beauty",
    featured: true,
    eveningTime: "20:00",
  },
  {
    id: "kadikoy-arena-hali-saha",
    name: "Kadıköy Arena Halı Saha",
    category: "hali-saha",
    city: "istanbul",
    cityLabel: "Kadıköy",
    rating: 4.8,
    reviews: 567,
    distance: "1.0 km",
    price: 1200,
    priceUnit: "saat",
    summary: "Akşam slotları · Online kapora ve takım notları",
    tags: ["Bugün müsait", "Canlı doluluk", "Soyunma odası"],
    cta: "Rezervasyon Yap",
    mediaClass: "media-field",
    featured: true,
    eveningTime: "20:30",
  },
  {
    id: "ahmet-hoca-direksiyon",
    name: "Ahmet Hoca Direksiyon",
    category: "direksiyon",
    city: "istanbul",
    cityLabel: "Kadıköy",
    rating: 4.8,
    reviews: 992,
    distance: "1.1 km",
    price: 650,
    priceUnit: "ders",
    summary: "Manuel ve otomatik araç · Sınav rotası hazırlığı",
    tags: ["Bugün müsait", "Eğitmen seçimi", "Saatlik ders"],
    cta: "Rezervasyon Yap",
    mediaClass: "media-driving",
    featured: true,
    eveningTime: "21:00",
  },
  {
    id: "lotus-spa",
    name: "Lotus Spa",
    category: "masaj",
    city: "istanbul",
    cityLabel: "Kadıköy",
    rating: 4.9,
    reviews: 724,
    distance: "0.9 km",
    price: 850,
    priceUnit: "den başlayan fiyatlar",
    summary: "Masaj, spa ve kişisel bakım randevuları",
    tags: ["Bugün müsait", "Sessiz oda", "Paket seçenekleri"],
    cta: "Rezervasyon Yap",
    mediaClass: "media-spa",
    featured: true,
    eveningTime: "21:30",
  },
  {
    id: "akademi-ozel-ders",
    name: "Akademi Özel Ders",
    category: "ozel-ders",
    city: "istanbul",
    cityLabel: "Ataşehir",
    rating: 4.7,
    reviews: 404,
    distance: "2.3 km",
    price: 500,
    priceUnit: "ders",
    summary: "Matematik, fen ve sınav hazırlık öğretmenleri",
    tags: ["Online uygun", "Öğretmen seç", "Paket ders"],
    cta: "Rezervasyon Yap",
    mediaClass: "media-lesson",
    featured: false,
    eveningTime: "18:30",
  },
  {
    id: "flora-fizyoterapi",
    name: "Flora Fizyoterapi",
    category: "fizyoterapi",
    city: "istanbul",
    cityLabel: "Bağdat Caddesi",
    rating: 4.9,
    reviews: 332,
    distance: "1.6 km",
    price: 900,
    priceUnit: "seans",
    summary: "Fizyoterapi, klinik pilates ve manuel terapi",
    tags: ["Uzman seçimi", "Sağlık notu", "Paket seans"],
    cta: "Rezervasyon Yap",
    mediaClass: "media-physio",
    featured: false,
    eveningTime: "18:00",
  },
];

const hotSlots = [
  { time: "19:00", title: "Padel Kort", venue: "Moda Padel Club", mediaClass: "media-padel" },
  { time: "19:30", title: "Pet Kuaför", venue: "Pet House Grooming", mediaClass: "media-pet" },
  { time: "20:00", title: "Güzellik Merkezi", venue: "Luna Beauty", mediaClass: "media-beauty" },
  { time: "20:30", title: "Halı Saha", venue: "Kadıköy Arena", mediaClass: "media-field" },
  { time: "21:00", title: "Direksiyon Dersi", venue: "Ahmet Hoca", mediaClass: "media-driving" },
  { time: "21:30", title: "Masaj & Spa", venue: "Lotus Spa", mediaClass: "media-spa" },
];

const heroMetrics = [
  { value: "42.000+", label: "Toplam rezervasyon" },
  { value: "1.200+", label: "İşletme" },
  { value: "18.000+", label: "Aktif kullanıcı" },
  { value: "%18", label: "Ortalama doluluk artışı" },
  { value: "24 sn", label: "Ortalama rezervasyon akışı" },
  { value: "100%", label: "Güvenli ödeme" },
];

const dashboard = {
  bars: [72, 84, 68, 91, 77, 88],
  stats: [
    { label: "Canlı müsaitlik", value: "Açık" },
    { label: "İptal seçeneği", value: "Ücretsiz" },
    { label: "Ödeme", value: "Güvenli" },
  ],
};

const venueDashboard = {
  id: "zincirlikuyu-arena",
  venue: {
    name: "Zincirlikuyu Arena",
    branch: "Levent / İstanbul",
    sport: "Halı saha, tenis, stüdyo",
    avatarLabel: "ZA",
  },
  stats: [
    { label: "Bu hafta ciro", value: "₺384.200", delta: "+12%" },
    { label: "Toplam rezervasyon", value: "214", delta: "+18" },
    { label: "Aktif abonelik", value: "68", delta: "+9" },
    { label: "Doluluk", value: "%84", delta: "+6 puan" },
  ],
  managerMenu: [
    "Profil Ayarları",
    "Değerlendirmeler",
    "Fatura Adresleri",
    "Takvim",
    "Haftalık Abonelik Satış",
    "İşlemler",
    "Raporlama",
    "Ayarlar",
    "Çıkış Yap",
  ],
  userMenu: [
    "Rezervasyonlarım",
    "Satın Aldıklarım",
    "Değerlendirmelerim",
    "Profilim",
    "Fatura Adreslerim",
    "Kayıtlı Kartlarım",
  ],
  quickActions: [
    "Yeni rezervasyon ekle",
    "Boş slot kampanyası aç",
    "Abonelik planı oluştur",
    "Excel'e aktar",
  ],
  weekDays: [
    {
      label: "Pzt 11 May",
      slots: [
        { time: "17:00", status: "booked", title: "Mehmet Bayer", meta: "Saha 1 · Nakit", phone: "0534 657 40 78", field: "Saha 1", payment: "Nakit", note: "Takım eksiksiz gelecek." },
        { time: "18:00", status: "marketplace", title: "rezerv.app satışına açık", meta: "Saha 2 · Öne çıkar", field: "Saha 2", payment: "Platform satışı", note: "Dinamik fiyat aktif." },
        { time: "19:00", status: "subscription", title: "Birtan Sönmez", meta: "Abonelik · 12 hafta", phone: "0532 411 23 44", field: "Saha 1", payment: "Abonelik", note: "12 haftalık paket." },
        { time: "20:00", status: "booked", title: "Baran Babacan", meta: "Saha 1 · Online", phone: "0542 111 90 12", field: "Saha 1", payment: "Online", note: "Kapora alındı." },
      ],
    },
    {
      label: "Sal 12 May",
      slots: [
        { time: "17:00", status: "marketplace", title: "rezerv.app satışına açık", meta: "Saha 1 · Dinamik fiyat", field: "Saha 1", payment: "Platform satışı", note: "Akşam kampanyası açık." },
        { time: "18:00", status: "subscription", title: "Tuna Tan Özmen", meta: "Saha 1 · Abonelik", phone: "0555 321 09 88", field: "Saha 1", payment: "Abonelik", note: "Aylık paket müşterisi." },
        { time: "19:00", status: "booked", title: "Çağatay Micik", meta: "Saha 2 · Online", phone: "0538 887 23 11", field: "Saha 2", payment: "Online", note: "Telefonla teyit edildi." },
        { time: "20:00", status: "maintenance", title: "Bakım / Temizlik", meta: "Saha 2 · 30 dk tampon", field: "Saha 2", payment: "Bloke", note: "Zemin bakımı planlı." },
      ],
    },
    {
      label: "Çar 13 May",
      slots: [
        { time: "17:00", status: "booked", title: "Yusuf Cömert", meta: "Saha 1 · Kurumsal lig", phone: "0539 303 19 90", field: "Saha 1", payment: "Kurumsal", note: "Liga kaydı mevcut." },
        { time: "18:00", status: "booked", title: "Özel İşletme Satışı", meta: "Saha 2 · Kapora alındı", field: "Saha 2", payment: "İşletme", note: "Resepsiyondan manuel açıldı." },
        { time: "19:00", status: "marketplace", title: "rezerv.app satışına açık", meta: "Son 3 slot", field: "Saha 2", payment: "Platform satışı", note: "Son dakika satış kurgusu." },
        { time: "20:00", status: "booked", title: "Murat Bahadır", meta: "Saha 1 · EFT", phone: "0551 481 72 14", field: "Saha 1", payment: "EFT", note: "Dekont bekleniyor." },
      ],
    },
    {
      label: "Per 14 May",
      slots: [
        { time: "17:00", status: "subscription", title: "Akif Tekin", meta: "Aylık paket", phone: "0536 222 67 10", field: "Saha 1", payment: "Aylık paket", note: "Her perşembe sabit slot." },
        { time: "18:00", status: "marketplace", title: "rezerv.app satışına açık", meta: "Push kampanyası aktif", field: "Saha 1", payment: "Platform satışı", note: "Push bildirimi gönderildi." },
        { time: "19:00", status: "booked", title: "Samet Çetin", meta: "Saha 1 · Online", phone: "0546 510 00 09", field: "Saha 1", payment: "Online", note: "Kapora tamamlandı." },
        { time: "20:00", status: "booked", title: "Ozan Öğmen", meta: "Saha 2 · Kurumsal", phone: "0537 143 22 21", field: "Saha 2", payment: "Kurumsal", note: "Fatura kesilecek." },
      ],
    },
    {
      label: "Cum 15 May",
      slots: [
        { time: "17:00", status: "booked", title: "Yavuz Burak", meta: "Saha 1 · İşletme", phone: "0535 002 90 45", field: "Saha 1", payment: "İşletme", note: "Telefon rezervasyonu." },
        { time: "18:00", status: "subscription", title: "Batuhan Özdemir", meta: "Paket satışı", phone: "0549 822 30 40", field: "Saha 1", payment: "Paket", note: "6 derslik paket." },
        { time: "19:00", status: "marketplace", title: "rezerv.app satışına açık", meta: "Teal Badge", field: "Saha 2", payment: "Platform satışı", note: "Premium vitrin aktif." },
        { time: "20:00", status: "booked", title: "Emir Atik", meta: "Saha 1 · Online", phone: "0533 870 40 12", field: "Saha 1", payment: "Online", note: "Tam ödeme alındı." },
      ],
    },
    {
      label: "Cts 16 May",
      slots: [
        { time: "17:00", status: "booked", title: "Samet Çetin", meta: "Saha 1 · Online", phone: "0531 905 12 65", field: "Saha 1", payment: "Online", note: "Hafta sonu yoğunluğu yüksek." },
        { time: "18:00", status: "marketplace", title: "rezerv.app satışına açık", meta: "Saha 2 · Hafta sonu", field: "Saha 2", payment: "Platform satışı", note: "Son dakika talebi bekleniyor." },
        { time: "19:00", status: "booked", title: "Murat Bahadır", meta: "Saha 1 · EFT", phone: "0551 481 72 14", field: "Saha 1", payment: "EFT", note: "Dekont teyit edildi." },
        { time: "20:00", status: "subscription", title: "Akif Tekin", meta: "Aylık paket", phone: "0536 222 67 10", field: "Saha 2", payment: "Aylık paket", note: "Cumartesi sabit slot." },
      ],
    },
    {
      label: "Paz 17 May",
      slots: [
        { time: "17:00", status: "marketplace", title: "rezerv.app satışına açık", meta: "Saha 1 · Pazar", field: "Saha 1", payment: "Platform satışı", note: "Aile maçı paketi açık." },
        { time: "18:00", status: "booked", title: "Birtan Sönmez", meta: "Saha 2 · Manuel", phone: "0532 411 23 44", field: "Saha 2", payment: "Manuel", note: "Resepsiyondan alındı." },
        { time: "19:00", status: "maintenance", title: "Bakım / Temizlik", meta: "Saha 1 · Blokeli", field: "Saha 1", payment: "Bloke", note: "Ağ kontrolü yapılacak." },
        { time: "20:00", status: "booked", title: "Yusuf Cömert", meta: "Saha 2 · Lig", phone: "0539 303 19 90", field: "Saha 2", payment: "Kurumsal", note: "Pazar lig maçı." },
      ],
    },
  ],
  subscriptions: [
    {
      id: 16558,
      customer: "Mustafa Geldi",
      field: "Saha 1",
      day: "Salı",
      startDate: "21.04.2026",
      time: "21:30",
      status: "Pasif",
      expiry: "28.04.2026 21:00",
    },
    {
      id: 15636,
      customer: "Yılmaz Yücel",
      field: "Saha 1",
      day: "Cuma",
      startDate: "19.12.2025",
      time: "22:30",
      status: "Pasif",
      expiry: "26.12.2025 22:00",
    },
    {
      id: 14124,
      customer: "Özgün Güler",
      field: "Saha 1",
      day: "Pazartesi",
      startDate: "25.08.2025",
      time: "21:30",
      status: "Aktif",
      expiry: "01.09.2025 21:00",
    },
  ],
  reportSummary: [
    {
      label: "Toplam işlem hacmi",
      value: "₺126.400",
      meta: "Mayıs ayı · 32 işlem",
    },
    {
      label: "Toplam komisyon",
      value: "₺18.960",
      meta: "Platform payı",
    },
    {
      label: "Tesise ödenecek",
      value: "₺107.440",
      meta: "Hakediş toplamı",
    },
    {
      label: "Aktif paket geliri",
      value: "₺24.000",
      meta: "6 aylık paket · 14 çekim",
    },
  ],
  transactions: [
    {
      id: 180743,
      type: "Rezervasyon",
      status: "Aktif",
      venue: "Zincirlikuyu Arena",
      field: "Saha 1",
      channel: "Online",
      customer: "Murat Bahadır",
      businessType: "Özel işletme",
      amount: "₺4.000",
      deposit: "₺600",
      commission: "₺600",
      payout: "₺3.400",
      date: "13.05.2026",
      time: "19:00",
      createdAt: "30.04.2026 11:56",
      monthlyPackageActive: false,
      packageName: "-",
      withdrawalCount: 0,
    },
    {
      id: 181227,
      type: "Rezervasyon",
      status: "Aktif",
      venue: "Zincirlikuyu Arena",
      field: "Saha 1",
      channel: "Online",
      customer: "Baran Babacan",
      businessType: "Özel işletme",
      amount: "₺4.000",
      deposit: "₺600",
      commission: "₺600",
      payout: "₺3.400",
      date: "08.05.2026",
      time: "20:00",
      createdAt: "04.05.2026 16:17",
      monthlyPackageActive: false,
      packageName: "-",
      withdrawalCount: 0,
    },
    {
      id: 181277,
      type: "Rezervasyon",
      status: "Pasif",
      venue: "Zincirlikuyu Arena",
      field: "Saha 2",
      channel: "EFT Satışı",
      customer: "Ozan Öğmen",
      businessType: "Kurumsal",
      amount: "₺4.000",
      deposit: "₺600",
      commission: "₺600",
      payout: "₺3.400",
      date: "08.05.2026",
      time: "20:00",
      createdAt: "04.05.2026 16:17",
      monthlyPackageActive: false,
      packageName: "-",
      withdrawalCount: 0,
    },
    {
      id: 181394,
      type: "Aylık Paket",
      status: "Aktif",
      venue: "Zincirlikuyu Arena",
      field: "Saha 1",
      channel: "Online",
      customer: "Akif Tekin",
      businessType: "Paket satışı",
      amount: "₺12.000",
      deposit: "₺2.000",
      commission: "₺1.800",
      payout: "₺10.200",
      date: "15.05.2026",
      time: "18:00",
      createdAt: "05.05.2026 13:06",
      monthlyPackageActive: true,
      packageName: "Perşembe Prime Paketi",
      withdrawalCount: 4,
    },
    {
      id: 181513,
      type: "Rezervasyon",
      status: "Aktif",
      venue: "Zincirlikuyu Arena",
      field: "Saha 2",
      channel: "Nakit",
      customer: "Çağatay Micik",
      businessType: "Manuel işletme",
      amount: "₺4.000",
      deposit: "₺0",
      commission: "₺0",
      payout: "₺4.000",
      date: "16.05.2026",
      time: "22:00",
      createdAt: "05.05.2026 20:40",
      monthlyPackageActive: false,
      packageName: "-",
      withdrawalCount: 0,
    },
  ],
  settings: {
    tabs: [
      "Genel Bilgiler",
      "İletişim Bilgileri",
      "Tesis Bilgileri",
      "Medya",
      "Sahalar",
      "Ödeme Bilgileri",
      "Sözleşmeler",
    ],
    businessName: "test",
    questions: [
      { label: "rezerv.app takvimi kullanılacak mı?", value: true },
      { label: "Rezervasyon yapılırken spor dalı seçilecek mi?", value: false },
      { label: "Online ders satışı yapılacak mı?", value: false },
      { label: "Paket satışı yapılacak mı?", value: false },
      { label: "Aylık paket satışı yapılacak mı?", value: false },
      { label: "Spor okulu mu?", value: false },
    ],
    selects: [
      { label: "Gün Dönümü Saat Kaçta Olacak?", value: "12:00", options: ["00:00", "06:00", "12:00", "18:00"], info: true },
      { label: "İşletme Tipi", value: "Futbol", options: ["Futbol", "Tenis", "Padel", "Yoga", "Tekne"] },
      { label: "Ek Hizmetler", value: "Seçiniz", options: ["Seçiniz", "Hakem", "Video özeti", "Ekipman", "Yiyecek & içecek"] },
    ],
    locationStatus: "Girilmemiş",
  },
  profile: {
    fullName: "Hüseyin Yıldız",
    phone: "5054024569",
    email: "hysnyildiz@gmail.com",
    identityNumber: "",
    birthDate: "",
  },
  reviews: [],
  billingAddresses: [],
};

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createVenueDashboard(id, overrides) {
  const cloned = cloneJson(venueDashboard);
  cloned.id = id;
  cloned.venue = {
    ...cloned.venue,
    ...overrides.venue,
  };
  if (overrides.stats) cloned.stats = overrides.stats;
  if (overrides.reportSummary) cloned.reportSummary = overrides.reportSummary;
  return cloned;
}

const venueDashboards = {
  "zincirlikuyu-arena": venueDashboard,
  "moda-arena": createVenueDashboard("moda-arena", {
    venue: {
      name: "Moda Arena",
      branch: "Kadıköy / İstanbul",
      sport: "Halı saha, padel",
      avatarLabel: "MA",
    },
    stats: [
      { label: "Bu hafta ciro", value: "₺291.500", delta: "+9%" },
      { label: "Toplam rezervasyon", value: "166", delta: "+11" },
      { label: "Aktif abonelik", value: "39", delta: "+5" },
      { label: "Doluluk", value: "%78", delta: "+4 puan" },
    ],
    reportSummary: [
      { label: "Toplam işlem hacmi", value: "₺98.200", meta: "Mayıs ayı · 24 işlem" },
      { label: "Toplam komisyon", value: "₺14.730", meta: "Platform payı" },
      { label: "Tesise ödenecek", value: "₺83.470", meta: "Hakediş toplamı" },
      { label: "Aktif paket geliri", value: "₺16.400", meta: "8 haftalık paketler" },
    ],
  }),
  "gobek-sail-club": createVenueDashboard("gobek-sail-club", {
    venue: {
      name: "Göcek Sail Club",
      branch: "Göcek / Muğla",
      sport: "Tekne, deniz turu",
      avatarLabel: "GS",
    },
    stats: [
      { label: "Bu hafta ciro", value: "₺612.000", delta: "+16%" },
      { label: "Toplam rezervasyon", value: "74", delta: "+8" },
      { label: "Aktif paket", value: "12", delta: "+2" },
      { label: "Doluluk", value: "%71", delta: "+3 puan" },
    ],
    reportSummary: [
      { label: "Toplam işlem hacmi", value: "₺214.900", meta: "Mayıs ayı · 18 tur" },
      { label: "Toplam komisyon", value: "₺32.235", meta: "Platform payı" },
      { label: "Tesise ödenecek", value: "₺182.665", meta: "Hakediş toplamı" },
      { label: "Ek hizmet geliri", value: "₺41.200", meta: "Kaptan, menü, rota" },
    ],
  }),
};

const adminDashboard = {
  summary: [
    { label: "Toplam firma", value: "12", meta: "8 aktif, 4 onboarding" },
    { label: "Haftalık GMV", value: "₺3,4M", meta: "Tüm tesisler" },
    { label: "Ortalama doluluk", value: "%76", meta: "7 günlük görünüm" },
    { label: "Riskli tesis", value: "3", meta: "Doluluk <%45" },
  ],
  alerts: [
    {
      title: "Zincirlikuyu Arena",
      detail: "Salı ve Çarşamba 18:00 sonrası 4 boş slot var.",
      action: "Kampanya öner",
    },
    {
      title: "Moda Arena",
      detail: "Bu hafta EFT bekleyen 6 rezervasyon mevcut.",
      action: "Takip listesine al",
    },
    {
      title: "Göcek Sail Club",
      detail: "Hafta sonu dönüşüm yüksek, premium vitrin öneriliyor.",
      action: "Vitrine taşı",
    },
  ],
  venues: [
    {
      id: "zincirlikuyu-arena",
      name: "Zincirlikuyu Arena",
      branch: "Levent / İstanbul",
      category: "Halı saha",
      status: "Aktif",
      occupancy: "%84",
      weeklyRevenue: "₺384.200",
      openIssues: 2,
      manager: "Hüseyin Yıldız",
      health: "İyi",
    },
    {
      id: "moda-arena",
      name: "Moda Arena",
      branch: "Kadıköy / İstanbul",
      category: "Halı saha + padel",
      status: "Aktif",
      occupancy: "%78",
      weeklyRevenue: "₺291.500",
      openIssues: 4,
      manager: "Ayşe Demir",
      health: "Takip gerekli",
    },
    {
      id: "gobek-sail-club",
      name: "Göcek Sail Club",
      branch: "Göcek / Muğla",
      category: "Tekne",
      status: "Premium",
      occupancy: "%71",
      weeklyRevenue: "₺612.000",
      openIssues: 1,
      manager: "Mert Kaya",
      health: "Büyüyor",
    },
  ],
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

function enrichListing(listing) {
  const category = categories.find((item) => item.id === listing.category);

  return {
    ...listing,
    categoryLabel: category ? category.featuredLabel : listing.category,
    priceLabel: formatPrice(listing.price),
  };
}

function filterListings({ category = "all", city = "all", query = "", featuredOnly = false } = {}) {
  const normalizedQuery = normalize(query.trim());

  return listings
    .filter((listing) => {
      if (featuredOnly && !listing.featured) return false;
      if (category !== "all" && listing.category !== category) return false;
      if (city !== "all" && listing.city !== city) return false;
      if (!normalizedQuery) return true;

      const haystack = normalize(
        [
          listing.name,
          listing.summary,
          listing.cityLabel,
          listing.tags.join(" "),
          listing.category,
        ].join(" "),
      );

      return haystack.includes(normalizedQuery);
    })
    .map(enrichListing);
}

function getListingById(id) {
  const listing = listings.find((item) => item.id === id);
  return listing ? enrichListing(listing) : null;
}

function getBootstrapPayload() {
  return {
    brand: {
      name: "rezerv.app",
      tagline: "Venue booking marketplace",
    },
    cities,
    categories,
    heroMetrics,
    hotSlots,
    dashboard,
    featuredListings: filterListings({ featuredOnly: true }),
  };
}

function getVenueDashboardPayload(id = "zincirlikuyu-arena") {
  return cloneJson(venueDashboards[id] || venueDashboard);
}

function getAdminDashboardPayload() {
  return cloneJson(adminDashboard);
}

module.exports = {
  categories,
  cities,
  listings,
  hotSlots,
  heroMetrics,
  dashboard,
  filterListings,
  getListingById,
  getBootstrapPayload,
  getVenueDashboardPayload,
  getAdminDashboardPayload,
};
