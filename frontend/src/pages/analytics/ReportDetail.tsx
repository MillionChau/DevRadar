import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../api';

interface ReportComment {
  id: string;
  report_id: string;
  content: string;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  likes_count?: number;
  created_at: string;
}

interface TechReportDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content_markdown: string;
  category: string;
  tags?: string[];
  metrics_snapshot?: any;
  status: string;
  views_count: number;
  likes_count: number;
  author_name: string;
  created_at: string;
  published_at?: string;
}

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuth();

  const [report, setReport] = useState<TechReportDetail | null>(null);
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // New Comment state
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    // Fetch report details
    analyticsApi
      .getReportById(id)
      .then((data) => {
        setReport(data);
        setLikesCount(data.likes_count || 0);
      })
      .catch((err) => {
        console.error('Failed to load report detail:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Fetch comments
    fetchComments(id);
  }, [id]);

  const fetchComments = async (reportId: string) => {
    try {
      const items = await analyticsApi.getReportComments(reportId);
      setComments(items);
    } catch {
      setComments([]);
    }
  };

  const handleToggleLike = async () => {
    if (!report) return;
    setIsLiking(true);
    const nextState = !hasLiked;
    try {
      const res = await analyticsApi.likeReport(report.id, nextState);
      setHasLiked(nextState);
      setLikesCount(res.likes_count ?? (nextState ? likesCount + 1 : Math.max(0, likesCount - 1)));
    } catch {
      // Optimistic fallback
      setHasLiked(nextState);
      setLikesCount(nextState ? likesCount + 1 : Math.max(0, likesCount - 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !report) return;

    setIsSubmittingComment(true);
    try {
      await analyticsApi.addReportComment(report.id, {
        content: commentText.trim(),
        author_name: user?.displayName || user?.userName || 'Thành viên DevRadar',
        author_avatar: user?.avatarUrl,
        author_id: user?.id,
      });
      setCommentText('');
      fetchComments(report.id);
    } catch (err: any) {
      alert(`Lỗi khi đăng bình luận: ${err?.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!report || !window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await analyticsApi.deleteReportComment(report.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(`Lỗi khi xóa bình luận: ${err?.message || 'Không thể xóa'}`);
    }
  };

  // Simple Markdown Renderer for clean reading experience
  const renderMarkdown = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');

    return (
      <div className="space-y-3 leading-relaxed text-text-main text-sm">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl md:text-2xl font-bold text-text-main pt-4 pb-1 border-b border-surface-border">
                {trimmed.replace('# ', '')}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg md:text-xl font-bold text-brand-secondary pt-3 pb-1">
                {trimmed.replace('## ', '')}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-semibold text-text-main pt-2">
                {trimmed.replace('### ', '')}
              </h3>
            );
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className="p-3 my-2 border-l-4 border-brand-primary bg-surface-elevated/80 rounded-r-btn italic text-xs text-text-muted">
                {trimmed.replace('> ', '')}
              </blockquote>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-xs text-text-main py-0.5">
                {trimmed.substring(2)}
              </li>
            );
          }
          if (trimmed.startsWith('```')) {
            return (
              <div key={idx} className="text-[10px] text-text-subtle font-mono uppercase px-1">
                {trimmed}
              </div>
            );
          }
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p key={idx} className="text-xs text-text-muted leading-relaxed">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-text-muted">Đang tải toàn bộ dữ liệu báo cáo phân tích...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
        <AppIcon name="fileText" size={40} className="text-text-subtle" />
        <h2 className="text-lg font-bold text-text-main">Không tìm thấy bài báo cáo</h2>
        <p className="text-xs text-text-muted">Báo cáo này có thể đã bị ẩn hoặc không còn tồn tại trên hệ thống.</p>
        <Link to="/analytics/reports">
          <Button variant="primary" size="sm" icon="arrowLeft">
            Quay lại danh mục báo cáo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link to="/analytics/reports" className="hover:text-brand-secondary transition-colors">
          Báo cáo phân tích (SCR-13)
        </Link>
        <span>/</span>
        <span className="text-text-main font-semibold truncate max-w-sm">{report.title}</span>
      </div>

      {/* Article Header Card */}
      <Card variant="elevated" padding="lg" className="border-surface-border/80 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="tech" size="sm">
            {report.category}
          </Badge>

          <div className="flex items-center gap-2 text-xs text-text-subtle">
            <span className="font-mono">👁️ {report.views_count || 1} lượt đọc</span>
            <span>•</span>
            <span className="font-mono">❤️ {likesCount} lượt thích</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-text-main leading-tight tracking-tight">
          {report.title}
        </h1>

        {/* Author & Published info */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-border flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-primary/20 text-brand-secondary flex items-center justify-center border border-brand-primary/30 font-bold text-xs">
              AI
            </div>
            <div>
              <p className="text-xs font-bold text-text-main">{report.author_name || 'DevRadar AI Analyst'}</p>
              <p className="text-[11px] text-text-subtle">
                Xuất bản: {new Date(report.published_at || report.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={hasLiked ? 'primary' : 'secondary'}
              size="sm"
              icon="heart"
              disabled={isLiking}
              onClick={handleToggleLike}
            >
              {hasLiked ? 'Đã thích' : 'Yêu thích'} ({likesCount})
            </Button>

            <Button variant="ghost" size="sm" icon="share" onClick={handleCopyLink}>
              {copiedLink ? 'Đã sao chép!' : 'Chia sẻ'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Executive Summary Box */}
      {report.summary && (
        <div className="p-4 rounded-card bg-brand-primary/5 border border-brand-primary/20 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary uppercase">
            <AppIcon name="radar" size={14} />
            <span>Tóm tắt phát hiện chính (Executive Summary)</span>
          </div>
          <p className="text-xs text-text-main leading-relaxed">{report.summary}</p>
        </div>
      )}

      {/* Main Report Body */}
      <Card variant="default" padding="lg" className="border-surface-border/80">
        <div className="prose prose-invert max-w-none">
          {renderMarkdown(report.content_markdown)}
        </div>
      </Card>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between p-4 bg-surface-card border border-surface-border rounded-card">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Bạn thấy báo cáo này thế nào?</span>
          <Button
            variant={hasLiked ? 'primary' : 'secondary'}
            size="sm"
            icon="heart"
            onClick={handleToggleLike}
          >
            {hasLiked ? 'Đã thích' : 'Thả tim'} ({likesCount})
          </Button>
        </div>

        <Link to="/analytics/reports">
          <Button variant="ghost" size="sm" icon="arrowLeft">
            Tất cả báo cáo
          </Button>
        </Link>
      </div>

      {/* COMMENTS SECTION */}
      <div className="space-y-4 pt-4 border-t border-surface-border">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-main flex items-center gap-2">
            <AppIcon name="messageSquare" size={18} className="text-brand-secondary" />
            Bình luận & Thảo luận ({comments.length})
          </h3>
          <span className="text-xs text-text-subtle">Góc nhìn chuyên môn cộng đồng DevRadar</span>
        </div>

        {/* Comment Input Box */}
        {isAuthenticated && user ? (
          <Card variant="elevated" padding="md" className="border-surface-border">
            <form onSubmit={handlePostComment} className="space-y-3">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100'}
                  alt={user.displayName}
                  className="w-6 h-6 rounded-full object-cover border border-surface-border"
                />
                <span className="text-xs font-semibold text-text-main">{user.displayName || user.userName}</span>
                <span className="text-[10px] text-brand-secondary font-mono">({role})</span>
              </div>

              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Chia sẻ phản biện kỹ thuật, phân tích bổ sung hoặc đặt câu hỏi về báo cáo này..."
                className="w-full bg-surface-bg border border-surface-border rounded-btn p-3 text-xs text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
              />

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon="send"
                  disabled={isSubmittingComment || !commentText.trim()}
                >
                  {isSubmittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="p-4 bg-surface-elevated/60 border border-surface-border rounded-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-secondary flex items-center justify-center">
                <AppIcon name="lock" size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-main">Tham gia thảo luận về báo cáo</p>
                <p className="text-[11px] text-text-muted">Đăng nhập để để lại phản biện kỹ thuật và trao đổi cùng tác giả.</p>
              </div>
            </div>

            <Link to="/auth/login">
              <Button variant="primary" size="sm">
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="py-10 text-center text-xs text-text-subtle border border-dashed border-surface-border rounded-card">
              Chưa có bình luận nào. Hãy là người đầu tiên đưa ra góc nhìn về báo cáo này!
            </div>
          ) : (
            comments.map((cmt) => (
              <div
                key={cmt.id}
                className="p-3.5 bg-surface-card border border-surface-border/70 rounded-card space-y-2 hover:border-surface-border transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={cmt.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100'}
                      alt={cmt.author_name}
                      className="w-7 h-7 rounded-full object-cover border border-surface-border"
                    />
                    <div>
                      <p className="text-xs font-bold text-text-main leading-tight">{cmt.author_name}</p>
                      <p className="text-[10px] text-text-subtle">
                        {new Date(cmt.created_at).toLocaleDateString('vi-VN')} {new Date(cmt.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {(user?.id === cmt.author_id || role === 'Admin') && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(cmt.id)}
                      className="text-text-subtle hover:text-status-danger text-[11px] transition-colors p-1"
                      title="Xóa bình luận"
                    >
                      <AppIcon name="trash" size={13} />
                    </button>
                  )}
                </div>

                <p className="text-xs text-text-main leading-relaxed pl-9">
                  {cmt.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
