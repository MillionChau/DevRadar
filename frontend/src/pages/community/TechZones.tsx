import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import EmptyState from '../../components/common/EmptyState';
import { stripMarkdown } from '../../components/common/MarkdownRenderer';
import { TechZone, Post } from '../../types';
import { communityApi, authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSafeAvatarUrl } from '../../utils/avatarHelper';

const STORAGE_KEY = 'devradar_followed_techzones';

export const TechZones: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, info, warning } = useToast();

  const [search, setSearch] = useState('');
  const [techZones, setTechZones] = useState<TechZone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState<boolean>(true);

  // Persistent followed techzones helper
  const getFollowedSlugs = (): string[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['dotnet', 'typescript-react'];
    } catch {
      return ['dotnet', 'typescript-react'];
    }
  };

  const saveFollowedSlugs = (slugs: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    window.dispatchEvent(new CustomEvent('devradar_techzones_updated', { detail: slugs }));
  };

  // TechZone feed states
  const [currentZone, setCurrentZone] = useState<TechZone | null>(null);
  const [zonePosts, setZonePosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  useEffect(() => {
    setIsLoadingZones(true);
    communityApi
      .getTechZones()
      .then((zones) => {
        if (zones && zones.length > 0) {
          const followed = getFollowedSlugs();
          const mapped = zones.map((z) => ({
            ...z,
            isFollowing: followed.includes(z.slug.toLowerCase()),
          }));
          setTechZones(mapped);
        } else {
          setTechZones([]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live techzones:', err);
      })
      .finally(() => {
        setIsLoadingZones(false);
      });
  }, []);

  // When slug is provided, fetch zone info and its posts
  useEffect(() => {
    if (!slug) {
      setCurrentZone(null);
      setZonePosts([]);
      return;
    }

    const followed = getFollowedSlugs();
    const matched = techZones.find((z) => z.slug.toLowerCase() === slug.toLowerCase());
    if (matched) {
      setCurrentZone({
        ...matched,
        isFollowing: followed.includes(matched.slug.toLowerCase()),
      });
    } else {
      communityApi
        .getTechZoneBySlug(slug)
        .then((z) => {
          setCurrentZone({
            ...z,
            isFollowing: followed.includes(z.slug.toLowerCase()),
          });
        })
        .catch(() => {
          setCurrentZone({
            id: '',
            name: `#${slug}`,
            slug,
            description: `Không gian công nghệ #${slug}`,
            postCount: 0,
            followerCount: 0,
            isFollowing: followed.includes(slug.toLowerCase()),
          });
        });
    }

    setIsLoadingPosts(true);
    communityApi
      .getPosts({ techZoneSlug: slug })
      .then((res) => {
        const items = res.items || [];
        const authorIds = Array.from(new Set(items.map((p: any) => p.authorId).filter((id): id is string => Boolean(id))));

        if (authorIds.length > 0) {
          Promise.allSettled(
            authorIds.map((aId) => authApi.getUserPublicProfile(aId))
          ).then((results) => {
            const avatarMap = new Map<string, string>();
            results.forEach((r) => {
              if (r.status === 'fulfilled' && r.value && r.value.id && r.value.avatarUrl) {
                avatarMap.set(r.value.id, r.value.avatarUrl);
              }
            });

            if (avatarMap.size > 0) {
              setZonePosts((prev) =>
                prev.map((p) => {
                  const realAvatar = p.authorId ? avatarMap.get(p.authorId) : undefined;
                  if (realAvatar) {
                    return {
                      ...p,
                      author: {
                        ...p.author,
                        avatarUrl: realAvatar,
                      },
                    };
                  }
                  return p;
                })
              );
            }
          }).catch(() => {});
        }

        setZonePosts(items.map((p: any) => ({
          ...p,
          author: {
            ...p.author,
            avatarUrl: getSafeAvatarUrl(p.author?.avatarUrl, p.author?.userName || p.author?.displayName, 'Member'),
          },
        })));
      })
      .catch((err) => {
        console.warn('Could not fetch zone posts:', err);
        setZonePosts([]);
      })
      .finally(() => {
        setIsLoadingPosts(false);
      });
  }, [slug, techZones.length]);

  const handleToggleFollow = (targetZone: TechZone, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const followed = getFollowedSlugs();
    const isCurrentlyFollowing = followed.includes(targetZone.slug.toLowerCase());
    const nextState = !isCurrentlyFollowing;

    const updatedSlugs = isCurrentlyFollowing
      ? followed.filter((s) => s !== targetZone.slug.toLowerCase())
      : [...followed, targetZone.slug.toLowerCase()];

    saveFollowedSlugs(updatedSlugs);

    // Update in-memory state for techZones
    setTechZones((prev) =>
      prev.map((tz) => {
        if (tz.slug.toLowerCase() === targetZone.slug.toLowerCase()) {
          return {
            ...tz,
            isFollowing: nextState,
            followerCount: nextState ? tz.followerCount + 1 : Math.max(0, tz.followerCount - 1),
          };
        }
        return tz;
      })
    );

    // Update currentZone if viewing single zone
    if (currentZone && currentZone.slug.toLowerCase() === targetZone.slug.toLowerCase()) {
      setCurrentZone((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: nextState,
              followerCount: nextState ? prev.followerCount + 1 : Math.max(0, prev.followerCount - 1),
            }
          : null
      );
    }

    if (nextState) {
      success(`Đang theo dõi #${targetZone.slug}! Các bài viết trong chủ đề này sẽ được ưu tiên hiển thị ở Bảng tin "Phù hợp với bạn".`, 'Theo dõi TechZone');
    } else {
      info(`Đã hủy theo dõi chuyên đề #${targetZone.slug}.`, 'TechZone');
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!isAuthenticated) {
      warning('Vui lòng đăng nhập để thích bài viết.', 'Yêu cầu đăng nhập');
      navigate('/login');
      return;
    }

    setZonePosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likeCount: nextLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
          };
        }
        return p;
      })
    );

    try {
      await communityApi.toggleLikePost(postId);
    } catch (err) {
      console.warn('Failed to toggle like on backend:', err);
    }
  };

  const handleToggleBookmark = async (postId: string) => {
    if (!isAuthenticated) {
      warning('Vui lòng đăng nhập để lưu bài viết vào bộ sưu tập cá nhân.', 'Yêu cầu đăng nhập');
      navigate('/login');
      return;
    }

    setZonePosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextBookmarked = !p.isBookmarked;
          return {
            ...p,
            isBookmarked: nextBookmarked,
            bookmarkCount: nextBookmarked ? p.bookmarkCount + 1 : Math.max(0, p.bookmarkCount - 1),
          };
        }
        return p;
      })
    );

    try {
      await communityApi.toggleBookmarkPost(postId);
    } catch (err) {
      console.warn('Failed to toggle bookmark on backend:', err);
    }
  };

  const filteredZones = techZones.filter(
    (tz) =>
      tz.name.toLowerCase().includes(search.toLowerCase()) ||
      tz.description.toLowerCase().includes(search.toLowerCase()) ||
      tz.slug.toLowerCase().includes(search.toLowerCase())
  );

  // If a slug is active, render the TechZone Detail & Post Feed view
  if (slug) {
    const zone = currentZone || {
      id: '',
      name: `#${slug}`,
      slug,
      description: `Không gian chuyên môn công nghệ #${slug}`,
      postCount: zonePosts.length,
      followerCount: 0,
      isFollowing: false,
    };

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/techzones"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-secondary transition-colors"
          >
            <AppIcon name="arrowLeft" size={14} />
            <span>Tất cả TechZones</span>
          </Link>
        </div>

        {/* TechZone Header Banner */}
        <Card variant="default" padding="lg" className="border-brand-primary/20 bg-gradient-to-r from-surface-card via-surface-card to-brand-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-card bg-brand-primary/10 border border-brand-primary/30 text-brand-secondary flex items-center justify-center font-bold text-xl flex-shrink-0">
                <AppIcon name="layers" size={28} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-text-main">
                    {zone.name}
                  </h1>
                  <Badge variant="tech" size="sm" className="font-mono text-xs">
                    #{zone.slug}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted leading-relaxed max-w-2xl">
                  {zone.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-text-subtle pt-1 font-medium">
                  <span>📄 {zonePosts.length || zone.postCount} bài viết chuyên sâu</span>
                  <span>👥 {(zone.followerCount || 0).toLocaleString()} người theo dõi</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button
                variant={zone.isFollowing ? 'secondary' : 'outline'}
                size="sm"
                icon={zone.isFollowing ? 'check' : 'plus'}
                onClick={() => handleToggleFollow(zone)}
              >
                {zone.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </Button>
              <Link to={`/editor/new?techZoneId=${zone.id || ''}`}>
                <Button variant="primary" size="sm" icon="plus">
                  Viết bài trong Zone
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Posts in TechZone */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <span>BÀI VIẾT THUỘC TECHZONE</span>
              <span className="text-xs text-text-subtle font-normal">({zonePosts.length} bài viết)</span>
            </h2>
          </div>

          {isLoadingPosts ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-surface-card border border-surface-border rounded-card">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-text-muted">Đang tải các bài viết trong chuyên đề #{slug}...</p>
            </div>
          ) : zonePosts.length === 0 ? (
            <EmptyState
              icon="fileText"
              title={`Chưa có bài viết nào trong #${slug}`}
              description="Hãy là người đầu tiên chia sẻ góc nhìn và kiến thức kỹ thuật chuyên sâu trong TechZone này!"
              actionLabel="Đăng bài viết mới"
              onAction={() => navigate(`/editor/new?techZoneId=${zone.id || ''}`)}
            />
          ) : (
            zonePosts.map((post) => (
              <Card
                key={post.id}
                variant="interactive"
                padding="md"
                className="flex flex-col gap-3 group"
              >
                {/* Author Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.displayName}
                      className="w-9 h-9 rounded-full border border-surface-border object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/profile/${post.author.id || post.author.userName}`} className="text-xs font-bold text-text-main hover:text-brand-secondary transition-colors">
                          {post.author.displayName}
                        </Link>
                        <Badge variant="tech" size="sm" icon="Star" className="font-medium text-[11px] py-0 px-2 bg-brand-primary/10 text-brand-secondary border-brand-primary/20">
                          {(post.author.tierBadge || 'Tân thủ').replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim()}
                        </Badge>
                        <span className="text-[11px] font-mono font-medium text-text-subtle flex items-center gap-1" title="Điểm uy tín & đóng góp">
                          <AppIcon name="Zap" size={12} className="text-status-warning" />
                          <span>{(post.author.reputationPoints ?? 0).toLocaleString()} Điểm</span>
                        </span>
                      </div>
                      <span className="text-[11px] text-text-subtle">
                        {post.createdAt} • trong{' '}
                        <span className="text-brand-secondary/90 font-medium">
                          {post.techZoneName || zone.name}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Title & Summary */}
                <Link to={`/posts/${post.id}`}>
                  <h3 className="text-base font-bold text-text-main group-hover:text-brand-secondary transition-colors leading-snug">
                    {post.title}
                  </h3>
                </Link>

                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {stripMarkdown(post.summary || post.content || '')}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="tech" size="sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Interaction Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-border text-xs text-text-muted">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 hover:text-status-danger transition-colors ${
                        post.isLiked ? 'text-status-danger font-semibold' : ''
                      }`}
                    >
                      <AppIcon name="heart" size={15} />
                      <span>{post.likeCount} Thích</span>
                    </button>

                    <Link
                      to={`/posts/${post.id}`}
                      className="flex items-center gap-1.5 hover:text-text-main transition-colors"
                    >
                      <AppIcon name="message" size={15} />
                      <span>{post.commentCount} Bình luận</span>
                    </Link>

                    <button
                      onClick={() => handleToggleBookmark(post.id)}
                      className={`flex items-center gap-1.5 hover:text-brand-secondary transition-colors ${
                        post.isBookmarked ? 'text-brand-secondary font-semibold' : ''
                      }`}
                    >
                      <AppIcon name={post.isBookmarked ? 'bookmarkCheck' : 'bookmark'} size={15} />
                      <span>{post.bookmarkCount} Lưu</span>
                    </button>
                  </div>

                  <Link
                    to={`/posts/${post.id}`}
                    className="text-brand-secondary hover:underline text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Chi tiết</span>
                    <AppIcon name="arrowRight" size={12} />
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Directory View (All TechZones)
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            KHÁM PHÁ TECHZONES (CÁC KHÔNG GIAN KỸ THUẬT CHUYÊN ĐỀ)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi các chuyên mục công nghệ yêu thích để cá nhân hóa bảng tin bài viết kỹ thuật phù hợp với bạn
          </p>
        </div>

        <div className="w-full md:w-72">
          <Input
            placeholder="Tìm kiếm chuyên mục công nghệ..."
            icon="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TechZones Grid */}
      {isLoadingZones ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="p-4 rounded-card bg-surface-card border border-surface-border animate-pulse flex flex-col justify-between gap-4 h-36">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-btn bg-surface-elevated shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-surface-elevated rounded" />
                  <div className="h-3 w-64 bg-surface-elevated rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                <div className="h-3 w-28 bg-surface-elevated rounded" />
                <div className="h-7 w-20 bg-surface-elevated rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredZones.length === 0 ? (
        <EmptyState
          icon="layers"
          title="Không tìm thấy TechZone nào"
          description={search ? `Không có không gian kỹ thuật phù hợp với từ khóa "${search}".` : 'Chưa có không gian kỹ thuật nào được khởi tạo.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredZones.map((zone) => (
            <Card
              key={zone.id || zone.slug}
              variant="default"
              padding="md"
              className="flex flex-col justify-between gap-4 hover:border-brand-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <Link to={`/techzones/${zone.slug}`} className="flex items-center gap-3 group flex-1">
                  <div className="w-10 h-10 rounded-btn bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary group-hover:bg-brand-primary/20 flex items-center justify-center font-bold text-sm transition-colors flex-shrink-0">
                    <AppIcon name="layers" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-main group-hover:text-brand-secondary transition-colors">
                      {zone.name}
                    </h3>
                    <span className="text-[11px] text-text-subtle font-mono">
                      #{zone.slug}
                    </span>
                  </div>
                </Link>

                <Button
                  variant={zone.isFollowing ? 'secondary' : 'outline'}
                  size="sm"
                  icon={zone.isFollowing ? 'check' : 'plus'}
                  onClick={(e) => handleToggleFollow(zone, e)}
                >
                  {zone.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </Button>
              </div>

              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                {zone.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-surface-border text-xs text-text-subtle">
                <Link
                  to={`/techzones/${zone.slug}`}
                  className="text-brand-secondary hover:underline font-semibold flex items-center gap-1"
                >
                  <span>{zone.postCount} bài viết</span>
                  <AppIcon name="arrowRight" size={12} />
                </Link>
                <span>{zone.followerCount.toLocaleString()} người theo dõi</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechZones;
