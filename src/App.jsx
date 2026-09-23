import { useEffect, useState } from 'react';
import Landing from './components/Landing';
import Challenge from './components/Challenge';
import Result from './components/Result';
import Leaderboard from './components/Leaderboard';
import BrandBar from './components/BrandBar';

function App() {
  const [screen, setScreen] = useState('landing');
  const [playerInfo, setPlayerInfo] = useState({ name: '', universityId: '', email: '', number: '' });
  const [score, setScore] = useState(0);
  const [attemptId, setAttemptId] = useState('');
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

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

  return (
    <>
      <BrandBar />
      {screen === 'landing' && <Landing onStart={startChallenge} onViewLeaderboard={() => setScreen('leaderboard')} />}
      {screen === 'challenge' && <Challenge onComplete={endChallenge} onCancel={reset} />}
      {screen === 'result' && <Result score={score} player={playerInfo} attemptId={attemptId} onReset={reset} onViewLeaderboard={() => setScreen('leaderboard')} />}
      {screen === 'leaderboard' && <Leaderboard onBack={() => setScreen('landing')} />}
    </>
  );
}

export default App;
