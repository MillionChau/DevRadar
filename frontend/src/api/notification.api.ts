import { apiClient } from './client';
import { NotificationItem } from '../types';

export const notificationApi = {
  /** Danh sách thông báo của tôi (FR-30, UC-26) */
  getMyNotifications: async (page = 1, pageSize = 20, isRead?: boolean): Promise<{ items: NotificationItem[]; totalCount: number }> => {
    const params: any = { page, pageSize };
    if (typeof isRead === 'boolean') {
      params.isRead = isRead;
    }
    const res = await apiClient.get<any>('/notification/api/Notifications/me', { params });
    const payload = res.data?.data || res.data || res;
    const rawItems: any[] = payload.items || (Array.isArray(payload) ? payload : []);

    const items: NotificationItem[] = rawItems.map((n: any) => ({
      id: String(n.id || n.notificationId),
      type: (typeof n.type === 'string' ? n.type.toLowerCase() : 'system') as any,
      title: n.title || 'Thông báo hệ thống',
      message: n.content || n.message || '',
      isRead: n.isRead ?? false,
      read: n.isRead ?? false,
      createdAt: n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong',
      targetUrl: n.linkUrl || n.targetUrl || n.actionUrl || '/',
      sender: n.actorName || n.senderName
        ? {
            id: n.actorId || n.senderId || 'sys',
            username: n.actorName || n.senderUserName || 'devradar',
            avatarUrl: n.actorAvatarUrl || n.senderAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
          }
        : undefined,
    }));

    return {
      items,
      totalCount: payload.totalCount ?? items.length,
    };
  },

  /** Số lượng thông báo chưa đọc (FR-31) */
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await apiClient.get<any>('/notification/api/Notifications/me/unread-count');
      const payload = res.data?.data || res.data || res;
      return payload.unreadCount ?? payload.count ?? 0;
    } catch {
      return 0;
    }
  },

  /** Đánh dấu một thông báo đã đọc (FR-32) */
  markAsRead: async (id: string): Promise<any> => {
    return apiClient.put(`/notification/api/Notifications/${id}/read`);
  },

  /** Đánh dấu tất cả thông báo đã đọc (FR-33) */
  markAllAsRead: async (): Promise<any> => {
    return apiClient.put('/notification/api/Notifications/read-all');
  },
};

export default notificationApi;
