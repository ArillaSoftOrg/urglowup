import Link from "next/link";
import {
  getAdminPlaceReferences,
  isValidPlaceReferenceStatus,
} from "@/lib/queries/admin";
import { PlaceReferenceTable } from "@/components/admin/place-reference-table";
import { PLACE_REFERENCE_STATUS_LABELS } from "@/lib/constants/place-reference";
import type { PlaceReferenceStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Admin - Yer Referansları" };

const ALL_STATUSES: PlaceReferenceStatus[] = [
  "DISCOVERED",
  "APPROVED",
  "HIDDEN",
  "DUPLICATE",
  "CLAIM_PENDING",
  "CLAIMED",
  "REJECTED",
  "STALE",
  "ERROR",
];

interface PageProps {
  searchParams: Promise<{ status?: string; city?: string }>;
}

export default async function AdminPlaceReferencesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const statusParam = isValidPlaceReferenceStatus(params.status)
    ? params.status
    : undefined;

  const cityParam =
    typeof params.city === "string" && params.city.trim().length > 0
      ? params.city.trim()
      : undefined;

  const records = await getAdminPlaceReferences({
    status: statusParam,
    city: cityParam,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yer Referansları</h1>
        <p className="text-muted-foreground">
          Google Places üzerinden keşfedilen dış işletme referansları.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/place-references"
          className={`px-3 py-1 rounded-full border transition-colors ${
            !statusParam
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          Tümü ({records.length > 0 && !statusParam ? records.length : "—"})
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/place-references?status=${s}${cityParam ? `&city=${encodeURIComponent(cityParam)}` : ""}`}
            className={`px-3 py-1 rounded-full border transition-colors ${
              statusParam === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {PLACE_REFERENCE_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {cityParam && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Şehir filtresi: <strong>{cityParam}</strong></span>
          <Link
            href={`/admin/place-references${statusParam ? `?status=${statusParam}` : ""}`}
            className="text-xs underline"
          >
            Kaldır
          </Link>
        </div>
      )}

      <PlaceReferenceTable records={records} />
    </div>
  );
}
