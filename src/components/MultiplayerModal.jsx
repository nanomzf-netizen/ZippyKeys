import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';

export default function MultiplayerModal({ onClose, onStartRace }) {
  const { user, username, isLoggedIn } = useAuth();
  const [view, setView] = useState('menu'); // menu | lobby | search
  const [joinCode, setJoinCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Lobby state
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState({});
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen to room updates when in lobby
  useEffect(() => {
    if (view === 'lobby' && roomCode) {
      const unsubscribe = RoomService.listenToRoom(roomCode, ({ exists, data }) => {
        if (exists && data) {
          setCurrentRoom(data);
          setPlayers(data.players || {});
          
          // Auto-start race for ALL players when status changes to 'racing'
          if (data.status === 'racing' && view === 'lobby') {
            // Langsung pindah ke race screen untuk SEMUA pemain
            onStartRace(data.settings, roomCode);
            onClose();
          }
        } else {
          // Room deleted
          setError('Room telah ditutup');
          setTimeout(() => {
            setView('menu');
            setRoomCode('');
          }, 2000);
        }
      });

      return () => unsubscribe();
    }
  }, [view, roomCode, onStartRace, onClose]);

  // Cleanup: leave room on unmount
  useEffect(() => {
    return () => {
      if (roomCode && user) {
        RoomService.leaveRoom(roomCode, user.uid);
      }
    };
  }, [roomCode, user]);

  const handleCreateLobby = async () => {
    if (!isLoggedIn) {
      setError('Silakan login terlebih dahulu');
      return;
    }

    setLoading(true);
    setError('');

    const settings = {
      duration: '30',
      textMode: 'words',
      textCategory: 'english'
    };

    const result = await RoomService.createRoom(user.uid, username, settings);
    
    if (result.success) {
      setRoomCode(result.roomCode);
      setCurrentRoom(result.room);
      setView('lobby');
    } else {
      setError(result.error || 'Gagal membuat room');
    }
    
    setLoading(false);
  };

  const handleJoinLobby = async () => {
    if (!isLoggedIn) {
      setError('Silakan login terlebih dahulu');
      return;
    }

    if (joinCode.length < 6) {
      setError('Kode room harus 6 karakter');
      return;
    }

    setLoading(true);
    setError('');

    const result = await RoomService.joinRoom(joinCode, user.uid, username);
    
    if (result.success) {
      setRoomCode(joinCode);
      setView('lobby');
    } else {
      setError(result.error || 'Gagal bergabung ke room');
    }
    
    setLoading(false);
  };

  const handleSearchUsers = async () => {
    if (searchQuery.trim().length < 2) {
      setError('Minimal 2 karakter untuk mencari');
      return;
    }

    setSearching(true);
    setError('');
    
    const results = await RoomService.searchUsers(searchQuery);
    setSearchResults(results.filter(r => r.userId !== user?.uid)); // Exclude self
    setSearching(false);
    
    if (results.length === 0) {
      setError('Tidak ditemukan pengguna dengan username tersebut');
    }
  };

  const handleInviteUser = async (targetUserId) => {
    if (!roomCode) {
      // Create room first if not exists
      await handleCreateLobby();
      // Wait a bit for room creation
      setTimeout(async () => {
        const result = await RoomService.sendInvite(user.uid, username, targetUserId, roomCode);
        if (result.success) {
          setError('');
          alert(`Undangan terkirim! ✅`);
        } else {
          setError(result.error || 'Gagal mengirim undangan');
        }
      }, 500);
    } else {
      const result = await RoomService.sendInvite(user.uid, username, targetUserId, roomCode);
      if (result.success) {
        setError('');
        alert(`Undangan terkirim ke room ${roomCode}! ✅`);
      } else {
        setError(result.error || 'Gagal mengirim undangan');
      }
    }
  };

  const handleToggleReady = async () => {
    if (!user || !roomCode) return;
    
    const currentPlayer = players[user.uid];
    if (!currentPlayer) return;

    await RoomService.setPlayerReady(roomCode, user.uid, !currentPlayer.isReady);
  };

  const handleStartRace = async () => {
    if (!currentRoom) return;

    // Check if all players are ready
    const allReady = Object.values(players).every(p => p.isReady);
    if (!allReady) {
      setError('Semua pemain harus ready!');
      return;
    }

    const result = await RoomService.startRace(roomCode);
    if (result.success) {
      // Navigate to race screen with room settings
      onStartRace(currentRoom.settings, roomCode);
      onClose();
    } else {
      setError(result.error || 'Gagal memulai race');
    }
  };

  const handleLeaveLobby = async () => {
    if (user && roomCode) {
      await RoomService.leaveRoom(roomCode, user.uid);
    }
    setView('menu');
    setRoomCode('');
    setCurrentRoom(null);
    setPlayers({});
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playerCount = Object.keys(players).length;
  const isHost = currentRoom?.createdBy === username;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mp-modal-title">
      <div className="modal modal-lg brut-card">
        <div className="modal-header">
          <h2 className="modal-title" id="mp-modal-title">🌐 MULTIPLAYER LOBBY</h2>
          <button className="modal-close" onClick={onClose} aria-label="Tutup multiplayer">×</button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(var(--danger-rgb), 0.1)',
            border: '2px solid var(--danger)',
            borderRadius: '12px',
            color: 'var(--danger)',
            fontWeight: '700',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {view === 'menu' && (
          <div className="mp-actions">
            <button
              className="brut-btn"
              onClick={handleCreateLobby}
              disabled={loading || !isLoggedIn}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-fg)',
                justifyContent: 'center',
                opacity: loading || !isLoggedIn ? 0.6 : 1
              }}
            >
              {loading ? '⏳ MEMBUAT...' : '+ BUAT ROOM BARU'}
            </button>

            <div className="mp-join-row">
              <input
                className="brut-input"
                type="text"
                placeholder="MASUKKAN KODE ROOM (6 KARAKTER)"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={!isLoggedIn}
                aria-label="Kode room"
              />
              <button
                className="brut-btn"
                disabled={joinCode.length < 6 || loading || !isLoggedIn}
                style={{
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--secondary-fg)',
                  opacity: joinCode.length < 6 || loading || !isLoggedIn ? 0.6 : 1
                }}
                onClick={handleJoinLobby}
                aria-label="Gabung room"
              >
                GABUNG 🏎️
              </button>
            </div>

            <div className="mp-divider">ATAU</div>

            <section aria-label="Cari dan ajak teman">
              <p style={{
                fontSize: 13,
                color: 'var(--text-dim)',
                marginBottom: 12,
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}>
                🔍 Cari &amp; Ajak Teman
              </p>
              <div className="mp-search-row">
                <input
                  className="brut-input"
                  type="text"
                  placeholder="Cari username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  disabled={!isLoggedIn}
                  onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
                  aria-label="Cari teman"
                />
                <button
                  className="brut-btn"
                  onClick={handleSearchUsers}
                  disabled={searching || !isLoggedIn}
                  aria-label="Mulai cari"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  {searching ? '⏳' : 'CARI'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {searchResults.map((result) => (
                    <div key={result.userId} className="friend-result brut-card" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderWidth: '2px'
                    }}>
                      <span>
                        <strong>{result.username}</strong>
                        <span style={{ color: 'var(--text-dim)', fontSize: '12px', marginLeft: '8px' }}>
                          💰 {result.coins} koin
                        </span>
                      </span>
                      <button
                        className="brut-btn"
                        style={{
                          padding: '6px 14px',
                          fontSize: 12,
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-fg)'
                        }}
                        onClick={() => handleInviteUser(result.userId)}
                        aria-label={`Ajak ${result.username}`}
                      >
                        AJAK ⚡
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {!isLoggedIn && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'var(--bg)',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                textAlign: 'center',
                color: 'var(--text-dim)',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                ℹ️ Silakan login untuk menggunakan fitur multiplayer
              </div>
            )}
          </div>
        )}

        {view === 'lobby' && (
          <div className="lobby-section">
            <div className="lobby-code-box" onClick={handleCopyCode} style={{ cursor: 'pointer' }}>
              <div>
                <div className="lobby-code-label">KODE ROOM (KLIK UNTUK SALIN)</div>
                <div className="lobby-code">{roomCode}</div>
              </div>
              <span aria-hidden="true" style={{ fontSize: 32 }}>
                {copied ? '✅' : '📋'}
              </span>
            </div>
            {copied && (
              <div style={{
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 900,
                color: 'var(--success)',
                marginTop: -12,
                marginBottom: 12
              }}>
                ✅ KODE TERSALIN!
              </div>
            )}

            <div className="lobby-players">
              <h3>PEMAIN ({playerCount}/8)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(players).map(([playerId, player]) => {
                  const isYou = playerId === user?.uid;
                  const isRoomHost = player.username === currentRoom?.createdBy;
                  
                  return (
                    <div key={playerId} className="lobby-player brut-card" style={{ borderWidth: '2.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>
                          {isRoomHost ? '👑' : '👤'}
                        </span>
                        <span className="lobby-player-name">
                          {player.username} {isYou && '(Kamu)'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: player.isReady ? 'var(--success)' : 'var(--secondary)',
                            color: player.isReady ? 'white' : 'var(--text-h)',
                            fontWeight: 900
                          }}
                        >
                          {player.isReady ? '✓ READY' : '○ WAITING'}
                        </span>

                        {isYou && (
                          <button
                            className="brut-btn"
                            style={{
                              padding: '6px 12px',
                              fontSize: 11,
                              backgroundColor: player.isReady ? 'var(--danger)' : 'var(--success)',
                              color: 'white'
                            }}
                            onClick={handleToggleReady}
                          >
                            {player.isReady ? 'BATAL' : 'SIAP'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lobby-footer">
              <button
                className="brut-btn btn-danger"
                style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                onClick={handleLeaveLobby}
                aria-label="Keluar dari room"
              >
                KELUAR ✕
              </button>
              
              {isHost && (
                <button
                  className="brut-btn"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-fg)',
                    opacity: Object.values(players).every(p => p.isReady) ? 1 : 0.6
                  }}
                  disabled={!Object.values(players).every(p => p.isReady)}
                  onClick={handleStartRace}
                  aria-label="Mulai balapan"
                >
                  MULAI BALAPAN 🏁
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
