import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1>Gizlilik Politikası</h1>
          <p className="text-sm text-muted-foreground">Son güncelleme: Mayıs 2026</p>
        </div>

        <section className="space-y-3">
          <h2>1. Veri Sorumlusu</h2>
          <p className="text-sm text-muted-foreground">
            Bu politika kapsamında kişisel verileriniz{" "}
            <strong>[OPERATOR: Şirket adı ve adresi eklenecek]</strong> tarafından
            6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği Genel
            Veri Koruma Tüzüğü (GDPR) çerçevesinde işlenmektedir. Veri sorumlusu iletişim
            adresi:{" "}
            <a
              href="mailto:[OPERATOR: gizlilik e-posta adresi]"
              className="underline underline-offset-4 hover:text-foreground"
            >
              [OPERATOR: gizlilik@urglowup.com]
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2>2. İşlenen Kişisel Veriler</h2>

          <h3 className="text-base font-medium">Hesap ve Kimlik Bilgileri</h3>
          <p className="text-sm text-muted-foreground">
            Kayıt sırasında ad, soyad, e-posta adresi, telefon numarası (isteğe bağlı),
            profil fotoğrafı (isteğe bağlı) ve hizmet adresi (isteğe bağlı) toplanır.
            Google ile giriş yapılması durumunda Google hesabınızdaki ad, e-posta adresi
            ve profil fotoğrafı OAuth protokolü aracılığıyla alınır; ham erişim
            belirteci (token) saklanmaz.
          </p>

          <h3 className="text-base font-medium">Randevu Bilgileri</h3>
          <p className="text-sm text-muted-foreground">
            Randevu talebinde bulunduğunuzda adınız, telefon numaranız, e-posta adresiniz,
            seçilen hizmet, talep edilen tarih ve saat ile randevuya ilişkin isteğe bağlı
            notlarınız işlenir. Bu bilgiler randevu yönetimi amacıyla ilgili işletme sahibiyle
            paylaşılır.
          </p>

          <h3 className="text-base font-medium">İşletme Profili Bilgileri</h3>
          <p className="text-sm text-muted-foreground">
            İşletme kaydı sırasında işletme adı, açıklama, telefon numarası, WhatsApp
            numarası, adres, şehir, ilçe, Instagram profil bağlantısı ve medya dosyaları
            (logo, kapak görseli, portfolio görselleri ve videoları) toplanır. Adres
            bilgileri, harita üzerinde gösterim amacıyla Google Geocoding API aracılığıyla
            coğrafi koordinatlara dönüştürülür.
          </p>

          <h3 className="text-base font-medium">İnceleme ve Derecelendirme Bilgileri</h3>
          <p className="text-sm text-muted-foreground">
            İnceleme gönderdiğinizde adınız, soyadınız, profil fotoğrafınız, derecelendirme
            puanınız ve yorumunuz herkese açık işletme profilinde görüntülenir. İncelemeler
            onay sürecine tabidir; yalnızca onaylanan incelemeler kamuya açık hale gelir.
          </p>

          <h3 className="text-base font-medium">Oturum ve Teknik Bilgiler</h3>
          <p className="text-sm text-muted-foreground">
            Giriş yaptığınızda oturum belirteci (session token), IP adresiniz ve tarayıcı
            bilgileriniz (user-agent) güvenlik amacıyla oturum kaydına eklenir. Oturumlar
            30 gün süreyle geçerlidir.
          </p>

          <h3 className="text-base font-medium">Tercihler ve Rıza Bilgileri</h3>
          <p className="text-sm text-muted-foreground">
            Hesap ayarları sayfasında verdiğiniz ya da geri aldığınız rızalar (kişiselleştirme,
            analitik, pazarlama) zaman damgası ve işlem türüyle birlikte kayıt altına alınır.
            Bu kayıtlar KVKK ve GDPR kapsamındaki hesap verebilirlik yükümlülüğü için tutulur.
            Kişiselleştirme rızası vermeniz durumunda kaydedilen içerikler, favoriler ve
            tamamlanan randevular esas alınarak Keşfet akışınız için ilgi alanı profili
            oluşturulur; bu veriler rıza geri alındığında silinir.
          </p>

          <h3 className="text-base font-medium">Google Business Profile Entegrasyonu</h3>
          <p className="text-sm text-muted-foreground">
            İşletme sahipleri, Google Business Profile hesaplarını platforma bağlayabilir.
            Bu entegrasyon kapsamında Google API erişim ve yenileme belirteçleri AES-256-GCM
            şifrelemesiyle veritabanında saklanır; ham belirteçler hiçbir zaman günlüklere
            yazılmaz veya istemciye döndürülmez. Google&#39;dan senkronize edilen yorum ve
            fotoğraflar, platform içi içeriklerle hiçbir şekilde birleştirilmez; Google
            ilişkilendirmesi korunur.
          </p>
        </section>

        <section className="space-y-3">
          <h2>3. İşleme Amaçları ve Hukuki Dayanaklar</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-muted-foreground">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-foreground">Amaç</th>
                  <th className="pb-2 pr-4 font-medium text-foreground">Hukuki Dayanak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="py-2 pr-4">Hesap oluşturma ve kimlik doğrulama</td>
                  <td className="py-2">Sözleşmenin ifası (KVKK md. 5/2-c)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Randevu yönetimi ve bildirimleri</td>
                  <td className="py-2">Sözleşmenin ifası (KVKK md. 5/2-c)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">İşletme profili yayınlama</td>
                  <td className="py-2">Sözleşmenin ifası (KVKK md. 5/2-c)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Güvenlik, dolandırıcılık önleme, denetim günlükleri</td>
                  <td className="py-2">Meşru menfaat (KVKK md. 5/2-f)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Keşfet akışı kişiselleştirmesi</td>
                  <td className="py-2">Açık rıza (KVKK md. 5/1)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Anonim platform analizi</td>
                  <td className="py-2">Açık rıza (KVKK md. 5/1)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Pazarlama iletişimi (e-posta / WhatsApp)</td>
                  <td className="py-2">Açık rıza (KVKK md. 5/1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2>4. Üçüncü Taraf Aktarımlar</h2>
          <p className="text-sm text-muted-foreground">
            Yalnızca hizmetin sunulması için gerekli olan durumlarda ve aşağıdaki üçüncü
            taraflarla sınırlı olmak kaydıyla verileriniz paylaşılır:
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 p-4 space-y-1">
              <p className="text-sm font-medium">Cloudinary, Inc. (ABD)</p>
              <p className="text-sm text-muted-foreground">
                İşletme profil fotoğrafları, logo, kapak görseli ve portfolio medyaları
                Cloudinary altyapısında saklanır ve iletilir. Cloudinary, GDPR Standard
                Contractual Clauses (SCC) kapsamında veri işlemektedir.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4 space-y-1">
              <p className="text-sm font-medium">Resend, Inc. (ABD)</p>
              <p className="text-sm text-muted-foreground">
                Randevu onayı, hatırlatıcı, iptal bildirimi ve e-posta doğrulama gibi işlemsel
                e-postalar Resend hizmeti aracılığıyla gönderilir. Gönderilen e-postaların içeriği
                alıcı e-posta adresi ve randevu bilgilerini kapsar.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4 space-y-1">
              <p className="text-sm font-medium">Meta Platforms, Inc. — WhatsApp Business Cloud API (ABD)</p>
              <p className="text-sm text-muted-foreground">
                WhatsApp bildirimini tercih eden kullanıcılara randevu onay mesajları Meta&#39;nın
                WhatsApp Business Cloud API&#39;si aracılığıyla gönderilir. Bu süreçte telefon
                numaranız, adınız, işletme adı, hizmet adı ile randevu tarih ve saati Meta&#39;nın
                ABD&#39;deki sunucularına iletilir. Meta&#39;ya yapılan bu aktarım, KVKK md. 9 kapsamında
                yurt dışı veri aktarımı niteliği taşır.{" "}
                <strong>
                  [OPERATOR: Meta ile DPA/SCC düzenlemesi yapılmış mı doğrulanmalıdır.]
                </strong>
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4 space-y-1">
              <p className="text-sm font-medium">Google LLC (ABD)</p>
              <p className="text-sm text-muted-foreground">
                Google hizmetleri üç farklı amaçla kullanılmaktadır: (1) Google ile Giriş Yap —
                kimlik doğrulama için e-posta ve görünen ad OAuth protokolüyle alınır; (2) Google
                Maps JavaScript API ve Geocoding API — işletme adreslerinin haritada gösterimi ve
                koordinatlara dönüştürülmesi için kullanılır, tarayıcınızda Google Maps kodu
                yüklenebilir; (3) Google Business Profile API — işletme sahiplerinin kendi
                entegrasyon ayarlarından bağladığı Google yorumlarını ve fotoğraflarını senkronize
                etmek amacıyla kullanılır.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2>5. Veri Saklama Süreleri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-muted-foreground">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-foreground">Veri Kategorisi</th>
                  <th className="pb-2 font-medium text-foreground">Saklama Süresi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="py-2 pr-4">Oturum (session) kayıtları</td>
                  <td className="py-2">30 gün</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Hesap bilgileri</td>
                  <td className="py-2">
                    Hesap aktif olduğu sürece; silme talebinden sonra{" "}
                    <strong>[OPERATOR: süre belirtilecek]</strong>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Randevu kayıtları</td>
                  <td className="py-2">
                    <strong>[OPERATOR: süre belirtilecek]</strong>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">İncelemeler</td>
                  <td className="py-2">
                    İşletme profili aktif olduğu sürece; silme talebinden sonra{" "}
                    <strong>[OPERATOR: süre belirtilecek]</strong>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Rıza denetim günlükleri</td>
                  <td className="py-2">
                    <strong>[OPERATOR: süre belirtilecek, KVKK uyumu için önerilir: 3 yıl]</strong>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">İşletme medya dosyaları</td>
                  <td className="py-2">İşletme aktif olduğu sürece veya silme talebine kadar</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Kişiselleştirme profili (affinity data)</td>
                  <td className="py-2">PERSONALIZATION rızası geri alındığında derhal silinir</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2>6. Veri Sahibi Hakları</h2>
          <p className="text-sm text-muted-foreground">
            KVKK&#39;nın 11. maddesi ve GDPR&#39;ın 15-22. maddeleri kapsamında aşağıdaki haklara
            sahipsiniz:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
            <li>Otomatik sistemlerle aleyhinize sonuç doğuran işlemlere itiraz etme</li>
            <li>Zararın giderilmesini talep etme</li>
            <li>Verilerin taşınabilirliğini talep etme (GDPR kapsamında)</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Haklarınızı kullanmak için{" "}
            <Link href="/kvkk-basvuru" className="underline underline-offset-4 hover:text-foreground">
              KVKK Başvuru sayfamızı
            </Link>{" "}
            ziyaret edin.
          </p>
        </section>

        <section className="space-y-3">
          <h2>7. Çerezler</h2>
          <p className="text-sm text-muted-foreground">
            Sitemizde kullanılan çerezlerin tam listesi ve yönetim seçenekleri için{" "}
            <Link href="/cookie-policy" className="underline underline-offset-4 hover:text-foreground">
              Çerez Politikamızı
            </Link>{" "}
            inceleyebilirsiniz.
          </p>
        </section>

        <section className="space-y-3">
          <h2>8. Politika Değişiklikleri</h2>
          <p className="text-sm text-muted-foreground">
            Bu politika değiştirildiğinde güncelleme tarihi sayfanın üstünde belirtilir.
            Önemli değişiklikler e-posta veya platform bildirimi aracılığıyla duyurulur.
            Değişiklikten sonra platformu kullanmaya devam etmeniz güncel politikayı
            kabul ettiğiniz anlamına gelir.
          </p>
        </section>

        <section className="space-y-3">
          <h2>9. İletişim</h2>
          <p className="text-sm text-muted-foreground">
            Gizlilik konularındaki soru ve talepleriniz için{" "}
            <a
              href="mailto:[OPERATOR: gizlilik e-posta adresi]"
              className="underline underline-offset-4 hover:text-foreground"
            >
              [OPERATOR: gizlilik@urglowup.com]
            </a>{" "}
            adresine yazabilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
