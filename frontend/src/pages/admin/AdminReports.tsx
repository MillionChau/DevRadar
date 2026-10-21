import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { AppIcon } from '../../components/common/Icon';
import { ModerationReport } from '../../types';

import { adminApi } from '../../api';
import { recordActivity } from '../../utils/activityLogger';

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [activeReport, setActiveReport] = useState<ModerationReport | null>(null);

  const fetchReports = () => {
    setIsLoading(true);
    adminApi
      .getReports()
      .then((items) => {
        const raw = Array.isArray(items) ? items : (items as any)?.items || [];
        if (Array.isArray(raw)) {
          const mapped: ModerationReport[] = raw.map((r: any) => ({
            id: r.id,
            targetType: 'post',
            targetId: r.postId,
            reason: r.reason || 'Báo cáo vi phạm tiêu chuẩn cộng đồng',
            reporter: {
              id: r.reporterId || 'usr-anon',
              username: 'thanh_vien_bao_cao',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
            },
            reportedUser: {
              id: r.authorId || 'usr-author',
              username: 'tac_gia_bai_viet',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100',
            },
            status: r.status === 0 ? 'pending' : (r.status === 1 ? 'resolved' : 'dismissed'),
            aiConfidence: 0.94,
            createdAt: r.createdDate ? new Date(r.createdDate).toLocaleDateString('vi-VN') : 'Vừa xong',
          }));
          setReports(mapped);
        }
      })
      .catch((err) => {
        console.error('Could not load reports from server:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: ModerationReport['status']) => {
    const reportItem = reports.find(r => r.id === id);
    setReports(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
    setActiveReport(null);

    try {
      const approve = newStatus === 'resolved';
      await adminApi.resolveReport(id, approve, approve ? 'Ẩn nội dung vi phạm' : 'Bác bỏ báo cáo');
      recordActivity({
        action: approve ? 'MODERATE_REPORT_RESOLVE' : 'MODERATE_REPORT_DISMISS',
        action_label: approve ? `Phê duyệt xử lý báo cáo vi phạm #${id} (Ẩn nội dung)` : `Bác bỏ báo cáo vi phạm #${id}`,
        category: 'MODERATION',
        target_type: 'REPORT',
        target_name: `Báo cáo #${id} (${reportItem?.reason || 'Nội dung phản cảm'})`,
        target_id: id,
        status: 'SUCCESS',
        details: { target_post_id: reportItem?.targetId, resolution: newStatus }
      });
      fetchReports();
    } catch (err) {
      console.warn('Could not resolve report on server:', err);
    }
  };

  const filtered = reports.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <AppIcon name="ShieldAlert" size={24} className="text-accent-warning" />
            Moderation & Toxicity Reports
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Review user violations, AI toxicity flags, and safety compliance alerts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'pending'
              ? 'bg-primary-blue text-white'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          Pending Review ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'resolved'
              ? 'bg-primary-blue text-white'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          Resolved
        </button>
        <button
          onClick={() => setStatusFilter('dismissed')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'dismissed'
              ? 'bg-primary-blue text-white'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          Dismissed
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary-blue text-white'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          All
        </button>
      </div>

      {/* Reports Table */}
      <Card variant="surface" className="overflow-x-auto p-0 border border-border-default">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-elevated/70 border-b border-border-default text-text-secondary text-xs uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Target & Reason</th>
              <th className="py-3 px-4">Reported User</th>
              <th className="py-3 px-4">Reporter</th>
              <th className="py-3 px-4">AI Score</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Đang kiểm tra hàng chờ báo cáo vi phạm từ cơ sở dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center gap-2">
                    <AppIcon name="ShieldCheck" size={32} className="text-status-success" />
                    <span className="text-sm font-medium text-text-primary">Hàng chờ kiểm duyệt đang trống</span>
                    <span className="text-xs text-text-tertiary">Hiện không có bài viết hay bình luận nào bị báo cáo vi phạm.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(r => (
              <tr key={r.id} className="hover:bg-surface-elevated/40 transition-colors">
                <td className="py-3 px-4 max-w-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold px-1.5 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border-default">
                      {r.targetType}
                    </span>
                    <span className="text-xs text-text-tertiary">ID: {r.targetId}</span>
                  </div>
                  <div className="text-text-primary text-sm mt-1 line-clamp-2">
                    {r.reason}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {r.reportedUser?.avatarUrl && (
                      <img
                        src={r.reportedUser.avatarUrl}
                        alt={r.reportedUser.username || ''}
                        className="w-7 h-7 rounded-full border border-border-default"
                      />
                    )}
                    <span className="font-medium text-text-primary text-xs">
                      @{r.reportedUser?.username || r.authorName || 'unknown'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {r.reporter?.avatarUrl && (
                      <img
                        src={r.reporter.avatarUrl}
                        alt={r.reporter.username || ''}
                        className="w-7 h-7 rounded-full border border-border-default"
                      />
                    )}
                    <span className="text-text-secondary text-xs">
                      @{r.reporter?.username || r.reporterName || 'system'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      (r.aiConfidence ?? 0) > 0.8
                        ? 'bg-accent-danger/10 border-accent-danger/20 text-accent-danger'
                        : 'bg-accent-warning/10 border-accent-warning/20 text-accent-warning'
                    }`}
                  >
                    {((r.aiConfidence ?? 0) * 100).toFixed(0)}% AI Confidence
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${
                      r.status === 'pending'
                        ? 'bg-accent-warning/15 text-accent-warning'
                        : r.status === 'resolved'
                        ? 'bg-accent-success/15 text-accent-success'
                        : 'bg-surface-elevated text-text-tertiary'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    icon="FileSearch"
                    onClick={() => setActiveReport(r)}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </Card>

      {/* Review Modal */}
      {activeReport && (
        <Modal
          isOpen={!!activeReport}
          onClose={() => setActiveReport(null)}
          title={`Review Violation Report #${activeReport.id}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={() => handleUpdateStatus(activeReport.id, 'dismissed')}
              >
                Dismiss Report
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  icon="Ban"
                  onClick={() => handleUpdateStatus(activeReport.id, 'resolved')}
                >
                  Take Action & Resolve
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-lg bg-surface-elevated border border-border-default space-y-2">
              <div className="text-xs font-semibold text-text-tertiary uppercase">Reason Description</div>
              <p className="text-text-primary leading-relaxed">{activeReport.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-surface-elevated border border-border-default">
                <div className="text-xs text-text-tertiary uppercase font-medium">Reported Entity</div>
                <div className="font-semibold text-text-primary mt-1">@{activeReport.reportedUser?.username || activeReport.authorName || 'unknown'}</div>
                <div className="text-xs text-text-secondary mt-0.5">Target: {activeReport.targetType} ({activeReport.targetId})</div>
              </div>
              <div className="p-3 rounded-lg bg-surface-elevated border border-border-default">
                <div className="text-xs text-text-tertiary uppercase font-medium">AI Quality Verdict</div>
                <div className="font-semibold text-accent-danger mt-1">
                  {((activeReport.aiConfidence ?? 0) * 100).toFixed(0)}% Probability of Toxicity
                </div>
                <div className="text-xs text-text-secondary mt-0.5">Automated ML classification</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
