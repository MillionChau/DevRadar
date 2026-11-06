import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ToxicityBadge } from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import Pagination from '../../components/common/Pagination';
import { Post } from '../../types';
import { adminApi } from '../../api';
import { recordActivity } from '../../utils/activityLogger';
import { toast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { getSafeAvatarUrl } from '../../utils/avatarHelper';

interface ManagedPost extends Post {
  isPinned: boolean;
  isHidden: boolean;
}

type ContentManagementTab = 'posts' | 'comments' | 'comment-reports';

export const AdminPosts: React.FC = () => {
  const { confirm, prompt } = useConfirm();
  // Tabs: Quản lý bài viết | Quản lý bình luận | Quản lý bình luận báo cáo
  const [activeTab, setActiveTab] = useState<ContentManagementTab>('posts');

  // ================= 1. QUẢN LÝ BÀI VIẾT STATE =================
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postSearch, setPostSearch] = useState('');
  const [postFilter, setPostFilter] = useState<'all' | 'flagged' | 'hidden' | 'pinned'>('all');
  const [postsPage, setPostsPage] = useState(1);
  const [postsPageSize, setPostsPageSize] = useState(20);
  const [postsTotalCount, setPostsTotalCount] = useState(0);
  const [postsTotalPages, setPostsTotalPages] = useState(1);

  // ================= 2. QUẢN LÝ BÌNH LUẬN STATE =================
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [commentStatusFilter, setCommentStatusFilter] = useState<'all' | 'flagged' | 'published'>('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsPageSize, setCommentsPageSize] = useState(20);
  const [commentsTotalCount, setCommentsTotalCount] = useState(0);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [dropdownPosts, setDropdownPosts] = useState<{ id: string; title: string }[]>([]);

  // ================= 3. QUẢN LÝ BÌNH LUẬN BÁO CÁO STATE =================
  const [commentReports, setCommentReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(20);
  const [reportsTotalCount, setReportsTotalCount] = useState(0);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);

  // Lấy danh sách bài viết
  const fetchAdminPosts = (page = postsPage, pageSize = postsPageSize) => {
    setIsLoadingPosts(true);
    adminApi
      .getPosts({ pageNumber: page, pageSize: pageSize })
      .then((res: any) => {
        const raw = res?.data || res;
        const items = raw?.items || (Array.isArray(raw) ? raw : []);
        const total = raw?.totalCount ?? items.length;
        const totalP = raw?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
        setPostsTotalCount(total);
        setPostsTotalPages(totalP);

        if (Array.isArray(items)) {
          const mapped: ManagedPost[] = items.map((p: any) => {
            const rawContent = p.content || '';
            const lines = rawContent.split('\n').filter(Boolean);
            const title = p.title || (lines.length > 0 ? lines[0].replace(/^[#\s*]+/, '') : 'Bài viết cộng đồng');

            // Tính toán giá trị ước tính thông minh ban đầu từ nội dung thực tế của bài viết
            const wordCount = rawContent.split(/\s+/).filter(Boolean).length;
            const hasCode = rawContent.includes('```') || rawContent.includes('    ');
            const isFlagged = p.isApproved === 0 || p.status === 2;
            const estQuality = isFlagged ? 28 : Math.min(98, Math.max(50, 70 + (hasCode ? 15 : 0) + Math.min(15, Math.floor(wordCount / 10))));
            const estTox = isFlagged ? 0.82 : 0.03;

            return {
              id: p.id,
              title: title,
              contentSnippet: p.summary || (lines.length > 1 ? lines[1] : rawContent) || '',
              author: {
                id: p.authorId || p.createdBy || 'u-1',
                username: p.authorUserName || 'dev',
                fullName: p.authorName || 'Dev Member',
                avatarUrl: getSafeAvatarUrl(p.authorAvatar || p.authorAvatarUrl, p.authorUserName || p.authorName),
                reputationScore: 1200,
                role: 'Member',
              },
              techZone: { id: p.techZoneId || 'tz-1', name: p.techZoneName || '.NET Core & C#', slug: 'general', color: '#3178C6' },
              tags: typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : p.tags || [],
              createdAt: p.createdDate || new Date().toISOString(),
              likeCount: p.likesCount ?? 0,
              commentCount: p.commentsCount ?? 0,
              bookmarkCount: p.bookmarksCount ?? 0,
              viewCount: p.viewsCount ?? 0,
              toxicityScore: estTox,
              qualityScore: estQuality,
              isPinned: p.isPinned === 1 || p.isPinned === true,
              isHidden: isFlagged,
            };
          });
          setPosts(mapped);

          // Cập nhật dropdown bài viết nếu đang rỗng
          if (dropdownPosts.length === 0) {
            setDropdownPosts(mapped.map((p) => ({ id: p.id, title: p.title })));
          }

          // GỌI THỰC TẾ QUALITYSERVICE ĐỂ PHÂN TÍCH ĐIỂM CHUẨN XÁC THEO MÔ HÌNH ML
          const batchItems = items.map((p: any) => ({
            content_id: p.id,
            content: p.content || p.summary || p.title || 'Nội dung bài viết',
            content_type: 'post'
          }));

          adminApi
            .analyzePostsBatchQuality(batchItems)
            .then((batchRes: any) => {
              const evaluatedList = batchRes?.items || [];
              if (Array.isArray(evaluatedList) && evaluatedList.length > 0) {
                const evalMap = new Map<string, any>(evaluatedList.map((e: any) => [e.content_id, e]));
                setPosts((prevPosts) =>
                  prevPosts.map((post) => {
                    const evalData = evalMap.get(post.id);
                    if (!evalData) return post;

                    const tox = evalData.toxicity || {};
                    let toxScore = 0.03;
                    if (tox.label === 'toxic') {
                      toxScore = Math.max(0.75, tox.probability || 0.88);
                    } else if (tox.label === 'suspicious') {
                      toxScore = Math.max(0.35, Math.min(0.59, tox.probability || 0.45));
                    } else {
                      toxScore = Math.max(0.01, Math.min(0.12, Number((1 - (tox.probability || 0.95)).toFixed(2))));
                    }

                    return {
                      ...post,
                      qualityScore: evalData.quality_score ?? post.qualityScore,
                      toxicityScore: toxScore,
                    };
                  })
                );
              }
            })
            .catch((err) => {
              console.warn('Could not batch evaluate posts from QualityService:', err);
            });
        }
      })
      .catch((err) => {
        console.error('Could not load live admin posts:', err);
      })
      .finally(() => {
        setIsLoadingPosts(false);
      });
  };

  // Lấy danh sách bình luận (có lọc theo bài viết, trạng thái, từ khóa)
  const fetchComments = (page = commentsPage, pageSize = commentsPageSize) => {
    setIsLoadingComments(true);
    const statusParam = commentStatusFilter === 'flagged' ? 2 : commentStatusFilter === 'published' ? 1 : undefined;
    const isApprovedParam = commentStatusFilter === 'flagged' ? 0 : commentStatusFilter === 'published' ? 1 : undefined;

    adminApi
      .getComments({
        page,
        pageSize,
        postId: selectedPostId || undefined,
        status: statusParam,
        isApproved: isApprovedParam,
        search: commentSearch.trim() || undefined,
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
        console.error('Error fetching admin comments:', err);
      })
      .finally(() => {
        setIsLoadingComments(false);
      });
  };

  // Lấy danh sách bình luận bị báo cáo
  const fetchCommentReports = (page = reportsPage, pageSize = reportsPageSize) => {
    setIsLoadingReports(true);
    adminApi
      .getCommentReports(page, pageSize)
      .then((res: any) => {
        const paged = res?.data || res;
        const items = paged?.items || (Array.isArray(paged) ? paged : []);
        const total = paged?.totalCount ?? items.length;
        const totalP = paged?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
        setCommentReports(items);
        setReportsTotalCount(total);
        setReportsTotalPages(totalP);
      })
      .catch((err) => {
        console.error('Error fetching comment reports:', err);
      })
      .finally(() => {
        setIsLoadingReports(false);
      });
  };

  useEffect(() => {
    fetchAdminPosts();
  }, []);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchAdminPosts(postsPage, postsPageSize);
    } else if (activeTab === 'comments') {
      fetchComments(commentsPage, commentsPageSize);
    } else if (activeTab === 'comment-reports') {
      fetchCommentReports(reportsPage, reportsPageSize);
    }
  }, [activeTab, postsPage, postsPageSize, commentsPage, commentsPageSize, reportsPage, reportsPageSize, selectedPostId, commentStatusFilter]);

  // Handler: Quản lý bài viết
  const handleTogglePin = async (id: string) => {
    const target = posts.find((p) => p.id === id);
    if (!target) return;
    const nextPin = !target.isPinned;
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isPinned: nextPin } : p)));
    try {
      await adminApi.pinPost(id, nextPin);
      recordActivity({
        action: nextPin ? 'PIN_POST' : 'UNPIN_POST',
        action_label: nextPin ? `Ghim bài viết "${target.title}" lên đầu TechZone` : `Bỏ ghim bài viết "${target.title}"`,
        category: 'CONTENT',
        target_type: 'POST',
        target_name: target.title,
        target_id: id,
        status: 'SUCCESS',
        details: { is_pinned: nextPin, author: target.author?.displayName || target.author?.fullName },
      });
    } catch (err) {
      console.warn('Could not toggle pin on server:', err);
    }
  };

  const handleToggleHide = async (id: string) => {
    const target = posts.find((p) => p.id === id);
    if (!target) return;
    const nextState = !target.isHidden;
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isHidden: nextState } : p)));
    if (nextState) {
      toast.warning('Đã ẩn bài viết khỏi bảng tin cộng đồng', 'Kiểm duyệt');
    } else {
      toast.success('Đã khôi phục bài viết lên bảng tin', 'Kiểm duyệt');
    }
    try {
      if (nextState) {
        await adminApi.hidePost(id, 'Chủ động ẩn vi phạm quy chuẩn cộng đồng');
      } else {
        await adminApi.restorePost(id);
      }
      recordActivity({
        action: nextState ? 'HIDE_POST' : 'RESTORE_POST',
        action_label: nextState ? `Ẩn bài viết vi phạm "${target.title}"` : `Khôi phục bài viết "${target.title}"`,
        category: 'MODERATION',
        target_type: 'POST',
        target_name: target.title,
        target_id: id,
        status: 'SUCCESS',
        details: { is_hidden: nextState, author: target.author?.displayName || target.author?.fullName },
      });
    } catch (err) {
      console.warn('Failed to update post status on server:', err);
    }
  };

  const handleRecheckAI = async (id: string) => {
    const target = posts.find((p) => p.id === id);
    if (!target) return;
    try {
      const res = await adminApi.recheckPostAI(id, target.contentSnippet || target.title);
      const tox = res?.toxicity || {};
      let toxScore = 0.03;
      if (tox.label === 'toxic') {
        toxScore = Math.max(0.75, tox.probability || 0.88);
      } else if (tox.label === 'suspicious') {
        toxScore = Math.max(0.35, Math.min(0.59, tox.probability || 0.45));
      } else {
        toxScore = Math.max(0.01, Math.min(0.12, Number((1 - (tox.probability || 0.95)).toFixed(2))));
      }

      const newQ = typeof res?.quality_score === 'number' ? res.quality_score : target.qualityScore;

      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, qualityScore: newQ, toxicityScore: toxScore } : p))
      );

      toast.success(
        `Phân tích QualityService hoàn tất: Quality ${newQ}/100 • Độc hại ${(toxScore * 100).toFixed(0)}% (${tox.label || 'safe'})`,
        'AI Quality Engine'
      );
    } catch (err) {
      console.warn('Could not run AI re-check on server:', err);
      toast.info(`Đã gửi yêu cầu tái phân tích AI cho bài viết ${id}.`, 'AI Moderation');
    }
  };

  const handleDeletePost = async (id: string) => {
    const target = posts.find((p) => p.id === id);
    const ok = await confirm({
      title: 'Xóa bài viết vĩnh viễn',
      message: `Bạn có chắc chắn muốn xóa bài viết "${target?.title || id}" vĩnh viễn khỏi cộng đồng? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa bài viết',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
    });
    if (!ok) return;

    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Đã xóa vĩnh viễn bài viết khỏi cộng đồng.', 'Xóa bài viết');
    try {
      await adminApi.deletePost(id);
      fetchAdminPosts();
    } catch (err) {
      console.warn('Could not delete post on server:', err);
    }
  };

  // Handler: Quản lý bình luận
  const handleRestoreComment = async (id: string) => {
    try {
      await adminApi.restoreComment(id);
      toast.success('Đã duyệt lại và khôi phục bình luận.', 'Quản lý bình luận');
      fetchComments();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể khôi phục bình luận.', 'Lỗi');
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
      toast.warning('Đã ẩn bình luận vi phạm khỏi cộng đồng.', 'Quản lý bình luận');
      fetchComments();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể ẩn bình luận.', 'Lỗi');
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
      toast.success('Đã xóa vĩnh viễn bình luận.', 'Quản lý bình luận');
      fetchComments();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa bình luận.', 'Lỗi');
    }
  };

  // Handler: Quản lý bình luận báo cáo
  const handleReviewCommentReport = async (reportId: string, approve: boolean) => {
    const actionText = approve ? 'Phê duyệt ẩn bình luận vi phạm' : 'Bác bỏ báo cáo';
    try {
      await adminApi.reviewCommentReport(reportId, approve, actionText);
      toast.success(
        approve ? 'Đã duyệt báo cáo và ẩn bình luận vi phạm.' : 'Đã bác bỏ báo cáo vi phạm.',
        'Xử lý báo cáo'
      );
      fetchCommentReports();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xử lý báo cáo bình luận.', 'Lỗi');
    }
  };

  // Lọc bài viết
  const filteredPosts = posts.filter((p) => {
    const authorName = p.author.username || p.author.userName || '';
    const matchesSearch =
      p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      authorName.toLowerCase().includes(postSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (postFilter === 'flagged') return (p.toxicityScore ?? 0) > 0.4 || (p.qualityScore ?? 100) < 40;
    if (postFilter === 'hidden') return p.isHidden;
    if (postFilter === 'pinned') return p.isPinned;
    return true;
  });

  // Lọc bình luận theo từ khóa
  const filteredComments = comments.filter((c) => {
    if (!commentSearch.trim()) return true;
    const q = commentSearch.toLowerCase();
    const content = (c.content || '').toLowerCase();
    const author = (c.authorUserName || c.authorName || '').toLowerCase();
    return content.includes(q) || author.includes(q);
  });

  // Lọc báo cáo bình luận
  const filteredReports = commentReports.filter((r) => {
    if (reportStatusFilter === 'all') return true;
    const st = r.status === 0 ? 'pending' : r.status === 1 ? 'resolved' : 'dismissed';
    return st === reportStatusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <AppIcon name="FileText" size={24} className="text-primary-blue" />
            Quản lý nội dung
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Kiểm duyệt bài viết, kiểm soát bình luận và xử lý hàng chờ phản hồi vi phạm từ cộng đồng.
          </p>
        </div>
      </div>

      {/* 3 Tabs Điều Hướng */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'posts'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-surface-elevated text-text-muted hover:text-text-main'
          }`}
        >
          <AppIcon name="FileText" size={16} />
          <span>Quản lý bài viết</span>
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
            activeTab === 'posts' ? 'bg-white/20 text-white' : 'bg-surface-border text-text-muted'
          }`}>
            {posts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'comments'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-surface-elevated text-text-muted hover:text-text-main'
          }`}
        >
          <AppIcon name="MessageSquare" size={16} />
          <span>Quản lý bình luận</span>
          {comments.filter((c) => c.status === 2 || c.isApproved === 0).length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-status-danger text-white font-medium">
              {comments.filter((c) => c.status === 2 || c.isApproved === 0).length} vi phạm
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('comment-reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'comment-reports'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-surface-elevated text-text-muted hover:text-text-main'
          }`}
        >
          <AppIcon name="ShieldAlert" size={16} />
          <span>Quản lý bình luận báo cáo</span>
          {commentReports.filter((r) => r.status === 0 || r.status === 'Pending').length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-status-warning text-white font-bold">
              {commentReports.filter((r) => r.status === 0 || r.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ======================= TAB 1: QUẢN LÝ BÀI VIẾT ======================= */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Filter and search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Tìm kiếm bài viết theo tiêu đề hoặc tác giả..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                leftIcon="Search"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary whitespace-nowrap">Bộ lọc:</label>
              <select
                value={postFilter}
                onChange={(e) => setPostFilter(e.target.value as any)}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
              >
                <option value="all">Tất cả bài viết</option>
                <option value="flagged">Bị gắn cờ AI / Điểm thấp</option>
                <option value="hidden">Đã bị ẩn khỏi bảng tin</option>
                <option value="pinned">Đã ghim lên đầu</option>
              </select>
            </div>
          </div>

          {/* Posts Table */}
          <Card variant="surface" padding="none" className="overflow-hidden border border-border-default shadow-sm">
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-surface-elevated border-b border-border-default text-text-secondary text-xs uppercase font-semibold shadow-sm">
                  <tr>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Tiêu đề bài viết</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Tác giả</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">TechZone</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Chất lượng / Độc hại</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Trạng thái</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default text-right">Thao tác kiểm duyệt</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-border-default/60">
                {isLoadingPosts ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Đang tải danh sách bài viết từ cơ sở dữ liệu Community...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <AppIcon name="FileText" size={32} className="text-text-tertiary" />
                        <span className="text-sm font-medium text-text-primary">Không tìm thấy bài viết nào</span>
                        <span className="text-xs text-text-tertiary">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-start gap-2">
                          {p.isPinned && (
                            <span className="p-1 rounded bg-secondary-cyan/15 text-secondary-cyan shrink-0" title="Đã ghim">
                              <AppIcon name="Pin" size={14} />
                            </span>
                          )}
                          <div>
                            <Link
                              to={`/feed/${p.id}`}
                              className="font-medium text-text-primary hover:text-primary-blue transition-colors line-clamp-1"
                            >
                              {p.title}
                            </Link>
                            <div className="text-xs text-text-tertiary">
                              {p.likeCount} thích • {p.commentCount} bình luận • {p.viewCount} lượt xem
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-text-primary text-xs font-medium">@{p.author.username || p.author.userName}</div>
                        <div className="text-[11px] text-text-tertiary">{p.author.role}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded border"
                          style={{
                            borderColor: `${p.techZone?.color || '#2563EB'}40`,
                            color: p.techZone?.color || '#2563EB',
                            backgroundColor: `${p.techZone?.color || '#2563EB'}15`,
                          }}
                        >
                          {p.techZone?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded border transition-colors ${
                              (p.qualityScore ?? 0) >= 80
                                ? 'bg-accent-success/15 text-accent-success border-accent-success/30'
                                : (p.qualityScore ?? 0) >= 60
                                ? 'bg-primary-blue/15 text-primary-blue border-primary-blue/30'
                                : (p.qualityScore ?? 0) >= 40
                                ? 'bg-accent-warning/15 text-accent-warning border-accent-warning/30'
                                : 'bg-accent-danger/15 text-accent-danger border-accent-danger/30'
                            }`}
                            title={`Điểm chất lượng QualityService: ${p.qualityScore ?? 0}/100`}
                          >
                            Q: {p.qualityScore ?? 0}
                          </span>
                          <ToxicityBadge score={p.toxicityScore} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.isHidden ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-accent-danger/10 text-accent-danger font-semibold border border-accent-danger/20">
                            Hidden (Ẩn)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-accent-success/10 text-accent-success font-semibold border border-accent-success/20">
                            Published (Hiện)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant={p.isPinned ? 'primary' : 'ghost'}
                            size="sm"
                            icon="Pin"
                            onClick={() => handleTogglePin(p.id)}
                            tooltip={p.isPinned ? 'Bỏ ghim bài viết' : 'Ghim bài viết lên đầu'}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="Sparkles"
                            onClick={() => handleRecheckAI(p.id)}
                            tooltip="Tái phân tích chất lượng & độc hại với AI Engine"
                          />
                          <Button
                            variant={p.isHidden ? 'outline' : 'danger'}
                            size="sm"
                            icon={p.isHidden ? 'Eye' : 'EyeOff'}
                            onClick={() => handleToggleHide(p.id)}
                            tooltip={p.isHidden ? 'Hiển thị lại bài viết trên bảng tin' : 'Ẩn bài viết khỏi cộng đồng'}
                          >
                            {p.isHidden ? 'Hiện' : 'Ẩn'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="Trash2"
                            className="text-status-danger hover:bg-status-danger/10"
                            onClick={() => handleDeletePost(p.id)}
                            tooltip="Xóa vĩnh viễn bài viết"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </Card>

          <Pagination
            currentPage={postsPage}
            totalPages={postsTotalPages}
            totalCount={postsTotalCount}
            pageSize={postsPageSize}
            onPageChange={(p) => setPostsPage(p)}
            onPageSizeChange={(sz) => {
              setPostsPageSize(sz);
              setPostsPage(1);
            }}
            disabled={isLoadingPosts}
          />
        </div>
      )}

      {/* ======================= TAB 2: QUẢN LÝ BÌNH LUẬN ======================= */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {/* Thanh công cụ lọc: Chọn bài viết, Lọc trạng thái, Tìm kiếm */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Select bài viết */}
            <div className="md:col-span-5 flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <AppIcon name="FileText" size={13} />
                <span>Lọc theo bài viết:</span>
              </label>
              <select
                value={selectedPostId}
                onChange={(e) => {
                  setSelectedPostId(e.target.value);
                  setCommentsPage(1);
                }}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue truncate"
              >
                <option value="">-- Tất cả bài viết ({postsTotalCount || posts.length} bài) --</option>
                {(dropdownPosts.length > 0 ? dropdownPosts : posts).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc trạng thái bình luận */}
            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <AppIcon name="Filter" size={13} />
                <span>Trạng thái kiểm duyệt:</span>
              </label>
              <select
                value={commentStatusFilter}
                onChange={(e) => {
                  setCommentStatusFilter(e.target.value as any);
                  setCommentsPage(1);
                }}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
              >
                <option value="all">Tất cả bình luận</option>
                <option value="flagged">Bị ẩn / Vi phạm</option>
                <option value="published">Hợp lệ / Đang hiển thị</option>
              </select>
            </div>

            {/* Tìm kiếm từ khóa */}
            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <AppIcon name="Search" size={13} />
                <span>Tìm nội dung / tác giả:</span>
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập từ khóa bình luận..."
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchComments(1)}
                  className="w-full"
                />
                <Button variant="outline" size="sm" onClick={() => fetchComments(1)} tooltip="Tìm kiếm">
                  Tìm
                </Button>
              </div>
            </div>
          </div>

          {/* Bảng bình luận */}
          <Card variant="surface" padding="none" className="overflow-hidden border border-border-default shadow-sm">
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-surface-elevated border-b border-border-default text-text-secondary text-xs uppercase font-semibold shadow-sm">
                  <tr>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Nội dung bình luận</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Tác giả</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Thuộc bài viết</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Trạng thái</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Kiểm duyệt AI</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Ngày tạo</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default text-right">Thao tác</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-border-default/60 font-normal">
                {isLoadingComments ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Đang tải danh sách bình luận kiểm duyệt...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredComments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <AppIcon name="MessageSquare" size={32} className="text-text-tertiary" />
                        <span className="text-sm font-medium text-text-primary">Không có bình luận nào</span>
                        <span className="text-xs text-text-tertiary">
                          Không tìm thấy bình luận phù hợp với bộ lọc hiện tại.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredComments.map((c) => {
                    const isFlagged = c.status === 2 || c.isApproved === 0;
                    const matchedPost = posts.find((p) => p.id === c.postId);

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-surface-elevated/40 transition-colors ${
                          isFlagged ? 'bg-accent-danger/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4 max-w-md">
                          <div
                            className={`text-sm ${
                              isFlagged ? 'text-accent-danger font-medium' : 'text-text-primary'
                            }`}
                          >
                            {c.content}
                          </div>
                          {isFlagged && (
                            <span className="inline-block mt-1 text-[11px] px-1.5 py-0.5 rounded bg-accent-danger/20 text-accent-danger font-semibold">
                              ⚠️ Chứa nội dung vi phạm tiêu chuẩn cộng đồng (độc hại / thô tục)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-medium text-text-primary text-xs">
                            @{c.authorUserName || c.authorName || `Dev_${(c.authorId || c.createdBy || '').substring(0, 6)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {c.postId ? (
                            <Link
                              to={`/feed/${c.postId}`}
                              className="text-xs text-primary-blue hover:underline line-clamp-1 flex items-center gap-1"
                              title={matchedPost?.title || c.postId}
                            >
                              <span className="truncate">{matchedPost?.title || `Bài viết #${c.postId.substring(0, 8)}...`}</span>
                            </Link>
                          ) : (
                            <span className="text-text-tertiary text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${
                              c.status === 2
                                ? 'bg-accent-danger/15 text-accent-danger border border-accent-danger/20'
                                : c.status === 1
                                ? 'bg-accent-success/15 text-accent-success border border-accent-success/20'
                                : 'bg-surface-elevated text-text-tertiary border border-border-default'
                            }`}
                          >
                            {c.status === 2 ? 'Hidden (Ẩn)' : c.status === 1 ? 'Published (Hiện)' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
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
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isFlagged ? (
                              <button
                                onClick={() => handleRestoreComment(c.id)}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-accent-success/20 text-accent-success hover:bg-accent-success/30 transition-colors"
                                title="Duyệt lại bình luận"
                              >
                                Duyệt lại
                              </button>
                            ) : (
                              <button
                                onClick={() => handleHideComment(c.id)}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-accent-warning/20 text-accent-warning hover:bg-accent-warning/30 transition-colors"
                                title="Chủ động ẩn vi phạm"
                              >
                                Ẩn
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="px-2.5 py-1 rounded text-xs font-semibold bg-accent-danger/20 text-accent-danger hover:bg-accent-danger/30 transition-colors"
                              title="Xóa vĩnh viễn khỏi cơ sở dữ liệu"
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
            onPageChange={(p) => setCommentsPage(p)}
            onPageSizeChange={(sz) => {
              setCommentsPageSize(sz);
              setCommentsPage(1);
            }}
            disabled={isLoadingComments}
          />
        </div>
      )}

      {/* ======================= TAB 3: QUẢN LÝ BÌNH LUẬN BÁO CÁO ======================= */}
      {activeTab === 'comment-reports' && (
        <div className="space-y-4">
          {/* Lọc trạng thái báo cáo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                reportStatusFilter === 'pending'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Chờ xử lý ({commentReports.filter((r) => r.status === 0 || r.status === 'Pending').length})
            </button>
            <button
              onClick={() => setReportStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                reportStatusFilter === 'resolved'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Đã xử lý (Duyệt ẩn)
            </button>
            <button
              onClick={() => setReportStatusFilter('dismissed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                reportStatusFilter === 'dismissed'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Đã bác bỏ
            </button>
            <button
              onClick={() => setReportStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                reportStatusFilter === 'all'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Bảng báo cáo bình luận */}
          <Card variant="surface" padding="none" className="overflow-hidden border border-border-default shadow-sm">
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-surface-elevated border-b border-border-default text-text-secondary text-xs uppercase font-semibold shadow-sm">
                  <tr>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Bình luận bị báo cáo</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Người bị báo cáo</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Người gửi báo cáo</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Lý do vi phạm</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Trạng thái</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default">Ngày báo cáo</th>
                    <th className="py-3 px-4 bg-surface-elevated sticky top-0 border-b border-border-default text-right">Thao tác</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-border-default/60 font-normal">
                {isLoadingReports ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Đang kiểm tra hàng chờ báo cáo bình luận...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <AppIcon name="ShieldCheck" size={32} className="text-status-success" />
                        <span className="text-sm font-medium text-text-primary">Không có báo cáo nào</span>
                        <span className="text-xs text-text-tertiary">
                          Hiện tại không có bình luận nào đang chờ xem xét vi phạm.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => {
                    const isPending = r.status === 0 || r.status === 'Pending';
                    const isResolved = r.status === 1 || r.status === 'Resolved';

                    return (
                      <tr key={r.id} className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-semibold text-text-primary text-xs line-clamp-2">
                            {r.commentContent || r.content || `Bình luận #${(r.commentId || '').substring(0, 8)}`}
                          </div>
                          {r.postId && (
                            <Link
                              to={`/feed/${r.postId}`}
                              className="text-[11px] text-primary-blue hover:underline mt-0.5 block"
                            >
                              Xem bài viết gốc →
                            </Link>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-medium text-text-primary text-xs">
                            @{r.authorUserName || r.authorName || `Dev_${(r.authorId || '').substring(0, 6)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-text-secondary text-xs">
                            @{r.reporterUserName || r.reporterName || `User_${(r.reporterId || '').substring(0, 6)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-xs text-text-primary line-clamp-2">{r.reason}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${
                              isPending
                                ? 'bg-accent-warning/15 text-accent-warning border border-accent-warning/20'
                                : isResolved
                                ? 'bg-accent-success/15 text-accent-success border border-accent-success/20'
                                : 'bg-surface-elevated text-text-tertiary border border-border-default'
                            }`}
                          >
                            {isPending ? 'Pending' : isResolved ? 'Resolved' : 'Dismissed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-tertiary whitespace-nowrap">
                          {r.createdDate ? new Date(r.createdDate).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleReviewCommentReport(r.id, true)}
                                  className="px-2.5 py-1 rounded text-xs font-semibold bg-accent-danger/20 text-accent-danger hover:bg-accent-danger/30 transition-colors"
                                  title="Duyệt báo cáo & Ẩn bình luận"
                                >
                                  Duyệt ẩn
                                </button>
                                <button
                                  onClick={() => handleReviewCommentReport(r.id, false)}
                                  className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
                                  title="Bác bỏ báo cáo"
                                >
                                  Bác bỏ
                                </button>
                              </>
                            )}
                            {r.commentId && (
                              <button
                                onClick={() => handleDeleteComment(r.commentId)}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-accent-danger/10 text-accent-danger hover:bg-accent-danger/20 transition-colors"
                                title="Xóa vĩnh viễn bình luận này"
                              >
                                Xóa comment
                              </button>
                            )}
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
            currentPage={reportsPage}
            totalPages={reportsTotalPages}
            totalCount={reportsTotalCount}
            pageSize={reportsPageSize}
            onPageChange={(p) => setReportsPage(p)}
            onPageSizeChange={(sz) => {
              setReportsPageSize(sz);
              setReportsPage(1);
            }}
            disabled={isLoadingReports}
          />
        </div>
      )}
    </div>
  );
};
