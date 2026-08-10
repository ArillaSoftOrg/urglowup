import http from "k6/http";
import { check } from "k6";

/**
 * Signs in via better-auth's REST endpoint and returns the cookie jar's
 * session cookie header value. k6's default http client persists
 * Set-Cookie automatically within a VU (http.CookieJar), so callers using
 * the same `http` module instance in the same VU/iteration don't need to
 * do anything extra — this helper exists mainly to fail loudly (via
 * `check`) if login itself breaks under load, which would otherwise show
 * up as confusing downstream 401s in every other request.
 */
export function signIn(baseUrl, email, password) {
  const res = http.post(
    `${baseUrl}/api/auth/sign-in/email`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, {
    "sign-in succeeded": (r) => r.status === 200,
  });

  return res;
}
