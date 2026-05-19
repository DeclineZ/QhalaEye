import { useCallback, useEffect, useRef, useState } from 'react';

export interface GazePoint { x: number; y: number }

const WEBGAZER_SCRIPT_URL = '/webgazer.js';

// ── Module-level singletons ────────────────────────────────────────────────
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: Array<() => void> = [];
let gazerBegun = false;
let gazeListenerActive = false;

/** Latest raw WebGazer prediction + timestamp */
let latestGaze: GazePoint | null = null;
let latestGazeTime = 0;

// EMA smoothing factor (0–1, lower = smoother)
const EMA_ALPHA = 0.3;
let smoothedGaze: GazePoint | null = null;

function loadWebGazerScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scriptLoaded && window.webgazer) { resolve(); return; }
    loadCallbacks.push(resolve);
    if (scriptLoading) return;
    scriptLoading = true;
    const s = document.createElement('script');
    s.src = WEBGAZER_SCRIPT_URL;
    s.async = true;
    s.onload = () => { scriptLoaded = true; loadCallbacks.forEach(cb => cb()); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function injectWebGazerCSS() {
  if (document.getElementById('wg-reposition-style')) return;
  const style = document.createElement('style');
  style.id = 'wg-reposition-style';
  style.textContent = `
    #webgazerVideoContainer {
      top: auto !important; left: auto !important;
      bottom: 12px !important; right: 12px !important;
      z-index: 9000 !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      box-shadow: 0 4px 16px rgba(0,0,0,.15) !important;
      opacity: 0.85 !important;
    }
    #webgazerVideoFeed { border-radius: 12px !important; }
    #webgazerFaceOverlay { border-radius: 12px !important; }
    #webgazerGazeDot { display: none !important; }
    #webgazerVideoContainer canvas {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      transform: scaleX(-1);
    }
  `;
  document.head.appendChild(style);
}

function ensureGazeListener() {
  if (!window.webgazer || gazeListenerActive) return;
  gazeListenerActive = true;
  window.webgazer.setGazeListener((data: { x: number; y: number } | null) => {
    if (data && isFinite(data.x) && isFinite(data.y)) {
      // DEBUG: console.log("Gaze raw:", data.x, data.y);
      latestGaze = { x: data.x, y: data.y };
      latestGazeTime = Date.now();

      // Apply EMA smoothing
      if (!smoothedGaze) {
        smoothedGaze = { ...latestGaze };
      } else {
        smoothedGaze = {
          x: smoothedGaze.x + EMA_ALPHA * (latestGaze.x - smoothedGaze.x),
          y: smoothedGaze.y + EMA_ALPHA * (latestGaze.y - smoothedGaze.y),
        };
      }
    }
  });
}

export interface UseWebGazerReturn {
  gazeRef: React.MutableRefObject<GazePoint | null>;
  isLoaded: boolean;
  isActive: boolean;
  loadGazer: () => Promise<void>;
  startGazer: () => Promise<void>;
  pauseGazer: () => void;
  resumeGazer: () => void;
  endGazer: () => void;
  setLearning: (enable: boolean) => void;
}

export function useWebGazer(): UseWebGazerReturn {
  const gazeRef = useRef<GazePoint | null>(null);
  const [isLoaded, setIsLoaded] = useState(scriptLoaded);
  const [isActive, setIsActive] = useState(false);
  const pollingRef = useRef<number>(0);
  const mouseRef = useRef<GazePoint | null>(null);

  // ── Always track mouse position ──────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── Polling loop: blend WebGazer + mouse ─────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const poll = () => {
      const now = Date.now();
      const gazeFresh = smoothedGaze && (now - latestGazeTime < 500);

      let currentGaze: GazePoint | null = null;
      if (gazeFresh && smoothedGaze) {
        currentGaze = { x: Math.round(smoothedGaze.x), y: Math.round(smoothedGaze.y) };
      }
      // Manual mouse fallback removed to prevent 'cursor-magnet' behavior

      if (currentGaze) {
        gazeRef.current = currentGaze;

        // Zero-cost React: update the DOM directly for the cursor
        const dot = document.getElementById('gaze-dot-overlay');
        if (dot) {
          dot.style.display = 'block';
          dot.style.left = currentGaze.x + 'px';
          dot.style.top = currentGaze.y + 'px';
        }
      }

      pollingRef.current = requestAnimationFrame(poll);
    };

    pollingRef.current = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(pollingRef.current);
      const dot = document.getElementById('gaze-dot-overlay');
      if (dot) dot.style.display = 'none';
    };
  }, [isActive]);

  const loadGazer = useCallback(async () => {
    await loadWebGazerScript();
    setIsLoaded(true);
  }, []);

  const startGazer = useCallback(async () => {
    await loadWebGazerScript();
    setIsLoaded(true);
    injectWebGazerCSS();

    if (gazerBegun) {
      try { window.webgazer.resume(); } catch { /* already running */ }
      ensureGazeListener();
      setIsActive(true);
      return;
    }

    // Force disable local storage saving to prevent the async WASM crash
    window.webgazer.saveDataAcrossSessions(false);
    await window.webgazer.begin();
    // window.webgazer.removeMouseEventListeners(); 

    // ── UI Visibility (Force after begin) ──────────────────────────────────
    window.webgazer
      .showVideo(true)
      .showPredictionPoints(false)
      .showFaceOverlay(true)
      .showFaceFeedbackBox(false);

    gazerBegun = true;
    ensureGazeListener();
    setIsActive(true);
  }, []);

  const pauseGazer = useCallback(() => {
    if (window.webgazer && gazerBegun) {
      window.webgazer.pause();
      setIsActive(false);
    }
  }, []);

  const resumeGazer = useCallback(() => {
    if (window.webgazer && gazerBegun) {
      window.webgazer.resume();
      ensureGazeListener();
      setIsActive(true);
    }
  }, []);

  const endGazer = useCallback(() => {
    if (!window.webgazer) return;

    try {
      console.log("Stopping WebGazer hardware...");
      window.webgazer.pause();
      window.webgazer.setGazeListener(() => { });

      const video = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
      const stream = video?.srcObject as MediaStream | null;
      const tracks = stream ? stream.getTracks() : [];

      // Calling end() shuts down the internal MediaPipe WASM loops
      window.webgazer.end();

      // Give WASM a moment to cleanly abort before we pull the rug out from the video tracks
      setTimeout(() => {
        tracks.forEach(track => {
          track.stop();
          console.log("Track killed:", track.label);
        });
        if (video) {
          video.srcObject = null;
        }
      }, 250);

    } catch (e) {
      console.warn("WebGazer end failed:", e);
    }

    // DOM cleanup
    setTimeout(() => {
      document.querySelectorAll('[id^="webgazer"]').forEach(el => el.remove());
      const anyWin = window as any;
      if (anyWin.Module) {
        try { anyWin.Module = null; delete anyWin.Module; } catch (e) { }
      }
    }, 250);

    gazerBegun = false;
    gazeListenerActive = false;
    latestGaze = null;
    smoothedGaze = null;
    latestGazeTime = 0;
    gazeRef.current = null;
    setIsActive(false);
  }, []);

  const setLearning = useCallback((enable: boolean) => {
    const wg = (window as any).webgazer;
    if (!wg) return;
    if (enable) {
      try { wg.addMouseEventListeners(); } catch (e) { }
    } else {
      try { wg.removeMouseEventListeners(); } catch (e) { }
    }
  }, []);

  return { gazeRef, isLoaded, isActive, loadGazer, startGazer, pauseGazer, resumeGazer, endGazer, setLearning };
}
