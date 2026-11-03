import { apiAuth, apiRequest, ApiUser, clearApiSession } from '@/lib/api'

export interface DemoUser {
  id: string
  displayName: string
  email?: string
  mobile?: string
  provider: 'email' | 'google' | 'apple'
}

const SESSION_KEY = 'atelier.demo.user'

function userFromApi(user: ApiUser): DemoUser {
  return {
    id: user.id,
    displayName: `${user.first_name} ${user.last_name}`.trim(),
    ...(user.email ? { email: user.email } : {}),
    ...(user.mobile ? { mobile: user.mobile } : {}),
    provider: 'email',
  }
}

function saveSession(user: ApiUser): DemoUser {
  const demoUser = userFromApi(user)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoUser))
  return demoUser
}

export function getDemoSession(): DemoUser | null {
  try {
    const user = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as DemoUser | null
    if (user && !sessionStorage.getItem('homecoming.api.access')) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return user
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
  const user = await apiAuth('/auth/signup', {
    email_or_mobile: input.identifier,
    first_name: input.firstName,
    last_name: input.lastName,
    password: input.password,
  })
  return saveSession(user)
}

export async function signInDemo(identifierInput: string, password: string): Promise<DemoUser> {
  const user = await apiAuth('/auth/login', { email_or_mobile: identifierInput, password })
  return saveSession(user)
}

export async function signInWithDemoProvider(provider: 'google' | 'apple'): Promise<DemoUser> {
  await apiRequest<void>(`/auth/oauth/${provider}/authorize`)
  throw new Error(`${provider} OAuth returned without a user session.`)
}

export async function clearDemoSession(): Promise<void> {
  try {
    await clearApiSession()
  } catch {
  } finally {
    sessionStorage.removeItem(SESSION_KEY)
  }
}