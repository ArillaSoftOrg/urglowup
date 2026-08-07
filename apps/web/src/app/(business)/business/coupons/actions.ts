"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "En az 3 karakter")
    .max(20, "En fazla 20 karakter")
    .regex(/^[A-Z0-9_-]+$/, "Sadece büyük harf, rakam, tire ve alt çizgi"),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().positive("Pozitif bir değer girin"),
  minOrderValue: z.coerce.number().min(0).optional().or(z.literal("")),
  usageLimit: z.coerce.number().int().positive().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});

export type CouponActionState = { success: boolean; error?: string };

export async function createCoupon(
  _prev: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const result = couponSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { success: false, error: result.error.issues[0].message };

  const { code, type, value, minOrderValue, usageLimit, expiresAt } = result.data;

  if (type === "PERCENTAGE" && value > 100)
    return { success: false, error: "Yüzde indirimi 100'den fazla olamaz" };

  const existing = await db.coupon.findUnique({ where: { businessId_code: { businessId, code } } });
  if (existing) return { success: false, error: "Bu kod zaten kullanımda" };

  await db.coupon.create({
    data: {
      businessId,
      code,
      type,
      value,
      minOrderValue: minOrderValue ? Number(minOrderValue) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  revalidatePath("/business/coupons");
  return { success: true };
}

export async function toggleCoupon(couponId: string): Promise<CouponActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const coupon = await db.coupon.findUnique({ where: { id: couponId } });
  if (!coupon || coupon.businessId !== businessId) return { success: false, error: "Bulunamadı" };

  await db.coupon.update({ where: { id: couponId }, data: { isActive: !coupon.isActive } });
  revalidatePath("/business/coupons");
  return { success: true };
}

export async function deleteCoupon(couponId: string): Promise<CouponActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const coupon = await db.coupon.findUnique({ where: { id: couponId } });
  if (!coupon || coupon.businessId !== businessId) return { success: false, error: "Bulunamadı" };
  if (coupon.usedCount > 0) return { success: false, error: "Kullanılmış kupon silinemez" };

  await db.coupon.delete({ where: { id: couponId } });
  revalidatePath("/business/coupons");
  return { success: true };
}

// Called from booking flow to validate + return discount amount
export async function validateCoupon(
  businessId: string,
  code: string,
  orderValue: number
): Promise<{ valid: false; error: string } | { valid: true; discountAmount: number; couponId: string }> {
  const coupon = await db.coupon.findUnique({ where: { businessId_code: { businessId, code: code.toUpperCase() } } });

  if (!coupon || !coupon.isActive) return { valid: false, error: "Geçersiz veya aktif olmayan kupon" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: "Kupon süresi dolmuş" };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return { valid: false, error: "Kupon kullanım limiti dolmuş" };
  if (coupon.minOrderValue !== null && orderValue < coupon.minOrderValue)
    return { valid: false, error: `Minimum sipariş tutarı ₺${coupon.minOrderValue}` };
  if (coupon.forCustomerId) return { valid: false, error: "Bu kupon size ait değil" };

  const discountAmount =
    coupon.type === "PERCENTAGE"
      ? (orderValue * coupon.value) / 100
      : Math.min(coupon.value, orderValue);

  return { valid: true, discountAmount: Math.round(discountAmount * 100) / 100, couponId: coupon.id };
}
