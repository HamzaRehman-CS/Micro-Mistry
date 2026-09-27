import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Trash2, Search, CheckCircle2, AlertOctagon, X } from 'lucide-react';
import { 
  fetchLeaderboardEntries, 
  downloadAttemptsCsv, 
  deleteAttemptByUniversityId, 
  clearAllLeaderboardAttempts, 
  searchAttempts 
} from '../lib/supabase';

export default function Leaderboard({ onBack }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Admin Tools Panels
  const [showAdminTools, setShowAdminTools] = useState(false);

  // Delete Attempt State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const [targetToDelete, setTargetToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear Leaderboard State
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [clearError, setClearError] = useState('');
  const [clearSuccess, setClearSuccess] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const loadLeaderboard = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const res = await fetchLeaderboardEntries();
      setLeaders(res.entries || []);
    } catch (cause) {
      if (!isBackground) setError(cause.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    const handleUpdate = () => loadLeaderboard(true);
    window.addEventListener('leaderboard-updated', handleUpdate);
    const interval = setInterval(() => {
      loadLeaderboard(true);
    }, 8000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('leaderboard-updated', handleUpdate);
    };
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAttemptsCsv();
    } catch (err) {
      alert('Error downloading CSV: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchMsg('');
    setTargetToDelete(null);
    setDeleteSuccess('');

    try {
      const results = await searchAttempts(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setSearchMsg(`No active attempts found matching "${searchQuery}".`);
      }
    } catch (err) {
      setSearchMsg('Error searching: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteAttempt = async (e) => {
    e.preventDefault();
    setDeleteError('');
    if (deletePassword.trim().toLowerCase() !== 'register') {
      setDeleteError('Incorrect password. Access denied.');
      return;
    }

    if (!targetToDelete) return;
    setIsDeleting(true);

    try {
      await deleteAttemptByUniversityId(targetToDelete.university_id);
      setDeleteSuccess(`✓ Attempt for ${targetToDelete.name} (${targetToDelete.university_id}) was deleted!`);
      setTargetToDelete(null);
      setDeletePassword('');
      loadLeaderboard(true);
      const updated = searchResults.filter(r => r.university_id.toLowerCase() !== targetToDelete.university_id.toLowerCase());
      setSearchResults(updated);
    } catch (err) {
      setDeleteError('Failed to delete attempt: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllSubmit = async (e) => {
    e.preventDefault();
    setClearError('');
    if (clearPassword.trim().toLowerCase() !== 'register') {
      setClearError('Incorrect password. Access denied.');
      return;
    }

    setIsClearing(true);
    try {
      await clearAllLeaderboardAttempts();
      setClearSuccess('✓ Hall of Fame cleared! All attempts reset to zero.');
      setShowClearConfirm(false);
      setClearPassword('');
      setSearchResults([]);
      loadLeaderboard(true);
    } catch (err) {
      setClearError('Failed to clear leaderboard: ' + err.message);
    } finally {
      setIsClearing(false);
    }
  };

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
    <div className="flex-col h-full p-4 md:p-8" style={{ overflowY: 'auto', minHeight: '100vh', background: 'var(--bg-ivory)', boxSizing: 'border-box' }}>
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '820px', margin: '0 auto 1.2rem auto', flexWrap: 'wrap', gap: '0.6rem' }}>
        <button 
          className="btn" 
          style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', background: '#fff' }} 
          onClick={onBack}
        >
          ← RETURN
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            className="btn btn-primary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={15} /> {downloading ? 'EXPORTING…' : 'EXPORT CSV'}
          </button>

          <button 
            className="btn"
            style={{ 
              padding: '0.55rem 1rem', 
              fontSize: '0.82rem', 
              background: showAdminTools ? 'var(--mustard)' : '#fff',
              border: '2px solid var(--text-graphite)'
            }}
            onClick={() => setShowAdminTools(!showAdminTools)}
          >
            {showAdminTools ? 'CLOSE TOOLS' : 'MANAGE BOARD'}
          </button>

          <button 
            className="btn" 
            style={{ padding: '0.55rem 0.9rem', fontSize: '0.82rem', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }} 
            onClick={() => loadLeaderboard(false)}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> REFRESH
          </button>
        </div>
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

        {/* ADMIN TOOLS PANEL (Expandable) */}
        {showAdminTools && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="specimen-card flex-col gap-4"
            style={{ 
              background: '#fffdf4', 
              border: '3px solid var(--text-graphite)', 
              boxShadow: '6px 6px 0 var(--forest-green)',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e0dfd5', paddingBottom: '0.5rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-graphite)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ADMIN BOARD CONTROLS
              </div>
              <button 
                className="btn" 
                style={{ padding: '0.2rem 0.5rem', background: '#fff' }} 
                onClick={() => setShowAdminTools(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Sub-tool A: Delete attempt by University ID */}
            <div style={{ background: '#fff', border: '2px solid #e0dfd5', padding: '0.9rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <Trash2 size={16} /> Delete Attempt by University ID
              </div>
              <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
                Search for an attempt by University ID or Name to remove it from the Hall of Fame.
              </p>

              {deleteSuccess && (
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.5rem', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={15} /> {deleteSuccess}
                </div>
              )}

              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter University ID (e.g. 21-SE-105)"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', border: '2px solid var(--text-graphite)', background: '#fffdf4' }}
                />
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={isSearching || !searchQuery.trim()} 
                  style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', background: '#fff' }}
                >
                  <Search size={14} /> {isSearching ? 'FINDING…' : 'SEARCH'}
                </button>
              </form>

              {searchMsg && (
                <div style={{ fontSize: '0.8rem', color: '#b45309', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                  {searchMsg}
                </div>
              )}

              {searchResults.length > 0 && !targetToDelete && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', background: '#fcfcfc', border: '1px solid #ddd', padding: '0.4rem' }}>
                  {searchResults.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: '#fff', border: '1px solid #e0dfd5' }}>
                      <div style={{ fontSize: '0.82rem' }}>
                        <strong>{item.name}</strong> • ID: <code>{item.university_id}</code>
                        <div style={{ color: '#666', fontSize: '0.75rem' }}>
                          Score: {item.score}/5 | Correct: {item.correct}
                        </div>
                      </div>
                      <button 
                        className="btn" 
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderColor: '#b91c1c' }}
                        onClick={() => {
                          setTargetToDelete(item);
                          setDeleteError('');
                          setDeletePassword('');
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {targetToDelete && (
                <form onSubmit={handleDeleteAttempt} style={{ background: '#fef2f2', border: '2px solid #ef4444', padding: '0.7rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#991b1b', fontWeight: 700 }}>
                    Confirm deletion for: {targetToDelete.name} ({targetToDelete.university_id})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#7f1d1d' }}>
                    Enter password (<code>register</code>) to erase this attempt:
                  </div>
                  <input 
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password (register)"
                    required
                    autoFocus
                    style={{ padding: '0.45rem', fontSize: '0.85rem', border: '2px solid #ef4444' }}
                  />
                  {deleteError && (
                    <div style={{ color: '#b91c1c', fontSize: '0.76rem', fontWeight: 600 }}>
                      {deleteError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      type="submit" 
                      disabled={isDeleting}
                      className="btn" 
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', background: '#dc2626', color: '#fff' }}
                    >
                      {isDeleting ? 'DELETING…' : 'CONFIRM DELETE'}
                    </button>
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', background: '#fff' }}
                      onClick={() => setTargetToDelete(null)}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Sub-tool B: Clear Entire Board */}
            <div style={{ background: '#fff', border: '2px solid #fca5a5', padding: '0.9rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <AlertOctagon size={16} /> Reset / Clear Entire Hall of Fame
              </div>
              <p style={{ fontSize: '0.8rem', color: '#7f1d1d', margin: '0 0 0.6rem 0' }}>
                Permanently wipes all participant records from the Hall of Fame. Requires coordinator password.
              </p>

              {clearSuccess && (
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.5rem', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={15} /> {clearSuccess}
                </div>
              )}

              {!showClearConfirm ? (
                <button 
                  className="btn" 
                  style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem', background: '#fff', color: '#dc2626', borderColor: '#dc2626' }}
                  onClick={() => {
                    setShowClearConfirm(true);
                    setClearError('');
                    setClearPassword('');
                  }}
                >
                  CLEAR ALL ATTEMPTS (RESET)
                </button>
              ) : (
                <form onSubmit={handleClearAllSubmit} style={{ background: '#fef2f2', border: '2px solid #dc2626', padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#991b1b', fontWeight: 700 }}>
                    ⚠️ Enter password (<code>register</code>) to erase all records:
                  </div>
                  <input 
                    type="password"
                    value={clearPassword}
                    onChange={(e) => setClearPassword(e.target.value)}
                    placeholder="Enter password (register)"
                    required
                    autoFocus
                    style={{ padding: '0.45rem', fontSize: '0.85rem', border: '2px solid #dc2626' }}
                  />
                  {clearError && (
                    <div style={{ color: '#b91c1c', fontSize: '0.76rem', fontWeight: 600 }}>
                      {clearError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      type="submit" 
                      disabled={isClearing}
                      className="btn" 
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', background: '#dc2626', color: '#fff' }}
                    >
                      {isClearing ? 'CLEARING…' : 'YES, CLEAR BOARD'}
                    </button>
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', background: '#fff' }}
                      onClick={() => setShowClearConfirm(false)}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {/* Leaderboard Entries List */}
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
              {error || (loading ? 'Fetching completed attempts…' : 'Complete the challenge to claim the first spot in the Hall of Fame.')}
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
