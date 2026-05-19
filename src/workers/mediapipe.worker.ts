import {
  FaceLandmarker,
  FilesetResolver
} from '@mediapipe/tasks-vision';

let landmarker: FaceLandmarker | null = null;

async function init() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
  );
  landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
  });
  self.postMessage({ type: 'ready' });
}

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'init') {
    try {
      await init();
    } catch (err: any) {
      self.postMessage({ type: 'error', error: err.message });
    }
  } else if (type === 'detect' && landmarker) {
    const { imageBitmap, timestamp } = payload;
    try {
      const result = landmarker.detectForVideo(imageBitmap, timestamp);
      self.postMessage({ type: 'result', result, timestamp });
    } catch (err: any) {
      self.postMessage({ type: 'error', error: err.message });
    }
  }
};
