const LEADERBOARD = [
  { rank: 1,  name: 'SpeedKing99',   wpm: 142, acc: 98, medal: '🥇' },
  { rank: 2,  name: 'TyperPro',       wpm: 138, acc: 97, medal: '🥈' },
  { rank: 3,  name: 'FlashFingers',   wpm: 130, acc: 96, medal: '🥉' },
  { rank: 4,  name: 'KeyboardWarrior',wpm: 125, acc: 95 },
  { rank: 5,  name: 'NgebrutCuy',     wpm: 119, acc: 94 },
  { rank: 6,  name: 'ClickMaster',    wpm: 112, acc: 93 },
  { rank: 7,  name: 'TypeLord',       wpm: 108, acc: 92 },
  { rank: 8,  name: 'Pembalap_12',    wpm: 0,   acc: 0,  isYou: true },
];

export default function LeaderboardModal({ onClose }) {
  // Sort podium players
  const podium = LEADERBOARD.filter(p => p.rank <= 3).sort((a, b) => {
    // Order: 2nd, 1st, 3rd for podium visualization
    if (a.rank === 1) return 0;
    if (b.rank === 1) return 1;
    return a.rank - b.rank;
  });

  // Re-order podium specifically for 2, 1, 3 display
  const orderedPodium = [
    LEADERBOARD.find(p => p.rank === 2),
    LEADERBOARD.find(p => p.rank === 1),
    LEADERBOARD.find(p => p.rank === 3),
  ];

  const others = LEADERBOARD.filter(p => p.rank > 3);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="lb-modal-title">
      <div className="modal modal-lg brut-card">
        <div className="modal-header">
          <h2 className="modal-title" id="lb-modal-title">🏆 KLASEMEN PEMBALAP</h2>
          <button className="modal-close" onClick={onClose} aria-label="Tutup klasemen">×</button>
        </div>

        {/* Podium Visualization */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: '16px',
            margin: '20px 0 32px 0',
            paddingBottom: '16px',
            borderBottom: '3.5px solid var(--border)'
          }}
        >
          {orderedPodium.map(p => {
            if (!p) return null;
            const isFirst = p.rank === 1;
            const isSecond = p.rank === 2;
            const height = isFirst ? '140px' : isSecond ? '110px' : '90px';
            const bgColor = isFirst ? 'var(--secondary)' : isSecond ? 'var(--bg2)' : 'var(--bg3)';

            return (
              <div
                key={p.rank}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  maxWidth: '130px'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '6px' }}>{p.medal}</div>
                <div style={{ fontSize: '13px', fontWeight: 900, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
                  {p.wpm} WPM
                </div>
                
                {/* Podium Stand */}
                <div
                  className="brut-card"
                  style={{
                    width: '100%',
                    height: height,
                    backgroundColor: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 900,
                    boxShadow: '4px 4px 0 var(--shadow-color)',
                    borderWidth: '2.5px'
                  }}
                >
                  #{p.rank}
                </div>
              </div>
            );
          })}
        </div>

        {/* Score List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="list" aria-label="Klasemen pemain">
          {/* Header */}
          <div
            className="result-stat-row"
            style={{ fontWeight: 900, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', borderBottom: '2.5px solid var(--border)' }}
            role="listitem"
          >
            <span style={{ minWidth: 44 }}>POS</span>
            <span style={{ flex: 1 }}>Pembalap</span>
            <span style={{ minWidth: 80, textAlign: 'right' }}>WPM</span>
            <span style={{ minWidth: 70, textAlign: 'right' }}>Akurasi</span>
          </div>

          {others.map(entry => (
            <div
              key={entry.rank}
              className="result-stat-row"
              role="listitem"
              style={{
                background: entry.isYou ? 'var(--secondary)' : 'transparent',
                borderRadius: entry.isYou ? '10px' : '0px',
                padding: '12px 8px',
                borderBottom: entry.isYou ? '2.5px solid var(--border)' : '2.5px dashed var(--border)',
                transform: entry.isYou ? 'rotate(-0.5deg)' : 'none',
                boxShadow: entry.isYou ? '2px 2px 0 var(--shadow-color)' : 'none',
                border: entry.isYou ? '2.5px solid var(--border)' : 'none'
              }}
            >
              <span style={{ minWidth: 44, fontSize: 16, fontWeight: 900 }}>
                #{entry.rank}
              </span>
              <span style={{ flex: 1, fontWeight: entry.isYou ? 900 : 700, color: 'var(--text-h)' }}>
                {entry.isYou ? '👤 ' : ''}{entry.name}
                {entry.isYou && (
                  <span
                    className="badge"
                    style={{
                      fontSize: 9,
                      marginLeft: 8,
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-fg)',
                      padding: '2px 6px',
                      borderWidth: '1.5px',
                      boxShadow: 'none'
                    }}
                  >
                    KAMU
                  </span>
                )}
              </span>
              <span style={{ minWidth: 80, textAlign: 'right', fontWeight: 900, color: 'var(--primary)' }}>
                {entry.wpm > 0 ? `${entry.wpm} WPM` : '-'}
              </span>
              <span style={{ minWidth: 70, textAlign: 'right', color: 'var(--text-dim)', fontWeight: 700 }}>
                {entry.acc > 0 ? `${entry.acc}%` : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
