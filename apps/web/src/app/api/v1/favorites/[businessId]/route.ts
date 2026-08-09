import { requireApiUser } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { toggleFavorite } from "@urglowup/domain/favorites";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ businessId: string }>;
}

async function isFavorited(userId: string, businessId: string): Promise<boolean> {
  const existing = await db.favorite.findUnique({
    where: { userId_businessId: { userId, businessId } },
    select: { id: true },
  });
  return existing !== null;
}

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "favorite",
    subjectId: auth.user.id,
    ipLimit: 60,
    subjectLimit: 40,
  });
  if (limited) return limited;

  const { businessId } = await params;
  const alreadyFavorited = await isFavorited(auth.user.id, businessId);
  if (!alreadyFavorited) {
    await toggleFavorite(auth.user.id, businessId);
  }

  return apiOk({ isFavorited: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "favorite",
    subjectId: auth.user.id,
    ipLimit: 60,
    subjectLimit: 40,
  });
  if (limited) return limited;

  const { businessId } = await params;
  const alreadyFavorited = await isFavorited(auth.user.id, businessId);
  if (alreadyFavorited) {
    await toggleFavorite(auth.user.id, businessId);
  }

  return apiOk({ isFavorited: false });
}
