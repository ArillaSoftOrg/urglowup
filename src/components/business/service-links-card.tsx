"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "./copy-button";
import { Scissors } from "lucide-react";

interface Service {
  id: string;
  name: string;
}

interface ServiceLinksCardProps {
  services: Service[];
  baseUrl: string;
}

export function ServiceLinksCard({ services, baseUrl }: ServiceLinksCardProps) {
  if (services.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="size-5" />
          Hizmet Linkleri
        </CardTitle>
        <CardDescription>
          Her hizmet için doğrudan randevu linki — müşteri tıkladığında o hizmet seçili gelir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y rounded-lg border">
          {services.map((service) => {
            const url = `${baseUrl}/book?service=${service.id}`;
            return (
              <div key={service.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-medium">{service.name}</span>
                <CopyButton value={url} label="Kopyala" size="sm" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
