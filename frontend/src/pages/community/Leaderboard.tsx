import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';

import { communityApi } from '../../api';

interface LeaderboardUser {
  rank: number;
  displayName: string;
  userName: string;
  avatarUrl: string;
  reputationPoints: number;
  postsCount: number;
  starsCount: number;
  topBadge: string;
}

export const Leaderboard: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('monthly');
  const [rankings, setRankings] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    communityApi
      .getLeaderboard(10, period)
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const mapped: LeaderboardUser[] = data.map((u, idx) => ({
            rank: u.rank ?? (idx + 1),
            displayName: u.displayName || u.fullName || u.username || u.userName || 'Lập trình viên DevRadar',
            userName: u.username || u.userName || 'developer',
            avatarUrl: u.avatarUrl || `https://images.unsplash.com/photo-${1534528741775 + idx}?w=100&h=100&fit=crop&crop=faces`,
            reputationPoints: u.score ?? u.reputationScore ?? 0,
            postsCount: u.postCount ?? u.postsCount ?? 0,
            starsCount: u.likeCount ?? u.likesCount ?? 0,
            topBadge: Array.isArray(u.badges) && u.badges.length > 0 ? u.badges[0] : (u.badge || 'Top Contributor'),
          }));
          setRankings(mapped);
        }
      })
      .catch((err) => {
        console.error('Could not load live leaderboard:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [period]);

  const topPodium = rankings.slice(0, 3);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            BẢNG XẾP HẠNG DEVELOPERS (LEADERBOARD)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Vinh danh các lập trình viên có đóng góp xuất sắc và điểm uy tín năng lực cao nhất
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface-card border border-surface-border rounded-btn">
          {(['weekly', 'monthly', 'allTime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                period === p
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {p === 'weekly' ? 'Tuần này' : p === 'monthly' ? 'Tháng này' : 'Mọi thời đại'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Empty State Guard */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-muted">Đang tải bảng xếp hạng lập trình viên từ Community DB...</span>
        </div>
      ) : rankings.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 border border-dashed border-surface-border rounded-xl">
          <AppIcon name="award" size={32} className="text-text-subtle" />
          <span className="text-sm font-semibold text-text-main">Chưa có dữ liệu bảng xếp hạng</span>
          <span className="text-xs text-text-muted">Dữ liệu sẽ được cập nhật tự động khi các thành viên tương tác và đăng bài.</span>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {topPodium.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Top 2 */}
              <Card variant="elevated" padding="md" className="flex flex-col items-center text-center gap-3 order-2 md:order-1 border-surface-border mt-4">
                <span className="text-xs font-mono font-bold text-text-muted bg-surface-elevated px-2.5 py-1 rounded-full">
                  TOP 2
                </span>
                <img
                  src={topPodium[1].avatarUrl}
                  alt={topPodium[1].displayName}
                  className="w-16 h-16 rounded-full border-2 border-slate-400 object-cover"
                />
                <h3 className="text-sm font-bold text-text-main">{topPodium[1].displayName}</h3>
                <Badge variant="reputation">⚡ {topPodium[1].reputationPoints} Rep</Badge>
                <span className="text-xs text-text-subtle">{topPodium[1].topBadge}</span>
              </Card>

              {/* Top 1 Podium Champion */}
              <Card variant="elevated" padding="md" className="flex flex-col items-center text-center gap-3 order-1 md:order-2 border-brand-primary/60 bg-gradient-to-b from-brand-primary/10 to-surface-card shadow-xl -mt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                  <AppIcon name="award" size={14} />
                  <span>QUÁN QUÂN TOP 1</span>
                </div>
                <img
                  src={topPodium[0].avatarUrl}
                  alt={topPodium[0].displayName}
                  className="w-20 h-20 rounded-full border-3 border-amber-400 object-cover shadow-lg"
                />
                <h3 className="text-base font-bold text-text-main">{topPodium[0].displayName}</h3>
                <Badge variant="reputation" className="text-sm py-1 px-3">
                  ⚡ {topPodium[0].reputationPoints} Rep
                </Badge>
                <span className="text-xs text-brand-secondary font-semibold">{topPodium[0].topBadge}</span>
              </Card>

              {/* Top 3 */}
              <Card variant="elevated" padding="md" className="flex flex-col items-center text-center gap-3 order-3 border-surface-border mt-6">
                <span className="text-xs font-mono font-bold text-text-muted bg-surface-elevated px-2.5 py-1 rounded-full">
                  TOP 3
                </span>
                <img
                  src={topPodium[2].avatarUrl}
                  alt={topPodium[2].displayName}
                  className="w-16 h-16 rounded-full border-2 border-amber-700/60 object-cover"
                />
                <h3 className="text-sm font-bold text-text-main">{topPodium[2].displayName}</h3>
                <Badge variant="reputation">⚡ {topPodium[2].reputationPoints} Rep</Badge>
                <span className="text-xs text-text-subtle">{topPodium[2].topBadge}</span>
              </Card>
            </div>
          )}

      {/* Rankings Full Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="p-4 bg-surface-elevated/40 border-b border-surface-border font-bold text-xs text-text-muted uppercase tracking-wider">
          Bảng xếp hạng đầy đủ
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/20 text-text-subtle border-b border-surface-border">
              <tr>
                <th className="py-3 px-4 w-16">Hạng</th>
                <th className="py-3 px-4">Lập trình viên</th>
                <th className="py-3 px-4">Điểm Uy tín</th>
                <th className="py-3 px-4">Bài viết</th>
                <th className="py-3 px-4">Lượt Star</th>
                <th className="py-3 px-4">Huy hiệu năng lực</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {rankings.map((u) => (
                <tr key={u.rank} className="hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-text-main">
                    #{u.rank}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatarUrl} alt={u.displayName} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="font-bold text-text-main">{u.displayName}</div>
                        <span className="text-[11px] text-text-subtle font-mono">@{u.userName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-brand-secondary">
                    ⚡ {u.reputationPoints.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-text-muted">{u.postsCount} bài</td>
                  <td className="py-3.5 px-4 text-text-muted">★ {u.starsCount}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant="tech" size="sm">{u.topBadge}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
