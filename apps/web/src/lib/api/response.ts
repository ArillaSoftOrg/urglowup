import { NextResponse } from "next/server";

/**
 * Shared /api/v1 response conventions (see master implementation plan, Phase 3):
 * error envelope `{ error: { code, message, fields? } }`, cursor pagination
 * `{ data, nextCursor }`. Domain services return DTOs already — routes just
 * serialize them, never a raw Prisma model.
 */

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status: STATUS_BY_CODE[code] },
  );
}

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}

export function apiPage<T>(page: Page<T>): NextResponse {
  return NextResponse.json(page);
}
