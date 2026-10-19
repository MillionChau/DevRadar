import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import { Post } from '../../types';

interface TechHealthItem {
  name: string;
  score: number;
  tier: 'A+' | 'A' | 'B+' | 'B';
  trend: string;
  fillPct: number;
}

export const Newsfeed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'latest' | 'trending' | 'relevant'>('latest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const techHealthList: TechHealthItem[] = [
    { name: '.NET 10 (C#)', score: 95, tier: 'A+', trend: '↗ +4.8%', fillPct: 95 },
    { name: 'Python (FastAPI)', score: 91, tier: 'A', trend: '↗ +3.2%', fillPct: 91 },
    { name: 'Rust (Systems)', score: 93, tier: 'A+', trend: '↗ +5.1%', fillPct: 93 },
    { name: 'Go (Cloud Native)', score: 89, tier: 'A', trend: '→ +0.4%', fillPct: 89 },
    { name: 'TypeScript (React)', score: 86, tier: 'B+', trend: '↘ -1.2%', fillPct: 86 },
  ];

  const posts: Post[] = [
    {
      id: 'post-001',
      title: 'Kiến trúc Microservices với .NET 10, YARP Reverse Proxy & PostgreSQL',
      summary: 'Chia sẻ kinh nghiệm thiết kế kiến trúc phân tán thực tế cho dự án tốt nghiệp DevRadar: Xử lý JWT rotation, Rate limiting và tích hợp kiểm duyệt AI tự động qua Python QualityService.',
      content: '',
      authorId: 'usr-001',
      author: {
        displayName: 'Châu Hoàng Tấn',
        userName: 'chautantan',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
        reputationPoints: 1420,
      },
      techZoneId: 'tz-dotnet',
      techZoneName: '.NET Core & C#',
      tags: ['dotnet10', 'microservices', 'yarp', 'postgres'],
      likeCount: 128,
      commentCount: 24,
      bookmarkCount: 45,
      isLiked: true,
      isBookmarked: false,
      status: 'Published',
      toxicityScore: 0.05,
      createdAt: '2 giờ trước',
    },
    {
      id: 'post-002',
      title: 'Xây dựng GitHub Crawler Engine & Phân tích Radar Chart 5 trục với Python',
      summary: 'Khám phá giải pháp thu thập dữ liệu GitHub qua GraphQL API, tính toán điểm uy tín Repo Health (A+ 94/100) và trực quan hóa năng lực lập trình viên trên đồ thị ngũ giác.',
      content: '',
      authorId: 'usr-002',
      author: {
        displayName: 'Lê Minh Triết',
        userName: 'minhtriet_dev',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100',
        reputationPoints: 980,
      },
      techZoneId: 'tz-crawler',
      techZoneName: 'GitHub & Data Crawler',
      tags: ['python', 'github-api', 'crawler', 'mongodb'],
      likeCount: 96,
      commentCount: 18,
      bookmarkCount: 32,
      isLiked: false,
      isBookmarked: true,
      status: 'Published',
      toxicityScore: 0.02,
      createdAt: '5 giờ trước',
    },
    {
      id: 'post-003',
      title: 'Tích hợp AI HuggingFace để Kiểm duyệt Bình luận Độc hại Real-time trong Community',
      summary: 'Ứng dụng mô hình RoBERTa phân tích chỉ số toxicityScore. Nếu vượt ngưỡng 0.8, tự động chuyển vào Hàng chờ kiểm duyệt AI (SCR-20) để bảo vệ trải nghiệm cộng đồng.',
      content: '',
      authorId: 'usr-003',
      author: {
        displayName: 'Trần Hoài Nam',
        userName: 'namtran_ai',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100',
        reputationPoints: 1150,
      },
      techZoneId: 'tz-ai',
      techZoneName: 'AI Quality & Safety',
      tags: ['huggingface', 'nlp', 'moderation', 'fastapi'],
      likeCount: 84,
      commentCount: 15,
      bookmarkCount: 29,
      isLiked: false,
      isBookmarked: false,
      status: 'Published',
      toxicityScore: 0.01,
      createdAt: '1 ngày trước',
    },
  ];

  const filteredPosts = selectedTag
    ? posts.filter((p) => p.tags.includes(selectedTag))
    : posts;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Center Main Feed (720px equivalent) */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Feed Header & Filter Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('latest')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-btn transition-colors ${
                activeTab === 'latest'
                  ? 'bg-surface-elevated text-brand-secondary border border-surface-border'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Mới nhất
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-btn transition-colors ${
                activeTab === 'trending'
                  ? 'bg-surface-elevated text-brand-secondary border border-surface-border'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Đang thịnh hành
            </button>
            <button
              onClick={() => setActiveTab('relevant')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-btn transition-colors ${
                activeTab === 'relevant'
                  ? 'bg-surface-elevated text-brand-secondary border border-surface-border'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Phù hợp với bạn
            </button>
          </div>

          {selectedTag && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-subtle">Lọc theo:</span>
              <Badge variant="tech" size="sm" onClick={() => setSelectedTag(null)}>
                #{selectedTag} ✕
              </Badge>
            </div>
          )}
        </div>

        {/* Post Cards List */}
        <div className="flex flex-col gap-4">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              variant="interactive"
              padding="md"
              className="flex flex-col gap-3 group"
            >
              {/* Author Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.displayName}
                    className="w-9 h-9 rounded-full border border-surface-border object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-main hover:text-brand-secondary transition-colors">
                        {post.author.displayName}
                      </span>
                      <Badge variant="reputation" size="sm">
                        ⚡ {post.author.reputationPoints} Rep
                      </Badge>
                    </div>
                    <span className="text-[11px] text-text-subtle">
                      {post.createdAt} • trong{' '}
                      <span className="text-brand-secondary/90 font-medium">
                        {post.techZoneName}
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  className="text-text-subtle hover:text-text-main p-1 rounded hover:bg-surface-elevated transition-colors"
                  aria-label="Tùy chọn"
                >
                  <AppIcon name="share" size={14} />
                </button>
              </div>

              {/* Title & Summary */}
              <Link to={`/posts/${post.id}`}>
                <h2 className="text-base font-bold text-text-main group-hover:text-brand-secondary transition-colors leading-snug">
                  {post.title}
                </h2>
              </Link>
              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                {post.summary}
              </p>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="tech"
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Interaction Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-surface-border text-xs text-text-muted">
                <div className="flex items-center gap-4">
                  <button
                    className={`flex items-center gap-1.5 hover:text-status-danger transition-colors ${
                      post.isLiked ? 'text-status-danger font-semibold' : ''
                    }`}
                  >
                    <AppIcon name="heart" size={15} />
                    <span>{post.likeCount} Thích</span>
                  </button>

                  <Link
                    to={`/posts/${post.id}`}
                    className="flex items-center gap-1.5 hover:text-text-main transition-colors"
                  >
                    <AppIcon name="message" size={15} />
                    <span>{post.commentCount} Bình luận</span>
                  </Link>

                  <button
                    className={`flex items-center gap-1.5 hover:text-brand-secondary transition-colors ${
                      post.isBookmarked ? 'text-brand-secondary font-semibold' : ''
                    }`}
                  >
                    <AppIcon name={post.isBookmarked ? 'bookmarkCheck' : 'bookmark'} size={15} />
                    <span>{post.bookmarkCount} Lưu</span>
                  </button>
                </div>

                <Link
                  to={`/posts/${post.id}`}
                  className="text-brand-secondary hover:underline text-xs font-semibold flex items-center gap-1"
                >
                  <span>Chi tiết</span>
                  <AppIcon name="arrowRight" size={12} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Column: Sức khỏe Ngôn ngữ & Framework (SCR-04 Wireframe Standard 350px) */}
      <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-6">
        {/* Tech Health Widget Card */}
        <Card variant="default" padding="md" className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-text-main tracking-tight">
                Sức khỏe Ngôn ngữ & Framework
              </h3>
              <p className="text-[11px] text-text-subtle">
                Phân hóa sức khỏe & độ ổn định 2026
              </p>
            </div>
            <Link to="/dashboard" className="text-brand-secondary hover:underline text-[11px] font-semibold">
              Dashboard →
            </Link>
          </div>

          <div className="flex flex-col gap-3.5">
            {techHealthList.map((item) => (
              <div key={item.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-main">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-text-subtle">{item.trend}</span>
                    <span className="font-mono font-bold text-text-main">{item.score} [{item.tier}]</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary rounded-full transition-all duration-300"
                    style={{ width: `${item.fillPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-text-subtle font-mono">
            <span>● A+ (&gt;90)</span>
            <span>● A (85-89)</span>
            <span>● B+ (80-84)</span>
          </div>

          <Link to="/dashboard" className="w-full">
            <Button variant="secondary" size="sm" className="w-full justify-center">
              Xem phân hóa chi tiết →
            </Button>
          </Link>
        </Card>

        {/* Top Repos Widget (SCR-04 Wireframe) */}
        <Card variant="default" padding="md" className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2.5">
            REPO NỔI BẬT CỦA BẠN
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-xs">
              <Link to="/analytics/repo-health" className="font-bold text-text-main hover:text-brand-secondary">
                MillionChau/DevRadar
              </Link>
              <span className="text-[11px] text-text-subtle">
                ⭐ 95 • Fork 12 • Health: <strong className="text-status-success font-mono">94/100 (A+)</strong>
              </span>
            </div>
            <div className="h-[1px] bg-surface-border" />
            <div className="flex flex-col gap-1 text-xs">
              <Link to="/analytics/repo-health" className="font-bold text-text-main hover:text-brand-secondary">
                MillionChau/Microservices-Hub
              </Link>
              <span className="text-[11px] text-text-subtle">
                ⭐ 48 • Fork 6 • Health: <strong className="text-brand-secondary font-mono">88/100 (A)</strong>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Newsfeed;
