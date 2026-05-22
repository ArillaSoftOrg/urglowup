import type { MetadataRoute } from "next";
import {
  getAllMarketplaceBusinessSlugs,
  getMarketplaceCategories,
  getMarketplaceCities,
  getMarketplaceDistricts,
} from "@/lib/queries/marketplace";

export const revalidate = 86400;

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://urglowup.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [businesses, categories, cities, districts] = await Promise.all([
    getAllMarketplaceBusinessSlugs(),
    getMarketplaceCategories(),
    getMarketplaceCities(),
    getMarketplaceDistricts(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                   changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/explore`,      changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/for-business`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/map`,          changeFrequency: "weekly",  priority: 0.4 },
  ];

  const businessPages: MetadataRoute.Sitemap = businesses.map((b) => ({
    url:             `${BASE_URL}/b/${b.slug}`,
    lastModified:    b.updatedAt,
    changeFrequency: "weekly",
    priority:        0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url:             `${BASE_URL}/category/${c.slug}`,
    changeFrequency: "weekly",
    priority:        0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = cities.map(({ city }) => ({
    url:             `${BASE_URL}/city/${encodeURIComponent(city)}`,
    changeFrequency: "weekly",
    priority:        0.6,
  }));

  const districtPages: MetadataRoute.Sitemap = districts.map(({ city, district }) => ({
    url:             `${BASE_URL}/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`,
    changeFrequency: "weekly",
    priority:        0.5,
  }));

  return [
    ...staticPages,
    ...businessPages,
    ...categoryPages,
    ...cityPages,
    ...districtPages,
  ];
}
