import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import RadarChart from '../../components/common/RadarChart';
import { RadarMetrics } from '../../types';

export const TechCompare: React.FC = () => {
  const [techA, setTechA] = useState('dotnet');
  const [techB, setTechB] = useState('nodejs');

  const metricsA: RadarMetrics = {
    codeQuality: 92,
    activityFrequency: 88,
    communityContribution: 82,
    projectReputation: 94,
    techStackDepth: 95,
  };

  const metricsB: RadarMetrics = {
    codeQuality: 84,
    activityFrequency: 92,
    communityContribution: 90,
    projectReputation: 88,
    techStackDepth: 86,
  };

  const comparisonRows = [
    { metric: 'Điểm Sức khỏe Tổng thể (Health Score)', a: '94/100 (Hạng A+)', b: '88/100 (Hạng A)', winner: 'A' },
    { metric: 'Chất lượng Mã nguồn (Code Quality)', a: '92/100', b: '84/100', winner: 'A' },
    { metric: 'Tần suất Hoạt động (Activity)', a: '88/100', b: '92/100', winner: 'B' },
    { metric: 'Đóng góp Cộng đồng (Community)', a: '82/100', b: '90/100', winner: 'B' },
    { metric: 'Độ uy tín Dự án (Reputation)', a: '94/100', b: '88/100', winner: 'A' },
    { metric: 'Chiều sâu Kỹ thuật (Stack Depth)', a: '95/100', b: '86/100', winner: 'A' },
    { metric: 'Hệ sinh thái Microservices', a: 'YARP + ASP.NET Core', b: 'Express + Fastify', winner: 'A' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            SO SÁNH CÔNG NGHỆ ĐỐI ĐẦU DUAL RADAR (SCR-12)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            So sánh đối đầu trực diện 2 hệ sinh thái công nghệ qua biểu đồ ngũ giác và ma trận chỉ số
          </p>
        </div>

        {/* Selectors */}
        <div className="flex items-center gap-3">
          <select
            value={techA}
            onChange={(e) => setTechA(e.target.value)}
            className="bg-surface-elevated border border-surface-border text-brand-secondary text-xs rounded-btn px-3 h-9 font-semibold focus:outline-none"
          >
            <option value="dotnet">.NET Core / C#</option>
            <option value="react">React</option>
            <option value="python">Python FastAPI</option>
          </select>

          <span className="text-xs font-mono font-bold text-text-subtle">VS</span>

          <select
            value={techB}
            onChange={(e) => setTechB(e.target.value)}
            className="bg-surface-elevated border border-surface-border text-brand-accent text-xs rounded-btn px-3 h-9 font-semibold focus:outline-none"
          >
            <option value="nodejs">Node.js / Express</option>
            <option value="golang">Go / Gin</option>
            <option value="vue">Vue.js</option>
          </select>
        </div>
      </div>

      {/* Main Dual Radar View */}
      <Card variant="elevated" padding="lg" className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-base font-bold text-text-main">
            BIỂU ĐỒ DUAL RADAR LỒNG NHAU (.NET Core vs Node.js)
          </h2>
          <span className="text-xs text-text-subtle">
            Đường xanh dương: .NET Core • Đường tím: Node.js
          </span>
        </div>

        <RadarChart
          metrics={metricsA}
          compareMetrics={metricsB}
          labelA=".NET Core"
          labelB="Node.js"
          size={340}
        />
      </Card>

      {/* Comparison Matrix Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="p-4 bg-surface-elevated/40 border-b border-surface-border font-bold text-xs text-text-muted uppercase tracking-wider">
          MA TRẬN ĐỐI SOÁT CHỈ SỐ KỸ THUẬT
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-elevated/20 text-text-subtle border-b border-surface-border">
            <tr>
              <th className="py-3 px-4">Tiêu chí so sánh</th>
              <th className="py-3 px-4 text-brand-secondary font-bold">.NET Core (Tech A)</th>
              <th className="py-3 px-4 text-brand-accent font-bold">Node.js (Tech B)</th>
              <th className="py-3 px-4 text-right">Lợi thế</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {comparisonRows.map((row) => (
              <tr key={row.metric} className="hover:bg-surface-elevated/30 transition-colors">
                <td className="py-3.5 px-4 font-medium text-text-main">{row.metric}</td>
                <td className="py-3.5 px-4 font-mono text-text-main">{row.a}</td>
                <td className="py-3.5 px-4 font-mono text-text-main">{row.b}</td>
                <td className="py-3.5 px-4 text-right">
                  <Badge variant={row.winner === 'A' ? 'tech' : 'reputation'} size="sm">
                    {row.winner === 'A' ? '✓ .NET Core' : '✓ Node.js'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default TechCompare;
