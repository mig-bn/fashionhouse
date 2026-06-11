export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
  children?: Category[]
}

export interface Product {
  id: string
  categoryId: string
  category?: Category
  name: string
  slug: string
  description?: string
  basePrice: number
  currency: string
  isActive: boolean
  isFeatured: boolean
  variants: ProductVariant[]
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  size?: string
  color?: string
  priceOverride?: number
  stockQuantity: number
  isActive: boolean
}

export interface ProductImage {
  id: string
  productId: string
  variantId?: string
  url: string
  altText?: string
  sortOrder: number
  isPrimary: boolean
}
