'use client'

import Link from 'next/link'
import { ShoppingBag, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import CartSidebar from '@/components/cart/CartSidebar'

export default function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const totalItems = useCartStore(s => s.totalItems())
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF'

  function handleBackToAdmin() {
    // Limpiar cookie de vista previa para reactivar las redirecciones del middleware
    document.cookie = 'store-preview=; path=/; max-age=0'
    router.push('/admin')
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-brand-700 tracking-tight">
            Fashion House
          </Link>

          {/* Nav central */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/catalogo" className="hover:text-brand-700 transition">Catálogo</Link>
          </nav>

          {/* Botón "Volver al panel" — solo visible para ADMIN/STAFF */}
          {isAdminOrStaff && (
            <button
              onClick={handleBackToAdmin}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-brand-700 border border-brand-300 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Volver al panel
            </button>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-3">
            {/* Carrito */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none px-1">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Usuario */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-sm text-gray-700 p-2 rounded-full hover:bg-gray-100 transition">
                  <User className="w-5 h-5" />
                </button>
                <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 bg-white border rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b">{user?.email}</div>
                  {/* Links visibles solo para clientes */}
                  {user?.role !== 'ADMIN' && user?.role !== 'STAFF' && (
                    <>
                      <Link href="/mi-cuenta" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Mi cuenta
                      </Link>
                      <Link href="/mis-ordenes" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Mis órdenes
                      </Link>
                      <Link href="/mis-cotizaciones" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Mis cotizaciones
                      </Link>
                    </>
                  )}
                  {/* Link al panel para ADMIN/STAFF */}
                  {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Panel admin
                    </Link>
                  )}
                  <button
                    onClick={() => clearAuth()}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-brand-700 border border-brand-700 px-4 py-1.5 rounded-full hover:bg-brand-50 transition"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
