// LOCALE STATUS: production
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
    listBusiness: 'Добавить бизнес',
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
  deals: {
    title: 'Акции',
    description: 'Актуальные акции и предложения от салонов.',
  },
  cookieConsent: {
    bannerTitle: 'Использование файлов cookie',
    bannerDescription: 'Мы используем файлы cookie для безопасности сайта, запоминания языка и улучшения опыта. Подробнее в нашей',
    acceptAll: 'Принять все',
    rejectNonEssential: 'Только необходимые',
    managePreferences: 'Управление настройками',
    savePreferences: 'Сохранить настройки',
    necessaryTitle: 'Строго необходимые',
    necessaryDesc: 'Необходимы для входа, безопасности и основных функций сайта. Нельзя отключить.',
    preferenceTitle: 'Предпочтения',
    preferenceDesc: 'Сохраняет ваш язык и тему оформления. Необходимо для запрошенных пользователем функций.',
    analyticsTitle: 'Аналитика',
    analyticsDesc: 'Позволяет анонимно анализировать поведение при навигации для улучшения платформы.',
    marketingTitle: 'Маркетинг',
    marketingDesc: 'Необходимо для получения рекламных сообщений и специальных предложений.',
    alwaysActive: 'Всегда активно',
    enabled: 'Включено',
    disabled: 'Отключено',
    policyUpdatedTitle: 'Наша политика конфиденциальности обновлена',
    policyUpdatedDesc: 'Мы внесли изменения в политику использования файлов cookie и конфиденциальности. Проверьте настройки, чтобы продолжить.',
    cookieSettings: 'Настройки файлов cookie',
  },
}

export default ru
