import React from 'react';
import { Item } from '../../types/game';
import { ItemStatCard } from '../ItemStatCard';
import { ArrowRight, RotateCcw, MapPin, Building, Eye, Trophy } from 'lucide-react';

interface VictoryLootData {
  exp: number;
  gold: number;
  petExp: number;
  items: Item[];
}

interface CombatVictoryModalProps {
  currentFloor: number;
  victoryLootData: VictoryLootData;
  consumedHpVials: number;
  consumedMpVials: number;
  playerHp: number;
  playerMana: number;
  inspectedLootItem: Item | null;
  onInspectItem: (item: Item | null) => void;
  onNextFloor: () => void;
  onRechallenge: () => void;
  onRetreatToMap: () => void;
  onRetreatToCity: () => void;
  characterLevel: number;
}

export const CombatVictoryModal: React.FC<CombatVictoryModalProps> = ({
  currentFloor,
  victoryLootData,
  consumedHpVials,
  consumedMpVials,
  playerHp,
  playerMana,
  inspectedLootItem,
  onInspectItem,
  onNextFloor,
  onRechallenge,
  onRetreatToMap,
  onRetreatToCity,
  characterLevel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-amber-500/50 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
        {/* Title Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-2xl">
            🏆
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-amber-200">
              Floor {currentFloor} Challenge Victory!
            </h3>
            <p className="text-xs text-slate-400">Encounter Cleared & Rewards Added to Inventory</p>
          </div>
        </div>

        {/* Exp & Gold Rewards */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-2.5">
            <span className="text-[10px] text-amber-400 font-semibold block">Gold Acquired</span>
            <span className="font-mono font-bold text-amber-200 text-sm">+{victoryLootData.gold}</span>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2.5">
            <span className="text-[10px] text-emerald-400 font-semibold block">Player EXP</span>
            <span className="font-mono font-bold text-emerald-200 text-sm">+{victoryLootData.exp}</span>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/40 p-2.5">
            <span className="text-[10px] text-purple-400 font-semibold block">Pet EXP</span>
            <span className="font-mono font-bold text-purple-200 text-sm">
              {victoryLootData.petExp > 0 ? `+${victoryLootData.petExp}` : '0 (No Pet)'}
            </span>
          </div>
        </div>

        {/* Dropped Items Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300">
            Loot Items Dropped ({victoryLootData.items.length}):
          </h4>
          {victoryLootData.items.length > 0 ? (
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {victoryLootData.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onInspectItem(item)}
                  className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs hover:border-amber-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div className="overflow-hidden min-w-0 flex-1">
                      <div className="font-bold text-amber-200 truncate flex items-center gap-1">
                        <span className="truncate">{item.name}</span>
                        <Eye className="h-3 w-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                      {item.rarity}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-bold">x{item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No equipment drops this encounter.</p>
          )}
        </div>

        {/* Consumed Items Summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1">
          <span className="font-bold text-slate-400 text-[11px] block">Combat Consumables Summary:</span>
          <div className="flex items-center justify-between text-slate-300">
            <span>🧪 Health Vials Consumed:</span>
            <span className="font-mono font-bold text-rose-400">{consumedHpVials}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>💧 Mana Vials Consumed:</span>
            <span className="font-mono font-bold text-sky-400">{consumedMpVials}</span>
          </div>
        </div>

        {/* Modal Navigation Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onNextFloor}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" /> Next Floor #{currentFloor + 1}
          </button>

          <button
            onClick={onRechallenge}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Quick Re-challenge
          </button>

          <button
            onClick={onRetreatToMap}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <MapPin className="h-4 w-4 text-amber-400" /> World Map
          </button>

          <button
            onClick={onRetreatToCity}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <Building className="h-4 w-4 text-sky-400" /> City Sanctuary
          </button>
        </div>
      </div>

      {/* Inspected Loot Item Stat Card Overlay */}
      {inspectedLootItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => onInspectItem(null)}
              className="absolute top-4 right-3 z-20 rounded-lg bg-slate-900/90 p-1.5 text-slate-400 hover:text-slate-100 border border-slate-700 cursor-pointer"
              title="Close item inspection"
            >
              ✕
            </button>
            <ItemStatCard item={inspectedLootItem} characterLevel={characterLevel} />
          </div>
        </div>
      )}
    </div>
  );
};
