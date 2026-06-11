'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, CreateVariantRequest } from '@/lib/api/products'
import type { Category } from '@/types/product'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft, Plus, Trash2, Upload, Loader2, AlertCircle, Package, Star,
} from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

function toSlug(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

interface VariantRow {
  key: string; sku: string; size: string; color: string
  priceOverride: string; stockQuantity: string; existing?: boolean; id?: string
}

export default function EditProductoPage({ params }: Props) {
  const { id } = use(params)
  const qc = useQueryClient()

  const { data: prodData, isLoading, error } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => productsApi.getById(id),
  })
  const { data: catData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => productsApi.getAllCategories(),
  })

  const product = prodData?.data
  const categories: Category[] = catData?.data ?? []

  // Flatten categories for select
  function flatCats(cats: Category[], depth = 0): { id: string; label: string }[] {
    const r: { id: string; label: string }[] = []
    for (const c of cats) {
      r.push({ id: c.id, label: '—'.repeat(depth) + ' ' + c.name })
      if (c.children?.length) r.push(...flatCats(c.children, depth + 1))
    }
    return r
  }
  const flatCategories = flatCats(categories)

  // ── Local state (populated from product) ───────────────────────────────────
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [currency, setCurrency] = useState('MXN')
  const [isFeatured, setIsFeatured] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [serverErr, setServerErr] = useState('')
  const [saveOk, setSaveOk] = useState(false)

  // Init form once product loads
  if (product && !initialized) {
    setName(product.name)
    setSlug(product.slug)
    setDescription(product.description ?? '')
    setCategoryId(product.category?.id ?? '')
    setBasePrice(String(product.basePrice))
    setCurrency(product.currency)
    setIsFeatured(product.isFeatured)
    setVariants((product.variants ?? []).map(v => ({
      key: v.id, id: v.id, sku: v.sku, size: v.size, color: v.color,
      priceOverride: v.priceOverride ? String(v.priceOverride) : '',
      stockQuantity: String(v.stockQuantity),
      existing: true,
    })))
    setInitialized(true)
  }

  const updateMut = useMutation({
    mutationFn: () => productsApi.update(id, {
      name, slug, description, categoryId,
      basePrice: Number(basePrice), currency, isFeatured,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-product', id] }); setSaveOk(true) },
    onError: (e: any) => setServerErr(e?.response?.data?.error?.message ?? 'Error al guardar'),
  })

  const addVariantMut = useMutation({
    mutationFn: (v: VariantRow) => {
      const body: CreateVariantRequest = {
        sku: v.sku, size: v.size, color: v.color,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
        stockQuantity: Number(v.stockQuantity),
      }
      return productsApi.addVariant(id, body)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-product', id] }),
    onError: (e: any) => setServerErr(e?.response?.data?.error?.message ?? 'Error al agregar variante'),
  })

  const delVariantMut = useMutation({
    mutationFn: (variantId: string) => productsApi.deleteVariant(id, variantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-product', id] }),
  })

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      for (const f of files) await productsApi.uploadImage(id, f)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-product', id] })
      setNewImages([])
    },
    onError: (e: any) => setServerErr(e?.response?.data?.error?.message ?? 'Error al subir imágenes'),
  })

  const delImageMut = useMutation({
    mutationFn: (imageId: string) => productsApi.deleteImage(id, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-product', id] }),
  })

  const toggleMut = useMutation({
    mutationFn: () => productsApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-product', id] }),
  })

  function setVariantField(key: string, field: keyof VariantRow, value: string) {
    setVariants(prev => prev.map(v => v.key === key ? { ...v, [field]: value } : v))
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando…
    </div>
  )
  if (error || !product) return (
    <div className="flex items-center gap-2 text-red-600 p-6">
      <AlertCircle className="w-5 h-5" /> Producto no encontrado
    </div>
  )

  const images = product.images ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/productos" className="text-gray-400 hover:text-gray-700 transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{product.name}</h1>
          <p className="text-sm text-gray-500">ID: {id.slice(0, 8)}…</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {product.isActive ? 'Activo' : 'Inactivo'}
        </span>
        <button onClick={() => toggleMut.mutate()} disabled={toggleMut.isPending}
          className="text-sm border border-gray-300 text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition">
          {product.isActive ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      {serverErr && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {serverErr}
        </div>
      )}
      {saveOk && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          Producto guardado correctamente
        </div>
      )}

      <div className="space-y-6">
        {/* ── Datos básicos ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Datos básicos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input value={name} onChange={e => { setName(e.target.value); setSaveOk(false) }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input value={slug} onChange={e => { setSlug(e.target.value); setSaveOk(false) }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={description} onChange={e => { setDescription(e.target.value); setSaveOk(false) }}
                rows={3} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSaveOk(false) }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar…</option>
                {flatCategories.map(({ id: cid, label }) => (
                  <option key={cid} value={cid}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select value={currency} onChange={e => { setCurrency(e.target.value); setSaveOk(false) }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option>MXN</option><option>USD</option><option>COP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio base</label>
              <input type="number" value={basePrice} onChange={e => { setBasePrice(e.target.value); setSaveOk(false) }}
                min={0} step={0.01}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={isFeatured} onChange={e => { setIsFeatured(e.target.checked); setSaveOk(false) }}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                <span className="text-sm font-medium text-gray-700">Destacado</span>
                <Star className="w-3.5 h-3.5 text-yellow-400" />
              </label>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => { setSaveOk(false); updateMut.mutate() }} disabled={updateMut.isPending}
              className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60">
              {updateMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </div>

        {/* ── Variantes ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Variantes</h2>
            <button
              onClick={() => setVariants(prev => [...prev, {
                key: crypto.randomUUID(), sku: '', size: '', color: '',
                priceOverride: '', stockQuantity: '0', existing: false,
              }])}
              className="flex items-center gap-1.5 text-sm text-brand-700 border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-2 font-medium">SKU</th>
                  <th className="pb-2 pr-2 font-medium">Talla</th>
                  <th className="pb-2 pr-2 font-medium">Color</th>
                  <th className="pb-2 pr-2 font-medium">P. override</th>
                  <th className="pb-2 pr-2 font-medium">Stock</th>
                  <th className="pb-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {variants.map(v => (
                  <tr key={v.key}>
                    <td className="py-2 pr-2">
                      <input value={v.sku} onChange={e => setVariantField(v.key, 'sku', e.target.value)}
                        readOnly={v.existing}
                        className={`w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 ${v.existing ? 'bg-gray-50' : ''}`} />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={v.size} onChange={e => setVariantField(v.key, 'size', e.target.value)}
                        readOnly={v.existing}
                        className={`w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 ${v.existing ? 'bg-gray-50' : ''}`} />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={v.color} onChange={e => setVariantField(v.key, 'color', e.target.value)}
                        readOnly={v.existing}
                        className={`w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 ${v.existing ? 'bg-gray-50' : ''}`} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={v.priceOverride}
                        onChange={e => setVariantField(v.key, 'priceOverride', e.target.value)}
                        min={0} step={0.01} placeholder="—"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={v.stockQuantity}
                        onChange={e => setVariantField(v.key, 'stockQuantity', e.target.value)}
                        min={0}
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </td>
                    <td className="py-2">
                      {v.existing ? (
                        <button onClick={() => v.id && delVariantMut.mutate(v.id)}
                          disabled={delVariantMut.isPending}
                          className="text-gray-300 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => addVariantMut.mutate(v)} disabled={addVariantMut.isPending}
                            className="text-xs bg-brand-700 text-white px-2 py-1 rounded-lg hover:bg-brand-800 transition disabled:opacity-60">
                            {addVariantMut.isPending ? '…' : 'Guardar'}
                          </button>
                          <button onClick={() => setVariants(prev => prev.filter(x => x.key !== v.key))}
                            className="text-gray-300 hover:text-red-500 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Imágenes ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Imágenes</h2>

          {/* Existing images */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {images.map(img => (
                <div key={img.id} className="relative group w-20 h-20">
                  <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                    <Image src={img.url} alt={img.altText ?? ''} width={80} height={80}
                      className="w-full h-full object-cover" />
                  </div>
                  {img.isPrimary && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <button onClick={() => delImageMut.mutate(img.id)}
                    className="absolute inset-0 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 mb-4">
              <Package className="w-6 h-6 mb-1" />
              <span className="text-xs">Sin imágenes</span>
            </div>
          )}

          {/* Upload new */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
              <Upload className="w-4 h-4" />
              Subir imágenes
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => setNewImages(Array.from(e.target.files ?? []))} />
            </label>
            {newImages.length > 0 && (
              <button onClick={() => uploadMut.mutate(newImages)} disabled={uploadMut.isPending}
                className="flex items-center gap-1.5 bg-brand-700 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand-800 transition disabled:opacity-60">
                {uploadMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Subir {newImages.length} archivo(s)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
