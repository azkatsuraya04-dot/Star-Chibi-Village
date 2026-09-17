import React, { useState } from 'react';
import { soundManager } from '../utils/audio';
import { bgmEngine } from '../utils/bgm';
import { X, Volume2, VolumeX, RotateCcw, HelpCircle, Gamepad2, Music } from 'lucide-react';

interface SettingsModalProps {
  soundEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number;
  isOpen: boolean;
  onClose: () => void;
  onToggleSound: () => void;
  onToggleBgm: () => void;
  onChangeBgmVolume: (volume: number) => void;
  onResetGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  soundEnabled,
  bgmEnabled,
  bgmVolume,
  isOpen,
  onClose,
  onToggleSound,
  onToggleBgm,
  onChangeBgmVolume,
  onResetGame,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleConfirmReset = () => {
    onResetGame();
    setShowConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#fffdfa] rounded-3xl border-4 border-[#8d6e63] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#ab47bc] text-white px-5 py-3.5 flex items-center justify-between border-b-4 border-[#8e24aa]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-lg font-extrabold tracking-wide leading-tight">
                Pengaturan Game
              </h2>
              <p className="text-xs text-purple-100 font-medium">
                Sesuaikan suara dan kontrol permainan
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

        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Background Music (BGM) */}
          <div className="p-3.5 bg-white rounded-2xl border-2 border-[#e6dfd5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Music className={`w-5 h-5 ${bgmEnabled ? 'animate-bounce' : ''}`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-[#3e2723]">
                    Musik Latar (BGM)
                  </span>
                  <span className="text-xs text-[#795548]">
                    {bgmEnabled ? 'Musik desa bermain' : 'Musik dimatikan'}
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleBgm}
                id="btn-toggle-bgm"
                className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer ${
                  bgmEnabled
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {bgmEnabled ? 'NYALA' : 'MATI'}
              </button>
            </div>

            {/* Volume Slider & Track Card */}
            {bgmEnabled && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#6d4c41] font-semibold">
                  <span>Volume Musik:</span>
                  <span className="font-mono">{Math.round(bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => onChangeBgmVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />

                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-[#5d4037] leading-relaxed">
                  <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <span>🎵</span>
                    <span>Track: Sunny Chibi Village Promenade</span>
                  </p>
                  <p className="text-[#795548] mt-0.5">
                    Original Cozy Instrumental • Akustik Gitar, Piano, Ukulele, Bells, Marimba & Bass
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-[#e6dfd5] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-[#3e2723]">
                  Efek Suara (Audio FX)
                </span>
                <span className="text-xs text-[#795548]">
                  {soundEnabled ? 'Suara aktif' : 'Suara dimatikan'}
                </span>
              </div>
            </div>

            <button
              onClick={onToggleSound}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {soundEnabled ? 'NYALA' : 'MATI'}
            </button>
          </div>

          {/* Controls Guide */}
          <div className="p-4 bg-white rounded-2xl border-2 border-[#e6dfd5] shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#5d4037]">
              <Gamepad2 className="w-4 h-4 text-purple-600" />
              <span>Panduan Kontrol:</span>
            </div>
            <ul className="text-xs text-[#6d4c41] space-y-1.5 list-disc list-inside">
              <li>
                <span className="font-bold">Gerak:</span> Gunakan tombol <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">W</kbd><kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">A</kbd><kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">S</kbd><kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">D</kbd> atau <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">Panah Arah</kbd>.
              </li>
              <li>
                <span className="font-bold">Masuk / Keluar Rumah:</span> Dekati pintu dan tekan tombol <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border font-mono font-bold">ENTER</kbd>.
              </li>
              <li>
                <span className="font-bold">Interaksi (NPC / Objek):</span> Dekati NPC atau objek (kebun, kasur, bak mandi, toko) dan tekan tombol <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border font-mono font-bold">E</kbd>.
              </li>
              <li>
                <span className="font-bold">Mobile:</span> Sentuh tombol arah D-pad di kiri bawah dan tombol bulat AKSI di kanan bawah.
              </li>
            </ul>
          </div>

          {/* Game Tips */}
          <div className="p-4 bg-[#fff9c4] rounded-2xl border-2 border-[#fff176] shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>Tips Petualangan:</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              ⭐ Tanam bibit Star Seed di Kebun. Tunggu ~30 detik hingga menjadi bintang emas, lalu panen untuk mendapatkan 50 Coin!
            </p>
            <p className="text-xs text-amber-950 leading-relaxed">
              🛁 Mandi di rumah untuk menambah Hygiene +30, dan tidur di kasur jika kehabisan energi!
            </p>
          </div>

          {/* Reset Save Section */}
          <div className="pt-2">
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Ulang Progress Game</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 text-center">
                <p className="text-xs font-bold text-rose-900">
                  Yakin ingin mereset seluruh coin, tanaman, dan inventory ke awal?
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleConfirmReset}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg shadow-xs cursor-pointer"
                  >
                    Ya, Reset
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-[#424242] font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
