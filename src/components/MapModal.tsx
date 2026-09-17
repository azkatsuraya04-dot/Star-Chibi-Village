import React from 'react';
import { Zone } from '../types/game';
import { X, MapPin } from 'lucide-react';

interface MapModalProps {
  currentZone: Zone;
  isOpen: boolean;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ currentZone, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getLocationBadge = () => {
    switch (currentZone) {
      case 'village':
        return 'Sedang berada di jalan desa';
      case 'player_house':
        return 'Sedang di dalam Rumah Pemain';
      case 'npc_house_bunny':
        return 'Sedang di dalam Rumah Bunny Mimi';
      case 'npc_house_dog':
        return 'Sedang di dalam Rumah Puppy Bobby';
      case 'npc_house_bear':
        return 'Sedang di dalam Rumah Bear Kuma';
      case 'shop_interior':
        return 'Sedang di dalam Toko Desa';
      default:
        return 'Desa Bintang';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#fffdfa] rounded-3xl border-4 border-[#8d6e63] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#66bb6a] text-white px-5 py-3.5 flex items-center justify-between border-b-4 border-[#43a047]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-lg font-extrabold tracking-wide leading-tight">
                Peta Desa Bintang
              </h2>
              <p className="text-xs text-emerald-100 font-medium">{getLocationBadge()}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Blueprint Drawing */}
        <div className="p-5 bg-[#eaf4d3] flex flex-col items-center">
          <div className="w-full max-w-sm bg-[#9edb74] p-4 rounded-2xl border-3 border-[#7cb342] shadow-inner relative flex flex-col items-center gap-3">
            {/* House 1: Player House */}
            <div className="relative w-28 p-2 bg-[#fff9c4] border-2 border-[#ef5350] rounded-xl text-center shadow-xs">
              <span className="text-lg">🏡</span>
              <div className="text-[11px] font-extrabold text-[#3e2723]">Rumah Pemain</div>
              {currentZone === 'player_house' && (
                <div className="absolute -top-3 -right-2 bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 animate-bounce">
                  <MapPin className="w-3 h-3" /> Kamu
                </div>
              )}
            </div>

            {/* Vertical connector */}
            <div className="w-2 h-4 bg-[#d7c19b] rounded-full" />

            {/* Middle Row: Bunny House - Town Square - Shop */}
            <div className="w-full flex items-center justify-between gap-1">
              {/* Bunny House */}
              <div className="relative w-24 p-2 bg-[#fce4ec] border-2 border-[#f06292] rounded-xl text-center shadow-xs">
                <span className="text-base">🐰</span>
                <div className="text-[10px] font-extrabold text-[#3e2723]">Rumah Bunny</div>
                {currentZone === 'npc_house_bunny' && (
                  <div className="absolute -top-3 -right-2 bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 animate-bounce">
                    <MapPin className="w-3 h-3" /> Kamu
                  </div>
                )}
              </div>

              {/* Path */}
              <div className="h-2 flex-1 bg-[#d7c19b]" />

              {/* Town Square */}
              <div className="relative w-28 p-2 bg-[#f5e4cc] border-2 border-[#bcaaa4] rounded-full text-center shadow-xs flex flex-col items-center">
                <span className="text-lg animate-spin-slow">⛲</span>
                <div className="text-[10px] font-extrabold text-[#5d4037]">Town Square</div>
                {currentZone === 'village' && (
                  <div className="absolute -top-3 bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 animate-bounce">
                    <MapPin className="w-3 h-3" /> Kamu
                  </div>
                )}
              </div>

              {/* Path */}
              <div className="h-2 flex-1 bg-[#d7c19b]" />

              {/* Shop */}
              <div className="relative w-24 p-2 bg-[#e3f2fd] border-2 border-[#42a5f5] rounded-xl text-center shadow-xs">
                <span className="text-base">🏪</span>
                <div className="text-[10px] font-extrabold text-[#0d47a1]">Toko Desa</div>
                {currentZone === 'shop_interior' && (
                  <div className="absolute -top-3 -right-2 bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 animate-bounce">
                    <MapPin className="w-3 h-3" /> Kamu
                  </div>
                )}
              </div>
            </div>

            {/* Vertical connector */}
            <div className="w-2 h-4 bg-[#d7c19b] rounded-full" />

            {/* Star Garden */}
            <div className="w-36 p-2 bg-[#c7a379] border-2 border-[#8d6e63] rounded-xl text-center shadow-xs">
              <span className="text-base">⭐🌱</span>
              <div className="text-[11px] font-extrabold text-[#3e2723]">Kebun Star Plant</div>
              <div className="text-[9px] text-[#4e342e] font-semibold">(4 Petak Tanah)</div>
            </div>

            {/* Vertical connector */}
            <div className="w-2 h-4 bg-[#d7c19b] rounded-full" />

            {/* Bottom Row: Dog House & Bear House */}
            <div className="w-full flex items-center justify-around gap-2">
              {/* Dog House */}
              <div className="relative w-28 p-2 bg-[#fff3e0] border-2 border-[#ffa726] rounded-xl text-center shadow-xs">
                <span className="text-base">🐶</span>
                <div className="text-[10px] font-extrabold text-[#3e2723]">Rumah Puppy</div>
                {currentZone === 'npc_house_dog' && (
                  <div className="absolute -top-3 -right-2 bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 animate-bounce">
                    <MapPin className="w-3 h-3" /> Kamu
                  </div>
                )}
              </div>

              {/* Bear House */}
              <div className="relative w-28 p-2 bg-[#efebe9] border-2 border-[#8d6e63] rounded-xl text-center shadow-xs">
                <span className="text-base">🐻</span>
                <div className="text-[10px] font-extrabold text-[#3e2723]">Rumah Bear</div>
                {currentZone === 'npc_house_bear' && (
                  <div className="absolute -top-3 -right-2 bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 animate-bounce">
                    <MapPin className="w-3 h-3" /> Kamu
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f5f0e8] px-5 py-3 border-t-2 border-[#e6dfd5] text-center">
          <p className="text-xs text-[#795548] font-medium">
            Gunakan tombol panah / WASD / D-pad untuk menjelajahi desa secara bebas!
          </p>
        </div>
      </div>
    </div>
  );
};
