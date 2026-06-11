'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Star, MessageCircle, ShoppingBag, Scissors,
  StickyNote, Tag, Send, Loader2, X, Phone,
} from 'lucide-react'
import { customersApi } from '@/lib/api/customers'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'En proceso',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
}

const QUOTATION_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador', PENDING: 'Pendiente', IN_REVIEW: 'En revisión',
  QUOTED: 'Cotizado', ACCEPTED: 'Aceptado', IN_PRODUCTION: 'En producción',
  READY: 'Listo', DELIVERED: 'Entregado', REJECTED: 'Rechazado',
}

export default function AdminClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [newTag, setNewTag] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => customersApi.getById(id),
    enabled: !!id,
  })

  const toggleTrusted = useMutation({
    mutationFn: () => customersApi.toggleTrusted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
    },
  })

  const addNote = useMutation({
    mutationFn: (content: string) => customersApi.addNote(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer', id] })
      setNote('')
    },
  })

  const updateTags = useMutation({
    mutationFn: (tags: string[]) => customersApi.updateTags(id, tags),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-customer', id] }),
  })

  const c = data?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    )
  }
  if (!c) return null

  const handleAddTag = () => {
    const tag = newTag.trim()
    if (!tag) return
    const current = c.internalTags ?? []
    if (!current.includes(tag)) {
      updateTags.mutate([...current, tag])
    }
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    const current = c.internalTags ?? []
    updateTags.mutate(current.filter(t => t !== tag))
  }

  const whatsapp = c.whatsappPhone ?? c.phone
  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(c.firstName)}%2C%20te%20contactamos%20desde%20Fashion%20House.`
    : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/clientes" className="p-2 rounded-xl hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              {c.firstName} {c.lastName}
            </h1>
            {c.trustedClient && (
              <span className="flex items-center gap-1 bg-brand-700 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                <Star className="w-3 h-3" /> VIP
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{c.email} · Cliente desde {formatDate(c.createdAt)}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          <button
            onClick={() => toggleTrusted.mutate()}
            disabled={toggleTrusted.isPending}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition ${
              c.trustedClient
                ? 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Star className={`w-4 h-4 ${c.trustedClient ? 'fill-brand-600' : ''}`} />
            {c.trustedClient ? 'Quitar VIP' : 'Marcar VIP'}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Órdenes', value: c.orderCount, icon: ShoppingBag },
          { label: 'Cotizaciones', value: c.quotationCount, icon: Scissors },
          { label: 'LTV total', value: formatCurrency(c.lifetimeValue), icon: null },
          { label: 'Puntos', value: c.loyaltyPoints, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: contact info + tags */}
        <div className="space-y-4">

          {/* Contact info */}
          <div className="bg-white rounded-2xl border p-5 space-y-2">
            <p className="text-sm font-semibold text-gray-900 mb-3">Información de contacto</p>
            {[
              { label: 'Teléfono', value: c.phone },
              { label: 'WhatsApp', value: c.whatsappPhone },
              { label: 'Dirección', value: c.addressLine },
              { label: 'Ciudad', value: c.city },
              { label: 'Estado', value: c.state },
              { label: 'C.P.', value: c.postalCode },
              { label: 'País', value: c.country },
            ].map(({ label, value }) => value ? (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800 text-right">{value}</span>
              </div>
            ) : null)}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Etiquetas internas
            </p>
            <div className="flex gap-2 flex-wrap mb-3">
              {(c.internalTags ?? []).length === 0 ? (
                <p className="text-xs text-gray-400">Sin etiquetas.</p>
              ) : (
                (c.internalTags ?? []).map(tag => (
                  <span key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                placeholder="Nueva etiqueta…"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={handleAddTag}
                className="p-2 rounded-xl bg-brand-700 text-white hover:bg-brand-800 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Center + Right: orders, quotations, notes */}
        <div className="lg:col-span-2 space-y-4">

          {/* Recent orders */}
          <div className="bg-white rounded-2xl border p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Órdenes recientes
            </p>
            {c.recentOrders.length === 0 ? (
              <p className="text-xs text-gray-400">Sin órdenes.</p>
            ) : (
              <div className="space-y-2">
                {c.recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-gray-400">{o.id.split('-')[0]}…</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                      o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-brand-100 text-brand-700'
                    }`}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(o.total)}</span>
                    <span className="text-xs text-gray-400">{formatDate(o.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent quotations */}
          <div className="bg-white rounded-2xl border p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Scissors className="w-4 h-4" /> Cotizaciones recientes
            </p>
            {c.recentQuotations.length === 0 ? (
              <p className="text-xs text-gray-400">Sin cotizaciones.</p>
            ) : (
              <div className="space-y-2">
                {c.recentQuotations.map(q => (
                  <Link
                    key={q.id}
                    href={`/admin/cotizaciones/${q.id}`}
                    className="flex items-center justify-between text-sm hover:bg-gray-50 rounded-xl px-2 py-1 transition"
                  >
                    <span className="text-gray-700 truncate max-w-[200px]">{q.description}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {QUOTATION_STATUS_LABEL[q.status] ?? q.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(q.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Notas internas
            </p>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {c.notes.length === 0 ? (
                <p className="text-xs text-gray-400">Sin notas aún.</p>
              ) : (
                c.notes.map(n => (
                  <div key={n.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-xs text-yellow-700 font-medium mb-1">{n.authorEmail} · {formatDate(n.createdAt)}</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="Agregar nota interna…"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              <button
                disabled={!note.trim() || addNote.isPending}
                onClick={() => addNote.mutate(note.trim())}
                className="p-2.5 rounded-xl bg-brand-700 text-white hover:bg-brand-800 transition disabled:opacity-50 self-end"
              >
                {addNote.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
