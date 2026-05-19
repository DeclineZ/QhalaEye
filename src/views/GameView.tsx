import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useWebGazer } from '../hooks/useWebGazer';
import SaccadicGame from './games/SaccadicGame';
import PursuitGame from './games/PursuitGame';
import ConvergenceGame from './games/ConvergenceGame';

const GAME_META = [
  { id: 0, name: 'Saccadic Therapy',  icon: '⚡', subtitle: 'Agility Training',   color: '#2563EB', bg: '#EFF6FF' },
  { id: 1, name: 'Smooth Pursuit',    icon: '∞',  subtitle: 'Endurance Training', color: '#14B8A6', bg: '#F0FDFA' },
  { id: 2, name: 'Convergence',       icon: '◎',  subtitle: 'Strength Training',  color: '#7C3AED', bg: '#F5F3FF' },
];

const NORMAL_DURATIONS  = [300, 300, 300]; // 5 minutes each
const DEMO_DURATIONS    = [10, 10, 30];   // 30s for convergence demo

export default function GameView() {
  const { currentGame, setCurrentGame, demoMode, isSingleGameMode, updateMetric, setView } = useSessionStore();
  const { gazeRef, startGazer, pauseGazer, endGazer, setLearning, isActive } = useWebGazer();

  const [transitioning, setTransitioning] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const gazerStartedRef = useRef(false);

  const durations = demoMode ? DEMO_DURATIONS : NORMAL_DURATIONS;
  const meta = GAME_META[currentGame];

  // ── Lifecycle: start/stop WebGazer based on current game ────────────────
  // Games 0 & 1 → WebGazer ON
  // Game 2 (Convergence) → WebGazer MUST be ended (MediaPipe takes camera)
  useEffect(() => {
    if (currentGame < 2) {
      // Start or resume WebGazer for gaze-tracking games
      startGazer()
        .then(() => setLearning(false))
        .catch(console.error);
      gazerStartedRef.current = true;
    } else {
      // ── CPU ISOLATION: hard-end WebGazer before mounting MediaPipe ──────
      if (gazerStartedRef.current) {
        endGazer();
        gazerStartedRef.current = false;
      }
    }

    return () => {
      // On unmount of WebGazer games, pause (not end) to preserve calibration
      if (currentGame < 2 && isActive) {
        pauseGazer();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame]);
  
  /* ── MANUAL RE-SYNC: Learn from clicks during game (but not moves) ──── */
  useEffect(() => {
    if (currentGame < 2 && isActive) {
      const handleGlobalClick = (e: MouseEvent) => {
        if (window.webgazer) {
          // Tell WebGazer: "I am definitely looking at this click point"
          window.webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');
        }
      };
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [currentGame, isActive]);

  // Dismiss intro after short delay
  useEffect(() => {
    setShowIntro(true);
    const id = setTimeout(() => setShowIntro(false), 2200);
    return () => clearTimeout(id);
  }, [currentGame]);

  const advanceGame = useCallback((nextGame: number) => {
    setTransitioning(true);
    setTimeout(() => {
      if (isSingleGameMode) {
        endGazer();
        setView('dashboard');
      } else if (nextGame >= GAME_META.length) {
        endGazer();
        setView('clinical');
      } else {
        setCurrentGame(nextGame);
        setTransitioning(false);
      }
    }, 500);
  }, [setCurrentGame, setView, isSingleGameMode, endGazer]);

  const handleSaccadicComplete = useCallback((latencyMs: number) => {
    updateMetric('saccadicLatency', latencyMs);
    advanceGame(1);
  }, [updateMetric, advanceGame]);

  const handlePursuitComplete = useCallback((accuracy: number) => {
    updateMetric('gazeAccuracy', accuracy);
    advanceGame(2);
  }, [updateMetric, advanceGame]);

  const handleConvergenceComplete = useCallback((ipdPx: number) => {
    updateMetric('convergenceBreakPoint', ipdPx);
    advanceGame(3);
  }, [updateMetric, advanceGame]);

  return (
    <div
      className="touch-lock"
      style={{
        width: '100vw', height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-base)',
        opacity: transitioning ? 0 : 1,
        transition: 'opacity .5s ease',
      }}
    >
      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <div style={{
        height: 60, flexShrink: 0,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 1.5rem', gap: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Back to dashboard */}
        <button
          className="btn-ghost"
          style={{ padding: '.4rem .75rem', fontSize: '.78rem' }}
          onClick={() => { endGazer(); setView('dashboard'); }}
        >
          ← Exit
        </button>

        {/* Game name + icon */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.6rem',
          background: meta.bg, borderRadius: '999px',
          padding: '.3rem 1rem .3rem .4rem',
          border: `1px solid ${meta.color}25`,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: meta.color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.9rem', fontWeight: 700,
          }}>{meta.icon}</div>
          <div>
            <div style={{ fontSize: '.8rem', fontWeight: 700, color: meta.color, lineHeight: 1 }}>{meta.name}</div>
            <div style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{meta.subtitle}</div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginLeft: 'auto' }}>
          {GAME_META.map((g, i) => (
            <React.Fragment key={g.id}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.3rem',
              }}>
                <div style={{
                  width: i === currentGame ? 28 : 10,
                  height: 10, borderRadius: 999,
                  background: i < currentGame ? '#059669' : i === currentGame ? g.color : '#E2E8F0',
                  transition: 'all .3s ease',
                }} />
                <span style={{
                  fontSize: '.65rem', fontWeight: 600,
                  color: i <= currentGame ? 'var(--text-secondary)' : 'var(--text-muted)',
                  opacity: i === currentGame ? 1 : .6,
                }}>{g.name.split(' ')[0]}</span>
              </div>
              {i < 2 && <div style={{ width: 16, height: 1, background: '#E2E8F0' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Demo badge */}
        {demoMode && (
          <span className="badge badge-blue" style={{ fontSize: '.65rem' }}>⚡ DEMO 10s</span>
        )}
      </div>

      {/* ── Game Area ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Game intro overlay */}
        {showIntro && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 50,
            animation: 'fadeIn .3s ease',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '1.5rem',
              background: `linear-gradient(135deg, ${meta.color}20, ${meta.color}40)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem', fontSize: '2.5rem',
            }}>{meta.icon}</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: meta.color }}>{meta.name}</h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '.4rem' }}>{meta.subtitle}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              {[0.8, 1, 0.8].map((s, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: meta.color,
                  animation: `pulse-ring ${1 + i * 0.2}s ease-in-out infinite`,
                  opacity: s,
                }} />
              ))}
            </div>
          </div>
        )}

        {currentGame === 0 && !transitioning && (
          <SaccadicGame
            gazeRef={gazeRef}
            durationSec={durations[0]}
            onComplete={handleSaccadicComplete}
          />
        )}
        {currentGame === 1 && !transitioning && (
          <PursuitGame
            gazeRef={gazeRef}
            durationSec={durations[1]}
            onComplete={handlePursuitComplete}
          />
        )}
        {currentGame === 2 && !transitioning && (
          <ConvergenceGame 
            durationSec={durations[2]}
            onComplete={handleConvergenceComplete} 
          />
        )}
      </div>
    </div>
  );
}
