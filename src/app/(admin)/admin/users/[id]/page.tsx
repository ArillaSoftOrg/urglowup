import { getAdminUserDetail } from "@/lib/queries/admin";
import { UserDetailView } from "@/components/admin/user-detail";
import { notFound } from "next/navigation";

export const metadata = { title: "Admin - User Details" };

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const data = await getAdminUserDetail(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Details</h1>
        <p className="text-muted-foreground">
          User lifecycle, engagement, and consent management.
        </p>
      </div>

      <UserDetailView data={data} />
    </div>
  );
}
