import adminApi from '../api/admin.api';

export interface ActivityPayload {
  action: string;
  action_label: string;
  category?: 'AUTH' | 'CONTENT' | 'MODERATION' | 'ANALYTICS' | 'SECURITY' | 'SYSTEM' | 'ACCOUNT' | 'GENERAL';
  target_type?: string;
  target_name?: string;
  target_id?: string;
  status?: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  details?: Record<string, any>;
  customUser?: {
    username?: string;
    displayName?: string;
    role?: string;
  };
}

/**
 * Ghi nhận hành động thực tế của người dùng vào MongoDB Atlas
 * Tự động trích xuất danh tính người dùng đang đăng nhập từ session/localStorage
 */
export const recordActivity = async (payload: ActivityPayload): Promise<void> => {
  try {
    let username = payload.customUser?.username || 'guest';
    let displayName = payload.customUser?.displayName || 'Khách vãng lai';
    let role = payload.customUser?.role || 'Guest';

    if (!payload.customUser) {
      const savedUser = localStorage.getItem('devradar_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          username = parsed.userName || parsed.email || 'user';
          displayName = parsed.displayName || parsed.fullName || username;
          role = parsed.role || 'Member';
        } catch {
          // ignore parsing error
        }
      }
    }

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 150) : 'Web Browser';

    await adminApi.recordUserActivity({
      username,
      display_name: displayName,
      role,
      action: payload.action,
      action_label: payload.action_label,
      category: payload.category || 'GENERAL',
      target_type: payload.target_type,
      target_name: payload.target_name,
      target_id: payload.target_id,
      ip_address: '127.0.0.1',
      user_agent: userAgent,
      status: payload.status || 'SUCCESS',
      details: payload.details || {},
    });
  } catch (err) {
    // Không làm gián đoạn luồng nghiệp vụ nếu hệ thống log gặp sự cố mạng
    console.debug('[DevRadar Audit Logger] Suppressed error:', err);
  }
};

export default recordActivity;
