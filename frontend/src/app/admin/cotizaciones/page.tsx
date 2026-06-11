'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Scissors } from 'lucide-react'
import { quotationsApi, type QuotationStatus } from '@/lib/api/quotations'
import { formatDate } from '@/lib/utils/formatters'

const ALL_STATUSES: QuotationStatus[] = [
  'PENDING', 'IN_REVIEW', 'QUOTED', 'ACCEPTED',
  'IN_PRODUCTION', 'READY', 'DELIVERED', 'REJECTED',
]

const STATUS_LABEL: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador', PENDING: 'Pendiente', IN_REVIEW: 'En revisión',
  QUOTED: 'Cotizado', ACCEPTED: 'Aceptado', IN_PRODUCTION: 'En producción',
  READY: 'Listo', DELIVERED: 'Entregado', REJECTED: 'Rechazado',
}

const STATUS_COLOR: Record<QuotationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_REVIEW: 'bg-blue-100 text-blue-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  ACCEPTED: 'bg-brand-100 text-brand-700',
  IN_PRODUCTION: 'bg-orange-100 text-orange-700',
  READY: 'bg-green-100 text-green-700',
  DELIVERED: 'bg-green-200 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function AdminCotizacionesPage() {
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-quotations', statusFilter],
    queryFn: () => quotationsApi.getAll(0, 50, statusFilter),
  })

  const quotations = (data as any)?.data?.content ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Scissors className="w-6 h-6 text-brand-700" />
        <h1 className="text-xl font-bold text-gray-900">Cotizaciones</h1>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            statusFilter === undefined
              ? 'bg-brand-700 text-white border-brand-700'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todas
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              statusFilter === s
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Scissors className="w-10 h-10 mx-auto mb-2" />
          <p>No hay cotizaciones con este filtro.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotations.map(q => (
                <tr key={q.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/cotizaciones/${q.id}`}
                      className="font-mono text-xs text-brand-700 hover:underline"
                    >
                      {q.id.split('-')[0]}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{q.customerName}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{q.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[q.status]}`}>
                      {STATUS_LABEL[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800">
                    {q.proposedPrice != null
                      ? `$${q.proposedPrice.toLocaleString('es-MX')} ${q.currency}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(q.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
