import { useEffect, useRef } from 'react';

// Confetti Effect Helper
function startConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  let animationId;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#FF5E7E', '#FFBB00', '#5A4FCF', '#1DD1A1', '#FF6B6B'];
  const confettiCount = 120;
  const particles = [];

  for (let i = 0; i < confettiCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 5 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.06 + 0.02,
      tiltAngle: 0
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, index) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2.2;
      p.x += Math.sin(p.tiltAngle) * 0.8;
      p.tilt = Math.sin(p.tiltAngle - index / 3) * 12;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      if (p.y > canvas.height) {
        particles[index] = {
          x: Math.random() * canvas.width,
          y: -20,
          r: p.r,
          d: p.d,
          color: p.color,
          tilt: p.tilt,
          tiltAngleIncremental: p.tiltAngleIncremental,
          tiltAngle: p.tiltAngle
        };
      }
    });

    animationId = requestAnimationFrame(draw);
  }

  draw();

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  return () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', handleResize);
  };
}

function WpmChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const pts = data.length >= 2 ? data : [0, ...data];
    const max = Math.max(...pts, 10);
    const stepX = W / (pts.length - 1 || 1);

    // Read colors from theme
    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue('--primary').trim() || '#FF5E7E';
    const accent = style.getPropertyValue('--accent').trim() || '#5A4FCF';
    const border = style.getPropertyValue('--border').trim() || '#1A1A1A';

    // Grid Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const yGrid = H - (H / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, yGrid);
      ctx.lineTo(W, yGrid);
      ctx.stroke();
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, primary + '40'); // 25% opacity
    grad.addColorStop(1, primary + '00'); // transparent
    ctx.fillStyle = grad;
    ctx.beginPath();
    pts.forEach((v, i) => {
      const x = i * stepX;
      const y = H - (v / max) * H * 0.8 - H * 0.1;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Line drawing
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach((v, i) => {
      const x = i * stepX;
      const y = H - (v / max) * H * 0.8 - H * 0.1;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Data Point Dots
    ctx.fillStyle = primary;
    ctx.strokeStyle = border;
    ctx.lineWidth = 2.5;
    pts.forEach((v, i) => {
      const x = i * stepX;
      const y = H - (v / max) * H * 0.8 - H * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={220}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-label="Grafik WPM"
    />
  );
}

export default function ResultScreen({ result, onBack }) {
  const { wpm, accuracy, correctChars, wrongChars, coins, wpmHistory } = result;
  const confettiCanvasRef = useRef(null);


  // Trigger Confetti
  useEffect(() => {
    if (confettiCanvasRef.current) {
      return startConfetti(confettiCanvasRef.current);
    }
  }, []);

  // Compute Achievements
  const achievements = [];
  if (wpm >= 100) {
    achievements.push({ icon: '👑', title: 'DEWA KETIK', desc: 'Menembus 100+ WPM! Spektakuler luar biasa!' });
  } else if (wpm >= 70) {
    achievements.push({ icon: '⚡', title: 'KILAT PETIR', desc: 'Mengetik dengan kecepatan 70+ WPM!' });
  } else if (wpm >= 40) {
    achievements.push({ icon: '🏎️', title: 'PULSE RACER', desc: 'Berhasil melaju kencang di atas 40 WPM!' });
  } else {
    achievements.push({ icon: '🚶', title: 'PEMBALAP SANTAI', desc: 'Kecepatan awal yang baik. Semangat berlatih!' });
  }

  if (accuracy >= 98) {
    achievements.push({ icon: '🎯', title: 'SNIPER JEMPOL', desc: 'Akurasi di atas 98%! Presisi tanpa cela.' });
  } else if (accuracy >= 90) {
    achievements.push({ icon: '👁️', title: 'INS PEKTUR TELITI', desc: 'Akurasi terjaga dengan baik di atas 90%.' });
  }

  return (
    <main className="result-screen" id="main-content" aria-labelledby="result-heading">
      {/* Confetti Overlay */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />

      <h1 className="result-title" id="result-heading">FINISH! 🎉</h1>
      
      <div className="result-coins" role="status" aria-live="polite">
        🎉 Dapatkan +{coins} Koin Emas 🪙
      </div>

      <div className="result-body">
        {/* Stats Column */}
        <section className="result-card brut-card" aria-label="Statistik akhir">
          <h2>STATISTIK BALAPAN</h2>
          <div className="result-stat-row">
            <span>Kecepatan Rata-rata:</span>
            <span style={{ color: 'var(--primary)' }}>{wpm} WPM</span>
          </div>
          <div className="result-stat-row">
            <span>Tingkat Akurasi:</span>
            <span style={{ color: 'var(--secondary)' }}>{accuracy}%</span>
          </div>
          <div className="result-stat-row">
            <span>Karakter Benar:</span>
            <span style={{ color: 'var(--success)' }}>{correctChars}</span>
          </div>
          <div className="result-stat-row">
            <span>Karakter Salah:</span>
            <span style={{ color: 'var(--danger)' }}>{wrongChars}</span>
          </div>
          <div className="result-stat-row">
            <span>Pendapatan Koin:</span>
            <span style={{ color: 'var(--accent)' }}>+{coins} 🪙</span>
          </div>
          <button className="brut-btn" style={{ width: '100%', backgroundColor: 'var(--primary)', color: 'var(--primary-fg)', marginTop: 'auto' }} onClick={onBack} aria-label="Kembali">
            KEMBALI KE MENU UTAMA
          </button>
        </section>

        {/* Chart and Achievements Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="result-card brut-card" aria-label="Grafik WPM">
            <h2>RIWAYAT KECEPATAN (WPM)</h2>
            <WpmChart data={wpmHistory} />
          </section>

          <section className="result-card brut-card" aria-label="Pencapaian">
            <h2>PENCAPAIAN DIREBUT 🏆</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="brut-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg3)',
                    borderWidth: '2.5px'
                  }}
                >
                  <div style={{ fontSize: '32px' }}>{ach.icon}</div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)' }}>{ach.title}</h3>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)' }}>{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
