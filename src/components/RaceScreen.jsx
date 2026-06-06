import { useEffect, useRef, useState, useCallback } from 'react';
import TextProvider from '../services/TextProvider';
import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';
import SoloRaceScreen from './SoloRaceScreen';

export default function RaceScreen({ roomCode, isMultiplayer = false, onFinish, onCancel }) {
  if (!isMultiplayer) {
    return <SoloRaceScreen onFinish={onFinish} onCancel={onCancel} />;
  }

  const { user } = useAuth();
  
  // Config
  const [duration, setDuration] = useState(30);
  const [textMode, setTextMode] = useState('words');
  const [textCategory, setTextCategory] = useState('english');
  const [showControls, setShowControls] = useState(true);
  
  // Race state
  const [words, setWords] = useState([]);
  const [input, setInput] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  
  // Stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Tracking
  const [correctChars, setCorrectChars] = useState(0);
  const [totalKeypresses, setTotalKeypresses] = useState(0);
  const [wpmHistory, setWpmHistory] = useState([0]);
  const [wordStatuses, setWordStatuses] = useState([]);
  
  // Multiplayer
  const [players, setPlayers] = useState({});
  const [capsLockActive, setCapsLockActive] = useState(false);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const startTime = useRef(null);
  const wpmInterval = useRef(null);
  const containerRef = useRef(null);
  
  const currentWord = words[wordIndex] || '';

  // Show/hide controls on typing
  useEffect(() => {
    if (started) {
      setShowControls(false);
    }
  }, [started]);

  // Generate words
  const generateWords = useCallback(async () => {
    try {
      const textWords = await TextProvider.generateInfiniteText(textMode, textCategory, duration);
      setWords(textWords);
    } catch (error) {
      console.error('Failed to load text:', error);
      setWords(['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog']);
    }
  }, [textMode, textCategory, duration]);

  useEffect(() => {
    generateWords();
  }, [generateWords]);

  // Append more words when running low
  useEffect(() => {
    if (!started || finished) return;
    if (words.length - wordIndex > 50) return;

    const appendMore = async () => {
      try {
        const moreWords = await TextProvider.generateInfiniteText(textMode, textCategory, duration);
        setWords(prev => [...prev, ...moreWords]);
      } catch (error) {
        console.error('Failed to append words:', error);
      }
    };

    appendMore();
  }, [wordIndex, words.length, started, finished, textMode, textCategory, duration]);

  // Multiplayer listeners
  useEffect(() => {
    if (!isMultiplayer || !roomCode) return;

    const unsubscribe = RoomService.listenToRoom(roomCode, ({ exists, data }) => {
      if (exists && data) {
        setPlayers(data.players || {});
        if (data.status === 'finished' && started && !finished) {
          endRace();
        }
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiplayer, roomCode, started, finished]);

  // Update multiplayer stats
  useEffect(() => {
    if (!isMultiplayer || !roomCode || !user || !started || finished) return;

    const interval = setInterval(async () => {
      const progressPercent = words.length > 0 
        ? Math.min((wordIndex / words.length) * 100, 100) 
        : 0;
      
      await RoomService.updatePlayerStats(roomCode, user.uid, {
        wpm,
        accuracy,
        progress: Math.round(progressPercent)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMultiplayer, roomCode, user, started, finished, wpm, accuracy, wordIndex, words.length]);

  // End race
  const endRace = useCallback(async () => {
    setFinished(true);
    clearInterval(timerRef.current);
    clearInterval(wpmInterval.current);

    if (isMultiplayer && roomCode && user) {
      await RoomService.finishRace(roomCode, user.uid);
    }
  }, [isMultiplayer, roomCode, user]);

  // Start timer immediately
  const startTimer = useCallback(() => {
    if (startTime.current) return;
    
    setStarted(true);
    startTime.current = Date.now();
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
    wpmInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 60000;
      if (elapsed > 0) {
        const currentWpm = Math.round((correctChars / 5) / elapsed);
        setWpm(currentWpm);
        setWpmHistory(prev => [...prev, currentWpm]);
      }
    }, 1000);
  }, [duration, endRace, correctChars]);

  // Restart race
  const handleRestart = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(wpmInterval.current);
    setInput('');
    setWordIndex(0);
    setStarted(false);
    setFinished(false);
    setWpm(0);
    setAccuracy(100);
    setTimeLeft(duration);
    setCorrectChars(0);
    setTotalKeypresses(0);
    setWpmHistory([0]);
    setWordStatuses([]);
    setShowControls(true);
    startTime.current = null;
    generateWords();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [duration, generateWords]);

  // Handle input
  const handleInputChange = useCallback((e) => {
    if (finished || !started) return;

    const val = e.target.value;

    // Ignore leading spaces
    if (val === ' ' && input === '') return;
    
    // Ignore multiple consecutive spaces
    if (val.endsWith('  ')) return;

    // Space = submit word
    if (val.endsWith(' ')) {
      const typedWord = val.trim();
      const isCorrect = typedWord === currentWord;
      
      // Count correct characters
      let correctInWord = 0;
      for (let i = 0; i < currentWord.length; i++) {
        if (i < typedWord.length && typedWord[i] === currentWord[i]) {
          correctInWord++;
        }
      }
      
      setCorrectChars(prev => prev + correctInWord);
      setWordStatuses(prev => [...prev, isCorrect]);
      setWordIndex(prev => prev + 1);
      setInput('');
      
      return;
    }

    setInput(val);
  }, [finished, started, input, currentWord]);

  // Handle keydown
  const handleKeyDown = useCallback((e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }

    if (finished) return;
    
    // Start timer on first character
    if (!started && e.key.length === 1 && !e.ctrlKey && !e.metaKey && e.key !== ' ') {
      startTimer();
    }
    
    // Count keypresses only after started (excluding backspace and space)
    if (started && e.key.length === 1 && e.key !== ' ') {
      setTotalKeypresses(prev => prev + 1);
    }
    
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [finished, started, startTimer, onCancel]);

  useEffect(() => {
    const checkCapsLock = (e) => {
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };
    window.addEventListener('keyup', checkCapsLock);
    window.addEventListener('keydown', checkCapsLock);
    return () => {
      window.removeEventListener('keyup', checkCapsLock);
      window.removeEventListener('keydown', checkCapsLock);
    };
  }, []);

  // Update accuracy
  useEffect(() => {
    if (totalKeypresses === 0) {
      setAccuracy(100);
      return;
    }
    
    const acc = Math.round((correctChars / totalKeypresses) * 100);
    setAccuracy(Math.max(0, Math.min(100, acc)));
  }, [correctChars, totalKeypresses]);

  // Finish handler
  useEffect(() => {
    if (!finished) return;
    
    let coinsEarned = 0;
    let position = 0;
    
    if (isMultiplayer && players[user?.uid]) {
      position = players[user.uid].position || 0;
      if (position === 1) coinsEarned = 50;
      else if (position === 2) coinsEarned = 30;
      else if (position === 3) coinsEarned = 20;
      else coinsEarned = 10;
    } else {
      coinsEarned = Math.round(wpm * 0.6 + correctChars * 0.08);
    }
    
    setTimeout(() => {
      onFinish({
        wpm,
        accuracy,
        correctChars,
        wrongChars: totalKeypresses - correctChars,
        coins: coinsEarned,
        wpmHistory,
        position: position || undefined,
        isMultiplayer
      });
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Render word
  const renderWord = (word, idx) => {
    const isActive = idx === wordIndex;
    const isPassed = idx < wordIndex;
    const isCorrect = wordStatuses[idx];

    let wordCls = 'word';
    if (isActive) wordCls += ' word-active';
    if (isPassed && isCorrect) wordCls += ' word-passed-correct';
    if (isPassed && !isCorrect) wordCls += ' word-passed-incorrect';

    return (
      <span key={idx} className={wordCls}>
        {word.split('').map((char, i) => {
          let cls = 'letter';
          
          if (isActive) {
            if (i < input.length) {
              cls += input[i] === char ? ' letter-correct' : ' letter-incorrect';
            } else if (i === input.length) {
              cls += ' letter-cursor';
            } else {
              cls += ' letter-pending';
            }
          } else if (isPassed) {
            cls += ' letter-typed';
          } else {
            cls += ' letter-untyped';
          }

          return (
            <span key={i} className={cls} data-char={char}>
              {char}
              {isActive && i === input.length && (
                <span className="cursor-blink" />
              )}
            </span>
          );
        })}
        <span className="word-space"> </span>
      </span>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg)',
      padding: '48px 24px',
      position: 'relative'
    }}>
      {capsLockActive && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--danger)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15V3"></path>
            <path d="m5 10 7-7 7 7"></path>
            <rect x="4" y="19" width="16" height="2" rx="1"></rect>
          </svg>
          Caps Lock Aktif
        </div>
      )}
      {/* ESC hint - top left */}
      <div style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-dim)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{
          padding: '4px 10px',
          backgroundColor: 'var(--text-dim)',
          color: 'var(--bg)',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: '700'
        }}>Esc</span>
        <span>kembali</span>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '850px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Top Controls Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {/* Category Pills Group */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            backgroundColor: 'var(--bg2)',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => !started && setTextCategory('indonesian')}
              disabled={started}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: textCategory === 'indonesian' ? 'var(--primary)' : 'transparent',
                color: textCategory === 'indonesian' ? 'var(--primary-fg)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '6px',
                cursor: started ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              indonesia
            </button>
            <button
              onClick={() => !started && setTextCategory('english')}
              disabled={started}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: textCategory === 'english' ? 'var(--primary)' : 'transparent',
                color: textCategory === 'english' ? 'var(--primary-fg)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '6px',
                cursor: started ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              english
            </button>
            <button
              onClick={() => !started && setTextCategory('programming')}
              disabled={started}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: textCategory === 'programming' ? 'var(--primary)' : 'transparent',
                color: textCategory === 'programming' ? 'var(--primary-fg)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '6px',
                cursor: started ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              coding
            </button>
          </div>

          {/* Mode Pills Group */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            backgroundColor: 'var(--bg2)',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => !started && setTextMode('words')}
              disabled={started}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: textMode === 'words' ? 'var(--primary)' : 'transparent',
                color: textMode === 'words' ? 'var(--primary-fg)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '6px',
                cursor: started ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              kata acak
            </button>
            <button
              onClick={() => !started && setTextMode('quotes')}
              disabled={started}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: textMode === 'quotes' ? 'var(--primary)' : 'transparent',
                color: textMode === 'quotes' ? 'var(--primary-fg)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '6px',
                cursor: started ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              quote
            </button>
            <button
              onClick={() => !started && setTextMode('numbers')}
              disabled={started}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: textMode === 'numbers' ? 'var(--primary)' : 'transparent',
                color: textMode === 'numbers' ? 'var(--primary-fg)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '6px',
                cursor: started ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              angka
            </button>
          </div>

          {/* Duration Pills Group */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            backgroundColor: 'var(--bg2)',
            borderRadius: '8px'
          }}>
            {[15, 30, 60].map(d => (
              <button
                key={d}
                onClick={() => !started && setDuration(d)}
                disabled={started}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: duration === d ? 'var(--primary)' : 'transparent',
                  color: duration === d ? 'var(--primary-fg)' : 'var(--text-dim)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: started ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '42px'
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Typing Area */}
        <div
          ref={containerRef}
          onClick={() => inputRef.current?.focus()}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '320px',
            maxHeight: '320px',
            overflow: 'hidden',
            cursor: 'text',
            padding: '40px 0'
          }}
        >
          {/* Start Hint - center overlay */}
          {!started && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 20,
              pointerEvents: 'none'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--primary)',
                marginBottom: '8px',
                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                Ketik untuk mulai
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-dim)',
                fontWeight: '500'
              }}>
                Timer akan otomatis berjalan
              </div>
            </div>
          )}

          {/* Stats - larger, bottom right */}
          {started && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              fontSize: '15px',
              fontWeight: '700',
              color: 'var(--text-h)',
              display: 'flex',
              gap: '20px',
              zIndex: 10
            }}>
              <span style={{ fontSize: '18px' }}>{timeLeft}s</span>
              <span>{wpm} wpm</span>
              <span>{accuracy}%</span>
            </div>
          )}

          {/* Words */}
          {words.length > 0 && (
            <div style={{
              fontSize: '42px',
              lineHeight: '1.6',
              color: 'var(--text-dim)',
              fontFamily: 'monospace',
              fontWeight: '500',
              userSelect: 'none'
            }}>
              {words.slice(0, Math.min(wordIndex + 30, words.length)).map(renderWord)}
            </div>
          )}

          {/* Hidden Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            autoFocus
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          style={{
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: 'var(--bg2)',
            color: 'var(--text-dim)',
            border: '2px solid var(--border)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--primary-fg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg2)';
            e.currentTarget.style.color = 'var(--text-dim)';
          }}
        >
          refresh
        </button>
      </div>

      <style>{`
        .word {
          display: inline-block;
          margin-right: 14px;
        }
        .word-passed-correct .letter {
          color: var(--text-dim);
          opacity: 0.3;
        }
        .word-passed-incorrect .letter {
          color: var(--text-h);
          opacity: 0.8;
        }
        
        /* Letter states */
        .letter {
          position: relative;
          display: inline-block;
          transition: color 0.1s ease, background-color 0.1s ease;
        }
        
        /* Untyped - belum diketik (terang, mudah dibaca) */
        .letter-untyped {
          color: var(--text-h);
          opacity: 0.8;
        }
        
        /* Pending - kata aktif tapi belum sampai karakter ini (terang) */
        .letter-pending {
          color: var(--text-h);
          opacity: 0.85;
        }
        
        /* Correct - karakter benar (tetap terang) */
        .letter-correct {
          color: var(--text-h) !important;
          opacity: 1 !important;
        }
        
        /* Incorrect - karakter salah dengan background merah terang */
        .letter-incorrect {
          color: #ffffff !important;
          background-color: #ef4444 !important;
          opacity: 1 !important;
          border-radius: 4px;
        }
        
        /* Cursor position - karakter yang akan diketik (highlight jelas) */
        .letter-cursor {
          color: var(--text-h);
          opacity: 1;
          background-color: var(--primary);
          color: white;
          border-radius: 4px;
          padding: 2px 4px;
        }
        
        /* Typed - sudah diketik (redup) */
        .letter-typed {
          opacity: 0.3;
        }
        
        /* Cursor blink animation - lebih tebal dan terang */
        .cursor-blink {
          position: absolute;
          left: -4px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: var(--primary);
          border-radius: 2px;
          animation: blink 1s infinite;
          box-shadow: 0 0 8px var(--primary);
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .word-space {
          display: inline;
        }
      `}</style>
    </div>
  );
}
