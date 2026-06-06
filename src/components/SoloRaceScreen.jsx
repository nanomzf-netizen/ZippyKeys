import React, { useEffect, useRef } from 'react';

export default function SoloRaceScreen({ onFinish, onCancel }) {
    const typingAreaRef = useRef(null);
    const liveStatsRef = useRef(null);
    const settingsBarRef = useRef(null);
    const statTimeRef = useRef(null);
    const statWpmRef = useRef(null);
    const statAccRef = useRef(null);
    
    // We keep all mutable logic in a ref to avoid React re-renders and strictly follow the user's requested DOM-based performance approach
    const logic = useRef({
        englishWords: ["the", "be", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "hearing", "happening", "paid", "should", "losing", "coming", "keeping", "were", "played", "feeling", "talked", "paying", "was"],
        indonesianWords: ["yang", "dan", "di", "dengan", "ke", "itu", "dari", "pada", "ini", "dalam", "untuk", "tidak", "akan", "juga", "saya", "oleh", "tersebut", "ada", "sebagai", "bisa", "karena", "sudah", "saat", "mereka", "menjadi", "lebih", "ia", "orang", "hari", "tahun", "telah", "kamu", "kita", "banyak", "hal", "satu", "dia", "seperti", "hanya", "namun", "atau", "lain", "setelah", "akan", "apa", "sama", "agar", "hingga", "sangat", "lagi", "lalu", "baru", "sendiri", "waktu", "bahkan", "kembali", "sementara", "tentang", "beberapa", "harus", "selalu", "belum", "sini", "saja", "mana", "bukan", "pernah", "serta", "terus", "biar", "mulai", "membuat", "ketika", "pun", "memang", "masih", "bagi", "sampai", "baik", "setiap", "cara", "terus", "pasti", "kalau", "mungkin", "dapat", "antara", "semua", "kini", "tempat", "besar", "lama", "tahu", "benar", "melihat", "dulu", "sekarang"],
        codingWords: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "default", "null", "undefined", "true", "false", "this", "new", "async", "await", "try", "catch", "=>", "==="],
        timerInterval: null,
        startTime: null,
        state: {
            language: 'english',
            mode: 'kata acak',
            duration: '30',
            textToType: '',
            typedChars: '',
            status: 'idle'
        },
        spans: [],
        lastSpaceTime: 0,
        wpmHistory: [],
        totalKeypresses: 0,
        charEvaluations: [],
        correctCharsPerSecond: [],
        lastCorrectCount: 0
    });

    useEffect(() => {
        const typingArea = typingAreaRef.current;
        const liveStats = liveStatsRef.current;
        const settingsBar = settingsBarRef.current;
        const statTime = statTimeRef.current;
        const statWpm = statWpmRef.current;
        const statAcc = statAccRef.current;
        const l = logic.current;

        function generateWords(lang, wordCount = 200) {
            let list = l.englishWords;
            if (lang === 'indonesia') list = l.indonesianWords;
            if (lang === 'coding') list = l.codingWords;

            let words = [];
            for (let i = 0; i < wordCount; i++) {
                words.push(list[Math.floor(Math.random() * list.length)]);
            }
            return words.join(' ');
        }

        function initTypingArea() {
            if (!typingArea) return;
            typingArea.innerHTML = '';
            l.spans = [];
            
            const fragment = document.createDocumentFragment();
            
            for (let i = 0; i < l.state.textToType.length; i++) {
                const char = l.state.textToType[i];
                const spanContainer = document.createElement('span');
                spanContainer.className = "char-container relative inline-block";
                
                const charSpan = document.createElement('span');
                charSpan.className = "char-span text-[var(--text-dim)] transition-colors duration-100";
                charSpan.textContent = char; 
                
                spanContainer.appendChild(charSpan);
                fragment.appendChild(spanContainer);
                l.spans.push(spanContainer);
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
        }

        function updateCharVisuals(index, status) {
            if (index < 0 || index >= l.state.textToType.length) return;
            if (!l.spans[index]) return;
            const charSpan = l.spans[index].querySelector('.char-span');
            if (!charSpan) return;
            
            if (status === 'correct') {
                charSpan.className = "char-span text-[var(--text-h)] transition-colors duration-100";
            } else if (status === 'incorrect') {
                charSpan.className = "char-span text-[var(--bg)] bg-[var(--danger)] rounded-sm px-[2px] transition-colors duration-100";
            } else {
                charSpan.className = "char-span text-[var(--text-dim)] transition-colors duration-100";
            }
        }

        function updateCursorPosition() {
            if (!typingArea) return;
            typingArea.querySelectorAll('.cursor').forEach(c => c.remove());
            
            const activeIndex = l.state.typedChars.length;
            
            if (activeIndex < l.spans.length && l.state.status !== 'finished') {
                const cursor = document.createElement('span');
                cursor.className = "cursor absolute left-0 top-[10%] w-[3px] h-[80%] bg-[var(--primary)] animate-pulse z-10";
                if (l.spans[activeIndex]) {
                    l.spans[activeIndex].appendChild(cursor);
                }
                handleScroll(activeIndex);
            }
        }

        function handleScroll(activeIndex) {
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
        }

        function updateStats() {
            if (!l.startTime) return;

            let correct = 0;
            for (let i = 0; i < l.state.typedChars.length; i++) {
                if (l.state.typedChars[i] === l.state.textToType[i]) {
                    correct++;
                }
            }

            let acc = 100;
            if (l.state.typedChars.length > 0) {
                acc = Math.round((correct / l.state.typedChars.length) * 100);
            }
            if (statAcc) statAcc.innerText = `${acc}%`;

            let timeElapsed = (Date.now() - l.startTime) / 1000 / 60;
            let wpm = 0;
            if (timeElapsed > 0) {
                wpm = Math.round((correct / 5) / timeElapsed);
            }
            if (statWpm) statWpm.innerText = wpm;
            return { wpm, acc, correct };
        }

        function resetTest(newLang = null) {
            if (newLang) l.state.language = newLang;
            l.state.textToType = generateWords(l.state.language, 200);
            l.state.typedChars = '';
            l.state.status = 'idle';
            l.wpmHistory = [];
            l.totalKeypresses = 0;
            l.charEvaluations = [];
            l.correctCharsPerSecond = [];
            l.lastCorrectCount = 0;
            
            clearInterval(l.timerInterval);
            l.startTime = null;
            if (statTime) statTime.innerText = l.state.duration;
            if (statWpm) statWpm.innerText = '0';
            if (statAcc) statAcc.innerText = '100%';
            
            if (liveStats) {
                liveStats.classList.remove('opacity-100');
                liveStats.classList.add('opacity-0');
            }
            if (settingsBar) {
                settingsBar.style.opacity = '1';
                settingsBar.style.pointerEvents = 'auto';
            }

            initTypingArea();
        }

        // Attach logic to DOM elements
        window.resetTestGlobal = resetTest; // for the refresh button onClick
        window.setSettingGlobal = (group, val) => {
            l.state[group] = val;
            updateSettingsUI();
            resetTest();
        };

        function updateSettingsUI() {
            document.querySelectorAll('.setting-btn').forEach(btn => {
                const group = btn.getAttribute('data-group');
                const val = btn.getAttribute('data-value');
                if (l.state[group] === val) {
                    btn.className = `setting-btn px-4 py-1.5 rounded-full text-[15px] font-bold transition-colors duration-200 bg-[var(--primary)] text-[var(--primary-fg)]`;
                } else {
                    btn.className = `setting-btn px-4 py-1.5 rounded-full text-[15px] font-bold transition-colors duration-200 text-[var(--text-dim)] hover:text-[var(--text-h)]`;
                }
            });
        }

        function finishRace() {
            clearInterval(l.timerInterval);
            l.state.status = 'finished';
            if (typingArea) {
                typingArea.querySelectorAll('.cursor').forEach(c => c.remove());
            }

            // Detailed Metric Calculations
            let correctChars = 0;
            let incorrectChars = 0;
            let missedChars = 0;
            let extraChars = 0;
            
            for (let i = 0; i < l.charEvaluations.length; i++) {
                if (l.charEvaluations[i] === 'correct') correctChars++;
                if (l.charEvaluations[i] === 'incorrect') incorrectChars++;
                if (l.charEvaluations[i] === 'missed') missedChars++;
            }

            let correctWords = 0;
            let incorrectWords = 0;
            let currentWordHasError = false;
            let currentWordTyped = false;

            for (let i = 0; i < l.state.typedChars.length; i++) {
                const char = l.state.textToType[i];
                const evalResult = l.charEvaluations[i];

                if (char === ' ') {
                    if (currentWordTyped) {
                        if (currentWordHasError) incorrectWords++;
                        else correctWords++;
                    }
                    currentWordHasError = false;
                    currentWordTyped = false;
                } else {
                    currentWordTyped = true;
                    if (evalResult === 'incorrect' || evalResult === 'missed') {
                        currentWordHasError = true;
                    }
                }
            }
            if (currentWordTyped) {
                if (currentWordHasError) incorrectWords++;
                else correctWords++;
            }

            const totalTypedCharacters = l.charEvaluations.length - missedChars;
            const accuracyVal = totalTypedCharacters > 0 ? (correctChars / totalTypedCharacters) * 100 : 0;
            const errorRateVal = totalTypedCharacters > 0 ? (incorrectChars / totalTypedCharacters) * 100 : 0;

            const actualTimeElapsedSeconds = l.startTime ? (Date.now() - l.startTime) / 1000 : 0;
            const timeInMinutes = actualTimeElapsedSeconds > 0 ? actualTimeElapsedSeconds / 60 : parseInt(l.state.duration) / 60;
            const rawSpeed = timeInMinutes > 0 ? (totalTypedCharacters / 5) / timeInMinutes : 0;
            const effectiveSpeed = timeInMinutes > 0 ? (correctChars / 5) / timeInMinutes : 0;

            let consistency = 100;
            const charsPerSec = l.correctCharsPerSecond;
            if (charsPerSec.length > 1) {
                const mean = charsPerSec.reduce((a, b) => a + b, 0) / charsPerSec.length;
                if (mean > 0) {
                    const variance = charsPerSec.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / charsPerSec.length;
                    const stdDev = Math.sqrt(variance);
                    const cv = stdDev / mean;
                    consistency = Math.max(0, Math.round(100 * (1 - cv)));
                }
            }

            const evaluationJSON = [
                {
                    "metrik": "Correct Characters",
                    "nilai": correctChars,
                    "deskripsi": "Jumlah karakter yang cocok dengan teks target."
                },
                {
                    "metrik": "Incorrect Characters",
                    "nilai": incorrectChars,
                    "deskripsi": "Jumlah karakter yang salah dibandingkan teks target."
                },
                {
                    "metrik": "Extra Characters",
                    "nilai": extraChars,
                    "deskripsi": "Karakter tambahan yang tidak ada di teks target."
                },
                {
                    "metrik": "Missed Characters",
                    "nilai": missedChars,
                    "deskripsi": "Karakter yang seharusnya diketik tetapi tidak diketik."
                },
                {
                    "metrik": "Correct Words",
                    "nilai": correctWords,
                    "deskripsi": "Jumlah kata yang diketik dengan benar 100%."
                },
                {
                    "metrik": "Incorrect Words",
                    "nilai": incorrectWords,
                    "deskripsi": "Jumlah kata yang mengandung minimal satu kesalahan."
                },
                {
                    "metrik": "Accuracy",
                    "nilai": accuracyVal.toFixed(2) + "%",
                    "deskripsi": "(Correct Characters / Total Typed Characters) × 100"
                },
                {
                    "metrik": "Raw Speed",
                    "nilai": Math.round(rawSpeed),
                    "deskripsi": "(Total Typed Characters / 5) / waktu dalam menit"
                },
                {
                    "metrik": "Effective Speed",
                    "nilai": Math.round(effectiveSpeed),
                    "deskripsi": "(Correct Characters / 5) / waktu dalam menit"
                },
                {
                    "metrik": "Error Rate",
                    "nilai": errorRateVal.toFixed(2) + "%",
                    "deskripsi": "(Incorrect Characters / Total Typed Characters) × 100"
                },
                {
                    "metrik": "Consistency Score",
                    "nilai": consistency,
                    "deskripsi": "Nilai 0–100 yang menunjukkan kestabilan kecepatan selama tes."
                }
            ];

            let coinsEarned = Math.round(effectiveSpeed * 0.6 + correctChars * 0.08);

            setTimeout(() => {
                onFinish({
                    wpm: Math.round(effectiveSpeed),
                    accuracy: Math.round(accuracyVal),
                    correctChars,
                    wrongChars: incorrectChars,
                    coins: coinsEarned,
                    wpmHistory: l.wpmHistory,
                    isMultiplayer: false,
                    evaluationDetails: evaluationJSON
                });
            }, 300);
        }

        function handleKeyDown(e) {
            if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

            if (e.key === 'Escape') {
                if (onCancel) onCancel();
                return;
            }

            if (l.state.status === 'idle' && e.key.length === 1) {
                l.state.status = 'typing';
                l.startTime = Date.now();
                let timeLeft = parseInt(l.state.duration);
                if (statTime) statTime.innerText = timeLeft;

                if (liveStats) {
                    liveStats.classList.remove('opacity-0');
                    liveStats.classList.add('opacity-100');
                }
                if (settingsBar) {
                    settingsBar.style.opacity = '0';
                    settingsBar.style.pointerEvents = 'none';
                }

                l.timerInterval = setInterval(() => {
                    timeLeft--;
                    if (statTime) statTime.innerText = timeLeft;
                    const stats = updateStats();
                    if (stats) {
                        l.wpmHistory.push(stats.wpm);
                        const correctThisSec = stats.correct - l.lastCorrectCount;
                        l.lastCorrectCount = stats.correct;
                        l.correctCharsPerSecond.push(correctThisSec);
                    }

                    if (timeLeft <= 0) {
                        finishRace();
                    }
                }, 1000);
            }

            if (l.state.status !== 'finished') {
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
                                    updateCharVisuals(i, 'correct');
                                } else {
                                    l.state.typedChars += l.state.textToType[i];
                                    l.charEvaluations.push('missed');
                                    updateCharVisuals(i, 'correct');
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
                        finishRace();
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        updateSettingsUI();
        resetTest();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(l.timerInterval);
            delete window.resetTestGlobal;
            delete window.setSettingGlobal;
        };
    }, [onFinish, onCancel]);

    return (
        <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-fg)]" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
            <style>{`
                .char-span { white-space: pre; }
            `}</style>
            
            {/* Live Stats */}
            <div ref={liveStatsRef} id="live-stats" className="fixed top-8 right-10 flex gap-8 opacity-0 transition-opacity duration-500 pointer-events-none z-50">
                <div className="flex flex-col items-center">
                    <span className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-widest">Waktu</span>
                    <span ref={statTimeRef} id="stat-time" className="text-3xl font-black text-[var(--primary)]">30</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-widest">WPM</span>
                    <span ref={statWpmRef} id="stat-wpm" className="text-3xl font-black text-[var(--text-h)]">0</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-widest">Akurasi</span>
                    <span ref={statAccRef} id="stat-acc" className="text-3xl font-black text-[var(--text-h)]">100%</span>
                </div>
            </div>

            {/* Top Settings Bar */}
            <div ref={settingsBarRef} id="settings-bar" className="flex flex-wrap items-center justify-center gap-3 mb-16 transition-opacity duration-500">
                <div className="flex border-2 border-[var(--border)] rounded-full p-1 bg-[var(--bg2)]" id="lang-settings">
                    <button className="setting-btn" data-group="language" data-value="indonesia" onClick={(e) => window.setSettingGlobal('language', 'indonesia')}>indonesia</button>
                    <button className="setting-btn" data-group="language" data-value="english" onClick={(e) => window.setSettingGlobal('language', 'english')}>english</button>
                    <button className="setting-btn" data-group="language" data-value="coding" onClick={(e) => window.setSettingGlobal('language', 'coding')}>coding</button>
                </div>

                <div className="flex border-2 border-[var(--border)] rounded-full p-1 bg-[var(--bg2)]" id="mode-settings">
                    <button className="setting-btn" data-group="mode" data-value="kata acak" onClick={(e) => window.setSettingGlobal('mode', 'kata acak')}>kata acak</button>
                    <button className="setting-btn" data-group="mode" data-value="quote" onClick={(e) => window.setSettingGlobal('mode', 'quote')}>quote</button>
                    <button className="setting-btn" data-group="mode" data-value="angka" onClick={(e) => window.setSettingGlobal('mode', 'angka')}>angka</button>
                </div>

                <div className="flex border-2 border-[var(--border)] rounded-full p-1 bg-[var(--bg2)]" id="duration-settings">
                    <button className="setting-btn" data-group="duration" data-value="15" onClick={(e) => window.setSettingGlobal('duration', '15')}>15</button>
                    <button className="setting-btn" data-group="duration" data-value="30" onClick={(e) => window.setSettingGlobal('duration', '30')}>30</button>
                    <button className="setting-btn" data-group="duration" data-value="60" onClick={(e) => window.setSettingGlobal('duration', '60')}>60</button>
                </div>
            </div>

            {/* Typing Area */}
            <div className="w-full max-w-[1000px] px-8 relative">
                <div className="overflow-hidden h-[156px] w-full">
                    <div ref={typingAreaRef} id="typing-area" className="text-[32px] leading-[1.6] font-mono tracking-wide text-left break-words transition-transform duration-300 ease-out">
                        {/* Characters loaded here by JS */}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-16 flex flex-col items-center gap-8">
                <button onClick={() => window.resetTestGlobal()} id="btn-refresh" className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text-h)] transition-colors group cursor-pointer outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-rotate-180 transition-transform duration-500">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                    </svg>
                    Refresh Test
                </button>

                <div className="flex items-center gap-3 text-[13px] font-bold text-[var(--text-dim)]">
                    <kbd className="px-2 py-[2px] border-2 border-[var(--border)] rounded-md text-[var(--text-h)] bg-[var(--card)] shadow-[2px_2px_0px_var(--border)]">
                        ESC
                    </kbd>
                    <span className="font-semibold">kembali</span>
                    <span className="text-[var(--text-dim)]/40 mx-1">|</span>
                    <span className="font-semibold">ketik untuk mulai</span>
                </div>
            </div>
        </div>
    );
}
