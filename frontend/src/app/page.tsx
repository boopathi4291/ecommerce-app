'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Leaf, Lock } from 'lucide-react'
import { signInDemo, signInWithDemoProvider, signUpDemo } from '@/lib/demoAuth'

type AuthMode = 'login' | 'signup'

function takeReturnPath(): string {
  const returnTo = sessionStorage.getItem('atelier.demo.returnTo')
  sessionStorage.removeItem('atelier.demo.returnTo')
  sessionStorage.removeItem('atelier.demo.authMode')
  return returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/products'
}

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('atelier.demo.user')) {
      router.replace(takeReturnPath())
      return
    }
    if (sessionStorage.getItem('atelier.demo.authMode') === 'signup') setMode('signup')
  }, [router])

  const finishLogin = () => router.push(takeReturnPath())

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!identifier.trim()) return setError('Enter your email address or mobile number.')
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())
    const phoneDigits = identifier.replace(/\D/g, '')
    const isMobile = /^[+]?([\d\s().-])+$/.test(identifier.trim()) && phoneDigits.length >= 7 && phoneDigits.length <= 15
    if (!isEmail && !isMobile) return setError('Enter a valid email address or mobile number.')
    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim()) return setError('Enter your first and last name.')
      if (password.length < 8) return setError('Use a password with at least 8 characters.')
      if (password !== confirmPassword) return setError('Your passwords do not match.')
    }

    setBusy(true)
    try {
      if (mode === 'signup') await signUpDemo({ firstName, lastName, identifier, password })
      else await signInDemo(identifier, password)
      finishLogin()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete sign in.')
    } finally {
      setBusy(false)
    }
  }

  function handleProvider(provider: 'google' | 'apple') {
    setError('')
    signInWithDemoProvider(provider)
    finishLogin()
  }

  return (
    <main className="min-h-screen bg-[#f7f7f3] lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#23372d] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,31,23,.12),rgba(15,31,23,.7)),url('https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center" />
        <div className="relative z-10 flex items-center gap-3 text-sm font-semibold tracking-wide">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/40"><Leaf size={19} /></span>
          ATELIER MARKET
        </div>
        <div className="relative z-10 max-w-xl pb-8">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.18em] text-[#d5d8c5]">Good things, chosen well</p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.08] xl:text-6xl">A little more considered.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/80">Find the pieces that make everyday feel like yours.</p>
        </div>
        <p className="relative z-10 text-xs text-white/60">Thoughtful finds for the way you live.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-12 flex items-center gap-3 text-sm font-bold tracking-wide text-[#294334] lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#294334] text-white"><Leaf size={17} /></span>
            ATELIER MARKET
          </div>
          <p className="text-sm font-semibold text-[#69816d]">YOUR EVERYDAY, ELEVATED</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#20251f]">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-[#73796f]">{mode === 'login' ? 'Sign in to find your next favourite.' : 'Join us for a more personal kind of shopping.'}</p>

          <div className="mt-8 grid grid-cols-2 border-b border-[#dfe2d9] text-sm">
            <button type="button" onClick={() => { setMode('login'); setError('') }} className={`border-b-2 px-3 pb-3 font-semibold transition ${mode === 'login' ? 'border-[#294334] text-[#294334]' : 'border-transparent text-[#858b80]'}`}>Log in</button>
            <button type="button" onClick={() => { setMode('signup'); setError('') }} className={`border-b-2 px-3 pb-3 font-semibold transition ${mode === 'signup' ? 'border-[#294334] text-[#294334]' : 'border-transparent text-[#858b80]'}`}>Sign up</button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handleProvider('google')} className="flex h-11 items-center justify-center gap-2 rounded border border-[#dfe2d9] bg-white text-sm font-medium text-[#343b34] hover:bg-[#f0f2ec]">
              <span className="text-base font-bold text-[#4285f4]">G</span> Google <span className="text-[10px] text-[#8b9188]">demo</span>
            </button>
            <button type="button" onClick={() => handleProvider('apple')} className="flex h-11 items-center justify-center gap-2 rounded border border-[#dfe2d9] bg-white text-sm font-medium text-[#343b34] hover:bg-[#f0f2ec]">
              <span className="text-lg leading-none">●</span> Apple <span className="text-[10px] text-[#8b9188]">demo</span>
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-[#92978f]"><span className="h-px flex-1 bg-[#dfe2d9]" />OR CONTINUE WITH EMAIL OR MOBILE<span className="h-px flex-1 bg-[#dfe2d9]" /></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs font-semibold text-[#4c554b]">First name<input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="h-11 w-full rounded border border-[#dfe2d9] bg-white px-3 text-sm font-normal outline-none focus:border-[#55705a]" required /></label>
              <label className="space-y-1.5 text-xs font-semibold text-[#4c554b]">Last name<input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} className="h-11 w-full rounded border border-[#dfe2d9] bg-white px-3 text-sm font-normal outline-none focus:border-[#55705a]" required /></label>
            </div>}
            <label className="block space-y-1.5 text-xs font-semibold text-[#4c554b]">Email address or mobile number
              <input autoComplete="username" type="text" inputMode="email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@example.com or +91 98765 43210" className="h-11 w-full rounded border border-[#dfe2d9] bg-white px-3 text-sm font-normal outline-none placeholder:text-[#a1a69e] focus:border-[#55705a]" required />
            </label>
            <label className="block space-y-1.5 text-xs font-semibold text-[#4c554b]">Password
              <span className="relative block">
                <Lock size={16} className="absolute left-3 top-3.5 text-[#8b9388]" />
                <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="h-11 w-full rounded border border-[#dfe2d9] bg-white pl-10 pr-11 text-sm font-normal outline-none placeholder:text-[#a1a69e] focus:border-[#55705a]" required />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[#8b9388]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </label>
            {mode === 'signup' && <label className="block space-y-1.5 text-xs font-semibold text-[#4c554b]">Confirm password<input autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 w-full rounded border border-[#dfe2d9] bg-white px-3 text-sm font-normal outline-none focus:border-[#55705a]" required /></label>}
            {error && <p role="alert" className="rounded border border-[#e5b9ae] bg-[#fff2ee] px-3 py-2 text-sm text-[#9a3e2b]">{error}</p>}
            <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded bg-[#294334] px-4 text-sm font-semibold text-white transition hover:bg-[#1e3327] disabled:opacity-60">
              {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'} <ArrowRight size={17} />
            </button>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-[#8b9188]">Phase-one local demo. Account data stays in this browser tab and is cleared when the session ends.</p>
        </div>
      </section>
    </main>
  )
}