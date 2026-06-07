import { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RoomService from './services/RoomService';

import Topbar            from './components/Topbar';
import Sidebar           from './components/Sidebar';
import HomePage          from './components/HomePage';
import RaceScreen        from './components/RaceScreen';
import MultiplayerRaceArena from './components/MultiplayerRaceArena';
import ResultScreen      from './components/ResultScreen';
import ThemeModal        from './components/ThemeModal';
import ProfileModal      from './components/ProfileModal';
import ShopModal         from './components/ShopModal';
import MultiplayerModal  from './components/MultiplayerModal';
import LeaderboardModal  from './components/LeaderboardModal';
import InviteNotification from './components/InviteNotification';
import LoadingScreen     from './components/LoadingScreen';
import AuthPage          from './pages/AuthPage';

const VIEW = { HOME: 'home', RACE: 'race', RESULT: 'result' };

function AppContent() {
  const { isLoggedIn, loading } = useAuth();
  const [view,     setView]     = useState(VIEW.HOME);
  const [theme,    setTheme]    = useState('gori-light');
  const [ownedVehicles, setOwnedVehicles] = useState(['car1']);
  const [equippedVehicle, setEquippedVehicle] = useState('car1');
  const [result,   setResult]   = useState(null);
  const [gameMode, setGameMode] = useState('solo');
  const [roomCode, setRoomCode] = useState(null);
  const [modal,    setModal]    = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Cleanup expired rooms on app load
  useEffect(() => {
    RoomService.cleanupExpiredRooms();
  }, []);

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Show auth page if requested
  if (showAuth) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
  }

  const handleFinish = (raceResult) => {
    setResult(raceResult);
    setView(VIEW.RESULT);
  };

  const handleBackToHome = () => {
    setResult(null);
    setRoomCode(null);
    setView(VIEW.HOME);
  };

  const handleStartSolo = () => {
    setGameMode('solo');
    setRoomCode(null);
    setView(VIEW.RACE);
  };

  const handleStartMultiplayer = () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    setGameMode('multiplayer');
    setModal('multiplayer');
  };

  const handleMultiplayerRaceStart = (raceSettings, code) => {
    setRoomCode(code);
    setGameMode('multiplayer');
    setView(VIEW.RACE);
  };

  const handleJoinRoomFromInvite = (code) => {
    setRoomCode(code);
    setModal('multiplayer');
  };

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* ── Main Content Area (menyempit saat sidebar buka) ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
      }}>
        {/* Invite Notifications */}
        {isLoggedIn && <InviteNotification onJoinRoom={handleJoinRoomFromInvite} />}

        {/* Topbar */}
        {view === VIEW.HOME && (
          <Topbar
            onHome={handleBackToHome}
            onTheme={() => setModal('theme')}
            onProfile={() => setModal('profile')}
            onShop={() => setModal('shop')}
            onLeaderboard={() => setModal('leaderboard')}
            onShowAuth={() => setShowAuth(true)}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {view === VIEW.HOME && (
            <HomePage
              onStartSolo={handleStartSolo}
              onMultiplayer={handleStartMultiplayer}
            />
          )}
          {view === VIEW.RACE && gameMode === 'solo' && (
            <RaceScreen
              roomCode={null}
              isMultiplayer={false}
              onFinish={handleFinish}
              onCancel={handleBackToHome}
            />
          )}
          {view === VIEW.RACE && gameMode === 'multiplayer' && (
            <MultiplayerRaceArena
              roomCode={roomCode}
              onFinish={handleFinish}
              onCancel={handleBackToHome}
            />
          )}
          {view === VIEW.RESULT && result && (
            <ResultScreen
              result={result}
              onBack={handleBackToHome}
            />
          )}
        </div>
      </div>

      {/* ── Sidebar (muncul dari kanan) ── */}
      <div style={{
        width: sidebarOpen ? '280px' : '0px',
        minWidth: 0,
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        borderLeft: sidebarOpen ? '2px solid var(--border)' : 'none',
        flexShrink: 0
      }}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onTheme={() => setModal('theme')}
          onLeaderboard={() => setModal('leaderboard')}
          onShop={() => setModal('shop')}
          onProfile={() => setModal('profile')}
        />
      </div>

      {/* ── Modals ── */}
      {modal === 'theme' && (
        <ThemeModal
          current={theme}
          onSelect={setTheme}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'profile' && (
        <ProfileModal
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'shop' && (
        <ShopModal
          ownedVehicles={ownedVehicles}
          equippedVehicle={equippedVehicle}
          onBuy={(id) => {
            setOwnedVehicles(prev => [...prev, id]);
          }}
          onEquip={setEquippedVehicle}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'multiplayer' && (
        <MultiplayerModal
          onClose={() => setModal(null)}
          onStartRace={handleMultiplayerRaceStart}
        />
      )}
      {modal === 'leaderboard' && (
        <LeaderboardModal
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
