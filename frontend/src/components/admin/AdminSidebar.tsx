'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Scissors, Users, BarChart3,
  LogOut, ChevronRight, Eye, MessageSquare,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { botApi } from '@/lib/api/bot'

const navItems = [
  { href: '/admin',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/admin/productos',    label: 'Productos',    icon: Package },
  { href: '/admin/categorias',   label: 'Categorías',   icon: Tag },
  { href: '/admin/ordenes',      label: 'Órdenes',      icon: ShoppingBag },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: Scissors },
  { href: '/admin/clientes',     label: 'Clientes',     icon: Users },
  { href: '/admin/bot',          label: 'Bot',          icon: MessageSquare },
  { href: '/admin/reportes',     label: 'Reportes',     icon: BarChart3 },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user, clearAuth } = useAuthStore()
  const router = useRouter()

  const { data: botStats } = useQuery({
    queryKey: ['bot-stats'],
    queryFn:  botApi.getStats,
    refetchInterval: 30_000,
  })
  const botPending = botStats?.pending ?? 0

  function handleLogout() {
    clearAuth()
    router.push('/login')
  }

  function handleViewStore() {
    document.cookie = 'store-preview=1; path=/; max-age=7200'
    router.push('/catalogo')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <span className="font-bold text-brand-700 text-lg">Fashion House</span>
        <span className="text-xs text-gray-400 ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded font-medium">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          const isBot  = href === '/admin/bot'
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isBot && botPending > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {botPending > 99 ? '99+' : botPending}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 opacity-40" />}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 mb-1">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 text-xs font-bold uppercase">
              {user?.email?.charAt(0) ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.email ?? 'Admin'}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              {user?.role ?? 'ADMIN'}
            </p>
          </div>
        </div>
        <button
          onClick={handleViewStore}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          <Eye className="w-4 h-4" />
          Ver tienda
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
