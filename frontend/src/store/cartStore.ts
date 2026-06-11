import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductVariant, Product } from '@/types/product'

export interface CartItem {
  variantId: string
  productId: string
  productName: string
  sku: string
  size?: string
  color?: string
  imageUrl?: string
  unitPrice: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, variant: ProductVariant, quantity: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, variant, quantity) {
        const existing = get().items.find(i => i.variantId === variant.id)
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.variantId === variant.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          }))
        } else {
          const price = variant.priceOverride ?? product.basePrice
          const primaryImage = product.images.find(img => img.isPrimary)
          set(state => ({
            items: [
              ...state.items,
              {
                variantId: variant.id,
                productId: product.id,
                productName: product.name,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                imageUrl: primaryImage?.url,
                unitPrice: price,
                quantity,
              },
            ],
          }))
        }
      },

      removeItem(variantId) {
        set(state => ({ items: state.items.filter(i => i.variantId !== variantId) }))
      },

      updateQuantity(variantId, quantity) {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart() {
        set({ items: [] })
      },

      totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      subtotal() {
        return get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      },
    }),
    {
      name: 'fashionhouse-cart',
    }
  )
)
