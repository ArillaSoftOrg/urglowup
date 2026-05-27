import 'server-only'
import type { Locale } from './i18n-config'

const dictionaries = {
  tr: () => import('@/dictionaries/tr').then((m) => m.default),
  en: () => import('@/dictionaries/en').then((m) => m.default),
  de: () => import('@/dictionaries/de').then((m) => m.default),
  ru: () => import('@/dictionaries/ru').then((m) => m.default),
  es: () => import('@/dictionaries/es').then((m) => m.default),
  bg: () => import('@/dictionaries/bg').then((m) => m.default),
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]()
