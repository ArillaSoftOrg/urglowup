"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Elif Y.",
    business: "Salon sahibi",
    text: "Randevu taleplerini tek panelde görmek ekibin gününü çok daha planlı hale getirdi.",
  },
  {
    name: "Merve K.",
    business: "Nail salon",
    text: "Müşteriler saatleri kendisi gördüğü için mesaj trafiğimiz ciddi şekilde azaldı.",
  },
  {
    name: "Selin A.",
    business: "Kuaför",
    text: "Hizmet sürelerini ve fiyatları düzenlemek çok pratik. Yeni müşteriler daha hızlı karar veriyor.",
  },
  {
    name: "Derya T.",
    business: "Cilt bakım stüdyosu",
    text: "Profil sayfamızı paylaşmak daha profesyonel görünüyor. Instagram'dan gelen talepler toparlandı.",
  },
  {
    name: "Buse N.",
    business: "Kaş & kirpik",
    text: "Boş saatleri doldurmak eskisine göre daha kolay. Takvim tarafı özellikle rahatlatıcı.",
  },
  {
    name: "Gizem S.",
    business: "Spa merkezi",
    text: "Müşteri notları ve randevu geçmişi elimizin altında olunca hizmet deneyimi daha tutarlı oldu.",
  },
  {
    name: "Ayşe D.",
    business: "Güzellik merkezi",
    text: "Yeni başlayan ekip arkadaşları bile paneli hızlıca kavradı. Gereksiz karmaşa yok.",
  },
  {
    name: "Nisa B.",
    business: "Lazer epilasyon",
    text: "Gün sonunda hangi hizmet ne kadar talep görmüş rahatça takip edebiliyoruz.",
  },
  {
    name: "İrem C.",
    business: "Makyaj stüdyosu",
    text: "Özel gün yoğunluklarında randevuları karıştırmadan yönetebilmek büyük fark yarattı.",
  },
  {
    name: "Hazal M.",
    business: "Barber shop",
    text: "Tekrarlı müşteriler için uygun saatleri paylaşmak çok daha hızlı hale geldi.",
  },
  {
    name: "Ece L.",
    business: "Saç tasarım",
    text: "Ekip takvimi daha görünür oldu. Kimin ne zaman müsait olduğunu anında görüyoruz.",
  },
  {
    name: "Tuğçe P.",
    business: "Wellness stüdyosu",
    text: "Randevu öncesi iletişim düzenlenince iptaller ve unutulan saatler azaldı.",
  },
  {
    name: "Melis R.",
    business: "Nail artist",
    text: "Portfolyo görselleri ve hizmet listesi aynı yerde olunca müşteriye anlatmak kolaylaştı.",
  },
  {
    name: "Aslı G.",
    business: "Hydrafacial uzmanı",
    text: "Müşteri bilgilerini notlarda tutmak yerine düzenli bir akışta görmek çok iyi.",
  },
  {
    name: "Cansu Ö.",
    business: "Güzellik salonu",
    text: "Yoğun günlerde bile panel sade kaldığı için ekibin temposu bozulmuyor.",
  },
  {
    name: "Zeynep U.",
    business: "Kaş tasarım",
    text: "Müşteriler hizmet detaylarını önceden gördüğü için randevu öncesi soru sayısı azaldı.",
  },
  {
    name: "Beril H.",
    business: "Masaj & spa",
    text: "Farklı hizmet sürelerini yönetmek eskiden zordu. Şimdi takvim çok daha net.",
  },
  {
    name: "Defne A.",
    business: "Kuaför",
    text: "Yeni müşteri taleplerini kaçırmadığımızı bilmek işletme tarafında güven veriyor.",
  },
  {
    name: "Yağmur E.",
    business: "Cilt bakım",
    text: "Randevular, müşteri geçmişi ve notlar aynı yerde olunca takip kolaylaşıyor.",
  },
  {
    name: "Lara İ.",
    business: "Nail salon",
    text: "Kampanya dönemlerinde uygun saatleri paylaşmak ve dönüş almak hızlandı.",
  },
  {
    name: "Seda Y.",
    business: "Güzellik merkezi",
    text: "Panel mobilde de rahat çalıştığı için salondayken bilgisayara bağlı kalmıyoruz.",
  },
  {
    name: "Nazlı F.",
    business: "Kirpik uzmanı",
    text: "Tek kişilik işletme olmama rağmen daha kurumsal görünmemi sağladı.",
  },
  {
    name: "Mina Ş.",
    business: "Saç & bakım",
    text: "Hizmetleri düzenli sunmak fiyat konuşmalarını ve randevu kararını hızlandırdı.",
  },
  {
    name: "Bahar V.",
    business: "Estetik bakım",
    text: "Müşteri deneyimini daha kontrollü yönetiyoruz. Küçük ama günlük işte fark eden detaylar var.",
  },
];

function normalizeOffset(offset: number, width: number) {
  if (width <= 0) {
    return offset;
  }

  return ((offset % width) + width) % width;
}

function BusinessTestimonialCard({
  name,
  business,
  text,
}: {
  name: string;
  business: string;
  text: string;
}) {
  return (
    <article className="flex h-60 w-[18rem] shrink-0 cursor-grab select-none flex-col justify-between rounded-lg border border-brand-purple/15 bg-card p-5 shadow-xs active:cursor-grabbing md:h-56 md:w-[20rem]">
      <div>
        <div className="flex gap-1 text-rating" aria-label="5 yıldız">
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
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{business}</p>
      </div>
    </article>
  );
}

function BusinessTestimonialRow({
  items,
  reverse = false,
}: {
  items: typeof testimonials;
  reverse?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rowWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const dragStartRef = useRef({ offset: 0, x: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const repeatedItems = [...items, ...items];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const updateWidth = () => {
      rowWidthRef.current = track.scrollWidth / 2;
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(track);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;

    const tick = (time: number) => {
      const previousTime = lastFrameRef.current ?? time;
      const delta = time - previousTime;
      const width = rowWidthRef.current;
      lastFrameRef.current = time;

      if (!isPaused && !isDragging && width > 0) {
        const direction = reverse ? 1 : -1;
        offsetRef.current = normalizeOffset(
          offsetRef.current + direction * delta * 0.035,
          width
        );
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [isDragging, isPaused, reverse]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      offset: offsetRef.current,
      x: event.clientX,
    };
    lastFrameRef.current = null;
    setIsPaused(true);
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    const width = rowWidthRef.current;
    const dragDistance = event.clientX - dragStartRef.current.x;
    offsetRef.current = normalizeOffset(
      dragStartRef.current.offset - dragDistance,
      width
    );
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    lastFrameRef.current = null;
    setIsDragging(false);
    setIsPaused(false);
  };

  return (
    <div
      className="home-testimonials-mask overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        if (!isDragging) {
          lastFrameRef.current = null;
          setIsPaused(false);
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      <div
        ref={trackRef}
        className="flex w-max touch-pan-y gap-4 py-2 will-change-transform"
      >
        {repeatedItems.map((testimonial, index) => (
          <div
            key={`${testimonial.name}-${index}`}
            aria-hidden={index >= items.length}
          >
            <BusinessTestimonialCard {...testimonial} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ForBusinessTestimonialsMarquee() {
  const firstRow = testimonials.slice(0, 12);
  const secondRow = testimonials.slice(12);

  return (
    <section className="border-t bg-[linear-gradient(180deg,oklch(0.99_0.004_300),oklch(0.97_0.018_315))] py-14 md:py-20">
      <div className="mx-auto mb-8 max-w-6xl px-4 text-center md:mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-purple-foreground">
          İşletmelerden gelenler
        </p>
        <h2 className="mx-auto mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
          Salon sahipleri UrGlowUp ile iş akışını daha rahat yönetiyor
        </h2>
      </div>
      <div className="space-y-2">
        <BusinessTestimonialRow items={firstRow} />
        <BusinessTestimonialRow items={secondRow} reverse />
      </div>
    </section>
  );
}
