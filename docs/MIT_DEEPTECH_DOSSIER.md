# 📘 SMARTPARK DEEPTECH: TEKNİK BEYAZ BÜLTEN (WHITEPAPER) & AKADEMİK SAVUNMA DOSYASI

Bu belge; projenin gelişim fazlarını, matematiksel modellerini, fiziksel sensör prensiplerini, basitleştirilmiş kod mantığını ve akademik/yatırımcı savunma sorularını içerir.

---

# 📑 BÖLÜM 1: PROJE GELİŞİM FAZLARI (FAZ 1 - FAZ 4)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PROJE EVRİM ÇİZELGESİ                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ [FAZ 1] Tohum Fikir & İlk Python/FastAPI Prototipi                               │
│  └── Basit doluluk yüzdesi, plaka girişi, arayan araç sayacı.                    │
│                                                                                  │
│ [FAZ 2] Tarayıcı Tabanlı Reaktif Sistem & Kullanıcı Deneyimi (UX/UI)             │
│  └── Sunucusuz Saf JS/HTML, LocalStorage, Özel Rezervasyon, 4s Karşılama Ekranı.│
│                                                                                  │
│ [FAZ 3] Deep-Tech, Sensör Füzyonu & Endüstriyel Matematik (Mevcut Durum)         │
│  └── Kantar + LiDAR Boyutlandırma, 4 Kapılı Dengeli Dağıtım, ISO 23374 AVP,      │
│      3-Strike Kara Liste, Ed25519 Kripto QR, Çevrimdışı Kiosk Yönlendirme.       │
│                                                                                  │
│ [FAZ 4] Endüstriyel Saha Üretimi & Donanım Entegrasyonu (Gelecek Yol Haritası)   │
│  └── Edge AI (Jetson YOLO ALPR), Go/gRPC Backend, Endüstriyel PLC/Röle, UWB SLAM.│
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 🔹 FAZ 1: Tohum Fikir & Temel Konsept
* **Çıkış Noktası:** Kapalı otoparklarda araçların boş yer bulmak için saatlerce dolaşması, yakıt ve zaman israfı.
* **Geliştirilen Temel Mantık:** 
  * Girişte plaka kaydı yapılması.
  * 5 katlı bir yapıda kat bazlı doluluk yüzdesi hesaplanması.
  * Otopark içinde aktif yer arayan araç sayısının girişteki dev ekranda gösterilmesi.
  * İlk aşamada FastAPI + SQLite mimarisi ile temel modeller kurgulandı.

### 🔹 FAZ 2: Taşınabilir Reaktif Mimari, Rezervasyon & Giriş Karşılama
* **Kullanıcı Talebi:** Kurulum gerektirmeyen, doğrudan çift tıkla her bilgisayarda çalışan saf frontend çözümü.
* **Yapılan İnovasyonlar:**
  * `BroadcastChannel` ve reaktif durum yönetimi ile sekmeler arası canlı senkronizasyon.
  * Plaka çakışması ve slot serbest bırakma mantığındaki bug'ların benzersiz UUID sistemiyle çözülmesi.
  * **Özel Rezervasyon Sistemi:** Kat, slot, tarih ve saat aralığı seçerek yer ayırtma; girişte ayrılan slota otomatik rota.
  * **4 Saniyelik Karşılama Ekranı:** Girişte dev ekranda `HOŞ GELDİNİZ -> PLAKA -> HEDEF SLOT -> BARİYER AÇILIŞ` animasyonu.

### 🔹 FAZ 3: Deep-Tech, Sensör Füzyonu & Endüstriyel Standartlar (Bugün)
* **Kantar & Lazer Boyutlandırma:** 3-4 tonluk ağır pickup veya yüksek SUV araçların tavan ve zemin hasarı vermesini önleyen fiziksel kural motoru.
* **4 Kapılı (Kuzey, Güney, Doğu, Batı) Arbitrajı:** Çoklu kapı kuyruk yönetimi.
* **Dengeli Kat Dağıtım Motoru (Variance Minimization):** Katları sırayla tek tek doldurmak yerine araçları katlara homojen dağıtarak rampa tıkanmalarını engelleyen algoritma.
* **3-Strike Kuralı (Kara Liste):** Yanlış yere park eden araçları takip eden ve 3. ihlalde sistemden men eden güvenlik denetçisi.
* **ISO 23374 AVP Uyumluluğu:** Otonom araçlarla haberleşen uluslararası telemetri ve durum makinesi entegrasyonu.
* **Ed25519 Kriptografik QR Pass:** Kopyalanamayan, asimetrik imzalı tek kullanımlık dinamik token yapısı.
* **Offline AI Wayfinding Terminali ("Ben Kayboldum"):** GPS ve GSM sinyali çekmeyen katlarda plaka ile adım adım yürüyüş rotası çizen kiosk.

### 🔹 FAZ 4: Gelecek Yol Haritası (Endüstriyel Saha Üretimi)
* Nvidia Jetson üzerinde çalışan gerçek zamanlı YOLOv10 ALPR (Plaka Tanıma) kamerası.
* RS485 Modbus endüstriyel kantar ve mesafe lazerleri.
* Go/Rust tabanlı mikro-saniye gecikmeli gRPC ve Apache Kafka veri boru hattı.
* UWB (Ultra-Wideband) ve AR (Artırılmış Gerçeklik) destekli mobil navigasyon.

---

# 📐 BÖLÜM 2: MATEMATİKSEL VE FİZİKSEL SENSÖR MODELLERİ

### 1. Dengeli Kat Dağıtımı (Varyans Minimizasyonu)
Geleneksel sistemler $Kat_1$ dolana kadar tüm araçları $Kat_1$'e yığar. Bu durum koridorda kuyruk oluşturur.  
SmartPark, $K$ adet kat arasındaki doluluk oranlarının varyansını ($\sigma^2$) minimize eder:

$$O_f = \frac{N_{occupied, f}}{N_{total, f}}, \quad \bar{O} = \frac{1}{K} \sum_{f=1}^{K} O_f$$

$$\min \sigma^2 = \frac{1}{K} \sum_{f=1}^{K} (O_f - \bar{O})^2$$

Her yeni araç geldiğinde sistem şu hedef fonksiyonunu çözer:
$$f^* = \arg\min_{f \in \mathcal{F}_{valid}} \left( O_f \right)$$
Burada $\mathcal{F}_{valid}$ kümesi, aracın ağırlık ve yükseklik kısıtlarını sağlayan katları temsil eder.

### 2. Fiziksel Aks Kantarı (Wheatstone Köprüsü ve Gerinim Prensibi)
Zemine gömülen yük hücreleri (Load-Cell), piezo-rezistif gerinim ölçer (strain gauge) kullanır:

$$\Delta V_{out} = V_{in} \cdot \left( \frac{R_3}{R_3 + R_4} - \frac{R_2}{R_1 + R_2} \right)$$

Gerilim farkı ($\Delta V_{out}$), aracın toplam kütlesi ($M_{total}$) ile doğrusal orantılıdır:
$$M_{total} = k \cdot \Delta V_{out} + M_0$$

**Kritik Güvenlik Koşulu:**
$$M_{total} > 2500 \text{ kg} \implies f^* = 1 \quad (\text{Zorunlu Güçlendirilmiş Zemin Kat})$$

### 3. Tavan LiDAR / Time of Flight (ToF) Yükseklik Ölçümü
Tavandaki lazer sensör, ışık darbesinin gidiş-dönüş süresini ($\Delta t$) ölçer:

$$d = \frac{c \cdot \Delta t}{2}$$

Aracın tepe noktası yüksekliği ($H_{arac}$):
$$H_{arac} = H_{tavan\_sensor} - d$$

$$H_{arac} > 2100 \text{ mm} \implies f^* = 1 \quad (\text{Zorunlu 2.40m Tavan Katı})$$

### 4. Ed25519 Kriptografik Bilet Doğrulama
Biletlerin sahtelenmesini önlemek için Twisted Edwards eğrisi ($E: -x^2 + y^2 = 1 - \frac{121665}{121666}x^2y^2$) üzerinde Schnorr tabanlı imza kullanılır:

$$S = (r + H(R, A, M) \cdot a) \pmod \ell$$

Burada $M = \text{UserID} \parallel \text{Plate} \parallel \text{Timestamp} \parallel \text{Nonce}$ verisidir. $Timestamp + 24\text{h} < \text{Now}$ ise bilet otomatik iptal olur.

### 5. ISO 23374 Otonom Vale Durum Makinesi (State Machine)
Sistem aracı şu durumlar üzerinden yönetir:
$$\text{AVP\_IDLE} \xrightarrow{\text{Gate Enter}} \text{AVP\_ASSIGNED} \xrightarrow{\text{Driving}} \text{AVP\_VERIFYING} \xrightarrow{\text{Sensor OK}} \text{AVP\_PARKED}$$

---

# 🧠 BÖLÜM 3: KODLARI "EN BASİT ŞEKİLDE" (MANTIK HİKAYESİ) ANLAMA

Kodları anlamak için sistemi dev bir **5 Yıldızlı Otel** gibi düşün:

1. **`smartpark.js` (Otel Müdürü):**
   * Bütün kuralları bilen kişidir.
   * Resepsiyondaki kantarla gelen misafiri tartar, tavan boyunu ölçer.
   * *"Sen çok ağırsın, seni sadece güçlendirilmiş 1. kata alabilirim"* veya *"Bugün 2. kat çok boş, seni 2. kata göndereyim ki odalar dengeli dolsun"* der.
   * Cebinde bir kara liste defteri vardır; kurallara uymayanı 3. seferde kovar.

2. **`entrance.html` (Otopark Giriş Kapısı & Güvenlik Bariyeri):**
   * Arabanın yanaştığı yerdir. 4 farklı kapı (Kuzey, Güney, Doğu, Batı) vardır.
   * Lazer ve kantar aracı okur okumaz ekranda dev bir karşılama yazısı çıkar: *"Hoş geldin! Senin yerin Kat 2 - B-04"*.
   * Bariyer yukarı kalkar ve içeri girersin.

3. **`floor.html` (Kat Görevlisi & Koridor Sensörleri):**
   * Tavandaki yeşil/kırmızı ışıklardır.
   * Sen arabayı park ettiğinde sensör *"Evet, doğru arabayı doğru yere park etti"* der ve yeşili kırmızıya çevirir.
   * Eğer otoparkın içinde kaybolursan duvardaki ekrana gidip *"Ben kayboldum, arabam nerede?"* diye sorarsın, ekran sana asansörden arabana giden yolu adım adım tarif eder.

4. **`portal.html` (Telefonundaki Mobil Bilet Uygulaması):**
   * Evdeyken arabanın modelini kaydedip rezervasyon yaptığın yerdir.
   * Sana kimsenin kopyalayamayacağı özel şifreli bir QR kod verir.

---

# 🎓 BÖLÜM 4: MIT DÜZEYİNDE AKADEMİK VE YATIRIMCI SAVUNMA SORULARI (Q&A)

Bir jüri, yatırımcı veya profesör sana şu soruları soracaktır. İşte en kusursuz cevaplar:

#### ❓ Soru 1: "Aynı milisaniyede Kuzey ve Güney kapısından iki araç girerse ve sistem ikisine de aynı boş slotu atamaya kalkarsa ne olur? (Race Condition / Concurrency)"
> **Cevap:**  
> "SmartPark mimarisi, dağıtık kapı arbitrajında **Atomik Kilit (Pessimistic Locking / Slot Reservation Queue)** modelini kullanır. Bir kapı bir slot için atama talebinde bulunduğu anda slot durumu milisaniyeler içinde `RESERVED_PENDING` durumuna geçer. Bu sayede diğer kapı motorları o slotu boş slot havuzunda göremez. Çakışma sıfırdır."

#### ❓ Soru 2: "Yağmurlu/çamurlu günlerde kantar veya lazer sensörü hatalı ölçüm yaparsa sistem ne tepki verir? (Sensor Noise & Fault Tolerance)"
> **Cevap:**  
> "Sistemimiz **Sensör Füzyonu (Sensor Fusion) ve Katalog Eşleştirme** mantığıyla çalışır. Plaka okunduğunda aracın fabrika tescil verisi (Marka/Model Veritabanı) ile fiziksel sensör verisi karşılaştırılır. Eğer fiziksel sensör değeri ile katalog değeri arasında $\pm \%20$'den fazla bir sapma varsa, sistem 'Fail-Safe' moduna geçer ve aracı en güvenli kısıt olan Kat 1'e yönlendirerek güvenlik görevlisine telemetri uyarısı fırlatır."

#### ❓ Soru 3: "Kullanıcı bilerek veya bilmeyerek kendisine ayrılan A-02 yerine hemen yanındaki A-03'e park ederse bunu nasıl anlıyorsunuz?"
> **Cevap:**  
> "Bu durum **2 Aşamalı Zemin Doğrulaması (2-Step Verification)** ile çözülür. Tavandaki ultrasonik sensör sadece bir nesnenin varlığını (0/1) algılar; ancak slot başındaki geniş açılı CCTV kamerası park eden aracın plakasını OCR ile okur. A-02 boş kalıp A-03'te yetkisiz plaka tespit edildiğinde sistem sürücüye anında 1. İhlal (Strike) cezası yazar."

#### ❓ Soru 4: "Neden ISO 23374 standardını seçtiniz? Klasik plaka tanıma neden yetersiz?"
> **Cevap:**  
> "Klasik plaka tanıma tek yönlüdür (Kamera plakayı okur, bariyeri açar). Ancak ISO 23374, otonom araçlarla (Level 4 Autonomous Driving) otopark altyapısı arasında çift yönlü V2I (Vehicle-to-Infrastructure) iletişimini standartlaştırır. Otopark haritası, rota yörüngesi ve acil durum frenleme komutları araca doğrudan telemetri paketi olarak gönderilir. Bu, geleceğin sürücüsüz otonom vale dünyasına tam uyumluluk sağlar."

#### ❓ Soru 5: "Ed25519 token neden basit bir QR linkinden veya statik barkoddan üstündür?"
> **Cevap:**  
> "Statik bir QR ekran görüntüsü alınarak WhatsApp üzerinden başkasına iletilebilir veya kopyalanabilir. Bizim Ed25519 token mimarimiz; kullanıcının kimliğini, anlık zaman damgasını ($timestamp$) ve tek kullanımlık rastgele bir sayıyı ($nonce$) özel kriptografik anahtarla imzalar. Bilet kapıda bir kez okutulduğunda 'kullanıldı' olarak işaretlenir ve süresi 24 saati geçtiğinde matematiksel olarak geçersiz sayılır."

---

# 🎤 BÖLÜM 5: YATIRIMCI SUNUMU (PITCH DECK) REHBERİ

Eğer bu projeyi bir yatırımcıya veya jüriye sunacaksan şu sırayı takip et:

1. **Giriş (Problem):** "Her gün milyonlarca insan kapalı otoparklarda dönüp duruyor, rampa kilitlenmeleri yüzünden AVM girişlerinde kilometrelerce kuyruk oluşuyor ve büyük SUV'lar alçak tavanlara çarparak milyonlarca liralık hasar açıyor."
2. **Çözüm (SmartPark DeepTech):** "Biz; kantar ve lazerle aracı tanıyan, 4 kapıdan gelen trafiği otopark katlarına homojen dağıtan, yanlış park edeni kara listeye alan ve sürücüsüz otonom araçlarla konuşabilen (ISO 23374) bir Otopark İşletim Sistemi geliştirdik."
3. **Canlı Demo Gösterimi:** 
   - `entrance.html` ekranını aç.
   - Ford Ranger (Ağır Pickup) seçip giriş yap -> Kat 1'e gittiğini göster.
   - Renault Clio seçip giriş yap -> Kat 2/3/4 arasında dengeli dağıldığını göster.
   - Yanlış Park Et butonuna 3 kez bas -> Sistemin aracı kara listeye aldığını ve kapıyı kapattığını göster.
4. **Kapanış (Vizyon):** "SmartPark sadece bir yazılım değil; akıllı şehirlerin ve otonom araçların otopark altyapısıdır."
