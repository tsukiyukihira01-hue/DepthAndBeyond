import React from 'react';
import { Character, Skill } from '../../types/game';
import { Sword, Zap, BookOpen, Settings, Sparkles, Plus } from 'lucide-react';

interface CombatActionPanelProps {
  character: Character;
  allAvailableSkills: Skill[];
  skillCooldowns: { [skillId: string]: number };
  playerMana: number;
  isPlayerTurn: boolean;
  isProcessingTurn: boolean;
  currentActorName?: string;
  onPlayerAction: (actionType: string) => void;
  onOpenGrimoire: () => void;
  onOpenQuickEquip: (category: 'actives' | 'autoCast' | 'passives', slotIndex: number) => void;
}

export const CombatActionPanel: React.FC<CombatActionPanelProps> = ({
  character,
  allAvailableSkills,
  skillCooldowns,
  playerMana,
  isPlayerTurn,
  isProcessingTurn,
  currentActorName,
  onPlayerAction,
  onOpenGrimoire,
  onOpenQuickEquip,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 space-y-3.5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sword className="h-4 w-4 text-amber-400" /> Player Combat Command Panel
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isPlayerTurn && (
            <span className="text-xs text-amber-400 font-mono animate-pulse flex items-center gap-1">
              ⏳ Waiting for {currentActorName || 'Enemy'}'s Turn...
            </span>
          )}

          <button
            onClick={onOpenGrimoire}
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/60 hover:bg-sky-900/80 px-2.5 py-1.5 text-xs font-bold text-sky-200 transition-all cursor-pointer shadow"
            title="Open full Spellbook Grimoire"
          >
            <BookOpen className="h-3.5 w-3.5 text-sky-400" />
            <span>Spellbook</span>
          </button>

          <button
            onClick={() => onOpenQuickEquip('actives', 0)}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition-all cursor-pointer shadow"
            title="Equip or Swap Skill Slots"
          >
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            <span>Equip Slots</span>
          </button>
        </div>
      </div>

      {/* Auto-Cast & Active Passives Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {/* Auto-Cast Skill Banner */}
        <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 text-sm font-bold border border-amber-500/40">
              ⚡
            </span>
            <div className="min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 font-bold text-amber-200 text-xs truncate">
                <span>Auto-Skill:</span>
                {character.equippedSkills?.autoCast ? (
                  (() => {
                    const sk = allAvailableSkills.find(
                      (s) => s.id === character.equippedSkills.autoCast
                    );
                    return (
                      <span className="text-amber-300 font-mono flex items-center gap-1">
                        <span>{sk?.icon || '✨'}</span>
                        <span>{sk?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-amber-400/80">({sk?.manaCost || 0} MP)</span>
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-slate-500 italic">None Equipped</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Fires automatically at Start of Turn (0 Turn Cost)
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenQuickEquip('autoCast', 0)}
            className="ml-2 shrink-0 rounded-lg border border-amber-500/40 bg-amber-900/40 hover:bg-amber-800/60 px-2.5 py-1 text-[11px] font-bold text-amber-200 cursor-pointer transition-colors"
          >
            {character.equippedSkills?.autoCast ? 'Change' : '+ Set Auto'}
          </button>
        </div>

        {/* Active Passives Bar */}
        <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-950/20 p-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-purple-200 text-[11px] block">Passive Combat Auras:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                {(character.equippedSkills?.passives || []).map((skId, pIdx) => {
                  if (!skId) {
                    return (
                      <span key={`p_slot_${pIdx}`} className="text-[10px] text-slate-600 font-mono italic">
                        P{pIdx + 1}: Empty
                      </span>
                    );
                  }
                  const sk = allAvailableSkills.find((s) => s.id === skId);
                  return (
                    <span
                      key={`p_slot_${pIdx}`}
                      className="inline-flex items-center gap-1 rounded bg-purple-950 px-1.5 py-0.5 text-[10px] font-bold text-purple-200 border border-purple-500/30 shrink-0"
                      title={sk?.description}
                    >
                      <span>{sk?.icon || '✨'}</span>
                      <span className="truncate max-w-[70px]">{sk?.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenQuickEquip('passives', 0)}
            className="ml-2 shrink-0 rounded-lg border border-purple-500/30 bg-purple-900/30 hover:bg-purple-800/50 px-2.5 py-1 text-[11px] font-bold text-purple-200 cursor-pointer transition-colors"
          >
            Config
          </button>
        </div>
      </div>

      {/* Primary Action Buttons (Equipped Active Slots) */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 font-mono flex items-center justify-between">
          <span>Equipped Active Combat Skill Slots (8 Slots):</span>
          <span className="text-[10px] text-amber-400">Select to Cast on Turn</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((slotIdx) => {
            const activeSkillId = character.equippedSkills?.actives?.[slotIdx];
            const skill = activeSkillId
              ? allAvailableSkills.find((s) => s.id === activeSkillId)
              : null;
            const cd = skill ? skillCooldowns[skill.id] || 0 : 0;
            const hasMana = skill ? playerMana >= (skill.manaCost || 0) : false;
            const canCast = isPlayerTurn && !isProcessingTurn && skill && cd === 0 && hasMana;

            if (skill) {
              return (
                <button
                  key={`active_slot_${slotIdx}`}
                  onClick={() => onPlayerAction(skill.id)}
                  disabled={!canCast}
                  className={`relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer group ${
                    canCast
                      ? 'border-sky-500/60 bg-gradient-to-b from-sky-950/80 to-slate-900 hover:border-sky-400 hover:brightness-110 shadow-lg'
                      : 'border-slate-800 bg-slate-950/60 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{skill.icon || '✨'}</span>
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-sky-950 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-500/30">
                        {skill.manaCost || 0} MP
                      </span>
                      <span className="rounded bg-slate-800 px-1 py-0.5 text-[9px] font-mono text-slate-400">
                        A{slotIdx + 1}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="font-bold text-sky-200 text-xs group-hover:text-white truncate">
                      {skill.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {skill.description}
                    </div>
                  </div>

                  {cd > 0 && (
                    <div className="absolute inset-0 rounded-xl bg-slate-950/85 backdrop-blur-[1px] flex items-center justify-center font-bold text-amber-300 text-xs">
                      ⏳ Cooldown: {cd} Turn{cd > 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              );
            }

            return (
              <button
                key={`empty_active_slot_${slotIdx}`}
                onClick={() => onOpenQuickEquip('actives', slotIdx)}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-3 text-slate-500 hover:border-amber-500/50 hover:text-amber-300 transition-all cursor-pointer space-y-1 min-h-[85px]"
              >
                <Plus className="h-5 w-5 text-slate-600" />
                <span className="text-xs font-bold text-slate-400">Equip Slot #{slotIdx + 1}</span>
                <span className="text-[9px] text-slate-600">Click to choose</span>
              </button>
            );
          })}
        </div>

        {/* Physical Attacks */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onPlayerAction('normal_attack')}
            disabled={!isPlayerTurn || isProcessingTurn}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Sword className="h-4 w-4" /> Normal Attack (0 MP)
          </button>

          <button
            onClick={() => onPlayerAction('heavy_attack')}
            disabled={!isPlayerTurn || isProcessingTurn || playerMana < 15}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Zap className="h-4 w-4" /> Heavy Slash (15 MP)
          </button>
        </div>
      </div>
    </div>
  );
};
