'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { ordersApi } from '@/lib/api/orders'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'En proceso',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
}

export default function MisOrdenesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders(),
  })

  const orders = data?.data ?? []

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mis órdenes</h1>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3" />
          <p>Aún no tienes órdenes.</p>
          <Link href="/catalogo" className="mt-4 inline-block text-brand-700 font-medium">
            Explorar catálogo →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link key={order.id} href={`/orden/${order.id}`}
              className="flex items-center justify-between bg-white rounded-2xl border p-5 hover:shadow-sm transition group">
              <div>
                <p className="text-xs text-gray-400 font-mono">{order.id.split('-')[0]}…</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
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
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
