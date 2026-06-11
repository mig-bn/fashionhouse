'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api/auth'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [isLoading, setIsLoading]       = useState(false)

  const handleLogin = async () => {
    setError('')

    if (!email.trim()) { setError('El email es requerido'); return }
    if (!password)     { setError('La contraseña es requerida'); return }

    setIsLoading(true)
    try {
      const res = await authApi.login({ email: email.trim(), password })

      if (res.success && res.data) {
        setAuth(res.data.user as any, res.data.accessToken, res.data.refreshToken)
        const isStaff = ['ADMIN', 'STAFF'].includes(res.data.user.role)
        router.push(isStaff ? '/admin' : '/')
        return
      }

      setError(res.error?.message ?? 'Credenciales inválidas')
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        err?.message ??
        'No se pudo conectar con el servidor'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        {/* Back to store */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la tienda
          </Link>
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-700">
            Fashion House
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            Iniciar sesión
          </h1>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-5">

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKey}
              placeholder="admin@fashionhouse.com"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón — type="button" para evitar submit nativo */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2
                       bg-brand-700 hover:bg-brand-800 text-white
                       font-semibold py-3 rounded-xl transition
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando…</>
              : 'Entrar'}
          </button>

          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-brand-700 font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

        {/* Credenciales de prueba */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Admin de prueba: <span className="font-mono">admin@fashionhouse.com</span>{' '}
          /{' '}
          <span className="font-mono">admin.123</span>
        </p>

      </div>
    </div>
  )
}
