import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "UrGlowUp kullanım koşulları; platform kullanımı, randevu kuralları, işletme yükümlülükleri ve kullanıcı sorumluluklarını açıklar.",
  alternates: {
    canonical: "/kullanim-kosullari",
  },
};

export default function KullanimKosullariPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1>Kullanım Koşulları</h1>
          <p className="text-sm text-muted-foreground">Son güncelleme: Mayıs 2026</p>
        </div>

        <section className="space-y-3">
          <h2>1. Taraflar ve Kapsam</h2>
          <p className="text-sm text-muted-foreground">
            Bu Kullanım Koşulları, UrGlowUp platformunu (<strong>&quot;Platform&quot;</strong>) işleten{" "}
            <strong>[OPERATOR: Şirket adı]</strong> (<strong>&quot;UrGlowUp&quot;</strong>,{" "}
            <strong>&quot;biz&quot;</strong>) ile platformu kullanan bireysel kullanıcılar ve işletme
            sahipleri (<strong>&quot;Kullanıcı&quot;</strong>) arasındaki ilişkiyi düzenler.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>UrGlowUp bir aracı platformdur.</strong> Güzellik, bakım ve kişisel bakım
            alanındaki işletmelerle müşterileri buluşturan bir pazar yeri işlevi görür. UrGlowUp
            bu hizmetleri bizzat sunmaz; hizmet sözleşmesi müşteri ile işletme arasında kurulur.
          </p>
          <p className="text-sm text-muted-foreground">
            Platforma kayıt olarak veya platforma erişerek bu koşulları kabul etmiş olursunuz.
            Kabul etmiyorsanız platformu kullanmayınız.
          </p>
        </section>

        <section className="space-y-3">
          <h2>2. Hesap Oluşturma ve Güvenlik</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Kayıt için gerçek ve doğru bilgi vermeniz zorunludur.</li>
            <li>Hesap güvenliğinden (şifre yönetimi dahil) siz sorumlusunuz.</li>
            <li>Hesabınızda yetkisiz erişim tespit ettiğinizde derhal bize bildirin.</li>
            <li>Bir kişinin birden fazla müşteri hesabı veya bir kişinin birden fazla işletme hesabı açması yasaktır.</li>
            <li>Kayıt yaşı sınırı 18 veya ebeveyn/vasi onayı gerektiren ülkelerde platforma erişim kısıtlıdır.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>3. Randevu ve İptal Kuralları</h2>
          <p className="text-sm text-muted-foreground">
            UrGlowUp randevu taleplerini iletmekle sınırlıdır; onay, iptal ve ücret politikaları
            ilgili işletme tarafından belirlenir.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Randevu talebi, işletme sahibinin onayı olmadan kesinleşmez; onay ya da red
              bildirimi platforma kayıtlı iletişim yollarıyla iletilir.
            </li>
            <li>
              İptal veya değişiklik taleplerinde ilgili işletmenin iptal politikası geçerlidir.
              UrGlowUp bu süreçlerde oluşacak maddi kayıptan sorumlu tutulamaz.
            </li>
            <li>
              Platforma kaydedilen telefon numarası veya e-posta üzerinden bildirim almayı tercih
              ettiyseniz gönderilen bildirimleri almak sizin sorumluluğunuzdadır.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>4. Kullanıcı İçeriği</h2>
          <p className="text-sm text-muted-foreground">
            Platforma gönderdiğiniz inceleme, yorum veya medya içerikleri (<strong>&quot;İçerik&quot;</strong>)
            için aşağıdaki kurallar geçerlidir:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              İçeriğinizin fikri mülkiyet haklarına sahip olduğunuzu beyan edersiniz.
              Üçüncü kişilere ait görselleri veya metinleri izinsiz paylaşamazsınız.
            </li>
            <li>
              İçeriğinizi platformda göstermek, depolamak ve yedeklemek için UrGlowUp&#39;a
              telif ücreti gerektirmeyen, dünya genelinde geçerli bir lisans verirsiniz.
              Bu lisans hesabınızı kapattığınızda sona erer; ancak kanuni yükümlülükler
              kapsamında tutulan kopyalar için geçerli değildir.
            </li>
            <li>
              İncelemeler gerçek bir hizmet deneyimine dayanmalıdır. Yanıltıcı, sahte veya
              teşvik karşılığı yazılan incelemeler kaldırılır ve hesap askıya alınabilir.
            </li>
            <li>
              Yüklediğiniz medya dosyaları üçüncü taraf platform altyapısında saklanır;
              ayrıntılar için{" "}
              <Link
                href="/privacy-policy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Gizlilik Politikamızı
              </Link>{" "}
              inceleyin.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>5. İşletme Sahiplerinin Yükümlülükleri</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Profil bilgileri (hizmet listesi, fiyatlar, çalışma saatleri) doğru ve güncel tutulmalıdır.</li>
            <li>İşletme sahibi, kendi müşterileriyle ilgili kişisel verileri KVKK kapsamındaki
              yükümlülüklerine uygun olarak işlemekten sorumludur.</li>
            <li>Platform üzerinden elde edilen müşteri iletişim bilgileri yalnızca onaylanan
              randevular kapsamında kullanılabilir; başka amaçlarla kullanımı yasaktır.</li>
            <li>İşletmenin platform dışında kendi gizlilik politikası bulunması halinde bu
              durum müşterilere açıklanmalıdır.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>6. Yasaklı Davranışlar</h2>
          <p className="text-sm text-muted-foreground">Aşağıdaki eylemler kesinlikle yasaktır:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Sahte inceleme oluşturma, satın alma veya teşvik etme</li>
            <li>Başka bir kullanıcının kimliğine bürünme</li>
            <li>Platforma zarar verecek otomasyon araçları veya botu kullanma (scraping dahil)</li>
            <li>İstenmeyen ticari iletişim (spam) gönderme</li>
            <li>Rakip işletmelere yönelik kötü niyetli inceleme kampanyası yürütme</li>
            <li>Yasadışı, taciz edici, nefret söylemi içeren veya üçüncü taraf haklarını ihlal eden içerik paylaşma</li>
            <li>Platform güvenlik önlemlerini atlatmaya çalışma</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>7. Fikri Mülkiyet</h2>
          <p className="text-sm text-muted-foreground">
            Platform tasarımı, yazılımı, markası ve içeriği (kullanıcı tarafından oluşturulanlar
            hariç) UrGlowUp&#39;a aittir ve ticari marka, telif hakkı ve diğer fikri mülkiyet
            yasalarıyla korunmaktadır. Kişisel verileriniz size aittir; bu Koşullar&#39;ı veya
            Gizlilik Politikası&#39;nı aşan herhangi bir veri üzerinde hak iddia etmiyoruz.
          </p>
        </section>

        <section className="space-y-3">
          <h2>8. Sorumluluk Sınırlaması</h2>
          <p className="text-sm text-muted-foreground">
            UrGlowUp, sunulan hizmetlerin kalitesi, emniyeti veya uygunluğu konusunda garanti
            vermez. Platform, işletmeler ile müşteriler arasındaki teknik aracıdır; hizmet
            sözleşmesinden doğan anlaşmazlıklarda taraf değildir. Yürürlükteki tüketici
            koruma mevzuatı saklı kalmak kaydıyla UrGlowUp&#39;ın sorumluluğu, son 12 ay içinde
            ödenen abonelik ücretiyle sınırlıdır. UrGlowUp, sunucularının geçici olarak
            kullanılamamasından kaynaklanan dolaylı zararlardan sorumlu değildir.
          </p>
        </section>

        <section className="space-y-3">
          <h2>9. Hesap Askıya Alma ve Sonlandırma</h2>
          <p className="text-sm text-muted-foreground">
            UrGlowUp, bu Koşullar&#39;ı ihlal ettiği tespit edilen hesapları önceden bildirimde
            bulunmaksızın askıya alabilir veya silebilir. Hizmet içi prosedürleri tüketen
            kullanıcılar UrGlowUp&#39;a{" "}
            <a
              href="mailto:[OPERATOR: destek@urglowup.com]"
              className="underline underline-offset-4 hover:text-foreground"
            >
              [OPERATOR: destek@urglowup.com]
            </a>{" "}
            adresinden itirazda bulunabilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2>10. Değişiklikler</h2>
          <p className="text-sm text-muted-foreground">
            Bu Koşullar değiştirildiğinde güncelleme tarihi sayfanın üstünde belirtilir ve
            mevcut kullanıcılar e-posta ile bilgilendirilir. Değişikliklerin yayınlanmasından
            sonra platformu kullanmaya devam etmek yeni Koşullar&#39;ı kabul anlamına gelir.
          </p>
        </section>

        <section className="space-y-3">
          <h2>11. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</h2>
          <p className="text-sm text-muted-foreground">
            Bu Koşullar Türk hukukuna tabidir.{" "}
            <strong>[OPERATOR: İstanbul Tüketici Hakem Heyeti / Mahkemeleri — yetki adresi doğrulanacak.]</strong>{" "}
            Tüketici sıfatıyla hareket eden kullanıcılar, ikamet ettikleri yer mahkemelerinde
            de dava açabilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2>12. İletişim</h2>
          <p className="text-sm text-muted-foreground">
            Bu Koşullar hakkındaki sorularınız için:{" "}
            <a
              href="mailto:[OPERATOR: destek@urglowup.com]"
              className="underline underline-offset-4 hover:text-foreground"
            >
              [OPERATOR: destek@urglowup.com]
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
