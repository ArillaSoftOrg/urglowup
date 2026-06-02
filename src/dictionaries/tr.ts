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
    listBusiness: 'İşletmenizi listeleyin',
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
  cookieConsent: {
    // Banner
    bannerTitle: 'Çerez Kullanımı',
    bannerDescription: 'Siteyi güvenli tutmak, dil tercihini hatırlamak ve deneyimi iyileştirmek için çerez kullanıyoruz. Ayrıntılar için',
    acceptAll: 'Tümünü kabul et',
    rejectNonEssential: 'Sadece gerekli',
    managePreferences: 'Tercihleri yönet',
    savePreferences: 'Tercihleri kaydet',
    // Panel rows
    necessaryTitle: 'Zorunlu',
    necessaryDesc: 'Oturum, güvenlik ve temel site işlevleri için gerekli. Devre dışı bırakılamaz.',
    preferenceTitle: 'Tercih',
    preferenceDesc: 'Dil ve görünüm seçimlerinizi hatırlar. Kullanıcı tarafından talep edilen işlevsellik için gereklidir.',
    analyticsTitle: 'Analitik',
    analyticsDesc: 'Platformu iyileştirmek için gezinme davranışınızın anonim olarak analiz edilmesine izin verin.',
    marketingTitle: 'Pazarlama',
    marketingDesc: 'Kampanya ve özel teklifler hakkında iletişim almak için gereklidir.',
    alwaysActive: 'Her zaman etkin',
    enabled: 'Etkin',
    disabled: 'Devre dışı',
    // Re-consent notice
    policyUpdatedTitle: 'Gizlilik politikamız güncellendi',
    policyUpdatedDesc: 'Çerez ve gizlilik politikamızda değişiklikler yaptık. Devam etmek için lütfen tercihlerinizi gözden geçirin.',
    // Footer link
    cookieSettings: 'Çerez Ayarları',
  },
}

export default tr
export type Dictionary = typeof tr
