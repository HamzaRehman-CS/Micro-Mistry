export default function BrandBar({ onLogout }) {
  return (
    <header className="brand-bar" aria-label="Event organizers">
      {/* University Logo on the LEFT */}
      <div className="brand-mark brand-university">
        <img 
          src="/brand/university.png" 
          alt="PAF-IAST Skilling Pakistan"
          style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Right: Optional Logout + Society Logo on the RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onLogout && (
          <button 
            className="btn" 
            style={{ 
              padding: '0.35rem 0.8rem', 
              fontSize: '0.75rem', 
              background: '#fff',
              border: '2px solid var(--text-graphite)'
            }}
            onClick={onLogout}
            title="Coordinator Logout"
          >
            LOGOUT
          </button>
        )}
        <div className="brand-mark brand-society">
          <img 
            src="/brand/society.png" 
            alt="PAF-IAST Science Society"
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
      </div>
    </header>
  );
}
