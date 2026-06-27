"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueServiceSlug } from "@/lib/slug";
import { SERVICE_TEMPLATES } from "@/lib/service-templates";
import { normalizeServiceCategory } from "@/lib/service-categories";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";

// ─── Schemas ────────────────────────────────────────────────────

const serviceSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    category: z.string().optional().or(z.literal("")),
    description: z.string().max(500).optional().or(z.literal("")),
    durationMinutes: z.coerce.number().int().min(5, "Min 5 minutes").max(480),
    price: z.coerce.number().min(0).optional(),
    priceType: z.enum([
      "FIXED",
      "STARTS_FROM",
      "CONSULTATION_REQUIRED",
      "FREE_CONSULTATION",
    ]),
    salePrice: z.coerce.number().min(0).optional().or(z.literal("")),
    saleEndsAt: z.string().optional().or(z.literal("")),
    isActive: z.string().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .transform((data) => ({
    ...data,
    category: normalizeServiceCategory(data.category),
    description: data.description || null,
    isActive: data.isActive === "on",
    price:
      data.priceType === "CONSULTATION_REQUIRED" ||
      data.priceType === "FREE_CONSULTATION"
        ? null
        : data.price ?? null,
    salePrice: data.salePrice ? Number(data.salePrice) : null,
    saleEndsAt: data.saleEndsAt ? new Date(data.saleEndsAt) : null,
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
      category: data.category,
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
      category: data.category,
      description: data.description,
      durationMinutes: data.durationMinutes,
      price: data.price,
      priceType: data.priceType,
      salePrice: data.salePrice,
      saleEndsAt: data.saleEndsAt,
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

export async function addTemplateServices(
  _prev: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const templateNames = formData.getAll("templates") as string[];

  // Filter by valid template names
  const validTemplates = templateNames.filter(
    (name) => name in SERVICE_TEMPLATES
  );

  if (validTemplates.length === 0) {
    return { success: false, message: "Lütfen en az bir hizmet seçin" };
  }

  const [maxSort, business, existingServices] = await Promise.all([
    db.businessService.aggregate({
      where: { businessId },
      _max: { sortOrder: true },
    }),
    db.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { name: true },
    }),
    db.businessService.findMany({
      where: { businessId },
      select: { name: true },
    }),
  ]);

  let nextSort = (maxSort._max.sortOrder ?? -1) + 1;
  const existingNames = new Set(
    existingServices.map((service) => service.name.trim().toLocaleLowerCase("tr"))
  );
  let addedCount = 0;
  let skippedCount = 0;

  for (const templateName of validTemplates) {
    const normalizedName = templateName.trim().toLocaleLowerCase("tr");
    if (existingNames.has(normalizedName)) {
      skippedCount++;
      continue;
    }

    const template = SERVICE_TEMPLATES[templateName];
    const durationMinutes = Number(
      formData.get(`duration-${templateName}`) ?? template.durationMinutes
    );
    const rawPrice = formData.get(`price-${templateName}`);
    const parsedPrice =
      rawPrice === null || rawPrice === "" ? template.price : Number(rawPrice);
    const priceType = template.priceType ?? "FIXED";
    const price =
      priceType === "CONSULTATION_REQUIRED" || priceType === "FREE_CONSULTATION"
        ? null
        : Number.isFinite(parsedPrice)
          ? parsedPrice
          : null;
    const safeDuration =
      Number.isFinite(durationMinutes) && durationMinutes >= 5
        ? Math.min(durationMinutes, 480)
        : template.durationMinutes;
    const slug = await generateUniqueServiceSlug(business.name, templateName);

    await db.businessService.create({
      data: {
        businessId,
        name: templateName,
        slug,
        category: template.category,
        description: template.description ?? null,
        durationMinutes: safeDuration,
        price,
        priceType,
        isActive: true,
        sortOrder: nextSort,
      },
    });

    nextSort++;
    addedCount++;
    existingNames.add(normalizedName);
  }

  if (addedCount === 0) {
    return {
      success: false,
      message:
        skippedCount > 0
          ? "Seçtiğiniz hizmetler zaten ekli"
          : "Lütfen en az bir hizmet seçin",
    };
  }

  revalidatePath("/business/services");
  revalidatePath("/business/dashboard");
  return {
    success: true,
    message:
      skippedCount > 0
        ? `${addedCount} hizmet eklendi, ${skippedCount} hizmet zaten vardı`
        : `${addedCount} hizmet eklendi`,
  };
}
