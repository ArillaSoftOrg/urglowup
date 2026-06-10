import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { TeamManager } from "@/components/business/team/team-manager";

export const metadata = { title: "Ekip" };

export default async function TeamPage() {
  const { user, businessId } = await requireBusiness("OWNER");

  const members = await db.businessMember.findMany({
    where: { businessId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          professional: {
            select: { id: true, businessId: true, displayName: true, title: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const invitations = await db.businessInvitation
    .findMany({
      where: { businessId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    })
    .catch((error) => {
      console.error("[business-team] invitations query failed:", error);
      return [];
    });

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Ekip"
        description="İşletmenize üye davet edin ve rollerini yönetin."
      />
      <TeamManager
        members={members}
        invitations={invitations}
        currentUserId={user.id}
      />
    </div>
  );
}
