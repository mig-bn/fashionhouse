'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productsApi, CreateProductRequest, CreateVariantRequest } from '@/lib/api/products'
import type { Category } from '@/types/product'
import Link from 'next/link'
import { Plus, Trash2, ChevronLeft, Loader2, AlertCircle } from 'lucide-react'

function toSlug(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

interface VariantRow {
  key: string; sku: string; size: string; color: string
  priceOverride: string; stockQuantity: string
}

function newRow(): VariantRow {
  return { key: crypto.randomUUID(), sku: '', size: '', color: '', priceOverride: '', stockQuantity: '0' }
}

export default function NuevoProductoPage() {
  const router = useRouter()

  // ── Product fields ─────────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [currency, setCurrency] = useState('MXN')
  const [isFeatured, setIsFeatured] = useState(false)

  // ── Variants ───────────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<VariantRow[]>([newRow()])

  // ── UI state ───────────────────────────────────────────────────────────────
  const [serverErr, setServerErr] = useState('')
  const [step, setStep] = useState<'form' | 'images'>('form')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const { data: catData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => productsApi.getAllCategories(),
  })
  const categories: Category[] = catData?.data ?? []

  // Flatten categories for select
  function flatCats(cats: Category[], depth = 0): { id: string; label: string }[] {
    const result: { id: string; label: string }[] = []
    for (const c of cats) {
      result.push({ id: c.id, label: '—'.repeat(depth) + ' ' + c.name })
      if (c.children?.length) result.push(...flatCats(c.children, depth + 1))
    }
    return result
  }
  const flatCategories = flatCats(categories)

  const createMut = useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      const res = await productsApi.create(data)
      if (!res.success || !res.data) throw new Error('No se pudo crear el producto')
      const productId = res.data.id
      // add variants sequentially
      for (const v of variants) {
        const variantBody: CreateVariantRequest = {
          sku: v.sku.trim(),
          size: v.size.trim(),
          color: v.color.trim(),
          priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
          stockQuantity: Number(v.stockQuantity) || 0,
        }
        await productsApi.addVariant(productId, variantBody)
      }
      return productId
    },
    onSuccess: (productId) => {
      setCreatedId(productId)
      setStep('images')
      setServerErr('')
    },
    onError: (e: any) => setServerErr(e?.response?.data?.error?.message ?? e.message ?? 'Error al crear'),
  })

  function handleNameChange(val: string) {
    setName(val)
    setSlug(toSlug(val))
  }

  function setVariantField(key: string, field: keyof VariantRow, value: string) {
    setVariants(prev => prev.map(v => v.key === key ? { ...v, [field]: value } : v))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerErr('')
    if (!categoryId) { setServerErr('Selecciona una categoría'); return }
    if (variants.some(v => !v.sku.trim() || !v.size.trim() || !v.color.trim())) {
      setServerErr('Completa SKU, talla y color en todas las variantes')
      return
    }
    createMut.mutate({
      name: name.trim(), slug: slug.trim(), description: description.trim(),
      categoryId, basePrice: Number(basePrice), currency, isFeatured,
    })
  }

  async function handleUploadAndFinish() {
    if (!createdId) return
    setUploadProgress('Subiendo imágenes…')
    for (const file of images) {
      try { await productsApi.uploadImage(createdId, file) } catch { /* ignore individual failures */ }
    }
    router.push('/admin/productos')
  }

  // ── Step 2: Images ─────────────────────────────────────────────────────────
  if (step === 'images') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Imágenes del producto</h1>
        <p className="text-sm text-gray-500 mb-6">Producto creado con éxito. Opcionalmente agrega imágenes.</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2 block">Seleccionar imágenes</span>
            <input type="file" accept="image/*" multiple
              onChange={e => setImages(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-50 file:text-brand-700 file:font-medium hover:file:bg-brand-100 transition" />
          </label>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {uploadProgress && <p className="text-sm text-gray-500">{uploadProgress}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push('/admin/productos')}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Omitir imágenes
            </button>
            <button onClick={handleUploadAndFinish}
              className="flex-1 bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
              {images.length > 0 ? `Subir ${images.length} imagen(es) y finalizar` : 'Finalizar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 1: Form ───────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/productos" className="text-gray-400 hover:text-gray-700 transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo producto</h1>
      </div>

      {serverErr && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {serverErr}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Datos básicos ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-base">Datos básicos</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input value={name} onChange={e => handleNameChange(e.target.value)} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={3} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar…</option>
                {flatCategories.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option>MXN</option><option>USD</option><option>COP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio base *</label>
              <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)}
                required min={0} step={0.01}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                <span className="text-sm font-medium text-gray-700">Producto destacado</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Variantes ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-base">Variantes</h2>
            <button type="button" onClick={() => setVariants(v => [...v, newRow()])}
              className="flex items-center gap-1.5 text-sm text-brand-700 border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition">
              <Plus className="w-3.5 h-3.5" /> Agregar variante
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-2 font-medium">SKU *</th>
                  <th className="pb-2 pr-2 font-medium">Talla *</th>
                  <th className="pb-2 pr-2 font-medium">Color *</th>
                  <th className="pb-2 pr-2 font-medium">Precio override</th>
                  <th className="pb-2 pr-2 font-medium">Stock *</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {variants.map(v => (
                  <tr key={v.key}>
                    <td className="py-2 pr-2">
                      <input value={v.sku} onChange={e => setVariantField(v.key, 'sku', e.target.value)}
                        placeholder="SKU-001" required
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={v.size} onChange={e => setVariantField(v.key, 'size', e.target.value)}
                        placeholder="M" required
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={v.color} onChange={e => setVariantField(v.key, 'color', e.target.value)}
                        placeholder="Negro" required
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={v.priceOverride}
                        onChange={e => setVariantField(v.key, 'priceOverride', e.target.value)}
                        placeholder="—" min={0} step={0.01}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={v.stockQuantity}
                        onChange={e => setVariantField(v.key, 'stockQuantity', e.target.value)}
                        min={0} required
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </td>
                    <td className="py-2">
                      <button type="button"
                        onClick={() => setVariants(prev => prev.length > 1 ? prev.filter(x => x.key !== v.key) : prev)}
                        disabled={variants.length === 1}
                        className="text-gray-300 hover:text-red-500 transition disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <Link href="/admin/productos"
            className="flex-1 text-center border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancelar
          </Link>
          <button type="submit" disabled={createMut.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60">
            {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear producto y continuar
          </button>
        </div>
      </form>
    </div>
  )
}
