import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import RadarChart from '../../components/common/RadarChart';
import { useAuth } from '../../context/AuthContext';
import { RadarMetrics } from '../../types';

export const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'repos' | 'radar'>('posts');

  const myMetrics: RadarMetrics = {
    codeQuality: 94,
    activityFrequency: 88,
    communityContribution: 82,
    projectReputation: 90,
    techStackDepth: 96,
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Banner Gradient */}
        <div className="h-36 bg-gradient-to-r from-brand-primary via-indigo-900 to-surface-card border-b border-surface-border relative" />

        {/* User Info Bar */}
        <div className="p-6 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120'}
              alt={user?.displayName}
              className="w-24 h-24 rounded-full border-4 border-surface-card object-cover shadow-xl bg-surface-card"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-text-main">{user?.displayName}</h1>
                <Badge variant="role" size="sm">{user?.role}</Badge>
                <Badge variant="reputation" size="sm">⚡ {user?.reputationPoints} Rep</Badge>
              </div>
              <span className="text-xs text-text-subtle font-mono">@{user?.userName} • HCMUS</span>
              <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
                {user?.bio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon="edit">
              Chỉnh sửa hồ sơ
            </Button>
            <a href={user?.githubProfileUrl || 'https://github.com'} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" icon="github">
                GitHub
              </Button>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 px-6 border-t border-surface-border bg-surface-elevated/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Bài viết của tôi (14)
          </button>
          <button
            onClick={() => setActiveTab('repos')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'repos'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Kho mã nguồn GitHub (6)
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'radar'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Radar Năng lực cá nhân
          </button>
        </div>
      </Card>

      {/* Tab Contents */}
      {activeTab === 'radar' ? (
        <Card variant="default" padding="lg" className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-base font-bold text-text-main">
              BIỂU ĐỒ RADAR NĂNG LỰC CÁ NHÂN (CV SỐNG)
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Điểm năng lực được đồng bộ từ commit history và repository đóng góp trên GitHub
            </p>
          </div>
          <RadarChart metrics={myMetrics} size={320} showLabels={true} />
        </Card>
      ) : activeTab === 'repos' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'DevRadar', desc: 'Mạng xã hội lập trình viên và phân tích năng lực GitHub', lang: 'C# / TypeScript', stars: 142 },
            { name: 'CommunityService', desc: 'Microservice quản lý bài viết và bình luận SignalR', lang: 'C# .NET 10', stars: 68 },
            { name: 'CrawlerGithubService', desc: 'Engine thu thập repository và metrics commit', lang: 'Python FastAPI', stars: 45 },
            { name: 'QualityService', desc: 'Kiểm duyệt tự động qua AI Toxicity HuggingFace', lang: 'Python / RoBERTa', stars: 39 },
          ].map((repo) => (
            <Card key={repo.name} variant="interactive" padding="md" className="flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <AppIcon name="code" size={16} />
                  <h3 className="text-sm font-bold text-text-main hover:text-brand-secondary">{repo.name}</h3>
                </div>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">{repo.desc}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-text-subtle pt-2 border-t border-surface-border">
                <span className="font-mono text-brand-secondary">{repo.lang}</span>
                <span>★ {repo.stars} Stars</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Card variant="interactive" padding="md" className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-text-main">
              Kiến trúc Microservices với .NET 10, YARP Reverse Proxy & PostgreSQL
            </h3>
            <p className="text-xs text-text-muted">
              Chia sẻ kinh nghiệm thiết kế kiến trúc phân tán thực tế cho dự án tốt nghiệp DevRadar...
            </p>
            <div className="flex items-center gap-4 text-xs text-text-subtle pt-2 border-t border-surface-border">
              <span>2 giờ trước</span>
              <span>128 Thích</span>
              <span>24 Bình luận</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
