# UrGlowUp

UrGlowUp, güzellik ve kişisel bakım işletmeleri için web tabanlı bir keşif, profil, portföy ve randevu talep platformudur. İlk MVP; işletmelerin kendi public profil/randevu sayfalarını oluşturmasını, müşterilerin hesap oluşturarak işletme profillerini inceleyip randevu talebi göndermesini ve işletmelerin bu talepleri panelden yönetmesini sağlar.

Bu README, Claude Code veya benzeri AI destekli geliştirme araçlarına doğrudan verilebilecek kapsamda hazırlanmıştır.

---

## 1. Ürün Özeti

### 1.1. Ürün Tanımı

UrGlowUp MVP, güzellik ve kişisel bakım işletmelerinin dijital vitrin ve randevu altyapısı oluşturmasını sağlayan web platformudur.

İşletmeler platformda kendi hesaplarını oluşturur, profil bilgilerini girer, hizmetlerini ve fiyatlarını ekler, çalışma saatlerini belirler, fotoğraf/video portföyünü yükler ve kalıcı bir public randevu linki alır.

Müşteriler bu public link üzerinden işletmenin hizmetlerini, medyasını, konumunu, Google yorumlarını ve UrGlowUp yorumlarını inceler; hesap oluşturarak randevu talebi gönderir ve randevularını kendi hesaplarından takip eder.

### 1.2. Ana Değer Önerisi

```text
Güzellik ve kişisel bakım hizmetlerini keşfet, işletmelerin gerçek çalışmalarını gör ve güvenle randevu talebi oluştur.
```

### 1.3. Ana Slogan

```text
Önce gör. Sonra karar ver. Sonra randevu al.
```

### 1.4. İlk Pazar Yaklaşımı

İlk aşamada UrGlowUp genel marketplace olarak başlatılmayacaktır. Bunun yerine işletmelere özel public profil ve randevu linkleri verilecektir.

İşletmeler bu linki Instagram, TikTok, Google Business, WhatsApp, kartvizit ve QR kod gibi kanallarda paylaşacaktır. Böylece UrGlowUp, genel şehir/ilçe marketplace açılmadan önce işletme verisi, müşteri randevu akışı ve kullanıcı alışkanlığı oluşturmaya başlayacaktır.

Daha sonra yeterli işletme yoğunluğu oluşan şehir veya ilçelerde marketplace, harita, kategori arama ve keşfet akışları açılacaktır.

---

## 2. Kesinleşmiş MVP Kararları

| Konu | Karar |
|---|---|
| İlk platform | Web |
| Ana sayfa odağı | Müşteri odaklı |
| İşletme kullanımı | İlk aşamada ücretsiz |
| Müşteri hesabı | Zorunlu |
| İşletme hesabı | Zorunlu |
| Ekip/çalışan yönetimi | İlk MVP’de yok |
| Randevu modeli | İşletme bazlı randevu talebi |
| Kesin rezervasyon | İlk MVP’de yok |
| Randevu onayı | İşletme manuel onaylar/reddeder |
| Public işletme linki | Admin onayından önce aktif olabilir |
| Marketplace görünürlüğü | Admin kontrolünde, sonradan aktif edilir |
| Fotoğraf yükleme | MVP’de var |
| Video yükleme | MVP’de var |
| E-posta bildirimi | İlk MVP’de yok |
| SMS/WhatsApp otomasyonu | İlk MVP’de yok |
| Yorum sistemi | Google yorumları + UrGlowUp kullanıcı yorumları |
| UrGlowUp yorumu | Sadece tamamlanmış randevudan sonra |
| Google yorumları | Google Maps linki / Place ID üzerinden gösterim |
| Auth | Better Auth |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Media | Cloudinary |
| Deployment | Vercel |
| Gelecek altyapı | PostgreSQL + AWS tabanlı ölçeklenebilir yapı |

---

## 3. MVP Ana Kapsamı

### 3.1. MVP’de Olacak Modüller

```text
Public web alanı
Müşteri hesabı
İşletme hesabı
İşletme onboarding akışı
İşletme paneli
Public işletme profil sayfası
Randevu talep sistemi
Fotoğraf/video medya yönetimi
Google yorum gösterimi
UrGlowUp doğrulanmış yorum sistemi
Admin panel
Marketplace’e hazır veri mimarisi
```

### 3.2. MVP’de Olmayacak Modüller

```text
Çalışan/ekip bazlı randevu
Online ödeme
Kapora sistemi
E-posta bildirimi
SMS bildirimi
WhatsApp otomasyonu
AI try-on
Mobil uygulama
Tam harita tabanlı marketplace
Keşfet algoritması
Sponsorlu içerik
Abonelik paketleri
Çok şubeli işletme yönetimi
Gelişmiş CRM
Stok yönetimi
Muhasebe/fatura sistemi
```

---

## 4. Kullanıcı Rolleri

### 4.1. Roller

```text
customer
business_owner
admin
```

### 4.2. Rol Açıklamaları

| Rol | Açıklama |
|---|---|
| `customer` | Müşteri hesabı. İşletme profillerini inceler, randevu talebi gönderir, favori ekler, yorum yapar. |
| `business_owner` | İşletme sahibi hesabı. Profil, hizmet, medya, çalışma saatleri ve randevu taleplerini yönetir. |
| `admin` | Platform yöneticisi. İşletme, medya, yorum, kategori ve marketplace görünürlüğünü yönetir. |

### 4.3. Yetki Kuralları

- Müşteri randevu göndermek için giriş yapmış olmalıdır.
- İşletme sahibi sadece kendi işletmesini yönetebilir.
- İlk MVP’de bir işletme sahibinin tek işletmesi olması varsayılır.
- Admin tüm kullanıcıları, işletmeleri, medyaları, randevuları ve yorumları görüntüleyebilir.
- Admin işletmeyi askıya alabilir, aktif/pasif yapabilir ve marketplace görünürlüğünü değiştirebilir.

---

## 5. Temel Kullanıcı Akışları

### 5.1. İşletme Linkinden Gelen Müşteri Akışı

```text
Müşteri Instagram/TikTok/Google/QR üzerinden işletme linkine tıklar
→ /b/[slug] public işletme sayfası açılır
→ İşletme bilgilerini inceler
→ Fotoğraf/video portföyünü görür
→ Hizmetleri ve fiyatları inceler
→ Google ve UrGlowUp yorumlarını okur
→ Randevu Talebi Oluştur butonuna basar
→ Giriş yapar veya kayıt olur
→ Hizmet, tarih ve saat seçer
→ Not ekler
→ Randevu talebi gönderir
→ /account/appointments alanından durumunu takip eder
```

### 5.2. Ana Sayfadan Gelen Müşteri Akışı

```text
Müşteri ana sayfaya gelir
→ UrGlowUp’ın değer önerisini görür
→ Kategorileri ve öne çıkan işletmeleri görür
→ İşletme profiline gider
→ Hizmetleri, medyayı ve yorumları inceler
→ Giriş yapar veya kayıt olur
→ Randevu talebi gönderir
```

### 5.3. İşletme Kayıt ve Onboarding Akışı

```text
İşletme /for-business sayfasına gelir
→ İşletmeni UrGlowUp’a ekle butonuna basar
→ /business/register sayfasında hesap oluşturur
→ /business/onboarding akışı başlar
→ İşletme bilgilerini girer
→ Slug oluşturulur
→ Hizmetlerini ekler
→ Çalışma saatlerini belirler
→ Fotoğraf/video yükler
→ Google Maps işletme linkini ekler
→ Public profil önizlemesini görür
→ /business/dashboard alanına yönlendirilir
→ Public linkini sosyal medya profiline koyar
```

### 5.4. İşletme Randevu Yönetimi Akışı

```text
İşletme dashboard’a girer
→ Bekleyen randevu taleplerini görür
→ Randevu detayını açar
→ Müşteri, hizmet, tarih, saat ve notu inceler
→ Talebi onaylar veya reddeder
→ Onaylanan randevuları takip eder
→ Gerekirse randevuyu iptal eder
→ Hizmet tamamlandıktan sonra tamamlandı olarak işaretler
```

### 5.5. Admin Akışı

```text
Admin /admin paneline girer
→ Yeni işletmeleri listeler
→ İşletme profilini, medya içeriklerini ve hizmetleri kontrol eder
→ Uygunsuz işletmeleri askıya alır
→ Kategorileri yönetir
→ Yorumları ve medyaları denetler
→ İşletmenin marketplace görünürlüğünü açar/kapatır
```

---

## 6. Sayfa ve Rota Yapısı

### 6.1. Public Rotalar

```text
/
/for-business
/login
/register
/b/[slug]
/b/[slug]/book
/category/[category]
/city/[city]
/explore
/map
```

Not: `/category`, `/city`, `/explore` ve `/map` ilk MVP’de placeholder veya sınırlı listeleme olarak hazırlanabilir. Tam marketplace davranışı sonraki faza bırakılır.

### 6.2. Müşteri Paneli Rotaları

```text
/account
/account/profile
/account/appointments
/account/appointments/[id]
/account/favorites
/account/reviews
```

### 6.3. İşletme Paneli Rotaları

```text
/business/register
/business/onboarding
/business/dashboard
/business/appointments
/business/appointments/[id]
/business/services
/business/media
/business/profile
/business/hours
/business/reviews
/business/customers
/business/public-link
/business/settings
```

### 6.4. Admin Panel Rotaları

```text
/admin
/admin/businesses
/admin/businesses/[id]
/admin/users
/admin/appointments
/admin/media
/admin/reviews
/admin/categories
/admin/marketplace
/admin/regions
```

---

## 7. Ana Sayfa Yapısı

Ana sayfa müşteri odaklı olacaktır. İşletme kayıt CTA’sı görünür kalacak, ancak sayfanın ana mesajı müşteri deneyimi üzerine kurulacaktır.

### 7.1. Ana Sayfa Bölümleri

```text
Header
Hero
Kategori seçimi
Öne çıkan işletmeler
Nasıl çalışır?
Popüler hizmetler
UrGlowUp avantajları
Müşteri CTA
İşletme CTA
Footer
```

### 7.2. Hero Mesajı

```text
Güzellik ve kişisel bakım hizmetlerini keşfet, gerçek işleri gör ve güvenle randevu talebi oluştur.
```

### 7.3. Ana CTA’lar

```text
Müşteri CTA: İşletmeleri Keşfet
İşletme CTA: İşletmeni UrGlowUp’a Ekle
```

### 7.4. İşletmeler İçin CTA

Header ve footer içinde `/for-business` linki görünür olmalıdır.

---

## 8. Public İşletme Sayfası

Her işletmenin kalıcı public URL’si olacaktır.

```text
/b/[slug]
```

Örnek:

```text
/b/luna-beauty
/b/noir-tattoo
/b/aylin-nail-studio
```

### 8.1. Public Sayfada Bulunacak Bölümler

```text
Kapak görseli
Logo/profil görseli
İşletme adı
Kategori
Puan ve yorum özeti
Açık/kapalı durumu
Adres
Yol tarifi butonu
Fotoğraf/video galeri
Hizmetler
Hakkında
Konum
Google yorumları
UrGlowUp doğrulanmış yorumları
Randevu Talebi Oluştur butonu
```

### 8.2. Desktop Layout

```text
Üst bölüm:
- Breadcrumb
- İşletme adı
- Puan
- Açık/kapalı bilgisi
- Adres
- Paylaş/favori butonları

Galeri:
- 1 büyük kapak/portföy görseli
- 2-4 küçük medya kartı
- Tüm görselleri gör butonu

Sol ana içerik:
- Hizmetler
- Portföy
- Hakkında
- Konum
- Yorumlar

Sağ sabit kart:
- İşletme adı
- Puan
- Açık/kapalı durumu
- Adres
- Randevu Talebi Oluştur butonu
```

### 8.3. Mobil Layout

Mobil görünüm birinci önceliktir. Çünkü kullanıcıların önemli bir kısmı işletme linkine Instagram veya TikTok üzerinden mobil cihazdan gelecektir.

```text
Kapak görseli
İşletme adı
Puan ve adres
Galeri
Hizmetler
Hakkında
Konum
Yorumlar
Alt sabit CTA: Randevu Talebi Oluştur
```

### 8.4. Public Sayfa Kuralları

- Public link, işletme onayından önce `active_private` durumunda çalışabilir.
- `active_private` işletmeler marketplace ve kategori listelerinde görünmez.
- `active_marketplace` işletmeler public linkte ve marketplace alanlarında görünür.
- Askıya alınmış işletmelerin public sayfası kullanıcıya gösterilmez.

---

## 9. İşletme Paneli

### 9.1. İşletme Paneli Menüleri

```text
Dashboard
Randevular
Hizmetler
Medya
Profil
Çalışma Saatleri
Yorumlar
Müşteriler
Public Link
Ayarlar
```

### 9.2. Dashboard

Dashboard şu bilgileri göstermelidir:

```text
Bugünkü randevular
Bekleyen randevu talepleri
Bu hafta gelen talepler
Toplam randevu talebi
Toplam profil görüntülenmesi
Son gelen yorumlar
Public link kopyalama
Hızlı hizmet ekleme
Hızlı medya yükleme
```

### 9.3. Profil Yönetimi

İşletme şu alanları yönetebilmelidir:

```text
İşletme adı
Slug
Açıklama
Kategori
Alt kategoriler
Telefon
WhatsApp
Instagram
Google Maps işletme linki
Adres
Şehir
İlçe
Latitude
Longitude
Kapak görseli
Logo/profil görseli
```

### 9.4. Hizmet Yönetimi

Her hizmet için şu alanlar olmalıdır:

```text
Hizmet adı
Açıklama
Kategori
Süre
Fiyat
Fiyat tipi
Aktif/pasif durumu
Sıralama
```

Desteklenecek fiyat tipleri:

```text
fixed_price
starting_from
consultation_required
free_consultation
```

Arayüzde Türkçe gösterimler:

```text
Sabit fiyat
Başlangıç fiyatı
Fiyat görüşülür
Ücretsiz danışmanlık
```

### 9.5. Çalışma Saatleri

İşletme haftalık çalışma saatlerini belirleyebilmelidir.

```text
Pazartesi: 10:00 - 19:00
Salı: 10:00 - 19:00
Çarşamba: 10:00 - 19:00
Perşembe: 10:00 - 19:00
Cuma: 10:00 - 19:00
Cumartesi: 11:00 - 18:00
Pazar: Kapalı
```

Ek ayarlar:

```text
Randevu slot aralığı: 15 / 30 / 60 dakika
Minimum önceden randevu talep süresi
Maksimum ileri tarih aralığı
Kapalı günler
```

İlk MVP’de randevular işletme onayına tabi olduğu için çok karmaşık takvim sistemi gerekli değildir.

### 9.6. Public Link Alanı

İşletmeye özel paylaşım alanı olmalıdır.

```text
Public randevu linki
Linki kopyala butonu
Instagram bio metni kopyala butonu
QR kod oluşturma ve indirme
Public sayfayı önizle butonu
```

Örnek bio metni:

```text
Randevu ve hizmetler için:
https://urglowup.com/b/luna-beauty
```

---

## 10. Müşteri Hesabı

### 10.1. Müşteri Kaydı

Müşteri randevu talebi oluşturmak için hesap açmak zorundadır.

Kayıt alanları:

```text
Ad-soyad
E-posta
Telefon
Şifre
```

Better Auth ile aşağıdaki giriş yöntemleri desteklenmelidir:

```text
E-posta + şifre
Google ile giriş
```

Telefon doğrulama ilk MVP’de zorunlu değildir.

### 10.2. Müşteri Paneli

Müşteri panelinde şu alanlar olmalıdır:

```text
Profilim
Randevularım
Favorilerim
Yorumlarım
```

### 10.3. Müşteri Özellikleri

```text
Profil bilgilerini düzenleme
Randevu taleplerini görüntüleme
Randevu durumunu takip etme
Randevu iptal etme
Favori işletme ekleme/çıkarma
Tamamlanan randevu sonrası yorum yapma
Kendi yorumlarını görüntüleme
```

---

## 11. Randevu Sistemi

### 11.1. Randevu Modeli

İlk MVP’de kesin rezervasyon değil, randevu talebi modeli kullanılacaktır.

```text
Müşteri talep gönderir
→ İşletme panelden görür
→ İşletme onaylar veya reddeder
→ Müşteri hesabından durumu takip eder
```

### 11.2. Randevu Durumları

```text
pending
confirmed
rejected
cancelled_by_customer
cancelled_by_business
completed
no_show
```

### 11.3. Müşteri Randevu Akışı

```text
Hizmet seç
→ Tarih seç
→ Saat seç
→ Giriş yap / kayıt ol
→ Not ekle
→ Randevu talebi gönder
→ Randevularım sayfasında takip et
```

### 11.4. İşletme Randevu Yönetimi

İşletme panelinde randevular durumlara göre listelenmelidir:

```text
Bekleyen
Onaylanan
Reddedilen
İptal edilen
Tamamlanan
No-show
```

Her randevu kartında:

```text
Müşteri adı
Müşteri telefonu
Hizmet
Tarih
Saat
Müşteri notu
İşletme notu
Durum
Oluşturulma tarihi
Aksiyonlar
```

Aksiyonlar:

```text
Onayla
Reddet
İptal et
Tamamlandı olarak işaretle
No-show olarak işaretle
```

### 11.5. Saat Slotu Üretimi

İlk MVP’de slotlar işletmenin çalışma saatlerinden üretilmelidir.

Kurallar:

- İşletmenin kapalı olduğu günlerde slot gösterilmez.
- Slot aralığı işletme ayarından alınır.
- Aynı slotta mevcut confirmed appointment varsa kullanıcıya gösterilmemelidir.
- Pending appointment varsa sistem yine de slotu dikkatli yönetmelidir.
- Kesin rezervasyon olmadığı için son karar işletmeye aittir.

---

## 12. Medya Sistemi

### 12.1. Medya Türleri

```text
business_cover
business_logo
portfolio_image
portfolio_video
service_image
before_after_image
```

### 12.2. Medya Alanları

Her medya kaydında:

```text
Dosya URL
Cloudinary public ID
Medya tipi
Başlık
Açıklama
İlgili hizmet
Kategori
Yayın durumu
Sıralama
Dosya boyutu
MIME type
Oluşturulma tarihi
```

### 12.3. Cloudinary Kullanımı

Medya yükleme ve CDN dağıtımı için Cloudinary kullanılacaktır.

Kritik mimari kural:

```text
Medya servis kodu soyutlanmış yazılmalıdır.
İleride Cloudinary yerine S3 + CloudFront kullanılmak istenirse ürün kodu baştan yazılmamalıdır.
```

### 12.4. Video Limitleri

İlk MVP limitleri:

```text
Maksimum video boyutu: 100 MB
Maksimum video süresi: 60 saniye
Desteklenen formatlar: mp4, mov, webm
İşletme başına video limiti: 20
```

### 12.5. Fotoğraf Limitleri

```text
İşletme başına fotoğraf limiti: 100
Desteklenen formatlar: jpg, jpeg, png, webp
Kapak görseli önerilen oran: 16:9
Logo/profil görseli önerilen oran: 1:1
```

### 12.6. İlk MVP’de Keşfet Yok

Video ve fotoğraflar ilk MVP’de yalnızca işletmenin public profil sayfasında gösterilecektir. Algoritmik keşfet akışı sonraki faza bırakılacaktır.

---

## 13. Yorum Sistemi

### 13.1. İki Kaynaklı Yorum Modeli

UrGlowUp’ta iki yorum kaynağı olacaktır:

```text
Google yorumları
UrGlowUp doğrulanmış kullanıcı yorumları
```

### 13.2. Google Yorumları

İşletme onboarding sırasında Google Maps işletme linkini ekleyecektir. Sistem bu linkten veya işletmenin girdiği bilgilerden Google Place ID çözümlemesi yapabilecek şekilde tasarlanmalıdır.

Google yorumları UrGlowUp verisi gibi gösterilmemelidir. Public sayfada Google kaynaklı olduğu açıkça belirtilmelidir.

Uygulama, Google Places API kullanım ve atıf kurallarına uygun tasarlanmalıdır.

### 13.3. UrGlowUp Yorumları

UrGlowUp yorumu sadece tamamlanmış randevusu olan müşteriler tarafından yapılabilmelidir.

Kural:

```text
appointment.status === "completed" olan kullanıcı, ilgili işletmeye yorum bırakabilir.
```

### 13.4. Yorum Alanları

```text
rating
comment
source
status
businessId
customerId
appointmentId
createdAt
```

`source` değerleri:

```text
urglowup
google
```

`status` değerleri:

```text
visible
hidden
pending_moderation
removed
```

### 13.5. Public Yorum Görünümü

```text
Genel puan özeti
Google yorumları
UrGlowUp doğrulanmış yorumları
Yorum yaz butonu
Doğrulanmış randevu etiketi
```

---

## 14. Admin Panel

### 14.1. Admin Panel Modülleri

```text
Dashboard
İşletmeler
Kullanıcılar
Randevular
Medya
Yorumlar
Kategoriler
Marketplace
Bölgeler
Ayarlar
```

### 14.2. Admin Özellikleri

```text
İşletmeleri listeleme
Yeni işletmeleri görüntüleme
İşletme profilini inceleme
İşletmeyi aktif/pasif yapma
İşletmeyi askıya alma
Marketplace görünürlüğünü açma/kapatma
Medya içeriklerini görüntüleme
Uygunsuz medyayı kaldırma
Yorumları görüntüleme
Yorumu gizleme/kaldırma
Kategorileri yönetme
Kullanıcıları görüntüleme
Randevuları görüntüleme
Bölge/şehir yönetimi
```

### 14.3. İşletme Durumları

```text
draft
pending_approval
active_private
active_marketplace
suspended
rejected
```

| Durum | Açıklama |
|---|---|
| `draft` | İşletme onboarding’i tamamlamadı. |
| `pending_approval` | İşletme bilgileri admin incelemesi bekliyor. |
| `active_private` | Public link çalışır, marketplace’te görünmez. |
| `active_marketplace` | Public link çalışır ve marketplace’te görünür. |
| `suspended` | İşletme geçici olarak kapatıldı. |
| `rejected` | İşletme reddedildi. |

### 14.4. Public Link ve Marketplace Mantığı

- `active_private`: `/b/[slug]` çalışır, ancak `/explore`, `/map`, kategori ve şehir sayfalarında görünmez.
- `active_marketplace`: `/b/[slug]` çalışır ve marketplace alanlarında görünür.
- `suspended`: public sayfa devre dışı kalır.
- `rejected`: public sayfa devre dışı kalır.

---

## 15. Marketplace Hazırlığı

İlk MVP genel marketplace olmayacaktır, ancak veri modeli ve rota yapısı marketplace’e hazır kurulacaktır.

### 15.1. Placeholder Rotalar

```text
/explore
/map
/category/[category]
/city/[city]
/city/[city]/[district]
```

### 15.2. Marketplace Alanları

Her işletmede aşağıdaki alanlar bulunmalıdır:

```text
city
district
latitude
longitude
categoryIds
isMarketplaceVisible
marketplaceStatus
```

### 15.3. Sonradan Açılacak Marketplace Özellikleri

```text
Harita görünümü
Liste görünümü
Kategori filtreleme
Şehir/ilçe filtreleme
Mesafeye göre sıralama
Açık/kapalı filtresi
Yakındaki işletmeler
Keşfet akışı
Sponsorlu işletmeler
```

---

## 16. Teknoloji Yığını

### 16.1. Başlangıç Stack’i

```text
Framework: Next.js App Router
Language: TypeScript
Styling: Tailwind CSS
UI Library: shadcn/ui
Database: Neon PostgreSQL
ORM: Prisma
Auth: Better Auth
Media: Cloudinary
Deployment: Vercel
Validation: Zod
Forms: React Hook Form
Optional data layer: TanStack Query
Monitoring: Sentry
```

### 16.2. Uzun Vadeli Altyapı Hedefi

```text
Frontend:
Next.js, başlangıçta Vercel, büyümede Vercel Enterprise veya AWS tabanlı deployment

Backend:
Başlangıçta Next.js server layer, büyümede ayrı Node.js/NestJS API servisi

Database:
Başlangıçta Neon PostgreSQL, büyümede AWS RDS PostgreSQL veya eşdeğer managed PostgreSQL

Storage:
Başlangıçta Cloudinary, büyümede S3 + CloudFront seçeneği

Queue:
İlk MVP’de yok, büyümede SQS veya BullMQ

Cache:
İlk MVP’de yok, büyümede Redis/ElastiCache

Monitoring:
Sentry + structured logging
```

### 16.3. Mimari İlkeler

```text
Provider bağımlılığı minimum tutulmalı.
Database modeli PostgreSQL uyumlu kalmalı.
Auth rol bazlı tasarlanmalı.
API ve veri katmanı mobil uygulamaya hazır olmalı.
Medya servis entegrasyonu soyutlanmalı.
Marketplace alanları baştan veri modeline eklenmeli.
Kod modüler, okunabilir ve genişletilebilir olmalı.
```

---

## 17. Önerilen Klasör Yapısı

```text
src/
  app/
    page.tsx
    for-business/
      page.tsx
    login/
      page.tsx
    register/
      page.tsx
    b/
      [slug]/
        page.tsx
        book/
          page.tsx
    account/
      layout.tsx
      page.tsx
      profile/
        page.tsx
      appointments/
        page.tsx
        [id]/
          page.tsx
      favorites/
        page.tsx
      reviews/
        page.tsx
    business/
      layout.tsx
      register/
        page.tsx
      onboarding/
        page.tsx
      dashboard/
        page.tsx
      appointments/
        page.tsx
        [id]/
          page.tsx
      services/
        page.tsx
      media/
        page.tsx
      profile/
        page.tsx
      hours/
        page.tsx
      reviews/
        page.tsx
      customers/
        page.tsx
      public-link/
        page.tsx
      settings/
        page.tsx
    admin/
      layout.tsx
      page.tsx
      businesses/
        page.tsx
        [id]/
          page.tsx
      users/
        page.tsx
      appointments/
        page.tsx
      media/
        page.tsx
      reviews/
        page.tsx
      categories/
        page.tsx
      marketplace/
        page.tsx
      regions/
        page.tsx
    explore/
      page.tsx
    map/
      page.tsx
    category/
      [category]/
        page.tsx
    city/
      [city]/
        page.tsx
  components/
    ui/
    layout/
    public/
    business/
    account/
    admin/
    forms/
    media/
    appointment/
  lib/
    auth/
    db/
    cloudinary/
    google/
    validators/
    permissions/
    slug/
    dates/
  server/
    actions/
    queries/
    services/
  prisma/
    schema.prisma
  types/
  constants/
```

---

## 18. Veritabanı Model Taslağı

Aşağıdaki modeller Prisma şemasına dönüştürülecektir.

### 18.1. Ana Modeller

```text
User
CustomerProfile
BusinessOwnerProfile
Business
BusinessCategory
BusinessService
BusinessHour
BusinessMedia
Appointment
Review
ExternalReviewSource
Favorite
Region
AdminAction
```

### 18.2. User

```text
User
- id
- name
- emailVerified
- email
- phone
- name
- role
- createdAt
- updatedAt
```

### 18.3. CustomerProfile

```text
CustomerProfile
- id
- userId
- fullName
- phone
- avatarUrl
- createdAt
- updatedAt
```

### 18.4. BusinessOwnerProfile

```text
BusinessOwnerProfile
- id
- userId
- fullName
- phone
- createdAt
- updatedAt
```

### 18.5. Business

```text
Business
- id
- ownerId
- name
- slug
- description
- phone
- whatsapp
- instagramUrl
- googleMapsUrl
- googlePlaceId
- address
- city
- district
- latitude
- longitude
- coverImageUrl
- logoUrl
- status
- isMarketplaceVisible
- marketplaceStatus
- createdAt
- updatedAt
```

### 18.6. BusinessCategory

```text
BusinessCategory
- id
- name
- slug
- description
- parentId
- isActive
- createdAt
- updatedAt
```

Örnek kategoriler:

```text
Kuaför
Tırnak
Dövme
Güzellik Merkezi
Kaş/Kirpik
Cilt Bakımı
Barber
Makyaj
```

### 18.7. BusinessService

```text
BusinessService
- id
- businessId
- categoryId
- name
- description
- durationMinutes
- price
- priceType
- isActive
- sortOrder
- createdAt
- updatedAt
```

`priceType` değerleri:

```text
fixed_price
starting_from
consultation_required
free_consultation
```

### 18.8. BusinessHour

```text
BusinessHour
- id
- businessId
- dayOfWeek
- isClosed
- openTime
- closeTime
- slotIntervalMinutes
- createdAt
- updatedAt
```

### 18.9. BusinessMedia

```text
BusinessMedia
- id
- businessId
- serviceId
- type
- url
- cloudinaryPublicId
- title
- description
- mimeType
- fileSize
- durationSeconds
- status
- sortOrder
- createdAt
- updatedAt
```

`type` değerleri:

```text
business_cover
business_logo
portfolio_image
portfolio_video
service_image
before_after_image
```

`status` değerleri:

```text
visible
hidden
removed
pending_moderation
```

### 18.10. Appointment

```text
Appointment
- id
- businessId
- customerId
- serviceId
- requestedDate
- requestedTime
- status
- customerNote
- businessNote
- createdAt
- updatedAt
```

`status` değerleri:

```text
pending
confirmed
rejected
cancelled_by_customer
cancelled_by_business
completed
no_show
```

### 18.11. Review

```text
Review
- id
- businessId
- customerId
- appointmentId
- rating
- comment
- source
- status
- createdAt
- updatedAt
```

`source` değerleri:

```text
urglowup
google
```

`status` değerleri:

```text
visible
hidden
pending_moderation
removed
```

### 18.12. Favorite

```text
Favorite
- id
- customerId
- businessId
- createdAt
```

### 18.13. Region

```text
Region
- id
- city
- district
- slug
- isActive
- createdAt
- updatedAt
```

### 18.14. AdminAction

```text
AdminAction
- id
- adminId
- actionType
- targetType
- targetId
- metadata
- createdAt
```

---

## 19. UI/UX İlkeleri

### 19.1. Genel Görsel Dil

```text
Modern
Premium
Minimal
Mobil öncelikli
Güzellik sektörüne uygun
Fazla klişe olmayan
Hızlı ve güven veren
```

### 19.2. Renk Paleti

Başlangıç paleti:

```text
Siyah
Beyaz
Soft pembe
Mor
Krem
Açık gri
```

### 19.3. UI İlkeleri

- Mobil öncelikli tasarım yapılmalıdır.
- Public işletme sayfası hızlı açılmalıdır.
- Randevu CTA’sı mobilde alt sabit buton olarak görünmelidir.
- Formlar kısa ve net olmalıdır.
- İşletme paneli karmaşık olmamalıdır.
- Medya yükleme deneyimi basit olmalıdır.
- Admin panel işlevsel ve sade olmalıdır.

### 19.4. Public İşletme Sayfası Tasarım Referansı

Fresha benzeri temiz işletme profil yapısı referans alınabilir, ancak birebir kopyalanmamalıdır. UrGlowUp kendi marka diliyle daha yumuşak, premium ve mobil öncelikli görünmelidir.

---

## 20. Environment Variables

`.env.example` dosyasında aşağıdaki değişkenler bulunmalıdır.

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Admin
ADMIN_EMAILS=

# Cloudinary
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# Google Business Profile OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_BUSINESS_PROFILE_SCOPES=https://www.googleapis.com/auth/business.manage

# OAuth token encryption
OAUTH_TOKEN_ENCRYPTION_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_SERVER_API_KEY=
```

---

## 21. Kurulum

### 21.1. Bağımlılıkları Kur

```bash
npm install
```

### 21.2. Environment Dosyası Oluştur

```bash
cp .env.example .env
```

`.env` içindeki değerleri doldur.

### 21.3. Prisma Migration Çalıştır

```bash
npx prisma migrate dev
```

### 21.4. Prisma Client Oluştur

```bash
npx prisma generate
```

### 21.5. Seed Verisi Oluştur

```bash
npm run db:seed
```

### 21.6. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

---

## 22. Seed Verisi

İlk geliştirme ortamında aşağıdaki seed verileri oluşturulmalıdır:

```text
Admin kullanıcı
Örnek müşteri
Örnek işletme sahibi
3 örnek işletme
Temel kategoriler
Örnek hizmetler
Örnek çalışma saatleri
Örnek fotoğraf/video medya kayıtları
Örnek randevu talepleri
Örnek UrGlowUp yorumları
```

Örnek kategoriler:

```text
Kuaför
Tırnak
Dövme
Güzellik Merkezi
Barber
Cilt Bakımı
Makyaj
Kaş/Kirpik
```

---

## 23. Geliştirme Fazları

### Phase 1 — Proje Altyapısı

```text
Next.js App Router kurulumu
TypeScript yapılandırması
Tailwind CSS kurulumu
shadcn/ui kurulumu
Prisma kurulumu
Neon PostgreSQL bağlantısı
Better Auth kurulumu
Role yapısı
Base layout
Dashboard layout
Admin layout
```

### Phase 2 — Auth ve Kullanıcı Rolleri

```text
Customer register/login
Business owner register/login
Admin role kontrolü
Better Auth route handler ve session yapısı
Prisma-backed auth tablolarÄ± ve user role akÄ±ÅŸÄ±
Protected route middleware
Permission helpers
```

### Phase 3 — Müşteri Hesabı

```text
/account layout
Profil sayfası
Randevularım placeholder
Favoriler placeholder
Yorumlarım placeholder
```

### Phase 4 — İşletme Kayıt ve Onboarding

```text
/for-business sayfası
/business/register
/business/onboarding
İşletme temel bilgileri
Slug oluşturma
Google Maps link alanı
Profil tamamlama checklist’i
```

### Phase 5 — İşletme Paneli

```text
/business/dashboard
Profil yönetimi
Public link alanı
İşletme durum gösterimi
Hızlı aksiyonlar
```

### Phase 6 — Hizmet ve Çalışma Saatleri

```text
Service CRUD
Price type desteği
Business hour CRUD
Slot interval ayarı
Public sayfaya hizmetlerin yansıması
```

### Phase 7 — Public İşletme Sayfası

```text
/b/[slug]
Header ve işletme bilgileri
Galeri
Hizmetler
Hakkında
Konum
Yorumlar
Sağ sabit randevu kartı
Mobil sabit CTA
```

### Phase 8 — Randevu Talep Sistemi

```text
/b/[slug]/book
Müşteri hesabı zorunluluğu
Hizmet seçimi
Tarih/saat seçimi
Slot üretimi
Appointment create
Customer appointments
Business appointments
Status transitions
Cancellation
```

### Phase 9 — Medya Sistemi

```text
Cloudinary upload
Fotoğraf yükleme
Video yükleme
Medya listesi
Medya silme/gizleme
Public galeri
Video limitleri
Admin medya moderasyonu
```

### Phase 10 — Yorum Sistemi

```text
Google Maps link / Place ID alanı
Google review display komponenti
UrGlowUp verified review creation
Review moderation
Public review summary
```

### Phase 11 — Admin Panel

```text
Admin dashboard
Business management
User management
Appointment management
Media moderation
Review moderation
Category management
Marketplace visibility
Region management
```

### Phase 12 — Marketplace Hazırlığı

```text
Region model
Marketplace visibility controls
/explore placeholder
/map placeholder
/category/[category] placeholder
/city/[city] placeholder
İşletme kartı komponentleri
```

### Phase 13 — UI Polish ve Test

```text
Mobile responsive iyileştirme
Form validation
Loading states
Empty states
Error states
Access control testleri
Randevu akışı testleri
Medya upload testleri
Public sayfa performansı
```

---

## 24. Form Validasyon Kuralları

Zod kullanılmalıdır.

### 24.1. İşletme Profili

```text
İşletme adı: zorunlu, min 2 karakter
Slug: zorunlu, unique, lowercase, URL-safe
Kategori: zorunlu
Şehir: zorunlu
İlçe: zorunlu
Telefon: zorunlu
Adres: zorunlu
Açıklama: opsiyonel, max 1000 karakter
Instagram URL: opsiyonel
WhatsApp: opsiyonel
Google Maps URL: opsiyonel
```

### 24.2. Hizmet

```text
Hizmet adı: zorunlu
Süre: zorunlu, dakika cinsinden
Fiyat tipi: zorunlu
Fiyat: priceType uygunsa zorunlu
Açıklama: opsiyonel
Kategori: opsiyonel veya zorunlu
```

### 24.3. Randevu

```text
Business ID: zorunlu
Service ID: zorunlu
Customer ID: zorunlu
Tarih: zorunlu
Saat: zorunlu
Not: opsiyonel, max 500 karakter
```

### 24.4. Yorum

```text
Rating: 1-5 arası zorunlu
Comment: opsiyonel, max 1000 karakter
Appointment ID: zorunlu
Business ID: zorunlu
```

---

## 25. Güvenlik ve Erişim Kuralları

```text
Server-side authorization zorunludur.
Sadece client-side kontrol yeterli değildir.
İşletme sahibi sadece kendi businessId verisine erişebilir.
Müşteri sadece kendi randevularını görüntüleyebilir.
Admin tüm kaynaklara erişebilir.
Cloudinary upload işlemlerinde dosya tipi ve boyut kontrolü yapılmalıdır.
Public sayfalarda private/suspended işletmeler gösterilmemelidir.
Slug unique olmalıdır.
Input validasyonları Zod ile yapılmalıdır.
```

---

## 26. Performans İlkeleri

```text
Public işletme sayfası hızlı açılmalıdır.
Görseller optimize edilmelidir.
Video lazy-load edilmelidir.
Galeri ilk yüklemede sınırlı medya göstermelidir.
Dashboard veri sorguları pagination desteklemelidir.
Admin listeleri pagination ve filtreleme desteklemelidir.
Marketplace’e hazırlık için business listelerinde index stratejisi düşünülmelidir.
```

Önerilen database indexleri:

```text
Business.slug
Business.city
Business.district
Business.status
Business.isMarketplaceVisible
Appointment.businessId
Appointment.customerId
Appointment.status
BusinessMedia.businessId
Review.businessId
Favorite.customerId
```

---

## 27. Mobil Uygulama Hazırlığı

İlk MVP web olacaktır. Ancak veri ve servis katmanı ileride React Native / Expo mobil uygulaması tarafından kullanılabilecek şekilde tasarlanmalıdır.

Kurallar:

```text
Business, service, media, appointment ve review servisleri UI’dan ayrılmalıdır.
Route handler veya server action mantığı ileride API’ye taşınabilir olmalıdır.
Veri modeli mobil uygulama için yeniden yazılmayacak şekilde kurulmalıdır.
Public business profile tek veri kaynağı olmalıdır.
```

---

## 28. Post-MVP Yol Haritası

### 28.1. Marketplace

```text
Harita görünümü
Liste görünümü
Şehir/ilçe keşfi
Kategori filtreleme
Yakındaki işletmeler
Mesafeye göre sıralama
Marketplace ana sayfası
```

### 28.2. Keşfet

```text
Fotoğraf/video akışı
Kategori bazlı keşfet
İçerikten işletme profiline yönlendirme
Kaydetme/beğenme
Algoritmik öneriler
```

### 28.3. Randevu Geliştirmeleri

```text
Çalışan/ekip yönetimi
Çalışan bazlı randevu
Otomatik onay
Randevu saat değiştirme teklifi
E-posta bildirimi
SMS/WhatsApp bildirimi
Takvim entegrasyonu
```

### 28.4. Ödeme

```text
Online ödeme
Kapora
İptal/iade politikası
Komisyon modeli
Abonelik paketleri
```

### 28.5. AI Try-On

```text
AI saç rengi deneme
AI saç modeli deneme
AI dövme yerleştirme
AI tırnak tasarımı
AI makyaj önizleme
Beğenilen stile göre işletme önerisi
AI kredi sistemi
```

### 28.6. Mobil

```text
iOS uygulaması
Android uygulaması
Push notification
Deep linking
Mobil işletme paneli
Mobil müşteri deneyimi
```

---

## 29. Geliştirici Notları

### 29.1. İlk Öncelik

İlk kodlanacak ana hat:

```text
Auth + roller
İşletme onboarding
Public işletme sayfası
Hizmet yönetimi
Randevu talep sistemi
Müşteri hesabı
İşletme paneli
```

### 29.2. Kritik Ürün Prensibi

```text
İşletme paneli veriyi üretir.
Public işletme sayfası bu veriyi gösterir.
Müşteri bu sayfadan randevu talebi oluşturur.
Admin kaliteyi ve görünürlüğü yönetir.
Marketplace, bu public işletme sayfalarını keşfedilebilir hale getiren üst katmandır.
```

### 29.3. Kaçınılması Gereken Hatalar

```text
İşletme public sayfası ile marketplace işletme sayfasını ayrı veri kaynaklarıyla kurma.
Randevu sistemini ilk MVP’de fazla karmaşık hale getirme.
Video dosyalarını doğrudan uygulama sunucusunda saklama.
Admin paneli erteleme.
Müşteri hesabı ve yorum sistemini birbirinden kopuk tasarlama.
Marketplace’i veri modeli hazır olmadan sonradan ekleme.
Cloudinary bağımlılığını soyutlamadan doğrudan tüm kodun içine yayma.
```

---

## 30. Başarı Kriterleri

İlk MVP başarılı sayılmak için aşağıdaki akışlar çalışmalıdır:

```text
Bir işletme hesap oluşturabilmeli.
İşletme onboarding’i tamamlayabilmeli.
İşletme hizmet ekleyebilmeli.
İşletme çalışma saatlerini belirleyebilmeli.
İşletme fotoğraf/video yükleyebilmeli.
İşletmenin /b/[slug] public sayfası oluşmalı.
Müşteri hesap oluşturabilmeli.
Müşteri public sayfadan randevu talebi gönderebilmeli.
İşletme randevu talebini onaylayıp reddedebilmeli.
Müşteri randevu durumunu hesabından takip edebilmeli.
Tamamlanan randevudan sonra müşteri yorum yapabilmeli.
Admin işletme, medya ve yorumları yönetebilmeli.
İşletme active_private iken public linkte görünmeli, marketplace’te görünmemeli.
```

---

## 31. Kısa Teknik Özet

UrGlowUp, Next.js App Router, TypeScript, Prisma, Neon PostgreSQL, Better Auth, Cloudinary ve Tailwind/shadcn-ui ile geliştirilecek web tabanlı bir güzellik ve kişisel bakım randevu platformudur.

İlk MVP müşteri hesabı, işletme hesabı, işletme onboarding’i, public işletme profili, hizmet yönetimi, fotoğraf/video portföy, randevu talep sistemi, Google + UrGlowUp yorumları ve admin panelini kapsar.

Genel marketplace, harita, keşfet, mobil uygulama, online ödeme ve AI try-on özellikleri sonraki fazlarda eklenecektir. Ancak veri modeli ve rota mimarisi bu genişlemelere hazır olacak şekilde tasarlanacaktır.
