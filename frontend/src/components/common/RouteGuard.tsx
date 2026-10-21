import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ErrorState } from './ErrorState';

interface RouteGuardProps {
  allowedRoles?: UserRole[];
}

/**
 * RouteGuard bảo vệ các trang yêu cầu đăng nhập (Member) hoặc quyền hạn cụ thể (Admin / Moderator).
 */
export const ProtectedRoute: React.FC<RouteGuardProps> = ({ allowedRoles }) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-muted">Đang xác thực thông tin...</span>
        </div>
      </div>
    );
  }

  // 1. Chưa đăng nhập -> Chuyển hướng sang trang Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // 2. Nếu route yêu cầu vai trò cụ thể (VD: Admin) mà người dùng không có quyền
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          code={403}
          title="Truy cập bị từ chối (403 Forbidden)"
          message={`Trang này yêu cầu quyền [${allowedRoles.join(' hoặc ')}]. Vai trò hiện tại của bạn là [${role}].`}
        />
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
