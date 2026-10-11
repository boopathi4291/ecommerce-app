'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Search, ShoppingCart, LogOut, Trash2, MapPin, Loader2 } from 'lucide-react'
import ProductGrid from '@/components/Products/ProductGrid'
import AuthPrompt from '@/components/AuthPrompt'
import { mockProducts } from '@/data/mockProducts'
import { Product } from '@/types/product'
import { clearDemoSession, DemoUser, getDemoSession } from '@/lib/demoAuth'
import { formatCurrency } from '@/lib/formatCurrency'
import { currencyOptions, defaultCurrencyForLanguage, languageOptions, localeByLanguage, Language, preferencesForRegion, preferencesFromBrowser, storeLabels, translateCategory } from '@/lib/locales'

type CartLine = { product: Product; quantity: number }

const categories = [
  'All Products',
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Beauty',
  'Sports',
]

async function lookupCountryCode(latitude: number, longitude: number): Promise<string> {
  const query = new URLSearchParams({ format: 'jsonv2', lat: String(latitude), lon: String(longitude) })
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
    headers: { 'Accept-Language': navigator.language },
  })
  if (!response.ok) throw new Error('Location lookup failed')
  const result = await response.json() as { address?: { country_code?: string } }
  const countryCode = result.address?.country_code?.toUpperCase()
  if (!countryCode) throw new Error('Country not found')
  return countryCode
}

export default function ProductsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [user, setUser] = useState<DemoUser | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [authReturnTo, setAuthReturnTo] = useState('/products')
  const [language, setLanguage] = useState<Language>('en')
  const [currency, setCurrency] = useState('INR')
  const [region, setRegion] = useState('IN')
  const [currencyMode, setCurrencyMode] = useState<'automatic' | 'manual'>('automatic')
  const [isLocating, setIsLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [welcomeVisible, setWelcomeVisible] = useState(false)
  const [welcomeLeaving, setWelcomeLeaving] = useState(false)
  const [ready, setReady] = useState(false)
  const labels = storeLabels[language]
  const translatedCategory = (category: string) => category === 'All Products' ? labels.all : translateCategory(category, language)

  useEffect(() => {
    const activeUser = getDemoSession()
    setUser(activeUser)
    const browserDefaults = preferencesFromBrowser(navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone)
    const savedLanguage = languageOptions.find((option) => option.code === sessionStorage.getItem('atelier.demo.language'))
    const savedCurrency = currencyOptions.find((option) => option.code === sessionStorage.getItem('atelier.demo.currency'))
    setLanguage(savedLanguage?.code ?? browserDefaults.language)
    setCurrency(savedCurrency?.code ?? browserDefaults.currency)
    setRegion(sessionStorage.getItem('atelier.demo.region') ?? browserDefaults.region)
    setCurrencyMode(sessionStorage.getItem('atelier.demo.currency-mode') === 'manual' ? 'manual' : 'automatic')
    let startupLocationTimeout: number | undefined
    if (navigator.geolocation) {
      setIsLocating(true)
      setLocationMessage('Detecting location...')
      startupLocationTimeout = window.setTimeout(() => {
        setLocationMessage('Location request timed out. Using browser region settings.')
        setIsLocating(false)
      }, 12000)
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        try {
          const countryCode = await lookupCountryCode(coords.latitude, coords.longitude)
          const preferences = preferencesForRegion(countryCode, navigator.language)
          setLanguage(preferences.language)
          if (sessionStorage.getItem('atelier.demo.currency-mode') !== 'manual') setCurrency(preferences.currency)
          setRegion(preferences.region)
          setCurrencyMode('automatic')
          setLocationMessage(`Preferences set for ${countryCode}.`)
        } catch {
          setLocationMessage('Could not determine your country. Using browser region settings.')
        } finally {
          if (startupLocationTimeout !== undefined) window.clearTimeout(startupLocationTimeout)
          setIsLocating(false)
        }
      }, () => {
        if (startupLocationTimeout !== undefined) window.clearTimeout(startupLocationTimeout)
        setLocationMessage('Location unavailable or denied. Using browser region settings.')
        setIsLocating(false)
      }, { maximumAge: 60000, timeout: 10000 })
    } else {
      setLocationMessage('Location is unavailable. Using browser region settings.')
    }
    setWelcomeVisible(Boolean(activeUser))
    setReady(true)
    if (activeUser) {
      try {
        setCart(JSON.parse(sessionStorage.getItem('atelier.demo.cart') || '[]') as CartLine[])
      } catch {
        setCart([])
      }
    } else {
      setCart([])
    }
    const fadeTimer = activeUser ? window.setTimeout(() => setWelcomeLeaving(true), 1700) : undefined
    const closeTimer = activeUser ? window.setTimeout(() => setWelcomeVisible(false), 2150) : undefined
    return () => {
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer)
      if (closeTimer !== undefined) window.clearTimeout(closeTimer)
      if (startupLocationTimeout !== undefined) window.clearTimeout(startupLocationTimeout)
    }
  }, [router])

  useEffect(() => {
    if (ready && user) sessionStorage.setItem('atelier.demo.cart', JSON.stringify(cart))
  }, [cart, ready, user])

  useEffect(() => {
    if (!ready) return
    sessionStorage.setItem('atelier.demo.language', language)
    sessionStorage.setItem('atelier.demo.currency', currency)
    sessionStorage.setItem('atelier.demo.region', region)
    sessionStorage.setItem('atelier.demo.currency-mode', currencyMode)
  }, [language, currency, region, currencyMode, ready])

  const locale = localeByLanguage[language]
  const requestAuthentication = (returnTo = pathname || '/products') => {
    setAuthReturnTo(returnTo)
    setAuthPromptOpen(true)
  }

  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All Products' || product.category === selectedCategory
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'newest':
        return Number(b.id) - Number(a.id)
      default:
        return 0
    }
  })

  const handleAddToCart = (product: Product): boolean => {
    if (!user) {
      requestAuthentication()
      return false
    }
    setCart((current) => {
      const existingLine = current.find((line) => line.product.id === product.id)
      return existingLine
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { product, quantity: 1 }]
    })
    return true
  }

  const handleBuyNow = (product: Product) => {
    if (!handleAddToCart(product)) return
    setCartOpen(true)
  }

  const handleFavoriteToggle = (productId: string | number): boolean => {
    if (!user) {
      requestAuthentication()
      return false
    }
    console.log('Toggled favorite for:', productId)
    return true
  }

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    if (currencyMode === 'automatic') setCurrency(defaultCurrencyForLanguage(nextLanguage, region))
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is unavailable in this browser.')
      return
    }

    setIsLocating(true)
    setLocationMessage('')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const countryCode = await lookupCountryCode(coords.latitude, coords.longitude)
        const preferences = preferencesForRegion(countryCode, navigator.language)
        setLanguage(preferences.language)
        setCurrency(preferences.currency)
        setRegion(preferences.region)
        setCurrencyMode('automatic')
        setLocationMessage(`Preferences set for ${countryCode}.`)
      } catch {
        setLocationMessage('Could not determine your country. Check your connection and try again.')
      } finally {
        setIsLocating(false)
      }
    }, (error) => {
      setLocationMessage(error.code === error.PERMISSION_DENIED ? 'Location permission was denied.' : 'Could not access your location.')
      setIsLocating(false)
    }, { maximumAge: 60000, timeout: 10000 })
  }

  const handleLogout = () => {
    clearDemoSession()
    sessionStorage.removeItem('atelier.demo.cart')
    router.replace('/')
  }

  const cartCount = user ? cart.reduce((sum, line) => sum + line.quantity, 0) : 0

  if (!ready) return <main className="min-h-screen bg-gray-50" aria-label="Loading products" />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close categories' : 'Open categories'}
              className="rounded-lg border border-gray-300 p-2 md:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <h1 className="mr-auto text-xl font-bold text-gray-900 md:mr-0">{labels.products}</h1>
            <div className="order-3 w-full md:order-none md:flex-1 md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={labels.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="language-select">Language</label>
              <select id="language-select" value={language} onChange={(event) => handleLanguageChange(event.target.value as Language)} className="h-9 max-w-32 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700">
                {languageOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
              </select>
              <label className="sr-only" htmlFor="currency-select">Currency</label>
              <select id="currency-select" value={currency} onChange={(event) => { setCurrency(event.target.value); setCurrencyMode('manual') }} className="h-9 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700">
                {currencyOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
              </select>
              <div className="relative">
                <button type="button" onClick={() => user ? setCartOpen(!cartOpen) : requestAuthentication('/cart')} aria-label={`${labels.cart}, ${cartCount} items`} className="relative grid h-9 w-10 place-items-center rounded border border-gray-300 text-gray-700 hover:bg-gray-100">
                  <ShoppingCart size={18} />
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#294334] px-1 text-[10px] font-bold text-white">{cartCount}</span>
                </button>
                {cartOpen && <div className="fixed left-4 right-4 top-[173px] z-40 w-auto border border-gray-200 bg-white p-4 shadow-xl md:absolute md:left-auto md:right-0 md:top-12 md:w-[340px]">
                  <div className="flex items-center justify-between border-b pb-3"><h2 className="font-semibold">{labels.cart} <span className="text-sm font-normal text-gray-500">({cartCount})</span></h2><button type="button" aria-label="Close cart" onClick={() => setCartOpen(false)}><X size={18} /></button></div>
                  {cart.length === 0 ? <p className="py-6 text-sm text-gray-500">{labels.emptyCart}</p> : <ul className="max-h-64 divide-y overflow-auto">{cart.map(({ product, quantity }) => <li key={product.id} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0 text-sm"><span className="block truncate font-medium">{product.name}</span><span className="text-gray-500">{quantity} × {formatCurrency(product.price, currency, locale)}</span></span><button type="button" aria-label={`Remove ${product.name}`} onClick={() => setCart((current) => current.filter((line) => line.product.id !== product.id))} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button></li>)}</ul>}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href="/cart" onClick={() => setCartOpen(false)} className="flex h-10 items-center justify-center border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">View cart</Link>
                    {cart.length > 0 && <Link href="/checkout" onClick={() => setCartOpen(false)} className="flex h-10 items-center justify-center bg-[#294334] px-2 text-sm font-semibold text-white hover:bg-[#1e3327]">Checkout</Link>}
                  </div>
                </div>}
              </div>
              {user ? <button type="button" onClick={handleLogout} title={labels.logout} aria-label={labels.logout} className="grid h-9 w-9 place-items-center rounded border border-gray-300 text-gray-700 hover:bg-gray-100"><LogOut size={17} /></button> : <button type="button" onClick={() => requestAuthentication()} className="h-9 rounded border border-[#294334] px-3 text-xs font-semibold text-[#294334] hover:bg-gray-100">Log in</button>}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside
            className={`${
              sidebarOpen ? 'block' : 'hidden'
            } w-full space-y-6 md:block md:w-56 md:flex-shrink-0`}
          >
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {labels.categories}
              </h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`block w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                      selectedCategory === category
                        ? 'bg-[#294334] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {translatedCategory(category)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{labels.sortBy}</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
              >
                <option value="featured">{labels.featured}</option>
                <option value="newest">{labels.newest}</option>
                <option value="price-low">{labels.priceLow}</option>
                <option value="price-high">{labels.priceHigh}</option>
                <option value="rating">{labels.rating}</option>
              </select>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                {labels.showing} <span className="font-semibold">{sortedProducts.length}</span> {labels.items}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {language !== 'en' && <button type="button" onClick={() => handleLanguageChange('en')} className="text-xs font-medium text-[#294334] underline underline-offset-2">English</button>}
                <button type="button" onClick={handleUseLocation} disabled={isLocating} title="Requests browser location permission. Coordinates are sent to OpenStreetMap for country lookup." aria-label="Use my location to set language and currency" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-[#294334] disabled:opacity-60">
                  {isLocating ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                  {isLocating ? 'Locating...' : 'Use location'}
                </button>
              </div>
            </div>
            {locationMessage && <p role="status" className="mb-4 text-xs text-gray-600">{locationMessage}</p>}

            <ProductGrid
              products={sortedProducts}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onFavoriteToggle={handleFavoriteToggle}
              currency={currency}
              locale={locale}
              language={language}
              columns="auto"
              gap="medium"
            />
          </main>
        </div>
      </div>
      {welcomeVisible && user && <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 ${welcomeLeaving ? 'welcome-out' : 'welcome-in'}`} role="status" aria-live="polite">
        <div className="w-full max-w-sm border border-[#e1e5da] bg-[#fbfcf8] px-8 py-9 text-center shadow-2xl">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e8eee6] text-[#294334]"><ShoppingCart size={21} /></span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#728575]">{labels.greeting}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#20251f]">{user.displayName}</h2>
          <p className="mt-2 text-sm text-gray-600">{labels.ready}</p>
        </div>
      </div>}
      {authPromptOpen && <AuthPrompt returnTo={authReturnTo} onClose={() => setAuthPromptOpen(false)} />}
    </div>
  )
}
