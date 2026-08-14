import React from 'react';
import { SkillTreeNode, SkillTree } from '../data/skillTrees';
import { Character, CharacterStats } from '../types/game';
import { getNodeCategory } from '../utils/poeLayoutGenerator';
import { Sparkles, Info, Plus, Minus, RotateCcw } from 'lucide-react';
import { audio } from '../utils/audio';

interface PoEInspectorPanelProps {
  selectedNodeData: { node: SkillTreeNode; tree: SkillTree } | null;
  character: Character;
  totalBuildStats: { stats: Partial<CharacterStats>; totalPointsSpent: number };
  spentSP: number;
  isNodeAllocatable: (node: SkillTreeNode, treeId: string) => boolean;
  isNodeRefundable: (node: SkillTreeNode, treeId: string) => boolean;
  onIncreaseRank: (node: SkillTreeNode, treeId: string) => void;
  onDecreaseRank: (node: SkillTreeNode, treeId: string) => void;
  onRespecAll?: () => void;
}

export const PoEInspectorPanel: React.FC<PoEInspectorPanelProps> = ({
  selectedNodeData,
  character,
  totalBuildStats,
  spentSP,
  isNodeAllocatable,
  isNodeRefundable,
  onIncreaseRank,
  onDecreaseRank,
  onRespecAll,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Selected Node Inspector & Allocate Controls */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-xl">
        {selectedNodeData ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
                  {selectedNodeData.node.icon}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-amber-200 flex items-center gap-2">
                    <span>{selectedNodeData.node.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 capitalize">
                      {getNodeCategory(selectedNodeData.node)} Node • Tier {selectedNodeData.node.tier}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>
                      Branch: <strong className="text-slate-200">{selectedNodeData.tree.name}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-bold text-amber-300">
                  Lvl {character.treeAllocations?.[selectedNodeData.tree.id]?.[selectedNodeData.node.id] || 0} / {selectedNodeData.node.maxRank}
                </div>
                <div className="text-[10px] text-slate-400">Flat 1 SP / Lvl</div>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">{selectedNodeData.node.description}</p>

            {/* Node Attribute Scaling */}
            {selectedNodeData.node.statBonusPerRank && (
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs font-mono space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Node Attribute Scaling:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedNodeData.node.statBonusPerRank).map(([k, v]) => {
                    const rank = character.treeAllocations?.[selectedNodeData.tree.id]?.[selectedNodeData.node.id] || 0;
                    return (
                      <div key={k} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-emerald-300 font-bold">
                        +{v} {k.toUpperCase()} / Lvl{' '}
                        {rank > 0 && <span className="text-amber-300">(Total: +{(v as number) * rank})</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Skill Stats */}
            {(selectedNodeData.node.type === 'active' || selectedNodeData.node.type === 'autoCast') && (
              <div className="rounded-xl bg-purple-950/30 border border-purple-500/30 p-3 text-xs font-mono flex flex-wrap gap-3">
                {selectedNodeData.node.manaCost !== undefined && (
                  <div>
                    Mana Cost: <span className="text-sky-300 font-bold">{selectedNodeData.node.manaCost} MP</span>
                  </div>
                )}
                {selectedNodeData.node.cooldownTurns !== undefined && (
                  <div>
                    Cooldown: <span className="text-amber-300 font-bold">{selectedNodeData.node.cooldownTurns} turns</span>
                  </div>
                )}
                {selectedNodeData.node.damageMultiplier !== undefined && (
                  <div>
                    Damage: <span className="text-rose-300 font-bold">{(selectedNodeData.node.damageMultiplier * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              {isNodeRefundable(selectedNodeData.node, selectedNodeData.tree.id) && (
                <button
                  onClick={() => {
                    audio.playClick();
                    onDecreaseRank(selectedNodeData.node, selectedNodeData.tree.id);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 hover:bg-rose-900 text-xs font-bold cursor-pointer transition-colors touch-manipulation"
                >
                  <Minus className="h-4 w-4" />
                  <span>Refund 1 SP</span>
                </button>
              )}

              <button
                onClick={() => {
                  audio.playVictory();
                  onIncreaseRank(selectedNodeData.node, selectedNodeData.tree.id);
                }}
                disabled={!isNodeAllocatable(selectedNodeData.node, selectedNodeData.tree.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-md touch-manipulation ${
                  (character.treeAllocations?.[selectedNodeData.tree.id]?.[selectedNodeData.node.id] || 0) >= selectedNodeData.node.maxRank
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    : !isNodeAllocatable(selectedNodeData.node, selectedNodeData.tree.id)
                    ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 hover:from-amber-400 hover:to-emerald-400 shadow-amber-500/20'
                }`}
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>
                  {(character.treeAllocations?.[selectedNodeData.tree.id]?.[selectedNodeData.node.id] || 0) >= selectedNodeData.node.maxRank
                    ? 'Max Node Level Reached'
                    : !isNodeAllocatable(selectedNodeData.node, selectedNodeData.tree.id)
                    ? 'Requires Unlocking Path First'
                    : 'Allocate +1 SP (1 SP/Lvl)'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-400 text-xs py-4">
            <Info className="h-5 w-5 text-amber-400 shrink-0" />
            <span>Tap any node on the constellation web above to inspect stats, view skills, and invest your Skill Points!</span>
          </div>
        )}
      </div>

      {/* Right: Cumulative Build Stats Summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-xl flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>4-Branch Stat Bonuses</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {totalBuildStats.totalPointsSpent} SP Spent
            </span>
          </h4>

          <div className="space-y-1.5 text-xs font-mono mt-3">
            {Object.keys(totalBuildStats.stats).length > 0 ? (
              Object.entries(totalBuildStats.stats).map(([statKey, val]) => (
                <div key={statKey} className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 capitalize">{statKey}:</span>
                  <span className="text-emerald-300 font-bold">+{val as number}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-[11px] italic py-2">
                No SP spent in your 4 core branches yet. Allocate points above!
              </div>
            )}
          </div>
        </div>

        {onRespecAll && (
          <button
            onClick={onRespecAll}
            disabled={spentSP === 0}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
              spentSP > 0
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Respec All ({spentSP} SP) • 500M Gold</span>
          </button>
        )}
      </div>
    </div>
  );
};
