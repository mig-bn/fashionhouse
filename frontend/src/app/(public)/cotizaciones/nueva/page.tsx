'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ruler, Send, Loader2 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { quotationsApi } from '@/lib/api/quotations'

const schema = z.object({
  description: z.string().min(20, 'Describe el diseño con al menos 20 caracteres'),
  bust: z.string().optional(),
  waist: z.string().optional(),
  hip: z.string().optional(),
  height: z.string().optional(),
  size: z.string().optional(),
  initialMessage: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const MEASUREMENT_FIELDS = [
  { key: 'bust', label: 'Busto (cm)' },
  { key: 'waist', label: 'Cintura (cm)' },
  { key: 'hip', label: 'Cadera (cm)' },
  { key: 'height', label: 'Altura (cm)' },
  { key: 'size', label: 'Talla (XS/S/M/L/XL)' },
] as const

export default function NuevaCotizacionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      const measurements: Record<string, string> = {}
      MEASUREMENT_FIELDS.forEach(({ key }) => {
        if (values[key]) measurements[key] = values[key]!
      })

      const res = await quotationsApi.create({
        description: values.description,
        measurements: Object.keys(measurements).length > 0
          ? JSON.stringify(measurements)
          : undefined,
        initialMessage: values.initialMessage || undefined,
      })

      router.push(`/mis-cotizaciones/${res.data.id}`)
    } catch {
      setError('No pudimos enviar tu solicitud. Asegúrate de haber iniciado sesión.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="p-2 bg-brand-100 rounded-xl">
            <Ruler className="w-6 h-6 text-brand-700" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitar cotización a la medida</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Cuéntanos el diseño que tienes en mente y nuestro equipo te responderá con precio y fecha.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Descripción */}
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Descripción del diseño</h2>
            <div>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Describe la prenda: estilo, tela, color, ocasión, referencias de imagen…"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Medidas */}
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Tus medidas (opcional)</h2>
            <p className="text-sm text-gray-500">
              Proporcionar medidas nos ayuda a darte un presupuesto más preciso.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {MEASUREMENT_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    {...register(key)}
                    type="text"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mensaje inicial */}
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Mensaje adicional (opcional)</h2>
            <textarea
              {...register('initialMessage')}
              rows={3}
              placeholder="¿Tienes preguntas específicas o algo que agregar?"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-brand-700 text-white font-semibold py-3.5 rounded-2xl hover:bg-brand-800 transition disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar solicitud
          </button>
        </form>
      </div>
    </div>
  )
}
