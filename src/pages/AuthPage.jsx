import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage({ onBack }) {
  const { register, login } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(loginEmail, loginPassword);
    
    if (result.success) {
      // Auth context akan handle navigation otomatis
      onBack();
    } else {
      setError(result.error || 'Gagal login. Coba lagi.');
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi
    if (regUsername.trim().length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }
    if (regUsername.trim().length > 20) {
      setError('Username maksimal 20 karakter');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Password tidak sama');
      return;
    }

    setLoading(true);

    const result = await register(regEmail, regPassword, regUsername);
    
    if (result.success) {
      // Auth context akan handle navigation otomatis
      onBack();
    } else {
      setError(result.error || 'Gagal membuat akun. Coba lagi.');
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg)',
      padding: '20px',
      overflow: 'auto'
    }}>
      {/* Logo Header */}
      <h1 style={{
        fontSize: 'clamp(32px, 8vw, 56px)',
        fontWeight: '900',
        color: 'var(--text-h)',
        letterSpacing: '2px',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        Zippy<span style={{ color: 'var(--primary)' }}>Keys</span>
      </h1>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        border: '2.5px solid var(--border)',
        borderRadius: '12px',
        padding: '6px',
        backgroundColor: 'var(--bg2)'
      }}>
        <button
          onClick={() => {
            setTab('login');
            setError('');
          }}
          style={{
            padding: '10px 32px',
            fontSize: '14px',
            fontWeight: '900',
            letterSpacing: '1px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: tab === 'login' ? 'var(--primary)' : 'transparent',
            color: tab === 'login' ? 'var(--primary-fg)' : 'var(--text-dim)',
            boxShadow: tab === 'login' ? '2px 2px 0 var(--shadow-color)' : 'none'
          }}
        >
          LOGIN
        </button>
        <button
          onClick={() => {
            setTab('register');
            setError('');
          }}
          style={{
            padding: '10px 32px',
            fontSize: '14px',
            fontWeight: '900',
            letterSpacing: '1px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: tab === 'register' ? 'var(--primary)' : 'transparent',
            color: tab === 'register' ? 'var(--primary-fg)' : 'var(--text-dim)',
            boxShadow: tab === 'register' ? '2px 2px 0 var(--shadow-color)' : 'none'
          }}
        >
          DAFTAR
        </button>
      </div>

      {/* Form Card */}
      <div className="brut-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '32px',
        borderWidth: '2.5px'
      }}>
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(var(--danger-rgb, 220, 38, 38), 0.1)',
            border: '2px solid var(--danger)',
            borderRadius: '12px',
            color: 'var(--danger)',
            fontWeight: '700',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: 'var(--text-h)',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              MASUK KE AKUN
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="login-email" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                EMAIL
              </label>
              <input
                id="login-email"
                type="email"
                className="brut-input"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="contoh@email.com"
                disabled={loading}
                required
                autoComplete="email"
                name="email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-h)',
                  border: '2.5px solid var(--border)',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="login-password" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                PASSWORD
              </label>
              <input
                id="login-password"
                type="password"
                className="brut-input"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                disabled={loading}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-h)',
                  border: '2.5px solid var(--border)',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              className="brut-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '900',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-fg)',
                border: '2.5px solid var(--border)',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '3px 3px 0 var(--shadow-color)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'MEMPROSES...' : 'MASUK →'}
            </button>

            <p style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--text-dim)'
            }}>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Daftar di sini
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: 'var(--text-h)',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              BUAT AKUN BARU
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-username" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                USERNAME
              </label>
              <input
                id="reg-username"
                type="text"
                className="brut-input"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="3-20 karakter"
                disabled={loading}
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-h)',
                  border: '2.5px solid var(--border)',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-email" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                EMAIL
              </label>
              <input
                id="reg-email"
                type="email"
                className="brut-input"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="contoh@email.com"
                disabled={loading}
                required
                autoComplete="email"
                name="email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-h)',
                  border: '2.5px solid var(--border)',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-password" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                PASSWORD
              </label>
              <input
                id="reg-password"
                type="password"
                className="brut-input"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                disabled={loading}
                required
                minLength={6}
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-h)',
                  border: '2.5px solid var(--border)',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="reg-confirm-password" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                KONFIRMASI PASSWORD
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                className="brut-input"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password"
                disabled={loading}
                required
                minLength={6}
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-h)',
                  border: '2.5px solid var(--border)',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              className="brut-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '900',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-fg)',
                border: '2.5px solid var(--border)',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '3px 3px 0 var(--shadow-color)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'MEMPROSES...' : 'BUAT AKUN →'}
            </button>

            <p style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--text-dim)'
            }}>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Login di sini
              </button>
            </p>
          </form>
        )}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={loading}
        style={{
          marginTop: '24px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '700',
          background: 'transparent',
          color: 'var(--text-dim)',
          border: '2px solid var(--border)',
          borderRadius: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: loading ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.borderColor = 'var(--text-dim)';
            e.target.style.color = 'var(--text-h)';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.color = 'var(--text-dim)';
        }}
      >
        ← Kembali ke Beranda
      </button>
    </div>
  );
}
