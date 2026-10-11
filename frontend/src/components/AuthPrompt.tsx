'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, X } from 'lucide-react'

interface AuthPromptProps {
  returnTo: string
  onClose: () => void
}

export default function AuthPrompt({ returnTo, onClose }: AuthPromptProps) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const continueToAuth = (mode: 'login' | 'signup') => {
    sessionStorage.setItem('atelier.demo.returnTo', returnTo)
    sessionStorage.setItem('atelier.demo.authMode', mode)
    router.push('/')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title" className="relative w-full max-w-sm border border-gray-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Close sign-in prompt" className="absolute right-3 top-3 rounded p-2 text-gray-500 hover:bg-gray-100">
          <X size={18} />
        </button>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8eee6] text-[#294334]"><Lock size={18} /></span>
        <h2 id="auth-prompt-title" className="mt-4 text-xl font-semibold text-gray-900">Sign in to continue</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">Log in or create an account to use your cart and wishlist.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => continueToAuth('login')} className="h-11 rounded border border-[#294334] bg-[#294334] px-4 text-sm font-semibold text-white hover:bg-[#1e3327]">Log in</button>
          <button type="button" onClick={() => continueToAuth('signup')} className="h-11 rounded border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50">Sign up</button>
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-800">Keep browsing</button>
      </section>
    </div>
  )
}