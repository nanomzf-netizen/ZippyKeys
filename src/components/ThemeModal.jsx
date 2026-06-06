import { useState } from 'react';

const THEMES = [
  // Gori Flagship
  { id: 'gori-light', name: 'Gori Light', dots: ['#FF2E93', '#00F2FE', '#8F00FF'], isDark: false, isFlagship: true },
  { id: 'gori-dark', name: 'Gori Dark', dots: ['#FF2E93', '#00F2FE', '#A64DFF'], isDark: true, isFlagship: true },
  // Strawberry
  { id: 'strawberry-light', name: 'Strawberry Light', dots: ['#F47C8B', '#F6B1B8', '#9C27B0'], isDark: false },
  { id: 'strawberry-dark', name: 'Strawberry Dark', dots: ['#F47C8B', '#F6B1B8', '#FF8DA1'], isDark: true },
  // Striker
  { id: 'striker-light', name: 'Striker Light', dots: ['#3B7BC4', '#5E8FC8', '#FF9F43'], isDark: false },
  { id: 'striker-dark', name: 'Striker Dark', dots: ['#3B7BC4', '#5E8FC8', '#FFA756'], isDark: true },
  // Suisei
  { id: 'suisei-light', name: 'Suisei Light', dots: ['#7EDBFF', '#F8A23A', '#4B6584'], isDark: false },
  { id: 'suisei-dark', name: 'Suisei Dark', dots: ['#7EDBFF', '#F8A23A', '#A3D2FF'], isDark: true },
  // Sunset
  { id: 'sunset-light', name: 'Sunset Light', dots: ['#F49A7A', '#5F568D', '#D63031'], isDark: false },
  { id: 'sunset-dark', name: 'Sunset Dark', dots: ['#F49A7A', '#8F82C5', '#FF7675'], isDark: true },
  // Superuser
  { id: 'superuser-light', name: 'Superuser Light', dots: ['#46F0B1', '#6F8796', '#20BF6B'], isDark: false },
  { id: 'superuser-dark', name: 'Superuser Dark', dots: ['#46F0B1', '#6F8796', '#00FFC4'], isDark: true },
  // Sweden
  { id: 'sweden-light', name: 'Sweden Light', dots: ['#FFCC00', '#3C88C9', '#10AC84'], isDark: false },
  { id: 'sweden-dark', name: 'Sweden Dark', dots: ['#FFCC00', '#3C88C9', '#2EE59D'], isDark: true },
  // Tangerine
  { id: 'tangerine-light', name: 'Tangerine Light', dots: ['#FF6A13', '#F0A06B', '#2E1C12'], isDark: false },
  { id: 'tangerine-dark', name: 'Tangerine Dark', dots: ['#FF6A13', '#F0A06B', '#FF8E4D'], isDark: true },
  // Taro
  { id: 'taro-light', name: 'Taro Light', dots: ['#B7B5FF', '#8C8AB7', '#6C5CE7'], isDark: false },
  { id: 'taro-dark', name: 'Taro Dark', dots: ['#B7B5FF', '#8C8AB7', '#A29BFE'], isDark: true },
  // Terminal
  { id: 'terminal-light', name: 'Terminal Light', dots: ['#79A617', '#48494B', '#2F3640'], isDark: false },
  { id: 'terminal-dark', name: 'Terminal Dark', dots: ['#79A617', '#9DCD30', '#A5B1C2'], isDark: true },
  // Terra
  { id: 'terra-light', name: 'Terra Light', dots: ['#7FB83D', '#A59C73', '#4B6584'], isDark: false },
  { id: 'terra-dark', name: 'Terra Dark', dots: ['#7FB83D', '#C5BC93', '#A1E659'], isDark: true },
  // Terrazzo
  { id: 'terrazzo-light', name: 'Terrazzo Light', dots: ['#D5B38F', '#C58E63', '#4B4038'], isDark: false },
  { id: 'terrazzo-dark', name: 'Terrazzo Dark', dots: ['#D5B38F', '#C58E63', '#F3D8C4'], isDark: true },
  // Terror Below
  { id: 'terror_below-light', name: 'Terror Below Light', dots: ['#5FB8A2', '#007D6F', '#10AC84'], isDark: false },
  { id: 'terror_below-dark', name: 'Terror Below Dark', dots: ['#5FB8A2', '#007D6F', '#00E5FF'], isDark: true },
  // Tiramisu
  { id: 'tiramisu-light', name: 'Tiramisu Light', dots: ['#D0AF89', '#B78863', '#70584A'], isDark: false },
  { id: 'tiramisu-dark', name: 'Tiramisu Dark', dots: ['#D0AF89', '#B78863', '#FFDEAD'], isDark: true },
  // Trackday
  { id: 'trackday-light', name: 'Trackday Light', dots: ['#F05C4B', '#6D8BC6', '#1B2A4A'], isDark: false },
  { id: 'trackday-dark', name: 'Trackday Dark', dots: ['#F05C4B', '#6D8BC6', '#FF7675'], isDark: true },
  // Trance
  { id: 'trance-light', name: 'Trance Light', dots: ['#FF008C', '#2C3D87', '#00D2FC'], isDark: false },
  { id: 'trance-dark', name: 'Trance Dark', dots: ['#FF008C', '#4B66E0', '#00E5FF'], isDark: true },
  // Tron Orange
  { id: 'tron_orange-light', name: 'Tron Orange Light', dots: ['#F4F000', '#FF7A00', '#333333'], isDark: false },
  { id: 'tron_orange-dark', name: 'Tron Orange Dark', dots: ['#F4F000', '#FF7A00', '#FFC400'], isDark: true },
  // Vaporwave
  { id: 'vaporwave-light', name: 'Vaporwave Light', dots: ['#D96BE8', '#8D8AD8', '#00D2FC'], isDark: false },
  { id: 'vaporwave-dark', name: 'Vaporwave Dark', dots: ['#D96BE8', '#8D8AD8', '#FF76FF'], isDark: true },
];

export default function ThemeModal({ current, onSelect, onClose }) {
  const [tab, setTab] = useState('all'); // all | light | dark

  const filteredThemes = THEMES.filter(t => {
    if (tab === 'light') return !t.isDark;
    if (tab === 'dark') return t.isDark;
    return true;
  });

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="theme-modal-title">
      <div className="modal modal-lg brut-card">
        <div className="modal-header">
          <h2 className="modal-title" id="theme-modal-title">PILIH TEMA KETIKAN 🎨</h2>
          <button className="modal-close" onClick={onClose} aria-label="Tutup modal tema">×</button>
        </div>

        <p className="theme-gallery-desc">
          Sesuaikan tampilan visual keyboard dan balapanmu dengan palet Neo-Brutalisme favoritmu.
        </p>

        {/* Gallery Filter Tabs */}
        <div className="theme-gallery-tabs">
          <button
            className={`theme-gallery-tab brut-btn ${tab === 'all' ? 'active' : ''}`}
            style={tab === 'all' ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg3)' }}
            onClick={() => setTab('all')}
          >
            Semua
          </button>
          <button
            className={`theme-gallery-tab brut-btn ${tab === 'light' ? 'active' : ''}`}
            style={tab === 'light' ? { backgroundColor: 'var(--secondary)' } : { backgroundColor: 'var(--bg3)' }}
            onClick={() => setTab('light')}
          >
            Light Mode
          </button>
          <button
            className={`theme-gallery-tab brut-btn ${tab === 'dark' ? 'active' : ''}`}
            style={tab === 'dark' ? { backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' } : { backgroundColor: 'var(--bg3)' }}
            onClick={() => setTab('dark')}
          >
            Dark Mode
          </button>
        </div>

        <div className="theme-grid" role="listbox" aria-label="Daftar tema">
          {filteredThemes.map(t => (
            <button
              key={t.id}
              className={`theme-option brut-card brut-card-hover${current === t.id ? ' active' : ''}`}
              onClick={() => { onSelect(t.id); }}
              role="option"
              aria-selected={current === t.id}
              aria-label={`Tema ${t.name}`}
              style={current === t.id ? { borderWidth: '3.5px', borderColor: 'var(--primary)' } : {}}
            >
              <div className="theme-name">
                {t.isFlagship && <span style={{ marginRight: 6 }}>⭐</span>}
                {t.name}
              </div>
              <div className="theme-preview" aria-hidden="true">
                {t.dots.map((c, i) => (
                  <span
                    key={i}
                    className="theme-dot"
                    style={{ background: c }}
                    title={i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Accent'}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
