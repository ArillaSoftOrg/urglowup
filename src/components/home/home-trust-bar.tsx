const stats = [
  { value: "500+", label: "Kayıtlı Uzman" },
  { value: "12.000+", label: "Alınan Randevu" },
  { value: "4.8 / 5", label: "Ortalama Değerlendirme" },
  { value: "%100", label: "Doğrulanmış Yorum" },
] as const;

export function HomeTrustBar() {
  return (
    <section className="bg-surface-cream px-4 py-7 md:py-9">
      <div className="mx-auto max-w-5xl">
        {/* TODO: replace hardcoded stats with real data when queries are available */}
        <dl className="grid grid-cols-2 gap-y-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-border/50">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 px-4 text-center"
            >
              <dt className="text-xl font-bold tracking-[-0.02em] text-foreground md:text-2xl">
                {value}
              </dt>
              <dd className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
