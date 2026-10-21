import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import RadarChart from '../../components/common/RadarChart';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { RadarMetrics, Post } from '../../types';
import { communityApi, analyticsApi } from '../../api';

export const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'repos' | 'radar'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Banner Gradient */}
        <div className="h-36 bg-gradient-to-r from-brand-primary via-indigo-900 to-surface-card border-b border-surface-border relative" />

        {/* User Info Bar */}
        <div className="p-6 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120'}
              alt={user?.displayName}
              className="w-24 h-24 rounded-full border-4 border-surface-card object-cover shadow-xl bg-surface-card"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-text-main">{user?.displayName || 'Thành viên DevRadar'}</h1>
                <Badge variant="role" size="sm">{user?.role || 'Member'}</Badge>
                <Badge variant="reputation" size="sm">⚡ {user?.reputationPoints ?? 1000} Rep</Badge>
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
        <div className="flex items-center gap-6 px-6 border-t border-surface-border bg-surface-elevated/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Bài viết của tôi ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('repos')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'repos'
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            Kho mã nguồn GitHub
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-3 border-b-2 transition-colors ${
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
