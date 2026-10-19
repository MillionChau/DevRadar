// User & Authentication (IdentityService)
export type UserRole = 'Guest' | 'Member' | 'Moderator' | 'Admin';

export interface User {
  id: string;
  userName?: string;
  username?: string;
  email: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  headline?: string;
  role: UserRole;
  reputationPoints?: number;
  reputationScore?: number;
  githubProfileUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// Community & Post (CommunityService)
export interface TechZone {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  iconName?: string;
  color?: string;
  postCount: number;
  followerCount: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  title: string;
  summary?: string;
  contentSnippet?: string;
  content?: string;
  authorId?: string;
  author: {
    id?: string;
    displayName?: string;
    fullName?: string;
    userName?: string;
    username?: string;
    avatarUrl?: string;
    reputationPoints?: number;
    reputationScore?: number;
    role?: string;
    headline?: string;
  };
  techZoneId?: string;
  techZoneName?: string;
  techZone?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  tags: string[];
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  viewCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  status?: 'Published' | 'PendingReview' | 'Draft' | 'Hidden';
  toxicityScore?: number;
  qualityScore?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId?: string;
  author: {
    id?: string;
    displayName?: string;
    fullName?: string;
    userName?: string;
    username?: string;
    avatarUrl?: string;
    reputationScore?: number;
    role?: string;
  };
  content: string;
  parentId?: string;
  replies?: Comment[];
  likeCount: number;
  isLiked?: boolean;
  toxicityScore?: number;
  createdAt: string;
}

// Radar & Analytics (CrawlerGithubService & QualityService)
export interface RadarMetrics {
  codeQuality: number;      // 0 - 100
  activityFrequency: number;// 0 - 100
  communityContribution: number; // 0 - 100
  projectReputation: number; // 0 - 100
  techStackDepth: number;   // 0 - 100
}

export interface RepoHealth {
  owner: string;
  repo: string;
  stars: number;
  forks: number;
  openIssues: number;
  overallScore: number;     // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  metrics: RadarMetrics;
  commitFrequencyWeekly: number[];
  standards: {
    hasReadme: boolean;
    hasLicense: boolean;
    hasCiCd: boolean;
    hasContributing: boolean;
  };
  lastCrawledAt: string;
}

// Notifications (NotificationService)
export type NotificationType =
  | 'Like'
  | 'Comment'
  | 'CrawlerComplete'
  | 'ModerationAlert'
  | 'like'
  | 'comment'
  | 'mention'
  | 'system'
  | 'report_resolved';

export interface NotificationItem {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read?: boolean;
  isRead?: boolean;
  link?: string;
  targetUrl?: string;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    avatarUrl: string;
  };
}

// Admin Moderation (QualityService / CommunityService)
export interface ModerationReport {
  id: string;
  targetId: string;
  targetType: 'Post' | 'Comment' | 'post' | 'comment' | 'user';
  authorName?: string;
  reporterName?: string;
  reporter?: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  reportedUser?: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  snippet?: string;
  reason: string;
  toxicityScore?: number;
  aiConfidence?: number; // 0.0 - 1.0
  status: 'Pending' | 'Approved' | 'Dismissed' | 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface CrawlerJob {
  id: string;
  targetRepo: string;
  status: 'Running' | 'Completed' | 'Failed' | 'running' | 'completed' | 'failed';
  durationMs?: number;
  itemsCrawled: number;
  errorsCount?: number;
  triggeredBy?: string;
  startedAt: string;
  completedAt?: string;
}
