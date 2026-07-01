import Link from "next/link";
import {
  getAdminClaimRequests,
  isValidClaimRequestStatus,
} from "@/lib/queries/admin";
import { ClaimRequestTable } from "@/components/admin/claim-request-table";
import { CLAIM_STATUS_LABELS } from "@/lib/constants/claim";
import type { ClaimRequestStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Admin - Talep Başvuruları" };

const ALL_STATUSES: ClaimRequestStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminClaimRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const statusParam = isValidClaimRequestStatus(params.status)
    ? params.status
    : undefined;

  const records = await getAdminClaimRequests({ status: statusParam });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Talep Başvuruları</h1>
        <p className="text-muted-foreground">
          İşletme sahiplik başvurularını inceleyin.
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/claim-requests"
          className={`px-3 py-1 rounded-full border transition-colors ${
            !statusParam
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          Tümü
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/claim-requests?status=${s}`}
            className={`px-3 py-1 rounded-full border transition-colors ${
              statusParam === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {CLAIM_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <ClaimRequestTable records={records} />
    </div>
  );
}
