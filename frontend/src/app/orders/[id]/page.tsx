'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AuthPrompt from '@/components/AuthPrompt'
import { getDemoSession, DemoUser } from '@/lib/demoAuth'
import { formatCurrency } from '@/lib/formatCurrency'
import { languageOptions, localeByLanguage } from '@/lib/locales'
import { findDemoOrder } from '@/lib/demoOrders'
import { DemoOrder, PaymentMethod } from '@/types/checkout'

const paymentLabels: Record<PaymentMethod, string> = {
  upi: 'UPI',
  paypal: 'PayPal',
  zelle: 'Zelle',
  'online-banking': 'Online Banking',
  card: 'Credit or Debit Card',
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [order, setOrder] = useState<DemoOrder | null>(null)
  const [locale, setLocale] = useState('en-IN')
  const [ready, setReady] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)

  useEffect(() => {
    const activeUser = getDemoSession()
    setUser(activeUser)
    const savedLanguage = languageOptions.find((option) => option.code === sessionStorage.getItem('atelier.demo.language'))
    setLocale(savedLanguage ? localeByLanguage[savedLanguage.code] : 'en-IN')
    if (activeUser) setOrder(findDemoOrder(params.id, activeUser.id))
    else setAuthPromptOpen(true)
    setReady(true)
  }, [params.id])

  if (!ready) return <main className="min-h-screen bg-gray-50" aria-label="Loading order" />

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {order && user ? (
          <>
            <div className="border border-[#d8e5da] bg-[#f2f7f1] p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#42644b]">Payment confirmed</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Thank you, {order.shipping.fullName}</h1>
              <p className="mt-2 text-sm text-gray-600">Your demo order is confirmed. No real payment was taken.</p>
              <div className="mt-6 grid gap-4 border-t border-[#d5dfd3] pt-5 sm:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase text-gray-500">Order number</p><p className="mt-1 font-semibold text-gray-900">{order.id}</p></div>
                <div><p className="text-xs font-semibold uppercase text-gray-500">Demo tracking code</p><p className="mt-1 font-semibold text-gray-900">{order.trackingCode}</p></div>
              </div>
            </div>

            <section className="mt-6 border border-gray-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">Order details</h2>
              <ul className="mt-4 divide-y">{order.items.map(({ product, quantity }) => <li key={product.id} className="flex justify-between gap-4 py-3 text-sm"><span className="text-gray-700">{product.name} × {quantity}</span><span className="whitespace-nowrap font-medium text-gray-900">{formatCurrency(product.price * quantity, order.currency, locale)}</span></li>)}</ul>
              <div className="mt-2 flex justify-between border-t pt-4 font-semibold text-gray-900"><span>Total paid (demo)</span><span>{formatCurrency(order.total, order.currency, locale)}</span></div>
            </section>

            <section className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="border border-gray-200 bg-white p-5"><h2 className="font-semibold text-gray-900">Delivery</h2><p className="mt-3 text-sm leading-6 text-gray-600">{order.shipping.fullName}<br />{order.shipping.address}<br />{order.shipping.city}, {order.shipping.postalCode}<br />{order.shipping.email}<br />{order.shipping.mobile}</p></div>
              <div className="border border-gray-200 bg-white p-5"><h2 className="font-semibold text-gray-900">Payment</h2><p className="mt-3 text-sm text-gray-600">{paymentLabels[order.paymentMethod]}</p><p className="mt-2 text-sm font-medium text-green-700">Confirmed in demo</p><p className="mt-4 text-xs leading-5 text-gray-500">Tracking is simulated for phase one; courier updates are not connected.</p></div>
            </section>
            <Link href="/products" className="mt-6 inline-flex h-11 items-center rounded bg-[#294334] px-5 text-sm font-semibold text-white hover:bg-[#1e3327]">Continue shopping</Link>
          </>
        ) : (
          <div className="border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900">Order details unavailable</h1>
            <p className="mt-2 text-sm text-gray-600">Only a confirmed order from this browser session can be displayed.</p>
            <Link href="/products" className="mt-5 inline-flex h-10 items-center rounded bg-[#294334] px-5 text-sm font-semibold text-white">Browse products</Link>
          </div>
        )}
      </div>
      {authPromptOpen && <AuthPrompt returnTo={`/orders/${params.id}`} onClose={() => setAuthPromptOpen(false)} />}
    </main>
  )
}