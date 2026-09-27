import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const [stationId, setStationId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanId = stationId.trim().toUpperCase();
    const cleanPass = password.trim().toLowerCase();

    if (cleanId === 'PAFSS26' && cleanPass === 'register') {
      sessionStorage.setItem('micro_mystery_admin_auth', 'true');
      sessionStorage.setItem('micro_mystery_admin_id', cleanId);
      onLoginSuccess();
    } else {
      setError('Invalid coordinator ID or password. Access denied.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--bg-ivory)',
      boxSizing: 'border-box'
    }}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="micro-registration"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          border: '4px solid var(--text-graphite)',
          boxShadow: '10px 10px 0 var(--forest-green)',
          padding: '2rem 1.8rem',
          margin: 0
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: 'var(--mustard)',
            border: '3px solid var(--text-graphite)',
            borderRadius: '50%',
            marginBottom: '0.8rem',
            boxShadow: '4px 4px 0 var(--text-graphite)'
          }}>
            <ShieldCheck size={28} color="var(--text-graphite)" />
          </div>
          
          <span style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: 'var(--forest-green)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.15em',
            marginBottom: '0.6rem'
          }}>
            SCIENCE FESTA • RESTRICTED
          </span>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.9rem',
            margin: '0.2rem 0 0.4rem',
            color: 'var(--text-graphite)',
            letterSpacing: '-0.03em'
          }}>
            COORDINATOR LOGIN
          </h2>

          <p style={{
            fontSize: '0.85rem',
            color: '#5f5b6d',
            margin: 0,
            lineHeight: 1.4
          }}>
            Enter your authorized event credentials to access the Micro Mystery station.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="micro-field">
            <label htmlFor="station-id" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              COORDINATOR ID
            </label>
            <input
              id="station-id"
              type="text"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              placeholder="Enter Coordinator ID"
              required
              autoFocus
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0.6rem 0.8rem',
                border: '2px solid var(--text-graphite)',
                background: '#fffdf4',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="micro-field">
            <label htmlFor="station-pass" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              PASSWORD
            </label>
            <input
              id="station-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              required
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0.6rem 0.8rem',
                border: '2px solid var(--text-graphite)',
                background: '#fffdf4',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '2px solid #ef4444',
              color: '#991b1b',
              padding: '0.6rem 0.8rem',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: '46px',
              padding: '0.8rem',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              background: 'var(--deep-burgundy)',
              color: '#fff',
              border: '2px solid var(--text-graphite)',
              boxShadow: '4px 4px 0 var(--text-graphite)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Lock size={16} /> ENTER STATION
          </button>
        </form>
      </motion.div>
    </div>
  );
}
