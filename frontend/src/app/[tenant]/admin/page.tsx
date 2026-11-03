'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, LogOut, Plus, Save, Store, Trash2 } from 'lucide-react'
import { getDemoSession, clearDemoSession } from '@/lib/demoAuth'
import { apiRequest, ApiProduct } from '@/lib/api'
import { currencyOptions } from '@/lib/locales'

interface TenantSettings {
  id: string
  slug: string
  name: string
  logo_url: string | null
  theme_settings: Record<string, string>
  enabled_payment_methods: string[]
  default_currency: string
  payment_provider: string
}

const paymentOptions = [
  { id: 'upi', name: 'UPI' },
  { id: 'paypal', name: 'PayPal' },
  { id: 'zelle', name: 'Zelle', note: 'Peer-to-peer; no standard merchant purchase protection.' },
  { id: 'online-banking', name: 'Online Banking' },
  { id: 'card', name: 'Credit or Debit Card' },
]

const themeFields = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'accent', label: 'Accent' },
]

export default function TenantAdminPage() {
  const { tenant: slug } = useParams<{ tenant: string }>()
  const router = useRouter()
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [theme, setTheme] = useState<Record<string, string>>({})
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [currency, setCurrency] = useState('INR')
  const [provider, setProvider] = useState('unconfigured')
  const [storeName, setStoreName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category: '', price: '0', original_price: '', image: '', stock: '0' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const user = getDemoSession()
    if (!user || user.role !== 'tenant_admin' || user.tenantSlug !== slug) {
      router.replace(`/${slug}/login`)
      return
    }
    void Promise.all([
      apiRequest<TenantSettings>('/admin/tenant'),
      apiRequest<ApiProduct[]>('/admin/products'),
    ]).then(([tenant, catalog]) => {
      setSettings(tenant)
      setProducts(catalog)
      setTheme(tenant.theme_settings)
      setPaymentMethods(tenant.enabled_payment_methods)
      setCurrency(tenant.default_currency)
      setProvider(tenant.payment_provider)
      setStoreName(tenant.name)
      setLogoUrl(tenant.logo_url || '')
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load store configuration.'))
      .finally(() => setLoading(false))
  }, [router, slug])

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await apiRequest<TenantSettings>('/admin/tenant', {
        method: 'PATCH',
        body: JSON.stringify({
          name: storeName,
          logo_url: logoUrl || null,
          theme_settings: theme,
          enabled_payment_methods: paymentMethods,
          default_currency: currency,
          payment_provider: provider,
        }),
      })
      setSettings(updated)
      sessionStorage.setItem('homecoming.tenant', JSON.stringify(updated))
      setMessage('Store settings saved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save store settings.')
    } finally {
      setSaving(false)
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      const created = await apiRequest<ApiProduct>('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          original_price: newProduct.original_price ? Number(newProduct.original_price) : null,
          stock: Number(newProduct.stock),
        }),
      })
      setProducts((current) => [...current, created])
      setNewProduct({ name: '', description: '', category: '', price: '0', original_price: '', image: '', stock: '0' })
      setMessage('Product created.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create product.')
    }
  }

  async function updateProduct(product: ApiProduct) {
    try {
      const updated = await apiRequest<ApiProduct>(`/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ price: product.price, stock: product.stock, name: product.name }),
      })
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item))
      setMessage(`${updated.name} saved.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update product.')
    }
  }

  async function deleteProduct(product: ApiProduct) {
    try {
      await apiRequest<void>(`/admin/products/${product.id}`, { method: 'DELETE' })
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setMessage(`${product.name} removed from the storefront.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove product.')
    }
  }

  async function logout() {
    await clearDemoSession()
    router.replace(`/${slug}/login`)
  }

  if (loading) return <main className="min-h-screen bg-[#f7f7f3] p-8 text-sm text-gray-600">Loading store configuration...</main>

  return (
    <main className="min-h-screen bg-[#f7f7f3] text-[#20251f]">
      <header className="sticky top-0 z-30 border-b border-[#dfe2d9] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {settings?.logo_url ? <img src={settings.logo_url} alt="" className="h-9 w-9 rounded object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded bg-[#294334] text-white"><Store size={18} /></span>}
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{settings?.name || slug}</p><p className="text-xs text-gray-500">Store administration · /{slug}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/${slug}/products`} className="hidden rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:inline-flex">View storefront</a>
            <button type="button" onClick={logout} aria-label="Log out" title="Log out" className="grid h-9 w-9 place-items-center rounded border border-gray-300 text-gray-700 hover:bg-gray-50"><LogOut size={17} /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-[#69816d]">HomeComing admin</p><h1 className="mt-1 text-2xl font-semibold">Store configuration</h1></div>
          <a href={`/${slug}/products`} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 sm:hidden">View storefront</a>
        </div>
        {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mt-5 border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}

        <form onSubmit={saveSettings} className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="border border-[#dfe2d9] bg-white p-5 sm:p-6">
              <div><h2 className="text-base font-semibold">Brand identity</h2><p className="mt-1 text-sm text-gray-500">Store name, logo, and visual theme.</p></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-semibold text-gray-700">Store name<input required value={storeName} onChange={(event) => setStoreName(event.target.value)} className="h-10 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
                <label className="space-y-1.5 text-xs font-semibold text-gray-700">Logo image URL<input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://..." className="h-10 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {themeFields.map(({ key, label }) => <label key={key} className="flex items-center gap-3 border border-gray-200 p-3 text-sm"><input type="color" aria-label={`${label} color`} value={theme[key] || '#294334'} onChange={(event) => setTheme((current) => ({ ...current, [key]: event.target.value }))} className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0" /><span>{label}</span></label>)}
              </div>
              <div className="mt-5 border p-4" style={{ backgroundColor: theme.background || '#f7f7f3', color: theme.text || '#20251f' }}>
                <p className="text-xs font-semibold uppercase">Theme preview</p><div className="mt-3 flex items-center justify-between gap-3"><span className="font-semibold">{storeName || slug}</span><button type="button" className="rounded px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: theme.primary || '#294334' }}>Shop collection</button></div>
              </div>
            </section>

            <section className="border border-[#dfe2d9] bg-white p-5 sm:p-6">
              <div><h2 className="text-base font-semibold">Payments and currency</h2><p className="mt-1 text-sm text-gray-500">Choose what your storefront offers. Provider credentials are configured server-side, never in this page.</p></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {paymentOptions.map((option) => <label key={option.id} className="flex cursor-pointer items-start gap-3 border border-gray-200 p-3"><input type="checkbox" checked={paymentMethods.includes(option.id)} onChange={(event) => setPaymentMethods((current) => event.target.checked ? [...current, option.id] : current.filter((method) => method !== option.id))} className="mt-1 accent-[#294334]" /><span><span className="block text-sm font-medium">{option.name}</span>{option.note && <span className="mt-1 block text-xs text-gray-500">{option.note}</span>}</span></label>)}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-semibold text-gray-700">Store currency<select value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm font-normal">{currencyOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select></label>
                <label className="space-y-1.5 text-xs font-semibold text-gray-700">Configured gateway identifier<input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="unconfigured" className="h-10 w-full rounded border border-gray-300 px-3 text-sm font-normal" /><span className="block font-normal text-gray-500">A matching server adapter and secret must be installed before charges can run.</span></label>
              </div>
            </section>
            <div className="sticky bottom-0 flex justify-end border border-gray-200 bg-white/95 p-3 backdrop-blur"><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded bg-[#294334] px-4 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{saving ? 'Saving...' : 'Save store settings'}</button></div>
          </div>

          <aside className="border border-[#dfe2d9] bg-white p-5 sm:p-6 xl:sticky xl:top-20">
            <h2 className="text-base font-semibold">Store profile</h2>
            <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-gray-500">Store route</dt><dd className="font-medium">/{slug}</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Payment setup</dt><dd className="font-medium">{provider === 'unconfigured' ? 'Not connected' : 'Provider selected'}</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Products</dt><dd className="font-medium">{products.length}</dd></div></dl>
            <p className="mt-5 border-l-2 border-amber-500 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Selecting payment methods does not activate a gateway. Payment provider secrets and webhook configuration must be provisioned by the platform operator.</p>
          </aside>
        </form>

        <section className="mt-8 border border-[#dfe2d9] bg-white p-5 sm:p-6">
          <div><h2 className="text-base font-semibold">Products</h2><p className="mt-1 text-sm text-gray-500">Only this store’s products appear in this list.</p></div>
          <form onSubmit={createProduct} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input required placeholder="Product name" value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} className="h-10 rounded border border-gray-300 px-3 text-sm" />
            <input required placeholder="Category" value={newProduct.category} onChange={(event) => setNewProduct({ ...newProduct, category: event.target.value })} className="h-10 rounded border border-gray-300 px-3 text-sm" />
            <input required placeholder="Image URL" value={newProduct.image} onChange={(event) => setNewProduct({ ...newProduct, image: event.target.value })} className="h-10 rounded border border-gray-300 px-3 text-sm xl:col-span-2" />
            <input placeholder="Description" value={newProduct.description} onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })} className="h-10 rounded border border-gray-300 px-3 text-sm md:col-span-2" />
            <label className="flex h-10 items-center gap-2 border border-gray-300 px-3 text-xs text-gray-500">Price<input required type="number" min="0" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })} className="w-full text-right text-sm text-gray-900 outline-none" /></label>
            <label className="flex h-10 items-center gap-2 border border-gray-300 px-3 text-xs text-gray-500">Stock<input required type="number" min="0" value={newProduct.stock} onChange={(event) => setNewProduct({ ...newProduct, stock: event.target.value })} className="w-full text-right text-sm text-gray-900 outline-none" /></label>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#294334] px-3 text-sm font-semibold text-[#294334] hover:bg-[#f4f7f3] xl:col-span-2"><Plus size={16} />Add product</button>
          </form>
          <div className="mt-6 overflow-x-auto border-t">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="text-xs uppercase text-gray-500"><tr><th className="py-3 pr-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Actions</th></tr></thead>
              <tbody className="divide-y">{products.map((product) => <tr key={product.id}><td className="py-3 pr-3"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-10 w-10 rounded object-cover" /><span className="font-medium">{product.name}</span></div></td><td className="px-3 py-3 text-gray-600">{product.category}</td><td className="px-3 py-3"><input aria-label={`${product.name} price`} type="number" min="0" value={product.price} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, price: Number(event.target.value) } : item))} className="w-24 rounded border border-gray-300 px-2 py-1" /></td><td className="px-3 py-3"><input aria-label={`${product.name} stock`} type="number" min="0" value={product.stock} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: Number(event.target.value) } : item))} className="w-20 rounded border border-gray-300 px-2 py-1" /></td><td className="px-3 py-3"><div className="flex gap-2"><button type="button" title="Save product" aria-label={`Save ${product.name}`} onClick={() => updateProduct(product)} className="grid h-8 w-8 place-items-center rounded border border-gray-300 hover:bg-gray-50"><Check size={16} /></button><button type="button" title="Remove product" aria-label={`Remove ${product.name}`} onClick={() => deleteProduct(product)} className="grid h-8 w-8 place-items-center rounded border border-gray-300 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button></div></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
