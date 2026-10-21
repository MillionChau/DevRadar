import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TechTagBadge, ToxicityBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { AppIcon } from '../../components/common/Icon';
import { Post } from '../../types';
import { communityApi } from '../../api';

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const res = await communityApi.getMyBookmarks();
      setBookmarks(res.items || []);
    } catch (err) {
      console.warn('Could not load live bookmarks:', err);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (postId: string) => {
    setBookmarks(prev => prev.filter(p => p.id !== postId));
    try {
      await communityApi.toggleBookmarkPost(postId);
    } catch (err) {
      console.warn('Error removing bookmark on server:', err);
    }
  };

  // Trích xuất danh sách TechZone xuất hiện trong bookmarks
  const categoryMap = new Map<string, string>();
  bookmarks.forEach(p => {
    const slug = p.techZone?.slug || 'other';
    const name = p.techZone?.name || 'Khác';
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, name);
    }
  });

  const filtered = bookmarks.filter(p => {
    if (activeCategory === 'all') return true;
    return (p.techZone?.slug || 'other') === activeCategory;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <AppIcon name="BookmarkCheck" size={24} className="text-brand-secondary" />
            Bài viết đã lưu
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Thư viện lưu trữ các bài viết kỹ thuật, kiến trúc microservices và báo cáo hiệu năng chuyên sâu của bạn.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-elevated text-text-muted border border-surface-border self-start sm:self-auto">
          {bookmarks.length} bài đã lưu
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-brand-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-elevated/80'
          }`}
        >
          Tất cả ({bookmarks.length})
        </button>
        {Array.from(categoryMap.entries()).map(([slug, name]) => {
          const count = bookmarks.filter(p => (p.techZone?.slug || 'other') === slug).length;
          return (
            <button
              key={slug}
              onClick={() => setActiveCategory(slug)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === slug
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-elevated/80'
              }`}
            >
              {name} ({count})
            </button>
          );
        })}
      </div>

      {/* Bookmarked Items */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-card border border-surface-border rounded-xl">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-text-muted">Đang tải danh sách bài viết đã lưu...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="Bookmark"
          title="Chưa có bài viết nào được lưu"
          description={
            activeCategory === 'all'
              ? 'Bạn chưa lưu bài viết nào. Hãy khám phá bảng tin cộng đồng để tìm kiếm và đánh dấu các tài liệu kỹ thuật hữu ích.'
              : 'Không có bài viết đã lưu nào thuộc danh mục này.'
          }
          actionLabel="Khám phá bảng tin"
          onAction={() => {
            window.location.href = '/';
          }}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(post => {
            const zoneColor = post.techZone?.color || '#2563EB';
            const zoneName = post.techZone?.name || 'General';
            return (
              <Card key={post.id} variant="surface" className="group hover:border-brand-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded border"
                        style={{
                          borderColor: `${zoneColor}40`,
                          color: zoneColor,
                          backgroundColor: `${zoneColor}15`
                        }}
                      >
                        {zoneName}
                      </span>
                      <ToxicityBadge score={post.toxicityScore} />
                      <span className="text-xs text-text-subtle">
                        Saved from @{post.author.username || post.author.userName}
                      </span>
                    </div>

                    <Link to={`/posts/${post.id}`}>
                      <h2 className="text-lg font-semibold text-text-main group-hover:text-brand-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                      {post.contentSnippet || post.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {post.tags.map(tag => (
                        <TechTagBadge key={tag} tag={tag} />
                      ))}
                    </div>

                    <div className="flex items-center gap-4 pt-2 text-xs text-text-subtle">
                      <span className="flex items-center gap-1">
                        <AppIcon name="Heart" size={14} className="text-status-danger" />
                        {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <AppIcon name="MessageSquare" size={14} />
                        {post.commentCount} comments
                      </span>
                      {post.qualityScore && (
                        <span className="flex items-center gap-1">
                          <AppIcon name="Activity" size={14} className="text-brand-secondary" />
                          Quality {post.qualityScore}/100
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="BookmarkCheck"
                      className="text-brand-primary hover:text-status-danger hover:bg-status-danger/10"
                      title="Remove bookmark"
                      onClick={() => handleRemoveBookmark(post.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
