import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { OrderSummary } from './orders';
import type { QuotationSummary } from './quotations';

export interface CustomerNote {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface CustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  trustedClient: boolean;
  orderCount: number;
  quotationCount: number;
  lifetimeValue: number;
  lastOrderAt: string | null;
  internalTags: string[];
  createdAt: string;
}

export interface CustomerDetail extends CustomerSummary {
  whatsappPhone: string | null;
  birthDate: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  loyaltyPoints: number;
  recentOrders: OrderSummary[];
  recentQuotations: QuotationSummary[];
  notes: CustomerNote[];
  updatedAt: string;
}

export interface MyAccountDto {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  birthDate: string | null;
  trustedClient: boolean;
  loyaltyPoints: number;
  totalOrders: number;
  activeQuotations: number;
  totalSpent: number;
  recentOrders: OrderSummary[];
  activeQuotationList: QuotationSummary[];
}

export interface UpdateCustomerRequest {
  phone?: string;
  whatsappPhone?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  internalTags?: string[];
}

export const customersApi = {
  // Cliente autenticado
  getMyAccount: () =>
    apiClient.get<ApiResponse<MyAccountDto>>('/me').then(r => r.data),

  updateMyProfile: (data: UpdateCustomerRequest) =>
    apiClient.patch<ApiResponse<MyAccountDto>>('/me', data).then(r => r.data),

  // Admin
  getAll: (page = 0, size = 20, trustedOnly?: boolean) =>
    apiClient
      .get<ApiResponse<CustomerSummary[]>>('/admin/customers', {
        params: { page, size, ...(trustedOnly != null ? { trustedOnly } : {}) },
      })
      .then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<CustomerDetail>>(`/admin/customers/${id}`).then(r => r.data),

  toggleTrusted: (id: string) =>
    apiClient
      .post<ApiResponse<CustomerDetail>>(`/admin/customers/${id}/toggle-trusted`)
      .then(r => r.data),

  addNote: (id: string, content: string) =>
    apiClient
      .post<ApiResponse<CustomerDetail>>(`/admin/customers/${id}/notes`, { content })
      .then(r => r.data),

  updateTags: (id: string, tags: string[]) =>
    apiClient
      .patch<ApiResponse<CustomerDetail>>(`/admin/customers/${id}/tags`, tags)
      .then(r => r.data),

  updateProfile: (id: string, data: UpdateCustomerRequest) =>
    apiClient
      .patch<ApiResponse<CustomerDetail>>(`/admin/customers/${id}`, data)
      .then(r => r.data),
};
