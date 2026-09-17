import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand } from 'lucide-react';

interface VirtualControlsProps {
  onDirectionChange: (vector: { x: number; y: number }) => void;
  onActionClick: () => void;
  hasAvailableAction: boolean;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onDirectionChange,
  onActionClick,
  hasAvailableAction,
}) => {
  // Active pressed keys state for multi-touch D-pad
  const pressedDirections = React.useRef({ up: false, down: false, left: false, right: false });

  const updateVector = () => {
    let vx = 0;
    let vy = 0;
    if (pressedDirections.current.left) vx -= 1;
    if (pressedDirections.current.right) vx += 1;
    if (pressedDirections.current.up) vy -= 1;
    if (pressedDirections.current.down) vy += 1;
    onDirectionChange({ x: vx, y: vy });
  };

  const handlePress = (dir: 'up' | 'down' | 'left' | 'right', isPressed: boolean) => {
    pressedDirections.current[dir] = isPressed;
    updateVector();
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 px-4 pb-2 z-20 flex justify-between items-end">
      {/* Virtual D-Pad on Left */}
      <div className="pointer-events-auto select-none touch-none relative w-36 h-36 bg-white/70 backdrop-blur-md rounded-full border-2 border-white/60 shadow-lg p-1.5 flex items-center justify-center">
        {/* Up */}
        <button
          type="button"
          aria-label="Move Up"
          className="absolute top-1 left-1/2 -translate-x-1/2 w-11 h-11 bg-white hover:bg-amber-100 active:bg-amber-200 text-[#5d4037] rounded-xl flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer border border-[#d7ccc8]"
          onPointerDown={() => handlePress('up', true)}
          onPointerUp={() => handlePress('up', false)}
          onPointerCancel={() => handlePress('up', false)}
        >
          <ArrowUp className="w-6 h-6" />
        </button>

        {/* Down */}
        <button
          type="button"
          aria-label="Move Down"
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-11 h-11 bg-white hover:bg-amber-100 active:bg-amber-200 text-[#5d4037] rounded-xl flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer border border-[#d7ccc8]"
          onPointerDown={() => handlePress('down', true)}
          onPointerUp={() => handlePress('down', false)}
          onPointerCancel={() => handlePress('down', false)}
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        {/* Left */}
        <button
          type="button"
          aria-label="Move Left"
          className="absolute left-1 top-1/2 -translate-y-1/2 w-11 h-11 bg-white hover:bg-amber-100 active:bg-amber-200 text-[#5d4037] rounded-xl flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer border border-[#d7ccc8]"
          onPointerDown={() => handlePress('left', true)}
          onPointerUp={() => handlePress('left', false)}
          onPointerCancel={() => handlePress('left', false)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Right */}
        <button
          type="button"
          aria-label="Move Right"
          className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 bg-white hover:bg-amber-100 active:bg-amber-200 text-[#5d4037] rounded-xl flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer border border-[#d7ccc8]"
          onPointerDown={() => handlePress('right', true)}
          onPointerUp={() => handlePress('right', false)}
          onPointerCancel={() => handlePress('right', false)}
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* Center Pad */}
        <div className="w-8 h-8 rounded-full bg-amber-100/70 border border-amber-300 flex items-center justify-center">
          <span className="text-xs text-amber-800">🐾</span>
        </div>
      </div>

      {/* Primary Action Button on Right */}
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={onActionClick}
          id="btn-mobile-action"
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center shadow-xl border-4 active:scale-90 transition-all cursor-pointer ${
            hasAvailableAction
              ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-white text-[#3e2723] animate-pulse ring-4 ring-amber-400/40'
              : 'bg-white/85 border-[#d7ccc8] text-[#8d6e63]'
          }`}
          title="Tombol Aksi"
        >
          <Hand className="w-7 h-7 sm:w-8 sm:h-8 mb-0.5" />
          <span className="text-[10px] font-extrabold tracking-wide uppercase">
            Aksi
          </span>
        </button>
      </div>
    </div>
  );
};
