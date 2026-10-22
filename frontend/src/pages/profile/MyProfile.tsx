import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import RadarChart from '../../components/common/RadarChart';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { RadarMetrics, Post, UserReputation, ReputationTransaction } from '../../types';
import { communityApi, analyticsApi, authApi } from '../../api';
import { toast } from '../../context/ToastContext';

export const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'reputation' | 'repos' | 'radar'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [history, setHistory] = useState<ReputationTransaction[]>([]);
  const [isLoadingReputation, setIsLoadingReputation] = useState<boolean>(true);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const [metrics, setMetrics] = useState<RadarMetrics>({
    codeQuality: 85,
    activityFrequency: 80,
    communityContribution: 75,
    projectReputation: 82,
    techStackDepth: 88,
  });

  useEffect(() => {
    if (!user) return;

    // Tải bài viết của user
    setIsLoadingPosts(true);
    communityApi
      .getPosts({ authorId: user.id, pageSize: 20 })
      .then((res) => {
        setPosts(res.items || []);
      })
      .catch((err) => {
        console.warn('Could not load user posts:', err);
        setPosts([]);
      })
      .finally(() => {
        setIsLoadingPosts(false);
      });

    // Tải thông tin Điểm Uy tín & Cấp bậc & TSS
    setIsLoadingReputation(true);
    communityApi
      .getMyReputation()
      .then((data) => {
        setReputation(data);
      })
      .catch((err) => {
        console.warn('Could not load user reputation:', err);
      })
      .finally(() => {
        setIsLoadingReputation(false);
      });

    // Tải lịch sử biến động điểm
    communityApi
      .getMyReputationHistory(30)
      .then((items) => {
        setHistory(items || []);
      })
      .catch(() => {});

    // Tải chỉ số Radar cá nhân
    if (user.userName) {
      analyticsApi
        .getDeveloperRadar(user.userName)
        .then((radarData) => {
          if (radarData && radarData.metrics) {
            setMetrics(radarData.metrics);
          }
        })
        .catch((err) => {
          console.warn('Could not load developer radar:', err);
        });
    }
  }, [user]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh đại diện không được vượt quá 5MB.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const newUrl = await authApi.uploadAvatar(file);
      setCurrentAvatar(newUrl);
      toast.success('Cập nhật ảnh đại diện lên MinIO S3 thành công!');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải ảnh lên MinIO. Vui lòng thử lại.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Banner Gradient */}
        <div className="h-36 bg-gradient-to-r from-brand-primary via-indigo-900 to-surface-card border-b border-surface-border relative" />

        {/* User Info Bar */}
        <div className="p-6 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <div className="relative group">
              <img
                src={currentAvatar || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120'}
                alt={user?.displayName}
                className="w-24 h-24 rounded-full border-4 border-surface-card object-cover shadow-xl bg-surface-card"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
                title="Thay đổi ảnh đại diện (MinIO S3)"
              >
                {isUploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <AppIcon name="camera" size={18} />
                    <span className="text-[10px] font-semibold mt-0.5">Đổi ảnh</span>
                  </>
                )}
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarSelect}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-text-main">{user?.displayName || 'Thành viên DevRadar'}</h1>
                <Badge variant="role" size="sm">{user?.role || 'Member'}</Badge>
                <Badge variant="reputation" size="sm">⚡ {reputation?.permanentReputationPoints ?? user?.reputationPoints ?? 1000} PRP</Badge>
                {reputation?.tierBadge && (
                  <Badge variant="tech" size="sm">{reputation.tierBadge}</Badge>
                )}
                {reputation && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    reputation.trustSafetyScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    reputation.trustSafetyScore >= 60 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    reputation.trustSafetyScore >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    🛡️ TSS {reputation.trustSafetyScore}/100
                  </span>
                )}
              </div>
              <span className="text-xs text-text-subtle font-mono">@{user?.userName || 'developer'} • DevRadar Platform</span>
              <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
                {user?.bio || 'Chưa cập nhật giới thiệu cá nhân.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon="edit">
              Chỉnh sửa hồ sơ
            </Button>
            <a href={user?.githubProfileUrl || `https://github.com/${user?.userName || ''}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" icon="github">
                GitHub
              </Button>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 px-6 border-t border-surface-border bg-surface-elevated/30 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'posts'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Bài viết của tôi ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('reputation')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reputation'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Cấp bậc & Điểm uy tín
          </button>
          <button
            onClick={() => setActiveTab('repos')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'repos'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Kho mã nguồn GitHub
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'radar'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Radar Năng lực cá nhân
          </button>
        </div>
      </Card>

      {/* Tab Contents */}
      {activeTab === 'radar' ? (
        <Card variant="default" padding="lg" className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-base font-bold text-text-main">
              BIỂU ĐỒ RADAR NĂNG LỰC CÁ NHÂN (CV SỐNG)
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Điểm năng lực được đồng bộ từ commit history và repository đóng góp trên GitHub qua Crawler & Analytics
            </p>
          </div>
          <RadarChart metrics={metrics} size={320} showLabels={true} />
        </Card>
      ) : activeTab === 'repos' ? (
        <EmptyState
          icon="folderGit2"
          title="Chưa đồng bộ kho mã nguồn GitHub"
          description="Kết nối tài khoản GitHub để tự động quét kho lưu trữ và hiển thị số lượng Stars, Forks và Repo Health Score."
          actionLabel="Liên kết GitHub ngay"
          onAction={() => {
            window.open('https://github.com', '_blank');
          }}
        />
      ) : activeTab === 'reputation' ? (
        <div className="flex flex-col gap-6">
          {/* Main Tier & Points Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Current Tier & PRP */}
            <Card variant="elevated" padding="md" className="flex flex-col gap-4 border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted">CẤP BẬC HIỆN TẠI</span>
                <Badge variant="reputation">Cấp {reputation?.currentTierLevel ?? 1}/6</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{reputation?.tierBadge?.split(' ')[0] || '🌱'}</div>
                <div>
                  <h3 className="text-lg font-bold text-text-main">{reputation?.tierTitle || 'Code Initiate'}</h3>
                  <span className="text-xs text-text-subtle">{reputation?.tierBadge || '🌱 Tân thủ'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-surface-border">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Điểm Uy tín Vĩnh viễn (PRP)</span>
                  <span className="font-mono font-bold text-brand-secondary">⚡ {(reputation?.permanentReputationPoints ?? 0).toLocaleString()}</span>
                </div>
                {reputation?.nextTierTitle && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-text-subtle mb-1">
                      <span>Tiến độ lên {reputation.nextTierTitle}</span>
                      <span>{reputation.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(reputation.progressPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted mt-1 block">
                      Còn thiếu {reputation.pointsToNextTier} điểm để thăng cấp ({reputation.nextTierRequiredPoints} PRP)
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Card 2: Trust & Safety Score (TSS) */}
            <Card variant="elevated" padding="md" className="flex flex-col gap-4 border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted">ĐIỂM TÍN NHIỆM & AN TOÀN (TSS)</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  (reputation?.trustSafetyScore ?? 100) >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                  (reputation?.trustSafetyScore ?? 100) >= 60 ? 'bg-yellow-500/10 text-yellow-400' :
                  (reputation?.trustSafetyScore ?? 100) >= 40 ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {(reputation?.trustSafetyScore ?? 100) >= 80 ? 'Tốt (Chuẩn mực)' :
                   (reputation?.trustSafetyScore ?? 100) >= 60 ? 'Cảnh báo mức 1' :
                   (reputation?.trustSafetyScore ?? 100) >= 40 ? 'Sandbox Moderated' :
                   'Hạn chế tương tác'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-text-main">
                  {reputation?.trustSafetyScore ?? 100}
                </span>
                <span className="text-sm text-text-muted font-mono">/ 100 điểm</span>
              </div>
              <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (reputation?.trustSafetyScore ?? 100) >= 80 ? 'bg-emerald-500' :
                    (reputation?.trustSafetyScore ?? 100) >= 60 ? 'bg-yellow-500' :
                    (reputation?.trustSafetyScore ?? 100) >= 40 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${reputation?.trustSafetyScore ?? 100}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                🛡️ Tự động phục hồi <strong className="text-emerald-400">+5 TSS/tuần</strong> khi duy trì hoạt động trong sạch không vi phạm.
              </p>
            </Card>

            {/* Card 3: Periodic Contribution Score (PCS) */}
            <Card variant="elevated" padding="md" className="flex flex-col gap-4 border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted">ĐIỂM ĐÓNG GÓP KỲ (PCS)</span>
                <Badge variant="tech" size="sm">Chu kỳ mở</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface-elevated/40 rounded-lg">
                  <span className="text-[11px] text-text-muted block">Tuần này</span>
                  <span className="text-xl font-bold font-mono text-brand-secondary">
                    +{reputation?.weeklyContributionScore ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-surface-elevated/40 rounded-lg">
                  <span className="text-[11px] text-text-muted block">Tháng này</span>
                  <span className="text-xl font-bold font-mono text-brand-primary">
                    +{reputation?.monthlyContributionScore ?? 0}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                ❄️ Cơ chế Ngủ đông: Giảm 15%/tuần trên điểm PCS nếu tài khoản không hoạt động trên 14 ngày.
              </p>
            </Card>
          </div>

          {/* 6-Tier Hierarchy Tree Visualizer */}
          <Card variant="default" padding="md" className="border-surface-border">
            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4">
              CÂY CẤP BẬC LẬP TRÌNH VIÊN DEVRADAR (6 TIERS HIERARCHY)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {[
                { level: 1, title: 'Code Initiate', badge: '🌱 Tân thủ', range: '0 - 99 PRP', priv: 'Đăng bài cơ bản, bình luận' },
                { level: 2, title: 'Developer', badge: '💻 Lập trình viên', range: '100 - 399 PRP', priv: 'Tạo Bookmark Folder, đính kèm code' },
                { level: 3, title: 'Senior Contributor', badge: '🚀 Đóng góp kỳ cựu', range: '400 - 999 PRP', priv: 'Bỏ qua kiểm duyệt AI, gắn tag' },
                { level: 4, title: 'Tech Lead', badge: '⭐ Trưởng nhóm công nghệ', range: '1,000 - 2,499 PRP', priv: 'Đề xuất Best Solution, ghim bài' },
                { level: 5, title: 'Principal Architect', badge: '🏛️ Kiến trúc sư trưởng', range: '2,500 - 4,999 PRP', priv: 'Tạo TechZone mới, kiểm duyệt cộng đồng' },
                { level: 6, title: 'DevRadar Fellow', badge: '👑 Chuyên gia danh dự', range: '5,000+ PRP', priv: 'Hội đồng Quản trị nội dung, đặc quyền tối cao' },
              ].map((tier) => {
                const isCurrent = (reputation?.currentTierLevel ?? 1) === tier.level;
                const isAchieved = (reputation?.currentTierLevel ?? 1) >= tier.level;
                return (
                  <div
                    key={tier.level}
                    className={`p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-brand-primary bg-brand-primary/10 shadow-md ring-1 ring-brand-primary'
                        : isAchieved
                        ? 'border-surface-border bg-surface-card/60 opacity-90'
                        : 'border-surface-border/40 bg-surface-elevated/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold font-mono text-text-subtle">CẤP {tier.level}</span>
                      {isCurrent && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-brand-primary text-white rounded">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-text-main truncate">{tier.badge}</div>
                    <div className="text-[11px] font-mono text-brand-secondary font-semibold mt-1">{tier.range}</div>
                    <p className="text-[10px] text-text-muted mt-2 leading-tight">{tier.priv}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Audit Log (Reputation History) */}
          <Card variant="default" padding="none" className="overflow-hidden border-surface-border">
            <div className="p-4 bg-surface-elevated/40 border-b border-surface-border flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  NHẬT KÝ BIẾN ĐỘNG ĐIỂM (REPUTATION AUDIT LOG)
                </h3>
                <span className="text-[11px] text-text-muted">Minh bạch mọi giao dịch cộng/trừ điểm và điểm an toàn TSS</span>
              </div>
              <Badge variant="tech" size="sm">{history.length} giao dịch gần nhất</Badge>
            </div>
            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">
                Chưa có lịch sử giao dịch điểm nào được ghi nhận.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-elevated/20 text-text-subtle border-b border-surface-border">
                    <tr>
                      <th className="py-2.5 px-4">Thời gian</th>
                      <th className="py-2.5 px-4">Hành động</th>
                      <th className="py-2.5 px-4">Biến động PRP</th>
                      <th className="py-2.5 px-4">Biến động TSS</th>
                      <th className="py-2.5 px-4">Lý do / Nguồn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/60 font-mono">
                    {history.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-elevated/30 transition-colors">
                        <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString('vi-VN')} {new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-text-main">
                          {tx.actionDescription || tx.actionType}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {tx.pointsChanged > 0 ? (
                            <span className="text-emerald-400">+{tx.pointsChanged} PRP</span>
                          ) : tx.pointsChanged < 0 ? (
                            <span className="text-red-400">{tx.pointsChanged} PRP</span>
                          ) : (
                            <span className="text-text-subtle">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {tx.tssChanged > 0 ? (
                            <span className="text-emerald-400">+{tx.tssChanged} TSS</span>
                          ) : tx.tssChanged < 0 ? (
                            <span className="text-red-400">{tx.tssChanged} TSS</span>
                          ) : (
                            <span className="text-text-subtle">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-sans text-text-muted">
                          {tx.reason || 'Hệ thống tự động'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {isLoadingPosts ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-card border border-surface-border rounded-xl">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-text-muted">Đang tải danh sách bài viết...</p>
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="fileText"
              title="Bạn chưa xuất bản bài viết nào"
              description="Hãy chia sẻ kiến thức, kinh nghiệm kiến trúc hoặc các kỹ thuật công nghệ mới với cộng đồng DevRadar!"
              actionLabel="Tạo bài viết đầu tiên"
              onAction={() => {
                window.location.href = '/create-post';
              }}
            />
          ) : (
            posts.map((post) => (
              <Card key={post.id} variant="interactive" padding="md" className="flex flex-col gap-2">
                <Link to={`/posts/${post.id}`}>
                  <h3 className="text-base font-bold text-text-main hover:text-brand-secondary transition-colors">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-xs text-text-muted line-clamp-2">
                  {post.content || post.summary}
                </p>
                <div className="flex items-center gap-4 text-xs text-text-subtle pt-2 border-t border-surface-border">
                  <span>{post.createdAt}</span>
                  <span>{post.likeCount || 0} Thích</span>
                  <span>{post.commentCount || 0} Bình luận</span>
                  {post.techZoneName && (
                    <Badge variant="tech" size="sm">{post.techZoneName}</Badge>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyProfile;
