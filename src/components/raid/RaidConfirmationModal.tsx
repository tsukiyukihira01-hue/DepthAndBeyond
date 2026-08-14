import React, { useState, useEffect } from 'react';
import { Character } from '../../types/game';
import { Party } from '../../types/party';
import { RaidBoss } from '../../types/raid';
import { RAID_BOSSES, getRemainingDailyRaidAttempts, getRaidEventStatus } from '../../data/raidBosses';
import { toggleMemberReadyState } from '../../data/partyData';
import { audio } from '../../utils/audio';
import {
  Flame,
  Shield,
  Clock,
  Target,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Zap,
  Swords,
  X,
  Hourglass,
  Crown,
  Lock,
} from 'lucide-react';

interface RaidConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  party?: Party | null;
  onConfirmLaunchRaid: (boss: RaidBoss) => void;
  onUpdateCharacter?: (updated: Character) => void;
}

export const RaidConfirmationModal: React.FC<RaidConfirmationModalProps> = ({
  isOpen,
  onClose,
  character,
  party,
  onConfirmLaunchRaid,
  onUpdateCharacter,
}) => {
  const [selectedBossId, setSelectedBossId] = useState<string>(RAID_BOSSES[0].id);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState(getRaidEventStatus());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setEventStatus(getRaidEventStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedBoss = RAID_BOSSES.find((b) => b.id === selectedBossId) || RAID_BOSSES[0];
  const remainingAttempts = getRemainingDailyRaidAttempts(character, 3);
  const today = new Date().toISOString().split('T')[0];

  const isLocked = remainingAttempts <= 0 || !eventStatus.isActive;

  // Party Readiness Assessment
  const partyMembers = party ? party.members : [];
  const allReady = partyMembers.length > 0 ? partyMembers.every((m) => m.isReady) : true;
  const readyCount = partyMembers.filter((m) => m.isReady).length;

  const handleToggleMyReady = () => {
    if (!party) return;
    audio.playClick();
    toggleMemberReadyState(party.id, character.id);
  };

  const handleLaunchCombat = () => {
    audio.playClick();

    if (!eventStatus.isActive) {
      setNoticeMessage(`🔒 Raid Event is currently unspawned/inactive. Next Raid Event spawns in ${eventStatus.timerFormatted} (00:00, 06:00, 12:00, 18:00 UTC).`);
      return;
    }

    if (remainingAttempts <= 0) {
      setNoticeMessage('🚨 Daily Fight Attempt Limit Reached (0/3 attempts left today)! Resets at 00:00 UTC.');
      return;
    }

    // Deduct 1 raid fight attempt from character state
    const currentUsed = character.lastRaidResetDate === today ? (character.dailyRaidAttemptsUsed || 0) : 0;
    const updatedChar: Character = {
      ...character,
      dailyRaidAttemptsUsed: currentUsed + 1,
      lastRaidResetDate: today,
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }

    onClose();
    onConfirmLaunchRaid(selectedBoss);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-2xl shadow-inner">
              <Flame className="h-6 w-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-200">
                APEX RAID COMBAT CONFIRMATION
              </h2>
              <p className="text-xs text-slate-400">
                Confirm boss target, 15m instance duration, and squad readiness before entering.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* RAID EVENT STATUS BANNER */}
          <div className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs ${
            eventStatus.isActive
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          }`}>
            <div className="flex items-center gap-2.5">
              {eventStatus.isActive ? (
                <Flame className="h-5 w-5 text-emerald-400 animate-bounce" />
              ) : (
                <Lock className="h-5 w-5 text-rose-400" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {eventStatus.isActive
                    ? '🔥 APEX RAID EVENT CURRENTLY ACTIVE (1-Hour Window)'
                    : '🔒 RAID EVENT NOT RESPAWNED (Reinitiates Every 6 Hours UTC)'}
                </p>
                <p className="text-[11px] opacity-90">
                  {eventStatus.isActive
                    ? `Active Event Ends in ${eventStatus.timerFormatted}. Event cycle repeats every 6h.`
                    : `Next Raid Event spawns in ${eventStatus.timerFormatted} (00:00, 06:00, 12:00, 18:00 UTC).`}
                </p>
              </div>
            </div>

            <span className={`font-mono text-xs font-bold px-3 py-1 rounded-lg border ${
              eventStatus.isActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
            }`}>
              {eventStatus.isActive ? `Closes in ${eventStatus.timerFormatted}` : `Spawns in ${eventStatus.timerFormatted}`}
            </span>
          </div>

          {/* Notice Alert */}
          {noticeMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {/* 1. RAID BOSS TARGET SELECTOR */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              1. Select Apex Raid Boss Target
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RAID_BOSSES.map((boss) => {
                const isSelected = boss.id === selectedBossId;

                return (
                  <div
                    key={boss.id}
                    onClick={() => {
                      setSelectedBossId(boss.id);
                      audio.playClick();
                    }}
                    className={`rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-lg ring-2 ring-amber-400/40'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-3xl border border-amber-500/30">
                        {boss.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-amber-200 text-sm truncate">{boss.name}</h4>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                            Tier {boss.tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{boss.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300">
                          <span className="text-emerald-400 font-bold">Rec. Lv {boss.recommendedLevel}</span>
                          <span>•</span>
                          <span className="text-rose-400 font-mono font-bold">{(boss.baseHp).toLocaleString()} HP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Clock className="h-3.5 w-3.5 text-amber-400" /> 15m Instance Expiry
                      </span>
                      <span className="text-slate-400">Enrage: {boss.enrageTurnLimit} Turns</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. INSTANCE TIME & DAILY FIGHT ATTEMPTS SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Instance Expiry Timer</p>
                  <p className="text-[10px] text-slate-400">Battle duration limit per encounter</p>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                15:00 (15 Mins)
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Target className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Daily Fight Attempts</p>
                  <p className="text-[10px] text-slate-400">Deducted when entering raid combat</p>
                </div>
              </div>
              <span className={`font-mono text-sm font-bold px-3 py-1 rounded-lg border ${
                remainingAttempts > 0
                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-red-300 bg-red-500/10 border-red-500/30 animate-pulse'
              }`}>
                {remainingAttempts} / 3 Left
              </span>
            </div>
          </div>

          {/* 3. SQUAD PARTY READINESS CHECK */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-400" />
                2. Party Squad Readiness Status
              </h3>

              {partyMembers.length > 0 && (
                <button
                  onClick={handleToggleMyReady}
                  className="text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-lg hover:bg-amber-500/30 transition cursor-pointer"
                >
                  Toggle My Ready Status
                </button>
              )}
            </div>

            {partyMembers.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {partyMembers.map((member) => (
                    <div
                      key={member.characterId}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{member.avatarIcon}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-100 flex items-center gap-1">
                            {member.characterName}
                            {member.isLeader && <Crown className="h-3 w-3 text-amber-400" />}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Lv {member.level} {member.classRole}
                          </p>
                        </div>
                      </div>

                      {member.isReady ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> READY
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                          <Hourglass className="h-3 w-3" /> NOT READY
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                  allReady
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <span>
                    {allReady
                      ? '✅ All party members are ready for combat deployment!'
                      : `⚠️ Squad readiness: ${readyCount}/${partyMembers.length} Ready.`}
                  </span>
                  <span className="font-mono">{readyCount} / {partyMembers.length} Ready</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <p className="font-bold text-amber-200">Solo Leader + Celestial Vanguard Squad</p>
                    <p className="text-[11px] text-slate-400">
                      You will deploy solo with Celestial Vanguard Tanks reinforcing your combat matrix.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[10px] font-bold text-emerald-300">
                  SOLO READY
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-950 p-4 gap-3">
          <div className="text-xs text-slate-400">
            <span>Attempt Cost: </span>
            <strong className="text-amber-300 font-mono">1 Daily Attempt</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audio.playClick();
                onClose();
              }}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel / Wait for Squad
            </button>

            <button
              onClick={handleLaunchCombat}
              disabled={isLocked}
              className={`flex items-center gap-2 rounded-xl border px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer ${
                isLocked
                  ? 'border-slate-800 bg-slate-900 text-slate-500 opacity-60 cursor-not-allowed'
                  : 'border-amber-400/60 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 hover:brightness-110'
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4 text-rose-400" />
                  {!eventStatus.isActive ? `LOCKED (NEXT: ${eventStatus.timerFormatted})` : 'LOCKED (0/3 ATTEMPTS LEFT)'}
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4" />
                  CONFIRM & ENTER RAID COMBAT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

