import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServiceTemplatesForCategories } from "@/lib/service-templates";
import {
  ServiceManager,
  type ServiceData,
} from "@/components/business/service-manager";

export const metadata = { title: "Hizmetler" };

export default async function ServicesPage() {
  const { businessId } = await requireBusiness("MANAGER");

  const [services, business] = await Promise.all([
    db.businessService.findMany({
      where: { businessId },
      orderBy: { sortOrder: "asc" },
    }),
    db.business.findUnique({
      where: { id: businessId },
      select: {
        categories: {
          select: {
            category: { select: { slug: true } },
          },
        },
      },
    }),
  ]);

  const serialized: ServiceData[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    price: s.price !== null ? Number(s.price) : null,
    priceType: s.priceType,
    salePrice: s.salePrice !== null ? Number(s.salePrice) : null,
    saleEndsAt: s.saleEndsAt,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
  }));

  const categorySlugs = business?.categories.map((c) => c.category.slug) ?? [];
  const availableTemplates =
    getServiceTemplatesForCategories(categorySlugs);

  return (
    <ServiceManager
      initialServices={serialized}
      availableTemplates={availableTemplates}
    />
  );
}
