'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { quotationsApi, type QuotationStatus } from '@/lib/api/quotations'
import { formatDate } from '@/lib/utils/formatters'

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

const TRANSITIONS: Partial<Record<QuotationStatus, QuotationStatus[]>> = {
  PENDING: ['IN_REVIEW', 'REJECTED'],
  IN_REVIEW: ['QUOTED', 'REJECTED'],
  QUOTED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['IN_PRODUCTION'],
  IN_PRODUCTION: ['READY'],
  READY: ['DELIVERED'],
}

const respondSchema = z.object({
  newStatus: z.string().min(1, 'Selecciona un nuevo estado'),
  proposedPrice: z.string().optional(),
  currency: z.string().default('MXN'),
  estimatedDelivery: z.string().optional(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  message: z.string().optional(),
})

type RespondForm = z.infer<typeof respondSchema>

export default function AdminCotizacionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [quickMessage, setQuickMessage] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-quotation', id],
    queryFn: () => quotationsApi.getById(id),
    enabled: !!id,
  })

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RespondForm>({
    resolver: zodResolver(respondSchema),
    defaultValues: { currency: 'MXN' },
  })

  const respond = useMutation({
    mutationFn: (values: RespondForm) =>
      quotationsApi.respond(id, {
        newStatus: values.newStatus as QuotationStatus,
        proposedPrice: values.proposedPrice ? parseFloat(values.proposedPrice) : undefined,
        currency: values.currency || 'MXN',
        estimatedDelivery: values.estimatedDelivery || undefined,
        adminNotes: values.adminNotes || undefined,
        rejectionReason: values.rejectionReason || undefined,
        message: values.message || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotation', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-quotations'] })
    },
  })

  const sendMessage = useMutation({
    mutationFn: (content: string) => quotationsApi.addMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotation', id] })
      setQuickMessage('')
    },
  })

  const q = data?.data
  const selectedStatus = watch('newStatus') as QuotationStatus | undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    )
  }
  if (!q) return null

  const availableTransitions = TRANSITIONS[q.status] ?? []
  const measurements = q.measurements ? (() => {
    try { return JSON.parse(q.measurements) as Record<string, string> }
    catch { return null }
  })() : null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/cotizaciones" className="p-2 rounded-xl hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{q.description}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[q.status]}`}>
              {STATUS_LABEL[q.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {q.customerName} · {q.customerEmail} · {formatDate(q.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: info + message thread */}
        <div className="space-y-4">

          {/* Measurements */}
          {measurements && (
            <div className="bg-white rounded-2xl border p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">Medidas del cliente</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(measurements).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {q.images.length > 0 && (
            <div className="bg-white rounded-2xl border p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">Imágenes de referencia</p>
              <div className="flex gap-3 flex-wrap">
                {q.images.map(img => (
                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt={img.altText ?? ''} className="w-20 h-20 object-cover rounded-xl border" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin notes (read-only) */}
          {q.adminNotes && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Notas internas</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{q.adminNotes}</p>
            </div>
          )}

          {/* Proposed price info */}
          {q.proposedPrice != null && (
            <div className="bg-brand-50 rounded-2xl border border-brand-200 p-5">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-2">Cotización enviada</p>
              <p className="text-2xl font-bold text-brand-700">
                ${q.proposedPrice.toLocaleString('es-MX')} {q.currency}
              </p>
              {q.estimatedDelivery && (
                <p className="text-xs text-brand-600 mt-1">
                  Entrega estimada: {formatDate(q.estimatedDelivery)}
                </p>
              )}
            </div>
          )}

          {/* Message thread */}
          <div className="bg-white rounded-2xl border p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">Hilo de mensajes</p>
            {q.messages.length === 0 ? (
              <p className="text-sm text-gray-400">Sin mensajes.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {q.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'STAFF' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.senderType === 'STAFF'
                        ? 'bg-brand-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className={`text-xs font-medium mb-1 ${msg.senderType === 'STAFF' ? 'text-brand-200' : 'text-gray-500'}`}>
                        {msg.senderType === 'STAFF' ? 'Staff' : msg.senderName}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === 'STAFF' ? 'text-brand-300' : 'text-gray-400'}`}>
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Quick reply */}
            <div className="flex gap-2 mt-4">
              <input
                value={quickMessage}
                onChange={e => setQuickMessage(e.target.value)}
                placeholder="Enviar mensaje rápido…"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && quickMessage.trim()) {
                    e.preventDefault()
                    sendMessage.mutate(quickMessage.trim())
                  }
                }}
              />
              <button
                type="button"
                disabled={!quickMessage.trim() || sendMessage.isPending}
                onClick={() => sendMessage.mutate(quickMessage.trim())}
                className="p-2.5 rounded-xl bg-brand-700 text-white hover:bg-brand-800 transition disabled:opacity-50"
              >
                {sendMessage.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: respond form */}
        <div>
          {availableTransitions.length > 0 ? (
            <form
              onSubmit={handleSubmit(values => respond.mutate(values))}
              className="bg-white rounded-2xl border p-5 space-y-4"
            >
              <p className="text-sm font-semibold text-gray-900">Responder / cambiar estado</p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nuevo estado *</label>
                <select
                  {...register('newStatus')}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">— Seleccionar —</option>
                  {availableTransitions.map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
                {errors.newStatus && <p className="mt-1 text-xs text-red-600">{errors.newStatus.message}</p>}
              </div>

              {selectedStatus === 'QUOTED' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Precio propuesto</label>
                    <div className="flex gap-2">
                      <input
                        {...register('proposedPrice')}
                        type="number" step="0.01" min="0"
                        placeholder="0.00"
                        className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <input
                        {...register('currency')}
                        placeholder="MXN"
                        className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Entrega estimada</label>
                    <input
                      {...register('estimatedDelivery')}
                      type="date"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </>
              )}

              {selectedStatus === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Motivo de rechazo</label>
                  <textarea
                    {...register('rejectionReason')}
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas internas</label>
                <textarea
                  {...register('adminNotes')}
                  rows={2}
                  placeholder="Visible solo para el equipo interno…"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mensaje al cliente</label>
                <textarea
                  {...register('message')}
                  rows={3}
                  placeholder="Se enviará como mensaje en el hilo…"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {respond.isError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                  No se pudo actualizar. Verifica el estado seleccionado.
                </p>
              )}
              {respond.isSuccess && (
                <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
                  Cotización actualizada correctamente.
                </p>
              )}

              <button
                type="submit"
                disabled={respond.isPending}
                className="w-full flex items-center justify-center gap-2 bg-brand-700 text-white font-semibold py-3 rounded-2xl hover:bg-brand-800 transition disabled:opacity-60"
              >
                {respond.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar cambios
              </button>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed p-8 text-center text-gray-400 text-sm">
              Esta cotización está en estado terminal ({STATUS_LABEL[q.status]}) y no admite más cambios.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
