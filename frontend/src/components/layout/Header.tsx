import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from '../common/Icon';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Tooltip } from '../common/Tooltip';
import { useAuth } from '../../context/AuthContext';
import { UserRole, NotificationItem } from '../../types';
import { notificationApi } from '../../api';

export const Header: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread count & listen to global notifications-read event
  useEffect(() => {
    if (user && role !== 'Guest') {
      notificationApi
        .getUnreadCount()
        .then((cnt) => setUnreadCount(cnt))
        .catch(() => setUnreadCount(0));
    } else {
      setUnreadCount(0);
    }

    const handleReadEvent = () => setUnreadCount(0);
    window.addEventListener('devradar:notifications-read', handleReadEvent);
    return () => {
      window.removeEventListener('devradar:notifications-read', handleReadEvent);
    };
  }, [user, role, location.pathname]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setShowNotificationMenu(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Facebook behavior: Khi nhấn vào thông báo (biểu tượng Bell), ngay lập tức đánh dấu tất cả đã đọc
  const handleToggleNotificationMenu = async () => {
    const nextState = !showNotificationMenu;
    setShowNotificationMenu(nextState);
    if (showUserMenu) setShowUserMenu(false);

    if (nextState) {
      // 1. Tải danh sách thông báo mới nhất
      setIsLoadingNotifications(true);
      try {
        const res = await notificationApi.getMyNotifications(1, 6);
        setRecentNotifications(res.items || []);
      } catch {
        setRecentNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }

      // 2. Mark all as read giống Facebook: Xóa số badge ngay tức khắc và gọi backend
      if (unreadCount > 0) {
        setUnreadCount(0);
        notificationApi.markAllAsRead().catch(() => {});
        setRecentNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, read: true }))
        );
        window.dispatchEvent(new CustomEvent('devradar:notifications-read'));
      }
    }
  };

  const handleNotificationItemClick = (notif: NotificationItem) => {
    setShowNotificationMenu(false);
    const target = notif.targetUrl || notif.link || '/notifications';
    navigate(target);
  };

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
      case 'Like':
        return <AppIcon name="heart" size={14} className="text-status-danger" />;
      case 'comment':
      case 'Comment':
        return <AppIcon name="message" size={14} className="text-brand-secondary" />;
      case 'mention':
        return <AppIcon name="atSign" size={14} className="text-brand-primary" />;
      case 'system':
        return <AppIcon name="sparkles" size={14} className="text-status-warning" />;
      case 'report_resolved':
      case 'ModerationAlert':
        return <AppIcon name="shieldCheck" size={14} className="text-status-success" />;
      default:
        return <AppIcon name="bell" size={14} className="text-brand-primary" />;
    }
  };

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
              <Button
                variant="primary"
                size="sm"
                icon="plus"
                tooltip="Soạn và xuất bản bài viết công nghệ mới"
              >
                Viết bài
              </Button>
            </Link>

            {/* Notifications Bell Dropdown (Giống Facebook) */}
            <div className="relative" ref={notificationMenuRef}>
              <Tooltip
                content={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}
                position="bottom"
              >
                <button
                  type="button"
                  onClick={handleToggleNotificationMenu}
                  className={`relative p-2 rounded-btn transition-colors ${
                    showNotificationMenu
                      ? 'bg-surface-elevated text-brand-secondary'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
                  }`}
                  aria-label="Thông báo"
                >
                  <AppIcon name="bell" size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-status-danger text-white text-[10px] font-bold ring-2 ring-surface-card animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Facebook-style Notifications Popover Dropdown */}
              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-card border border-surface-border rounded-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-elevated/40">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text-main">Thông báo</h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-primary/20 text-brand-secondary border border-brand-primary/30">
                        DevRadar
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        notificationApi.markAllAsRead().catch(() => {});
                        setUnreadCount(0);
                        setRecentNotifications((prev) =>
                          prev.map((n) => ({ ...n, isRead: true, read: true }))
                        );
                        window.dispatchEvent(new CustomEvent('devradar:notifications-read'));
                      }}
                      className="text-[11px] font-medium text-brand-secondary hover:underline flex items-center gap-1"
                    >
                      <AppIcon name="checkCheck" size={12} />
                      <span>Đánh dấu đã đọc</span>
                    </button>
                  </div>

                  {/* Dropdown Body: Notification Items */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-surface-border/50">
                    {isLoadingNotifications ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
                        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Đang tải thông báo...</span>
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-text-muted gap-2">
                        <AppIcon name="bellOff" size={24} className="text-text-subtle" />
                        <p className="text-xs">Bạn chưa có thông báo nào mới.</p>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => {
                        const isRead = notif.isRead || notif.read;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationItemClick(notif)}
                            className={`flex items-start gap-3 p-3 text-left transition-colors cursor-pointer ${
                              isRead
                                ? 'hover:bg-surface-elevated/50'
                                : 'bg-brand-primary/5 hover:bg-brand-primary/10'
                            }`}
                          >
                            {/* Avatar / Icon */}
                            <div className="relative shrink-0 mt-0.5">
                              {notif.sender?.avatarUrl ? (
                                <img
                                  src={notif.sender.avatarUrl}
                                  alt={notif.sender.username}
                                  className="w-9 h-9 rounded-full border border-surface-border object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center">
                                  {getNotifIcon(notif.type)}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-surface-card border border-surface-border">
                                {getNotifIcon(notif.type)}
                              </div>
                            </div>

                            {/* Text Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-text-main leading-snug line-clamp-1">
                                {notif.title}
                              </p>
                              <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mt-0.5">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-text-subtle mt-1 inline-block">
                                {notif.createdAt}
                              </span>
                            </div>

                            {/* Unread dot */}
                            {!isRead && (
                              <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-2" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-2 border-t border-surface-border bg-surface-elevated/20 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotificationMenu(false)}
                      className="block w-full py-1.5 text-xs font-semibold text-brand-secondary hover:text-brand-light transition-colors"
                    >
                      Xem tất cả trong Thông báo →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar & Profile Dropdown */}
            <div className="relative pl-2 border-l border-surface-border" ref={userMenuRef}>
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
