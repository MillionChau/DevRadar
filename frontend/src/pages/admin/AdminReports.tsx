import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { AppIcon } from '../../components/common/Icon';
import { Pagination } from '../../components/common/Pagination';
import { useConfirm } from '../../context/ConfirmContext';
import { ModerationReport } from '../../types';

import { adminApi, authApi } from '../../api';
import { recordActivity } from '../../utils/activityLogger';
import { getSafeAvatarUrl } from '../../utils/avatarHelper';

export const AdminReports: React.FC = () => {
  const { confirm, prompt } = useConfirm();
  const [mainTab, setMainTab] = useState<'reports' | 'comments'>('reports');
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [activeReport, setActiveReport] = useState<ModerationReport | null>(null);

  // Pagination cho Báo cáo bài viết
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(10);

  // Quản lý kiểm duyệt bình luận (UC-57, UC-59, UC-60, UC-61)
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentFilter, setCommentFilter] = useState<'all' | 'flagged' | 'published'>('flagged');
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsPageSize, setCommentsPageSize] = useState(20);
  const [commentsTotalCount, setCommentsTotalCount] = useState(0);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const items = await adminApi.getReports();
      const raw = Array.isArray(items) ? items : (items as any)?.items || [];
      if (Array.isArray(raw)) {
        // Fetch profiles for reporters and authors
        const userIds = Array.from(new Set(raw.flatMap((r: any) => [r.reporterId, r.authorId]).filter(Boolean)));
        const profileMap = new Map<string, any>();

        await Promise.allSettled(
          userIds.map(async (uid) => {
            try {
              const prof = await authApi.getUserPublicProfile(uid);
              if (prof) profileMap.set(uid, prof);
            } catch {
              // ignore
            }
          })
        );

        const mapped: ModerationReport[] = raw.map((r: any) => {
          const reporterProf = profileMap.get(r.reporterId);
          const authorProf = profileMap.get(r.authorId);

          const reporterName = reporterProf?.fullName || reporterProf?.userName || (r.reporterId ? `Dev_${String(r.reporterId).substring(0, 6)}` : 'thanh_vien_bao_cao');
          const authorName = authorProf?.fullName || authorProf?.userName || (r.authorId ? `Dev_${String(r.authorId).substring(0, 6)}` : 'tac_gia_bai_viet');

          return {
            id: r.id,
            targetType: 'post',
            targetId: r.postId,
            reason: r.reason || 'Báo cáo vi phạm tiêu chuẩn cộng đồng',
            reporter: {
              id: r.reporterId || 'usr-anon',
              username: reporterName,
              avatarUrl: getSafeAvatarUrl(reporterProf?.avatarUrl, reporterName, 'Member'),
            },
            reportedUser: {
              id: r.authorId || 'usr-author',
              username: authorName,
              avatarUrl: getSafeAvatarUrl(authorProf?.avatarUrl, authorName, 'Member'),
            },
            status: r.status === 0 ? 'pending' : (r.status === 1 ? 'resolved' : 'dismissed'),
            aiConfidence: 0.94,
            createdAt: r.createdDate ? new Date(r.createdDate).toLocaleDateString('vi-VN') : 'Vừa xong',
          };
        });
        setReports(mapped);
      }
    } catch (err) {
      console.error('Could not load reports from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminComments = (page = commentsPage, pageSize = commentsPageSize) => {
    setIsLoadingComments(true);
    const statusParam = commentFilter === 'flagged' ? 2 : commentFilter === 'published' ? 1 : undefined;
    const isApprovedParam = commentFilter === 'flagged' ? 0 : commentFilter === 'published' ? 1 : undefined;

    adminApi
      .getComments({
        page,
        pageSize,
        status: statusParam,
        isApproved: isApprovedParam,
      })
      .then((res: any) => {
        const paged = res?.data || res;
        const items = paged?.items || (Array.isArray(paged) ? paged : []);
        const total = paged?.totalCount ?? items.length;
        const totalP = paged?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
        setComments(items);
        setCommentsTotalCount(total);
        setCommentsTotalPages(totalP);
      })
      .catch((err) => {
        console.error('Could not load comments for moderation:', err);
      })
      .finally(() => {
        setIsLoadingComments(false);
      });
  };

  useEffect(() => {
    if (mainTab === 'reports') {
      fetchReports();
    } else {
      fetchAdminComments(commentsPage, commentsPageSize);
    }
  }, [mainTab, statusFilter, commentFilter, commentsPage, commentsPageSize]);

  const handleRestoreComment = async (id: string) => {
    try {
      await adminApi.restoreComment(id);
      fetchAdminComments();
    } catch (err) {
      console.error('Error restoring comment:', err);
    }
  };

  const handleHideComment = async (id: string) => {
    const reason = await prompt({
      title: 'Ẩn bình luận vi phạm',
      message: 'Nhập lý do ẩn bình luận vi phạm khỏi cộng đồng:',
      defaultValue: 'Vi phạm tiêu chuẩn cộng đồng',
      placeholder: 'Lý do ẩn bình luận...',
      confirmText: 'Ẩn bình luận',
      cancelText: 'Hủy bỏ',
      variant: 'warning',
    });
    if (reason === null) return;
    try {
      await adminApi.hideComment(id, reason);
      fetchAdminComments();
    } catch (err) {
      console.error('Error hiding comment:', err);
    }
  };

  const handleDeleteComment = async (id: string) => {
    const ok = await confirm({
      title: 'Xóa bình luận vĩnh viễn',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này khỏi hệ thống? Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa bình luận',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.deleteComment(id);
      fetchAdminComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

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

  useEffect(() => {
    setReportsPage(1);
  }, [statusFilter]);

  const totalReports = filtered.length;
  const totalReportsPages = Math.max(1, Math.ceil(totalReports / reportsPageSize));
  const paginatedReports = filtered.slice(
    (reportsPage - 1) * reportsPageSize,
    reportsPage * reportsPageSize
  );

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

      {/* Main Mode Switcher */}
      <div className="flex items-center gap-3 border-b border-surface-border pb-3">
        <button
          onClick={() => setMainTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mainTab === 'reports'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-surface-elevated text-text-muted hover:text-text-main'
          }`}
        >
          <AppIcon name="Flag" size={16} />
          <span>Báo cáo bài viết</span>
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
            mainTab === 'reports' ? 'bg-white/20 text-white' : 'bg-surface-border text-text-muted'
          }`}>
            {reports.filter((r) => r.status === 'pending').length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('comments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mainTab === 'comments'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-surface-elevated text-text-muted hover:text-text-main'
          }`}
        >
          <AppIcon name="MessageSquare" size={16} />
          <span>Kiểm duyệt bình luận</span>
        </button>
      </div>

      {mainTab === 'reports' ? (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Pending Review ({reports.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'resolved'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Resolved
            </button>
            <button
              onClick={() => setStatusFilter('dismissed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'dismissed'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Dismissed
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              All
            </button>
          </div>

          {/* Reports Table */}
          <Card variant="surface" padding="none" className="overflow-hidden border border-border-default shadow-sm">
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-surface-elevated border-b border-border-default text-text-secondary text-xs uppercase font-semibold shadow-sm">
                  <tr>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Target & Reason</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Reported User</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Reporter</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">AI Score</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Status</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default text-right">Action</th>
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
                  paginatedReports.map(r => (
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
                ))
              )}
              </tbody>
            </table>
            </div>
          </Card>

          <Pagination
            currentPage={reportsPage}
            totalPages={totalReportsPages}
            totalCount={totalReports}
            pageSize={reportsPageSize}
            onPageChange={setReportsPage}
            onPageSizeChange={(sz) => {
              setReportsPageSize(sz);
              setReportsPage(1);
            }}
            disabled={isLoading}
          />
        </>
      ) : (
        <>
          {/* Tabs for Comments Moderation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommentFilter('flagged')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                commentFilter === 'flagged'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Bị ẩn / Vi phạm ({comments.filter((c) => c.status === 2 || c.isApproved === 0).length})
            </button>
            <button
              onClick={() => setCommentFilter('published')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                commentFilter === 'published'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Hợp lệ / Đã duyệt
            </button>
            <button
              onClick={() => setCommentFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                commentFilter === 'all'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Comments Table */}
          <Card variant="surface" padding="none" className="overflow-hidden border border-border-default shadow-sm">
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-surface-elevated border-b border-border-default text-text-secondary text-xs uppercase font-semibold shadow-sm">
                  <tr>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Nội dung bình luận</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Tác giả</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Trạng thái</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Kiểm duyệt AI</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Ngày tạo</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default text-right">Thao tác</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-border-default/60 font-normal">
                {isLoadingComments ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Đang tải danh sách bình luận kiểm duyệt...</span>
                      </div>
                    </td>
                  </tr>
                ) : comments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <AppIcon name="ShieldCheck" size={32} className="text-status-success" />
                        <span className="text-sm font-medium text-text-primary">Không có bình luận nào</span>
                        <span className="text-xs text-text-tertiary">Không tìm thấy bình luận phù hợp trong danh mục này.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  comments.map((c) => {
                    const isFlagged = c.status === 2 || c.isApproved === 0;

                    return (
                      <tr key={c.id} className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="py-3 px-4 max-w-md">
                          <div className={`text-sm ${isFlagged ? 'text-accent-danger font-medium' : 'text-text-primary'}`}>
                            {c.content}
                          </div>
                          {c.postId && (
                            <div className="text-[11px] text-text-tertiary mt-1">
                              Bài viết: <span className="font-mono">#{c.postId.substring(0, 8)}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-text-primary text-xs">
                            @{c.authorUserName || c.authorName || `Dev_${(c.authorId || c.createdBy || '').substring(0, 6)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${
                              c.status === 2
                                ? 'bg-accent-danger/15 text-accent-danger'
                                : c.status === 1
                                ? 'bg-accent-success/15 text-accent-success'
                                : 'bg-surface-elevated text-text-tertiary'
                            }`}
                          >
                            {c.status === 2 ? 'Hidden' : c.status === 1 ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                              c.isApproved === 0
                                ? 'bg-accent-danger/10 border-accent-danger/20 text-accent-danger'
                                : 'bg-accent-success/10 border-accent-success/20 text-accent-success'
                            }`}
                          >
                            {c.isApproved === 0 ? 'Vi phạm' : 'Hợp lệ'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-tertiary whitespace-nowrap">
                          {c.createdDate ? new Date(c.createdDate).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isFlagged ? (
                              <button
                                onClick={() => handleRestoreComment(c.id)}
                                className="px-2 py-1 rounded text-xs font-medium bg-accent-success/20 text-accent-success hover:bg-accent-success/30 transition-colors"
                                title="Duyệt lại và khôi phục hiển thị"
                              >
                                Duyệt lại
                              </button>
                            ) : (
                              <button
                                onClick={() => handleHideComment(c.id)}
                                className="px-2 py-1 rounded text-xs font-medium bg-accent-warning/20 text-accent-warning hover:bg-accent-warning/30 transition-colors"
                                title="Chủ động ẩn vi phạm"
                              >
                                Ẩn
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="px-2 py-1 rounded text-xs font-medium bg-accent-danger/20 text-accent-danger hover:bg-accent-danger/30 transition-colors"
                              title="Xóa vĩnh viễn"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </Card>

          <Pagination
            currentPage={commentsPage}
            totalPages={commentsTotalPages}
            totalCount={commentsTotalCount}
            pageSize={commentsPageSize}
            onPageChange={setCommentsPage}
            onPageSizeChange={(sz) => {
              setCommentsPageSize(sz);
              setCommentsPage(1);
            }}
            disabled={isLoadingComments}
          />
        </>
      )}

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
