"use client";

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, type CalendarCustomerSummary } from "./types";

interface CustomerPickerProps {
  customers: CalendarCustomerSummary[];
  value: string | null;
  onChange: (customerId: string | null) => void;
}

export function CustomerPicker({ customers, value, onChange }: CustomerPickerProps) {
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => customers.find((c) => c.customerId === value) ?? null,
    [customers, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = `${c.customer.firstName ?? ""} ${c.customer.lastName ?? ""}`.toLowerCase();
      return (
        name.includes(q) ||
        c.customer.email.toLowerCase().includes(q) ||
        c.customer.phone?.toLowerCase().includes(q)
      );
    });
  }, [customers, query]);

  if (selected) {
    const name = [selected.customer.firstName, selected.customer.lastName]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex items-center gap-3 rounded-lg border border-input p-2">
        <Avatar className="size-8">
          <AvatarImage src={selected.customer.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(selected.customer.firstName, selected.customer.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name || selected.customer.email}</p>
          <p className="truncate text-xs text-muted-foreground">{selected.customer.email}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(null)}
          aria-label="Müşteriyi değiştir"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Müşteri ara (ad, e-posta, telefon)..."
          className="pl-8"
        />
      </div>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border/50">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Müşteri bulunamadı.</p>
        ) : (
          filtered.map((c) => {
            const name = [c.customer.firstName, c.customer.lastName].filter(Boolean).join(" ");
            return (
              <button
                key={c.customerId}
                type="button"
                onClick={() => onChange(c.customerId)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border/30 p-2 text-left last:border-b-0 hover:bg-surface-cream"
                )}
              >
                <Avatar className="size-8">
                  <AvatarImage src={c.customer.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(c.customer.firstName, c.customer.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name || c.customer.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.customer.email}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
