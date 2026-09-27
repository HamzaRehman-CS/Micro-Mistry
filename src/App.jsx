import { useEffect, useState } from 'react';
import Landing from './components/Landing';
import Challenge from './components/Challenge';
import Result from './components/Result';
import Leaderboard from './components/Leaderboard';
import BrandBar from './components/BrandBar';
import AdminLogin from './components/AdminLogin';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('micro_mystery_admin_auth') === 'true';
  });

  const [screen, setScreen] = useState('landing');
  const [playerInfo, setPlayerInfo] = useState({ name: '', universityId: '', number: '' });
  const [score, setScore] = useState(0);
  const [attemptId, setAttemptId] = useState('');

  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, [screen]);

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setScreen('landing');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('micro_mystery_admin_auth');
    sessionStorage.removeItem('micro_mystery_admin_id');
    setIsAdminAuthenticated(false);
    setScreen('landing');
  };

  const startChallenge = (info) => {
    setPlayerInfo(info);
    setAttemptId(crypto.randomUUID());
    setScore(0);
    setScreen('challenge');
  };

  const endChallenge = (finalScore) => {
    setScore(finalScore);
    setScreen('result');
  };

  const reset = () => {
    setScreen('landing');
  };

  // If coordinator is not logged in, show Admin Login at the front screen
  if (!isAdminAuthenticated) {
    return (
      <AdminLogin onLoginSuccess={handleLoginSuccess} />
    );
  }

  // Once authenticated, coordinator has full access to the entire application
  return (
    <>
      <BrandBar onLogout={handleLogout} />
      {screen === 'landing' && (
        <Landing 
          onStart={startChallenge} 
          onViewLeaderboard={() => setScreen('leaderboard')} 
        />
      )}
      {screen === 'challenge' && (
        <Challenge 
          onComplete={endChallenge} 
          onCancel={reset} 
        />
      )}
      {screen === 'result' && (
        <Result 
          score={score} 
          player={playerInfo} 
          attemptId={attemptId} 
          onReset={reset} 
          onViewLeaderboard={() => setScreen('leaderboard')} 
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard 
          onBack={() => setScreen('landing')} 
        />
      )}
    </>
  );
}

export default App;
