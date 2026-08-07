/**
 * Usage policy enforcement for Google Business Profile external content.
 *
 * These functions serve as both compile-time documentation and runtime guardrails.
 * Call the appropriate assert function at any code path that could misuse Google data.
 *
 * Architecture rules enforced here:
 *   Rule 1: Google reviews NEVER write to the native Review table.
 *   Rule 2: Google photos NEVER write to BusinessMedia.
 *   Rule 3: Google photos NEVER upload to Cloudinary.
 *   Rule 4: Google rating and UrGlowUp rating are NEVER merged.
 *   Rule 5: Google content is NEVER used for AI training.
 *   Rule 6: Google content is NEVER used for marketplace ranking.
 *   Rule 7: Google attribution/source labels must always be preserved.
 */

// ── Custom error class ────────────────────────────────────────────────────────

/**
 * Thrown when code attempts to misuse Google-sourced content.
 * Use `instanceof ExternalContentPolicyError` in error handlers to distinguish
 * policy violations from other runtime errors.
 */
export class ExternalContentPolicyError extends Error {
  constructor(
    message: string,
    public readonly policyRule: string,
  ) {
    super(message);
    this.name = "ExternalContentPolicyError";
  }
}

// ── Policy guard functions ────────────────────────────────────────────────────

/**
 * Rule 5: Call at the entry point of any AI training pipeline.
 * Prevents Google-sourced content from being passed into model training.
 *
 * @throws ExternalContentPolicyError — always, by design
 */
export function assertNotForAITraining(context?: string): never {
  throw new ExternalContentPolicyError(
    "[Policy] Google Business Profile content MUST NOT be used for AI training. " +
      `Context: ${context ?? "unknown"}. ` +
      "This is prohibited by architecture rule 5 and Google's Terms of Service.",
    "NO_AI_TRAINING",
  );
}

/**
 * Rule 3: Call before any Cloudinary upload that might receive a Google photo URL.
 * Prevents Google CDN URLs from being re-hosted on Cloudinary.
 *
 * @throws ExternalContentPolicyError — always, by design
 */
export function assertNotForCloudinary(context?: string): never {
  throw new ExternalContentPolicyError(
    "[Policy] Google Business Profile photos MUST NOT be uploaded to Cloudinary. " +
      "Store only the direct Google CDN URL in ExternalMediaCache. " +
      `Context: ${context ?? "unknown"}. ` +
      "This is prohibited by architecture rule 3.",
    "NO_CLOUDINARY_UPLOAD",
  );
}

/**
 * Rule 2: Call before any insert into the BusinessMedia table.
 * Prevents Google photos from appearing in the native media library.
 *
 * @throws ExternalContentPolicyError — always, by design
 */
export function assertNotForNativeMediaLibrary(context?: string): never {
  throw new ExternalContentPolicyError(
    "[Policy] Google Business Profile photos MUST NOT be stored in BusinessMedia. " +
      "Use ExternalMediaCache instead. " +
      `Context: ${context ?? "unknown"}. ` +
      "This is prohibited by architecture rule 2.",
    "NO_NATIVE_MEDIA_LIBRARY",
  );
}

/**
 * Rule 6: Call before using Google review counts or ratings in marketplace ranking.
 * Prevents Google ratings from influencing UrGlowUp-native business ranking.
 *
 * @throws ExternalContentPolicyError — always, by design
 */
export function assertNotForMarketplaceRanking(context?: string): never {
  throw new ExternalContentPolicyError(
    "[Policy] Google Business Profile ratings MUST NOT influence marketplace ranking. " +
      "UrGlowUp and Google ratings are entirely separate systems. " +
      `Context: ${context ?? "unknown"}. ` +
      "This is prohibited by architecture rule 6.",
    "NO_MARKETPLACE_RANKING",
  );
}

/**
 * Rule 1: Call before any write to the native Review table with external data.
 * Enforces the strict separation between Google reviews and UrGlowUp reviews.
 *
 * @throws ExternalContentPolicyError — always, by design
 */
export function assertNotForNativeReviewTable(context?: string): never {
  throw new ExternalContentPolicyError(
    "[Policy] Google reviews MUST NOT be written to the native Review table. " +
      "Use ExternalReviewCache instead. " +
      `Context: ${context ?? "unknown"}. ` +
      "This is prohibited by architecture rule 1.",
    "NO_NATIVE_REVIEW_TABLE",
  );
}

// ── URL validation helpers ────────────────────────────────────────────────────

/** Google CDN hostname suffixes that are valid for ExternalMediaCache.sourceUrl */
const GOOGLE_CDN_HOSTNAMES = [
  ".google.com",
  ".googleapis.com",
  ".googleusercontent.com",
] as const;

/**
 * Returns true if the URL's hostname belongs to Google's CDN.
 * Used as a sanity check before storing URLs in ExternalMediaCache.
 */
export function isGoogleCdnUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return GOOGLE_CDN_HOSTNAMES.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

/**
 * Throws if the given URL is NOT a Google CDN URL.
 * Call this before any write of a photo URL to ExternalMediaCache.
 *
 * @throws ExternalContentPolicyError if the URL is not a Google CDN URL
 */
export function assertGoogleCdnUrl(url: string, context?: string): void {
  if (!isGoogleCdnUrl(url)) {
    throw new ExternalContentPolicyError(
      `[Policy] Expected a Google CDN URL for external media storage, but received: "${url}". ` +
        "Google photos must be served directly from Google CDN — not re-hosted. " +
        `Context: ${context ?? "unknown"}.`,
      "INVALID_GOOGLE_CDN_URL",
    );
  }
}

/**
 * Throws if the given URL is a Cloudinary URL (common mistake guard).
 * Provides a more specific error message than assertGoogleCdnUrl alone.
 */
export function assertNotCloudinaryUrl(url: string, context?: string): void {
  try {
    const { hostname } = new URL(url);
    if (hostname.includes("cloudinary.com") || hostname.includes("res.cloudinary")) {
      throw new ExternalContentPolicyError(
        `[Policy] Cloudinary URLs MUST NOT be stored in ExternalMediaCache. ` +
          `Received Cloudinary URL: "${url}". ` +
          "Google photos must remain on Google CDN. " +
          `Context: ${context ?? "unknown"}.`,
        "NO_CLOUDINARY_URL_IN_CACHE",
      );
    }
  } catch (err) {
    if (err instanceof ExternalContentPolicyError) throw err;
    // URL parse failed — let assertGoogleCdnUrl handle it
  }
}
