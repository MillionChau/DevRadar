import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import { analyticsApi } from '../../api';

interface HealthScoreData {
  name: string;
  category: string;
  score: number;
  tier: 'A+' | 'A' | 'B+' | 'B';
  popularity: string;
  trendDelta: string;
  direction: 'up' | 'down' | 'stable';
  prevScore: number;
}

const DEFAULT_SELECTED_LANGS = ['Python', 'TypeScript', 'Go', 'JavaScript', 'Rust'];

const ALL_ECOSYSTEMS = [
  { name: 'Python', color: '#2563EB', tag: 'AI & Data' },
  { name: 'TypeScript', color: '#06B6D4', tag: 'Web & Fullstack' },
  { name: 'Go', color: '#10B981', tag: 'Cloud & Systems' },
  { name: 'JavaScript', color: '#F59E0B', tag: 'Web / Node.js' },
  { name: 'Rust', color: '#EA580C', tag: 'High-Perf Systems' },
  { name: 'C++', color: '#6366F1', tag: 'Embedded & Game' },
  { name: 'Java', color: '#E11D48', tag: 'Enterprise JVM' },
  { name: 'C#', color: '#8B5CF6', tag: 'Enterprise .NET' },
  { name: 'Swift', color: '#FB923C', tag: 'iOS & Apple' },
  { name: 'Kotlin', color: '#C026D3', tag: 'Android & KMP' },
  { name: 'Dart', color: '#0284C7', tag: 'Mobile Flutter' },
  { name: 'Vue', color: '#42B883', tag: 'Frontend Reactive' },
];

export const TechDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(DEFAULT_SELECTED_LANGS);
  const [hiddenLangs, setHiddenLangs] = useState<Set<string>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<{ series: string; month: string; score: number; x: number; y: number } | null>(null);
  const [systemOverview, setSystemOverview] = useState<any>(null);
  const [trendChart, setTrendChart] = useState<any>(null);
  const [isLoadingTrend, setIsLoadingTrend] = useState<boolean>(false);

  React.useEffect(() => {
    analyticsApi
      .getSystemOverview()
      .then((data) => {
        if (data) setSystemOverview(data);
      })
      .catch((err) => {
        console.warn('Could not load system overview, using fallback:', err);
      });

    analyticsApi
      .getTopRepositories(8)
      .then((repos) => {
        if (repos && repos.length > 0) {
          setTopRepos(repos);
        }
      })
      .catch((err) => {
        console.warn('Could not load top repositories, using fallback:', err);
      });
  }, []);

  React.useEffect(() => {
    setIsLoadingTrend(true);
    const langsParam = selectedLangs.length > 0 ? selectedLangs.join(',') : DEFAULT_SELECTED_LANGS.join(',');
    analyticsApi
      .getTrendChart({
        period: timeRange,
        languages: langsParam,
      })
      .then((data) => {
        if (data) {
          setTrendChart(data);
          // Reset hidden langs if selection changed
          setHiddenLangs(new Set());
        }
      })
      .catch((err) => {
        console.warn('Could not load trend chart:', err);
      })
      .finally(() => {
        setIsLoadingTrend(false);
      });
  }, [timeRange, selectedLangs]);

  const toggleSelectLang = (langName: string) => {
    setSelectedLangs((prev) => {
      if (prev.includes(langName)) {
        if (prev.length <= 1) return prev; // Keep at least 1 language
        return prev.filter((l) => l !== langName);
      } else {
        return [...prev, langName];
      }
    });
  };

  const applyPreset = (presetLangs: string[]) => {
    setSelectedLangs(presetLangs);
  };

  const availableEcosystems = React.useMemo(() => {
    if (trendChart?.available_top_languages && trendChart.available_top_languages.length > 0) {
      return trendChart.available_top_languages;
    }
    return ALL_ECOSYSTEMS.map((e) => ({
      name: e.name,
      color: e.color,
      repo_count: 200,
      total_stars: 1000000,
    }));
  }, [trendChart]);

  const toggleLang = (langName: string) => {
    setHiddenLangs((prev) => {
      const next = new Set(prev);
      if (next.has(langName)) {
        next.delete(langName);
      } else {
        if (next.size < (trendChart?.series?.length || 5) - 1) {
          next.add(langName);
        }
      }
      return next;
    });
  };

  const [topRepos, setTopRepos] = useState<any[]>([
    { name: 'dotnet/aspnetcore', stars: '34.5k', forks: '9.2k', health: '96/100', grade: 'A+' },
    { name: 'facebook/react', stars: '228k', forks: '45.1k', health: '95/100', grade: 'A+' },
    { name: 'microsoft/reverse-proxy', stars: '4.8k', forks: '520', health: '91/100', grade: 'A' },
    { name: 'mongodb/mongo-csharp-driver', stars: '2.4k', forks: '710', health: '88/100', grade: 'A' },
  ]);

  // Language & Framework Health Data - mapped dynamically from backend trendChart or systemOverview
  const healthData: HealthScoreData[] = React.useMemo(() => {
    const catMap: Record<string, string> = {
      Python: 'AI & Data Services',
      TypeScript: 'Web & Fullstack',
      Go: 'Cloud Native & Microservices',
      JavaScript: 'Web & Node.js Ecosystem',
      Rust: 'High-Performance Systems',
      'C++': 'Embedded & Game Engine',
      Java: 'Enterprise JVM Platform',
      'C#': 'Enterprise .NET Platform',
      Swift: 'Apple & iOS Ecosystem',
      Kotlin: 'Android & Multiplatform',
      Dart: 'Mobile & Flutter',
      Vue: 'Frontend Reactive',
    };

    if (trendChart?.series && trendChart.series.length > 0) {
      return trendChart.series.slice(0, 4).map((s: any) => {
        const totalStars = s.total_stars ?? 50000;
        const starsText =
          totalStars >= 1000000
            ? `${(totalStars / 1000000).toFixed(1)}M ★`
            : `${(totalStars / 1000).toFixed(0)}k ★`;
        const scoreVal = Math.round(s.current_score ?? 85);
        const tierVal: 'A+' | 'A' | 'B+' | 'B' =
          scoreVal >= 88 ? 'A+' : scoreVal >= 80 ? 'A' : scoreVal >= 70 ? 'B+' : 'B';
        const dir: 'up' | 'down' | 'stable' = s.direction || 'stable';
        const firstPt = s.points && s.points.length > 0 ? s.points[0] : scoreVal;

        return {
          name: `${s.name} (${s.repository_count || 0} Repos)`,
          category: catMap[s.name] || `${s.name} Ecosystem`,
          score: scoreVal,
          tier: tierVal,
          popularity: starsText,
          trendDelta: s.growth || `${dir === 'up' ? '+' : dir === 'down' ? '-' : ''}0.0%`,
          direction: dir,
          prevScore: firstPt,
        };
      });
    }

    if (systemOverview?.top_languages?.length >= 4) {
      const upLangs = new Set(['python', 'typescript', 'rust', 'dart', 'kotlin']);
      const downLangs = new Set(['java', 'c#', 'php', 'ruby']);

      return systemOverview.top_languages.slice(0, 4).map((lang: any, idx: number) => {
        const langName = lang.language || 'Unknown';
        const nameLow = langName.toLowerCase();
        let dir: 'up' | 'down' | 'stable' = 'stable';
        let deltaStr = '+0.5%';
        if (upLangs.has(nameLow)) {
          dir = 'up';
          deltaStr = `+${(4.5 - idx * 0.6).toFixed(1)}%`;
        } else if (downLangs.has(nameLow)) {
          dir = 'down';
          deltaStr = `-${(3.5 - idx * 0.4).toFixed(1)}%`;
        }

        const scoreBase = 88 - idx * 3;
        const totalStars = lang.total_stars ?? 50000;
        const starsText =
          totalStars >= 1000000
            ? `${(totalStars / 1000000).toFixed(1)}M ★`
            : `${(totalStars / 1000).toFixed(0)}k ★`;

        return {
          name: `${langName} (${lang.repo_count} Repos)`,
          category: catMap[langName] || 'Software Ecosystem',
          score: scoreBase,
          tier: scoreBase >= 85 ? 'A+' : 'A',
          popularity: starsText,
          trendDelta: deltaStr,
          direction: dir,
          prevScore: dir === 'up' ? scoreBase - 4 : dir === 'down' ? scoreBase + 3 : scoreBase,
        };
      });
    }

    return [
      {
        name: 'Python (AI Ecosystem)',
        category: 'AI & Data Services',
        score: 89,
        tier: 'A+',
        popularity: '2.4M ★',
        trendDelta: '+5.2%',
        direction: 'up',
        prevScore: 84.1,
      },
      {
        name: 'Go (Cloud Native)',
        category: 'Cloud Native & Microservices',
        score: 86,
        tier: 'A',
        popularity: '980k ★',
        trendDelta: '+0.5%',
        direction: 'stable',
        prevScore: 86.0,
      },
      {
        name: 'Java (Enterprise JVM)',
        category: 'Enterprise JVM Platform',
        score: 82,
        tier: 'A',
        popularity: '1.2M ★',
        trendDelta: '-3.8%',
        direction: 'down',
        prevScore: 85.1,
      },
      {
        name: 'C# (.NET Platform)',
        category: 'Enterprise .NET Platform',
        score: 81,
        tier: 'A',
        popularity: '850k ★',
        trendDelta: '-3.5%',
        direction: 'down',
        prevScore: 84.0,
      },
    ];
  }, [trendChart, systemOverview]);

  const labels: string[] = trendChart?.labels || (timeRange === '30d' ? ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'] : ['T5', 'T6', 'T7', 'T8', 'T9', 'T10']);
  const seriesList = trendChart?.series || [
    { name: 'Python', color: '#2563EB', current_score: 88.7, growth: '+5.2%', direction: 'up', points: [84.1, 85.3, 84.8, 86.7, 87.4, 88.7] },
    { name: 'TypeScript', color: '#06B6D4', current_score: 88.3, growth: '+4.1%', direction: 'up', points: [84.6, 85.5, 86.0, 86.8, 87.2, 88.3] },
    { name: 'Go', color: '#10B981', current_score: 86.4, growth: '+0.5%', direction: 'stable', points: [86.0, 86.8, 85.9, 86.9, 86.1, 86.4] },
    { name: 'Rust', color: '#EA580C', current_score: 81.2, growth: '+5.1%', direction: 'up', points: [76.8, 77.9, 77.4, 79.2, 80.1, 81.2] },
    { name: 'Java', color: '#E11D48', current_score: 81.8, growth: '-3.8%', direction: 'down', points: [85.1, 84.4, 84.8, 83.3, 82.7, 81.8] },
    { name: 'C#', color: '#8B5CF6', current_score: 80.8, growth: '-3.5%', direction: 'down', points: [84.0, 83.2, 83.6, 82.1, 81.5, 80.8] },
  ];

  const activeSeries = seriesList.filter((s: any) => !hiddenLangs.has(s.name));

  const startX = 45;
  const endX = 490;
  const numPts = labels.length;
  const getX = (i: number) => Math.round(startX + (i * (endX - startX)) / Math.max(1, numPts - 1));
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return Math.round(210 - (clamped / 100) * 190);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            Tech Dashboard: Phân tích Xu hướng &amp; Sức khỏe Công nghệ (SCR-10)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi và đối chiếu xu hướng phát triển chuỗi thời gian của các Hệ sinh thái công nghệ hàng đầu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter */}
          <div className="flex items-center gap-1 p-1 bg-surface-card border border-surface-border rounded-btn text-xs">
            {(['30d', '90d', '1y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  timeRange === r
                    ? 'bg-brand-secondary text-brand-dark shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {r === '30d' ? '30 Ngày' : r === '90d' ? '6 Tháng' : '1 Năm'}
              </button>
            ))}
          </div>

          <Link to="/analytics/compare">
            <Button variant="outline" size="sm" icon="radar">
              So sánh đối đầu
            </Button>
          </Link>
        </div>
      </div>

      {/* System KPI Summary Banner from MongoDB Atlas / Crawler Service */}
      {systemOverview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-elevated/40 border border-surface-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
              <AppIcon name="github" size={14} className="text-brand-secondary" />
              Tổng Repositories (DB)
            </span>
            <div className="text-2xl font-bold font-mono text-text-main">
              {systemOverview.total_repositories?.toLocaleString() || '3,331'}
            </div>
            <span className="text-[11px] text-text-subtle">Thu thập & theo dõi tự động</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
              <AppIcon name="layers" size={14} className="text-brand-accent" />
              Ngôn ngữ phân tích
            </span>
            <div className="text-2xl font-bold font-mono text-brand-secondary">
              {systemOverview.total_languages || 63}
            </div>
            <span className="text-[11px] text-text-subtle">Hệ sinh thái công nghệ</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
              <AppIcon name="checkCircle" size={14} className="text-status-success" />
              Kho mã Healthy (Đạt chuẩn)
            </span>
            <div className="text-2xl font-bold font-mono text-status-success">
              {systemOverview.health_distribution?.HEALTHY?.toLocaleString() || '1,498'}
            </div>
            <span className="text-[11px] text-text-subtle">
              {systemOverview.health_distribution?.HEALTHY && systemOverview.total_repositories
                ? `${Math.round((systemOverview.health_distribution.HEALTHY / systemOverview.total_repositories) * 100)}% tổng số kho mã`
                : 'Đang xếp hạng'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
              <AppIcon name="radar" size={14} className="text-amber-400" />
              Token Pool & Jobs
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {systemOverview.token_pool_summary?.active_tokens ?? 1} Active
            </div>
            <span className="text-[11px] text-text-subtle">Smart Rotator đang kích hoạt</span>
          </div>
        </div>
      )}

      {/* KPI Cards: Language / Framework Health Score Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData.map((tech) => (
          <Card key={tech.name} variant="default" padding="md" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-muted">{tech.category}</span>
                <Badge variant={tech.tier === 'A+' ? 'success' : 'reputation'} size="sm">
                  {tech.tier}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-text-main mt-1">{tech.name}</h3>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border flex items-end justify-between">
              <div>
                <span className="text-[11px] text-text-subtle block">Health Score</span>
                <span className="text-2xl font-bold font-mono text-brand-secondary">{tech.score}</span>
                <span className="text-xs text-text-subtle font-mono"> / 100</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-text-subtle block">Popularity Trend</span>
                <span
                  className={`text-xs font-mono font-bold flex items-center justify-end gap-0.5 ${
                    tech.direction === 'up'
                      ? 'text-status-success'
                      : tech.direction === 'down'
                      ? 'text-status-danger'
                      : 'text-brand-secondary'
                  }`}
                >
                  {tech.direction === 'up' ? '↗ ' : tech.direction === 'down' ? '↘ ' : '→ '}
                  {tech.trendDelta}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Ecosystem Selection Bar (Interactive Multi-Select & Presets) */}
      <Card variant="default" padding="md" className="border-brand-primary/30 bg-surface-card shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
              <AppIcon name="layers" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-main">
                  Tùy chọn Hệ sinh thái hiển thị trên Biểu đồ
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-mono font-semibold">
                  {selectedLangs.length} đang chọn
                </span>
              </div>
              <p className="text-[11px] text-text-subtle">
                Bấm vào các thẻ ngôn ngữ bên dưới để thêm/bớt khỏi biểu đồ đường xu hướng. Biểu đồ sẽ tự động vẽ lại theo thời gian thực.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-text-muted font-medium mr-1">Bộ chọn nhanh:</span>
            <button
              type="button"
              onClick={() => applyPreset(DEFAULT_SELECTED_LANGS)}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border border border-surface-border text-text-main font-medium transition-colors"
            >
              Top 5 mặc định
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['Go', 'Rust', 'C++', 'Java', 'C#', 'Python'])}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border border border-surface-border text-text-main font-medium transition-colors"
            >
              Backend &amp; Systems
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['TypeScript', 'JavaScript', 'Vue', 'Dart', 'Swift', 'Kotlin'])}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border border border-surface-border text-text-main font-medium transition-colors"
            >
              Web &amp; Mobile
            </button>
            <button
              type="button"
              onClick={() => applyPreset(availableEcosystems.map((e: any) => e.name))}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border border border-surface-border text-brand-secondary font-medium transition-colors"
            >
              Tất cả ({availableEcosystems.length})
            </button>
          </div>
        </div>

        {/* Multi-Select Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          {availableEcosystems.map((eco: any) => {
            const isSelected = selectedLangs.includes(eco.name);
            return (
              <button
                key={eco.name}
                type="button"
                onClick={() => toggleSelectLang(eco.name)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                  isSelected
                    ? 'bg-surface-card border-brand-primary text-text-main shadow-xs ring-1 ring-brand-primary/30'
                    : 'bg-surface-elevated/40 border-surface-border text-text-muted hover:text-text-main hover:border-text-subtle'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                  style={{ backgroundColor: eco.color }}
                />
                <span className="font-semibold">{eco.name}</span>
                {eco.repo_count ? (
                  <span className="text-[10px] text-text-subtle font-mono">
                    ({eco.repo_count} repos)
                  </span>
                ) : null}
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected
                      ? 'bg-brand-primary text-white'
                      : 'bg-surface-border text-text-muted'
                  }`}
                >
                  {isSelected ? '✓' : '+'}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Section: Line Chart (Popularity Trend & Health Score Over Time) + Right Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Line Chart (SVG Native per DESIGN_SYSTEM 6.2 & SCR-10 Wireframe) */}
        <Card variant="elevated" padding="lg" className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="border-b border-surface-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <AppIcon name="trendingUp" size={16} className="text-brand-primary" />
                Popularity Trend &amp; Health Score Over Time
              </h3>
              <span className="text-[11px] text-text-subtle">
                Phân tích xu hướng phát triển chuỗi thời gian của {selectedLangs.length} Hệ sinh thái đã chọn ({timeRange === '30d' ? '30 ngày' : timeRange === '90d' ? '6 tháng' : '1 năm'}) • Thang đo 0 - 100
              </span>
            </div>
            <div className="text-xs font-mono text-text-muted shrink-0">
              Đang hiển thị <strong className="text-brand-primary">{activeSeries.length}</strong>/{seriesList.length} hệ sinh thái
            </div>
          </div>

          {/* Interactive Multi-Ecosystem Legend with click-to-toggle */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-mono">
            {seriesList.map((s: any) => {
              const isHidden = hiddenLangs.has(s.name);
              return (
                <button
                  key={s.name}
                  onClick={() => toggleLang(s.name)}
                  title={`Click để ${isHidden ? 'hiện' : 'ẩn'} đường ${s.name}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
                    isHidden
                      ? 'bg-surface-elevated/40 border-surface-border text-text-subtle line-through opacity-45'
                      : 'bg-surface-card border-surface-border text-text-main font-semibold shadow-xs hover:border-brand-primary'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: isHidden ? '#9CA3AF' : s.color }}
                  />
                  <span>{s.name}</span>
                  <span className="text-[10px] text-text-subtle font-bold">({s.current_score})</span>
                </button>
              );
            })}
          </div>

          {/* SVG Line Chart */}
          <div className="w-full py-4 overflow-x-auto relative">
            {isLoadingTrend && (
              <div className="absolute inset-0 bg-surface-card/60 backdrop-blur-[1px] flex items-center justify-center z-10 text-xs text-text-muted">
                Đang tải dữ liệu biểu đồ...
              </div>
            )}
            <svg viewBox="0 0 560 250" className="w-full min-w-[500px] h-60">
              {/* Grid Lines */}
              <line x1="35" y1="20" x2="520" y2="20" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              <text x="25" y="24" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">100</text>

              <line x1="35" y1="70" x2="520" y2="70" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              <text x="25" y="74" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">75</text>

              <line x1="35" y1="120" x2="520" y2="120" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              <text x="25" y="124" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">50</text>

              <line x1="35" y1="170" x2="520" y2="170" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              <text x="25" y="174" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">25</text>

              <line x1="35" y1="210" x2="520" y2="210" stroke="#111827" strokeWidth="1.5" />
              <text x="25" y="214" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">0</text>

              {/* X Axis Labels */}
              {labels.map((lbl, idx) => (
                <text
                  key={lbl}
                  x={getX(idx)}
                  y="230"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={idx === numPts - 1 ? 'bold' : 'normal'}
                  fill={idx === numPts - 1 ? '#111827' : '#6B7280'}
                >
                  {lbl}
                </text>
              ))}

              {/* Dynamic Multiple Polylines for Active Ecosystems */}
              {activeSeries.map((s: any) => {
                const pointsStr = s.points.map((val: number, i: number) => `${getX(i)},${getY(val)}`).join(' ');
                const lastX = getX(numPts - 1);
                const lastY = getY(s.points[numPts - 1]);
                return (
                  <g key={s.name}>
                    <polyline
                      points={pointsStr}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {s.points.map((val: number, i: number) => (
                      <circle
                        key={i}
                        cx={getX(i)}
                        cy={getY(val)}
                        r={i === numPts - 1 ? 4.5 : 3}
                        fill={s.color}
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        className="cursor-pointer transition-transform hover:scale-125"
                        onMouseEnter={() =>
                          setHoveredPoint({ series: s.name, month: labels[i], score: val, x: getX(i), y: getY(val) })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                    <text
                      x={lastX + 6}
                      y={lastY + 3}
                      textAnchor="start"
                      fontSize="9"
                      fontWeight="bold"
                      fill={s.color}
                      fontFamily="monospace"
                    >
                      {s.name}
                    </text>
                  </g>
                );
              })}

              {/* Tooltip on Hover */}
              {hoveredPoint && (
                <g pointerEvents="none">
                  <rect
                    x={hoveredPoint.x - 55}
                    y={hoveredPoint.y - 32}
                    width="110"
                    height="24"
                    rx="4"
                    fill="#1E293B"
                    opacity="0.95"
                  />
                  <text
                    x={hoveredPoint.x}
                    y={hoveredPoint.y - 16}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {hoveredPoint.series} ({hoveredPoint.month}): {hoveredPoint.score}
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-surface-border text-center text-xs">
            <div>
              <span className="text-[10px] text-text-subtle block">Hệ sinh thái hàng đầu</span>
              <span className="font-bold font-mono text-brand-secondary">
                {trendChart?.stats?.top_ecosystem?.name || systemOverview?.top_languages?.[0]?.language || 'Python'} (
                {trendChart?.stats?.top_ecosystem?.score || 88.7}/100)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-subtle block">Tăng trưởng cao nhất</span>
              <span className="font-bold font-mono text-status-success">
                {trendChart?.stats?.fastest_growing?.name || 'Python'} ({trendChart?.stats?.fastest_growing?.growth || '+24.0%'})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-subtle block">Tổng mẫu giám sát</span>
              <span className="font-bold font-mono text-text-main">
                {(trendChart?.stats?.total_monitored_repos || systemOverview?.total_repositories || 3339).toLocaleString()} Repositories
              </span>
            </div>
          </div>
        </Card>

        {/* Right: Key Analytics Stats & Quick Links */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Tổng Repos giám sát</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">
                {(trendChart?.stats?.total_monitored_repos || systemOverview?.total_repositories || 3339).toLocaleString()}
              </div>
              <span className="text-[11px] text-status-success mt-1 inline-flex items-center gap-1">
                Đồng bộ MongoDB Atlas
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Commit Frequency (TB)</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">
                {trendChart?.stats?.avg_commit_frequency || 74.8}
              </div>
              <span className="text-[11px] text-brand-secondary mt-1 inline-flex items-center gap-1">
                Độ tích cực cao
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Điểm Sức khỏe TB</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">
                {trendChart?.stats?.avg_health_score || 71.8}
              </div>
              <span className="text-[11px] text-status-success mt-1 inline-flex items-center gap-1">
                {(trendChart?.stats?.avg_health_score || 71.8) >= 80 ? 'Hạng A (Rất tốt)' : 'Hạng B+ (Tốt)'}
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Crawler Jobs đã chạy</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">
                {(trendChart?.stats?.total_crawler_jobs || 233).toLocaleString()}
              </div>
              <span className="text-[11px] text-text-subtle mt-1 inline-flex items-center gap-1">
                Daemon :8000 Online
              </span>
            </Card>
          </div>

          <Card variant="default" padding="md" className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-text-main border-b border-surface-border pb-2">
              TRUY XUẤT NHANH PHÂN TÍCH CHUYÊN SÂU
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/analytics/repo-health" className="flex items-center justify-between p-2.5 rounded-btn bg-surface-elevated hover:bg-surface-border transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <AppIcon name="radar" size={16} />
                  <span className="font-semibold text-text-main">Tra cứu sức khỏe Repository (SCR-11)</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>

              <Link to="/analytics/compare" className="flex items-center justify-between p-2.5 rounded-btn bg-surface-elevated hover:bg-surface-border transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <AppIcon name="layers" size={16} />
                  <span className="font-semibold text-text-main">So sánh đối đầu Dual Radar (SCR-12)</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>

              <Link to="/analytics/reports" className="flex items-center justify-between p-2.5 rounded-btn bg-surface-elevated hover:bg-surface-border transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <AppIcon name="fileText" size={16} />
                  <span className="font-semibold text-text-main">Báo cáo phân tích Whitepaper (SCR-13)</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Top Tracked Repos Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="p-4 bg-surface-elevated/40 border-b border-surface-border font-bold text-xs text-text-muted uppercase tracking-wider flex items-center justify-between">
          <span>DANH SÁCH REPOSITORY NỔI BẬT THEO DÕI</span>
          <Link to="/analytics/repo-health" className="text-brand-secondary hover:underline normal-case text-xs">
            Xem tất cả →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/20 text-text-subtle border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Stars</th>
                <th className="py-3 px-4">Forks</th>
                <th className="py-3 px-4">Điểm Sức khỏe</th>
                <th className="py-3 px-4">Đánh giá</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {topRepos.map((r) => (
                <tr key={r.name} className="hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-text-main">
                    {r.name}
                  </td>
                  <td className="py-3.5 px-4 text-text-muted">★ {r.stars}</td>
                  <td className="py-3.5 px-4 text-text-muted">⑂ {r.forks}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-secondary">
                    {r.health}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="success" size="sm">{r.grade}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link to="/analytics/repo-health">
                      <Button variant="ghost" size="sm">Chi tiết</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TechDashboard;
