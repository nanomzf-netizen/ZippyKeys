export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg)',
      gap: '24px',
      zIndex: 9999
    }}>
      {/* Logo */}
      <h1 style={{
        fontSize: '48px',
        fontWeight: '900',
        color: 'var(--text-h)',
        letterSpacing: '2px',
        margin: 0
      }}>
        Zippy<span style={{ color: 'var(--primary)' }}>Keys</span>
      </h1>

      {/* Loading Spinner */}
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />

      {/* Loading Text */}
      <p style={{
        fontSize: '14px',
        fontWeight: '700',
        color: 'var(--text-dim)',
        letterSpacing: '1px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        LOADING...
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
