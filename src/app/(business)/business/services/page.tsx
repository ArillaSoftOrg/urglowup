import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ServiceManager,
  type ServiceData,
} from "@/components/business/service-manager";

export const metadata = { title: "Hizmetler" };

export default async function ServicesPage() {
  const { businessId } = await requireBusiness();

  const services = await db.businessService.findMany({
    where: { businessId },
    orderBy: { sortOrder: "asc" },
  });

  const serialized: ServiceData[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    price: s.price !== null ? Number(s.price) : null,
    priceType: s.priceType,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
  }));

  return <ServiceManager initialServices={serialized} />;
}
