import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileModal({ onClose }) {
  const { username } = useAuth();

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="modal brut-card">
        <div className="modal-header">
          <h2 className="modal-title" id="profile-modal-title">PROFIL RACER 🏎️</h2>
          <button className="modal-close" onClick={onClose} aria-label="Tutup modal profil">×</button>
        </div>

        <div className="profile-form">
          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            border: '2px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
            <div style={{
              fontSize: '20px',
              fontWeight: '900',
              color: 'var(--text-h)',
              marginBottom: '8px'
            }}>
              {username}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-dim)',
              fontWeight: '600'
            }}>
              Username Anda
            </div>
          </div>
          
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'var(--bg)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-dim)',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            ℹ️ Username tidak dapat diubah setelah login
          </div>
        </div>
      </div>
    </div>
  );
}
