import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GazeDot } from '../../components/GazeDot';
import type { GazePoint } from '../../hooks/useWebGazer';

interface SaccadicGameProps {
  gazeRef: React.MutableRefObject<GazePoint | null>;
  durationSec: number;
  onComplete: (avgLatencyMs: number) => void;
}

const GRID_SIZE = 3;

function randomCell(exclude: number): number {
  let next: number;
  do { next = Math.floor(Math.random() * 9); } while (next === exclude);
  return next;
}

export default function SaccadicGame({ gazeRef, durationSec, onComplete }: SaccadicGameProps) {
  const [targetCell, setTargetCell] = useState(() => randomCell(-1));
  const [reactionLog, setReactionLog] = useState<number[]>([]);
  const [hitFlash, setHitFlash] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [hits, setHits] = useState(0);

  const targetAppearedAt = useRef<number>(Date.now());
  const currentTarget = useRef(targetCell);
  const hasHit = useRef(false);
  const completedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const finishGame = useCallback((log: number[]) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const avg = log.length > 0
      ? Math.round(log.reduce((a, b) => a + b, 0) / log.length)
      : 380;
    onComplete(avg);
  }, [onComplete]);

  // Timer countdown
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Trigger complete when time hits 0
  useEffect(() => {
    if (timeLeft === 0) finishGame(reactionLog);
  }, [timeLeft, finishGame, reactionLog]);

  // Rotate target every 2-3 seconds
  useEffect(() => {
    const interval = Math.floor(Math.random() * 1000) + 2000;
    const id = setTimeout(() => {
      hasHit.current = false;
      const next = randomCell(currentTarget.current);
      setTargetCell(next);
      currentTarget.current = next;
      targetAppearedAt.current = Date.now();
    }, interval);
    return () => clearTimeout(id);
  }, [targetCell]);

  // Gaze detection via polling (prevents React 60fps re-renders)
  useEffect(() => {
    let rafId: number;

    const checkHit = () => {
      const gaze = gazeRef.current;
      if (!gaze || hasHit.current || completedRef.current) {
        rafId = requestAnimationFrame(checkHit);
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        rafId = requestAnimationFrame(checkHit);
        return;
      }

      const relX = gaze.x - rect.left;
      const relY = gaze.y - rect.top;
      const col = Math.floor((relX / rect.width) * GRID_SIZE);
      const row = Math.floor((relY / rect.height) * GRID_SIZE);
      const cell = row * GRID_SIZE + col;

      if (cell === currentTarget.current) {
        const latency = Date.now() - targetAppearedAt.current;
        hasHit.current = true;
        setReactionLog(prev => [...prev, latency]);
        setHits(h => h + 1);
        setHitFlash(true);
        setTimeout(() => setHitFlash(false), 300);
      }

      rafId = requestAnimationFrame(checkHit);
    };

    rafId = requestAnimationFrame(checkHit);
    return () => cancelAnimationFrame(rafId);
  }, [gazeRef]);

  const avgLatency = reactionLog.length > 0
    ? Math.round(reactionLog.reduce((a, b) => a + b, 0) / reactionLog.length)
    : null;

  return (
    <div
      ref={containerRef}
      className="touch-lock"
      style={{ width: '100%', height: '100%', position: 'relative', padding: '1.5rem' }}
    >
      {/* Live stats bar */}
      <div style={{
        position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '1.5rem', alignItems: 'center',
        background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)',
        borderRadius: 999, padding: '.4rem 1.25rem',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        zIndex: 10,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIME</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: timeLeft <= 5 ? '#EF4444' : 'var(--blue-600)' }}>{timeLeft}s</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>HITS</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{hits}</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVG LATENCY</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {avgLatency !== null ? `${avgLatency} ms` : '—'}
          </div>
        </div>
      </div>

      {/* 3×3 Grid */}
      <div style={{
        width: '100%', height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: '1rem',
        paddingTop: '3.5rem',
      }}>
        {Array.from({ length: 9 }, (_, i) => {
          const isTarget = i === targetCell;
          return (
            <div
              key={i}
              style={{
                borderRadius: '1.25rem',
                border: `2px solid ${isTarget ? '#2563EB' : 'var(--border)'}`,
                background: isTarget
                  ? hitFlash ? '#DBEAFE' : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)'
                  : 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                transition: 'background .15s, border-color .15s',
                boxShadow: isTarget ? 'var(--shadow-blue)' : 'var(--shadow-sm)',
              }}
            >
              {isTarget && (
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#2563EB',
                  animation: 'target-pulse 1.2s ease-in-out infinite',
                  boxShadow: '0 0 0 0 rgba(37,99,235,.4)',
                }} />
              )}
              <span style={{
                position: 'absolute', bottom: 8, right: 12,
                fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600,
              }}>
                {['A1','B1','C1','A2','B2','C2','A3','B3','C3'][i]}
              </span>
            </div>
          );
        })}
      </div>

      <GazeDot />
    </div>
  );
}
