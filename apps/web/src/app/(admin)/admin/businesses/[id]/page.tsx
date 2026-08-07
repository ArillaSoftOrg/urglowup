import { notFound } from "next/navigation";
import {
  getAdminBusinessDetail,
  getBusinessActionHistory,
} from "@/lib/queries/admin";
import { BusinessDetailView } from "@/components/admin/business-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const business = await getAdminBusinessDetail(id);
  return {
    title: business ? `Admin - ${business.name}` : "Business Not Found",
  };
}

export default async function AdminBusinessDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [business, actionHistory] = await Promise.all([
    getAdminBusinessDetail(id),
    getBusinessActionHistory(id),
  ]);

  if (!business) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{business.name}</h1>
        <p className="text-muted-foreground">Business details and management</p>
      </div>

      <BusinessDetailView business={business} actionHistory={actionHistory} />
    </div>
  );
}
