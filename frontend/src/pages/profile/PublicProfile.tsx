import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import RadarChart from '../../components/common/RadarChart';
import EmptyState from '../../components/common/EmptyState';
import { RadarMetrics, Post, UserReputation } from '../../types';
import { authApi, analyticsApi, communityApi } from '../../api';

export const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isFollowing, setIsFollowing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authorPosts, setAuthorPosts] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState<RadarMetrics>({
    codeQuality: 80,
    activityFrequency: 75,
    communityContribution: 70,
    projectReputation: 78,
    techStackDepth: 82,
  });

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    authApi
      .getUserPublicProfile(id)
      .then((data) => {
        if (data) {
          setProfile(data);
          // Tải Radar cá nhân
          if (data.showGitHubStats !== false) {
            analyticsApi
              .getDeveloperRadar(data.userName || id)
              .then((radarRes) => {
                if (radarRes && radarRes.metrics) {
                  setMetrics(radarRes.metrics);
                }
              })
              .catch(() => {});
          }
        } else {
          setProfile(null);
        }
      })
      .catch((err) => {
        console.warn('Could not load user public profile:', err);
        setProfile(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Tải các bài viết công khai của tác giả
    communityApi
      .getPosts({ authorId: id, pageSize: 10 })
      .then((res) => {
        setAuthorPosts(res.items || []);
      })
      .catch(() => {
        setAuthorPosts([]);
      });

    // Tải thông tin cấp bậc & điểm uy tín
    communityApi
      .getUserReputation(id)
      .then((repData) => {
        setReputation(repData);
      })
      .catch(() => {
        setReputation(null);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-surface-card border border-surface-border rounded-card">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-text-muted">Đang tải hồ sơ thành viên...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon="user"
        title="Không tìm thấy người dùng"
        description="Thành viên này có thể không tồn tại hoặc đã kích hoạt chế độ riêng tư toàn bộ."
        actionLabel="Quay lại Bảng tin"
        onAction={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  const isProfilePublic = profile.isProfilePublic ?? true;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-slate-800 to-indigo-950 border-b border-surface-border" />

        <div className="p-6 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <img
              src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120'}
              alt={profile.fullName || profile.userName}
              className="w-24 h-24 rounded-full border-4 border-surface-card object-cover shadow-xl bg-surface-card"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-text-main">{profile.fullName || profile.userName}</h1>
                <Badge variant="reputation" size="sm">⚡ {reputation?.permanentReputationPoints ?? profile.reputationPoints ?? 1000} PRP</Badge>
                {reputation?.tierBadge && (
                  <Badge variant="tech" size="sm">{reputation.tierBadge}</Badge>
                )}
                {Array.isArray(profile.roles) && profile.roles.map((r: string) => (
                  <Badge key={r} variant="role" size="sm">{r}</Badge>
                ))}
              </div>
              <span className="text-xs text-text-subtle font-mono">@{profile.userName} • DevRadar Member</span>
              <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
                {profile.bio || 'Thành viên cộng đồng lập trình viên DevRadar.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isFollowing ? 'secondary' : 'primary'}
              size="sm"
              icon={isFollowing ? 'check' : 'plus'}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </Button>
            <a href={`https://github.com/${profile.userName}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" icon="github">
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {!isProfilePublic ? (
        <EmptyState
          icon="shieldAlert"
          title="Hồ sơ được đặt ở chế độ riêng tư"
          description="Người dùng này đã tắt hiển thị hồ sơ năng lực công khai theo chính sách bảo mật."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card variant="default" padding="lg" className="lg:col-span-5 flex flex-col items-center gap-4">
            <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2 w-full">
              RADAR NĂNG LỰC CÔNG KHAI
            </h3>
            {profile.showGitHubStats !== false ? (
              <RadarChart metrics={metrics} size={280} />
            ) : (
              <p className="text-xs text-text-muted text-center py-8">
                Người dùng đã ẩn chỉ số năng lực GitHub.
              </p>
            )}
            <p className="text-xs text-text-subtle text-center">
              Thông tin liên hệ được bảo vệ theo cài đặt quyền riêng tư người dùng.
            </p>
          </Card>

          {/* Author Public Posts */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-main">
              BÀI VIẾT KỸ THUẬT ĐÃ XUẤT BẢN ({authorPosts.length})
            </h3>
            {authorPosts.length === 0 ? (
              <EmptyState
                icon="fileText"
                title="Chưa có bài viết nào"
                description="Tác giả này chưa xuất bản bài viết kỹ thuật nào trên diễn đàn."
              />
            ) : (
              authorPosts.map((post) => (
                <Card key={post.id} variant="interactive" padding="md" className="flex flex-col gap-2">
                  <Link to={`/posts/${post.id}`}>
                    <h4 className="text-sm font-bold text-text-main hover:text-brand-secondary transition-colors">
                      {post.title}
                    </h4>
                  </Link>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {post.content || post.summary}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-text-subtle pt-2 border-t border-surface-border">
                    <span>{post.createdAt}</span>
                    <span>{post.likeCount || 0} Thích</span>
                    <span>{post.commentCount || 0} Bình luận</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
