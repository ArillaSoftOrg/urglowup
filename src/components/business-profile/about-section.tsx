"use client";

import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { SocialIcon, type SocialIconName } from "@/components/shared/social-icons";
import { LocationSection } from "./location-section";
import { Phone } from "lucide-react";

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const hasSocial = SOCIAL_LINKS.some((s) => !!business[s.key]);
  const hasContact = !!(business.phone || business.whatsapp);
  const hasAddress = business.address || business.city || business.district;
  const inlinePreviewLimit = 230;
  const inlineText =
    inlineReadMore && business.description && business.description.length > inlinePreviewLimit
      ? `${business.description.slice(0, inlinePreviewLimit).trimEnd()}...`
      : business.description;
  const showReadMore =
    inlineReadMore && business.description
      ? business.description.length > inlinePreviewLimit
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
              {inlineText}
            </p>

            {showReadMore && (
              <>
                {/* Mobile: opens bottom sheet so text never competes with sticky CTA */}
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className={cn(
                    "text-sm font-semibold text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden",
                    inlineReadMore ? "ml-1 inline align-baseline" : "mt-2.5 block",
                  )}
                >
                  Devamını okuyun
                </button>

                {/* Desktop: expand in-place */}
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2.5 hidden text-sm font-semibold text-primary hover:underline focus:outline-none md:inline"
                >
                  {expanded ? "Daha az göster" : "Devamını oku"}
                </button>

                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetContent
                    side="bottom"
                    className="max-h-[78dvh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom,24px)]"
                  >
                    <SheetHeader className="px-5 pb-3 pt-1">
                      <SheetTitle className="text-base font-bold">Hakkında</SheetTitle>
                    </SheetHeader>
                    <div className="px-5 pb-6">
                      <p className="whitespace-pre-line text-[15px] leading-[1.8] text-foreground/90">
                        {business.description}
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
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
                ) : null
              )}
            </div>
          </div>
        )}
      </div>

      {showLocation && hasAddress && <LocationSection business={business} showTitle={false} />}
    </div>
  );
}
