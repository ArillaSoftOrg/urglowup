import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MapRedirectPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
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

  redirect(`/explore?${params.toString()}`);
}
