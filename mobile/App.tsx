import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

declare const process: { env?: Record<string, string | undefined> };

const API_BASE_URL = (process.env?.EXPO_PUBLIC_API_URL || "https://tyee.app").replace(/\/$/, "");
const SESSION_KEY = "tyee.mobile.session";
const brandLogo = require("./assets/tyee-logo.png");
const authCustomerBg = require("./assets/auth-customer-photo-bg.jpg");
const authVenueBg = require("./assets/auth-venue-photo-bg.jpg");
const profilePhotoUri = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=82";
const fallbackStudioImages = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=84",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=84",
];

type Role = "customer" | "venue";
type MainTab = "discover" | "nearby" | "bookings" | "account";
type VenueTab = "today" | "calendar" | "reservations" | "account";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  canManageVenue: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

type Category = {
  id: string;
  label: string;
  icon: string;
  count: string;
};

type Listing = {
  id: string;
  name: string;
  category: string;
  categoryLabel?: string;
  cityLabel: string;
  rating?: number;
  reviews?: number;
  distance?: string;
  price?: number;
  priceUnit?: string;
  summary?: string;
  tags?: string[];
  mediaUrl?: string;
  gallery?: { src: string; role?: string }[];
  availability?: { nextSlot?: string; openSlots?: number };
};

type NearbyItem = {
  id: string;
  name: string;
  categoryLabel: string;
  icon: string;
  cityLabel: string;
  distanceLabel: string;
  nextSlot: string;
  priceLabel?: string;
  mediaUrl?: string;
};

type AvailabilitySlot = {
  time: string;
  available: boolean;
  label?: string;
};

type CustomerReservation = {
  id: string;
  shortId?: string;
  venueName: string;
  serviceLabel: string;
  serviceDate: string;
  serviceTime: string;
  status: string;
  paymentModeLabel?: string;
  totalAmount?: number;
};

type CustomerDashboard = {
  reservations?: {
    upcoming?: CustomerReservation[];
    past?: CustomerReservation[];
  };
};

type VenueArea = {
  name?: string;
  type?: string;
  capacity?: string;
  price?: string;
  isActive?: boolean;
};

type VenueSettings = {
  businessName: string;
  contact: {
    authorizedName?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  location: {
    address?: string;
    lat?: string;
    lng?: string;
    mapUrl?: string;
  };
  locationStatus?: string;
  details: {
    category?: string;
    district?: string;
    description?: string;
    workingHours?: string;
    cancellationPolicy?: string;
  };
  media: {
    logoUrl?: string;
    coverUrl?: string;
    gallery: string[];
  };
  areas: VenueArea[];
};

type VenuePayload = {
  venue?: {
    name?: string;
    branch?: string;
    sport?: string;
  };
  settings?: Partial<VenueSettings>;
  metrics?: { label: string; value: string; delta?: string }[];
  weekDays?: {
    label: string;
    date: string;
    slots: { time: string; status: string; title?: string }[];
  }[];
  reservations?: { id: string; customer: string; time: string; field?: string; status?: string }[];
};

type VenueOnboardingStepId = "business" | "contact" | "location" | "details" | "media" | "area" | "price";

type VenueOnboardingStep = {
  id: VenueOnboardingStepId;
  title: string;
  description: string;
};

type Session = {
  token: string;
  user: User;
};

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "İşlem tamamlanamadı.");
  }
  return data as T;
}

function money(value?: number) {
  return `₺${new Intl.NumberFormat("tr-TR").format(Number(value || 0))}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function initials(name = "T") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

function normalizeVenueGallery(gallery: unknown): string[] {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "src" in item) return String(item.src || "");
      return "";
    })
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeVenueSettings(settings?: Partial<VenueSettings>): VenueSettings {
  return {
    businessName: settings?.businessName || "",
    contact: {
      authorizedName: settings?.contact?.authorizedName || "",
      phone: settings?.contact?.phone || "",
      whatsapp: settings?.contact?.whatsapp || "",
      email: settings?.contact?.email || "",
      website: settings?.contact?.website || "",
      instagram: settings?.contact?.instagram || "",
    },
    location: {
      address: settings?.location?.address || "",
      lat: settings?.location?.lat || "",
      lng: settings?.location?.lng || "",
      mapUrl: settings?.location?.mapUrl || "",
    },
    locationStatus: settings?.locationStatus || "Girilmemiş",
    details: {
      category: settings?.details?.category || "",
      district: settings?.details?.district || "",
      description: settings?.details?.description || "",
      workingHours: settings?.details?.workingHours || "",
      cancellationPolicy: settings?.details?.cancellationPolicy || "",
    },
    media: {
      logoUrl: settings?.media?.logoUrl || "",
      coverUrl: settings?.media?.coverUrl || "",
      gallery: normalizeVenueGallery(settings?.media?.gallery),
    },
    areas:
      Array.isArray(settings?.areas) && settings.areas.length
        ? settings.areas
        : [{ name: "", type: "", capacity: "", price: "", isActive: true }],
  };
}

function getListingImageUri(listing?: Partial<Listing | NearbyItem> | null) {
  if (!listing) return "";
  const direct = "mediaUrl" in listing ? listing.mediaUrl : "";
  if (direct) return direct;
  const category = "category" in listing ? listing.category : "";
  const categoryLabel = "categoryLabel" in listing ? listing.categoryLabel : "";
  const key = `${category || ""} ${categoryLabel || ""}`.toLocaleLowerCase("tr-TR");
  if (key.includes("pet")) return "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=82";
  if (key.includes("restaurant") || key.includes("restoran")) return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=82";
  if (key.includes("berber")) return "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=82";
  if (key.includes("halı") || key.includes("saha")) return "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=82";
  if (key.includes("tenis")) return "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=82";
  if (key.includes("tattoo") || key.includes("dövme")) return "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=900&q=82";
  if (key.includes("yoga") || key.includes("masaj") || key.includes("spa")) return "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=900&q=82";
  return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=82";
}

function getMissingVenueSteps(settings?: Partial<VenueSettings>): VenueOnboardingStep[] {
  const normalized = normalizeVenueSettings(settings);
  const firstArea = normalized.areas[0] || {};
  const steps: VenueOnboardingStep[] = [];

  if (!normalized.businessName.trim()) {
    steps.push({
      id: "business",
      title: "Şirket / işletme adı",
      description: "Müşterinin uygulamada göreceği resmi işletme adını netleştirelim.",
    });
  }

  if (!normalized.contact.phone?.trim() && !normalized.contact.email?.trim()) {
    steps.push({
      id: "contact",
      title: "İletişim bilgileri",
      description: "Rezervasyon teyidi ve müşteri iletişimi için en az telefon veya e-posta gerekli.",
    });
  }

  if (!normalized.location.address?.trim() || !normalized.location.lat?.trim() || !normalized.location.lng?.trim()) {
    steps.push({
      id: "location",
      title: "Adres ve harita konumu",
      description: "Yakınımda akışı için adres ve konum pini tamamlanmalı.",
    });
  }

  if (!normalized.details.category?.trim() || !normalized.details.district?.trim()) {
    steps.push({
      id: "details",
      title: "Kategori ve bölge",
      description: "Pet kuaför, halı saha, güzellik merkezi gibi doğru kategoriyle eşleştirelim.",
    });
  }

  if (!normalized.media.coverUrl?.trim() && normalized.media.gallery.length === 0) {
    steps.push({
      id: "media",
      title: "İşletme görseli",
      description: "Listeleme kartında güven veren ilk görseli seçelim.",
    });
  }

  if (!firstArea.name?.trim() || !firstArea.type?.trim()) {
    steps.push({
      id: "area",
      title: "Alan / salon / hoca bilgisi",
      description: "Saha, oda, masa, eğitmen veya hoca adını jenerik alan olarak kaydediyoruz.",
    });
  }

  if (!firstArea.price?.trim()) {
    steps.push({
      id: "price",
      title: "Fiyat bilgisi",
      description: "Rezervasyon kartlarında gösterilecek başlangıç fiyatını ekleyelim.",
    });
  }

  return steps;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("discover");
  const [venueTab, setVenueTab] = useState<VenueTab>("today");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [nearby, setNearby] = useState<NearbyItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [customerDashboard, setCustomerDashboard] = useState<CustomerDashboard | null>(null);
  const [reservationDraft, setReservationDraft] = useState({
    serviceDate: todayIso(),
    serviceTime: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    note: "",
  });
  const [reservationLoading, setReservationLoading] = useState(false);
  const [venuePayload, setVenuePayload] = useState<VenuePayload | null>(null);
  const [venueOnboardingDismissed, setVenueOnboardingDismissed] = useState(false);

  const isVenueUser = Boolean(session?.user.canManageVenue);
  const missingVenueSteps = useMemo(() => getMissingVenueSteps(venuePayload?.settings), [venuePayload?.settings]);
  const customerTabs = useMemo(
    () => [
      { id: "discover" as const, label: "Ana Sayfa", icon: "⌂" },
      { id: "nearby" as const, label: "Ara", icon: "⌕" },
      { id: "bookings" as const, label: "Etkinlik", icon: "□" },
      { id: "account" as const, label: "Profil", icon: "○" },
    ],
    [],
  );
  const venueTabs = useMemo(
    () => [
      { id: "today" as const, label: "Bugün" },
      { id: "calendar" as const, label: "Takvim" },
      { id: "reservations" as const, label: "Rezervasyon" },
      { id: "account" as const, label: "Hesap" },
    ],
    [],
  );

  const saveSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (nextSession) {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  }, []);

  const loadPublicData = useCallback(async (next: { category?: string; query?: string } = {}) => {
    const category = next.category || "all";
    const search = next.query || "";
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (search.trim()) params.set("query", search.trim());
    const listingPath = `/api/listings${params.toString() ? `?${params.toString()}` : ""}`;
    const [bootstrap, listingPayload] = await Promise.all([
      apiRequest<{ categories: Category[] }>("/api/bootstrap"),
      apiRequest<{ items: Listing[] }>(listingPath),
    ]);
    setCategories(bootstrap.categories || []);
    setListings(listingPayload.items || []);
  }, []);

  const refreshListings = useCallback(
    async (next: { category?: string; query?: string } = {}) => {
      const category = next.category ?? selectedCategory;
      const search = next.query ?? query;
      setSelectedCategory(category);
      setQuery(search);
      await loadPublicData({ category, query: search });
    },
    [loadPublicData, query, selectedCategory],
  );

  const loadNearby = useCallback(async () => {
    let lat = 41.0351;
    let lng = 29.0268;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status === "granted") {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    }
    const payload = await apiRequest<{ items: NearbyItem[] }>(`/api/nearby?lat=${lat}&lng=${lng}`);
    setNearby(payload.items || []);
  }, []);

  const loadVenue = useCallback(
    async (token: string) => {
      const payload = await apiRequest<VenuePayload>("/api/venue/bootstrap", { token });
      setVenuePayload(payload);
      return payload;
    },
    [],
  );

  const loadCustomerDashboard = useCallback(async (token: string) => {
    const payload = await apiRequest<CustomerDashboard>("/api/customer/dashboard", { token });
    setCustomerDashboard(payload);
    return payload;
  }, []);

  const openListing = useCallback(
    async (listing: Listing | NearbyItem | string) => {
      const listingId = typeof listing === "string" ? listing : listing.id;
      const serviceDate = reservationDraft.serviceDate || todayIso();
      try {
        setReservationLoading(true);
        const [detailPayload, availabilityPayload] = await Promise.all([
          apiRequest<{ item: Listing }>(`/api/listings/${listingId}`),
          apiRequest<{ slots: AvailabilitySlot[] }>(`/api/listings/${listingId}/availability?date=${serviceDate}`),
        ]);
        const detail = detailPayload.item;
        const firstSlot = (availabilityPayload.slots || []).find((slot) => slot.available);
        setSelectedListing(detail);
        setAvailabilitySlots(availabilityPayload.slots || []);
        setReservationDraft((current) => ({
          ...current,
          serviceDate,
          serviceTime: firstSlot?.time || current.serviceTime,
          customerName: current.customerName || session?.user.name || "",
          customerEmail: current.customerEmail || session?.user.email || "",
          customerPhone: current.customerPhone || session?.user.phone || "",
        }));
      } catch (error) {
        Alert.alert("İşletme açılamadı", error instanceof Error ? error.message : "Lütfen tekrar dene.");
      } finally {
        setReservationLoading(false);
      }
    },
    [reservationDraft.serviceDate, session?.user.email, session?.user.name, session?.user.phone],
  );

  const refreshSelectedAvailability = useCallback(
    async (serviceDate: string) => {
      if (!selectedListing) return;
      if (!serviceDate.trim()) {
        Alert.alert("Tarih gerekli", "Müsait saatleri görmek için tarih alanını doldur.");
        return;
      }
      try {
        setReservationLoading(true);
        const availabilityPayload = await apiRequest<{ slots: AvailabilitySlot[] }>(
          `/api/listings/${selectedListing.id}/availability?date=${encodeURIComponent(serviceDate.trim())}`,
        );
        const slots = availabilityPayload.slots || [];
        const firstSlot = slots.find((slot) => slot.available);
        setAvailabilitySlots(slots);
        setReservationDraft((current) => ({
          ...current,
          serviceDate: serviceDate.trim(),
          serviceTime: firstSlot?.time || "",
        }));
      } catch (error) {
        Alert.alert("Saatler yenilenemedi", error instanceof Error ? error.message : "Lütfen tekrar dene.");
      } finally {
        setReservationLoading(false);
      }
    },
    [selectedListing],
  );

  const submitMobileReservation = useCallback(async () => {
    if (!selectedListing) return;
    const customerName = reservationDraft.customerName.trim();
    const customerPhone = reservationDraft.customerPhone.trim();
    const serviceDate = reservationDraft.serviceDate.trim();
    const serviceTime = reservationDraft.serviceTime.trim();
    if (!customerName || !customerPhone) {
      Alert.alert("Bilgilerin eksik", "Rezervasyon için ad soyad ve telefon gerekli.");
      return;
    }
    if (!serviceDate || !serviceTime) {
      Alert.alert("Tarih ve saat seç", "Rezervasyon oluşturmak için uygun bir tarih ve saat seçmelisin.");
      return;
    }
    if (!Number(selectedListing.price || 0)) {
      Alert.alert("Fiyat bilgisi eksik", "Bu işletmenin rezervasyon bedeli henüz tanımlanmamış.");
      return;
    }
    try {
      setReservationLoading(true);
      const response = await apiRequest<{ message?: string }>("/api/reservations", {
        method: "POST",
        token: session?.token,
        body: {
          venueId: selectedListing.id,
          listingId: selectedListing.id,
          venueName: selectedListing.name,
          listingName: selectedListing.name,
          category: selectedListing.category,
          categoryLabel: selectedListing.categoryLabel || selectedListing.category,
          serviceLabel: selectedListing.categoryLabel || selectedListing.name,
          customerName,
          customerPhone,
          customerEmail: reservationDraft.customerEmail.trim(),
          totalAmount: selectedListing.price || 0,
          serviceDate,
          serviceTime,
          note: reservationDraft.note.trim(),
        },
      });
      Alert.alert("Rezervasyon alındı", response.message || "Rezervasyonun oluşturuldu.");
      setSelectedListing(null);
      if (session?.token) await loadCustomerDashboard(session.token);
      setMainTab("bookings");
    } catch (error) {
      Alert.alert("Rezervasyon oluşturulamadı", error instanceof Error ? error.message : "Lütfen tekrar dene.");
    } finally {
      setReservationLoading(false);
    }
  }, [loadCustomerDashboard, reservationDraft, selectedListing, session?.token]);

  const saveVenueSettings = useCallback(
    async (settings: VenueSettings) => {
      if (!session) return;
      const payload = await apiRequest<{ settings: VenueSettings }>("/api/venue/settings", {
        method: "PATCH",
        token: session.token,
        body: { settings },
      });
      setVenuePayload((current) => ({ ...(current || {}), settings: payload.settings }));
      await loadVenue(session.token);
      setVenueOnboardingDismissed(false);
    },
    [loadVenue, session],
  );

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        await loadPublicData();
        const saved = await SecureStore.getItemAsync(SESSION_KEY);
        if (!saved || !mounted) return;
        const parsed = JSON.parse(saved) as Session;
        await apiRequest<{ user: User }>("/api/auth/me", { token: parsed.token });
        await saveSession(parsed);
        if (parsed.user.canManageVenue) await loadVenue(parsed.token);
        else await loadCustomerDashboard(parsed.token);
      } catch (_error) {
        await SecureStore.deleteItemAsync(SESSION_KEY);
      } finally {
        if (mounted) setBooting(false);
      }
    }
    boot();
    return () => {
      mounted = false;
    };
  }, [loadCustomerDashboard, loadPublicData, loadVenue, saveSession]);

  useEffect(() => {
    if (mainTab === "nearby" && nearby.length === 0) {
      loadNearby().catch((error) => Alert.alert("Konum alınamadı", error.message));
    }
  }, [loadNearby, mainTab, nearby.length]);

  async function submitAuth() {
    try {
      setLoading(true);
      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authMode === "login"
          ? { email: form.email, password: form.password, loginType: role }
          : { name: form.name, email: form.email, phone: form.phone, password: form.password, role };
      const data = await apiRequest<Session & { nextStep?: string }>(path, { method: "POST", body: payload });
      await saveSession({ token: data.token, user: data.user });
      if (data.user.canManageVenue) {
        setVenueOnboardingDismissed(false);
        await loadVenue(data.token);
      } else {
        await loadCustomerDashboard(data.token);
      }
      if (data.nextStep) Alert.alert("tyee", data.nextStep);
    } catch (error) {
      Alert.alert("Giriş yapılamadı", error instanceof Error ? error.message : "Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await saveSession(null);
    setVenuePayload(null);
    setCustomerDashboard(null);
    setVenueOnboardingDismissed(false);
    setMainTab("discover");
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Image source={brandLogo} style={styles.splashLogo} resizeMode="contain" />
          <ActivityIndicator color="#248be8" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {isVenueUser ? (
        <>
          <View style={styles.header}>
            <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
            {session ? (
              <View style={styles.userPill}>
                <Text style={styles.userInitials}>{initials(session.user.name)}</Text>
              </View>
            ) : null}
          </View>
          <SegmentedTabs items={venueTabs} active={venueTab} onChange={setVenueTab} />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {session && venuePayload && !venueOnboardingDismissed && missingVenueSteps.length ? (
              <VenueOnboardingCard
                settings={venuePayload.settings}
                missingSteps={missingVenueSteps}
                onSkip={() => setVenueOnboardingDismissed(true)}
                onSave={saveVenueSettings}
              />
            ) : null}
            {venueTab === "today" ? (
              <VenueToday
                payload={venuePayload}
                onRefresh={() => {
                  if (session) loadVenue(session.token);
                }}
              />
            ) : null}
            {venueTab === "calendar" ? <VenueCalendar payload={venuePayload} /> : null}
            {venueTab === "reservations" ? <VenueReservations payload={venuePayload} /> : null}
            {venueTab === "account" && session ? <AccountCard session={session} onLogout={logout} venueMode /> : null}
          </ScrollView>
        </>
      ) : (
        <View style={styles.consumerShell}>
          <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView
              style={styles.consumerScroll}
              contentContainerStyle={[
                styles.consumerContent,
                mainTab === "nearby" && !selectedListing ? styles.searchContent : null,
              ]}
              showsVerticalScrollIndicator={false}
            >
              {selectedListing ? (
                <ListingDetailScreen
                  listing={selectedListing}
                  slots={availabilitySlots}
                  draft={reservationDraft}
                  loading={reservationLoading}
                  onBack={() => setSelectedListing(null)}
                  onDraftChange={setReservationDraft}
                  onRefreshSlots={refreshSelectedAvailability}
                  onSubmit={submitMobileReservation}
                />
              ) : (
                <>
                  {mainTab === "discover" ? (
                    <DiscoverScreen
                      categories={categories}
                      listings={listings}
                      query={query}
                      selectedCategory={selectedCategory}
                      signedIn={Boolean(session)}
                      onQueryChange={setQuery}
                      onSearch={() => refreshListings()}
                      onCategoryPress={(categoryId) => refreshListings({ category: categoryId, query })}
                      onListingPress={openListing}
                      onLoginPress={() => setMainTab("account")}
                    />
                  ) : null}
                  {mainTab === "nearby" ? (
                    <NearbyScreen items={nearby} listings={listings} onRefresh={loadNearby} onItemPress={openListing} />
                  ) : null}
                  {mainTab === "bookings" ? (
                    <BookingsScreen
                      signedIn={Boolean(session)}
                      dashboard={customerDashboard}
                      onLoginPress={() => setMainTab("account")}
                      onExplorePress={() => setMainTab("nearby")}
                      onRefresh={() => {
                        if (session?.token) loadCustomerDashboard(session.token);
                      }}
                    />
                  ) : null}
                  {mainTab === "account" ? (
                    <ProfileScreen
                      session={session}
                      authMode={authMode}
                      role={role}
                      form={form}
                      loading={loading}
                      onLogout={logout}
                      onModeChange={setAuthMode}
                      onRoleChange={setRole}
                      onFormChange={setForm}
                      onSubmitAuth={submitAuth}
                    />
                  ) : null}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
          <BottomTabs
            items={customerTabs}
            active={mainTab}
            onChange={(tab) => {
              setSelectedListing(null);
              setMainTab(tab);
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function SegmentedTabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.tabs}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onChange(item.id)}
          style={[styles.tabButton, active === item.id && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, active === item.id && styles.tabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function BottomTabs({
  items,
  active,
  onChange,
}: {
  items: { id: MainTab; label: string; icon: string }[];
  active: MainTab;
  onChange: (id: MainTab) => void;
}) {
  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
              style={[styles.bottomTab, isActive && styles.bottomTabActive]}
            >
              <Text style={[styles.bottomTabIcon, isActive && styles.bottomTabIconActive]}>{item.icon}</Text>
              <Text style={[styles.bottomTabLabel, isActive && styles.bottomTabLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DiscoverScreen({
  categories,
  listings,
  query,
  selectedCategory,
  signedIn,
  onQueryChange,
  onSearch,
  onCategoryPress,
  onListingPress,
  onLoginPress,
}: {
  categories: Category[];
  listings: Listing[];
  query: string;
  selectedCategory: string;
  signedIn: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onCategoryPress: (categoryId: string) => void;
  onListingPress: (listing: Listing) => void;
  onLoginPress: () => void;
}) {
  const categoryTiles = [
    { id: "all", label: "Tümü", icon: "▦" },
    { id: "bayan-kuafor", label: "Bayan kuaför", icon: "⌁" },
    { id: "guzellik", label: "Kaşlar ve kirpikler", icon: "⌒" },
    { id: "masaj", label: "Masaj", icon: "━" },
    { id: "spa", label: "Spa & sauna", icon: "▤" },
    { id: "guzellik", label: "Tırnaklar", icon: "∩" },
    { id: "guzellik", label: "Epilasyon", icon: "▣" },
    { id: "guzellik", label: "Yüz bakımları", icon: "☺" },
    { id: "erkek-berber", label: "Erkek berber", icon: "⌙" },
    { id: "guzellik", label: "Estetik", icon: "⌬" },
  ];
  const recommended = listings.slice(0, 4);
  const fresh = listings.slice(4, 8).length ? listings.slice(4, 8) : listings.slice(0, 4);
  const nearbyItems = listings.slice(0, 6);
  const categoryColumns = categoryTiles.slice(0, 5).map((_, index) => categoryTiles.filter((__, itemIndex) => itemIndex % 5 === index));

  return (
    <View style={styles.mobilePage}>
      <Pressable style={styles.locationRow}>
        <Text style={styles.locationPin}>●</Text>
        <Text style={styles.locationText}>Mevcut konum</Text>
        <Text style={styles.locationChevron}>⌄</Text>
      </Pressable>

      <View style={styles.mobileSearchBar}>
        <Text style={styles.mobileSearchIcon}>⌕</Text>
        <View style={styles.mobileSearchInputWrap}>
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Tüm tedavilere göz atın"
            placeholderTextColor="#8b8b8b"
            returnKeyType="search"
            onSubmitEditing={onSearch}
            style={styles.mobileSearchInput}
          />
        </View>
        <Pressable style={styles.mobileSearchButton} onPress={onSearch}>
          <Text style={styles.mobileSearchButtonText}>Ara</Text>
        </Pressable>
      </View>

      <ScrollView horizontal style={styles.mobileCategoryScroller} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileCategoryColumns}>
        {categoryColumns.map((column, columnIndex) => (
          <View key={`category-column-${columnIndex}`} style={styles.mobileCategoryColumn}>
            {column.map((category, itemIndex) => (
              <Pressable key={`${category.label}-${itemIndex}`} style={styles.mobileCategoryTile} onPress={() => onCategoryPress(category.id)}>
                <View style={[styles.mobileCategoryIconBox, selectedCategory === category.id && styles.mobileCategoryIconBoxActive]}>
                  <Text style={styles.mobileCategoryIcon}>{category.icon}</Text>
                </View>
                <Text style={styles.mobileCategoryLabel}>{category.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.mobileSectionHeader}>
        <Text style={styles.mobileSectionTitle}>Önerilen</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureRail}>
        {recommended.map((listing, index) => (
          <FeatureListingCard key={listing.id} listing={listing} index={index} onPress={() => onListingPress(listing)} />
        ))}
      </ScrollView>

      <View style={styles.mobileSectionHeader}>
        <Text style={styles.mobileSectionTitle}>tyee'de yeni</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureRail}>
        {fresh.map((listing, index) => (
          <FeatureListingCard key={`fresh-${listing.id}`} listing={listing} index={index + 1} compact onPress={() => onListingPress(listing)} />
        ))}
      </ScrollView>

      <View style={styles.mobileSectionHeader}>
        <Text style={styles.mobileSectionTitle}>Yakındaki mekânlar</Text>
        <Pressable onPress={onSearch}>
          <Text style={styles.seeAllText}>Tümünü gör</Text>
        </Pressable>
      </View>
      {nearbyItems.map((listing, index) => (
        <NearbyVenueCard key={`near-${listing.id}`} listing={listing} index={index} onPress={() => onListingPress(listing)} />
      ))}

      {!signedIn ? (
        <Pressable style={styles.mobileSoftLogin} onPress={onLoginPress}>
          <Text style={styles.mobileSoftLoginText}>Favoriler ve randevular için giriş yap</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FeatureListingCard({
  listing,
  index,
  compact = false,
  onPress,
}: {
  listing: Listing;
  index: number;
  compact?: boolean;
  onPress: () => void;
}) {
  const imageUri = listing.mediaUrl || listing.gallery?.[0]?.src || fallbackStudioImages[index % fallbackStudioImages.length] || getListingImageUri(listing);
  const reviews = listing.reviews || (index + 1) * 61;
  return (
    <Pressable style={[styles.featureCard, compact && styles.featureCardCompact]} onPress={onPress}>
      <View>
        <Image source={{ uri: imageUri }} style={styles.featureImage} />
        <View style={styles.featureBadge}>
          <Text style={styles.featureBadgeText}>Öne Çıkanlar</Text>
        </View>
      </View>
      <View style={styles.featureTitleRow}>
        <Text style={styles.featureTitle} numberOfLines={1}>{listing.name}</Text>
        <Text style={styles.featureRating}>★ {Number(listing.rating || 5).toFixed(1).replace(".", ",")}</Text>
      </View>
      <Text style={styles.featureMeta} numberOfLines={1}>
        {listing.distance || ">50 km"} · {listing.cityLabel || "İstanbul"}
      </Text>
      <Text style={styles.featureMeta} numberOfLines={1}>
        {listing.categoryLabel || listing.category} · {reviews} değerlendirme
      </Text>
    </Pressable>
  );
}

function NearbyVenueCard({ listing, index, onPress }: { listing: Listing; index: number; onPress: () => void }) {
  const imageUri = listing.mediaUrl || listing.gallery?.[0]?.src || fallbackStudioImages[(index + 2) % fallbackStudioImages.length] || getListingImageUri(listing);
  return (
    <Pressable style={styles.nearVenueCard} onPress={onPress}>
      <Image source={{ uri: imageUri }} style={styles.nearVenueImage} />
      <View style={styles.nearVenueBody}>
        <Text style={styles.nearVenueTitle} numberOfLines={1}>{listing.name}</Text>
        <Text style={styles.nearVenueMeta} numberOfLines={1}>
          {listing.distance || `${(index + 2).toString()},${index + 1} km`} · {listing.cityLabel || "İstanbul"}
        </Text>
        <Text style={styles.nearVenueMeta} numberOfLines={1}>
          ★ {Number(listing.rating || 4.9).toFixed(1).replace(".", ",")} · {listing.categoryLabel || listing.category}
        </Text>
      </View>
    </Pressable>
  );
}

function NearbyScreen({
  items,
  listings,
  onRefresh,
  onItemPress,
}: {
  items: NearbyItem[];
  listings: Listing[];
  onRefresh: () => Promise<void>;
  onItemPress: (item: NearbyItem | Listing) => void;
}) {
  const [loading, setLoading] = useState(false);
  const visibleListings = listings.length ? listings : [];

  async function refresh() {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.searchPage}>
      <View style={styles.mapStage}>
        <View style={[styles.mapRoad, styles.mapRoadOne]} />
        <View style={[styles.mapRoad, styles.mapRoadTwo]} />
        <View style={[styles.mapRoad, styles.mapRoadThree]} />
        <Text style={[styles.mapLabel, { top: 118, left: 118 }]}>LEVENT MH.</Text>
        <Text style={[styles.mapLabel, { top: 196, right: 54 }]}>NİSBETİYE</Text>
        <Text style={[styles.mapPointLabel, { top: 282, left: 150 }]}>Zorlu Performans</Text>
        <View style={styles.userMapDot} />
        <View style={styles.searchMapBar}>
          <Text style={styles.searchMapIcon}>⌕</Text>
          <View style={styles.searchMapTexts}>
            <Text style={styles.searchMapTitle}>Tüm işlemler</Text>
            <Text style={styles.searchMapSub}>Mevcut konum</Text>
          </View>
          <Pressable style={styles.searchMapFilter} onPress={refresh}>
            <Text style={styles.searchMapFilterText}>{loading ? "…" : "☰"}</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.searchSheet}>
        <View style={styles.sheetHandle} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
          {["☷", "Mekanlar⌄", "En iyi eşleşme⌄", "Fiyat⌄"].map((filter) => (
            <Pressable key={filter} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.mapCount}>Harita alanındaki {(visibleListings.length || items.length || 19)} mekân</Text>
        {visibleListings.slice(0, 8).map((listing, index) => (
          <SearchResultCard key={`search-${listing.id}`} listing={listing} index={index} onPress={() => onItemPress(listing)} />
        ))}
        {!visibleListings.length ? (
          items.slice(0, 8).map((item, index) => (
            <SearchNearbyItem key={item.id} item={item} index={index} onPress={() => onItemPress(item)} />
          ))
        ) : null}
      </View>
    </View>
  );
}

function SearchResultCard({ listing, index, onPress }: { listing: Listing; index: number; onPress: () => void }) {
  const imageUri = listing.mediaUrl || listing.gallery?.[0]?.src || fallbackStudioImages[index % fallbackStudioImages.length] || getListingImageUri(listing);
  return (
    <Pressable style={styles.searchResultCard} onPress={onPress}>
      <Image source={{ uri: imageUri }} style={styles.searchResultImage} />
      <View style={styles.searchResultText}>
        <View style={styles.featureTitleRow}>
          <Text style={styles.searchResultTitle} numberOfLines={2}>{listing.name}</Text>
          <Text style={styles.searchResultRating}>★ {Number(listing.rating || 5).toFixed(1).replace(".", ",")}</Text>
        </View>
        <Text style={styles.searchResultMeta} numberOfLines={1}>
          {listing.distance || `${index + 2},${index} km`} · {listing.cityLabel || "İstanbul"}
        </Text>
        <Text style={styles.searchResultMeta} numberOfLines={1}>
          {listing.categoryLabel || listing.category} · {listing.reviews || (index + 1) * 85} değerlendirme
        </Text>
      </View>
    </Pressable>
  );
}

function SearchNearbyItem({ item, index, onPress }: { item: NearbyItem; index: number; onPress: () => void }) {
  const imageUri = item.mediaUrl || fallbackStudioImages[index % fallbackStudioImages.length];
  return (
    <Pressable style={styles.searchResultCard} onPress={onPress}>
      <Image source={{ uri: imageUri }} style={styles.searchResultImage} />
      <View style={styles.searchResultText}>
        <Text style={styles.searchResultTitle} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.searchResultMeta}>{item.distanceLabel} · {item.cityLabel}</Text>
        <Text style={styles.searchResultMeta}>{item.categoryLabel} · {item.nextSlot} müsait</Text>
      </View>
    </Pressable>
  );
}

function BookingsScreen({
  signedIn,
  dashboard,
  onLoginPress,
  onExplorePress,
  onRefresh,
}: {
  signedIn: boolean;
  dashboard: CustomerDashboard | null;
  onLoginPress: () => void;
  onExplorePress: () => void;
  onRefresh: () => void;
}) {
  const upcoming = dashboard?.reservations?.upcoming || [];
  const past = dashboard?.reservations?.past || [];
  if (signedIn && upcoming.length + past.length > 0) {
    return (
      <>
        <View style={styles.sectionHeaderRow}>
          <SectionHeader title="Rezervasyonlarım" />
          <Pressable onPress={onRefresh}>
            <Text style={styles.refreshText}>Yenile</Text>
          </Pressable>
        </View>
        {upcoming.map((reservation) => (
          <View key={reservation.id} style={styles.reservationCard}>
            <Text style={styles.listingName}>{reservation.venueName}</Text>
            <Text style={styles.listingMeta}>
              {reservation.serviceLabel} · {reservation.serviceDate} {reservation.serviceTime}
            </Text>
            <View style={styles.listingFooter}>
              <StatusPill label={reservation.status || "Aktif"} active />
              <Text style={styles.priceText}>{money(reservation.totalAmount)}</Text>
            </View>
          </View>
        ))}
        {past.slice(0, 4).map((reservation) => (
          <View key={reservation.id} style={styles.reservationCardMuted}>
            <Text style={styles.listingName}>{reservation.venueName}</Text>
            <Text style={styles.listingMeta}>{reservation.serviceLabel}</Text>
          </View>
        ))}
      </>
    );
  }

  return (
    <View style={styles.activityPage}>
      <Text style={styles.pageTitle}>Etkinlik</Text>
      <View style={styles.activityEmptyWrap}>
        <View style={styles.activityIcon}>
          <View style={styles.activityIconTop} />
        </View>
        <Text style={styles.activityTitle}>Etkinlik yok</Text>
        <Text style={styles.activityText}>
          Yaklaşan ve geçmiş randevularınızı yönetmek veya etkinliği görüntülemek için oturum açın veya kaydolun
        </Text>
        <Pressable style={styles.blackButton} onPress={onExplorePress}>
          <Text style={styles.blackButtonText}>Mekan ara</Text>
        </Pressable>
        {!signedIn ? (
          <Pressable style={styles.outlinePillButton} onPress={onLoginPress}>
            <Text style={styles.outlinePillButtonText}>Oturum açın veya kaydolun</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ListingDetailScreen({
  listing,
  slots,
  draft,
  loading,
  onBack,
  onDraftChange,
  onRefreshSlots,
  onSubmit,
}: {
  listing: Listing;
  slots: AvailabilitySlot[];
  draft: {
    serviceDate: string;
    serviceTime: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    note: string;
  };
  loading: boolean;
  onBack: () => void;
  onDraftChange: (draft: {
    serviceDate: string;
    serviceTime: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    note: string;
  }) => void;
  onRefreshSlots: (serviceDate: string) => void;
  onSubmit: () => void;
}) {
  const imageUri = getListingImageUri(listing);
  const availableSlots = slots.filter((slot) => slot.available);
  return (
    <>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>‹ Listeye dön</Text>
      </Pressable>
      <View style={styles.detailCard}>
        <Image source={{ uri: imageUri }} style={styles.detailImage} />
        <View style={styles.detailContent}>
          <View style={styles.listingTitleRow}>
            <Text style={styles.detailTitle}>{listing.name}</Text>
            <Text style={styles.ratingBadge}>{Number(listing.rating || 4.8).toFixed(1)}</Text>
          </View>
          <Text style={styles.listingMeta}>
            {listing.cityLabel} · {listing.categoryLabel || listing.category}
          </Text>
          <Text style={styles.detailSummary}>{listing.summary || "Bu işletme tyee üzerinden rezervasyona açık."}</Text>
          <View style={styles.tagRow}>
            {(listing.tags || ["Müsaitlik", "Rezervasyon", "Güvenli akış"]).slice(0, 3).map((tag) => (
              <Text key={tag} style={styles.tagPill}>{tag}</Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.bookingPanel}>
        <Text style={styles.sectionTitle}>Rezerv et</Text>
        <Text style={styles.bookingLabel}>Tarih</Text>
        <TextInput
          value={draft.serviceDate}
          onChangeText={(serviceDate) => onDraftChange({ ...draft, serviceDate })}
          placeholder="YYYY-MM-DD"
          onEndEditing={() => onRefreshSlots(draft.serviceDate)}
          style={styles.input}
        />
        <Pressable style={styles.secondaryCompactButton} onPress={() => onRefreshSlots(draft.serviceDate)} disabled={loading}>
          <Text style={styles.secondaryCompactButtonText}>{loading ? "Yenileniyor..." : "Bu tarihteki saatleri getir"}</Text>
        </Pressable>
        <Text style={styles.bookingLabel}>Saat</Text>
        {slots.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotPicker}>
            {(availableSlots.length ? availableSlots : slots).slice(0, 8).map((slot) => (
              <Pressable
                key={slot.time}
                disabled={!slot.available}
                style={[
                  styles.slotButton,
                  draft.serviceTime === slot.time && styles.slotButtonActive,
                  !slot.available && styles.slotButtonDisabled,
                ]}
                onPress={() => onDraftChange({ ...draft, serviceTime: slot.time })}
              >
                <Text style={[styles.slotButtonText, draft.serviceTime === slot.time && styles.slotButtonTextActive]}>{slot.time}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptySlotText}>Bu tarih için uygun saat bulunamadı.</Text>
        )}

        <Text style={styles.bookingLabel}>Bilgilerin</Text>
        <TextInput
          value={draft.customerName}
          onChangeText={(customerName) => onDraftChange({ ...draft, customerName })}
          placeholder="Ad soyad"
          style={styles.input}
        />
        <TextInput
          value={draft.customerPhone}
          onChangeText={(customerPhone) => onDraftChange({ ...draft, customerPhone })}
          placeholder="Telefon"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          value={draft.customerEmail}
          onChangeText={(customerEmail) => onDraftChange({ ...draft, customerEmail })}
          placeholder="E-posta"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={draft.note}
          onChangeText={(note) => onDraftChange({ ...draft, note })}
          placeholder="Not (opsiyonel)"
          style={[styles.input, styles.noteInput]}
          multiline
        />
        <View style={styles.paymentPreview}>
          <Text style={styles.paymentTitle}>Ödeme modeli işletmeye göre uygulanır</Text>
          <Text style={styles.paymentText}>Sadece rezervasyon, kapora veya ödemenin tamamı seçeneklerinden işletmenin aktif ettiği model kullanılır.</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? "Oluşturuluyor..." : `${money(listing.price)} ile rezerv et`}</Text>
        </Pressable>
      </View>
    </>
  );
}

function AuthCard({
  mode,
  role,
  form,
  loading,
  onModeChange,
  onRoleChange,
  onFormChange,
  onSubmit,
}: {
  mode: "login" | "register";
  role: Role;
  form: { name: string; email: string; phone: string; password: string };
  loading: boolean;
  onModeChange: (mode: "login" | "register") => void;
  onRoleChange: (role: Role) => void;
  onFormChange: (form: { name: string; email: string; phone: string; password: string }) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.authCard}>
      <Text style={styles.authTitle}>{mode === "login" ? "Giriş yap" : "Hesap oluştur"}</Text>
      <Text style={styles.authLead}>Kullanım tipini seç; sözleşme ve giriş akışı buna göre hazırlanır.</Text>
      <View style={styles.authRoleGrid}>
        <AuthRoleCard
          title="Bireysel"
          description="Rezervasyon yap, favorilerini takip et ve ödemelerini yönet."
          icon="👤"
          image={authCustomerBg}
          active={role === "customer"}
          onPress={() => onRoleChange("customer")}
        />
        <AuthRoleCard
          title="İşletme"
          description="Takvim, hizmet, tahsilat ve marketplace satışlarını yönet."
          icon="▦"
          image={authVenueBg}
          active={role === "venue"}
          onPress={() => onRoleChange("venue")}
        />
      </View>
      {mode === "register" ? (
        <TextInput
          value={form.name}
          onChangeText={(name) => onFormChange({ ...form, name })}
          placeholder={role === "venue" ? "İşletme adı" : "Ad soyad"}
          style={styles.input}
        />
      ) : null}
      <TextInput
        value={form.email}
        onChangeText={(email) => onFormChange({ ...form, email })}
        placeholder="E-posta"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      {mode === "register" ? (
        <TextInput
          value={form.phone}
          onChangeText={(phone) => onFormChange({ ...form, phone })}
          placeholder="Telefon"
          keyboardType="phone-pad"
          style={styles.input}
        />
      ) : null}
      <TextInput
        value={form.password}
        onChangeText={(password) => onFormChange({ ...form, password })}
        placeholder="Şifre"
        secureTextEntry
        style={styles.input}
      />
      <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? "Bekle..." : mode === "login" ? "Giriş yap" : "Kayıt ol"}</Text>
      </Pressable>
      <Pressable onPress={() => onModeChange(mode === "login" ? "register" : "login")}>
        <Text style={styles.authToggle}>{mode === "login" ? "Yeni hesap oluştur" : "Zaten hesabım var"}</Text>
      </Pressable>
    </View>
  );
}

function AuthRoleCard({
  title,
  description,
  icon,
  image,
  active,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  image: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.mobileRoleCard, active && styles.mobileRoleCardActive]} onPress={onPress}>
      <ImageBackground source={image} style={styles.mobileRoleBg} imageStyle={styles.mobileRoleBgImage}>
        <View style={styles.mobileRoleOverlay}>
          <View style={styles.mobileRoleIcon}>
            <Text style={styles.mobileRoleIconText}>{icon}</Text>
          </View>
          <Text style={styles.mobileRoleTitle}>{title}</Text>
          <Text style={styles.mobileRoleDescription}>{description}</Text>
          <Text style={styles.mobileRoleAction}>{active ? "Seçili" : "Seç"}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function ProfileScreen({
  session,
  authMode,
  role,
  form,
  loading,
  onLogout,
  onModeChange,
  onRoleChange,
  onFormChange,
  onSubmitAuth,
}: {
  session: Session | null;
  authMode: "login" | "register";
  role: Role;
  form: { name: string; email: string; phone: string; password: string };
  loading: boolean;
  onLogout: () => void;
  onModeChange: (mode: "login" | "register") => void;
  onRoleChange: (role: Role) => void;
  onFormChange: (form: { name: string; email: string; phone: string; password: string }) => void;
  onSubmitAuth: () => void;
}) {
  const [showAuth, setShowAuth] = useState(false);
  const displayName = session?.user.name || "Hüseyin Yıldız";
  const menuItems = [
    { icon: "▣", label: "Profil" },
    { icon: "♡", label: "Favoriler" },
    { icon: "○", label: "Mesajlar" },
    { icon: "□", label: "Randevularım" },
    { icon: "▤", label: "Formlar" },
    { icon: "⚙", label: "Ayarlar" },
  ];
  const supportItems = [
    { icon: "◎", label: "Destek" },
    { icon: "◌", label: "Türkçe (Türkiye)" },
  ];

  return (
    <View style={styles.profilePage}>
      <View style={styles.profileHeader}>
        <View style={styles.profileIdentity}>
          <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.profileSubtitle}>Kişisel profil</Text>
        </View>
        <Image source={{ uri: profilePhotoUri }} style={styles.profilePhoto} />
      </View>

      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Cüzdan bakiyesi</Text>
        <Text style={styles.walletAmount}>₺0,00</Text>
        <Pressable style={styles.walletButton}>
          <Text style={styles.walletButtonText}>Cüzdanı görüntüle</Text>
        </Pressable>
      </View>

      <View style={styles.profileMenuCard}>
        {menuItems.map((item) => (
          <Pressable key={item.label} style={styles.profileMenuItem}>
            <Text style={styles.profileMenuIcon}>{item.icon}</Text>
            <Text style={styles.profileMenuLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.profileMenuCard}>
        {supportItems.map((item) => (
          <Pressable key={item.label} style={styles.profileMenuItem}>
            <Text style={styles.profileMenuIcon}>{item.icon}</Text>
            <Text style={styles.profileMenuLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {session ? (
        <Pressable style={styles.logoutCard} onPress={onLogout}>
          <Text style={styles.profileMenuIcon}>↪</Text>
          <Text style={styles.profileMenuLabel}>Oturumu kapat</Text>
        </Pressable>
      ) : (
        <>
          <Pressable style={styles.logoutCard} onPress={() => setShowAuth((current) => !current)}>
            <Text style={styles.profileMenuIcon}>↪</Text>
            <Text style={styles.profileMenuLabel}>Giriş yap / Kayıt ol</Text>
          </Pressable>
          {showAuth ? (
            <AuthCard
              mode={authMode}
              role={role}
              form={form}
              loading={loading}
              onModeChange={onModeChange}
              onRoleChange={onRoleChange}
              onFormChange={onFormChange}
              onSubmit={onSubmitAuth}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

function AccountCard({ session, onLogout, venueMode = false }: { session: Session; onLogout: () => void; venueMode?: boolean }) {
  return (
    <View style={styles.authCard}>
      <View style={styles.accountHeader}>
        <View style={styles.accountAvatar}>
          <Text style={styles.accountAvatarText}>{initials(session.user.name)}</Text>
        </View>
        <View>
          <Text style={styles.authTitle}>{session.user.name}</Text>
          <Text style={styles.listingMeta}>{session.user.email}</Text>
        </View>
      </View>
      <View style={styles.statusRow}>
        <StatusPill label={session.user.emailVerified ? "E-posta onaylı" : "E-posta bekliyor"} active={Boolean(session.user.emailVerified)} />
        <StatusPill label={session.user.phoneVerified ? "Telefon onaylı" : "Telefon bekliyor"} active={Boolean(session.user.phoneVerified)} />
      </View>
      {venueMode ? (
        <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(`${API_BASE_URL}/venue.html`)}>
          <Text style={styles.secondaryButtonText}>Detaylı web paneli aç</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.dangerButton} onPress={onLogout}>
        <Text style={styles.dangerButtonText}>Çıkış yap</Text>
      </Pressable>
    </View>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.statusPill, active && styles.statusPillActive]}>
      <Text style={[styles.statusText, active && styles.statusTextActive]}>{label}</Text>
    </View>
  );
}

function VenueOnboardingCard({
  settings,
  missingSteps,
  onSkip,
  onSave,
}: {
  settings?: Partial<VenueSettings>;
  missingSteps: VenueOnboardingStep[];
  onSkip: () => void;
  onSave: (settings: VenueSettings) => Promise<void>;
}) {
  const normalized = normalizeVenueSettings(settings);
  const step = missingSteps[0];
  const firstArea = normalized.areas[0] || {};
  const [draft, setDraft] = useState({
    businessName: normalized.businessName,
    phone: normalized.contact.phone || "",
    email: normalized.contact.email || "",
    address: normalized.location.address || "",
    lat: normalized.location.lat || "",
    lng: normalized.location.lng || "",
    category: normalized.details.category || "",
    district: normalized.details.district || "",
    imageUri: normalized.media.coverUrl || "",
    areaName: firstArea.name || "",
    areaType: firstArea.type || "",
    price: firstArea.price || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      businessName: normalized.businessName,
      phone: normalized.contact.phone || "",
      email: normalized.contact.email || "",
      address: normalized.location.address || "",
      lat: normalized.location.lat || "",
      lng: normalized.location.lng || "",
      category: normalized.details.category || "",
      district: normalized.details.district || "",
      imageUri: normalized.media.coverUrl || "",
      areaName: firstArea.name || "",
      areaType: firstArea.type || "",
      price: firstArea.price || "",
    });
  }, [settings, step.id]);

  async function useCurrentLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Konum izni gerekli", "Haritada doğru görünmek için konum izni vermelisin.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setDraft((current) => ({
        ...current,
        lat: String(Number(position.coords.latitude).toFixed(6)),
        lng: String(Number(position.coords.longitude).toFixed(6)),
        address: current.address || "Konum pin ile seçildi",
      }));
    } catch (error) {
      Alert.alert("Konum alınamadı", error instanceof Error ? error.message : "Lütfen tekrar dene.");
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Fotoğraf izni gerekli", "İşletme görseli seçmek için fotoğraf izni vermelisin.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
      quality: 0.72,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.base64) {
      const mimeType = asset.mimeType || "image/jpeg";
      setDraft((current) => ({ ...current, imageUri: `data:${mimeType};base64,${asset.base64}` }));
    }
  }

  async function saveStep() {
    const next = normalizeVenueSettings(settings);
    const nextAreas = next.areas.length ? [...next.areas] : [{ name: "", type: "", capacity: "", price: "", isActive: true }];
    nextAreas[0] = { ...nextAreas[0] };

    if (step.id === "business") {
      if (!draft.businessName.trim()) {
        Alert.alert("İşletme adı gerekli", "Bu alanı boş bırakamayız.");
        return;
      }
      next.businessName = draft.businessName.trim();
    }

    if (step.id === "contact") {
      if (!draft.phone.trim() && !draft.email.trim()) {
        Alert.alert("İletişim gerekli", "Telefon veya e-posta bilgilerinden en az biri gerekli.");
        return;
      }
      next.contact = { ...next.contact, phone: draft.phone.trim(), whatsapp: draft.phone.trim(), email: draft.email.trim() };
    }

    if (step.id === "location") {
      if (!draft.address.trim() || !draft.lat.trim() || !draft.lng.trim()) {
        Alert.alert("Adres ve konum gerekli", "Adres ile enlem/boylam bilgisi birlikte gerekli.");
        return;
      }
      next.location = { ...next.location, address: draft.address.trim(), lat: draft.lat.trim(), lng: draft.lng.trim() };
      next.locationStatus = "Konum seçildi";
    }

    if (step.id === "details") {
      if (!draft.category.trim() || !draft.district.trim()) {
        Alert.alert("Kategori ve bölge gerekli", "Doğru eşleşme için ikisini de dolduralım.");
        return;
      }
      next.details = { ...next.details, category: draft.category.trim(), district: draft.district.trim() };
    }

    if (step.id === "media") {
      if (!draft.imageUri.trim()) {
        Alert.alert("Görsel gerekli", "En az bir işletme görseli seçelim.");
        return;
      }
      next.media = {
        ...next.media,
        coverUrl: draft.imageUri,
        gallery: next.media.gallery.includes(draft.imageUri) ? next.media.gallery : [draft.imageUri, ...next.media.gallery],
      };
    }

    if (step.id === "area") {
      if (!draft.areaName.trim() || !draft.areaType.trim()) {
        Alert.alert("Alan bilgisi gerekli", "Salon, hoca, saha, oda veya masa adını ve tipini yazalım.");
        return;
      }
      nextAreas[0] = { ...nextAreas[0], name: draft.areaName.trim(), type: draft.areaType.trim(), isActive: true };
      next.areas = nextAreas;
    }

    if (step.id === "price") {
      if (!draft.price.trim()) {
        Alert.alert("Fiyat gerekli", "Başlangıç fiyatını yazalım. Örn: ₺750 / saat");
        return;
      }
      nextAreas[0] = { ...nextAreas[0], price: draft.price.trim(), isActive: true };
      next.areas = nextAreas;
    }

    try {
      setSaving(true);
      await onSave(next);
    } catch (error) {
      Alert.alert("Kaydedilemedi", error instanceof Error ? error.message : "Lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.onboardingCard}>
      <View style={styles.onboardingHeader}>
        <View style={styles.onboardingBadge}>
          <Text style={styles.onboardingBadgeText}>
            {missingSteps.length} eksik
          </Text>
        </View>
        <Pressable onPress={onSkip}>
          <Text style={styles.skipText}>Daha sonra</Text>
        </Pressable>
      </View>
      <Text style={styles.onboardingTitle}>{step.title}</Text>
      <Text style={styles.onboardingText}>{step.description}</Text>

      {step.id === "business" ? (
        <TextInput
          value={draft.businessName}
          onChangeText={(businessName) => setDraft((current) => ({ ...current, businessName }))}
          placeholder="Örn: Kadıköy Arena"
          style={styles.input}
        />
      ) : null}

      {step.id === "contact" ? (
        <>
          <TextInput
            value={draft.phone}
            onChangeText={(phone) => setDraft((current) => ({ ...current, phone }))}
            placeholder="Telefon / WhatsApp"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            value={draft.email}
            onChangeText={(email) => setDraft((current) => ({ ...current, email }))}
            placeholder="İşletme e-postası"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </>
      ) : null}

      {step.id === "location" ? (
        <>
          <TextInput
            value={draft.address}
            onChangeText={(address) => setDraft((current) => ({ ...current, address }))}
            placeholder="Cadde, sokak, bina no"
            style={styles.input}
          />
          <View style={styles.twoColumn}>
            <TextInput
              value={draft.lat}
              onChangeText={(lat) => setDraft((current) => ({ ...current, lat }))}
              placeholder="Enlem"
              keyboardType="decimal-pad"
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              value={draft.lng}
              onChangeText={(lng) => setDraft((current) => ({ ...current, lng }))}
              placeholder="Boylam"
              keyboardType="decimal-pad"
              style={[styles.input, styles.halfInput]}
            />
          </View>
          <Pressable style={styles.secondaryButton} onPress={useCurrentLocation}>
            <Text style={styles.secondaryButtonText}>Konumumu pin yap</Text>
          </Pressable>
        </>
      ) : null}

      {step.id === "details" ? (
        <>
          <TextInput
            value={draft.category}
            onChangeText={(category) => setDraft((current) => ({ ...current, category }))}
            placeholder="Kategori: Halı Saha, Pet Kuaför..."
            style={styles.input}
          />
          <TextInput
            value={draft.district}
            onChangeText={(district) => setDraft((current) => ({ ...current, district }))}
            placeholder="Bölge: Kadıköy, Beşiktaş..."
            style={styles.input}
          />
        </>
      ) : null}

      {step.id === "media" ? (
        <>
          {draft.imageUri ? <Image source={{ uri: draft.imageUri }} style={styles.onboardingImage} /> : null}
          <Pressable style={styles.secondaryButton} onPress={pickImage}>
            <Text style={styles.secondaryButtonText}>{draft.imageUri ? "Görseli değiştir" : "Görsel seç"}</Text>
          </Pressable>
        </>
      ) : null}

      {step.id === "area" ? (
        <>
          <TextInput
            value={draft.areaName}
            onChangeText={(areaName) => setDraft((current) => ({ ...current, areaName }))}
            placeholder="Alan / salon / hoca adı"
            style={styles.input}
          />
          <TextInput
            value={draft.areaType}
            onChangeText={(areaType) => setDraft((current) => ({ ...current, areaType }))}
            placeholder="Tip: Saha, oda, eğitmen, masa..."
            style={styles.input}
          />
        </>
      ) : null}

      {step.id === "price" ? (
        <TextInput
          value={draft.price}
          onChangeText={(price) => setDraft((current) => ({ ...current, price }))}
          placeholder="Örn: ₺750 / saat"
          style={styles.input}
        />
      ) : null}

      <Pressable style={styles.primaryButton} onPress={saveStep} disabled={saving}>
        <Text style={styles.primaryButtonText}>{saving ? "Kaydediliyor..." : "Kaydet ve devam et"}</Text>
      </Pressable>
    </View>
  );
}

function VenueToday({ payload, onRefresh }: { payload: VenuePayload | null; onRefresh: () => void }) {
  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>İşletme mini paneli</Text>
        <Text style={styles.heroTitle}>{payload?.venue?.name || "İşletme paneli"}</Text>
        <Text style={styles.heroSubtitle}>
          {payload?.venue?.branch || "Konum bilgisi bekleniyor"} · {payload?.venue?.sport || "Kategori bekleniyor"}
        </Text>
        <Pressable style={styles.inlineButton} onPress={onRefresh}>
          <Text style={styles.inlineButtonText}>Yenile</Text>
        </Pressable>
      </View>
      <View style={styles.metricGrid}>
        {(payload?.metrics || []).slice(0, 4).map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricDelta}>{metric.delta || "0"}</Text>
          </View>
        ))}
      </View>
      <SectionHeader title="Hızlı işlemler" />
      <View style={styles.quickGrid}>
        {["Yeni rezervasyon", "Boş slot aç", "Takvime git", "Web panel"].map((label) => (
          <Pressable key={label} style={styles.quickButton}>
            <Text style={styles.quickButtonText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function VenueCalendar({ payload }: { payload: VenuePayload | null }) {
  const days = payload?.weekDays || [];
  return (
    <>
      <SectionHeader title="Takvim" />
      {days.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Henüz slot yok.</Text>
          <Text style={styles.emptyText}>Detaylı çalışma saatleri ve alan bilgileri web panelden yönetilecek.</Text>
        </View>
      ) : (
        days.slice(0, 7).map((day) => (
          <View key={`${day.label}-${day.date}`} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day.label}</Text>
              <Text style={styles.dayDate}>{day.date}</Text>
            </View>
            {(day.slots || []).slice(0, 5).map((slot) => (
              <View key={`${day.date}-${slot.time}`} style={styles.slotRow}>
                <Text style={styles.slotTime}>{slot.time}</Text>
                <Text style={styles.slotTitle}>{slot.title || slot.status}</Text>
                <StatusPill label={slot.status} active={slot.status !== "kapalı" && slot.status !== "closed"} />
              </View>
            ))}
          </View>
        ))
      )}
    </>
  );
}

function VenueReservations({ payload }: { payload: VenuePayload | null }) {
  const reservations = payload?.reservations || [];
  return (
    <>
      <SectionHeader title="Rezervasyonlar" />
      {reservations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Yeni işletmede rezervasyon listesi boş gelir.</Text>
          <Text style={styles.emptyText}>Canlı rezervasyon altyapısı bağlandığında bugünkü ve yaklaşan kayıtlar burada görünecek.</Text>
        </View>
      ) : (
        reservations.map((reservation) => (
          <View key={reservation.id} style={styles.reservationCard}>
            <Text style={styles.listingName}>{reservation.customer}</Text>
            <Text style={styles.listingMeta}>
              {reservation.time} · {reservation.field || "Alan"}
            </Text>
            <StatusPill label={reservation.status || "Aktif"} active />
          </View>
        ))
      )}
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f7fbff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  splashLogo: {
    width: 170,
    height: 70,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 144,
    height: 54,
  },
  userPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#dff7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitials: {
    color: "#07123d",
    fontWeight: "900",
  },
  tabs: {
    backgroundColor: "#fff",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f3f7fc",
    borderWidth: 1,
    borderColor: "#e1e9f4",
  },
  tabButtonActive: {
    backgroundColor: "#e8f6ff",
    borderColor: "#9bdfff",
  },
  tabText: {
    color: "#2b3448",
    fontWeight: "800",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#073d77",
  },
  scroll: {
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 34,
  },
  consumerShell: {
    flex: 1,
    backgroundColor: "#fff",
  },
  consumerScroll: {
    flex: 1,
  },
  consumerContent: {
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 132,
  },
  searchContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  bottomNavWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
  },
  bottomNav: {
    minHeight: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "rgba(10, 18, 40, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 7,
    shadowColor: "#07123d",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  bottomTab: {
    flex: 1,
    minHeight: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  bottomTabActive: {
    backgroundColor: "rgba(36, 139, 232, 0.13)",
  },
  bottomTabIcon: {
    color: "#05070c",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
  },
  bottomTabIconActive: {
    color: "#248be8",
  },
  bottomTabLabel: {
    color: "#05070c",
    fontSize: 12,
    fontWeight: "900",
  },
  bottomTabLabelActive: {
    color: "#248be8",
  },
  mobilePage: {
    flex: 1,
  },
  locationRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 8,
    marginBottom: 28,
  },
  locationPin: {
    color: "#248be8",
    fontSize: 17,
    lineHeight: 20,
  },
  locationText: {
    color: "#05070c",
    fontSize: 20,
    fontWeight: "800",
  },
  locationChevron: {
    color: "#05070c",
    fontSize: 20,
    fontWeight: "900",
    marginTop: -5,
  },
  mobileSearchBar: {
    minHeight: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 20,
    paddingRight: 9,
    marginBottom: 32,
    shadowColor: "#07123d",
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  mobileSearchIcon: {
    color: "#05070c",
    fontSize: 35,
    lineHeight: 38,
    fontWeight: "300",
  },
  mobileSearchInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  mobileSearchInput: {
    color: "#05070c",
    fontSize: 19,
    fontWeight: "600",
    minHeight: 50,
  },
  mobileSearchButton: {
    minWidth: 74,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#05070c",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileSearchButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  mobileCategoryGrid: {
    width: 760,
    height: 264,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 20,
    rowGap: 18,
    paddingRight: 24,
    paddingBottom: 8,
  },
  mobileCategoryScroller: {
    height: 278,
    marginBottom: 6,
  },
  mobileCategoryColumns: {
    flexDirection: "row",
    gap: 20,
    paddingRight: 24,
  },
  mobileCategoryColumn: {
    width: 82,
    gap: 18,
  },
  mobileCategoryTile: {
    width: 82,
    height: 128,
    alignItems: "center",
  },
  mobileCategoryIconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    backgroundColor: "#fbfbfb",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileCategoryIconBoxActive: {
    borderColor: "#248be8",
    backgroundColor: "#eef8ff",
  },
  mobileCategoryIcon: {
    color: "#05070c",
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "800",
  },
  mobileCategoryLabel: {
    color: "#05070c",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
  mobileSectionHeader: {
    marginTop: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mobileSectionTitle: {
    color: "#05070c",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
  },
  seeAllText: {
    color: "#05070c",
    fontSize: 16,
    fontWeight: "900",
  },
  featureRail: {
    gap: 16,
    paddingRight: 20,
    paddingBottom: 10,
  },
  featureCard: {
    width: 278,
  },
  featureCardCompact: {
    width: 242,
  },
  featureImage: {
    width: "100%",
    height: 182,
    borderRadius: 18,
    backgroundColor: "#eef2f6",
  },
  featureBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  featureBadgeText: {
    color: "#05070c",
    fontSize: 13,
    fontWeight: "900",
  },
  featureTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 13,
  },
  featureTitle: {
    flex: 1,
    color: "#05070c",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
  },
  featureRating: {
    color: "#05070c",
    fontSize: 17,
    fontWeight: "900",
  },
  featureMeta: {
    color: "#858585",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    marginTop: 2,
  },
  nearVenueCard: {
    minHeight: 134,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 14,
  },
  nearVenueImage: {
    width: 132,
    minHeight: 134,
    backgroundColor: "#eef2f6",
  },
  nearVenueBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  nearVenueTitle: {
    color: "#05070c",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
  },
  nearVenueMeta: {
    color: "#858585",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
    marginTop: 4,
  },
  mobileSoftLogin: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: "#05070c",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  mobileSoftLoginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  searchPage: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapStage: {
    height: 474,
    backgroundColor: "#edf1e7",
    overflow: "hidden",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  mapRoad: {
    position: "absolute",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#d0d5dd",
  },
  mapRoadOne: {
    width: 470,
    top: 150,
    left: -40,
    transform: [{ rotate: "-18deg" }],
  },
  mapRoadTwo: {
    width: 430,
    top: 246,
    right: -54,
    transform: [{ rotate: "26deg" }],
  },
  mapRoadThree: {
    width: 350,
    top: 324,
    left: -20,
    transform: [{ rotate: "4deg" }],
  },
  mapLabel: {
    position: "absolute",
    color: "#72777f",
    fontSize: 16,
    fontWeight: "900",
  },
  mapPointLabel: {
    position: "absolute",
    color: "#d63f8c",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
    maxWidth: 150,
  },
  userMapDot: {
    position: "absolute",
    left: "50%",
    bottom: 18,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#248be8",
    borderWidth: 5,
    borderColor: "#fff",
  },
  searchMapBar: {
    position: "absolute",
    top: 56,
    left: 22,
    right: 22,
    minHeight: 82,
    borderRadius: 41,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingLeft: 21,
    paddingRight: 9,
    shadowColor: "#07123d",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10,
  },
  searchMapIcon: {
    color: "#05070c",
    fontSize: 38,
    lineHeight: 40,
  },
  searchMapTexts: {
    flex: 1,
  },
  searchMapTitle: {
    color: "#05070c",
    fontSize: 20,
    fontWeight: "900",
  },
  searchMapSub: {
    color: "#858585",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 2,
  },
  searchMapFilter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    alignItems: "center",
    justifyContent: "center",
  },
  searchMapFilterText: {
    color: "#05070c",
    fontSize: 28,
    fontWeight: "900",
  },
  searchSheet: {
    marginTop: -42,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 18,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 70,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#d0d0d0",
    marginBottom: 20,
  },
  filterRail: {
    gap: 10,
    paddingRight: 20,
    paddingBottom: 10,
  },
  filterChip: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  filterChipText: {
    color: "#05070c",
    fontSize: 17,
    fontWeight: "800",
  },
  mapCount: {
    color: "#858585",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 18,
  },
  searchResultCard: {
    backgroundColor: "#fff",
    marginBottom: 18,
  },
  searchResultImage: {
    width: "100%",
    height: 186,
    borderRadius: 20,
    backgroundColor: "#eef2f6",
  },
  searchResultText: {
    paddingTop: 12,
  },
  searchResultTitle: {
    flex: 1,
    color: "#05070c",
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
  },
  searchResultRating: {
    color: "#05070c",
    fontSize: 19,
    fontWeight: "900",
  },
  searchResultMeta: {
    color: "#858585",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    marginTop: 2,
  },
  activityPage: {
    minHeight: 720,
  },
  pageTitle: {
    color: "#05070c",
    fontSize: 38,
    lineHeight: 45,
    fontWeight: "900",
    marginTop: 92,
  },
  activityEmptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 220,
  },
  activityIcon: {
    width: 50,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#eee8ff",
    overflow: "hidden",
    marginBottom: 24,
  },
  activityIconTop: {
    height: 16,
    backgroundColor: "#6d5dfc",
  },
  activityTitle: {
    color: "#05070c",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  activityText: {
    color: "#858585",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 26,
  },
  blackButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: "#05070c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  blackButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  outlinePillButton: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    marginTop: 12,
  },
  outlinePillButtonText: {
    color: "#05070c",
    fontSize: 17,
    fontWeight: "800",
  },
  profilePage: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 42,
    marginBottom: 28,
  },
  profileIdentity: {
    flex: 1,
    minWidth: 0,
    paddingRight: 18,
  },
  profileName: {
    color: "#05070c",
    fontSize: 39,
    lineHeight: 45,
    fontWeight: "900",
  },
  profileSubtitle: {
    color: "#858585",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 8,
  },
  profilePhoto: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: "#e6e6e6",
    backgroundColor: "#e7eef7",
  },
  walletCard: {
    minHeight: 188,
    borderRadius: 22,
    backgroundColor: "#248be8",
    padding: 26,
    marginBottom: 26,
    shadowColor: "#248be8",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
  },
  walletLabel: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 20,
    fontWeight: "600",
  },
  walletAmount: {
    color: "#fff",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "900",
    marginTop: 10,
  },
  walletButton: {
    alignSelf: "flex-start",
    minHeight: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 24,
  },
  walletButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  profileMenuCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e2e2",
    backgroundColor: "#fff",
    paddingVertical: 14,
    marginBottom: 24,
  },
  profileMenuItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 24,
  },
  profileMenuIcon: {
    width: 42,
    color: "#05070c",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "500",
    textAlign: "center",
  },
  profileMenuLabel: {
    flex: 1,
    color: "#05070c",
    fontSize: 22,
    fontWeight: "800",
  },
  logoutCard: {
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e2e2",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 24,
    marginBottom: 26,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#eef9ff",
    borderWidth: 1,
    borderColor: "#dcecf7",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#248be8",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: "900",
    marginBottom: 8,
  },
  heroTitle: {
    color: "#07123d",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "#637083",
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
  },
  searchBox: {
    marginTop: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dce7f3",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchText: {
    flex: 1,
    color: "#6b7280",
    fontWeight: "800",
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    color: "#07123d",
    fontSize: 15,
    fontWeight: "800",
  },
  searchButton: {
    backgroundColor: "#248be8",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#07123d",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 12,
  },
  categoryRow: {
    gap: 12,
    paddingBottom: 6,
  },
  categoryCard: {
    width: 132,
    minHeight: 118,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2eaf4",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardActive: {
    borderColor: "#248be8",
    backgroundColor: "#eef8ff",
  },
  categoryIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  categoryTitle: {
    color: "#07123d",
    fontWeight: "900",
    textAlign: "center",
  },
  categoryCount: {
    color: "#667085",
    fontWeight: "800",
    marginTop: 6,
  },
  listingCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e3ebf4",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  listingImage: {
    width: 92,
    height: 118,
    borderRadius: 18,
    backgroundColor: "#e7eef7",
  },
  listingAvatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#e7f6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  listingAvatarText: {
    color: "#073d77",
    fontWeight: "900",
  },
  listingBody: {
    flex: 1,
    minWidth: 0,
  },
  listingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  listingName: {
    flex: 1,
    color: "#07123d",
    fontSize: 17,
    fontWeight: "900",
  },
  ratingBadge: {
    overflow: "hidden",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#20c65a",
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  listingMeta: {
    color: "#6b7280",
    marginTop: 3,
    fontWeight: "700",
  },
  listingSummary: {
    color: "#344054",
    marginTop: 8,
    lineHeight: 19,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#f0f7ff",
    color: "#245f9f",
    fontSize: 11,
    fontWeight: "900",
  },
  listingFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceText: {
    color: "#07123d",
    fontWeight: "900",
  },
  nextSlot: {
    color: "#248be8",
    fontWeight: "900",
  },
  softCta: {
    marginTop: 12,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#fff7ef",
    borderWidth: 1,
    borderColor: "#ffe1c2",
  },
  softCtaTitle: {
    color: "#07123d",
    fontSize: 18,
    fontWeight: "900",
  },
  softCtaText: {
    marginTop: 6,
    color: "#637083",
    lineHeight: 20,
    fontWeight: "700",
  },
  mapPreview: {
    borderRadius: 24,
    padding: 20,
    minHeight: 180,
    backgroundColor: "#eaf8f3",
    borderWidth: 1,
    borderColor: "#d4eee5",
    justifyContent: "center",
    marginBottom: 16,
  },
  mapTitle: {
    color: "#07123d",
    fontSize: 28,
    fontWeight: "900",
  },
  mapText: {
    color: "#4f5d72",
    marginTop: 8,
    marginBottom: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  inlineButton: {
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#248be8",
  },
  inlineButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2eaf4",
    padding: 14,
    marginBottom: 10,
  },
  nearbyIcon: {
    fontSize: 26,
  },
  distance: {
    color: "#248be8",
    fontWeight: "900",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2eaf4",
    borderRadius: 22,
    padding: 20,
  },
  emptyTitle: {
    color: "#07123d",
    fontSize: 20,
    fontWeight: "900",
  },
  emptyText: {
    color: "#667085",
    lineHeight: 22,
    marginVertical: 12,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshText: {
    color: "#248be8",
    fontWeight: "900",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe8f3",
  },
  backButtonText: {
    color: "#073d77",
    fontWeight: "900",
  },
  detailCard: {
    overflow: "hidden",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2eaf4",
    marginBottom: 16,
  },
  detailImage: {
    width: "100%",
    height: 230,
    backgroundColor: "#e7eef7",
  },
  detailContent: {
    padding: 16,
  },
  detailTitle: {
    flex: 1,
    color: "#07123d",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
  },
  detailSummary: {
    color: "#344054",
    marginTop: 10,
    lineHeight: 21,
    fontWeight: "700",
  },
  bookingPanel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2eaf4",
    borderRadius: 24,
    padding: 16,
  },
  bookingLabel: {
    marginTop: 12,
    color: "#07123d",
    fontSize: 13,
    fontWeight: "900",
  },
  slotPicker: {
    gap: 8,
    paddingTop: 10,
    paddingBottom: 2,
  },
  slotButton: {
    minWidth: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dce7f3",
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
  },
  slotButtonActive: {
    borderColor: "#07123d",
    backgroundColor: "#07123d",
  },
  slotButtonDisabled: {
    opacity: 0.4,
  },
  slotButtonText: {
    color: "#07123d",
    fontWeight: "900",
  },
  slotButtonTextActive: {
    color: "#fff",
  },
  emptySlotText: {
    color: "#667085",
    fontWeight: "800",
    marginTop: 10,
  },
  noteInput: {
    minHeight: 82,
    textAlignVertical: "top",
  },
  paymentPreview: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#f7fbff",
    borderWidth: 1,
    borderColor: "#dceaf8",
  },
  paymentTitle: {
    color: "#07123d",
    fontWeight: "900",
  },
  paymentText: {
    color: "#667085",
    marginTop: 6,
    lineHeight: 19,
    fontWeight: "700",
  },
  authCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2eaf4",
    borderRadius: 22,
    padding: 18,
  },
  authTitle: {
    color: "#07123d",
    fontSize: 24,
    fontWeight: "900",
  },
  authLead: {
    color: "#667085",
    marginTop: 8,
    lineHeight: 20,
    fontWeight: "700",
  },
  authRoleGrid: {
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  mobileRoleCard: {
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2eaf4",
    backgroundColor: "#fff",
  },
  mobileRoleCardActive: {
    borderColor: "#63c8ff",
  },
  mobileRoleBg: {
    minHeight: 214,
  },
  mobileRoleBgImage: {
    borderRadius: 21,
  },
  mobileRoleOverlay: {
    minHeight: 214,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.64)",
  },
  mobileRoleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  mobileRoleIconText: {
    fontSize: 21,
  },
  mobileRoleTitle: {
    marginTop: 14,
    color: "#07123d",
    fontSize: 20,
    fontWeight: "900",
  },
  mobileRoleDescription: {
    marginTop: 5,
    color: "#344054",
    lineHeight: 20,
    fontWeight: "700",
    maxWidth: 260,
  },
  mobileRoleAction: {
    alignSelf: "flex-start",
    overflow: "hidden",
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#248be8",
    color: "#fff",
    fontWeight: "900",
  },
  roleSwitch: {
    flexDirection: "row",
    backgroundColor: "#f3f7fc",
    padding: 5,
    borderRadius: 18,
    marginTop: 16,
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#fff",
  },
  roleText: {
    color: "#667085",
    fontWeight: "900",
  },
  roleTextActive: {
    color: "#07123d",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dce7f3",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#07123d",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: "#248be8",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  authToggle: {
    color: "#248be8",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "900",
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  accountAvatar: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: "#dff7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarText: {
    color: "#07123d",
    fontSize: 20,
    fontWeight: "900",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  statusPill: {
    backgroundColor: "#f2f4f7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPillActive: {
    backgroundColor: "#e6f9ef",
  },
  statusText: {
    color: "#667085",
    fontWeight: "900",
    fontSize: 12,
  },
  statusTextActive: {
    color: "#16a36b",
  },
  onboardingCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bfe6ff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    boxShadow: "0px 10px 18px rgba(36, 139, 232, 0.08)",
  },
  onboardingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  onboardingBadge: {
    backgroundColor: "#e8f6ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  onboardingBadgeText: {
    color: "#073d77",
    fontSize: 12,
    fontWeight: "900",
  },
  skipText: {
    color: "#667085",
    fontWeight: "900",
  },
  onboardingTitle: {
    color: "#07123d",
    fontSize: 22,
    fontWeight: "900",
  },
  onboardingText: {
    color: "#667085",
    lineHeight: 21,
    marginTop: 8,
    fontWeight: "700",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  onboardingImage: {
    width: "100%",
    height: 170,
    borderRadius: 18,
    marginTop: 14,
    backgroundColor: "#eef2f6",
  },
  secondaryButton: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bfe6ff",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#073d77",
    fontWeight: "900",
  },
  secondaryCompactButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bfe6ff",
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#f7fbff",
  },
  secondaryCompactButtonText: {
    color: "#073d77",
    fontSize: 13,
    fontWeight: "900",
  },
  dangerButton: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff1f0",
  },
  dangerButtonText: {
    color: "#d04437",
    fontWeight: "900",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2eaf4",
    padding: 14,
  },
  metricLabel: {
    color: "#667085",
    fontWeight: "900",
  },
  metricValue: {
    color: "#07123d",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
  },
  metricDelta: {
    color: "#2faa72",
    fontWeight: "900",
    marginTop: 4,
  },
  quickGrid: {
    gap: 10,
  },
  quickButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2eaf4",
    borderRadius: 18,
    padding: 16,
  },
  quickButtonText: {
    color: "#07123d",
    fontSize: 17,
    fontWeight: "900",
  },
  dayCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2eaf4",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayTitle: {
    color: "#07123d",
    fontSize: 18,
    fontWeight: "900",
  },
  dayDate: {
    color: "#667085",
    fontWeight: "800",
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eef2f6",
    paddingVertical: 10,
    gap: 10,
  },
  slotTime: {
    color: "#248be8",
    fontWeight: "900",
    width: 52,
  },
  slotTitle: {
    flex: 1,
    color: "#07123d",
    fontWeight: "800",
  },
  reservationCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2eaf4",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  reservationCardMuted: {
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#e2eaf4",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    opacity: 0.82,
  },
});
