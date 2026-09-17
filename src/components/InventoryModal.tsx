import React, { useState } from 'react';
import { InventoryItem, Zone } from '../types/game';
import { X, Backpack, Utensils, Home, Sparkles } from 'lucide-react';

interface InventoryModalProps {
  inventory: InventoryItem[];
  currentZone: Zone;
  isOpen: boolean;
  onClose: () => void;
  onUseFood: (item: InventoryItem) => void;
  onPlaceDecoration: (item: InventoryItem) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  currentZone,
  isOpen,
  onClose,
  onUseFood,
  onPlaceDecoration,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'food' | 'seed' | 'decoration'>('all');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const validItems = inventory.filter((item) => item.count > 0);

  const filteredItems = validItems.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2000);
  };

  const handleUseItem = (item: InventoryItem) => {
    if (item.type === 'food') {
      onUseFood(item);
      showFeedback(`Nyam! Kamu memakan ${item.name} (+${item.energyBonus || 25} Energy)`);
    } else if (item.type === 'decoration') {
      if (currentZone === 'player_house') {
        onPlaceDecoration(item);
        showFeedback(`✨ ${item.name} dipasang di rumahmu!`);
      } else {
        showFeedback(`🏡 Masuk ke rumahmu terlebih dahulu untuk memasang dekorasi!`);
      }
    } else if (item.type === 'seed') {
      showFeedback(`⭐ Bawa bibit ini ke petak tanah di Kebun Bintang untuk menanam!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#fffdfa] rounded-3xl border-4 border-[#8d6e63] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#ffa726] text-white px-5 py-4 flex items-center justify-between border-b-4 border-[#f57c00]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
              🎒
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-wide leading-tight">
                Tas Inventory
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Koleksi makanan, bibit tanaman, dan dekorasimu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filter */}
        <div className="bg-[#f5f0e8] px-4 py-2.5 flex items-center justify-between border-b-2 border-[#e6dfd5]">
          <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-[#d7ccc8] w-full justify-around">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#ffa726] text-white shadow-xs'
                  : 'text-[#6d4c41] hover:bg-black/5'
              }`}
            >
              Semua ({validItems.length})
            </button>
            <button
              onClick={() => setActiveTab('food')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'food'
                  ? 'bg-[#ffa726] text-white shadow-xs'
                  : 'text-[#6d4c41] hover:bg-black/5'
              }`}
            >
              🍎 Makanan
            </button>
            <button
              onClick={() => setActiveTab('seed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'seed'
                  ? 'bg-[#ffa726] text-white shadow-xs'
                  : 'text-[#6d4c41] hover:bg-black/5'
              }`}
            >
              ⭐ Bibit
            </button>
            <button
              onClick={() => setActiveTab('decoration')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'decoration'
                  ? 'bg-[#ffa726] text-white shadow-xs'
                  : 'text-[#6d4c41] hover:bg-black/5'
              }`}
            >
              🌱 Dekor
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div className="bg-[#e8f5e9] text-[#2e7d32] px-4 py-2 text-xs font-bold border-b border-[#c8e6c9] flex items-center gap-1.5 transition-all">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Item List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <span className="text-4xl mb-2">🎒</span>
              <p className="text-sm font-bold text-[#8d6e63]">Tas kosong untuk kategori ini</p>
              <p className="text-xs text-[#a1887f] mt-1">
                Kunjungi Toko Desa untuk membeli makanan atau bibit!
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-2xl border-2 border-[#e6dfd5] shadow-xs gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#fff9c4] border border-amber-200 flex items-center justify-center text-2xl shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#3e2723]">
                        {item.name}
                      </span>
                      <span className="text-xs font-extrabold bg-[#ffe082] text-[#e65100] px-2 py-0.5 rounded-full">
                        x{item.count}
                      </span>
                    </div>
                    <p className="text-xs text-[#6d4c41]">{item.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  {item.type === 'food' && (
                    <button
                      onClick={() => handleUseItem(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#66bb6a] hover:bg-[#4caf50] text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-transform cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Makan</span>
                    </button>
                  )}

                  {item.type === 'decoration' && (
                    <button
                      onClick={() => handleUseItem(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#42a5f5] hover:bg-[#1e88e5] text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-transform cursor-pointer"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Pasang</span>
                    </button>
                  )}

                  {item.type === 'seed' && (
                    <button
                      onClick={() => handleUseItem(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#ffa726] hover:bg-[#fb8c00] text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-transform cursor-pointer"
                    >
                      <span>⭐ Info</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#f5f0e8] px-4 py-2.5 text-center border-t-2 border-[#e6dfd5]">
          <span className="text-[11px] text-[#795548] font-medium">
            Makan buah & kue untuk memulihkan Energy kamu saat lelah!
          </span>
        </div>
      </div>
    </div>
  );
};
