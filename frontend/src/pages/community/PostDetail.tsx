import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input, { Textarea } from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import EmptyState from '../../components/common/EmptyState';
import { Comment, Post } from '../../types';
import { communityApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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
              displayName: data.authorName || 'Thành viên DevRadar',
              userName: data.authorUserName || 'developer',
              avatarUrl: data.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
              reputationPoints: 1000,
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
      .then((items: any[]) => {
        if (Array.isArray(items) && items.length > 0) {
          const mapped: Comment[] = items
            .filter((c) => !c.parentCommentId)
            .map((c) => ({
              id: c.id,
              postId: c.postId,
              authorId: c.authorId,
              author: {
                id: c.authorId,
                displayName: c.authorName || 'DevRadar Member',
                userName: c.authorUserName || 'developer',
                avatarUrl: c.authorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100',
              },
              content: c.content || '',
              likeCount: c.likesCount ?? 0,
              createdAt: c.createdDate ? new Date(c.createdDate).toLocaleDateString('vi-VN') : 'Vừa xong',
              replies: items
                .filter((r) => r.parentCommentId === c.id)
                .map((r) => ({
                  id: r.id,
                  postId: r.postId,
                  parentId: r.parentCommentId,
                  authorId: r.authorId,
                  author: {
                    id: r.authorId,
                    displayName: r.authorName || 'DevRadar Member',
                    userName: r.authorUserName || 'developer',
                    avatarUrl: r.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
                  },
                  content: r.content || '',
                  likeCount: r.likesCount ?? 0,
                  createdAt: r.createdDate ? new Date(r.createdDate).toLocaleDateString('vi-VN') : 'Vừa xong',
                })),
            }));
          setComments(mapped);
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
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (id) {
      try {
        await communityApi.toggleLikePost(id);
      } catch (err) {
        console.warn('Error toggling like:', err);
      }
    }
  };

  const handleToggleBookmarkPost = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setBookmarkCount((prev) => (nextBookmarked ? prev + 1 : Math.max(0, prev - 1)));
    if (id) {
      try {
        await communityApi.toggleBookmarkPost(id);
      } catch (err) {
        console.warn('Error toggling bookmark:', err);
      }
    }
  };

  const handleToggleLikeComment = (commentId: string) => {
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
        avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
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
          alert('Bình luận của bạn chứa nội dung vi phạm tiêu chuẩn an toàn (độc hại / thô tục) và đã bị ẩn để quản trị viên xét duyệt.');
          setComments((prev) => prev.filter((c) => c.id !== tempId));
        }
      } catch (err) {
        console.warn('Error sending comment to server:', err);
      }
    }
    setIsSendingComment(false);
  };

  const handleSendReply = async (parentCommentId: string, replyToUserName?: string) => {
    if (!replyText.trim()) return;
    const finalContent = replyToUserName ? `@${replyToUserName} ${replyText.trim()}` : replyText.trim();
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
        avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
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
          alert('Câu trả lời của bạn chứa nội dung vi phạm tiêu chuẩn an toàn (độc hại / thô tục) và đã bị ẩn để quản trị viên xét duyệt.');
          setComments((prevComments) =>
            prevComments.map((c) => (c.id === parentCommentId ? { ...c, replies: c.replies?.filter((r) => r.id !== tempId) } : c))
          );
        }
      } catch (err) {
        console.warn('Error sending reply to server:', err);
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
                src={post.author.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100"}
                alt={post.author.displayName}
                className="w-10 h-10 rounded-full border border-surface-border object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${post.author.id || post.author.userName}`} className="text-sm font-bold text-text-main hover:text-brand-primary transition-colors">
                    {post.author.displayName || post.author.userName}
                  </Link>
                  <Badge variant="reputation" size="sm">⚡ {post.author.reputationPoints || 1000} Rep</Badge>
                </div>
                <span className="text-xs text-text-subtle">
                  Xuất bản {post.createdAt || "Gần đây"} • {post.techZoneName || "Công nghệ chung"}
                </span>
              </div>
            </div>

            <Button variant="secondary" size="sm" icon="plus">
              Theo dõi
            </Button>
          </div>

          {/* Title & Tags */}
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold text-text-main leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {(post.tags || []).map((tag) => (
                <Badge key={tag} variant="tech">#{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Markdown Content Article */}
          <article className="prose prose-invert max-w-none text-sm text-text-main leading-relaxed flex flex-col gap-4 border-t border-surface-border pt-4 whitespace-pre-line">
            <p>{post.content}</p>
          </article>

          {/* Social Interactions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-border text-xs">
            <div className="flex items-center gap-4">
              <Button
                variant={liked ? 'primary' : 'outline'}
                size="sm"
                icon="heart"
                onClick={handleToggleLikePost}
              >
                {liked ? `${likeCount} Đã thích` : `${likeCount} Thích`}
              </Button>

              <Button
                variant={bookmarked ? 'secondary' : 'outline'}
                size="sm"
                icon={bookmarked ? 'bookmarkCheck' : 'bookmark'}
                onClick={handleToggleBookmarkPost}
              >
                {bookmarked ? `${bookmarkCount} Đã lưu` : `${bookmarkCount} Lưu bài`}
              </Button>

              <Button variant="ghost" size="sm" icon="share">
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
              <span>Thảo luận & Bình luận ({comments.length})</span>
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
                <Button type="submit" variant="primary" size="sm" icon="send" disabled={isSendingComment}>
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
                {comments.map((comment) => (
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
                    <p className="text-xs text-text-main leading-relaxed">{comment.content}</p>

                    {/* Comment Actions: Like & Reply */}
                    <div className="flex items-center gap-2 pt-1 border-t border-surface-border/50">
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

                      <button
                        type="button"
                        onClick={() => {
                          if (replyingToId === comment.id) {
                            setReplyingToId(null);
                          } else {
                            setReplyingToId(comment.id);
                            setReplyText('');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors"
                      >
                        <AppIcon name="reply" size={13} />
                        <span>Trả lời</span>
                      </button>
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
                          >
                            Gửi phản hồi
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies if any */}
                    {comment.replies && comment.replies.map((reply) => (
                      <div key={reply.id} className="ml-6 pl-4 border-l-2 border-brand-primary/40 flex flex-col gap-2 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-secondary">{reply.author.displayName || reply.author.userName || 'Thành viên'}</span>
                          <span className="text-[10px] text-text-subtle">{reply.createdAt}</span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">{reply.content}</p>

                        {/* Reply Actions: Like & Reply */}
                        <div className="flex items-center gap-2 pt-1">
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
                                setReplyText('');
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
                          <div className="flex flex-col gap-2 mt-1 p-3 bg-surface-ground/60 border border-surface-border rounded-btn">
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
                ))}
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
              src={post.author.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100"}
              alt={post.author.displayName}
              className="w-12 h-12 rounded-full border border-surface-border object-cover"
            />
            <div>
              <Link to={`/profile/${post.author.id || post.author.userName}`} className="text-sm font-bold text-text-main hover:text-brand-primary transition-colors">
                {post.author.displayName || post.author.userName}
              </Link>
              <p className="text-xs text-text-muted">@{post.author.userName}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Thành viên tích cực cộng đồng kỹ thuật số DevRadar.
          </p>
          <div className="pt-2 border-t border-surface-border flex justify-between text-xs text-text-subtle">
            <span>{post.likeCount} Lượt thích</span>
            <span>⚡ {post.author.reputationPoints || 1000} Điểm Rep</span>
          </div>
        </Card>

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
