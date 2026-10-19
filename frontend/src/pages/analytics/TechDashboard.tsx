import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';

interface HealthScoreData {
  name: string;
  category: string;
  score: number;
  tier: 'A+' | 'A' | 'B+' | 'B';
  popularity: string;
  trendDelta: string;
  direction: 'up' | 'down' | 'stable';
  prevScore: number;
}

export const TechDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');

  // Language & Framework Health Data (Per DESIGN_SYSTEM v2.0 & SCR-10 Wireframe)
  const healthData: HealthScoreData[] = [
    {
      name: '.NET 10 (C#)',
      category: 'Backend Ecosystem',
      score: 95,
      tier: 'A+',
      popularity: '94.2%',
      trendDelta: '+4.8%',
      direction: 'up',
      prevScore: 86
    },
    {
      name: 'Python (FastAPI)',
      category: 'AI & Data Services',
      score: 91,
      tier: 'A',
      popularity: '91.8%',
      trendDelta: '+3.2%',
      direction: 'up',
      prevScore: 80
    },
    {
      name: 'Rust (Systems)',
      category: 'High Performance',
      score: 93,
      tier: 'A+',
      popularity: '88.5%',
      trendDelta: '+5.1%',
      direction: 'up',
      prevScore: 84
    },
    {
      name: 'TypeScript (React 19)',
      category: 'Frontend Engineering',
      score: 86,
      tier: 'B+',
      popularity: '96.4%',
      trendDelta: '-1.2%',
      direction: 'down',
      prevScore: 89
    }
  ];

  const topRepos = [
    { name: 'dotnet/aspnetcore', stars: '34.5k', forks: '9.2k', health: '96/100', grade: 'A+' },
    { name: 'facebook/react', stars: '228k', forks: '45.1k', health: '95/100', grade: 'A+' },
    { name: 'microsoft/reverse-proxy', stars: '4.8k', forks: '520', health: '91/100', grade: 'A' },
    { name: 'mongodb/mongo-csharp-driver', stars: '2.4k', forks: '710', health: '88/100', grade: 'A' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header & Period Filter (Matches SCR-10 Wireframe) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            Tech Dashboard: Phân tích Xu hướng &amp; Sức khỏe Công nghệ (SCR-10)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Phân tích mức độ phổ biến, Health Score và xu hướng phát triển Language/Framework từ dữ liệu GitHub Crawler
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-surface-card border border-surface-border rounded-btn text-xs">
            {(['30d', '90d', '1y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  timeRange === r
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {r === '30d' ? '30 Ngày' : r === '90d' ? '6 Tháng' : '1 Năm'}
              </button>
            ))}
          </div>

          <Link to="/analytics/compare">
            <Button variant="outline" size="sm" icon="radar">
              So sánh đối đầu
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards: Language / Framework Health Score Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData.map((tech) => (
          <Card key={tech.name} variant="default" padding="md" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-muted">{tech.category}</span>
                <Badge variant={tech.tier === 'A+' ? 'success' : 'reputation'} size="sm">
                  {tech.tier}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-text-main mt-1">{tech.name}</h3>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border flex items-end justify-between">
              <div>
                <span className="text-[11px] text-text-subtle block">Health Score</span>
                <span className="text-2xl font-bold font-mono text-brand-secondary">{tech.score}</span>
                <span className="text-xs text-text-subtle font-mono"> / 100</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-text-subtle block">Popularity Trend</span>
                <span className={`text-xs font-mono font-bold ${tech.direction === 'up' ? 'text-status-success' : 'text-status-danger'}`}>
                  {tech.direction === 'up' ? '↗ ' : '↘ '}{tech.trendDelta}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Section: Line Chart (Popularity Trend & Health Score Over Time) + Right Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Line Chart (SVG Native per DESIGN_SYSTEM 6.2 & SCR-10 Wireframe) */}
        <Card variant="elevated" padding="lg" className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="border-b border-surface-border pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-main">
                Popularity Trend &amp; Health Score Over Time
              </h3>
              <span className="text-[11px] text-text-subtle">
                Biến động Health Score qua 6 tháng gần nhất (T5 - T10/2026) • Thang đo chuẩn 0 - 100
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-text-main">
                <span className="w-3 h-0.5 bg-brand-primary inline-block"></span> .NET 10
              </span>
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className="w-3 h-0.5 bg-gray-500 border-dashed inline-block"></span> FastAPI
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full py-4 overflow-x-auto">
            <svg viewBox="0 0 540 250" className="w-full min-w-[480px] h-56">
              {/* Grid Lines */}
              <line x1="35" y1="20" x2="520" y2="20" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              <text x="25" y="24" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">100</text>

              <line x1="35" y1="70" x2="520" y2="70" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              <text x="25" y="74" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">75</text>

              <line x1="35" y1="120" x2="520" y2="120" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              <text x="25" y="124" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">50</text>

              <line x1="35" y1="170" x2="520" y2="170" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              <text x="25" y="174" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">25</text>

              <line x1="35" y1="210" x2="520" y2="210" stroke="#111827" strokeWidth="1.5" />
              <text x="25" y="214" textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="monospace">0</text>

              {/* X Months */}
              {['T5', 'T6', 'T7', 'T8', 'T9', 'T10'].map((month, idx) => (
                <text key={month} x={50 + idx * 90} y="230" textAnchor="middle" fontSize="11" fontWeight={idx === 5 ? 'bold' : 'normal'} fill={idx === 5 ? '#111827' : '#6B7280'}>
                  {month}
                </text>
              ))}

              {/* Series 1: .NET 10 (86, 88, 91, 92, 94, 95) -> points: y = 210 - (val/100 * 190) */}
              <polyline
                points="50,47 140,43 230,37 320,35 410,31 500,29"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
              />
              {[
                { x: 50, y: 47 }, { x: 140, y: 43 }, { x: 230, y: 37 },
                { x: 320, y: 35 }, { x: 410, y: 31 }, { x: 500, y: 29 }
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r={i === 5 ? 5 : 4} fill="#111827" />
              ))}
              <text x="500" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111827" fontFamily="monospace">95</text>

              {/* Series 2: Python FastAPI (80, 83, 85, 88, 89, 91) */}
              <polyline
                points="50,58 140,52 230,48 320,43 410,41 500,37"
                fill="none"
                stroke="#6B7280"
                strokeWidth="2"
                strokeDasharray="4,3"
              />
              {[
                { x: 50, y: 58 }, { x: 140, y: 52 }, { x: 230, y: 48 },
                { x: 320, y: 43 }, { x: 410, y: 41 }, { x: 500, y: 37 }
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#6B7280" />
              ))}
              <text x="500" y="50" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#6B7280" fontFamily="monospace">91</text>
            </svg>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-surface-border text-center text-xs">
            <div>
              <span className="text-[10px] text-text-subtle block">Hệ sinh thái hàng đầu</span>
              <span className="font-bold font-mono text-brand-secondary">.NET 10 (95/100)</span>
            </div>
            <div>
              <span className="text-[10px] text-text-subtle block">Tăng trưởng cao nhất</span>
              <span className="font-bold font-mono text-status-success">Rust (+5.1%)</span>
            </div>
            <div>
              <span className="text-[10px] text-text-subtle block">Tổng mẫu giám sát</span>
              <span className="font-bold font-mono text-text-main">1,482 Repositories</span>
            </div>
          </div>
        </Card>

        {/* Right: Key Analytics Stats & Quick Links */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Tổng Repos giám sát</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">1,482</div>
              <span className="text-[11px] text-status-success mt-1 inline-flex items-center gap-1">
                +12% so với tháng trước
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Commit Frequency (TB)</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">42.8</div>
              <span className="text-[11px] text-brand-secondary mt-1 inline-flex items-center gap-1">
                Độ tích cực cao
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Điểm Sức khỏe TB</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">91.4</div>
              <span className="text-[11px] text-status-success mt-1 inline-flex items-center gap-1">
                Hạng A (Rất tốt)
              </span>
            </Card>

            <Card variant="default" padding="md">
              <span className="text-xs text-text-muted">Crawler Jobs đã chạy</span>
              <div className="text-2xl font-bold font-mono text-text-main mt-1">8,920</div>
              <span className="text-[11px] text-text-subtle mt-1 inline-flex items-center gap-1">
                Daemon :8000 Online
              </span>
            </Card>
          </div>

          <Card variant="default" padding="md" className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-text-main border-b border-surface-border pb-2">
              TRUY XUẤT NHANH PHÂN TÍCH CHUYÊN SÂU
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/analytics/repo-health" className="flex items-center justify-between p-2.5 rounded-btn bg-surface-elevated hover:bg-surface-border transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <AppIcon name="radar" size={16} />
                  <span className="font-semibold text-text-main">Tra cứu sức khỏe Repository (SCR-11)</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>

              <Link to="/analytics/compare" className="flex items-center justify-between p-2.5 rounded-btn bg-surface-elevated hover:bg-surface-border transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <AppIcon name="layers" size={16} />
                  <span className="font-semibold text-text-main">So sánh đối đầu Dual Radar (SCR-12)</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>

              <Link to="/analytics/reports" className="flex items-center justify-between p-2.5 rounded-btn bg-surface-elevated hover:bg-surface-border transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <AppIcon name="fileText" size={16} />
                  <span className="font-semibold text-text-main">Báo cáo phân tích Whitepaper (SCR-13)</span>
                </div>
                <AppIcon name="arrowRight" size={14} />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Top Tracked Repos Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="p-4 bg-surface-elevated/40 border-b border-surface-border font-bold text-xs text-text-muted uppercase tracking-wider flex items-center justify-between">
          <span>DANH SÁCH REPOSITORY NỔI BẬT THEO DÕI</span>
          <Link to="/analytics/repo-health" className="text-brand-secondary hover:underline normal-case text-xs">
            Xem tất cả →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/20 text-text-subtle border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Stars</th>
                <th className="py-3 px-4">Forks</th>
                <th className="py-3 px-4">Điểm Sức khỏe</th>
                <th className="py-3 px-4">Đánh giá</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {topRepos.map((r) => (
                <tr key={r.name} className="hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-text-main">
                    {r.name}
                  </td>
                  <td className="py-3.5 px-4 text-text-muted">★ {r.stars}</td>
                  <td className="py-3.5 px-4 text-text-muted">⑂ {r.forks}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-secondary">
                    {r.health}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="success" size="sm">{r.grade}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link to="/analytics/repo-health">
                      <Button variant="ghost" size="sm">Chi tiết</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TechDashboard;
