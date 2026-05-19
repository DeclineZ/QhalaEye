import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useWebGazer } from '../hooks/useWebGazer';

// 9 calibration points (as % of screen)
const CALIB_POINTS = [
  { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 90, y: 10 },
  { x: 10, y: 50 }, { x: 50, y: 50 }, { x: 90, y: 50 },
  { x: 10, y: 90 }, { x: 50, y: 90 }, { x: 90, y: 90 },
];

export default function CalibrationView() {
  const { setView, setCalibrated } = useSessionStore();
  const { startGazer, endGazer, setLearning, isLoaded } = useWebGazer();

  const [step, setStep] = useState(0);         // -1 = intro, 0–8 = calibration
  const [phase, setPhase] = useState<'intro' | 'calibrating' | 'done'>('intro');
  const [clickCount, setClickCount] = useState(0); // clicks on current point
  const [gazerReady, setGazerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef<number>(0);

  // Start WebGazer when calibration begins
  const beginCalibration = useCallback(async () => {
    setPhase('calibrating');
    try {
      if (window.webgazer) {
        window.webgazer.clearData();
      }
      await startGazer();
      setLearning(true); 
      setGazerReady(true);
    } catch (err) {
      console.error('WebGazer failed to start:', err);
      // Fallback: proceed without tracking (demo/no-camera mode)
      setGazerReady(true);
    }
  }, [startGazer]);

  const handlePointClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastClickRef.current < 200) return; // Throttle to ensure unique video frames
      lastClickRef.current = now;

      if (!gazerReady || phase !== 'calibrating') return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let cx = 0, cy = 0;
      if ('touches' in e) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else {
        cx = e.clientX;
        cy = e.clientY;
      }

      // Visual feedback
      // (State removed)

      // Record position in WebGazer 5 times per point for better accuracy
      if (window.webgazer) {
        window.webgazer.recordScreenPosition(cx, cy, 'click');
      }

      const newCount = clickCount + 1;
      if (newCount >= 5) {
        setClickCount(0);
        const nextStep = step + 1;
        if (nextStep >= CALIB_POINTS.length) {
          setPhase('done');
          setTimeout(() => {
            endGazer();
            setCalibrated(true);
            setView('dashboard');
          }, 800);
        } else {
          setStep(nextStep);
        }
      } else {
        setClickCount(newCount);
      }
    },
    [gazerReady, phase, clickCount, step, setCalibrated, setView]
  );

  // Hide WebGazer default UI elements
  useEffect(() => {
    if (isLoaded && window.webgazer) {
      window.webgazer.showPredictionPoints(false).showFaceOverlay(false).showFaceFeedbackBox(false);
    }
  }, [isLoaded]);

  // ── Secret Shortcut to Skip Calibration ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 's') {
        endGazer();
        setCalibrated(true);
        setView('dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [endGazer, setCalibrated, setView]);

  const currentPoint = CALIB_POINTS[step];
  const progress = ((step * 3 + clickCount) / (CALIB_POINTS.length * 3)) * 100;

  return (
    <div
      ref={containerRef}
      className="touch-lock"
      onClick={phase === 'calibrating' ? handlePointClick : undefined}
      onTouchStart={phase === 'calibrating' ? handlePointClick : undefined}
      style={{
        width: '100vw', height: '100vh',
        background: '#FFFFFF',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', cursor: 'crosshair',
      }}
    >
      {/* ── Intro screen ── */}
      {phase === 'intro' && (
        <div className="animate-float-in" style={{ textAlign: 'center', maxWidth: 520, padding: '0 2rem' }}>
          {/* Animated eye icon */}
          <img
            src="/QhalaEye.png"
            alt="Logo"
            onDoubleClick={() => { endGazer(); setCalibrated(true); setView('dashboard'); }}
            title="Double-click to skip"
            style={{
              width: 140, height: 140,
              objectFit: 'contain',
              margin: '0 auto',
              cursor: 'pointer',
              transform: 'scale(1.3)'
            }}
          />

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '.75rem' }}>
            Eye Sync
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.7, marginBottom: '2rem' }}>
            Let's sync your eyes! Keep your eyes locked on the{' '}
            <strong style={{ color: '#2563EB' }}>blue dot</strong> and tap it as it moves across the screen.
          </p>

          <div style={{
            background: '#F8FAFC', borderRadius: '1rem', padding: '1rem 1.5rem',
            border: '1px solid #E2E8F0', marginBottom: '2rem', textAlign: 'left',
          }}>
            {[
              'Look directly at the dot — don\'t move your head',
              'Tap the dot 3 times before it moves',
              '9 points total — takes about 30 seconds',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'center', padding: '.35rem 0' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#2563EB', color: '#fff',
                  fontSize: '.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</div>
                <span style={{ fontSize: '.9rem', color: '#475569' }}>{tip}</span>
              </div>
            ))}
          </div>

          <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }} onClick={beginCalibration}>
            Begin Eye Sync →
          </button>
        </div>
      )}

      {/* ── Calibration dot ── */}
      {phase === 'calibrating' && currentPoint && (
        <>
          {/* Progress bar */}
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: 4,
            background: '#E2E8F0', zIndex: 10000,
          }}>
            <div style={{
              height: '100%', background: '#2563EB',
              width: `${progress}%`, transition: 'width .3s ease',
            }} />
          </div>

          {/* Status label */}
          <div style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)',
            borderRadius: 999, padding: '.35rem 1.2rem',
            fontSize: '.8rem', fontWeight: 600, color: '#475569', zIndex: 10000,
          }}>
            Point {step + 1} of {CALIB_POINTS.length} — Tap {5 - clickCount} more time{5 - clickCount !== 1 ? 's' : ''}
          </div>

          {/* The dot */}
          <div
            key={`${step}-${clickCount}`}
            style={{
              position: 'fixed',
              left: `${currentPoint.x}%`,
              top: `${currentPoint.y}%`,
              // Dots shrink as you click them to focus your gaze
              width: clickCount >= 4 ? 24 : clickCount >= 2 ? 32 : 44,
              height: clickCount >= 4 ? 24 : clickCount >= 2 ? 32 : 44,
              borderRadius: '50%',
              background: '#2563EB',
              transform: 'translate(-50%, -50%)',
              animation: 'pulse-dot 1.6s ease-in-out infinite',
              boxShadow: '0 0 0 0 rgba(37,99,235,.5)',
              transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
              cursor: 'pointer',
              zIndex: 10000,
            }}
          />
        </>
      )}

      {/* ── Done flash ── */}
      {phase === 'done' && (
        <div className="animate-float-in" style={{ textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>Sync Complete!</h2>
          <p style={{ color: '#475569', marginTop: '.5rem' }}>Loading your dashboard…</p>
        </div>
      )}
    </div>
  );
}
