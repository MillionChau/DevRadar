import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input, { Textarea } from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import { Comment } from '../../types';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c-1',
      postId: id || 'post-001',
      authorId: 'usr-002',
      author: {
        displayName: 'Lê Minh Triết',
        userName: 'minhtriet_dev',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100',
      },
      content: 'Bài viết phân tích rất sâu về cơ chế Refresh Token Rotation và YARP Gateway. Bạn có gặp vấn đề gì khi scale SignalR connections với Redis backplane không?',
      likeCount: 6,
      createdAt: '1 giờ trước',
      replies: [
        {
          id: 'c-2',
          postId: id || 'post-001',
          authorId: 'usr-001',
          author: {
            displayName: 'Châu Hoàng Tấn',
            userName: 'chautantan',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
          },
          content: 'Cảm ơn Triết! Trong DevRadar, mình sử dụng Redis Pub/Sub backplane cho cả 2 Hub `/hubs/community` và `/hubs/notifications`, hoạt động rất mượt mà không bị nghẽn.',
          likeCount: 4,
          createdAt: '45 phút trước',
        },
      ],
    },
  ]);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      postId: id || 'post-001',
      authorId: 'usr-me',
      author: {
        displayName: 'Châu Hoàng Tấn',
        userName: 'chautantan',
      },
      content: commentText,
      likeCount: 0,
      createdAt: 'Vừa xong',
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const handleSendReply = (parentCommentId: string, replyToUserName?: string) => {
    if (!replyText.trim()) return;
    const newReply: Comment = {
      id: `c-${Date.now()}`,
      postId: id || 'post-001',
      parentId: parentCommentId,
      authorId: 'usr-me',
      author: {
        displayName: 'Châu Hoàng Tấn',
        userName: 'chautantan',
      },
      content: replyToUserName ? `@${replyToUserName} ${replyText.trim()}` : replyText.trim(),
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
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Center Post Content & Discussions (720px) */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <Card variant="default" padding="lg" className="flex flex-col gap-6">
          {/* Post Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100"
                alt="Châu Hoàng Tấn"
                className="w-10 h-10 rounded-full border border-surface-border object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-main">Châu Hoàng Tấn</h3>
                  <Badge variant="reputation" size="sm">⚡ 1,420 Rep</Badge>
                </div>
                <span className="text-xs text-text-subtle">
                  Xuất bản 08/10/2026 • 8 phút đọc
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
              Kiến trúc Microservices với .NET 10, YARP Reverse Proxy & PostgreSQL
            </h1>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="tech">#dotnet10</Badge>
              <Badge variant="tech">#microservices</Badge>
              <Badge variant="tech">#yarp</Badge>
              <Badge variant="tech">#postgres</Badge>
              <Badge variant="tech">#docker</Badge>
            </div>
          </div>

          {/* Markdown Content Article */}
          <article className="prose prose-invert max-w-none text-sm text-text-main leading-relaxed flex flex-col gap-4 border-t border-surface-border pt-4">
            <p>
              Hệ thống <strong>DevRadar</strong> được thiết kế theo kiến trúc Microservices gồm 5 dịch vụ độc lập kết nối qua <strong>YARP API Gateway (Cổng 5000)</strong>:
            </p>

            <ul className="list-disc pl-5 space-y-1.5 text-text-muted">
              <li><strong>IdentityService (Port 5002)</strong>: Quản lý xác thực JWT Bearer, làm mới token 1-lần-dùng và phân quyền RBAC.</li>
              <li><strong>CommunityService (Port 5145)</strong>: Bảng tin, bài viết kỹ thuật, bình luận và quản trị TechZones.</li>
              <li><strong>NotificationService (Port 5003)</strong>: Đẩy thông báo thời gian thực qua SignalR.</li>
              <li><strong>CrawlerGithubService (Port 8000)</strong>: Thu thập dữ liệu Repository và đóng góp lập trình viên.</li>
              <li><strong>QualityService (Port 8001)</strong>: Ứng dụng mô hình HuggingFace AI để kiểm duyệt nội dung độc hại.</li>
            </ul>

            <h3 className="text-base font-bold text-text-main pt-2">Cấu hình YARP Gateway định tuyến</h3>
            <div className="bg-surface-elevated border border-surface-border rounded-btn p-4 font-mono text-xs text-brand-secondary overflow-x-auto">
              <pre>{`app.MapReverseProxy(proxyPipeline => {
    proxyPipeline.UseRateLimiter();
    proxyPipeline.UseTokenRotation();
});`}</pre>
            </div>

            <p className="text-text-muted">
              Nhờ tách rời các microservices, hệ thống có thể mở rộng độc lập từng tiến trình xử lý, đảm bảo tốc độ phản hồi dưới 200ms cho các API đọc dữ liệu bảng tin.
            </p>
          </article>

          {/* Social Interactions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-border text-xs">
            <div className="flex items-center gap-4">
              <Button
                variant={liked ? 'primary' : 'outline'}
                size="sm"
                icon="heart"
                onClick={() => setLiked(!liked)}
              >
                {liked ? '129 Đã thích' : '128 Thích'}
              </Button>

              <Button
                variant={bookmarked ? 'secondary' : 'outline'}
                size="sm"
                icon={bookmarked ? 'bookmarkCheck' : 'bookmark'}
                onClick={() => setBookmarked(!bookmarked)}
              >
                {bookmarked ? 'Đã lưu' : 'Lưu bài'}
              </Button>

              <Button variant="ghost" size="sm" icon="share">
                Chia sẻ
              </Button>
            </div>

            <span className="text-text-subtle">
              AI Toxicity: <strong className="text-status-success">0.02 (Hợp lệ)</strong>
            </span>
          </div>

          {/* Comments Section */}
          <div className="flex flex-col gap-6 pt-6 border-t border-surface-border">
            <h3 className="text-base font-bold text-text-main flex items-center gap-2">
              <AppIcon name="message" size={18} />
              <span>Thảo luận & Bình luận ({comments.length + 1})</span>
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
                <Button type="submit" variant="primary" size="sm" icon="send">
                  Gửi bình luận
                </Button>
              </div>
            </form>

            {/* Nested Comments List */}
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
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100"
              alt="Châu Hoàng Tấn"
              className="w-12 h-12 rounded-full border border-surface-border object-cover"
            />
            <div>
              <h4 className="text-sm font-bold text-text-main">Châu Hoàng Tấn</h4>
              <p className="text-xs text-text-muted">Software Engineer @ HCMUS</p>
            </div>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Đam mê Microservices, kiến trúc đám mây và trực quan hóa năng lực lập trình viên.
          </p>
          <div className="pt-2 border-t border-surface-border flex justify-between text-xs text-text-subtle">
            <span>14 Bài viết kỹ thuật</span>
            <span>1.4k Lượt thích</span>
          </div>
        </Card>

        {/* Related Posts */}
        <Card variant="default" padding="md" className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2.5">
            BÀI VIẾT LIÊN QUAN
          </h3>
          <div className="flex flex-col gap-3">
            <Link to="/posts/post-002" className="group">
              <h4 className="text-xs font-semibold text-text-main group-hover:text-brand-secondary transition-colors">
                Xây dựng GitHub Crawler Engine với Python & GraphQL
              </h4>
              <span className="text-[10px] text-text-subtle">96 Thích • 18 Bình luận</span>
            </Link>
            <div className="h-[1px] bg-surface-border" />
            <Link to="/posts/post-003" className="group">
              <h4 className="text-xs font-semibold text-text-main group-hover:text-brand-secondary transition-colors">
                Kiểm duyệt AI Toxicity HuggingFace cho Microservices
              </h4>
              <span className="text-[10px] text-text-subtle">84 Thích • 15 Bình luận</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PostDetail;
