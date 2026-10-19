import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import RadarChart from '../../components/common/RadarChart';
import { RadarMetrics } from '../../types';

export const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isFollowing, setIsFollowing] = useState(false);

  const publicMetrics: RadarMetrics = {
    codeQuality: 88,
    activityFrequency: 92,
    communityContribution: 85,
    projectReputation: 90,
    techStackDepth: 86,
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-slate-800 to-indigo-950 border-b border-surface-border" />

        <div className="p-6 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120"
              alt="Lê Minh Triết"
              className="w-24 h-24 rounded-full border-4 border-surface-card object-cover shadow-xl bg-surface-card"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-text-main">Lê Minh Triết</h1>
                <Badge variant="reputation" size="sm">⚡ 980 Rep</Badge>
              </div>
              <span className="text-xs text-text-subtle font-mono">@minhtriet_dev • Thành viên DevRadar</span>
              <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
                Python Data Engineer • Chuyên gia thiết kế GitHub Crawler Engine và kiến trúc MongoDB.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isFollowing ? 'secondary' : 'primary'}
              size="sm"
              icon={isFollowing ? 'check' : 'plus'}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </Button>
            <Button variant="outline" size="sm" icon="github">
              GitHub
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid: Public Radar & Pinned Repositories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card variant="default" padding="lg" className="lg:col-span-5 flex flex-col items-center gap-4">
          <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2 w-full">
            RADAR NĂNG LỰC CÔNG KHAI
          </h3>
          <RadarChart metrics={publicMetrics} size={280} />
          <p className="text-xs text-text-subtle text-center">
            Email cá nhân được ẩn theo chính sách bảo mật riêng tư.
          </p>
        </Card>

        {/* Pinned Repos */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-main">
            DỰ ÁN TIÊU BIỂU ĐÃ GHIM (PINNED REPOS)
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <Card variant="interactive" padding="md" className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-main hover:text-brand-secondary">
                  minhtriet/github-graphql-crawler
                </span>
                <Badge variant="tech" size="sm">Python</Badge>
              </div>
              <p className="text-xs text-text-muted">
                Công cụ thu thập tự động commits, PRs và stars từ GitHub API với cơ chế Rate Limiting token pool.
              </p>
              <div className="flex items-center gap-4 text-xs text-text-subtle pt-2 border-t border-surface-border">
                <span>★ 195 Stars</span>
                <span>⑂ 42 Forks</span>
                <span className="text-status-success font-semibold">Repo Health: A+ 92/100</span>
              </div>
            </Card>

            <Card variant="interactive" padding="md" className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-main hover:text-brand-secondary">
                  minhtriet/radar-polygon-renderer
                </span>
                <Badge variant="tech" size="sm">TypeScript</Badge>
              </div>
              <p className="text-xs text-text-muted">
                Thư viện SVG ngũ giác trực quan hóa dữ liệu đa trục siêu nhẹ không phụ thuộc thư viện đồ họa ngoài.
              </p>
              <div className="flex items-center gap-4 text-xs text-text-subtle pt-2 border-t border-surface-border">
                <span>★ 84 Stars</span>
                <span>⑂ 15 Forks</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
