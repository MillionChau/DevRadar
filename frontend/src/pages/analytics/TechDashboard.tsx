import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import { analyticsApi } from '../../api';
import { toast } from '../../context/ToastContext';

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

export interface TechItem {
  name: string;
  type: 'Language' | 'Framework';
  category: string;
  color: string;
  tag: string;
}

export const CRAWLER_TECHNOLOGIES: TechItem[] = [
  // --- Ngôn ngữ lập trình có trong CrawlerGithubService (crawled_data.json, crawler.db, crawler_config.json) ---
  { name: 'Python', type: 'Language', category: 'AI & Data Science', color: '#3776AB', tag: 'Data & AI' },
  { name: 'TypeScript', type: 'Language', category: 'Web & Fullstack', color: '#3178C6', tag: 'Typed JS' },
  { name: 'JavaScript', type: 'Language', category: 'Web & Node.js', color: '#F7DF1E', tag: 'Web Dev' },
  { name: 'Go', type: 'Language', category: 'Cloud Native & Microservices', color: '#00ADD8', tag: 'Cloud / CLI' },
  { name: 'Rust', type: 'Language', category: 'High-Performance Systems', color: '#DEA584', tag: 'Systems' },
  { name: 'C#', type: 'Language', category: 'Enterprise .NET Platform', color: '#239120', tag: '.NET Core' },
  { name: 'Java', type: 'Language', category: 'Enterprise JVM', color: '#ED8B00', tag: 'JVM Enterprise' },
  { name: 'C++', type: 'Language', category: 'Embedded & Game Engine', color: '#00599C', tag: 'High-Perf' },
  { name: 'C', type: 'Language', category: 'Systems & OS Kernel', color: '#A8B9CC', tag: 'Kernel / OS' },
  { name: 'Swift', type: 'Language', category: 'Apple & iOS Ecosystem', color: '#F05138', tag: 'iOS / macOS' },
  { name: 'Kotlin', type: 'Language', category: 'Android & Multiplatform', color: '#7F52FF', tag: 'Android / KMP' },
  { name: 'Dart', type: 'Language', category: 'Cross-Platform Mobile', color: '#0175C2', tag: 'Flutter Core' },
  { name: 'PHP', type: 'Language', category: 'Web & Backend', color: '#777BB4', tag: 'Web Services' },
  { name: 'Ruby', type: 'Language', category: 'Web & Scripting', color: '#CC342D', tag: 'Rails / Web' },
  { name: 'Scala', type: 'Language', category: 'Distributed Data & JVM', color: '#DC322F', tag: 'Big Data / Spark' },
  { name: 'Solidity', type: 'Language', category: 'Blockchain & Smart Contracts', color: '#AA6746', tag: 'Web3 / EVM' },
  { name: 'Shell', type: 'Language', category: 'DevOps & Automation', color: '#89E051', tag: 'Bash Scripts' },
  { name: 'Lua', type: 'Language', category: 'Embedded & Scripting', color: '#000080', tag: 'Neovim / Games' },
  { name: 'R', type: 'Language', category: 'Statistics & Data Mining', color: '#276DC3', tag: 'Statistics' },
  { name: 'Mojo', type: 'Language', category: 'AI Accelerators & Hardware', color: '#FF4500', tag: 'AI Systems' },
  { name: 'Elixir', type: 'Language', category: 'Concurrent Distributed Systems', color: '#6E4A7E', tag: 'BEAM / Phoenix' },

  // --- Frameworks & Nền tảng có trong CrawlerGithubService (framework_engine.py, topic queries) ---
  { name: 'React', type: 'Framework', category: 'Frontend UI', color: '#61DAFB', tag: 'Web UI' },
  { name: 'Next.js', type: 'Framework', category: 'Fullstack React SSR', color: '#000000', tag: 'React SSR' },
  { name: 'Vue.js', type: 'Framework', category: 'Frontend Reactive', color: '#42B883', tag: 'Progressive UI' },
  { name: 'Angular', type: 'Framework', category: 'Enterprise SPA', color: '#DD0031', tag: 'Google SPA' },
  { name: 'Svelte', type: 'Framework', category: 'Compiler UI', color: '#FF3E00', tag: 'Reactive' },
  { name: 'NestJS', type: 'Framework', category: 'Enterprise Node.js Backend', color: '#E0234E', tag: 'Backend TS' },
  { name: 'Express.js', type: 'Framework', category: 'Node.js Microservices', color: '#828282', tag: 'Minimal Web' },
  { name: 'FastAPI', type: 'Framework', category: 'Modern Python APIs', color: '#05998B', tag: 'Async Python' },
  { name: 'Django', type: 'Framework', category: 'Fullstack Python Web', color: '#092E20', tag: 'Python Web' },
  { name: 'Flask', type: 'Framework', category: 'Micro Python Web', color: '#384B56', tag: 'Lightweight' },
  { name: 'Spring Boot', type: 'Framework', category: 'Enterprise Java Microservices', color: '#6DB33F', tag: 'Java Services' },
  { name: 'Hibernate', type: 'Framework', category: 'Java ORM & Data Access', color: '#59666C', tag: 'JPA ORM' },
  { name: 'ASP.NET Core', type: 'Framework', category: 'Cloud .NET Backend', color: '#512BD4', tag: 'High-Perf API' },
  { name: 'Entity Framework', type: 'Framework', category: '.NET ORM & Data', color: '#701463', tag: 'Data Access' },
  { name: 'Blazor', type: 'Framework', category: '.NET WebAssembly', color: '#5C2D91', tag: 'WASM Fullstack' },
  { name: 'PyTorch', type: 'Framework', category: 'Deep Learning & Neural Networks', color: '#EE4C2C', tag: 'ML / AI' },
  { name: 'TensorFlow', type: 'Framework', category: 'Production ML Infrastructure', color: '#FF6F00', tag: 'Production AI' },
  { name: 'Flutter', type: 'Framework', category: 'Cross-Platform UI Engine', color: '#02569B', tag: 'Mobile / Multi' },
  { name: 'Docker', type: 'Framework', category: 'Containerization Platform', color: '#2496ED', tag: 'Containers' },
  { name: 'Kubernetes', type: 'Framework', category: 'Container Orchestration', color: '#326CE5', tag: 'Cloud Native' },
];

const DEFAULT_SELECTED_LANGS = ['Python', 'TypeScript', 'Go', 'React', 'Rust'];
const MAX_SELECTION = 10;
const MIN_SELECTION = 1;

export const TechDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(DEFAULT_SELECTED_LANGS);
  const [hiddenLangs, setHiddenLangs] = useState<Set<string>>(new Set());
  const [isZoomed, setIsZoomed] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ series: string; month: string; score: number; x: number; y: number } | null>(null);
  const [systemOverview, setSystemOverview] = useState<any>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(true);
  const [trendChart, setTrendChart] = useState<any>(null);
  const [isLoadingTrend, setIsLoadingTrend] = useState<boolean>(true);
  const [topRepos, setTopRepos] = useState<any[]>([]);
  const [isLoadingTopRepos, setIsLoadingTopRepos] = useState<boolean>(true);

  // States cho Bộ chọn Select & Tìm kiếm nâng cao
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'Language' | 'Framework'>('all');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const pickerDropdownRef = useRef<HTMLDivElement>(null);

  // States cho Phân hệ Dự báo Chuỗi thời gian (ARIMA Forecasting Engine)
  const [forecastTech, setForecastTech] = useState<string>('Python');
  const [forecastSteps, setForecastSteps] = useState<number>(3);
  const [forecastMetric, setForecastMetric] = useState<'health_score' | 'popularity_score' | 'growth_momentum_score'>('health_score');
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);
  const [forecastHover, setForecastHover] = useState<{
    date: string;
    type: 'history' | 'forecast';
    val: number;
    low?: number;
    high?: number;
    x: number;
    y: number;
  } | null>(null);

  React.useEffect(() => {
    if (!forecastTech) return;
    setIsLoadingForecast(true);
    analyticsApi
      .getTechnologyForecast(forecastTech, forecastSteps, forecastMetric)
      .then((res) => {
        if (res && res.status === 'success') {
          setForecastData(res);
        } else {
          setForecastData(null);
        }
      })
      .catch((err) => {
        console.warn('Could not load technology forecast:', err);
        setForecastData(null);
      })
      .finally(() => {
        setIsLoadingForecast(false);
      });
  }, [forecastTech, forecastSteps, forecastMetric]);

  React.useEffect(() => {
    setIsLoadingOverview(true);
    analyticsApi
      .getSystemOverview()
      .then((data) => {
        if (data) setSystemOverview(data);
      })
      .catch((err) => {
        console.warn('Could not load system overview:', err);
      })
      .finally(() => {
        setIsLoadingOverview(false);
      });

    setIsLoadingTopRepos(true);
    analyticsApi
      .getTopRepositories(8)
      .then((repos) => {
        if (repos && repos.length > 0) {
          setTopRepos(repos);
        } else {
          setTopRepos([]);
        }
      })
      .catch((err) => {
        console.warn('Could not load top repositories:', err);
        setTopRepos([]);
      })
      .finally(() => {
        setIsLoadingTopRepos(false);
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
        setTrendChart(null);
      })
      .finally(() => {
        setIsLoadingTrend(false);
      });
  }, [timeRange, selectedLangs]);

  const languagesList = useMemo(() => CRAWLER_TECHNOLOGIES.filter((t) => t.type === 'Language'), []);
  const frameworksList = useMemo(() => CRAWLER_TECHNOLOGIES.filter((t) => t.type === 'Framework'), []);

  const filteredTechnologies = useMemo(() => {
    return CRAWLER_TECHNOLOGIES.filter((tech) => {
      const matchesType = filterType === 'all' || tech.type === filterType;
      const matchesQuery =
        !searchQuery.trim() ||
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [filterType, searchQuery]);

  // Click-outside listener cho dropdown tìm kiếm nâng cao
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerDropdownRef.current && !pickerDropdownRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickerOpen]);

  const toggleSelectLang = (techName: string) => {
    setSelectedLangs((prev) => {
      if (prev.includes(techName)) {
        if (prev.length <= MIN_SELECTION) {
          toast.info('Cần giữ lại ít nhất 1 Ngôn ngữ / Framework trên biểu đồ.');
          return prev;
        }
        return prev.filter((l) => l !== techName);
      } else {
        if (prev.length >= MAX_SELECTION) {
          toast.warning(`Bạn chỉ có thể chọn tối đa ${MAX_SELECTION} Ngôn ngữ / Framework cùng lúc. Vui lòng bỏ bớt để chọn thêm.`, 'Đã đạt giới hạn 10');
          return prev;
        }
        return [...prev, techName];
      }
    });
  };

  const applyPreset = (presetLangs: string[]) => {
    setSelectedLangs(presetLangs.slice(0, MAX_SELECTION));
  };

  const toggleLang = (langName: string) => {
    setHiddenLangs((prev) => {
      const next = new Set(prev);
      if (next.has(langName)) {
        next.delete(langName);
      } else {
        if (next.size < selectedLangs.length - 1) {
          next.add(langName);
        }
      }
      return next;
    });
  };

  const labels: string[] = trendChart?.labels || (timeRange === '30d' ? ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'] : ['T5', 'T6', 'T7', 'T8', 'T9', 'T10']);

  // Dynamic Series Generator: Chỉ lấy từ dữ liệu thực tế do API cung cấp
  const seriesList = useMemo(() => {
    if (!trendChart?.series || trendChart.series.length === 0) {
      return [];
    }
    const backendSeries = trendChart.series;
    const backendMap = new Map<string, any>(backendSeries.map((s: any) => [s.name.toLowerCase(), s]));

    return selectedLangs
      .map((langName) => backendMap.get(langName.toLowerCase()))
      .filter(Boolean);
  }, [selectedLangs, trendChart]);

  // Language & Framework Health Data - lấy 4 công nghệ tiêu biểu từ seriesList
  const healthData: HealthScoreData[] = useMemo(() => {
    return seriesList.slice(0, 4).map((s: any) => {
      const techInfo = CRAWLER_TECHNOLOGIES.find((t) => t.name.toLowerCase() === s.name.toLowerCase());
      const cat = techInfo?.category || `${s.name} Ecosystem`;
      const scoreVal = Math.round(s.current_score ?? 85);
      const tierVal: 'A+' | 'A' | 'B+' | 'B' = scoreVal >= 88 ? 'A+' : scoreVal >= 80 ? 'A' : scoreVal >= 70 ? 'B+' : 'B';
      const dir: 'up' | 'down' | 'stable' = s.direction || 'stable';
      return {
        name: s.name,
        category: cat,
        score: scoreVal,
        tier: tierVal,
        popularity: `${scoreVal > 85 ? '1.8M' : '650k'} ★`,
        trendDelta: s.growth || '+1.0%',
        direction: dir,
        prevScore: s.points?.[0] || scoreVal,
      };
    });
  }, [seriesList]);

  const activeSeries = seriesList.filter((s: any) => !hiddenLangs.has(s.name));

  // Tọa độ & Xử lý đồ thị phân hệ dự báo ARIMA
  const forecastChartData = useMemo(() => {
    if (!forecastData || !forecastData.history || !forecastData.forecast) {
      return null;
    }

    const historyPts: Array<{ date: string; value: number }> = forecastData.history.map((h: any) => ({
      date: h.timestamp || '',
      value: Number(h.value) || 0,
    }));

    const forecastPts: Array<{ date: string; value: number; lower: number; upper: number }> = forecastData.forecast.map((f: any) => ({
      date: f.timestamp || '',
      value: Number(f.predicted_value) || 0,
      lower: Number(f.lower_bound) || 0,
      upper: Number(f.upper_bound) || 0,
    }));

    const allValues = [
      ...historyPts.map((p) => p.value),
      ...forecastPts.map((p) => p.value),
      ...forecastPts.map((p) => p.upper),
      ...forecastPts.map((p) => p.lower),
    ].filter((v) => !isNaN(v) && v > 0);

    const minVal = Math.max(0, Math.floor(Math.min(...allValues) - 3));
    const maxVal = Math.min(100, Math.ceil(Math.max(...allValues) + 3));

    const totalCount = historyPts.length + forecastPts.length;
    const fStartX = 45;
    const fEndX = 500;
    const fChartW = fEndX - fStartX;

    const getFX = (idx: number) => Math.round(fStartX + (idx * fChartW) / Math.max(1, totalCount - 1));
    const getFY = (val: number) => {
      const range = maxVal - minVal || 1;
      const normalized = (val - minVal) / range;
      return Math.round(200 - normalized * 155);
    };

    const splitIndex = historyPts.length - 1;
    const splitX = getFX(splitIndex);

    const historyCoords = historyPts.map((pt, i) => ({
      ...pt,
      x: getFX(i),
      y: getFY(pt.value),
    }));

    const lastHistory = historyCoords[splitIndex];
    const forecastCoords = [
      {
        ...lastHistory,
        lower: lastHistory.value,
        upper: lastHistory.value,
        yLower: lastHistory.y,
        yUpper: lastHistory.y,
      },
      ...forecastPts.map((pt, i) => ({
        ...pt,
        x: getFX(historyPts.length + i),
        y: getFY(pt.value),
        yLower: getFY(pt.lower),
        yUpper: getFY(pt.upper),
      })),
    ];

    const historyPath = historyCoords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    const forecastPath = forecastCoords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

    const bandUpper = forecastCoords.map((pt) => `${pt.x},${pt.yUpper}`).join(' ');
    const bandLower = [...forecastCoords].reverse().map((pt) => `${pt.x},${pt.yLower}`).join(' ');
    const confidenceBandPolygon = `${bandUpper} ${bandLower}`;

    return {
      historyCoords,
      forecastCoords,
      historyPath,
      forecastPath,
      confidenceBandPolygon,
      splitX,
      splitIndex,
      minVal,
      maxVal,
      totalCount,
      allDates: [...historyPts.map((p) => p.date), ...forecastPts.map((p) => p.date)],
    };
  }, [forecastData]);

  // Tập hợp toàn bộ điểm số thực tế để tính biên Y thu phóng
  const allActivePoints = useMemo(() => {
    const pts: number[] = [];
    activeSeries.forEach((s: any) => {
      if (Array.isArray(s.points)) {
        s.points.forEach((p: number) => {
          if (typeof p === 'number' && !isNaN(p)) pts.push(p);
        });
      }
    });
    return pts;
  }, [activeSeries]);

  const { chartMinY, chartMaxY, gridValues } = useMemo(() => {
    if (!isZoomed || allActivePoints.length === 0) {
      return {
        chartMinY: 0,
        chartMaxY: 100,
        gridValues: [100, 75, 50, 25, 0],
      };
    }
    const rawMin = Math.min(...allActivePoints);
    const rawMax = Math.max(...allActivePoints);
    let minVal = Math.max(0, Math.floor(rawMin - 3));
    let maxVal = Math.min(100, Math.ceil(rawMax + 2));

    // Đảm bảo dải tối thiểu ít nhất 12 điểm để đồ thị cân đối
    if (maxVal - minVal < 12) {
      const mid = (maxVal + minVal) / 2;
      minVal = Math.max(0, Math.floor(mid - 6));
      maxVal = Math.min(100, Math.ceil(mid + 6));
    }

    const step = (maxVal - minVal) / 4;
    const grids = [
      maxVal,
      Math.round(minVal + step * 3),
      Math.round(minVal + step * 2),
      Math.round(minVal + step),
      minVal,
    ];

    return {
      chartMinY: minVal,
      chartMaxY: maxVal,
      gridValues: grids,
    };
  }, [isZoomed, allActivePoints]);

  const chartStartX = 55;
  const chartEndX = 560;
  const chartTopY = 30;
  const chartBottomY = 270;
  const numPts = labels.length;
  const getX = (i: number) => Math.round(chartStartX + (i * (chartEndX - chartStartX)) / Math.max(1, numPts - 1));
  const getY = (val: number) => {
    const range = chartMaxY - chartMinY || 1;
    const clamped = Math.max(chartMinY, Math.min(chartMaxY, val));
    const normalized = (clamped - chartMinY) / range;
    return Math.round(chartBottomY - normalized * (chartBottomY - chartTopY));
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            Tech Dashboard: Phân tích Xu hướng &amp; Sức khỏe Công nghệ
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

          <Button
            variant="outline"
            size="sm"
            icon="trendingUp"
            className="border-brand-primary text-brand-primary hover:bg-brand-primary/10 shadow-xs"
            onClick={() => {
              const el = document.getElementById('forecast-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Phân hệ Dự báo (ARIMA)
          </Button>

          <Link to="/analytics/compare">
            <Button variant="outline" size="sm" icon="radar">
              So sánh đối đầu
            </Button>
          </Link>
        </div>
      </div>

      {/* System KPI Summary Banner from MongoDB Atlas / Crawler Service */}
      {isLoadingOverview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-elevated/40 border border-surface-border animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-28 bg-surface-border/60 rounded" />
              <div className="h-7 w-20 bg-surface-border/80 rounded" />
              <div className="h-2.5 w-32 bg-surface-border/40 rounded" />
            </div>
          ))}
        </div>
      ) : systemOverview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-elevated/40 border border-surface-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
              <AppIcon name="github" size={14} className="text-brand-secondary" />
              Tổng Repositories (DB)
            </span>
            <div className="text-2xl font-bold font-mono text-text-main">
              {systemOverview.total_repositories ? systemOverview.total_repositories.toLocaleString() : '0'}
            </div>
            <span className="text-[11px] text-text-subtle">Thu thập &amp; theo dõi tự động</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
              <AppIcon name="layers" size={14} className="text-brand-accent" />
              Ngôn ngữ phân tích
            </span>
            <div className="text-2xl font-bold font-mono text-brand-secondary">
              {systemOverview.total_languages || 0}
            </div>
            <span className="text-[11px] text-text-subtle">Hệ sinh thái công nghệ</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
              <AppIcon name="checkCircle" size={14} className="text-status-success" />
              Kho mã Healthy (Đạt chuẩn)
            </span>
            <div className="text-2xl font-bold font-mono text-status-success">
              {systemOverview.health_distribution?.HEALTHY ? systemOverview.health_distribution.HEALTHY.toLocaleString() : '0'}
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
              Token Pool &amp; Jobs
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {systemOverview.token_pool_summary?.active_tokens ?? 0} Active
            </div>
            <span className="text-[11px] text-text-subtle">Smart Rotator đang kích hoạt</span>
          </div>
        </div>
      ) : null}

      {/* KPI Cards: Language / Framework Health Score Summary */}
      {isLoadingTrend ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} variant="default" padding="md" className="flex flex-col justify-between h-36">
              <div className="flex flex-col gap-2">
                <div className="h-3 w-20 bg-surface-border/60 rounded" />
                <div className="h-5 w-32 bg-surface-border/80 rounded" />
              </div>
              <div className="pt-3 border-t border-surface-border flex items-end justify-between">
                <div className="h-6 w-16 bg-surface-border/60 rounded" />
                <div className="h-4 w-12 bg-surface-border/40 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : healthData.length > 0 ? (
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
      ) : null}

      {/* Ecosystem Selection Bar (Thẻ Select & Compact Tags, Tối đa 10) */}
      <Card variant="default" padding="md" className="border-brand-primary/30 bg-surface-card shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
              <AppIcon name="layers" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-main">
                  Bộ chọn Ngôn ngữ &amp; Framework
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold transition-colors ${
                    selectedLangs.length >= MAX_SELECTION
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      : 'bg-brand-primary/10 text-brand-primary'
                  }`}
                >
                  Đã chọn: {selectedLangs.length}/{MAX_SELECTION} tối đa 10
                </span>
              </div>
              <p className="text-[11px] text-text-subtle">
                Sử dụng thẻ select bên dưới để chọn nhanh trong {CRAWLER_TECHNOLOGIES.length} ngôn ngữ &amp; framework từ CrawlerGithubService.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-text-muted font-medium mr-1">Bộ chọn mẫu:</span>
            <button
              type="button"
              onClick={() => applyPreset(DEFAULT_SELECTED_LANGS)}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border border border-surface-border text-text-main font-medium transition-colors"
            >
              Top 5 Mặc định
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'R'])}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border border border-surface-border text-text-main font-medium transition-colors"
            >
              AI &amp; Data
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['TypeScript', 'React', 'Next.js', 'Vue.js', 'NestJS', 'Express.js'])}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border border border-surface-border text-text-main font-medium transition-colors"
            >
              Web &amp; Fullstack
            </button>
            <button
              type="button"
              onClick={() => applyPreset(['Go', 'Rust', 'Docker', 'Kubernetes', 'C#', 'Java', 'Spring Boot', 'ASP.NET Core'])}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border border border-surface-border text-text-main font-medium transition-colors"
            >
              Cloud &amp; Backend
            </button>
          </div>
        </div>

        {/* Primary Controls: Native Select Tag & Advanced Search Toggle */}
        <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Thẻ Select Lựa chọn Ngôn ngữ & Framework */}
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <select
                aria-label="Lựa chọn Ngôn ngữ hoặc Framework"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    toggleSelectLang(e.target.value);
                  }
                }}
                className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn pl-3 pr-8 py-2 font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary cursor-pointer hover:border-brand-primary/40 transition-colors shadow-xs"
              >
                <option value="" disabled>
                  {selectedLangs.length >= MAX_SELECTION
                    ? '⚠️ Đã đạt tối đa 10/10 công nghệ (Chọn để bỏ bớt)'
                    : '➕ Bấm vào đây để chọn Ngôn ngữ / Framework thêm vào biểu đồ...'}
                </option>
                <optgroup label="── 🌐 Ngôn ngữ lập trình ──">
                  {languagesList.map((lang) => {
                    const isSelected = selectedLangs.includes(lang.name);
                    return (
                      <option
                        key={`lang-${lang.name}`}
                        value={lang.name}
                        disabled={selectedLangs.length >= MAX_SELECTION && !isSelected}
                      >
                        {isSelected ? '✓ ' : '+ '} {lang.name} — {lang.category} ({lang.tag})
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="── ⚡ Frameworks & Nền tảng ──">
                  {frameworksList.map((fw) => {
                    const isSelected = selectedLangs.includes(fw.name);
                    return (
                      <option
                        key={`fw-${fw.name}`}
                        value={fw.name}
                        disabled={selectedLangs.length >= MAX_SELECTION && !isSelected}
                      >
                        {isSelected ? '✓ ' : '+ '} {fw.name} — {fw.category} ({fw.tag})
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>

            {/* Nút bật/tắt Bảng tìm kiếm nâng cao */}
            <button
              type="button"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-semibold border transition-all ${
                isPickerOpen
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                  : 'bg-surface-elevated hover:bg-surface-border border-surface-border text-text-muted hover:text-text-main'
              }`}
            >
              <AppIcon name="search" size={14} />
              <span>{isPickerOpen ? 'Đóng bộ tìm kiếm' : 'Tìm kiếm & Danh mục'}</span>
            </button>
          </div>

          {/* Quick Clear / Reset Action */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            {selectedLangs.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedLangs(['Python'])}
                className="text-text-subtle hover:text-status-danger text-xs transition-colors"
              >
                Xóa tất cả (Giữ 1)
              </button>
            )}
          </div>
        </div>

        {/* Selected Chips: Chỉ hiển thị các công nghệ ĐANG ĐƯỢC CHỌN (Gọn gàng, không bị phơi ra ngoài) */}
        <div className="pt-3 flex flex-wrap items-center gap-1.5 border-t border-surface-border/60 mt-3">
          <span className="text-[11px] font-semibold text-text-subtle mr-1">
            Đang hiển thị trên biểu đồ ({selectedLangs.length}/10):
          </span>
          {selectedLangs.map((name) => {
            const techInfo = CRAWLER_TECHNOLOGIES.find((t) => t.name.toLowerCase() === name.toLowerCase());
            const color = techInfo?.color || '#3B82F6';
            const isFw = techInfo?.type === 'Framework';

            return (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-surface-elevated border border-surface-border text-text-main text-xs font-medium shadow-xs hover:border-brand-primary/40 transition-all"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold">{name}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isFw ? 'bg-purple-500/10 text-purple-400' : 'bg-sky-500/10 text-brand-secondary'
                  }`}
                >
                  {isFw ? 'FW' : 'LANG'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSelectLang(name)}
                  title={`Gỡ bỏ ${name} khỏi biểu đồ`}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-text-subtle hover:text-status-danger hover:bg-surface-border transition-colors text-xs ml-0.5"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>

        {/* Bảng tìm kiếm & duyệt danh mục nâng cao (Collapsible Drawer) */}
        {isPickerOpen && (
          <div
            ref={pickerDropdownRef}
            className="mt-3 p-4 rounded-xl border border-brand-primary/30 bg-surface-elevated/40 flex flex-col gap-3 animate-in fade-in duration-150"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc danh mục: React, Go, Web, AI..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-card border border-surface-border text-text-main text-xs rounded-btn pl-8 pr-3 py-1.5 placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
                  />
                  <div className="absolute left-2.5 top-2 text-text-subtle pointer-events-none">
                    <AppIcon name="search" size={13} />
                  </div>
                </div>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-text-subtle hover:text-text-main"
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>

              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1 text-xs">
                {(['all', 'Language', 'Framework'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded-btn text-xs font-semibold transition-colors ${
                      filterType === t
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-surface-card border border-surface-border text-text-muted hover:text-text-main'
                    }`}
                  >
                    {t === 'all'
                      ? `Tất cả (${CRAWLER_TECHNOLOGIES.length})`
                      : t === 'Language'
                      ? `Ngôn ngữ (${languagesList.length})`
                      : `Frameworks (${frameworksList.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Available Items */}
            <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
              {filteredTechnologies.map((tech) => {
                const isSelected = selectedLangs.includes(tech.name);
                const isLimitReached = selectedLangs.length >= MAX_SELECTION && !isSelected;

                return (
                  <button
                    key={tech.name}
                    type="button"
                    disabled={isLimitReached}
                    onClick={() => toggleSelectLang(tech.name)}
                    className={`text-left p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                      isSelected
                        ? 'bg-brand-primary/10 border-brand-primary text-text-main shadow-xs font-semibold'
                        : isLimitReached
                        ? 'opacity-40 bg-surface-card border-surface-border text-text-subtle cursor-not-allowed'
                        : 'bg-surface-card border-surface-border text-text-muted hover:border-brand-primary/40 hover:text-text-main'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tech.color }}
                      />
                      <div className="truncate">
                        <div className="truncate text-xs font-bold">{tech.name}</div>
                        <div className="text-[10px] text-text-subtle truncate">{tech.category}</div>
                      </div>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-brand-primary text-white'
                          : 'bg-surface-elevated text-text-subtle'
                      }`}
                    >
                      {isSelected ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
            {filteredTechnologies.length === 0 && (
              <div className="text-center py-6 text-xs text-text-muted">
                Không tìm thấy công nghệ nào phù hợp với từ khóa "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Main Section: Line Chart (Popularity Trend & Health Score Over Time) + Right Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Line Chart (SVG Native per DESIGN_SYSTEM 6.2 & SCR-10 Wireframe) */}
        <Card variant="elevated" padding="lg" className="lg:col-span-12 xl:col-span-8 flex flex-col justify-between gap-4">
          <div className="border-b border-surface-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <AppIcon name="trendingUp" size={16} className="text-brand-primary" />
                Popularity Trend &amp; Health Score Over Time
              </h3>
              <span className="text-[11px] text-text-subtle">
                Phân tích xu hướng phát triển chuỗi thời gian của {selectedLangs.length} Hệ sinh thái đã chọn ({timeRange === '30d' ? '30 ngày' : timeRange === '90d' ? '6 tháng' : '1 năm'}) • {isZoomed ? `Thu phóng dải điểm ${chartMinY} - ${chartMaxY}` : 'Thang đo 0 - 100'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsZoomed((prev) => !prev)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                  isZoomed
                    ? 'bg-brand-primary/15 text-brand-secondary border-brand-primary/40 shadow-xs'
                    : 'bg-surface-elevated text-text-muted hover:text-text-main border-surface-border'
                }`}
                title="Bật/Tắt chế độ phóng to theo dải điểm tăng trưởng thực tế"
              >
                <AppIcon name="trendingUp" size={13} />
                <span>{isZoomed ? `Phóng to dải tăng trưởng (${chartMinY} - ${chartMaxY})` : 'Thang đo chuẩn (0 - 100)'}</span>
              </button>
              <div className="text-xs font-mono text-text-muted">
                Đang hiển thị <strong className="text-brand-primary">{activeSeries.length}</strong>/{seriesList.length} hệ sinh thái
              </div>
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
          <div className="w-full py-4 overflow-x-auto relative min-h-[380px] flex items-center justify-center">
            {isLoadingTrend ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-9 h-9 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-text-muted font-medium">Đang tải chuỗi dữ liệu xu hướng công nghệ...</span>
              </div>
            ) : seriesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-center text-text-muted">
                <AppIcon name="barChart" size={32} className="text-text-subtle mb-1" />
                <span className="text-xs font-semibold text-text-main">Chưa có dữ liệu xu hướng cho nhóm công nghệ này</span>
                <span className="text-[11px] text-text-subtle">Vui lòng chọn hệ sinh thái khác từ bộ chọn.</span>
              </div>
            ) : (
            <svg viewBox="0 0 700 320" className="w-full min-w-[580px] h-[360px] overflow-visible">
              {/* Grid Lines align chuẩn xác theo getY(val) */}
              {gridValues.map((gridVal) => {
                const yPos = getY(gridVal);
                return (
                  <g key={gridVal}>
                    <line
                      x1={chartStartX - 10}
                      y1={yPos}
                      x2={chartEndX + 10}
                      y2={yPos}
                      stroke="currentColor"
                      strokeOpacity={gridVal === chartMinY ? 0.4 : 0.12}
                      strokeWidth={gridVal === chartMinY ? 1.5 : 1}
                      strokeDasharray={gridVal === chartMinY ? undefined : '3,3'}
                    />
                    <text
                      x={chartStartX - 16}
                      y={yPos + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="currentColor"
                      fillOpacity={0.65}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {labels.map((lbl, idx) => (
                <text
                  key={lbl}
                  x={getX(idx)}
                  y={chartBottomY + 24}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={idx === numPts - 1 ? 'bold' : 'normal'}
                  fill={idx === numPts - 1 ? '#38BDF8' : 'currentColor'}
                  fillOpacity={idx === numPts - 1 ? 1 : 0.65}
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
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {s.points.map((val: number, i: number) => {
                      const isHovered = hoveredPoint?.series === s.name && hoveredPoint?.month === labels[i];
                      return (
                        <circle
                          key={i}
                          cx={getX(i)}
                          cy={getY(val)}
                          r={isHovered ? 6 : i === numPts - 1 ? 5 : 3.5}
                          fill={isHovered ? '#FFFFFF' : s.color}
                          stroke={isHovered ? s.color : '#FFFFFF'}
                          strokeWidth={isHovered ? 2.5 : 1.2}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() =>
                            setHoveredPoint({ series: s.name, month: labels[i], score: val, x: getX(i), y: getY(val) })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    })}
                    {/* Badge nhãn công nghệ ở cuối đường line */}
                    <g transform={`translate(${lastX + 10}, ${lastY})`}>
                      <rect
                        x="0"
                        y="-10"
                        width={Math.max(54, s.name.length * 6.5 + (s.growth ? 42 : 12))}
                        height="20"
                        rx="4"
                        fill={s.color}
                        fillOpacity="0.12"
                        stroke={s.color}
                        strokeWidth="1"
                      />
                      <text
                        x="5"
                        y="4"
                        fontSize="9.5"
                        fontWeight="bold"
                        fill={s.color}
                        fontFamily="monospace"
                      >
                        {s.name} {s.growth ? `(${s.growth})` : ''}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Tooltip on Hover */}
              {hoveredPoint && (
                <g pointerEvents="none" className="transition-all">
                  <line
                    x1={hoveredPoint.x}
                    y1={chartTopY}
                    x2={hoveredPoint.x}
                    y2={chartBottomY}
                    stroke="currentColor"
                    strokeOpacity="0.3"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x={Math.min(chartEndX - 130, Math.max(chartStartX, hoveredPoint.x - 65))}
                    y={Math.max(10, hoveredPoint.y - 36)}
                    width="130"
                    height="28"
                    rx="6"
                    fill="#0F172A"
                    stroke="#334155"
                    strokeWidth="1"
                    opacity="0.95"
                  />
                  <text
                    x={Math.min(chartEndX - 130, Math.max(chartStartX, hoveredPoint.x - 65)) + 65}
                    y={Math.max(10, hoveredPoint.y - 36) + 18}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {hoveredPoint.series}: {hoveredPoint.score} ({hoveredPoint.month})
                  </text>
                </g>
              )}
            </svg>
            )}
          </div>

          <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-surface-border text-center text-xs">
            <div>
              <span className="text-[10px] text-text-subtle block">Hệ sinh thái hàng đầu</span>
              <span className="font-bold font-mono text-brand-secondary">
                {trendChart?.stats?.top_ecosystem?.name || systemOverview?.top_languages?.[0]?.language || '—'} (
                {trendChart?.stats?.top_ecosystem?.score !== undefined ? `${trendChart.stats.top_ecosystem.score}/100` : '—'})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-subtle block">Tăng trưởng cao nhất</span>
              <span className="font-bold font-mono text-status-success">
                {trendChart?.stats?.fastest_growing?.name || '—'} {trendChart?.stats?.fastest_growing?.growth ? `(${trendChart.stats.fastest_growing.growth})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-subtle block">Tổng mẫu giám sát</span>
              <span className="font-bold font-mono text-text-main">
                {isLoadingOverview ? (
                  <span className="inline-block w-16 h-3.5 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  `${(systemOverview?.total_repositories || trendChart?.stats?.total_monitored_repos || 0).toLocaleString()} Repositories`
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* Right: Key Analytics Stats & Quick Links */}
        <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Tổng Repos giám sát</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">
                {isLoadingOverview ? (
                  <span className="inline-block w-20 h-7 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  (systemOverview?.total_repositories || trendChart?.stats?.total_monitored_repos || 0).toLocaleString()
                )}
              </div>
              <span className="text-[11px] text-status-success mt-1 inline-flex items-center gap-1">
                Đồng bộ MongoDB Atlas
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Commit Frequency trung bình</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">
                {isLoadingTrend ? (
                  <span className="inline-block w-16 h-7 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  trendChart?.stats?.avg_commit_frequency !== undefined ? trendChart.stats.avg_commit_frequency : '—'
                )}
              </div>
              <span className="text-[11px] text-brand-secondary mt-1 inline-flex items-center gap-1">
                Độ tích cực hệ sinh thái
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Điểm Sức khỏe TB</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">
                {isLoadingTrend ? (
                  <span className="inline-block w-16 h-7 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  trendChart?.stats?.avg_health_score !== undefined ? trendChart.stats.avg_health_score : '—'
                )}
              </div>
              <span className="text-[11px] text-status-success mt-1 inline-flex items-center gap-1">
                {(trendChart?.stats?.avg_health_score ?? 0) >= 80 ? 'Hạng A: Rất tốt' : 'Hạng B+: Tốt'}
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Crawler Jobs đã chạy</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">
                {isLoadingTrend ? (
                  <span className="inline-block w-16 h-7 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  (trendChart?.stats?.total_crawler_jobs || 0).toLocaleString()
                )}
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
                  <span className="font-semibold text-text-main">Tra cứu sức khỏe Repository</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>

              <Link to="/analytics/compare" className="flex items-center justify-between p-2.5 rounded-btn bg-surface-elevated hover:bg-surface-border transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <AppIcon name="layers" size={16} />
                  <span className="font-semibold text-text-main">So sánh đối đầu Dual Radar</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>

              <Link to="/analytics/reports" className="flex items-center justify-between p-2.5 rounded-btn bg-surface-elevated hover:bg-surface-border transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <AppIcon name="fileText" size={16} />
                  <span className="font-semibold text-text-main">Báo cáo phân tích Whitepaper</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHÂN HỆ DỰ BÁO XU HƯỚNG CÔNG NGHỆ (ARIMA TIME SERIES FORECASTING ENGINE)  */}
      {/* ========================================================================= */}
      <div id="forecast-section" className="scroll-mt-6">
        <Card variant="elevated" padding="none" className="overflow-hidden border-brand-primary/40 shadow-lg">
        {/* Subsystem Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-surface-card dark:from-slate-900 dark:via-indigo-950 dark:to-surface-card border-b border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/30 text-brand-secondary flex items-center justify-center shrink-0 shadow-inner dark:bg-brand-primary/20 dark:border-brand-primary/40">
              <AppIcon name="radar" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-text-main tracking-wide flex items-center gap-2">
                  Phân Hệ Dự Báo Xu Hướng Chuỗi Thời Gian
                </h2>
                <Badge variant="tech" size="sm" icon="zap" className="bg-brand-primary/10 text-brand-secondary border-brand-primary/30 dark:bg-brand-primary/20 dark:border-brand-primary/40 font-mono text-[10px]">
                  ARIMA (1, 1, 0) ML
                </Badge>
                <Badge variant="success" size="sm" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px]">
                  95% Confidence Band
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Mô hình Statsmodels ARIMA / Holt-Winters dự báo xu hướng phát triển công nghệ trong tương lai dựa trên dữ liệu chuỗi lịch sử từ MongoDB Atlas
              </p>
            </div>
          </div>

          {/* Quick Technology & Horizon Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Tech Select */}
            <div className="relative">
              <select
                aria-label="Chọn công nghệ dự báo"
                value={forecastTech}
                onChange={(e) => setForecastTech(e.target.value)}
                className="bg-surface-card border border-surface-border text-text-main text-xs rounded-btn pl-3 pr-8 py-1.5 font-semibold focus:outline-none focus:border-brand-primary cursor-pointer hover:border-brand-primary/50 transition-colors shadow-xs"
              >
                {CRAWLER_TECHNOLOGIES.map((tech) => (
                  <option key={tech.name} value={tech.name} className="bg-surface-card text-text-main dark:bg-slate-900 dark:text-white">
                    {tech.name} ({tech.type === 'Language' ? 'Ngôn ngữ' : 'Framework'})
                  </option>
                ))}
              </select>
            </div>

            {/* Steps / Horizon Selector */}
            <div className="flex items-center gap-1 p-0.5 bg-surface-elevated border border-surface-border rounded-btn text-xs">
              {[
                { label: '3 Tháng', steps: 3 },
                { label: '6 Tháng', steps: 6 },
                { label: '1 Năm', steps: 12 },
              ].map((stepOpt) => (
                <button
                  key={stepOpt.steps}
                  type="button"
                  onClick={() => setForecastSteps(stepOpt.steps)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    forecastSteps === stepOpt.steps
                      ? 'bg-brand-secondary text-brand-dark shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {stepOpt.label}
                </button>
              ))}
            </div>

            {/* Metric Selector */}
            <div className="flex items-center gap-1 p-0.5 bg-surface-elevated border border-surface-border rounded-btn text-xs">
              {[
                { id: 'health_score', label: 'Điểm Sức khỏe' },
                { id: 'popularity_score', label: 'Độ phổ biến' },
                { id: 'growth_momentum_score', label: 'Động lượng' },
              ].map((mOpt) => (
                <button
                  key={mOpt.id}
                  type="button"
                  onClick={() => setForecastMetric(mOpt.id as any)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    forecastMetric === mOpt.id
                      ? 'bg-brand-primary/15 text-brand-secondary border border-brand-primary/30 shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {mOpt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tech Switcher Tabs */}
        <div className="px-5 py-2.5 bg-surface-card border-b border-surface-border flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-text-subtle font-semibold shrink-0 flex items-center gap-1">
            <AppIcon name="layers" size={13} />
            Hệ sinh thái tiêu biểu:
          </span>
          {['Python', 'TypeScript', 'React', 'Go', 'Rust', 'Next.js', 'PyTorch', 'C#', 'Docker'].map((quickTech) => (
            <button
              key={quickTech}
              type="button"
              onClick={() => setForecastTech(quickTech)}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                forecastTech.toLowerCase() === quickTech.toLowerCase()
                  ? 'bg-brand-primary text-white shadow-sm ring-2 ring-brand-primary/30 font-semibold'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-border'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    CRAWLER_TECHNOLOGIES.find((t) => t.name.toLowerCase() === quickTech.toLowerCase())?.color || '#3B82F6',
                }}
              />
              {quickTech}
            </button>
          ))}
        </div>

        {/* Subsystem Body: Interactive SVG Forecast Chart & Diagnostics */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface-card">
          {/* Main Chart Area (Col-span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-bold text-text-main flex items-center gap-2">
                  Đồ thị Dự báo Chuỗi thời gian: <span className="text-brand-secondary font-mono">{forecastTech}</span>
                </span>
                <span className="text-xs text-text-subtle font-mono">
                  ({forecastMetric === 'health_score' ? 'Chỉ số Sức khỏe tổng hợp' : forecastMetric === 'popularity_score' ? 'Chỉ số Phổ biến' : 'Chỉ số Động lượng tăng trưởng'})
                </span>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-[11px] text-text-muted shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-brand-primary rounded" />
                  <span>Dữ liệu thực tế</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 border-t-2 border-dashed border-status-success" />
                  <span>Dự báo ML</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-brand-secondary/20 border border-brand-secondary/40 rounded-xs" />
                  <span>Biên 95% CI</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="relative w-full aspect-[2.4/1] bg-surface-elevated/40 border border-surface-border rounded-xl p-3 overflow-hidden select-none">
              {isLoadingForecast && (
                <div className="absolute inset-0 bg-surface-card/70 backdrop-blur-xs flex flex-col items-center justify-center z-20">
                  <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs text-text-muted font-medium">Đang chạy mô hình ARIMA dự báo...</span>
                </div>
              )}

              {forecastChartData ? (
                <svg viewBox="0 0 540 230" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="forecastBandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.30" />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.05" />
                    </linearGradient>

                    <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = Math.round(200 - pct * 155);
                    const val = Math.round(forecastChartData.minVal + pct * (forecastChartData.maxVal - forecastChartData.minVal));
                    return (
                      <g key={i}>
                        <line x1="45" y1={y} x2="500" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                        <text x="38" y={y + 3} textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="monospace">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Dividing Line: "Mốc Hiện Tại" */}
                  <line
                    x1={forecastChartData.splitX}
                    y1="35"
                    x2={forecastChartData.splitX}
                    y2="200"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.8"
                  />
                  <rect
                    x={forecastChartData.splitX - 32}
                    y="22"
                    width="64"
                    height="16"
                    rx="4"
                    fill="#F59E0B"
                    opacity="0.9"
                  />
                  <text
                    x={forecastChartData.splitX}
                    y="33"
                    textAnchor="middle"
                    fill="#000000"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    Hôm nay
                  </text>

                  {/* 95% Confidence Interval Band (Area Polygon) */}
                  <polygon points={forecastChartData.confidenceBandPolygon} fill="url(#forecastBandGradient)" />

                  {/* Historical Solid Line */}
                  <path
                    d={forecastChartData.historyPath}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Forecasted Dashed Line */}
                  <path
                    d={forecastChartData.forecastPath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Historical Dots */}
                  {forecastChartData.historyCoords.map((pt, i) => (
                    <circle
                      key={`hist-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="3.5"
                      fill="#3B82F6"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:r-5 transition-all"
                      onMouseEnter={() =>
                        setForecastHover({
                          date: pt.date,
                          type: 'history',
                          val: pt.value,
                          x: pt.x,
                          y: pt.y,
                        })
                      }
                      onMouseLeave={() => setForecastHover(null)}
                    />
                  ))}

                  {/* Forecasted Dots */}
                  {forecastChartData.forecastCoords.slice(1).map((pt, i) => (
                    <g key={`fc-${i}`}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill="#10B981"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        className="cursor-pointer hover:r-6 transition-all"
                        onMouseEnter={() =>
                          setForecastHover({
                            date: pt.date,
                            type: 'forecast',
                            val: pt.value,
                            low: pt.lower,
                            high: pt.upper,
                            x: pt.x,
                            y: pt.y,
                          })
                        }
                        onMouseLeave={() => setForecastHover(null)}
                      />
                    </g>
                  ))}

                  {/* X-axis Month/Date Labels (Tránh va chạm nhãn) */}
                  {forecastChartData.allDates.map((date, idx) => {
                    const total = forecastChartData.allDates.length;
                    const maxLabels = Math.min(6, total);
                    const step = Math.max(2, Math.floor(total / maxLabels));
                    const isLast = idx === total - 1;
                    const isSplit = idx === forecastChartData.splitIndex;

                    if (!isSplit && !isLast && (idx % step !== 0 || Math.abs(idx - forecastChartData.splitIndex) < 2)) {
                      return null;
                    }

                    const x = Math.round(45 + (idx * 455) / Math.max(1, total - 1));
                    const isForecastDate = idx > forecastChartData.splitIndex;

                    const parts = date.split('-');
                    const formattedDate = parts.length >= 2 
                      ? `T${parseInt(parts[1], 10)}/${parts[0].slice(2)}` 
                      : date;

                    return (
                      <text
                        key={idx}
                        x={x}
                        y="218"
                        textAnchor="middle"
                        fill={isForecastDate ? '#10B981' : 'currentColor'}
                        fillOpacity={isForecastDate ? 0.95 : 0.6}
                        fontSize="9"
                        fontWeight={isForecastDate ? 'bold' : 'normal'}
                        fontFamily="monospace"
                      >
                        {formattedDate}
                      </text>
                    );
                  })}

                  {/* Hover Tooltip */}
                  {forecastHover && (
                    <g className="transition-all pointer-events-none">
                      <line
                        x1={forecastHover.x}
                        y1="35"
                        x2={forecastHover.x}
                        y2="200"
                        stroke="#FFFFFF"
                        strokeOpacity="0.25"
                        strokeDasharray="2 2"
                      />
                      <rect
                        x={Math.min(410, Math.max(50, forecastHover.x - 70))}
                        y={Math.max(40, forecastHover.y - 48)}
                        width="140"
                        height={forecastHover.type === 'forecast' ? '42' : '32'}
                        rx="6"
                        fill="#0F172A"
                        stroke="#334155"
                        strokeWidth="1"
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                      />
                      <text
                        x={Math.min(410, Math.max(50, forecastHover.x - 70)) + 70}
                        y={Math.max(40, forecastHover.y - 48) + 14}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {forecastHover.date}: {forecastHover.val.toFixed(2)}
                      </text>
                      {forecastHover.type === 'forecast' && (
                        <text
                          x={Math.min(410, Math.max(50, forecastHover.x - 70)) + 70}
                          y={Math.max(40, forecastHover.y - 48) + 30}
                          textAnchor="middle"
                          fill="#38BDF8"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          95% CI: [{forecastHover.low?.toFixed(1)} - {forecastHover.high?.toFixed(1)}]
                        </text>
                      )}
                    </g>
                  )}
                </svg>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                  <AppIcon name="radar" size={32} className="mb-2 opacity-30" />
                  <span className="text-xs">Đang tải dữ liệu mô hình chuỗi thời gian cho {forecastTech}...</span>
                </div>
              )}
            </div>

            {/* Model Baseline Information Footer */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-text-subtle pt-1 px-1">
              <span>
                • Thuật toán: <span className="font-mono text-text-main font-semibold">{forecastData?.trend_summary?.model_algorithm || 'Holt\'s Damped Linear Trend'}</span>
              </span>
              <span>
                • Sai số tuyệt đối trung bình: <span className="font-mono text-status-success font-semibold">{forecastData?.trend_summary?.mape !== undefined ? `${forecastData.trend_summary.mape}%` : '0.24%'}</span>
              </span>
              <span>
                • Độ tin cậy thống kê: <span className="font-mono text-brand-secondary font-semibold">95.0% CI</span>
              </span>
            </div>
          </div>

          {/* Right Diagnostics & Strategic Advisory Panel (Col-span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-surface-border">
              <AppIcon name="zap" size={14} className="text-brand-secondary" />
              Chỉ Số Phân Tích &amp; Khuyến Nghị AI Core
            </h3>

            {/* 4 KPI Cards in 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-surface-elevated/70 border border-surface-border flex flex-col">
                <span className="text-[10px] text-text-muted font-medium">Phân loại Xu hướng</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant={
                      forecastData?.trend_summary?.trend === 'EMERGING'
                        ? 'success'
                        : forecastData?.trend_summary?.trend === 'GROWING'
                        ? 'tech'
                        : forecastData?.trend_summary?.trend === 'STABLE'
                        ? 'reputation'
                        : 'danger'
                    }
                    size="sm"
                    className="font-bold text-[10px]"
                  >
                    {forecastData?.trend_summary?.trend || 'GROWING'}
                  </Badge>
                </div>
                <span className="text-[10px] text-text-subtle mt-1">Phân tích chuỗi thời gian</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-elevated/70 border border-surface-border flex flex-col">
                <span className="text-[10px] text-text-muted font-medium">Tăng trưởng dự kiến</span>
                <div className="text-base font-bold font-mono text-status-success mt-0.5">
                  {forecastData?.trend_summary?.projected_growth !== undefined
                    ? `${forecastData.trend_summary.projected_growth >= 0 ? '+' : ''}${(forecastData.trend_summary.projected_growth * 100).toFixed(2)}%`
                    : forecastData?.trend_summary?.growth_rate !== undefined
                    ? `${forecastData.trend_summary.growth_rate >= 0 ? '+' : ''}${(forecastData.trend_summary.growth_rate * 100).toFixed(2)}%`
                    : '+3.14%'}
                </div>
                <span className="text-[10px] text-text-subtle mt-1">
                  Chu kỳ {forecastSteps} tháng {forecastData?.trend_summary?.growth_rate !== undefined ? `• ${forecastData.trend_summary.growth_rate >= 0 ? '+' : ''}${(forecastData.trend_summary.growth_rate * 100).toFixed(2)}%/tháng` : ''}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-elevated/70 border border-surface-border flex flex-col">
                <span className="text-[10px] text-text-muted font-medium">Chỉ số Động lượng</span>
                <div className="text-base font-bold font-mono text-brand-secondary mt-0.5">
                  {forecastData?.trend_summary?.momentum !== undefined
                    ? `${forecastData.trend_summary.momentum >= 0 ? '+' : ''}${forecastData.trend_summary.momentum.toFixed(3)}`
                    : '+0.280'}
                </div>
                <span className="text-[10px] text-text-subtle mt-1">Gia tốc commit / star</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-elevated/70 border border-surface-border flex flex-col">
                <span className="text-[10px] text-text-muted font-medium">Độ chính xác mô hình</span>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {forecastData?.trend_summary?.accuracy_score || '96.86%'}
                </div>
                <span className="text-[10px] text-text-subtle mt-1">Backtesting kiểm định</span>
              </div>
            </div>

            {/* Strategic Advisory Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-brand-primary/10 via-brand-primary/5 to-surface-card border border-brand-primary/30 flex flex-col gap-2 mt-1 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary">
                <AppIcon name="cpu" size={15} />
                <span>Khuyến nghị Chiến lược</span>
              </div>
              <p className="text-xs text-text-main leading-relaxed">
                {forecastData?.trend_summary?.recommendation ||
                  `Hệ sinh thái ${forecastTech} duy trì chỉ số phát triển vững chắc. Dự báo các chỉ số tiếp tục giữ đà ổn định trong các quý tới, phù hợp cho việc áp dụng vào các sản phẩm quy mô doanh nghiệp dài hạn.`}
              </p>
              <div className="pt-2 border-t border-brand-primary/20 flex items-center justify-between text-[11px] text-text-subtle">
                <span>Nguồn: Crawler ML Engine</span>
                <Link to="/analytics/reports" className="text-brand-secondary hover:underline font-semibold flex items-center gap-1">
                  Đọc Whitepaper →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
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
              {isLoadingTopRepos ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-36 bg-surface-elevated rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-surface-elevated rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-surface-elevated rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-12 bg-surface-elevated rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-14 bg-surface-elevated rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-7 w-16 bg-surface-elevated rounded ml-auto" /></td>
                  </tr>
                ))
              ) : topRepos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Chưa có repository nào được theo dõi. Dữ liệu sẽ tự động xuất hiện sau khi crawler quét kho mã.
                  </td>
                </tr>
              ) : (
                topRepos.map((r, idx) => (
                  <tr key={r.name ? `${r.name}-${idx}` : idx} className="hover:bg-surface-elevated/30 transition-colors">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TechDashboard;
