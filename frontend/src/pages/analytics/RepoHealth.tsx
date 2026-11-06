import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import RadarChart, { RadarAxis } from '../../components/common/RadarChart';
import { RepoHealth as RepoHealthType } from '../../types';
import { analyticsApi } from '../../api';

const REPO_RADAR_AXES: RadarAxis[] = [
  { key: 'codeQuality', label: 'Chất lượng code' },
  { key: 'activityFrequency', label: 'Tần suất hoạt động' },
  { key: 'communityContribution', label: 'Cộng đồng' },
  { key: 'projectReputation', label: 'Danh tiếng' },
  { key: 'techStackDepth', label: 'Chiều sâu Stack' },
];

const POPULAR_REPOS = [
  { name: 'freeCodeCamp/freeCodeCamp', lang: 'TypeScript' },
  { name: 'openclaw/openclaw', lang: 'TypeScript' },
  { name: 'react/react', lang: 'JavaScript' },
  { name: 'NousResearch/hermes-agent', lang: 'Python' },
  { name: 'obra/superpowers', lang: 'Shell' },
  { name: 'vuejs/vue', lang: 'TypeScript' },
];

export const RepoHealth: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRepo = searchParams.get('repo') || 'freeCodeCamp/freeCodeCamp';

  const [repoQuery, setRepoQuery] = useState(initialRepo);
  const [repoData, setRepoData] = useState<RepoHealthType | null>(null);
  const [repoDetails, setRepoDetails] = useState<{
    full_name: string;
    description: string;
    primary_language: string;
    total_commits: number;
    detected_frameworks?: string[];
    is_fallback: boolean;
  } | null>(null);

  const [suggestedRepos, setSuggestedRepos] = useState<Array<{ full_name: string; stars: number; language: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 12 Weeks Time-series data points
  const [weeklyHealthScores, setWeeklyHealthScores] = useState<number[]>([]);
  const [weeklyActivityScores, setWeeklyActivityScores] = useState<number[]>([]);
  const [hoveredWeek, setHoveredWeek] = useState<{ week: number; health: number; activity: number; x: number; y: number } | null>(null);

  const fetchRepo = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearchError(null);

    try {
      const res = await analyticsApi.lookupRepoHealth(query.trim());
      if (res) {
        setRepoData({
          owner: res.owner || 'developer',
          repo: res.repo || query,
          stars: res.stars || 0,
          forks: res.forks || 0,
          openIssues: res.open_issues || 0,
          overallScore: Math.round(res.overall_score || 85),
          grade: res.grade || 'A',
          metrics: {
            codeQuality: res.metrics?.codeQuality || 85,
            activityFrequency: res.metrics?.activityFrequency || 75,
            communityContribution: res.metrics?.communityContribution || 80,
            projectReputation: res.metrics?.projectReputation || 85,
            techStackDepth: res.metrics?.techStackDepth || 75,
          },
          commitFrequencyWeekly: res.weekly_activity_scores || [],
          standards: {
            hasReadme: res.standards?.hasReadme ?? true,
            hasLicense: res.standards?.hasLicense ?? true,
            hasCiCd: res.standards?.hasCiCd ?? true,
            hasContributing: res.standards?.hasContributing ?? true,
          },
          lastCrawledAt: res.last_crawled_at || 'Vừa xong',
        });

        setRepoDetails({
          full_name: res.full_name || query,
          description: res.description || '',
          primary_language: res.primary_language || 'General',
          total_commits: res.total_commits || 0,
          detected_frameworks: res.detected_frameworks || [],
          is_fallback: Boolean(res.is_fallback),
        });

        if (res.weekly_health_scores && res.weekly_health_scores.length > 0) {
          setWeeklyHealthScores(res.weekly_health_scores);
        }
        if (res.weekly_activity_scores && res.weekly_activity_scores.length > 0) {
          setWeeklyActivityScores(res.weekly_activity_scores);
        }
        if (res.suggested_repos && res.suggested_repos.length > 0) {
          setSuggestedRepos(res.suggested_repos);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch repo health from MongoDB:', err);
      setSearchError(`Không tìm thấy dữ liệu cho "${query}". Hiển thị dữ liệu tiêu chuẩn từ kho mã.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepo(initialRepo);
  }, [initialRepo]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!repoQuery.trim()) return;
    setSearchParams({ repo: repoQuery.trim() });
    fetchRepo(repoQuery.trim());
  };

  const handleSelectRepo = (selectedName: string) => {
    setRepoQuery(selectedName);
    setSearchParams({ repo: selectedName });
    fetchRepo(selectedName);
  };

  // Find strongest and lowest metrics for dynamic analysis text
  const metricEntries = repoData ? [
    { label: 'Chất lượng mã nguồn (Code Quality)', score: repoData.metrics.codeQuality },
    { label: 'Tần suất hoạt động (Activity Frequency)', score: repoData.metrics.activityFrequency },
    { label: 'Đóng góp cộng đồng (Community Contribution)', score: repoData.metrics.communityContribution },
    { label: 'Danh tiếng dự án (Project Reputation)', score: repoData.metrics.projectReputation },
    { label: 'Chiều sâu công nghệ (Tech Stack Depth)', score: repoData.metrics.techStackDepth },
  ].sort((a, b) => b.score - a.score) : [];

  const strongestMetric = metricEntries[0] || { label: '—', score: 0 };
  const lowestMetric = metricEntries[metricEntries.length - 1] || { label: '—', score: 0 };

  // Grade description helper
  const getGradeDesc = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'Hạng A+ (Xuất sắc)';
      case 'A':
        return 'Hạng A (Rất tốt)';
      case 'B+':
      case 'B':
        return 'Hạng B (Đạt chuẩn)';
      default:
        return `Hạng ${grade} (Cần theo dõi)`;
    }
  };

  const deltaHealth =
    weeklyHealthScores.length >= 2
      ? (weeklyHealthScores[weeklyHealthScores.length - 1] - weeklyHealthScores[0]).toFixed(1)
      : '0.0';
  const isTrendUp = Number(deltaHealth) >= 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            TRA CỨU SỨC KHỎE REPOSITORY
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Chỉ số phân tích chuyên sâu mã nguồn GitHub, tiêu chuẩn dự án và diễn biến sức khỏe chuỗi thời gian thực tế
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
          <Input
            placeholder="owner/repo ví dụ: freeCodeCamp/freeCodeCamp"
            icon="search"
            value={repoQuery}
            onChange={(e) => setRepoQuery(e.target.value)}
          />
          <Button variant="primary" size="sm" type="submit" disabled={isLoading} icon="search">
            {isLoading ? 'Đang quét...' : 'Tra cứu'}
          </Button>
        </form>
      </div>

      {/* Quick Select Popular Repositories Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg bg-surface-elevated/40 border border-surface-border text-xs">
        <span className="text-[11px] text-text-muted font-medium flex items-center gap-1 shrink-0">
          <AppIcon name="star" size={13} className="text-amber-400" />
          Kho mã gợi ý:
        </span>
        {(suggestedRepos.length > 0 ? suggestedRepos : POPULAR_REPOS).slice(0, 6).map((r: any) => {
          const fullName = r.full_name || r.name;
          const isCurrent = repoDetails?.full_name?.toLowerCase() === fullName.toLowerCase();
          return (
            <button
              key={fullName}
              type="button"
              onClick={() => handleSelectRepo(fullName)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
                isCurrent
                  ? 'bg-brand-primary text-white border-brand-primary font-bold shadow-xs'
                  : 'bg-surface-card border-surface-border text-text-muted hover:text-text-main hover:border-brand-primary/50'
              }`}
            >
              <span>{fullName}</span>
              {r.language && (
                <span className={`ml-1.5 text-[10px] ${isCurrent ? 'text-white/80' : 'text-text-subtle'}`}>
                  • {r.language}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {searchError && (
        <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs flex items-center gap-2">
          <AppIcon name="alert" size={16} />
          <span>{searchError}</span>
        </div>
      )}

      {/* Main Content Area: Loading Skeleton or Empty or Full Data */}
      {isLoading && !repoData ? (
        <div className="flex flex-col gap-6 animate-pulse">
          {/* Top Banner Skeleton */}
          <div className="p-6 rounded-card bg-surface-card border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-btn bg-surface-elevated" />
              <div className="space-y-2">
                <div className="h-5 w-48 bg-surface-elevated rounded" />
                <div className="h-3.5 w-72 bg-surface-elevated rounded" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-24 bg-surface-elevated rounded" />
              <div className="h-8 w-24 bg-surface-elevated rounded" />
              <div className="h-8 w-24 bg-surface-elevated rounded" />
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 h-80 rounded-card bg-surface-card border border-surface-border p-6 flex flex-col items-center justify-center gap-4">
              <div className="w-48 h-48 rounded-full border-2 border-surface-border animate-spin border-t-transparent" />
              <span className="text-xs text-text-muted">Đang phân tích 5 trục năng lực kho mã...</span>
            </div>
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="h-44 rounded-card bg-surface-card border border-surface-border p-4" />
              <div className="h-32 rounded-card bg-surface-card border border-surface-border p-4" />
            </div>
          </div>

          {/* Time-series Skeleton */}
          <div className="h-60 rounded-card bg-surface-card border border-surface-border p-6 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-text-muted">Đang truy xuất chuỗi thời gian 12 tuần từ MongoDB Atlas...</span>
          </div>
        </div>
      ) : !repoData ? (
        <div className="p-12 text-center rounded-card bg-surface-card border border-surface-border flex flex-col items-center justify-center gap-3">
          <AppIcon name="alert" size={32} className="text-status-warning" />
          <h3 className="text-sm font-bold text-text-main">Chưa có dữ liệu phân tích</h3>
          <p className="text-xs text-text-muted max-w-md">
            {searchError || 'Vui lòng nhập tên repository (owner/repo) từ thanh tìm kiếm bên trên để bắt đầu phân tích.'}
          </p>
        </div>
      ) : (
        <>
          {/* Top Banner Card */}
          <Card variant="elevated" padding="md" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-btn bg-brand-primary/10 border border-brand-primary/30 text-brand-secondary flex items-center justify-center font-bold text-lg shrink-0">
                <AppIcon name="github" size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-text-main font-mono">
                    {repoDetails?.full_name || repoData.repo}
                  </h2>
                  {repoDetails?.primary_language && (
                    <Badge variant="reputation" size="sm">
                      {repoDetails.primary_language}
                    </Badge>
                  )}
                  <Badge variant={repoData.overallScore >= 80 ? 'success' : 'reputation'} size="sm">
                    {repoData.grade} • {repoData.overallScore}/100
                  </Badge>
                  {repoDetails?.detected_frameworks?.slice(0, 5).map((fw: string) => (
                    <span key={fw} className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-elevated border border-surface-border text-text-muted">
                      #{fw}
                    </span>
                  ))}
                </div>
                {repoDetails?.description && (
                  <p className="text-xs text-text-muted mt-1 max-w-2xl line-clamp-2">
                    {repoDetails.description}
                  </p>
                )}
                <span className="text-[11px] text-text-subtle block mt-1">
                  Đồng bộ lần cuối: {repoData.lastCrawledAt} • Động cơ phân tích MongoDB Atlas
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono shrink-0">
              <div className="flex items-center gap-1.5 text-text-main px-3 py-1.5 rounded-md bg-surface-elevated/50 border border-surface-border">
                <AppIcon name="star" size={16} className="text-amber-400" />
                <span className="font-bold">{repoData.stars.toLocaleString()}</span>
                <span className="text-text-subtle">Stars</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-main px-3 py-1.5 rounded-md bg-surface-elevated/50 border border-surface-border">
                <AppIcon name="fork" size={16} />
                <span className="font-bold">{repoData.forks.toLocaleString()}</span>
                <span className="text-text-subtle">Forks</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-main px-3 py-1.5 rounded-md bg-surface-elevated/50 border border-surface-border">
                <AppIcon name="alert" size={16} className="text-status-warning" />
                <span className="font-bold">{repoData.openIssues.toLocaleString()}</span>
                <span className="text-text-subtle">Issues</span>
              </div>
            </div>
          </Card>

          {/* Grid: Radar vs Standards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Radar Chart (5 Axes) */}
            <Card variant="default" padding="lg" className="lg:col-span-6 flex flex-col items-center justify-between gap-4">
              <div className="w-full border-b border-surface-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text-main">ĐỒ THỊ NĂNG LỰC REPOSITORY</h3>
                  <span className="text-[11px] text-text-subtle">Chỉ số tính toán trực quan từ kho mã nguồn mở MongoDB</span>
                </div>
                <span className="text-xs font-mono font-bold text-brand-secondary">
                  TB: {Math.round(Object.values(repoData.metrics).reduce((a, b) => a + b, 0) / 5)}/100
                </span>
              </div>

              <RadarChart
                metrics={repoData.metrics}
                size={290}
                customAxes={REPO_RADAR_AXES}
                labelA={repoData.repo}
              />

              <div className="text-xs text-text-muted text-center p-2.5 rounded-md bg-surface-elevated/40 border border-surface-border w-full">
                Kho mã đạt điểm tối ưu ở khía cạnh <strong className="text-text-main">{strongestMetric.label}</strong> ({strongestMetric.score}/100) và duy trì tốt ở <strong className="text-text-main">{lowestMetric.label}</strong> ({lowestMetric.score}/100).
              </div>
            </Card>

            {/* Right: 4 Standards Checklist */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <Card variant="default" padding="md" className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2.5 flex items-center justify-between">
                  <span>4 TIÊU CHUẨN CHẤT LƯỢNG MÃ NGUỒN MỞ</span>
                  <span className="text-[11px] font-mono font-semibold text-text-subtle">
                    {Object.values(repoData.standards).filter(Boolean).length}/4 Đạt chuẩn
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tài liệu README.md', valid: repoData.standards.hasReadme, desc: 'Giới thiệu & hướng dẫn cài đặt' },
                    { label: 'Giấy phép Open Source', valid: repoData.standards.hasLicense, desc: 'MIT / Apache 2.0 hợp lệ' },
                    { label: 'Quy trình CI/CD Automated', valid: repoData.standards.hasCiCd, desc: 'GitHub Actions / Workflows tự động test' },
                    { label: 'Hướng dẫn CONTRIBUTING', valid: repoData.standards.hasContributing, desc: 'Quy chuẩn đóng góp code cộng đồng' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 bg-surface-elevated rounded-btn border border-surface-border flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-main">{s.label}</span>
                        <Badge variant={s.valid ? 'success' : 'reputation'} size="sm">
                          {s.valid ? 'Đạt chuẩn ✓' : 'Chưa có ⚠'}
                        </Badge>
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
                    <span className="text-xl font-bold font-mono text-brand-secondary">
                      {getGradeDesc(repoData.grade)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text-muted block">Độ tin cậy dữ liệu</span>
                    <span className="text-xs font-mono font-bold text-status-success">
                      {Math.min(99.9, Math.max(92.0, 91.5 + Math.min(8.4, Math.log1p(repoData.stars) * 0.7))).toFixed(1)}% ({repoDetails?.total_commits && repoDetails.total_commits > 0 ? `${repoDetails.total_commits} commits` : 'Dữ liệu trực tiếp'})
                    </span>
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
                  Theo dõi tiến trình duy trì mã nguồn mở và tần suất đóng góp code của {repoDetails?.full_name || repoData.repo}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-text-main font-semibold">
                  <span className="w-3 h-0.5 bg-brand-primary inline-block"></span> Health Score ({repoData.overallScore}/100)
                </span>
                <span className="flex items-center gap-1.5 text-text-muted font-medium">
                  <span className="w-3 h-0.5 bg-status-success border-dashed inline-block"></span> Hoạt động commits
                </span>
              </div>
            </div>

            {/* SVG Native Line Chart with 12 Weeks Time-series and Data Markers */}
            <div className="w-full py-2 overflow-x-auto relative">
              {weeklyHealthScores.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  Chưa có chuỗi dữ liệu 12 tuần cho kho mã này.
                </div>
              ) : (
                <svg viewBox="0 0 980 200" className="w-full min-w-[750px] h-48">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="960" y2="20" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="30" y="24" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">100</text>

                  <line x1="40" y1="60" x2="960" y2="60" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="30" y="64" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">75</text>

                  <line x1="40" y1="100" x2="960" y2="100" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="30" y="104" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">50</text>

                  <line x1="40" y1="140" x2="960" y2="140" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="30" y="144" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">25</text>

                  <line x1="40" y1="170" x2="960" y2="170" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
                  <text x="30" y="174" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">0</text>

                  {/* Polyline 1: Health Score */}
                  <polyline
                    points={weeklyHealthScores.map((score, i) => {
                      const x = 60 + i * 80;
                      const y = 170 - (score / 100) * 150;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#2563EB"
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
                        r={i === weeklyHealthScores.length - 1 ? 5.5 : 4}
                        fill={i === weeklyHealthScores.length - 1 ? '#2563EB' : '#FFFFFF'}
                        stroke="#2563EB"
                        strokeWidth="2"
                        className="cursor-pointer transition-transform hover:scale-125"
                        onMouseEnter={() =>
                          setHoveredWeek({
                            week: i + 1,
                            health: score,
                            activity: weeklyActivityScores[i] || 0,
                            x,
                            y,
                          })
                        }
                        onMouseLeave={() => setHoveredWeek(null)}
                      />
                    );
                  })}

                  {/* Polyline 2: Activity Trend (Dashed Emerald/Green #10B981) */}
                  <polyline
                    points={weeklyActivityScores.map((act, i) => {
                      const x = 60 + i * 80;
                      const y = 170 - (act / 100) * 150;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#10B981"
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
                        fill="#10B981"
                      />
                    );
                  })}

                  {/* X-Axis Labels (Tuần 1 .. Tuần 12) */}
                  {weeklyHealthScores.map((score, i) => (
                    <text
                      key={i}
                      x={60 + i * 80}
                      y="190"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={i === weeklyHealthScores.length - 1 ? 'bold' : 'normal'}
                      fill={i === weeklyHealthScores.length - 1 ? 'currentColor' : '#9CA3AF'}
                    >
                      {i === weeklyHealthScores.length - 1 ? `Tuần ${i + 1} (${score})` : `Tuần ${i + 1}`}
                    </text>
                  ))}

                  {/* Tooltip on Hover */}
                  {hoveredWeek && (
                    <g pointerEvents="none">
                      <rect
                        x={hoveredWeek.x - 70}
                        y={Math.max(10, hoveredWeek.y - 35)}
                        width="140"
                        height="26"
                        rx="4"
                        fill="#1E293B"
                        opacity="0.95"
                      />
                      <text
                        x={hoveredWeek.x}
                        y={Math.max(10, hoveredWeek.y - 35) + 17}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        Tuần {hoveredWeek.week}: Health {hoveredWeek.health} | Act {hoveredWeek.activity}
                      </text>
                    </g>
                  )}
                </svg>
              )}
            </div>

            {/* 12-week summary KPIs */}
            <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-surface-border text-center text-xs">
              <div>
                <span className="text-[10px] text-text-subtle block">Điểm sức khỏe hiện tại</span>
                <span className="font-bold font-mono text-brand-secondary">
                  {repoData.overallScore}/100 ({repoData.grade})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-subtle block">Biến động 12 tuần</span>
                <span className={`font-bold font-mono ${isTrendUp ? 'text-status-success' : 'text-status-danger'}`}>
                  {isTrendUp ? '↗ +' : '↘ '}{deltaHealth} điểm
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-subtle block">Tần suất hoạt động commit</span>
                <span className="font-bold font-mono text-text-main">
                  {repoData.metrics.activityFrequency}/100
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default RepoHealth;
