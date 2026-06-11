'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { MessageSquare, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { botApi, type BotInteraction } from '@/lib/api/bot'

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
}

const INTENT_LABELS: Record<string, string> = {
  ORDER_STATUS:      'Estado de pedido',
  QUOTATION_STATUS:  'Estado de cotización',
  HUMAN_HANDOFF:     'Transferido',
  UNKNOWN:           'Desconocido',
}

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: 'bg-green-100 text-green-700',
  TELEGRAM: 'bg-blue-100 text-blue-700',
}

const INTENT_COLORS: Record<string, string> = {
  ORDER_STATUS:     'bg-purple-100 text-purple-700',
  QUOTATION_STATUS: 'bg-amber-100 text-amber-700',
  HUMAN_HANDOFF:    'bg-red-100 text-red-700',
  UNKNOWN:          'bg-gray-100 text-gray-600',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type Filter = 'all' | 'pending' | 'resolved'

export default function BotPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['bot-stats'],
    queryFn:  botApi.getStats,
    refetchInterval: 30_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['bot-interactions', filter, page],
    queryFn:  () => botApi.getInteractions(page, 20, filter === 'pending'),
    refetchInterval: 30_000,
  })

  const interactions: BotInteraction[] = data?.content ?? []
  const totalPages: number = data?.totalPages ?? 0

  const resolveMutation = useMutation({
    mutationFn: (id: string) => botApi.markResolved(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-interactions'] })
      queryClient.invalidateQueries({ queryKey: ['bot-stats'] })
    },
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Bot</h1>
          {(stats?.pending ?? 0) > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {stats!.pending} pendiente{stats!.pending !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={stats.total} icon={<MessageSquare className="w-5 h-5 text-brand-600" />} />
          <StatCard label="Pendientes" value={stats.pending} icon={<Clock className="w-5 h-5 text-red-500" />} highlight={stats.pending > 0} />
          <StatCard label="Resueltos" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
          <StatCard label="Tasa transferencia" value={`${stats.transferRate}%`} icon={<AlertCircle className="w-5 h-5 text-amber-500" />} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'resolved'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Resueltos'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando...
          </div>
        ) : interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <MessageSquare className="w-8 h-8" />
            <p className="text-sm">No hay conversaciones aún</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Canal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente / Contacto</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Mensaje</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Intención</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {interactions.map(i => (
                <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CHANNEL_COLORS[i.channel] ?? 'bg-gray-100 text-gray-600'}`}>
                      {CHANNEL_LABELS[i.channel] ?? i.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 truncate max-w-[140px]">
                      {i.customerName ?? i.senderName ?? i.externalId}
                    </div>
                    {i.customerName && (
                      <div className="text-xs text-gray-400 truncate">{i.externalId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate text-gray-700">{i.incomingMsg}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${INTENT_COLORS[i.intent] ?? 'bg-gray-100 text-gray-600'}`}>
                      {INTENT_LABELS[i.intent] ?? i.intent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {i.resolved ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resuelto
                      </span>
                    ) : i.transferred ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> Pendiente
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Automático</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(i.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bot/${i.id}`}
                      className="text-xs text-brand-600 hover:underline font-medium"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label, value, icon, highlight = false,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl border p-4 flex flex-col gap-1 ${highlight ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
