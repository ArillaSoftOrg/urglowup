import { ApiClient, createApiResources } from "@urglowup/api-client";
import { authClient, getSessionCookie } from "./auth";

const baseUrl = process.env.EXPO_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is not set — see .env.example");
}

export const apiClient = new ApiClient({
  baseUrl,
  getAuthHeaders: () => {
    const cookie = getSessionCookie();
    return cookie ? { Cookie: cookie } : null;
  },
  onUnauthorized: () => {
    // Session expired/revoked server-side (e.g. after deleteAccount(), or
    // natural expiry) — clear the local session so the UI drops back to
    // signed-out state instead of silently repeating failed requests.
    void authClient.signOut();
  },
});

export const api = createApiResources(apiClient);
