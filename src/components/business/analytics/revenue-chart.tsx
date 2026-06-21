"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  bucket: string;
  revenue: number;
  count: number;
}

function formatBucket(bucket: string, isMonthly: boolean): string {
  if (isMonthly) {
    const [y, m] = bucket.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
  }
  const d = new Date(bucket);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function formatRevenue(value: number): string {
  if (value >= 1000) return `₺${(value / 1000).toFixed(1)}k`;
  return `₺${value}`;
}

interface RevenueChartProps {
  data: DataPoint[];
  isMonthly?: boolean;
}

export function RevenueChart({ data, isMonthly = false }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Bu dönemde tamamlanan randevu yok.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e879a0" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#e879a0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="bucket"
          tickFormatter={(v) => formatBucket(v, isMonthly)}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatRevenue}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          formatter={(v) => [`₺${Number(v ?? 0).toFixed(0)}`, "Gelir"]}
          labelFormatter={(l) => formatBucket(l, isMonthly)}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#e879a0"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#e879a0" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
