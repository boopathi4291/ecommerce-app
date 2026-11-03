'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, ShoppingCart } from 'lucide-react'
import { getDemoSession, DemoUser } from '@/lib/demoAuth'
import { apiProductToProduct, apiRequest, ApiProduct } from '@/lib/api'
import { formatCurrency } from '@/lib/formatCurrency'
import { currencyOptions, localeByLanguage } from '@/lib/locales'

interface StoreProfile {
  slug: string
  name: string
  logo_url: string | null
  theme_settings: Record<string, string>
  default_currency: string
}

export default function TenantProductDetailPage() {
  const { tenant: slug, productId } = useParams<{ tenant: string; productId: string }>()
  const router = useRouter()
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [product, setProduct] = useState<ReturnType<typeof apiProductToProduct> | null>(null)
  const [user, setUser] = useState<DemoUser | null>(null)
  const [locale, setLocale] = useState('en-IN')
  const [error, setError] = useState('')

  useEffect(() => {
    const activeUser = getDemoSession()
    setUser(activeUser?.tenantSlug === slug ? activeUser : null)
    setLocale(navigator.language)
    void Promise.all([
      apiRequest<StoreProfile>(`/tenants/${encodeURIComponent(slug)}`),
      apiRequest<ApiProduct>(`/storefront/${encodeURIComponent(slug)}/products/${productId}`),
    ]).then(([profile, item]) => {
      setStore(profile)
      setProduct(apiProductToProduct(item))
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Product could not be loaded.'))
  }, [slug, productId])

  const requireTenantLogin = () => {
    router.push(`/${slug}/login`)
  }

  async function addToCart() {
    if (!user || user.tenantSlug !== slug) return requireTenantLogin()
    if (!product) return
    try {
      await apiRequest('/cart/items', { method: 'POST', body: JSON.stringify({ product_id: Number(product.id), quantity: 1 }) })
      router.push('/cart')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add this product to the cart.')
    }
  }

  async function toggleWishlist() {
    if (!user || user.tenantSlug !== slug) return requireTenantLogin()
    if (!product) return
    try {
      await apiRequest(`/wishlist/${product.id}`, { method: 'PUT' })
      setError('Added to your wishlist.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update wishlist.')
    }
  }

  if (error && !product) return <main className="p-8 text-sm text-red-700">{error}</main>
  if (!store || !product) return <main className="p-8 text-sm text-gray-600">Loading product...</main>

  const currency = store.default_currency
  const localeKey = Object.keys(localeByLanguage).find((key) => locale.toLowerCase().startsWith(key)) as keyof typeof localeByLanguage | undefined
  const currencyLocale = localeKey ? localeByLanguage[localeKey] : 'en-IN'
  const currencyName = currencyOptions.find((option) => option.code === currency)?.name || currency
  const theme = store.theme_settings

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6" style={{ backgroundColor: theme.background || '#f7f7f3', color: theme.text || '#20251f' }}>
      <div className="mx-auto max-w-6xl">
        <Link href={`/${slug}/products`} className="inline-flex items-center gap-2 text-sm text-gray-600"><ArrowLeft size={16} />{store.name}</Link>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="aspect-square overflow-hidden bg-white"><img src={product.image} alt={product.name} className="h-full w-full object-cover" /></div>
          <section className="py-2">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{product.category}</p>
            <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
            <p className="mt-4 text-2xl font-bold">{formatCurrency(product.price, currency, currencyLocale)}</p>
            <p className="mt-2 text-xs opacity-70">Price displayed in {currencyName}</p>
            <p className="mt-5 text-sm leading-6 opacity-80">{product.description || 'Product details will be updated by this store.'}</p>
            <p className="mt-5 text-sm">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
            {error && <p role="status" className="mt-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
            <div className="mt-6 flex gap-3"><button type="button" disabled={!product.stock} onClick={() => void addToCart()} className="flex h-11 flex-1 items-center justify-center gap-2 rounded px-4 text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: theme.primary || '#294334' }}><ShoppingCart size={17} />Add to Cart</button><button type="button" onClick={() => void toggleWishlist()} aria-label="Add to wishlist" className="grid h-11 w-11 place-items-center rounded border border-gray-300 bg-white"><Heart size={18} /></button></div>
          </section>
        </div>
      </div>
    </main>
  )
}
