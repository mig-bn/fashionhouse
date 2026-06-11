'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Scissors } from 'lucide-react'
import { quotationsApi, type QuotationStatus } from '@/lib/api/quotations'
import { formatDate } from '@/lib/utils/formatters'

const STATUS_LABEL: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revisión',
  QUOTED: 'Cotizado',
  ACCEPTED: 'Aceptado',
  IN_PRODUCTION: 'En producción',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  REJECTED: 'Rechazado',
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

export default function MisCotizacionesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-quotations'],
    queryFn: () => quotationsApi.getMyQuotations(),
  })

  const quotations = (data as any)?.data?.content ?? []

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis cotizaciones</h1>
        <Link
          href="/cotizaciones/nueva"
          className="flex items-center gap-2 bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-brand-800 transition"
        >
          <Plus className="w-4 h-4" />
          Nueva solicitud
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Scissors className="w-12 h-12 mx-auto mb-3" />
          <p className="font-medium">No tienes solicitudes de cotización aún.</p>
          <Link href="/cotizaciones/nueva"
            className="mt-4 inline-block text-brand-700 font-medium hover:underline">
            Solicitar una prenda a la medida →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map(q => (
            <Link
              key={q.id}
              href={`/mis-cotizaciones/${q.id}`}
              className="flex items-center justify-between bg-white rounded-2xl border p-5 hover:shadow-sm transition group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 font-mono">{q.id.split('-')[0]}…</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{q.description}</p>
                <p className="text-xs text-gray-500">{formatDate(q.createdAt)}</p>
              </div>
              <div className="ml-4 text-right shrink-0">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-1 ${STATUS_COLOR[q.status]}`}>
                  {STATUS_LABEL[q.status]}
                </span>
                {q.proposedPrice != null && (
                  <p className="text-sm font-bold text-gray-900">
                    ${q.proposedPrice.toLocaleString('es-MX')} {q.currency}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
