import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';
import { useState, useEffect } from 'react';

export default function Sidebar({ isOpen, onClose, onTheme, onLeaderboard, onShop, onProfile }) {
  const { user, username, isLoggedIn, logout } = useAuth();
  const [coins, setCoins] = useState(0);

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

  const handleMenuClick = (action) => {
    onClose();
    action();
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  if (!isLoggedIn) return null;

  return (
    <aside style={{
      width: '280px',
      height: '100vh',
      overflowY: 'auto',
      backgroundColor: 'var(--card)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '900',
          letterSpacing: '2px',
          color: 'var(--text-dim)'
        }}>
          MENU
        </span>
        <button
          onClick={onClose}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            fontSize: '18px',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label="Tutup menu"
        >
          ✕
        </button>
      </div>

      {/* User Card */}
      <div style={{
        margin: '12px',
        padding: '12px',
        backgroundColor: 'var(--bg2)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          backgroundColor: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0
        }}>
          🏎️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '700',
            color: 'var(--text-h)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {username}
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px'
          }}>
            <span>🪙</span>
            <span>{coins} koin</span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{
        flex: 1,
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <button
          onClick={() => handleMenuClick(onTheme)}
          style={{
            width: '100%',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg)',
            borderRadius: '10px',
            fontSize: '16px',
            flexShrink: 0
          }}>
            🎨
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '800',
              color: 'var(--text-h)',
              letterSpacing: '0.3px'
            }}>
              TEMA
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-dim)',
              marginTop: '1px'
            }}>
              Ganti tampilan UI
            </div>
          </div>
        </button>

        <button
          onClick={() => handleMenuClick(onLeaderboard)}
          style={{
            width: '100%',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg)',
            borderRadius: '10px',
            fontSize: '16px',
            flexShrink: 0
          }}>
            🏆
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '800',
              color: 'var(--text-h)',
              letterSpacing: '0.3px'
            }}>
              KLASEMEN
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-dim)',
              marginTop: '1px'
            }}>
              Lihat ranking pemain
            </div>
          </div>
        </button>

        <button
          onClick={() => handleMenuClick(onShop)}
          style={{
            width: '100%',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg)',
            borderRadius: '10px',
            fontSize: '16px',
            flexShrink: 0
          }}>
            🛒
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '800',
              color: 'var(--text-h)',
              letterSpacing: '0.3px'
            }}>
              SHOP
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-dim)',
              marginTop: '1px'
            }}>
              Beli kendaraan baru
            </div>
          </div>
        </button>

        <button
          onClick={() => handleMenuClick(onProfile)}
          style={{
            width: '100%',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg)',
            borderRadius: '10px',
            fontSize: '16px',
            flexShrink: 0
          }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '800',
              color: 'var(--text-h)',
              letterSpacing: '0.3px'
            }}>
              PROFIL
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-dim)',
              marginTop: '1px'
            }}>
              Edit username
            </div>
          </div>
        </button>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: 'var(--border)',
          margin: '8px 0'
        }} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderRadius: '10px',
            fontSize: '16px',
            flexShrink: 0
          }}>
            🚪
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '800',
              color: 'var(--danger)',
              letterSpacing: '0.3px'
            }}>
              LOGOUT
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-dim)',
              marginTop: '1px'
            }}>
              Keluar dari akun
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
