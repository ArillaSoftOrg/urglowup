"use client";

import Link from "next/link";
import {
  CalendarPlus,
  CheckCheck,
  Clock3,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MessageFilter = "all" | "unread" | "appointment" | "followup" | "archived";

type CustomerMessage = {
  id: string;
  author: "customer" | "business";
  text: string;
  time: string;
};

type Conversation = {
  id: string;
  customerName: string;
  initials: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: "open" | "waiting" | "resolved" | "archived";
  tags: Array<"appointment" | "followup" | "pricing" | "care">;
  appointmentSummary: string;
  customerSince: string;
  totalAppointments: number;
  nextStep: string;
  messages: CustomerMessage[];
};

const filters: Array<{ id: MessageFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "unread", label: "Okunmamış" },
  { id: "appointment", label: "Randevu" },
  { id: "followup", label: "Takip" },
  { id: "archived", label: "Arşiv" },
];

const quickReplies = [
  "Randevunuzu onayladık. Sizi belirtilen saatte bekliyoruz.",
  "Konum ve ulaşım bilgisini hemen paylaşıyorum.",
  "İşlem sonrası bakım notlarını size iletiyorum.",
  "Uygun saatleri kontrol edip size dönüş yapıyorum.",
];

const conversations: Conversation[] = [
  {
    id: "ayse",
    customerName: "Ayşe Yılmaz",
    initials: "AY",
    lastMessage: "Cilt bakımı sonrası bugün makyaj yapabilir miyim?",
    lastMessageAt: "10:42",
    unreadCount: 2,
    status: "open",
    tags: ["care", "followup"],
    appointmentSummary: "Hydrafacial, bugün 14:30",
    customerSince: "Mart 2026",
    totalAppointments: 4,
    nextStep: "Bakım sonrası talimat gönder",
    messages: [
      {
        id: "ayse-1",
        author: "customer",
        text: "Merhaba, cilt bakımı sonrası bugün makyaj yapabilir miyim?",
        time: "10:38",
      },
      {
        id: "ayse-2",
        author: "customer",
        text: "Akşam bir davetim var, ona göre planlayacağım.",
        time: "10:42",
      },
    ],
  },
  {
    id: "deniz",
    customerName: "Deniz Aksoy",
    initials: "DA",
    lastMessage: "Yarın 16:00 yerine 17:30 uygun olur mu?",
    lastMessageAt: "09:18",
    unreadCount: 1,
    status: "waiting",
    tags: ["appointment"],
    appointmentSummary: "Kaş tasarımı, yarın 16:00",
    customerSince: "Ocak 2026",
    totalAppointments: 7,
    nextStep: "Randevu saatini güncelle",
    messages: [
      {
        id: "deniz-1",
        author: "business",
        text: "Yarınki kaş tasarımı randevunuz 16:00 için kayıtlı.",
        time: "09:05",
      },
      {
        id: "deniz-2",
        author: "customer",
        text: "Yarın 16:00 yerine 17:30 uygun olur mu?",
        time: "09:18",
      },
    ],
  },
  {
    id: "melis",
    customerName: "Melis Kaya",
    initials: "MK",
    lastMessage: "Paket fiyat bilgisini alabilir miyim?",
    lastMessageAt: "Dün",
    unreadCount: 0,
    status: "open",
    tags: ["pricing"],
    appointmentSummary: "Lazer danışmanlığı, randevu bekliyor",
    customerSince: "Haziran 2026",
    totalAppointments: 1,
    nextStep: "Fiyat ve paket açıklaması gönder",
    messages: [
      {
        id: "melis-1",
        author: "customer",
        text: "Merhaba, lazer için paket fiyat bilgisini alabilir miyim?",
        time: "18:21",
      },
      {
        id: "melis-2",
        author: "business",
        text: "Tabii, bölge ve seans sayısına göre en uygun paketi paylaşalım.",
        time: "18:27",
      },
    ],
  },
  {
    id: "zeynep",
    customerName: "Zeynep Şahin",
    initials: "ZŞ",
    lastMessage: "Teşekkür ederim, görüşmek üzere.",
    lastMessageAt: "Pzt",
    unreadCount: 0,
    status: "resolved",
    tags: ["appointment"],
    appointmentSummary: "Manikür, 21 Haziran 11:00",
    customerSince: "Mayıs 2026",
    totalAppointments: 3,
    nextStep: "Randevu öncesi hatırlatma bekliyor",
    messages: [
      {
        id: "zeynep-1",
        author: "business",
        text: "Randevunuzu 21 Haziran 11:00 için oluşturdum.",
        time: "15:02",
      },
      {
        id: "zeynep-2",
        author: "customer",
        text: "Teşekkür ederim, görüşmek üzere.",
        time: "15:06",
      },
    ],
  },
];

function matchesFilter(conversation: Conversation, filter: MessageFilter) {
  if (filter === "all") return conversation.status !== "archived";
  if (filter === "unread") return conversation.unreadCount > 0;
  if (filter === "archived") return conversation.status === "archived";
  return conversation.tags.includes(filter);
}

export function BusinessMessageCenter() {
  const [activeFilter, setActiveFilter] = useState<MessageFilter>("all");
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? "");
  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ??
    conversations[0];

  const visibleConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        matchesFilter(conversation, activeFilter)
      ),
    [activeFilter]
  );

  return (
    <section className="flex h-full min-h-0 flex-col overflow-y-auto bg-background lg:grid lg:grid-cols-[320px_minmax(0,1fr)_280px] lg:overflow-hidden">
      <aside className="flex flex-col border-b border-border bg-surface-cream/40 lg:h-full lg:min-h-0 lg:border-r lg:border-b-0">
        <div className="shrink-0 space-y-3 border-b border-border p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="pink">3 okunmamış</Badge>
            <span className="text-muted-foreground">·</span>
            <Badge variant="outline">2 takip</Badge>
            <span className="text-muted-foreground">·</span>
            <Badge variant="outline">5 bugün</Badge>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9 text-sm" placeholder="Müşteri veya konu ara" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "h-8 shrink-0 rounded-lg border px-3 text-xs font-medium transition-colors",
                  activeFilter === filter.id
                    ? "border-brand-pink/30 bg-brand-pink text-brand-pink-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 max-h-72 overflow-y-auto lg:max-h-none lg:flex-1">
          {visibleConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <MessageCircle className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Bu filtrede konuşma yok</p>
              <p className="text-xs text-muted-foreground">
                Yeni mesajlar geldiğinde burada görünür.
              </p>
            </div>
          ) : (
            visibleConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={cn(
                  "flex w-full gap-3 border-b border-border border-l-2 border-l-transparent px-4 py-3 text-left transition-colors hover:bg-muted/60",
                  selected?.id === conversation.id &&
                    "border-l-brand-pink bg-surface-pink/70"
                )}
              >
                <Avatar size="lg">
                  <AvatarFallback className="bg-brand-purple text-brand-purple-foreground">
                    {conversation.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {conversation.customerName}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground/70">
                      {conversation.lastMessageAt}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={conversation.unreadCount > 0 ? "pink" : "outline"}
                    >
                      {conversation.unreadCount > 0
                        ? `${conversation.unreadCount} yeni`
                        : "Yanıtlandı"}
                    </Badge>
                    {conversation.tags.slice(0, 1).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag === "appointment"
                          ? "Randevu"
                          : tag === "followup"
                            ? "Takip"
                            : tag === "pricing"
                              ? "Fiyat"
                              : "Bakım"}
                      </Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex min-h-0 flex-col lg:h-full">
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar size="lg">
              <AvatarFallback>{selected.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate">
                {selected.customerName}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {selected.appointmentSummary}
              </p>
            </div>
          </div>
          <Badge variant={selected.unreadCount > 0 ? "pink" : "success"} className="shrink-0">
            {selected.unreadCount > 0 ? "Yanıt bekliyor" : "Güncel"}
          </Badge>
        </div>

        <div className="shrink-0 flex items-center gap-2 border-b border-border bg-surface-cream/50 px-4 py-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="size-3.5 shrink-0 text-brand-pink" />
          <span>Demo mesaj akışı. Entegrasyon aktif olunca gerçek konuşmalar burada görünecek.</span>
        </div>

        <div className="min-h-0 flex-1 max-h-[60vh] overflow-y-auto bg-muted/20 p-4 space-y-3 lg:max-h-none">
          {selected.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.author === "business" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                  message.author === "business"
                    ? "bg-business-nav text-business-nav-fg"
                    : "border border-border bg-background text-foreground"
                )}
              >
                <p className="leading-6">{message.text}</p>
                <p
                  className={cn(
                    "mt-2 text-right text-[10px]",
                    message.author === "business"
                      ? "text-business-nav-fg/60"
                      : "text-muted-foreground/70"
                  )}
                >
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 space-y-2 border-t border-border bg-background p-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                className="shrink-0 rounded-lg border border-border bg-surface-cream px-3 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                {reply}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              rows={2}
              placeholder="Mesajınızı yazın..."
              className="min-h-0 resize-none text-sm"
              disabled
            />
            <Button size="icon" disabled aria-label="Mesaj gönder">
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Gönderim altyapısı hazırlanıyor; bu alan şimdilik önizleme modunda.
          </p>
        </div>
      </main>

      <aside className="flex flex-col border-t border-border bg-surface-cream/30 p-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div className="shrink-0 space-y-4 lg:space-y-5">
          <section className="space-y-3 pb-4 border-b border-border lg:border-b-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Müşteri
            </h3>
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{selected.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{selected.customerName}</p>
                <Badge
                  variant={selected.unreadCount > 0 ? "pink" : "success"}
                  className="mt-1"
                >
                  {selected.unreadCount > 0 ? "Yanıt bekliyor" : "Güncel"}
                </Badge>
              </div>
            </div>
          </section>

          <section className="space-y-2 pb-4 border-b border-border lg:border-b-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Randevu
            </h3>
            <div className="grid gap-1.5 text-sm">
              <InfoRow
                icon={UserRound}
                label="Müşteri"
                value={selected.customerSince}
              />
              <InfoRow
                icon={CalendarPlus}
                label="Toplam"
                value={`${selected.totalAppointments} kayıt`}
              />
              <InfoRow
                icon={Clock3}
                label="Sırada"
                value={selected.nextStep}
              />
            </div>
          </section>

          <section className="space-y-2 pb-4 lg:pb-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aksiyonlar
            </h3>
            <div className="grid gap-2">
              <Button
                size="sm"
                variant="brand"
                render={<Link href="/business/appointments" />}
                className="text-xs"
              >
                <CalendarPlus className="size-3.5" />
                Randevu
              </Button>
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/business/customers" />}
                className="text-xs"
              >
                <UsersRound className="size-3.5" />
                Müşteri
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                <CheckCheck className="size-3.5" />
                Takip notu
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-dashed border-border/50 bg-background/40 p-3 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-pink/10 text-brand-pink">
                <MessageCircle className="size-3.5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <h3 className="text-xs font-semibold leading-4">WhatsApp</h3>
                <p className="text-[10px] leading-4 text-muted-foreground">
                  Numara doğrulama tamamlanınca bu konuşmalar WhatsApp akışıyla eşleşecek.
                </p>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border/40 bg-background/50 p-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-brand-pink" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium leading-4 truncate">{value}</p>
      </div>
    </div>
  );
}
