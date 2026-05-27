// LOCALE STATUS: placeholder — Machine-translated. Deprioritized per strategy. Review before adding to PRODUCTION_LOCALES.
import type { Dictionary } from './tr'

const es: Dictionary = {
  nav: {
    explore: 'Explorar',
    forBusiness: 'Para Empresas',
    account: 'Mi cuenta',
    businessPanel: 'Panel de empresa',
    adminPanel: 'Panel de administración',
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    openMenu: 'Abrir menú',
  },
  home: {
    badge: 'Belleza y Cuidado Personal',
    heroTitle: 'Mereces el mejor cuidado',
    heroBrand: 'para ti.',
    heroDescription:
      'Descubre profesionales de belleza cerca de ti. Ve trabajos reales, lee reseñas verificadas y reserva con confianza.',
    categoriesLabel: 'Categorías',
    categoriesTitle: '¿Qué estás buscando?',
    categoriesSeeAll: 'Ver todo →',
    featuredLabel: 'Destacados',
    featuredTitle: 'Profesionales populares',
    featuredDescription: 'Los profesionales más preferidos por nuestros clientes.',
    featuredSeeAll: 'Ver todos los profesionales →',
    ctaExplore: 'Explorar Profesionales',
    ctaForBusiness: 'Para Empresas',
  },
  explore: {
    searchTitle: 'Buscar servicios',
    searchDescription: 'Busca por servicio, empresa o categoría.',
    regionTitle: 'Explorar por región',
    categoriesTitle: '¿Qué estás buscando?',
    allCategories: 'Todas las categorías →',
    professionalCount: (n: number) => `${n} profesionales encontrados`,
    emptyMessage: 'Aún no hay profesionales listados. Vuelve pronto.',
  },
  locale: {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    ru: 'Русский',
    es: 'Español',
    bg: 'Búlgaro',
  },
}

export default es
