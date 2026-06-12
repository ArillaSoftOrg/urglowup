import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ayse K.",
    text: "Randevu saatlerimi toparlamak cok kolaylasti. Musterilerim de online rezervasyonu hemen benimsedi.",
  },
  {
    name: "Elifnur",
    text: "Gun icinde mesajlara yetismek yerine takvimden her seyi net gorebiliyorum.",
  },
  {
    name: "Zeynep_Studio",
    text: "Yeni basladim ama daha ilk haftadan is akisim daha duzenli hale geldi.",
  },
  {
    name: "Merve A.",
    text: "Musterilerimin tekrar randevu almasi cok daha pratik oldu. Bu kisim gercekten isimi rahatlatti.",
  },
  {
    name: "DeryaBeauty",
    text: "Takvim, hizmetler ve musteri bilgileri tek yerde olunca gun sonunda daha az yoruluyorum.",
  },
  {
    name: "Seda_lash",
    text: "Bos saatlerimi doldurmak ve gelen talepleri takip etmek artik daha kolay.",
  },
  {
    name: "Buse N.",
    text: "Profilim daha profesyonel gorunuyor. Musterilerim randevu alirken daha guvende hissediyor.",
  },
  {
    name: "Gizem",
    text: "Hatirlatmalar sayesinde unutulan randevular azaldi. Benim icin en buyuk fark bu oldu.",
  },
  {
    name: "NisaCare",
    text: "Kullanimi sade ve hizli. Ekibim hic zorlanmadan alisti.",
  },
  {
    name: "Melis_35",
    text: "Gunluk yogunlukta kontrol bende kaliyor. Hangi musterim ne zaman geliyor hemen goruyorum.",
  },
  {
    name: "Ece Hair",
    text: "Musteri kayitlari ve randevular daginik durmuyordu ama simdi cok daha temiz ilerliyor.",
  },
  {
    name: "Cansu",
    text: "Instagramdan gelen talepleri kacirmamak icin iyi bir toparlayici oldu.",
  },
  {
    name: "Yagmur B.",
    text: "Randevu almak isteyenlere link gonderiyorum, gerisini sistem hallediyor.",
  },
  {
    name: "SelinNails",
    text: "Hizmetlerimi duzenlemek ve sureleri takip etmek cok daha rahat.",
  },
  {
    name: "Irem",
    text: "Musterilerim fiyat ve uygun saatleri gorunce daha hizli karar veriyor.",
  },
  {
    name: "Lara Skin",
    text: "Salon yogunken bile kim ne istedi, hangi saat dolu, hepsi elimin altinda.",
  },
  {
    name: "Eylul",
    text: "Basit ama islevli. Gereksiz karmasa yok, bu yuzden sevdim.",
  },
  {
    name: "Hazal_Pro",
    text: "Randevu oncesi iletisim daha duzenli oldu. Musteri deneyimi daha iyi hissettiriyor.",
  },
  {
    name: "Asli",
    text: "Kendi sayfami paylasmak guzel duruyor. Daha kurumsal bir izlenim veriyor.",
  },
  {
    name: "NazliBeauty",
    text: "Yeni musterilerin beni bulmasi ve yaptigim isleri gormesi daha kolaylasti.",
  },
  {
    name: "Beril",
    text: "Hangi hizmet daha cok talep ediliyor takip etmek is planimi kolaylastirdi.",
  },
  {
    name: "Mina",
    text: "Randevu almak isteyenlere tek tek saat yazmak zorunda kalmiyorum.",
  },
  {
    name: "Defne Studio",
    text: "Hem benim icin hem musteriler icin daha temiz bir sistem oldu.",
  },
  {
    name: "Tuana",
    text: "Simdilik deneme amacli kullaniyorum ama ilk izlenimim cok iyi.",
  },
];

function TestimonialCard({
  name,
  text,
}: {
  name: string;
  text: string;
}) {
  return (
    <article className="flex h-56 w-[18rem] shrink-0 flex-col justify-between rounded-lg border border-border/70 bg-card p-5 shadow-xs md:h-52 md:w-[20rem]">
      <div>
        <div className="flex gap-1 text-foreground" aria-label="5 yildiz">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className="h-4 w-4 fill-current"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="mt-4 text-base font-medium leading-snug text-foreground">
          {text}
        </p>
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{name}</p>
    </article>
  );
}

function TestimonialRow({
  items,
  reverse = false,
}: {
  items: typeof testimonials;
  reverse?: boolean;
}) {
  const repeatedItems = [...items, ...items];

  return (
    <div className="home-testimonials-mask overflow-hidden">
      <div
        className={[
          "home-testimonials-track flex w-max gap-4 py-2",
          reverse ? "home-testimonials-track-reverse" : "",
        ].join(" ")}
      >
        {repeatedItems.map((testimonial, index) => (
          <div key={`${testimonial.name}-${index}`} aria-hidden={index >= items.length}>
            <TestimonialCard name={testimonial.name} text={testimonial.text} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeTestimonialsMarquee() {
  const firstRow = testimonials.slice(0, 12);
  const secondRow = testimonials.slice(12);

  return (
    <section className="bg-background py-14 md:py-20">
      <div className="mx-auto mb-8 max-w-6xl px-4 text-center md:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Yorumlar
        </p>
        <h2 className="mx-auto mt-2 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.015em] md:text-5xl">
          Güzellik profesyonelleri UrGlowUp deneyimini seviyor
        </h2>
      </div>
      <div className="space-y-2">
        <TestimonialRow items={firstRow} />
        <TestimonialRow items={secondRow} reverse />
      </div>
    </section>
  );
}
