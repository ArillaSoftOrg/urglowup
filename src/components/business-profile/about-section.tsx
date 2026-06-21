import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { SocialIcon, type SocialIconName } from "@/components/shared/social-icons";
import { LocationSection } from "./location-section";

const SOCIAL_LINKS = [
  {
    key: "instagramUrl" as const,
    label: "Instagram",
    icon: "instagram" as SocialIconName,
    colorClass: "text-[#E4405F]",
  },
  {
    key: "facebookUrl" as const,
    label: "Facebook",
    icon: "facebook" as SocialIconName,
    colorClass: "text-[#0866FF]",
  },
  {
    key: "tiktokUrl" as const,
    label: "TikTok",
    icon: "tiktok" as SocialIconName,
    colorClass: "text-foreground",
  },
];

export function AboutSection({ business }: { business: BusinessWithDetails }) {
  const hasSocial = SOCIAL_LINKS.some((s) => !!business[s.key]);
  const hasAddress = business.address || business.city || business.district;

  if (!business.description && !hasSocial && !hasAddress) return null;

  return (
    <div className="space-y-6 border-t border-border/70 pt-10">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-normal lg:text-[30px]">
          Hakkında
        </h2>
        {business.description && (
          <p className="max-w-[75ch] whitespace-pre-line text-[17px] leading-8 text-foreground">
            {business.description}
          </p>
        )}
        {hasSocial && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Bizi takip edin
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ key, label, icon, colorClass }) =>
                business[key] ? (
                  <a
                    key={key}
                    href={business[key]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-2 bg-background",
                    )}
                  >
                    <SocialIcon name={icon} className={cn("size-4", colorClass)} />
                    {label}
                  </a>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>
      {hasAddress && <LocationSection business={business} showTitle={false} />}
    </div>
  );
}
