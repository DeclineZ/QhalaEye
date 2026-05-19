export {};

declare global {
  interface Window {
    webgazer: {
      setGazeListener: (
        fn: (data: { x: number; y: number } | null, elapsed: number) => void
      ) => Window['webgazer'];
      begin: () => Promise<Window['webgazer']>;
      end: () => Window['webgazer'];
      pause: () => Window['webgazer'];
      resume: () => Window['webgazer'];
      showVideo: (show: boolean) => Window['webgazer'];
      showPredictionPoints: (show: boolean) => Window['webgazer'];
      showFaceOverlay: (show: boolean) => Window['webgazer'];
      showFaceFeedbackBox: (show: boolean) => Window['webgazer'];
      recordScreenPosition: (x: number, y: number, eventType: string) => void;
      clearData: () => Window['webgazer'];
      saveDataAcrossSessions: (save: boolean) => Window['webgazer'];
      isReady: () => boolean;
      params: Record<string, unknown>;
    };
  }
}
