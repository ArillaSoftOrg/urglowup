"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueServiceSlug } from "@/lib/slug";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";

// ─── Schemas ────────────────────────────────────────────────────

const serviceSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional().or(z.literal("")),
    durationMinutes: z.coerce.number().int().min(5, "Min 5 minutes").max(480),
    price: z.coerce.number().min(0).optional(),
    priceType: z.enum([
      "FIXED",
      "STARTS_FROM",
      "CONSULTATION_REQUIRED",
      "FREE_CONSULTATION",
    ]),
    isActive: z.string().optional(), // "on" or undefined from checkbox
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .transform((data) => ({
    ...data,
    description: data.description || null,
    isActive: data.isActive === "on",
    price:
      data.priceType === "CONSULTATION_REQUIRED" ||
      data.priceType === "FREE_CONSULTATION"
        ? null
        : data.price ?? null,
  }));

// ─── Types ──────────────────────────────────────────────────────

export type ServiceActionState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

// ─── Actions ────────────────────────────────────────────────────

export async function createService(
  _prev: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const raw = Object.fromEntries(formData.entries());
  const result = serviceSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { success: false, errors: fieldErrors };
  }

  const data = result.data;

  // Determine next sortOrder
  const [maxSort, business] = await Promise.all([
    db.businessService.aggregate({
      where: { businessId },
      _max: { sortOrder: true },
    }),
    db.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { name: true },
    }),
  ]);
  const nextSort = (maxSort._max.sortOrder ?? -1) + 1;
  const slug = await generateUniqueServiceSlug(business.name, data.name);

  await db.businessService.create({
    data: {
      businessId,
      name: data.name,
      slug,
      description: data.description,
      durationMinutes: data.durationMinutes,
      price: data.price,
      priceType: data.priceType,
      isActive: data.isActive,
      sortOrder: data.sortOrder || nextSort,
    },
  });

  revalidatePath("/business/services");
  revalidatePath("/business/dashboard");
  return { success: true, message: "Service created" };
}

export async function updateService(
  _prev: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const serviceId = formData.get("serviceId") as string;
  if (!serviceId) return { success: false, message: "Missing service ID" };

  // Verify ownership
  const existing = await db.businessService.findFirst({
    where: { id: serviceId, businessId },
  });
  if (!existing) return { success: false, message: "Service not found" };

  const raw = Object.fromEntries(formData.entries());
  const result = serviceSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { success: false, errors: fieldErrors };
  }

  const data = result.data;

  await db.businessService.update({
    where: { id: serviceId },
    data: {
      name: data.name,
      description: data.description,
      durationMinutes: data.durationMinutes,
      price: data.price,
      priceType: data.priceType,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });

  revalidatePath("/business/services");
  revalidatePath("/business/dashboard");
  return { success: true, message: "Service updated" };
}

export async function toggleServiceActive(serviceId: string) {
  const { businessId } = await requireBusiness("MANAGER");

  const service = await db.businessService.findFirst({
    where: { id: serviceId, businessId },
  });
  if (!service) return;

  await db.businessService.update({
    where: { id: serviceId },
    data: { isActive: !service.isActive },
  });

  revalidatePath("/business/services");
  revalidatePath("/business/dashboard");
}
