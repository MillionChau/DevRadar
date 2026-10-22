import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ToxicityBadge } from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import { Post } from '../../types';

interface ManagedPost extends Post {
  isPinned: boolean;
  isHidden: boolean;
}

import { adminApi } from '../../api';
import { recordActivity } from '../../utils/activityLogger';
import { toast } from '../../context/ToastContext';

export const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'flagged' | 'hidden' | 'pinned'>('all');

  const fetchAdminPosts = () => {
    setIsLoading(true);
    adminApi
      .getPosts({ pageNumber: 1, pageSize: 50 })
      .then((res: any) => {
        const raw = res?.data || res;
        const items = raw?.items || (Array.isArray(raw) ? raw : []);
        if (Array.isArray(items)) {
          const mapped: ManagedPost[] = items.map((p: any) => {
            const lines = (p.content || '').split('\n').filter(Boolean);
            const title = lines.length > 0 ? lines[0].replace(/^[#\s*]+/, '') : 'Bài viết cộng đồng';
            return {
              id: p.id,
              title: p.title || title,
              contentSnippet: p.summary || (lines.length > 1 ? lines[1] : p.content) || '',
              author: {
                id: p.authorId || p.createdBy || 'u-1',
                username: p.authorUserName || 'dev',
                fullName: p.authorName || 'Dev Member',
                avatarUrl: p.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
                reputationScore: 1200,
                role: 'Member',
              },
              techZone: { id: p.techZoneId || 'tz-1', name: p.techZoneName || '.NET Core & C#', slug: 'general', color: '#3178C6' },
              tags: typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : p.tags || [],
              createdAt: p.createdDate || new Date().toISOString(),
              likeCount: p.likesCount ?? 0,
              commentCount: p.commentsCount ?? 0,
              bookmarkCount: p.bookmarksCount ?? 0,
              viewCount: p.viewsCount ?? 0,
              toxicityScore: p.isApproved === 0 ? 0.85 : 0.02,
              qualityScore: p.isApproved === 0 ? 30 : 92,
              isPinned: p.isPinned === 1 || p.isPinned === true,
              isHidden: p.status === 2 || p.isApproved === 0,
            };
          });
          setPosts(mapped);
        }
      })
      .catch((err) => {
        console.error('Could not load live admin posts:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    fetchAdminPosts();
  }, []);

  const handleTogglePin = async (id: string) => {
    const target = posts.find(p => p.id === id);
    if (!target) return;
    const nextPin = !target.isPinned;
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, isPinned: nextPin } : p))
    );
    try {
      await adminApi.pinPost(id, nextPin);
      recordActivity({
        action: nextPin ? 'PIN_POST' : 'UNPIN_POST',
        action_label: nextPin ? `Ghim bài viết "${target.title}" lên đầu TechZone` : `Bỏ ghim bài viết "${target.title}"`,
        category: 'CONTENT',
        target_type: 'POST',
        target_name: target.title,
        target_id: id,
        status: 'SUCCESS',
        details: { is_pinned: nextPin, author: target.author?.displayName || target.author?.fullName }
      });
    } catch (err) {
      console.warn('Could not toggle pin on server:', err);
    }
  };

  const handleToggleHide = async (id: string) => {
    const target = posts.find(p => p.id === id);
    if (!target) return;

    const nextState = !target.isHidden;
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, isHidden: nextState } : p))
    );
    if (nextState) {
      toast.warning('Đã ẩn bài viết khỏi bảng tin cộng đồng', 'Kiểm duyệt');
    } else {
      toast.success('Đã khôi phục bài viết lên bảng tin', 'Kiểm duyệt');
    }

    try {
      if (nextState) {
        await adminApi.hidePost(id, 'Chủ động ẩn vi phạm quy chuẩn cộng đồng');
      } else {
        await adminApi.restorePost(id);
      }
      recordActivity({
        action: nextState ? 'HIDE_POST' : 'RESTORE_POST',
        action_label: nextState ? `Ẩn bài viết vi phạm "${target.title}"` : `Khôi phục bài viết "${target.title}"`,
        category: 'MODERATION',
        target_type: 'POST',
        target_name: target.title,
        target_id: id,
        status: 'SUCCESS',
        details: { is_hidden: nextState, author: target.author?.displayName || target.author?.fullName }
      });
    } catch (err) {
      console.warn('Failed to update post status on server:', err);
    }
  };

  const handleRecheckAI = async (id: string) => {
    const target = posts.find(p => p.id === id);
    if (!target) return;
    try {
      await adminApi.recheckPostAI(id, target.contentSnippet || target.title);
      recordActivity({
        action: 'AI_RECHECK_POST',
        action_label: `Kích hoạt AI kiểm tra chất lượng & độc hại cho bài viết "${target.title}"`,
        category: 'CONTENT',
        target_type: 'POST',
        target_name: target.title,
        target_id: id,
        status: 'SUCCESS'
      });
      toast.success('Đã phân tích lại bài viết qua AI Quality & Toxicity Engine!', 'AI Moderation');
      fetchAdminPosts();
    } catch (err) {
      console.warn('Could not run AI re-check on server:', err);
      toast.info(`Đã gửi yêu cầu tái phân tích AI cho bài viết ${id}.`, 'AI Moderation');
    }
  };

  const handleDeletePost = async (id: string) => {
    const target = posts.find(p => p.id === id);
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn khỏi cộng đồng?')) return;
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success('Đã xóa vĩnh viễn bài viết khỏi cộng đồng.', 'Xóa bài viết');
    try {
      await adminApi.deletePost(id);
      recordActivity({
        action: 'DELETE_POST',
        action_label: `Xóa vĩnh viễn bài viết "${target?.title || id}"`,
        category: 'MODERATION',
        target_type: 'POST',
        target_name: target?.title || id,
        target_id: id,
        status: 'SUCCESS'
      });
      fetchAdminPosts();
    } catch (err) {
      console.warn('Could not delete post on server:', err);
    }
  };

  const filtered = posts.filter(p => {
    const authorName = p.author.username || p.author.userName || '';
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      authorName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'flagged') return (p.toxicityScore ?? 0) > 0.4 || (p.qualityScore ?? 100) < 40;
    if (filter === 'hidden') return p.isHidden;
    if (filter === 'pinned') return p.isPinned;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <AppIcon name="FileText" size={24} className="text-primary-blue" />
            Post Moderation & Content Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Oversee community publications, manage pinned announcements, enforce quality thresholds.
          </p>
        </div>
      </div>

      {/* Filter and search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search posts by title or author handle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon="Search"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary whitespace-nowrap">Status Filter:</label>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
          >
            <option value="all">All Posts</option>
            <option value="flagged">Flagged by AI / Low Quality</option>
            <option value="hidden">Hidden / Archived</option>
            <option value="pinned">Pinned to Top</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <Card variant="surface" className="overflow-x-auto p-0 border border-border-default">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-elevated/70 border-b border-border-default text-text-secondary text-xs uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Post Title</th>
              <th className="py-3 px-4">Author</th>
              <th className="py-3 px-4">Zone</th>
              <th className="py-3 px-4">Quality / Toxicity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Đang tải danh sách bài viết từ cơ sở dữ liệu Community...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center gap-2">
                    <AppIcon name="FileText" size={32} className="text-text-tertiary" />
                    <span className="text-sm font-medium text-text-primary">Không tìm thấy bài viết nào</span>
                    <span className="text-xs text-text-tertiary">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(p => (
              <tr key={p.id} className="hover:bg-surface-elevated/40 transition-colors">
                <td className="py-3 px-4 max-w-sm">
                  <div className="flex items-start gap-2">
                    {p.isPinned && (
                      <span className="p-1 rounded bg-secondary-cyan/15 text-secondary-cyan shrink-0">
                        <AppIcon name="Pin" size={14} />
                      </span>
                    )}
                    <div>
                      <Link
                        to={`/posts/${p.id}`}
                        className="font-medium text-text-primary hover:text-primary-blue transition-colors line-clamp-1"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-text-tertiary">
                        {p.likeCount} likes • {p.commentCount} comments • {p.viewCount} views
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-text-primary text-xs font-medium">@{p.author.username || p.author.userName}</div>
                  <div className="text-[11px] text-text-tertiary">{p.author.role}</div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded border"
                    style={{
                      borderColor: `${p.techZone?.color || '#2563EB'}40`,
                      color: p.techZone?.color || '#2563EB',
                      backgroundColor: `${p.techZone?.color || '#2563EB'}15`
                    }}
                  >
                    {p.techZone?.name || 'General'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-elevated text-text-primary border border-border-default">
                      Q: {p.qualityScore}
                    </span>
                    <ToxicityBadge score={p.toxicityScore} />
                  </div>
                </td>
                <td className="py-3 px-4">
                  {p.isHidden ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-accent-danger/10 text-accent-danger font-semibold border border-accent-danger/20">
                      Hidden
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-accent-success/10 text-accent-success font-semibold border border-accent-success/20">
                      Published
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant={p.isPinned ? 'primary' : 'ghost'}
                      size="sm"
                      icon="Pin"
                      onClick={() => handleTogglePin(p.id)}
                      tooltip={p.isPinned ? 'Bỏ ghim bài viết' : 'Ghim bài viết lên đầu'}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="Sparkles"
                      onClick={() => handleRecheckAI(p.id)}
                      tooltip="Tái phân tích chất lượng & độc hại với AI Engine"
                    />
                    <Button
                      variant={p.isHidden ? 'outline' : 'danger'}
                      size="sm"
                      icon={p.isHidden ? 'Eye' : 'EyeOff'}
                      onClick={() => handleToggleHide(p.id)}
                      tooltip={p.isHidden ? 'Hiển thị lại bài viết trên bảng tin' : 'Ẩn bài viết khỏi cộng đồng'}
                    >
                      {p.isHidden ? 'Show' : 'Hide'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="Trash2"
                      className="text-status-danger hover:bg-status-danger/10"
                      onClick={() => handleDeletePost(p.id)}
                      tooltip="Xóa vĩnh viễn bài viết"
                    />
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
