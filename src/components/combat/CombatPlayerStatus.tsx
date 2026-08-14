import React from 'react';
import { Character } from '../../types/game';
import { FlaskConical, Droplet, Heart, Zap, Shield } from 'lucide-react';
import { getCharacterEffectiveStats } from '../../utils/skillTreeUtils';

interface CombatPlayerStatusProps {
  character: Character;
  playerHp: number;
  playerMana: number;
  totalHpVials: number;
  totalMpVials: number;
  onUseHpVial: () => void;
  onUseMpVial: () => void;
}

export const CombatPlayerStatus: React.FC<CombatPlayerStatusProps> = ({
  character,
  playerHp,
  playerMana,
  totalHpVials,
  totalMpVials,
  onUseHpVial,
  onUseMpVial,
}) => {
  const effectiveStats = getCharacterEffectiveStats(character);
  const maxHp = effectiveStats.maxHp || character.stats?.maxHp || 100;
  const maxMana = effectiveStats.maxMana || character.stats?.maxMana || 50;
  const hpPercent = Math.max(0, Math.min(100, (playerHp / Math.max(1, maxHp)) * 100));
  const mpPercent = Math.max(0, Math.min(100, (playerMana / Math.max(1, maxMana)) * 100));

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-3 sm:p-4 shadow-xl backdrop-blur-md space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Player Info & Bars */}
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xl font-bold">
            ⚔️
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-200 truncate">
                {character.name} <span className="text-slate-400 font-mono font-normal">(Lv {character.level} {character.class})</span>
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-rose-300 font-bold flex items-center gap-1">
                  <Heart className="h-3 w-3 text-rose-400" /> {playerHp} / {maxHp}
                </span>
                <span className="text-sky-300 font-bold flex items-center gap-1">
                  <Droplet className="h-3 w-3 text-sky-400" /> {playerMana} / {maxMana}
                </span>
              </div>
            </div>

            {/* Progress Bars Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* HP Bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-rose-300 font-semibold px-0.5">
                  <span>Health</span>
                  <span>{playerHp} / {maxHp} ({Math.round(hpPercent)}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-rose-500/40 relative shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              {/* MP Bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-sky-300 font-semibold px-0.5">
                  <span>Mana</span>
                  <span>{playerMana} / {maxMana} ({Math.round(mpPercent)}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-sky-500/40 relative shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-sky-600 via-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${mpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Consumable Vials */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUseHpVial}
            disabled={totalHpVials <= 0 || playerHp >= maxHp}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/70 hover:bg-rose-900/90 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-bold text-rose-200 transition-all cursor-pointer shadow"
            title="Drink 1 Health Vial (+250 HP)"
          >
            <FlaskConical className="h-4 w-4 text-rose-400" />
            <span>+250 HP</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-900 border border-rose-500/50 text-[10px] font-mono text-white">
              {totalHpVials}
            </span>
          </button>

          <button
            onClick={onUseMpVial}
            disabled={totalMpVials <= 0 || playerMana >= maxMana}
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/70 hover:bg-sky-900/90 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-bold text-sky-200 transition-all cursor-pointer shadow"
            title="Drink 1 Mana Vial (+250 MP)"
          >
            <Droplet className="h-4 w-4 text-sky-400" />
            <span>+250 MP</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-sky-900 border border-sky-500/50 text-[10px] font-mono text-white">
              {totalMpVials}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
