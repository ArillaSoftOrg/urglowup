import Link from "next/link";
import {
  getAdminClaimRequests,
  isValidClaimRequestStatus,
  isValidClaimRequestType,
} from "@/lib/queries/admin";
import { ClaimRequestTable } from "@/components/admin/claim-request-table";
import {
  CLAIM_REQUEST_TYPE_LABELS,
  CLAIM_STATUS_LABELS,
} from "@/lib/constants/claim";
import type {
  BusinessClaimRequestType,
  ClaimRequestStatus,
} from "@/generated/prisma/enums";

export const metadata = { title: "Admin - Talep Başvuruları" };

const ALL_STATUSES: ClaimRequestStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

interface PageProps {
  searchParams: Promise<{ status?: string; type?: string }>;
}

export default async function AdminClaimRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const statusParam = isValidClaimRequestStatus(params.status)
    ? params.status
    : undefined;
  const typeParam = isValidClaimRequestType(params.type)
    ? params.type
    : undefined;

  const records = await getAdminClaimRequests({
    status: statusParam,
    requestType: typeParam,
  });

  function filterHref(next: {
    status?: ClaimRequestStatus;
    type?: BusinessClaimRequestType;
  }) {
    const search = new URLSearchParams();
    if (next.status) search.set("status", next.status);
    if (next.type) search.set("type", next.type);
    const query = search.toString();
    return query ? `/admin/claim-requests?${query}` : "/admin/claim-requests";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Talep Başvuruları</h1>
        <p className="text-muted-foreground">
          İşletme sahiplik ve sayfa kaldırma taleplerini inceleyin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm" aria-label="Talep türü">
        <Link
          href={filterHref({ status: statusParam })}
          className={`rounded-full border px-3 py-1 transition-colors ${
            !typeParam
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted"
          }`}
        >
          Tüm türler
        </Link>
        {(["OWNERSHIP", "REMOVAL"] as BusinessClaimRequestType[]).map(
          (type) => (
            <Link
              key={type}
              href={filterHref({ status: statusParam, type })}
              className={`rounded-full border px-3 py-1 transition-colors ${
                typeParam === type
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {CLAIM_REQUEST_TYPE_LABELS[type]}
            </Link>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-sm" aria-label="Talep durumu">
        <Link
          href={filterHref({ type: typeParam })}
          className={`rounded-full border px-3 py-1 transition-colors ${
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
            href={filterHref({ status: s, type: typeParam })}
            className={`rounded-full border px-3 py-1 transition-colors ${
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
