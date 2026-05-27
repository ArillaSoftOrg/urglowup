// LOCALE STATUS: production
const tr = {
  nav: {
    explore: 'Keşfet',
    forBusiness: 'İşletmeler İçin',
    account: 'Hesabım',
    businessPanel: 'İşletme Paneliniz',
    adminPanel: 'Admin Paneli',
    signIn: 'Giriş Yap',
    signUp: 'Kayıt Ol',
    openMenu: 'Menüyü aç',
  },
  home: {
    badge: 'Güzellik & Kişisel Bakım',
    heroTitle: 'Kendine en iyi bakımı',
    heroBrand: 'hak ediyorsun.',
    heroDescription:
      'Sana yakın güzellik uzmanlarını keşfet. Gerçek çalışmaları gör, doğrulanmış yorumları oku ve güvenle randevu al.',
    categoriesLabel: 'Kategoriler',
    categoriesTitle: 'Ne arıyorsun?',
    categoriesSeeAll: 'Tümünü keşfet →',
    featuredLabel: 'Öne Çıkanlar',
    featuredTitle: 'Beğenilen uzmanlar',
    featuredDescription: 'Müşterilerimizin en çok tercih ettiği uzmanlar.',
    featuredSeeAll: 'Tüm uzmanları gör →',
    ctaExplore: 'Uzmanları Keşfet',
    ctaForBusiness: 'İşletmeler İçin',
  },
  explore: {
    searchTitle: 'Hizmet ara',
    searchDescription: 'Hizmet, işletme veya kategori ara.',
    regionTitle: 'Bölgeye göre keşfet',
    categoriesTitle: 'Ne arıyorsun?',
    allCategories: 'Tüm kategoriler →',
    professionalCount: (n: number) => `${n} uzman bulundu`,
    emptyMessage: 'Henüz listelenmiş uzman yok. Yakında tekrar kontrol edin.',
  },
  locale: {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    ru: 'Русский',
    es: 'Español',
    bg: 'Bulgarca',
  },
}

export default tr
export type Dictionary = typeof tr
