import axios, { AxiosError } from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

export default apiClient

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('access-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')   // auth endpoints never retry (no sesión activa)
    ) {
      originalRequest._retry = true
      try {
        // TAREA 2: enviar el refreshToken en el body — el backend lo exige con @NotBlank
        const currentRefreshToken = Cookies.get('refresh-token')
        if (!currentRefreshToken) throw new Error('No hay refresh token')

        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken: currentRefreshToken },
          { withCredentials: true }
        )

        // TAREA 3: guardar el nuevo accessToken Y el nuevo refreshToken
        // (el backend rota el refresh token en cada uso — el viejo deja de ser válido)
        const newAccessToken: string  = data.data.accessToken
        const newRefreshToken: string = data.data.refreshToken
        sessionStorage.setItem('access-token', newAccessToken)
        Cookies.set('refresh-token', newRefreshToken, { sameSite: 'strict' })

        originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch {
        // Refresh fallido → limpiar sesión y redirigir a login
        sessionStorage.removeItem('access-token')
        sessionStorage.removeItem('auth-user')
        Cookies.remove('refresh-token')
        Cookies.remove('user-role')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)
