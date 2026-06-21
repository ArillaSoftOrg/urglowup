import { requireBusiness } from "@/lib/auth";
import { getBusinessAnalytics, type Period } from "@/lib/queries/analytics";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { RevenueChart } from "@/components/business/analytics/revenue-chart";
import { PeakDaysChart } from "@/components/business/analytics/peak-days-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analitik" };

const PERIOD_LABELS: Record<Period, string> = {
  "30d": "Son 30 Gün",
  "90d": "Son 90 Gün",
  "12m": "Son 12 Ay",
};

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

function pct(n: number) {
  return `%${n.toFixed(0)}`;
}

function money(n: number) {
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(1)}K`;
  return `₺${n.toFixed(0)}`;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { period: periodParam } = await searchParams;
  const period: Period =
    periodParam === "90d" || periodParam === "12m" ? periodParam : "30d";

  const { businessId } = await requireBusiness("OWNER");
  const data = await getBusinessAnalytics(businessId, period);

  const { revenueSummary, revenueTimeSeries, funnel, servicePerformance, peakDays, customerMetrics } = data;
  const isMonthly = period === "12m";

  const totalCustomers = customerMetrics.newCustomers + customerMetrics.returningCustomers;
  const returningPct = totalCustomers > 0
    ? Math.round((customerMetrics.returningCustomers / totalCustomers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <BusinessPageHeader
          title="Analitik"
          description="İşletmenizin gelir ve performans verileri."
        />
        {/* Period selector */}
        <div className="flex gap-1 rounded-lg border bg-background p-1">
          {(["30d", "90d", "12m"] as Period[]).map((p) => (
            <Link
              key={p}
              href={`/business/analytics?period=${p}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                period === p
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {PERIOD_LABELS[p]}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Gelir Özeti ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {/* Bu ay gelir */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="size-4" />
              <span className="text-xs font-medium">Bu Ay Gelir</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{money(revenueSummary.thisMonth.revenue)}</p>
            {revenueSummary.revenueChange !== null && (
              <p className={cn(
                "mt-1 flex items-center gap-0.5 text-xs font-medium",
                revenueSummary.revenueChange >= 0 ? "text-success-foreground" : "text-destructive"
              )}>
                {revenueSummary.revenueChange >= 0
                  ? <ArrowUpRight className="size-3.5" />
                  : <ArrowDownRight className="size-3.5" />}
                {Math.abs(revenueSummary.revenueChange).toFixed(0)}% geçen ay
              </p>
            )}
          </CardContent>
        </Card>

        {/* Toplam gelir */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-4" />
              <span className="text-xs font-medium">Toplam Gelir</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{money(revenueSummary.allTime.revenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {revenueSummary.allTime.count} tamamlanan
            </p>
          </CardContent>
        </Card>

        {/* Ort. sipariş değeri */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarCheck className="size-4" />
              <span className="text-xs font-medium">Ort. Randevu</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {revenueSummary.avgOrderValue > 0 ? money(revenueSummary.avgOrderValue) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">bu ay ortalaması</p>
          </CardContent>
        </Card>

        {/* Müşteri */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              <span className="text-xs font-medium">Müşteri</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{totalCustomers}</p>
            {returningPct > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{returningPct}% geri dönen</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Gelir Grafiği ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gelir Trendi — {PERIOD_LABELS[period]}</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueTimeSeries} isMonthly={isMonthly} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Randevu Hunisi ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Randevu Dağılımı — {PERIOD_LABELS[period]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Toplam talep", value: funnel.total, color: "bg-muted-foreground/30" },
              { label: "Onaylanan", value: funnel.confirmed + funnel.completed, color: "bg-info" },
              { label: "Tamamlanan", value: funnel.completed, color: "bg-success" },
              { label: "İptal", value: funnel.cancelled, color: "bg-warning" },
              { label: "Gelmedi", value: funnel.noShow, color: "bg-destructive/60" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={cn("size-2.5 shrink-0 rounded-full", color)} />
                <span className="min-w-[130px] text-sm text-muted-foreground">{label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn("h-2 rounded-full", color)}
                    style={{ width: funnel.total > 0 ? `${(value / funnel.total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">{value}</span>
              </div>
            ))}

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-3 text-center text-xs">
              <div>
                <p className="font-bold text-success-foreground">{pct(funnel.completionRate)}</p>
                <p className="text-muted-foreground">tamamlanma</p>
              </div>
              <div>
                <p className="font-bold text-warning-foreground">{pct(funnel.cancellationRate)}</p>
                <p className="text-muted-foreground">iptal</p>
              </div>
              <div>
                <p className="font-bold text-destructive">{pct(funnel.noShowRate)}</p>
                <p className="text-muted-foreground">gelmedi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Yoğun Günler ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yoğun Günler — {PERIOD_LABELS[period]}</CardTitle>
          </CardHeader>
          <CardContent>
            <PeakDaysChart data={peakDays} />
            {peakDays.every((d) => d.count === 0) && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Bu dönemde tamamlanan randevu yok.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Hizmet Performansı ── */}
      {servicePerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hizmet Performansı — {PERIOD_LABELS[period]}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {servicePerformance.map((svc, i) => {
                const maxRevenue = servicePerformance[0].revenue;
                const barWidth = maxRevenue > 0 ? (svc.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-4 px-6 py-3">
                    <span className="w-5 shrink-0 text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{svc.name}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/50">
                        <div
                          className="h-full rounded-full bg-brand-pink"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">{money(svc.revenue)}</p>
                      <p className="text-xs text-muted-foreground">{svc.count} randevu</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Müşteri Dağılımı ── */}
      {totalCustomers > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Müşteri Dağılımı — {PERIOD_LABELS[period]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative size-24 shrink-0">
                <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  {returningPct > 0 && (
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="#e879a0" strokeWidth="3"
                      strokeDasharray={`${returningPct} ${100 - returningPct}`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold">{returningPct}%</span>
                  <span className="text-[9px] text-muted-foreground leading-tight">geri dönen</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-muted" />
                  <span className="text-sm">Yeni müşteri</span>
                  <span className="ml-auto text-sm font-bold">{customerMetrics.newCustomers}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-brand-pink" />
                  <span className="text-sm">Geri dönen</span>
                  <span className="ml-auto text-sm font-bold">{customerMetrics.returningCustomers}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
