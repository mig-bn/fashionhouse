'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, ImagePlus, Loader2, ArrowLeft } from 'lucide-react'
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

export default function CotizacionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationsApi.getById(id),
    enabled: !!id,
  })

  const sendMessage = useMutation({
    mutationFn: (content: string) => quotationsApi.addMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
      setMessage('')
    },
  })

  const uploadImage = useMutation({
    mutationFn: (file: File) => quotationsApi.uploadImage(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotation', id] }),
  })

  const q = data?.data

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    )
  }

  if (!q) return null

  const measurements = q.measurements ? (() => {
    try { return JSON.parse(q.measurements) as Record<string, string> }
    catch { return null }
  })() : null

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mis-cotizaciones" className="p-2 rounded-xl hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 truncate">{q.description}</h1>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[q.status]}`}>
              {STATUS_LABEL[q.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Solicitud {q.id.split('-')[0]}… · {formatDate(q.createdAt)}</p>
        </div>
      </div>

      {/* Proposed price */}
      {q.proposedPrice != null && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-brand-900">Precio propuesto</p>
          <p className="text-2xl font-bold text-brand-700 mt-1">
            ${q.proposedPrice.toLocaleString('es-MX')} {q.currency}
          </p>
          {q.estimatedDelivery && (
            <p className="text-xs text-brand-600 mt-1">
              Entrega estimada: {formatDate(q.estimatedDelivery)}
            </p>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {q.status === 'REJECTED' && q.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-800">Motivo de rechazo</p>
          <p className="text-sm text-red-700 mt-1">{q.rejectionReason}</p>
        </div>
      )}

      {/* Measurements */}
      {measurements && Object.keys(measurements).length > 0 && (
        <div className="bg-white rounded-2xl border p-5 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">Medidas registradas</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(measurements).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500 capitalize">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {q.images.length > 0 && (
        <div className="bg-white rounded-2xl border p-5 mb-6">
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

      {/* Message thread */}
      <div className="bg-white rounded-2xl border p-5 mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-4">Mensajes</p>
        {q.messages.length === 0 ? (
          <p className="text-sm text-gray-400">Aún no hay mensajes.</p>
        ) : (
          <div className="space-y-4">
            {q.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.senderType === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.senderType === 'CUSTOMER'
                    ? 'bg-brand-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${msg.senderType === 'CUSTOMER' ? 'text-brand-200' : 'text-gray-500'}`}>
                    {msg.senderType === 'CUSTOMER' ? 'Tú' : msg.senderName}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1.5 ${msg.senderType === 'CUSTOMER' ? 'text-brand-300' : 'text-gray-400'}`}>
                    {formatDate(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply box */}
      {!['DELIVERED', 'REJECTED'].includes(q.status) && (
        <div className="bg-white rounded-2xl border p-4 flex gap-3 items-end">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <div className="flex gap-2 shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) uploadImage.mutate(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2.5 rounded-xl border hover:bg-gray-50 transition"
              title="Subir imagen"
            >
              {uploadImage.isPending
                ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                : <ImagePlus className="w-4 h-4 text-gray-500" />}
            </button>
            <button
              type="button"
              disabled={!message.trim() || sendMessage.isPending}
              onClick={() => sendMessage.mutate(message.trim())}
              className="p-2.5 rounded-xl bg-brand-700 text-white hover:bg-brand-800 transition disabled:opacity-50"
            >
              {sendMessage.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
