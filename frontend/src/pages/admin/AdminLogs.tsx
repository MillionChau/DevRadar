import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { AppIcon } from '../../components/common/Icon';
import { RoleBadge } from '../../components/common/Badge';
import { UserRole } from '../../types';
import { adminApi } from '../../api';

export interface SystemLogItem {
  id: string;
  timestamp: string;
  service: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  category: 'HTTP_REQUEST' | 'CRAWL_ENGINE' | 'MODEL_PERFORMANCE' | 'AUDIT';
  message: string;
  method?: string;
  path?: string;
  status_code?: number;
  elapsed_ms?: number;
  ip?: string;
  trace_id?: string;
  extra?: Record<string, any>;
}

export interface UserActivityLogItem {
  id: string;
  timestamp: string;
  username: string;
  display_name: string;
  role: UserRole;
  avatar_url?: string;
  action: string;
  action_label: string;
  category: string;
  target_type?: string;
  target_name?: string;
  target_id?: string;
  ip_address: string;
  user_agent: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  details?: Record<string, any>;
}

interface MicroserviceStatus {
  name: string;
  port: number;
  status: string;
  type: string;
}

export const AdminLogs: React.FC = () => {
  // Main Tab: 'system' (Nhật ký Hệ thống) hoặc 'user' (Nhật ký Người dùng)
  const [mainTab, setMainTab] = useState<'system' | 'user'>('system');

  // ================= SYSTEM LOGS STATE =================
  const [systemLogs, setSystemLogs] = useState<SystemLogItem[]>([]);
  const [totalUnfilteredSystem, setTotalUnfilteredSystem] = useState(0);
  const [isLoadingSystem, setIsLoadingSystem] = useState(true);
  const [isLiveStream, setIsLiveStream] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'terminal'>('table');
  const [selectedSystemLog, setSelectedSystemLog] = useState<SystemLogItem | null>(null);

  // System filters
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuerySystem, setSearchQuerySystem] = useState('');

  // System metrics
  const [systemMetrics, setSystemMetrics] = useState({
    error_count: 0,
    warning_count: 0,
    info_count: 0,
    avg_latency_ms: 0,
    error_rate_pct: 0,
  });

  const [services, setServices] = useState<MicroserviceStatus[]>([
    { name: 'GatewayService', port: 5000, status: 'ONLINE', type: '.NET YARP' },
    { name: 'CrawlerGithubService', port: 8000, status: 'ONLINE', type: 'FastAPI' },
    { name: 'IdentityService', port: 5002, status: 'ONLINE', type: '.NET 10' },
    { name: 'CommunityService', port: 5145, status: 'ONLINE', type: '.NET 10' },
    { name: 'NotificationService', port: 5003, status: 'ONLINE', type: '.NET 10' },
    { name: 'QualityService', port: 8001, status: 'ONLINE', type: 'FastAPI' },
  ]);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // ================= USER ACTIVITY LOGS STATE =================
  const [userLogs, setUserLogs] = useState<UserActivityLogItem[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedUserLog, setSelectedUserLog] = useState<UserActivityLogItem | null>(null);

  // User filters
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userActionFilter, setUserActionFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [searchQueryUser, setSearchQueryUser] = useState('');

  // User metrics
  const [userMetrics, setUserMetrics] = useState({
    total_events: 0,
    active_users: 0,
    security_events: 0,
    success_rate_pct: 100,
  });

  // Fetch System Logs
  const fetchSystemLogs = async (silent = false) => {
    if (!silent) setIsLoadingSystem(true);
    try {
      const res = await adminApi.getSystemLogs({
        service: serviceFilter !== 'ALL' ? serviceFilter : undefined,
        level: levelFilter !== 'ALL' ? levelFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: searchQuerySystem.trim() || undefined,
        limit: 150,
      });

      if (res) {
        setSystemLogs(res.items || []);
        setTotalUnfilteredSystem(res.total_unfiltered || res.total || 0);
        if (res.metrics) setSystemMetrics(res.metrics);
        if (res.services && Array.isArray(res.services)) setServices(res.services);
      }
    } catch (err) {
      console.warn('Could not fetch system logs:', err);
    } finally {
      if (!silent) setIsLoadingSystem(false);
    }
  };

  // Fetch User Activity Logs
  const fetchUserLogs = async (silent = false) => {
    if (!silent) setIsLoadingUser(true);
    try {
      const res = await adminApi.getUserActivityLogs({
        role: userRoleFilter !== 'ALL' ? userRoleFilter : undefined,
        action: userActionFilter !== 'ALL' ? userActionFilter : undefined,
        status: userStatusFilter !== 'ALL' ? userStatusFilter : undefined,
        search: searchQueryUser.trim() || undefined,
        limit: 100,
      });

      if (res) {
        setUserLogs(res.items || []);
        if (res.metrics) setUserMetrics(res.metrics);
      }
    } catch (err) {
      console.warn('Could not fetch user activity logs:', err);
    } finally {
      if (!silent) setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'system') {
      fetchSystemLogs();
    } else {
      fetchUserLogs();
    }
  }, [
    mainTab,
    serviceFilter,
    levelFilter,
    categoryFilter,
    searchQuerySystem,
    userRoleFilter,
    userActionFilter,
    userStatusFilter,
    searchQueryUser,
  ]);

  // Live polling (4s)
  useEffect(() => {
    if (!isLiveStream) return;
    const interval = setInterval(() => {
      if (mainTab === 'system') {
        fetchSystemLogs(true);
      } else {
        fetchUserLogs(true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveStream, mainTab, serviceFilter, levelFilter, categoryFilter, searchQuerySystem, userRoleFilter, userActionFilter, userStatusFilter, searchQueryUser]);

  // Terminal auto scroll
  useEffect(() => {
    if (viewMode === 'terminal' && terminalEndRef.current && mainTab === 'system') {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemLogs, viewMode, mainTab]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExportJSON = () => {
    const dataToExport = mainTab === 'system' ? systemLogs : userLogs;
    const prefix = mainTab === 'system' ? 'system-logs' : 'user-activity-logs';
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `devradar-${prefix}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [isClearingLogs, setIsClearingLogs] = useState(false);

  const handleClearUserLogs = async (clearType: 'mock' | 'all') => {
    const confirmMsg =
      clearType === 'mock'
        ? 'Bạn có chắc chắn muốn xóa tất cả bản ghi dữ liệu mẫu (mock)? Các hành động thực tế tiếp theo của người dùng sẽ được ghi nhận trực tiếp.'
        : 'CẢNH BÁO: Bạn có chắc chắn muốn làm sạch toàn bộ lịch sử nhật ký người dùng? Hành động này không thể hoàn tác.';

    if (!window.confirm(confirmMsg)) return;

    setIsClearingLogs(true);
    try {
      await adminApi.clearUserActivityLogs(clearType);
      await fetchUserLogs();
    } catch (err) {
      console.warn('Could not clear user logs:', err);
    } finally {
      setIsClearingLogs(false);
    }
  };

  const renderLevelBadge = (level: SystemLogItem['level']) => {
    switch (level) {
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-danger/15 text-status-danger border border-status-danger/30">
            <AppIcon name="alertTriangle" size={11} /> ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-warning/15 text-status-warning border border-status-warning/30">
            <AppIcon name="alertTriangle" size={11} /> WARN
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
            <AppIcon name="checkCircle" size={11} /> SUCCESS
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
            <AppIcon name="info" size={11} /> INFO
          </span>
        );
    }
  };

  const renderUserStatusBadge = (status: UserActivityLogItem['status']) => {
    switch (status) {
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-warning/15 text-status-warning border border-status-warning/30">
            <AppIcon name="shieldAlert" size={11} /> BỊ CHẶN
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-danger/15 text-status-danger border border-status-danger/30">
            <AppIcon name="alertTriangle" size={11} /> THẤT BẠI
          </span>
        );
      case 'SUCCESS':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
            <AppIcon name="checkCircle" size={11} /> THÀNH CÔNG
          </span>
        );
    }
  };

  const renderActionCategoryBadge = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">BẢO MẬT</span>;
      case 'MODERATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">KIỂM DUYỆT</span>;
      case 'CONTENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">NỘI DUNG</span>;
      case 'ANALYTICS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">PHÂN TÍCH</span>;
      case 'SYSTEM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">HỆ THỐNG</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-elevated text-text-muted border border-surface-border">HOẠT ĐỘNG</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <AppIcon name="terminal" size={24} className="text-brand-primary" />
            Nhật ký Giám sát &amp; Kiểm toán (Logs Console)
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Trung tâm giám sát toàn diện: Nhật ký Hệ thống (Microservices, HTTP Requests, Crawler, ML Models) và Nhật ký Hoạt động Người dùng.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold border transition-all ${
              isLiveStream
                ? 'bg-status-success/15 text-status-success border-status-success/40'
                : 'bg-surface-elevated text-text-muted border-surface-border hover:text-text-main'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveStream ? 'bg-status-success animate-pulse' : 'bg-text-muted'}`} />
            {isLiveStream ? 'Live Polling: Bật (4s)' : 'Live Polling: Tắt'}
          </button>

          <Button variant="outline" size="sm" icon="Download" onClick={handleExportJSON}>
            Xuất JSON
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon="RefreshCw"
            onClick={() => (mainTab === 'system' ? fetchSystemLogs() : fetchUserLogs())}
            isLoading={mainTab === 'system' ? isLoadingSystem : isLoadingUser}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation: SYSTEM LOGS vs USER ACTIVITY LOGS */}
      <div className="flex items-center gap-2 p-1 rounded-card bg-surface-card border border-surface-border w-fit">
        <button
          type="button"
          onClick={() => setMainTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-btn text-xs font-bold transition-all ${
            mainTab === 'system'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
          }`}
        >
          <AppIcon name="cpu" size={15} />
          Nhật ký Hệ thống &amp; API (System Logs)
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {totalUnfilteredSystem || systemLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('user')}
          className={`flex items-center gap-2 px-4 py-2 rounded-btn text-xs font-bold transition-all ${
            mainTab === 'user'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
          }`}
        >
          <AppIcon name="user" size={15} />
          Nhật ký Hoạt động Người dùng (User Activity &amp; Audit)
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {userMetrics.total_events || userLogs.length}
          </span>
        </button>
      </div>

      {/* ======================= TAB 1: SYSTEM LOGS ======================= */}
      {mainTab === 'system' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Microservice Hubs Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="p-2.5 rounded-card bg-surface-elevated/40 border border-surface-border flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-text-subtle font-semibold">{svc.type}</span>
                  <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" title="Healthy" />
                </div>
                <div className="mt-1">
                  <div className="text-xs font-bold text-text-main truncate" title={svc.name}>
                    {svc.name.replace('Service', '')}
                  </div>
                  <div className="text-[10px] font-mono text-text-muted">Port :{svc.port}</div>
                </div>
              </div>
            ))}
          </div>

          {/* System KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="surface" className="border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Tổng Log Events</span>
                <AppIcon name="activity" size={18} className="text-brand-primary" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-main font-mono">
                {totalUnfilteredSystem.toLocaleString()}
              </div>
              <div className="text-xs text-text-muted mt-1">Đang hiển thị {systemLogs.length} bản ghi gần nhất</div>
            </Card>

            <Card variant="surface" className="border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Tỷ lệ Lỗi (Error Rate)</span>
                <AppIcon name="alertTriangle" size={18} className="text-status-danger" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-main font-mono">
                {systemMetrics.error_rate_pct}%
              </div>
              <div className="text-xs text-text-muted mt-1">
                {systemMetrics.error_count} lỗi • {systemMetrics.warning_count} cảnh báo
              </div>
            </Card>

            <Card variant="surface" className="border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Độ trễ trung bình</span>
                <AppIcon name="cpu" size={18} className="text-brand-secondary" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-main font-mono">
                {systemMetrics.avg_latency_ms} ms
              </div>
              <div className="text-xs text-status-success flex items-center gap-1 mt-1">
                <AppIcon name="checkCircle" size={12} /> Thời gian phản hồi tối ưu
              </div>
            </Card>

            <Card variant="surface" className="border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Distributed Trace ID</span>
                <AppIcon name="shieldCheck" size={18} className="text-status-success" />
              </div>
              <div className="mt-2 text-sm font-semibold text-text-main font-mono truncate">W3C Traceparent</div>
              <div className="text-[11px] text-text-muted mt-1">Đồng bộ xuyên Gateway &amp; Microservices</div>
            </Card>
          </div>

          {/* System Filter Controls */}
          <Card variant="elevated" className="border-surface-border space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">Dịch vụ:</label>
                  <select
                    className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-2.5 h-8 focus:outline-none focus:border-brand-primary"
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                  >
                    <option value="ALL">Tất cả Microservices</option>
                    <option value="GatewayService">GatewayService (:5000)</option>
                    <option value="CrawlerGithubService">CrawlerGithubService (:8000)</option>
                    <option value="IdentityService">IdentityService (:5002)</option>
                    <option value="CommunityService">CommunityService (:5145)</option>
                    <option value="NotificationService">NotificationService (:5003)</option>
                    <option value="QualityService">QualityService (:8001)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">Cấp độ (Level):</label>
                  <select
                    className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-2.5 h-8 focus:outline-none focus:border-brand-primary"
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                  >
                    <option value="ALL">Tất cả cấp độ</option>
                    <option value="INFO">INFO (Thông tin)</option>
                    <option value="SUCCESS">SUCCESS (Thành công)</option>
                    <option value="WARNING">WARNING (Cảnh báo)</option>
                    <option value="ERROR">ERROR (Lỗi 5xx / Thất bại)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">Phân loại:</label>
                  <select
                    className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-2.5 h-8 focus:outline-none focus:border-brand-primary"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="ALL">Tất cả loại log</option>
                    <option value="HTTP_REQUEST">HTTP Requests</option>
                    <option value="CRAWL_ENGINE">GitHub Crawler Engine</option>
                    <option value="MODEL_PERFORMANCE">AI / Model Evaluation</option>
                    <option value="AUDIT">Audit &amp; Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">Tìm kiếm:</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Lọc path, trace, message..."
                      className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn pl-2.5 pr-7 h-8 focus:outline-none focus:border-brand-primary"
                      value={searchQuerySystem}
                      onChange={(e) => setSearchQuerySystem(e.target.value)}
                    />
                    {searchQuerySystem && (
                      <button
                        type="button"
                        onClick={() => setSearchQuerySystem('')}
                        className="absolute right-2 top-2 text-text-muted hover:text-text-main text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-end justify-end gap-1.5 pt-2 md:pt-0">
                <div className="flex p-0.5 rounded-btn bg-surface-elevated border border-surface-border">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'table' ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <AppIcon name="layers" size={13} />
                    Bảng
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('terminal')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'terminal' ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <AppIcon name="terminal" size={13} />
                    Console
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* System Display: Table or Terminal */}
          {viewMode === 'table' ? (
            <Card variant="surface" className="overflow-x-auto p-0 border border-surface-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-elevated/70 border-b border-surface-border text-text-muted text-[11px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Dịch vụ</th>
                    <th className="py-2.5 px-3">Method / Action</th>
                    <th className="py-2.5 px-3">Thông điệp / Path</th>
                    <th className="py-2.5 px-3">Độ trễ</th>
                    <th className="py-2.5 px-3">Trace ID</th>
                    <th className="py-2.5 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60">
                  {isLoadingSystem && systemLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-text-muted">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">Đang tải nhật ký hệ thống...</span>
                        </div>
                      </td>
                    </tr>
                  ) : systemLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-text-muted">
                        <div className="flex flex-col items-center gap-2">
                          <AppIcon name="fileText" size={28} className="text-text-subtle" />
                          <span className="text-sm font-medium text-text-main">Không tìm thấy bản ghi log nào phù hợp</span>
                          <span className="text-xs text-text-muted">Hãy thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    systemLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-elevated/40 transition-colors text-xs font-mono">
                        <td className="py-2.5 px-3 text-text-muted whitespace-nowrap text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString('vi-VN', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{renderLevelBadge(log.level)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-sans font-medium text-text-main">
                          <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-[11px] border border-surface-border">
                            {log.service.replace('Service', '')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                log.method === 'GET'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : log.method === 'POST'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : log.method === 'PUT'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : log.method === 'DELETE'
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              }`}
                            >
                              {log.method || 'ACTION'}
                            </span>
                            {log.status_code && (
                              <span
                                className={`font-semibold text-[11px] ${
                                  log.status_code >= 500
                                  ? 'text-status-danger'
                                  : log.status_code >= 400
                                  ? 'text-status-warning'
                                  : 'text-status-success'
                                }`}
                              >
                                {log.status_code}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 max-w-md truncate font-sans text-text-main text-[12px]" title={log.message}>
                          {log.message}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-text-muted text-[11px]">
                          {log.elapsed_ms != null ? `${log.elapsed_ms} ms` : '—'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-text-subtle text-[11px]">
                          {log.trace_id && log.trace_id !== '-' ? (
                            <button
                              type="button"
                              onClick={() => handleCopy(log.trace_id!)}
                              className="hover:text-brand-primary underline truncate max-w-[90px] block"
                              title={`Trace: ${log.trace_id} (Click to copy)`}
                            >
                              {log.trace_id.slice(0, 8)}…
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" icon="Eye" onClick={() => setSelectedSystemLog(log)}>
                            Xem
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          ) : (
            <div className="rounded-xl border border-surface-border bg-[#0d1117] text-[#c9d1d9] font-mono p-4 text-xs shadow-2xl overflow-hidden flex flex-col h-[600px]">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-[11px] text-[#8b949e] font-semibold">devradar@cluster-core: ~ log-stream --tail -f</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(systemLogs.map((l) => `[${l.timestamp}] [${l.level}] [${l.service}] ${l.message}`).join('\n'))}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[11px]"
                  >
                    Copy All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSystemLogs([])}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white text-[11px]"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 font-mono text-[11.5px] leading-relaxed">
                {systemLogs.length === 0 ? (
                  <div className="text-[#8b949e] italic py-8 text-center">Console buffer is empty or waiting for incoming events...</div>
                ) : (
                  systemLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedSystemLog(log)}
                      className="cursor-pointer hover:bg-[#161b22] px-2 py-0.5 rounded transition-colors flex items-start gap-2"
                    >
                      <span className="text-[#8b949e] flex-shrink-0 select-none">
                        [{new Date(log.timestamp).toISOString().slice(11, 19)}]
                      </span>
                      <span
                        className={`font-bold flex-shrink-0 ${
                          log.level === 'ERROR'
                            ? 'text-[#f85149]'
                            : log.level === 'WARNING'
                            ? 'text-[#d29922]'
                            : log.level === 'SUCCESS'
                            ? 'text-[#3fb950]'
                            : 'text-[#58a6ff]'
                        }`}
                      >
                        [{log.level}]
                      </span>
                      <span className="text-[#bc8cff] flex-shrink-0">[{log.service}]</span>
                      <span className="flex-1 break-all">
                        {log.message}
                        {log.trace_id && log.trace_id !== '-' && <span className="text-[#8b949e] ml-2">trace={log.trace_id}</span>}
                      </span>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: USER ACTIVITY LOGS ======================= */}
      {mainTab === 'user' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* User Activity KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="surface" className="border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Tổng Sự kiện Người dùng</span>
                <AppIcon name="user" size={18} className="text-brand-primary" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-main font-mono">
                {userMetrics.total_events.toLocaleString()}
              </div>
              <div className="text-xs text-text-muted mt-1">Được lưu trữ an toàn trong MongoDB Atlas</div>
            </Card>

            <Card variant="surface" className="border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Người dùng Hoạt động</span>
                <AppIcon name="Users" size={18} className="text-status-success" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-main font-mono">
                {userMetrics.active_users}
              </div>
              <div className="text-xs text-text-muted mt-1">Thành viên có phát sinh thao tác gần đây</div>
            </Card>

            <Card variant="surface" className="border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Sự kiện An ninh / Kiểm duyệt</span>
                <AppIcon name="shieldAlert" size={18} className="text-status-warning" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-main font-mono">
                {userMetrics.security_events}
              </div>
              <div className="text-xs text-text-muted mt-1">Khóa tài khoản, duyệt vi phạm, chặn đăng nhập</div>
            </Card>

            <Card variant="surface" className="border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Tỷ lệ Thành công</span>
                <AppIcon name="checkCircle" size={18} className="text-status-success" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-main font-mono">
                {userMetrics.success_rate_pct}%
              </div>
              <div className="text-xs text-status-success mt-1">Hệ thống xử lý thao tác người dùng ổn định</div>
            </Card>
          </div>

          {/* User Filters Controls */}
          <Card variant="elevated" className="border-surface-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Lọc theo Vai trò (Role):</label>
                <select
                  className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-2.5 h-8 focus:outline-none focus:border-brand-primary"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="Admin">Admin (Quản trị viên)</option>
                  <option value="Moderator">Moderator (Kiểm duyệt viên)</option>
                  <option value="Member">Member (Thành viên chính thức)</option>
                  <option value="Guest">Guest (Khách vãng lai)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Nhóm Hành động:</label>
                <select
                  className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-2.5 h-8 focus:outline-none focus:border-brand-primary"
                  value={userActionFilter}
                  onChange={(e) => setUserActionFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả nhóm hành động</option>
                  <option value="CONTENT">Nội dung (Bài viết, Bình luận, Ghim)</option>
                  <option value="MODERATION">Kiểm duyệt (Phê duyệt ẩn, Xử lý báo cáo)</option>
                  <option value="SECURITY">An ninh (Khóa tài khoản, Đăng nhập sai)</option>
                  <option value="ANALYTICS">Phân tích (Tra cứu Repo, So sánh, AI Report)</option>
                  <option value="ACCOUNT">Tài khoản (Đổi mật khẩu, Quyền riêng tư)</option>
                  <option value="SYSTEM">Hệ thống (Cấu hình Crawler)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Trạng thái:</label>
                <select
                  className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-2.5 h-8 focus:outline-none focus:border-brand-primary"
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công (SUCCESS)</option>
                  <option value="BLOCKED">Bị chặn (BLOCKED)</option>
                  <option value="FAILED">Thất bại (FAILED)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Tìm kiếm người dùng / IP:</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm theo username, tên, IP, mục tiêu..."
                    className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn pl-2.5 pr-7 h-8 focus:outline-none focus:border-brand-primary"
                    value={searchQueryUser}
                    onChange={(e) => setSearchQueryUser(e.target.value)}
                  />
                  {searchQueryUser && (
                    <button
                      type="button"
                      onClick={() => setSearchQueryUser('')}
                      className="absolute right-2 top-2 text-text-muted hover:text-text-main text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar for User Activity Logs */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border/60">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-success/10 text-status-success text-[11px] font-medium border border-status-success/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                  MongoDB Atlas Dynamic Audit
                </span>
                <span>Đang hiển thị <strong className="text-text-main font-mono">{userLogs.length}</strong> bản ghi thực tế</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon="RotateCw"
                  onClick={() => fetchUserLogs()}
                  isLoading={isLoadingUser}
                  className="h-7 text-xs"
                >
                  Làm mới
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon="Trash2"
                  onClick={() => handleClearUserLogs('mock')}
                  isLoading={isClearingLogs}
                  className="h-7 text-xs text-text-muted hover:text-status-warning"
                  title="Xóa các bản ghi mẫu (mock) để chỉ giữ lại nhật ký hành động thực tế"
                >
                  Xóa Log Mẫu (Mock)
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon="Trash2"
                  onClick={() => handleClearUserLogs('all')}
                  isLoading={isClearingLogs}
                  className="h-7 text-xs"
                  title="Xóa toàn bộ bản ghi nhật ký người dùng trong MongoDB"
                >
                  Làm sạch toàn bộ
                </Button>
              </div>
            </div>
          </Card>

          {/* User Activity Table */}
          <Card variant="surface" className="overflow-x-auto p-0 border border-surface-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-elevated/70 border-b border-surface-border text-text-muted text-[11px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Người dùng</th>
                  <th className="py-2.5 px-3">Nhóm</th>
                  <th className="py-2.5 px-3">Hành động thực hiện</th>
                  <th className="py-2.5 px-3">Đối tượng tác động</th>
                  <th className="py-2.5 px-3">IP &amp; Thiết bị</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {isLoadingUser && userLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Đang nạp nhật ký kiểm toán người dùng từ MongoDB Atlas...</span>
                      </div>
                    </td>
                  </tr>
                ) : userLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <AppIcon name="Users" size={28} className="text-text-subtle" />
                        <span className="text-sm font-medium text-text-main">Không tìm thấy hoạt động người dùng nào</span>
                        <span className="text-xs text-text-muted">Hãy thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  userLogs.map((it) => (
                    <tr key={it.id} className="hover:bg-surface-elevated/40 transition-colors text-xs font-sans">
                      {/* Time */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-text-muted text-[11px] font-mono">
                        <div>
                          {new Date(it.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                        <div className="text-[10px] text-text-subtle">
                          {new Date(it.timestamp).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={it.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100'}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-surface-border"
                          />
                          <div>
                            <div className="font-semibold text-text-main text-xs">{it.display_name}</div>
                            <div className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                              @{it.username}
                              <RoleBadge role={it.role} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {renderActionCategoryBadge(it.category)}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 font-medium text-text-main text-xs">
                        <div className="font-semibold text-text-main">{it.action_label}</div>
                        <div className="text-[10px] text-text-muted font-mono">{it.action}</div>
                      </td>

                      {/* Target */}
                      <td className="py-2.5 px-3 max-w-xs truncate text-xs" title={it.target_name || '—'}>
                        <div className="font-medium text-text-main truncate">{it.target_name || '—'}</div>
                        {it.target_type && (
                          <div className="text-[10px] text-text-muted font-mono uppercase">{it.target_type}</div>
                        )}
                      </td>

                      {/* IP & Device */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <div className="font-mono text-text-main font-medium">{it.ip_address}</div>
                        <div className="text-[10px] text-text-muted truncate max-w-[120px]" title={it.user_agent}>
                          {it.user_agent}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {renderUserStatusBadge(it.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="Eye"
                          onClick={() => setSelectedUserLog(it)}
                          title="Xem chi tiết hoạt động"
                        >
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Modal Inspector for System Log */}
      {selectedSystemLog && (
        <Modal
          isOpen={!!selectedSystemLog}
          onClose={() => setSelectedSystemLog(null)}
          title={`Chi tiết Log Hệ thống: ${selectedSystemLog.id}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                icon="Copy"
                onClick={() => handleCopy(JSON.stringify(selectedSystemLog, null, 2))}
              >
                Copy JSON
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSystemLog(null)}>
                Đóng
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg bg-surface-elevated border border-surface-border">
              <div>
                <span className="text-text-muted">Thời gian: </span>
                <span className="font-mono text-text-main">{selectedSystemLog.timestamp}</span>
              </div>
              <div>
                <span className="text-text-muted">Dịch vụ: </span>
                <span className="font-semibold text-text-main">{selectedSystemLog.service}</span>
              </div>
              <div>
                <span className="text-text-muted">Phân loại: </span>
                <span className="font-mono text-text-main">{selectedSystemLog.category}</span>
              </div>
              <div>
                <span className="text-text-muted">Mức độ: </span>
                {renderLevelBadge(selectedSystemLog.level)}
              </div>
              <div>
                <span className="text-text-muted">Caller IP: </span>
                <span className="font-mono text-text-main">{selectedSystemLog.ip || '—'}</span>
              </div>
              <div>
                <span className="text-text-muted">Độ trễ: </span>
                <span className="font-mono text-text-main">
                  {selectedSystemLog.elapsed_ms != null ? `${selectedSystemLog.elapsed_ms} ms` : '—'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-text-muted">Trace ID: </span>
                <span className="font-mono text-brand-primary select-all">{selectedSystemLog.trace_id || '—'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-main uppercase mb-1.5">Nội dung Thông điệp (Message):</h4>
              <div className="p-3 rounded-lg bg-surface border border-surface-border font-mono text-xs text-text-main break-all">
                {selectedSystemLog.message}
              </div>
            </div>

            {selectedSystemLog.extra && Object.keys(selectedSystemLog.extra).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-text-main uppercase mb-1.5">Payload &amp; Thuộc tính mở rộng:</h4>
                <pre className="p-3 rounded-lg bg-surface-elevated border border-surface-border font-mono text-[11px] text-text-main overflow-x-auto max-h-52">
                  {JSON.stringify(selectedSystemLog.extra, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Inspector for User Activity Log */}
      {selectedUserLog && (
        <Modal
          isOpen={!!selectedUserLog}
          onClose={() => setSelectedUserLog(null)}
          title={`Kiểm toán Hoạt động: @${selectedUserLog.username}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                icon="Copy"
                onClick={() => handleCopy(JSON.stringify(selectedUserLog, null, 2))}
              >
                Copy JSON
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUserLog(null)}>
                Đóng
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-surface-border">
              <img
                src={selectedUserLog.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100'}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-surface-border"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-text-main">{selectedUserLog.display_name}</h4>
                  <RoleBadge role={selectedUserLog.role} />
                </div>
                <div className="text-xs text-text-muted font-mono">@{selectedUserLog.username}</div>
              </div>
            </div>

            {/* Event Metrics Table */}
            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg bg-surface-elevated border border-surface-border">
              <div>
                <span className="text-text-muted">Thời điểm phát sinh: </span>
                <span className="font-mono text-text-main">{selectedUserLog.timestamp}</span>
              </div>
              <div>
                <span className="text-text-muted">Trạng thái: </span>
                {renderUserStatusBadge(selectedUserLog.status)}
              </div>
              <div>
                <span className="text-text-muted">Nhóm hoạt động: </span>
                {renderActionCategoryBadge(selectedUserLog.category)}
              </div>
              <div>
                <span className="text-text-muted">Mã hành động: </span>
                <span className="font-mono text-text-main font-semibold">{selectedUserLog.action}</span>
              </div>
              <div>
                <span className="text-text-muted">Địa chỉ IP: </span>
                <span className="font-mono text-brand-primary font-semibold">{selectedUserLog.ip_address}</span>
              </div>
              <div>
                <span className="text-text-muted">Thiết bị / Trình duyệt: </span>
                <span className="text-text-main truncate block">{selectedUserLog.user_agent}</span>
              </div>
              <div className="col-span-2">
                <span className="text-text-muted">Đối tượng tác động: </span>
                <span className="font-medium text-text-main">{selectedUserLog.target_name || '—'}</span>
                {selectedUserLog.target_id && (
                  <span className="text-text-muted font-mono text-[11px] ml-1">({selectedUserLog.target_id})</span>
                )}
              </div>
            </div>

            {/* Action Label */}
            <div>
              <h4 className="text-xs font-bold text-text-main uppercase mb-1">Mô tả Hành động:</h4>
              <div className="p-3 rounded-lg bg-surface border border-surface-border text-xs text-text-main">
                {selectedUserLog.action_label}
              </div>
            </div>

            {/* Additional details */}
            {selectedUserLog.details && Object.keys(selectedUserLog.details).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-text-main uppercase mb-1">Dữ liệu Chi tiết (Context Payload):</h4>
                <pre className="p-3 rounded-lg bg-surface-elevated border border-surface-border font-mono text-[11px] text-text-main overflow-x-auto max-h-48">
                  {JSON.stringify(selectedUserLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminLogs;
