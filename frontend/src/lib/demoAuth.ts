import { apiAuth, apiRequest, apiTenantAuth, ApiUser, clearApiSession, registerTenant as registerTenantApi } from '@/lib/api'

export interface DemoUser {
  id: string
  displayName: string
  email?: string
  mobile?: string
  provider: 'email' | 'google' | 'apple'
  tenantId?: string
  tenantSlug?: string
  role?: 'customer' | 'tenant_admin'
}

const SESSION_KEY = 'atelier.demo.user'

function userFromApi(user: ApiUser): DemoUser {
  return {
    id: user.id,
    displayName: `${user.first_name} ${user.last_name}`.trim(),
    ...(user.email ? { email: user.email } : {}),
    ...(user.mobile ? { mobile: user.mobile } : {}),
    provider: 'email',
    ...(user.tenant_id ? { tenantId: user.tenant_id } : {}),
    role: user.role,
  }
}

export async function signInTenant(slug: string, identifier: string, password: string): Promise<DemoUser> {
  const response = await apiTenantAuth(slug, 'login', { email_or_mobile: identifier, password })
  const user = userFromApi(response.user)
  user.tenantSlug = response.tenant.slug
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  sessionStorage.setItem('homecoming.tenant', JSON.stringify(response.tenant))
  return user
}

export async function signUpTenantCustomer(slug: string, input: { firstName: string; lastName: string; identifier: string; password: string }): Promise<DemoUser> {
  const response = await apiTenantAuth(slug, 'signup', {
    email_or_mobile: input.identifier,
    first_name: input.firstName,
    last_name: input.lastName,
    password: input.password,
  })
  const user = userFromApi(response.user)
  user.tenantSlug = response.tenant.slug
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  sessionStorage.setItem('homecoming.tenant', JSON.stringify(response.tenant))
  return user
}

export async function registerStore(input: { companyName: string; slug: string; firstName: string; lastName: string; email: string; password: string }): Promise<DemoUser> {
  const response = await registerTenantApi({
    company_name: input.companyName,
    slug: input.slug,
    admin_first_name: input.firstName,
    admin_last_name: input.lastName,
    email: input.email,
    password: input.password,
  })
  const user = userFromApi(response.user)
  user.tenantSlug = response.tenant.slug
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  sessionStorage.setItem('homecoming.tenant', JSON.stringify(response.tenant))
  return user
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
    sessionStorage.removeItem('homecoming.tenant')
  }
}