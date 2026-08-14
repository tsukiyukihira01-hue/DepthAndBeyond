import React, { useState, useEffect } from 'react';
import { Character, PlayerSearchResult } from '../../types/game';
import { Party, PartyMember, PartyTargetActivity, PartyLootMode } from '../../types/party';
import {
  getPartyList,
  getPartyForCharacter,
  createNewParty,
  joinParty,
  leaveCurrentParty,
  toggleMemberReadyState,
  kickMemberFromParty,
} from '../../data/partyData';
import {
  getRemainingDailyRaidAttempts,
  getSecondsUntilDailyReset,
  formatTimeSeconds,
  getRaidEventStatus,
} from '../../data/raidBosses';
import { audio } from '../../utils/audio';
import {
  Users,
  UserPlus,
  Shield,
  Swords,
  CheckCircle2,
  XCircle,
  LogOut,
  Crown,
  Sparkles,
  Plus,
  Search,
  Flame,
  X,
  Volume2,
  AlertCircle,
  Award,
  Clock,
  Target,
  Lock,
  Zap,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface PartyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onStartRaidWithParty?: (party: Party) => void;
  onUpdateCharacter?: (updated: Character) => void;
}

export const PartyManagerModal: React.FC<PartyManagerModalProps> = ({
  isOpen,
  onClose,
  character,
  onStartRaidWithParty,
  onUpdateCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<'my_squad' | 'browse' | 'create'>('my_squad');
  const [myParty, setMyParty] = useState<Party | null>(() => getPartyForCharacter(character.id));
  const [openParties, setOpenParties] = useState<Party[]>(() => getPartyList());

  // Create Form State
  const [createName, setCreateName] = useState(`${character.name}'s Squad`);
  const [createTarget, setCreateTarget] = useState<PartyTargetActivity>('Apex World Raid');
  const [createLootMode, setCreateLootMode] = useState<PartyLootMode>('Free for All');

  // Search / Invite State
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchOnlinePlayers, setSearchOnlinePlayers] = useState<PlayerSearchResult[]>([]);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Timer state for event expiry / daily reset
  const [secondsUntilReset, setSecondsUntilReset] = useState<number>(getSecondsUntilDailyReset());
  const [eventStatus, setEventStatus] = useState(getRaidEventStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilReset(getSecondsUntilDailyReset());
      setEventStatus(getRaidEventStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    const p = getPartyForCharacter(character.id);
    setMyParty(p ? { ...p } : null);
    setOpenParties(getPartyList());
  };

  if (!isOpen) return null;

  const isLeader = myParty ? myParty.leaderId === character.id : false;

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    audio.playClick();
    const newP = createNewParty(character, createName, createTarget, createLootMode);
    setMyParty(newP);
    setActiveTab('my_squad');
    setNoticeMessage(`Party "${newP.name}" created successfully!`);
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  const handleJoinParty = (partyId: string) => {
    audio.playClick();
    const res = joinParty(partyId, character);
    if (res.success && res.party) {
      setMyParty({ ...res.party });
      setActiveTab('my_squad');
      setNoticeMessage(res.message);
    } else {
      setNoticeMessage(res.message);
    }
    setTimeout(() => setNoticeMessage(null), 3000);
    refreshData();
  };

  const handleQuickMatch = () => {
    audio.playClick();
    const available = openParties.filter((p) => p.members.length < p.maxMembers);
    if (available.length > 0) {
      handleJoinParty(available[0].id);
    } else {
      const newP = createNewParty(character, `${character.name}'s Vanguard Squad`, 'Apex World Raid', 'Free for All');
      setMyParty(newP);
      setActiveTab('my_squad');
      setNoticeMessage(`⚡ Created new party squad "${newP.name}"!`);
      setTimeout(() => setNoticeMessage(null), 3000);
      refreshData();
    }
  };

  const handleLeaveParty = () => {
    audio.playClick();
    leaveCurrentParty(character.id);
    setMyParty(null);
    setNoticeMessage('You have left the party.');
    setTimeout(() => setNoticeMessage(null), 3000);
    refreshData();
  };

  const handleToggleReady = () => {
    if (!myParty) return;
    audio.playClick();
    toggleMemberReadyState(myParty.id, character.id);
    refreshData();
  };

  const handleKick = (targetId: string) => {
    if (!myParty || !isLeader) return;
    audio.playClick();
    kickMemberFromParty(myParty.id, character.id, targetId);
    refreshData();
  };

  const handleLaunchRaid = () => {
    if (!myParty) return;
    audio.playClick();

    if (!eventStatus.isActive) {
      setNoticeMessage(`🔒 Raid Event is inactive. Next Raid Event spawns in ${eventStatus.timerFormatted} (00:00, 06:00, 12:00, 18:00 UTC).`);
      setTimeout(() => setNoticeMessage(null), 6000);
      return;
    }

    const remaining = getRemainingDailyRaidAttempts(character, 3);
    if (remaining <= 0) {
      setNoticeMessage('🚨 Daily Raid Fight Limit Reached (0/3 attempts remaining today)! Resets at 00:00 UTC.');
      setTimeout(() => setNoticeMessage(null), 5000);
      return;
    }

    // Deduct 1 raid attempt and save to character
    const today = new Date().toISOString().split('T')[0];
    const updatedChar: Character = {
      ...character,
      dailyRaidAttemptsUsed: (character.lastRaidResetDate === today ? (character.dailyRaidAttemptsUsed || 0) : 0) + 1,
      lastRaidResetDate: today,
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }

    onClose();
    if (onStartRaidWithParty) {
      onStartRaidWithParty(myParty);
    }
  };

  // Live online player search for invitation
  const handleSearchInvitees = (query: string) => {
    setInviteSearchQuery(query);
    if (query.trim().length >= 1) {
      fetch(`/api/players/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setSearchOnlinePlayers(data.results || []))
        .catch(() => {});
    } else {
      setSearchOnlinePlayers([]);
    }
  };

  const handleInvitePlayer = (playerName: string) => {
    audio.playClick();
    setNoticeMessage(`Party invitation sent to ${playerName}!`);
    setIsInviteModalOpen(false);
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-200">
                Party & Squad Command Hub
              </h2>
              <p className="text-xs text-slate-400">
                Assemble multi-member raid parties, earn group EXP bonuses, and take down Raid Bosses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
              <Target className="h-4 w-4 text-amber-400" />
              <span>
                Daily Fights: <strong className="text-amber-200 font-bold">{getRemainingDailyRaidAttempts(character, 3)}/3 Left</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>
                Event Reset: <strong className="font-mono text-amber-300 font-bold">{formatTimeSeconds(secondsUntilReset)}</strong>
              </span>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notice Alert Banner */}
        {noticeMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('my_squad')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === 'my_squad'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-4 w-4" />
            My Party Squad
            {myParty && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-bold">
                {myParty.members.length}/5
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === 'browse'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="h-4 w-4" />
            Browse Open Parties
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-bold">
              {openParties.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === 'create'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            Create Party
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: MY SQUAD */}
          {activeTab === 'my_squad' && (
            <>
              {myParty ? (
                <div className="space-y-6">
                  {/* Party Banner */}
                  <div className="rounded-xl border border-amber-500/20 bg-slate-950 p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-base font-bold text-amber-300">
                          {myParty.name}
                        </h3>
                        <span className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-400 font-bold">
                          {myParty.targetActivity}
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                          Loot: {myParty.lootMode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Leader: <span className="text-slate-200 font-semibold">{myParty.leaderName}</span> • Party Bonus:{' '}
                        <span className="text-emerald-400 font-bold">+{myParty.sharedExpBonusPercent}% EXP</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLeader && (
                        <button
                          onClick={() => setIsInviteModalOpen(true)}
                          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                        >
                          <UserPlus className="h-4 w-4" />
                          Invite Member
                        </button>
                      )}

                      <button
                        onClick={handleToggleReady}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer border ${
                          myParty.members.find((m) => m.id === character.id)?.isReady
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-700 bg-slate-800 text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {myParty.members.find((m) => m.id === character.id)?.isReady ? 'Ready Check: YES' : 'Set Ready'}
                      </button>

                      <button
                        onClick={handleLeaveParty}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Leave
                      </button>
                    </div>
                  </div>

                  {/* Members Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Party Members ({myParty.members.length}/5)
                      </h4>
                      <span className="text-[11px] text-amber-400 font-medium">
                        All members receive full raid loot share & EXP bonuses.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {myParty.members.map((member) => {
                        const hpPct = Math.round((member.hp / member.maxHp) * 100);
                        const mpPct = Math.round((member.mana / member.maxMana) * 100);

                        return (
                          <div
                            key={member.id}
                            className={`rounded-xl border p-4 space-y-3 transition ${
                              member.id === character.id
                                ? 'border-amber-500/40 bg-amber-500/5'
                                : 'border-slate-800 bg-slate-950/80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xl border border-slate-700">
                                  {member.icon || '⚔️'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    {member.isLeader && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                                    <span className="font-semibold text-sm text-slate-100">
                                      {member.name}
                                    </span>
                                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-bold">
                                      Lv.{member.level}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-amber-400 font-medium">
                                    {member.classRole}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    member.isReady
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {member.isReady ? 'READY' : 'WAITING'}
                                </span>

                                {isLeader && member.id !== character.id && (
                                  <button
                                    onClick={() => handleKick(member.id)}
                                    className="rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                                    title="Kick member"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Status Bars */}
                            <div className="space-y-1.5">
                              <div>
                                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                  <span>HP</span>
                                  <span>
                                    {member.hp} / {member.maxHp} ({hpPct}%)
                                  </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${hpPct}%` }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                  <span>MANA</span>
                                  <span>
                                    {member.mana} / {member.maxMana} ({mpPct}%)
                                  </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className="h-full bg-cyan-500 transition-all duration-300"
                                    style={{ width: `${mpPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Raid Launch CTA */}
                  <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-amber-400" />
                        <h4 className="font-serif text-base font-bold text-amber-200">
                          Ready to Launch Apex World Raid?
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        {eventStatus.isActive
                          ? `Active Raid Event window (Ends in ${eventStatus.timerFormatted}). 15-Min Instance Limit.`
                          : `Raid event inactive. Next Raid Event spawns in ${eventStatus.timerFormatted} (00:00, 06:00, 12:00, 18:00 UTC).`}
                      </p>
                    </div>

                    {(() => {
                      const remaining = getRemainingDailyRaidAttempts(character, 3);
                      const isLocked = remaining <= 0 || !eventStatus.isActive;

                      return (
                        <button
                          onClick={handleLaunchRaid}
                          disabled={isLocked}
                          className={`flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition ${
                            isLocked
                              ? 'border-slate-800 bg-slate-900 text-slate-500 opacity-60 cursor-not-allowed'
                              : 'border-amber-400/50 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg hover:brightness-110 active:scale-95 cursor-pointer'
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="h-5 w-5 text-rose-400" />
                              {!eventStatus.isActive ? `LOCKED (RESPAWNS IN ${eventStatus.timerFormatted})` : 'LOCKED (0/3 ATTEMPTS)'}
                            </>
                          ) : (
                            <>
                              <Swords className="h-5 w-5" />
                              ENTER APEX RAID WITH PARTY
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                /* No Party State - Interactive Squad Hub */
                <div className="space-y-6 py-2">
                  <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        <span>Solo Adventurer</span>
                      </div>
                      <h3 className="font-serif text-base font-bold text-amber-200">
                        Assemble or Join a Party Squad for +15% EXP Boost
                      </h3>
                      <p className="text-xs text-slate-300 max-w-lg">
                        Party squads share EXP bonuses, assist during Apex Raids, and roll for rare world boss trophies together.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={handleQuickMatch}
                        className="flex items-center gap-2 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 cursor-pointer"
                      >
                        <Zap className="h-4 w-4" />
                        QUICK MATCH / JOIN
                      </button>

                      <button
                        onClick={() => setActiveTab('create')}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Plus className="h-4 w-4 text-amber-400" />
                        Create Squad
                      </button>
                    </div>
                  </div>

                  {/* Active Open Parties List Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Search className="h-4 w-4 text-amber-400" />
                        Active Parties Seeking Squad Members ({openParties.length})
                      </h4>
                      <button
                        onClick={() => setActiveTab('browse')}
                        className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
                      >
                        View All
                      </button>
                    </div>

                    {openParties.length === 0 ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400">
                        No open parties right now. Click "Create Squad" above to form your own!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {openParties.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 hover:border-amber-500/30 transition flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-slate-200">{p.name}</h5>
                              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                {p.members.length}/{p.maxMembers}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400">
                              Leader: <span className="text-slate-200">{p.leaderName}</span> • <span className="text-amber-400 font-medium">{p.targetActivity}</span>
                            </p>

                            <button
                              onClick={() => handleJoinParty(p.id)}
                              disabled={p.members.length >= p.maxMembers}
                              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Join Party Squad
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: BROWSE OPEN PARTIES */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Parties Seeking Adventurers
                </h4>
                <button
                  onClick={refreshData}
                  className="text-xs text-amber-400 hover:underline cursor-pointer font-semibold"
                >
                  Refresh List
                </button>
              </div>

              {openParties.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No open parties found. Create one to get started!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {openParties.map((p) => {
                    const isMyCurrent = myParty?.id === p.id;

                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-wrap items-center justify-between gap-4 hover:border-amber-500/30 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-100">{p.name}</h4>
                            <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              {p.targetActivity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Leader: <span className="text-slate-200 font-medium">{p.leaderName}</span> • Loot:{' '}
                            <span className="text-slate-300">{p.lootMode}</span> • Members:{' '}
                            <span className="text-emerald-400 font-bold">
                              {p.members.length}/{p.maxMembers}
                            </span>
                          </p>
                        </div>

                        <div>
                          {isMyCurrent ? (
                            <span className="rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                              Your Party
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJoinParty(p.id)}
                              disabled={p.members.length >= p.maxMembers}
                              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
                            >
                              Join Party
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREATE PARTY */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateParty} className="max-w-xl mx-auto space-y-5 py-2">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-amber-200">
                  Form a New Party Squad
                </h3>
                <p className="text-xs text-slate-400">
                  Configure your party settings. As party leader, you can launch Raids and manage members.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Party Name
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Primordial Dragon Slayers"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target Activity
                </label>
                <select
                  value={createTarget}
                  onChange={(e) => setCreateTarget(e.target.value as PartyTargetActivity)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-amber-400 focus:outline-none"
                >
                  <option value="Apex World Raid">Apex World Raid</option>
                  <option value="Nether Abyss Dungeons">Nether Abyss Dungeons</option>
                  <option value="Leyline Core Gathering">Leyline Core Gathering</option>
                  <option value="Guild Fortress Defense">Guild Fortress Defense</option>
                  <option value="Casual Grouping">Casual Grouping</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Loot Allocation Mode
                </label>
                <select
                  value={createLootMode}
                  onChange={(e) => setCreateLootMode(e.target.value as PartyLootMode)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-amber-400 focus:outline-none"
                >
                  <option value="Free for All">Free for All (Individual Loot Drops)</option>
                  <option value="Round Robin">Round Robin (Rotational Drop Share)</option>
                  <option value="Leader Pick">Leader Pick (Leader Distributes Loot)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-slate-950 hover:brightness-110 active:scale-98 transition cursor-pointer shadow-lg"
                >
                  CREATE PARTY SQUAD
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* SUB-MODAL: INVITE PLAYER */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif text-base font-bold text-amber-200">
                Invite Adventurer to Party
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search character name..."
                value={inviteSearchQuery}
                onChange={(e) => handleSearchInvitees(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {searchOnlinePlayers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  {inviteSearchQuery ? 'No adventurers found.' : 'Type a name above to search online players.'}
                </p>
              ) : (
                searchOnlinePlayers.map((player) => (
                  <div
                    key={player.characterId}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{player.characterName}</p>
                      <p className="text-[10px] text-slate-400">Lv.{player.level} • {player.faction}</p>
                    </div>
                    <button
                      onClick={() => handleInvitePlayer(player.characterName)}
                      className="rounded bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer"
                    >
                      Invite
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
