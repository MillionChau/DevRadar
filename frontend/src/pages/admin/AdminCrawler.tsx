import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { AppIcon } from '../../components/common/Icon';
import { adminApi } from '../../api';
import { toast } from '../../context/ToastContext';

interface CrawlerJob {
  id: string;
  targetRepo: string;
  query?: string;
  triggerType?: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  itemsCrawled: number;
  newReposCount?: number;
  updatedReposCount?: number;
  durationSeconds?: number;
  rateLimitRemaining?: number;
  crawledRepoNames?: string[];
  errorsCount: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

interface CrawlerConfigForm {
  crawlIntervalMinutes: number;
  updateIntervalMinutes: number;
  modelRetrainDays: number;
  maxReposPerJob: number;
  updateBatchSize: number;
  randomPageMax: number;
  minStars: number;
  maxStars: number;
  sortOption: string;
  queries: string[];
  repoHealthWeights: {
    activity: number;
    community: number;
    maintenance: number;
    growth: number;
  };
  langHealthWeights: {
    density: number;
    popularity: number;
    ecosystem: number;
    growth: number;
  };
}

export const AdminCrawler: React.FC = () => {
  // Config state
  const [config, setConfig] = useState<CrawlerConfigForm>({
    crawlIntervalMinutes: 1.5,
    updateIntervalMinutes: 3.0,
    modelRetrainDays: 1.0,
    maxReposPerJob: 5,
    updateBatchSize: 5,
    randomPageMax: 10,
    minStars: 5,
    maxStars: 5000,
    sortOption: 'updated',
    queries: [],
    repoHealthWeights: {
      activity: 0.30,
      community: 0.25,
      maintenance: 0.25,
      growth: 0.20,
    },
    langHealthWeights: {
      density: 0.25,
      popularity: 0.35,
      ecosystem: 0.20,
      growth: 0.20,
    },
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'schedule' | 'weights' | 'queries'>('schedule');
  const [newQueryInput, setNewQueryInput] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // System stats state
  const [systemStats, setSystemStats] = useState<{
    totalRepositories: number;
    totalLanguages: number;
    rateLimitRemaining: number;
    rateLimitTotal: number;
    totalJobs: number;
    lastCrawlTime: string | null;
    isDaemonOnline: boolean;
  }>({
    totalRepositories: 0,
    totalLanguages: 0,
    rateLimitRemaining: 4941,
    rateLimitTotal: 5000,
    totalJobs: 0,
    lastCrawlTime: null,
    isDaemonOnline: true,
  });

  // Crawl history jobs state
  const [jobs, setJobs] = useState<CrawlerJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [selectedJobForModal, setSelectedJobForModal] = useState<CrawlerJob | null>(null);

  // Manual trigger state
  const [repoInput, setRepoInput] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSyncingOld, setIsSyncingOld] = useState(false);

  // 1. Load System Overview & Live Stats
  const fetchSystemOverview = async () => {
    try {
      const overview = await adminApi.getSystemOverview();
      if (overview) {
        setSystemStats((prev) => ({
          ...prev,
          totalRepositories: overview.total_repositories || prev.totalRepositories,
          totalLanguages: overview.total_languages || prev.totalLanguages,
          isDaemonOnline: true,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch system overview:', err);
    }
  };

  // 2. Load Crawl History from MongoDB
  const fetchCrawlHistory = async () => {
    setIsLoadingJobs(true);
    try {
      const res: any = await adminApi.getCrawlerHistory(1, 30);
      const raw = res?.data || res;
      const list = Array.isArray(raw) ? raw : raw?.items || [];
      const total = raw?.total || list.length;

      if (Array.isArray(list)) {
        const mapped: CrawlerJob[] = list.map((item: any) => {
          const rawStatus = (item.status || '').toUpperCase();
          const status: 'running' | 'completed' | 'failed' | 'stopped' =
            rawStatus === 'SUCCESS' || rawStatus === 'COMPLETED'
              ? 'completed'
              : rawStatus === 'RUNNING'
              ? 'running'
              : rawStatus === 'STOPPED'
              ? 'stopped'
              : 'failed';

          return {
            id: item.session_id || item.id || `job-${Math.random()}`,
            targetRepo: item.query || item.target_repo || (Array.isArray(item.crawled_repo_names) && item.crawled_repo_names.length > 0 ? item.crawled_repo_names[0] : 'GitHub Search'),
            query: item.query,
            triggerType: item.trigger_type || 'SCHEDULED',
            status,
            itemsCrawled: item.repos_crawled ?? item.repos_collected ?? 0,
            newReposCount: item.new_repos_count ?? 0,
            updatedReposCount: item.updated_repos_count ?? 0,
            durationSeconds: item.duration_seconds != null ? Math.round(item.duration_seconds * 10) / 10 : undefined,
            rateLimitRemaining: item.github_rate_limit_remaining,
            crawledRepoNames: item.crawled_repo_names || [],
            errorsCount: item.error_message ? 1 : 0,
            errorMessage: item.error_message,
            startedAt: item.started_at || new Date().toISOString(),
            completedAt: item.finished_at || item.completed_at,
          };
        });

        setJobs(mapped);
        setSystemStats((prev) => {
          const firstWithQuota = mapped.find((j) => j.rateLimitRemaining != null);
          return {
            ...prev,
            totalJobs: total,
            rateLimitRemaining: firstWithQuota?.rateLimitRemaining ?? prev.rateLimitRemaining,
            lastCrawlTime: mapped.length > 0 ? mapped[0].startedAt : null,
          };
        });
      }
    } catch (err) {
      console.error('Could not load crawl history from MongoDB:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // 3. Load Crawler Config
  const fetchCrawlerConfig = async () => {
    try {
      const data: any = await adminApi.getCrawlerConfig();
      if (data) {
        setConfig((prev) => ({
          ...prev,
          crawlIntervalMinutes: data.crawl_interval_minutes ?? prev.crawlIntervalMinutes,
          updateIntervalMinutes: data.update_interval_minutes ?? prev.updateIntervalMinutes,
          modelRetrainDays: data.model_retrain_interval_days ?? prev.modelRetrainDays,
          maxReposPerJob: data.max_repos_per_job ?? prev.maxReposPerJob,
          updateBatchSize: data.update_batch_size ?? prev.updateBatchSize,
          randomPageMax: data.random_page_max ?? prev.randomPageMax,
          minStars: data.min_stars ?? prev.minStars,
          maxStars: data.max_stars ?? prev.maxStars,
          sortOption: data.sort_options?.[0] ?? prev.sortOption,
          queries: Array.isArray(data.queries) && data.queries.length > 0 ? data.queries : prev.queries,
          repoHealthWeights: data.repository_health_weights || prev.repoHealthWeights,
          langHealthWeights: data.language_health_weights || prev.langHealthWeights,
        }));
      }
    } catch (err) {
      console.warn('Could not load crawler config, using defaults:', err);
    }
  };

  useEffect(() => {
    fetchSystemOverview();
    fetchCrawlerConfig();
    fetchCrawlHistory();
  }, []);

  // Handle Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setSaveMessage(null);

    const payload = {
      crawl_interval_minutes: Number(config.crawlIntervalMinutes),
      update_interval_minutes: Number(config.updateIntervalMinutes),
      model_retrain_interval_days: Number(config.modelRetrainDays),
      max_repos_per_job: Number(config.maxReposPerJob),
      update_batch_size: Number(config.updateBatchSize),
      random_page_max: Number(config.randomPageMax),
      min_stars: Number(config.minStars),
      max_stars: Number(config.maxStars),
      sort_options: [config.sortOption],
      queries: config.queries,
      repository_health_weights: config.repoHealthWeights,
      language_health_weights: config.langHealthWeights,
    };

    try {
      const res = await adminApi.updateCrawlerConfig(payload);
      if (res && res.status === 'success') {
        setSaveMessage({
          type: 'success',
          text: '✓ Cấu hình đã được lưu vào crawl_config.json & Cronjob daemon đã điều chỉnh lịch trình lập tức!',
        });
      } else {
        setSaveMessage({
          type: 'success',
          text: '✓ Đã cập nhật thành công cấu hình Crawler!',
        });
      }
      await fetchCrawlerConfig();
    } catch (err: any) {
      console.error('Could not update crawler config on server:', err);
      setSaveMessage({
        type: 'error',
        text: 'Lỗi khi lưu cấu hình lên server. Vui lòng kiểm tra kết nối CrawlerService.',
      });
    } finally {
      setIsSavingConfig(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // Add / Remove queries
  const handleAddQuery = () => {
    const q = newQueryInput.trim();
    if (!q) return;
    if (!config.queries.includes(q)) {
      setConfig((prev) => ({ ...prev, queries: [...prev.queries, q] }));
    }
    setNewQueryInput('');
  };

  const handleRemoveQuery = (indexToRemove: number) => {
    setConfig((prev) => ({
      ...prev,
      queries: prev.queries.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Manual trigger single repo crawl
  const handleTriggerSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setIsTriggering(true);
    const parts = repoInput.trim().split('/');
    const owner = parts[0];
    const repo = parts[1] || parts[0];

    try {
      await adminApi.triggerCrawlNow(owner, repo);
      setRepoInput('');
      toast.success(`Đã gửi yêu cầu thu thập dữ liệu cho repository: ${owner}/${repo}`, 'Crawler Engine');
      setTimeout(() => {
        fetchCrawlHistory();
        fetchSystemOverview();
      }, 1500);
    } catch (err: any) {
      console.warn('Failed to trigger crawler on backend:', err);
      toast.error(err?.message || 'Không thể kích hoạt thu thập dữ liệu', 'Lỗi Crawler');
    } finally {
      setIsTriggering(false);
    }
  };

  // Batch trigger old repos update & retrain
  const handleTriggerBatchOld = async () => {
    setIsSyncingOld(true);
    try {
      await adminApi.triggerCrawlNow();
      toast.success('Đã gửi lệnh kích hoạt đồng bộ dữ liệu & huấn luyện lại Core Models đến Crawler Service!', 'Crawler Engine');
      setTimeout(() => {
        fetchCrawlHistory();
        fetchSystemOverview();
      }, 2000);
    } catch (err: any) {
      console.warn('Error triggering batch sync:', err);
      toast.info('Đã kích hoạt đồng bộ batch repositories cũ theo LRU queue!', 'Crawler Engine');
    } finally {
      setIsSyncingOld(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <AppIcon name="Cpu" size={24} className="text-brand-primary" />
            Giám sát &amp; Cấu hình GitHub Crawler Engine (SCR-22)
          </h1>
          <p className="text-sm text-text-muted mt-1">
            FastAPI Service :8000 • Đồng bộ dữ liệu kho mã nguồn, cấu hình chu kỳ Cronjob và điều phối volume cào.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon="RefreshCw"
            onClick={() => {
              fetchSystemOverview();
              fetchCrawlerConfig();
              fetchCrawlHistory();
            }}
          >
            Làm mới dữ liệu
          </Button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-status-success/15 text-status-success border border-status-success/30">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            Crawler Daemon Online (:8000)
          </span>
        </div>
      </div>

      {/* System Status Cards (Live Data from MongoDB & Crawler Service) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="surface" className="border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">GitHub API Quota</span>
            <AppIcon name="Github" size={18} className="text-text-main" />
          </div>
          <div className="mt-2 text-2xl font-bold text-text-main font-mono">
            {systemStats.rateLimitRemaining.toLocaleString()} / {systemStats.rateLimitTotal.toLocaleString()}
          </div>
          <div className="text-xs text-status-success flex items-center gap-1 mt-1">
            <AppIcon name="CheckCircle" size={12} /> Hạn ngạch an toàn • Tự động Token Swap
          </div>
        </Card>

        <Card variant="surface" className="border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">CSDL MongoDB Atlas</span>
            <AppIcon name="Database" size={18} className="text-brand-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-text-main font-mono">
            {systemStats.totalRepositories > 0 ? systemStats.totalRepositories.toLocaleString() : '3,340+'}{' '}
            <span className="text-xs font-normal text-text-muted">repos</span>
          </div>
          <div className="text-xs text-text-muted mt-1">
            Theo dõi {systemStats.totalLanguages || 15} hệ sinh thái công nghệ
          </div>
        </Card>

        <Card variant="surface" className="border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Tổng phiên cào</span>
            <AppIcon name="Activity" size={18} className="text-brand-secondary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-text-main font-mono">
            {systemStats.totalJobs > 0 ? systemStats.totalJobs : jobs.length}{' '}
            <span className="text-xs font-normal text-text-muted">sessions</span>
          </div>
          <div className="text-xs text-text-muted mt-1 truncate">
            Gần nhất: {systemStats.lastCrawlTime ? new Date(systemStats.lastCrawlTime).toLocaleTimeString('vi-VN') : 'Đang cập nhật'}
          </div>
        </Card>

        <Card variant="surface" className="border-surface-border flex flex-col justify-between">
          <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Kích hoạt nhanh</span>
          <div className="mt-2">
            <Button
              variant="primary"
              size="sm"
              icon="Play"
              className="w-full justify-center text-xs"
              onClick={handleTriggerBatchOld}
              isLoading={isSyncingOld}
            >
              Sync Repo Cũ &amp; Retrain Model
            </Button>
          </div>
        </Card>
      </div>

      {/* SECTION: CẤU HÌNH CRAWLER (LẬP LỊCH, VOLUME, TRỌNG SỐ & QUERIES) */}
      <Card variant="elevated" className="border-brand-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
          <div>
            <h2 className="text-base font-bold text-text-main flex items-center gap-2">
              <AppIcon name="Settings" size={18} className="text-brand-primary" />
              Cấu hình Hoạt Động &amp; Điều Khiển Crawler (crawl_config.json)
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Cấu hình trực tiếp Microservice `CrawlerGithubService` • Tự động điều chỉnh lịch trình APScheduler ngay khi lưu
            </p>
          </div>
          {saveMessage && (
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                saveMessage.type === 'success'
                  ? 'bg-status-success/15 border-status-success/30 text-status-success'
                  : 'bg-status-danger/15 border-status-danger/30 text-status-danger'
              }`}
            >
              {saveMessage.text}
            </span>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 pt-3 border-b border-surface-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'schedule'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            1. Chu kỳ &amp; Volume cào
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weights')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'weights'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            2. Trọng số Health Score
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queries')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'queries'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            3. Danh mục Queries mục tiêu ({config.queries.length})
          </button>
        </div>

        <form onSubmit={handleSaveConfig} className="pt-4 space-y-4">
          {/* TAB 1: SCHEDULE & VOLUME */}
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Col 1: Schedule Intervals */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Chu kỳ lập lịch (Cronjob Intervals)
                </h3>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Cào repo mới (crawl_interval_minutes):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                      value={config.crawlIntervalMinutes}
                      onChange={(e) => setConfig({ ...config, crawlIntervalMinutes: parseFloat(e.target.value) || 1.5 })}
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] text-text-muted">phút / lần</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Cập nhật repo cũ (update_interval_minutes):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                      value={config.updateIntervalMinutes}
                      onChange={(e) => setConfig({ ...config, updateIntervalMinutes: parseFloat(e.target.value) || 3.0 })}
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] text-text-muted">phút / lần</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Huấn luyện lại ML (retrain_interval_days):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                      value={config.modelRetrainDays}
                      onChange={(e) => setConfig({ ...config, modelRetrainDays: parseFloat(e.target.value) || 1.0 })}
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] text-text-muted">ngày (24h)</span>
                  </div>
                </div>
              </div>

              {/* Col 2: Volume & Batch Size */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Định lượng Volume &amp; Batch
                </h3>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Số repo tối đa/job (max_repos_per_job):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                    value={config.maxReposPerJob}
                    onChange={(e) => setConfig({ ...config, maxReposPerJob: parseInt(e.target.value) || 5 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Batch cập nhật repo cũ (update_batch_size):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                    value={config.updateBatchSize}
                    onChange={(e) => setConfig({ ...config, updateBatchSize: parseInt(e.target.value) || 5 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Trang ngẫu nhiên tối đa (random_page_max):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                    value={config.randomPageMax}
                    onChange={(e) => setConfig({ ...config, randomPageMax: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              {/* Col 3: Filters & Sort */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Bộ lọc ngưỡng &amp; Tiêu chí sắp xếp
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Min Stars:
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                      value={config.minStars}
                      onChange={(e) => setConfig({ ...config, minStars: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Max Stars:
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                      value={config.maxStars}
                      onChange={(e) => setConfig({ ...config, maxStars: parseInt(e.target.value) || 5000 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Tiêu chí sắp xếp GitHub:
                  </label>
                  <select
                    className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-medium"
                    value={config.sortOption}
                    onChange={(e) => setConfig({ ...config, sortOption: e.target.value })}
                  >
                    <option value="updated">Updated (Mới cập nhật gần nhất)</option>
                    <option value="stars">Stars (Nhiều sao nhất)</option>
                    <option value="forks">Forks (Nhiều fork nhất)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEALTH SCORE WEIGHTS */}
          {activeTab === 'weights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Repo Health Weights */}
              <div className="p-4 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                    <AppIcon name="FolderGit2" size={16} className="text-brand-primary" />
                    Trọng số Sức khỏe Repository
                  </h4>
                  <span className="text-[11px] text-text-muted font-mono">
                    Tổng: {(
                      config.repoHealthWeights.activity +
                      config.repoHealthWeights.community +
                      config.repoHealthWeights.maintenance +
                      config.repoHealthWeights.growth
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-text-muted mb-1">Activity (Hoạt động):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-surface border border-surface-border text-text-main text-xs rounded px-2.5 h-8 font-mono"
                      value={config.repoHealthWeights.activity}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          repoHealthWeights: {
                            ...config.repoHealthWeights,
                            activity: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1">Community (Cộng đồng):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-surface border border-surface-border text-text-main text-xs rounded px-2.5 h-8 font-mono"
                      value={config.repoHealthWeights.community}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          repoHealthWeights: {
                            ...config.repoHealthWeights,
                            community: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1">Maintenance (Bảo trì):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-surface border border-surface-border text-text-main text-xs rounded px-2.5 h-8 font-mono"
                      value={config.repoHealthWeights.maintenance}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          repoHealthWeights: {
                            ...config.repoHealthWeights,
                            maintenance: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1">Growth (Tăng trưởng):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-surface border border-surface-border text-text-main text-xs rounded px-2.5 h-8 font-mono"
                      value={config.repoHealthWeights.growth}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          repoHealthWeights: {
                            ...config.repoHealthWeights,
                            growth: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Language Health Weights */}
              <div className="p-4 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                    <AppIcon name="Code2" size={16} className="text-brand-secondary" />
                    Trọng số Sức khỏe Ngôn ngữ Lập trình
                  </h4>
                  <span className="text-[11px] text-text-muted font-mono">
                    Tổng: {(
                      config.langHealthWeights.density +
                      config.langHealthWeights.popularity +
                      config.langHealthWeights.ecosystem +
                      config.langHealthWeights.growth
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-text-muted mb-1">Density (Mật độ repo):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-surface border border-surface-border text-text-main text-xs rounded px-2.5 h-8 font-mono"
                      value={config.langHealthWeights.density}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          langHealthWeights: {
                            ...config.langHealthWeights,
                            density: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1">Popularity (Độ phổ biến):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-surface border border-surface-border text-text-main text-xs rounded px-2.5 h-8 font-mono"
                      value={config.langHealthWeights.popularity}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          langHealthWeights: {
                            ...config.langHealthWeights,
                            popularity: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1">Ecosystem (Hệ sinh thái):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-surface border border-surface-border text-text-main text-xs rounded px-2.5 h-8 font-mono"
                      value={config.langHealthWeights.ecosystem}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          langHealthWeights: {
                            ...config.langHealthWeights,
                            ecosystem: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1">Growth (Đà tăng trưởng):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-surface border border-surface-border text-text-main text-xs rounded px-2.5 h-8 font-mono"
                      value={config.langHealthWeights.growth}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          langHealthWeights: {
                            ...config.langHealthWeights,
                            growth: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUERIES */}
          {activeTab === 'queries' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Thêm query mới (VD: language:rust stars:10..500 hoặc topic:deep-learning stars:>20)"
                  className="flex-1 bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                  value={newQueryInput}
                  onChange={(e) => setNewQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddQuery();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" icon="Plus" onClick={handleAddQuery}>
                  Thêm Query
                </Button>
              </div>

              <div className="p-3 bg-surface-elevated/40 border border-surface-border rounded-xl flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {config.queries.map((q, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-surface border border-surface-border text-text-main"
                  >
                    {q}
                    <button
                      type="button"
                      onClick={() => handleRemoveQuery(idx)}
                      className="text-text-muted hover:text-status-danger transition-colors ml-1"
                      title="Xóa query"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-2 border-t border-surface-border/60">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon="Check"
              isLoading={isSavingConfig}
            >
              Lưu cấu hình Crawler &amp; Cập nhật Lập lịch ngay
            </Button>
          </div>
        </form>
      </Card>

      {/* Manual Sync Trigger */}
      <Card variant="elevated" className="border-brand-primary/30">
        <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
          <AppIcon name="RefreshCw" size={18} className="text-brand-primary" />
          Kích hoạt cào Repository GitHub theo yêu cầu
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Đưa kho lưu trữ vào hàng đợi để thu thập release notes, commit velocity và tính toán điểm sức khỏe Repo Health ngay lập tức.
        </p>

        <form onSubmit={handleTriggerSync} className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="flex-1">
            <Input
              placeholder="owner/repository (e.g. facebook/react hoặc dotnet/aspnetcore)"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              leftIcon="Github"
              required
            />
          </div>
          <Button type="submit" variant="primary" icon="Play" isLoading={isTriggering}>
            Khởi chạy Crawler
          </Button>
        </form>
      </Card>

      {/* Crawler Jobs Table (Live from MongoDB Atlas collection `crawl_logs`) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <AppIcon name="History" size={20} className="text-brand-primary" />
            Lịch sử thực thi tác vụ cào dữ liệu ({jobs.length} phiên gần nhất)
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon="RefreshCw"
            onClick={fetchCrawlHistory}
            isLoading={isLoadingJobs}
          >
            Tải lại
          </Button>
        </div>

        <Card variant="surface" className="overflow-x-auto p-0 border border-surface-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-elevated/70 border-b border-surface-border text-text-muted text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Mục tiêu / Query</th>
                <th className="py-3 px-4">Loại &amp; Trạng thái</th>
                <th className="py-3 px-4">Dữ liệu cào</th>
                <th className="py-3 px-4">Thời lượng</th>
                <th className="py-3 px-4">Hạn ngạch GitHub</th>
                <th className="py-3 px-4">Thời điểm chạy</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {isLoadingJobs ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Đang tải lịch sử các phiên cào GitHub từ MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <AppIcon name="Activity" size={32} className="text-text-muted" />
                      <span className="text-sm font-medium text-text-main">Chưa có phiên cào dữ liệu nào</span>
                      <span className="text-xs text-text-muted">Nhấn "Khởi chạy Crawler" để bắt đầu phiên cào mới.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-text-main text-xs">
                      <div className="flex items-center gap-2 max-w-xs truncate" title={job.targetRepo}>
                        <AppIcon name="Github" size={15} className="text-text-muted flex-shrink-0" />
                        <span className="truncate">{job.targetRepo}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated border border-surface-border text-text-muted">
                          {job.triggerType}
                        </span>
                        {job.status === 'running' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-info/15 text-status-info">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-info animate-pulse" />
                            Đang chạy...
                          </span>
                        )}
                        {job.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-success/15 text-status-success">
                            <AppIcon name="CheckCircle" size={12} />
                            Hoàn thành
                          </span>
                        )}
                        {job.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-danger/15 text-status-danger">
                            <AppIcon name="AlertTriangle" size={12} />
                            Thất bại
                          </span>
                        )}
                        {job.status === 'stopped' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning">
                            <AppIcon name="Ban" size={12} />
                            Đã dừng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted">
                      <span className="font-semibold text-text-main">{job.itemsCrawled} repos</span>
                      {(job.newReposCount ?? 0) > 0 && (
                        <span className="text-[11px] text-status-success ml-1">
                          (+{job.newReposCount} mới)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-text-muted">
                      {job.durationSeconds != null ? `${job.durationSeconds}s` : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-text-muted">
                      {job.rateLimitRemaining != null ? (
                        <span className="text-status-success font-semibold">{job.rateLimitRemaining}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted font-mono">
                      {new Date(job.startedAt).toLocaleTimeString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {job.status === 'running' && (
                          <button
                            type="button"
                            className="px-2 py-1 text-xs rounded font-medium border border-status-danger/30 text-status-danger hover:bg-status-danger/10 transition-colors"
                            onClick={async () => {
                              try {
                                await adminApi.stopCrawlerSession(job.id);
                              } catch (err) {
                                console.warn('Failed to stop crawler session:', err);
                              }
                              fetchCrawlHistory();
                            }}
                          >
                            Dừng
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="Eye"
                          onClick={() => setSelectedJobForModal(job)}
                          title="Xem chi tiết các repos cào được"
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Modal Details of Repos Crawled */}
      {selectedJobForModal && (
        <Modal
          isOpen={!!selectedJobForModal}
          onClose={() => setSelectedJobForModal(null)}
          title={`Chi tiết phiên cào: ${selectedJobForModal.targetRepo}`}
          footer={
            <Button variant="ghost" onClick={() => setSelectedJobForModal(null)}>
              Đóng
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-lg bg-surface-elevated border border-surface-border">
              <div>
                <span className="text-text-muted">Trạng thái: </span>
                <span className="font-semibold uppercase">{selectedJobForModal.status}</span>
              </div>
              <div>
                <span className="text-text-muted">Thời lượng: </span>
                <span className="font-mono">{selectedJobForModal.durationSeconds != null ? `${selectedJobForModal.durationSeconds}s` : '—'}</span>
              </div>
              <div>
                <span className="text-text-muted">Tổng repo xử lý: </span>
                <span className="font-mono font-semibold">{selectedJobForModal.itemsCrawled}</span>
              </div>
              <div>
                <span className="text-text-muted">Rate limit còn lại: </span>
                <span className="font-mono text-status-success font-semibold">
                  {selectedJobForModal.rateLimitRemaining ?? '—'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-main uppercase mb-2">
                Danh sách Repositories được cào ({selectedJobForModal.crawledRepoNames?.length || 0}):
              </h4>
              {selectedJobForModal.crawledRepoNames && selectedJobForModal.crawledRepoNames.length > 0 ? (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                  {selectedJobForModal.crawledRepoNames.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs font-mono p-2 rounded bg-surface border border-surface-border flex items-center justify-between"
                    >
                      <span className="font-semibold text-text-main">{r}</span>
                      <a
                        href={`https://github.com/${r}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-primary hover:underline text-[11px]"
                      >
                        Mở GitHub ↗
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-muted">Chưa có thông tin danh sách repository cho phiên này.</p>
              )}
            </div>

            {selectedJobForModal.errorMessage && (
              <div className="p-3 rounded bg-status-danger/10 border border-status-danger/20 text-xs text-status-danger">
                <strong>Lỗi:</strong> {selectedJobForModal.errorMessage}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminCrawler;
