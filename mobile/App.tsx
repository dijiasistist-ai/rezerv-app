import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
  cityLabel: string;
  rating?: number;
  distance?: string;
  price?: number;
  priceUnit?: string;
  summary?: string;
  tags?: string[];
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

function initials(name = "T") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
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
      gallery: Array.isArray(settings?.media?.gallery) ? settings.media.gallery : [],
    },
    areas:
      Array.isArray(settings?.areas) && settings.areas.length
        ? settings.areas
        : [{ name: "", type: "", capacity: "", price: "", isActive: true }],
  };
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
  const [venuePayload, setVenuePayload] = useState<VenuePayload | null>(null);
  const [venueOnboardingDismissed, setVenueOnboardingDismissed] = useState(false);

  const isVenueUser = Boolean(session?.user.canManageVenue);
  const missingVenueSteps = useMemo(() => getMissingVenueSteps(venuePayload?.settings), [venuePayload?.settings]);
  const customerTabs = useMemo(
    () => [
      { id: "discover" as const, label: "Keşfet" },
      { id: "nearby" as const, label: "Yakınımda" },
      { id: "bookings" as const, label: "Rezervasyon" },
      { id: "account" as const, label: "Hesabım" },
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

  const loadPublicData = useCallback(async () => {
    const [bootstrap, listingPayload] = await Promise.all([
      apiRequest<{ categories: Category[] }>("/api/bootstrap"),
      apiRequest<{ items: Listing[] }>("/api/listings"),
    ]);
    setCategories(bootstrap.categories || []);
    setListings(listingPayload.items || []);
  }, []);

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
  }, [loadPublicData, loadVenue, saveSession]);

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
      <View style={styles.header}>
        <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
        {session ? (
          <View style={styles.userPill}>
            <Text style={styles.userInitials}>{initials(session.user.name)}</Text>
          </View>
        ) : null}
      </View>

      {isVenueUser ? (
        <>
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
        <>
          <SegmentedTabs items={customerTabs} active={mainTab} onChange={setMainTab} />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {mainTab === "discover" ? (
              <DiscoverScreen
                categories={categories}
                listings={listings}
                signedIn={Boolean(session)}
                onLoginPress={() => setMainTab("account")}
              />
            ) : null}
            {mainTab === "nearby" ? <NearbyScreen items={nearby} onRefresh={loadNearby} /> : null}
            {mainTab === "bookings" ? <BookingsScreen signedIn={Boolean(session)} onLoginPress={() => setMainTab("account")} /> : null}
            {mainTab === "account" ? (
              session ? (
                <AccountCard session={session} onLogout={logout} />
              ) : (
                <AuthCard
                  mode={authMode}
                  role={role}
                  form={form}
                  loading={loading}
                  onModeChange={setAuthMode}
                  onRoleChange={setRole}
                  onFormChange={setForm}
                  onSubmit={submitAuth}
                />
              )
            ) : null}
          </ScrollView>
        </>
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

function DiscoverScreen({
  categories,
  listings,
  signedIn,
  onLoginPress,
}: {
  categories: Category[];
  listings: Listing[];
  signedIn: boolean;
  onLoginPress: () => void;
}) {
  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Mobil rezervasyon</Text>
        <Text style={styles.heroTitle}>Yakınındaki hizmetleri keşfet, karşılaştır ve zamanı gelince kolayca rezervasyon yap.</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchText}>Pet kuaförü, halı saha, güzellik merkezi...</Text>
          <Pressable style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Ara</Text>
          </Pressable>
        </View>
      </View>

      <SectionHeader title="Kategoriler" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryTitle}>{category.label}</Text>
            <Text style={styles.categoryCount}>{category.count}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionHeader title="Öne çıkan işletmeler" />
      {listings.slice(0, 6).map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}

      {!signedIn ? (
        <Pressable style={styles.softCta} onPress={onLoginPress}>
          <Text style={styles.softCtaTitle}>Hesabını aç</Text>
          <Text style={styles.softCtaText}>Favorilerini, bildirimlerini ve rezervasyonlarını tek yerden takip et.</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <View style={styles.listingCard}>
      <View style={styles.listingAvatar}>
        <Text style={styles.listingAvatarText}>{initials(listing.name)}</Text>
      </View>
      <View style={styles.listingBody}>
        <Text style={styles.listingName}>{listing.name}</Text>
        <Text style={styles.listingMeta}>
          {listing.cityLabel} {listing.distance ? `· ${listing.distance}` : ""}
        </Text>
        <Text style={styles.listingSummary}>{listing.summary}</Text>
        <View style={styles.listingFooter}>
          <Text style={styles.priceText}>
            {money(listing.price)} {listing.priceUnit || ""}
          </Text>
          <Text style={styles.nextSlot}>{listing.availability?.nextSlot || "Yakında"}</Text>
        </View>
      </View>
    </View>
  );
}

function NearbyScreen({ items, onRefresh }: { items: NearbyItem[]; onRefresh: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <View style={styles.mapPreview}>
        <Text style={styles.mapTitle}>Yakınımda</Text>
        <Text style={styles.mapText}>Konum izniyle sana en yakın işletmeleri listeliyoruz.</Text>
        <Pressable style={styles.inlineButton} onPress={refresh}>
          <Text style={styles.inlineButtonText}>{loading ? "Yenileniyor..." : "Konumumu kullan"}</Text>
        </Pressable>
      </View>
      {items.slice(0, 12).map((item) => (
        <View key={item.id} style={styles.nearbyCard}>
          <Text style={styles.nearbyIcon}>{item.icon}</Text>
          <View style={styles.listingBody}>
            <Text style={styles.listingName}>{item.name}</Text>
            <Text style={styles.listingMeta}>
              {item.categoryLabel} · {item.cityLabel}
            </Text>
          </View>
          <Text style={styles.distance}>{item.distanceLabel}</Text>
        </View>
      ))}
    </>
  );
}

function BookingsScreen({ signedIn, onLoginPress }: { signedIn: boolean; onLoginPress: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>Rezervasyonların burada toplanacak.</Text>
      <Text style={styles.emptyText}>
        İlk aşamada ödeme ve kesin rezervasyon akışına geçmeden önce favori işletme, seçili hizmet ve saat bilgilerini burada
        hazırlayacağız.
      </Text>
      {!signedIn ? (
        <Pressable style={styles.inlineButton} onPress={onLoginPress}>
          <Text style={styles.inlineButtonText}>Giriş yap / kayıt ol</Text>
        </Pressable>
      ) : null}
    </View>
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
      <View style={styles.roleSwitch}>
        <Pressable
          style={[styles.roleButton, role === "customer" && styles.roleButtonActive]}
          onPress={() => onRoleChange("customer")}
        >
          <Text style={[styles.roleText, role === "customer" && styles.roleTextActive]}>Bireysel</Text>
        </Pressable>
        <Pressable style={[styles.roleButton, role === "venue" && styles.roleButtonActive]} onPress={() => onRoleChange("venue")}>
          <Text style={[styles.roleText, role === "venue" && styles.roleTextActive]}>İşletme</Text>
        </Pressable>
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
                <StatusPill label={slot.status} active={slot.status !== "kapalı"} />
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
  content: {
    padding: 16,
    paddingBottom: 34,
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
  },
  listingName: {
    color: "#07123d",
    fontSize: 17,
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
    shadowColor: "#248be8",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
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
});
