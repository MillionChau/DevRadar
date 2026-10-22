import { apiClient } from './client';
import { RepoHealth } from '../types';

export const analyticsApi = {
  /** Lấy dữ liệu đồ thị Radar Chart 5 trục của lập trình viên (UC-39) */
  getDeveloperRadar: async (username: string): Promise<any> => {
    return apiClient.get(`/crawler/analytics/radar/${username}`);
  },

  /** So sánh đối đầu năng lực giữa 2 lập trình viên trên 5 trục Radar (UC-40) */
  compareDevelopers: async (dev1: string, dev2: string): Promise<any> => {
    return apiClient.get('/crawler/analytics/compare', { params: { dev1, dev2 } });
  },

  /** Tính toán chỉ số Repository Health (0-100) (UC-34) */
  calculateRepoHealth: async (payload: {
    full_name: string;
    stars?: number;
    forks?: number;
    open_issues?: number;
    closed_issues_30d?: number;
    contributors_count?: number;
    recent_commits_30d?: number;
    days_since_last_push?: number;
    star_growth_rate_30d?: number;
  }): Promise<any> => {
    return apiClient.post('/crawler/analytics/repository-health', payload);
  },

  /** Tra cứu toàn diện điểm sức khỏe Repository thực tế từ MongoDB Atlas (SCR-11) */
  lookupRepoHealth: async (fullName: string): Promise<any> => {
    return apiClient.get('/crawler/analytics/repository-health/lookup', {
      params: { full_name: fullName },
    });
  },

  /** Lấy chuỗi lịch sử điểm sức khỏe của một Repository (Line Chart) */
  getRepoHealthHistory: async (fullName: string, limit = 12): Promise<any[]> => {
    const res = await apiClient.get<any>('/crawler/analytics/repository-health/history', {
      params: { full_name: fullName, limit },
    });
    return Array.isArray(res) ? res : res.data || [];
  },

  /** Tính toán chỉ số Language Health (0-100) */
  calculateLanguageHealth: async (payload: {
    language: string;
    repository_count?: number;
    total_stars?: number;
    total_forks?: number;
    commit_activity_index?: number;
    contributor_activity_index?: number;
    repo_growth_rate?: number;
    star_growth_rate?: number;
  }): Promise<any> => {
    return apiClient.post('/crawler/analytics/language-health', payload);
  },

  /** Lấy chuỗi lịch sử điểm sức khỏe ngôn ngữ lập trình */
  getLanguageHealthHistory: async (language: string, limit = 30): Promise<any[]> => {
    const res = await apiClient.get<any>('/crawler/analytics/language-health/history', {
      params: { language, limit },
    });
    return Array.isArray(res) ? res : res.data || [];
  },

  /** Xem thống kê dữ liệu toàn hệ thống Admin (UC-81) */
  getSystemOverview: async (): Promise<any> => {
    return apiClient.get('/crawler/analytics/system-overview');
  },

  /** Lấy danh sách Top Repositories theo dõi từ MongoDB */
  getTopRepositories: async (limit = 10): Promise<any[]> => {
    const res = await apiClient.get<any>('/crawler/analytics/top-repositories', { params: { limit } });
    return Array.isArray(res) ? res : res.data || [];
  },

  /** Xem danh sách báo cáo phân tích công nghệ tự động (LLM AI Reports UC-35 to UC-38) */
  getReports: async (limit = 10, category?: string): Promise<any[]> => {
    const params: any = { limit };
    if (category && category !== 'all') params.category = category;
    const res = await apiClient.get<any>('/crawler/api/v1/reports', { params });
    const raw = res.data || res;
    return Array.isArray(raw) ? raw : raw.items || [];
  },

  /** Xem chi tiết một báo cáo AI */
  getReportById: async (reportId: string): Promise<any> => {
    const res = await apiClient.get<any>(`/crawler/api/v1/reports/${reportId}`);
    return res.data || res;
  },

  /** Thích / Bỏ thích báo cáo công nghệ */
  likeReport: async (reportId: string, increment: boolean = true): Promise<any> => {
    return apiClient.post(`/crawler/api/v1/reports/${reportId}/like`, null, {
      params: { increment },
    });
  },

  /** Lấy danh sách bình luận của báo cáo công nghệ */
  getReportComments: async (reportId: string): Promise<any[]> => {
    const res = await apiClient.get<any>(`/crawler/api/v1/reports/${reportId}/comments`);
    const raw = res.data || res;
    return Array.isArray(raw?.items) ? raw.items : (Array.isArray(raw) ? raw : []);
  },

  /** Gửi bình luận mới cho báo cáo */
  addReportComment: async (
    reportId: string,
    payload: { content: string; author_name?: string; author_avatar?: string; author_id?: string }
  ): Promise<any> => {
    return apiClient.post(`/crawler/api/v1/reports/${reportId}/comments`, payload);
  },

  /** Xóa bình luận báo cáo */
  deleteReportComment: async (reportId: string, commentId: string): Promise<any> => {
    return apiClient.delete(`/crawler/api/v1/reports/${reportId}/comments/${commentId}`);
  },

  /** Lấy danh sách quản trị báo cáo công nghệ (Admin UC-64) */
  getAdminReports: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<any> => {
    const res = await apiClient.get<any>('/crawler/api/v1/admin/reports', { params });
    return res.data || res;
  },

  /** Lấy chi tiết báo cáo phía Admin */
  getAdminReportDetail: async (reportId: string): Promise<any> => {
    const res = await apiClient.get<any>(`/crawler/api/v1/admin/reports/${reportId}`);
    return res.data || res;
  },

  /** Tạo báo cáo công nghệ mới phía Admin */
  createAdminReport: async (payload: any): Promise<any> => {
    return apiClient.post('/crawler/api/v1/admin/reports', payload);
  },

  /** Cập nhật báo cáo công nghệ phía Admin */
  updateAdminReport: async (reportId: string, payload: any): Promise<any> => {
    return apiClient.put(`/crawler/api/v1/admin/reports/${reportId}`, payload);
  },

  /** Duyệt xuất bản báo cáo (Admin UC-66) */
  publishAdminReport: async (reportId: string): Promise<any> => {
    return apiClient.put(`/crawler/api/v1/admin/reports/${reportId}/publish`);
  },

  /** Ẩn báo cáo (Admin UC-67) */
  hideAdminReport: async (reportId: string): Promise<any> => {
    return apiClient.put(`/crawler/api/v1/admin/reports/${reportId}/hide`);
  },

  /** Xóa vĩnh viễn báo cáo (Admin UC-68) */
  deleteAdminReport: async (reportId: string): Promise<any> => {
    return apiClient.delete(`/crawler/api/v1/admin/reports/${reportId}`);
  },

  /** Sinh báo cáo tự động bằng AI (Admin UC-68) */
  generateAIReport: async (payload: {
    topic?: string;
    category?: string;
    target_tech?: string;
    status?: string;
    save_to_db?: boolean;
    include_live_metrics?: boolean;
  }): Promise<any> => {
    return apiClient.post('/crawler/api/v1/admin/reports/ai-generate', payload);
  },

  /** Lấy danh sách gợi ý chủ đề AI hot */
  getAIReportSuggestions: async (): Promise<any> => {
    const res = await apiClient.get<any>('/crawler/api/v1/admin/reports/ai-suggestions');
    return res.data || res;
  },

  /** Kích hoạt sinh báo cáo AI tức thì (UC-37, UC-66) */
  generateReport: async (payload: {
    title: string;
    category?: string;
    target_technology?: string;
    prompt?: string;
  }): Promise<any> => {
    return apiClient.post('/crawler/api/v1/reports/generate', payload);
  },

  /** Cập nhật trạng thái duyệt/xuất bản báo cáo (UC-67, UC-68) */
  updateReportStatus: async (reportId: string, status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT'): Promise<any> => {
    return apiClient.put(`/crawler/api/v1/reports/${reportId}/status`, null, {
      params: { status },
    });
  },

  /** Kích hoạt thu thập GitHub Repository theo yêu cầu (UC-30, UC-78) */
  triggerCrawl: async (owner: string, repo: string): Promise<any> => {
    return apiClient.post('/crawler/api/v1/crawl', { owner, repo });
  },

  /** Lấy dữ liệu biểu đồ xu hướng thực tế của Top 5-10 hệ sinh thái (UC-10) */
  getTrendChart: async (params?: {
    period?: '30d' | '90d' | '1y';
    top_n?: number;
    languages?: string;
  }): Promise<any> => {
    return apiClient.get('/crawler/analytics/trend-chart', { params });
  },

  /** Lấy dữ liệu 5 trục Radar của một hệ sinh thái công nghệ (UC-12) */
  getTechRadar: async (techName: string): Promise<any> => {
    return apiClient.get(`/crawler/analytics/tech-radar/${encodeURIComponent(techName)}`);
  },

  /** So sánh đối đầu 2 hệ sinh thái công nghệ trên 5 trục Radar (UC-12) */
  compareTechnologies: async (tech1: string, tech2: string): Promise<any> => {
    return apiClient.get('/crawler/analytics/compare-tech', { params: { tech1, tech2 } });
  },

  /** Lấy danh sách các hệ sinh thái công nghệ sẵn có trong kho mã để so sánh */
  getAvailableTechnologies: async (): Promise<any[]> => {
    const res = await apiClient.get<any>('/crawler/analytics/available-techs');
    return Array.isArray(res) ? res : res.data || [];
  },
};

export default analyticsApi;
