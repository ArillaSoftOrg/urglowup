import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LocaleMapRedirectPage({
  params: routeParams,
  searchParams,
}: PageProps) {
  const [{ locale }, rawParams] = await Promise.all([
    routeParams,
    searchParams,
  ]);
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(rawParams)) {
    if (key === "view" || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, value);
    }
  }
  params.set("view", "map");

  redirect(`/${locale}/explore?${params.toString()}`);
}
