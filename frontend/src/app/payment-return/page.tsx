'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'

type PaymentState = 'checking' | 'failed' | 'timeout'

interface PaymentStatus {
  id: string
  order_id: string
  status: string
}

export default function PaymentReturnPage() {
  const router = useRouter()
  const [state, setState] = useState<PaymentState>('checking')
  const [message, setMessage] = useState('Verifying payment with the provider...')

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const orderId = query.get('order_id')
    const paymentId = query.get('payment_id')
    if (!orderId || !paymentId) {
      setState('failed')
      setMessage('The payment return link is incomplete. Check your order history before trying again.')
      return
    }

    let active = true
    const verify = async () => {
      try {
        await apiRequest<PaymentStatus>(`/payments/${paymentId}/reconcile`, { method: 'POST' })
      } catch {}
      for (let attempt = 0; attempt < 15 && active; attempt += 1) {
        try {
          const payment = await apiRequest<PaymentStatus>(`/payments/${paymentId}`)
          if (payment.status === 'succeeded') {
            router.replace(`/orders/${orderId}`)
            return
          }
          if (payment.status === 'failed' || payment.status === 'canceled' || payment.status === 'refund_pending') {
            setState('failed')
            setMessage(payment.status === 'refund_pending'
              ? 'The payment was received but the order needs review. A refund may be pending; contact support before retrying.'
              : 'The provider did not confirm payment. No confirmed order was created; check your payment provider before retrying.')
            return
          }
        } catch (cause) {
          if (attempt === 14) {
            setState('failed')
            setMessage(cause instanceof Error ? cause.message : 'Could not verify payment status.')
            return
          }
        }
        await new Promise((resolve) => window.setTimeout(resolve, 2000))
      }
      if (active) {
        setState('timeout')
        setMessage('Confirmation is still pending. No order is marked paid until the backend receives a verified provider confirmation. Check payment status before retrying.')
      }
    }

    void verify()
    return () => { active = false }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-lg border border-gray-200 bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#55705a]">HomeComing checkout</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">{state === 'checking' ? 'Confirming payment' : state === 'timeout' ? 'Payment confirmation pending' : 'Payment not confirmed'}</h1>
        <p role="status" className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        {state !== 'checking' && <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/products" className="inline-flex h-10 items-center rounded bg-[#294334] px-4 text-sm font-semibold text-white">Continue shopping</Link>
          <Link href="/cart" className="inline-flex h-10 items-center rounded border border-gray-300 px-4 text-sm font-semibold text-gray-700">View cart</Link>
        </div>}
      </section>
    </main>
  )
}