export function safeJsonLd(value: unknown): string {
  const bs = String.fromCharCode(92);
  return JSON.stringify(value)
    .replace(/</g, bs + "u003c")
    .replace(/>/g, bs + "u003e")
    .replace(/&/g, bs + "u0026");
}
