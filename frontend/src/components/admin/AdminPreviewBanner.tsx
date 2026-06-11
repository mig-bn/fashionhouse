'use client'

import { LayoutDashboard, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AdminPreviewBanner() {
  const user = useAuthStore(s => s.user)
  const router = useRouter()

  // Solo se muestra si el usuario es ADMIN o STAFF
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) return null

  function handleBack() {
    // Borrar cookie de vista previa para que el middleware vuelva a redirigir
    document.cookie = 'store-preview=; path=/; max-age=0'
    router.push('/admin')
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-brand-800 px-4 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-brand-200 uppercase tracking-widest shrink-0">
          Vista previa
        </span>
        <span className="text-xs text-brand-300 truncate hidden sm:block">
          Estás navegando la tienda como cliente · los cambios que hagas aquí son reales
        </span>
      </div>
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 shrink-0 bg-white text-brand-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-50 transition"
      >
        <LayoutDashboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Volver al panel</span>
        <span className="sm:hidden">Panel</span>
      </button>
    </div>
  )
}
