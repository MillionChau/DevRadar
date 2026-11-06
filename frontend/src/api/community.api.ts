import { apiClient } from './client';
import { Post, Comment, TechZone, UserReputation, ReputationTransaction, LeaderboardUser } from '../types';
import { getSafeAvatarUrl } from '../utils/avatarHelper';

export interface GetPostsParams {
  page?: number;
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
  techZoneId?: string;
  techZoneSlug?: string;
  authorId?: string;
  search?: string;
  searchTerm?: string;
  tag?: string;
  status?: number;
  sortBy?: 'latest' | 'trending' | 'top' | 'relevant' | string;
}

export interface CreatePostPayload {
  content: string;
  techZoneId?: string;
  tags?: string;
}

export interface CreateCommentPayload {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export const communityApi = {
  /** Lấy danh sách bài viết trên Bảng tin (FR-10, UC-10) - Hỗ trợ cả Cursor-based Infinite Scroll & Pagination */
  getPosts: async (
    params?: GetPostsParams
  ): Promise<{
    items: Post[];
    totalCount: number;
    nextCursor?: string | null;
    hasMore?: boolean;
    page?: number;
    totalPages?: number;
  }> => {
    const queryParams: Record<string, any> = {};
    const page = params?.page ?? params?.pageNumber;
    if (page) queryParams.page = page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;
    if (params?.cursor) queryParams.cursor = params.cursor;
    const search = params?.search ?? params?.searchTerm;
    if (search) queryParams.search = search;
    if (params?.techZoneId) queryParams.techZoneId = params.techZoneId;
    if (params?.techZoneSlug) queryParams.techZoneSlug = params.techZoneSlug;
    if (params?.authorId) queryParams.authorId = params.authorId;
    if (params?.tag) queryParams.tag = params.tag;
    if (params?.status !== undefined) queryParams.status = params.status;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;

    const res = await apiClient.get<any>('/community/api/Posts', { params: queryParams });
    const paged = res.data || res;
    const rawItems: any[] = paged.items || paged.data || [];

    // Adapter chuyển đổi sang định dạng giao diện UI mong đợi
    const items: Post[] = rawItems.map((item) => {
      // Tách dòng đầu làm title nếu chưa có
      const lines = (item.content || '').split('\n').filter(Boolean);
      const title = lines.length > 0 ? lines[0].replace(/^[#\s*]+/, '') : 'Bài chia sẻ công nghệ';
      const summary = lines.length > 1 ? lines[1] : (item.content || '');

      return {
        id: item.id,
        title: item.title || title,
        summary: item.summary || summary,
        content: item.content || '',
        authorId: item.authorId || item.createdBy,
        author: {
          id: item.authorId || item.createdBy,
          displayName: item.authorUsername || item.authorName || 'DevRadar Member',
          userName: item.authorUsername || item.authorUserName || 'developer',
          avatarUrl: getSafeAvatarUrl(item.authorAvatarUrl || item.authorAvatar, item.authorUsername || item.authorName, 'Member'),
          reputationPoints: item.authorReputationPoints ?? 0,
          tierTitle: item.authorTierTitle || 'Code Initiate',
          tierBadge: (item.authorTierBadge || 'Tân thủ').replace(/^[^\w\s\u00C0-\u1EF9]+/u, '').trim(),
        },
        techZoneId: item.techZoneId,
        techZoneName: item.techZoneName || '.NET Core & C#',
        techZoneSlug: item.techZoneSlug,
        tags: typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : item.tags || [],
        likeCount: item.likesCount ?? 0,
        commentCount: item.commentsCount ?? 0,
        bookmarkCount: item.bookmarksCount ?? 0,
        viewCount: item.viewsCount ?? 0,
        isLiked: item.isLikedByViewer ?? false,
        isBookmarked: item.isBookmarkedByViewer ?? false,
        status: 'Published',
        toxicityScore: 0.02,
        createdAt: item.createdDate ? new Date(item.createdDate).toLocaleDateString('vi-VN') : 'Vừa xong',
      };
    });

    const pageSize = params?.pageSize ?? 10;
    const totalCount = paged.totalCount ?? items.length;

    return {
      items,
      totalCount,
      nextCursor: paged.nextCursor ?? null,
      hasMore: paged.hasMore !== undefined ? paged.hasMore : items.length >= pageSize,
      page: paged.page ?? page ?? 1,
      totalPages: paged.totalPages ?? Math.ceil(totalCount / pageSize),
    };
  },

  /** Xem chi tiết một bài viết (FR-11, UC-11) */
  getPostById: async (id: string): Promise<Post> => {
    const res = await apiClient.get<any>(`/community/api/Posts/${id}`);
    const item = res.data || res;
    return item;
  },

  /** Đăng bài viết mới (FR-15, UC-15) — qua kiểm duyệt QualityService */
  createPost: async (payload: CreatePostPayload): Promise<string> => {
    const res = await apiClient.post<any>('/community/api/Posts', payload);
    return res.data || res;
  },

  /** Thả tim / Bỏ tim bài viết (FR-19, UC-19) */
  toggleLikePost: async (id: string): Promise<boolean> => {
    const res = await apiClient.post<any>(`/community/api/Posts/${id}/like`);
    return res.data || res;
  },

  /** Chỉnh sửa bài viết (FR-16, UC-16) */
  updatePost: async (id: string, payload: { content: string; techZoneId?: string; tags?: string }): Promise<any> => {
    return apiClient.put(`/community/api/Posts/${id}`, payload);
  },

  /** Lưu / Bỏ lưu Bookmark bài viết (FR-20, UC-20) */
  toggleBookmarkPost: async (id: string): Promise<boolean> => {
    const res = await apiClient.post<any>(`/community/api/Posts/${id}/bookmark`);
    return res.data || res;
  },

  /** Lấy danh sách bài viết đã lưu Bookmark (FR-21, UC-21) */
  getMyBookmarks: async (pageNumber = 1, pageSize = 20): Promise<{ items: Post[]; totalCount: number }> => {
    const res = await apiClient.get<any>('/community/api/Posts/bookmarks/me', { params: { pageNumber, pageSize } });
    const paged = res.data || res;
    const rawItems: any[] = paged.items || paged.data || [];
    const items: Post[] = rawItems.map((item) => ({
      id: item.id,
      title: item.title || (item.content ? item.content.split('\n')[0].replace(/^[#\s*]+/, '') : 'Bài viết'),
      summary: item.summary || item.content || '',
      content: item.content || '',
      authorId: item.authorId,
      author: {
        displayName: item.authorName || 'DevRadar Member',
        userName: item.authorUserName || 'developer',
        avatarUrl: getSafeAvatarUrl(item.authorAvatar, item.authorUserName || item.authorName, 'Member'),
        reputationPoints: 1200,
      },
      tags: typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : item.tags || [],
      likeCount: item.likesCount ?? 0,
      commentCount: item.commentsCount ?? 0,
      bookmarkCount: item.bookmarksCount ?? 0,
      isBookmarked: true,
      createdAt: item.createdDate ? new Date(item.createdDate).toLocaleDateString('vi-VN') : 'Vừa xong',
    }));
    return { items, totalCount: paged.totalCount ?? items.length };
  },

  /** Lấy danh sách bình luận của bài viết (FR-24, UC-24) */
  getComments: async (postId: string): Promise<Comment[]> => {
    try {
      const res = await apiClient.get<any>(`/community/api/comments/post/${postId}`);
      const raw = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : res?.items || [];
      return raw;
    } catch {
      const res = await apiClient.get<any>('/community/api/comments', { params: { postId } });
      const raw = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : res?.items || [];
      return raw;
    }
  },

  /** Gửi bình luận mới hoặc trả lời (FR-25, UC-25) */
  createComment: async (payload: CreateCommentPayload): Promise<any> => {
    return apiClient.post('/community/api/Comments', payload);
  },

  /** Khôi phục bình luận đã bị ẩn do vi phạm (UC-60 - Quyền Admin) */
  restoreComment: async (commentId: string): Promise<any> => {
    const res = await apiClient.put<any>(`/community/api/admin/comments/${commentId}/restore`);
    return res.data || res;
  },

  /** Chủ động ẩn bình luận vi phạm tiêu chuẩn cộng đồng (UC-59 - Quyền Admin) */
  hideComment: async (commentId: string, reason?: string): Promise<any> => {
    const res = await apiClient.put<any>(`/community/api/admin/comments/${commentId}/hide`, { reason });
    return res.data || res;
  },

  /** Xóa vĩnh viễn bình luận khỏi hệ thống (UC-61 - Quyền Admin) */
  deleteComment: async (commentId: string): Promise<any> => {
    const res = await apiClient.delete<any>(`/community/api/admin/comments/${commentId}`);
    return res.data || res;
  },

  /** Lấy danh sách tất cả TechZones (UC-14, UC-69) */
  getTechZones: async (): Promise<TechZone[]> => {
    const res = await apiClient.get<any>('/community/api/TechZones');
    const raw = res.data || res;
    const items = Array.isArray(raw) ? raw : raw.items || [];
    return items.map((tz: any) => ({
      id: tz.id,
      name: tz.name,
      slug: tz.slug,
      description: tz.description || '',
      icon: tz.iconUrl || 'code',
      color: tz.colorCode || '#3178C6',
      postCount: tz.postsCount ?? 0,
      followerCount: tz.followersCount ?? 0,
    }));
  },

  /** Lấy thông tin chi tiết một TechZone theo Slug (UC-14) */
  getTechZoneBySlug: async (slug: string): Promise<TechZone> => {
    const res = await apiClient.get<any>(`/community/api/TechZones/${slug}`);
    const tz = res.data || res;
    return {
      id: tz.id,
      name: tz.name,
      slug: tz.slug,
      description: tz.description || '',
      icon: tz.iconUrl || 'code',
      color: tz.colorCode || '#3178C6',
      postCount: tz.postsCount ?? 0,
      followerCount: tz.followersCount ?? 0,
    };
  },

  /** Bảng xếp hạng lập trình viên uy tín (FR-29, UC-45, UC-46) */
  getLeaderboard: async (top = 10, period = 'all'): Promise<LeaderboardUser[]> => {
    const res = await apiClient.get<any>('/community/api/Leaderboard', { params: { top, period } });
    const raw = res.data || res;
    return Array.isArray(raw) ? raw : raw.items || [];
  },

  /** Lấy thông tin điểm uy tín, cấp bậc và điểm tín nhiệm TSS của bản thân (FR-REP-01) */
  getMyReputation: async (): Promise<UserReputation> => {
    const res = await apiClient.get<any>('/community/api/Reputation/me');
    return res.data || res;
  },

  /** Lấy thông tin điểm uy tín công khai của một người dùng */
  getUserReputation: async (userId: string): Promise<UserReputation> => {
    const res = await apiClient.get<any>(`/community/api/Reputation/user/${userId}`);
    return res.data || res;
  },

  /** Lấy lịch sử biến động điểm uy tín và TSS (Audit Log) */
  getMyReputationHistory: async (limit = 50): Promise<ReputationTransaction[]> => {
    const res = await apiClient.get<any>('/community/api/Reputation/history', { params: { limit } });
    const raw = res.data || res;
    return Array.isArray(raw) ? raw : raw.items || [];
  },

  /** Theo dõi hoặc hủy theo dõi tác giả (UC-30) */
  toggleFollowUser: async (targetUserId: string): Promise<any> => {
    const res = await apiClient.post<any>(`/community/api/Follows/${targetUserId}`);
    return res.data || res;
  },

  /** Lấy tổng quan trạng thái theo dõi tác giả (UC-30) */
  getUserFollowSummary: async (userId: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> => {
    const res = await apiClient.get<any>(`/community/api/Follows/${userId}/summary`);
    return res.data?.data || res.data || res;
  },
};

export default communityApi;
