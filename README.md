# 🅿️ SmartPark DeepTech — Akıllı Otopark & Otonom Ulaşım İşletim Sistemi
> **ISO 23374 Automated Valet Parking (AVP) Uyumlu, Çok Kapılı, Kantar/LiDAR Sensör Füzyonlu ve Kriptografik Otopark Yönetim Platformu**

---

## 📌 Proje Özeti
SmartPark DeepTech; klasik otoparkların yaşadığı **kat içi trafik kilitlenmeleri (gridlock)**, **yüksek/ağır araçların tavan ve rampa hasarları**, **kapalı alanda sinyal/GPS kaybı** ve **hatalı park suistimalleri** sorunlarını matematiksel optimizasyon ve sensör füzyonuyla çözen yeni nesil bir ulaşım altyapı yazılımıdır.

---

## 🚀 Hızlı Başlangıç (Kurulum Gerekmez)
Proje sıfır bağımlılıkla doğrudan modern web tarayıcılarında çalışır:
1. `start.bat` dosyasına çift tıklayın veya
2. Doğrudan tarayıcınızda [`entrance.html`](file:///c:/Users/LENOVO/Documents/oto/entrance.html) dosyasını açın.

---

## 📂 Dosya Yapısı ve Ekranlar

| Dosya | Açıklama |
| :--- | :--- |
| [`smartpark.js`](file:///c:/Users/LENOVO/Documents/oto/smartpark.js) | **Çekirdek Motor:** ISO 23374 protokolü, Dengeli kat dağıtım algoritması, Kantar/LiDAR profiler, 3-Strike kara liste ve Ed25519 kriptografi motoru. |
| [`entrance.html`](file:///c:/Users/LENOVO/Documents/oto/entrance.html) | **Giriş Kiosk & Sensör Ekranı:** 4 Kapılı (Kuzey, Güney, Doğu, Batı) arbitraj, Kantar/Lazer simülatörü, ISO 23374 gRPC telemetri akışı ve 4 saniyelik bariyer karşılama animasyonu. |
| [`floor.html`](file:///c:/Users/LENOVO/Documents/oto/floor.html) | **Kat Haritası & Offline Kiosk:** 30 slotlu görsel kat haritası, 2. adım sensör park teyidi ve internet/GPS çekmeyen yerler için *"Ben Kayboldum / Aracımı Bul"* AI yönlendirme terminali. |
| [`portal.html`](file:///c:/Users/LENOVO/Documents/oto/portal.html) | **Kullanıcı & Kripto Portalı:** Araç boyut/model kaydı, rezervasyon motoru, aktif park takibi ve Ed25519 imzalı tek kullanımlık dinamik QR bilet üretici. |
| [`docs/MIT_DEEPTECH_DOSSIER.md`](file:///c:/Users/LENOVO/Documents/oto/docs/MIT_DEEPTECH_DOSSIER.md) | **Teknik Dokümantasyon & Savunma Dosyası:** Matematiksel formüller, sensör fiziği, MIT jüri soru-cevapları ve sunum rehberi. |

---

## 🛠️ Temel Teknolojik Bileşenler
- **Varyans Minimizasyonlu Kat Dağıtımı:** $\min \sigma^2 = \frac{1}{K}\sum (O_f - \bar{O})^2$ formülü ile kat doluluklarını homojen dengeler.
- **Aks Kantarı & LiDAR Yükseklik Filtresi:** 2.5 ton üzeri ve 2.10m'den yüksek araçları zorunlu olarak güçlendirilmiş Kat 1'e yönlendirir.
- **3-Strike Güvenlik Modeli:** Yanlış yere park eden araçlara ihlal yazar; 3. ihlalde aracı otomatik kara listeye alır.
- **Ed25519 Asimetrik Token:** Kopyalanamayan, sahtesi üretilemeyen zaman damgalı QR pass.
- **Offline Wayfinding Kiosk:** Kapalı otoparkta GPS olmaksızın en kısa adım adım yürüyüş rotası çizer.
