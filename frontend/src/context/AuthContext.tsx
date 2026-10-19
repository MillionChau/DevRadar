import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
}

const DEFAULT_USER: User = {
  id: 'usr-001',
  userName: 'chautantan',
  email: 'chautantan@devradar.io',
  displayName: 'Châu Hoàng Tấn',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  bio: 'Software Engineer @ HCMUS • Đam mê Microservices, .NET 10, React & AI Moderation.',
  role: 'Member',
  reputationPoints: 1420,
  githubProfileUrl: 'https://github.com/MillionChau',
  createdAt: '2026-01-15T08:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('devradar_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const role: UserRole = user ? user.role : 'Guest';
  const isAuthenticated = user !== null;

  useEffect(() => {
    if (user) {
      localStorage.setItem('devradar_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('devradar_user');
    }
  }, [user]);

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Simulates login call to GatewayService :5000/identity/api/v1/Auth/login
    const mockUser: User = {
      ...DEFAULT_USER,
      email,
      displayName: email.split('@')[0],
    };
    setUser(mockUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'Guest') {
      setUser(null);
    } else if (user) {
      setUser({ ...user, role: newRole });
    } else {
      setUser({ ...DEFAULT_USER, role: newRole });
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, login, logout, switchRole }}>
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
