'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/components/catalog/ProductCard'
import CategoryFilter from '@/components/catalog/CategoryFilter'
import { productsApi } from '@/lib/api/products'
import { useCartStore } from '@/store/cartStore'
import type { Category } from '@/types/product'
import type { ProductSummary } from '@/lib/api/products'

export default function CatalogoPage() {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const addItem = useCartStore(s => s.addItem)

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['products', { categoryId, page }],
    queryFn: () => productsApi.getCatalog({ categoryId: categoryId ?? undefined, page, pageSize: 20 }),
  })

  const categories: Category[] = catData?.data ?? []
  const products: ProductSummary[] = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  const handleAddToCart = (product: ProductSummary) => {
    // Agrega con la primera variante disponible — el usuario elige en detalle si quiere otra
    addItem(
      { id: product.id, name: product.name, basePrice: product.basePrice, currency: product.currency } as any,
      { id: product.id, sku: '', stockQuantity: 1 } as any,
      1,
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <p className="text-gray-500 mt-1">Encuentra la prenda perfecta</p>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <CategoryFilter
          categories={categories}
          selected={categoryId}
          onChange={id => { setCategoryId(id); setPage(0) }}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No hay productos en esta categoría por ahora.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                i === page
                  ? 'bg-brand-700 text-white'
                  : 'border text-gray-600 hover:border-brand-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
