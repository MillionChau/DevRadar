import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { AppIcon } from '../../components/common/Icon';
import { NotificationItem } from '../../types';
import { notificationApi } from '../../api';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions' | 'system'>('all');

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationApi.getMyNotifications(1, 50);
      const items = res.items || [];
      const hasUnread = items.some(n => !n.isRead && !n.read);

      // Facebook behavior: Tự động đánh dấu tất cả đã đọc khi người dùng mở trang thông báo
      if (hasUnread) {
        setNotifications(items.map(n => ({ ...n, isRead: true, read: true })));
        notificationApi.markAllAsRead().catch(() => {});
        window.dispatchEvent(new CustomEvent('devradar:notifications-read'));
      } else {
        setNotifications(items);
      }
    } catch (err) {
      console.warn('Could not fetch notifications from backend:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    window.dispatchEvent(new CustomEvent('devradar:notifications-read'));
    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.warn('Error marking all notifications as read:', err);
    }
  };

  const handleToggleRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetNotif = notifications.find(n => n.id === id);
    const wasRead = targetNotif ? (targetNotif.isRead || targetNotif.read) : false;

    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id) {
          const nextVal = !wasRead;
          return { ...n, isRead: nextVal, read: nextVal };
        }
        return n;
      })
    );

    if (!wasRead) {
      try {
        await notificationApi.markAsRead(id);
      } catch (err) {
        console.warn('Error marking notification as read:', err);
      }
    }
  };

  const handleItemClick = (notif: NotificationItem, e: React.MouseEvent) => {
    // Nếu bấm vào nút mark as read riêng lẻ thì không navigate
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    if (!notif.isRead && !notif.read) {
      notificationApi.markAsRead(notif.id).catch(() => {});
    }
    const target = notif.targetUrl || notif.link || '/notifications';
    navigate(target);
  };

  const filtered = notifications.filter(n => {
    const isUnread = !n.isRead && !n.read;
    if (filter === 'unread') return isUnread;
    if (filter === 'mentions') return n.type === 'mention';
    if (filter === 'system') return n.type === 'system' || n.type === 'report_resolved';
    return true;
  });

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
      case 'Like':
        return <AppIcon name="Heart" size={18} className="text-status-danger" />;
      case 'comment':
      case 'Comment':
        return <AppIcon name="MessageSquare" size={18} className="text-brand-secondary" />;
      case 'mention':
        return <AppIcon name="AtSign" size={18} className="text-brand-primary" />;
      case 'system':
        return <AppIcon name="Sparkles" size={18} className="text-status-warning" />;
      case 'report_resolved':
      case 'ModerationAlert':
        return <AppIcon name="ShieldCheck" size={18} className="text-status-success" />;
      default:
        return <AppIcon name="Bell" size={18} className="text-brand-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <AppIcon name="Bell" size={24} className="text-brand-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-xs bg-brand-primary text-white font-bold px-2 py-0.5 rounded-full ml-1">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Stay updated on mentions, responses, reputation gains, and platform notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            icon="CheckCheck"
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-brand-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-elevated/80'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-brand-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-elevated/80'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('mentions')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'mentions'
              ? 'bg-brand-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-elevated/80'
          }`}
        >
          Mentions
        </button>
        <button
          onClick={() => setFilter('system')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'system'
              ? 'bg-brand-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-elevated/80'
          }`}
        >
          System & Quality
        </button>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-card border border-surface-border rounded-xl">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-text-muted">Đang tải thông báo từ máy chủ...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="BellOff"
          title="Không có thông báo nào"
          description={
            filter === 'unread'
              ? "Bạn đã đọc hết mọi thông báo! Không còn thông báo mới."
              : 'Không có thông báo nào phù hợp với bộ lọc này.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => {
            const isRead = notif.isRead || notif.read;
            const target = notif.targetUrl || notif.link || '#';
            return (
              <div
                key={notif.id}
                onClick={(e) => handleItemClick(notif, e)}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                  isRead
                    ? 'bg-surface-card border-surface-border/60 hover:border-surface-border hover:bg-surface-elevated/40'
                    : 'bg-surface-elevated/90 border-brand-primary/30 shadow-md shadow-brand-primary/5 hover:bg-surface-elevated'
                }`}
              >
                {/* Avatar or Icon container */}
                <div className="relative shrink-0">
                  {notif.sender ? (
                    <img
                      src={notif.sender.avatarUrl}
                      alt={notif.sender.username}
                      className="w-10 h-10 rounded-full border border-surface-border object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center">
                      {getNotificationIcon(notif.type)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-surface-card border border-surface-border">
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-text-main hover:text-brand-primary transition-colors line-clamp-1">
                      {notif.title}
                    </span>
                    <span className="text-xs text-text-subtle whitespace-nowrap">
                      {notif.createdAt}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-brand-secondary hover:underline font-medium flex items-center gap-1">
                      Xem chi tiết
                      <AppIcon name="ExternalLink" size={12} />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(notif.id, e)}
                      className="text-xs text-text-subtle hover:text-text-muted"
                    >
                      {isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                    </button>
                  </div>
                </div>

                {/* Unread dot indicator */}
                {!isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
