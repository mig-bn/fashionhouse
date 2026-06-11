'use client'

import { X, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils/formatters'

interface Props { open: boolean; onClose: () => void }

export default function CartSidebar({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore()

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Tu carrito</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <ShoppingBag className="w-12 h-12" />
              <p className="text-sm">Tu carrito está vacío</p>
              <button onClick={onClose} className="text-brand-700 text-sm font-medium hover:underline">
                Explorar catálogo
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.variantId} className="flex gap-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.productName}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
                  <p className="text-sm font-semibold text-brand-700 mt-0.5">
                    {formatCurrency(item.unitPrice)}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-6 h-6 rounded border flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm"
                    >−</button>
                    <span className="text-sm w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-6 h-6 rounded border flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm"
                    >+</button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm font-medium text-gray-900">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full text-center bg-brand-700 hover:bg-brand-800 text-white font-medium py-3 rounded-xl transition"
            >
              Ir al checkout
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
