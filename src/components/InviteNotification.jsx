import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';

export default function InviteNotification({ onJoinRoom }) {
  const { user, isLoggedIn } = useAuth();
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const unsubscribe = RoomService.listenToInvites(user.uid, (newInvites) => {
      setInvites(newInvites);
    });

    return () => unsubscribe();
  }, [isLoggedIn, user]);

  const handleAccept = async (invite) => {
    const result = await RoomService.acceptInvite(user.uid, invite.id);
    if (result.success) {
      // Join the room
      const joinResult = await RoomService.joinRoom(result.roomCode, user.uid, user.displayName || 'Player');
      if (joinResult.success) {
        onJoinRoom(result.roomCode);
      }
    }
  };

  const handleReject = async (invite) => {
    await RoomService.rejectInvite(user.uid, invite.id);
  };

  if (invites.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '24px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px'
    }}>
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="brut-card"
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--card)',
            border: '3px solid var(--accent)',
            borderRadius: '16px',
            boxShadow: '4px 4px 0 var(--shadow-color)',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '900',
              color: 'var(--accent)',
              marginBottom: '6px'
            }}>
              🎮 UNDANGAN BALAPAN!
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-h)'
            }}>
              <strong>{invite.from}</strong> mengajakmu balapan!
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-dim)',
              marginTop: '4px'
            }}>
              Kode Room: <strong>{invite.roomCode}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-primary"
              onClick={() => handleAccept(invite)}
              style={{
                flex: 1,
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '800'
              }}
            >
              ✓ TERIMA
            </button>
            <button
              className="btn-cancel"
              onClick={() => handleReject(invite)}
              style={{
                flex: 1,
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '800'
              }}
            >
              ✕ TOLAK
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
