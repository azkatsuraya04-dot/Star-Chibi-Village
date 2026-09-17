import React from 'react';
import { GameSaveData, Zone } from '../types/game';
import {
  Sparkles,
  Zap,
  ShoppingBag,
  Backpack,
  Map as MapIcon,
  Settings,
  Home,
  DoorOpen,
  Music,
} from 'lucide-react';

interface HUDProps {
  gameState: GameSaveData;
  onOpenInventory: () => void;
  onOpenShop: () => void;
  onOpenMap: () => void;
  onOpenSettings: () => void;
  onToggleBgm?: () => void;
  onLeaveInterior?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  onOpenInventory,
  onOpenShop,
  onOpenMap,
  onOpenSettings,
  onToggleBgm,
  onLeaveInterior,
}) => {
  const { coins, energy, hygiene, playerPos, bgmEnabled = true } = gameState;

  const getZoneLabel = (zone: Zone) => {
    switch (zone) {
      case 'village':
        return '🌸 Desa Bintang (Town)';
      case 'player_house':
        return '🏡 Rumah Kamu';
      case 'npc_house_bunny':
        return '🐰 Rumah Bunny Mimi';
      case 'npc_house_dog':
        return '🐶 Rumah Puppy Bobby';
      case 'npc_house_bear':
        return '🐻 Rumah Bear Kuma';
      case 'shop_interior':
        return '🏪 Toko Desa';
      default:
        return 'Desa Bintang';
    }
  };

  const isInterior = playerPos.zone !== 'village';

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-20">
      {/* Top Bar: Stats and Menu */}
      <div className="flex items-start justify-between gap-2 w-full">
        {/* Left: Player Stats (Coin, Energy, Hygiene) */}
        <div className="pointer-events-auto flex flex-col gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-sm border-2 border-[#e6dfd5] max-w-[280px] sm:max-w-xs transition-all">
          {/* Location Badge */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#f0ebe1]">
            <span className="text-xs font-semibold text-[#5d4037] truncate">
              {getZoneLabel(playerPos.zone)}
            </span>
            {isInterior && onLeaveInterior && (
              <button
                onClick={onLeaveInterior}
                className="flex items-center gap-1 bg-[#ffecb3] hover:bg-[#ffe082] text-[#6d4c41] px-2 py-0.5 rounded-full text-[11px] font-bold shadow-xs active:scale-95 transition-transform"
                title="Keluar ke Desa"
              >
                <DoorOpen className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            )}
          </div>

          {/* Coin Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-2 border-amber-500 flex items-center justify-center shadow-xs">
              <span className="text-sm font-bold">🪙</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-amber-700 font-bold leading-none">
                Coin
              </span>
              <span className="text-base font-extrabold text-[#3e2723] leading-tight">
                {coins}
              </span>
            </div>
          </div>

          {/* Energy Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px] font-bold text-[#455a64]">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Energy
              </span>
              <span>{energy}/100</span>
            </div>
            <div className="h-2.5 w-full bg-[#e2e8f0] rounded-full overflow-hidden p-0.5 border border-[#cbd5e1]">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${Math.max(0, Math.min(100, energy))}%` }}
              />
            </div>
          </div>

          {/* Hygiene Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px] font-bold text-[#006064]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 fill-cyan-400" />
                Hygiene
              </span>
              <span>{hygiene}/100</span>
            </div>
            <div className="h-2.5 w-full bg-[#e0f7fa] rounded-full overflow-hidden p-0.5 border border-[#b2ebf2]">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${Math.max(0, Math.min(100, hygiene))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Inventory Button */}
          <button
            onClick={onOpenInventory}
            id="btn-inventory"
            className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-white/95 hover:bg-[#fff9c4] text-[#5d4037] rounded-2xl shadow-md border-2 border-[#e0d6c3] active:scale-90 transition-all cursor-pointer group"
            title="Buka Inventory"
          >
            <Backpack className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold leading-none mt-0.5">Tas</span>
          </button>

          {/* Shop Button */}
          <button
            onClick={onOpenShop}
            id="btn-shop"
            className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-white/95 hover:bg-[#e1f5fe] text-[#0277bd] rounded-2xl shadow-md border-2 border-[#b3e5fc] active:scale-90 transition-all cursor-pointer group"
            title="Buka Toko"
          >
            <ShoppingBag className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold leading-none mt-0.5">Toko</span>
          </button>

          {/* Map Button */}
          <button
            onClick={onOpenMap}
            id="btn-map"
            className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-white/95 hover:bg-[#e8f5e9] text-[#2e7d32] rounded-2xl shadow-md border-2 border-[#c8e6c9] active:scale-90 transition-all cursor-pointer group"
            title="Peta Desa"
          >
            <MapIcon className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold leading-none mt-0.5">Peta</span>
          </button>

          {/* BGM Music Button */}
          {onToggleBgm && (
            <button
              onClick={onToggleBgm}
              id="btn-bgm-quick"
              className={`flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-white/95 rounded-2xl shadow-md border-2 active:scale-90 transition-all cursor-pointer group ${
                bgmEnabled
                  ? 'hover:bg-[#fff8e1] text-[#f57f17] border-[#ffe082]'
                  : 'hover:bg-gray-100 text-gray-400 border-gray-300 opacity-80'
              }`}
              title={bgmEnabled ? 'Matikan Musik' : 'Nyalakan Musik'}
            >
              <Music
                className={`w-5 h-5 transition-transform ${
                  bgmEnabled ? 'text-amber-500 group-hover:scale-110' : 'text-gray-400 line-through'
                }`}
              />
              <span className="text-[9px] font-bold leading-none mt-0.5">
                {bgmEnabled ? 'Musik' : 'Mute'}
              </span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            id="btn-settings"
            className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-white/95 hover:bg-[#f3e5f5] text-[#6a1b9a] rounded-2xl shadow-md border-2 border-[#e1bee7] active:scale-90 transition-all cursor-pointer group"
            title="Pengaturan"
          >
            <Settings className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold leading-none mt-0.5">Opsi</span>
          </button>
        </div>
      </div>

      {/* Bottom spacer for Virtual Controls */}
      <div className="w-full pointer-events-none" />
    </div>
  );
};
