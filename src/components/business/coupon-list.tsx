"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag, Trash2 } from "lucide-react";
import { toggleCoupon, deleteCoupon } from "@/app/(business)/business/coupons/actions";
import type { Coupon } from "@/generated/prisma";

function formatValue(coupon: Coupon): string {
  return coupon.type === "PERCENTAGE" ? `%${coupon.value}` : `₺${coupon.value}`;
}

function CouponRow({ coupon }: { coupon: Coupon }) {
  const [isPending, startTransition] = useTransition();

  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const isFull = coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b py-3 last:border-0">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-wider">{coupon.code}</span>
          <Badge variant={coupon.isActive && !isExpired && !isFull ? "success" : "neutral"}>
            {isExpired ? "Süresi doldu" : isFull ? "Limit doldu" : coupon.isActive ? "Aktif" : "Pasif"}
          </Badge>
          {coupon.isLoyalty && <Badge variant="info">Sadakat</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatValue(coupon)} indirim
          {coupon.minOrderValue ? ` · Min. ₺${coupon.minOrderValue}` : ""}
          {coupon.usageLimit ? ` · ${coupon.usedCount}/${coupon.usageLimit} kullanım` : ` · ${coupon.usedCount} kullanım`}
          {coupon.expiresAt ? ` · ${new Date(coupon.expiresAt).toLocaleDateString("tr-TR")} bitiş` : ""}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(() => toggleCoupon(coupon.id))}
        >
          {coupon.isActive ? "Pasif yap" : "Aktif et"}
        </Button>
        {coupon.usedCount === 0 && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => startTransition(() => deleteCoupon(coupon.id))}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function CouponList({ coupons }: { coupons: Coupon[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="size-4" />
          Mevcut Kuponlar ({coupons.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 px-6">
        {coupons.length === 0 ? (
          <div className="py-8">
            <EmptyState icon={Tag} headline="Henüz kupon yok" description="Yukarıdan ilk kuponunuzu oluşturun." surface="cream" compact />
          </div>
        ) : (
          coupons.map((c) => <CouponRow key={c.id} coupon={c} />)
        )}
      </CardContent>
    </Card>
  );
}
