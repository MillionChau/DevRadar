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

const MOCK_ADMIN_POSTS: ManagedPost[] = [
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
      role: 'Member'
    },
    techZone: { id: 'tz-rust', name: 'Rust Ecosystem', slug: 'rust', color: '#f97316' },
    tags: ['rust', 'go', 'performance'],
    createdAt: '2026-03-24T09:15:00Z',
    likeCount: 384,
    commentCount: 42,
    bookmarkCount: 95,
    viewCount: 3120,
    toxicityScore: 0.02,
    qualityScore: 94,
    isPinned: true,
    isHidden: false
  },
  {
    id: 'post-2',
    title: 'Deep Dive into .NET 9 Native AOT: Memory Footprint and Cold-Start Analysis',
    contentSnippet: 'With .NET 9 Native AOT, container startup drops to sub-10ms. Here is the disassembled profile and benchmark harness...',
    author: {
      id: 'u-102',
      username: 'sarah_j',
      fullName: 'Sarah Jenkins',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
      reputationScore: 3450,
      role: 'Moderator'
    },
    techZone: { id: 'tz-dotnet', name: '.NET & C#', slug: 'dotnet', color: '#8b5cf6' },
    tags: ['dotnet', 'aot', 'csharp'],
    createdAt: '2026-03-23T14:30:00Z',
    likeCount: 295,
    commentCount: 31,
    bookmarkCount: 82,
    viewCount: 2450,
    toxicityScore: 0.01,
    qualityScore: 98,
    isPinned: false,
    isHidden: false
  },
  {
    id: 'post-3',
    title: 'BUY CRYPTO NOW! 1000x GUARANTEED AIRDROP TOKEN CLAIM',
    contentSnippet: 'Click link to claim your free reward tokens immediately before snapshot closes...',
    author: {
      id: 'u-105',
      username: 'spam_bot99',
      fullName: 'Crypto Promotion Bot',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      reputationScore: -15,
      role: 'Guest'
    },
    techZone: { id: 'tz-rust', name: 'Rust Ecosystem', slug: 'rust', color: '#f97316' },
    tags: ['crypto', 'airdrop', 'promo'],
    createdAt: '2026-03-25T01:10:00Z',
    likeCount: 0,
    commentCount: 2,
    bookmarkCount: 0,
    viewCount: 15,
    toxicityScore: 0.88,
    qualityScore: 12,
    isPinned: false,
    isHidden: true
  }
];

export const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<ManagedPost[]>(MOCK_ADMIN_POSTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'flagged' | 'hidden' | 'pinned'>('all');

  const handleTogglePin = (id: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, isPinned: !p.isPinned } : p))
    );
  };

  const handleToggleHide = (id: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, isHidden: !p.isHidden } : p))
    );
  };

  const handleRecheckAI = (id: string) => {
    alert(`Triggered Python AI Quality & Toxicity re-analysis worker for post: ${id}`);
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
            {filtered.map(p => (
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
                      title={p.isPinned ? 'Unpin' : 'Pin to top'}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="Sparkles"
                      onClick={() => handleRecheckAI(p.id)}
                      title="Re-run AI Analysis"
                    />
                    <Button
                      variant={p.isHidden ? 'outline' : 'danger'}
                      size="sm"
                      icon={p.isHidden ? 'Eye' : 'EyeOff'}
                      onClick={() => handleToggleHide(p.id)}
                    >
                      {p.isHidden ? 'Show' : 'Hide'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
