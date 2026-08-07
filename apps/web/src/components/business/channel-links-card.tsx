"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "./copy-button";
import { BarChart2 } from "lucide-react";

interface ViewStats {
  total: number;
  bySource: { source: string | null; count: number }[];
}

interface ChannelLinksCardProps {
  publicUrl: string;
  stats: ViewStats;
}

const CHANNELS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "whatsapp", label: "WhatsApp" },
] as const;

function sourceLabel(source: string | null): string {
  if (!source) return "Direkt";
  const found = CHANNELS.find((c) => c.key === source);
  return found ? found.label : source;
}

export function ChannelLinksCard({ publicUrl, stats }: ChannelLinksCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="size-5" />
          Kanal Linkleri & İstatistikler
        </CardTitle>
        <CardDescription>
          Her platform için farklı link paylaşın ve hangi kanaldan kaç ziyaret geldiğini görün.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="divide-y rounded-lg border">
          {CHANNELS.map(({ key, label }) => {
            const url = `${publicUrl}?ref=${key}`;
            return (
              <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium">{label}</span>
                <CopyButton value={url} label="Kopyala" size="sm" />
              </div>
            );
          })}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Son 30 günlük ziyaretler — toplam {stats.total}
          </p>
          {stats.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz ziyaret yok. Linkleri paylaştıkça burada görünecek.
            </p>
          ) : (
            <div className="space-y-1.5">
              {stats.bySource.map(({ source, count }) => {
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={source ?? "__direct__"} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">
                      {sourceLabel(source)}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-brand-pink"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
