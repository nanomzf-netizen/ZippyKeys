import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage({ onBack }) {
  const { register, login, loginWithGoogle, registerWithGoogle } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [showEmailReg, setShowEmailReg] = useState(false);
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

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);

    const result = await loginWithGoogle();
    
    if (result.success) {
      onBack();
    } else {
      setError(result.error || 'Gagal login dengan Google.');
    }
    
    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setError('');

    if (regUsername.trim().length < 3) {
      setError('Masukkan username (min. 3 karakter) sebelum daftar dengan Google');
      return;
    }

    setLoading(true);

    const result = await registerWithGoogle(regUsername);
    
    if (result.success) {
      onBack();
    } else {
      setError(result.error || 'Gagal mendaftar dengan Google.');
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
      padding: '10px 20px',
      overflow: 'hidden',
      height: '100vh',
      boxSizing: 'border-box'
    }}>
      {/* Logo Header */}
      <h1 style={{
        fontSize: 'clamp(24px, 6vw, 42px)',
        fontWeight: '900',
        color: 'var(--text-h)',
        letterSpacing: '2px',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        Zippy<span style={{ color: 'var(--primary)' }}>Keys</span>
      </h1>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
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
            setShowEmailReg(false);
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
        maxWidth: '400px',
        padding: '20px 24px',
        borderWidth: '2.5px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 180px)',
        overflowY: 'auto'
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
              fontSize: '20px',
              fontWeight: '900',
              color: 'var(--text-h)',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              MASUK KE AKUN
            </h2>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="login-email" style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '4px',
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
                  padding: '10px 14px',
                  fontSize: '14px',
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
              <label htmlFor="login-password" style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '4px',
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
                  padding: '10px 14px',
                  fontSize: '14px',
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
                padding: '12px',
                fontSize: '15px',
                fontWeight: '900',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-fg)',
                border: '2.5px solid var(--border)',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '3px 3px 0 var(--shadow-color)',
                transition: 'all 0.2s',
                marginBottom: '16px'
              }}
            >
              {loading ? 'MEMPROSES...' : 'MASUK →'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '16px 0',
              color: 'var(--text-dim)',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border)' }}></div>
              <span style={{ padding: '0 10px' }}>ATAU</span>
              <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border)' }}></div>
            </div>

            <button
              type="button"
              className="brut-btn"
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '800',
                backgroundColor: 'white',
                color: '#333',
                border: '2.5px solid var(--border)',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '3px 3px 0 var(--shadow-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Lanjutkan dengan Google
            </button>

            <p style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--text-dim)',
              marginBottom: 0
            }}>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError('');
                  setShowEmailReg(false);
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
              fontSize: '20px',
              fontWeight: '900',
              color: 'var(--text-h)',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              BUAT AKUN BARU
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-username" style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-h)',
                marginBottom: '4px',
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
                  padding: '10px 14px',
                  fontSize: '14px',
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
              type="button"
              className="brut-btn"
              onClick={handleGoogleRegister}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '800',
                backgroundColor: 'white',
                color: '#333',
                border: '2.5px solid var(--border)',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '3px 3px 0 var(--shadow-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                marginBottom: '16px'
              }}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Daftar dengan Google
            </button>

            {!showEmailReg ? (
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowEmailReg(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline'
                  }}
                >
                  Atau daftar dengan Email
                </button>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '16px 0',
                  color: 'var(--text-dim)',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border)' }}></div>
                  <span style={{ padding: '0 10px' }}>DAFTAR EMAIL</span>
                  <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border)' }}></div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="reg-email" style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--text-h)',
                    marginBottom: '4px',
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
                    required={showEmailReg}
                    autoComplete="email"
                    name="email"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text-h)',
                      border: '2.5px solid var(--border)',
                      borderRadius: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="reg-password" style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: 'var(--text-h)',
                      marginBottom: '4px',
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
                      placeholder="Min 6 kar"
                      disabled={loading}
                      required={showEmailReg}
                      minLength={6}
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text-h)',
                        border: '2.5px solid var(--border)',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="reg-confirm-password" style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: 'var(--text-h)',
                      marginBottom: '4px',
                      letterSpacing: '0.5px'
                    }}>
                      KONFIRMASI
                    </label>
                    <input
                      id="reg-confirm-password"
                      type="password"
                      className="brut-input"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi"
                      disabled={loading}
                      required={showEmailReg}
                      minLength={6}
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text-h)',
                        border: '2.5px solid var(--border)',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="brut-btn"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: '900',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-fg)',
                    border: '2.5px solid var(--border)',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    boxShadow: '3px 3px 0 var(--shadow-color)',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'MEMPROSES...' : 'BUAT AKUN →'}
                </button>
              </>
            )}

            <p style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--text-dim)',
              marginBottom: 0
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
          marginTop: '16px',
          padding: '10px 20px',
          fontSize: '13px',
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
