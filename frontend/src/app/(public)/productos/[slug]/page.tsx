'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { productsApi } from '@/lib/api/products'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils/formatters'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const addItem = useCartStore(s => s.addItem)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [imageIndex, setImageIndex] = useState(0)
  const [added, setAdded] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug),
    enabled: !!slug,
  })

  const product = data?.data
  const activeVariants = product?.variants?.filter(v => v.isActive) ?? []
  const selectedVariant = activeVariants.find(v => v.id === selectedVariantId) ?? activeVariants[0]
  const price = selectedVariant?.priceOverride ?? product?.basePrice ?? 0
  const images = product?.images?.sort((a, b) => a.sortOrder - b.sortOrder) ?? []

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return
    addItem(product as any, selectedVariant as any, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )

  if (isError || !product) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-500">
      Producto no encontrado.
      <Link href="/catalogo" className="block mt-4 text-brand-700">Volver al catálogo</Link>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/catalogo" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-700 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Catálogo
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Galería */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            {images[imageIndex] ? (
              <img src={images[imageIndex].url} alt={images[imageIndex].altText}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ShoppingBag className="w-16 h-16" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setImageIndex(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                    i === imageIndex ? 'border-brand-600' : 'border-transparent'
                  }`}>
                  <img src={img.url} alt={img.altText} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-400">{product.category?.name}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
            <p className="text-2xl font-bold text-brand-700 mt-2">{formatCurrency(price)}</p>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Variantes */}
          {activeVariants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Talla / Color</p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={v.stockQuantity === 0}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                      (selectedVariant?.id === v.id)
                        ? 'border-brand-700 bg-brand-50 text-brand-700'
                        : v.stockQuantity === 0
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                          : 'border-gray-200 text-gray-700 hover:border-brand-400'
                    }`}
                  >
                    {[v.size, v.color].filter(Boolean).join(' / ') || v.sku}
                    {v.stockQuantity === 0 && <span className="ml-1 text-xs">(sin stock)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-brand-700 hover:bg-brand-800 text-white disabled:opacity-50'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              {added ? '¡Agregado!' : 'Agregar al carrito'}
            </button>
          </div>

          {/* Stock */}
          {selectedVariant && (
            <p className="text-xs text-gray-400">
              {selectedVariant.stockQuantity > 0
                ? `${selectedVariant.stockQuantity} unidades disponibles`
                : 'Sin stock'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
