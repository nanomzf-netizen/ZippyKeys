import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';

export default function Topbar({ onHome, onTheme, onLeaderboard, onShop, onProfile, onShowAuth, onToggleSidebar }) {
  const { user, username, isLoggedIn, logout } = useAuth();
  const [coins, setCoins] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown with ESC
  useEffect(() => {
    if (!dropdownOpen) return;
    
    function handleEsc(e) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [dropdownOpen]);

  const handleMenuClick = (action) => {
    setDropdownOpen(false);
    action();
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  return (
    <header style={{
      width: '100%',
      height: '64px',
      backgroundColor: 'var(--bg2)',
      borderBottom: '2.5px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0
    }}>
      {/* Logo */}
      <div
        onClick={onHome}
        style={{
          fontSize: '24px',
          fontWeight: '900',
          letterSpacing: '1px',
          cursor: 'pointer',
          color: 'var(--text-h)',
          userSelect: 'none'
        }}
      >
        Zippy<span style={{ color: 'var(--primary)' }}>Keys</span>
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isLoggedIn ? (
          <>
            {/* Coins Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'var(--card)',
              border: '2px solid var(--border)',
              borderRadius: '999px',
              fontWeight: '700',
              fontSize: '14px',
              color: 'var(--text-h)',
              boxShadow: '2px 2px 0 var(--shadow-color)'
            }}>
              <span>🪙</span>
              <span>{coins}</span>
            </div>

            {/* Username */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--card)',
              border: '2px solid var(--border)',
              borderRadius: '999px',
              fontWeight: '700',
              fontSize: '14px',
              color: 'var(--text-h)',
              boxShadow: '2px 2px 0 var(--shadow-color)'
            }}>
              <span>🏎️</span>
              <span>{username}</span>
            </div>

            {/* Hamburger Button */}
            <button
              onClick={onToggleSidebar}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                backgroundColor: 'var(--card)',
                border: '2px solid var(--border)',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '2px 2px 0 var(--shadow-color)',
                transition: 'transform 0.2s',
                padding: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              aria-label="Toggle menu"
            >
              <div style={{
                width: '18px',
                height: '2px',
                backgroundColor: 'var(--text-h)',
                borderRadius: '1px'
              }} />
              <div style={{
                width: '18px',
                height: '2px',
                backgroundColor: 'var(--text-h)',
                borderRadius: '1px'
              }} />
              <div style={{
                width: '18px',
                height: '2px',
                backgroundColor: 'var(--text-h)',
                borderRadius: '1px'
              }} />
            </button>
          </>
        ) : (
          <button
            onClick={onShowAuth}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-fg)',
              border: '2px solid var(--border)',
              borderRadius: '999px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '2px 2px 0 var(--shadow-color)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Login / Daftar
          </button>
        )}
      </div>
    </header>
  );
}
