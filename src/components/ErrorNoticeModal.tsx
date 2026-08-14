import React from 'react';
import { AlertCircle, Coins, Sword, X } from 'lucide-react';

interface ErrorNoticeModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  requiredGold?: number;
  currentGold?: number;
  onClose: () => void;
  onGoToDungeon?: () => void;
}

export const ErrorNoticeModal: React.FC<ErrorNoticeModalProps> = ({
  isOpen,
  title = 'Insufficient Gold!',
  message,
  requiredGold,
  currentGold,
  onClose,
  onGoToDungeon,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-rose-200">{title}</h3>
            <p className="text-xs text-slate-400">Transaction Cancelled</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>

        {requiredGold !== undefined && currentGold !== undefined && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Required Gold</span>
              <span className="font-mono font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                {requiredGold.toLocaleString()} Gold
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Your Current Gold</span>
              <span className="font-mono font-bold text-rose-400 flex items-center gap-1 mt-0.5">
                <Coins className="h-3.5 w-3.5 text-rose-400" />
                {currentGold.toLocaleString()} Gold
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {onGoToDungeon && (
            <button
              onClick={() => {
                onClose();
                onGoToDungeon();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Sword className="h-4 w-4" /> Go to Dungeon Dive (Earn Gold)
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close Notice
          </button>
        </div>
      </div>
    </div>
  );
};
