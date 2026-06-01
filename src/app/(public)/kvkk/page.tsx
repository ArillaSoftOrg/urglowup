import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description:
    "UrGlowUp KVKK aydınlatma metni; kişisel verilerin işlenme amaçlarını, hukuki sebeplerini, aktarım süreçlerini ve KVKK haklarını açıklar.",
  alternates: {
    canonical: "/kvkk",
  },
};

export default function KvkkPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1>KVKK Aydınlatma Metni</h1>
          <p className="text-sm text-muted-foreground">Son güncelleme: Mayıs 2026</p>
          <p className="text-sm text-muted-foreground">
            6698 sayılı Kişisel Verilerin Korunması Kanunu&#39;nun 10. maddesi uyarınca
            hazırlanmıştır.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/10">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong>Not:</strong> Bu metin, KVKK md. 10 kapsamındaki bilgilendirme (aydınlatma)
            yükümlülüğünü karşılamak üzere hazırlanmıştır. Hesap ayarlarındaki rıza seçenekleri
            ayrı bir işlem olup bu metinden bağımsızdır.
          </p>
        </div>

        <section className="space-y-3">
          <h2>1. Veri Sorumlusunun Kimliği</h2>
          <p className="text-sm text-muted-foreground">
            <strong>[OPERATOR: Şirket adı]</strong>
            <br />
            Adres: <strong>[OPERATOR: Kayıtlı adres]</strong>
            <br />
            E-posta:{" "}
            <a
              href="mailto:[OPERATOR: kvkk@urglowup.com]"
              className="underline underline-offset-4 hover:text-foreground"
            >
              [OPERATOR: kvkk@urglowup.com]
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2>2. İşlenen Kişisel Veri Kategorileri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium">Kategori</th>
                  <th className="pb-2 font-medium">Veriler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Kimlik</td>
                  <td className="py-2">Ad, soyad</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">İletişim</td>
                  <td className="py-2">E-posta adresi, telefon numarası (isteğe bağlı)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Görsel / İşitsel</td>
                  <td className="py-2">Profil fotoğrafı (isteğe bağlı); işletme logosu, kapak ve portfolio görselleri</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Konum</td>
                  <td className="py-2">İşletme adresi, şehir, ilçe, coğrafi koordinatlar (işletme sahipleri)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">İşlem Güvenliği</td>
                  <td className="py-2">IP adresi, tarayıcı bilgileri (user-agent), oturum belirteci</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Müşteri İşlemi</td>
                  <td className="py-2">Randevu bilgileri (hizmet, tarih, saat, notlar), inceleme ve derecelendirmeler</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Pazarlama</td>
                  <td className="py-2">İletişim tercihleri, rıza zaman damgaları (açık rıza verilmesi durumunda)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Davranışsal</td>
                  <td className="py-2">Kaydedilen içerikler ve rezervasyonlara dayalı ilgi alanı profili (yalnızca kişiselleştirme rızası verilmesi durumunda)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2>3. Kişisel Veri İşleme Amaçları</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Kullanıcı hesabının oluşturulması ve yönetilmesi</li>
            <li>Randevu taleplerinin işlenmesi ve yönetimi</li>
            <li>İşletme profillerinin oluşturulması ve yayınlanması</li>
            <li>E-posta ve WhatsApp ile randevu bildirimleri gönderilmesi</li>
            <li>Herkese açık profillerde inceleme ve derecelendirme gösterimi</li>
            <li>Platform güvenliğinin sağlanması ve dolandırıcılığın önlenmesi</li>
            <li>Rıza verilmesi halinde Keşfet akışının kişiselleştirilmesi</li>
            <li>Rıza verilmesi halinde anonim platform analizi</li>
            <li>Rıza verilmesi halinde pazarlama iletişimi</li>
            <li>KVKK ve GDPR kapsamındaki yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>4. Kişisel Verilerin Aktarıldığı Taraflar ve Amaçlar</h2>

          <h3 className="text-base font-medium">Yurt İçi Aktarımlar</h3>
          <p className="text-sm text-muted-foreground">
            Randevu bilgileri (ad, telefon, hizmet, tarih, müşteri notu) randevu alınan
            işletme sahibiyle paylaşılır. Herkese açık profil bilgileri (ad, avatar, inceleme)
            tüm platform kullanıcılarına görüntülenir.
          </p>

          <h3 className="text-base font-medium">Yurt Dışı Aktarımlar</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium">Alıcı</th>
                  <th className="pb-2 pr-4 font-medium">Ülke</th>
                  <th className="pb-2 font-medium">Amaç</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                <tr>
                  <td className="py-2 pr-4">Cloudinary, Inc.</td>
                  <td className="py-2 pr-4">ABD</td>
                  <td className="py-2">Medya depolama ve dağıtımı</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Resend, Inc.</td>
                  <td className="py-2 pr-4">ABD</td>
                  <td className="py-2">İşlemsel e-posta gönderimi</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Meta Platforms (WhatsApp)</td>
                  <td className="py-2 pr-4">ABD</td>
                  <td className="py-2">Randevu WhatsApp bildirimi (tercih edilmişse)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Google LLC</td>
                  <td className="py-2 pr-4">ABD</td>
                  <td className="py-2">Kimlik doğrulama, harita, adres geocoding, GBP entegrasyonu</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Bu aktarımlar KVKK&#39;nın 9. maddesi kapsamındaki yurt dışı veri aktarımı
            niteliğindedir.{" "}
            <strong>
              [OPERATOR: SCCs veya Kurul onaylı taahhütname durumu doğrulanacak.]
            </strong>
          </p>
        </section>

        <section className="space-y-3">
          <h2>5. Veri Toplama Yöntemi ve Hukuki Sebep</h2>
          <p className="text-sm text-muted-foreground">
            Kişisel verileriniz web formu aracılığıyla doğrudan, Google OAuth protokolüyle
            kimlik sağlayıcısından ve platform kullanımınız sırasında otomatik olarak
            toplanmaktadır.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium">İşleme Amacı</th>
                  <th className="pb-2 font-medium">Hukuki Sebep (KVKK md. 5)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                <tr>
                  <td className="py-2 pr-4">Hesap ve randevu yönetimi</td>
                  <td className="py-2">Sözleşmenin ifası (md. 5/2-c)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Güvenlik ve denetim</td>
                  <td className="py-2">Meşru menfaat (md. 5/2-f)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Kişiselleştirme, analitik, pazarlama</td>
                  <td className="py-2">Açık rıza (md. 5/1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2>6. Veri Sahibi Hakları (KVKK md. 11)</h2>
          <p className="text-sm text-muted-foreground">
            Veri sorumlusuna başvurarak aşağıdaki haklarınızı kullanabilirsiniz:
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Kanun&#39;da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
            <li>Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>İşlenen verilerin münhasıran otomatik sistemler aracılığıyla analizi nedeniyle aleyhinize sonuç çıkmasına itiraz etme</li>
            <li>Kanun&#39;a aykırı işleme sonucunda zarara uğramanız halinde zararın giderilmesini talep etme</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Başvurunuzu{" "}
            <Link
              href="/kvkk-basvuru"
              className="underline underline-offset-4 hover:text-foreground"
            >
              KVKK Başvuru sayfamızdan
            </Link>{" "}
            iletebilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
