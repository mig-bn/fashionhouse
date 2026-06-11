'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, CreateCategoryRequest } from '@/lib/api/products'
import type { Category } from '@/types/product'
import { Plus, ToggleLeft, ToggleRight, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────────
function toSlug(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

function flattenCategories(cats: Category[], depth = 0): { cat: Category; depth: number }[] {
  const result: { cat: Category; depth: number }[] = []
  for (const cat of cats) {
    result.push({ cat, depth })
    if (cat.children?.length) result.push(...flattenCategories(cat.children, depth + 1))
  }
  return result
}

// ── form ───────────────────────────────────────────────────────────────────────
interface FormState {
  name: string; slug: string; description: string
  parentId: string; sortOrder: string
}

const EMPTY: FormState = { name: '', slug: '', description: '', parentId: '', sortOrder: '0' }

export default function AdminCategoriasPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [serverErr, setServerErr] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => productsApi.getAllCategories(),
  })

  const categories: Category[] = data?.data ?? []
  const flat = flattenCategories(categories)

  const createMut = useMutation({
    mutationFn: (body: CreateCategoryRequest) => productsApi.createCategory(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); closePanel() },
    onError: (e: any) => setServerErr(e?.response?.data?.error?.message ?? 'Error al guardar'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateCategoryRequest> }) =>
      productsApi.updateCategory(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); closePanel() },
    onError: (e: any) => setServerErr(e?.response?.data?.error?.message ?? 'Error al guardar'),
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => productsApi.toggleCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  })

  function openNew() {
    setEditing(null); setForm(EMPTY); setServerErr(''); setPanelOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat.id)
    setForm({
      name: cat.name, slug: cat.slug,
      description: cat.description ?? '',
      parentId: cat.parentId ?? '',
      sortOrder: String(cat.sortOrder ?? 0),
    })
    setServerErr(''); setPanelOpen(true)
  }

  function closePanel() { setPanelOpen(false); setEditing(null); setForm(EMPTY) }

  function handleField(field: keyof FormState, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && !editing) next.slug = toSlug(value)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerErr('')
    const body: CreateCategoryRequest = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      parentId: form.parentId || null,
      sortOrder: Number(form.sortOrder) || 0,
    }
    if (editing) updateMut.mutate({ id: editing, body })
    else createMut.mutate(body)
  }

  const isSaving = createMut.isPending || updateMut.isPending

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando…
    </div>
  )
  if (error) return (
    <div className="flex items-center gap-2 text-red-600 p-6">
      <AlertCircle className="w-5 h-5" /> Error al cargar categorías
    </div>
  )

  return (
    <div className="flex gap-6 p-6">
      {/* ── Main table ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
            <p className="text-sm text-gray-500 mt-0.5">{flat.length} categorías en total</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Nueva categoría
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Orden</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flat.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No hay categorías. Crea la primera.
                  </td>
                </tr>
              ) : flat.map(({ cat, depth }) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 20}px` }}>
                      {depth > 0 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                      <span className={`font-medium ${depth === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)}
                        className="text-xs text-brand-700 hover:underline font-medium">
                        Editar
                      </button>
                      <button onClick={() => toggleMut.mutate(cat.id)}
                        disabled={toggleMut.isPending}
                        className="text-gray-400 hover:text-gray-700 transition"
                        title={cat.isActive ? 'Desactivar' : 'Activar'}>
                        {cat.isActive
                          ? <ToggleRight className="w-5 h-5 text-green-500" />
                          : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Side panel ── */}
      {panelOpen && (
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                {editing ? 'Editar categoría' : 'Nueva categoría'}
              </h2>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {serverErr && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                {serverErr}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.name} onChange={e => handleField('name', e.target.value)}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Slug *</label>
                <input value={form.slug} onChange={e => handleField('slug', e.target.value)}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => handleField('description', e.target.value)}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoría padre</label>
                <select value={form.parentId} onChange={e => handleField('parentId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">— Sin padre (raíz) —</option>
                  {flat.filter(({ cat }) => cat.id !== editing).map(({ cat, depth }) => (
                    <option key={cat.id} value={cat.id}>
                      {'—'.repeat(depth)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Orden</label>
                <input type="number" value={form.sortOrder} onChange={e => handleField('sortOrder', e.target.value)}
                  min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closePanel}
                  className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 bg-brand-700 hover:bg-brand-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-1">
                  {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
