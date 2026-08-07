import 'server-only'
import { DEFAULT_LOCALE, isValidLocale, type Locale } from './i18n-config'

const dictionaries = {
  tr: () => import('@/dictionaries/tr').then((m) => m.default),
  en: () => import('@/dictionaries/en').then((m) => m.default),
  de: () => import('@/dictionaries/de').then((m) => m.default),
  ru: () => import('@/dictionaries/ru').then((m) => m.default),
  es: () => import('@/dictionaries/es').then((m) => m.default),
  bg: () => import('@/dictionaries/bg').then((m) => m.default),
  fa: () => import('@/dictionaries/fa').then((m) => m.default),
  pl: () => import('@/dictionaries/pl').then((m) => m.default),
  ar: () => import('@/dictionaries/ar').then((m) => m.default),
  fr: () => import('@/dictionaries/fr').then((m) => m.default),
  nl: () => import('@/dictionaries/nl').then((m) => m.default),
  ro: () => import('@/dictionaries/ro').then((m) => m.default),
}

export const getDictionary = async (locale: string) => {
  const safeLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE
  return dictionaries[safeLocale]()
}
