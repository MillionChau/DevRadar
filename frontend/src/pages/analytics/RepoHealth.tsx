import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import RadarChart from '../../components/common/RadarChart';
import { RepoHealth as RepoHealthType } from '../../types';

export const RepoHealth: React.FC = () => {
  const [repoQuery, setRepoQuery] = useState('dotnet/aspnetcore');

  const repoData: RepoHealthType = {
    owner: 'dotnet',
    repo: 'aspnetcore',
    stars: 34500,
    forks: 9200,
    openIssues: 850,
    overallScore: 94,
    grade: 'A+',
    metrics: {
      codeQuality: 96,
      activityFrequency: 94,
      communityContribution: 90,
      projectReputation: 95,
      techStackDepth: 95,
    },
    commitFrequencyWeekly: [45, 60, 52, 78, 65, 82, 90, 75, 88, 92, 85, 96],
    standards: {
      hasReadme: true,
      hasLicense: true,
      hasCiCd: true,
      hasContributing: true,
    },
    lastCrawledAt: '10 phút trước',
  };

  // 12 Weeks Time-series data points for Health Score line chart
  const weeklyHealthScores = [86, 88, 89, 87, 91, 90, 88, 92, 91, 93, 94, 94];
  const weeklyActivityScores = [65, 72, 78, 68, 80, 75, 62, 82, 70, 85, 76, 88];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            TRA CỨU SỨC KHỎE REPOSITORY (SCR-11)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Chỉ số phân tích chuyên sâu mã nguồn GitHub, tiêu chuẩn dự án và diễn biến sức khỏe chuỗi thời gian
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-80">
          <Input
            placeholder="owner/repo (VD: dotnet/aspnetcore)"
            icon="search"
            value={repoQuery}
            onChange={(e) => setRepoQuery(e.target.value)}
          />
          <Button variant="primary" size="sm">
            Tra cứu
          </Button>
        </div>
      </div>

      {/* Top Banner Card */}
      <Card variant="elevated" padding="md" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-btn bg-brand-primary/10 border border-brand-primary/30 text-brand-secondary flex items-center justify-center font-bold text-lg">
            <AppIcon name="github" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-main font-mono">
                {repoData.owner}/{repoData.repo}
              </h2>
              <Badge variant="success" size="sm">A+ {repoData.overallScore}/100</Badge>
            </div>
            <span className="text-xs text-text-subtle">
              Lần quét gần nhất: {repoData.lastCrawledAt} qua GitHub GraphQL Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-text-main">
            <AppIcon name="star" size={16} className="text-amber-400" />
            <span>{repoData.stars.toLocaleString()} Stars</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-main">
            <AppIcon name="fork" size={16} />
            <span>{repoData.forks.toLocaleString()} Forks</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-main">
            <AppIcon name="alert" size={16} className="text-status-warning" />
            <span>{repoData.openIssues} Issues</span>
          </div>
        </div>
      </Card>

      {/* Grid: Radar vs Standards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Radar Chart */}
        <Card variant="default" padding="lg" className="lg:col-span-6 flex flex-col items-center justify-between gap-4">
          <div className="w-full border-b border-surface-border pb-3">
            <h3 className="text-xs font-bold text-text-main">ĐỒ THỊ NĂNG LỰC REPOSITORY (5 TRỤC METRICS)</h3>
            <span className="text-[11px] text-text-subtle">Chỉ số tính toán trực quan từ kho mã nguồn mở</span>
          </div>
          <RadarChart metrics={repoData.metrics} size={280} />
          <div className="text-xs text-text-muted text-center">
            Repository đạt điểm tối ưu ở khía cạnh Chất lượng mã nguồn và Chiều sâu công nghệ.
          </div>
        </Card>

        {/* Right: 4 Standards Checklist */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <Card variant="default" padding="md" className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2.5">
              4 TIÊU CHUẨN CHẤT LƯỢNG MÃ NGUỒN MỞ
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Tài liệu README.md', valid: repoData.standards.hasReadme, desc: 'Giới thiệu & hướng dẫn cài đặt' },
                { label: 'Giấy phép Open Source', valid: repoData.standards.hasLicense, desc: 'MIT / Apache 2.0 hợp lệ' },
                { label: 'Quy trình CI/CD Automated', valid: repoData.standards.hasCiCd, desc: 'GitHub Actions tự động test' },
                { label: 'Hướng dẫn CONTRIBUTING', valid: repoData.standards.hasContributing, desc: 'Quy chuẩn đóng góp code' },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-surface-elevated rounded-btn border border-surface-border flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-main">{s.label}</span>
                    <Badge variant="success" size="sm">Đạt chuẩn ✓</Badge>
                  </div>
                  <span className="text-[11px] text-text-subtle">{s.desc}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="default" padding="md" className="flex flex-col gap-3 justify-between">
            <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2.5">
              ĐÁNH GIÁ CHUNG REPO HEALTH
            </h3>
            <div className="p-4 bg-surface-elevated rounded-btn border border-surface-border flex items-center justify-between">
              <div>
                <span className="text-xs text-text-muted block">Phân hạng tổng thể</span>
                <span className="text-xl font-bold font-mono text-brand-secondary">Hạng A+ (Xuất sắc)</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-muted block">Độ tin cậy dữ liệu</span>
                <span className="text-xs font-mono font-bold text-status-success">99.2% (1,420 commits)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom: Biến động Sức khỏe & Hoạt động (Line Chart - 12 tuần gần nhất per SCR-11 wireframe) */}
      <Card variant="default" padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-text-main">
              Biến động Sức khỏe &amp; Hoạt động (Health Score Over Time - 12 tuần gần nhất)
            </h3>
            <p className="text-xs text-text-subtle">
              Theo dõi tiến trình duy trì mã nguồn mở và xu hướng tương tác quý 3/2026
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-text-main font-semibold">
              <span className="w-3 h-0.5 bg-brand-primary inline-block"></span> Health Score (0 - 100)
            </span>
            <span className="flex items-center gap-1.5 text-text-muted font-medium">
              <span className="w-3 h-0.5 bg-gray-500 border-dashed inline-block"></span> Hoạt động commits
            </span>
          </div>
        </div>

        {/* SVG Native Line Chart with 12 Weeks Time-series and Data Markers */}
        <div className="w-full py-2 overflow-x-auto">
          <svg viewBox="0 0 980 200" className="w-full min-w-[750px] h-48">
            {/* Grid lines */}
            <line x1="40" y1="20" x2="960" y2="20" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
            <text x="30" y="24" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">100</text>

            <line x1="40" y1="60" x2="960" y2="60" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
            <text x="30" y="64" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">75</text>

            <line x1="40" y1="100" x2="960" y2="100" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
            <text x="30" y="104" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">50</text>

            <line x1="40" y1="140" x2="960" y2="140" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
            <text x="30" y="144" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">25</text>

            <line x1="40" y1="170" x2="960" y2="170" stroke="#111827" strokeWidth="1.5" />
            <text x="30" y="174" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">0</text>

            {/* Polyline 1: Health Score (Solid #111827) */}
            <polyline
              points={weeklyHealthScores.map((score, i) => {
                const x = 60 + i * 80;
                const y = 170 - (score / 100) * 150;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#111827"
              strokeWidth="2.5"
            />
            {weeklyHealthScores.map((score, i) => {
              const x = 60 + i * 80;
              const y = 170 - (score / 100) * 150;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={i === 11 ? 5 : 4}
                  fill={i === 11 ? '#111827' : '#FFFFFF'}
                  stroke="#111827"
                  strokeWidth="2"
                />
              );
            })}

            {/* Polyline 2: Activity Trend (Dashed #6B7280) */}
            <polyline
              points={weeklyActivityScores.map((act, i) => {
                const x = 60 + i * 80;
                const y = 170 - (act / 100) * 150;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            {weeklyActivityScores.map((act, i) => {
              const x = 60 + i * 80;
              const y = 170 - (act / 100) * 150;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#6B7280"
                />
              );
            })}

            {/* X-Axis Labels (Tuần 1 .. Tuần 12) */}
            {weeklyHealthScores.map((_, i) => (
              <text
                key={i}
                x={60 + i * 80}
                y="190"
                textAnchor="middle"
                fontSize="11"
                fontWeight={i === 11 ? 'bold' : 'normal'}
                fill={i === 11 ? '#111827' : '#6B7280'}
              >
                {i === 11 ? 'Tuần 12 (94)' : `Tuần ${i + 1}`}
              </text>
            ))}
          </svg>
        </div>
      </Card>
    </div>
  );
};

export default RepoHealth;
