import React from 'react';
import { Sparkles } from 'lucide-react';

export interface ActionInfo {
  type: 'door' | 'npc' | 'plot' | 'bath' | 'bed' | 'shop';
  title: string;
  subtitle?: string;
  icon: string;
  targetId?: string | number;
  highlight?: boolean;
  promptText?: string;
  keyLabel?: string;
}

interface ActionPromptProps {
  action: ActionInfo | null;
  onExecute: () => void;
}

export const ActionPrompt: React.FC<ActionPromptProps> = ({ action, onExecute }) => {
  if (!action) return null;

  const isDoor = action.type === 'door';
  const isNPC = action.type === 'npc';

  // Interaction system text:
  // Can be customized via action.promptText (e.g. "Press E to Plant", "Growing...", "Press E to Harvest")
  const promptMainText = action.promptText || (
    isDoor
      ? (action.targetId === 'village' ? 'Press ENTER to Exit' : 'Press ENTER to Enter')
      : isNPC
      ? 'Press E to Talk'
      : 'Press E to Interact'
  );

  const keyLabel = action.keyLabel || (isDoor ? 'ENTER' : 'E');

  return (
    <div className="pointer-events-none absolute bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
      <button
        onClick={onExecute}
        type="button"
        id="btn-action-prompt"
        className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer active:scale-95 border-2 animate-bounce-slow ${
          action.highlight
            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-[#3e2723] border-yellow-200 ring-4 ring-yellow-300/50'
            : 'bg-white/95 text-[#4e342e] border-[#e6dfd5] hover:bg-[#fff9c4]'
        }`}
      >
        <span className="text-2xl shrink-0">{action.icon}</span>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm sm:text-base leading-tight tracking-tight text-[#3e2723]">
              {promptMainText}
            </span>
            {action.highlight && (
              <Sparkles className="w-4 h-4 text-amber-900 fill-amber-700 animate-spin shrink-0" />
            )}
          </div>
          <span className="text-[11px] font-bold text-[#6d4c41]/80 leading-tight mt-0.5">
            {action.title}
          </span>
        </div>
        <div className="ml-1.5 flex items-center gap-1 px-2.5 py-1 bg-amber-100/90 border border-amber-300 text-amber-950 rounded-lg text-xs font-black tracking-wider shadow-xs">
          <kbd className="font-mono">{keyLabel}</kbd>
          <span className="text-[10px] text-amber-700/80 font-semibold sm:hidden">/ TAP</span>
        </div>
      </button>
    </div>
  );
};
