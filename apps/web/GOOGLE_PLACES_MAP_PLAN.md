Antalya Google Places Destekli Harita, Admin Yönetimi ve Claim Sistemi Uygulama Planı
Amaç

Bu doküman, mevcut UrGlowUp/Fersha projesine Google Places destekli harita, dış işletme referansları, admin işletme yönetimi, manuel işletme oluşturma ve işletme sahiplenme sisteminin kontrollü biçimde eklenmesi için uygulanacak teknik planı tanımlar.

Sistem iki farklı veri kaynağını kesin biçimde ayırmalıdır:

INTERNAL Business
Platforma ait gerçek işletme kaydıdır.
Randevu alınabilir.
Haritada yeşil marker ile gösterilir.
Admin veya yetkili işletme sahibi tarafından yönetilir.
GOOGLE PlaceReference
Google Places üzerinden keşfedilen dış işletme referansıdır.
Platform işletmesi değildir.
Randevu alınamaz.
Haritada siyah marker ile gösterilir.
Yalnızca admin onayından sonra görünür.
Sahiplenildiğinde veya dönüştürüldüğünde gerçek Business kaydına bağlanır.

Google Places verisi kalıcı yerel işletme kataloğu gibi saklanmayacaktır. Kalıcı olarak tutulacak temel Google değeri place_id / providerPlaceId olacaktır.

Temel Kurallar
Google Places Veri Politikası

Aşağıdaki Google kaynaklı alanlar kalıcı yerel veri olarak saklanmamalıdır:

Google işletme adı
Google adresi
Google telefon numarası
Google website URL
Google rating
Google review count
Google review text
Google fotoğrafları
Google raw payload
Google’dan gelen displayName / formattedAddress / phone / website / rating / reviews / photos alanları

Kalıcı tutulabilecek ana referans:

provider = "GOOGLE"
providerPlaceId = Google place_id

Google kaynaklı detaylar yalnızca canlı API response veya policy-gated geçici cache katmanı üzerinden kullanılmalıdır.

Harita Politikası

Mevcut harita Google Maps tabanlıdır. Google Places sonuçları yalnızca Google Maps üzerinde ve gerekli attribution korunarak gösterilmelidir.

Google dışı harita sağlayıcısına geçilirse bu özellik yeniden değerlendirilmeden taşınmamalıdır.

SEO Kısıtı

Google kaynaklı dış işletmeler için v1’de indexlenebilir SEO detay sayfası oluşturulmayacaktır. Dış işletme detayı yalnızca harita paneli / marker info window seviyesinde kalacaktır.

Phase 0: Mevcut Kod Analizi

Kod yazmadan önce mevcut repo analiz edilmelidir.

Kontrol edilecek dosya ve yapılar:

Prisma schema
Mevcut Business modeli
Mevcut kullanıcı/rol/yetki sistemi
Mevcut admin panel yapısı
Mevcut owner/business dashboard yapısı
Mevcut /map sayfası
Mevcut Google Maps entegrasyonu
Mevcut getMarketplaceBusinesses() veya benzeri map query fonksiyonları
Mevcut Google OAuth / Google Business Profile entegrasyonu varsa ilgili modeller
Mevcut test altyapısı
Mevcut lint/typecheck/build komutları

Next.js tarafında değişiklik yapılmadan önce repo içindeki ilgili dokümantasyon okunmalıdır:

node_modules/next/dist/docs/

Eğer bu path mevcut değilse, mevcut proje yapısı ve kullanılan Next.js sürümü üzerinden hareket edilmelidir.

Phase 0 çıktısı:

Mevcut mimarinin kısa özeti
Değiştirilecek dosyaların listesi
Riskli alanların listesi
Uygulama fazlarının net sırası
Phase 1: Marker Modelini ve Mevcut Haritayı Hazırla

Bu fazda Google Places entegrasyonu eklenmeyecek. Önce mevcut bağlı işletmelerin harita response’u yeni tip yapısına uygun hale getirilecektir.

MapPlace Tipi

Frontend ve backend arasında kullanılacak ortak response tipi:

type MapPlace = {
  id: string;
  source: "INTERNAL" | "GOOGLE";
  name: string;
  latitude: number;
  longitude: number;
  isBookable: boolean;
  markerVariant: "bookable" | "external";
  profileUrl?: string;
  googleMapsUri?: string;
  claimUrl?: string;
  rating?: number;
  reviewCount?: number;
  attribution?: "Google Maps";
};
INTERNAL Business Kuralları

Mevcut platform işletmeleri şu şekilde dönmelidir:

source: "INTERNAL"
isBookable: true | false
markerVariant: "bookable"

Yeşil marker yalnızca bağlı platform işletmeleri için kullanılmalıdır.

Randevu CTA sadece şu koşulda gösterilmelidir:

source === "INTERNAL" && isBookable === true
UI Davranışı
INTERNAL işletme marker rengi yeşil olmalıdır.
Profil / randevu CTA mevcut davranışla uyumlu kalmalıdır.
Google Places henüz eklenmemelidir.
Mevcut /map davranışı bozulmamalıdır.
Phase 1 Testleri
Bağlı işletmeler source: "INTERNAL" döner.
Bağlı işletmeler markerVariant: "bookable" döner.
Randevu CTA sadece INTERNAL + bookable işletmelerde görünür.
Mevcut harita çalışmaya devam eder.
Phase 2: Prisma Data Model

Bu fazda yeni modeller ve enumlar eklenecektir.

PlaceReference

PlaceReference, Google Places veya ileride başka dış sağlayıcılardan gelen işletme referanslarını tutar. Bu model Google native işletme içeriğini saklamaz.

model PlaceReference {
  id                String @id @default(cuid())
  provider          String @default("GOOGLE")
  providerPlaceId   String @unique

  claimedBusinessId String?
  claimedBusiness   Business? @relation(fields: [claimedBusinessId], references: [id])

  city              String?
  district          String?
  categoryHint      String?
  status            PlaceReferenceStatus @default(DISCOVERED)

  lastFetchedAt     DateTime?
  cacheExpiresAt    DateTime?
  fetchStatus       String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([provider, providerPlaceId])
  @@index([city, district])
  @@index([status])
  @@index([claimedBusinessId])
}

Notlar:

city, district, categoryHint Google’dan doğrulanmış native veri değildir.
Bu alanlar yalnızca bizim operasyonel arama/import segment etiketlerimizdir.
sourcePayload Json eklenmeyecektir.
Google displayName, formattedAddress, phone, website, rating, reviewCount, photos, reviews veya raw payload alanları eklenmeyecektir.
PlaceReferenceStatus
enum PlaceReferenceStatus {
  DISCOVERED
  APPROVED
  HIDDEN
  DUPLICATE
  CLAIM_PENDING
  CLAIMED
  REJECTED
  STALE
  ERROR
}
BusinessOwnershipStatus

Business modeline ownership state eklenmelidir.

enum BusinessOwnershipStatus {
  UNCLAIMED
  CLAIM_PENDING
  CLAIMED
}

Business modeline şu alan eklenmelidir:

ownershipStatus BusinessOwnershipStatus @default(UNCLAIMED)

Eğer mevcut projede zaten benzer bir alan varsa yeni alan eklemek yerine mevcut modelle uyumlu şekilde genişletme yapılmalıdır.

BusinessMembership

Bir işletmede birden fazla kullanıcı rol alabileceği için sadece ownerUserId yaklaşımı yerine membership modeli kullanılmalıdır.

model BusinessMembership {
  id         String @id @default(cuid())
  userId     String
  businessId String
  role       BusinessMemberRole
  status     MembershipStatus
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, businessId])
  @@index([businessId])
  @@index([userId])
}
enum BusinessMemberRole {
  OWNER
  MANAGER
  STAFF
}
enum MembershipStatus {
  ACTIVE
  PENDING
  REMOVED
}

Eğer mevcut projede business owner, staff veya employee modeli varsa bu modelle çakışma yaratılmamalı; mevcut yapı incelenip en az kırıcı entegrasyon tercih edilmelidir.

BusinessClaimRequest

Claim başvuruları ayrı bir modelde tutulmalıdır.

model BusinessClaimRequest {
  id               String @id @default(cuid())
  userId           String
  businessId        String?
  placeReferenceId String?

  status           ClaimRequestStatus @default(PENDING)
  verificationType ClaimVerificationType?
  evidenceUrl      String?
  phone            String?
  email            String?
  note             String?

  reviewedById     String?
  reviewedAt       DateTime?
  rejectionReason  String?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId])
  @@index([businessId])
  @@index([placeReferenceId])
  @@index([status])
}
enum ClaimRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
enum ClaimVerificationType {
  PHONE
  EMAIL
  DOCUMENT
  GOOGLE_BUSINESS_PROFILE
  MANUAL_ADMIN
}

Validation kuralı:

businessId veya placeReferenceId alanlarından en az biri dolu olmalıdır.
İkisi aynı anda doluysa bu sadece bilinçli eşleştirme senaryosunda kabul edilmelidir.
Aynı kullanıcı aynı hedef için birden fazla aktif PENDING claim açamamalıdır.
Phase 2 Testleri
Migration başarıyla çalışır.
Prisma generate başarıyla çalışır.
PlaceReference Google native içerik alanı içermez.
BusinessMembership unique constraint çalışır.
BusinessClaimRequest indeksleri oluşur.
Phase 3: Admin PlaceReference Queue

Bu fazda Google Places keşif sonuçlarının yönetileceği admin ekranı oluşturulacaktır.

Ekran Amacı

Admin, Google Places üzerinden keşfedilmiş dış referansları burada yönetir.

Liste Alanları

Gösterilecek alanlar:

provider
providerPlaceId
city
district
categoryHint
status
fetchStatus
lastFetchedAt
cacheExpiresAt
claimedBusinessId
createdAt
updatedAt

Google native içerikler kalıcı alan gibi gösterilmemelidir.

Opsiyonel olarak, sadece canlı fetch ile elde edilen geçici preview gösterilebilir. Bu preview kalıcı DB alanı gibi kaydedilmemelidir.

Admin Aksiyonları

Admin şu aksiyonları yapabilmelidir:

Yayınla: status = APPROVED
Gizle: status = HIDDEN
Duplicate işaretle: status = DUPLICATE
Mevcut Business ile eşleştir
Kategori düzelt
İlçe düzelt
Google Maps’te aç
Convert to Business
Harita Görünürlük Kuralı

Haritada yalnızca şu PlaceReference kayıtları siyah marker olabilir:

status === "APPROVED" && !claimedBusinessId
Phase 3 Testleri
Admin DISCOVERED kaydı APPROVED yapabilir.
Admin kaydı HIDDEN yapabilir.
Admin kaydı DUPLICATE yapabilir.
claimedBusinessId olan kayıt dış marker olarak görünmez.
Google native içerikler PlaceReference tablosuna yazılmaz.
Phase 4: Admin Business Management

Bu fazda admin’in gerçek platform işletmelerini yönetebilmesi sağlanacaktır.

Ekran Amacı

Admin, platformdaki gerçek Business kayıtlarını yönetir.

Admin Yetkileri

Admin şunları yapabilmelidir:

Manuel yeni Business oluşturma
Business bilgilerini düzenleme
Koordinat düzenleme
Şehir / ilçe / kategori düzenleme
Yayın durumunu düzenleme
Randevu alınabilirlik durumunu düzenleme
Hizmetleri düzenleme
Çalışma saatlerini düzenleme
Medya/fotoğraf yönetimi, mevcut sistem destekliyorsa
Kullanıcı/owner atama
Google place id eşleştirme
Manuel Business Oluşturma

Admin manuel Business oluştururken şu alanları girebilmelidir:

İşletme adı
Açıklama
Telefon
Adres
Şehir
İlçe
Latitude
Longitude
Kategori
Yayın durumu
Randevu alınabilirlik durumu
Google place id, varsa
Sahip kullanıcı, varsa

Admin tarafından oluşturulan işletme varsayılan olarak şu durumda olabilir:

ownershipStatus = "UNCLAIMED"

Eğer admin owner atarsa:

ownershipStatus = "CLAIMED"
BusinessMembership(role = OWNER, status = ACTIVE)
Convert to Business

Admin, bir PlaceReference kaydını gerçek Business kaydına dönüştürebilir.

Kurallar:

Google’dan gelen name/address/phone otomatik olarak Business tablosuna kopyalanmamalıdır.
Admin işletme bilgilerini manuel girmeli veya doğrulamalıdır.
Yeni Business oluştuğunda:
Business.googlePlaceId = PlaceReference.providerPlaceId
PlaceReference.claimedBusinessId = Business.id
PlaceReference.status = CLAIMED
Owner atanmadıysa:
Business.ownershipStatus = UNCLAIMED
Owner atandıysa:
Business.ownershipStatus = CLAIMED
BusinessMembership(OWNER, ACTIVE) oluşturulur.
Phase 4 Testleri
Admin manuel Business oluşturabilir.
Business sahipsiz oluşturulabilir.
Admin owner atayabilir.
Owner atanırsa membership oluşur.
Convert to Business Google native veriyi otomatik kopyalamaz.
Convert sonrası PlaceReference dış marker olarak gösterilmez.
Phase 5: Google Places Server-Side Integration

Bu fazda Google Places API entegrasyonu server-side olarak eklenecektir.

Güvenlik Kuralları
Google Places Web Service API key browser’a gönderilmeyecektir.
Places API çağrıları tamamen server-side yapılacaktır.
Google Maps JS key ayrı tutulacaktır.
Google Maps JS key için HTTP referrer restriction kullanılmalıdır.
Server-side Places key için IP veya uygun application restriction kullanılmalıdır.
Kota ve billing alert aktif edilmelidir.
FieldMask Modları

Minimum discovery mode:

places.id,
places.displayName,
places.location,
places.googleMapsUri,
places.attributions

Enriched marker mode:

places.id,
places.displayName,
places.location,
places.googleMapsUri,
places.businessStatus,
places.types,
places.rating,
places.userRatingCount,
places.attributions

V1’de rating ve review count kapalı başlamalıdır. Gerekirse feature flag arkasında açılmalıdır.

V1 kapsam dışı:

Review text
Photos
AI summaries
Full payload storage
Antalya V1 Kapsamı

İlk bölgeler:

const ANTALYA_REGIONS = [
  "Muratpaşa",
  "Konyaaltı",
  "Kepez",
  "Lara",
  "Alanya",
];

Google Places type listesi:

const ANTALYA_PLACE_TYPES = [
  "beauty_salon",
  "hair_salon",
  "hair_care",
  "barber_shop",
  "nail_salon",
  "spa",
  "beautician",
  "makeup_artist",
];

API çağrısında yalnızca resmi supported type değerleri kullanılmalıdır. Desteklenmeyen type varsa Text Search fallback kullanılmalıdır.

Türkçe kategori adları frontend/admin sınıflandırması olarak kalmalıdır.

Import / Discovery Davranışı

Discovery işlemi şunları yapmalıdır:

Bölge + kategori bazlı Google Places araması çalıştır.
Dönen sonuçlarda yalnızca places.id kalıcı referans olarak saklanabilir.
Her Google sonucu için PlaceReference upsert yapılır.
Yeni kayıtlar varsayılan olarak DISCOVERED olmalıdır.
Otomatik olarak APPROVED yapılmamalıdır.
Duplicate eşleşmeler admin review’a düşmelidir.
Duplicate Önceliği

Duplicate kontrol sırası:

Business.googlePlaceId === place.id
PlaceReference.providerPlaceId === place.id
PlaceReference.claimedBusinessId varsa dış marker gösterme
Aynı telefon veya website varsa admin review’a düşür
İsim benzerliği + 100 metre altı koordinat yakınlığı varsa otomatik merge yapma; duplicate candidate olarak işaretle

Not: Telefon, website, isim ve koordinat Google’dan canlı response ile gelebilir; bunlar kalıcı native alan olarak saklanmamalıdır.

Phase 5 Testleri
API key client bundle içine sızmaz.
Discovery sonrası sadece providerPlaceId ve operasyonel metadata saklanır.
Yeni kayıtlar DISCOVERED olur.
Otomatik yayınlama yapılmaz.
Google API hatasında INTERNAL işletmeler haritada görünmeye devam eder.
Raw Google payload DB’ye yazılmaz.
Phase 6: Unified Map Query

Bu fazda harita endpoint’i iki kaynağı birleştirecek şekilde düzenlenecektir.

Kaynaklar
INTERNAL Business
Aktif marketplace işletmeleri
Koordinatı olan işletmeler
Görünürlük koşullarını sağlayan işletmeler
GOOGLE PlaceReference
status = APPROVED
claimedBusinessId = null
Canlı API response veya policy-gated cache üzerinden map display verisi alınabilen referanslar
Response

Her iki kaynak aynı MapPlace tipine normalize edilmelidir.

INTERNAL örneği:

{
  id: business.id,
  source: "INTERNAL",
  name: business.name,
  latitude: business.latitude,
  longitude: business.longitude,
  isBookable: true,
  markerVariant: "bookable",
  profileUrl: `/business/${business.slug}`
}

GOOGLE örneği:

{
  id: placeReference.id,
  source: "GOOGLE",
  name: googlePlace.displayName,
  latitude: googlePlace.location.latitude,
  longitude: googlePlace.location.longitude,
  isBookable: false,
  markerVariant: "external",
  googleMapsUri: googlePlace.googleMapsUri,
  claimUrl: `/claim/place/${placeReference.id}`,
  attribution: "Google Maps"
}
Duplicate Kuralı

Eğer Google place id bir Business.googlePlaceId ile eşleşiyorsa GOOGLE marker gösterilmemelidir. INTERNAL marker gösterilmelidir.

Phase 6 Testleri
INTERNAL işletmeler yeşil marker döner.
APPROVED PlaceReference siyah marker döner.
Claimed PlaceReference siyah marker olarak dönmez.
Business.googlePlaceId eşleşen Google sonucu dış marker olmaz.
Google API hatasında INTERNAL işletmeler dönmeye devam eder.
Phase 7: Claim Flow

Bu fazda kullanıcıların işletme sahiplenme başvurusu açabilmesi sağlanacaktır.

Claim Kaynakları

Claim iki kaynaktan açılabilir:

PlaceReference
Siyah Google marker üzerinden
Business
Admin tarafından manuel oluşturulmuş sahipsiz işletme üzerinden
PlaceReference Claim

Akış:

Kullanıcı siyah marker’da “Bu işletme sizin mi?” butonuna basar.
Kullanıcı giriş yapar veya kayıt olur.
Claim formunu doldurur.
BusinessClaimRequest(placeReferenceId, userId, status = PENDING) oluşturulur.
Admin başvuruyu inceler.
Admin onaylarsa:
Mevcut Business’a bağlanır veya yeni Business oluşturulur.
PlaceReference.claimedBusinessId = business.id
PlaceReference.status = CLAIMED
Business.googlePlaceId = PlaceReference.providerPlaceId
Business.ownershipStatus = CLAIMED
BusinessMembership(userId, businessId, OWNER, ACTIVE) oluşturulur.
Siyah marker kaybolur.
Aynı işletme yeşil INTERNAL marker olarak görünür.
Sahipsiz Business Claim

Akış:

Kullanıcı sahipsiz Business(UNCLAIMED) için sahiplenme başvurusu açar.
BusinessClaimRequest(businessId, userId, status = PENDING) oluşturulur.
Admin onaylarsa:
Business.ownershipStatus = CLAIMED
BusinessMembership(userId, businessId, OWNER, ACTIVE) oluşturulur.
Kullanıcı owner dashboard’dan işletmesini yönetebilir.
Claim Reddi

Admin reddederse:

BusinessClaimRequest.status = REJECTED
rejectionReason kaydedilir.
PlaceReference veya Business claim state uygun şekilde geri alınır.
Kullanıcıya uygun bildirim gösterilir, mevcut bildirim sistemi varsa kullanılır.
Phase 7 Testleri
Kullanıcı PlaceReference claim açabilir.
Kullanıcı sahipsiz Business claim açabilir.
Aynı hedef için duplicate pending claim engellenir.
Admin claim onaylayınca membership oluşur.
Admin claim reddedince status REJECTED olur.
Claim onayı sonrası marker siyah yerine yeşil olur.
Phase 8: Owner Dashboard Permissions

Bu fazda işletme sahibinin yalnızca kendi işletmesini yönetebilmesi sağlanacaktır.

Yetki Kuralı

Bir kullanıcı bir işletmeyi yönetebilmek için şu koşulu sağlamalıdır:

BusinessMembership.userId === currentUser.id
BusinessMembership.businessId === targetBusiness.id
BusinessMembership.status === "ACTIVE"
BusinessMembership.role in ["OWNER", "MANAGER"]

STAFF rolü için yetkiler daha sınırlı tutulabilir.

Owner Görebilir
Kendi işletmeleri
Hizmetler
Fiyatlar
Çalışma saatleri
Personel
Randevular
Medya
İşletme profil bilgileri
Owner Göremez
Başka işletmeler
PlaceReference yönetimi
Google API ayarları
Admin onay ekranları
Platform genel ayarları
Başka işletmelerin randevuları
Phase 8 Testleri
Owner yalnızca kendi işletmesini görür.
Owner başka işletmeye erişemez.
Owner başka işletmeye erişmeye çalışırsa yetki hatası alır.
Admin tüm işletmeleri görebilir.
OWNER/MANAGER yetkileri çalışır.
STAFF rolü sınırlı kalır, mevcut ürün kuralına göre düzenlenir.
Phase 9: UI Copy and Marker Behavior
Marker Renkleri
INTERNAL / bookable: yeşil
GOOGLE / external: siyah
INTERNAL Marker Panel

Gösterilecek aksiyonlar:

Profili gör
Randevu al
Hizmetleri gör, mevcutsa
Yol tarifi, mevcutsa
GOOGLE Marker Panel

Gösterilecek aksiyonlar:

Google Maps’te aç
Bu işletme sizin mi?
Fersha’ya/UrGlowUp’a katıl

GOOGLE marker panelinde randevu CTA gösterilmemelidir.

Marka Kuralı

Repo markası UrGlowUp, kullanıcı tarafındaki marka Fersha olabilir. UI kopyalarında tek marka kullanılmalıdır. Kod yazmadan önce mevcut uygulama markası kontrol edilmeli ve CTA metinleri ona göre yazılmalıdır.

Phase 10: Test, Build and Verification

Her faz sonunda uygun komutlar çalıştırılmalıdır. Projedeki package manager ve script isimleri kontrol edilmelidir.

Örnek komutlar:

pnpm lint
pnpm typecheck
pnpm test
pnpm build

Eğer proje npm veya yarn kullanıyorsa eşdeğer komutlar kullanılmalıdır.

Genel Kabul Kriterleri
Mevcut harita bozulmaz.
INTERNAL işletmeler yeşil marker olarak görünür.
GOOGLE referanslar sadece admin onayından sonra siyah marker olarak görünür.
GOOGLE referanslarda randevu CTA yoktur.
Claimed PlaceReference siyah marker olarak görünmez.
Eşleşmiş Business yeşil INTERNAL marker olarak görünür.
Admin manuel Business oluşturabilir.
Admin Business owner atayabilir.
İşletme sahibi claim başvurusu açabilir.
Admin claim onaylayabilir/reddedebilir.
Claim onayı sonrası BusinessMembership oluşur.
Owner yalnızca kendi işletmesini yönetebilir.
Google native içerikler Business veya PlaceReference tablosuna kalıcı otomatik kopyalanmaz.
Google raw payload DB’ye yazılmaz.
Google reviews/photos native tablolara yazılmaz.
Google attribution UI’da görünür kalır.
Google API hatasında INTERNAL işletmeler haritada görünmeye devam eder.
Uygulama Sırası

Tüm sistemi tek seferde büyük değişiklik olarak uygulama. Fazları sırayla uygula.

Önerilen sıra:

Phase 0: Kod analizi
Phase 1: Mevcut harita response ve marker yapısını hazırla
Phase 2: Prisma data model
Phase 3: Admin PlaceReference Queue
Phase 4: Admin Business Management
Phase 5: Google Places server-side integration
Phase 6: Unified Map Query
Phase 7: Claim Flow
Phase 8: Owner Dashboard Permissions
Phase 9: UI copy and marker behavior
Phase 10: Test, build and verification

Her faz sonunda:

Değiştirilen dosyaları raporla.
Çalıştırılan komutları raporla.
Başarısız test/build varsa açıkça belirt.
Bir sonraki faza geçmeden önce mevcut davranışın bozulmadığını doğrula.
Uygulama Notları
Mevcut mimariyle çakışan model varsa yeni model eklemeden önce mevcut modeli genişlet.
Büyük refactor yapmaktan kaçın.
Mevcut route, server action, tRPC veya API pattern’i neyse ona uy.
Client tarafına server secret sızdırma.
Google Places API key’i client bundle’a sokma.
Google kaynaklı verileri native veri gibi kalıcılaştırma.
Otomatik merge yapma.
Otomatik publish yapma.
Admin onayı olmadan GOOGLE marker gösterme.
Kullanıcıya randevu alınamayan GOOGLE işletmelerde randevu butonu gösterme.
Policy regression testlerini ihmal etme.
İlk Claude Code Görevi

Önce sadece Phase 0 ve Phase 1’i uygula.

Beklenen çıktı:

Mevcut kod yapısı analizi.
Mevcut map query ve map component değişiklikleri.
INTERNAL işletmeler için MapPlace normalization.
Yeşil marker davranışı.
Google Places entegrasyonu eklenmeden mevcut haritanın çalışması.
Test/build/typecheck sonucu.
Sonraki fazda yapılacak migration planı.

Google Places, PlaceReference, admin queue, BusinessClaimRequest ve claim flow henüz uygulanmamalıdır. Bunlar sonraki fazlarda eklenecektir.