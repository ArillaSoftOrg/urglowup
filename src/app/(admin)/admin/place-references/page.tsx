import Link from "next/link";
import {
  getAdminPlaceReferences,
  getAdminCategories,
  getAdminBusinesses,
  isValidPlaceReferenceStatus,
} from "@/lib/queries/admin";
import { PlaceReferenceTable } from "@/components/admin/place-reference-table";
import { PlaceDiscoveryPanel } from "@/components/admin/place-discovery-panel";
import {
  PLACE_REFERENCE_STATUS_HELP,
  PLACE_REFERENCE_STATUS_LABELS,
} from "@/lib/constants/place-reference";
import type { PlaceReferenceStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Admin - Yer Referansları" };

const STATUS_FILTER_GROUPS: {
  label: string;
  statuses: PlaceReferenceStatus[];
}[] = [
  { label: "Yeni", statuses: ["DISCOVERED"] },
  { label: "Yayında", statuses: ["APPROVED"] },
  { label: "Bağlandı", statuses: ["CLAIM_PENDING", "CLAIMED"] },
  { label: "Sorunlu", statuses: ["DUPLICATE", "STALE", "ERROR"] },
  { label: "Gizlenenler", statuses: ["HIDDEN", "REJECTED"] },
];

const STATUS_GUIDE: PlaceReferenceStatus[] = [
  "DISCOVERED",
  "APPROVED",
  "CLAIM_PENDING",
  "CLAIMED",
  "DUPLICATE",
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

  const [records, categories, businesses] = await Promise.all([
    getAdminPlaceReferences({
      status: statusParam,
      city: cityParam,
    }),
    getAdminCategories(),
    getAdminBusinesses(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yer Referansları</h1>
          <p className="text-muted-foreground">
            Google Places üzerinden keşfedilen dış işletme referansları.
          </p>
        </div>
        <div className="w-full lg:w-80">
          <PlaceDiscoveryPanel />
        </div>
      </div>

      <div className="rounded-md border bg-muted/20 p-3">
        <div className="mb-2 text-sm font-medium">Statü rehberi</div>
        <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
          {STATUS_GUIDE.map((status) => (
            <div key={status} className="min-w-0">
              <span className="font-medium text-foreground">
                {PLACE_REFERENCE_STATUS_LABELS[status]}:
              </span>{" "}
              {PLACE_REFERENCE_STATUS_HELP[status]}
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="space-y-3 text-sm">
        <Link
          href="/admin/place-references"
          className={`inline-flex h-8 items-center rounded-full border px-3 transition-colors ${
            !statusParam
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          Tümü
        </Link>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {STATUS_FILTER_GROUPS.map((group) => (
            <div key={group.label} className="min-w-0 space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.statuses.map((s) => (
                  <Link
                    key={s}
                    href={`/admin/place-references?status=${s}${cityParam ? `&city=${encodeURIComponent(cityParam)}` : ""}`}
                    title={PLACE_REFERENCE_STATUS_HELP[s]}
                    className={`inline-flex h-7 items-center rounded-full border px-2.5 transition-colors ${
                      statusParam === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {PLACE_REFERENCE_STATUS_LABELS[s]}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
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

      <PlaceReferenceTable
        records={records}
        categories={categories}
        businesses={businesses.map((business) => ({
          id: business.id,
          name: business.name,
          slug: business.slug,
          city: business.city,
          district: business.district,
          status: business.status,
          ownershipStatus: business.ownershipStatus,
          owner: business.owner
            ? {
                email: business.owner.email,
                firstName: business.owner.firstName,
                lastName: business.owner.lastName,
              }
            : null,
        }))}
      />
    </div>
  );
}
