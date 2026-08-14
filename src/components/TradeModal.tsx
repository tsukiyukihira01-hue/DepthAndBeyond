import React, { useState } from 'react';
import { Character, Item } from '../types/game';
import { ArrowLeftRight, Lock, Check, Coins, ShieldAlert, X } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  partnerName: string;
  character: Character;
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  partnerName,
  character,
  onClose,
}) => {
  const [tradeStep, setTradeStep] = useState<'OFFER' | 'LOCK' | 'CONFIRM' | 'SWAP'>('OFFER');
  const [offeredGold, setOfferedGold] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleLock = () => {
    setIsLocked(true);
    setTradeStep('LOCK');
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    setTradeStep('CONFIRM');

    setTimeout(() => {
      setTradeStep('SWAP');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-950/95 p-6 text-slate-100 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-100">
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ArrowLeftRight className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200">
              Direct Player Trade with {partnerName}
            </h2>
            <p className="text-xs text-slate-400">
              State: <span className="font-bold text-amber-300">{tradeStep}</span> • Level 25 Verified
            </p>
          </div>
        </div>

        {/* Trade State Machine Visualizer */}
        <div className="grid grid-cols-4 gap-1 my-4 text-[10px] font-bold text-center">
          {['OFFER', 'LOCK', 'CONFIRM', 'ATOMIC SWAP'].map((step, idx) => (
            <div
              key={step}
              className={`rounded-lg py-1 border ${
                tradeStep === step || (idx === 0 && tradeStep !== 'OFFER')
                  ? 'border-amber-400 bg-amber-950/40 text-amber-200'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              {step}
            </div>
          ))}
        </div>

        {/* Gold Input */}
        <div className="space-y-2 text-xs my-4">
          <label className="text-slate-300 flex items-center gap-1 font-semibold">
            <Coins className="h-3.5 w-3.5 text-amber-400" /> Offer Gold Amount:
          </label>
          <input
            type="number"
            disabled={isLocked}
            value={offeredGold}
            onChange={(e) => setOfferedGold(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4 text-xs font-bold">
          {!isLocked ? (
            <button
              onClick={handleLock}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-slate-950 hover:bg-amber-400 cursor-pointer"
            >
              <Lock className="h-4 w-4" /> Lock Offer
            </button>
          ) : tradeStep !== 'SWAP' ? (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              <Check className="h-4 w-4" /> Confirm & Execute Atomic Swap
            </button>
          ) : (
            <div className="text-emerald-400 font-bold text-sm">
              ✨ Atomic Trade Executed Successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
