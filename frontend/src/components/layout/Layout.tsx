import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import { AppIcon } from '../common/Icon';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { role } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname.startsWith('/auth');

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Outlet />
        </main>
        <footer className="py-4 text-center text-xs text-text-subtle border-t border-surface-border">
          DevRadar © 2026 • Nền tảng cộng đồng lập trình viên tích hợp phân tích năng lực GitHub
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Header />

      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 flex gap-8">
        {/* Conditional Sidebar */}
        {isAdminRoute ? <AdminSidebar /> : <Sidebar />}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-16 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Design System Responsive Mobile 375px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface-card border-t border-surface-border flex items-center justify-around px-2 z-50">
        <Link to="/" className="flex flex-col items-center gap-1 text-[10px] text-text-muted hover:text-brand-secondary">
          <AppIcon name="home" size={18} />
          <span>Bảng tin</span>
        </Link>
        <Link to="/techzones" className="flex flex-col items-center gap-1 text-[10px] text-text-muted hover:text-brand-secondary">
          <AppIcon name="layers" size={18} />
          <span>TechZone</span>
        </Link>
        <Link to="/dashboard" className="flex flex-col items-center gap-1 text-[10px] text-text-muted hover:text-brand-secondary">
          <AppIcon name="radar" size={18} />
          <span>Radar</span>
        </Link>
        <Link to="/editor/new" className="flex flex-col items-center gap-1 text-[10px] text-brand-primary">
          <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg -mt-3">
            <AppIcon name="plus" size={18} />
          </div>
        </Link>
        <Link to="/profile/me" className="flex flex-col items-center gap-1 text-[10px] text-text-muted hover:text-brand-secondary">
          <AppIcon name="user" size={18} />
          <span>Cá nhân</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
