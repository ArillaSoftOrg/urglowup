"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Her yorum puana dahil edilir mi?",
    a: "Evet, tamamlanan her randevuya bağlı yorum hesaba katılır. Ancak yorumlar; güvenilirlik ağırlıkları ve güncellik etkisine göre farklı biçimde puanı etkiler. Şüpheli davranış tespit edilen yorumlar ayrıca incelemeye alınabilir.",
  },
  {
    q: "Eski yorumlar siliniyor mu?",
    a: "Hayır, silme yerine ağırlık azaltma tercih edilir. Geçmiş yorumlar hâlâ hesaba katılır; ancak yeni deneyimler çok daha güçlü etki taşıdığından son dönemdeki performans daha belirleyici olur.",
  },
  {
    q: "Yeni işletmeler neden hemen 10 puan görünmez?",
    a: "Çok az yorumla oluşan puanlar istatistiksel açıdan belirsizdir. Sistem, az yorumlu işletmelerin puanlarını platform ortalamasıyla dengeler. İşletme daha fazla gerçek randevu deneyimi kazandıkça bu denge kaldırılır ve puan kendi performansını daha güvenilir biçimde yansıtır.",
  },
  {
    q: "İşletmeler sahte yorumlara karşı nasıl korunur?",
    a: "Her yorum gerçek bir tamamlanmış randevuya bağlıdır; randevu doğrulaması olmadan yorum bırakılamaz. Bunun yanı sıra her kullanıcı hesabının güven ağırlığı ve şüpheli davranış sinyalleri sürekli izlenir. Sahte ya da manipülatif olduğu değerlendirilen yorumlar sistemden çıkarılır.",
  },
] as const;

export function PuanlamaFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-colors hover:text-brand-pink-foreground"
          >
            <span>{faq.q}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open === i && "rotate-180"
              )}
              strokeWidth={1.75}
            />
          </button>
          {open === i && (
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
              {faq.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
