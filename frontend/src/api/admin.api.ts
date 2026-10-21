import { apiClient } from './client';
import { ModerationReport } from '../types';

export const adminApi = {
  /** Lấy danh sách bài viết bị báo cáo chờ duyệt (UC-61) */
  getReports: async (status = 'Pending'): Promise<any[]> => {
    const res = await apiClient.get<any>('/community/api/PostReports/pending');
    const raw = res.data || res;
    return Array.isArray(raw) ? raw : raw.items || [];
  },

  /** Xử lý duyệt hoặc bác bỏ báo cáo vi phạm bài viết (UC-62) */
  resolveReport: async (reportId: string, approve: boolean, note?: string): Promise<any> => {
    return apiClient.put(`/community/api/PostReports/${reportId}/review`, {
      approve,
      reviewNote: note || (approve ? 'Phê duyệt ẩn nội dung vi phạm' : 'Bác bỏ báo cáo')
    });
  },

  // -------------------------------------------------------------
  // Quản lý Bài viết Admin (UC-52 -> UC-56)
  // -------------------------------------------------------------
  /** Bảng quản trị danh sách toàn bộ bài viết (UC-52) */
  getPosts: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    status?: number;
    isApproved?: boolean;
    techZoneId?: string;
    search?: string;
  }): Promise<any> => {
    return apiClient.get('/community/api/admin/posts', { params });
  },

  /** Xem chi tiết bài viết phía Admin (UC-53) */
  getPostById: async (id: string): Promise<any> => {
    return apiClient.get(`/community/api/admin/posts/${id}`);
  },

  /** Chủ động ẩn bài viết vi phạm (UC-54) */
  hidePost: async (id: string, reason?: string): Promise<any> => {
    return apiClient.put(`/community/api/admin/posts/${id}/hide`, { reason });
  },

  /** Khôi phục bài viết đã bị ẩn (UC-55) */
  restorePost: async (id: string): Promise<any> => {
    return apiClient.put(`/community/api/admin/posts/${id}/restore`);
  },

  /** Xóa vĩnh viễn bài viết (UC-56) */
  deletePost: async (id: string): Promise<any> => {
    return apiClient.delete(`/community/api/admin/posts/${id}`);
  },

  /** Ghim hoặc bỏ ghim bài viết lên đầu trang (UC-72) */
  pinPost: async (id: string, isPinned = true): Promise<any> => {
    return apiClient.post(`/community/api/Posts/${id}/pin`, null, { params: { isPinned } });
  },

  /** Kích hoạt Quality Service phân tích lại chất lượng & toxicity của bài viết */
  recheckPostAI: async (postId: string, content: string): Promise<any> => {
    return apiClient.post('/quality/api/v1/quality/analyze', {
      post_id: postId,
      content,
    });
  },

  // -------------------------------------------------------------
  // Quản lý Bình luận Admin (UC-57 -> UC-60)
  // -------------------------------------------------------------
  /** Bảng quản trị danh sách toàn bộ bình luận (UC-57) */
  getComments: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    status?: number;
    isApproved?: boolean;
    postId?: string;
    search?: string;
  }): Promise<any> => {
    return apiClient.get('/community/api/admin/comments', { params });
  },

  /** Chủ động ẩn bình luận vi phạm (UC-59) */
  hideComment: async (id: string, reason?: string): Promise<any> => {
    return apiClient.put(`/community/api/admin/comments/${id}/hide`, { reason });
  },

  /** Khôi phục bình luận đã bị ẩn (UC-60) */
  restoreComment: async (id: string): Promise<any> => {
    return apiClient.put(`/community/api/admin/comments/${id}/restore`);
  },

  /** Xóa vĩnh viễn bình luận */
  deleteComment: async (id: string): Promise<any> => {
    return apiClient.delete(`/community/api/admin/comments/${id}`);
  },

  // -------------------------------------------------------------
  // Quản lý TechZones Phía Admin (UC-69 -> UC-74)
  // -------------------------------------------------------------
  createTechZone: async (payload: { name: string; slug: string; description?: string; colorCode?: string; tags?: string }): Promise<any> => {
    return apiClient.post('/community/api/admin/techzones', payload);
  },

  updateTechZone: async (id: string, payload: any): Promise<any> => {
    return apiClient.put(`/community/api/admin/techzones/${id}`, payload);
  },

  deleteTechZone: async (id: string): Promise<any> => {
    return apiClient.delete(`/community/api/admin/techzones/${id}`);
  },

  // -------------------------------------------------------------
  // Quản lý Tài khoản Người Dùng (UC-51, UC-66)
  // -------------------------------------------------------------
  getUsers: async (page = 1, pageSize = 20, search = ''): Promise<any> => {
    return apiClient.get('/identity/api/v1/Users', { params: { searchTerm: search, pageNumber: page, pageSize } });
  },

  /** Khóa tài khoản người dùng vi phạm (UC-66) */
  lockUser: async (id: string): Promise<any> => {
    return apiClient.post(`/identity/api/v1/Users/${id}/lock`);
  },

  /** Mở khóa tài khoản người dùng (UC-66) */
  unlockUser: async (id: string): Promise<any> => {
    return apiClient.post(`/identity/api/v1/Users/${id}/unlock`);
  },

  /** Xóa người dùng (Soft delete) */
  deleteUser: async (id: string): Promise<any> => {
    return apiClient.delete(`/identity/api/v1/Users/${id}`);
  },

  // -------------------------------------------------------------
  // Quản lý Crawler & Thống kê Toàn Sàn (UC-75 -> UC-81)
  // -------------------------------------------------------------
  /** Lấy cấu hình các chỉ tiêu cào dữ liệu GitHub (UC-80) */
  getCrawlerConfig: async (): Promise<any> => {
    return apiClient.get('/crawler/analytics/crawl-config');
  },

  /** Cập nhật cấu hình chỉ tiêu cào dữ liệu GitHub (UC-80) */
  updateCrawlerConfig: async (config: any): Promise<any> => {
    return apiClient.post('/crawler/analytics/crawl-config', config);
  },

  /** Lấy lịch sử các phiên cào GitHub (UC-76, UC-77) */
  getCrawlerHistory: async (page = 1, limit = 20, status?: string): Promise<any> => {
    return apiClient.get('/crawler/api/v1/crawl/history', { params: { page, limit, status } });
  },

  /** Dừng tiến trình cào đang thực thi (UC-79) */
  stopCrawlerSession: async (sessionId?: string): Promise<any> => {
    return apiClient.post('/crawler/api/v1/crawl/stop', { session_id: sessionId });
  },

  /** Kích hoạt cào ngay lập tức (UC-78) */
  triggerCrawlNow: async (owner?: string, repo?: string): Promise<any> => {
    if (owner && repo) {
      return apiClient.post('/crawler/api/v1/crawl', { owner, repo });
    }
    return apiClient.post('/crawler/analytics/retrain-now');
  },

  /** Thống kê KPI tổng quan hệ thống Admin (UC-81) */
  getSystemOverview: async (): Promise<any> => {
    return apiClient.get('/crawler/analytics/system-overview');
  },

  /** Lấy danh sách nhật ký hệ thống toàn diện (Admin System & Request Logs) */
  getSystemLogs: async (params?: {
    service?: string;
    level?: string;
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<any> => {
    return apiClient.get('/crawler/analytics/system-logs', { params });
  },

  /** Lấy danh sách nhật ký hoạt động người dùng & kiểm toán (User Activity & Audit Logs) */
  getUserActivityLogs: async (params?: {
    role?: string;
    action?: string;
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<any> => {
    return apiClient.get('/crawler/analytics/user-activity-logs', { params });
  },

  /** Ghi nhận một sự kiện hành động người dùng vào MongoDB Atlas */
  recordUserActivity: async (data: {
    username: string;
    display_name?: string;
    role?: string;
    action: string;
    action_label: string;
    category?: string;
    target_type?: string;
    target_name?: string;
    target_id?: string;
    ip_address?: string;
    user_agent?: string;
    status?: string;
    details?: Record<string, any>;
  }): Promise<any> => {
    return apiClient.post('/crawler/analytics/user-activity-logs', data);
  },

  /** Xóa hoặc làm sạch nhật ký người dùng (Admin Audit Reset) */
  clearUserActivityLogs: async (clearType: 'mock' | 'all' = 'all'): Promise<any> => {
    return apiClient.delete('/crawler/analytics/user-activity-logs', { params: { clear_type: clearType } });
  },
};

export default adminApi;
