import apiClient from './client';
import type { ApiResponse, PagedResponse } from '@/types/api';

export type QuotationStatus =
  | 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'QUOTED'
  | 'ACCEPTED' | 'IN_PRODUCTION' | 'READY' | 'DELIVERED' | 'REJECTED';

export type SenderType = 'CUSTOMER' | 'STAFF';

export interface QuotationMessage {
  id: string;
  senderType: SenderType;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface QuotationImage {
  id: string;
  url: string;
  altText: string;
  uploadedBy: string;
  createdAt: string;
}

export interface QuotationSummary {
  id: string;
  customerId: string;
  customerName: string;
  description: string;
  status: QuotationStatus;
  proposedPrice: number | null;
  currency: string;
  estimatedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationDetail extends QuotationSummary {
  customerEmail: string | null;
  measurements: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  messages: QuotationMessage[];
  images: QuotationImage[];
}

export interface CreateQuotationRequest {
  description: string;
  measurements?: string;
  initialMessage?: string;
}

export interface RespondQuotationRequest {
  newStatus: QuotationStatus;
  proposedPrice?: number;
  currency?: string;
  estimatedDelivery?: string;
  adminNotes?: string;
  rejectionReason?: string;
  message?: string;
}

export const quotationsApi = {
  create: (data: CreateQuotationRequest) =>
    apiClient.post<ApiResponse<QuotationDetail>>('/quotations', data).then(r => r.data),

  getMyQuotations: (page = 0, size = 10) =>
    apiClient
      .get<ApiResponse<QuotationSummary[]>>('/quotations/me', { params: { page, size } })
      .then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<QuotationDetail>>(`/quotations/${id}`).then(r => r.data),

  addMessage: (id: string, content: string) =>
    apiClient
      .post<ApiResponse<QuotationDetail>>(`/quotations/${id}/messages`, { content })
      .then(r => r.data),

  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<ApiResponse<QuotationDetail>>(`/quotations/${id}/images`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data);
  },

  // Admin
  getAll: (page = 0, size = 20, status?: QuotationStatus) =>
    apiClient
      .get<ApiResponse<QuotationSummary[]>>('/quotations', {
        params: { page, size, ...(status ? { status } : {}) },
      })
      .then(r => r.data),

  respond: (id: string, data: RespondQuotationRequest) =>
    apiClient
      .patch<ApiResponse<QuotationDetail>>(`/quotations/${id}/respond`, data)
      .then(r => r.data),
};
