/**
 * AES-256-GCM token encryption for OAuth access/refresh tokens stored in
 * BusinessExternalConnection.accessTokenEncrypted / refreshTokenEncrypted.
 *
 * Uses the Node.js built-in `crypto` module — no external dependencies.
 *
 * Storage format:  "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * Key requirements:
 *   - OAUTH_TOKEN_ENCRYPTION_KEY env var must be a 64-character hex string (32 bytes)
 *   - Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Security properties:
 *   - AES-256-GCM provides authenticated encryption — any tampering of the stored
 *     ciphertext causes decryptToken() to throw, preventing silent data corruption.
 *   - The IV is random per call, so the same plaintext encrypts differently each time.
 *   - The key is never stored in the database — env var only.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm" as const;
const IV_BYTES = 12; // 96-bit IV — recommended for GCM
const AUTH_TAG_BYTES = 16; // 128-bit authentication tag
const SEPARATOR = ":";
const KEY_HEX_LENGTH = 64; // 32 bytes = 64 hex chars

/**
 * Parses and validates the 64-char hex key into a 32-byte Buffer.
 * Throws a descriptive error if the key is missing or invalid.
 */
function parseKey(hexKey: string): Buffer {
  if (!hexKey || hexKey.length !== KEY_HEX_LENGTH) {
    throw new Error(
      `[encryption] OAUTH_TOKEN_ENCRYPTION_KEY must be exactly ${KEY_HEX_LENGTH} hex characters (32 bytes). ` +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  if (!/^[0-9a-fA-F]+$/.test(hexKey)) {
    throw new Error(
      "[encryption] OAUTH_TOKEN_ENCRYPTION_KEY contains invalid characters. " +
        "Only hex characters (0-9, a-f, A-F) are allowed.",
    );
  }
  return Buffer.from(hexKey, "hex");
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt (e.g. an OAuth access token)
 * @param hexKey    - 64-character hex string (32 bytes)
 * @returns         Encrypted string in the format "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
export function encryptToken(plaintext: string, hexKey: string): string {
  const key = parseKey(hexKey);
  const iv = crypto.randomBytes(IV_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_BYTES,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    ciphertext.toString("hex"),
  ].join(SEPARATOR);
}

/**
 * Decrypts a string produced by `encryptToken`.
 *
 * @param encrypted - The encrypted string ("<iv_hex>:<authTag_hex>:<ciphertext_hex>")
 * @param hexKey    - 64-character hex string (32 bytes) — must match the key used to encrypt
 * @returns         The original plaintext string
 * @throws          If the format is invalid, the key is wrong, or the ciphertext was tampered with
 */
export function decryptToken(encrypted: string, hexKey: string): string {
  const parts = encrypted.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error(
      "[encryption] Invalid encrypted token format. " +
        "Expected \"<iv_hex>:<authTag_hex>:<ciphertext_hex>\" with exactly 2 separators.",
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = parseKey(hexKey);

  let iv: Buffer;
  let authTag: Buffer;
  let ciphertext: Buffer;
  try {
    iv = Buffer.from(ivHex, "hex");
    authTag = Buffer.from(authTagHex, "hex");
    ciphertext = Buffer.from(ciphertextHex, "hex");
  } catch {
    throw new Error(
      "[encryption] Failed to parse encrypted token components — hex decoding failed.",
    );
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error(
      "[encryption] Decryption failed: authentication tag mismatch. " +
        "The token may be corrupted, tampered with, or the encryption key is incorrect.",
    );
  }
}

/**
 * Encrypts a token using the key from the OAUTH_TOKEN_ENCRYPTION_KEY env var.
 * Use this in application code instead of passing the key explicitly.
 *
 * @throws If OAUTH_TOKEN_ENCRYPTION_KEY is not set or invalid
 */
export function encryptTokenWithEnvKey(plaintext: string): string {
  const hexKey = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error(
      "[encryption] OAUTH_TOKEN_ENCRYPTION_KEY environment variable is not set. " +
        "Token encryption is required before storing OAuth tokens. " +
        "Generate a key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return encryptToken(plaintext, hexKey);
}

/**
 * Decrypts a token using the key from the OAUTH_TOKEN_ENCRYPTION_KEY env var.
 * Use this in application code instead of passing the key explicitly.
 *
 * @throws If OAUTH_TOKEN_ENCRYPTION_KEY is not set, or decryption fails
 */
export function decryptTokenWithEnvKey(encrypted: string): string {
  const hexKey = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error(
      "[encryption] OAUTH_TOKEN_ENCRYPTION_KEY environment variable is not set. " +
        "Cannot decrypt stored OAuth tokens.",
    );
  }
  return decryptToken(encrypted, hexKey);
}
