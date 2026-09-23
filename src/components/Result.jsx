import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function Result({ score, player, attemptId, onReset, onViewLeaderboard }) {
  const safeScore = Math.max(0, Math.min(5, Number(score) || 0));
  const isPerfect = safeScore === 5;
  const hasSaved = useRef(false);
  const [saveStatus, setSaveStatus] = useState('saving');
  const [saveError, setSaveError] = useState('');

  const save = useCallback(async () => {
    setSaveStatus('saving');
    setSaveError('');
    try {
      const response = await fetch('/api/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, name: player.name, universityId: player.universityId,
          number: player.number, score: safeScore, correct: safeScore, wrong: 5 - safeScore, attempted: 5 }),
      });
      const data = await response.json();
      if (!response.ok || !data.saved) throw new Error(data.error || 'Could not update the Desktop Excel file.');
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error.message);
    }
  }, [attemptId, player, safeScore]);

  useEffect(() => {
    if (!hasSaved.current && attemptId && player?.name?.trim() && player?.universityId?.trim() && typeof score === 'number') {
      hasSaved.current = true;
      save();
    }
  }, [attemptId, player, score, save]);

  return (
    <div className="flex-col flex-center h-full p-8 text-center gap-8">
      
      {isPerfect ? (
        <motion.div 
          className="specimen-card flex-col gap-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: '600px', width: '100%', border: '4px solid var(--mustard)' }}
        >
          <div style={{ color: 'var(--mustard)', fontSize: '4rem', lineHeight: 1 }}>★</div>
          <h1 className="title-display" style={{ fontSize: '3rem', color: 'var(--text-graphite)' }}>
            YOU SOLVED THE MICRO MYSTERY
          </h1>
          <h2 style={{ color: 'var(--forest-green)', fontSize: '1.5rem', letterSpacing: '0.2em' }}>
            CERTIFICATE EARNED
          </h2>
          
          <div style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '2rem', 
            fontStyle: 'italic',
            borderTop: '1px solid #e0dfd5',
            borderBottom: '1px solid #e0dfd5',
            padding: '1.5rem 0',
            margin: '1rem 0'
          }}>
            {player.name}
          </div>

          <p style={{ fontWeight: 600 }}>SHOW THIS SCREEN TO THE EVENT TEAM</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>To receive your physical certificate signed by the Society President.</p>
        </motion.div>
      ) : (
        <motion.div 
          className="flex-col gap-6"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 style={{ fontSize: '4rem', color: 'var(--deep-burgundy)' }}>SO CLOSE!</h1>
          <div style={{ fontSize: '2rem' }}>
            YOU GOT <strong style={{ color: 'var(--forest-green)', fontSize: '3rem' }}>{safeScore}/5</strong>
          </div>
          <p style={{ fontStyle: 'italic', fontSize: '1.2rem' }}>
            The microscopic world is tricky. Better luck next time, {player.name}!
          </p>
        </motion.div>
      )}

      <div className="flex-col gap-4 w-full mt-8" style={{ maxWidth: '400px' }}>
        <p className={`save-status ${saveStatus}`} role="status">{saveStatus === 'saved' ? 'Saved to the Desktop Excel workbook.' : saveStatus === 'saving' ? 'Saving this attempt…' : saveError}</p>
        {saveStatus === 'error' && <button className="btn w-full" onClick={save}>RETRY SAVE</button>}
        <button className="btn btn-primary w-full" onClick={onReset} disabled={saveStatus !== 'saved'}>
          NEXT PARTICIPANT
        </button>
        <button className="btn w-full" onClick={onViewLeaderboard} disabled={saveStatus !== 'saved'}>
          VIEW LEADERBOARD
        </button>
      </div>

    </div>
  );
}
