"use client";

import Link from "next/link";
import {
  CalendarPlus,
  CheckCheck,
  Clock3,
  MessageCircle,
  Search,
  Send,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sendBusinessMessage } from "@/app/(business)/business/messages/actions";
import type { BusinessConversation } from "@/lib/queries/messages";

type MessageFilter = "all" | "unread";

const filters: Array<{ id: MessageFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "unread", label: "Okunmamış" },
];

const quickReplies = [
  "Randevunuzu onayladık. Sizi belirtilen saatte bekliyoruz.",
  "Konum ve ulaşım bilgisini hemen paylaşıyorum.",
  "İşlem sonrası bakım notlarını size iletiyorum.",
  "Uygun saatleri kontrol edip size dönüş yapıyorum.",
];

interface FetchedMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

function getInitials(firstName: string | null, lastName: string | null, email: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return email[0].toUpperCase();
}

function customerDisplayName(customer: BusinessConversation["customer"]) {
  const full = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  return full || customer.email;
}

function formatRelativeTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin}d`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}s`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1) return "dün";
  if (diffDays < 7) return `${diffDays} gün`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  conversations: BusinessConversation[];
  businessUserId: string;
}

export function BusinessMessageCenter({ conversations, businessUserId }: Props) {
  const [activeFilter, setActiveFilter] = useState<MessageFilter>("all");
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? "");
  const [messages, setMessages] = useState<FetchedMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [compose, setCompose] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0],
    [conversations, selectedId]
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c._count.messages, 0),
    [conversations]
  );

  const visibleConversations = useMemo(() => {
    let list = conversations;
    if (activeFilter === "unread") list = list.filter((c) => c._count.messages > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => customerDisplayName(c.customer).toLowerCase().includes(q));
    }
    return list;
  }, [conversations, activeFilter, search]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setMessages([]);
    setMessagesLoading(true);
    setSendError(null);

    fetch(`/api/messages/conversations/${selectedId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        if (!cancelled) setMessages(data.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleQuickReply(text: string) {
    setCompose(text);
  }

  function handleSend() {
    const content = compose.trim();
    if (!content || isPending) return;
    setSendError(null);

    // Optimistic append
    const optimistic: FetchedMessage = {
      id: `optimistic-${Date.now()}`,
      senderId: businessUserId,
      content,
      createdAt: new Date().toISOString(),
      sender: { id: businessUserId, firstName: null, lastName: null, email: "" },
    };
    setMessages((prev) => [...prev, optimistic]);
    setCompose("");

    startTransition(async () => {
      const result = await sendBusinessMessage(selectedId, content);
      if (!result.success) {
        // Rollback optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setCompose(content);
        setSendError(result.message ?? "Mesaj gönderilemedi.");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <MessageCircle className="size-10 text-muted-foreground" />
        <p className="text-sm font-medium">Henüz mesaj yok</p>
        <p className="text-xs text-muted-foreground">
          Müşteriler size mesaj gönderdiğinde burada görünür.
        </p>
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-y-auto bg-background lg:grid lg:grid-cols-[320px_minmax(0,1fr)_280px] lg:overflow-hidden">
      {/* Sidebar — conversation list */}
      <aside className="flex flex-col border-b border-border bg-surface-cream/40 lg:h-full lg:min-h-0 lg:border-r lg:border-b-0">
        <div className="shrink-0 space-y-3 border-b border-border p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {totalUnread > 0 ? (
              <Badge variant="pink">{totalUnread} okunmamış</Badge>
            ) : (
              <Badge variant="outline">Tümü okundu</Badge>
            )}
            <span className="text-muted-foreground">·</span>
            <Badge variant="outline">{conversations.length} konuşma</Badge>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9 text-sm"
              placeholder="Müşteri ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
            visibleConversations.map((conversation) => {
              const name = customerDisplayName(conversation.customer);
              const initials = getInitials(
                conversation.customer.firstName,
                conversation.customer.lastName,
                conversation.customer.email
              );
              const lastMsg = conversation.messages[0];
              const unread = conversation._count.messages;

              return (
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
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      {lastMsg && (
                        <span className="shrink-0 text-[11px] text-muted-foreground/70">
                          {formatRelativeTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {lastMsg.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant={unread > 0 ? "pink" : "outline"}>
                        {unread > 0 ? `${unread} yeni` : "Okundu"}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main — message thread */}
      <main className="flex min-h-0 flex-col lg:h-full">
        {selected && (
          <>
            <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar size="lg">
                  <AvatarFallback>
                    {getInitials(
                      selected.customer.firstName,
                      selected.customer.lastName,
                      selected.customer.email
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold truncate">
                    {customerDisplayName(selected.customer)}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {selected.customer.email}
                  </p>
                </div>
              </div>
              <Badge
                variant={selected._count.messages > 0 ? "pink" : "success"}
                className="shrink-0"
              >
                {selected._count.messages > 0 ? "Yanıt bekliyor" : "Güncel"}
              </Badge>
            </div>

            <div className="min-h-0 flex-1 max-h-[60vh] overflow-y-auto bg-muted/20 p-4 space-y-3 lg:max-h-none">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-xs text-muted-foreground">Yükleniyor…</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <MessageCircle className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Henüz mesaj yok. Konuşmayı başlatın.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isBusiness = message.senderId === businessUserId;
                  return (
                    <div
                      key={message.id}
                      className={cn("flex", isBusiness ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                          isBusiness
                            ? "bg-business-nav text-business-nav-fg"
                            : "border border-border bg-background text-foreground"
                        )}
                      >
                        <p className="leading-6">{message.content}</p>
                        <p
                          className={cn(
                            "mt-2 text-right text-[10px]",
                            isBusiness
                              ? "text-business-nav-fg/60"
                              : "text-muted-foreground/70"
                          )}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 space-y-2 border-t border-border bg-background p-3">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => handleQuickReply(reply)}
                    className="shrink-0 rounded-lg border border-border bg-surface-cream px-3 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {reply}
                  </button>
                ))}
              </div>
              {sendError && (
                <p className="text-xs text-red-500">{sendError}</p>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  rows={2}
                  placeholder="Mesajınızı yazın… (Ctrl+Enter göndermek için)"
                  className="min-h-0 resize-none text-sm"
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isPending || messagesLoading}
                />
                <Button
                  size="icon"
                  aria-label="Mesaj gönder"
                  onClick={handleSend}
                  disabled={!compose.trim() || isPending || messagesLoading}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Right sidebar — customer info */}
      <aside className="flex flex-col border-t border-border bg-surface-cream/30 p-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:border-t-0 lg:border-l">
        {selected && (
          <div className="shrink-0 space-y-4 lg:space-y-5">
            <section className="space-y-3 pb-4 border-b border-border lg:border-b-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Müşteri
              </h3>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>
                    {getInitials(
                      selected.customer.firstName,
                      selected.customer.lastName,
                      selected.customer.email
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    {customerDisplayName(selected.customer)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {selected.customer.email}
                  </p>
                  <Badge
                    variant={selected._count.messages > 0 ? "pink" : "success"}
                    className="mt-1"
                  >
                    {selected._count.messages > 0 ? "Yanıt bekliyor" : "Güncel"}
                  </Badge>
                </div>
              </div>
            </section>

            <section className="space-y-2 pb-4 border-b border-border lg:border-b-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bilgi
              </h3>
              <div className="grid gap-1.5 text-sm">
                <InfoRow
                  icon={UserRound}
                  label="Müşteri ID"
                  value={selected.customer.id.slice(0, 8) + "…"}
                />
                <InfoRow
                  icon={Clock3}
                  label="Son mesaj"
                  value={formatRelativeTime(selected.lastMessageAt)}
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
        )}
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
