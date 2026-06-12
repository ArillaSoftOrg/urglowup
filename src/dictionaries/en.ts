// LOCALE STATUS: production
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
    listBusiness: 'List your business',
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
  deals: {
    title: 'Deals',
    description: 'Current promotions and offers from businesses.',
  },
  cookieConsent: {
    bannerTitle: 'Cookie Usage',
    bannerDescription: 'We use cookies to keep the site secure, remember your language preference, and improve your experience. See our',
    acceptAll: 'Accept all',
    rejectNonEssential: 'Necessary only',
    managePreferences: 'Manage preferences',
    savePreferences: 'Save preferences',
    necessaryTitle: 'Strictly Necessary',
    necessaryDesc: 'Required for login, security, and core site functions. Cannot be disabled.',
    preferenceTitle: 'Preference',
    preferenceDesc: 'Remembers your language and theme choices. Required for user-requested functionality.',
    analyticsTitle: 'Analytics',
    analyticsDesc: 'Allows anonymous analysis of navigation behaviour to help us improve the platform.',
    marketingTitle: 'Marketing',
    marketingDesc: 'Required to receive campaign and promotional communications.',
    alwaysActive: 'Always active',
    enabled: 'Enabled',
    disabled: 'Disabled',
    policyUpdatedTitle: 'Our privacy policy has been updated',
    policyUpdatedDesc: 'We made changes to our cookie and privacy policy. Please review your preferences to continue.',
    cookieSettings: 'Cookie Settings',
  },
}

export default en
