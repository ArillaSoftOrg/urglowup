"use client";

import { useEffect, useRef, useState } from "react";
import { Phone } from "lucide-react";
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
  },
  {
    key: "facebookUrl" as const,
    label: "Facebook",
    icon: "facebook" as SocialIconName,
  },
  {
    key: "tiktokUrl" as const,
    label: "TikTok",
    icon: "tiktok" as SocialIconName,
  },
];

export function AboutSection({
  business,
  showLocation = true,
  showTopBorder = true,
  inlineReadMore = false,
}: {
  business: BusinessWithDetails;
  showLocation?: boolean;
  showTopBorder?: boolean;
  inlineReadMore?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const hasSocial = SOCIAL_LINKS.some((s) => !!business[s.key]);
  const hasContact = !!(business.phone || business.whatsapp);
  const hasAddress = business.address || business.city || business.district;
  const inlinePreviewLimit = 230;
  const shouldInlineTruncate =
    inlineReadMore &&
    !expanded &&
    !!business.description &&
    business.description.length > inlinePreviewLimit;
  const descriptionText = shouldInlineTruncate
    ? `${business.description!.slice(0, inlinePreviewLimit).trimEnd()}...`
    : business.description;
  const showReadMore =
    inlineReadMore && business.description
      ? !expanded && business.description.length > inlinePreviewLimit
      : overflows;

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > el.clientHeight);
  }, []);

  if (!business.description && !hasContact && !hasSocial && !hasAddress) return null;

  return (
    <div
      className={cn(
        "space-y-6",
        showTopBorder ? "border-t border-border/70 pt-8 md:pt-10" : "pt-0",
      )}
    >
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-normal">Hakkında</h2>

        {business.description && (
          <div>
            <p
              ref={textRef}
              className={cn(
                "whitespace-pre-line text-[15px] leading-[1.8] text-foreground/90",
                inlineReadMore && "inline leading-[1.55] text-foreground",
                !inlineReadMore && !expanded && "line-clamp-4",
              )}
            >
              {descriptionText}
            </p>

            {showReadMore && (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className={cn(
                    "text-sm font-semibold text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden",
                    inlineReadMore ? "ml-1 inline align-baseline" : "mt-2.5 block",
                  )}
                >
                  Devamını okuyun
                </button>

                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2.5 hidden text-sm font-semibold text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 md:inline"
                >
                  {expanded ? "Daha az göster" : "Devamını oku"}
                </button>
              </>
            )}
          </div>
        )}

        {hasContact && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              İletişime geçin
            </p>
            <div className="flex flex-wrap gap-2">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 gap-2.5 bg-background font-medium",
                  )}
                >
                  <Phone className="size-4 shrink-0" />
                  <span className="truncate">{business.phone}</span>
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 gap-2.5 bg-background font-medium",
                  )}
                >
                  <SocialIcon name="whatsapp" className="size-4 shrink-0" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {hasSocial && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bizi takip edin
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ key, label, icon }) =>
                business[key] ? (
                  <a
                    key={key}
                    href={business[key]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "default" }),
                      "h-10 gap-2.5 bg-background font-medium",
                    )}
                  >
                    <SocialIcon name={icon} className="size-4 shrink-0" />
                    {label}
                  </a>
                ) : null,
              )}
            </div>
          </div>
        )}
      </div>

      {showLocation && hasAddress && <LocationSection business={business} showTitle={false} />}
    </div>
  );
}
