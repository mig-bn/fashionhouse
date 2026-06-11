'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/lib/api/orders'
import Link from 'next/link'
import { ChevronLeft, Loader2, AlertCircle, CheckCircle2, Circle } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'Procesando',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

function nextStatuses(current: string): string[] {
  const idx = STATUSES.indexOf(current)
  if (idx < 0 || current === 'CANCELLED') return []
  const nexts: string[] = []
  if (idx < STATUSES.length - 1) nexts.push(STATUSES[idx + 1])
  if (current !== 'DELIVERED') nexts.push('CANCELLED')
  return nexts
}

export default function AdminOrdenDetallePage({ params }: Props) {
  const { id } = use(params)
  const qc = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState('')
  const [updateOk, setUpdateOk] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => ordersApi.getById(id),
  })
  const order = data?.data

  const updateMut = useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order', id] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      setSelectedStatus('')
      setUpdateOk(true)
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando…
    </div>
  )
  if (error || !order) return (
    <div className="flex items-center gap-2 text-red-600 p-6">
      <AlertCircle className="w-5 h-5" /> Orden no encontrada
    </div>
  )

  const stepIdx = STATUSES.indexOf(order.status)
  const nexts = nextStatuses(order.status)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/ordenes" className="text-gray-400 hover:text-gray-700 transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Orden <span className="font-mono text-lg">#{order.id.slice(0, 8)}</span>
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('es-MX', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {updateOk && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" /> Estado actualizado correctamente
        </div>
      )}

      <div className="space-y-5">
        {/* ── Stepper ── */}
        {order.status !== 'CANCELLED' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Progreso del pedido</h2>
            <div className="flex items-center">
              {STATUSES.map((s, i) => {
                const done = i <= stepIdx
                const isLast = i === STATUSES.length - 1
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      {done
                        ? <CheckCircle2 className="w-5 h-5 text-brand-600" />
                        : <Circle className="w-5 h-5 text-gray-300" />}
                      <span className={`text-[10px] mt-1 text-center ${done ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
                        {STATUS_LABELS[s]}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < stepIdx ? 'bg-brand-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Items ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Productos</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-gray-600 text-xs">Producto</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Variante</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs">Precio</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs">Qty</th>
                <th className="text-right px-5 py-2.5 font-medium text-gray-600 text-xs">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.items.map(item => (
                <tr key={item.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{item.productName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <span className="font-mono">{item.variantSku}</span>
                    {' · '}{item.size} / {item.color}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {order.currency} {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {order.currency} {item.lineTotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{order.currency} {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento</span>
                <span>− {order.currency} {order.discount.toLocaleString()}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Impuestos</span>
                <span>{order.currency} {order.tax.toLocaleString()}</span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Envío</span>
                <span>{order.currency} {order.shippingCost.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{order.currency} {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Shipping + Payment ── */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Dirección de envío</h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>{order.shipAddress}</p>
              <p>{order.shipCity}, {order.shipState} {order.shipPostal}</p>
              <p>{order.shipCountry}</p>
              {order.notes && <p className="text-xs text-gray-400 mt-2 italic">"{order.notes}"</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Pagos</h2>
            {order.payments.length === 0 ? (
              <p className="text-sm text-gray-400">Sin pagos registrados</p>
            ) : order.payments.map(p => (
              <div key={p.id} className="text-sm text-gray-600 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">{p.method}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{p.status}</span>
                </div>
                <p className="font-medium">{p.currency} {p.amount.toLocaleString()}</p>
                {p.paidAt && <p className="text-xs text-gray-400">{new Date(p.paidAt).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Update status ── */}
        {nexts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Actualizar estado</h2>
            <div className="flex items-center gap-3">
              <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setUpdateOk(false) }}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar nuevo estado…</option>
                {nexts.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button
                onClick={() => selectedStatus && updateMut.mutate(selectedStatus)}
                disabled={!selectedStatus || updateMut.isPending}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {updateMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Actualizar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
