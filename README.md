# tyee

tyee marketplace ve isletme paneli prototipi.

## Local gelistirme

```bash
npm install
npm start
```

Local adres:

```text
http://127.0.0.1:8091/
```

Isletme paneli:

```text
http://127.0.0.1:8091/venue.html
```

Admin paneli:

```text
http://127.0.0.1:8091/admin.html
```

Demo hesaplar:

- `demo@tyee.app` / `123456`
- `firma@tyee.app` / `123456`
- `admin` veya `admin@tyee.app` / `123456`

## Render deploy

Render Web Service ayarlari:

- Build command: `npm install`
- Start command: `npm start`
- Runtime: Node

Repo kokundeki `render.yaml` blueprint olarak ayni ayarlari icerir.

## Admin erisimi

Admin paneli local gelistirmede aciktir. Canli ortamda admin kullanicisi ile giris yapmak
yetmez; IP adresi veya mobil uygulama anahtari da yetkili erisim listesinde olmalidir.

Ilk canli erisim icin Render Environment Variables:

- `ADMIN_ALLOWED_IPS`: Virgulle ayrilmis IP listesi.
- `ADMIN_ALLOWED_EMAILS`: IP veya mobil anahtari belirli admin e-postasina baglamak icin.
- `ADMIN_MOBILE_ACCESS_TOKEN` veya `ADMIN_MOBILE_ACCESS_TOKENS`: Mobil app icin gizli erisim anahtari.

Panelde `Yetkililer` bolumunden yeni ad, e-posta, IP ve mobil anahtar kayitlari eklenebilir.

## SMS ve WhatsApp

SMS ve WhatsApp gonderimi Twilio ile baglanir. Localde bu degerler yoksa mesajlar
`data/runtime/dev-sms.json` icine dev-log olarak kaydedilir; bu sayede gelistirme
ortami Twilio olmadan da calisir.

Render Environment Variables:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_SMS_FROM` veya `TWILIO_MESSAGING_SERVICE_SID`
- `TWILIO_WHATSAPP_FROM` (`whatsapp:+...` ya da `+...` formatinda olabilir)

Turkiye numaralari `05xx...` girilirse sistem otomatik `+90...` formatina cevirir.

## Rezervasyon odeme modeli

Rezervasyon komisyon orani `%7` olarak `services/reservation-billing.js` icinde merkezi
hesaplanir. Ornek `4.000 TL` rezervasyonda komisyon `280 TL` olur.

- Kapora komisyon: Musteriden sadece `%7` komisyon kapora olarak alinir, kalan tutar isletmede tahsil edilir.
- Tam online odeme: Musteriden tutarin tamami alinir, `%7` tyee komisyonu kalir, kalan hakedis kart odemesi cekilebilir olduktan sonra isletmeye aktarilir.
- Sadece rezervasyon: Online tahsilat yapilmaz, odeme isletmede alinir. Rezervasyonlar ay sonunda listelenir ve komisyon tutari FAST ile istenir.

Sadece rezervasyon modelinde ay sonu bildirimi sonrasi isletmeye `15` gun sure taninir.
FAST odemesi gelmezse isletme pasife cekilecek sekilde isaretlenir.
