import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Inicio' }

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-50 to-white py-24 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-800 leading-tight">
          Moda con <span className="text-brand-600">personalidad</span>
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
          Descubre prendas únicas y solicita tu ropa a la medida directamente con nosotros.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/catalogo"
            className="bg-brand-700 hover:bg-brand-800 text-white font-medium px-8 py-3 rounded-full transition"
          >
            Ver catálogo
          </Link>
          <Link
            href="/cotizaciones/nueva"
            className="border border-brand-700 text-brand-700 hover:bg-brand-50 font-medium px-8 py-3 rounded-full transition"
          >
            Solicitar a la medida
          </Link>
        </div>
      </section>
    </>
  )
}
