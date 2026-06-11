import apiClient from './client';
import type { ApiResponse } from '@/types/api';
import type { Order, OrderItem, Payment } from '@/types/order';

export interface OrderSummary {
  id: string; status: string; total: number;
  currency: string; itemCount: number; createdAt: string;
}

export interface OrderDetail {
  id: string; status: string;
  subtotal: number; discount: number; tax: number; shippingCost: number; total: number;
  currency: string;
  shipAddress: string; shipCity: string; shipState: string; shipPostal: string; shipCountry: string;
  notes: string;
  items: {
    id: string; variantId: string; productName: string; variantSku: string;
    size: string; color: string; unitPrice: number; quantity: number; lineTotal: number;
  }[];
  payments: { id: string; amount: number; currency: string; method: string; status: string; paidAt: string | null }[];
  createdAt: string; updatedAt: string;
}

export interface CreateOrderLine { variantId: string; quantity: number }
export interface CreateOrderRequest {
  items: CreateOrderLine[];
  shipAddress?: string; shipCity?: string; shipState?: string;
  shipPostal?: string; shipCountry?: string; notes?: string;
}

export interface PaymentPreference {
  orderId: string; preferenceId: string; initPoint: string; sandboxInitPoint: string;
}

export interface AdminOrderSummary {
  id: string; status: string; total: number; currency: string;
  itemCount: number; createdAt: string;
  customerName?: string; customerEmail?: string;
}

export const ordersApi = {
  // ── Customer ────────────────────────────────────────────────────────────────
  create: (data: CreateOrderRequest) =>
    apiClient.post<ApiResponse<OrderDetail>>('/orders', data).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<OrderDetail>>(`/orders/${id}`).then(r => r.data),

  getMyOrders: (page = 0, pageSize = 10) =>
    apiClient.get<ApiResponse<OrderSummary[]>>('/orders/my', { params: { page, pageSize } }).then(r => r.data),

  createPaymentPreference: (orderId: string, paymentMethod: string) =>
    apiClient.post<ApiResponse<PaymentPreference>>('/payments/preference', { orderId, paymentMethod }).then(r => r.data),

  // ── Admin ───────────────────────────────────────────────────────────────────
  getAll: (params: { page?: number; size?: number; status?: string; search?: string } = {}) =>
    apiClient.get<ApiResponse<AdminOrderSummary[]>>('/orders', { params }).then(r => r.data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<OrderDetail>>(`/orders/${id}/status`, { status }).then(r => r.data),
};
