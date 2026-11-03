const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
export const API_BASE = configuredApiUrl.endsWith('/api/v1') ? configuredApiUrl : `${configuredApiUrl.replace(/\/$/, '')}/v1`
const ACCESS_TOKEN_KEY = 'homecoming.api.access'
const REFRESH_TOKEN_KEY = 'homecoming.api.refresh'

export interface ApiUser {
  id: string
  tenant_id: string | null
  role: 'customer' | 'tenant_admin'
  email: string | null
  mobile: string | null
  first_name: string
  last_name: string
  created_at: string
}

export interface ApiProduct {
  id: number
  name: string
  description: string
  category: string
  price: number
  original_price: number | null
  image: string
  stock: number
}

export interface ApiCartLine {
  product: ApiProduct
  quantity: number
  line_total: number
}

export interface ApiCart {
  items: ApiCartLine[]
  subtotal: number
  currency: string
}

export interface ApiTenant {
  id: string
  slug: string
  name: string
  logo_url: string | null
  theme_settings: Record<string, string>
  enabled_payment_methods: string[]
  default_currency: string
  payment_provider: string
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  expires_in: number
  user: ApiUser
  tenant?: { id: string; slug: string; name: string; logo_url: string | null; theme_settings: Record<string, string>; enabled_payment_methods: string[]; default_currency: string; payment_provider: string }
}

function saveTokens(tokens: TokenResponse): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

async function decodeError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null) as { detail?: string } | null
  return new Error(body?.detail || `API request failed (${response.status})`)
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!response.ok) {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem('atelier.demo.user')
    return null
  }
  const tokens = await response.json() as TokenResponse
  saveTokens(tokens)
  return tokens.access_token
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (response.status === 401 && accessToken) {
    const refreshedToken = await refreshAccessToken()
    if (refreshedToken) {
      headers.set('Authorization', `Bearer ${refreshedToken}`)
      response = await fetch(`${API_BASE}${path}`, { ...init, headers })
    }
  }
  if (!response.ok) throw await decodeError(response)
  if (response.status === 204) return undefined as T
  return await response.json() as T
}

export async function apiAuth(path: '/auth/signup' | '/auth/login', body: Record<string, string>): Promise<ApiUser> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await decodeError(response)
  const tokens = await response.json() as TokenResponse
  saveTokens(tokens)
  return tokens.user
}

export async function apiTenantAuth(slug: string, path: 'login' | 'signup', body: Record<string, string>): Promise<{ user: ApiUser; tenant: NonNullable<TokenResponse['tenant']> }> {
  const response = await fetch(`${API_BASE}/tenants/${encodeURIComponent(slug)}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await decodeError(response)
  const tokens = await response.json() as TokenResponse
  if (!tokens.tenant) throw new Error('Tenant authentication response is missing store details.')
  saveTokens(tokens)
  return { user: tokens.user, tenant: tokens.tenant }
}

export async function registerTenant(body: Record<string, string>): Promise<{ user: ApiUser; tenant: NonNullable<TokenResponse['tenant']> }> {
  const response = await fetch(`${API_BASE}/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await decodeError(response)
  const tokens = await response.json() as TokenResponse
  if (!tokens.tenant) throw new Error('Tenant registration response is missing store details.')
  saveTokens(tokens)
  return { user: tokens.user, tenant: tokens.tenant }
}

export async function clearApiSession(): Promise<void> {
  try {
    if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) await apiRequest<void>('/auth/logout', { method: 'POST' })
  } finally {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function apiProductToProduct(product: ApiProduct) {
  return {
    ...product,
    originalPrice: product.original_price ?? undefined,
  }
}