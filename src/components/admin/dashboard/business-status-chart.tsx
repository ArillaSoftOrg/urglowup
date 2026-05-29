"use client";

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessStatus } from "@/generated/prisma/enums";
import { BUSINESS_STATUS_LABELS } from "@/lib/constants/business";

export type BusinessStatusPoint = {
  status: BusinessStatus;
  count: number;
  label: string;
};

interface BusinessStatusChartProps {
  data: BusinessStatusPoint[];
}

const STATUS_COLORS: Record<BusinessStatus, string> = {
  ACTIVE_MARKETPLACE: "#10b981",
  ACTIVE_PRIVATE: "#3b82f6",
  PENDING_APPROVAL: "#f59e0b",
  DRAFT: "#6b7280",
  SUSPENDED: "#ef4444",
  REJECTED: "#7f1d1d",
};

export function BusinessStatusChart({ data }: BusinessStatusChartProps) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      label: `${d.label} (${d.count})`,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => value} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => {
                  const entry = chartData.find((d) => d.label === value);
                  return entry ? `${entry.status}: ${entry.count}` : value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
