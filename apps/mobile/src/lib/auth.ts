import { createAuthClient } from "better-auth/react";
import type { BetterAuthClientPlugin } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

// Auth transport: @better-auth/expo's client plugin emulates a browser
// cookie jar (captures Set-Cookie on sign-in, persists it in SecureStore,
// re-attaches it as a Cookie header on requests made through this client's
// own fetch). The server's bearer() plugin (apps/web/src/lib/auth.ts) is
// registered too, but this is the transport the official Expo client
// actually uses by default — see packages/api-client's getAuthHeaders doc
// comment for how the two connect.
// The plugin's inferred generic parameters don't structurally match
// createAuthClient's expected BetterAuthClientPlugin shape in this
// better-auth/@better-auth/expo version pair (both pinned to 1.6.26 — this
// isn't a version skew, just TS generic inference not collapsing cleanly
// through better-auth's conditional types). Verified against
// @better-auth/expo's own .d.ts that getCookie() exists on the plugin's
// getActions() return value at runtime; this cast only papers over the
// static type, not the actual behavior.
const expoPlugin = expoClient({
  scheme: "urglowup",
  storagePrefix: "urglowup",
  storage: SecureStore,
}) as unknown as BetterAuthClientPlugin;

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [expoPlugin],
});

export type Session = typeof authClient.$Infer.Session;

export function getSessionCookie(): string | null {
  const client = authClient as unknown as { getCookie: () => string };
  const cookie = client.getCookie();
  return cookie || null;
}
