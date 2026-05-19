import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GazeDot } from '../../components/GazeDot';
import type { GazePoint } from '../../hooks/useWebGazer';

interface PursuitGameProps {
  gazeRef: React.MutableRefObject<GazePoint | null>;
  durationSec: number;
  onComplete: (accuracyPct: number) => void;
}

const SPEED = 0.6; // radians per second
const HITBOX_RATIO = 0.20; // 20% of screen height

export default function PursuitGame({ gazeRef, durationSec, onComplete }: PursuitGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Stats
  const totalSamplesRef = useRef(0);
  const inHitboxRef = useRef(0);
  const [accuracy, setAccuracy] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const timeLeftRef = useRef(durationSec);



  const finishGame = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const pct = totalSamplesRef.current > 0
      ? Math.round((inHitboxRef.current / totalSamplesRef.current) * 100)
      : 72;
    onComplete(pct);
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Countdown timer
    const countdownId = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(countdownId);
        finishGame();
      }
    }, 1000);

    function draw(ts: number) {
      if (completedRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      const dt = lastTimeRef.current !== null ? (ts - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = ts;
      tRef.current += dt * SPEED;

      const t = tRef.current;
      const cx = W / 2;
      const cy = H / 2;
      const A = W * 0.32;
      const B = H * 0.26;

      // Lemniscate / figure-8
      const tx = cx + A * Math.sin(t);
      const ty = cy + (B / 2) * Math.sin(2 * t);

      const hitboxR = H * HITBOX_RATIO;

      // ── Clear ──
      ctx.clearRect(0, 0, W, H);

      // ── Figure-8 path (ghost trail) ──
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const a = (i / 200) * Math.PI * 2;
        const px = cx + A * Math.sin(a);
        const py = cy + (B / 2) * Math.sin(2 * a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(37,99,235,.10)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── Hitbox circle (subtle) ──
      ctx.beginPath();
      ctx.arc(tx, ty, hitboxR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(37,99,235,.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Target ──
      // Outer glow
      const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 28);
      grad.addColorStop(0, 'rgba(37,99,235,.3)');
      grad.addColorStop(1, 'rgba(37,99,235,0)');
      ctx.beginPath();
      ctx.arc(tx, ty, 28, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Target dot
      ctx.beginPath();
      ctx.arc(tx, ty, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#2563EB';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(tx, ty, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // ── Gaze hit detection ──
      const gaze = gazeRef.current;
      if (gaze) {
        totalSamplesRef.current++;
        const dx = gaze.x - (canvas.getBoundingClientRect().left + tx);
        const dy = gaze.y - (canvas.getBoundingClientRect().top + ty);
        if (Math.sqrt(dx * dx + dy * dy) < hitboxR) {
          inHitboxRef.current++;
          // Green ring when in hitbox
          ctx.beginPath();
          ctx.arc(tx, ty, 22, 0, Math.PI * 2);
          ctx.strokeStyle = '#14B8A6';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      // Update accuracy display (throttled)
      if (totalSamplesRef.current > 0) {
        const pct = Math.round((inHitboxRef.current / totalSamplesRef.current) * 100);
        // Only update React state if it changes significantly or every second to avoid re-renders
        setAccuracy(prev => (Math.abs(prev - pct) >= 1 ? pct : prev));
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(countdownId);
      window.removeEventListener('resize', resize);
    };
  }, [finishGame]);

  return (
    <div className="touch-lock" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Stats bar */}
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
          <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>GAZE ACCURACY</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#14B8A6' }}>{accuracy}%</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>PATTERN</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>∞</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      <GazeDot />
    </div>
  );
}
