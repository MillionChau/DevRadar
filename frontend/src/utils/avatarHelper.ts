/**
 * Utility functions for generating dynamic, consistent avatars
 * based on user identity (name, username, or ID) instead of static mock photos.
 */

export const getDeterministicAvatar = (seed: string, role?: string): string => {
  const cleanSeed = (seed || 'developer').trim().toLowerCase();
  
  // Return Dicebear SVG avatar based on initials or bottts for unique identifiable avatars
  const style = role?.toLowerCase() === 'admin' ? 'bottts' : 'initials';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(cleanSeed)}&backgroundColor=0d1117,161b22,21262d&textColor=58a6ff,79c0ff,ffffff`;
};

export const getSafeAvatarUrl = (
  customAvatarUrl?: string | null,
  fallbackSeed?: string,
  role?: string
): string => {
  // If user has a real avatar URL (e.g. from MinIO, S3, or user-uploaded URL that is not the hardcoded unsplash photo-1535713875002)
  if (customAvatarUrl && customAvatarUrl.trim()) {
    const url = customAvatarUrl.trim();
    // If it's a real custom URL (MinIO, localhost, custom host, S3, data:, or Dicebear)
    // Strictly filter out any mock Unsplash placeholder photos
    if (!url.includes('images.unsplash.com') && !url.includes('unsplash.com')) {
      return url;
    }
  }

  // Generate dynamic unique avatar from username / displayName / seed
  return getDeterministicAvatar(fallbackSeed || 'user', role);
};
