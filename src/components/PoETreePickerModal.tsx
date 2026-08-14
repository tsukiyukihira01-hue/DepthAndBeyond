import React, { useState } from 'react';
import { SKILL_TREES, SkillTree } from '../data/skillTrees';
import { Sliders, Search, X } from 'lucide-react';

interface PoETreePickerModalProps {
  isOpen: boolean;
  targetSlotIndex: number;
  currentEquippedTreeIds: (string | null)[];
  onClose: () => void;
  onSelectTree: (treeId: string, slotIndex: number) => void;
}

export const PoETreePickerModal: React.FC<PoETreePickerModalProps> = ({
  isOpen,
  targetSlotIndex,
  currentEquippedTreeIds,
  onClose,
  onSelectTree,
}) => {
  const [statFilter, setStatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredTrees = SKILL_TREES.filter((tree) => {
    const matchesSearch =
      tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.archetype.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statFilter === 'all') return true;
    return tree.primaryStat.toLowerCase() === statFilter.toLowerCase();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 max-w-4xl w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-amber-400" />
              Select Skill Tree for Quadrant Branch #{targetSlotIndex + 1}
            </h3>
            <p className="text-xs text-slate-400">Choose from 16 specialized RPG Skill Trees</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
            {['all', 'str', 'int', 'wis', 'dex', 'def'].map((stat) => (
              <button
                key={stat}
                onClick={() => setStatFilter(stat)}
                className={`px-2.5 py-1 rounded-lg uppercase font-mono font-bold cursor-pointer transition-all ${
                  statFilter === stat ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {stat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tree name or archetype..."
              className="rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Tree Grid */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
          {filteredTrees.map((tree) => {
            const isEquippedInTarget = currentEquippedTreeIds[targetSlotIndex] === tree.id;

            return (
              <div
                key={tree.id}
                className={`rounded-xl border p-3.5 space-y-2 flex flex-col justify-between ${
                  isEquippedInTarget
                    ? 'border-amber-500 bg-amber-950/30'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{tree.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-slate-100">{tree.name}</div>
                        <div className="text-xs text-amber-400 font-medium">{tree.archetype}</div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {tree.primaryStat}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{tree.description}</p>
                </div>

                <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">{tree.nodes.length} Skill Nodes</span>
                  <button
                    onClick={() => onSelectTree(tree.id, targetSlotIndex)}
                    disabled={isEquippedInTarget}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      isEquippedInTarget
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                    }`}
                  >
                    {isEquippedInTarget ? 'Currently Equipped' : `Equip to Slot #${targetSlotIndex + 1}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
