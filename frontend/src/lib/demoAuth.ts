export interface DemoUser {
  id: string
  displayName: string
  email?: string
  mobile?: string
  provider: 'email' | 'google' | 'apple'
}

interface DemoAccount {
  user: DemoUser
  salt: string
  passwordHash: string
}

const ACCOUNTS_KEY = 'atelier.demo.accounts'
const SESSION_KEY = 'atelier.demo.user'

function readAccounts(): DemoAccount[] {
  try {
    return JSON.parse(sessionStorage.getItem(ACCOUNTS_KEY) || '[]') as DemoAccount[]
  } catch {
    return []
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function derivePasswordHash(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const saltBuffer = new ArrayBuffer(salt.byteLength)
  new Uint8Array(saltBuffer).set(salt)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

function saveSession(user: DemoUser): DemoUser {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function getDemoSession(): DemoUser | null {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as DemoUser | null
  } catch {
    return null
  }
}

export async function signUpDemo(input: {
  firstName: string
  lastName: string
  identifier: string
  password: string
}): Promise<DemoUser> {
  const identifier = input.identifier.trim().toLowerCase()
  const accounts = readAccounts()
  if (accounts.some((account) => account.user.id === identifier)) {
    throw new Error('An account already exists for this email or mobile number.')
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const user: DemoUser = {
    id: identifier,
    displayName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
    ...(identifier.includes('@') ? { email: identifier } : { mobile: identifier }),
    provider: 'email',
  }
  accounts.push({ user, salt: toHex(salt), passwordHash: await derivePasswordHash(input.password, salt) })
  sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  return saveSession(user)
}

export async function signInDemo(identifierInput: string, password: string): Promise<DemoUser> {
  const identifier = identifierInput.trim().toLowerCase()
  const account = readAccounts().find((candidate) => candidate.user.id === identifier)
  if (!account) throw new Error('No local demo account found. Create an account first.')

  const salt = Uint8Array.from(account.salt.match(/.{2}/g) || [], (byte) => Number.parseInt(byte, 16))
  const passwordHash = await derivePasswordHash(password, salt)
  if (passwordHash !== account.passwordHash) throw new Error('That password does not match this demo account.')
  return saveSession(account.user)
}

export function signInWithDemoProvider(provider: 'google' | 'apple'): DemoUser {
  const title = provider === 'google' ? 'Google' : 'Apple'
  return saveSession({ id: `${provider}-demo`, displayName: `${title} Guest`, provider })
}

export function clearDemoSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}