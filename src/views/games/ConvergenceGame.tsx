import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaPipe } from '../../hooks/useMediaPipe';

interface ConvergenceGameProps {
  durationSec: number;
  onComplete: (ipdAtBreak: number) => void;
}

/* ── Constants ──────────────────────────────────────────────────────────────── */
const SECONDS_PER_REP = 15;        // ~15s per full push-in + pull-out cycle
const EMA_ALPHA = 0.25;      // exponential moving-average smoothing factor
// IPD in px INCREASES as user moves closer (face gets bigger in camera)
const CLOSE_FACTOR = 0.92;      // IPD must rise to ≥92% of break point → "close enough"
const FAR_FACTOR = 0.70;      // IPD must drop to ≤70% of break point → "far enough"
const RING_R = 90;        // SVG ring radius
const RING_CIRCUM = 2 * Math.PI * RING_R; // ≈ 565

export default function ConvergenceGame({ durationSec, onComplete }: ConvergenceGameProps) {
  const { ipd: rawIpd, isReady, startTracking, stopTracking } = useMediaPipe();

  /* ── Phase Machine ─────────────────────────────────────────────────────── */
  const [phase, setPhase] = useState<'loading' | 'calibrating' | 'countdown' | 'exercising' | 'done'>('loading');

  /* ── Calibration ───────────────────────────────────────────────────────── */
  const [recordedBreakPoint, setRecordedBreakPoint] = useState<number | null>(null);

  /* ── Exercise State ────────────────────────────────────────────────────── */
  const [targetReps, setTargetReps] = useState(0);
  const [reps, setReps] = useState(0);
  const [direction, setDirection] = useState<'in' | 'out'>('out');  // start 'out': user calibrates at close range, must pull back first
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);

  /* ── Smoothed IPD ──────────────────────────────────────────────────────── */
  const [smoothIpd, setSmoothIpd] = useState<number | null>(null);
  const smoothRef = useRef<number | null>(null);

  /* ── Refs ───────────────────────────────────────────────────────────────── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number>(0);
  const completedRef = useRef(false);
  const reachedBreak = useRef(false);

  /* ── Hide WebGazer's camera overlay while this game is mounted ──────── */
  useEffect(() => {
    const wgContainer = document.getElementById('webgazerVideoContainer');
    if (wgContainer) {
      wgContainer.style.display = 'none';
    }
    return () => {
      // Restore when leaving the convergence game
      if (wgContainer) {
        wgContainer.style.display = '';
      }
    };
  }, []);

  /* ── EMA filter on raw IPD ─────────────────────────────────────────────── */
  useEffect(() => {
    if (rawIpd === null) return;
    const prev = smoothRef.current;
    const next = prev === null ? rawIpd : prev + EMA_ALPHA * (rawIpd - prev);
    smoothRef.current = next;
    setSmoothIpd(Math.round(next));
  }, [rawIpd]);

  /* ── Camera Setup ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      // ── SETTLE DELAY ───────────────────────────────────────────────────────
      // Wait for WebGazer to fully release WASM / WebGL resources before we start
      await new Promise(r => setTimeout(r, 1500));
      if (cancelled) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setPhase('calibrating');
        }
      } catch (err) {
        console.error('Camera error in ConvergenceGame:', err);
        setPhase('calibrating');
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      stopTracking();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopTracking]);

  /* ── MediaPipe Lifecycle ───────────────────────────────────────────────── */
  useEffect(() => {
    const needsTracking = phase === 'calibrating' || phase === 'exercising';
    if (needsTracking && isReady && videoRef.current && videoRef.current.readyState >= 2) {
      // Final safety check for dimensions to avoid ROI crashes
      if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
        startTracking(videoRef.current);
      }
    }
  }, [phase, isReady, startTracking]);

  /* ── Calibration ───────────────────────────────────────────────────────── */
  const handleCalibrate = useCallback(() => {
    if (phase !== 'calibrating') return;
    const bp = smoothIpd ?? rawIpd ?? 100;
    setRecordedBreakPoint(bp);

    // Calculate target reps for the session
    const repsForDuration = Math.max(Math.round(durationSec / SECONDS_PER_REP), 3);
    setTargetReps(repsForDuration);

    // User is at close range after calibration → start with 'out'
    setDirection('out');
    reachedBreak.current = true;

    // Start 3-2-1 countdown
    setPhase('countdown');
    setCountdownNum(3);
  }, [phase, smoothIpd, rawIpd, durationSec]);

  /* ── Countdown Timer ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) {
      // Reset smoothed IPD so stale values don't cause false triggers
      smoothRef.current = null;
      setSmoothIpd(null);
      setPhase('exercising');
      return;
    }
    const id = setTimeout(() => setCountdownNum(n => n - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdownNum]);

  /* ── Exercise Timer (elapsed) ──────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'exercising') return;
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  /* ── Rep Detection (hysteresis-based) ──────────────────────────────────── */
  // Camera IPD goes UP when closer (face bigger) and DOWN when farther.
  useEffect(() => {
    if (phase !== 'exercising' || !recordedBreakPoint || smoothIpd === null) return;

    const closeThreshold = recordedBreakPoint * CLOSE_FACTOR;  // high IPD target
    const farThreshold = recordedBreakPoint * FAR_FACTOR;    // low IPD target

    if (direction === 'in' && smoothIpd >= closeThreshold && !reachedBreak.current) {
      // IPD rose high enough → user is close to break point
      reachedBreak.current = true;
      setDirection('out');
    } else if (direction === 'out' && smoothIpd <= farThreshold && reachedBreak.current) {
      // IPD dropped low enough → user has pulled back far enough → 1 rep!
      reachedBreak.current = false;
      setDirection('in');
      setReps(r => r + 1);
    }
  }, [smoothIpd, phase, recordedBreakPoint, direction]);

  /* ── Completion: rep-based ─────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'exercising' || completedRef.current) return;
    if (reps >= targetReps && targetReps > 0) {
      completedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('done');
    }
  }, [reps, targetReps, phase]);

  useEffect(() => {
    if (phase === 'done') {
      const id = setTimeout(() => onComplete(recordedBreakPoint || 100), 2500);
      return () => clearTimeout(id);
    }
  }, [phase, onComplete, recordedBreakPoint]);

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 0 = far away (low IPD), 1 = at break point (high IPD)
  const depthProgress = (() => {
    if (!smoothIpd || !recordedBreakPoint) return 0;
    const far = recordedBreakPoint * FAR_FACTOR;    // low IPD value
    const near = recordedBreakPoint * CLOSE_FACTOR;  // high IPD value
    return Math.max(0, Math.min(1, (smoothIpd - far) / (near - far)));
  })();

  const accentColor = direction === 'in' ? '#2563EB' : '#059669';
  const bgTint = direction === 'in' ? '#EFF6FF' : '#ECFDF5';

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div
      className="touch-lock"
      onClick={phase === 'calibrating' ? handleCalibrate : undefined}
      style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        background: 'var(--bg-base)',
        cursor: phase === 'calibrating' ? 'pointer' : 'default',
      }}
    >
      {/* Hidden video element for MediaPipe processing */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 320, height: 240 }}
      />

      {/* ── Camera Preview (bottom-right) ── */}
      {phase !== 'loading' && (
        <div style={{
          position: 'absolute', bottom: '12px', right: '12px',
          width: 320, height: 240, borderRadius: '12px',
          overflow: 'hidden', border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,.15)', zIndex: 20,
          background: '#000',
        }}>
          <video
            autoPlay playsInline muted
            ref={el => {
              if (el && streamRef.current && el.srcObject !== streamRef.current) {
                el.srcObject = streamRef.current;
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        </div>
      )}

      {/* ── HUD (exercising / countdown) ── */}
      {(phase === 'exercising' || phase === 'countdown') && (
        <div style={{
          position: 'absolute', top: '2rem', left: '2rem', right: '2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 10,
        }}>
          <div style={{
            background: 'var(--bg-surface)', padding: '.75rem 1.5rem',
            borderRadius: '1rem', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Time Elapsed
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timeElapsed)}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)', padding: '.75rem 1.5rem',
            borderRadius: '1rem', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Reps
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
              {reps} <span style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {targetReps}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 600, padding: '0 2rem' }}>

        {/* LOADING */}
        {phase === 'loading' && (
          <div style={{ animation: 'fadeIn .3s ease' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {isReady ? 'Starting camera…' : 'Initializing face tracking…'}
            </p>
          </div>
        )}

        {/* CALIBRATING */}
        {phase === 'calibrating' && (
          <div style={{ animation: 'float-in .4s ease' }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 2rem' }}>
              <div style={{ position: 'absolute', inset: 0, border: '2px dashed var(--blue-200)', borderRadius: '50%', animation: 'spin 10s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 10, background: 'var(--blue-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2563EB', animation: 'target-pulse 2s infinite' }} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>Calibration Step</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Slowly move your face <strong>closer to the screen</strong>.<br />
              Tap exactly when the center dot appears to split into two.
            </p>
            <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '.75rem 1.25rem', borderRadius: 999, fontSize: '.9rem', fontWeight: 600, display: 'inline-block' }}>
              Current IPD: {smoothIpd ?? rawIpd ?? '--'} px
            </div>
          </div>
        )}

        {/* COUNTDOWN (actual 3-2-1) */}
        {phase === 'countdown' && (
          <div style={{ animation: 'scale-in .3s ease' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '1rem' }}>Get Ready…</h2>
            <div
              key={countdownNum}
              style={{
                fontSize: '8rem', fontWeight: 900,
                color: countdownNum > 0 ? '#2563EB' : '#059669',
                animation: 'scale-in .3s ease',
                lineHeight: 1,
              }}
            >
              {countdownNum > 0 ? countdownNum : 'GO!'}
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem', fontSize: '.95rem' }}>
              {targetReps} reps to complete
            </p>
          </div>
        )}

        {/* EXERCISING */}
        {phase === 'exercising' && (
          <div style={{ animation: 'fadeIn .4s ease' }}>
            {/* Visual guide — single SVG-based ring, no double borders */}
            <div style={{
              position: 'relative',
              width: 200, height: 200,
              margin: '0 auto 1.5rem',
            }}>
              {/* SVG ring */}
              <svg
                width={200} height={200}
                style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
              >
                {/* Background track */}
                <circle
                  cx={100} cy={100} r={RING_R} fill="none"
                  stroke="#E2E8F0" strokeWidth={6}
                />
                {/* Progress arc */}
                <circle
                  cx={100} cy={100} r={RING_R} fill="none"
                  stroke={accentColor}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUM}
                  strokeDashoffset={RING_CIRCUM - (RING_CIRCUM * depthProgress)}
                  style={{ transition: 'stroke-dashoffset 0.15s ease-out, stroke 0.4s ease' }}
                />
              </svg>

              {/* Inner filled circle */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 90, height: 90,
                  borderRadius: '50%',
                  background: bgTint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.4s ease',
                }}>
                  <div style={{
                    width: 50, height: 50,
                    borderRadius: '50%',
                    background: accentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '1.5rem', fontWeight: 700,
                    transition: 'background 0.4s ease',
                    animation: direction === 'in' ? 'breathe-in 2s ease-in-out infinite' : 'breathe-out 2s ease-in-out infinite',
                  }}>
                    {direction === 'in' ? '↓' : '↑'}
                  </div>
                </div>
              </div>
            </div>

            {/* Direction instruction */}
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: accentColor, transition: 'color 0.4s ease' }}>
              {direction === 'in' ? 'Move Closer' : 'Move Away'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '.75rem' }}>
              {direction === 'in'
                ? 'Push in until you reach your break point'
                : 'Great! Now slowly pull back to start'}
            </p>

            {/* Depth bar */}
            <div style={{
              width: '100%', maxWidth: 360, margin: '2rem auto 0',
              background: '#F1F5F9', borderRadius: 999, height: 10,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 999,
                width: `${Math.min(100, depthProgress * 100)}%`,
                background: `linear-gradient(90deg, ${accentColor}60, ${accentColor})`,
                transition: 'width .15s ease-out, background 0.4s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 360, margin: '.4rem auto 0', fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <span>Far</span>
              <span>Break Point</span>
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <div style={{ animation: 'float-in .4s ease' }}>
            <div style={{ width: 80, height: 80, background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={3}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Exercise Complete!</h2>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '2rem' }}>
              <div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL REPS</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#059669' }}>{reps}</div>
              </div>
              <div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIME</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2563EB' }}>{formatTime(timeElapsed)}</div>
              </div>
              <div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>BREAK POINT</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#7C3AED' }}>{recordedBreakPoint} px</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes target-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes breathe-in {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes breathe-out {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.9); }
        }
        .spinner {
          width: 48px; height: 48px; border-radius: 50%;
          border: 4px solid #E2E8F0; border-top-color: #2563EB;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
