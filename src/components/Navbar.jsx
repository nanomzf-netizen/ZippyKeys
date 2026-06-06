import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';

export default function Navbar({ onHome, onTheme, onProfile, onShop, onLeaderboard, onShowAuth }) {
  const { user, username, isLoggedIn, logout } = useAuth();
  const [coins, setCoins] = useState(0);
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);
  const btnRef    = useRef(null);

  // Listen to user coins
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setCoins(0);
      return;
    }

    const unsubscribe = RoomService.listenToUserCoins(user.uid, (newCoins) => {
      setCoins(newCoins);
    });

    return () => unsubscribe();
  }, [isLoggedIn, user]);

  // Tutup drawer kalau klik di luar
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        drawerRef.current && !drawerRef.current.contains(e.target) &&
        btnRef.current    && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Tutup drawer dengan ESC
  useEffect(() => {
    if (!open) return;
    function handleEsc(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  function handleItem(fn) {
    setOpen(false);
    fn();
  }

  return (
    <>
      {/* ── Topbar tipis ── */}
      <header className="topbar" role="banner">
        <span
          className="topbar-logo"
          onClick={onHome}
          role="link"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') onHome(); }}
          aria-label="Kembali ke Beranda"
        >
          Zippy<span>Keys</span>
        </span>

        <div className="topbar-right">
          {isLoggedIn ? (
            <>
              {/* Koin */}
              <div className="topbar-coins" aria-label={`Koin: ${coins}`}>
                <span aria-hidden="true">🪙</span>
                <span>{coins}</span>
              </div>

              {/* Username pill */}
              <div className="topbar-user">
                <span aria-hidden="true">🏎️</span>
                <span>{username}</span>
              </div>
            </>
          ) : (
            <button
              className="topbar-user"
              onClick={onShowAuth}
              style={{
                opacity: 0.8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              aria-label="Login atau Daftar"
            >
              <span aria-hidden="true">🔓</span>
              <span>LOGIN / DAFTAR</span>
            </button>
          )}

          {/* Hamburger */}
          <button
            ref={btnRef}
            className={`hamburger-btn${open ? ' is-open' : ''}`}
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="nav-drawer"
          >
            <span className="ham-line" />
            <span className="ham-line" />
            <span className="ham-line" />
          </button>
        </div>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="drawer-backdrop"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer panel ── */}
      <nav
        id="nav-drawer"
        ref={drawerRef}
        className={`nav-drawer${open ? ' nav-drawer--open' : ''}`}
        aria-label="Menu navigasi"
        aria-hidden={!open}
      >
        {/* Header drawer */}
        <div className="drawer-header">
          <span className="drawer-title">MENU</span>
          <button
            className="drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            ✕
          </button>
        </div>

        {/* Info user */}
        <div className="drawer-user-card">
          <div className="drawer-user-avatar" aria-hidden="true">
            {isLoggedIn ? '🏎️' : '🔓'}
          </div>
          <div>
            <div className="drawer-user-name">
              {isLoggedIn ? username : 'Guest'}
            </div>
            <div className="drawer-user-coins">
              {isLoggedIn ? (
                <>
                  <span aria-hidden="true">🪙</span> {coins} koin
                </>
              ) : (
                'Belum login'
              )}
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="drawer-menu" role="list">
          <button
            className="drawer-item"
            role="listitem"
            onClick={() => handleItem(onTheme)}
          >
            <span className="drawer-item-icon" aria-hidden="true">🎨</span>
            <div>
              <div className="drawer-item-label">TEMA</div>
              <div className="drawer-item-sub">Ganti tampilan UI</div>
            </div>
          </button>

          <button
            className="drawer-item"
            role="listitem"
            onClick={() => handleItem(onLeaderboard)}
          >
            <span className="drawer-item-icon" aria-hidden="true">🏆</span>
            <div>
              <div className="drawer-item-label">KLASEMEN</div>
              <div className="drawer-item-sub">Lihat ranking pemain</div>
            </div>
          </button>

          <button
            className="drawer-item"
            role="listitem"
            onClick={() => handleItem(onShop)}
          >
            <span className="drawer-item-icon" aria-hidden="true">🛒</span>
            <div>
              <div className="drawer-item-label">SHOP</div>
              <div className="drawer-item-sub">Beli kendaraan baru</div>
            </div>
          </button>

          <button
            className="drawer-item"
            role="listitem"
            onClick={() => handleItem(onProfile)}
          >
            <span className="drawer-item-icon" aria-hidden="true">👤</span>
            <div>
              <div className="drawer-item-label">PROFIL</div>
              <div className="drawer-item-sub">Edit username</div>
            </div>
          </button>

          {isLoggedIn && (
            <button
              className="drawer-item"
              role="listitem"
              onClick={() => { logout(); setOpen(false); }}
              style={{ borderColor: 'var(--danger)' }}
            >
              <span className="drawer-item-icon" aria-hidden="true">🚪</span>
              <div>
                <div className="drawer-item-label">LOGOUT</div>
                <div className="drawer-item-sub">Keluar dari akun</div>
              </div>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
