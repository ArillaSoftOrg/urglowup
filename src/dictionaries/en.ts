import type { Dictionary } from './tr'

const en: Dictionary = {
  nav: {
    explore: 'Explore',
    forBusiness: 'For Business',
    account: 'My Account',
    businessPanel: 'Business Panel',
    adminPanel: 'Admin Panel',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    openMenu: 'Open menu',
  },
  home: {
    badge: 'Beauty & Personal Care',
    heroTitle: 'You deserve the best care',
    heroBrand: 'for yourself.',
    heroDescription:
      'Discover beauty professionals near you. See real work, read verified reviews, and book with confidence.',
    categoriesLabel: 'Categories',
    categoriesTitle: 'What are you looking for?',
    categoriesSeeAll: 'Explore all →',
    featuredLabel: 'Featured',
    featuredTitle: 'Popular professionals',
    featuredDescription: 'The most preferred professionals by our customers.',
    featuredSeeAll: 'See all professionals →',
    ctaExplore: 'Explore Professionals',
    ctaForBusiness: 'For Business',
  },
  explore: {
    searchTitle: 'Search services',
    searchDescription: 'Search by service, business, or category.',
    regionTitle: 'Explore by region',
    categoriesTitle: 'What are you looking for?',
    allCategories: 'All categories →',
    professionalCount: (n: number) => `${n} professionals found`,
    emptyMessage: 'No professionals listed yet. Check back soon.',
  },
  locale: {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    ru: 'Русский',
    es: 'Español',
  },
}

export default en
