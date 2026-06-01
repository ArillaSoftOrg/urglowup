import Link from "next/link";

export const metadata = {
  title: "KVKK Başvuru",
};

export default function KvkkBasvuruPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1>Veri Sahibi Başvurusu (KVKK)</h1>
          <p className="text-sm text-muted-foreground">
            6698 sayılı Kişisel Verilerin Korunması Kanunu&#39;nun 11. ve 13. maddeleri uyarınca
            kişisel verilerinize ilişkin haklarınızı kullanmak için bu sayfa üzerinden
            başvuru yapabilirsiniz.
          </p>
        </div>

        <section className="space-y-3">
          <h2>1. Başvuru Hakkınız</h2>
          <p className="text-sm text-muted-foreground">
            KVKK&#39;nın 11. maddesi kapsamında veri sorumlusuna başvurarak aşağıdaki haklarınızı
            kullanabilirsiniz:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Kanun&#39;da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
            <li>Düzeltme / silme / yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>İşlenen verilerin yalnızca otomatik sistemler aracılığıyla analizi nedeniyle aleyhinize çıkan sonuca itiraz etme</li>
            <li>Kanun&#39;a aykırı işleme sonucunda uğradığınız zararın giderilmesini talep etme</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>2. Başvuru Yöntemi</h2>
          <p className="text-sm text-muted-foreground">
            Başvurunuzu aşağıdaki yollardan biriyle iletebilirsiniz:
          </p>

          <div className="rounded-lg border border-border/60 p-4 space-y-1">
            <p className="text-sm font-medium">E-posta ile başvuru</p>
            <p className="text-sm text-muted-foreground">
              Konu satırına &quot;KVKK Başvurusu&quot; yazarak{" "}
              <a
                href="mailto:[OPERATOR: kvkk@urglowup.com]"
                className="underline underline-offset-4 hover:text-foreground"
              >
                [OPERATOR: kvkk@urglowup.com]
              </a>{" "}
              adresine e-posta gönderebilirsiniz.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 p-4 space-y-1">
            <p className="text-sm font-medium">Posta veya elden teslim ile başvuru</p>
            <p className="text-sm text-muted-foreground">
              Islak imzalı dilekçe ile veri sorumlusunun kayıtlı adresine başvurabilirsiniz:
              <br />
              <strong>[OPERATOR: Şirket adı ve adresi]</strong>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2>3. Başvuruda Bulunması Gereken Bilgiler</h2>
          <p className="text-sm text-muted-foreground">
            Başvurunuzun işleme alınabilmesi için lütfen aşağıdaki bilgileri ekleyin:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Ad, soyad</li>
            <li>Platforma kayıtlı e-posta adresi</li>
            <li>Kimlik doğrulama için TC kimlik numarası veya pasaport bilgisi (yalnızca talep türüne göre)</li>
            <li>Talep edilen hak (yukarıdaki listeden seçin)</li>
            <li>Varsa destekleyici belgeler</li>
            <li>Cevabın ulaştırılmasını istediğiniz iletişim tercihi</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>4. Yanıt Süresi</h2>
          <p className="text-sm text-muted-foreground">
            Başvurunuz, KVKK&#39;nın 13. maddesi uyarınca en geç{" "}
            <strong>30 (otuz) gün</strong> içinde yanıtlanır. Talebin niteliğine göre bu süre
            uzatılabilir; uzatma durumunda gerekçesiyle birlikte size bilgi verilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2>5. Başvuru Ücreti</h2>
          <p className="text-sm text-muted-foreground">
            Başvurular ücretsizdir. Ancak yanıtın on sayfadan fazla olması durumunda Kişisel
            Verileri Koruma Kurulu&#39;nun belirlediği tarife esas alınarak işlem başına ücret
            talep edilebilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2>6. Kurul&#39;a Şikayet Hakkı</h2>
          <p className="text-sm text-muted-foreground">
            Başvurunuzun reddedilmesi, verilen yanıtın yetersiz bulunması veya süresi
            içinde yanıt verilmemesi halinde Kişisel Verileri Koruma Kurulu&#39;na şikayette
            bulunabilirsiniz.{" "}
            <a
              href="https://www.kvkk.gov.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              kvkk.gov.tr
            </a>
          </p>
        </section>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-5 space-y-3">
          <p className="text-sm font-medium">Hesap ayarlarınızdan hızlı işlem</p>
          <p className="text-sm text-muted-foreground">
            Giriş yapmış kullanıcılar,{" "}
            <Link
              href="/account/settings"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Hesap Ayarları
            </Link>{" "}
            sayfasından kişiselleştirme, analitik ve pazarlama rızalarını anında geri
            alabilir; bu işlem için başvuru sürecini beklemek gerekmez.
          </p>
        </div>
      </div>
    </div>
  );
}
