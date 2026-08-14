import React from 'react';
import { Character, Skill } from '../../types/game';
import { X, BookOpen } from 'lucide-react';

interface CombatGrimoireModalProps {
  character: Character;
  allAvailableSkills: Skill[];
  unlockedTreeSkills: Skill[];
  skillCooldowns: { [skillId: string]: number };
  playerMana: number;
  isPlayerTurn: boolean;
  isProcessingTurn: boolean;
  onCastSkill: (skillId: string) => void;
  onClose: () => void;
}

export const CombatGrimoireModal: React.FC<CombatGrimoireModalProps> = ({
  character,
  allAvailableSkills,
  unlockedTreeSkills,
  skillCooldowns,
  playerMana,
  isPlayerTurn,
  isProcessingTurn,
  onCastSkill,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-sky-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-500/40 text-2xl">
            📖
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-sky-200">
              Arcane Grimoire Spellbook
            </h3>
            <p className="text-xs text-slate-400">
              Direct Spellbook Casting & Formula Calculations
            </p>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
          {(allAvailableSkills || []).map((sk, idx) => {
            const isUnlocked =
              (character.skills || []).includes(sk.id) ||
              unlockedTreeSkills.some((s) => s.id === sk.id);
            const isPass = Boolean(sk.isPassive || sk.type === 'buff' || sk.id.startsWith('p_'));
            const cd = skillCooldowns[sk.id] || 0;
            const hasMana = playerMana >= (sk.manaCost || 0);
            const canCast =
              isPlayerTurn && !isProcessingTurn && isUnlocked && !isPass && cd === 0 && hasMana;

            return (
              <div
                key={`grimoire_sk_${sk.id}_${idx}`}
                className={`rounded-xl border p-3 text-xs transition-all space-y-2 ${
                  isUnlocked
                    ? 'border-sky-500/30 bg-slate-950 text-slate-100 shadow'
                    : 'border-slate-800/60 bg-slate-950/40 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{sk.icon || '✨'}</span>
                    <div>
                      <div className="font-bold text-sky-200 text-sm flex items-center gap-2">
                        <span>{sk.name}</span>
                        <span className="text-[10px] font-mono text-amber-400 uppercase">
                          [{sk.type}]
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {sk.manaCost ? `${sk.manaCost} MP` : 'Passive'} | Target:{' '}
                        {sk.targetType || (sk.isArea ? 'Area (All)' : 'Single')}
                        {sk.cooldownTurns ? ` | CD: ${sk.cooldownTurns} turns` : ''}
                      </div>
                    </div>
                  </div>

                  {!isPass && (
                    <button
                      onClick={() => {
                        onClose();
                        onCastSkill(sk.id);
                      }}
                      disabled={!canCast}
                      className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1.5 font-bold text-white shadow hover:brightness-110 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Cast Spell
                    </button>
                  )}
                </div>

                <div className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  {sk.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
