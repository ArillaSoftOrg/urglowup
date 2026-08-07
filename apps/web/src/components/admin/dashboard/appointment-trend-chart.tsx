"use client";

import { format, parse } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export type AppointmentTrendPoint = {
  day: string;
  PENDING: number;
  CONFIRMED: number;
  COMPLETED: number;
};

interface AppointmentTrendChartProps {
  data: AppointmentTrendPoint[];
}

export function AppointmentTrendChart({ data }: AppointmentTrendChartProps) {
  const hasData = data.some((d) => d.PENDING > 0 || d.CONFIRMED > 0 || d.COMPLETED > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appointment Trend (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            compact
            headline="No appointments in the last 7 days"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Trend (7d)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickFormatter={(day) =>
                format(parse(day, "yyyy-MM-dd", new Date()), "EEE")
              }
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) =>
                typeof label === "string"
                  ? format(parse(label, "yyyy-MM-dd", new Date()), "MMM d")
                  : ""
              }
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "none",
                borderRadius: "4px",
                color: "white",
              }}
            />
            <Legend />
            <Bar dataKey="PENDING" fill="#f59e0b" name="Pending" />
            <Bar dataKey="CONFIRMED" fill="#3b82f6" name="Confirmed" />
            <Bar dataKey="COMPLETED" fill="#10b981" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
