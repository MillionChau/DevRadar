import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from '../common/Icon';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { notificationApi } from '../../api';

export const Header: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user && role !== 'Guest') {
      notificationApi
        .getUnreadCount()
        .then((cnt) => setUnreadCount(cnt))
        .catch(() => setUnreadCount(0));
    } else {
      setUnreadCount(0);
    }
  }, [user, role, location.pathname]);

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
        {role !== 'Guest' && user ? (
          <>
            {/* Create Post Button (SCR-08) */}
            <Link to="/editor/new">
              <Button variant="primary" size="sm" icon="plus">
                Viết bài
              </Button>
            </Link>

            {/* Notifications Bell (SCR-17) */}
            <Link
              to="/notifications"
              className="relative p-2 text-text-muted hover:text-text-main hover:bg-surface-elevated rounded-btn transition-colors"
              title={`${unreadCount} thông báo chưa đọc`}
            >
              <AppIcon name="bell" size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-status-danger text-white text-[10px] font-bold ring-2 ring-surface-card">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar & Profile Dropdown */}
            <div className="relative pl-2 border-l border-surface-border">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 rounded-btn hover:bg-surface-elevated transition-colors"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100'}
                  alt={user.displayName || user.userName}
                  className="w-8 h-8 rounded-full border border-surface-border object-cover"
                />
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-semibold text-text-main max-w-[120px] truncate leading-tight">
                    {user.displayName || user.userName}
                  </span>
                  <span
                    className={`text-[10px] font-bold leading-tight ${
                      role === 'Admin'
                        ? 'text-brand-secondary'
                        : role === 'Moderator'
                        ? 'text-status-warning'
                        : 'text-text-muted'
                    }`}
                  >
                    {role === 'Admin' ? 'Quản trị viên' : role === 'Moderator' ? 'Điều phối viên' : 'Thành viên'}
                  </span>
                </div>
                <AppIcon name="chevronDown" size={12} className="text-text-muted" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-card border border-surface-border rounded-card shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-surface-border mb-1">
                    <p className="text-xs font-bold text-text-main truncate">{user.displayName || user.userName}</p>
                    <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                    <div className="mt-1.5">
                      <Badge variant={role === 'Admin' ? 'role' : 'reputation'} size="sm">
                        {role === 'Admin' ? '🛡️ Quản trị viên' : role === 'Moderator' ? '⚖️ Điều phối viên' : '👤 Thành viên'}
                      </Badge>
                    </div>
                  </div>

                  <Link
                    to="/profile/me"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted hover:text-text-main hover:bg-surface-elevated rounded-btn transition-colors"
                  >
                    <AppIcon name="user" size={14} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>

                  <Link
                    to="/bookmarks"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted hover:text-text-main hover:bg-surface-elevated rounded-btn transition-colors"
                  >
                    <AppIcon name="bookmark" size={14} />
                    <span>Bài viết đã lưu</span>
                  </Link>

                  {role === 'Admin' && (
                    <Link
                      to="/admin/users"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-brand-secondary font-semibold hover:bg-surface-elevated rounded-btn transition-colors"
                    >
                      <AppIcon name="shield" size={14} />
                      <span>Trang Quản trị Admin</span>
                    </Link>
                  )}

                  <div className="my-1 border-t border-surface-border" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/auth/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-status-danger hover:bg-status-danger/10 rounded-btn transition-colors text-left"
                  >
                    <AppIcon name="lock" size={14} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
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
