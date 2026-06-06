import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoomService from '../services/RoomService';

export const VEHICLES = [
  { id: 'car1', icon: '🚗', name: 'Classic Car',     price: 0 },
  { id: 'car2', icon: '🚕', name: 'Yellow Cab',      price: 50 },
  { id: 'car3', icon: '🏎️', name: 'Race Car',        price: 120 },
  { id: 'car4', icon: '🚙', name: 'SUV Tangguh',     price: 80 },
  { id: 'car5', icon: '🚓', name: 'Patroli Cepat',   price: 100 },
  { id: 'car6', icon: '🚑', name: 'Ambulans Kilat',  price: 90 },
  { id: 'car7', icon: '🚒', name: 'Fire Turbo',      price: 110 },
  { id: 'car8', icon: '🛻', name: 'Pickup Pro',       price: 60 },
];

export default function ShopModal({ onBuy, onEquip, ownedVehicles, equippedVehicle, onClose }) {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = RoomService.listenToUserCoins(user.uid, (newCoins) => {
      setCoins(newCoins);
    });

    return () => unsubscribe();
  }, [user]);

  const handleBuy = async (vehicleId, price) => {
    if (coins < price) return;
    
    // Deduct coins via transaction
    try {
      await RoomService.awardCoins(user.uid, -price);
      onBuy(vehicleId, price);
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="shop-modal-title">
      <div className="modal modal-lg brut-card">
        <div className="modal-header">
          <h2 className="modal-title" id="shop-modal-title">GARASI &amp; TOKO KENDARAAN 🛒</h2>
          <button className="modal-close" onClick={onClose} aria-label="Tutup toko">×</button>
        </div>

        <div className="shop-coins" role="status" aria-live="polite">
          🪙 Dompet Koin Anda: <strong>{coins}</strong> Koin
        </div>

        <div className="shop-grid" role="list" aria-label="Daftar kendaraan">
          {VEHICLES.map(v => {
            const isOwned = ownedVehicles.includes(v.id);
            const isEquipped = equippedVehicle === v.id;

            return (
              <article key={v.id} className="shop-item brut-card" role="listitem">
                <div className="shop-item-icon" aria-hidden="true">{v.icon}</div>
                <div className="shop-item-name">{v.name}</div>
                
                {isOwned ? (
                  <div className="shop-item-price" style={{ color: 'var(--success)' }}>
                    ✓ Dimiliki
                  </div>
                ) : (
                  <div className="shop-item-price">
                    🪙 {v.price} Koin
                  </div>
                )}

                {isOwned ? (
                  <button
                    className="brut-btn btn-equip"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '12px',
                      backgroundColor: isEquipped ? 'var(--secondary)' : 'var(--bg3)',
                      color: 'var(--text-h)',
                      cursor: isEquipped ? 'default' : 'pointer',
                      transform: 'none',
                      boxShadow: isEquipped ? 'none' : '2px 2px 0 var(--shadow-color)'
                    }}
                    disabled={isEquipped}
                    onClick={() => onEquip(v.id)}
                  >
                    {isEquipped ? '⚡ DIPAKAI' : 'PAKAI'}
                  </button>
                ) : (
                  <button
                    className="brut-btn btn-buy"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '12px',
                      backgroundColor: coins >= v.price ? 'var(--primary)' : 'var(--bg3)',
                      color: coins >= v.price ? 'var(--primary-fg)' : 'var(--text-dim)',
                      opacity: coins >= v.price ? 1 : 0.6,
                      cursor: coins >= v.price ? 'pointer' : 'not-allowed'
                    }}
                    disabled={coins < v.price}
                    onClick={() => onBuy(v.id, v.price)}
                    aria-label={`Beli ${v.name} seharga ${v.price} koin`}
                  >
                    BELI
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
