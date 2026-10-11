export interface User {
  id: string
  email?: string
  mobile?: string
  firstName: string
  lastName: string
  avatar?: string
  provider: 'email' | 'google' | 'github'
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token?: string
  loading: boolean
  error?: string
}

export interface LoginCredentials {
  emailOrMobile: string
  password: string
}

export interface SignupCredentials {
  firstName: string
  lastName: string
  email?: string
  mobile?: string
  password: string
  confirmPassword: string
}
