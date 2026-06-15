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
    <section className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_300px]">
        <aside className="border-b border-border bg-surface-cream/40 lg:border-r lg:border-b-0">
          <div className="space-y-4 border-b border-border p-4">
            <div className="grid grid-cols-3 gap-2">
              <MessageStat label="Okunmamış" value="3" tone="pink" />
              <MessageStat label="Takip" value="2" />
              <MessageStat label="Bugün" value="5" />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Müşteri veya konu ara" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "h-8 shrink-0 rounded-lg border px-3 text-sm font-medium transition-colors",
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

          <div className="max-h-[500px] overflow-y-auto">
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
                    "flex w-full gap-3 border-b border-border px-4 py-4 text-left transition-colors hover:bg-muted/60",
                    selected?.id === conversation.id && "bg-surface-pink/70"
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
                      <span className="shrink-0 text-xs text-muted-foreground">
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

        <main className="flex min-h-[640px] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{selected.initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-base font-semibold">
                  {selected.customerName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selected.appointmentSummary}
                </p>
              </div>
            </div>
            <Badge variant={selected.unreadCount > 0 ? "pink" : "success"}>
              {selected.unreadCount > 0 ? "Yanıt bekliyor" : "Güncel"}
            </Badge>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-5">
            <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-brand-pink" />
              Demo mesaj akışı. Entegrasyon aktif olunca gerçek konuşmalar
              burada görünecek.
            </div>
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
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground"
                  )}
                >
                  <p className="leading-6">{message.text}</p>
                  <p
                    className={cn(
                      "mt-2 text-right text-[11px]",
                      message.author === "business"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-border bg-background p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  className="shrink-0 rounded-lg border border-border bg-surface-cream px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {reply}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                rows={2}
                placeholder="Mesajınızı yazın..."
                className="min-h-0 resize-none"
                disabled
              />
              <Button size="icon" disabled aria-label="Mesaj gönder">
                <Send className="size-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Gönderim altyapısı hazırlanıyor; bu alan şimdilik önizleme
              modunda.
            </p>
          </div>
        </main>

        <aside className="border-t border-border bg-surface-cream/30 p-5 lg:border-t-0 lg:border-l">
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Müşteri özeti</h3>
              <div className="grid gap-2 text-sm">
                <InfoRow
                  icon={UserRound}
                  label="Müşteri"
                  value={selected.customerSince}
                />
                <InfoRow
                  icon={CalendarPlus}
                  label="Randevu"
                  value={`${selected.totalAppointments} kayıt`}
                />
                <InfoRow
                  icon={Clock3}
                  label="Sıradaki iş"
                  value={selected.nextStep}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Hızlı aksiyonlar</h3>
              <div className="grid gap-2">
                <Button variant="brand" render={<Link href="/business/appointments" />}>
                  <CalendarPlus className="size-4" />
                  Randevu oluştur
                </Button>
                <Button variant="outline" render={<Link href="/business/customers" />}>
                  <UsersRound className="size-4" />
                  Müşteriyi aç
                </Button>
                <Button variant="outline">
                  <CheckCheck className="size-4" />
                  Takip notu ekle
                </Button>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-brand-pink text-brand-pink-foreground">
                  <MessageCircle className="size-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">WhatsApp bağlantısı</h3>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Numara doğrulama tamamlandığında bu konuşmalar WhatsApp
                    akışıyla eşleşebilir.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MessageStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pink";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-3",
        tone === "pink" && "bg-surface-pink"
      )}
    >
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
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
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand-pink" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium leading-5">{value}</p>
      </div>
    </div>
  );
}
