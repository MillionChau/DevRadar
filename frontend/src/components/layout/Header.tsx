import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from '../common/Icon';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: 'Bảng tin', path: '/' },
    { label: 'TechZone', path: '/techzones' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Xếp hạng', path: '/leaderboard' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-[70px] bg-surface-card/95 backdrop-blur-md border-b border-surface-border flex items-center justify-between px-6 transition-colors">
      {/* Brand Logo */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-btn bg-brand-primary flex items-center justify-center text-white font-mono font-bold shadow-sm group-hover:scale-105 transition-transform">
            <AppIcon name="radar" size={18} />
          </div>
          <span className="font-bold text-lg text-text-main tracking-tight">
            Dev<span className="text-brand-secondary">Radar</span>
          </span>
          {role === 'Admin' && (
            <Badge variant="role" size="sm">ADMIN</Badge>
          )}
          {role === 'Moderator' && (
            <Badge variant="role" size="sm" className="bg-status-warning text-black">MOD</Badge>
          )}
        </Link>

        {/* Search Bar (Ctrl+K) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-80 lg:w-96">
          <div className="absolute left-3 text-text-subtle pointer-events-none">
            <AppIcon name="search" size={16} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết, công nghệ, tác giả... (Ctrl + K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn pl-9 pr-12 py-2 h-9 placeholder:text-text-subtle focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
          />
          <div className="absolute right-2 px-1.5 py-0.5 rounded bg-surface-border text-[10px] font-mono font-bold text-text-muted">
            ⌘ K
          </div>
        </form>
      </div>

      {/* Main Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1.5 text-sm font-medium rounded-btn transition-colors relative ${
                isActive
                  ? 'text-brand-secondary font-semibold'
                  : 'text-text-muted hover:text-text-main hover:bg-surface-elevated/50'
              }`}
            >
              {link.label}
              {isActive && (
                <span className="absolute bottom-[-14px] left-3 right-3 h-[2px] bg-brand-secondary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        {/* Role Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="text-[11px] font-mono px-2 py-1 rounded bg-surface-elevated border border-surface-border text-text-muted hover:text-text-main transition-colors flex items-center gap-1"
            title="Đổi vai trò để thử nghiệm phân quyền RBAC"
          >
            Role: <span className="text-brand-secondary font-bold">{role}</span>
            <AppIcon name="chevronDown" size={12} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-surface-card border border-surface-border rounded-card shadow-xl p-1 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-text-subtle border-b border-surface-border">
                Chọn vai trò (RBAC)
              </div>
              {(['Guest', 'Member', 'Moderator', 'Admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-btn transition-colors ${
                    role === r
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-text-muted hover:bg-surface-elevated hover:text-text-main'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {role !== 'Guest' ? (
          <>
            {/* Create Post Button (SCR-08) */}
            <Link to="/editor/new">
              <Button variant="primary" size="sm" icon="plus">
                Viết bài
              </Button>
            </Link>

            {/* Notifications Bell (SCR-17) */}
            <Link to="/notifications" className="relative p-2 text-text-muted hover:text-text-main hover:bg-surface-elevated rounded-btn transition-colors">
              <AppIcon name="bell" size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-secondary ring-2 ring-surface-card" />
            </Link>

            {/* Avatar & Profile */}
            <Link to="/profile/me" className="flex items-center gap-2 pl-2 border-l border-surface-border">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100'}
                alt={user?.displayName}
                className="w-8 h-8 rounded-full border border-surface-border object-cover"
              />
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link to="/auth/register">
              <Button variant="primary" size="sm">Đăng ký</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
