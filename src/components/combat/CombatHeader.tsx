import React from 'react';
import {
  Sword,
  Shield,
  ChevronLeft,
  ChevronRight,
  Flame,
  Play,
  Pause,
  Zap,
  RotateCcw,
  Building,
  MapPin,
  Trophy,
} from 'lucide-react';

interface CombatHeaderProps {
  currentFloor: number;
  maxFloorReached: number;
  isRaidMode?: boolean;
  isAutoBattle: boolean;
  onToggleAutoBattle: () => void;
  isAfkGrinding?: boolean;
  onToggleAfkGrinding?: () => void;
  onChangeFloor: (floor: number) => void;
  onRetreatToCity: () => void;
  onRetreatToMap: () => void;
  isCombatActive?: boolean;
}

export const CombatHeader: React.FC<CombatHeaderProps> = ({
  currentFloor,
  maxFloorReached,
  isRaidMode = false,
  isAutoBattle,
  onToggleAutoBattle,
  isAfkGrinding = false,
  onToggleAfkGrinding,
  onChangeFloor,
  onRetreatToCity,
  onRetreatToMap,
  isCombatActive = false,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 shadow-xl backdrop-blur-md space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Floor / Zone Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl font-bold shadow-md ${
              isRaidMode
                ? 'border-rose-500/50 bg-rose-950/80 text-rose-300 shadow-rose-500/20 animate-pulse'
                : 'border-amber-500/50 bg-amber-950/80 text-amber-300 shadow-amber-500/20'
            }`}
          >
            {isRaidMode ? <Flame className="h-6 w-6 text-rose-400" /> : <Sword className="h-6 w-6 text-amber-400" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                {isRaidMode ? (
                  <span className="text-rose-300">Apex Raid World Boss</span>
                ) : (
                  <span className="text-amber-200">Dungeon Floor #{currentFloor}</span>
                )}
              </h2>
              {isRaidMode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                  Mythic Raid
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono">
              {isRaidMode
                ? 'Co-op World Boss Chamber • Legendary Loot Drops'
                : `Highest Cleared: Floor #${maxFloorReached}`}
            </p>
          </div>
        </div>

        {/* Center: Floor Selector (Non-Raid mode) */}
        {!isRaidMode && (
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-1.5">
            <button
              onClick={() => {
                if (!isCombatActive) {
                  onChangeFloor(Math.max(1, currentFloor - 1));
                }
              }}
              disabled={currentFloor <= 1 || isCombatActive}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={isCombatActive ? '🔒 Cannot change floor mid-battle! Finish combat first.' : 'Previous Floor'}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="px-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight">Zone Level</span>
              <span className="text-xs font-mono font-extrabold text-amber-300">F#{currentFloor}</span>
            </div>

            <button
              onClick={() => {
                if (!isCombatActive) {
                  onChangeFloor(Math.min(maxFloorReached, currentFloor + 1));
                }
              }}
              disabled={currentFloor >= maxFloorReached || isCombatActive}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={isCombatActive ? '🔒 Cannot change floor mid-battle! Finish combat first.' : 'Next Floor'}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Right: Auto-Battle, AFK Grind & Retreat Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Battle Toggle */}
          <button
            onClick={onToggleAutoBattle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isAutoBattle
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {isAutoBattle ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>Auto Battle: {isAutoBattle ? 'ON' : 'OFF'}</span>
          </button>

          {/* AFK Auto-Grind Toggle */}
          {onToggleAfkGrinding && (
            <button
              onClick={onToggleAfkGrinding}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isAfkGrinding
                  ? 'border-purple-500/80 bg-gradient-to-r from-purple-900 via-purple-950 to-indigo-900 text-purple-200 shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/50 animate-pulse'
                  : 'border-slate-800 bg-slate-950/80 text-purple-300 hover:text-purple-100 hover:border-purple-500/50'
              }`}
              title="AFK System: Auto rechallenge floor on victory. 10% EXP, Gold & Drops (90% penalty)."
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isAfkGrinding ? 'animate-spin text-purple-300' : 'text-purple-400'}`} />
              <span>{isAfkGrinding ? 'AFK Farm ON' : 'AFK Grind'}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isAfkGrinding ? 'bg-purple-950 text-purple-200 border border-purple-400/40 font-bold' : 'bg-purple-950/80 text-purple-300 border border-purple-800/40'}`}>
                -90% EXP
              </span>
            </button>
          )}

          {/* Retreat Options */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (!isCombatActive) {
                  onRetreatToMap();
                }
              }}
              disabled={isCombatActive}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-amber-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={isCombatActive ? '🔒 Cannot leave during active combat! Defeat enemies first.' : 'Retreat to World Map'}
            >
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Map</span>
            </button>

            <button
              onClick={() => {
                if (!isCombatActive) {
                  onRetreatToCity();
                }
              }}
              disabled={isCombatActive}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-sky-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={isCombatActive ? '🔒 Cannot leave during active combat! Defeat enemies first.' : 'Retreat to Sanctuary'}
            >
              <Building className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">City</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
