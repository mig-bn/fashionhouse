import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { Product, ProductVariant, Category } from '@/types/product';

export interface ProductSummary {
  id: string; name: string; slug: string; basePrice: number;
  currency: string; isFeatured: boolean; isActive: boolean;
  categoryName: string; primaryImageUrl: string | null;
}

export interface ProductDetail extends Product {
  description: string;
  category: Category;
  variants: ProductVariant[];
  images: { id: string; url: string; altText: string; sortOrder: number; isPrimary: boolean; variantId: string | null }[];
}

export interface CatalogParams {
  categoryId?: string; minPrice?: number; maxPrice?: number;
  size?: string; color?: string; featured?: boolean;
  page?: number; pageSize?: number; sort?: string; direction?: 'asc' | 'desc';
}

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  currency: string;
  isFeatured: boolean;
}

export interface CreateVariantRequest {
  sku: string;
  size: string;
  color: string;
  priceOverride?: number | null;
  stockQuantity: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
}

export const productsApi = {
  // ── Public ─────────────────────────────────────────────────────────────────
  getCatalog: (params: CatalogParams = {}) =>
    apiClient.get<ApiResponse<ProductSummary[]>>('/products', { params }).then(r => r.data),

  getFeatured: () =>
    apiClient.get<ApiResponse<ProductSummary[]>>('/products/featured').then(r => r.data),

  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<ProductDetail>>(`/products/${slug}`).then(r => r.data),

  getCategories: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories').then(r => r.data),

  // ── Admin: Products ─────────────────────────────────────────────────────────
  getAllAdmin: (params: CatalogParams = {}) =>
    apiClient.get<ApiResponse<ProductSummary[]>>('/products/admin', { params }).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<ProductDetail>>(`/products/admin/${id}`).then(r => r.data),

  create: (data: CreateProductRequest) =>
    apiClient.post<ApiResponse<ProductDetail>>('/products', data).then(r => r.data),

  update: (id: string, data: Partial<CreateProductRequest>) =>
    apiClient.put<ApiResponse<ProductDetail>>(`/products/${id}`, data).then(r => r.data),

  toggleActive: (id: string) =>
    apiClient.patch<ApiResponse<ProductDetail>>(`/products/${id}/toggle-active`).then(r => r.data),

  addVariant: (productId: string, data: CreateVariantRequest) =>
    apiClient.post<ApiResponse<ProductVariant>>(`/products/${productId}/variants`, data).then(r => r.data),

  deleteVariant: (productId: string, variantId: string) =>
    apiClient.delete(`/products/${productId}/variants/${variantId}`).then(r => r.data),

  uploadImage: (productId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ApiResponse<{ id: string; url: string }>>(`/products/${productId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  deleteImage: (productId: string, imageId: string) =>
    apiClient.delete(`/products/${productId}/images/${imageId}`).then(r => r.data),

  // ── Admin: Categories ───────────────────────────────────────────────────────
  getAllCategories: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories/all').then(r => r.data),

  createCategory: (data: CreateCategoryRequest) =>
    apiClient.post<ApiResponse<Category>>('/categories', data).then(r => r.data),

  updateCategory: (id: string, data: Partial<CreateCategoryRequest>) =>
    apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data).then(r => r.data),

  toggleCategory: (id: string) =>
    apiClient.patch<ApiResponse<Category>>(`/categories/${id}/toggle-active`).then(r => r.data),
};
