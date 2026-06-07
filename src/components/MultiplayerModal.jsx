import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';

export default function MultiplayerModal({ onClose, onStartRace }) {
  const { user, username, isLoggedIn } = useAuth();
  const [view, setView] = useState('menu'); // menu | lobby
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

  // Settings local state (sync with DB)
  const [settings, setSettings] = useState({
    textCategory: 'indonesian',
    textMode: 'words',
    duration: '30'
  });

  // Listen to room updates when in lobby
  useEffect(() => {
    if (view === 'lobby' && roomCode) {
      const unsubscribe = RoomService.listenToRoom(roomCode, ({ exists, data }) => {
        if (exists && data) {
          setCurrentRoom(data);
          setPlayers(data.players || {});
          setSettings(data.settings || settings);
          
          if (data.status === 'racing' && view === 'lobby') {
            onStartRace(data.settings, roomCode);
            onClose();
          }
        } else {
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

    const initSettings = {
      duration: '30',
      textMode: 'words',
      textCategory: 'indonesian'
    };

    const result = await RoomService.createRoom(user.uid, username, initSettings);
    
    if (result.success) {
      setRoomCode(result.roomCode);
      setCurrentRoom(result.room);
      setSettings(initSettings);
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
      // Let the listener update settings and currentRoom when joined
      setView('lobby');
    } else {
      setError(result.error || 'Gagal bergabung ke room');
    }
    
    setLoading(false);
  };

  const handleUpdateSetting = async (key, value) => {
    if (!isHost) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await RoomService.updateRoomSettings(roomCode, newSettings);
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
      setError('Tidak ditemukan pengguna');
    }
  };

  const handleInviteUser = async (targetUserId) => {
    if (!roomCode) return;
    
    const result = await RoomService.sendInvite(user.uid, username, targetUserId, roomCode);
    if (result.success) {
      setError('');
      alert(`Undangan terkirim! ✅`);
    } else {
      setError(result.error || 'Gagal mengirim undangan');
    }
  };

  const handleToggleRole = async (targetUserId, currentRole) => {
    if (!isHost) return;
    const newRole = currentRole === 'racer' ? 'spectator' : 'racer';
    await RoomService.setPlayerRole(roomCode, targetUserId, newRole);
  };

  const handleKickPlayer = async (targetUserId) => {
    if (!isHost) return;
    await RoomService.leaveRoom(roomCode, targetUserId);
  };

  const handleStartRace = async () => {
    if (!currentRoom) return;

    // Optional: check if at least one player is racer
    const racers = Object.values(players).filter(p => p.role === 'racer' || p.role === undefined);
    if (racers.length === 0) {
      setError('Harus ada setidaknya satu peserta balap!');
      return;
    }

    const result = await RoomService.startRace(roomCode);
    if (result.success) {
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

  // Render 4 slots
  const renderPlayerSlots = () => {
    const slots = [];
    const playerEntries = Object.entries(players);
    
    for (let i = 0; i < 4; i++) {
      if (i < playerEntries.length) {
        const [playerId, player] = playerEntries[i];
        const isYou = playerId === user?.uid;
        const role = player.role || 'racer';
        const isRacer = role === 'racer';
        const isPlayerHost = currentRoom?.createdBy === player.username;
        
        slots.push(
          <div key={playerId} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px', border: '3px solid black', borderRadius: '12px',
            marginBottom: '12px', backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E2E8F0',
                border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} alt="avatar" style={{ width: '100%', height: '100%' }} />
              </div>
              <div>
                <div style={{ fontWeight: '800', color: 'black', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🏎️ {player.username} {isYou && '(Kamu)'}
                </div>
                {isPlayerHost && (
                  <div style={{ 
                    display: 'inline-block', fontSize: '10px', color: 'white', backgroundColor: '#EC4899', 
                    fontWeight: '800', padding: '4px 8px', borderRadius: '12px', marginTop: '4px',
                    border: '2px solid black'
                  }}>
                    Host Lobi
                  </div>
                )}
                {!isPlayerHost && !isRacer && (
                  <div style={{ 
                    display: 'inline-block', fontSize: '10px', color: 'black', backgroundColor: '#E2E8F0', 
                    fontWeight: '800', padding: '4px 8px', borderRadius: '12px', marginTop: '4px',
                    border: '2px solid black'
                  }}>
                    Penonton
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {isHost && !isYou && (
                <>
                  <button onClick={() => handleToggleRole(playerId, role)} style={{
                    padding: '6px 10px', fontSize: '12px', fontWeight: '800', borderRadius: '8px',
                    border: '2px solid black', background: 'white', cursor: 'pointer',
                    boxShadow: '2px 2px 0px black'
                  }}>
                    {isRacer ? '👁️' : '🏎️'}
                  </button>
                  <button onClick={() => handleKickPlayer(playerId)} style={{
                    padding: '6px 10px', fontSize: '12px', fontWeight: '900', borderRadius: '8px',
                    border: '2px solid black', background: '#EF4444', cursor: 'pointer', color: 'white',
                    boxShadow: '2px 2px 0px black'
                  }}>
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        );
      } else {
        slots.push(
          <div key={`empty-${i}`} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px', border: '3px dashed #CBD5E1', borderRadius: '12px',
            marginBottom: '12px', backgroundColor: 'transparent'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'transparent',
                border: '2px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#CBD5E1', fontSize: '20px', fontWeight: 'bold'
              }}>
                ?
              </div>
              <div>
                <div style={{ fontWeight: '800', color: '#64748B', fontSize: '14px' }}>
                  Slot Kosong
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>Menunggu Pemain...</div>
              </div>
            </div>
          </div>
        );
      }
    }
    return slots;
  };

  const isMenu = view === 'menu';

  return (
    <div className={isMenu ? "modal-overlay" : ""} role={isMenu ? "dialog" : undefined} style={isMenu ? { padding: '20px' } : {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#F3E8FF',
      zIndex: 9999, overflowY: 'auto',
      padding: '40px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start'
    }}>
      {isMenu && (
        <div className="modal brut-card" style={{ maxWidth: '400px', width: '100%', padding: '32px', background: 'white', border: '4px solid black', borderRadius: '24px', boxShadow: '8px 8px 0px black' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'black' }}>🌐 MULTIPLAYER</h2>
            <button onClick={onClose} style={{ 
              background: 'transparent', border: 'none', fontSize: '32px', fontWeight: '900', cursor: 'pointer', color: 'black' 
            }}>×</button>
          </div>
          
          {error && (
            <div style={{ padding: '12px', background: '#FEE2E2', border: '3px solid #EF4444', color: '#B91C1C', borderRadius: '12px', marginBottom: '16px', fontWeight: '800', boxShadow: '4px 4px 0px #EF4444' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={handleCreateLobby}
              disabled={loading || !isLoggedIn}
              style={{
                width: '100%', backgroundColor: '#9333EA', color: 'white',
                padding: '16px', fontSize: '16px', fontWeight: '900', borderRadius: '16px',
                border: '3px solid black', boxShadow: '4px 4px 0px black', cursor: 'pointer',
                opacity: loading || !isLoggedIn ? 0.6 : 1
              }}
            >
              {loading ? '⏳ MEMBUAT LOBI...' : '+ BUAT LOBI BARU'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '12px 0' }}>
              <div style={{ flex: 1, height: '3px', backgroundColor: '#E2E8F0', borderRadius: '2px' }}></div>
              <div style={{ fontWeight: '900', color: '#94A3B8', fontSize: '14px' }}>ATAU</div>
              <div style={{ flex: 1, height: '3px', backgroundColor: '#E2E8F0', borderRadius: '2px' }}></div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="MASUKKAN KODE"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={!isLoggedIn}
                style={{ 
                  flex: 1, padding: '12px 16px', fontSize: '16px', borderRadius: '12px', 
                  textTransform: 'uppercase', letterSpacing: '2px', border: '3px solid black',
                  fontWeight: '800', outline: 'none', minWidth: '0'
                }}
              />
              <button
                onClick={handleJoinLobby}
                disabled={joinCode.length < 6 || loading || !isLoggedIn}
                style={{
                  backgroundColor: 'black', color: 'white', padding: '12px 24px',
                  borderRadius: '12px', fontWeight: '900', border: '3px solid black',
                  cursor: 'pointer', opacity: joinCode.length < 6 || loading || !isLoggedIn ? 0.6 : 1,
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.5)', flexShrink: 0
                }}
              >
                GABUNG
              </button>
            </div>

            {!isLoggedIn && (
              <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '3px solid #CBD5E1', textAlign: 'center', color: '#475569', fontSize: '14px', fontWeight: '800' }}>
                ℹ️ Silakan login untuk menggunakan fitur multiplayer
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'lobby' && (
        <div style={{ maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#1E293B', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Ruang Tunggu Balapan</h2>
              <p style={{ color: '#475569', fontSize: '16px', margin: 0, fontWeight: '700' }}>Atur sirkuit & undang teman sebelum mulai</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '4px solid #1E293B', borderRadius: '20px', padding: '8px 12px 8px 20px', gap: '16px', boxShadow: '4px 4px 0px #1E293B' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '1px' }}>KODE LOBI</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#7E22CE', letterSpacing: '3px' }}>{roomCode}</div>
                </div>
                <button onClick={handleCopyCode} style={{
                  width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#9333EA', border: '4px solid #1E293B', borderRadius: '16px', cursor: 'pointer',
                  boxShadow: '4px 4px 0px #1E293B', transition: 'all 0.1s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'translate(2px, 2px)'}
                onMouseUp={e => e.currentTarget.style.transform = 'translate(0px, 0px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translate(0px, 0px)'}
                >
                  {copied ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  )}
                </button>
              </div>
              <button onClick={handleLeaveLobby} style={{
                width: '56px', height: '56px', borderRadius: '20px', border: '4px solid #1E293B',
                background: 'white', color: '#1E293B', fontSize: '24px', fontWeight: '900',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '4px 4px 0px #1E293B'
              }}>
                ✕
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '16px', background: '#FEE2E2', border: '4px solid #EF4444', color: '#B91C1C', borderRadius: '16px', fontWeight: '900', boxShadow: '4px 4px 0px #EF4444', fontSize: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Flex Layout */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            
            {/* Left Col: Pengaturan (Only for Host) */}
            {isHost && (
              <div style={{ flex: '1 1 400px', minWidth: '300px', background: 'white', border: '4px solid #1E293B', borderRadius: '24px', padding: '24px', boxShadow: '6px 6px 0px #1E293B' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#94A3B8' }}>⚙️</span> Pengaturan Sirkuit
              </h3>
              <div style={{ height: '4px', background: '#1E293B', marginBottom: '24px', borderRadius: '2px' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#1E293B', marginBottom: '12px' }}>Bahasa Teks</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {['indonesian', 'english', 'programming'].map(cat => {
                      const labels = { indonesian: 'indonesia', english: 'english', programming: 'coding' };
                      return (
                        <button key={cat} onClick={() => handleUpdateSetting('textCategory', cat)} disabled={!isHost} style={{
                          padding: '8px 20px', fontSize: '14px', fontWeight: '900', borderRadius: '32px',
                          border: '3px solid #1E293B',
                          backgroundColor: settings.textCategory === cat ? '#A855F7' : 'white',
                          color: settings.textCategory === cat ? 'white' : '#1E293B',
                          cursor: isHost ? 'pointer' : 'default',
                          boxShadow: settings.textCategory === cat ? 'none' : '4px 4px 0px #1E293B',
                          transform: settings.textCategory === cat ? 'translate(4px, 4px)' : 'none',
                          transition: 'all 0.1s'
                        }}>
                          {labels[cat]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#1E293B', marginBottom: '12px' }}>Mode Permainan</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {['words', 'quotes', 'numbers'].map(mode => {
                      const labels = { words: 'kata acak', quotes: 'quote', numbers: 'angka' };
                      return (
                        <button key={mode} onClick={() => handleUpdateSetting('textMode', mode)} disabled={!isHost} style={{
                          padding: '8px 20px', fontSize: '14px', fontWeight: '900', borderRadius: '32px',
                          border: '3px solid #1E293B',
                          backgroundColor: settings.textMode === mode ? '#A855F7' : 'white',
                          color: settings.textMode === mode ? 'white' : '#1E293B',
                          cursor: isHost ? 'pointer' : 'default',
                          boxShadow: settings.textMode === mode ? 'none' : '4px 4px 0px #1E293B',
                          transform: settings.textMode === mode ? 'translate(4px, 4px)' : 'none',
                          transition: 'all 0.1s'
                        }}>
                          {labels[mode]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#1E293B', marginBottom: '12px' }}>Durasi Waktu</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {['15', '30', '60'].map(dur => (
                      <button key={dur} onClick={() => handleUpdateSetting('duration', dur)} disabled={!isHost} style={{
                        padding: '8px 20px', fontSize: '14px', fontWeight: '900', borderRadius: '32px',
                        border: '3px solid #1E293B',
                        backgroundColor: settings.duration === dur ? '#A855F7' : 'white',
                        color: settings.duration === dur ? 'white' : '#1E293B',
                        cursor: isHost ? 'pointer' : 'default',
                        boxShadow: settings.duration === dur ? 'none' : '4px 4px 0px #1E293B',
                        transform: settings.duration === dur ? 'translate(4px, 4px)' : 'none',
                        transition: 'all 0.1s'
                      }}>
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Right Col: Peserta */}
            <div style={{ flex: '1 1 300px', minWidth: '300px', background: '#E9D5FF', border: '4px solid #1E293B', borderRadius: '24px', padding: '24px', boxShadow: '6px 6px 0px #1E293B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#3B82F6' }}>👥</span> Peserta
                </h3>
                <div style={{ padding: '6px 16px', border: '3px solid #1E293B', borderRadius: '16px', fontWeight: '900', background: 'white', color: '#1E293B', fontSize: '16px', boxShadow: '2px 2px 0px #1E293B' }}>
                  {playerCount}/4
                </div>
              </div>
              <div style={{ height: '4px', background: '#1E293B', marginBottom: '24px', borderRadius: '2px' }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {renderPlayerSlots()}
              </div>

              {/* Status for Non-Host */}
              {!isHost && (
                <div style={{ marginTop: '24px', textAlign: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '3px solid #1E293B', boxShadow: '4px 4px 0px #1E293B' }}>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#10B981', marginBottom: '4px' }}>SIAP 👍</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#64748B' }}>Menunggu pertandingan dimulai oleh Host...</div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Cari Username (Only for Host) */}
          {isHost && (
            <div style={{ background: 'white', border: '4px solid #1E293B', borderRadius: '24px', padding: '24px', boxShadow: '6px 6px 0px #1E293B', marginTop: '16px', marginBottom: '48px', position: 'relative', paddingBottom: '48px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#94A3B8' }}>🔍</span> Cari Username
            </h3>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Ketik username teman..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
                style={{ 
                  flex: 1, padding: '12px 16px', fontSize: '16px', borderRadius: '12px', 
                  border: '3px solid #CBD5E1', outline: 'none', fontWeight: '700', color: '#1E293B', minWidth: '0'
                }}
              />
              <button onClick={handleSearchUsers} disabled={searching} style={{ 
                padding: '12px 20px', backgroundColor: '#A855F7', color: 'white', borderRadius: '12px',
                border: '3px solid #1E293B', fontWeight: '900', cursor: 'pointer',
                boxShadow: '4px 4px 0px #1E293B', flexShrink: 0
              }}>
                {searching ? '...' : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {searchResults.map(result => (
                  <div key={result.userId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', border: '3px solid #E2E8F0', borderRadius: '16px', background: '#F8FAFC'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>🏎️</span>
                      <span style={{ fontWeight: '900', fontSize: '16px', color: '#1E293B' }}>{result.username}</span>
                    </div>
                    <button onClick={() => handleInviteUser(result.userId)} style={{
                      padding: '10px 20px', fontSize: '14px', fontWeight: '900', borderRadius: '12px',
                      backgroundColor: 'white', color: '#A855F7', border: '3px solid #A855F7', cursor: 'pointer',
                      boxShadow: '2px 2px 0px #A855F7'
                    }}>
                      Undang
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Overlapping Mulai Balapan button inside the card or floating */}
            <div style={{ position: 'absolute', bottom: '-28px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
               <button onClick={handleStartRace} style={{
                 padding: '16px 48px', fontSize: '24px', fontWeight: '900', borderRadius: '40px',
                 backgroundColor: '#9333EA', color: 'white', border: '4px solid #1E293B',
                 boxShadow: '6px 6px 0px #1E293B', cursor: 'pointer', transition: 'transform 0.1s',
                 whiteSpace: 'nowrap'
               }}
               onMouseDown={e => e.currentTarget.style.transform = 'translate(4px, 4px)'}
               onMouseUp={e => e.currentTarget.style.transform = 'translate(0px, 0px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'translate(0px, 0px)'}
               >
                 Mulai Balapan! &raquo;
               </button>
            </div>
          </div>
          )}

        </div>
      )}
    </div>
  );
}
