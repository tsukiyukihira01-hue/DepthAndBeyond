import React, { useState } from 'react';
import { Character, Skill } from '../types/game';
import { SKILL_TREES, SkillTreeNode } from '../data/skillTrees';
import {
  getTotalSkillPoints,
  getSpentSkillPoints,
  getAvailableSkillPoints,
  synchronizeEquippedSkills,
} from '../utils/skillTreeUtils';
import { Sparkles, RotateCcw, Layers } from 'lucide-react';
import { ErrorNoticeModal } from './ErrorNoticeModal';
import { PoESkillTreeCanvas } from './PoESkillTreeCanvas';
import { PoETreePickerModal } from './PoETreePickerModal';

interface SkillManagerProps {
  character: Character;
  onUpdateCharacter?: (updatedChar: Character) => void;
  onLearnSkill?: (skill: Skill) => void;
  onUpgradeSkill?: (skillId: string) => void;
  onEquipSkill?: (
    skillId: string | null,
    slotType: 'passives' | 'autoCast' | 'actives',
    slotIndex: number
  ) => void;
  onNavigateToDungeon?: () => void;
}

export const SkillManager: React.FC<SkillManagerProps> = ({
  character,
  onUpdateCharacter,
}) => {
  // Currently equipped 4 trees (default to vanguard, blade, pyro, sylvan if empty)
  const defaultEquipped = ['tree_vanguard', 'tree_blade', 'tree_pyro', 'tree_sylvan'];
  const currentEquippedTrees =
    character.equippedTrees && character.equippedTrees.length === 4
      ? character.equippedTrees
      : defaultEquipped;

  // Selected tree slot index (0, 1, 2, 3) currently being highlighted
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);

  // Tree Selector Library Modal State
  const [isTreePickerOpen, setIsTreePickerOpen] = useState<boolean>(false);
  const [targetSlotForPicker, setTargetSlotForPicker] = useState<number>(0);

  // Error Notice Modal State
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
  }>({
    isOpen: false,
    message: '',
  });

  // Calculate SP totals
  const totalSP = getTotalSkillPoints(character);
  const spentSP = getSpentSkillPoints(character);
  const availableSP = getAvailableSkillPoints(character);

  // Current tree allocations map
  const treeAllocations = character.treeAllocations || {};

  // Color helper map
  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    amber: { bg: 'bg-amber-950/40', border: 'border-amber-500/50', text: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    rose: { bg: 'bg-rose-950/40', border: 'border-rose-500/50', text: 'text-rose-300', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    orange: { bg: 'bg-orange-950/40', border: 'border-orange-500/50', text: 'text-orange-300', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    yellow: { bg: 'bg-yellow-950/40', border: 'border-yellow-500/50', text: 'text-yellow-300', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    cyan: { bg: 'bg-cyan-950/40', border: 'border-cyan-500/50', text: 'text-cyan-300', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    emerald: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    teal: { bg: 'bg-teal-950/40', border: 'border-teal-500/50', text: 'text-teal-300', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    purple: { bg: 'bg-purple-950/40', border: 'border-purple-500/50', text: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    indigo: { bg: 'bg-indigo-950/40', border: 'border-indigo-500/50', text: 'text-indigo-300', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    red: { bg: 'bg-red-950/40', border: 'border-red-500/50', text: 'text-red-300', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
    stone: { bg: 'bg-stone-900/60', border: 'border-stone-500/50', text: 'text-stone-300', badge: 'bg-stone-500/20 text-stone-300 border-stone-500/30' },
    fuchsia: { bg: 'bg-fuchsia-950/40', border: 'border-fuchsia-500/50', text: 'text-fuchsia-300', badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
  };

  // Helper to check if node prerequisites are satisfied
  const isNodeUnlocked = (node: SkillTreeNode, treeId: string): boolean => {
    const allocations = treeAllocations[treeId] || {};
    // Tier 1 nodes are always unlocked
    if (node.tier === 1) return true;

    // Direct prerequisites check (at least 1 path invested)
    if (node.prerequisites && node.prerequisites.length > 0) {
      return node.prerequisites.some((prereqId) => (allocations[prereqId] || 0) > 0);
    }

    // Tier prerequisite check: Tier N requires at least 1 point invested in Tier N-1
    const tree = SKILL_TREES.find((t) => t.id === treeId);
    if (!tree) return false;

    const prevTierNodes = tree.nodes.filter((n) => n.tier === node.tier - 1);
    const prevTierPoints = prevTierNodes.reduce((sum, n) => sum + (allocations[n.id] || 0), 0);
    return prevTierPoints > 0;
  };

  // Node rank allocation handler (+ 1 SP)
  const handleIncreaseNodeRank = (node: SkillTreeNode, treeId: string) => {
    if (!isNodeUnlocked(node, treeId)) {
      setErrorModal({
        isOpen: true,
        title: 'Node Locked!',
        message: `You must unlock the preceding Tier ${node.tier - 1} skill nodes or prerequisite skills before learning "${node.name}".`,
      });
      return;
    }

    const currentRank = treeAllocations[treeId]?.[node.id] || 0;
    if (currentRank >= node.maxRank) {
      setErrorModal({
        isOpen: true,
        title: 'Max Rank Reached',
        message: `"${node.name}" is already at maximum rank (${node.maxRank}/${node.maxRank}).`,
      });
      return;
    }

    if (availableSP < 1) {
      setErrorModal({
        isOpen: true,
        title: 'Insufficient Skill Points',
        message: `Upgrading "${node.name}" requires 1 SP, but you currently have ${availableSP} unspent SP. Level up your character to earn more Skill Points (1 SP per level)!`,
      });
      return;
    }

    // Apply allocation
    const updatedAllocations = {
      ...treeAllocations,
      [treeId]: {
        ...(treeAllocations[treeId] || {}),
        [node.id]: currentRank + 1,
      },
    };

    const tempChar: Character = {
      ...character,
      treeAllocations: updatedAllocations,
    };

    const syncedEquipped = synchronizeEquippedSkills(tempChar);

    const updatedChar: Character = {
      ...tempChar,
      equippedSkills: syncedEquipped,
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }
  };

  // Node rank decrease handler (- 1 SP)
  const handleDecreaseNodeRank = (node: SkillTreeNode, treeId: string) => {
    const currentRank = treeAllocations[treeId]?.[node.id] || 0;
    if (currentRank <= 0) return;

    // Check if higher tier nodes depend on this node
    const tree = SKILL_TREES.find((t) => t.id === treeId);
    if (tree) {
      const higherTierNodes = tree.nodes.filter((n) => n.tier > node.tier);
      const allocations = treeAllocations[treeId] || {};
      const hasHigherAllocated = higherTierNodes.some((n) => (allocations[n.id] || 0) > 0);

      const sameTierNodes = tree.nodes.filter((n) => n.tier === node.tier);
      const sameTierTotalPoints = sameTierNodes.reduce((sum, n) => sum + (allocations[n.id] || 0), 0);

      if (hasHigherAllocated && sameTierTotalPoints <= 1) {
        setErrorModal({
          isOpen: true,
          title: 'Cannot Refund Skill Point',
          message: `You have higher-tier skills active in this tree. Refund those higher-tier skills first before reducing "${node.name}".`,
        });
        return;
      }
    }

    const updatedAllocations = {
      ...treeAllocations,
      [treeId]: {
        ...(treeAllocations[treeId] || {}),
        [node.id]: currentRank - 1,
      },
    };

    const tempChar: Character = {
      ...character,
      treeAllocations: updatedAllocations,
    };

    const syncedEquipped = synchronizeEquippedSkills(tempChar);

    const updatedChar: Character = {
      ...tempChar,
      equippedSkills: syncedEquipped,
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }
  };

  // Respec All Skill Points (Costs 500,000,000 Gold)
  const handleRespecAll = async () => {
    if (spentSP === 0) {
      setErrorModal({
        isOpen: true,
        title: 'No Points to Respec',
        message: 'You have not spent any Skill Points yet.',
      });
      return;
    }

    const RESET_COST = 500000000; // 500 Million Gold
    if (character.gold < RESET_COST) {
      setErrorModal({
        isOpen: true,
        title: 'Insufficient Gold for Skill Respec',
        message: `Resetting all Skill Points requires 500,000,000 Gold (500M Gold). Your current balance is ${character.gold.toLocaleString()} Gold.`,
      });
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to respec all Skill Points? This will cost 500,000,000 Gold and refund all ${spentSP} spent Skill Points so you can reassign them!`
      )
    ) {
      try {
        const res = await fetch('/api/character/reset-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId: character.id }),
        });
        const data = await res.json();
        if (res.ok && data.character) {
          if (onUpdateCharacter) {
            onUpdateCharacter(data.character);
          }
        } else if (data.error) {
          setErrorModal({
            isOpen: true,
            title: 'Respec Failed',
            message: data.error,
          });
        } else {
          const updatedChar: Character = {
            ...character,
            gold: character.gold - RESET_COST,
            treeAllocations: {},
            equippedSkills: {
              actives: Array(8).fill(null),
              autoCast: null,
              passives: Array(4).fill(null),
            },
          };
          if (onUpdateCharacter) {
            onUpdateCharacter(updatedChar);
          }
        }
      } catch {
        const updatedChar: Character = {
          ...character,
          gold: character.gold - RESET_COST,
          treeAllocations: {},
          equippedSkills: {
            actives: Array(8).fill(null),
            autoCast: null,
            passives: Array(4).fill(null),
          },
        };
        if (onUpdateCharacter) {
          onUpdateCharacter(updatedChar);
        }
      }
    }
  };

  // Change Equipped Tree for a Slot
  const handleEquipTreeToSlot = (treeId: string, slotIndex: number) => {
    const newEquipped = [...currentEquippedTrees];
    newEquipped[slotIndex] = treeId;

    const updatedChar = {
      ...character,
      equippedTrees: newEquipped,
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }
    setIsTreePickerOpen(false);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 sm:p-5 shadow-2xl space-y-6 text-slate-100 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950 to-slate-900 p-2.5 text-amber-400 shadow-lg shadow-amber-500/10">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-amber-200 flex items-center gap-2">
              Astral Constellation Skill Web
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs text-amber-300 font-sans font-extrabold border border-amber-500/30">
                4 Active Branches
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              1 Skill Point per Level • Radial Node Constellation • Allocate Points for Attribute Scaling & Skills
            </p>
          </div>
        </div>

        {/* Skill Points Summary Card */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3.5 py-2 text-right">
            <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Unspent Skill Points</div>
            <div className="text-lg font-black text-amber-200 font-mono flex items-center justify-end gap-1">
              <span>✨ {availableSP}</span>
              <span className="text-xs font-normal text-slate-400">/ {totalSP} SP</span>
            </div>
          </div>

          <button
            onClick={handleRespecAll}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 hover:border-rose-400 transition-all cursor-pointer shadow-md shadow-rose-950/50"
            title="Refund all allocated skill points (Costs 500,000,000 Gold)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Respec ({spentSP} SP) • 500M Gold</span>
          </button>
        </div>
      </div>

      {/* 4 EQUIPPED TREE SLOT CARDS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Layers className="h-4 w-4 text-amber-400" />
            Equipped Skill Tree Loadout (4 Quadrant Branches)
          </span>
          <span className="text-amber-400 font-mono">16 Skill Trees Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentEquippedTrees.map((treeId, idx) => {
            const tree = SKILL_TREES.find((t) => t.id === treeId) || SKILL_TREES[idx % SKILL_TREES.length];
            const isSelected = selectedSlotIndex === idx;
            const c = colorMap[tree.color] || colorMap.amber;
            const allocatedInTree = (Object.values(treeAllocations[tree.id] || {}) as number[]).reduce((a, b) => a + b, 0);

            return (
              <div
                key={`slot_${idx}`}
                onClick={() => setSelectedSlotIndex(idx)}
                className={`rounded-xl border p-3 cursor-pointer transition-all relative ${
                  isSelected
                    ? `${c.border} ${c.bg} ring-2 ring-amber-400/40 shadow-xl shadow-amber-950/30 scale-[1.02]`
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{tree.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>Slot #{idx + 1}: {tree.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{tree.archetype}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${c.badge}`}>
                    {tree.primaryStat.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                  <span className="text-slate-400 font-mono">{allocatedInTree} SP Invested</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetSlotForPicker(idx);
                      setIsTreePickerOpen(true);
                    }}
                    className="text-[10px] text-amber-300 hover:text-amber-100 hover:underline font-bold"
                  >
                    Change Tree →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ASTRAL CONSTELLATION SVG SKILL TREE CANVAS */}
      <PoESkillTreeCanvas
        equippedTrees={currentEquippedTrees.map(
          (id) => SKILL_TREES.find((t) => t.id === id) || SKILL_TREES[0]
        )}
        character={character}
        availableSP={availableSP}
        totalSP={totalSP}
        spentSP={spentSP}
        onIncreaseRank={handleIncreaseNodeRank}
        onDecreaseRank={handleDecreaseNodeRank}
        onRespecAll={handleRespecAll}
        onOpenTreePicker={(slotIdx) => {
          setTargetSlotForPicker(slotIdx);
          setIsTreePickerOpen(true);
        }}
      />

      {/* MODAL: 16 SKILL TREE CATALOG PICKER */}
      <PoETreePickerModal
        isOpen={isTreePickerOpen}
        targetSlotIndex={targetSlotForPicker}
        currentEquippedTreeIds={currentEquippedTrees}
        onClose={() => setIsTreePickerOpen(false)}
        onSelectTree={handleEquipTreeToSlot}
      />

      {/* ERROR NOTICE MODAL */}
      <ErrorNoticeModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
};
