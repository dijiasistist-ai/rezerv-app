const categoryDefinitions = [
  { id: "pet-kuafor", label: "Pet Kuaför", featuredLabel: "Pet Kuaför", icon: "🐾", cityFocus: "istanbul" },
  { id: "guzellik", label: "Güzellik Merkezi", featuredLabel: "Güzellik Merkezi", icon: "💄", cityFocus: "istanbul" },
  { id: "hali-saha", label: "Halı Saha", featuredLabel: "Halı Saha", icon: "⚽", cityFocus: "istanbul" },
  { id: "padel", label: "Padel Kort", featuredLabel: "Padel Kort", icon: "🎾", cityFocus: "istanbul" },
  { id: "direksiyon", label: "Direksiyon Dersi", featuredLabel: "Direksiyon Dersi", icon: "🚘", cityFocus: "istanbul" },
  { id: "ozel-ders", label: "Özel Ders", featuredLabel: "Özel Ders", icon: "🎓", cityFocus: "istanbul" },
  { id: "masaj", label: "Masaj & Spa", featuredLabel: "Masaj & Spa", icon: "🪷", cityFocus: "istanbul" },
  { id: "kisisel-bakim", label: "Kişisel Bakım", featuredLabel: "Kişisel Bakım", icon: "🧴", cityFocus: "istanbul" },
  { id: "fizyoterapi", label: "Fizyoterapi", featuredLabel: "Fizyoterapi", icon: "🧘", cityFocus: "istanbul" },
  { id: "yoga", label: "Yoga & Pilates", featuredLabel: "Yoga & Pilates", icon: "🧘‍♀️", cityFocus: "istanbul" },
];

const marketplaceRecords = {
  approvedBusinesses: [],
  reservations: [],
  activeUsers: [],
};

function formatCount(value) {
  return new Intl.NumberFormat("tr-TR").format(Number(value || 0));
}

function getMarketplaceStats() {
  const businesses = marketplaceRecords.approvedBusinesses;
  const reservations = marketplaceRecords.reservations;
  const activeUsers = marketplaceRecords.activeUsers;
  const categoryCounts = businesses.reduce((counts, business) => {
    counts[business.category] = (counts[business.category] || 0) + 1;
    return counts;
  }, {});

  return {
    totalReservations: reservations.length,
    totalBusinesses: businesses.length,
    activeUsers: activeUsers.length,
    occupancyIncrease: 0,
    averageBookingSeconds: 0,
    securePaymentRate: 0,
    categoryCounts,
  };
}

function getCategories() {
  const stats = getMarketplaceStats();
  return categoryDefinitions.map((category) => ({
    ...category,
    count: formatCount(stats.categoryCounts[category.id] || 0),
  }));
}

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
    availability: { today: true, nextSlot: "19:30", openSlots: 8 },
    profileScore: 94,
    conversionScore: 88,
    responseMinutes: 4,
    boost: false,
    serviceTypes: ["pet kuafor", "kopek tras", "kedi bakim", "pet grooming"],
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
    availability: { today: true, nextSlot: "19:00", openSlots: 10 },
    profileScore: 91,
    conversionScore: 84,
    responseMinutes: 6,
    boost: true,
    serviceTypes: ["padel", "padel kort", "kort kiralama", "raket"],
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
    availability: { today: true, nextSlot: "20:00", openSlots: 6 },
    profileScore: 97,
    conversionScore: 91,
    responseMinutes: 3,
    boost: false,
    serviceTypes: ["guzellik", "cilt bakimi", "lazer", "manikur", "makyaj"],
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
    availability: { today: true, nextSlot: "20:30", openSlots: 5 },
    profileScore: 89,
    conversionScore: 86,
    responseMinutes: 8,
    boost: true,
    serviceTypes: ["hali saha", "futbol", "saha kiralama", "mac"],
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
    availability: { today: true, nextSlot: "21:00", openSlots: 4 },
    profileScore: 88,
    conversionScore: 82,
    responseMinutes: 9,
    boost: false,
    serviceTypes: ["direksiyon", "direksiyon dersi", "surus", "ehliyet"],
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
    availability: { today: true, nextSlot: "21:30", openSlots: 7 },
    profileScore: 93,
    conversionScore: 87,
    responseMinutes: 5,
    boost: false,
    serviceTypes: ["masaj", "spa", "thai masaj", "bakim"],
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
    availability: { today: true, nextSlot: "18:30", openSlots: 3 },
    profileScore: 82,
    conversionScore: 79,
    responseMinutes: 12,
    boost: false,
    serviceTypes: ["ozel ders", "matematik", "fen", "sinav hazirlik"],
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
    availability: { today: false, nextSlot: "Yarın 11:00", openSlots: 2 },
    profileScore: 95,
    conversionScore: 81,
    responseMinutes: 7,
    boost: false,
    serviceTypes: ["fizyoterapi", "klinik pilates", "manuel terapi", "saglik"],
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

function getPublicListings() {
  return marketplaceRecords.approvedBusinesses.map((business) => ({
    id: business.id,
    name: business.name,
    category: business.category,
    city: business.city || "istanbul",
    cityLabel: business.cityLabel || business.city || "İstanbul",
    rating: Number(business.rating || 0),
    reviews: Number(business.reviews || 0),
    distance: business.distance || "",
    price: Number(business.price || 0),
    priceUnit: business.priceUnit || "",
    summary: business.summary || "",
    tags: business.tags || [],
    cta: "Rezervasyon Yap",
    mediaClass: business.mediaClass || "media-pet",
    featured: Boolean(business.featured),
    eveningTime: business.eveningTime || "",
    availability: business.availability || { today: false, nextSlot: "", openSlots: 0 },
    profileScore: Number(business.profileScore || 0),
    conversionScore: Number(business.conversionScore || 0),
    responseMinutes: Number(business.responseMinutes || 20),
    boost: Boolean(business.boost),
    serviceTypes: business.serviceTypes || [],
  }));
}

function getHotSlots() {
  return getPublicListings()
    .filter((listing) => listing.availability?.today && (listing.availability.nextSlot || listing.eveningTime))
    .slice(0, 6)
    .map((listing) => ({
      time: listing.availability.nextSlot || listing.eveningTime,
      title: getCategoryLabel(listing.category),
      venue: listing.name,
      mediaClass: listing.mediaClass,
    }));
}

function getHeroMetrics() {
  const stats = getMarketplaceStats();
  return [
    { value: formatCount(stats.totalReservations), label: "Toplam rezervasyon" },
    { value: formatCount(stats.totalBusinesses), label: "İşletme" },
    { value: formatCount(stats.activeUsers), label: "Aktif kullanıcı" },
    { value: `%${formatCount(stats.occupancyIncrease)}`, label: "Ortalama doluluk artışı" },
    { value: `${formatCount(stats.averageBookingSeconds)} sn`, label: "Ortalama rezervasyon akışı" },
    { value: `%${formatCount(stats.securePaymentRate)}`, label: "Güvenli ödeme" },
  ];
}

const dashboard = {
  bars: [72, 84, 68, 91, 77, 88],
  stats: [
    { label: "Canlı müsaitlik", value: "Açık" },
    { label: "İptal seçeneği", value: "Ücretsiz" },
    { label: "Ödeme", value: "Güvenli" },
  ],
};

const emptyVenueStats = [
  { label: "Bu hafta ciro", value: "₺0", delta: "0%" },
  { label: "Toplam rezervasyon", value: "0", delta: "0" },
  { label: "Aktif abonelik", value: "0", delta: "0" },
  { label: "Doluluk", value: "%0", delta: "0 puan" },
];

const emptyVenueReportSummary = [
  { label: "Toplam işlem hacmi", value: "₺0", meta: "0 işlem" },
  { label: "Toplam komisyon", value: "₺0", meta: "Platform payı" },
  { label: "Tesise ödenecek", value: "₺0", meta: "Hakediş toplamı" },
  { label: "Aktif paket geliri", value: "₺0", meta: "0 paket" },
];

const venueDashboard = {
  id: "zincirlikuyu-arena",
  venue: {
    name: "Zincirlikuyu Arena",
    branch: "Levent / İstanbul",
    sport: "Halı saha, tenis, stüdyo",
    avatarLabel: "ZA",
  },
  stats: emptyVenueStats,
  managerMenu: [
    "İşletme Bilgileri",
    "Değerlendirmeler",
    "Ödeme & Sözleşme",
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
    "Ödeme Bilgilerim",
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
        { time: "18:00", status: "marketplace", title: "tyee satışına açık", meta: "Saha 2 · Öne çıkar", field: "Saha 2", payment: "Platform satışı", note: "Dinamik fiyat aktif." },
        { time: "19:00", status: "subscription", title: "Birtan Sönmez", meta: "Abonelik · 12 hafta", phone: "0532 411 23 44", field: "Saha 1", payment: "Abonelik", note: "12 haftalık paket." },
        { time: "20:00", status: "booked", title: "Baran Babacan", meta: "Saha 1 · Online", phone: "0542 111 90 12", field: "Saha 1", payment: "Online", note: "Kapora alındı." },
      ],
    },
    {
      label: "Sal 12 May",
      slots: [
        { time: "17:00", status: "marketplace", title: "tyee satışına açık", meta: "Saha 1 · Dinamik fiyat", field: "Saha 1", payment: "Platform satışı", note: "Akşam kampanyası açık." },
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
        { time: "19:00", status: "marketplace", title: "tyee satışına açık", meta: "Son 3 slot", field: "Saha 2", payment: "Platform satışı", note: "Son dakika satış kurgusu." },
        { time: "20:00", status: "booked", title: "Murat Bahadır", meta: "Saha 1 · EFT", phone: "0551 481 72 14", field: "Saha 1", payment: "EFT", note: "Dekont bekleniyor." },
      ],
    },
    {
      label: "Per 14 May",
      slots: [
        { time: "17:00", status: "subscription", title: "Akif Tekin", meta: "Aylık paket", phone: "0536 222 67 10", field: "Saha 1", payment: "Aylık paket", note: "Her perşembe sabit slot." },
        { time: "18:00", status: "marketplace", title: "tyee satışına açık", meta: "Push kampanyası aktif", field: "Saha 1", payment: "Platform satışı", note: "Push bildirimi gönderildi." },
        { time: "19:00", status: "booked", title: "Samet Çetin", meta: "Saha 1 · Online", phone: "0546 510 00 09", field: "Saha 1", payment: "Online", note: "Kapora tamamlandı." },
        { time: "20:00", status: "booked", title: "Ozan Öğmen", meta: "Saha 2 · Kurumsal", phone: "0537 143 22 21", field: "Saha 2", payment: "Kurumsal", note: "Fatura kesilecek." },
      ],
    },
    {
      label: "Cum 15 May",
      slots: [
        { time: "17:00", status: "booked", title: "Yavuz Burak", meta: "Saha 1 · İşletme", phone: "0535 002 90 45", field: "Saha 1", payment: "İşletme", note: "Telefon rezervasyonu." },
        { time: "18:00", status: "subscription", title: "Batuhan Özdemir", meta: "Paket satışı", phone: "0549 822 30 40", field: "Saha 1", payment: "Paket", note: "6 derslik paket." },
        { time: "19:00", status: "marketplace", title: "tyee satışına açık", meta: "Teal Badge", field: "Saha 2", payment: "Platform satışı", note: "Premium vitrin aktif." },
        { time: "20:00", status: "booked", title: "Emir Atik", meta: "Saha 1 · Online", phone: "0533 870 40 12", field: "Saha 1", payment: "Online", note: "Tam ödeme alındı." },
      ],
    },
    {
      label: "Cts 16 May",
      slots: [
        { time: "17:00", status: "booked", title: "Samet Çetin", meta: "Saha 1 · Online", phone: "0531 905 12 65", field: "Saha 1", payment: "Online", note: "Hafta sonu yoğunluğu yüksek." },
        { time: "18:00", status: "marketplace", title: "tyee satışına açık", meta: "Saha 2 · Hafta sonu", field: "Saha 2", payment: "Platform satışı", note: "Son dakika talebi bekleniyor." },
        { time: "19:00", status: "booked", title: "Murat Bahadır", meta: "Saha 1 · EFT", phone: "0551 481 72 14", field: "Saha 1", payment: "EFT", note: "Dekont teyit edildi." },
        { time: "20:00", status: "subscription", title: "Akif Tekin", meta: "Aylık paket", phone: "0536 222 67 10", field: "Saha 2", payment: "Aylık paket", note: "Cumartesi sabit slot." },
      ],
    },
    {
      label: "Paz 17 May",
      slots: [
        { time: "17:00", status: "marketplace", title: "tyee satışına açık", meta: "Saha 1 · Pazar", field: "Saha 1", payment: "Platform satışı", note: "Aile maçı paketi açık." },
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
  reportSummary: emptyVenueReportSummary,
  transactions: [
    {
      id: 180743,
      type: "Rezervasyon",
      status: "Aktif",
      venue: "Zincirlikuyu Arena",
      field: "Saha 1",
      channel: "Kapora",
      customer: "Murat Bahadır",
      businessType: "Ön ödeme",
      amount: "₺4.000",
      deposit: "₺280",
      commission: "₺280",
      payout: "₺0",
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
      channel: "Tam Online",
      customer: "Baran Babacan",
      businessType: "Tam online ödeme",
      amount: "₺4.000",
      deposit: "₺4.000",
      commission: "₺280",
      payout: "₺3.720",
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
      status: "Aktif",
      venue: "Zincirlikuyu Arena",
      field: "Saha 2",
      channel: "Sadece Rezervasyon",
      customer: "Ozan Öğmen",
      businessType: "Ay sonu FAST",
      amount: "₺4.000",
      deposit: "₺0",
      commission: "₺280",
      payout: "₺0",
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
      businessType: "Tam online ödeme",
      amount: "₺12.000",
      deposit: "₺12.000",
      commission: "₺840",
      payout: "₺11.160",
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
      businessType: "Ay sonu FAST",
      amount: "₺4.000",
      deposit: "₺0",
      commission: "₺280",
      payout: "₺0",
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
      "İşletme Bilgileri",
      "Ödeme & Sözleşme",
    ],
    businessName: "test",
    questions: [
      { label: "tyee takvimi kullanılacak mı?", value: true },
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
    stats: emptyVenueStats,
    reportSummary: emptyVenueReportSummary,
  }),
  "gobek-sail-club": createVenueDashboard("gobek-sail-club", {
    venue: {
      name: "Göcek Sail Club",
      branch: "Göcek / Muğla",
      sport: "Tekne, deniz turu",
      avatarLabel: "GS",
    },
    stats: emptyVenueStats,
    reportSummary: emptyVenueReportSummary,
  }),
};

const adminDashboard = {
  summary: [
    { label: "Toplam firma", value: "0", meta: "0 aktif, 0 onboarding" },
    { label: "Haftalık GMV", value: "₺0", meta: "Tüm tesisler" },
    { label: "Ortalama doluluk", value: "%0", meta: "7 günlük görünüm" },
    { label: "Riskli tesis", value: "0", meta: "Doluluk <%45" },
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
      occupancy: "%0",
      weeklyRevenue: "₺0",
      openIssues: 0,
      manager: "Hüseyin Yıldız",
      health: "İyi",
    },
    {
      id: "moda-arena",
      name: "Moda Arena",
      branch: "Kadıköy / İstanbul",
      category: "Halı saha + padel",
      status: "Aktif",
      occupancy: "%0",
      weeklyRevenue: "₺0",
      openIssues: 0,
      manager: "Ayşe Demir",
      health: "Takip gerekli",
    },
    {
      id: "gobek-sail-club",
      name: "Göcek Sail Club",
      branch: "Göcek / Muğla",
      category: "Tekne",
      status: "Premium",
      occupancy: "%0",
      weeklyRevenue: "₺0",
      openIssues: 0,
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

const categoryMarketFit = {
  guzellik: 1.16,
  "pet-kuafor": 1.14,
  "hali-saha": 1.11,
  masaj: 1.08,
  padel: 1.05,
  direksiyon: 1.03,
  "ozel-ders": 1.02,
  fizyoterapi: 0.98,
  "kisisel-bakim": 0.98,
  yoga: 0.94,
};

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function parseDistance(value = "") {
  const normalized = String(value).replace(",", ".").match(/\d+(\.\d+)?/);
  return normalized ? Number(normalized[0]) : 3;
}

function parseTimeToMinutes(value = "") {
  const match = String(value).match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function getCategoryLabel(categoryId) {
  const category = categoryDefinitions.find((item) => item.id === categoryId);
  return category ? category.featuredLabel : categoryId;
}

function buildSearchText(listing) {
  return normalize(
    [
      listing.name,
      listing.summary,
      listing.cityLabel,
      listing.category,
      getCategoryLabel(listing.category),
      listing.tags.join(" "),
      (listing.serviceTypes || []).join(" "),
    ].join(" "),
  );
}

function getQueryMatchScore(listing, normalizedQuery) {
  if (!normalizedQuery) return 1;

  const haystack = buildSearchText(listing);
  if (haystack.includes(normalizedQuery)) return 1;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;

  const matchedTerms = terms.filter((term) => haystack.includes(term)).length;
  return matchedTerms / terms.length;
}

function getAvailabilityScore(listing, context = {}) {
  const openSlots = Number(listing.availability?.openSlots || 0);
  const todayScore = listing.availability?.today ? 0.64 : 0.2;
  const slotDensityScore = clamp(openSlots / 10) * 0.22;
  const liveCalendarScore = listing.tags.some((tag) => normalize(tag).includes("canli")) ? 0.08 : 0.04;
  const listingMinutes = parseTimeToMinutes(listing.availability?.nextSlot || listing.eveningTime);
  const requestedMinutes = context.requestedMinutes;
  const timeAffinity =
    listingMinutes == null || requestedMinutes == null
      ? 0.06
      : clamp(1 - Math.abs(listingMinutes - requestedMinutes) / 180) * 0.12;
  return clamp(todayScore + slotDensityScore + liveCalendarScore + timeAffinity);
}

function getTrustScore(listing) {
  const ratingScore = clamp(Number(listing.rating || 0) / 5);
  const reviewScore = 0;
  return ratingScore * 0.58 + reviewScore * 0.42;
}

function getResponseScore(listing) {
  const minutes = Number(listing.responseMinutes || 20);
  return clamp((20 - minutes) / 18);
}

function getRankBadges(listing, context) {
  const badges = [];
  if (listing.availability?.today) {
    badges.push(`${listing.availability.nextSlot || listing.eveningTime} müsait`);
  }

  if (context.city !== "all" && parseDistance(listing.distance) <= 1.2) {
    badges.push("Yakınında");
  }

  if (getResponseScore(listing) > 0.65) {
    badges.push("Hızlı dönüş");
  }

  if (listing.boost) badges.push("Öne çıkan");
  return badges.slice(0, 3);
}

function scoreListing(listing, context) {
  const safeContext = { category: "all", city: "all", normalizedQuery: "", ...context };
  const queryScore = getQueryMatchScore(listing, safeContext.normalizedQuery);
  const categoryScore =
    safeContext.category === "all" || listing.category === safeContext.category
      ? clamp(categoryMarketFit[listing.category] || 1, 0.9, 1.2)
      : 0;
  const cityScore = safeContext.city === "all" || listing.city === safeContext.city ? 1 : 0;
  const distanceScore = clamp((4 - parseDistance(listing.distance)) / 4);
  const availabilityScore = getAvailabilityScore(listing, safeContext);
  const trustScore = getTrustScore(listing);
  const profileScore = clamp(Number(listing.profileScore || 75) / 100);
  const conversionScore = clamp(Number(listing.conversionScore || 70) / 100);
  const responseScore = getResponseScore(listing);
  const boostScore = listing.boost ? 0.035 : 0;

  const score =
    queryScore * 0.2 +
    categoryScore * 0.13 +
    cityScore * 0.1 +
    distanceScore * 0.1 +
    availabilityScore * 0.17 +
    trustScore * 0.14 +
    profileScore * 0.08 +
    conversionScore * 0.05 +
    responseScore * 0.03 +
    boostScore;

  return Math.round(clamp(score, 0, 1.2) * 1000);
}

function enrichListing(listing, rankContext = {}) {
  const safeRankContext = { category: "all", city: "all", normalizedQuery: "", ...rankContext };
  const category = categoryDefinitions.find((item) => item.id === listing.category);
  const rankScore = safeRankContext.score || scoreListing(listing, safeRankContext);

  return {
    ...listing,
    reviews: 0,
    categoryLabel: category ? category.featuredLabel : listing.category,
    priceLabel: formatPrice(listing.price),
    rankScore,
    rankBadges: getRankBadges(listing, safeRankContext),
  };
}

function filterListings({ category = "all", city = "all", query = "", time = "", featuredOnly = false } = {}) {
  const normalizedQuery = normalize(query.trim());
  const rankContext = {
    category,
    city,
    normalizedQuery,
    requestedMinutes: parseTimeToMinutes(time),
  };

  return getPublicListings()
    .map((listing) => ({
      listing,
      score: scoreListing(listing, rankContext),
      queryMatch: getQueryMatchScore(listing, normalizedQuery),
    }))
    .filter(({ listing, queryMatch }) => {
      if (featuredOnly && !listing.featured) return false;
      if (category !== "all" && listing.category !== category) return false;
      if (city !== "all" && listing.city !== city) return false;
      return !normalizedQuery || queryMatch >= 0.34;
    })
    .sort((a, b) => b.score - a.score || b.listing.reviews - a.listing.reviews)
    .map(({ listing, score }) => enrichListing(listing, { ...rankContext, score }));
}

function getListingById(id) {
  const listing = getPublicListings().find((item) => item.id === id);
  return listing ? enrichListing(listing) : null;
}

const mapCoordinates = {
  "pet-house-grooming": { lat: 40.9861, lng: 29.0278 },
  "moda-padel-club": { lat: 40.9824, lng: 29.0252 },
  "luna-beauty-center": { lat: 40.9893, lng: 29.0304 },
  "kadikoy-arena-hali-saha": { lat: 40.9916, lng: 29.0372 },
  "ahmet-hoca-direksiyon": { lat: 40.9954, lng: 29.0218 },
  "lotus-spa": { lat: 40.9848, lng: 29.0338 },
  "akademi-ozel-ders": { lat: 40.9928, lng: 29.1246 },
  "flora-fizyoterapi": { lat: 40.9692, lng: 29.0718 },
};

function getDistanceKm(origin, target) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(target.lat - origin.lat);
  const dLng = toRad(target.lng - origin.lng);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(target.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMapSourceListings() {
  const liveListings = getPublicListings();
  return liveListings.length ? liveListings : listings;
}

function getNearbyMapPayload(origin = { lat: 41.0351, lng: 29.0268 }) {
  const safeOrigin = {
    lat: Number.isFinite(origin.lat) ? origin.lat : 41.0351,
    lng: Number.isFinite(origin.lng) ? origin.lng : 29.0268,
  };
  const categoriesById = new Map(categoryDefinitions.map((item) => [item.id, item]));
  const items = getMapSourceListings()
    .map((listing) => {
      const coordinates = mapCoordinates[listing.id];
      const category = categoriesById.get(listing.category);
      if (!coordinates || !category) return null;
      const distanceKm = getDistanceKm(safeOrigin, coordinates);

      return {
        id: listing.id,
        name: listing.name,
        category: listing.category,
        categoryLabel: category.featuredLabel,
        icon: category.icon,
        cityLabel: listing.cityLabel,
        lat: coordinates.lat,
        lng: coordinates.lng,
        distanceKm: Number(distanceKm.toFixed(2)),
        distanceLabel: `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`,
        nextSlot: listing.availability?.nextSlot || listing.eveningTime || "Yakında",
        priceLabel: formatPrice(listing.price),
        mediaClass: listing.mediaClass,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    origin: safeOrigin,
    items,
  };
}

function getBootstrapPayload() {
  const categories = getCategories();

  return {
    brand: {
      name: "tyee",
      tagline: "Venue booking marketplace",
    },
    cities,
    categories,
    heroMetrics: getHeroMetrics(),
    hotSlots: getHotSlots(),
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
  categories: getCategories(),
  cities,
  listings,
  hotSlots: getHotSlots(),
  heroMetrics: getHeroMetrics(),
  dashboard,
  filterListings,
  getListingById,
  getNearbyMapPayload,
  getBootstrapPayload,
  getVenueDashboardPayload,
  getAdminDashboardPayload,
};
