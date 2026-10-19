import React from 'react';
import { RadarMetrics } from '../../types';

export interface RadarChartProps {
  metrics: RadarMetrics;
  compareMetrics?: RadarMetrics;
  size?: number;
  labelA?: string;
  labelB?: string;
  showLabels?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  metrics,
  compareMetrics,
  size = 320,
  labelA = 'Công nghệ A',
  labelB = 'Công nghệ B',
  showLabels = true,
}) => {
  const center = size / 2;
  const radius = size * 0.38;

  const axes = [
    { key: 'codeQuality' as const, label: 'Code Quality' },
    { key: 'activityFrequency' as const, label: 'Activity' },
    { key: 'communityContribution' as const, label: 'Community' },
    { key: 'projectReputation' as const, label: 'Reputation' },
    { key: 'techStackDepth' as const, label: 'Tech Stack' },
  ];

  const getCoordinates = (value: number, index: number, maxRadius: number) => {
    // 5 axes: angles: -90deg, -18deg, 54deg, 126deg, 198deg
    const angle = (Math.PI * 2 / 5) * index - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate pentagon rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  const ringPoints = rings.map((ratio) => {
    return axes
      .map((_, i) => {
        const { x, y } = getCoordinates(100, i, radius * ratio);
        return `${x},${y}`;
      })
      .join(' ');
  });

  // Primary data polygon
  const primaryPoints = axes
    .map((axis, i) => {
      const val = metrics[axis.key] || 0;
      const { x, y } = getCoordinates(val, i, radius);
      return `${x},${y}`;
    })
    .join(' ');

  // Secondary compare data polygon
  const comparePoints = compareMetrics
    ? axes
        .map((axis, i) => {
          const val = compareMetrics[axis.key] || 0;
          const { x, y } = getCoordinates(val, i, radius);
          return `${x},${y}`;
        })
        .join(' ')
    : null;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
        {/* Pentagon Grid Rings */}
        {ringPoints.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke="#334155"
            strokeWidth={idx === rings.length - 1 ? '1.5' : '1'}
            strokeDasharray={idx < rings.length - 1 ? '2 2' : undefined}
          />
        ))}

        {/* 5 Spoke Lines */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(100, i, radius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#334155"
              strokeWidth="1"
            />
          );
        })}

        {/* Compare Polygon (if provided) */}
        {comparePoints && (
          <polygon
            points={comparePoints}
            fill="rgba(129, 140, 248, 0.25)"
            stroke="#818CF8"
            strokeWidth="2"
          />
        )}

        {/* Primary Polygon */}
        <polygon
          points={primaryPoints}
          fill="rgba(37, 99, 235, 0.35)"
          stroke="#38BDF8"
          strokeWidth="2.5"
        />

        {/* Data Vertices Dots */}
        {axes.map((axis, i) => {
          const val = metrics[axis.key] || 0;
          const { x, y } = getCoordinates(val, i, radius);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#38BDF8"
              stroke="#0F172A"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels around perimeter */}
        {showLabels &&
          axes.map((axis, i) => {
            const val = metrics[axis.key];
            const { x, y } = getCoordinates(115, i, radius);
            const anchor = x < center - 10 ? 'end' : x > center + 10 ? 'start' : 'middle';
            return (
              <text
                key={i}
                x={x}
                y={y + 4}
                textAnchor={anchor}
                className="text-[11px] font-semibold fill-text-main font-mono"
              >
                {axis.label} ({val})
              </text>
            );
          })}
      </svg>

      {/* Legend if comparing */}
      {compareMetrics && (
        <div className="flex items-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-secondary border border-brand-primary" />
            <span className="text-text-muted">{labelA}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-accent border border-brand-accent" />
            <span className="text-text-muted">{labelB}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadarChart;
