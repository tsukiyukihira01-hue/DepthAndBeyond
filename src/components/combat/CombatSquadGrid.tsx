import React from 'react';
import { CombatParticipant } from '../../types/game';
import { Shield, Sword, Skull, Sparkles } from 'lucide-react';

interface CombatSquadGridProps {
  title: string;
  side: 'friendly' | 'hostile';
  units: CombatParticipant[];
  maxUnits?: number;
  currentActorId?: string | null;
  currentFloor?: number;
}

export const CombatSquadGrid: React.FC<CombatSquadGridProps> = ({
  title,
  side,
  units,
  maxUnits = 10,
  currentActorId,
  currentFloor,
}) => {
  const isFriendly = side === 'friendly';

  return (
    <div
      className={`rounded-2xl border p-3 sm:p-4 space-y-3 shadow-xl backdrop-blur-md ${
        isFriendly
          ? 'border-emerald-500/30 bg-slate-900/80'
          : 'border-rose-500/30 bg-slate-900/80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {isFriendly ? (
            <Shield className="h-4 w-4 text-emerald-400" />
          ) : (
            <Sword className="h-4 w-4 text-rose-400" />
          )}
          <h3
            className={`text-xs font-bold uppercase tracking-wider ${
              isFriendly ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {title} {currentFloor && !isFriendly ? `(Floor #${currentFloor})` : ''}
          </h3>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          Units: {units.length}/{maxUnits}
        </span>
      </div>

      {/* 5x2 Modular Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {Array.from({ length: maxUnits }).map((_, slotIdx) => {
          const unit = units[slotIdx];
          const isActive = unit && unit.id === currentActorId;
          const isDead = unit && unit.hp <= 0;
          const isFrontRow = slotIdx < 5;

          return (
            <div
              key={`${side}_slot_${slotIdx}`}
              className={`relative min-h-[70px] sm:min-h-[90px] rounded-xl border p-1.5 flex flex-col justify-between text-xs transition-all ${
                unit
                  ? isActive
                    ? isFriendly
                      ? 'border-emerald-400 bg-emerald-950/80 text-emerald-100 ring-2 ring-emerald-500/50 shadow-lg scale-102 z-10'
                      : 'border-rose-400 bg-rose-950/80 text-rose-100 ring-2 ring-rose-500/50 shadow-lg scale-102 z-10'
                    : isDead
                    ? 'border-slate-800/80 bg-slate-950/50 text-slate-600 opacity-50 grayscale'
                    : isFriendly
                    ? 'border-emerald-500/40 bg-slate-950/90 text-slate-100 hover:border-emerald-400 shadow-md'
                    : 'border-rose-500/40 bg-slate-950/90 text-slate-100 hover:border-rose-400 shadow-md'
                  : 'border-slate-800/50 bg-slate-950/30 text-slate-700'
              }`}
            >
              {/* Slot Header Label */}
              <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-500">
                <span>#{slotIdx + 1}</span>
                <span className="hidden sm:inline font-semibold">
                  {isFrontRow ? 'FRONT' : 'BACK'}
                </span>
              </div>

              {unit ? (
                <div className="space-y-0.5 sm:space-y-1 text-center my-auto">
                  <div className="relative inline-block">
                    <span className="text-xl sm:text-2xl leading-none inline-block">
                      {unit.icon}
                    </span>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-amber-200 text-[8px] sm:text-[10px] truncate max-w-full">
                    {unit.name}
                  </div>

                  <div className="text-[8px] sm:text-[9px] text-slate-400 font-mono">
                    Lv {unit.level}
                  </div>

                  {/* HP Bar Container */}
                  <div className="w-full space-y-0.5 mt-1">
                    <div className="flex items-center justify-between text-[7px] sm:text-[9px] font-mono font-bold leading-none px-0.5">
                      <span className={isFriendly ? 'text-emerald-400' : 'text-rose-400'}>
                        {Math.max(0, unit.hp)}/{Math.max(1, unit.maxHp || 100)}
                      </span>
                      <span className="text-slate-400">
                        {Math.round(Math.max(0, Math.min(100, (unit.hp / Math.max(1, unit.maxHp || 100)) * 100)))}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-700/80 relative shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFriendly
                            ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-rose-600 via-red-500 to-amber-500'
                        }`}
                        style={{
                          width: `${Math.max(0, Math.min(100, (unit.hp / Math.max(1, unit.maxHp || 100)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-auto text-center text-[8px] sm:text-[10px] text-slate-600 font-mono italic">
                  Empty
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
