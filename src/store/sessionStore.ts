import { create } from 'zustand';

export interface SessionMetrics {
  saccadicLatency: number | null;    // ms — lower is better
  gazeAccuracy: number | null;       // % — higher is better
  convergenceBreakPoint: number | null; // IPD px — higher is better
}

type AppView = 'welcome' | 'calibration' | 'dashboard' | 'game' | 'clinical' | 'profile';

interface SessionStore {
  currentView: AppView;
  userName: string | null;
  currentGame: number;
  demoMode: boolean;
  isSingleGameMode: boolean;
  isCalibrated: boolean;
  sessionMetrics: SessionMetrics;

  // Actions
  setView: (view: AppView) => void;
  setUserName: (name: string) => void;
  setCurrentGame: (game: number) => void;
  toggleDemoMode: () => void;
  setCalibrated: (v: boolean) => void;
  updateMetric: (key: keyof SessionMetrics, value: number) => void;
  resetSession: () => void;
  startSingleGame: (gameIndex: number) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentView: 'welcome',
  userName: null,
  currentGame: 0,
  demoMode: false,
  isSingleGameMode: false,
  isCalibrated: false,
  sessionMetrics: {
    saccadicLatency: null,
    gazeAccuracy: null,
    convergenceBreakPoint: null,
  },

  setView: (view) => set({ currentView: view }),
  setUserName: (name) => set({ userName: name }),
  setCurrentGame: (game) => set({ currentGame: game }),
  toggleDemoMode: () => set((s) => ({ demoMode: !s.demoMode })),
  setCalibrated: (v) => set({ isCalibrated: v }),
  updateMetric: (key, value) =>
    set((s) => ({ sessionMetrics: { ...s.sessionMetrics, [key]: value } })),
  resetSession: () =>
    set({
      currentGame: 0,
      isSingleGameMode: false,
      sessionMetrics: { saccadicLatency: null, gazeAccuracy: null, convergenceBreakPoint: null },
    }),
  startSingleGame: (gameIndex) => set({
    currentGame: gameIndex,
    isSingleGameMode: true,
    currentView: 'game'
  }),
}));
