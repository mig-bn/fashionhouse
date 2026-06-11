'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/lib/api/products'
import type { Category } from '@/types/product'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus, Search, ToggleLeft, ToggleRight,
  Loader2, AlertCircle, Package,
} from 'lucide-react'

export default function AdminProductosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const { data: catData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => productsApi.getAllCategories(),
  })
  const categories: Category[] = catData?.data ?? []

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.getAllAdmin({ page: 0, pageSize: 200 }),
  })

  // Client-side filtering
  const allProducts = data?.data ?? []
  const products = allProducts.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.slug.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryId && p.categoryName !== categories.find(c => c.id === categoryId)?.name) return false
    if (activeFilter === 'active' && !p.isActive) return false
    if (activeFilter === 'inactive' && p.isActive) return false
    return true
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => productsApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  if (error) return (
    <div className="flex items-center gap-2 text-red-600 p-6">
      <AlertCircle className="w-5 h-5" /> Error al cargar productos
    </div>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? '…' : `${products.length} productos`}
          </p>
        </div>
        <Link href="/admin/productos/nuevo"
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Nuevo producto
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o slug…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Category filter */}
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Active filter */}
        <div className="flex rounded-xl border border-gray-300 overflow-hidden text-sm">
          {(['all', 'active', 'inactive'] as const).map(opt => (
            <button key={opt}
              onClick={() => setActiveFilter(opt)}
              className={`px-3 py-2 font-medium transition ${
                activeFilter === opt ? 'bg-brand-700 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {opt === 'all' ? 'Todos' : opt === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <Package className="w-8 h-8" />
            <p className="text-sm">No hay productos con estos filtros</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-12"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Precio base</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  {/* Image */}
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {product.primaryImageUrl ? (
                        <Image src={product.primaryImageUrl} alt={product.name}
                          width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Name + slug */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{product.slug}</div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-gray-600">{product.categoryName || '—'}</td>

                  {/* Price */}
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {product.currency} {product.basePrice.toLocaleString()}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/productos/${product.id}`}
                        className="text-xs text-brand-700 hover:underline font-medium">
                        Editar
                      </Link>
                      <button onClick={() => toggleMut.mutate(product.id)}
                        disabled={toggleMut.isPending}
                        className="text-gray-400 hover:text-gray-700 transition"
                        title={product.isActive ? 'Desactivar' : 'Activar'}>
                        {product.isActive
                          ? <ToggleRight className="w-5 h-5 text-green-500" />
                          : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
