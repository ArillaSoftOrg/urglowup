"use client";

import { useActionState, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createCoupon, type CouponActionState } from "@/app/(business)/business/coupons/actions";

export function CouponCreateForm() {
  const initial: CouponActionState = { success: false };
  const [state, formAction, isPending] = useActionState(createCoupon, initial);
  const [open, setOpen] = useState(false);

  if (state.success && open) setOpen(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Yeni Kupon</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          <Plus className="size-4" />
          {open ? "İptal" : "Oluştur"}
        </Button>
      </CardHeader>

      {open && (
        <CardContent>
          <form action={formAction} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="code">Kupon Kodu *</Label>
              <Input id="code" name="code" placeholder="WELCOME20" className="mt-1.5 uppercase" required />
              <p className="mt-1 text-xs text-muted-foreground">Büyük harf, rakam, tire (-) kullanın</p>
            </div>

            <div>
              <Label htmlFor="type">İndirim Türü *</Label>
              <select id="type" name="type" className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="PERCENTAGE">Yüzde (%)</option>
                <option value="FIXED_AMOUNT">Sabit Tutar (₺)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="value">İndirim Değeri *</Label>
              <Input id="value" name="value" type="number" min="1" step="0.01" placeholder="20" className="mt-1.5" required />
            </div>

            <div>
              <Label htmlFor="minOrderValue">Min. Sipariş Tutarı (₺)</Label>
              <Input id="minOrderValue" name="minOrderValue" type="number" min="0" placeholder="Opsiyonel" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="usageLimit">Kullanım Limiti</Label>
              <Input id="usageLimit" name="usageLimit" type="number" min="1" placeholder="Sınırsız" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="expiresAt">Son Kullanım Tarihi</Label>
              <Input id="expiresAt" name="expiresAt" type="date" className="mt-1.5" />
            </div>

            {state.error && (
              <p className="col-span-2 text-sm text-destructive">{state.error}</p>
            )}

            <div className="col-span-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Oluşturuluyor..." : "Kuponu Oluştur"}
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
