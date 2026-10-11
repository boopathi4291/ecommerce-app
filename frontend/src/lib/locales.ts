export const languageOptions = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'मराठी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
] as const

export type Language = (typeof languageOptions)[number]['code']

interface StoreLabels {
  products: string
  search: string
  categories: string
  sortBy: string
  all: string
  categoryNames: string[]
  featured: string
  newest: string
  priceLow: string
  priceHigh: string
  rating: string
  showing: string
  items: string
  cart: string
  logout: string
  greeting: string
  ready: string
  emptyCart: string
  addToCart: string
  adding: string
  buyNow: string
  inStock: string
  outOfStock: string
  lowStock: string
}

export const storeLabels: Record<Language, StoreLabels> = {
  en: {
    products: 'Products', search: 'Search products...', categories: 'Categories', sortBy: 'Sort By', all: 'All Products',
    categoryNames: ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports'], featured: 'Featured', newest: 'Newest',
    priceLow: 'Price: Low to High', priceHigh: 'Price: High to Low', rating: 'Top Rated', showing: 'Showing', items: 'products',
    cart: 'Cart', logout: 'Log out', greeting: 'Welcome back', ready: 'Your next favourite is waiting.', emptyCart: 'Your cart is empty.',
    addToCart: 'Add to Cart', adding: 'Adding...', buyNow: 'Buy Now', inStock: 'In Stock', outOfStock: 'Out of Stock', lowStock: 'Only {count} left',
  },
  hi: {
    products: 'उत्पाद', search: 'उत्पाद खोजें...', categories: 'श्रेणियाँ', sortBy: 'क्रमबद्ध करें', all: 'सभी उत्पाद',
    categoryNames: ['इलेक्ट्रॉनिक्स', 'फैशन', 'घर और रसोई', 'सौंदर्य', 'खेल'], featured: 'विशेष', newest: 'नवीनतम',
    priceLow: 'कीमत: कम से अधिक', priceHigh: 'कीमत: अधिक से कम', rating: 'सबसे अधिक रेटिंग', showing: 'दिखाए जा रहे हैं', items: 'उत्पाद',
    cart: 'कार्ट', logout: 'लॉग आउट', greeting: 'वापस स्वागत है', ready: 'आपकी अगली पसंद आपका इंतज़ार कर रही है।', emptyCart: 'आपकी कार्ट खाली है।',
    addToCart: 'कार्ट में डालें', adding: 'जोड़ा जा रहा है...', buyNow: 'अभी खरीदें', inStock: 'स्टॉक में', outOfStock: 'स्टॉक समाप्त', lowStock: 'केवल {count} बाकी',
  },
  ta: {
    products: 'பொருட்கள்', search: 'பொருட்களைத் தேடுங்கள்...', categories: 'வகைகள்', sortBy: 'வரிசைப்படுத்து', all: 'அனைத்து பொருட்கள்',
    categoryNames: ['மின்னணுவியல்', 'ஆடை', 'வீடு மற்றும் சமையலறை', 'அழகு', 'விளையாட்டு'], featured: 'சிறப்பு', newest: 'புதியவை',
    priceLow: 'விலை: குறைவிலிருந்து அதிகம்', priceHigh: 'விலை: அதிகத்திலிருந்து குறைவு', rating: 'சிறந்த மதிப்பீடு', showing: 'காட்டப்படுவது', items: 'பொருட்கள்',
    cart: 'கூடை', logout: 'வெளியேறு', greeting: 'மீண்டும் வரவேற்கிறோம்', ready: 'உங்களுக்கான அடுத்த விருப்பம் காத்திருக்கிறது.', emptyCart: 'உங்கள் கூடை காலியாக உள்ளது.',
    addToCart: 'கூடையில் சேர்', adding: 'சேர்க்கப்படுகிறது...', buyNow: 'இப்போது வாங்கு', inStock: 'கையிருப்பில் உள்ளது', outOfStock: 'கையிருப்பில் இல்லை', lowStock: 'இன்னும் {count} மட்டுமே',
  },
  te: {
    products: 'ఉత్పత్తులు', search: 'ఉత్పత్తులను వెతకండి...', categories: 'వర్గాలు', sortBy: 'క్రమబద్ధీకరణ', all: 'అన్ని ఉత్పత్తులు',
    categoryNames: ['ఎలక్ట్రానిక్స్', 'ఫ్యాషన్', 'ఇల్లు మరియు వంటగది', 'అందం', 'క్రీడలు'], featured: 'ప్రత్యేకమైనవి', newest: 'కొత్తవి',
    priceLow: 'ధర: తక్కువ నుండి ఎక్కువ', priceHigh: 'ధర: ఎక్కువ నుండి తక్కువ', rating: 'అత్యధిక రేటింగ్', showing: 'చూపిస్తున్నవి', items: 'ఉత్పత్తులు',
    cart: 'కార్ట్', logout: 'లాగ్ అవుట్', greeting: 'తిరిగి స్వాగతం', ready: 'మీ తదుపరి ఇష్టమైనది మీ కోసం వేచి ఉంది.', emptyCart: 'మీ కార్ట్ ఖాళీగా ఉంది.',
    addToCart: 'కార్ట్‌లో చేర్చు', adding: 'చేర్చుతోంది...', buyNow: 'ఇప్పుడే కొనండి', inStock: 'స్టాక్‌లో ఉంది', outOfStock: 'స్టాక్‌లో లేదు', lowStock: 'ఇంకా {count} మాత్రమే',
  },
  ml: {
    products: 'ഉൽപ്പന്നങ്ങൾ', search: 'ഉൽപ്പന്നങ്ങൾ തിരയുക...', categories: 'വിഭാഗങ്ങൾ', sortBy: 'ക്രമീകരിക്കുക', all: 'എല്ലാ ഉൽപ്പന്നങ്ങളും',
    categoryNames: ['ഇലക്ട്രോണിക്സ്', 'ഫാഷൻ', 'വീട്, അടുക്കള', 'സൗന്ദര്യം', 'കായികം'], featured: 'തിരഞ്ഞെടുത്തത്', newest: 'പുതിയത്',
    priceLow: 'വില: കുറഞ്ഞത് ആദ്യം', priceHigh: 'വില: കൂടിയത് ആദ്യം', rating: 'മികച്ച റേറ്റിംഗ്', showing: 'കാണിക്കുന്നത്', items: 'ഉൽപ്പന്നങ്ങൾ',
    cart: 'കാർട്ട്', logout: 'ലോഗ് ഔട്ട്', greeting: 'തിരികെ സ്വാഗതം', ready: 'നിങ്ങളുടെ അടുത്ത പ്രിയപ്പെട്ടത് കാത്തിരിക്കുന്നു.', emptyCart: 'നിങ്ങളുടെ കാർട്ട് ശൂന്യമാണ്.',
    addToCart: 'കാർട്ടിൽ ചേർക്കുക', adding: 'ചേർക്കുന്നു...', buyNow: 'ഇപ്പോൾ വാങ്ങുക', inStock: 'സ്റ്റോക്കുണ്ട്', outOfStock: 'സ്റ്റോക്കില്ല', lowStock: 'ഇനി {count} മാത്രം',
  },
  kn: {
    products: 'ಉತ್ಪನ್ನಗಳು', search: 'ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ...', categories: 'ವರ್ಗಗಳು', sortBy: 'ವಿಂಗಡಿಸಿ', all: 'ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು',
    categoryNames: ['ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್', 'ಫ್ಯಾಷನ್', 'ಮನೆ ಮತ್ತು ಅಡುಗೆಮನೆ', 'ಸೌಂದರ್ಯ', 'ಕ್ರೀಡೆ'], featured: 'ವಿಶೇಷ', newest: 'ಹೊಸದು',
    priceLow: 'ಬೆಲೆ: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚು', priceHigh: 'ಬೆಲೆ: ಹೆಚ್ಚುದಿಂದ ಕಡಿಮೆ', rating: 'ಅತ್ಯುತ್ತಮ ರೇಟಿಂಗ್', showing: 'ತೋರಿಸಲಾಗುತ್ತಿದೆ', items: 'ಉತ್ಪನ್ನಗಳು',
    cart: 'ಕಾರ್ಟ್', logout: 'ಲಾಗ್ ಔಟ್', greeting: 'ಮರಳಿ ಸ್ವಾಗತ', ready: 'ನಿಮ್ಮ ಮುಂದಿನ ಮೆಚ್ಚಿನದು ಕಾಯುತ್ತಿದೆ.', emptyCart: 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ.',
    addToCart: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ', adding: 'ಸೇರಿಸಲಾಗುತ್ತಿದೆ...', buyNow: 'ಈಗ ಖರೀದಿಸಿ', inStock: 'ಲಭ್ಯವಿದೆ', outOfStock: 'ಲಭ್ಯವಿಲ್ಲ', lowStock: 'ಇನ್ನೂ {count} ಮಾತ್ರ',
  },
  mr: {
    products: 'उत्पादने', search: 'उत्पादने शोधा...', categories: 'श्रेणी', sortBy: 'क्रमवारी लावा', all: 'सर्व उत्पादने',
    categoryNames: ['इलेक्ट्रॉनिक्स', 'फॅशन', 'घर आणि स्वयंपाकघर', 'सौंदर्य', 'खेळ'], featured: 'वैशिष्ट्यीकृत', newest: 'नवीनतम',
    priceLow: 'किंमत: कमी ते जास्त', priceHigh: 'किंमत: जास्त ते कमी', rating: 'सर्वाधिक रेटिंग', showing: 'दाखवत आहे', items: 'उत्पादने',
    cart: 'कार्ट', logout: 'बाहेर पडा', greeting: 'पुन्हा स्वागत आहे', ready: 'तुमची पुढची आवडती वस्तू वाट पाहत आहे.', emptyCart: 'तुमची कार्ट रिकामी आहे.',
    addToCart: 'कार्टमध्ये जोडा', adding: 'जोडत आहे...', buyNow: 'आता खरेदी करा', inStock: 'उपलब्ध', outOfStock: 'उपलब्ध नाही', lowStock: 'फक्त {count} शिल्लक',
  },
  bn: {
    products: 'পণ্য', search: 'পণ্য খুঁজুন...', categories: 'বিভাগ', sortBy: 'সাজান', all: 'সব পণ্য',
    categoryNames: ['ইলেকট্রনিক্স', 'ফ্যাশন', 'বাড়ি ও রান্নাঘর', 'সৌন্দর্য', 'খেলাধুলা'], featured: 'বাছাই করা', newest: 'নতুন',
    priceLow: 'দাম: কম থেকে বেশি', priceHigh: 'দাম: বেশি থেকে কম', rating: 'সর্বোচ্চ রেটিং', showing: 'দেখানো হচ্ছে', items: 'টি পণ্য',
    cart: 'কার্ট', logout: 'লগ আউট', greeting: 'ফিরে আসায় স্বাগতম', ready: 'আপনার পরের পছন্দটি অপেক্ষা করছে।', emptyCart: 'আপনার কার্ট খালি।',
    addToCart: 'কার্টে যোগ করুন', adding: 'যোগ হচ্ছে...', buyNow: 'এখনই কিনুন', inStock: 'স্টকে আছে', outOfStock: 'স্টকে নেই', lowStock: 'আর মাত্র {count}টি',
  },
  fr: {
    products: 'Produits', search: 'Rechercher des produits...', categories: 'Catégories', sortBy: 'Trier par', all: 'Tous les produits',
    categoryNames: ['Électronique', 'Mode', 'Maison et cuisine', 'Beauté', 'Sports'], featured: 'À la une', newest: 'Nouveautés',
    priceLow: 'Prix : croissant', priceHigh: 'Prix : décroissant', rating: 'Les mieux notés', showing: 'Affichage de', items: 'produits',
    cart: 'Panier', logout: 'Déconnexion', greeting: 'Bon retour', ready: 'Votre prochain coup de cœur vous attend.', emptyCart: 'Votre panier est vide.',
    addToCart: 'Ajouter au panier', adding: 'Ajout en cours...', buyNow: 'Acheter', inStock: 'En stock', outOfStock: 'Épuisé', lowStock: 'Plus que {count}',
  },
  es: {
    products: 'Productos', search: 'Buscar productos...', categories: 'Categorías', sortBy: 'Ordenar por', all: 'Todos los productos',
    categoryNames: ['Electrónica', 'Moda', 'Hogar y cocina', 'Belleza', 'Deportes'], featured: 'Destacados', newest: 'Novedades',
    priceLow: 'Precio: menor a mayor', priceHigh: 'Precio: mayor a menor', rating: 'Mejor valorados', showing: 'Mostrando', items: 'productos',
    cart: 'Carrito', logout: 'Cerrar sesión', greeting: 'Te damos la bienvenida', ready: 'Tu próximo favorito te está esperando.', emptyCart: 'Tu carrito está vacío.',
    addToCart: 'Añadir al carrito', adding: 'Añadiendo...', buyNow: 'Comprar ahora', inStock: 'Disponible', outOfStock: 'Agotado', lowStock: 'Solo quedan {count}',
  },
  pt: {
    products: 'Produtos', search: 'Pesquisar produtos...', categories: 'Categorias', sortBy: 'Ordenar por', all: 'Todos os produtos',
    categoryNames: ['Eletrônicos', 'Moda', 'Casa e cozinha', 'Beleza', 'Desporto'], featured: 'Em destaque', newest: 'Novidades',
    priceLow: 'Preço: crescente', priceHigh: 'Preço: decrescente', rating: 'Melhor avaliação', showing: 'A mostrar', items: 'produtos',
    cart: 'Carrinho', logout: 'Terminar sessão', greeting: 'Boas-vindas', ready: 'O seu próximo favorito está à sua espera.', emptyCart: 'O carrinho está vazio.',
    addToCart: 'Adicionar ao carrinho', adding: 'A adicionar...', buyNow: 'Comprar agora', inStock: 'Em stock', outOfStock: 'Sem stock', lowStock: 'Só restam {count}',
  },
  ja: {
    products: '商品', search: '商品を検索...', categories: 'カテゴリー', sortBy: '並べ替え', all: 'すべての商品',
    categoryNames: ['電子機器', 'ファッション', 'ホーム・キッチン', '美容', 'スポーツ'], featured: 'おすすめ', newest: '新着',
    priceLow: '価格の安い順', priceHigh: '価格の高い順', rating: '評価の高い順', showing: '表示中', items: '件',
    cart: 'カート', logout: 'ログアウト', greeting: 'おかえりなさい', ready: '次のお気に入りが待っています。', emptyCart: 'カートは空です。',
    addToCart: 'カートに追加', adding: '追加中...', buyNow: '今すぐ購入', inStock: '在庫あり', outOfStock: '在庫切れ', lowStock: '残り{count}点',
  },
  ko: {
    products: '상품', search: '상품 검색...', categories: '카테고리', sortBy: '정렬 기준', all: '전체 상품',
    categoryNames: ['전자제품', '패션', '홈·주방', '뷰티', '스포츠'], featured: '추천 상품', newest: '최신 상품',
    priceLow: '가격 낮은순', priceHigh: '가격 높은순', rating: '평점 높은순', showing: '표시 중', items: '개 상품',
    cart: '장바구니', logout: '로그아웃', greeting: '다시 오신 것을 환영합니다', ready: '다음 마음에 드는 상품을 만나보세요.', emptyCart: '장바구니가 비어 있습니다.',
    addToCart: '장바구니 담기', adding: '추가 중...', buyNow: '바로 구매', inStock: '재고 있음', outOfStock: '품절', lowStock: '{count}개 남음',
  },
}

export const localeByLanguage: Record<Language, string> = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', ml: 'ml-IN', kn: 'kn-IN', mr: 'mr-IN', bn: 'bn-IN',
  fr: 'fr-FR', es: 'es-ES', pt: 'pt-PT', ja: 'ja-JP', ko: 'ko-KR',
}

export const currencyOptions = [
  { code: 'INR', name: 'INR ₹' }, { code: 'USD', name: 'USD $' }, { code: 'EUR', name: 'EUR €' },
  { code: 'GBP', name: 'GBP £' }, { code: 'CAD', name: 'CAD $' }, { code: 'AUD', name: 'AUD $' },
  { code: 'BRL', name: 'BRL R$' }, { code: 'MXN', name: 'MXN $' }, { code: 'JPY', name: 'JPY ¥' },
  { code: 'KRW', name: 'KRW ₩' }, { code: 'CHF', name: 'CHF' }, { code: 'NZD', name: 'NZD $' },
] as const

export interface LocalePreferences {
  language: Language
  currency: (typeof currencyOptions)[number]['code']
  region: string
}

const countryDefaults: Record<string, { language: Language; currency: LocalePreferences['currency'] }> = {
  IN: { language: 'en', currency: 'INR' }, US: { language: 'en', currency: 'USD' },
  GB: { language: 'en', currency: 'GBP' }, CA: { language: 'en', currency: 'CAD' },
  AU: { language: 'en', currency: 'AUD' }, NZ: { language: 'en', currency: 'NZD' },
  FR: { language: 'fr', currency: 'EUR' }, BE: { language: 'fr', currency: 'EUR' },
  CH: { language: 'fr', currency: 'CHF' }, ES: { language: 'es', currency: 'EUR' },
  MX: { language: 'es', currency: 'MXN' }, PT: { language: 'pt', currency: 'EUR' },
  BR: { language: 'pt', currency: 'BRL' }, JP: { language: 'ja', currency: 'JPY' },
  KR: { language: 'ko', currency: 'KRW' }, DE: { language: 'en', currency: 'EUR' },
  IT: { language: 'en', currency: 'EUR' }, NL: { language: 'en', currency: 'EUR' },
  AT: { language: 'en', currency: 'EUR' }, IE: { language: 'en', currency: 'EUR' },
}

const currencyForLanguage: Record<Language, LocalePreferences['currency']> = {
  en: 'USD', hi: 'INR', ta: 'INR', te: 'INR', ml: 'INR', kn: 'INR', mr: 'INR', bn: 'INR',
  fr: 'EUR', es: 'EUR', pt: 'EUR', ja: 'JPY', ko: 'KRW',
}

function countryFromTimeZone(timeZone: string): string {
  if (timeZone === 'Asia/Kolkata') return 'IN'
  if (timeZone === 'Asia/Tokyo') return 'JP'
  if (timeZone === 'Asia/Seoul') return 'KR'
  if (timeZone === 'Europe/Paris') return 'FR'
  if (timeZone === 'Europe/Madrid') return 'ES'
  if (timeZone === 'Europe/Lisbon') return 'PT'
  if (timeZone === 'Europe/London') return 'GB'
  if (timeZone === 'America/Sao_Paulo') return 'BR'
  if (timeZone === 'America/Mexico_City') return 'MX'
  if (timeZone.startsWith('America/Toronto') || timeZone.startsWith('America/Vancouver')) return 'CA'
  if (timeZone.startsWith('America/')) return 'US'
  if (timeZone.startsWith('Australia/')) return 'AU'
  return ''
}

function isLanguage(value: string): value is Language {
  return languageOptions.some((option) => option.code === value)
}

export function preferencesForRegion(region: string, browserLocale = 'en'): LocalePreferences {
  const country = region.toUpperCase()
  const browserLanguage = browserLocale.split('-')[0].toLowerCase()
  const regionalDefault = countryDefaults[country]
  const language = country === 'IN' && isLanguage(browserLanguage)
    ? browserLanguage
    : regionalDefault?.language ?? (isLanguage(browserLanguage) ? browserLanguage : 'en')
  const currency = regionalDefault?.currency ?? currencyForLanguage[language]
  return { language, currency, region: country }
}

export function preferencesFromBrowser(browserLocale: string, timeZone: string): LocalePreferences {
  const region = browserLocale.split('-').find((part) => /^[A-Za-z]{2}$/.test(part))?.toUpperCase()
    || countryFromTimeZone(timeZone)
    || 'IN'
  return preferencesForRegion(region, browserLocale)
}

export function defaultCurrencyForLanguage(language: Language, region: string): LocalePreferences['currency'] {
  if (language === 'en' && countryDefaults[region]?.language === 'en') return countryDefaults[region].currency
  if (language === 'pt' && region === 'BR') return 'BRL'
  return currencyForLanguage[language]
}

const categoryKeys = ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports']

export function translateCategory(category: string, language: Language): string {
  const index = categoryKeys.indexOf(category)
  return index < 0 ? category : storeLabels[language].categoryNames[index]
}