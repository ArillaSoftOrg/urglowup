import { apiOk, apiError } from "@/lib/api/response";
import { getBusinessBySlug } from "@urglowup/domain/businesses";
import { toBusinessDetailDTO } from "@/lib/api/dto";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return apiError("NOT_FOUND", "Business not found.");
  }

  return apiOk(toBusinessDetailDTO(business));
}
