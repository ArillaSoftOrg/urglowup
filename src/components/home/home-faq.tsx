const faqs = [
  {
    question: "UrGlowUp'a geçerken mevcut randevularım kaybolur mu?",
    answer:
      "Hayır. Mevcut randevularınızı, müşteri listenizi, hizmetlerinizi ve temel işletme bilgilerinizi birlikte düzenleyip yeni hesabınıza taşırız.",
  },
  {
    question: "Veri transferi gerçekten ücretsiz mi?",
    answer:
      "Evet. İşletmenizi UrGlowUp'a taşırken ilk kurulum ve temel veri aktarımı için ek ücret almayız.",
  },
  {
    question: "Müşterilerim randevu almak için uygulama indirmek zorunda mı?",
    answer:
      "Hayır. İşletme sayfanızdan uygun saatleri görebilir, web üzerinden kolayca randevu talebi oluşturabilirler.",
  },
  {
    question: "Tek kişi çalışıyorum, yine de kullanabilir miyim?",
    answer:
      "Evet. UrGlowUp tek uzmanlar, küçük stüdyolar ve ekipli salonlar için aynı sade takvim ve müşteri akışını sunar.",
  },
  {
    question: "Kredi kartı eklemeden başlayabilir miyim?",
    answer:
      "Evet. Hesap oluşturmak ve işletme panelinizi denemek için kredi kartı gerekmez.",
  },
] as const;

export function HomeFAQ() {
  return (
    <section className="bg-background px-4 py-14 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sıkça sorulan sorular
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
            Başlamadan önce aklınıza takılanlar
          </h2>
          <p className="mt-5 max-w-md text-base leading-8 text-muted-foreground">
            Kurulum, geçiş ve randevu akışıyla ilgili en çok sorulan soruları
            kısa cevaplarla toparladık.
          </p>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-lg font-semibold text-slate-950 marker:hidden">
                <span>{faq.question}</span>
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xl leading-none transition-colors duration-200 group-open:bg-slate-950 group-open:text-white"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
