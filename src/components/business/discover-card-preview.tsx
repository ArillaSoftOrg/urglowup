import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { UserRound } from "lucide-react";

interface DiscoverCardPreviewProps {
  name: string;
  coverUrl: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  categories: string[];
  rating: number | null;
  reviewCount: number;
}

export function DiscoverCardPreview({
  name,
  coverUrl,
  logoUrl,
  city,
  district,
  categories,
  rating,
  reviewCount,
}: DiscoverCardPreviewProps) {
  const location = [district, city].filter(Boolean).join(", ");
  const categoryLine = categories[0] ?? null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Keşfet kartı önizlemesi
      </p>
      <div className="w-52 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`${name} kapak`}
              fill
              sizes="208px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-surface-cream">
              <p className="px-2 text-center text-[10px] text-muted-foreground">
                Kapak fotoğrafı ekleyin
              </p>
            </div>
          )}
          {logoUrl && (
            <div className="absolute bottom-2 left-2 size-8 overflow-hidden rounded-md border-2 border-card bg-card shadow">
              <Image
                src={logoUrl}
                alt={`${name} logosu`}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          )}
          {!logoUrl && (
            <div className="absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-md border-2 border-card bg-card shadow">
              <UserRound className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="space-y-0.5 px-2.5 py-2">
          <p className="truncate text-xs font-semibold leading-tight">{name}</p>
          {(location || categoryLine) && (
            <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
              <MapPin className="size-2.5 shrink-0" />
              {[categoryLine, location].filter(Boolean).join(" · ")}
            </p>
          )}
          {reviewCount > 0 && rating !== null && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Star className="size-2.5 fill-rating text-rating" />
              <span className="font-medium text-foreground">{(rating / 2).toFixed(1)}</span>
              <span>({reviewCount})</span>
            </p>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Keşfet ve arama sonuçlarında bu şekilde görünür
      </p>
    </div>
  );
}
