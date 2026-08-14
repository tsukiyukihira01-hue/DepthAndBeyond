import React from 'react';
import { Character, Skill } from '../../types/game';
import { getSkillCategory } from '../../utils/formulas';
import { X, Check } from 'lucide-react';

interface CombatQuickEquipModalProps {
  character: Character;
  allAvailableSkills: Skill[];
  unlockedTreeSkills: Skill[];
  equipCategory: 'actives' | 'autoCast' | 'passives';
  equipSlotIndex: number;
  onCategoryChange: (cat: 'actives' | 'autoCast' | 'passives') => void;
  onSlotIndexChange: (idx: number) => void;
  onEquipSkill: (category: 'actives' | 'autoCast' | 'passives', slotIndex: number, skillId: string | null) => void;
  onClose: () => void;
}

export const CombatQuickEquipModal: React.FC<CombatQuickEquipModalProps> = ({
  character,
  allAvailableSkills,
  unlockedTreeSkills,
  equipCategory,
  equipSlotIndex,
  onCategoryChange,
  onSlotIndexChange,
  onEquipSkill,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xl font-bold">
            ⚙️
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-amber-200">
              In-Combat Skill Quick-Equip
            </h3>
            <p className="text-xs text-slate-400">
              Configure equipped skills live during combat
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs font-bold gap-1">
          {[
            { id: 'actives', label: '⚔️ Actives (A1-A8)' },
            { id: 'autoCast', label: '⚡ Auto-Cast (1)' },
            { id: 'passives', label: '✨ Passives (P1-P4)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onCategoryChange(tab.id as any);
                onSlotIndexChange(0);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer text-center ${
                equipCategory === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Target Slot Selection */}
        {equipCategory === 'actives' && (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs">
            <span className="font-bold text-slate-400">Target Active Slot:</span>
            <div className="flex flex-wrap gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((sIdx) => (
                <button
                  key={`slot_btn_${sIdx}`}
                  onClick={() => onSlotIndexChange(sIdx)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                    equipSlotIndex === sIdx
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  A{sIdx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {equipCategory === 'passives' && (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs">
            <span className="font-bold text-slate-400">Target Passive Slot:</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((sIdx) => (
                <button
                  key={`pslot_btn_${sIdx}`}
                  onClick={() => onSlotIndexChange(sIdx)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    equipSlotIndex === sIdx
                      ? 'bg-purple-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  P{sIdx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List of Eligible Skills to Equip */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
          {/* Unequip Option */}
          <div
            onClick={() => {
              onEquipSkill(equipCategory, equipSlotIndex, null);
              onClose();
            }}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs text-slate-400 hover:border-rose-500/50 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🚫</span>
              <span className="font-bold">Unequip Slot</span>
            </div>
            <span className="text-[10px] text-slate-500">Clear this slot</span>
          </div>

          {(allAvailableSkills || [])
            .filter((sk) => {
              const cat = getSkillCategory(sk);
              if (equipCategory === 'passives') return cat === 'passive';
              if (equipCategory === 'autoCast') return cat === 'autoCast';
              return cat === 'active';
            })
            .map((sk, idx) => {
              const isUnlocked =
                (character.skills || []).includes(sk.id) ||
                unlockedTreeSkills.some((s) => s.id === sk.id);
              const isCurrentlyEquipped =
                equipCategory === 'autoCast'
                  ? character.equippedSkills?.autoCast === sk.id
                  : equipCategory === 'actives'
                  ? character.equippedSkills?.actives?.[equipSlotIndex] === sk.id
                  : character.equippedSkills?.passives?.[equipSlotIndex] === sk.id;

              return (
                <div
                  key={`equip_choice_${sk.id}_${idx}`}
                  onClick={() => {
                    if (isUnlocked) {
                      onEquipSkill(equipCategory, equipSlotIndex, sk.id);
                      onClose();
                    }
                  }}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all ${
                    isCurrentlyEquipped
                      ? 'border-amber-500 bg-amber-950/40 text-amber-200 font-bold'
                      : isUnlocked
                      ? 'border-slate-800 bg-slate-950 hover:border-amber-500/50 hover:bg-slate-900 cursor-pointer text-slate-200'
                      : 'border-slate-900 bg-slate-950/40 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-xl shrink-0">{sk.icon || '✨'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-bold truncate">
                        <span>{sk.name}</span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          {sk.manaCost ? `${sk.manaCost} MP` : 'Passive'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {sk.description}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2 text-right">
                    {isCurrentlyEquipped ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500 text-slate-950 px-2 py-0.5 text-[10px] font-bold">
                        <Check className="h-3 w-3" /> Equipped
                      </span>
                    ) : isUnlocked ? (
                      <span className="rounded bg-slate-800 text-amber-300 px-2 py-0.5 text-[10px] font-bold border border-amber-500/30">
                        Equip
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic">Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
