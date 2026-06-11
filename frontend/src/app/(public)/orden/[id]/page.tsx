'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { ordersApi } from '@/lib/api/orders'
import { formatCurrency } from '@/lib/utils/formatters'
import { formatDate } from '@/lib/utils/formatters'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'En proceso',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('status')

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })

  const order = data?.data

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Estado del pago */}
      {paymentStatus === 'approved' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-8">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">¡Pago aprobado!</p>
            <p className="text-sm text-green-600">Tu pedido ha sido confirmado.</p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Detalle del pedido</h1>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      ) : order ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gray-400">Número de orden</p>
                <p className="text-sm font-mono font-medium text-gray-700">{order.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-brand-100 text-brand-700'
              }`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
            <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Artículos</h2>
            <div className="divide-y">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-gray-500 text-xs">{[item.size, item.color].filter(Boolean).join(' · ')} — SKU: {item.variantSku}</p>
                    <p className="text-gray-500 text-xs">× {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="border-t mt-2 pt-4 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span className="text-brand-700">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Envío */}
          {order.shipAddress && (
            <div className="bg-white rounded-2xl border p-6 text-sm text-gray-600">
              <h2 className="font-semibold text-gray-900 mb-2">Dirección de envío</h2>
              <p>{order.shipAddress}</p>
              <p>{order.shipCity}, {order.shipState} {order.shipPostal}</p>
              <p>{order.shipCountry}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/mis-ordenes"
              className="flex-1 text-center border border-brand-700 text-brand-700 py-2.5 rounded-xl font-medium hover:bg-brand-50 transition">
              Mis órdenes
            </Link>
            <Link href="/catalogo"
              className="flex-1 text-center bg-brand-700 text-white py-2.5 rounded-xl font-medium hover:bg-brand-800 transition">
              Seguir comprando
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Orden no encontrada.</p>
      )}
    </div>
  )
}
