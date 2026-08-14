import React from 'react';
import { Shield, Sword, Zap } from 'lucide-react';

export interface TurnActor {
  id: string;
  name: string;
  type: 'player' | 'pet' | 'enemy';
  spd: number;
  icon: string;
  hp: number;
  maxHp: number;
}

interface CombatTurnTimelineProps {
  actors: TurnActor[];
  currentActorId: string | null;
  turnNumber: number;
}

export const CombatTurnTimeline: React.FC<CombatTurnTimelineProps> = ({
  actors,
  currentActorId,
  turnNumber,
}) => {
  if (!actors || actors.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1.5 shadow-inner">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-1 px-1">
        <span className="flex items-center gap-1 font-bold text-amber-300 uppercase tracking-wider">
          <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" /> Turn Order Timeline
        </span>
        <span className="text-slate-500 font-bold">Turn #{turnNumber}</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
        {actors.map((actor, idx) => {
          const isActive = actor.id === currentActorId;
          const isPlayer = actor.type === 'player';
          const isPet = actor.type === 'pet';
          const hpPercent = Math.max(0, Math.min(100, (actor.hp / Math.max(1, actor.maxHp || 100)) * 100));

          return (
            <div
              key={`timeline_${actor.id}_${idx}`}
              className={`relative flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all shrink-0 ${
                isActive
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-2 ring-amber-500/40 shadow-lg scale-105 z-10'
                  : isPlayer
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                  : isPet
                  ? 'border-purple-500/40 bg-purple-950/30 text-purple-200'
                  : 'border-rose-500/40 bg-rose-950/30 text-rose-200 opacity-80'
              }`}
            >
              {/* Order Number Badge */}
              <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-900 px-1 rounded border border-slate-800">
                #{idx + 1}
              </span>

              <span className="text-xl leading-none">{actor.icon}</span>

              <div className="min-w-[60px] max-w-[100px]">
                <div className="text-[10px] font-bold truncate leading-tight">{actor.name}</div>
                <div className="text-[8px] font-mono text-slate-400 flex items-center justify-between mt-0.5">
                  <span>SPD {actor.spd}</span>
                  <span className="font-semibold text-slate-300">{Math.round(hpPercent)}%</span>
                </div>
                {/* Mini HP indicator */}
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                  <div
                    className={`h-full transition-all ${
                      isPlayer
                        ? 'bg-emerald-400'
                        : isPet
                        ? 'bg-purple-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
