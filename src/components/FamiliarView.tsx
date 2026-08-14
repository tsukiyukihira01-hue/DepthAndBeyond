import React, { useState } from 'react';
import { Character, Item } from '../types/game';
import { Sparkles, Dices, Gift, Shield, Egg, ArrowLeftRight, Check, AlertCircle } from 'lucide-react';

interface FamiliarViewProps {
  character: Character;
  onUpdateCharacter?: (updatedChar: Character) => void;
}

export const FamiliarView: React.FC<FamiliarViewProps> = ({ character, onUpdateCharacter }) => {
  const familiar = character.familiar;
  const isFreeRoll = !character.freePetRollUsed;

  const [isRolling, setIsRolling] = useState(false);
  const [rollMessage, setRollMessage] = useState<string | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);
  const [lastRolledItem, setLastRolledItem] = useState<Item | null>(null);

  // Filter pet eggs/seals in character inventory
  const petSealsInInventory = character.inventory.filter((item): item is Item => {
    if (!item) return false;
    return item.slot === 'familiar' || (item.name && item.name.includes('Pet Seal'));
  });

  const handleRollPet = async () => {
    setIsRolling(true);
    setRollMessage(null);
    setRollError(null);
    setLastRolledItem(null);

    try {
      const res = await fetch('/api/familiar/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRollError(data.error || 'Failed to roll pet.');
      } else {
        setRollMessage(data.message);
        if (data.petItem) setLastRolledItem(data.petItem);
        if (data.character && onUpdateCharacter) {
          onUpdateCharacter(data.character);
        }
      }
    } catch {
      setRollError('Network error while rolling pet.');
    } finally {
      setIsRolling(false);
    }
  };

  const handleHatchPet = async (itemId: string) => {
    setRollMessage(null);
    setRollError(null);

    try {
      const res = await fetch('/api/familiar/hatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, itemId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRollError(data.error || 'Failed to hatch pet egg.');
      } else {
        setRollMessage(data.message);
        if (data.character && onUpdateCharacter) {
          onUpdateCharacter(data.character);
        }
      }
    } catch {
      setRollError('Network error while hatching pet.');
    }
  };

  const handleUnsummonPet = async () => {
    setRollMessage(null);
    setRollError(null);

    try {
      const res = await fetch('/api/familiar/unsummon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRollError(data.error || 'Failed to unsummon pet.');
      } else {
        setRollMessage(data.message);
        if (data.character && onUpdateCharacter) {
          onUpdateCharacter(data.character);
        }
      }
    } catch {
      setRollError('Network error while unsummoning pet.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl space-y-4 text-slate-100">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200">
              Pet Familiar Sanctuary & Random Pet Roll
            </h2>
            <p className="text-xs text-slate-400">
              Random Gacha Pets • Tradeable Inventory Items • Familiar Protection Guard (15%-60%)
            </p>
          </div>
        </div>

        {/* Free Roll Banner */}
        {isFreeRoll ? (
          <span className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 animate-pulse">
            <Gift className="h-4 w-4" /> 1x FREE PET ROLL READY!
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-mono">
            Roll Cost: <strong className="text-amber-300">500,000 Gold</strong> or <strong className="text-amber-300">50 Tokens</strong>
          </span>
        )}
      </div>

      {/* Notifications */}
      {rollMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{rollMessage}</span>
        </div>
      )}

      {rollError && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{rollError}</span>
        </div>
      )}

      {/* Pet Roll Section */}
      <div className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-5 space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-amber-200 flex items-center gap-2">
              <Dices className="h-5 w-5 text-amber-400" /> Ethereal Random Pet Roll Gacha
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Roll a random pet companion egg! All rolled pets enter your inventory as tradeable <strong className="text-slate-200">Pet Seals</strong>. You can stack, trade with players, or list them on the Marketplace!
            </p>
          </div>

          <button
            onClick={handleRollPet}
            disabled={isRolling}
            className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shrink-0 ${
              isFreeRoll
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-amber-500/30 font-black'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
          >
            <Dices className="h-4 w-4" />
            {isRolling ? 'Rolling Companion...' : isFreeRoll ? '🎁 CLAIM FREE PET ROLL' : 'Roll Pet Companion'}
          </button>
        </div>

        {/* Recently Rolled Preview */}
        {lastRolledItem && (
          <div className="mt-3 p-3 rounded-xl border border-amber-500/50 bg-amber-950/30 flex items-center gap-3 animate-fade-in">
            <span className="text-3xl">{lastRolledItem.icon}</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Just Rolled!</span>
              <h4 className="font-bold text-amber-200 text-sm">{lastRolledItem.name}</h4>
              <p className="text-[11px] text-slate-400">{lastRolledItem.description}</p>
            </div>
          </div>
        )}

        {/* Rarity Chance Footer */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 pt-2 border-t border-slate-800 text-[10px] text-center font-mono text-slate-400">
          <div><span className="text-slate-400">Common</span> 27%</div>
          <div><span className="text-emerald-400">Uncommon</span> 26%</div>
          <div><span className="text-sky-400">Rare</span> 18%</div>
          <div><span className="text-purple-400">Epic</span> 9.5%</div>
          <div><span className="text-amber-400 font-bold">Legendary</span> 3.3%</div>
          <div><span className="text-rose-400 font-bold">Mythical</span> 1.0%</div>
          <div><span className="text-yellow-300 font-extrabold">Godly</span> 0.2%</div>
        </div>
      </div>

      {/* Active Pet Companion */}
      <div>
        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-amber-400" /> Active Summoned Familiar
        </h3>

        {familiar ? (
          <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-4xl shrink-0">{familiar.icon}</span>
                <div className="min-w-0">
                  <h4 className="font-serif text-lg font-bold text-amber-200 truncate">{familiar.name}</h4>
                  <p className="text-xs text-slate-400">
                    Tier: <span className="uppercase font-semibold text-amber-400">{familiar.tier}</span> • Level {familiar.level} Companion
                  </p>
                </div>
              </div>

              <button
                onClick={handleUnsummonPet}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-slate-950 px-3 py-1.5 text-xs font-bold text-amber-300 hover:border-amber-400 transition-colors cursor-pointer shrink-0"
                title="Reseal pet back into inventory"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400" /> Reseal to Inventory
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <span className="text-[10px] text-slate-400 block">Hit Points</span>
                <span className="font-bold text-rose-400">{familiar.hp} / {familiar.maxHp} HP</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <span className="text-[10px] text-slate-400 block">Mana Points</span>
                <span className="font-bold text-sky-400">{familiar.mana ?? 300} / {familiar.maxMana ?? 300} MP</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <span className="text-[10px] text-slate-400 block">Familiar Guard</span>
                <span className="font-bold text-amber-300">{(familiar.protectionRate * 100).toFixed(0)}% Intercept</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <span className="text-[10px] text-slate-400 block">Speed (SPD)</span>
                <span className="font-bold text-emerald-300">{familiar.spd || 20}</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <span className="text-[10px] text-slate-400 block">Strength (STR)</span>
                <span className="font-bold text-amber-200">{familiar.str || 15}</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <span className="text-[10px] text-slate-400 block">Defense (DEF)</span>
                <span className="font-bold text-slate-200">{familiar.def || 12}</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <span className="text-[10px] text-slate-400 block">Intelligence (INT)</span>
                <span className="font-bold text-sky-200">{familiar.int || 15}</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <span className="text-[10px] text-slate-400 block">Wisdom (WIS)</span>
                <span className="font-bold text-purple-200">{familiar.wis || 12}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center space-y-2">
            <Egg className="h-8 w-8 text-slate-600 mx-auto" />
            <h4 className="font-serif text-sm font-bold text-amber-200">No Active Pet Companion Summoned</h4>
            <p className="text-xs text-slate-400">
              Roll a pet or hatch a Pet Seal from your inventory below to summon an active companion!
            </p>
          </div>
        )}
      </div>

      {/* Pet Seals in Inventory */}
      <div>
        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Egg className="h-4 w-4 text-amber-400" /> Pet Seals & Eggs in Inventory ({petSealsInInventory.length})
        </h3>

        {petSealsInInventory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {petSealsInInventory.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-amber-200 text-xs truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      {item.rarity} • Tradeable
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleHatchPet(item.id)}
                  className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer shrink-0"
                >
                  Hatch & Equip
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-500">
            No unhatched pet seals in inventory. Roll a new pet companion above!
          </div>
        )}
      </div>
    </div>
  );
};
