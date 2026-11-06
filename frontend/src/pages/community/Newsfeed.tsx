import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import EmptyState from '../../components/common/EmptyState';
import { stripMarkdown } from '../../components/common/MarkdownRenderer';
import { Post, TechZone } from '../../types';
import { communityApi, analyticsApi, authApi } from '../../api';
import { communityHub } from '../../api/signalr.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSafeAvatarUrl } from '../../utils/avatarHelper';

interface TechHealthItem {
  name: string;
  score: number;
  tier: 'A+' | 'A' | 'B+' | 'B';
  trend: string;
  fillPct: number;
}

export const Newsfeed: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { warning, info } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const techZoneSlug = searchParams.get('techzone') || undefined;

  const location = useLocation();
  const feedMode: 'latest' | 'trending' | 'relevant' =
    location.pathname === '/trending'
      ? 'trending'
      : location.pathname === '/following' || location.pathname === '/relevant'
      ? 'relevant'
      : 'latest';

  const feedHeaderConfig = {
    latest: {
      title: 'Tất cả bài viết',
      icon: 'home' as const,
    },
    trending: {
      title: 'Đang thịnh hành',
      icon: 'trending' as const,
    },
    relevant: {
      title: 'Phù hợp với bạn',
      icon: 'compass' as const,
    },
  }[feedMode];
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  // Hàng đợi Realtime ngầm: Khi có bài viết mới cùng TechZone, lưu vào hàng đợi và tự động nạp ở lần cuộn tải tiếp theo (không gián đoạn người dùng)
  const [queuedRealtimePosts, setQueuedRealtimePosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [topRepos, setTopRepos] = useState<any[]>([]);
  const [availableZones, setAvailableZones] = useState<TechZone[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);
  const pageRef = useRef<number>(1);
  const loadingMoreRef = useRef<boolean>(false);

  // Danh sách các slug TechZone mà người dùng đang theo dõi
  const [followedSlugs, setFollowedSlugs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('devradar_followed_techzones');
      return saved ? JSON.parse(saved) : ['dotnet', 'typescript-react'];
    } catch {
      return ['dotnet', 'typescript-react'];
    }
  });

  // Đồng bộ TechZone theo dõi khi người dùng bấm Follow ở các trang khác (TechZones.tsx)
  useEffect(() => {
    const handleSync = (e: any) => {
      if (Array.isArray(e.detail)) {
        setFollowedSlugs(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('devradar_followed_techzones');
          if (saved) setFollowedSlugs(JSON.parse(saved));
        } catch {}
      }
    };
    window.addEventListener('devradar_techzones_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('devradar_techzones_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Chỉ hiển thị cho người dùng các TechZone đang theo dõi trong bảng feed
  const followedZones = availableZones.filter((z) =>
    followedSlugs.some((slug) => slug.toLowerCase() === z.slug.toLowerCase())
  );

  const [techHealthList, setTechHealthList] = useState<TechHealthItem[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);

  useEffect(() => {
    communityApi
      .getTechZones()
      .then((zones) => {
        if (Array.isArray(zones)) setAvailableZones(zones);
      })
      .catch(() => {});
  }, []);

  // Tải danh sách bài viết khởi tạo (Batch 1)
  useEffect(() => {
    let isMounted = true;
    const fetchInitialPosts = async () => {
      pageRef.current = 1;
      loadingMoreRef.current = false;
      setIsLoading(true);
      setHasMore(true);
      setNextCursor(null);
      try {
        const sortByParam = feedMode;
        const res = await communityApi.getPosts({
          sortBy: sortByParam,
          techZoneSlug: techZoneSlug || undefined,
          page: 1,
          pageSize: 20,
        });

        if (isMounted) {
          let items = (res.items || []).filter((p: any) => (p.status === 1 || p.status === 'Published' || p.status === undefined) && p.isApproved !== 0);

          // CHỈ HIỂN THỊ BÀI VIẾT TỪ CÁC TECHZONE ĐANG THEO DÕI KHI Ở TAB "PHÙ HỢP VỚI BẠN"
          if (feedMode === 'relevant' && !techZoneSlug && followedSlugs.length > 0) {
            items = items.filter((p) =>
              followedSlugs.some(
                (slug) =>
                  (p.techZoneSlug || '').toLowerCase() === slug.toLowerCase() ||
                  (p.tags || []).some((t) => t.toLowerCase() === slug.toLowerCase())
              )
            );
          }

          // Enrich avatars with IdentityService profiles or safe dynamic avatars
          const authorIds = Array.from(new Set(items.map((p) => p.authorId).filter((id): id is string => Boolean(id))));
          if (authorIds.length > 0) {
            Promise.allSettled(
              authorIds.map((aId) => authApi.getUserPublicProfile(aId))
            ).then((results) => {
              const avatarMap = new Map<string, string>();
              results.forEach((r) => {
                if (r.status === 'fulfilled' && r.value) {
                  const prof = r.value;
                  if (prof.id && prof.avatarUrl) {
                    avatarMap.set(prof.id, prof.avatarUrl);
                  }
                }
              });

              if (avatarMap.size > 0 && isMounted) {
                setPosts((prev) =>
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

          setPosts(items.map((p) => ({
            ...p,
            author: {
              ...p.author,
              avatarUrl: getSafeAvatarUrl(p.author.avatarUrl, p.author.userName || p.author.displayName, 'Member'),
            },
          })));
          setNextCursor(res.nextCursor || null);
          // Điều kiện còn bài viết: Phải có nextCursor hợp lệ VÀ backend còn bài VÀ danh sách lọc không bị rỗng
          const canHaveMore = Boolean(res.nextCursor) && (res.hasMore !== undefined ? res.hasMore : items.length >= 20);
          setHasMore(canHaveMore);
        }
      } catch (err) {
        console.warn('Could not fetch live posts from API Gateway:', err);
        if (isMounted) {
          setPosts([]);
          setHasMore(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInitialPosts();

    // Tải danh sách top repos từ Crawler
    analyticsApi
      .getTopRepositories(3)
      .then((repos) => {
        if (isMounted && Array.isArray(repos) && repos.length > 0) {
          setTopRepos(repos);
        }
      })
      .catch(() => {});

    // Tải danh sách sức khỏe hệ sinh thái công nghệ từ MongoDB
    setIsLoadingHealth(true);
    analyticsApi
      .getAvailableTechnologies()
      .then((techs) => {
        if (isMounted && Array.isArray(techs) && techs.length > 0) {
          const mapped: TechHealthItem[] = techs.slice(0, 5).map((t: any) => {
            const score = Math.round(t.health_score || 85);
            const tier = score >= 90 ? 'A+' : score >= 85 ? 'A' : score >= 80 ? 'B+' : 'B';
            return {
              name: t.name,
              score,
              tier,
              trend: t.trend || (t.growth_rate ? `↗ +${(t.growth_rate * 100).toFixed(1)}%` : '↗ +3.5%'),
              fillPct: Math.min(100, Math.max(10, score)),
            };
          });
          setTechHealthList(mapped);
        } else if (isMounted) {
          setTechHealthList([]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTechHealthList([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingHealth(false);
      });

    return () => {
      isMounted = false;
    };
  }, [feedMode, techZoneSlug, followedSlugs]);

  // Helper chuyển đổi payload WebSocket SignalR sang định dạng Post của giao diện
  const mapRealtimePayloadToPost = useCallback((payload: any): Post => {
    const rawContent = payload.content || '';
    const lines = rawContent.split('\n').filter(Boolean);
    const title = lines.length > 0 ? lines[0].replace(/^[#\s*]+/, '') : 'Bài chia sẻ công nghệ';
    const summary = lines.length > 1 ? lines[1] : rawContent;

    return {
      id: payload.id || payload.postId,
      title,
      summary,
      content: rawContent,
      authorId: payload.authorId,
      author: {
        id: payload.authorId,
        displayName: payload.authorUsername || payload.authorName || 'DevRadar Member',
        userName: payload.authorUsername || 'developer',
        avatarUrl: getSafeAvatarUrl(payload.authorAvatarUrl, payload.authorUsername || payload.authorName, 'Member'),
        reputationPoints: payload.authorReputationPoints ?? 0,
        tierTitle: payload.authorTierTitle || 'Code Initiate',
        tierBadge: (payload.authorTierBadge || 'Tân thủ').replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim(),
      },
      techZoneId: payload.techZoneId,
      techZoneName: payload.techZoneName || '.NET Core & C#',
      techZoneSlug: payload.techZoneSlug,
      tags: typeof payload.tags === 'string' ? payload.tags.split(',').map((t: string) => t.trim()) : payload.tags || [],
      likeCount: payload.likesCount ?? 0,
      commentCount: payload.commentsCount ?? 0,
      bookmarkCount: payload.bookmarksCount ?? 0,
      viewCount: payload.viewsCount ?? 0,
      isLiked: false,
      isBookmarked: false,
      status: 'Published',
      toxicityScore: 0.02,
      createdAt: 'Vừa xong',
    };
  }, []);

  // Kết nối SignalR Realtime: Lắng nghe sự kiện "post-created" trên Feed Group
  useEffect(() => {
    communityHub.connect();

    const handleNewPost = (payload: any) => {
      if (!payload || (!payload.id && !payload.postId)) return;

      const incomingAuthorId = payload.authorId;
      // ẨN BÀI VIẾT CỦA BẢN THÂN: Bỏ qua nếu tác giả là chính người dùng hiện tại (đã có thông báo khi đăng bài)
      if (user?.id && incomingAuthorId && String(incomingAuthorId).toLowerCase() === String(user.id).toLowerCase()) {
        return;
      }

      // Nếu đang lọc theo TechZone cụ thể, chỉ tiếp nhận bài thuộc TechZone tương ứng
      if (techZoneSlug && payload.techZoneSlug && payload.techZoneSlug.toLowerCase() !== techZoneSlug.toLowerCase()) {
        return;
      }

      // CHỈ TIẾP NHẬN BÀI VIẾT TỪ CÁC TECHZONE ĐANG THEO DÕI TRONG BẢNG FEED
      if (!techZoneSlug && followedSlugs.length > 0) {
        const matchesFollowed = followedSlugs.some(
          (slug) =>
            (payload.techZoneSlug || '').toLowerCase() === slug.toLowerCase() ||
            (typeof payload.tags === 'string' && payload.tags.toLowerCase().includes(slug.toLowerCase()))
        );
        if (!matchesFollowed) return;
      }

      const newPost = mapRealtimePayloadToPost(payload);

      // NẠP NGẦM BÀI VIẾT VÀO HÀNG ĐỢI REALTIME (Không hiển thị thông báo, không giật màn hình)
      // Bài viết mới sẽ tự động hiển thị ở lần tải dữ liệu tiếp theo khi người dùng cuộn xem
      setQueuedRealtimePosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
    };

    communityHub.on('post-created', handleNewPost);

    return () => {
      communityHub.off('post-created', handleNewPost);
    };
  }, [user?.id, techZoneSlug, followedSlugs, mapRealtimePayloadToPost]);

  // Tải thêm bài viết tiếp theo (Cursor-based Infinite Scroll)
  // Tự động kết hợp bài viết từ hàng đợi Realtime ngầm (queuedRealtimePosts) vào lần scroll này
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || loadingMoreRef.current) return;
    if (!hasMore && queuedRealtimePosts.length === 0) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      // 1. Lấy các bài viết mới từ SignalR hàng đợi ngầm đang chờ
      const pendingRealtime = [...queuedRealtimePosts];
      setQueuedRealtimePosts([]);

      let filteredNew: Post[] = [];
      let newNextCursor = nextCursor;
      let newHasMore = false;

      // 2. Tải thêm từ backend nếu còn dữ liệu (hasMore & nextCursor)
      if (hasMore && nextCursor) {
        const sortByParam = feedMode;
        const nextPage = pageRef.current + 1;
        const res = await communityApi.getPosts({
          sortBy: sortByParam,
          techZoneSlug: techZoneSlug || undefined,
          cursor: nextCursor,
          page: nextPage,
          pageSize: 10,
        });

        const newItems = (res.items || []).filter(
          (p: any) => (p.status === 1 || p.status === 'Published' || p.status === undefined) && p.isApproved !== 0
        );
        filteredNew = newItems;
        if (feedMode === 'relevant' && !techZoneSlug && followedSlugs.length > 0) {
          filteredNew = newItems.filter((p) =>
            followedSlugs.some(
              (slug) =>
                (p.techZoneSlug || '').toLowerCase() === slug.toLowerCase() ||
                (p.tags || []).some((t) => t.toLowerCase() === slug.toLowerCase())
            )
          );
        }
        newNextCursor = res.nextCursor || null;
        // Chỉ có thể còn bài viết tiếp theo nếu backend có nextCursor mới khác cursor hiện tại
        const isCursorAdvanced = Boolean(res.nextCursor && res.nextCursor !== nextCursor);
        newHasMore = isCursorAdvanced && (res.hasMore ?? (filteredNew.length >= 10));
      }

      // 3. Hợp nhất bài viết mới cùng TechZone từ hàng đợi Realtime và đợt load tiếp theo, loại bỏ trùng lặp
      const combinedBatch = [...pendingRealtime, ...filteredNew];
      const existingIds = new Set(posts.map((p) => p.id));
      const uniqueItems = combinedBatch.filter((p) => !existingIds.has(p.id));

      if (uniqueItems.length > 0) {
        setPosts((prev) => [...prev, ...uniqueItems]);
        pageRef.current += 1;
        setNextCursor(newNextCursor);
        setHasMore(newHasMore);
      } else {
        // Nếu không có bài viết mới nào phù hợp được nạp thêm -> Dừng tải ngay để dập tắt loop giật liên tục
        setHasMore(false);
      }
    } catch (err) {
      console.warn('Could not load more posts with cursor:', err);
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, queuedRealtimePosts, nextCursor, feedMode, techZoneSlug, followedSlugs, posts]);

  // IntersectionObserver trigger khi cuộn đến cuối danh sách bài viết
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !isLoadingMore && !loadingMoreRef.current && (hasMore || queuedRealtimePosts.length > 0)) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, hasMore, isLoading, isLoadingMore, queuedRealtimePosts.length]);

  const handleToggleLike = async (postId: string) => {
    if (!isAuthenticated) {
      warning('Vui lòng đăng nhập để thích bài viết.', 'Yêu cầu đăng nhập');
      navigate('/login');
      return;
    }

    // Optimistic UI update
    setPosts((prev) =>
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

    // Optimistic UI update
    setPosts((prev) =>
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

  const handleSelectZone = (slug?: string) => {
    if (!slug) {
      searchParams.delete('techzone');
      setSearchParams(searchParams);
    } else {
      searchParams.set('techzone', slug);
      setSearchParams(searchParams);
    }
  };

  // Ẩn các bài viết của chính người xem khi duyệt Bảng tin Newsfeed (bảo đảm tính cá nhân hóa)
  const feedPostsWithoutOwn = posts.filter(
    (p) => !user?.id || !p.authorId || String(p.authorId).toLowerCase() !== String(user.id).toLowerCase()
  );

  const filteredPosts = selectedTag
    ? feedPostsWithoutOwn.filter((p) => p.tags.includes(selectedTag))
    : feedPostsWithoutOwn;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Center Main Feed (720px equivalent) */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Feed Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <AppIcon name={feedHeaderConfig.icon} size={16} className="text-brand-secondary" />
              <span>{feedHeaderConfig.title}</span>
            </h2>
          </div>

          {selectedTag && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-subtle">Lọc theo:</span>
              <Badge variant="tech" size="sm" onClick={() => setSelectedTag(null)}>
                #{selectedTag} ✕
              </Badge>
            </div>
          )}
        </div>

        {/* TechZone Quick Filter Bar - Chỉ hiển thị cho người dùng các TechZone đang theo dõi */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-text-subtle uppercase flex-shrink-0 flex items-center gap-1">
            <AppIcon name="bookmark" className="w-3.5 h-3.5 text-brand-secondary" />
            <span>Đang theo dõi:</span>
          </span>

          {followedZones.length > 0 ? (
            <>
              <button
                onClick={() => handleSelectZone(undefined)}
                className={`px-3 py-1 rounded-btn text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  !techZoneSlug
                    ? 'bg-brand-primary text-white font-semibold shadow-sm'
                    : 'bg-surface-elevated text-text-muted hover:text-text-main border border-surface-border'
                }`}
              >
                <span>Tất cả ({followedZones.length})</span>
              </button>

              {followedZones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => handleSelectZone(z.slug)}
                  className={`px-3 py-1 rounded-btn text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                    techZoneSlug === z.slug
                      ? 'bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/50 font-semibold shadow-sm'
                      : 'bg-surface-elevated text-text-muted hover:text-text-main border border-surface-border'
                  }`}
                >
                  <span className="text-text-subtle font-mono">#</span>
                  <span>{z.slug}</span>
                </button>
              ))}

              <Link
                to="/techzones"
                className="px-2.5 py-1 rounded-btn text-[11px] text-text-muted hover:text-brand-secondary hover:border-brand-secondary/30 transition-all border border-dashed border-surface-border whitespace-nowrap flex items-center gap-1 ml-auto"
                title="Khám phá và theo dõi thêm TechZone khác"
              >
                <AppIcon name="plus" className="w-3 h-3" />
                <span>Thêm</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2 py-0.5 text-text-muted">
              <span className="text-xs">Bạn chưa theo dõi TechZone nào.</span>
              <Link
                to="/techzones"
                className="text-xs font-semibold text-brand-secondary hover:underline flex items-center gap-1"
              >
                <span>Khám phá & theo dõi ngay</span>
                <AppIcon name="arrowRight" className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Post Cards List */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-surface-card border border-surface-border rounded-card">
              <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-text-muted">Đang tải bảng tin công nghệ từ máy chủ...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              icon="fileText"
              title="Chưa có bài viết nào"
              description={
                selectedTag
                  ? `Chưa có bài viết nào được gắn thẻ #${selectedTag}.`
                  : techZoneSlug
                  ? `Chưa có bài viết nào trong TechZone #${techZoneSlug}.`
                  : followedSlugs.length > 0
                  ? `Chưa có bài viết nào thuộc các TechZone bạn đang theo dõi (#${followedSlugs.join(', #')}).`
                  : 'Chưa có bài viết nào. Hãy theo dõi các TechZone để nhận thông tin phù hợp!'
              }
              actionLabel={followedSlugs.length === 0 ? 'Khám phá TechZone' : 'Tạo bài viết mới'}
              onAction={() => {
                if (followedSlugs.length === 0) {
                  navigate('/techzones');
                } else {
                  navigate('/editor/new');
                }
              }}
            />
          ) : (
            filteredPosts.map((post) => (
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
                      <span className="text-xs font-bold text-text-main hover:text-brand-secondary transition-colors">
                        {post.author.displayName}
                      </span>
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
                        {post.techZoneName}
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  className="text-text-subtle hover:text-text-main p-1 rounded hover:bg-surface-elevated transition-colors"
                  aria-label="Tùy chọn"
                >
                  <AppIcon name="share" size={14} />
                </button>
              </div>

              {/* Title & Summary */}
              <Link to={`/posts/${post.id}`}>
                <h2 className="text-base font-bold text-text-main group-hover:text-brand-secondary transition-colors leading-snug">
                  {post.title}
                </h2>
              </Link>
              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                {stripMarkdown(post.summary || post.content || '')}
              </p>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="tech"
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>

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
          )))}

          {/* Infinite Scroll Sentinel: chỉ render khi còn bài viết để tải tiếp và không trong trạng thái đang nạp */}
          {hasMore && !isLoading && !isLoadingMore && (
            <div ref={observerTarget} className="h-4 w-full pointer-events-none" />
          )}

          {isLoadingMore && (
            <div className="flex items-center justify-center py-6 gap-2.5 text-text-muted text-xs bg-surface-card/40 border border-surface-border/50 rounded-card">
              <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <span>Đang tải thêm bài viết từ cộng đồng...</span>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-xs text-text-subtle border-t border-surface-border/50 flex items-center justify-center gap-1.5">
              <AppIcon name="CheckCircle" size={14} className="text-status-success" />
              <span>Bạn đã xem hết tất cả bài viết trên bảng tin.</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Sức khỏe Ngôn ngữ & Framework (SCR-04 Wireframe Standard 350px) */}
      <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-6">
        {/* Tech Health Widget Card */}
        <Card variant="default" padding="md" className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-text-main tracking-tight">
                Sức khỏe Ngôn ngữ & Framework
              </h3>
              <p className="text-[11px] text-text-subtle">
                Phân hóa sức khỏe & độ ổn định 2026
              </p>
            </div>
            <Link to="/dashboard" className="text-brand-secondary hover:underline text-[11px] font-semibold">
              Dashboard →
            </Link>
          </div>

          <div className="flex flex-col gap-3.5">
            {isLoadingHealth ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-24 bg-surface-elevated rounded" />
                    <div className="h-3.5 w-16 bg-surface-elevated rounded" />
                  </div>
                  <div className="w-full h-1.5 bg-surface-elevated rounded-full" />
                </div>
              ))
            ) : techHealthList.length === 0 ? (
              <span className="text-xs text-text-muted py-2 text-center">Chưa có dữ liệu sức khỏe công nghệ.</span>
            ) : (
              techHealthList.map((item) => (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-main">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-text-subtle">{item.trend}</span>
                      <span className="font-mono font-bold text-text-main">{item.score} [{item.tier}]</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-300"
                      style={{ width: `${item.fillPct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-text-subtle font-mono">
            <span>● A+ trên 90</span>
            <span>● A từ 85 đến 89</span>
            <span>● B+ từ 80 đến 84</span>
          </div>

          <Link to="/dashboard" className="w-full">
            <Button variant="secondary" size="sm" className="w-full justify-center">
              Xem phân hóa chi tiết →
            </Button>
          </Link>
        </Card>

        {/* Top Repos Widget (SCR-04 Wireframe) */}
        <Card variant="default" padding="md" className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-text-main border-b border-surface-border pb-2.5">
            REPO THEO DÕI NỔI BẬT
          </h3>
          <div className="flex flex-col gap-3">
            {topRepos.length > 0 ? (
              topRepos.map((repo, idx) => (
                <React.Fragment key={repo.full_name || repo.name || idx}>
                  {idx > 0 && <div className="h-[1px] bg-surface-border" />}
                  <div className="flex flex-col gap-1 text-xs">
                    <Link to="/analytics/repo-health" className="font-bold text-text-main hover:text-brand-secondary truncate">
                      {repo.full_name || repo.name}
                    </Link>
                    <span className="text-[11px] text-text-subtle flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <AppIcon name="Star" size={11} className="text-amber-400" />
                        <span>{repo.stars || repo.stargazers_count || 0}</span>
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <AppIcon name="GitFork" size={11} className="text-text-muted" />
                        <span>{repo.forks || 0}</span>
                      </span>
                      <span>•</span>
                      <span>Ngôn ngữ: <strong className="text-brand-secondary font-mono">{repo.language || 'N/A'}</strong></span>
                    </span>
                  </div>
                </React.Fragment>
              ))
            ) : (
              <div className="flex flex-col gap-1 text-xs">
                <Link to="/analytics/repo-health" className="font-bold text-text-main hover:text-brand-secondary">
                  DevRadar/Microservices-Hub
                </Link>
                <span className="text-[11px] text-text-subtle">
                  Phân tích sức khỏe repo và commit metrics từ GitHub.
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Newsfeed;
