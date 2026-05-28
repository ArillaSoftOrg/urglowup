import Link from "next/link";
import { COOKIE_REGISTRY } from "@/lib/cookie-inventory";
import type { CookieCategory } from "@/lib/cookie-inventory";

export const metadata = {
  title: "Çerez Politikası",
};

// Turkish labels for categories on this page
const TR_CATEGORY_LABELS: Record<CookieCategory, string> = {
  necessary: "Zorunlu",
  preference: "Tercih",
  analytics: "Analitik",
  marketing: "Pazarlama",
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1>Çerez Politikası</h1>
          <p className="text-sm text-muted-foreground">
            Son güncelleme: Mayıs 2026 · Sürüm 2026-05
          </p>
        </div>

        <section className="space-y-3">
          <h2>1. Çerezler Nedir?</h2>
          <p className="text-sm text-muted-foreground">
            Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınız tarafından cihazınıza
            kaydedilen küçük metin dosyalarıdır. Oturumunuzu açık tutmak, dil tercihlerinizi
            hatırlamak ve platformun temel işlevlerini yerine getirmek için kullanılırlar.
          </p>
        </section>

        <section className="space-y-3">
          <h2>2. Kullandığımız Çerezler</h2>
          <p className="text-sm text-muted-foreground">
            UrGlowUp olarak yalnızca aşağıda listelenen çerezleri kullanmaktayız. Şu an için
            üçüncü taraf reklam veya izleme çerezleri kullanmıyoruz.
          </p>

          {/* Desktop table — driven by COOKIE_REGISTRY to stay in sync with implementation */}
          <div className="hidden overflow-x-auto rounded-xl border border-border/60 sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold">Çerez Adı</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Tür</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Amaç</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Süre</th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_REGISTRY.map((cookie) => (
                  <tr
                    key={cookie.name}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-3 align-top">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {cookie.name}
                      </code>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CategoryBadge category={cookie.category} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground align-top">
                      {cookie.purpose}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap align-top">
                      {cookie.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 sm:hidden">
            {COOKIE_REGISTRY.map((cookie) => (
              <div
                key={cookie.name}
                className="rounded-xl border border-border/60 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    {cookie.name}
                  </code>
                  <CategoryBadge category={cookie.category} />
                </div>
                <p className="text-xs text-muted-foreground">{cookie.purpose}</p>
                <p className="text-xs text-muted-foreground/70">
                  Süre: {cookie.duration}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2>3. Google Maps</h2>
          <p className="text-sm text-muted-foreground">
            İşletme profil sayfalarında konum gösterimi için Google Maps JavaScript API
            yüklenmektedir. Bu API, Google LLC tarafından sağlanmakta olup yüklendiğinde
            Google&#39;ın kendi çerez ve izleme teknolojileri devreye girebilir. Bu çerezler
            Google&#39;ın kontrolündedir ve UrGlowUp tarafından yönetilemez. Google&#39;ın çerez
            uygulamaları hakkında bilgi almak için{" "}
            <a
              href="https://policies.google.com/technologies/cookies"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Google Çerez Politikası
            </a>
            &#39;nı inceleyebilirsiniz.
          </p>
        </section>

        <section className="space-y-3">
          <h2>4. Analitik ve İzleme</h2>
          <p className="text-sm text-muted-foreground">
            UrGlowUp şu an için Google Analytics, Meta Pixel veya benzeri üçüncü taraf
            analitik ve izleme araçları kullanmamaktadır. Analitik rıza seçeneği hesap
            ayarlarınızda mevcuttur; ilerleyen dönemde anonim analitik özelliği eklenirse
            bu politika güncellenerek ve sürüm numarası artırılarak bildirilecektir.
          </p>
        </section>

        <section className="space-y-3">
          <h2>5. Çerez Tercihlerinizi Yönetme</h2>
          <p className="text-sm text-muted-foreground">
            Çerez tercihlerinizi değiştirmek için aşağıdaki yöntemlerden birini
            kullanabilirsiniz:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="font-medium text-foreground">Çerez banner&#39;ı:</strong>{" "}
              Sayfanın altında görüntülenen çerez bildiriminde tercihlerinizi
              ayarlayabilirsiniz. Sayfanın alt kısmındaki{" "}
              <strong className="font-medium text-foreground">Çerez Ayarları</strong>{" "}
              bağlantısına tıklayarak bu bildirimi her zaman yeniden açabilirsiniz.
            </li>
            <li>
              <strong className="font-medium text-foreground">Hesap ayarları:</strong>{" "}
              Giriş yapmış kullanıcılar{" "}
              <Link
                href="/account/settings"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Hesap Ayarları
              </Link>{" "}
              sayfasından kişiselleştirme, analitik ve pazarlama rızalarını ayrı ayrı
              yönetebilir.
            </li>
            <li>
              <strong className="font-medium text-foreground">Tarayıcı ayarları:</strong>{" "}
              Tarayıcınızın ayarlarından çerezleri engelleyebilir veya temizleyebilirsiniz.
              Zorunlu çerezlerin engellenmesi durumunda giriş yapma ve randevu gibi temel
              özellikler çalışmayabilir.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2>6. Politika Değişiklikleri</h2>
          <p className="text-sm text-muted-foreground">
            Bu politikada yapılacak önemli değişiklikler güncelleme tarihi ve sürüm numarası
            değiştirilerek duyurulacaktır. Oturum açmış kullanıcılara bir sonraki ziyaretlerinde
            bildirim gösterilecektir. Güncel sürüm:{" "}
            <strong className="font-medium text-foreground">2026-05</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}

// ── Category badge ────────────────────────────────────────────────────────────

const CATEGORY_COLOURS: Record<CookieCategory, string> = {
  necessary:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  preference:
    "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  analytics:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  marketing:
    "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
};

function CategoryBadge({ category }: { category: CookieCategory }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOURS[category]}`}
    >
      {TR_CATEGORY_LABELS[category]}
    </span>
  );
}

