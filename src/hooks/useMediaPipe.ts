import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

let globalLandmarkerPromise: Promise<FaceLandmarker> | null = null;
let globalLandmarker: FaceLandmarker | null = null;

export interface UseMediaPipeReturn {
  ipd: number | null;
  isReady: boolean;
  startTracking: (videoEl: HTMLVideoElement) => void;
  stopTracking: () => void;
}

export function useMediaPipe(): UseMediaPipeReturn {
  const [ipd, setIpd] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(!!globalLandmarker);

  const rafRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTimestampRef = useRef<number>(-1);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!globalLandmarkerPromise) {
        globalLandmarkerPromise = (async () => {
          // ── NAMESPACE ISOLATION HACK ─────────────────────────────────────
          // WebGazer.js (Legacy MediaPipe) often pollutes window.Module.
          // Newer MediaPipe Tasks Vision will crash if it finds a 'Module' it doesn't own.
          const anyWin = window as any;
          const originalModule = anyWin.Module;
          anyWin.Module = undefined; // Temporarily hide it during initialization

          try {
            const filesetResolver = await FilesetResolver.forVisionTasks(
              'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
            );
            const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
              baseOptions: {
                modelAssetPath:
                  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU',
              },
              runningMode: 'VIDEO',
              numFaces: 1,
              outputFaceBlendshapes: false,
              outputFacialTransformationMatrixes: false,
            });

            globalLandmarker = landmarker;
            return landmarker;
          } finally {
            // Restore original Module if it existed, so WebGazer doesn't break
            if (originalModule) {
              anyWin.Module = originalModule;
            }
          }
        })();
      }

      try {
        await globalLandmarkerPromise;
        if (!cancelled) {
          setIsReady(true);
        }
      } catch (err) {
        console.error("Failed to initialize MediaPipe:", err);
        globalLandmarkerPromise = null;
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const lm = globalLandmarker;
    if (!video || !lm || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    const now = performance.now();
    if (now === lastTimestampRef.current) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }
    lastTimestampRef.current = now;

    let result: FaceLandmarkerResult;
    try {
      result = lm.detectForVideo(video, now);
    } catch {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    if (result.faceLandmarks.length > 0) {
      const landmarks = result.faceLandmarks[0];
      const leftIris  = landmarks[468];
      const rightIris = landmarks[473];

      if (leftIris && rightIris) {
        const dx = (rightIris.x - leftIris.x) * video.videoWidth;
        const dy = (rightIris.y - leftIris.y) * video.videoHeight;
        setIpd(Math.round(Math.sqrt(dx * dx + dy * dy)));
      }
    }

    rafRef.current = requestAnimationFrame(detect);
  }, []);

  const startTracking = useCallback((videoEl: HTMLVideoElement) => {
    videoRef.current = videoEl;
    rafRef.current = requestAnimationFrame(detect);
  }, [detect]);

  const stopTracking = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    videoRef.current = null;
    setIpd(null);
  }, []);

  return { ipd, isReady, startTracking, stopTracking };
}
