import Navbar from '@/components/layout/Navbar'
import AdminPreviewBanner from '@/components/admin/AdminPreviewBanner'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Barra de aviso cuando admin/staff navegan la tienda en modo vista previa */}
      <AdminPreviewBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 mt-12 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Fashion House Boutique. Todos los derechos reservados.
      </footer>
    </div>
  )
}
