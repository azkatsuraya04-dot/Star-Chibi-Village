import React from 'react';
import { soundManager } from '../utils/audio';
import { Gift, Sparkles } from 'lucide-react';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClaim: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClaim }) => {
  if (!isOpen) return null;

  const handleClaim = () => {
    soundManager.playCoin();
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-[#fffdfa] rounded-3xl border-4 border-[#ffb300] shadow-2xl overflow-hidden text-center p-6 flex flex-col items-center">
        {/* Glow & Gift icon */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-200 border-4 border-white shadow-xl flex items-center justify-center text-5xl mb-4 animate-bounce-slow">
          🎁
          <div className="absolute -top-2 -right-2 bg-pink-500 text-white p-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-extrabold text-[#3e2723] mb-1">
          Hadiah Harian!
        </h2>
        <p className="text-xs text-[#795548] font-medium mb-4">
          Selamat datang kembali di Desa Bintang! Ambil bonus coin harianmu untuk berbelanja dan berkebun.
        </p>

        {/* Reward Box */}
        <div className="w-full bg-[#fff9c4] border-2 border-dashed border-amber-400 rounded-2xl py-3 px-4 mb-5 flex items-center justify-center gap-3">
          <span className="text-3xl">🪙</span>
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Bonus Hari Ini
            </span>
            <span className="text-xl font-black text-[#e65100]">
              +20 Coin
            </span>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          id="btn-claim-daily"
          className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-[#3e2723] font-black rounded-2xl text-sm sm:text-base shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-yellow-200"
        >
          <Gift className="w-5 h-5" />
          <span>Klaim 20 Coin Sekarang</span>
        </button>
      </div>
    </div>
  );
};
