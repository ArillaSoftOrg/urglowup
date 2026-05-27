import { PRODUCTION_LOCALES } from './i18n-config'

/**
 * Builds Next.js `alternates` metadata for a public page.
 * Turkish canonical lives at root (no /tr prefix).
 * Only PRODUCTION_LOCALES appear in hreflang — locales pending native review are excluded.
 * x-default → Turkish root (primary market).
 */
export function buildAlternates(trPath: string, locale = 'tr') {
  const languages: Record<string, string> = { tr: trPath, 'x-default': trPath }
  for (const l of PRODUCTION_LOCALES) {
    languages[l] = `/${l}${trPath}`
  }
  const canonical = locale === 'tr' ? trPath : `/${locale}${trPath}`
  return { canonical, languages }
}

export function getOgLocale(locale: string): string {
  const map: Record<string, string> = {
    en: 'en_US',
    de: 'de_DE',
    ru: 'ru_RU',
    es: 'es_ES',
    bg: 'bg_BG',
  }
  return map[locale] ?? 'tr_TR'
}
