import { headers } from "next/headers";
import { safeJsonLd } from "@/lib/json-ld";

export async function JsonLd({ data }: { data: unknown }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
