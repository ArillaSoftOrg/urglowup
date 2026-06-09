import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getServiceBySlug, type ServiceWithDetails } from "@/lib/queries/services";
import { getCategoryLabel } from "@/lib/category-labels";
import { optimizeBusinessCoverUrl } from "@/lib/optimized-media";
import { getOptimizedUrl } from "@/lib/cloudinary";
import { buildAlternates } from "@/lib/i18n-metadata";
import { absoluteUrl } from "@/lib/seo";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, MapPin, CalendarCheck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(service: ServiceWithDetails): {
  amount: string | null;
  qualifier: string | null;
} {
  if (service.priceType === "FREE_CONSULTATION")
    return { amount: "Ücretsiz danışma", qualifier: null };
  if (service.priceType === "CONSULTATION_REQUIRED")
    return { amount: "Fiyat için danışın", qualifier: null };
  if (!service.price) return { amount: null, qualifier: null };

  const amount = `₺${Number(service.price)}`;
  if (service.priceType === "STARTS_FROM") return { amount, qualifier: "itibaren" };
  return { amount, qualifier: null };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Hizmet Bulunamadı" };

  const title = `${service.name} — ${service.business.name}`;
  const description =
    service.description ??
    `${service.business.name} tarafından sunulan ${service.name} hizmetini UrGlowUp'ta inceleyin.`;
  const ogImage =
    service.media[0]?.publicId
      ? getOptimizedUrl(service.media[0].publicId, { width: 1200, crop: "limit", quality: "auto:good" })
      : (service.business.coverImageUrl ?? undefined);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/services/${slug}`,
      type: "website",
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    alternates: buildAlternates(`/services/${slug}`, "tr"),
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) notFound();

  const { business } = service;
  const { amount, qualifier } = formatPrice(service);
  const serviceUrl = absoluteUrl(`/services/${service.slug}`);
  const businessUrl = absoluteUrl(`/b/${business.slug}`);
  const primaryCategory = business.categories[0]?.category;
  const locationText = [business.district, business.city].filter(Boolean).join(", ");
  const coverImageUrl = optimizeBusinessCoverUrl(
    business.media.find((m) => m.type === "COVER"),
    business.coverImageUrl,
    400
  );

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description:
      service.description ??
      `${business.name} tarafından sunulan ${service.name} hizmeti.`,
    url: serviceUrl,
    provider: {
      "@type": "LocalBusiness",
      name: business.name,
      url: businessUrl,
      ...(locationText && {
        address: {
          "@type": "PostalAddress",
          addressLocality: business.district ?? business.city ?? undefined,
          addressRegion: business.city ?? undefined,
          addressCountry: "TR",
        },
      }),
    },
    offers: {
      "@type": "Offer",
      price: service.price != null ? Number(service.price) : undefined,
      priceCurrency: service.price != null ? "TRY" : undefined,
      url: absoluteUrl(`/b/${business.slug}/book?service=${service.id}`),
    },
    isRelatedTo: {
      "@type": "LocalBusiness",
      name: business.name,
      url: businessUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Ana Sayfa</Link>
          <ChevronRight className="size-3.5 text-border" />
          <Link href={`/b/${business.slug}`} className="hover:underline">{business.name}</Link>
          <ChevronRight className="size-3.5 text-border" />
          <span className="font-medium text-foreground">{service.name}</span>
        </nav>

        {/* Header */}
        <div className="space-y-3">
          {primaryCategory && (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {getCategoryLabel(primaryCategory.slug, primaryCategory.name)}
            </p>
          )}
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">{service.name}</h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {service.durationMinutes} dk
            </div>
            {locationText && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {locationText}
              </div>
            )}
            {amount && (
              <div className="flex items-center gap-1.5">
                {qualifier && <span className="text-xs">{qualifier}</span>}
                <span className="text-base font-bold text-foreground">{amount}</span>
              </div>
            )}
          </div>

          <Link
            href={`/b/${business.slug}/book?service=${service.id}`}
            className={cn(buttonVariants({ variant: "brand", size: "lg" }), "gap-2")}
          >
            <CalendarCheck className="size-4" />
            Randevu Al
          </Link>
        </div>

        {/* Description */}
        {service.description && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">Hizmet Hakkında</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {service.description}
            </p>
          </div>
        )}

        {/* Media gallery */}
        {service.media.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">Görseller</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {service.media.map((item) => {
                const url = getOptimizedUrl(item.publicId, {
                  width: 480,
                  crop: "fill",
                  quality: "auto:good",
                });
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={item.id}
                    src={url}
                    alt={item.title ?? service.name}
                    className="aspect-square w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Business card */}
        <Link
          href={`/b/${business.slug}`}
          className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface-cream p-4 transition-colors hover:border-border"
        >
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={business.name}
              className="size-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-pink/10">
              <Store className="size-6 text-brand-pink-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{business.name}</p>
            {locationText && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {locationText}
              </p>
            )}
            {business.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {business.categories.slice(0, 3).map(({ category }) => (
                  <Badge key={category.id} variant="secondary">
                    {getCategoryLabel(category.slug, category.name)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      </div>
    </>
  );
}
