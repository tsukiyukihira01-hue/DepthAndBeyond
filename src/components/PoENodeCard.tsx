import React from 'react';
import { SkillTreeNode, SkillTree } from '../data/skillTrees';
import { Point, getNodeCategory } from '../utils/poeLayoutGenerator';
import { Plus } from 'lucide-react';
import { audio } from '../utils/audio';

interface PoENodeCardProps {
  node: SkillTreeNode;
  tree: SkillTree;
  pos: Point;
  rank: number;
  allocatable: boolean;
  refundable: boolean;
  isSelected: boolean;
  isSearchMatch: boolean;
  colorStyle: {
    lineActive: string;
    lineGlow: string;
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  onSelectNode: (node: SkillTreeNode, tree: SkillTree) => void;
  onIncreaseRank: (node: SkillTreeNode, treeId: string) => void;
}

export const PoENodeCard: React.FC<PoENodeCardProps> = ({
  node,
  tree,
  pos,
  rank,
  allocatable,
  isSelected,
  isSearchMatch,
  colorStyle,
  onSelectNode,
  onIncreaseRank,
}) => {
  const category = getNodeCategory(node);
  const isMaxed = rank >= node.maxRank;

  return (
    <div
      onClick={() => onSelectNode(node, tree)}
      className={`poe-node-card absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer pointer-events-auto touch-manipulation p-2 min-w-[50px] min-h-[50px] flex items-center justify-center ${
        isSelected ? 'scale-125 z-40' : 'hover:scale-110 z-20'
      }`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
    >
      {/* Search Highlight Pulse */}
      {isSearchMatch && (
        <div className="absolute -inset-4 rounded-full border-2 border-cyan-400 animate-ping opacity-80 pointer-events-none" />
      )}

      {/* Selected Ring Glow */}
      {isSelected && (
        <div className="absolute -inset-3 rounded-full border-2 border-amber-400 animate-pulse opacity-90 pointer-events-none" />
      )}

      {/* POE NODE SHAPE BY CATEGORY */}
      {category === 'keystone' ? (
        <div
          className={`h-16 w-16 rotate-45 flex items-center justify-center border-2 transition-all shadow-xl ${
            rank > 0
              ? `bg-gradient-to-br from-amber-500 via-emerald-600 to-slate-950 ${colorStyle.border} shadow-amber-500/50 ring-2 ring-amber-400`
              : allocatable
              ? 'bg-slate-900 border-amber-500/80 shadow-amber-500/20 animate-pulse'
              : 'bg-slate-950/90 border-slate-700 opacity-60'
          }`}
        >
          <div className="-rotate-45 flex flex-col items-center justify-center">
            <span className="text-2xl drop-shadow">{node.icon}</span>
          </div>
        </div>
      ) : category === 'notable' ? (
        <div
          className={`h-14 w-14 rounded-full flex items-center justify-center border-2 transition-all shadow-lg relative ${
            rank > 0
              ? `bg-gradient-to-br from-slate-900 via-amber-950 to-emerald-950 ${colorStyle.border} ring-1 ring-emerald-400 shadow-emerald-500/40`
              : allocatable
              ? 'bg-slate-900 border-amber-400/90 shadow-amber-500/30'
              : 'bg-slate-950 border-slate-700 opacity-60'
          }`}
        >
          <span className="text-xl drop-shadow">{node.icon}</span>
        </div>
      ) : (
        <div
          className={`h-11 w-11 rounded-full flex items-center justify-center border-2 transition-all ${
            rank > 0
              ? 'bg-emerald-950 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/30'
              : allocatable
              ? 'bg-slate-900 border-amber-400/80 text-amber-300'
              : 'bg-slate-950 border-slate-800 opacity-50'
          }`}
        >
          <span className="text-base">{node.icon}</span>
        </div>
      )}

      {/* RANK BADGE */}
      <div
        className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shadow ${
          isMaxed
            ? 'bg-amber-500 text-slate-950 border-amber-300 font-extrabold'
            : rank > 0
            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
            : 'bg-slate-900 text-slate-400 border-slate-700'
        }`}
      >
        {rank}/{node.maxRank}
      </div>

      {/* QUICK ALLOCATE TOUCH BUTTON */}
      {allocatable && !isMaxed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            audio.playVictory();
            onIncreaseRank(node, tree.id);
          }}
          className="poe-touch-control absolute -top-2 -right-2 h-7 w-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg hover:scale-125 transition-transform border border-white cursor-pointer touch-manipulation"
          title="Invest 1 SP"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
        </button>
      )}
    </div>
  );
};
