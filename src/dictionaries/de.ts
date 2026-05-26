import type { Dictionary } from './tr'

const de: Dictionary = {
  nav: {
    explore: 'Entdecken',
    forBusiness: 'Für Unternehmen',
    account: 'Mein Konto',
    businessPanel: 'Unternehmens-Panel',
    adminPanel: 'Admin-Panel',
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    openMenu: 'Menü öffnen',
  },
  home: {
    badge: 'Schönheit & Körperpflege',
    heroTitle: 'Du verdienst die beste Pflege',
    heroBrand: 'für dich.',
    heroDescription:
      'Entdecke Schönheitsprofis in deiner Nähe. Sieh echte Arbeiten, lies verifizierte Bewertungen und buche mit Vertrauen.',
    categoriesLabel: 'Kategorien',
    categoriesTitle: 'Was suchst du?',
    categoriesSeeAll: 'Alle entdecken →',
    featuredLabel: 'Empfohlen',
    featuredTitle: 'Beliebte Profis',
    featuredDescription: 'Die beliebtesten Profis unserer Kunden.',
    featuredSeeAll: 'Alle Profis ansehen →',
    ctaExplore: 'Profis entdecken',
    ctaForBusiness: 'Für Unternehmen',
  },
  explore: {
    searchTitle: 'Dienste suchen',
    searchDescription: 'Suche nach Dienst, Geschäft oder Kategorie.',
    regionTitle: 'Nach Region erkunden',
    categoriesTitle: 'Was suchst du?',
    allCategories: 'Alle Kategorien →',
    professionalCount: (n: number) => `${n} Profis gefunden`,
    emptyMessage: 'Noch keine Profis gelistet. Schaue bald wieder vorbei.',
  },
  locale: {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    ru: 'Русский',
    es: 'Español',
  },
}

export default de
