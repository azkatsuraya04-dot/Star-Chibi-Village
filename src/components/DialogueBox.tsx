import React, { useState, useEffect } from 'react';
import { NPC } from '../types/game';
import { soundManager } from '../utils/audio';
import { MessageSquare, ArrowRight, Check } from 'lucide-react';

interface DialogueBoxProps {
  npc: NPC | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ npc, isOpen, onClose }) => {
  const [dialogueIndex, setDialogueIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setDialogueIndex(0);
      soundManager.playTalk();
    }
  }, [isOpen, npc]);

  const currentText = npc?.dialogue[dialogueIndex] || npc?.dialogue[0] || '';
  const isLast = !npc ? true : dialogueIndex >= npc.dialogue.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      soundManager.playTalk();
      setDialogueIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key.toLowerCase() === 'e' || e.code === 'KeyE') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLast, dialogueIndex]);

  if (!isOpen || !npc) return null;

  const getEmoji = (species: string) => {
    switch (species) {
      case 'bunny':
        return '🐰';
      case 'dog':
        return '🐶';
      case 'bear':
        return '🐻';
      default:
        return '🐾';
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-6 sm:bottom-12 z-50 flex justify-center px-4 pointer-events-auto">
      <div className="w-full max-w-lg bg-[#fffdfa] rounded-3xl border-4 border-[#8d6e63] shadow-2xl p-4 sm:p-5 flex items-start gap-4">
        {/* NPC Avatar Portrait */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#fff9c4] border-3 border-[#ffd54f] shadow-inner flex items-center justify-center shrink-0 text-3xl sm:text-4xl animate-bounce-slow">
          {getEmoji(npc.species)}
          <span className="absolute -bottom-1 -right-1 text-xs">💬</span>
        </div>

        {/* Content & Dialogue */}
        <div className="flex-1 flex flex-col justify-between min-h-[75px]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs sm:text-sm font-black text-[#5d4037] bg-[#ffecb3] px-2.5 py-0.5 rounded-full border border-[#ffe082]">
                {npc.name}
              </span>
              <span className="text-[10px] text-[#8d6e63] font-bold">
                ({dialogueIndex + 1}/{npc.dialogue.length})
              </span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-[#3e2723] leading-relaxed pt-0.5">
              "{currentText}"
            </p>
          </div>

          {/* Advance Button */}
          <div className="flex justify-end mt-3">
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#ffa726] hover:bg-[#fb8c00] text-[#3e2723] rounded-xl font-extrabold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>{isLast ? 'Selesai Bicara [E]' : 'Lanjut [E]'}</span>
              {isLast ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
