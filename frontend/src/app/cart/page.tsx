'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import AuthPrompt from '@/components/AuthPrompt'
import { formatCurrency } from '@/lib/formatCurrency'
import { currencyOptions, languageOptions, localeByLanguage } from '@/lib/locales'
import { readDemoCart, writeDemoCart } from '@/lib/demoOrders'
import { getDemoSession, DemoUser } from '@/lib/demoAuth'
import { CartLine } from '@/types/checkout'

export default function CartPage() {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [currency, setCurrency] = useState('INR')
  const [locale, setLocale] = useState('en-IN')
  const [ready, setReady] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)

  useEffect(() => {
    const activeUser = getDemoSession()
    setUser(activeUser)
    setCart(activeUser ? readDemoCart() : [])
    const selectedCurrency = currencyOptions.find((option) => option.code === sessionStorage.getItem('atelier.demo.currency'))
    const selectedLanguage = languageOptions.find((option) => option.code === sessionStorage.getItem('atelier.demo.language'))
    setCurrency(selectedCurrency?.code ?? 'INR')
    setLocale(selectedLanguage ? localeByLanguage[selectedLanguage.code] : 'en-IN')
    setAuthPromptOpen(!activeUser)
    setReady(true)
  }, [])

  const updateCart = (nextCart: CartLine[]) => {
    setCart(nextCart)
    if (user) writeDemoCart(nextCart)
  }

  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  if (!ready) return <main className="min-h-screen bg-gray-50" aria-label="Loading cart" />

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft size={17} /> Continue shopping</Link>
          <p className="text-sm font-semibold tracking-wide text-[#294334]">HomeComing</p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-semibold text-gray-900">Your cart <span className="text-lg font-normal text-gray-500">({cart.reduce((sum, line) => sum + line.quantity, 0)})</span></h1>
        {cart.length === 0 ? (
          <div className="mt-8 border border-gray-200 bg-white px-6 py-14 text-center">
            <ShoppingBag className="mx-auto text-gray-400" size={28} />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-600">Browse the collection to find something you love.</p>
            <Link href="/products" className="mt-6 inline-flex h-10 items-center rounded bg-[#294334] px-5 text-sm font-semibold text-white hover:bg-[#1e3327]">Browse products</Link>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="divide-y border-y border-gray-200 bg-white">
              {cart.map(({ product, quantity }) => (
                <li key={product.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5">
                  <img src={product.image} alt={product.name} className="h-20 w-20 flex-none rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="mt-1 text-sm text-gray-500">{formatCurrency(product.price, currency, locale)} each</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button type="button" aria-label={`Decrease ${product.name} quantity`} disabled={quantity <= 1} onClick={() => updateCart(cart.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity - 1 } : line))} className="grid h-8 w-8 place-items-center border border-gray-300 text-gray-700 disabled:opacity-40"><Minus size={14} /></button>
                      <span className="min-w-6 text-center text-sm">{quantity}</span>
                      <button type="button" aria-label={`Increase ${product.name} quantity`} disabled={quantity >= product.stock} onClick={() => updateCart(cart.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line))} className="grid h-8 w-8 place-items-center border border-gray-300 text-gray-700 disabled:opacity-40"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between sm:w-auto sm:flex-col sm:items-end sm:gap-3">
                    <span className="font-semibold text-gray-900">{formatCurrency(product.price * quantity, currency, locale)}</span>
                    <button type="button" onClick={() => updateCart(cart.filter((line) => line.product.id !== product.id))} aria-label={`Remove ${product.name}`} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={17} /></button>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold text-gray-900">Order summary</h2>
              <div className="mt-5 flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal, currency, locale)}</span></div>
              <div className="mt-3 flex justify-between border-t pt-4 text-base font-semibold text-gray-900"><span>Total</span><span>{formatCurrency(subtotal, currency, locale)}</span></div>
              <Link href="/checkout" className="mt-5 flex h-11 w-full items-center justify-center rounded bg-[#294334] px-4 text-sm font-semibold text-white hover:bg-[#1e3327]">Continue to checkout</Link>
              <p className="mt-3 text-xs leading-5 text-gray-500">Shipping and payment are completed in the next step.</p>
            </aside>
          </div>
        )}
      </div>
      {authPromptOpen && <AuthPrompt returnTo="/cart" onClose={() => setAuthPromptOpen(false)} />}
    </main>
  )
}