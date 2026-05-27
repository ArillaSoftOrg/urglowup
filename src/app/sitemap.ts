import type { MetadataRoute } from "next";
import {
  getAllMarketplaceBusinessSlugs,
  getMarketplaceCategories,
  getMarketplaceCities,
  getMarketplaceDistricts,
} from "@/lib/queries/marketplace";
import { getAllStyleTags } from "@/lib/queries/style-tags";
import { PRODUCTION_LOCALES } from "@/lib/i18n-config";

export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://urglowup.vercel.app";

function forAllLocales(
  trPath: string,
  opts: Omit<MetadataRoute.Sitemap[number], "url">
): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}${trPath}`, ...opts },
    ...PRODUCTION_LOCALES.map((l) => ({
      url: `${BASE_URL}/${l}${trPath}`,
      ...opts,
      priority: Math.round(((opts.priority ?? 0.5) * 0.9) * 100) / 100,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [businesses, categories, cities, districts, styleTags] = await Promise.all([
    getAllMarketplaceBusinessSlugs(),
    getMarketplaceCategories(),
    getMarketplaceCities(),
    getMarketplaceDistricts(),
    getAllStyleTags(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    ...forAllLocales("",              { changeFrequency: "daily",   priority: 1.0 }),
    ...forAllLocales("/explore",      { changeFrequency: "daily",   priority: 0.9 }),
    ...forAllLocales("/styles",       { changeFrequency: "weekly",  priority: 0.6 }),
    ...forAllLocales("/for-business", { changeFrequency: "monthly", priority: 0.6 }),
    ...forAllLocales("/map",          { changeFrequency: "weekly",  priority: 0.4 }),
  ];

  const businessPages: MetadataRoute.Sitemap = businesses.flatMap((b) =>
    forAllLocales(`/b/${b.slug}`, {
      lastModified:    b.updatedAt,
      changeFrequency: "weekly",
      priority:        0.8,
    })
  );

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((c) =>
    forAllLocales(`/category/${c.slug}`, {
      changeFrequency: "weekly",
      priority:        0.7,
    })
  );

  const cityPages: MetadataRoute.Sitemap = cities.flatMap(({ city }) =>
    forAllLocales(`/city/${encodeURIComponent(city)}`, {
      changeFrequency: "weekly",
      priority:        0.6,
    })
  );

  const districtPages: MetadataRoute.Sitemap = districts.flatMap(
    ({ city, district }) =>
      forAllLocales(
        `/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`,
        { changeFrequency: "weekly", priority: 0.5 }
      )
  );

  const styleTagPages: MetadataRoute.Sitemap = styleTags
    .filter((t) => t.postCount > 0)
    .flatMap((t) =>
      forAllLocales(`/styles/${t.slug}`, {
        changeFrequency: "weekly",
        priority:        0.65,
      })
    );

  return [
    ...staticPages,
    ...businessPages,
    ...categoryPages,
    ...cityPages,
    ...districtPages,
    ...styleTagPages,
  ];
}
