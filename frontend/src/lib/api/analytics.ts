import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
  newCustomersThisMonth: number;
  activeQuotations: number;
  conversionRate: number;
}

export interface SalesData {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface ConversionRate {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
  conversionRate: number;
}

export interface LowStockAlert {
  sku: string;
  productName: string;
  size: string;
  color: string;
  stockQuantity: number;
}

export interface RevenueByCategory {
  categoryName: string;
  revenue: number;
  orderCount: number;
}

export const analyticsApi = {
  getSummary: () =>
    apiClient.get<ApiResponse<DashboardSummary>>('/admin/analytics/summary').then(r => r.data),

  getSales: (from?: string, to?: string) =>
    apiClient.get<ApiResponse<SalesData[]>>('/admin/analytics/sales', {
      params: { from, to },
    }).then(r => r.data),

  getTopProducts: (from?: string, to?: string) =>
    apiClient.get<ApiResponse<TopProduct[]>>('/admin/analytics/top-products', {
      params: { from, to },
    }).then(r => r.data),

  getConversion: () =>
    apiClient.get<ApiResponse<ConversionRate>>('/admin/analytics/conversion').then(r => r.data),

  getLowStock: () =>
    apiClient.get<ApiResponse<LowStockAlert[]>>('/admin/analytics/low-stock').then(r => r.data),

  getRevenueByCategory: (from?: string, to?: string) =>
    apiClient.get<ApiResponse<RevenueByCategory[]>>('/admin/analytics/revenue-category', {
      params: { from, to },
    }).then(r => r.data),
};
