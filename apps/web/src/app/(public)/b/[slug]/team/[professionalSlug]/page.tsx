import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/shared/json-ld";
import { CalendarCheck, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string; professionalSlug: string }>;
}

async function getProfessionalWithBusiness(businessSlug: string, professionalSlug: string) {
  return db.professional.findFirst({
    where: {
      slug: professionalSlug,
      isActive: true,
      business: { slug: businessSlug, status: { in: ["ACTIVE_PRIVATE", "ACTIVE_MARKETPLACE"] } },
    },
    include: {
      user: {
        select: { avatarUrl: true },
      },
      business: {
        select: {
          name: true,
          slug: true,
          coverImageUrl: true,
          categories: { include: { category: { select: { name: true } } }, take: 1 },
        },
      },
      services: {
        where: { service: { isActive: true } },
        include: {
          service: {
            select: { id: true, name: true, durationMinutes: true, price: true, priceType: true },
          },
        },
        orderBy: { service: { sortOrder: "asc" } },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, professionalSlug } = await params;
  const pro = await getProfessionalWithBusiness(slug, professionalSlug);
  if (!pro) return { title: "Uzman Bulunamadı" };

  const title = `${pro.displayName} — ${pro.business.name}`;
  const description = pro.bio ?? `${pro.displayName}, ${pro.business.name} ekibinden.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `/b/${slug}/team/${professionalSlug}`, type: "profile" },
  };
}

export default async function ProfessionalPage({ params }: PageProps) {
  const { slug, professionalSlug } = await params;
  const pro = await getProfessionalWithBusiness(slug, professionalSlug);
  if (!pro) notFound();

  const bookingBase = `/b/${slug}/book`;
  const avatarUrl = pro.avatarUrl ?? pro.user?.avatarUrl;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: pro.displayName,
    jobTitle: pro.title ?? undefined,
    description: pro.bio ?? undefined,
    image: avatarUrl ?? undefined,
    worksFor: {
      "@type": "LocalBusiness",
      name: pro.business.name,
      url: absoluteUrl(`/b/${slug}`),
    },
    url: absoluteUrl(`/b/${slug}/team/${professionalSlug}`),
  };

  return (
    <>
      <JsonLd data={personJsonLd} />

      <div className="container mx-auto max-w-2xl space-y-8 px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={`/b/${slug}`} className="hover:underline">{pro.business.name}</Link>
          <ChevronRight className="size-3.5 text-border" />
          <span className="font-medium text-foreground">{pro.displayName}</span>
        </nav>

        {/* Profile header */}
        <div className="flex items-start gap-5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={pro.displayName}
              width={96}
              height={96}
              className="size-24 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-surface-purple text-3xl font-bold text-brand-purple-foreground">
              {pro.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{pro.displayName}</h1>
            {pro.title && <p className="text-muted-foreground">{pro.title}</p>}
            <Badge variant="secondary">{pro.business.name}</Badge>
          </div>
        </div>

        {/* Bio */}
        {pro.bio && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Hakkında</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{pro.bio}</p>
          </div>
        )}

        {/* Services */}
        {pro.services.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Sunduğu Hizmetler</h2>
            <div className="divide-y rounded-xl border">
              {pro.services.map(({ service }) => {
                const price =
                  service.priceType === "FREE_CONSULTATION"
                    ? "Ücretsiz danışma"
                    : service.priceType === "CONSULTATION_REQUIRED"
                      ? "Fiyat için danışın"
                      : service.price
                        ? `₺${Number(service.price)}${service.priceType === "STARTS_FROM" ? " itibaren" : ""}`
                        : null;

                return (
                  <Link
                    key={service.id}
                    href={`${bookingBase}?service=${service.id}&professional=${pro.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {service.durationMinutes} dk
                      </p>
                    </div>
                    {price && <span className="shrink-0 text-sm font-semibold">{price}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={bookingBase}
          className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 rounded-full")}
        >
          <CalendarCheck className="size-4" />
          {pro.displayName} ile Randevu Al
        </Link>
      </div>
    </>
  );
}
