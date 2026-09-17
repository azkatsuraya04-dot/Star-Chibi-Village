import React, { useState } from 'react';
import { InventoryItem } from '../types/game';
import { SHOP_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { X, ShoppingBag, Check } from 'lucide-react';

interface ShopModalProps {
  coins: number;
  inventory: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onBuyItem: (item: InventoryItem) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  inventory,
  isOpen,
  onClose,
  onBuyItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'seed' | 'decoration'>('all');
  const [purchasedItemId, setPurchasedItemId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.type === selectedCategory;
  });

  const handleBuy = (item: InventoryItem) => {
    if (coins < item.price) return;
    soundManager.playCoin();
    onBuyItem(item);
    setPurchasedItemId(item.id);
    setTimeout(() => setPurchasedItemId(null), 800);
  };

  const getItemCountInInventory = (itemId: string) => {
    const found = inventory.find((i) => i.id === itemId);
    return found ? found.count : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#fffdfa] rounded-3xl border-4 border-[#8d6e63] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#42a5f5] text-white px-5 py-4 flex items-center justify-between border-b-4 border-[#1e88e5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
              🏪
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-wide leading-tight">
                Toko Desa Bintang
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Pilih makanan, bibit tanaman bintang, dan dekorasi!
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

        {/* Sub-header: Current Coins & Filter Tabs */}
        <div className="bg-[#f5f0e8] px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#e6dfd5]">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-[#d7ccc8]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#42a5f5] text-white shadow-xs'
                  : 'text-[#6d4c41] hover:bg-black/5'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedCategory('food')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'food'
                  ? 'bg-[#42a5f5] text-white shadow-xs'
                  : 'text-[#6d4c41] hover:bg-black/5'
              }`}
            >
              🍎 Makanan
            </button>
            <button
              onClick={() => setSelectedCategory('seed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'seed'
                  ? 'bg-[#42a5f5] text-white shadow-xs'
                  : 'text-[#6d4c41] hover:bg-black/5'
              }`}
            >
              ⭐ Bibit
            </button>
            <button
              onClick={() => setSelectedCategory('decoration')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'decoration'
                  ? 'bg-[#42a5f5] text-white shadow-xs'
                  : 'text-[#6d4c41] hover:bg-black/5'
              }`}
            >
              🌱 Dekorasi
            </button>
          </div>

          {/* Current Coin display */}
          <div className="flex items-center gap-1.5 bg-amber-100/80 px-3 py-1 rounded-xl border border-amber-300">
            <span className="text-base">🪙</span>
            <span className="text-xs font-bold text-amber-900">Uang Kamu:</span>
            <span className="text-sm font-extrabold text-[#3e2723]">{coins}</span>
          </div>
        </div>

        {/* Shop Items List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredItems.map((item) => {
            const canAfford = coins >= item.price;
            const countInBag = getItemCountInInventory(item.id);
            const isJustBought = purchasedItemId === item.id;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-[#e6dfd5] hover:border-[#b3e5fc] transition-all shadow-xs gap-3"
              >
                {/* Left info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#fff9c4] border-2 border-[#fff176] flex items-center justify-center text-3xl shadow-xs shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-[#3e2723]">
                        {item.name}
                      </span>
                      {countInBag > 0 && (
                        <span className="text-[10px] font-bold bg-[#e0f2f1] text-[#00796b] px-2 py-0.5 rounded-full">
                          Dimiliki: {countInBag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6d4c41] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right price & buy action */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 text-sm font-extrabold text-amber-800">
                    <span>🪙</span>
                    <span>{item.price} Coin</span>
                  </div>

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer shadow-xs ${
                      isJustBought
                        ? 'bg-emerald-500 text-white'
                        : canAfford
                        ? 'bg-[#ffb300] hover:bg-[#ffa000] text-[#3e2723]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isJustBought ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Dibeli!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Beli</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="bg-[#f5f0e8] px-5 py-3 text-center border-t-2 border-[#e6dfd5]">
          <p className="text-xs text-[#795548] font-medium">
            💡 Tips: Tanam <span className="font-bold">Star Seed</span> di kebun untuk memanen <span className="font-bold text-amber-700">+50 Coin</span>!
          </p>
        </div>
      </div>
    </div>
  );
};
