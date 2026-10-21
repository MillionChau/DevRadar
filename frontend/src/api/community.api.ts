import { apiClient } from './client';
import { Post, Comment, TechZone } from '../types';

export interface GetPostsParams {
  pageNumber?: number;
  pageSize?: number;
  techZoneId?: string;
  authorId?: string;
  searchTerm?: string;
  tag?: string;
  sortBy?: 'latest' | 'trending' | 'top';
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
  /** Lấy danh sách bài viết trên Bảng tin (FR-10, UC-10) */
  getPosts: async (params?: GetPostsParams): Promise<{ items: Post[]; totalCount: number }> => {
    const res = await apiClient.get<any>('/community/api/Posts', { params: params as any });
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
          displayName: item.authorName || 'DevRadar Member',
          userName: item.authorUserName || 'developer',
          avatarUrl: item.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
          reputationPoints: 1200,
        },
        techZoneId: item.techZoneId,
        techZoneName: item.techZoneName || '.NET Core & C#',
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

    return {
      items,
      totalCount: paged.totalCount ?? items.length,
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
        avatarUrl: item.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
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
    const res = await apiClient.get<any>('/community/api/Comments', { params: { postId } });
    const raw = res.data || res;
    const items = Array.isArray(raw) ? raw : raw.items || [];
    return items;
  },

  /** Gửi bình luận mới hoặc trả lời (FR-25, UC-25) */
  createComment: async (payload: CreateCommentPayload): Promise<any> => {
    return apiClient.post('/community/api/Comments', payload);
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

  /** Bảng xếp hạng lập trình viên uy tín (FR-29, UC-45, UC-46) */
  getLeaderboard: async (top = 10, period = 'all'): Promise<any[]> => {
    const res = await apiClient.get<any>('/community/api/Leaderboard', { params: { top, period } });
    const raw = res.data || res;
    return Array.isArray(raw) ? raw : raw.items || [];
  },
};

export default communityApi;
