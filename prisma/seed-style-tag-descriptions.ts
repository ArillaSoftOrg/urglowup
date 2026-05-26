import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const descriptions: Array<{ slug: string; description: string }> = [
  {
    slug: "taper-fade",
    description:
      "Taper fade, saçın yanlarda ve ensede çok kısa başlayıp üste doğru kademeli biçimde uzadığı klasik berber kesim tekniğidir. Fade'in keskinliği ve başlangıç noktası berbere göre ayarlanabilir; yüksek, orta veya düşük fade seçenekleri mevcuttur. Oval, kare ve elmas yüz şekillerine özellikle yakışır; yuvarlak yüzlerde üst kısım hacimli bırakılarak denge sağlanabilir. İşletmeden randevu alırken kaç numara kullanılacağını, üst kısmın ne kadar uzun tutulacağını ve geçiş çizgisinin sert mi yumuşak mı olacağını netleştirin. Temiz ve düzgün görünümü korumak için her 2–3 haftada bir bakıma gelmek önerilir; uzayan yanlarda fade dağılacağından bu süreyi aşmamak önemlidir.",
  },
  {
    slug: "mid-fade",
    description:
      "Mid fade, saçın şakaklarla kulak arasında başlayıp üste doğru yumuşak bir renk geçişi oluşturduğu denge odaklı kesim tekniğidir. Taper fade kadar sert, high fade kadar dramatik değildir; bu orta yol onu neredeyse her yüz şekline ve yaşam tarzına uygun kılar. Hem spor ve gündelik kombinlere hem de daha özenli görünümlere eşlik edebilir. Berberde üstün ne kadar hacimli tutulmasını istediğinizi, fade çizgisinin tam başlangıç noktasını ve geçiş keskinliğini belirtin. Kesimin estetiğini korumak için ortalama 3 haftada bir bakım önerilir; bu süre geçildiğinde yanlardaki geçiş bulanıklaşır.",
  },
  {
    slug: "low-fade",
    description:
      "Low fade, ensede ve kulağın hemen altından başlayan hafif ve doğal görünümlü geçiş kesimidir. Diğer fade türlerine kıyasla daha uzun süre şeklini korur ve bakımı daha az sık gerektirir. Yuvarlak ve oval yüz şekillerine yakışır; keskin hat istemeyenler veya iş yaşamında daha muhafazakâr bir görünüm arayanlar için idealdir. İşletmede geçişin başladığı noktayı ve üst kısmın uzunluğunu netleştirin; bazı stillerde şakak çizgisi sert bırakılabilir, bazılarında ise doğal geçişe izin verilir. 3–4 haftada bir bakım yeterlidir, ancak düzenli nemlendiriciye sahip saçlar kesimi daha uzun süre diri tutar.",
  },
  {
    slug: "fine-line",
    description:
      "Fine line dövme, tek ya da çok az iğne ucu kullanılarak çizilen ince, zarif çizgilerle oluşturulan minimalist dövme tarzıdır. Botanik motifler, portreler, yazılar ve geometrik şekiller en sık tercih edilen temalar arasındadır; çizginin inceliği sanki kurşun kalemle kâğıda çizilmiş bir his uyandırır. Her cilt tipine uygulanabilir ancak açık ten tonları detayı daha net ortaya çıkarır. Sanatçıyla görüşürken çizgi kalınlığını, siyah mürekkep mi yoksa renkli mi kullanmak istediğinizi ve zamanla solma ihtimalini mutlaka konuşun; fine line dövmeler kalın işlere kıyasla 5–10 yıl içinde daha belirgin biçimde solabilir. İlk iyileşme 2–3 hafta sürer; bu sürede dövmeyi güneşten, tuzlu su ve havuzdan koruyun. Uzun vadeli canlılık için SPF 30+ güneş kremi düzenli olarak uygulanmalıdır.",
  },
  {
    slug: "minimal-dovme",
    description:
      "Minimal dövme, az mürekkep ve sade kompozisyonla elde edilen; anlam yüklü ama gösterişsiz bir estetik sunan dövme anlayışıdır. Tek çizgi figürler, küçük semboller, koordinatlar ve kelimeler bu tarzın başlıca örnekleridir. İlk dövmesini yaptırmak isteyenler, görünürlük konusunda çekingen olanlar ya da vücudunun belirli bölgelerinde narin bir aksesuar etkisi arayanlar için uygundur. Sanatçıyla yerleşim bölgesini, boyutunu ve çizginin belirginliğini konuşun; bilek, kulak arkası ve köprücük kemiği en popüler tercihler arasındadır. Küçük ve ince dövmeler iyileşme sürecinde en az bakım gerektirse de 3–5 yıl içinde rötuş gerektirebilir; doğrudan güneş ışığına maruz kalan bölgeler daha hızlı solar.",
  },
  {
    slug: "blackwork",
    description:
      "Blackwork dövme, yalnızca siyah mürekkep kullanılarak yapılan; bold (kalın) çizgiler, katı dolgular ve güçlü kontrast üzerine kurulu dövme tarzıdır. Geometrik desenler, maori esinli tribal motifler, karanlık illüstrasyon ve abstrak formlar bu tarzın en bilinen örnekleridir. Büyük bir vücut alanını kaplayan ve dikkat çekici ifadeler arayan kişilere uygundur. Sanatçıyla tasarımın kapladığı alanı, dolgu yoğunluğunu ve derinin nasıl tepki vereceğini görüşün; koyu tenli bireylerde kontrast farklı görünebilir. Büyük blackwork çalışmaları genellikle birden fazla seansta tamamlanır. İyileşme süreci 3–6 hafta alır; nemli krem uygulaması ve güneş koruması şarttır. Solmaya dirençli olması nedeniyle uzun vadeli bakımı görece az emek gerektirir.",
  },
  {
    slug: "french-nail",
    description:
      "French nail, doğal pembe ya da bej taban üzerine beyaz uç yapılan klasik ve zamansız tırnak estetiğidir; 1970'lerden bu yana moda olmaktan çıkmayan ender stillerden biridir. Her kıyafet ve ortama uyum sağlar; iş toplantısından düğün davetine kadar tercih edilebilir. Kısa, orta ve uzun tırnak uzunluklarına uygulanabilir; badem, kare veya oval şekilde yapılabilir. Nail salonunda uç kalınlığını (ince veya belirgin) ve taban rengini (klasik pembe, şeffaf veya süt beyazı) belirtin; istiyorsanız üstüne taş veya parlak şerit eklenebilir. Jel uygulamasıyla 2–3 hafta, normal ojeyle 5–7 gün dayanır; beyaz ucun kararmaması için deterjan işlerinde eldiven takmanız önerilir.",
  },
  {
    slug: "ombre-nail",
    description:
      "Ombre nail, iki ya da daha fazla rengin birbiriyle harmanlanarak yumuşak bir tondan diğerine geçtiği gradient (degrade) tırnak tasarımıdır. Beyazdan pembeye, nudedan bordeauya veya pastellerden çarpıcı renklere kadar sayısız renk kombinasyonu mümkündür. Romantik ve feminen bir estetik arayanlar, parmak uzunluğunu görsel olarak artırmak isteyenler ve tek renkten sıkılanlar için idealdir. Salonda hangi renkleri istediğinizi ve geçişin belirgin mi yoksa sürüklenmiş gibi mi görünmesini istediğinizi belirtin; sünger veya kırık çizgi tekniğiyle farklı efektler yaratılabilir. Jel uygulamasıyla yaklaşık 2–3 hafta dayanır; yıpranmadan önce kalan vernik düzenli olarak temizlenmeli ve tırnaklar nemlendirilmelidir.",
  },
  {
    slug: "cilt-bakimi",
    description:
      "Profesyonel cilt bakımı, günlük ev rutininin ulaşamadığı derinlikte temizlik, nemlendirme ve yenilenme sağlayan salon uygulamalarının genel adıdır. Buhar açma, manuel temizlik, kimyasal veya enzim peeling, maske ve serum gibi adımları kapsayan protokoller cilt tipine göre özelleştirilir. Yağlı, karma, kuru, hassas ve matür ciltlerin her biri için farklı formülasyonlar mevcuttur. Estetisyenle görüşürken akneli bölgeler, hassasiyet, kullandığınız ilaçlar ve önceki cilt reaksiyonlarınız hakkında dürüst olun; bu bilgiler uygulama protokolünü doğrudan etkiler. Pek çok uzman ayda bir seans önerse de yağlı ve akneli ciltler 3 haftada bir, kuru ve matür ciltler ise 4–6 haftada bir bakımdan yararlanır. Seanstan sonra 24–48 saat doğrudan güneş maruziyetinden kaçının ve nemlendiriciyi ihmal etmeyin.",
  },
  {
    slug: "gelin-makyaji",
    description:
      "Gelin makyajı, düğün gününe özel hazırlanan; saatler boyunca bozulmadan kalacak, ağlama ve terlemeye dayanıklı, fotoğraf ve videoda doğal görünen profesyonel makyaj uygulamasıdır. Gelinin cilt yapısı, ten tonu, gelinliğin kesimi ve düğünün genel atmosferi gözetilerek kişiselleştirilir. Doğal görünümlü, romantik ya da dramatik gibi farklı yoğunluklarda tercih edilebilir. Makyaj sanatçısıyla önceden en az bir deneme seansı yapın; bu seans cilt tepkisini, renk uyumunu ve kalıcılığı test etmenizi sağlar. Düğün öncesinde sanatçıya cilt bakım rutininizi, kullandığınız ürünleri, eğer varsa bilinen alerjilerinizi ve örnek görseller paylaşın. Rötuş kiti (pudra, ruj, mendil) hazır bulundurmanız özellikle uzun törenlerde faydalı olur. Deneme seansını düğünden en az 6–8 hafta önce ayarlamak, olası değişiklikler için yeterli süre tanır.",
  },
];

async function main() {
  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const entry of descriptions) {
    const tag = await db.styleTag.findFirst({ where: { slug: entry.slug } });

    if (!tag) {
      console.warn(`MISSING slug: ${entry.slug}`);
      missing++;
      continue;
    }

    if (tag.description !== null && tag.description.trim() !== "") {
      console.log(`SKIP (already set): ${entry.slug}`);
      skipped++;
      continue;
    }

    await db.styleTag.update({
      where: { id: tag.id },
      data: { description: entry.description },
    });
    console.log(`UPDATED: ${entry.slug}`);
    updated++;
  }

  console.log(`\nDone — updated: ${updated}, skipped: ${skipped}, missing: ${missing}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
