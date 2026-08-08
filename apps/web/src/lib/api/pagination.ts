export interface CursorParams {
  cursor?: string;
  limit: number;
}

/** Cursor pagination convention: `?cursor=<id>&limit=<n>`, capped at maxLimit. */
export function parseCursorParams(
  searchParams: URLSearchParams,
  opts?: { defaultLimit?: number; maxLimit?: number },
): CursorParams {
  const defaultLimit = opts?.defaultLimit ?? 20;
  const maxLimit = opts?.maxLimit ?? 100;

  const cursor = searchParams.get("cursor") ?? undefined;
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, maxLimit) : defaultLimit;

  return { cursor, limit };
}
