export const SUPPORTED_LOCALES = ['tr', 'en', 'de', 'ru', 'es'] as const
export const DEFAULT_LOCALE = 'tr' as const
export const INTL_LOCALES = ['en', 'de', 'ru', 'es'] as const

export type Locale = typeof SUPPORTED_LOCALES[number]
export type IntlLocale = typeof INTL_LOCALES[number]

export function isValidLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function isIntlLocale(value: string): value is IntlLocale {
  return INTL_LOCALES.includes(value as IntlLocale)
}
