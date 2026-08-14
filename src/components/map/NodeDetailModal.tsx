import React from 'react';
import { MapNode } from '../../types/map';
import { Character } from '../../types/game';
import { MapPin, Navigation, ShieldCheck, Flame, Pickaxe, Sparkles, X, ChevronRight, Zap } from 'lucide-react';

interface NodeDetailModalProps {
  node: MapNode;
  character: Character;
  onClose: () => void;
  onTravel: (nodeId: string) => void;
  onFastTravel?: (nodeId: string) => void;
  onEnterCombat?: (monsterId?: string) => void;
  onGatherResource?: (node: MapNode) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  character,
  onClose,
  onTravel,
  onFastTravel,
  onEnterCombat,
  onGatherResource,
}) => {
  const isCurrentPosition = node.id === character.currentZoneId;
  const isLevelMet = character.level >= node.minLevelReq;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Node Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-3xl">
            {node.type === 'city' ? '🏰' : node.type === 'dungeon' ? '⛩️' : node.type === 'shrine' ? '☀️' : node.type === 'gathering' ? '⛏️' : '🌲'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-amber-200">{node.name}</h2>
              {node.isSafeCity && (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  🛡️ Safe Sanctuary
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Level Range: {node.levelRange} • Type: <span className="uppercase text-amber-300 font-bold">{node.type}</span>
            </p>
          </div>
        </div>

        {/* Description & Requirements */}
        <div className="space-y-3 text-xs">
          <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            {node.description}
          </p>

          {!isLevelMet && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-rose-200 font-bold flex items-center gap-2">
              <span>⚠️ Danger Warning: Recommended Level is {node.levelRange}. You are Level {character.level}.</span>
            </div>
          )}

          {/* Shrine Buff Info if present */}
          {node.shrineBuff && (
            <div className="rounded-xl border border-sky-500/40 bg-sky-950/60 p-3 space-y-1">
              <div className="font-bold text-sky-200 flex items-center gap-1.5">
                <span>{node.shrineBuff.icon}</span> {node.shrineBuff.name}
              </div>
              <p className="text-[11px] text-slate-300">{node.shrineBuff.description}</p>
            </div>
          )}

          {/* Gathering Resources if present */}
          {node.gatheringResources && node.gatheringResources.length > 0 && (
            <div className="space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Pickaxe className="h-4 w-4" /> Available Resource Veins:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {node.gatheringResources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{res.icon}</span>
                      <div>
                        <div className="font-bold text-slate-200">{res.name}</div>
                        <div className="text-[10px] text-slate-400">Harvests {res.yieldItemName}</div>
                      </div>
                    </div>

                    {isCurrentPosition && (
                      <button
                        onClick={() => {
                          onClose();
                          onGatherResource?.(node);
                        }}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/40 transition-colors cursor-pointer"
                      >
                        Harvest Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {isCurrentPosition ? (
            <div className="w-full space-y-2">
              <span className="block text-center text-xs font-bold text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                ● You are currently at {node.name}
              </span>

              {node.type !== 'city' && (
                <button
                  onClick={() => {
                    onClose();
                    onEnterCombat?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-xs font-bold text-slate-100 hover:brightness-110 shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  <Flame className="h-4 w-4" /> Hunt Monsters in {node.name}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                onClick={() => {
                  onClose();
                  onTravel(node.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Navigation className="h-4 w-4" /> Travel Here On Foot
              </button>

              {node.type === 'city' && onFastTravel && (
                <button
                  onClick={() => {
                    onClose();
                    onFastTravel(node.id);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-sky-500/50 bg-sky-950/80 hover:bg-sky-900 px-4 py-3 text-xs font-bold text-sky-200 cursor-pointer"
                >
                  <Zap className="h-4 w-4 text-sky-400" /> Fast Travel (100 Gold)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
