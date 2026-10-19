import React from 'react';
import { AppIcon, IconName } from './Icon';
import Button from './Button';

export interface ErrorStateProps {
  code?: 401 | 403 | 404 | 429 | 500;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  code = 500,
  title,
  message,
  onRetry,
  className = '',
}) => {
  const codeDefaults: Record<number, { title: string; message: string; icon: IconName }> = {
    401: {
      title: 'Phiên đăng nhập đã hết hạn',
      message: 'Vui lòng đăng nhập lại để tiếp tục sử dụng tính năng thành viên.',
      icon: 'lock',
    },
    403: {
      title: 'Không có quyền truy cập',
      message: 'Bạn không có quyền thực hiện thao tác hoặc truy cập trang quản trị này.',
      icon: 'shield',
    },
    404: {
      title: 'Không tìm thấy nội dung',
      message: 'Trang hoặc bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị ẩn.',
      icon: 'alert',
    },
    429: {
      title: 'Quá nhiều yêu cầu (Rate Limit)',
      message: 'Hệ thống đang bảo vệ tần suất gọi API. Vui lòng chờ vài giây trước khi thử lại.',
      icon: 'refresh',
    },
    500: {
      title: 'Lỗi kết nối Microservice',
      message: 'Không thể kết nối đến máy chủ GatewayService hoặc dịch vụ backend tạm thời gián đoạn.',
      icon: 'alert',
    },
  };

  const current = codeDefaults[code] || codeDefaults[500];

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-surface-card border border-status-danger/30 rounded-card ${className}`}>
      <div className="w-14 h-14 rounded-full bg-status-danger/10 border border-status-danger/20 flex items-center justify-center text-status-danger mb-4">
        <AppIcon name={current.icon} size={28} />
      </div>
      <span className="text-xs font-mono font-bold text-status-danger uppercase tracking-wider mb-1">
        Lỗi mã HTTP {code}
      </span>
      <h3 className="text-lg font-bold text-text-main mb-2">
        {title || current.title}
      </h3>
      <p className="text-sm text-text-muted max-w-md mb-6">
        {message || current.message}
      </p>
      {onRetry && (
        <Button variant="secondary" icon="refresh" onClick={onRetry}>
          Thử lại kết nối
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
