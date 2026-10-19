import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TechTagBadge, ToxicityBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { AppIcon } from '../../components/common/Icon';
import { Post } from '../../types';

const MOCK_BOOKMARKS: Post[] = [
  {
    id: 'post-1',
    title: 'Benchmarking Rust vs Go for High-Throughput Realtime Ingestion Engines',
    contentSnippet: 'In this benchmark, we put Actix-Web, Axum, Gin, and Fiber against an ingestion workload of 250k events/sec...',
    author: {
      id: 'u-101',
      username: 'alex_turner',
      fullName: 'Alex Turner',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      reputationScore: 1420,
      role: 'Member',
      headline: 'Staff Systems Engineer @ CloudPulse'
    },
    techZone: { id: 'tz-rust', name: 'Rust Ecosystem', slug: 'rust', color: '#f97316' },
    tags: ['rust', 'go', 'performance', 'systems'],
    createdAt: '2026-03-24T09:15:00Z',
    likeCount: 384,
    commentCount: 42,
    bookmarkCount: 95,
    viewCount: 3120,
    toxicityScore: 0.02,
    qualityScore: 94
  },
  {
    id: 'post-4',
    title: 'Migrating 45 Microservices to Kubernetes eBPF Cilium Mesh: Complete Postmortem',
    contentSnippet: 'Zero iptables overhead, sub-millisecond MTLS handshake, and dynamic L7 observability pipelines. Here is our journey...',
    author: {
      id: 'u-104',
      username: 'marcus_k',
      fullName: 'Marcus Kowalski',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      reputationScore: 2180,
      role: 'Member',
      headline: 'Principal Cloud Architect'
    },
    techZone: { id: 'tz-k8s', name: 'DevOps & Cloud', slug: 'devops', color: '#0ea5e9' },
    tags: ['kubernetes', 'ebpf', 'cilium', 'devops'],
    createdAt: '2026-03-20T16:00:00Z',
    likeCount: 512,
    commentCount: 68,
    bookmarkCount: 140,
    viewCount: 4890,
    toxicityScore: 0.01,
    qualityScore: 96
  }
];

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Post[]>(MOCK_BOOKMARKS);
  const [activeCategory, setActiveCategory] = useState<'all' | 'rust' | 'devops'>('all');

  const handleRemoveBookmark = (postId: string) => {
    setBookmarks(prev => prev.filter(p => p.id !== postId));
  };

  const filtered = bookmarks.filter(p => {
    if (activeCategory === 'all') return true;
    return p.techZone?.slug === activeCategory;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <AppIcon name="BookmarkCheck" size={24} className="text-brand-secondary" />
            Saved Posts & Bookmarks
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Access your curated library of technical deep-dives, architectures, and benchmarks.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-elevated text-text-muted border border-surface-border self-start sm:self-auto">
          {bookmarks.length} saved articles
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
          All Categories ({bookmarks.length})
        </button>
        <button
          onClick={() => setActiveCategory('rust')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === 'rust'
              ? 'bg-brand-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-elevated/80'
          }`}
        >
          Rust Ecosystem
        </button>
        <button
          onClick={() => setActiveCategory('devops')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === 'devops'
              ? 'bg-brand-primary text-white'
              : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-elevated/80'
          }`}
        >
          DevOps & Cloud
        </button>
      </div>

      {/* Bookmarked Items */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="Bookmark"
          title="No bookmarked posts found"
          description={
            activeCategory === 'all'
              ? "You haven't saved any articles yet. Explore the community newsfeed to find interesting technical reads."
              : 'No saved articles match this category filter.'
          }
          actionLabel="Browse Newsfeed"
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
