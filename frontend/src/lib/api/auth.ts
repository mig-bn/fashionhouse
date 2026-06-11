import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string; firstName: string; lastName: string }
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; isActive: boolean };
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data).then(r => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }).then(r => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
};
