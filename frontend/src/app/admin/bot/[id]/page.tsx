'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, MessageSquare, User } from 'lucide-react'
import { botApi } from '@/lib/api/bot'

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
}

const INTENT_LABELS: Record<string, string> = {
  ORDER_STATUS:      'Estado de pedido',
  QUOTATION_STATUS:  'Estado de cotización',
  HUMAN_HANDOFF:     'Transferido a asesor',
  UNKNOWN:           'Desconocido',
}

const INTENT_COLORS: Record<string, string> = {
  ORDER_STATUS:     'bg-purple-100 text-purple-700',
  QUOTATION_STATUS: 'bg-amber-100 text-amber-700',
  HUMAN_HANDOFF:    'bg-red-100 text-red-700',
  UNKNOWN:          'bg-gray-100 text-gray-600',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: interaction, isLoading, isError } = useQuery({
    queryKey: ['bot-interaction', id],
    queryFn:  () => botApi.getById(id),
  })

  const resolveMutation = useMutation({
    mutationFn: () => botApi.markResolved(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-interaction', id] })
      queryClient.invalidateQueries({ queryKey: ['bot-interactions'] })
      queryClient.invalidateQueries({ queryKey: ['bot-stats'] })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="h-64 flex items-center justify-center text-gray-400">Cargando...</div>
      </div>
    )
  }

  if (isError || !interaction) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-red-500">No se encontró la interacción.</p>
        <button onClick={() => router.back()} className="mt-2 text-sm text-brand-600 hover:underline">
          ← Volver
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/admin/bot" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
        <ArrowLeft className="w-4 h-4" />
        Volver al bot
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Conversación</h1>

          {/* Canal */}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            interaction.channel === 'WHATSAPP'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {CHANNEL_LABELS[interaction.channel] ?? interaction.channel}
          </span>

          {/* Intención */}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${INTENT_COLORS[interaction.intent] ?? 'bg-gray-100 text-gray-600'}`}>
            {INTENT_LABELS[interaction.intent] ?? interaction.intent}
          </span>

          {/* Estado */}
          {interaction.resolved ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resuelto
            </span>
          ) : interaction.transferred ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertCircle className="w-3.5 h-3.5" /> Pendiente de atención
            </span>
          ) : (
            <span className="text-xs text-gray-400">Resuelto automáticamente</span>
          )}
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Contacto</p>
            <p className="font-medium text-gray-900">
              {interaction.senderName ?? '—'} <span className="text-gray-400 font-normal">({interaction.externalId})</span>
            </p>
          </div>

          {interaction.customerName && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Cliente registrado</p>
              {interaction.customerId ? (
                <Link
                  href={`/admin/clientes/${interaction.customerId}`}
                  className="font-medium text-brand-600 hover:underline inline-flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5" />
                  {interaction.customerName}
                </Link>
              ) : (
                <p className="font-medium text-gray-900">{interaction.customerName}</p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-0.5">Fecha</p>
            <p className="text-gray-700 capitalize">{formatDate(interaction.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Chat bubbles */}
      <div className="space-y-3">
        {/* Mensaje entrante */}
        <div className="flex justify-start">
          <div className="max-w-[80%]">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">
                {interaction.senderName ?? interaction.externalId}
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 shadow-sm">
              {interaction.incomingMsg}
            </div>
          </div>
        </div>

        {/* Respuesta del bot */}
        {interaction.botResponse && (
          <div className="flex justify-end">
            <div className="max-w-[80%]">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <span className="text-xs text-gray-400">Bot</span>
                <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
                {interaction.botResponse}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      {interaction.transferred && !interaction.resolved && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Conversación pendiente de atención</p>
            <p className="text-xs text-amber-600 mt-0.5">
              El bot transfirió esta conversación a un asesor. Marcá como resuelto una vez que el cliente fue atendido.
            </p>
          </div>
          <button
            onClick={() => resolveMutation.mutate()}
            disabled={resolveMutation.isPending}
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-60"
          >
            {resolveMutation.isPending ? 'Guardando...' : 'Marcar resuelto'}
          </button>
        </div>
      )}
    </div>
  )
}
