import React from 'react';
import { TravelEncounter } from '../../types/map';
import { Character } from '../../types/game';
import { Sparkles, Sword, Coins, ChevronRight, X } from 'lucide-react';
import { calculateLevelUpStatsPlayer } from '../../utils/formulas';

interface TravelEncounterModalProps {
  encounter: TravelEncounter;
  character: Character;
  onClose: () => void;
  onEnterCombat?: (monsterId?: string) => void;
  onUpdateCharacter?: (char: Character) => void;
}

export const TravelEncounterModal: React.FC<TravelEncounterModalProps> = ({
  encounter,
  character,
  onClose,
  onEnterCombat,
  onUpdateCharacter,
}) => {
  const handleClaimEncounterRewards = () => {
    if (encounter.type === 'combat' && encounter.monsterId) {
      onClose();
      onEnterCombat?.(encounter.monsterId);
      return;
    }

    if (encounter.rewards) {
      const addedGold = encounter.rewards.gold || 0;
      const addedExp = encounter.rewards.exp || 0;

      let newExp = character.exp + addedExp;
      let newLevel = character.level;
      let newMaxExp = character.maxExp;
      let newUnassigned = character.stats.unassignedPoints;

      while (newExp >= newMaxExp) {
        newExp -= newMaxExp;
        newLevel += 1;
        newMaxExp = Math.round(newMaxExp * 1.5);
      }

      let newStats = { ...character.stats };
      if (newLevel > character.level) {
        const gains = calculateLevelUpStatsPlayer(character.level, newLevel, character.stats, character.characterClass);
        newStats = {
          ...newStats,
          maxHp: gains.maxHp,
          hp: gains.hp,
          maxMana: gains.maxMana,
          mana: gains.mana,
          str: gains.str,
          int: gains.int,
          def: gains.def,
          wis: gains.wis,
          spd: gains.spd,
          dex: gains.dex,
          unassignedPoints: gains.unassignedPoints,
        };
      }

      onUpdateCharacter?.({
        ...character,
        gold: character.gold + addedGold,
        exp: newExp,
        level: newLevel,
        maxExp: newMaxExp,
        stats: newStats,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/50 bg-slate-950 p-6 shadow-2xl space-y-5 text-center">
        {/* Encounter Avatar Header */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/50 bg-amber-500/10 text-5xl shadow-inner animate-bounce">
          {encounter.icon}
        </div>

        <div className="space-y-2">
          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-[10px] font-bold text-amber-300 uppercase tracking-widest">
            Travel Event Encounter
          </span>
          <h2 className="font-serif text-2xl font-bold text-amber-200">{encounter.title}</h2>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            {encounter.description}
          </p>
        </div>

        {/* Rewards Summary if present */}
        {encounter.rewards && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3 space-y-1 text-xs">
            <div className="font-bold text-emerald-300 flex items-center justify-center gap-1">
              <Sparkles className="h-4 w-4" /> Encounter Loot & Blessings:
            </div>
            <div className="flex items-center justify-center gap-4 text-emerald-200 font-mono font-bold">
              {encounter.rewards.gold && <span>+{encounter.rewards.gold} Gold</span>}
              {encounter.rewards.exp && <span>+{encounter.rewards.exp} EXP</span>}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleClaimEncounterRewards}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          {encounter.type === 'combat' ? (
            <>
              <Sword className="h-4 w-4" /> Engage in Combat!
            </>
          ) : (
            <>
              <span>Claim Rewards & Continue Journey</span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
