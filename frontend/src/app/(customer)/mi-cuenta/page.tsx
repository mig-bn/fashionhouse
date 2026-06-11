'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ShoppingBag, Scissors, Star, MessageCircle, Package,
  ChevronRight, Loader2,
} from 'lucide-react'
import { customersApi } from '@/lib/api/customers'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'En proceso',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
}

const QUOTATION_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', IN_REVIEW: 'En revisión', QUOTED: 'Cotizado',
  ACCEPTED: 'Aceptado', IN_PRODUCTION: 'En producción', READY: 'Listo',
}

const QUOTATION_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_REVIEW: 'bg-blue-100 text-blue-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  ACCEPTED: 'bg-brand-100 text-brand-700',
  IN_PRODUCTION: 'bg-orange-100 text-orange-700',
  READY: 'bg-green-100 text-green-700',
}

function StatCard({ label, value, icon: Icon, href }: {
  label: string; value: string | number; icon: React.ElementType; href?: string
}) {
  const content = (
    <div className="bg-white rounded-2xl border p-5 flex items-center gap-4 hover:shadow-sm transition">
      <div className="p-3 bg-brand-50 rounded-xl">
        <Icon className="w-5 h-5 text-brand-700" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default function MiCuentaPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-account'],
    queryFn: () => customersApi.getMyAccount(),
  })

  const account = data?.data

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    )
  }

  if (!account) return null

  const whatsappNumber = account.whatsappPhone?.replace(/\D/g, '') ?? '521XXXXXXXXXX'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hola%2C%20soy%20${encodeURIComponent(account.firstName)}%20y%20necesito%20ayuda%20con%20mi%20pedido.`

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {account.firstName} 👋
            </h1>
            {account.trustedClient && (
              <span className="flex items-center gap-1 bg-brand-700 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                <Star className="w-3 h-3" /> Cliente VIP
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{account.email}</p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <MessageCircle className="w-4 h-4" />
          Hablar con un asesor
        </a>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Órdenes totales"    value={account.totalOrders}       icon={ShoppingBag} href="/mis-ordenes" />
        <StatCard label="Cotizaciones activas" value={account.activeQuotations} icon={Scissors}    href="/mis-cotizaciones" />
        <StatCard label="Total comprado"     value={formatCurrency(account.totalSpent)} icon={Package} />
      </div>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Órdenes recientes</h2>
          <Link href="/mis-ordenes" className="text-sm text-brand-700 hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {account.recentOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border p-8 text-center text-gray-400 text-sm">
            Aún no tienes órdenes.{' '}
            <Link href="/catalogo" className="text-brand-700 hover:underline">Explorar catálogo →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {account.recentOrders.map(order => (
              <Link
                key={order.id}
                href={`/orden/${order.id}`}
                className="flex items-center justify-between bg-white rounded-2xl border px-5 py-4 hover:shadow-sm transition"
              >
                <div>
                  <p className="text-xs font-mono text-gray-400">{order.id.split('-')[0]}…</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.itemCount} artículo{order.itemCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-1 ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-brand-100 text-brand-700'
                  }`}>
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Active quotations */}
      {account.activeQuotationList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Cotizaciones en proceso</h2>
            <Link href="/mis-cotizaciones" className="text-sm text-brand-700 hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {account.activeQuotationList.map(q => (
              <Link
                key={q.id}
                href={`/mis-cotizaciones/${q.id}`}
                className="flex items-center justify-between bg-white rounded-2xl border px-5 py-4 hover:shadow-sm transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-gray-400">{q.id.split('-')[0]}…</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{q.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(q.createdAt)}</p>
                </div>
                <span className={`ml-4 shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                  QUOTATION_COLOR[q.status] ?? 'bg-gray-100 text-gray-600'
                }`}>
                  {QUOTATION_STATUS_LABEL[q.status] ?? q.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA solicitar cotización */}
      <div className="bg-gradient-to-r from-brand-700 to-brand-800 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-lg">¿Tienes un diseño en mente?</p>
          <p className="text-brand-200 text-sm mt-0.5">
            Solicita una prenda a la medida y te cotizamos.
          </p>
        </div>
        <Link
          href="/cotizaciones/nueva"
          className="shrink-0 bg-white text-brand-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-50 transition"
        >
          Solicitar cotización
        </Link>
      </div>
    </div>
  )
}
