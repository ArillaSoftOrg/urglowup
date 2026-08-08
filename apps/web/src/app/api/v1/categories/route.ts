import { apiOk } from "@/lib/api/response";
import { getMarketplaceCategories } from "@/lib/queries/marketplace";

export async function GET() {
  const categories = await getMarketplaceCategories();
  return apiOk({ data: categories });
}
