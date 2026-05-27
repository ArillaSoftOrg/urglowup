export const SUPPORTED_LOCALES = ['tr', 'en', 'de', 'ru', 'es', 'bg'] as const
export const DEFAULT_LOCALE = 'tr' as const
export const INTL_LOCALES = ['en', 'de', 'ru', 'es', 'bg'] as const

// Locales that are native-reviewed and safe to index.
// Add a locale here only after a native speaker has reviewed its dictionary file
// and the file's status comment is changed to "production".
export const PRODUCTION_LOCALES = ['en', 'de'] as const

export type Locale = typeof SUPPORTED_LOCALES[number]
export type IntlLocale = typeof INTL_LOCALES[number]
export type ProductionLocale = typeof PRODUCTION_LOCALES[number]

export function isValidLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function isIntlLocale(value: string): value is IntlLocale {
  return INTL_LOCALES.includes(value as IntlLocale)
}

export function isProductionLocale(locale: string): boolean {
  if (locale === DEFAULT_LOCALE) return true
  return (PRODUCTION_LOCALES as readonly string[]).includes(locale)
}
