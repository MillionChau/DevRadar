import { apiClient } from './client';
import { User, AuthResponse } from '../types';

export interface LoginPayload {
  email?: string;
  userName?: string;
  userNameOrEmail?: string;
  password?: string;
}

export interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
}

export const authApi = {
  /** Đăng nhập hệ thống (UC-01) */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const body = {
      userNameOrEmail: payload.userNameOrEmail || payload.email || payload.userName || '',
      password: payload.password || '',
    };
    const res = await apiClient.post<any>('/identity/api/v1/Auth/login', body, { skipAuth: true });
    const data = res.data?.data || res.data || res;
    if (data.accessToken) {
      localStorage.setItem('devradar_access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('devradar_refresh_token', data.refreshToken);
    }
    return data;
  },

  /** Đăng ký tài khoản mới (UC-02) */
  register: async (payload: RegisterPayload): Promise<any> => {
    const res = await apiClient.post<any>('/identity/api/v1/Auth/register', payload, { skipAuth: true });
    const data = res.data?.data || res.data || res;
    if (data.accessToken) {
      localStorage.setItem('devradar_access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('devradar_refresh_token', data.refreshToken);
    }
    return data;
  },

  /** Làm mới JWT Token (UC-04) */
  refreshToken: async (accessToken: string, refreshToken: string): Promise<AuthResponse> => {
    return apiClient.post('/identity/api/v1/Auth/refresh-token', { accessToken, refreshToken }, { skipAuth: true });
  },

  /** Lấy thông tin người dùng đăng nhập hiện tại (UC-07) */
  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get<any>('/identity/api/v1/Auth/me');
    const d = res.data?.data || res.data || res;
    const userRole = Array.isArray(d.roles) && d.roles.includes('Admin')
      ? 'Admin'
      : (Array.isArray(d.roles) && d.roles.includes('Moderator') ? 'Moderator' : 'Member');

    return {
      id: d.id,
      userName: d.userName,
      email: d.email,
      displayName: d.fullName || d.userName,
      avatarUrl: d.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      bio: d.bio || 'Thành viên DevRadar Community',
      role: userRole,
      reputationPoints: d.reputationPoints || 1200,
      createdAt: d.createdAt || new Date().toISOString(),
    };
  },

  /** Cập nhật hồ sơ cá nhân (UC-08) */
  updateProfile: async (id: string, payload: Partial<User>): Promise<any> => {
    return apiClient.put(`/identity/api/v1/Users/${id}`, payload);
  },

  /** Xem hồ sơ công khai của người dùng khác (UC-07) */
  getUserPublicProfile: async (id: string): Promise<any> => {
    const res = await apiClient.get<any>(`/identity/api/v1/Users/${id}/profile`, { skipAuth: true });
    return res.data?.data || res.data || res;
  },

  /** Đăng xuất: xóa token tại client */
  logout: () => {
    apiClient.clearTokens();
  },
};

export default authApi;
