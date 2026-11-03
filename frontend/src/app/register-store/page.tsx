'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Leaf } from 'lucide-react'
import { registerStore } from '@/lib/demoAuth'

export default function RegisterStorePage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await registerStore({ companyName, slug, firstName, lastName, email, password })
      router.push(`/${user.tenantSlug}/admin`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create your store.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f3] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="flex items-center gap-3 text-sm font-bold text-[#294334]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#294334] text-white"><Leaf size={18} /></span>HomeComing</Link>
        <section className="mt-8 border border-[#dfe2d9] bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#69816d]">Seller onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Create your HomeComing store</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">Your store gets its own URL, product catalog, brand settings, and payment-method selection.</p>
          <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-gray-700 sm:col-span-2">Company/store name<input required minLength={2} maxLength={120} value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
            <label className="space-y-1.5 text-xs font-semibold text-gray-700 sm:col-span-2">Store URL slug<span className="flex h-11 items-center rounded border border-gray-300 focus-within:border-[#55705a]"><span className="pl-3 text-sm text-gray-500">homecoming.com/</span><input required minLength={3} maxLength={63} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-sm outline-none" /></span></label>
            <label className="space-y-1.5 text-xs font-semibold text-gray-700">Admin first name<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
            <label className="space-y-1.5 text-xs font-semibold text-gray-700">Admin last name<input required value={lastName} onChange={(event) => setLastName(event.target.value)} className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
            <label className="space-y-1.5 text-xs font-semibold text-gray-700 sm:col-span-2">Admin email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
            <label className="space-y-1.5 text-xs font-semibold text-gray-700 sm:col-span-2">Password<input required type="password" minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
            {error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{error}</p>}
            <button disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded bg-[#294334] px-5 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{busy ? 'Creating store...' : 'Create store'}<ArrowRight size={17} /></button>
          </form>
          <p className="mt-5 text-xs leading-5 text-gray-500">For this prototype, store creation is self-service. Add email verification, abuse controls, and a platform approval flow before public launch.</p>
        </section>
      </div>
    </main>
  )
}
