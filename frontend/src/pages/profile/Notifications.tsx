import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { AppIcon } from '../../components/common/Icon';
import { NotificationItem } from '../../types';

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'like',
    title: 'New Like on your benchmark article',
    message: 'Sarah Jenkins liked "Deep Dive into .NET 9 Native AOT Performance".',
    isRead: false,
    read: false,
    createdAt: '10 minutes ago',
    targetUrl: '/posts/post-2',
    sender: {
      id: 'u-102',
      username: 'sarah_j',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces'
    }
  },
  {
    id: 'notif-2',
    type: 'comment',
    title: 'New discussion reply',
    message: 'Alex Turner commented: "Have you tested cold-start latencies with 512MB RAM constraints?"',
    isRead: false,
    read: false,
    createdAt: '45 minutes ago',
    targetUrl: '/posts/post-2',
    sender: {
      id: 'u-101',
      username: 'alex_turner',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    }
  },
  {
    id: 'notif-3',
    type: 'system',
    title: 'AI Quality Score Milestone',
    message: 'Your article scored 98/100 on the automated Radar Quality & Integrity Index! +50 Reputation awarded.',
    isRead: true,
    read: true,
    createdAt: '2 hours ago',
    targetUrl: '/posts/post-2'
  },
  {
    id: 'notif-4',
    type: 'mention',
    title: 'Mentioned in a discussion',
    message: 'Marcus Kowalski mentioned you in "Migrating 45 Microservices to Kubernetes eBPF Cilium Mesh".',
    isRead: true,
    read: true,
    createdAt: '1 day ago',
    targetUrl: '/posts/post-4',
    sender: {
      id: 'u-104',
      username: 'marcus_k',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
    }
  },
  {
    id: 'notif-5',
    type: 'report_resolved',
    title: 'Content Moderation Resolution',
    message: 'Your report regarding spam comment #8491 was reviewed and accepted by a moderator.',
    isRead: true,
    read: true,
    createdAt: '3 days ago',
    targetUrl: '/posts/post-1'
  }
];

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions' | 'system'>('all');

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id) {
          const nextVal = !(n.isRead || n.read);
          return { ...n, isRead: nextVal, read: nextVal };
        }
        return n;
      })
    );
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
      {filtered.length === 0 ? (
        <EmptyState
          icon="BellOff"
          title="No notifications here"
          description={
            filter === 'unread'
              ? "You're all caught up! No unread notifications right now."
              : 'No notifications found for this filter.'
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
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  isRead
                    ? 'bg-surface-card border-surface-border/60 hover:border-surface-border'
                    : 'bg-surface-elevated/90 border-brand-primary/30 shadow-md shadow-brand-primary/5'
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
                    <Link
                      to={target}
                      className="text-sm font-semibold text-text-main hover:text-brand-primary transition-colors line-clamp-1"
                    >
                      {notif.title}
                    </Link>
                    <span className="text-xs text-text-subtle whitespace-nowrap">
                      {notif.createdAt}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Link
                      to={target}
                      className="text-xs text-brand-secondary hover:underline font-medium flex items-center gap-1"
                    >
                      View details
                      <AppIcon name="ExternalLink" size={12} />
                    </Link>
                    <button
                      onClick={() => handleToggleRead(notif.id)}
                      className="text-xs text-text-subtle hover:text-text-muted"
                    >
                      {isRead ? 'Mark as unread' : 'Mark as read'}
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
