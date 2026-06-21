"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Search, Users } from "lucide-react";

export interface CustomerSummary {
  customerId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  appointmentCount: number;
  lastAppointmentDate: Date;
  lastAppointmentStatus: string;
}

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "neutral" | "secondary" | "info"> = {
  COMPLETED: "success",
  CONFIRMED: "info",
  PENDING: "warning",
  REJECTED: "destructive",
  CANCELLED_BY_CUSTOMER: "neutral",
  CANCELLED_BY_BUSINESS: "neutral",
  NO_SHOW: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Tamamlandı",
  CONFIRMED: "Onaylandı",
  PENDING: "Beklemede",
  REJECTED: "Reddedildi",
  CANCELLED_BY_CUSTOMER: "İptal",
  CANCELLED_BY_BUSINESS: "İptal",
  NO_SHOW: "Gelmedi",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomerList({ customers }: { customers: CustomerSummary[] }) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase();
    return fullName.includes(q) || c.email.toLowerCase().includes(q);
  });

  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        headline="Henüz müşteri yok"
        description="Randevu alan müşteriler burada görünür."
        surface="cream"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            Tüm Müşteriler
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({customers.length})
            </span>
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Ad veya e-posta ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            &ldquo;{search}&rdquo; için müşteri bulunamadı
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((customer) => {
              const fullName = [customer.firstName, customer.lastName]
                .filter(Boolean)
                .join(" ");
              const initials = [customer.firstName, customer.lastName]
                .filter(Boolean)
                .map((n) => n!.charAt(0).toUpperCase())
                .join("");

              return (
                <li key={customer.customerId}>
                <Link
                  href={`/business/customers/${customer.customerId}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials || "?"}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {fullName || "Bilinmeyen Müşteri"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {customer.email}
                    </p>
                  </div>

                  {/* Appointment count — hidden on mobile */}
                  <div className="hidden shrink-0 text-center sm:block">
                    <p className="text-sm font-semibold">{customer.appointmentCount}</p>
                    <p className="text-[10px] text-muted-foreground">
                      randevu
                    </p>
                  </div>

                  {/* Last appointment */}
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-xs text-muted-foreground">Son ziyaret</p>
                    <p className="text-xs font-medium">
                      {formatDate(customer.lastAppointmentDate)}
                    </p>
                  </div>

                  <Badge
                    variant={STATUS_VARIANTS[customer.lastAppointmentStatus] ?? "secondary"}
                    className="shrink-0"
                  >
                    {STATUS_LABELS[customer.lastAppointmentStatus] ?? customer.lastAppointmentStatus}
                  </Badge>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
