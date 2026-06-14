import Image from "next/image";

const businessTypes = [
  {
    title: "Kuaför & Saç Salonu",
    image: "/business/suitable-hair.svg",
  },
  {
    title: "Kaş & Kirpik Stüdyosu",
    image: "/business/suitable-brow.svg",
  },
  {
    title: "Nail Salon",
    image: "/business/suitable-nail.svg",
  },
  {
    title: "Barber Shop",
    image: "/business/suitable-barber.svg",
  },
  {
    title: "Cilt Bakımı",
    image: "/business/suitable-skin.svg",
  },
  {
    title: "Spa & Masaj",
    image: "/business/suitable-spa.svg",
  },
  {
    title: "Lazer Epilasyon",
    image: "/business/suitable-skin.svg",
  },
  {
    title: "Makyaj Stüdyosu",
    image: "/business/suitable-brow.svg",
  },
];

const scrollingBusinessTypes = [...businessTypes, ...businessTypes];

export function ForBusinessSuitableSection() {
  return (
    <section className="overflow-hidden border-t bg-background px-4 py-16 md:py-24">
      <div className="container mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Her güzellik işletmesi için uygun
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Kuaförden nail salona, barber shop&apos;tan spa merkezine kadar tüm
            ekipler randevu, müşteri ve operasyonlarını UrGlowUp ile tek yerden
            yönetebilir.
          </p>
        </div>
      </div>

      <div className="business-suitable-mask mt-10 overflow-hidden md:mt-14">
        <div className="business-suitable-track flex w-max gap-5 pr-5">
          {scrollingBusinessTypes.map((type, index) => (
            <article
              className="group relative h-48 w-[78vw] max-w-[360px] shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border/70 sm:w-[330px] md:h-56 md:w-[380px]"
              key={`${type.title}-${index}`}
            >
              <Image
                src={type.image}
                alt=""
                fill
                sizes="(min-width: 768px) 380px, 78vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
              <h3 className="absolute bottom-5 left-5 right-5 text-xl font-bold tracking-normal text-white md:text-2xl">
                {type.title}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
