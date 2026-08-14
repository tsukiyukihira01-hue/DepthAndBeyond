import React, { useState } from 'react';
import { TownData, TownBounty } from '../../types/town';
import { Character } from '../../types/game';
import { Scroll, Coins, ShieldCheck, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { calculateLevelUpStatsPlayer } from '../../utils/formulas';

interface TownNoticeBoardModalProps {
  town: TownData;
  character: Character;
  onClose: () => void;
  onUpdateCharacter: (char: Character) => void;
}

export const TownNoticeBoardModal: React.FC<TownNoticeBoardModalProps> = ({
  town,
  character,
  onClose,
  onUpdateCharacter,
}) => {
  const [claimedBountyIds, setClaimedBountyIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClaimBounty = (bounty: TownBounty) => {
    if (claimedBountyIds.includes(bounty.id)) return;

    // Grant bounty rewards
    const updatedGold = character.gold + bounty.rewardGold;
    let newExp = character.exp + bounty.rewardExp;
    let newLevel = character.level;
    let newMaxExp = character.maxExp;
    let newUnassigned = character.stats.unassignedPoints;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.5);
    }

    let newStats = { ...character.stats };
    if (newLevel > character.level) {
      const gains = calculateLevelUpStatsPlayer(character.level, newLevel, character.stats, character.characterClass);
      newStats = {
        ...newStats,
        maxHp: gains.maxHp,
        hp: gains.hp,
        maxMana: gains.maxMana,
        mana: gains.mana,
        str: gains.str,
        int: gains.int,
        def: gains.def,
        wis: gains.wis,
        spd: gains.spd,
        dex: gains.dex,
        unassignedPoints: gains.unassignedPoints,
      };
    }

    onUpdateCharacter({
      ...character,
      gold: updatedGold,
      exp: newExp,
      level: newLevel,
      maxExp: newMaxExp,
      stats: newStats,
    });

    setClaimedBountyIds((prev) => [...prev, bounty.id]);
    setSuccessMessage(`✨ Bounty Completed! Claimed +${bounty.rewardGold} Gold & +${bounty.rewardExp} EXP!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Notice Board Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-3xl">
            📋
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-amber-200">
              {town.name} Vanguard Bulletin Board
            </h2>
            <p className="text-xs text-slate-400">
              Daily Town Bounties, City Decrees, and Public Notices
            </p>
          </div>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/80 p-3 text-xs font-bold text-emerald-200 flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-white font-bold">×</button>
          </div>
        )}

        {/* Town News Decrees */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <h3 className="font-serif text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Scroll className="h-4 w-4 text-amber-400" /> Royal Decrees & Local News
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {town.newsBulletin.map((news, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{news}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Active Town Bounties */}
        <div className="space-y-3">
          <h3 className="font-serif text-sm font-bold text-amber-200 flex items-center justify-between">
            <span>Active Town Bounties ({town.bounties.length})</span>
            <span className="text-xs text-slate-400 font-normal">Resets Daily at 00:00 UTC</span>
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {town.bounties.map((bounty) => {
              const isClaimed = claimedBountyIds.includes(bounty.id);
              const isLevelMet = character.level >= bounty.levelReq;

              return (
                <div
                  key={bounty.id}
                  className={`flex flex-wrap items-center justify-between rounded-xl border p-4 transition-all gap-3 ${
                    isClaimed
                      ? 'border-emerald-500/30 bg-emerald-950/20 opacity-70'
                      : 'border-slate-800 bg-slate-900/80 hover:border-amber-500/40'
                  }`}
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-200">{bounty.title}</span>
                      <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                        Lv Req {bounty.levelReq}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{bounty.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-amber-400 font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" /> +{bounty.rewardGold} Gold
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" /> +{bounty.rewardExp} EXP
                      </span>
                      {bounty.rewardItemName && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-300 font-bold">🧪 {bounty.rewardItemName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    {isClaimed ? (
                      <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-2 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </span>
                    ) : isLevelMet ? (
                      <button
                        onClick={() => handleClaimBounty(bounty)}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <span>Fulfill Bounty</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-500 font-bold">
                        Requires Lv {bounty.levelReq}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
