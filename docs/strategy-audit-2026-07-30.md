# Futures strateji denetimi — 30 Temmuz 2026

## Yöntem

- Binance USD-M Futures kapanmış mumları kullanıldı.
- Sinyalden sonraki 5 dakikalık mumun açılışında işleme girildi.
- 2x kaldıraç ve işlem başına bakiyenin %20'si teminat kabul edildi.
- Her iki tarafta %0,05 taker komisyonu düşüldü.
- Aynı mumda stop ve hedef görülürse ihtiyatlı biçimde stop önce sayıldı.
- 1 saatlik mumlar yalnız kapandıktan sonra görünür olacak şekilde hizalandı.
- İlk ve ikinci zaman dilimleri ayrı raporlandı.

## Mevcut beş strateji — 60 gün, 12 likit coin

| Strateji | İşlem | Başarı | Net PnL | PF | Maks. DD |
|---|---:|---:|---:|---:|---:|
| Trend kırılımı | 241 | %34,02 | -979,43 USDT | 0,726 | %21,61 |
| Geri çekilme | 285 | %34,04 | -862,80 USDT | 0,780 | %18,58 |
| Likidite süpürmesi | 233 | %36,48 | -202,49 USDT | 0,933 | %7,46 |
| Seçici trend | 96 | %32,29 | -301,79 USDT | 0,778 | %9,95 |
| Bollinger dönüşü | 106 | %48,11 | +400,77 USDT | 1,294 | %3,11 |

Toplam 961 işlemin 346'sı başarılıdır (%36,00). Komisyon toplamı
2.227,49 USDT, net sonuç -1.945,74 USDT'dir. Ücret öncesi toplam fiyat
avantajı yalnız +281,75 USDT olduğundan mevcut sinyaller maliyet eşiğini
karşılamamaktadır.

## Hata teşhisi

1. Trend kırılımı yalnız üç mumluk seviyeyi, ortalamanın altındaki 0,75x
   hacimle kırılım kabul ediyor ve 1,6 ATR uzamaya izin veriyor. Bu, geç
   giriş ve sahte kırılım üretiyor.
2. Geri çekilme yalnız EMA teması ve kısa teyit kullanıyor. Üst zaman
   dilimi, BTC yönü ve vadeli piyasa akışı zorunlu değil.
3. Likidite süpürmesi ücret öncesi +347,1 USDT avantaj üretse de
   549,6 USDT komisyonla negatife dönüyor. Çekirdek fikir tamamen
   değersiz değil; seçicilik ve yürütme eksiği var.
4. Seçici trendin EMA200 filtresi gecikmeli. İlk yarıda PF 1,23 iken
   ikinci yarıda PF 0,42'ye düşmesi rejim kararsızlığını gösteriyor.
5. Bollinger ücret öncesi +663,4 USDT ile en iyi çekirdek sinyal.
   Ancak her dolumda 2 baz puan slippage stresinde PF 1,075'e düşüyor ve
   ikinci 30 gün negatif oluyor; 5 baz puanda toplam sonuç da negatif.
6. Stopların yalnız yaklaşık %1–2'si ilk bir saatte eski hedefe ulaşıyor.
   Stopu genel olarak genişletmek yanlış yönü düzeltmez, kaybı büyütür.

## Denenen ilave hipotezler

- Coin 6 saat + BTC 6 saat + coin 24 saat yön mutabakatı, küçük hedefle
  yüksek isabet görüntüsü verdi; kapanmamış 1 saatlik mum bilgi sızıntısı
  giderildiğinde %1 ROE sürümü %65,75 isabetle PF 0,90 ve -102,22 USDT
  üretti. Reddedildi.
- Binance 5 dakikalık taker hacmi ve açık pozisyon verisiyle beş önceden
  tanımlanmış akış kuralı 29 gün boyunca test edildi. En iyi adaylar PF
  1,07–1,09 aralığında kaldı ve iki zaman diliminde tutarlı olmadı.
  Canlıya uygun değiller.

## Önerilen yeni mimari

1. Yön üreten birincil motorlar: yalnız ekonomik gerekçesi olan Bollinger
   range dönüşü, likidite dönüşü ve ayrı bir trend/momentum motoru.
2. Ortak rejim sınıflandırıcı: trend, yatay, geçiş ve volatilite şoku.
   Yanlış rejimde ilgili motor tamamen kapalı kalır.
3. Meta-filtre: birincil sinyalin yönünü değiştirmez; o işlemin alınmaya
   değer olup olmadığını tahmin eder.
4. Özellikler: kapanmış fiyat/mum verisi, spread, derinlik, taker
   alış-satış oranları, açık pozisyon değişimi, funding, basis, top trader
   pozisyon oranı, BTC rejimi ve coin likiditesi.
5. Karar ölçütü: tahmini net beklenti komisyon, spread, slippage ve
   funding sonrasında pozitif ve güven tamponunun üzerindeyse işlem.
6. Purged walk-forward doğrulama: eğitim, doğrulama ve dokunulmamış test
   ayları; pozisyon süresi kadar embargo; 2/5/10 baz puan stresleri.

## Terfi kriterleri

- En az 300 dokunulmamış dönem işlemi ve en az 6 aylık farklı rejim.
- Ücret ve 5 baz puan slippage sonrasında PF en az 1,30.
- Pozitif işlem başı net beklenti ve maksimum düşüş en fazla %5.
- Tek coin veya tek ay toplam kârın %20'sinden fazlasını üretmemeli.
- 30 günlük ileri paper testte en az 100 işlem.
- İlk hedef toplam başarıyı %55–60 bandına ve pozitif beklentiye taşımak;
  %75, yalnız yeterli örneklemle doğrulanan uzun vadeli stretch hedeftir.

Günlük %5 bakiye büyümesi güvenli bir terfi kriteri değildir. 2x kaldıraç,
%20 teminat ve %3 ROE hedefinde başarılı bir işlem, ücret öncesi cüzdana
yaklaşık %0,60 kazandırır. %75 başarı varsayımında bile günde %5 için
yaklaşık 15 bağımsız kaliteli işlem gerekir. Mevcut medyan pozisyon
süreleri 115–170 dakika olduğundan bu sıklık aynı risk sınırlarıyla
uyumlu değildir.
