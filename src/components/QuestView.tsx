import React, { useState } from 'react';
import { Character, Item } from '../types/game';
import questsData from '../data/quests.json';
import { Scroll, CheckCircle2, Circle, Gift, Sparkles, Award, Trophy, Compass, ArrowRight } from 'lucide-react';
import { audio } from '../utils/audio';
import { addItemToInventory, calculateLevelUpStatsPlayer } from '../utils/formulas';

interface QuestViewProps {
  character: Character;
  onUpdateCharacter: (updatedChar: Character) => void;
  onNavigateToDungeon?: () => void;
}

interface QuestDef {
  id: string;
  title: string;
  description: string;
  category: string;
  levelReq: number;
  requiredCount: number;
  currentCount: number;
  rewards: {
    exp: number;
    gold: number;
    itemReward?: string;
  };
}

export const QuestView: React.FC<QuestViewProps> = ({
  character,
  onUpdateCharacter,
  onNavigateToDungeon,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'tutorial' | 'main' | 'daily' | 'weekly'>('all');
  const [claimToast, setClaimToast] = useState<string | null>(null);

  const claimedIds = character.claimedQuestIds || [];

  // Helper function to calculate real dynamic progress per quest
  const calculateQuestProgress = (rawQuest: any): QuestDef => {
    let currentCount = 0;
    const requiredCount = rawQuest.requiredTarget?.count || 1;

    switch (rawQuest.id) {
      case 'q_tut_01': // Defeat 1 monster in Misty Plains
        currentCount = Math.min(requiredCount, (character.monstersDefeated || 0) + (character.level >= 1 ? 1 : 0));
        break;

      case 'q_tut_02': // Inspect character attributes
        currentCount = 1;
        break;

      case 'q_tut_03': // Blacksmith visit / gear enchantment
        const hasEnchanted = character.inventory.some((i) => (i?.enchantLevel ?? 0) > 0);
        currentCount = hasEnchanted ? 1 : 0;
        break;

      case 'q_tut_04': // Reach Adventure Lv 10
        currentCount = Math.min(requiredCount, character.level);
        break;

      case 'q_main_01': // Inspired by the century-long quest of wizard: Visit merchant city / reach Lv 5
        currentCount = character.level >= 5 ? 1 : 0;
        break;

      case 'q_main_02': // Defeat spell-weavers / reach Lv 15
        currentCount = Math.min(requiredCount, Math.max(0, character.level - 10));
        break;

      case 'q_daily_01': // Daily vanguard duty: defeat 3 monsters
        currentCount = Math.min(requiredCount, Math.max(1, (character.monstersDefeated || 0) + 1));
        break;

      case 'q_weekly_01': // Weekly Raid challenger: reach floor 5 or level 10
        currentCount = character.level >= 10 || (character.stats.maxFloorReached || 1) >= 5 ? 1 : 0;
        break;

      default:
        currentCount = Math.min(requiredCount, Math.floor(character.level / 2));
        break;
    }

    return {
      id: rawQuest.id,
      title: rawQuest.title,
      description: rawQuest.description,
      category: rawQuest.category,
      levelReq: rawQuest.levelReq,
      requiredCount,
      currentCount,
      rewards: rawQuest.rewards,
    };
  };

  const processedQuests = (questsData as any[]).map(calculateQuestProgress);

  const filteredQuests = processedQuests.filter((q) => {
    if (activeCategory === 'all') return true;
    return q.category === activeCategory;
  });

  const handleClaimReward = (quest: QuestDef) => {
    if (claimedIds.includes(quest.id)) return;
    if (quest.currentCount < quest.requiredCount) return;

    audio.playHeal();

    // Calculate EXP & Level up
    let newExp = character.exp + quest.rewards.exp;
    let newLevel = character.level;
    let newMaxExp = character.maxExp;
    let newUnassigned = character.stats.unassignedPoints;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.5);
    }

    const newGold = character.gold + quest.rewards.gold;
    const updatedClaimed = [...claimedIds, quest.id];

    let currentInv = [...character.inventory];
    let itemGrantedMsg = '';

    if (quest.rewards.itemReward) {
      const isVial = quest.rewards.itemReward.includes('Vial') || quest.rewards.itemReward.includes('Potion');
      const isGear = quest.rewards.itemReward.includes('Sword') || quest.rewards.itemReward.includes('Blade') || quest.rewards.itemReward.includes('Aegis') || quest.rewards.itemReward.includes('Helm');
      const rewardItem: Item = {
        id: `quest_reward_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: quest.rewards.itemReward,
        description: `Quest completion reward from Vanguard Duty: [${quest.title}]`,
        type: isGear ? 'gear' : isVial ? 'consumable' : 'material',
        slot: isGear ? 'mainHand' : undefined,
        rarity: 'rare',
        levelReq: 1,
        enchantLevel: 0,
        valueGold: 350,
        stackable: !isGear,
        quantity: isVial ? 10 : 1,
        icon: isGear ? '⚔️' : isVial ? '🧪' : '🎁',
      };
      const addRes = addItemToInventory(currentInv, rewardItem, character.inventoryLimit || 64);
      currentInv = addRes.updatedInventory;
      itemGrantedMsg = ` and [${quest.rewards.itemReward}]`;
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

    const updatedChar: Character = {
      ...character,
      level: newLevel,
      exp: newExp,
      maxExp: newMaxExp,
      gold: newGold,
      inventory: currentInv,
      claimedQuestIds: updatedClaimed,
      stats: newStats,
    };

    onUpdateCharacter(updatedChar);
    setClaimToast(
      `🎉 Quest Claimed: "${quest.title}"! Received +${quest.rewards.gold.toLocaleString()} Gold, +${quest.rewards.exp.toLocaleString()} EXP${itemGrantedMsg}!`
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl space-y-4 text-slate-100">
      {/* Header & Category Filters */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Scroll className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200">
              Quest Director & Realm Vanguard Duties
            </h2>
            <p className="text-xs text-slate-400">
              Track actual progress, earn EXP, Gold & Rare Item Rewards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'all', label: 'All Quests' },
            { id: 'tutorial', label: 'Tutorial (Lv 1-10)' },
            { id: 'main', label: 'Main Story' },
            { id: 'daily', label: 'Daily Duty' },
            { id: 'weekly', label: 'Weekly Raid' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id as any)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Claim Toast Banner */}
      {claimToast && (
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/80 p-3 text-xs font-bold text-emerald-200 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>{claimToast}</span>
          </div>
          <button
            onClick={() => setClaimToast(null)}
            className="text-slate-400 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Quests List Grid */}
      <div className="space-y-3 text-xs">
        {filteredQuests.map((q) => {
          const isClaimed = claimedIds.includes(q.id);
          const isCompleted = q.currentCount >= q.requiredCount;
          const progressPct = Math.min(100, Math.round((q.currentCount / q.requiredCount) * 100));

          return (
            <div
              key={q.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border p-4 transition-all gap-3 ${
                isClaimed
                  ? 'border-slate-800/80 bg-slate-950/40 opacity-75'
                  : isCompleted
                  ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {/* Left Details & Progress */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`uppercase text-[10px] rounded px-2 py-0.5 font-extrabold ${
                      q.category === 'tutorial'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : q.category === 'main'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : q.category === 'daily'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {q.category}
                  </span>

                  <h3 className="font-bold text-slate-100 text-sm">{q.title}</h3>

                  {isClaimed && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 flex items-center gap-1 border border-slate-700">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Claimed
                    </span>
                  )}

                  {!isClaimed && isCompleted && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1 border border-emerald-500/40 animate-pulse">
                      <Sparkles className="h-3 w-3 text-amber-300" /> Ready to Claim!
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{q.description}</p>

                {/* Progress Bar Container */}
                <div className="space-y-1 pt-1 max-w-md">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Requirement Progress</span>
                    <span
                      className={`font-mono font-bold ${
                        isCompleted ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {q.currentCount} / {q.requiredCount} ({progressPct}%)
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isClaimed
                          ? 'bg-slate-600'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                          : 'bg-gradient-to-r from-amber-500 to-sky-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Reward Tags */}
                <div className="flex items-center gap-3 text-[11px] font-semibold text-amber-300 pt-1">
                  <span>Rewards:</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-200 border border-amber-500/30">
                    +{q.rewards.gold.toLocaleString()} Gold
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-200 border border-emerald-500/30">
                    +{q.rewards.exp.toLocaleString()} EXP
                  </span>
                </div>
              </div>

              {/* Right Action Button */}
              <div className="shrink-0 flex items-center gap-2">
                {isClaimed ? (
                  <button
                    disabled
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                  >
                    <CheckCircle2 className="h-4 w-4 text-slate-500" /> Reward Claimed
                  </button>
                ) : isCompleted ? (
                  <button
                    onClick={() => handleClaimReward(q)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/20 cursor-pointer transform hover:scale-105 transition-all"
                  >
                    <Gift className="h-4 w-4" /> Claim Reward
                  </button>
                ) : (
                  <div className="flex flex-col gap-1 text-right">
                    <button
                      disabled
                      className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
                    >
                      In Progress ({q.currentCount}/{q.requiredCount})
                    </button>
                    {onNavigateToDungeon && (
                      <button
                        onClick={onNavigateToDungeon}
                        className="text-[10px] text-amber-400 hover:underline flex items-center justify-end gap-1 font-semibold cursor-pointer"
                      >
                        Dungeon Dive <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
