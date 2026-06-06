import { useEffect, useRef, useCallback } from 'react';

// ── Parallax floating keys ────────────────────────────────────────────────────
const FLOAT_KEYS = [
  { label: 'A',     x: 8,  y: 15, size: 56, speed: 0.015, rotate: -12 },
  { label: '⌘',    x: 82, y: 10, size: 44, speed: 0.02,  rotate: 15  },
  { label: 'SPACE', x: 15, y: 75, size: 80, speed: 0.01,  rotate: 8   },
  { label: 'ENTER', x: 78, y: 70, size: 70, speed: 0.018, rotate: -8  },
  { label: '⇧',    x: 50, y: 5,  size: 48, speed: 0.025, rotate: 5   },
  { label: 'TAB',   x: 88, y: 42, size: 52, speed: 0.012, rotate: -18 },
  { label: 'Z',     x: 4,  y: 50, size: 42, speed: 0.022, rotate: 20  },
];

export default function HomePage({ onStartSolo, onMultiplayer }) {
  const keysRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    // Normalize mouse to -0.5 … 0.5
    mouseRef.current = {
      x: (e.clientX / window.innerWidth  - 0.5),
      y: (e.clientY / window.innerHeight - 0.5),
    };
    keysRef.current.forEach((el, i) => {
      if (!el) return;
      const k  = FLOAT_KEYS[i];
      const dx = mouseRef.current.x * 80 * k.speed * 60;
      const dy = mouseRef.current.y * 80 * k.speed * 60;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${k.rotate}deg)`;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
      <main className="home" id="main-content" aria-label="Halaman Utama ZippyKeys">

        {/* ── Animated mesh background ── */}
        <div className="home-bg" aria-hidden="true">
          <div className="mesh-orb mesh-orb-1" />
          <div className="mesh-orb mesh-orb-2" />
          <div className="mesh-orb mesh-orb-3" />
        </div>

        {/* ── Floating keys ── */}
        <div className="parallax-keys" aria-hidden="true">
          {FLOAT_KEYS.map((k, i) => (
            <div
              key={i}
              ref={el => keysRef.current[i] = el}
              className="float-key"
              style={{
                left:      `${k.x}%`,
                top:       `${k.y}%`,
                fontSize:  k.size > 60 ? '13px' : '16px',
                transform: `rotate(${k.rotate}deg)`,
                transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              {k.label}
            </div>
          ))}
        </div>

        {/* ── Hero ── */}
        <section className="home-hero" aria-labelledby="hero-title">
          <h1 className="hero-title" id="hero-title">
            Zippy<span>Keys</span>
          </h1>
          <p className="hero-desc">
            Uji kecepatan dan akurasi mengetikmu. Raih WPM tertinggi dan kumpulkan koin! 🚀
          </p>
        </section>

        {/* ── Mode cards ── */}
        <section className="home-cards" aria-label="Pilih mode permainan">
          <article className="mode-card" aria-label="Mode Solo">
            <div className="mode-card-top">
              <span className="mode-icon" aria-hidden="true">🏁</span>
              <span className="mode-subtitle">Latihan Mandiri</span>
            </div>
            <h2>Mode Solo</h2>
            <p>Asah kemampuan, farming koin, dan pecahkan rekor WPM personalmu.</p>
            <button className="btn-primary" onClick={onStartSolo}>
              Mulai Sekarang →
            </button>
          </article>

          <article className="mode-card mode-card-mp" aria-label="Mode Multiplayer">
            <div className="mode-card-top">
              <span className="mode-icon" aria-hidden="true">⚡</span>
              <span className="mode-subtitle mode-subtitle-mp">Tantangan Real-time</span>
            </div>
            <h2>Multiplayer</h2>
            <p>Tantang teman lewat kode lobby. Host, pembalap, atau inspektor — pilih peranmu.</p>
            <button className="btn-secondary" onClick={onMultiplayer}>
              Buka Lobby →
            </button>
          </article>
        </section>

      </main>
  );
}
