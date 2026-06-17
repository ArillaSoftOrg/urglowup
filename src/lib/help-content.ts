export type HelpStep = {
  title: string;
  body: string;
};

export type HelpArticle = {
  slug: string;
  title: string;
  intro: string;
  causes?: string[];
  steps: HelpStep[];
  keywords: string[];
};

export type HelpCategory = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  articles: HelpArticle[];
};

export type SearchEntry = {
  categorySlug: string;
  categoryTitle: string;
  articleSlug: string;
  articleTitle: string;
  intro: string;
  keywords: string[];
};

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "account-login",
    title: "Hesap & Giriş",
    description: "Hesap oluşturma, giriş yapma ve şifre sorunları.",
    icon: "UserCircle",
    articles: [
      {
        slug: "cannot-create-account",
        title: "Hesap oluşturulamıyor",
        intro:
          "Kayıt formunu doldurduğunuzda hata alıyorsanız veya devam edemiyorsanız aşağıdaki adımları deneyin.",
        causes: [
          "E-posta adresi zaten başka bir hesaba kayıtlı",
          "Şifre gereksinimleri karşılanmıyor",
          "Geçersiz e-posta formatı",
          "Geçici sunucu bağlantı sorunu",
        ],
        steps: [
          {
            title: "E-posta adresinizi doğrulayın",
            body: "E-postanızın doğru formatta olduğundan emin olun (örn. isim@example.com). Tire, nokta veya özel karakter kullanımına dikkat edin.",
          },
          {
            title: "Şifre gereksinimlerini kontrol edin",
            body: "Şifreniz en az 8 karakter, bir büyük harf ve bir rakam içermelidir. Kopyala-yapıştır kullanıyorsanız başındaki veya sonundaki boşlukları silin.",
          },
          {
            title: "Önceden hesap açıp açmadığınızı kontrol edin",
            body: "Bu e-posta ile daha önce hesap oluşturmuş olabilirsiniz. Giriş sayfasındaki 'Şifremi Unuttum' seçeneğini deneyin.",
          },
          {
            title: "Sayfayı yenileyip tekrar deneyin",
            body: "Formu yeniden doldurun. Geçici bir sunucu gecikmesi yaşanıyor olabilir.",
          },
          {
            title: "Farklı bir tarayıcı kullanın",
            body: "Sorun devam ediyorsa farklı bir tarayıcı veya gizli/özel sekme açarak yeniden deneyin.",
          },
        ],
        keywords: ["kayıt", "üye ol", "sign up", "register", "hesap aç", "hata", "form"],
      },
      {
        slug: "cannot-login",
        title: "Giriş yapılamıyor",
        intro:
          "E-posta ve şifrenizi girdiğinizde sisteme giremiyorsanız aşağıdaki çözümleri deneyin.",
        causes: [
          "Yanlış e-posta veya şifre",
          "Hesap e-posta ile henüz doğrulanmamış",
          "Hesap askıya alınmış",
          "Tarayıcı çerezi veya önbellek sorunu",
        ],
        steps: [
          {
            title: "Bilgilerinizi dikkatlice girin",
            body: "E-posta adresini ve şifreyi büyük/küçük harf duyarlılığına dikkat ederek yeniden girin. Caps Lock tuşunun kapalı olduğundan emin olun.",
          },
          {
            title: "Şifremi Unuttum seçeneğini kullanın",
            body: "Şifrenizi hatırlamıyorsanız giriş sayfasındaki 'Şifremi Unuttum' bağlantısına tıklayın ve sıfırlama e-postası alın.",
          },
          {
            title: "Hesabınızı doğrulayın",
            body: "Kayıt sırasında gönderilen doğrulama e-postasını onayladığınızdan emin olun. Onaylamadıysanız giriş sayfasında 'Doğrulama e-postasını yeniden gönder' seçeneğini kullanın.",
          },
          {
            title: "Tarayıcı önbelleğini temizleyin",
            body: "Tarayıcınızın önbelleğini ve çerezlerini temizleyin, ardından yeniden giriş yapmayı deneyin.",
          },
          {
            title: "Farklı bir ağ deneyin",
            body: "Kurumsal veya kısıtlı ağlar erişimi engelleyebilir. Mobil veri veya farklı bir Wi-Fi üzerinden deneyin.",
          },
        ],
        keywords: ["giriş", "login", "şifre yanlış", "oturum", "giremiyorum"],
      },
      {
        slug: "forgot-password",
        title: "Şifremi unuttum",
        intro:
          "UrGlowUp hesabınıza erişiminizi kaybettiyseniz e-posta yoluyla şifrenizi hızla sıfırlayabilirsiniz.",
        steps: [
          {
            title: "Şifremi Unuttum sayfasını açın",
            body: "Giriş sayfasında 'Şifremi Unuttum' bağlantısına tıklayın.",
          },
          {
            title: "E-postanızı girin",
            body: "Hesabınıza kayıtlı e-posta adresini girin ve 'Sıfırlama Bağlantısı Gönder' butonuna basın.",
          },
          {
            title: "Gelen kutunuzu kontrol edin",
            body: "Sıfırlama bağlantısı birkaç dakika içinde gelecektir. Spam veya Junk klasörünü de kontrol edin.",
          },
          {
            title: "Bağlantıya tıklayın",
            body: "E-postadaki bağlantıya tıklayıp yeni şifrenizi belirleyin. Bağlantı 1 saat geçerlidir; süresi dolduysa işlemi tekrarlayın.",
          },
          {
            title: "Yeni şifrenizle giriş yapın",
            body: "Şifrenizi belirledikten sonra normal giriş sayfasından yeni bilgilerinizle oturum açın.",
          },
        ],
        keywords: ["şifre sıfırlama", "şifremi unuttum", "password reset", "erişim", "parola"],
      },
      {
        slug: "verification-email-not-received",
        title: "Doğrulama e-postası gelmiyor",
        intro:
          "Kayıt olduktan sonra e-posta doğrulama mesajı almadıysanız aşağıdaki adımları izleyin.",
        causes: [
          "E-posta spam klasörüne düştü",
          "Kayıt sırasında yanlış e-posta girildi",
          "Geçici sunucu gecikmesi",
        ],
        steps: [
          {
            title: "Spam/Junk klasörünü kontrol edin",
            body: "Doğrulama e-postaları zaman zaman spam olarak işaretlenebilir. Gelen kutunuzun yanı sıra Önemsiz veya Junk klasörüne bakın.",
          },
          {
            title: "E-posta adresinizi doğrulayın",
            body: "Kayıt olurken girdiğiniz e-posta adresinin doğru olduğundan emin olun. Yazım hatası varsa yeni bir hesap oluşturmanız gerekebilir.",
          },
          {
            title: "E-postayı yeniden gönderin",
            body: "Giriş sayfasına gidin ve 'Doğrulama e-postasını yeniden gönder' seçeneğini kullanın.",
          },
          {
            title: "Birkaç dakika bekleyin",
            body: "E-posta teslimatı zaman zaman birkaç dakika gecikebilir. Bekleyip ardından tekrar kontrol edin.",
          },
          {
            title: "Hâlâ gelmediyse destek alın",
            body: "Sorun devam ediyorsa destek ekibimizle iletişime geçin; hesabınızı manuel olarak doğrulayabiliriz.",
          },
        ],
        keywords: ["doğrulama", "aktivasyon", "e-posta gelmedi", "verification", "onay maili"],
      },
    ],
  },
  {
    slug: "photo-analysis",
    title: "Fotoğraf & Analiz",
    description: "Fotoğraf yükleme sorunları ve analiz süreci hakkında bilgi.",
    icon: "Camera",
    articles: [
      {
        slug: "cannot-upload-photo",
        title: "Fotoğraf yüklenemiyor",
        intro:
          "Analiz için fotoğraf yüklerken sorun yaşıyorsanız aşağıdaki nedenleri ve çözümleri inceleyin.",
        causes: [
          "Desteklenmeyen dosya formatı",
          "Dosya boyutu sınırı aşılıyor",
          "Yavaş veya kesintili internet bağlantısı",
          "Tarayıcı dosya erişim izni sorunu",
        ],
        steps: [
          {
            title: "Dosya formatını kontrol edin",
            body: "Yalnızca JPEG, PNG ve WEBP formatları desteklenmektedir. Farklı bir formattaysa (HEIC, BMP vb.) fotoğrafı bu formatlardan birine dönüştürün.",
          },
          {
            title: "Dosya boyutunu küçültün",
            body: "Dosyanın 10 MB'ı aşmadığından emin olun. Büyükse telefon galerinizden düşük kalitede dışa aktarın veya bir görüntü sıkıştırma aracı kullanın.",
          },
          {
            title: "Tarayıcı izinlerini kontrol edin",
            body: "Tarayıcınızın adres çubuğundaki kilit ikonuna tıklayarak site ayarlarını kontrol edin ve dosya/kamera erişimine izin verildiğinden emin olun.",
          },
          {
            title: "Farklı bir tarayıcı deneyin",
            body: "Chrome, Firefox veya Safari gibi güncel bir tarayıcı kullanarak yeniden deneyin.",
          },
          {
            title: "Fotoğrafı yeniden kaydedin",
            body: "Sorun devam ediyorsa fotoğrafı bir görüntü düzenleyiciyle açıp farklı kaydet (JPEG) yaparak yeniden yükleyin.",
          },
        ],
        keywords: ["fotoğraf yükleme", "upload", "görüntü", "resim", "desteklenmez", "format", "boyut"],
      },
      {
        slug: "analysis-result-not-ready",
        title: "Analiz sonucu hazırlanmıyor",
        intro:
          "Fotoğrafınızı yükledikten sonra analiz beklediğinizden uzun sürüyorsa aşağıdaki bilgilere göz atın.",
        causes: [
          "Yoğun sunucu trafiği",
          "Fotoğrafın yüz analizine uygun olmaması",
          "Yükleme sırasında ağ kesintisi yaşanması",
        ],
        steps: [
          {
            title: "Birkaç dakika bekleyin",
            body: "Analiz arka planda devam ediyor olabilir. Sayfayı yenilemeden 1-2 dakika bekleyin.",
          },
          {
            title: "Fotoğraf kalitesini değerlendirin",
            body: "Yüzünüzün net, iyi aydınlatılmış ve kameraya dönük olduğundan emin olun. Güneş gözlüğü, maske veya aşırı filtre analiz kalitesini düşürür.",
          },
          {
            title: "Sekmeyi kapatmadan bekleyin",
            body: "Tarayıcı sekmesini açık tutun; analiz tamamlandığında sayfada sonuçlar otomatik görünecektir.",
          },
          {
            title: "Fotoğrafı silip yeniden deneyin",
            body: "Sorun uzun sürüyorsa yüklediğiniz fotoğrafı iptal edip daha net bir görüntü ile yeniden deneyin.",
          },
          {
            title: "Yardım alın",
            body: "Sorun devam ediyorsa destek ekibimize ulaşın; hata kaydını inceleyip size yardımcı olabiliriz.",
          },
        ],
        keywords: ["analiz", "sonuç", "bekleniyor", "yükleme", "glow score hesaplanmıyor", "işleniyor"],
      },
    ],
  },
  {
    slug: "results-recommendations",
    title: "Sonuçlar & Öneriler",
    description: "Glow Score ve kişisel öneri sistemini anlayın.",
    icon: "Sparkles",
    articles: [
      {
        slug: "what-is-glow-score",
        title: "Glow Score nedir?",
        intro:
          "Glow Score, yapay zeka destekli cilt analiz motorumuzun fotoğrafınızı değerlendirerek ürettiği kişisel bir puan notudur.",
        steps: [
          {
            title: "Puan aralığı",
            body: "Glow Score 0–100 arasında bir değerdir. Yüksek puan, o anlık fotoğrafta cildinizin görünür sağlık göstergelerinin olumlu olduğuna işaret eder.",
          },
          {
            title: "Puanı oluşturan faktörler",
            body: "Nem dengesi görünümü, cilt tonu düzgünlüğü, parlaklık, ince çizgi belirtileri ve gözenek görünümü gibi görsel faktörler birlikte değerlendirilir.",
          },
          {
            title: "Tıbbi tanı değildir",
            body: "Glow Score bir referans noktasıdır; dermatolojik tanı yerine geçmez. Cilt sağlığı hakkında ciddi endişeleriniz varsa bir uzmana danışın.",
          },
          {
            title: "Zamanla takip edin",
            body: "Aynı koşullarda (doğal ışık, fondöten yok) düzenli aralıklarla fotoğraf yükleyerek skoru takip edebilir ve ilerlemenizi ölçebilirsiniz.",
          },
          {
            title: "En doğru sonuç için ipuçları",
            body: "Doğal ışıkta, makyajsız çekilmiş net bir selfi kullanın. Flaş kullanmaktan kaçının; saçlarınızın yüzünüzü kapatmadığından emin olun.",
          },
        ],
        keywords: ["glow score", "puan", "skor", "analiz sonucu", "cilt", "dermatoloji", "ne demek"],
      },
    ],
  },
  {
    slug: "privacy-security",
    title: "Gizlilik & Güvenlik",
    description: "Verilerinizin korunması, fotoğraf saklama ve hesap güvenliği.",
    icon: "Shield",
    articles: [
      {
        slug: "are-my-photos-stored",
        title: "Fotoğraflarım saklanıyor mu?",
        intro:
          "Gizlilik önceliğimizdir. Yüklediğiniz fotoğrafların nasıl işlendiğini ve saklanıp saklanmadığını açıklıyoruz.",
        steps: [
          {
            title: "Analiz sırasında şifreli işleme",
            body: "Yüklediğiniz fotoğraflar şifreli sunucularda yalnızca analiz amacıyla geçici olarak işlenir.",
          },
          {
            title: "Varsayılan olarak silinir",
            body: "Glow Score hesaplandıktan sonra orijinal fotoğraf otomatik olarak silinir. 'Fotoğrafımı kaydet' seçeneğini etkinleştirmedikçe kalıcı depolama yapılmaz.",
          },
          {
            title: "Kayıtlı fotoğraflarınızı yönetin",
            body: "Kayıtlı fotoğraflarınızı Hesap > Gizlilik sayfasından görüntüleyebilir ve dilediğiniz zaman silebilirsiniz.",
          },
          {
            title: "Üçüncü taraflarla paylaşılmaz",
            body: "Verileriniz hiçbir üçüncü tarafla paylaşılmaz. Ayrıntılar için Gizlilik Politikamızı inceleyebilirsiniz.",
          },
          {
            title: "Tüm verilerinizin silinmesini talep edin",
            body: "Tüm verilerinizin kalıcı olarak silinmesini talep etmek için KVKK Başvuru formunu kullanabilirsiniz.",
          },
        ],
        keywords: ["gizlilik", "fotoğraf saklama", "veri", "privacy", "silinme", "güvenlik", "kvkk"],
      },
    ],
  },
  {
    slug: "report-problem",
    title: "Sorun Bildir",
    description: "Bir hata mı buldunuz? Destek ekibimize nasıl ulaşacağınızı öğrenin.",
    icon: "Flag",
    articles: [
      {
        slug: "how-to-report",
        title: "Sorun nasıl bildirilir?",
        intro:
          "Bir hatayla karşılaştıysanız veya beklenmedik bir durum yaşadıysanız destek ekibimize kolayca ulaşabilirsiniz.",
        steps: [
          {
            title: "Sorunu not edin",
            body: "Hatanın tam olarak ne zaman ve hangi adımda oluştuğunu not alın. Ekran görüntüsü almak faydalı olacaktır.",
          },
          {
            title: "Destek e-postasını gönderin",
            body: "destek@urglowup.com adresine e-posta gönderin. Konu satırına sorunu kısaca yazın.",
          },
          {
            title: "Gerekli bilgileri ekleyin",
            body: "E-postanıza tarayıcı adı ve sürümü, cihaz türü, yaşanan hatanın açıklaması ve varsa ekran görüntüsü ekleyin.",
          },
          {
            title: "Yanıt süremiz",
            body: "Destek ekibimiz iş günlerinde 24 saat içinde size geri dönecektir.",
          },
          {
            title: "Acil güvenlik açıkları",
            body: "Güvenlik açığı bildirimleri için aynı e-posta adresini kullanın ve konu satırına 'Güvenlik' yazın; bu talepler öncelikli olarak değerlendirilir.",
          },
        ],
        keywords: ["sorun bildir", "hata", "bug", "destek", "iletişim", "yardım", "rapor"],
      },
    ],
  },
];

export function getCategoryBySlug(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.slug === slug);
}

export function getArticleBySlug(
  categorySlug: string,
  articleSlug: string
): { category: HelpCategory; article: HelpArticle } | undefined {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return undefined;
  const article = category.articles.find((a) => a.slug === articleSlug);
  if (!article) return undefined;
  return { category, article };
}

export function buildSearchIndex(): SearchEntry[] {
  return HELP_CATEGORIES.flatMap((cat) =>
    cat.articles.map((art) => ({
      categorySlug: cat.slug,
      categoryTitle: cat.title,
      articleSlug: art.slug,
      articleTitle: art.title,
      intro: art.intro,
      keywords: art.keywords,
    }))
  );
}
