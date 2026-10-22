import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api';
import { recordActivity } from '../utils/activityLogger';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseUserFromToken(token: string): Partial<User> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    const rolesClaim =
      parsed.roles ||
      parsed.role ||
      parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const rolesList = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim].filter(Boolean);

    let role: UserRole = 'Member';
    if (rolesList.includes('Admin')) {
      role = 'Admin';
    } else if (rolesList.includes('Moderator')) {
      role = 'Moderator';
    }

    return {
      id: parsed.sub || parsed.user_id,
      userName: parsed.preferred_username || parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || parsed.name,
      displayName: parsed.name || parsed.preferred_username,
      email: parsed.email || parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      role,
    };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('devradar_access_token');
    const saved = localStorage.getItem('devradar_user');
    // Nếu không có token đăng nhập thực tế, xóa dữ liệu rác và đặt trạng thái là khách
    if (!token) {
      if (saved) localStorage.removeItem('devradar_user');
      return null;
    }
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      // Xóa dữ liệu tài khoản demo cũ nếu có
      if (parsed.id === 'usr-demo') {
        localStorage.removeItem('devradar_user');
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem('devradar_user');
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khởi tạo: kiểm tra phiên đăng nhập từ API Gateway qua Token
  useEffect(() => {
    const token = localStorage.getItem('devradar_access_token');
    if (token) {
      authApi
        .getCurrentUser()
        .then((liveUser) => {
          setUser(liveUser);
          localStorage.setItem('devradar_user', JSON.stringify(liveUser));
        })
        .catch((err) => {
          console.warn('Phiên đăng nhập đã hết hạn hoặc không hợp lệ:', err);
          authApi.logout();
          setUser(null);
          localStorage.removeItem('devradar_user');
        })
        .finally(() => setIsLoading(false));
    } else {
      setUser(null);
      localStorage.removeItem('devradar_user');
      setIsLoading(false);
    }
  }, []);

  const role: UserRole = user ? user.role : 'Guest';
  const isAuthenticated = user !== null && role !== 'Guest';

  const login = async (email: string, password: string): Promise<boolean> => {
    const authRes = await authApi.login({ userNameOrEmail: email, password });
    if (!authRes || !authRes.accessToken) {
      throw new Error('Đăng nhập không thành công, vui lòng kiểm tra lại thông tin.');
    }

    try {
      const liveUser = await authApi.getCurrentUser();
      setUser(liveUser);
      localStorage.setItem('devradar_user', JSON.stringify(liveUser));
      return true;
    } catch (err) {
      console.warn('Lỗi lấy thông tin qua /me, giải mã thông tin và role từ JWT Token:', err);
      const tokenUser = parseUserFromToken(authRes.accessToken);
      const resUser = (authRes as any).user;
      const rolesList = Array.isArray(resUser?.roles) ? resUser.roles : [];

      let userRole: UserRole = tokenUser?.role || 'Member';
      if (rolesList.includes('Admin')) {
        userRole = 'Admin';
      } else if (rolesList.includes('Moderator')) {
        userRole = 'Moderator';
      }

      const u: User = {
        id: resUser?.id || tokenUser?.id || 'usr-live',
        userName: resUser?.userName || tokenUser?.userName || email.split('@')[0],
        email: resUser?.email || tokenUser?.email || email,
        displayName: resUser?.fullName || tokenUser?.displayName || resUser?.userName || email.split('@')[0],
        avatarUrl: resUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        bio: resUser?.bio || 'Thành viên DevRadar Community',
        role: userRole,
        reputationPoints: resUser?.reputationPoints || 1200,
        createdAt: resUser?.createdAt || new Date().toISOString(),
      };
      setUser(u);
      localStorage.setItem('devradar_user', JSON.stringify(u));
      return true;
    }
  };

  const logout = () => {
    if (user) {
      recordActivity({
        action: 'AUTH_LOGOUT',
        action_label: `Đăng xuất khỏi hệ thống (${user.userName})`,
        category: 'AUTH',
        target_type: 'AUTH',
        target_name: `Tài khoản: @${user.userName}`,
        status: 'SUCCESS',
        customUser: {
          username: user.userName,
          displayName: user.displayName,
          role: user.role
        }
      });
    }
    authApi.logout();
    localStorage.removeItem('devradar_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
