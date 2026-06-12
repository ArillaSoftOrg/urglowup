"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ayşe K.",
    text: "Randevu saatlerimi toparlamak çok kolaylaştı. Müşterilerim de online rezervasyonu hemen benimsedi.",
  },
  {
    name: "Elif N.",
    text: "Gün içinde mesajlara yetişmek yerine takvimden her şeyi net görebiliyorum.",
  },
  {
    name: "Zeynep S.",
    text: "Yeni başladım ama daha ilk haftadan iş akışım daha düzenli hale geldi.",
  },
  {
    name: "Merve A.",
    text: "Müşterilerimin tekrar randevu alması çok daha pratik oldu. Bu kısım gerçekten işimi rahatlattı.",
  },
  {
    name: "Derya B.",
    text: "Takvim, hizmetler ve müşteri bilgileri tek yerde olunca gün sonunda daha az yoruluyorum.",
  },
  {
    name: "Seda L.",
    text: "Boş saatlerimi doldurmak ve gelen talepleri takip etmek artık daha kolay.",
  },
  {
    name: "Büşra N.",
    text: "Profilim daha profesyonel görünüyor. Müşterilerim randevu alırken daha güvende hissediyor.",
  },
  {
    name: "Gizem T.",
    text: "Hatırlatmalar sayesinde unutulan randevular azaldı. Benim için en büyük fark bu oldu.",
  },
  {
    name: "Nisa C.",
    text: "Kullanımı sade ve hızlı. Ekibim hiç zorlanmadan alıştı.",
  },
  {
    name: "Melis Y.",
    text: "Günlük yoğunlukta kontrol bende kalıyor. Hangi müşterim ne zaman geliyor hemen görüyorum.",
  },
  {
    name: "Ece H.",
    text: "Müşteri kayıtları ve randevular dağınık duruyordu ama şimdi çok daha temiz ilerliyor.",
  },
  {
    name: "Cansu E.",
    text: "Instagram'dan gelen talepleri kaçırmamak için iyi bir toparlayıcı oldu.",
  },
  {
    name: "Yağmur B.",
    text: "Randevu almak isteyenlere link gönderiyorum, gerisini sistem hallediyor.",
  },
  {
    name: "Selin N.",
    text: "Hizmetlerimi düzenlemek ve süreleri takip etmek çok daha rahat.",
  },
  {
    name: "İrem D.",
    text: "Müşterilerim fiyat ve uygun saatleri görünce daha hızlı karar veriyor.",
  },
  {
    name: "Lara S.",
    text: "Salon yoğunken bile kim ne istedi, hangi saat dolu, hepsi elimin altında.",
  },
  {
    name: "Eylül A.",
    text: "Basit ama işlevli. Gereksiz karmaşa yok, bu yüzden sevdim.",
  },
  {
    name: "Hazal P.",
    text: "Randevu öncesi iletişim daha düzenli oldu. Müşteri deneyimi daha iyi hissettiriyor.",
  },
  {
    name: "Aslı M.",
    text: "Kendi sayfamı paylaşmak güzel duruyor. Daha kurumsal bir izlenim veriyor.",
  },
  {
    name: "Nazlı G.",
    text: "Yeni müşterilerin beni bulması ve yaptığım işleri görmesi daha kolaylaştı.",
  },
  {
    name: "Beril C.",
    text: "Hangi hizmet daha çok talep ediliyor takip etmek iş planımı kolaylaştırdı.",
  },
  {
    name: "Mina Ö.",
    text: "Randevu almak isteyenlere tek tek saat yazmak zorunda kalmıyorum.",
  },
  {
    name: "Defne U.",
    text: "Hem benim için hem müşteriler için daha temiz bir sistem oldu.",
  },
  {
    name: "Tuana R.",
    text: "Şimdilik deneme amaçlı kullanıyorum ama ilk izlenimim çok iyi.",
  },
];

function normalizeOffset(offset: number, width: number) {
  if (width <= 0) {
    return offset;
  }

  return ((offset % width) + width) % width;
}

function TestimonialCard({
  name,
  text,
}: {
  name: string;
  text: string;
}) {
  return (
    <article className="flex h-56 w-[18rem] shrink-0 cursor-grab select-none flex-col justify-between rounded-lg border border-sky-100 bg-sky-50 p-5 shadow-xs active:cursor-grabbing md:h-52 md:w-[20rem]">
      <div>
        <div className="flex gap-1 text-foreground" aria-label="5 yıldız">
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
    <section className="bg-sky-50/45 py-14 md:py-20">
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
