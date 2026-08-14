import React, { useState } from 'react';
import { Item, PoeCurrencyType } from '../../types/game';
import { POE_CURRENCIES } from '../../data/poeItemsData';
import { applyPoeCurrencyOrb } from '../../utils/poeItemUtils';
import { PoEItemCard } from './PoEItemCard';
import { Hammer, Sparkles, RefreshCw, Flame, AlertCircle } from 'lucide-react';
import { audio } from '../../utils/audio';

interface PoECraftingBenchProps {
  inventory: (Item | null)[];
  onUpdateInventory: (updatedInv: (Item | null)[]) => void;
  gold: number;
  onDeductGold: (amount: number) => void;
}

export const PoECraftingBench: React.FC<PoECraftingBenchProps> = ({
  inventory,
  onUpdateInventory,
  gold,
  onDeductGold,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [craftingLogs, setCraftingLogs] = useState<Array<{ id: string; msg: string; type: 'success' | 'error' | 'info' }>>([]);

  // Find gear items in inventory
  const gearItems = inventory
    .map((item, idx) => ({ item, idx }))
    .filter((slot): slot is { item: Item; idx: number } => slot.item !== null && slot.item.type === 'gear');

  const selectedItem = selectedSlotIndex !== null ? inventory[selectedSlotIndex] : null;

  const handleApplyOrb = (orbType: PoeCurrencyType) => {
    if (selectedSlotIndex === null || !selectedItem) {
      audio.playDefeat();
      addLog('Select an Equipment Gear piece to craft on!', 'error');
      return;
    }

    const orbInfo = POE_CURRENCIES[orbType];
    const orbCostGold = 100; // Small gold fee for orb crafting bench use

    if (gold < orbCostGold) {
      audio.playDefeat();
      addLog(`Insufficient gold! Crafting with ${orbInfo.name} requires ${orbCostGold} Gold.`, 'error');
      return;
    }

    const result = applyPoeCurrencyOrb(selectedItem, orbType);

    if (result.success) {
      audio.playSpell();
      onDeductGold(orbCostGold);

      const newInv = [...inventory];
      newInv[selectedSlotIndex] = result.updatedItem;
      onUpdateInventory(newInv);

      addLog(`[${orbInfo.name}] ${result.message}`, 'success');
    } else {
      audio.playDefeat();
      addLog(`[${orbInfo.name}] ${result.message}`, 'error');
    }
  };

  const addLog = (msg: string, type: 'success' | 'error' | 'info') => {
    setCraftingLogs((prev) => [
      { id: `log_${Date.now()}_${Math.random()}`, msg, type },
      ...prev.slice(0, 15),
    ]);
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-slate-950/90 p-4 shadow-2xl space-y-4 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Hammer className="h-6 w-6 text-amber-400" />
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200">
              Astral Alchemy Crafting Bench
            </h2>
            <p className="text-xs text-slate-400">
              Reforge, augment, socket, link, and corrupt equipment using Astral Crafting Orbs!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl">
          <span>Fee: 100 Gold / Craft</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Item Selection & Live Tooltip Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>Select Gear to Craft</span>
            <span className="text-[10px] text-slate-400 font-normal">({gearItems.length} Available)</span>
          </div>

          {/* Inventory Gear Select List */}
          <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
            {gearItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                No equipment gear in inventory. Obtain gear from dungeons or vendors!
              </div>
            ) : (
              gearItems.map(({ item, idx }) => (
                <button
                  key={item.id}
                  onClick={() => {
                    audio.playClick();
                    setSelectedSlotIndex(idx);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSlotIndex === idx
                      ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="font-serif text-xs font-bold text-amber-200 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        iLvl {item.itemLevel || item.levelReq} • {item.poeRarity?.toUpperCase() || 'GEAR'}
                      </div>
                    </div>
                  </div>
                  {item.isCorrupted && (
                    <span className="text-[9px] font-black uppercase text-red-400 border border-red-500/40 bg-red-950 px-1.5 py-0.5 rounded">
                      Corrupted
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Live PoE Card Inspector */}
          {selectedItem && (
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-300 mb-2">Selected Item Inspector:</div>
              <PoEItemCard item={selectedItem} />
            </div>
          )}
        </div>

        {/* Right Column: Currency Orb Grid & Crafting Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Astral Crafting Orbs
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(POE_CURRENCIES) as PoeCurrencyType[]).map((type) => {
              const orb = POE_CURRENCIES[type];
              return (
                <button
                  key={type}
                  onClick={() => handleApplyOrb(type)}
                  className={`flex flex-col justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group hover:scale-[1.02] ${orb.color}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg group-hover:scale-125 transition-transform">{orb.icon}</span>
                    <span className="font-serif text-xs font-bold text-slate-100">{orb.name}</span>
                  </div>

                  <p className="text-[10px] text-slate-300/80 mt-1 leading-tight font-sans">
                    {orb.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Crafting Logs Window */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
              Crafting Bench Log
            </div>

            <div className="h-28 overflow-y-auto space-y-1 text-[11px] font-mono">
              {craftingLogs.length === 0 ? (
                <div className="text-slate-600 text-[10px] italic">Ready to craft. Select an item and click an Orb!</div>
              ) : (
                craftingLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`${
                      log.type === 'success'
                        ? 'text-amber-300'
                        : log.type === 'error'
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    • {log.msg}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
