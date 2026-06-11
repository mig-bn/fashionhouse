'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'
import type { ProductSummary } from '@/lib/api/products'

interface Props {
  product: ProductSummary
  onAddToCart?: (product: ProductSummary) => void
}

export default function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
      {/* Imagen */}
      <Link href={`/productos/${product.slug}`}>
        <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
          {product.primaryImageUrl ? (
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingBag className="w-12 h-12" />
            </div>
          )}
        </div>
      </Link>

      {/* Badge destacado */}
      {product.isFeatured && (
        <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          Destacado
        </span>
      )}

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1">{product.categoryName}</p>
        <Link href={`/productos/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-900 hover:text-brand-700 line-clamp-2 transition">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-bold text-brand-700">
            {formatCurrency(product.basePrice)}
          </span>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="p-2 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 transition"
              aria-label="Agregar al carrito"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
