'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Heart, ShoppingBag, ShoppingCart } from 'lucide-react'
import { DemoUser, getDemoSession } from '@/lib/demoAuth'
import { apiProductToProduct, apiRequest, ApiProduct } from '@/lib/api'
import { formatCurrency } from '@/lib/formatCurrency'
import { currencyOptions, localeByLanguage } from '@/lib/locales'

interface StoreProfile {
  slug: string
  name: string
  logo_url: string | null
  theme_settings: Record<string, string>
  enabled_payment_methods: string[]
  default_currency: string
  payment_provider: string
}

export default function TenantProductsPage() {
  const { tenant: slug } = useParams<{ tenant: string }>()
  const router = useRouter()
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [products, setProducts] = useState<ReturnType<typeof apiProductToProduct>[]>([])
  const [user, setUser] = useState<DemoUser | null>(null)
  const [locale, setLocale] = useState('en-IN')
  const [error, setError] = useState('')

  useEffect(() => {
    const activeUser = getDemoSession()
    setUser(activeUser?.tenantSlug === slug ? activeUser : null)
    void Promise.all([
      apiRequest<StoreProfile>(`/tenants/${encodeURIComponent(slug)}`),
      apiRequest<ApiProduct[]>(`/storefront/${encodeURIComponent(slug)}/products`),
    ]).then(([profile, catalog]) => {
      setStore(profile)
      setProducts(catalog.map(apiProductToProduct))
      const localeLanguage = navigator.language
      setLocale(localeLanguage)
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Store could not be loaded.'))
  }, [slug])

  const addToCart = async (productId: number) => {
    if (!user || user.tenantSlug !== slug) {
      router.push(`/${slug}/login`)
      return
    }
    try {
      await apiRequest('/cart/items', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity: 1 }) })
      router.push('/cart')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add this product to the cart.')
    }
  }

  const toggleWishlist = async (productId: number) => {
    if (!user || user.tenantSlug !== slug) {
      router.push(`/${slug}/login`)
      return
    }
    try {
      await apiRequest(`/wishlist/${productId}`, { method: 'PUT' })
      setError('Added to your wishlist.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update wishlist.')
    }
  }

  if (error && !store) return <main className="p-8 text-sm text-red-700">{error}</main>
  if (!store) return <main className="p-8 text-sm text-gray-600">Loading store...</main>

  const brand = store.theme_settings
  const moneyLocale = localeByLanguage[Object.keys(localeByLanguage).find((key) => locale.startsWith(key)) as keyof typeof localeByLanguage] || 'en-IN'
  const selectedCurrency = currencyOptions.some((option) => option.code === store.default_currency) ? store.default_currency : 'INR'

  return (
    <main className="min-h-screen" style={{ backgroundColor: brand.background || '#f7f7f3', color: brand.text || '#20251f' }}>
      <header className="border-b border-black/10 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href={`/${slug}/products`} className="flex min-w-0 items-center gap-3">
            {store.logo_url ? <img src={store.logo_url} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded text-white" style={{ backgroundColor: brand.primary || '#294334' }}>{store.name.slice(0, 1)}</span>}
            <span className="truncate text-lg font-semibold">{store.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            {user?.role === 'tenant_admin' && <Link href={`/${slug}/admin`} className="hidden rounded border border-gray-300 px-3 py-2 text-xs font-medium sm:inline-flex">Store admin</Link>}
            <Link href={user ? '/cart' : `/${slug}/login`} aria-label="Open cart" className="grid h-10 w-10 place-items-center rounded border border-gray-300 text-gray-700"><ShoppingCart size={18} /></Link>
            <Link href={user ? `/${slug}/admin` : `/${slug}/login`} className="rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700">{user ? 'Account' : 'Log in'}</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide opacity-60">{store.name}</p><h1 className="mt-1 text-3xl font-semibold">Products</h1></div><p className="text-xs font-medium">Prices in {selectedCurrency}</p></div>
        {error && <p role="status" className="mt-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => <article key={product.id} className="overflow-hidden border border-black/10 bg-white">
            <div className="relative aspect-square bg-gray-100"><Link href={`/${slug}/products/${product.id}`} aria-label={`View ${product.name} details`}><img src={product.image} alt={product.name} className="h-full w-full object-cover" /></Link><button type="button" onClick={() => toggleWishlist(Number(product.id))} aria-label={`Add ${product.name} to wishlist`} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-gray-700"><Heart size={18} /></button></div>
            <div className="p-4"><p className="text-xs uppercase tracking-wide opacity-60">{product.category}</p><h2 className="mt-2 min-h-12 font-semibold"><Link href={`/${slug}/products/${product.id}`} className="hover:underline">{product.name}</Link></h2><p className="mt-2 text-lg font-bold">{formatCurrency(product.price, selectedCurrency, moneyLocale)}</p><p className="mt-1 text-xs opacity-70">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p><button type="button" disabled={product.stock <= 0} onClick={() => void addToCart(Number(product.id))} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded px-3 text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: brand.primary || '#294334' }}><ShoppingBag size={16} />Add to Cart</button></div>
          </article>)}
        </div>
        {products.length === 0 && <p className="mt-10 border border-black/10 bg-white p-8 text-center text-sm opacity-70">This store has not published any products yet.</p>}
      </div>
    </main>
  )
}
