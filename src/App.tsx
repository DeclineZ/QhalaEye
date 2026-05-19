import { useEffect } from 'react';
import { useSessionStore } from './store/sessionStore';
import { useWebGazer } from './hooks/useWebGazer';
import WelcomeView from './views/WelcomeView';
import CalibrationView from './views/CalibrationView';
import DashboardView from './views/DashboardView';
import GameView from './views/GameView';
import ClinicalDashboardView from './views/ClinicalDashboardView';
import ProfileView from './views/ProfileView';

function App() {
  const currentView = useSessionStore((s) => s.currentView);
  const { endGazer } = useWebGazer();

  // ── Global Camera Cleanup ────────────────────────────────────────────────
  // Ensure WebGazer is fully terminated when on menu/dashboard pages
  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'clinical' || currentView === 'profile' || currentView === 'welcome') {
      endGazer();
    }
  }, [currentView, endGazer]);

  return (
    <>
      {currentView === 'welcome'     && <WelcomeView />}
      {currentView === 'calibration' && <CalibrationView />}
      {currentView === 'dashboard'   && <DashboardView />}
      {currentView === 'game'        && <GameView />}
      {currentView === 'clinical'    && <ClinicalDashboardView />}
      {currentView === 'profile'     && <ProfileView />}
    </>
  );
}

export default App;
