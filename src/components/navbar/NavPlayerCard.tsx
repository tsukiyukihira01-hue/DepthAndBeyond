import React from 'react';
import { Heart, Zap, Coins } from 'lucide-react';
import { Character, UserAccount } from '../../types/game';
import { getClassDefinition } from '../../data/classesAndArchetypes';

interface NavPlayerCardProps {
  character: Character;
  user: UserAccount | null;
  onOpenPlayerProfile: (identifier: string) => void;
}

export const NavPlayerCard: React.FC<NavPlayerCardProps> = ({
  character,
  user,
  onOpenPlayerProfile,
}) => {
  const classDef = getClassDefinition(character.characterClass);

  const expPercent = Math.min(100, Math.round((character.exp / character.maxExp) * 100));

  const currentHp = character.stats.hp ?? 0;
  const maxHp = character.stats.maxHp ?? 100;
  const hpPct = Math.min(100, Math.max(0, Math.round((currentHp / maxHp) * 100)));

  const currentMana = character.stats.mana ?? 0;
  const maxMana = character.stats.maxMana ?? 100;
  const manaPct = Math.min(100, Math.max(0, Math.round((currentMana / maxMana) * 100)));

  return (
    <div
      onClick={() => onOpenPlayerProfile('self')}
      className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-800/90 bg-slate-900/80 hover:bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs hover:border-amber-500/50 cursor-pointer transition-all duration-200 shadow-md hover:shadow-amber-500/5 group"
      title="Click to view Character Sheet"
    >
      {/* Player Class, Name & Level Badge */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 font-extrabold text-amber-200 text-xs">
            <span className="truncate max-w-[80px] sm:max-w-[120px] group-hover:text-amber-300">
              {character.name}
            </span>
            <span className="text-[10px] font-mono text-amber-400/70 font-semibold">
              #{user?.userId || '1'}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-950 px-1 py-0.2 rounded border border-slate-800">
              Lv.{character.level}
            </span>
            {classDef && (
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${classDef.typeBadgeColor}`}>
                {classDef.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mini Vitals Gauges HP & MP */}
      <div className="hidden lg:flex flex-col gap-1 border-l border-slate-800 pl-3">
        {/* HP */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <Heart className="h-3 w-3 text-rose-400 shrink-0 fill-rose-500/20" />
          <div className="h-1.5 w-16 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="font-mono text-[9px] text-rose-300 font-bold min-w-[28px]">
            {currentHp}
          </span>
        </div>

        {/* MP */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <Zap className="h-3 w-3 text-sky-400 shrink-0 fill-sky-500/20" />
          <div className="h-1.5 w-16 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-300"
              style={{ width: `${manaPct}%` }}
            />
          </div>
          <span className="font-mono text-[9px] text-sky-300 font-bold min-w-[28px]">
            {currentMana}
          </span>
        </div>
      </div>

      {/* EXP & Gold */}
      <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-800 pl-2 sm:pl-3">
        {/* EXP Bar */}
        <div className="flex flex-col min-w-[55px] sm:min-w-[75px]">
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-amber-400/90 font-bold">EXP</span>
            <span className="text-amber-200 font-bold">{expPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-amber-950/60 mt-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-yellow-300 transition-all duration-300"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>

        {/* Gold Balance */}
        <div className="flex items-center gap-1 text-amber-300 font-extrabold text-xs pl-1 bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-500/20">
          <Coins className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="font-mono">{character.gold.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
