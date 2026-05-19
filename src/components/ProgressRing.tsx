import React from 'react';

interface ProgressRingProps {
  label: string;
  sublabel?: string;
  value: number;       // 0–100
  size?: number;       // px, default 140
  stroke?: number;     // stroke width, default 10
  color?: string;      // hex or CSS var
  trailColor?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  label,
  sublabel,
  value,
  size = 140,
  stroke = 10,
  color = '#2563EB',
  trailColor = '#E2E8F0',
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(value, 0), 100) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Trail */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trailColor}
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        {/* Center value */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: color, lineHeight: 1 }}>
            {Math.round(value)}%
          </span>
          {sublabel && (
            <span style={{ fontSize: '.65rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <p style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '.02em' }}>
        {label}
      </p>
    </div>
  );
};
