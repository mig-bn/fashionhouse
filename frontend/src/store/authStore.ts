import { create } from 'zustand'
import type { Role, User } from '@/types/user'
import Cookies from 'js-cookie'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void
  clearAuth: () => void
  hydrate: () => void
  hasRole: (role: Role | Role[]) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth(user, accessToken, refreshToken) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access-token', accessToken)
      // Guardar datos del usuario para rehidratar al refrescar la página
      sessionStorage.setItem('auth-user', JSON.stringify(user))
      Cookies.set('user-role', user.role, { sameSite: 'strict' })
      if (refreshToken) {
        Cookies.set('refresh-token', refreshToken, { sameSite: 'strict' })
      }
    }
    set({ user, accessToken, isAuthenticated: true })
  },

  clearAuth() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access-token')
      sessionStorage.removeItem('auth-user')
      Cookies.remove('user-role')
      Cookies.remove('refresh-token')
    }
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  hydrate() {
    if (typeof window === 'undefined') return
    const token    = sessionStorage.getItem('access-token')
    const userJson = sessionStorage.getItem('auth-user')
    if (!token || !userJson) return
    try {
      const user = JSON.parse(userJson) as User
      set({ user, accessToken: token, isAuthenticated: true })
    } catch {
      // Datos corruptos — limpiar para forzar login
      sessionStorage.removeItem('access-token')
      sessionStorage.removeItem('auth-user')
    }
  },

  hasRole(role) {
    const { user } = get()
    if (!user) return false
    if (Array.isArray(role)) return role.includes(user.role)
    return user.role === role
  },
}))
