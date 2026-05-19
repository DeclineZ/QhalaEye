import React, { useEffect, useRef, useState } from 'react';

interface GameTimerProps {
  durationSec: number;
  onComplete: () => void;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const GameTimer: React.FC<GameTimerProps> = ({
  durationSec,
  onComplete,
  size = 72,
  strokeWidth = 6,
  color = '#2563EB',
}) => {
  const [remaining, setRemaining] = useState(durationSec);
  const completedRef = useRef(false);

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - remaining / durationSec);

  useEffect(() => {
    if (completedRef.current) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!completedRef.current) {
            completedRef.current = true;
            setTimeout(onComplete, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [durationSec, onComplete]);

  const isLow = remaining <= 10;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={isLow ? '#EF4444' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size < 60 ? '.75rem' : '.95rem',
        fontWeight: 700,
        color: isLow ? '#EF4444' : 'var(--text-primary)',
      }}>
        {remaining}s
      </div>
    </div>
  );
};
