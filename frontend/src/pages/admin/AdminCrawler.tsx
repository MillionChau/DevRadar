import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import { CrawlerJob } from '../../types';

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
}

const INITIAL_JOBS: CrawlerJob[] = [
  {
    id: 'job-1',
    targetRepo: 'tokio-rs/tokio',
    status: 'completed',
    itemsCrawled: 142,
    errorsCount: 0,
    startedAt: '2026-03-25T04:00:00Z',
    completedAt: '2026-03-25T04:04:12Z'
  },
  {
    id: 'job-2',
    targetRepo: 'dotnet/aspnetcore',
    status: 'running',
    itemsCrawled: 840,
    errorsCount: 1,
    startedAt: '2026-03-25T05:15:00Z'
  },
  {
    id: 'job-3',
    targetRepo: 'cilium/cilium',
    status: 'completed',
    itemsCrawled: 310,
    errorsCount: 0,
    startedAt: '2026-03-25T02:00:00Z',
    completedAt: '2026-03-25T02:07:45Z'
  },
  {
    id: 'job-4',
    targetRepo: 'facebook/react',
    status: 'failed',
    itemsCrawled: 42,
    errorsCount: 5,
    startedAt: '2026-03-24T22:00:00Z',
    completedAt: '2026-03-24T22:01:10Z'
  }
];

export const AdminCrawler: React.FC = () => {
  const [jobs, setJobs] = useState<CrawlerJob[]>(INITIAL_JOBS);
  const [repoInput, setRepoInput] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSyncingOld, setIsSyncingOld] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Crawler Configuration State (Per crawl_config.py & SCR-22 wireframe)
  const [config, setConfig] = useState<CrawlerConfigForm>({
    crawlIntervalMinutes: 1.5,
    updateIntervalMinutes: 3.0,
    modelRetrainDays: 1.0,
    maxReposPerJob: 5,
    updateBatchSize: 5,
    randomPageMax: 10,
    minStars: 5,
    maxStars: 5000,
    sortOption: 'updated'
  });

  const handleTriggerSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setIsTriggering(true);
    setTimeout(() => {
      const newJob: CrawlerJob = {
        id: `job-${Date.now()}`,
        targetRepo: repoInput.trim(),
        status: 'running',
        itemsCrawled: 0,
        errorsCount: 0,
        startedAt: new Date().toISOString()
      };
      setJobs(prev => [newJob, ...prev]);
      setRepoInput('');
      setIsTriggering(false);
    }, 600);
  };

  const handleTriggerBatchOld = () => {
    setIsSyncingOld(true);
    setTimeout(() => {
      setIsSyncingOld(false);
      alert('Đã kích hoạt đồng bộ batch 5 repositories cũ theo LRU queue!');
    }, 800);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <AppIcon name="Cpu" size={24} className="text-secondary-cyan" />
            Giám sát &amp; Cấu hình GitHub Crawler Engine (SCR-22)
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            FastAPI Service :8000 • Đồng bộ dữ liệu kho mã nguồn, cấu hình chu kỳ Cronjob và điều phối volume cào.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-success/15 text-accent-success border border-accent-success/30">
            <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
            Crawler Daemon Online (:8000)
          </span>
        </div>
      </div>

      {/* System Status Cards (Matches SCR-22 Wireframe) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="surface" className="border-border-default">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium uppercase">GitHub API Limit</span>
            <AppIcon name="Github" size={18} className="text-text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-text-primary">4,820 / 5,000</div>
          <div className="text-xs text-accent-success flex items-center gap-1 mt-1">
            <AppIcon name="CheckCircle" size={12} /> Hạn ngạch an toàn • Reset sau 28p
          </div>
        </Card>

        <Card variant="surface" className="border-border-default">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium uppercase">Crawler Service</span>
            <AppIcon name="Server" size={18} className="text-primary-blue" />
          </div>
          <div className="mt-2 text-2xl font-bold text-text-primary">Port :8000</div>
          <div className="text-xs text-accent-success flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" /> Daemon Healthy (Uptime: 99.9%)
          </div>
        </Card>

        <Card variant="surface" className="border-border-default">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium uppercase">CSDL MongoDB Atlas</span>
            <AppIcon name="Database" size={18} className="text-accent-indigo" />
          </div>
          <div className="mt-2 text-2xl font-bold text-text-primary">1,248 Repos</div>
          <div className="text-xs text-text-tertiary mt-1">Đã chuẩn hóa 100% • +34 repos/24h</div>
        </Card>

        <Card variant="surface" className="border-border-default flex flex-col justify-between">
          <span className="text-xs text-text-secondary font-medium uppercase">Kích hoạt nhanh</span>
          <div className="flex flex-col gap-1.5 mt-2">
            <Button
              variant="primary"
              size="sm"
              icon="Play"
              className="w-full justify-center text-xs"
              onClick={() => handleTriggerBatchOld()}
              isLoading={isSyncingOld}
            >
              Sync Repo Cũ (Batch: 5)
            </Button>
          </div>
        </Card>
      </div>

      {/* SECTION: CẤU HÌNH SCHEDULE, VOLUME & CRONJOB (crawl_config.json per SCR-22 wireframe) */}
      <Card variant="elevated" className="border-primary-blue/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-3">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <AppIcon name="Settings" size={18} className="text-primary-blue" />
              Cấu hình Lập lịch (Schedule) &amp; Định lượng Volume (crawl_config.json)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Dựa trên cấu hình microservice `CrawlerGithubService` • Tự động lưu và cập nhật APScheduler daemon
            </p>
          </div>
          {saveSuccess && (
            <span className="text-xs text-status-success font-semibold flex items-center gap-1">
              ✓ Đã lưu cấu hình thành công!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Column 1: Schedule Intervals */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              1. CHU KỲ LẬP LỊCH (SCHEDULE)
            </h3>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Cào repo mới (crawl_interval_minutes):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                  value={config.crawlIntervalMinutes}
                  onChange={(e) => setConfig({ ...config, crawlIntervalMinutes: parseFloat(e.target.value) || 1.5 })}
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-text-tertiary">phút / lần</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Đồng bộ repo cũ (update_interval_minutes):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                  value={config.updateIntervalMinutes}
                  onChange={(e) => setConfig({ ...config, updateIntervalMinutes: parseFloat(e.target.value) || 3.0 })}
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-text-tertiary">phút / lần</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Huấn luyện lại ML (retrain_interval_days):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                  value={config.modelRetrainDays}
                  onChange={(e) => setConfig({ ...config, modelRetrainDays: parseFloat(e.target.value) || 1.0 })}
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-text-tertiary">ngày (24h)</span>
              </div>
            </div>
          </div>

          {/* Column 2: Volume & Batch Size */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              2. ĐỊNH LƯỢNG VOLUME &amp; BATCH
            </h3>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Số repo tối đa/job (max_repos_per_job):
              </label>
              <input
                type="number"
                className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                value={config.maxReposPerJob}
                onChange={(e) => setConfig({ ...config, maxReposPerJob: parseInt(e.target.value) || 5 })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Batch cập nhật repo cũ (update_batch_size):
              </label>
              <input
                type="number"
                className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                value={config.updateBatchSize}
                onChange={(e) => setConfig({ ...config, updateBatchSize: parseInt(e.target.value) || 5 })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Trang ngẫu nhiên tối đa (random_page_max):
              </label>
              <input
                type="number"
                className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                value={config.randomPageMax}
                onChange={(e) => setConfig({ ...config, randomPageMax: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>

          {/* Column 3: Threshold & Query Filters */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              3. BỘ LỌC NGƯỠNG &amp; QUERIES
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Min Stars:
                </label>
                <input
                  type="number"
                  className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                  value={config.minStars}
                  onChange={(e) => setConfig({ ...config, minStars: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Max Stars:
                </label>
                <input
                  type="number"
                  className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-mono"
                  value={config.maxStars}
                  onChange={(e) => setConfig({ ...config, maxStars: parseInt(e.target.value) || 5000 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Tiêu chí sắp xếp GitHub (sort_options):
              </label>
              <select
                className="w-full bg-surface-elevated border border-border-default text-text-primary text-xs rounded-btn px-3 h-9 focus:outline-none focus:border-brand-primary font-medium"
                value={config.sortOption}
                onChange={(e) => setConfig({ ...config, sortOption: e.target.value })}
              >
                <option value="updated">Updated (Gần nhất)</option>
                <option value="stars">Stars (Nhiều sao nhất)</option>
                <option value="forks">Forks (Nhiều fork nhất)</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" icon="Check" className="w-full justify-center">
                Lưu cấu hình Crawler
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Manual Sync Trigger */}
      <Card variant="elevated" className="border-primary-blue/30">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <AppIcon name="RefreshCw" size={18} className="text-primary-blue" />
          Kích hoạt cào Repository GitHub theo yêu cầu
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Đưa kho lưu trữ vào hàng đợi để thu thập release notes, commit velocity và tính toán điểm sức khỏe Repo Health ngay lập tức.
        </p>

        <form onSubmit={handleTriggerSync} className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="flex-1">
            <Input
              placeholder="owner/repository (e.g. facebook/react hoặc dotnet/aspnetcore)"
              value={repoInput}
              onChange={e => setRepoInput(e.target.value)}
              leftIcon="Github"
              required
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            icon="Play"
            isLoading={isTriggering}
          >
            Khởi chạy Crawler
          </Button>
        </form>
      </Card>

      {/* Crawler Jobs Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-text-primary">Lịch sử thực thi tác vụ cào dữ liệu</h2>
        <Card variant="surface" className="overflow-x-auto p-0 border border-border-default">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-elevated/70 border-b border-border-default text-text-secondary text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Dữ liệu nạp</th>
                <th className="py-3 px-4">Lỗi phát sinh</th>
                <th className="py-3 px-4">Thời gian chạy</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/60">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      <AppIcon name="Github" size={16} className="text-text-secondary" />
                      {job.targetRepo}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {job.status === 'running' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-cyan/15 text-secondary-cyan">
                        <span className="w-2 h-2 rounded-full bg-secondary-cyan animate-pulse" />
                        Đang chạy...
                      </span>
                    )}
                    {job.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-success/15 text-accent-success">
                        <AppIcon name="CheckCircle" size={12} />
                        Hoàn thành
                      </span>
                    )}
                    {job.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-danger/15 text-accent-danger">
                        <AppIcon name="AlertTriangle" size={12} />
                        Thất bại
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {job.itemsCrawled} events
                  </td>
                  <td className="py-3 px-4">
                    {(job.errorsCount ?? 0) > 0 ? (
                      <span className="text-xs font-semibold text-accent-danger">
                        {job.errorsCount} lỗi
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-text-tertiary font-mono">
                    {new Date(job.startedAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="Terminal"
                      title="Xem execution logs"
                    >
                      Logs
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default AdminCrawler;
