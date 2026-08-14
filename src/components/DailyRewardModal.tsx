import React, { useState } from 'react';
import { Character, DailyRewardDay } from '../types/game';
import { audio } from '../utils/audio';
import { Calendar, Gift, Check, Clock, Sparkles, Award, X } from 'lucide-react';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdateCharacter: (char: Character) => void;
}

const DAILY_REWARDS: DailyRewardDay[] = [
  { day: 1, type: 'gold', name: '5,000 Gold', description: 'Starter purse of shiny gold coins.', goldAmount: 5000, icon: '🪙' },
  { day: 2, type: 'item', name: '3x EXP Boost Vouchers (+50%)', description: 'Scrolls boosting XP gain by 50%.', icon: '📜' },
  { day: 3, type: 'gold', name: '20,000 Gold', description: 'Loyalty gold reward.', goldAmount: 20000, icon: '💰' },
  { day: 4, type: 'item', name: '10x Grand Health & Mana Potions', description: 'Vitality restoration potions.', icon: '🧪' },
  { day: 5, type: 'gold', name: '50,000 Gold & 25 Gold Leaf', description: 'Bounty of gold and gold leaves.', goldAmount: 50000, icon: '💎' },
  { day: 6, type: 'item', name: '2x Mythical Upgrade Blessing Stones', description: '100% equipment upgrade success rate.', icon: '💎' },
  { day: 7, type: 'item', name: '1x Celestial Godly Companion Egg', description: 'Hatches into a Godly pet companion!', icon: '👑' },
];

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
}) => {
  const [claiming, setClaiming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReward, setSuccessReward] = useState<DailyRewardDay | null>(null);

  if (!isOpen) return null;

  const currentStreak = character.dailyStreakDays || 0;
  const lastClaimTime = character.lastDailyClaimTime ? new Date(character.lastDailyClaimTime).getTime() : 0;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const timeSinceLastClaim = Date.now() - lastClaimTime;
  const canClaim = lastClaimTime === 0 || timeSinceLastClaim >= TWENTY_FOUR_HOURS;

  const hoursUntilReset = Math.max(0, Math.ceil((TWENTY_FOUR_HOURS - timeSinceLastClaim) / (1000 * 60 * 60)));

  const handleClaim = async () => {
    setClaiming(true);
    setErrorMsg(null);
    setSuccessReward(null);

    try {
      const res = await fetch('/api/player/daily-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to claim daily reward.');
      } else {
        audio.playVictory();
        setSuccessReward(data.claimedReward);
        if (data.character) {
          onUpdateCharacter(data.character);
        }
      }
    } catch {
      setErrorMsg('Error connecting to daily reward server.');
    } finally {
      setClaiming(false);
    }
  };

  const streakProgressPercent = Math.min(100, Math.round(((currentStreak % 7) || (canClaim ? 0 : 7)) / 7 * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3">
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-slate-950 p-5 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/60 text-amber-300">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-200">Daily Login Bonus & Rewards</h2>
              <p className="text-xs text-slate-400">Claim your free rewards once every 24 hours to build your login streak!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Streak Progress Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-400" /> Active Login Streak: <span className="text-white text-sm font-mono">{currentStreak} Days</span>
            </span>
            <span className="font-mono text-slate-400">Streak Progress ({streakProgressPercent}%)</span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden border border-amber-950">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-500"
              style={{ width: `${streakProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Claim Status & Banner */}
        {successReward ? (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/80 p-4 text-center space-y-2 animate-bounce">
            <div className="text-3xl">{successReward.icon}</div>
            <h3 className="text-sm font-bold text-emerald-200">🎉 Daily Reward Claimed!</h3>
            <p className="text-xs text-emerald-300">{successReward.name} — {successReward.description}</p>
          </div>
        ) : errorMsg ? (
          <div className="rounded-xl border border-rose-500/50 bg-rose-950/80 p-3 text-xs text-rose-200 flex items-center justify-between">
            <span>{errorMsg}</span>
          </div>
        ) : !canClaim ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-3 text-xs text-amber-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Daily reward already claimed today. Next cycle available in approximately <strong>{hoursUntilReset} hour(s)</strong>.</span>
          </div>
        ) : null}

        {/* 7-Day Reward Cycle Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {DAILY_REWARDS.map((reward, index) => {
            const dayNum = reward.day;
            const isCompleted = currentStreak >= dayNum && !canClaim;
            const isCurrentTarget = (canClaim && (currentStreak % 7) === index) || (!canClaim && (currentStreak % 7) === dayNum);

            return (
              <div
                key={`daily_day_${dayNum}`}
                className={`relative rounded-xl border p-2.5 flex flex-col items-center justify-between text-center transition-all ${
                  isCompleted
                    ? 'border-emerald-500/50 bg-emerald-950/20 text-slate-400 opacity-70'
                    : isCurrentTarget
                    ? 'border-amber-400 bg-amber-950/50 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="text-[10px] font-mono font-bold uppercase text-amber-400">Day {dayNum}</div>
                <div className="text-2xl my-1.5">{reward.icon}</div>
                <div className="text-[10px] font-bold truncate max-w-full leading-tight">{reward.name}</div>

                {isCompleted && (
                  <div className="absolute top-1 right-1 rounded-full bg-emerald-500 p-0.5 text-slate-950">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={handleClaim}
            disabled={!canClaim || claiming}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              canClaim
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {claiming ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              <Gift className="h-4 w-4" />
            )}
            <span>{claiming ? 'Claiming...' : canClaim ? 'Claim Daily Login Reward' : 'Already Claimed Today'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
