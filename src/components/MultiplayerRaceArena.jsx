import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';

export default function MultiplayerRaceArena({ roomCode, onFinish, onCancel }) {
  const { user } = useAuth();
  
  // Race state
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState({});
  const [words, setWords] = useState([]);
  
  // Countdown & Status
  const [countdown, setCountdown] = useState(3);
  const [raceStatus, setRaceStatus] = useState('countdown'); // countdown | racing | finished
  const statusRef = useRef('countdown');
  
  useEffect(() => {
      statusRef.current = raceStatus;
  }, [raceStatus]);

  // Stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // DOM-based typing logic (like SoloRaceScreen)
  const typingAreaRef = useRef(null);
  const timerRef = useRef(null);
  const wpmIntervalRef = useRef(null);
  const startTime = useRef(null);
  
  const logic = useRef({
      state: {
          textToType: '',
          typedChars: '',
      },
      spans: [],
      lastSpaceTime: 0,
      charEvaluations: [],
      totalKeypresses: 0,
      wpmHistory: [],
      correctCharsPerSecond: [],
      lastCorrectCount: 0
  });

  const [capsLockActive, setCapsLockActive] = useState(false);

  // Helper to calculate correct chars
  const getCorrectChars = useCallback(() => {
    let correct = 0;
    for (let i = 0; i < logic.current.state.typedChars.length; i++) {
        if (logic.current.charEvaluations[i] === 'correct') {
            correct++;
        }
    }
    return correct;
  }, []);

  // Finish race handler
  const endRace = useCallback(async () => {
    if (statusRef.current === 'finished') return;
    setRaceStatus('finished');
    clearInterval(timerRef.current);
    clearInterval(wpmIntervalRef.current);

    if (typingAreaRef.current) {
        typingAreaRef.current.querySelectorAll('.cursor').forEach(c => c.remove());
    }

    if (roomCode && user) {
      await RoomService.finishRace(roomCode, user.uid);
    }
    
    // Wait a bit then show results
    setTimeout(() => {
      const position = players[user?.uid]?.position || 0;
      let coinsEarned = 10;
      if (position === 1) coinsEarned = 50;
      else if (position === 2) coinsEarned = 30;
      else if (position === 3) coinsEarned = 20;

      const l = logic.current;
      let correctChars = 0;
      let incorrectChars = 0;
      
      for (let i = 0; i < l.charEvaluations.length; i++) {
          if (l.charEvaluations[i] === 'correct') correctChars++;
          if (l.charEvaluations[i] === 'incorrect') incorrectChars++;
      }

      onFinish({
        wpm,
        accuracy,
        correctChars,
        wrongChars: incorrectChars,
        coins: coinsEarned,
        wpmHistory: l.wpmHistory,
        position,
        isMultiplayer: true
      });
    }, 2000);
  }, [roomCode, user, players, wpm, accuracy, onFinish]);

  const handleScroll = useCallback((activeIndex) => {
      const l = logic.current;
      const typingArea = typingAreaRef.current;
      const activeSpan = l.spans[activeIndex];
      if (!activeSpan || !typingArea) return;

      const lineHeight = 51.2;
      const currentLineIndex = Math.round(activeSpan.offsetTop / lineHeight);

      if (currentLineIndex >= 2) {
          const scrollAmount = (currentLineIndex - 1) * lineHeight;
          typingArea.style.transform = `translateY(-${scrollAmount}px)`;
      } else {
          typingArea.style.transform = `translateY(0px)`;
      }
  }, []);

  const updateCursorPosition = useCallback(() => {
      const typingArea = typingAreaRef.current;
      if (!typingArea) return;
      const l = logic.current;
      
      typingArea.querySelectorAll('.cursor').forEach(c => c.remove());
      
      const activeIndex = l.state.typedChars.length;
      
      if (activeIndex < l.spans.length && statusRef.current !== 'finished') {
          const cursor = document.createElement('span');
          cursor.className = "cursor absolute left-0 top-[10%] w-[3px] h-[80%] bg-[var(--primary)] animate-pulse z-10";
          if (l.spans[activeIndex]) {
              l.spans[activeIndex].appendChild(cursor);
          }
          handleScroll(activeIndex);
      }
  }, [handleScroll]);

  // Init typing area DOM
  const initTypingArea = useCallback(() => {
    const typingArea = typingAreaRef.current;
    if (!typingArea) return;
    const l = logic.current;
    
    typingArea.innerHTML = '';
    l.spans = [];
    
    const fragment = document.createDocumentFragment();
    let currentWordSpan = document.createElement('span');
    currentWordSpan.className = "inline-block";
    
    for (let i = 0; i < l.state.textToType.length; i++) {
        const char = l.state.textToType[i];
        const spanContainer = document.createElement('span');
        spanContainer.className = "char-container relative inline-block";
        
        const charSpan = document.createElement('span');
        charSpan.className = "char-span text-[var(--text-dim)] transition-colors duration-100";
        charSpan.textContent = char; 
        
        spanContainer.appendChild(charSpan);
        currentWordSpan.appendChild(spanContainer);
        l.spans.push(spanContainer);
        
        if (char === ' ') {
            fragment.appendChild(currentWordSpan);
            currentWordSpan = document.createElement('span');
            currentWordSpan.className = "inline-block";
        }
    }
    if (currentWordSpan.childNodes.length > 0) {
        fragment.appendChild(currentWordSpan);
    }
    
    const endContainer = document.createElement('span');
    endContainer.className = "char-container relative inline-block";
    const endChar = document.createElement('span');
    endChar.className = "char-span";
    endContainer.appendChild(endChar);
    fragment.appendChild(endContainer);
    l.spans.push(endContainer);
    
    typingArea.appendChild(fragment);
    typingArea.style.transform = `translateY(0px)`;
    updateCursorPosition();
  }, [updateCursorPosition]);

  const updateCharVisuals = useCallback((index, status) => {
      const l = logic.current;
      if (index < 0 || index >= l.state.textToType.length) return;
      if (!l.spans[index]) return;
      const charSpan = l.spans[index].querySelector('.char-span');
      if (!charSpan) return;
      
      if (status === 'correct') {
          charSpan.className = "char-span text-[var(--text-h)] transition-colors duration-100";
      } else if (status === 'incorrect') {
          charSpan.className = "char-span text-[var(--bg)] bg-[var(--danger)] rounded-sm transition-colors duration-100";
      } else {
          charSpan.className = "char-span text-[var(--text-dim)] transition-colors duration-100";
      }
  }, []);

  const updateStats = useCallback(() => {
      const l = logic.current;
      if (!startTime.current) return null;

      const correct = getCorrectChars();

      let acc = 100;
      if (l.state.typedChars.length > 0) {
          acc = Math.round((correct / l.state.typedChars.length) * 100);
      }
      setAccuracy(acc);

      let timeElapsed = (Date.now() - startTime.current) / 1000 / 60;
      let currentWpm = 0;
      if (timeElapsed > 0) {
          currentWpm = Math.round((correct / 5) / timeElapsed);
      }
      setWpm(currentWpm);
      
      return { wpm: currentWpm, acc, correct };
  }, [getCorrectChars]);

  // Listen to room
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = RoomService.listenToRoom(roomCode, ({ exists, data }) => {
      if (exists && data) {
        setRoomData(data);
        setPlayers(data.players || {});
        
        // Load synchronized text
        if (data.text && words.length === 0) {
          setWords(data.text);
          logic.current.state.textToType = data.text.join(' ');
          initTypingArea();
        }
        
        // If status becomes finished by server
        if (data.status === 'finished' && statusRef.current !== 'finished') {
          endRace();
        }
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, words.length, endRace, initTypingArea]);

  // Start timer
  const startTimer = useCallback(() => {
    if (startTime.current) return;
    
    startTime.current = Date.now();
    const duration = parseInt(roomData?.settings?.duration || '30');
    setTimeLeft(duration);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endRace();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // WPM calculation
    wpmIntervalRef.current = setInterval(() => {
        const stats = updateStats();
        if (stats) {
            logic.current.wpmHistory.push(stats.wpm);
            const correctThisSec = stats.correct - logic.current.lastCorrectCount;
            logic.current.lastCorrectCount = stats.correct;
            logic.current.correctCharsPerSecond.push(correctThisSec);
        }
    }, 1000);
  }, [roomData, endRace, updateStats]);

  // Countdown logic
  useEffect(() => {
    if (countdown > 0 && raceStatus === 'countdown') {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && raceStatus === 'countdown') {
      // Start race
      setTimeout(() => {
        setRaceStatus('racing');
        startTimer();
      }, 0);
    }
  }, [countdown, raceStatus, startTimer]);

  // Update multiplayer stats to firebase
  useEffect(() => {
    if (!roomCode || !user || raceStatus !== 'racing') return;

    const interval = setInterval(async () => {
      const l = logic.current;
      const progressPercent = l.state.textToType.length > 0 
        ? Math.min((l.state.typedChars.length / l.state.textToType.length) * 100, 100) 
        : 0;
      
      await RoomService.updatePlayerStats(roomCode, user.uid, {
        wpm,
        accuracy,
        progress: Math.round(progressPercent)
      });
    }, 500);

    return () => clearInterval(interval);
  }, [roomCode, user, raceStatus, wpm, accuracy]);

  // Handle keydown
  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.getModifierState) {
              setCapsLockActive(e.getModifierState('CapsLock'));
          }

          if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

          if (e.key === 'Escape') {
              if (onCancel) onCancel();
              return;
          }

          if (statusRef.current !== 'racing') return;

          const l = logic.current;

          if (e.key === 'Backspace') {
              if (l.state.typedChars.length > 0) {
                  const prevIndex = l.state.typedChars.length - 1;
                  l.state.typedChars = l.state.typedChars.slice(0, -1);
                  l.charEvaluations.pop();
                  
                  updateCharVisuals(prevIndex, 'idle');
                  updateCursorPosition();
                  updateStats();
              }
          } else if (e.key.length === 1) {
              if (e.key === ' ') e.preventDefault();
              
              if (e.key !== ' ') {
                  l.totalKeypresses++;
              }

              const currentIndex = l.state.typedChars.length;
              const expectedChar = l.state.textToType[currentIndex];

              if (e.key === ' ') {
                  if (l.state.typedChars.endsWith(' ')) return;
                  const now = Date.now();
                  if (now - l.lastSpaceTime < 200) return;
                  l.lastSpaceTime = now;

                  let nextSpace = l.state.textToType.indexOf(' ', currentIndex);
                  if (nextSpace !== -1) {
                      while (l.state.typedChars.length <= nextSpace) {
                          const i = l.state.typedChars.length;
                          if (l.state.textToType[i] === ' ') {
                              l.state.typedChars += ' ';
                              l.charEvaluations.push('correct');
                              updateCharVisuals(i, 'idle'); // Leave space visual idle
                          } else {
                              l.state.typedChars += l.state.textToType[i];
                              l.charEvaluations.push('missed');
                              updateCharVisuals(i, 'idle'); // Visually look untyped
                          }
                      }
                      updateCursorPosition();
                      updateStats();
                      return;
                  }
              }
              
              l.state.typedChars += e.key;
              
              if (e.key === expectedChar) {
                  l.charEvaluations.push('correct');
                  updateCharVisuals(currentIndex, 'correct');
              } else {
                  l.charEvaluations.push('incorrect');
                  updateCharVisuals(currentIndex, 'incorrect');
              }
              
              updateCursorPosition();
              updateStats(); 
              
              if (l.state.typedChars.length >= l.state.textToType.length) {
                  endRace();
              }
          }
      };

      const handleKeyUp = (e) => {
          if (e.getModifierState) {
              setCapsLockActive(e.getModifierState('CapsLock'));
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [onCancel, updateCharVisuals, updateCursorPosition, updateStats, endRace]);

  // Render race lanes with cars
  const renderRaceLanes = () => {
    const playersList = Object.entries(players).map(([uid, data]) => ({
      uid,
      ...data,
      isYou: uid === user?.uid
    }));

    // Ensure 'You' are always at the top if present
    playersList.sort((a, b) => {
      if (a.isYou) return -1;
      if (b.isYou) return 1;
      return 0;
    });

    return playersList.map((player) => {
      const progress = player.progress || 0;
      const carPosition = Math.min(Math.max(progress, 0), 100);

      return (
        <div key={player.uid} className="mb-8">
          {/* Track */}
          <div className="relative w-full h-12 mt-6 bg-[#E9D5FF] rounded-xl flex items-center overflow-hidden border-[4px] border-[#1E293B] shadow-[4px_4px_0px_#1E293B]">
            {/* Checkered Finish (On the left) */}
            <div
              className="absolute left-0 w-9 h-full border-r-[4px] border-[#1E293B] shrink-0 z-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #fff 25%, #fff 75%, #000 75%, #000)',
                backgroundPosition: '0 0, 6px 6px',
                backgroundSize: '12px 12px'
              }}
            />

            {/* Dashed line across track */}
            <div
              className="absolute left-9 right-0 top-1/2 -translate-y-1/2 h-0.5 z-0"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #94A3B8, #94A3B8 10px, transparent 10px, transparent 20px)'
              }}
            />

            {/* Car Container */}
            <div
              className="absolute z-20 transition-all duration-500 ease-out flex flex-col items-center"
              style={{ 
                right: `calc((100% - 36px - 40px) * ${carPosition / 100})`,
                top: '-20px' 
              }}
            >
              <span className="text-[12px] font-black leading-none drop-shadow-md px-2 py-0.5 rounded-full border-2 border-[#1E293B] bg-white" style={{ color: player.isYou ? '#EC4899' : '#6366F1' }}>
                {player.isYou ? 'You' : player.username}
              </span>
              <span className="text-[32px] leading-none mt-1 drop-shadow-md">
                {player.isYou ? '🏎️' : '🚙'}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-fg)]" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      {capsLockActive && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[var(--danger)] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md z-[100] flex items-center gap-2 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15V3"></path>
                  <path d="m5 10 7-7 7 7"></path>
                  <rect x="4" y="19" width="16" height="2" rx="1"></rect>
              </svg>
              Caps Lock Aktif
          </div>
      )}

      <div className="w-full max-w-[1000px] px-8 py-10 flex flex-col">
        
        {/* Race Lanes */}
        <div className="mb-10 mt-8">
          {renderRaceLanes()}
        </div>

        {/* Typing Area with relative positioning for blur effect */}
        <div className="relative w-full">
          
          {/* Countdown Overlay only over text */}
          {raceStatus === 'countdown' && (
            <div className="absolute -top-5 -left-5 -right-5 -bottom-5 flex items-center justify-center z-20">
              <div className="text-[100px] font-black text-[var(--text-h)] drop-shadow-[4px_4px_0px_var(--primary)] animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {/* Text Container */}
          <div className={`w-full transition-all duration-300 ${raceStatus === 'countdown' ? 'blur-md' : 'blur-none'}`}>
            <div className="overflow-hidden h-[156px] w-full">
                <div ref={typingAreaRef} id="typing-area" className="text-[32px] leading-[1.6] font-mono tracking-wide text-left break-words transition-transform duration-300 ease-out text-[var(--text-dim)]">
                    {/* Characters loaded here by JS */}
                </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-16 flex flex-col items-center gap-8">
            <div className="flex items-center gap-3 text-[13px] font-bold text-[var(--text-dim)]">
                <kbd className="px-2 py-[2px] border-2 border-[var(--border)] rounded-md text-[var(--text-h)] bg-[var(--card)] shadow-[2px_2px_0px_var(--border)]">
                    ESC
                </kbd>
                <span className="font-semibold">kembali</span>
                <span className="text-[var(--text-dim)]/40 mx-1">|</span>
                <span className="font-semibold">setiap peserta soalnya sama</span>
            </div>
        </div>

        {/* Quick Stats Top Right */}
        {raceStatus === 'racing' && (
          <div className="fixed top-8 right-10 flex gap-8">
             <div className="flex flex-col items-center">
                 <span className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-widest">Waktu</span>
                 <span className="text-3xl font-black text-[var(--primary)]">{timeLeft}</span>
             </div>
             <div className="flex flex-col items-center">
                 <span className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-widest">WPM</span>
                 <span className="text-3xl font-black text-[var(--text-h)]">{wpm}</span>
             </div>
             <div className="flex flex-col items-center">
                 <span className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-widest">Akurasi</span>
                 <span className="text-3xl font-black text-[var(--text-h)]">{accuracy}%</span>
             </div>
          </div>
        )}
      </div>

      <style>{`
        .char-span { white-space: pre; }
      `}</style>
    </div>
  );
}
