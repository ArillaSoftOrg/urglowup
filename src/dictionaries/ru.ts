// LOCALE STATUS: review-needed — Machine-translated. Native review required before adding to PRODUCTION_LOCALES.
import type { Dictionary } from './tr'

const ru: Dictionary = {
  nav: {
    explore: 'Обзор',
    forBusiness: 'Для бизнеса',
    account: 'Мой аккаунт',
    businessPanel: 'Панель бизнеса',
    adminPanel: 'Панель администратора',
    signIn: 'Войти',
    signUp: 'Зарегистрироваться',
    openMenu: 'Открыть меню',
  },
  home: {
    badge: 'Красота и уход за собой',
    heroTitle: 'Вы заслуживаете лучшего ухода',
    heroBrand: 'за собой.',
    heroDescription:
      'Найдите специалистов по красоте рядом с вами. Смотрите реальные работы, читайте проверенные отзывы и записывайтесь с уверенностью.',
    categoriesLabel: 'Категории',
    categoriesTitle: 'Что вы ищете?',
    categoriesSeeAll: 'Смотреть все →',
    featuredLabel: 'Рекомендуемые',
    featuredTitle: 'Популярные мастера',
    featuredDescription: 'Самые популярные мастера среди наших клиентов.',
    featuredSeeAll: 'Смотреть всех мастеров →',
    ctaExplore: 'Найти мастеров',
    ctaForBusiness: 'Для бизнеса',
  },
  explore: {
    searchTitle: 'Поиск услуг',
    searchDescription: 'Найдите услугу, салон или категорию.',
    regionTitle: 'Поиск по региону',
    categoriesTitle: 'Что вы ищете?',
    allCategories: 'Все категории →',
    professionalCount: (n: number) => `Найдено ${n} мастеров`,
    emptyMessage: 'Мастера ещё не добавлены. Заходите позже.',
  },
  locale: {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    ru: 'Русский',
    es: 'Español',
    bg: 'Болгарский',
  },
}

export default ru
