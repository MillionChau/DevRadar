import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import RadarChart from '../../components/common/RadarChart';
import EmptyState from '../../components/common/EmptyState';
import { stripMarkdown } from '../../components/common/MarkdownRenderer';
import { RadarMetrics, Post, UserReputation } from '../../types';
import { authApi, analyticsApi, communityApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSafeAvatarUrl, getDeterministicAvatar } from '../../utils/avatarHelper';

export const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, info, warning } = useToast();

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

    // 1. Tải hồ sơ người dùng thực tế từ IdentityService
    authApi
      .getUserPublicProfile(id)
      .then((data) => {
        if (data) {
          setProfile(data);
          // Tải Radar năng lực cá nhân
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

    // 2. Tải các bài viết công khai của tác giả (lọc đúng authorId)
    communityApi
      .getPosts({ authorId: id, pageSize: 20 })
      .then((res) => {
        setAuthorPosts(res.items || []);
      })
      .catch(() => {
        setAuthorPosts([]);
      });

    // 3. Tải thông tin cấp bậc & điểm uy tín (có fallback từ Leaderboard nếu endpoint cá nhân chưa kích hoạt)
    communityApi
      .getUserReputation(id)
      .then((repData) => {
        if (repData && repData.permanentReputationPoints !== undefined) {
          setReputation(repData);
        } else {
          fallbackReputationFromLeaderboard(id);
        }
      })
      .catch(() => {
        fallbackReputationFromLeaderboard(id);
      });

    // 4. Kiểm tra trạng thái follow từ backend
    communityApi
      .getUserFollowSummary(id)
      .then((summary) => {
        if (summary && summary.isFollowing !== undefined) {
          setIsFollowing(summary.isFollowing);
        }
      })
      .catch(() => {});
  }, [id]);

  const fallbackReputationFromLeaderboard = (userId: string) => {
    communityApi
      .getLeaderboard(50, 'all')
      .then((lbList: any[]) => {
        if (Array.isArray(lbList)) {
          const match = lbList.find(
            (u) => (u.userId || '').toLowerCase() === userId.toLowerCase()
          );
          if (match) {
            setReputation({
              userId: match.userId,
              username: match.username,
              permanentReputationPoints: match.score ?? 0,
              trustSafetyScore: 90,
              currentTierLevel: match.tierLevel ?? (match.score >= 1000 ? 4 : 2),
              tierTitle: match.tierTitle || (Array.isArray(match.badges) && match.badges[0]) || 'Developer',
              tierBadge: match.tierBadge ? match.tierBadge.replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim() : (match.score >= 1000 ? 'Tech Lead' : 'Developer'),
              weeklyContributionScore: 0,
              monthlyContributionScore: 0,
              isSanctioned: false,
              sanctionLevel: 0,
              canPost: true,
              canComment: true,
              isSandboxModerated: false,
              privileges: [],
              progressPercentage: 100,
            });
          }
        }
      })
      .catch(() => {});
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      warning('Vui lòng đăng nhập để theo dõi thành viên này.', 'Yêu cầu đăng nhập');
      navigate('/login');
      return;
    }

    const nextState = !isFollowing;
    setIsFollowing(nextState);

    const targetName = profile?.fullName || profile?.userName || 'thành viên';
    if (nextState) {
      success(`Đang theo dõi ${targetName}!`, 'Theo dõi');
    } else {
      info(`Đã hủy theo dõi ${targetName}.`, 'Theo dõi');
    }

    try {
      await communityApi.toggleFollowUser(id!);
    } catch (err) {
      console.warn('Could not persist follow on backend:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-surface-card border border-surface-border rounded-card">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-text-muted">Đang tải hồ sơ thành viên thực tế...</p>
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
        <div className="h-36 sm:h-40 bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-900 border-b border-surface-border relative" />

        <div className="px-6 pb-6 pt-3 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <div className="-mt-14 sm:-mt-16 shrink-0 relative">
              <img
                src={getSafeAvatarUrl(profile.avatarUrl, profile.fullName || profile.userName, profile.roles?.[0])}
                alt={profile.fullName || profile.userName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDeterministicAvatar(profile.fullName || profile.userName || 'user', profile.roles?.[0]);
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-surface-card object-cover shadow-xl bg-surface-card"
              />
            </div>
            <div className="flex flex-col gap-1.5 pb-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-text-main leading-tight">{profile.fullName || profile.userName}</h1>
                <Badge variant="tech" size="sm" icon="Star" className="font-semibold py-1 px-2.5 bg-brand-primary/15 text-brand-secondary border-brand-primary/30 shadow-sm">
                  {(reputation?.tierBadge || (reputation?.permanentReputationPoints && reputation.permanentReputationPoints >= 1000 ? 'Master' : 'Tân thủ')).replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim()}
                </Badge>
                <Badge variant="reputation" size="sm" icon="Zap" className="font-semibold py-1 px-2.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm">
                  {(reputation?.permanentReputationPoints ?? profile.reputationPoints ?? 0).toLocaleString()} Điểm
                </Badge>
                {Array.isArray(profile.roles) && profile.roles.map((r: string) => (
                  <Badge key={r} variant="role" size="sm" className="font-semibold">{r}</Badge>
                ))}
              </div>
              <span className="text-xs text-text-subtle font-mono">@{profile.userName} • DevRadar Member</span>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5 max-w-xl leading-relaxed">
                {profile.bio || 'Thành viên cộng đồng lập trình viên DevRadar.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pb-1">
            <Button
              variant={isFollowing ? 'secondary' : 'primary'}
              size="sm"
              icon={isFollowing ? 'check' : 'plus'}
              onClick={handleToggleFollow}
            >
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </Button>
            {profile.userName && (
              <a href={`https://github.com/${profile.userName}`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" icon="github">
                  GitHub
                </Button>
              </a>
            )}
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
              Chỉ số được cập nhật dựa trên hoạt động commit và đóng góp thực tế trên hệ sinh thái.
            </p>
          </Card>

          {/* Author Public Posts */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-surface-border">
              <h3 className="text-sm font-bold text-text-main">
                BÀI VIẾT KỸ THUẬT ĐÃ XUẤT BẢN: {authorPosts.length}
              </h3>
            </div>

            {authorPosts.length === 0 ? (
              <EmptyState
                icon="fileText"
                title="Chưa có bài viết nào"
                description={`Tác giả @${profile.userName} chưa xuất bản bài viết kỹ thuật nào trên diễn đàn.`}
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
                    {stripMarkdown(post.summary || post.content || '')}
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
