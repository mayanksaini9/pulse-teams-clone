import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Teams from './pages/Teams';
import { Activity } from 'lucide-react';
import { LivePulseBackground } from './components/LivePulseBackground';

const AppContent = () => {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const inviteId = searchParams.get('invite');
    if (inviteId) {
      localStorage.setItem('pending_invite_team_id', inviteId);
      // Clean query parameter from URL bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="loader-card glass-panel">
          <div className="logo-pulse">
            <Activity size={32} />
          </div>
          <h2>Initializing Pulse</h2>
          <div className="progress-bar">
            <div className="progress-bar-fill"></div>
          </div>
        </div>
        <style>{`
          .app-loading-screen {
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0a0b10;
            color: white;
            overflow: hidden;
          }
          .loader-card {
            padding: 40px;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            text-align: center;
            width: 280px;
          }
          .logo-pulse {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
            animation: pulse 1.8s infinite alternate;
          }
          .logo-pulse svg {
            color: white;
            stroke-width: 2.5px;
          }
          .loader-card h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: #94a3b8;
            letter-spacing: 0.05em;
          }
          .progress-bar {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 8px;
          }
          .progress-bar-fill {
            height: 100%;
            width: 40%;
            background: linear-gradient(90deg, #6366f1, #d946ef);
            border-radius: 2px;
            animation: loadingProgress 1.5s infinite ease-in-out;
          }
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            100% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
          }
          @keyframes loadingProgress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <LivePulseBackground />
      {user ? <Teams /> : <Auth />}
    </>
  );
};

import { TeamProvider } from './context/TeamContext';

const App = () => {
  return (
    <AuthProvider>
      <TeamProvider>
        <AppContent />
      </TeamProvider>
    </AuthProvider>
  );
};

export default App;
