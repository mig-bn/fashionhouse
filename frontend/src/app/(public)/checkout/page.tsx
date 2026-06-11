'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/lib/api/orders'
import { formatCurrency } from '@/lib/utils/formatters'

const schema = z.object({
  shipAddress: z.string().min(1, 'Dirección requerida'),
  shipCity: z.string().min(1, 'Ciudad requerida'),
  shipState: z.string().min(1, 'Estado / Departamento requerido'),
  shipPostal: z.string().min(1, 'Código postal requerido'),
  shipCountry: z.string().default('MX'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'OTHER']),
})
type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { shipCountry: 'MX', paymentMethod: 'CREDIT_CARD' },
  })

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-600">Debes iniciar sesión para continuar con el checkout.</p>
        <Link href="/login?redirect=/checkout"
          className="mt-4 inline-block bg-brand-700 text-white px-6 py-2.5 rounded-full font-medium">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-600">Tu carrito está vacío.</p>
        <Link href="/catalogo" className="mt-4 inline-block text-brand-700 font-medium">Ver catálogo →</Link>
      </div>
    )
  }

  const onSubmit = async (formData: FormData) => {
    setError('')
    try {
      const orderRes = await ordersApi.create({
        items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
        shipAddress: formData.shipAddress,
        shipCity: formData.shipCity,
        shipState: formData.shipState,
        shipPostal: formData.shipPostal,
        shipCountry: formData.shipCountry,
      })

      if (!orderRes.success || !orderRes.data) throw new Error('Error al crear orden')

      const orderId = orderRes.data.id

      if (formData.paymentMethod !== 'CASH') {
        const prefRes = await ordersApi.createPaymentPreference(orderId, formData.paymentMethod)
        if (prefRes.success && prefRes.data) {
          clearCart()
          window.location.href = prefRes.data.sandboxInitPoint || prefRes.data.initPoint
          return
        }
      }

      clearCart()
      router.push(`/orden/${orderId}`)
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Error al procesar el pedido')
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-3 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <section className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Dirección de envío</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input {...register('shipAddress')} className={inputClass} />
              {errors.shipAddress && <p className="mt-1 text-xs text-red-600">{errors.shipAddress.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input {...register('shipCity')} className={inputClass} />
                {errors.shipCity && <p className="mt-1 text-xs text-red-600">{errors.shipCity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado / Dpto.</label>
                <input {...register('shipState')} className={inputClass} />
                {errors.shipState && <p className="mt-1 text-xs text-red-600">{errors.shipState.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
                <input {...register('shipPostal')} className={inputClass} />
                {errors.shipPostal && <p className="mt-1 text-xs text-red-600">{errors.shipPostal.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <input {...register('shipCountry')} className={inputClass} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Método de pago</h2>
            {[
              { value: 'CREDIT_CARD', label: 'Tarjeta de crédito' },
              { value: 'DEBIT_CARD', label: 'Tarjeta de débito' },
              { value: 'BANK_TRANSFER', label: 'Transferencia bancaria / PSE' },
              { value: 'CASH', label: 'Efectivo (pago en tienda)' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" value={opt.value} {...register('paymentMethod')}
                  className="accent-brand-600" />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </section>

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white font-medium py-3 rounded-xl transition disabled:opacity-60">
            {isSubmitting ? 'Procesando…' : 'Confirmar pedido'}
          </button>
        </form>

        {/* Resumen */}
        <aside className="md:col-span-2">
          <div className="bg-white rounded-2xl border p-6 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Resumen del pedido</h2>
            <div className="space-y-3 text-sm">
              {items.map(item => (
                <div key={item.variantId} className="flex justify-between gap-2">
                  <span className="text-gray-600 line-clamp-1">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900 flex-shrink-0">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span className="text-brand-700">{formatCurrency(subtotal())}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
