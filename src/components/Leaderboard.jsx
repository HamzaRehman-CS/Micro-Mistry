import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leaderboard({ onBack }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/leaderboard', { cache: 'no-store' });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Preview Mode: Local leaderboard is unavailable on the web.');
      }
      if (!response.ok) throw new Error('The local leaderboard server is unavailable.');
      const data = await response.json();
      setLeaders(data.entries);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    loadLeaderboard();
  }, []);

  const renderStars = (score) => {
    const total = 5;
    const filled = Math.max(0, Math.min(total, score || 0));
    return (
      <div style={{ display: 'flex', gap: '2px', color: '#c59b27', fontSize: '0.9rem', marginTop: '2px' }}>
        {[...Array(total)].map((_, i) => (
          <span key={i} style={{ opacity: i < filled ? 1 : 0.25 }}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-col h-full p-4 md:p-8" style={{ overflowY: 'auto', minHeight: '100vh', background: 'var(--bg-ivory)' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '720px', margin: '0 auto 1.5rem auto' }}>
        <button 
          className="btn" 
          style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem', background: '#fff' }} 
          onClick={onBack}
        >
          ← RETURN
        </button>

        <button className="btn" style={{ padding: '0.6rem 1rem', fontSize: '0.8rem' }} onClick={loadLeaderboard}>REFRESH</button>
      </div>

      <div className="flex-col flex-1 gap-6 w-full max-w-2xl mx-auto" style={{ paddingBottom: '3rem' }}>
        {/* Emblem & Title */}
        <div className="text-center flex-col flex-center gap-2">
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            border: '2px solid #c59b27', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#c59b27',
            fontSize: '1.5rem',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(197, 155, 39, 0.2)'
          }}>
            ✦
          </div>
          <h1 className="title-display" style={{ fontSize: 'clamp(2.2rem, 6vw, 3.4rem)', color: 'var(--forest-green)', margin: 0 }}>
            HALL OF FAME
          </h1>
          <div style={{ 
            fontFamily: 'var(--font-serif)', 
            fontStyle: 'italic', 
            color: 'var(--deep-burgundy)', 
            fontSize: '0.95rem',
            letterSpacing: '0.04em'
          }}>
            Registry of Master Observers & Naturalists
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            letterSpacing: '0.15em', 
            textTransform: 'uppercase', 
            color: '#777', 
            marginTop: '0.2rem',
            padding: '0.2rem 0.8rem',
            borderBottom: '1px solid #dcd7c9'
          }}>
            {leaders.length} EXPEDITIONS RECORDED
          </div>
        </div>

        {loading || error || leaders.length === 0 ? (
          <div 
            className="specimen-card text-center flex-col flex-center gap-3" 
            style={{ marginTop: '2rem', padding: '3rem 2rem', background: '#fff', border: '1px solid #dcd7c9' }}
          >
            <div style={{ fontSize: '2.5rem', color: '#c59b27' }}>✧</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--forest-green)', fontFamily: 'var(--font-serif)' }}>
              {loading ? 'LOADING THE BOARD' : error ? 'BOARD UNAVAILABLE' : 'NO SPECIMENS CATALOGED YET'}
            </h3>
            <p style={{ color: '#666', fontSize: '0.95rem', fontStyle: 'italic', maxWidth: '320px' }}>
              {error || (loading ? 'Fetching completed attempts…' : 'Be the first to finish the challenge and claim a place here.')}
            </p>
          </div>
        ) : (
          <div className="flex-col gap-4">
            <AnimatePresence>
              {leaders.map((entry, index) => {
                const rank = index + 1;
                const isMaster = (entry.score || 0) === 5;
                const isTopThree = rank <= 3;

                return (
                  <motion.div
                    key={entry.id || `${entry.name}-${index}`}
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      background: isMaster ? 'linear-gradient(135deg, #ffffff 0%, #fbf8ee 100%)' : '#ffffff',
                      border: isMaster ? '2px solid #c59b27' : '1px solid #dcd7c9',
                      boxShadow: isMaster 
                        ? '0 8px 24px rgba(197, 155, 39, 0.18)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.04)',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '4px',
                      gap: '1rem',
                      position: 'relative'
                    }}
                  >
                    {/* Left Details: Rank Medallion + Name & ID */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', minWidth: 0 }}>
                      {/* Medallion */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        border: isMaster ? '2px solid #c59b27' : isTopThree ? '2px solid var(--forest-green)' : '1px solid #bbb',
                        background: isMaster ? '#fff9e6' : isTopThree ? '#f2f8f5' : '#f9f9f9',
                        color: isMaster ? '#b8860b' : isTopThree ? 'var(--forest-green)' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        flexShrink: 0
                      }}>
                        №{rank}
                      </div>

                      {/* Participant Text */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1.35rem',
                            fontWeight: 700,
                            color: 'var(--forest-green)',
                            lineHeight: 1.2,
                            wordBreak: 'break-word'
                          }}>
                            {entry.name}
                          </span>
                          
                          {isMaster && (
                            <span style={{
                              background: '#c59b27',
                              color: '#ffffff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '2px',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase'
                            }}>
                              MASTER OBSERVER
                            </span>
                          )}
                        </div>

                        {/* University ID Tag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-sans)',
                            color: 'var(--deep-burgundy)',
                            fontWeight: 600,
                            background: '#faf0f2',
                            padding: '0.15rem 0.5rem',
                            border: '1px solid rgba(74, 10, 24, 0.15)',
                            borderRadius: '2px',
                            letterSpacing: '0.03em'
                          }}>
                            UNIVERSITY ID: {entry.universityId || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Details: Score & Star Rating */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      flexShrink: 0,
                      paddingLeft: '0.5rem'
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        color: isMaster ? '#b8860b' : 'var(--forest-green)',
                        lineHeight: 1
                      }}>
                        {entry.score}/5
                      </div>
                      {renderStars(entry.score)}
                      <span style={{
                        fontSize: '0.65rem',
                        letterSpacing: '0.08em',
                        color: '#888',
                        textTransform: 'uppercase',
                        marginTop: '0.2rem',
                        fontFamily: 'var(--font-sans)'
                      }}>
                        {isMaster ? 'PERFECT' : 'IDENTIFIED'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
