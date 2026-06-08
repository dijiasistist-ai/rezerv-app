# tyee Mobile

tyee mobil uygulaması Expo / React Native ile kuruldu. İlk sürüm bireysel kullanıcı
deneyimini merkeze alır; işletme tarafında sadece hafif operasyon ekranları vardır.
Detaylı işletme yönetimi web panelde kalır.

## Akışlar

- Bireysel: keşfet, kategoriler, öne çıkan işletmeler, yakınımda, rezervasyon hazırlığı, giriş/kayıt.
- İşletme: bugün özeti, basit takvim görünümü, rezervasyon listesi, web panele geçiş.
- İşletme onboarding: eksik şirket adı, iletişim, adres/konum, kategori, görsel, alan/hoca ve fiyat
  bilgilerini sırayla ister. `Daha sonra` sadece o oturumda kapatır; eksikler tamamlanana kadar
  sonraki girişlerde tekrar gösterilir.
- Oturum: token `expo-secure-store` ile saklanır.
- Konum: `expo-location` ile yakındaki işletmeler `/api/nearby` üzerinden çekilir.

## Çalıştırma

```bash
cd mobile
npm install
npm run ios
```

Android için:

```bash
npm run android
```

Canlı API varsayılan olarak `https://tyee.app` kullanır. Local API ile denemek için:

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:8091 npm run ios
```

Android emulator içinde local API kullanılacaksa `127.0.0.1` yerine Android host adresi
gerekebilir.
