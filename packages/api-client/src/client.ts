// Typed fetch wrapper for /api/v1, matching the conventions in
// apps/web/src/lib/api/{response,pagination}.ts: error envelope
// { error: { code, message, fields? } }, cursor pagination { data, nextCursor }.
// Platform-agnostic — token storage (expo-secure-store on mobile) and base
// URL are injected by the caller, not baked in here, so this same client can
// be reused by web if it's ever useful there too.

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = "ApiError";
    this.code = body.error.code;
    this.status = status;
    this.fields = body.error.fields;
  }
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}

export interface ApiClientConfig {
  baseUrl: string;
  /**
   * Returns extra headers to authenticate the request, or null if signed
   * out. Deliberately not "getToken" + a hardcoded Authorization header:
   * @better-auth/expo's client plugin emulates a cookie jar (its
   * `getCookie()` action), not a bearer token, so the mobile app's real
   * implementation returns `{ Cookie: authClient.getCookie() }`. A future
   * caller using a true bearer token can just return
   * `{ Authorization: "Bearer ..." }` instead — this stays agnostic to which.
   */
  getAuthHeaders?: () => Promise<Record<string, string> | null> | Record<string, string> | null;
  /** Called on a 401 response, after the request has already failed — a hook to force sign-out. */
  onUnauthorized?: () => void;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (options?.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

    const authHeaders = await this.config.getAuthHeaders?.();
    if (authHeaders) Object.assign(headers, authHeaders);

    const response = await fetch(buildUrl(this.config.baseUrl, path, options?.query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });

    if (response.status === 401) {
      this.config.onUnauthorized?.();
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
      if (errorBody?.error) {
        throw new ApiError(response.status, errorBody);
      }
      throw new ApiError(response.status, {
        error: { code: "UNKNOWN_ERROR", message: `Request failed with status ${response.status}` },
      });
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PATCH", path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", path, undefined, options);
  }
}
