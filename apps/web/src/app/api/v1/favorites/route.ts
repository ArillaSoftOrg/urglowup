import { requireApiUser } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/response";
import { getCustomerFavorites } from "@/lib/queries/favorites";

// Not paginated — getCustomerFavorites is unbounded today (favorites lists
// are small in practice). Revisit if that stops being true; see the
// businesses-domain commit for why this query wasn't moved into
// packages/domain yet (coupled to marketplace DTO shaping).
export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const favorites = await getCustomerFavorites(auth.user.id);
  return apiOk({ data: favorites });
}
