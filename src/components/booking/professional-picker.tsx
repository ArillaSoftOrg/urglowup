"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface Professional {
  id: string;
  displayName: string;
  title: string | null;
  avatarUrl: string | null;
  services: { serviceId: string }[];
}

interface ProfessionalPickerProps {
  professionals: Professional[];
  serviceId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function ProfessionalPicker({
  professionals,
  serviceId,
  selectedId,
  onSelect,
}: ProfessionalPickerProps) {
  const available = professionals.filter((p) =>
    p.services.some((s) => s.serviceId === serviceId)
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Bu hizmeti sunabilecek uzmanlardan birini seçin veya devam edin.
      </p>

      <div className="space-y-2">
        {/* Any professional option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
            selectedId === null
              ? "border-brand-pink bg-surface-pink"
              : "border-border hover:bg-muted/50"
          )}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-2xl">
            👤
          </div>
          <div>
            <p className="font-semibold">Herhangi bir uzman</p>
            <p className="text-xs text-muted-foreground">İlk müsait uzman atanır</p>
          </div>
        </button>

        {available.map((pro) => (
          <button
            key={pro.id}
            type="button"
            onClick={() => onSelect(pro.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
              selectedId === pro.id
                ? "border-brand-pink bg-surface-pink"
                : "border-border hover:bg-muted/50"
            )}
          >
            {pro.avatarUrl ? (
              <Image
                src={pro.avatarUrl}
                alt={pro.displayName}
                width={48}
                height={48}
                className="size-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-purple text-lg font-bold text-brand-purple-foreground">
                {pro.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{pro.displayName}</p>
              {pro.title && <p className="text-xs text-muted-foreground">{pro.title}</p>}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className="w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Devam Et
      </button>
    </div>
  );
}
