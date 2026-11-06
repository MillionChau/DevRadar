import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input, { Textarea } from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import EmptyState from '../../components/common/EmptyState';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import { Tooltip } from '../../components/common/Tooltip';
import { Comment, Post } from '../../types';
import { communityApi, authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSafeAvatarUrl } from '../../utils/avatarHelper';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, warning, error, info } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState<boolean>(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(true);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [visibleCommentsCount, setVisibleCommentsCount] = useState<number>(10);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const headings = React.useMemo(() => {
    if (!post?.content) return [];
    const lines = post.content.split('\n');
    const items: { level: number; text: string }[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (/^##\s+/.test(trimmed)) {
        items.push({
          level: 2,
          text: trimmed.replace(/^##\s+/, '').replace(/\s*#+$/, '').replace(/[*_`]/g, '').trim(),
        });
      } else if (/^###\s+/.test(trimmed)) {
        items.push({
          level: 3,
          text: trimmed.replace(/^###\s+/, '').replace(/\s*#+$/, '').replace(/[*_`]/g, '').trim(),
        });
      }
    });
    return items;
  }, [post?.content]);

  const readingTime = React.useMemo(() => {
    if (!post?.content) return 1;
    const words = post.content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 220));
  }, [post?.content]);

  const handleCopyMarkdown = () => {
    if (!post?.content) return;
    navigator.clipboard.writeText(post.content);
    setCopiedMarkdown(true);
    success('Đã sao chép toàn bộ mã nguồn Markdown!', 'Sao chép');
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      success('Đã sao chép liên kết bài viết vào bộ nhớ tạm!', 'Chia sẻ');
    } else {
      info('Đường dẫn bài viết: ' + window.location.href, 'Chia sẻ');
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsLoadingPost(true);
    setIsLoadingComments(true);

    // Tải chi tiết bài viết thực tế
    communityApi
      .getPostById(id)
      .then((data: any) => {
        if (data) {
          const lines = (data.content || '').split('\n').filter(Boolean);
          const title = lines.length > 0 ? lines[0].replace(/^[#\s*]+/, '') : 'Bài viết công nghệ';
          const p: Post = {
            id: data.id || id,
            title: data.title || title,
            content: data.content || '',
            authorId: data.authorId || data.createdBy,
            author: {
              id: data.authorId,
              displayName: data.authorUsername || data.authorName || 'Thành viên DevRadar',
              userName: data.authorUsername || data.authorUserName || 'developer',
              avatarUrl: getSafeAvatarUrl(data.authorAvatarUrl || data.authorAvatar, data.authorUsername || data.authorName, 'Member'),
              reputationPoints: data.authorReputationPoints ?? 0,
              tierTitle: data.authorTierTitle || 'Code Initiate',
              tierBadge: (data.authorTierBadge || 'Tân thủ').replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim(),
            },
            techZoneId: data.techZoneId,
            techZoneName: data.techZoneName || 'Công nghệ chung',
            tags: typeof data.tags === 'string' ? data.tags.split(',').map((t: string) => t.trim()) : data.tags || [],
            likeCount: data.likesCount ?? 0,
            commentCount: data.commentsCount ?? 0,
            bookmarkCount: data.bookmarksCount ?? 0,
            isLiked: data.isLikedByViewer ?? false,
            isBookmarked: data.isBookmarkedByViewer ?? false,
            isApproved: data.isApproved,
            status: typeof data.status === 'number'
              ? (data.status === 0 ? 'Draft' : data.status === 2 ? 'Hidden' : 'Published')
              : (data.status || 'Published'),
            createdAt: data.createdDate ? new Date(data.createdDate).toLocaleDateString('vi-VN') : '',
          };
          setPost(p);

          // Làm giàu avatar & thông tin tác giả thực tế từ authApi hoặc current user context
          const currentAuthorId = data.authorId || data.createdBy;
          if (currentAuthorId) {
            if (user && user.id === currentAuthorId && user.avatarUrl) {
              setPost((prev) => prev ? {
                ...prev,
                author: {
                  ...prev.author,
                  avatarUrl: user.avatarUrl || prev.author.avatarUrl,
                  displayName: user.displayName || user.fullName || prev.author.displayName,
                }
              } : null);
            } else {
              authApi.getUserPublicProfile(currentAuthorId).then((prof) => {
                if (prof && prof.avatarUrl) {
                  setPost((prev) => prev ? {
                    ...prev,
                    author: {
                      ...prev.author,
                      avatarUrl: prof.avatarUrl || prev.author.avatarUrl,
                      displayName: prof.fullName || prof.userName || prev.author.displayName,
                    }
                  } : null);
                }
              }).catch(() => {});
            }
          }
          setLiked(p.isLiked || false);
          setLikeCount(p.likeCount);
          setBookmarked(p.isBookmarked || false);
          setBookmarkCount(p.bookmarkCount);
        } else {
          setPost(null);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch post from backend:', err);
        setPost(null);
      })
      .finally(() => {
        setIsLoadingPost(false);
      });

    // Tải danh sách bài viết khác cùng hệ thống
    communityApi
      .getPosts({ pageSize: 4 })
      .then((res) => {
        const others = (res.items || []).filter((item: Post) => item.id !== id).slice(0, 3);
        setRelatedPosts(others);
      })
      .catch(() => {});

    // Tải danh sách bình luận thực tế
    communityApi
      .getComments(id)
      .then(async (rawItems: any[]) => {
        // Phía Community: Tuyệt đối không hiển thị bất kỳ bình luận vi phạm hoặc bị ẩn nào (status != 1 hoặc isApproved === 0)
        const items = Array.isArray(rawItems)
          ? rawItems.filter((c) => (c.status === null || c.status === undefined || c.status === 1) && (c.isApproved === null || c.isApproved === undefined || c.isApproved === 1))
          : [];

        if (items.length > 0) {
          const mapDtoToComment = (c: any): Comment => ({
            id: c.id,
            postId: c.postId,
            authorId: c.authorId || c.createdBy,
            author: {
              id: c.authorId || c.createdBy,
              displayName: c.authorName || c.authorUsername || (c.authorId ? `Dev_${c.authorId.substring(0, 6)}` : 'DevRadar Member'),
              userName: c.authorUsername || c.authorUserName || 'developer',
              avatarUrl: getSafeAvatarUrl(c.authorAvatarUrl || c.authorAvatar, c.authorUsername || c.authorName || c.authorId, 'Member'),
            },
            content: c.content || '',
            likeCount: c.likesCount ?? 0,
            isLiked: c.isLikedByViewer ?? false,
            createdAt: c.createdDate ? new Date(c.createdDate).toLocaleDateString('vi-VN') : 'Vừa xong',
            replies: (Array.isArray(c.replies) && c.replies.length > 0
              ? c.replies
              : items.filter((r) => r.parentCommentId === c.id)
            )
              .filter((r: any) => (r.status === null || r.status === undefined || r.status === 1) && (r.isApproved === null || r.isApproved === undefined || r.isApproved === 1))
              .map(mapDtoToComment),
          });

          const rootComments = items.filter((c) => !c.parentCommentId);
          const mapped: Comment[] = rootComments.map(mapDtoToComment);
          setComments(mapped);

          // Làm giàu thông tin tác giả thực tế từ authApi (Quản trị viên DevRadar, Châu Hoàng Tấn, v.v.)
          try {
            const authorIds = Array.from(new Set(
              items.map((c) => c.authorId || c.createdBy).filter(Boolean)
            ));
            const profileMap: Record<string, { displayName: string; userName: string; avatarUrl?: string }> = {};
            await Promise.allSettled(
              authorIds.map(async (aId) => {
                try {
                  const prof = await authApi.getUserPublicProfile(aId);
                  if (prof) {
                    profileMap[aId] = {
                      displayName: prof.fullName || prof.userName || `Dev_${aId.substring(0, 6)}`,
                      userName: prof.userName || 'developer',
                      avatarUrl: prof.avatarUrl,
                    };
                  }
                } catch {
                  // Fallback
                }
              })
            );

            if (Object.keys(profileMap).length > 0) {
              const enrichComment = (c: Comment): Comment => {
                const authorInfo = c.authorId ? profileMap[c.authorId] : undefined;
                return {
                  ...c,
                  author: authorInfo
                    ? {
                        ...c.author,
                        displayName: authorInfo.displayName,
                        userName: authorInfo.userName,
                        avatarUrl: authorInfo.avatarUrl || c.author.avatarUrl,
                      }
                    : c.author,
                  replies: c.replies?.map(enrichComment),
                };
              };
              setComments((prev) => prev.map(enrichComment));
            }
          } catch (profileErr) {
            console.warn('Could not enrich comment author profiles:', profileErr);
          }
        } else {
          setComments([]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch comments from backend:', err);
        setComments([]);
      })
      .finally(() => {
        setIsLoadingComments(false);
      });
  }, [id]);

  const handleToggleLikePost = async () => {
    if (!isAuthenticated) {
      warning('Vui lòng đăng nhập để thả tim bài viết.', 'Yêu cầu đăng nhập');
      navigate('/login');
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (nextLiked) {
      success('Đã thích bài viết!', 'Tương tác');
    } else {
      info('Đã bỏ thích bài viết.', 'Tương tác');
    }
    if (id) {
      try {
        await communityApi.toggleLikePost(id);
      } catch (err) {
        console.warn('Error toggling like:', err);
      }
    }
  };

  const handleToggleBookmarkPost = async () => {
    if (!isAuthenticated) {
      warning('Vui lòng đăng nhập để lưu bài viết vào bộ sưu tập cá nhân.', 'Yêu cầu đăng nhập');
      navigate('/login');
      return;
    }
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setBookmarkCount((prev) => (nextBookmarked ? prev + 1 : Math.max(0, prev - 1)));
    if (nextBookmarked) {
      success('Đã lưu bài viết vào danh sách đánh dấu!', 'Dấu trang');
    } else {
      info('Đã bỏ lưu bài viết.', 'Dấu trang');
    }
    if (id) {
      try {
        await communityApi.toggleBookmarkPost(id);
      } catch (err) {
        console.warn('Error toggling bookmark:', err);
      }
    }
  };

  const handleToggleLikeComment = (commentId: string) => {
    if (!isAuthenticated) {
      warning('Vui lòng đăng nhập để thích bình luận.', 'Yêu cầu đăng nhập');
      navigate('/login');
      return;
    }
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === commentId) {
          const isLiked = !comment.isLiked;
          return {
            ...comment,
            isLiked,
            likeCount: (comment.likeCount || 0) + (isLiked ? 1 : -1),
          };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.id === commentId) {
                const isLiked = !reply.isLiked;
                return {
                  ...reply,
                  isLiked,
                  likeCount: (reply.likeCount || 0) + (isLiked ? 1 : -1),
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      })
    );
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      warning('Vui lòng đăng nhập để viết bình luận.', 'Yêu cầu đăng nhập');
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;
    setIsSendingComment(true);

    const tempId = `c-${Date.now()}`;
    const newComment: Comment = {
      id: tempId,
      postId: id || '',
      authorId: user?.id || 'usr-me',
      author: {
        id: user?.id,
        displayName: user?.displayName || user?.userName || 'Thành viên DevRadar',
        userName: user?.userName || 'developer',
        avatarUrl: getSafeAvatarUrl(user?.avatarUrl, user?.userName || user?.displayName, user?.role),
      },
      content: commentText,
      likeCount: 0,
      createdAt: 'Vừa xong',
    };
    setComments([newComment, ...comments]);
    const sentText = commentText;
    setCommentText('');

    if (id) {
      try {
        const res = await communityApi.createComment({ postId: id, content: sentText });
        if (res && (res.message?.includes('flagged') || res.data?.isApproved === 0 || res.data?.status === 2)) {
          warning('Bình luận của bạn chứa nội dung vi phạm tiêu chuẩn an toàn (độc hại / thô tục) và đã bị ẩn để quản trị viên xét duyệt.', 'Cảnh báo kiểm duyệt');
          setComments((prev) => prev.filter((c) => c.id !== tempId));
        } else {
          success('Đã đăng bình luận thành công!');
        }
      } catch (err) {
        console.warn('Error sending comment to server:', err);
        error('Không thể đăng bình luận. Vui lòng thử lại sau.', 'Lỗi');
      }
    }
    setIsSendingComment(false);
  };

  const handleSendReply = async (parentCommentId: string, replyToUserName?: string) => {
    if (!replyText.trim()) return;
    const trimmed = replyText.trim();
    const finalContent = trimmed.startsWith('@')
      ? trimmed
      : (replyToUserName ? `@${replyToUserName} ${trimmed}` : trimmed);
    const tempId = `c-${Date.now()}`;
    const newReply: Comment = {
      id: tempId,
      postId: id || '',
      parentId: parentCommentId,
      authorId: user?.id || 'usr-me',
      author: {
        id: user?.id,
        displayName: user?.displayName || user?.userName || 'Thành viên DevRadar',
        userName: user?.userName || 'developer',
        avatarUrl: getSafeAvatarUrl(user?.avatarUrl, user?.userName || user?.displayName, user?.role),
      },
      content: finalContent,
      likeCount: 0,
      createdAt: 'Vừa xong',
    };

    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          };
        }
        return comment;
      })
    );
    // Tự động mở rộng nhánh reply vừa trả lời để người dùng nhìn thấy ngay
    setExpandedReplies((prev) => ({
      ...prev,
      [parentCommentId]: true,
    }));
    setReplyText('');
    setReplyingToId(null);

    if (id) {
      try {
        const res = await communityApi.createComment({
          postId: id,
          parentCommentId,
          content: finalContent,
        });
        if (res && (res.message?.includes('flagged') || res.data?.isApproved === 0 || res.data?.status === 2)) {
          warning('Câu trả lời của bạn chứa nội dung vi phạm tiêu chuẩn an toàn (độc hại / thô tục) và đã bị ẩn để quản trị viên xét duyệt.', 'Cảnh báo kiểm duyệt');
          setComments((prevComments) =>
            prevComments.map((c) => (c.id === parentCommentId ? { ...c, replies: c.replies?.filter((r) => r.id !== tempId) } : c))
          );
        } else {
          success('Đã gửi phản hồi thành công!');
        }
      } catch (err) {
        console.warn('Error sending reply to server:', err);
        error('Không thể gửi phản hồi. Vui lòng thử lại sau.', 'Lỗi');
      }
    }
  };

  if (isLoadingPost) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-surface-card border border-surface-border rounded-card">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-text-muted">Đang tải bài viết kỹ thuật...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <EmptyState
        icon="fileText"
        title="Không tìm thấy bài viết"
        description="Bài viết có thể đã bị xóa hoặc không tồn tại trong hệ thống DevRadar."
        actionLabel="Quay lại Bảng tin"
        onAction={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Center Post Content & Discussions (720px) */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <Card variant="default" padding="lg" className="flex flex-col gap-6">
          {/* Post Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <img
                src={getSafeAvatarUrl(post.author.avatarUrl, post.author.userName || post.author.displayName, 'Member')}
                alt={post.author.displayName}
                className="w-10 h-10 rounded-full border border-surface-border object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${post.author.id || post.author.userName}`} className="text-sm font-bold text-text-main hover:text-brand-primary transition-colors">
                    {post.author.displayName || post.author.userName}
                  </Link>
                  <Badge variant="tech" size="sm" icon="Star" className="font-medium text-[11px] py-0 px-2 bg-brand-primary/10 text-brand-secondary border-brand-primary/20">
                    {(post.author.tierBadge || 'Tân thủ').replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim()}
                  </Badge>
                  <span className="text-xs font-mono font-medium text-text-subtle flex items-center gap-1" title="Điểm uy tín & đóng góp">
                    <AppIcon name="Zap" size={13} className="text-status-warning" />
                    <span>{(post.author.reputationPoints ?? 0).toLocaleString()} Điểm</span>
                  </span>
                </div>
                <span className="text-xs text-text-subtle">
                  Xuất bản {post.createdAt || "Gần đây"} • {post.techZoneName || "Công nghệ chung"}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              tooltip="Theo dõi tác giả để nhận thông báo bài viết mới"
            >
              Theo dõi
            </Button>
          </div>

          {/* Title & Tags & Metadata */}
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-main leading-tight tracking-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {(post.tags || []).map((tag) => (
                  <Badge key={tag} variant="tech">#{tag}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>~{readingTime} phút đọc</span>
                </span>
                <span>•</span>
                <Tooltip content="Sao chép toàn bộ mã nguồn Markdown" position="top">
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-text-subtle hover:text-brand-secondary bg-surface-elevated/60 hover:bg-surface-elevated border border-surface-border/60 transition-colors"
                  >
                    <AppIcon name={copiedMarkdown ? "check" : "copy"} size={12} className={copiedMarkdown ? "text-status-success" : ""} />
                    <span>{copiedMarkdown ? "Đã sao chép MD!" : "Sao chép Markdown"}</span>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Markdown Content Article */}
          <article className="border-t border-surface-border pt-6">
            <MarkdownRenderer 
              content={post.content || ''} 
              isTitle={false}
            />
          </article>

          {/* Social Interactions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-border text-xs">
            <div className="flex items-center gap-4">
              <Button
                variant={liked ? 'primary' : 'outline'}
                size="sm"
                icon="heart"
                onClick={handleToggleLikePost}
                tooltip={liked ? "Bỏ thích bài viết" : "Thích bài viết này"}
              >
                {liked ? `${likeCount} Đã thích` : `${likeCount} Thích`}
              </Button>

              <Button
                variant={bookmarked ? 'secondary' : 'outline'}
                size="sm"
                icon={bookmarked ? 'bookmarkCheck' : 'bookmark'}
                onClick={handleToggleBookmarkPost}
                tooltip={bookmarked ? "Bỏ lưu bài viết" : "Lưu vào danh sách bài viết yêu thích"}
              >
                {bookmarked ? `${bookmarkCount} Đã lưu` : `${bookmarkCount} Lưu bài`}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                icon="share"
                onClick={handleShare}
                tooltip="Sao chép liên kết chia sẻ bài viết"
              >
                Chia sẻ
              </Button>
            </div>

            <span className="text-text-subtle flex items-center gap-1.5">
              <span>Kiểm duyệt nội dung:</span>
              {post.isApproved === 1 ? (
                <strong className="text-status-success">Hợp lệ</strong>
              ) : post.isApproved === 0 ? (
                <strong className="text-status-danger">Vi phạm / Chưa duyệt</strong>
              ) : (
                <strong className="text-status-warning">Chờ kiểm duyệt</strong>
              )}
            </span>
          </div>

          {/* Comments Section */}
          <div className="flex flex-col gap-6 pt-6 border-t border-surface-border">
            <h3 className="text-base font-bold text-text-main flex items-center gap-2">
              <AppIcon name="message" size={18} />
              <span>Thảo luận & Bình luận: {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}</span>
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="flex flex-col gap-3">
              <Textarea
                placeholder="Viết bình luận mang tính xây dựng kỹ thuật..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon="send"
                  disabled={isSendingComment}
                  tooltip="Đăng bình luận kỹ thuật"
                >
                  {isSendingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                </Button>
              </div>
            </form>

            {/* Nested Comments List */}
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <EmptyState
                icon="messageSquare"
                title="Chưa có bình luận nào"
                description="Hãy là người đầu tiên chia sẻ góc nhìn hoặc đặt câu hỏi kỹ thuật về bài viết này!"
              />
            ) : (
              <div className="flex flex-col gap-4">
                {comments.slice(0, visibleCommentsCount).map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-3 p-4 bg-surface-elevated/40 border border-surface-border rounded-btn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-primary/20 text-brand-secondary flex items-center justify-center font-bold text-xs">
                          {(comment.author.displayName || comment.author.userName || 'U').charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-text-main">{comment.author.displayName || comment.author.userName || 'Thành viên'}</h4>
                          <span className="text-[10px] text-text-subtle">{comment.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-text-main leading-relaxed">
                      <MarkdownRenderer content={comment.content} isComment={true} />
                    </div>

                    {/* Comment Actions: Like & Reply */}
                    <div className="flex items-center gap-2 pt-1 border-t border-surface-border/50">
                      <Tooltip content="Thích bình luận" position="top">
                        <button
                          type="button"
                          onClick={() => handleToggleLikeComment(comment.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                            comment.isLiked
                              ? 'text-status-danger font-semibold bg-status-danger/10'
                              : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
                          }`}
                        >
                          <AppIcon name="heart" size={13} className={comment.isLiked ? 'fill-current' : ''} />
                          <span>{comment.likeCount || 0}</span>
                        </button>
                      </Tooltip>

                      <Tooltip content="Trả lời bình luận này" position="top">
                        <button
                          type="button"
                          onClick={() => {
                            if (replyingToId === comment.id) {
                              setReplyingToId(null);
                            } else {
                              setReplyingToId(comment.id);
                              const targetUser = comment.author.userName || comment.author.displayName || 'developer';
                              setReplyText(`@${targetUser} `);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors"
                        >
                          <AppIcon name="reply" size={13} />
                          <span>Trả lời</span>
                        </button>
                      </Tooltip>
                    </div>

                    {/* Inline Reply Box for Comment */}
                    {replyingToId === comment.id && (
                      <div className="flex flex-col gap-2 mt-1 p-3 bg-surface-ground/60 border border-surface-border rounded-btn">
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span>Trả lời <strong>{comment.author.displayName || comment.author.userName}</strong>:</span>
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="hover:text-text-main"
                          >
                            Hủy
                          </button>
                        </div>
                        <Textarea
                          placeholder={`Trả lời @${comment.author.displayName || comment.author.userName}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingToId(null)}
                          >
                            Hủy
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon="send"
                            onClick={() => handleSendReply(comment.id)}
                            tooltip="Gửi phản hồi của bạn"
                          >
                            Gửi phản hồi
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Replies Section */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-surface-border/40">
                        <button
                          type="button"
                          onClick={() => toggleReplies(comment.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-secondary hover:text-brand-light transition-colors py-1 group"
                        >
                          <AppIcon
                            name={expandedReplies[comment.id] ? "chevronUp" : "chevronDown"}
                            size={14}
                            className="transition-transform group-hover:scale-110"
                          />
                          <span>
                            {expandedReplies[comment.id]
                              ? 'Ẩn câu trả lời'
                              : `Xem ${comment.replies.length} câu trả lời`}
                          </span>
                        </button>

                        {expandedReplies[comment.id] && (
                          <div className="flex flex-col gap-3 mt-2 pl-3 border-l-2 border-brand-primary/30">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex flex-col gap-2 pt-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-secondary flex items-center justify-center font-bold text-[10px]">
                                    {(reply.author.displayName || reply.author.userName || 'U').charAt(0)}
                                  </div>
                                  <span className="text-xs font-bold text-brand-secondary">
                                    {reply.author.displayName || reply.author.userName || 'Thành viên'}
                                  </span>
                                  <span className="text-[10px] text-text-subtle">{reply.createdAt}</span>
                                </div>
                                <div className="text-xs text-text-muted leading-relaxed pl-7">
                                  <MarkdownRenderer content={reply.content} isComment={true} />
                                </div>

                                {/* Reply Actions: Like & Reply */}
                                <div className="flex items-center gap-2 pt-1 pl-7">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLikeComment(reply.id)}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-colors ${
                                      reply.isLiked
                                        ? 'text-status-danger font-semibold bg-status-danger/10'
                                        : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
                                    }`}
                                  >
                                    <AppIcon name="heart" size={12} className={reply.isLiked ? 'fill-current' : ''} />
                                    <span>{reply.likeCount || 0}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (replyingToId === reply.id) {
                                        setReplyingToId(null);
                                      } else {
                                        setReplyingToId(reply.id);
                                        const targetUser = reply.author.userName || reply.author.displayName || 'developer';
                                        setReplyText(`@${targetUser} `);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors"
                                  >
                                    <AppIcon name="reply" size={12} />
                                    <span>Trả lời</span>
                                  </button>
                                </div>

                                {/* Inline Reply Box for nested reply */}
                                {replyingToId === reply.id && (
                                  <div className="flex flex-col gap-2 mt-1 ml-7 p-3 bg-surface-ground/60 border border-surface-border rounded-btn">
                                    <div className="flex items-center justify-between text-xs text-text-muted">
                                      <span>Trả lời <strong>{reply.author.displayName || reply.author.userName}</strong>:</span>
                                      <button
                                        type="button"
                                        onClick={() => setReplyingToId(null)}
                                        className="hover:text-text-main"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                    <Textarea
                                      placeholder={`Trả lời @${reply.author.displayName || reply.author.userName}...`}
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      rows={2}
                                      className="text-xs"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReplyingToId(null)}
                                      >
                                        Hủy
                                      </Button>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        icon="send"
                                        onClick={() => handleSendReply(comment.id, reply.author.userName || reply.author.displayName)}
                                      >
                                        Gửi phản hồi
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Progressive Comments Load More */}
                {comments.length > visibleCommentsCount && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon="chevronDown"
                      onClick={() => setVisibleCommentsCount((prev) => prev + 10)}
                      tooltip="Tải thêm các bình luận thảo luận"
                    >
                      Xem thêm {Math.min(10, comments.length - visibleCommentsCount)} bình luận khác (còn {comments.length - visibleCommentsCount})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Author Bio & Related Posts (350px) */}
      <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-6">
        <Card variant="default" padding="md" className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2.5">
            VỀ TÁC GIẢ
          </h3>
          <div className="flex items-center gap-3">
            <img
              src={getSafeAvatarUrl(post.author.avatarUrl, post.author.userName || post.author.displayName, 'Member')}
              alt={post.author.displayName}
              className="w-12 h-12 rounded-full border border-surface-border object-cover"
            />
            <div>
              <Link to={`/profile/${post.author.id || post.author.userName}`} className="text-sm font-bold text-text-main hover:text-brand-primary transition-colors">
                {post.author.displayName || post.author.userName}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-text-muted">@{post.author.userName}</p>
                <Badge variant="tech" size="sm" icon="Star" className="text-[10px] py-0 px-1.5">
                  {(post.author.tierBadge || 'Tân thủ').replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim()}
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {post.author.tierTitle || 'Code Initiate'} • Thành viên tích cực cộng đồng kỹ thuật số DevRadar.
          </p>
          <div className="pt-2 border-t border-surface-border flex justify-between text-xs text-text-subtle">
            <span>{post.likeCount} Lượt thích</span>
            <span className="font-mono font-semibold text-brand-secondary inline-flex items-center gap-1">
              <AppIcon name="Zap" size={13} className="text-amber-400" />
              <span>{(post.author.reputationPoints ?? 0).toLocaleString()} Điểm</span>
            </span>
          </div>
        </Card>

        {/* Table of Contents (Mục lục bài viết) */}
        {headings.length > 0 && (
          <Card variant="default" padding="md" className="flex flex-col gap-3 sticky top-20 border-brand-primary/20 bg-surface-card/90 backdrop-blur-sm shadow-md">
            <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AppIcon name="layers" size={14} className="text-brand-secondary" />
                <span>MỤC LỤC BÀI VIẾT</span>
              </span>
              <span className="text-[10px] text-text-subtle font-mono">{headings.length} phần</span>
            </h3>
            <nav className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
              {headings.map((h, hIdx) => (
                <div
                  key={hIdx}
                  className={`text-xs transition-colors hover:text-brand-secondary leading-snug py-1 flex items-center gap-1.5 cursor-pointer ${
                    h.level === 3 ? 'pl-4 text-text-subtle text-[11px]' : 'text-text-muted font-medium'
                  }`}
                  onClick={() => {
                    const el = document.getElementById(`heading-${hIdx}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="text-brand-primary/70">{h.level === 2 ? '•' : '–'}</span>
                  <span className="truncate">{h.text}</span>
                </div>
              ))}
            </nav>
          </Card>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <Card variant="default" padding="md" className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2.5">
              BÀI VIẾT KHÁC CÙNG HỆ THỐNG
            </h3>
            <div className="flex flex-col gap-3">
              {relatedPosts.map((rel, index) => (
                <React.Fragment key={rel.id}>
                  {index > 0 && <div className="h-[1px] bg-surface-border" />}
                  <Link to={`/posts/${rel.id}`} className="group">
                    <h4 className="text-xs font-semibold text-text-main group-hover:text-brand-secondary transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <span className="text-[10px] text-text-subtle">
                      {rel.likeCount || 0} Thích • {rel.commentCount || 0} Bình luận
                    </span>
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
