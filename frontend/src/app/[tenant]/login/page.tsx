'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, Leaf, Lock } from 'lucide-react'
import { signInTenant, signUpTenantCustomer } from '@/lib/demoAuth'
import { apiRequest, ApiTenant } from '@/lib/api'

export default function TenantLoginPage() {
  const params = useParams<{ tenant: string }>()
  const router = useRouter()
  const slug = params.tenant
  const [store, setStore] = useState<ApiTenant | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void apiRequest<ApiTenant>(`/tenants/${encodeURIComponent(slug)}`)
      .then(setStore)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'This store could not be found.'))
  }, [slug])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const user = mode === 'login'
        ? await signInTenant(slug, identifier, password)
        : await signUpTenantCustomer(slug, { firstName, lastName, identifier, password })
      router.replace(user.role === 'tenant_admin' ? `/${slug}/admin` : `/${slug}/products`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in to this store.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f3] px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-[440px]">
        <Link href={`/${slug}/products`} className="flex items-center gap-3 text-sm font-bold tracking-wide" style={{ color: store?.theme_settings.text || '#294334' }}>
          {store?.logo_url ? <img src={store.logo_url} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ backgroundColor: store?.theme_settings.primary || '#294334' }}><Leaf size={18} /></span>}
          {store?.name || slug}
        </Link>
        <section className="mt-10 border border-[#e1e4dc] bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: store?.theme_settings.secondary || '#69816d' }}>HomeComing storefront</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{mode === 'login' ? `Sign in to ${store?.name || slug}` : `Join ${store?.name || slug}`}</h1>
          <div className="mt-6 grid grid-cols-2 border-b border-gray-200 text-sm">
            <button type="button" onClick={() => { setMode('login'); setError('') }} className={`border-b-2 pb-3 font-semibold ${mode === 'login' ? 'border-[#294334] text-[#294334]' : 'border-transparent text-gray-500'}`}>Log in</button>
            <button type="button" onClick={() => { setMode('signup'); setError('') }} className={`border-b-2 pb-3 font-semibold ${mode === 'signup' ? 'border-[#294334] text-[#294334]' : 'border-transparent text-gray-500'}`}>Create customer account</button>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs font-semibold text-gray-700">First name<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
              <label className="space-y-1.5 text-xs font-semibold text-gray-700">Last name<input required value={lastName} onChange={(event) => setLastName(event.target.value)} className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
            </div>}
            <label className="block space-y-1.5 text-xs font-semibold text-gray-700">Email or mobile<input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>
            <label className="block space-y-1.5 text-xs font-semibold text-gray-700">Password<span className="relative block"><Lock size={15} className="absolute left-3 top-3.5 text-gray-400" /><input required minLength={10} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded border border-gray-300 pl-9 pr-3 text-sm font-normal" /></span></label>
            {mode === 'signup' && <label className="block space-y-1.5 text-xs font-semibold text-gray-700">Confirm password<input required minLength={10} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 w-full rounded border border-gray-300 px-3 text-sm font-normal" /></label>}
            {error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: store?.theme_settings.primary || '#294334' }}>{busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}<ArrowRight size={16} /></button>
          </form>
          <p className="mt-4 text-xs leading-5 text-gray-500">Store admins sign in here and will be taken to their store configuration.</p>
        </section>
        <Link href="/register-store" className="mt-5 block text-center text-sm text-[#294334] underline underline-offset-2">Create a HomeComing store</Link>
      </div>
    </main>
  )
}
