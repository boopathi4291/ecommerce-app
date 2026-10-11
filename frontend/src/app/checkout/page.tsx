'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react'
import AuthPrompt from '@/components/AuthPrompt'
import { getDemoSession, DemoUser } from '@/lib/demoAuth'
import { formatCurrency } from '@/lib/formatCurrency'
import { currencyOptions, languageOptions, localeByLanguage } from '@/lib/locales'
import { readDemoCart, saveDemoOrder, writeDemoCart } from '@/lib/demoOrders'
import { CartLine, DemoOrder, PaymentMethod, ShippingDetails } from '@/types/checkout'

type DemoOutcome = 'success' | 'declined' | 'timeout'

const paymentOptions: { value: PaymentMethod; label: string; detail: string }[] = [
  { value: 'upi', label: 'UPI', detail: 'UPI app or UPI ID' },
  { value: 'paypal', label: 'PayPal', detail: 'Continue through PayPal in a live integration' },
  { value: 'zelle', label: 'Zelle', detail: 'Demo only; peer-to-peer transfers may not be reversible' },
  { value: 'online-banking', label: 'Online Banking', detail: 'Bank redirect in a live integration' },
  { value: 'card', label: 'Credit or Debit Card', detail: 'Hosted card fields in a live integration' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [user, setUser] = useState<DemoUser | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [currency, setCurrency] = useState('INR')
  const [locale, setLocale] = useState('en-IN')
  const [shipping, setShipping] = useState<ShippingDetails>({ fullName: '', email: '', mobile: '', address: '', city: '', postalCode: '' })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [demoOutcome, setDemoOutcome] = useState<DemoOutcome>('success')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [ready, setReady] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)

  useEffect(() => {
    const activeUser = getDemoSession()
    setUser(activeUser)
    setCart(activeUser ? readDemoCart() : [])
    const savedCurrency = currencyOptions.find((option) => option.code === sessionStorage.getItem('atelier.demo.currency'))
    const savedLanguage = languageOptions.find((option) => option.code === sessionStorage.getItem('atelier.demo.language'))
    setCurrency(savedCurrency?.code ?? 'INR')
    setLocale(savedLanguage ? localeByLanguage[savedLanguage.code] : 'en-IN')
    if (activeUser) {
      setShipping((current) => ({
        ...current,
        fullName: activeUser.displayName,
        email: activeUser.email ?? '',
        mobile: activeUser.mobile ?? '',
      }))
    } else {
      setAuthPromptOpen(true)
    }
    setReady(true)
  }, [])

  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || cart.length === 0 || processing) return
    setError('')
    setProcessing(true)

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      if (demoOutcome === 'declined') {
        setError('The demo payment was declined. No charge was made and your cart is unchanged.')
        return
      }
      if (demoOutcome === 'timeout') {
        setError('No payment confirmation arrived. No order was created and this demo made no charge. Your cart is unchanged. A live checkout must verify the provider status before retrying or refunding.')
        return
      }

      const orderId = `AT-${Date.now().toString(36).toUpperCase()}`
      const trackingCode = `TRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const order: DemoOrder = {
        id: orderId,
        userId: user.id,
        trackingCode,
        paymentMethod,
        paymentStatus: 'paid',
        createdAt: new Date().toISOString(),
        currency,
        items: cart,
        shipping,
        total: subtotal,
      }
      saveDemoOrder(order)
      writeDemoCart([])
      router.push(`/orders/${orderId}`)
    } finally {
      setProcessing(false)
    }
  }

  if (!ready) return <main className="min-h-screen bg-gray-50" aria-label="Loading checkout" />

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft size={17} /> Back to cart</Link>
          <p className="text-sm font-semibold tracking-wide text-[#294334]">HomeComing</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold text-gray-900">Checkout</h1>
          <div className="mt-5 flex gap-3 border border-[#d8e5da] bg-[#f2f7f1] p-4 text-sm leading-6 text-[#294334]">
            <ShieldCheck className="mt-0.5 flex-none" size={19} />
            <p><strong>Demo checkout only.</strong> No payment is taken and no card, bank, UPI, or PayPal credentials are collected. Live payments require a server-verified gateway integration.</p>
          </div>
        </div>

        {!user ? (
          <div className="mt-8 border border-gray-200 bg-white p-6 text-sm text-gray-600">Sign in to continue checkout.</div>
        ) : cart.length === 0 ? (
          <div className="mt-8 border border-gray-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-gray-900">Your cart is empty</h2>
            <Link href="/products" className="mt-4 inline-flex h-10 items-center rounded bg-[#294334] px-5 text-sm font-semibold text-white">Browse products</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-8">
              <section className="border border-gray-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900">Delivery details</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium text-gray-700">Full name<input required autoComplete="name" value={shipping.fullName} onChange={(event) => setShipping({ ...shipping, fullName: event.target.value })} className="h-11 w-full rounded border border-gray-300 px-3 font-normal outline-none focus:border-[#55705a]" /></label>
                  <label className="space-y-1.5 text-sm font-medium text-gray-700">Email<input required type="email" autoComplete="email" value={shipping.email} onChange={(event) => setShipping({ ...shipping, email: event.target.value })} className="h-11 w-full rounded border border-gray-300 px-3 font-normal outline-none focus:border-[#55705a]" /></label>
                  <label className="space-y-1.5 text-sm font-medium text-gray-700">Mobile number<input required type="tel" autoComplete="tel" value={shipping.mobile} onChange={(event) => setShipping({ ...shipping, mobile: event.target.value })} className="h-11 w-full rounded border border-gray-300 px-3 font-normal outline-none focus:border-[#55705a]" /></label>
                  <label className="space-y-1.5 text-sm font-medium text-gray-700 sm:col-span-2">Street address<input required autoComplete="street-address" value={shipping.address} onChange={(event) => setShipping({ ...shipping, address: event.target.value })} className="h-11 w-full rounded border border-gray-300 px-3 font-normal outline-none focus:border-[#55705a]" /></label>
                  <label className="space-y-1.5 text-sm font-medium text-gray-700">City<input required autoComplete="address-level2" value={shipping.city} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} className="h-11 w-full rounded border border-gray-300 px-3 font-normal outline-none focus:border-[#55705a]" /></label>
                  <label className="space-y-1.5 text-sm font-medium text-gray-700">Postal code<input required autoComplete="postal-code" value={shipping.postalCode} onChange={(event) => setShipping({ ...shipping, postalCode: event.target.value })} className="h-11 w-full rounded border border-gray-300 px-3 font-normal outline-none focus:border-[#55705a]" /></label>
                </div>
              </section>

              <section className="border border-gray-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900">Payment method</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {paymentOptions.map((option) => (
                    <label key={option.value} className={`flex cursor-pointer items-start gap-3 border p-4 ${paymentMethod === option.value ? 'border-[#294334] bg-[#f4f7f3]' : 'border-gray-200 hover:border-gray-400'}`}>
                      <input type="radio" name="paymentMethod" value={option.value} checked={paymentMethod === option.value} onChange={() => setPaymentMethod(option.value)} className="mt-1 accent-[#294334]" />
                      <span><span className="block text-sm font-semibold text-gray-900">{option.label}</span><span className="mt-1 block text-xs leading-5 text-gray-500">{option.detail}</span></span>
                    </label>
                  ))}
                </div>
                {paymentMethod === 'zelle' && <p className="mt-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">Zelle is a peer-to-peer service and does not provide guaranteed purchase protection or reversible merchant payments. This option is simulation-only.</p>}
                <label className="mt-6 block max-w-sm space-y-1.5 text-xs font-semibold text-gray-700">Demo payment result
                  <select value={demoOutcome} onChange={(event) => setDemoOutcome(event.target.value as DemoOutcome)} className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm font-normal">
                    <option value="success">Payment confirmed</option>
                    <option value="declined">Payment declined</option>
                    <option value="timeout">Confirmation timeout</option>
                  </select>
                </label>
                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-gray-500"><Lock size={14} className="mt-0.5 flex-none" />No real financial details are requested or stored in this phase.</p>
              </section>
            </div>

            <aside className="border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold text-gray-900">Order summary</h2>
              <ul className="mt-4 divide-y text-sm">{cart.map(({ product, quantity }) => <li key={product.id} className="flex justify-between gap-4 py-3"><span className="min-w-0"><span className="block truncate font-medium text-gray-800">{product.name}</span><span className="text-gray-500">Qty {quantity}</span></span><span className="whitespace-nowrap text-gray-700">{formatCurrency(product.price * quantity, currency, locale)}</span></li>)}</ul>
              <div className="mt-3 flex justify-between border-t pt-4 font-semibold text-gray-900"><span>Total</span><span>{formatCurrency(subtotal, currency, locale)}</span></div>
              {error && <p role="alert" className="mt-4 border border-amber-300 bg-amber-50 p-3 text-sm leading-5 text-amber-900">{error}</p>}
              <button type="submit" disabled={processing} className="mt-5 flex h-11 w-full items-center justify-center rounded bg-[#294334] px-4 text-sm font-semibold text-white hover:bg-[#1e3327] disabled:cursor-wait disabled:opacity-60">{processing ? 'Processing demo...' : 'Confirm demo payment'}</button>
              <p className="mt-3 text-xs leading-5 text-gray-500">An order and tracking code are created only for the simulated confirmed result.</p>
            </aside>
          </form>
        )}
      </div>
      {authPromptOpen && <AuthPrompt returnTo="/checkout" onClose={() => setAuthPromptOpen(false)} />}
    </main>
  )
}