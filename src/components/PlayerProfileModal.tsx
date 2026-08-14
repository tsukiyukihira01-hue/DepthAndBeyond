import React, { useState, useEffect } from 'react';
import { Character, UserAccount, EquipmentSlot, PlayerProfileData, Item, Skill } from '../types/game';
import { EquipmentSprite } from './EquipmentSprite';
import { ItemStatCard } from './ItemStatCard';
import { audio } from '../utils/audio';
import skillsData from '../data/skills.json';
import { getUnlockedTreeSkills } from '../utils/skillTreeUtils';
import { SKILL_TREES } from '../data/skillTrees';
import { getClassDefinition } from '../data/classesAndArchetypes';
import {
  User,
  Shield,
  Coins,
  ArrowLeftRight,
  UserPlus,
  X,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  Monitor,
  LogOut,
  Calendar,
  Lock,
  Crown,
  Info,
  Eye,
  Sword,
  Zap,
  Heart,
  Droplet,
  Send,
  Gift,
  CheckCircle2,
  MessageSquare,
  Trophy,
  Award,
  Swords,
  Flame,
  Radio,
  Image as ImageIcon,
  Compass,
} from 'lucide-react';

interface PlayerProfileModalProps {
  isOpen: boolean;
  targetIdentifier: string | null; // User ID, character name, or "self"
  currentUser: UserAccount | null;
  currentCharacter: Character | null;
  onClose: () => void;
  onInitiateTrade?: (playerName: string) => void;
  onSendPartyInvite?: (playerName: string) => void;
  onLogout?: () => void;
  onUpdateLoadout?: (spec: 'A' | 'B') => void;
  uiMode?: 'auto' | 'mobile' | 'desktop';
  onUiModeChange?: (mode: 'auto' | 'mobile' | 'desktop') => void;
  navMode?: 'sidebar' | 'bottom' | 'both';
  onChangeNavMode?: (mode: 'sidebar' | 'bottom' | 'both') => void;
  onOpenAuth?: () => void;
  onOpenAdmin?: () => void;
}

const HONOR_TITLES = [
  'Vanguard Adventurer',
  'Grand Archmage',
  'Rogue',
  'Holy Paladin',
  'Dragon Sovereign',
  'Guildmaster',
  'Dungeon Explorer',
  'The Undefeated',
  'Realm Champion',
  'Supreme Warlord',
  'Frenzied Berserker',
  'Celestial Guardian',
];

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  targetIdentifier,
  currentUser,
  currentCharacter,
  onClose,
  onInitiateTrade,
  onSendPartyInvite,
  onLogout,
  onUpdateLoadout,
  uiMode = 'auto',
  onUiModeChange,
  navMode = 'bottom',
  onChangeNavMode,
  onOpenAuth,
  onOpenAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'paperdoll' | 'dossier' | 'skills' | 'customization' | 'security' | 'settings'>('paperdoll');
  const [profileData, setProfileData] = useState<PlayerProfileData | null>(null);
  const [inspectedGear, setInspectedGear] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Private Message Modal State
  const [showPmModal, setShowPmModal] = useState(false);
  const [pmText, setPmText] = useState('');
  const [isSendingPm, setIsSendingPm] = useState(false);
  const [pmFeedback, setPmFeedback] = useState<string | null>(null);

  // Gold Gift Modal State
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftGoldAmount, setGiftGoldAmount] = useState('1000');
  const [isGifting, setIsGifting] = useState(false);

  // Name & Title Edit state
  const [newNameInput, setNewNameInput] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [nameChangeMsg, setNameChangeMsg] = useState<string | null>(null);
  const [nameChangeErr, setNameChangeErr] = useState<string | null>(null);
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  const isSelf = !targetIdentifier || targetIdentifier === 'self' || targetIdentifier === currentUser?.userId || targetIdentifier === currentCharacter?.name;

  useEffect(() => {
    if (!isOpen) return;

    if (isSelf && currentCharacter && currentUser) {
      setProfileData({
        user: {
          id: currentUser.id,
          userId: currentUser.userId,
          email: currentUser.email,
          role: currentUser.role,
          isPrimaryGM: currentUser.isPrimaryGM,
          createdAt: currentUser.createdAt,
          isBanned: currentUser.isBanned,
        },
        character: currentCharacter,
      });
      setSelectedTitle(currentCharacter.title || 'Vanguard Adventurer');
      setAvatarUrlInput(currentCharacter.avatarUrl || '');
      setLoading(false);
      return;
    }

    if (targetIdentifier && targetIdentifier !== 'self') {
      setLoading(true);
      setError(null);
      fetch(`/api/players/profile/${encodeURIComponent(targetIdentifier)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Player profile record not found.');
          return res.json();
        })
        .then((data: PlayerProfileData) => {
          setProfileData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to retrieve player dossier.');
          setLoading(false);
        });
    }
  }, [isOpen, targetIdentifier, isSelf, currentCharacter, currentUser]);

  if (!isOpen) return null;

  const targetChar = profileData?.character || (isSelf ? currentCharacter : null);
  const targetUser = profileData?.user || (isSelf ? currentUser : null);

  // Gear score calculation (Combat Power Rating)
  const calculateGearScore = (char: Character): number => {
    let score = char.level * 50;
    if (!char.equipment) return score;
    Object.values(char.equipment).forEach((item) => {
      if (!item) return;
      let itemVal = 100;
      if (item.rarity === 'uncommon') itemVal = 200;
      if (item.rarity === 'rare') itemVal = 400;
      if (item.rarity === 'epic') itemVal = 800;
      if (item.rarity === 'legendary') itemVal = 2500;
      if (item.rarity === 'godly') itemVal = 5000;
      itemVal += (item.enchantLevel || 0) * 150;
      score += itemVal;
    });
    return score;
  };

  const gearScore = targetChar ? calculateGearScore(targetChar) : 0;

  // Symmetrical Paperdoll Equipment Layout
  const leftEquipmentSlots: { slot: EquipmentSlot; label: string; icon: string }[] = [
    { slot: 'head', label: 'Helmet', icon: '🪖' },
    { slot: 'amulet', label: 'Amulet', icon: '📿' },
    { slot: 'body', label: 'Chest Armor', icon: '🛡️' },
    { slot: 'mainHand', label: 'Main Weapon', icon: '⚔️' },
    { slot: 'offHand', label: 'Shield / Focus', icon: '🛡️' },
    { slot: 'arms', label: 'Gauntlets', icon: '🥊' },
  ];

  const rightEquipmentSlots: { slot: EquipmentSlot; label: string; icon: string }[] = [
    { slot: 'legs', label: 'Leggings', icon: '🦿' },
    { slot: 'ring', label: 'Ring', icon: '💍' },
    { slot: 'familiar', label: 'Familiar Pet', icon: '🦅' },
    { slot: 'mount', label: 'Mount', icon: '🦄' },
    { slot: 'wing', label: 'Wing Artifact', icon: '🪽' },
    { slot: 'costume', label: 'Costume', icon: '🥋' },
  ];

  const handleChangeName = async () => {
    if (!currentCharacter || !newNameInput.trim()) return;
    setIsSubmittingName(true);
    setNameChangeMsg(null);
    setNameChangeErr(null);

    try {
      const res = await fetch('/api/character/change-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: currentCharacter.id,
          newName: newNameInput.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNameChangeErr(data.error || 'Failed to change name.');
      } else {
        setNameChangeMsg(data.message);
        setNewNameInput('');
        if (data.character) {
          currentCharacter.name = data.character.name;
          currentCharacter.tokens = data.character.tokens;
        }
      }
    } catch {
      setNameChangeErr('Network error occurred while attempting name change.');
    } finally {
      setIsSubmittingName(false);
    }
  };

  const handleUpdateTitle = async (titleStr: string) => {
    if (!currentCharacter) return;
    setSelectedTitle(titleStr);
    try {
      const res = await fetch('/api/player/update-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: currentCharacter.id,
          title: titleStr,
        }),
      });
      if (res.ok) {
        currentCharacter.title = titleStr;
      }
    } catch {
      // silent
    }
  };

  const handleSendPm = async () => {
    if (!currentCharacter || !targetChar || !pmText.trim()) return;
    setIsSendingPm(true);
    setPmFeedback(null);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: currentCharacter.id,
          channel: 'pm',
          recipientId: targetChar.id,
          content: pmText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPmFeedback(`Private whisper sent to ${targetChar.name}!`);
        setPmText('');
        setTimeout(() => {
          setShowPmModal(false);
          setPmFeedback(null);
        }, 1500);
      } else {
        setPmFeedback(data.error || 'Failed to send message.');
      }
    } catch {
      setPmFeedback('Network error sending message.');
    } finally {
      setIsSendingPm(false);
    }
  };

  const handleGiftGold = () => {
    const amount = parseInt(giftGoldAmount, 10);
    if (isNaN(amount) || amount <= 0 || !currentCharacter || !targetChar) return;
    if (currentCharacter.gold < amount) {
      alert(`Insufficient gold! You have ${currentCharacter.gold.toLocaleString()} Gold.`);
      return;
    }
    setIsGifting(true);
    // Execute trade gift
    currentCharacter.gold -= amount;
    targetChar.gold += amount;
    alert(`Successfully gifted ${amount.toLocaleString()} Gold to ${targetChar.name}!`);
    setIsGifting(false);
    setShowGiftModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-amber-500/40 bg-slate-950/95 p-3 sm:p-6 text-slate-100 shadow-2xl max-h-[95vh] flex flex-col overflow-hidden my-auto">
        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-30 text-slate-400 hover:text-slate-100 cursor-pointer p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ========================================== */}
        {/* TOP PROFILE HEADER / DOSSIER BANNER        */}
        {/* ========================================== */}
        <div className="relative rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-3 sm:p-4 shadow-inner mb-3">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
            {/* Custom Avatar / Profile Picture */}
            <div className="relative shrink-0">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-amber-500/60 bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center">
                {targetChar?.avatarUrl ? (
                  <img src={targetChar.avatarUrl} alt={targetChar.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl sm:text-5xl select-none">
                    {targetChar?.faction === 'HEAVENLY' ? '⚔️' : '🔥'}
                  </span>
                )}

                {/* Level Overlay Badge */}
                <span className="absolute bottom-1 right-1 rounded-md bg-amber-500 text-slate-950 px-1.5 py-0.5 text-[10px] font-extrabold font-mono shadow">
                  LV.{targetChar?.level || 1}
                </span>

                {targetUser?.role === 'ADMIN' && (
                  <span className="absolute top-1 left-1 rounded-full bg-amber-500 p-1 text-slate-950 shadow" title="Primary GM Admin">
                    <Crown className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              {/* Online Status Dot */}
              <div className="mt-1.5 flex justify-center">
                {targetChar?.isOnline ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    <span className="h-2 w-2 rounded-full bg-slate-500" /> Offline
                  </span>
                )}
              </div>
            </div>

            {/* Profile Identity Details */}
            <div className="flex-1 text-center sm:text-left space-y-1.5 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-amber-200 truncate max-w-[240px] sm:max-w-none">
                  {targetChar ? targetChar.name : targetUser?.email.split('@')[0]}
                </h1>

                {/* User ID Tag */}
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-amber-300 font-bold shrink-0">
                  ID: #{targetUser?.userId || 'N/A'}
                </span>

                {targetUser?.role === 'ADMIN' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                    <Shield className="h-3 w-3 text-amber-400" /> GM Admin
                  </span>
                )}

                {profileData?.guildName && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1 shrink-0">
                    <Trophy className="h-3 w-3 text-sky-400" /> [{profileData.guildName}]
                  </span>
                )}
              </div>

              {/* Honor Title Banner & Class Type */}
              {(() => {
                const targetClassDef = getClassDefinition(targetChar?.characterClass);
                return (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs">
                    <span className="font-bold text-amber-400/90 italic bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                      "{targetChar?.title || 'Vanguard Adventurer'}"
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${targetClassDef.typeBadgeColor}`}>
                      {targetClassDef.typeTitle}
                    </span>
                    <span className="text-slate-400 font-medium">
                      • <span className="text-amber-300 font-semibold">{targetClassDef.name}</span> ({targetChar?.archetype || 'Tactical Commander'}) • {targetChar?.faction || 'HEAVENLY'} Faction
                    </span>
                  </div>
                );
              })()}

              {/* Vital Stat Bars (HP, MP, Ward) */}
              {targetChar && (
                <div className="grid grid-cols-3 gap-2 pt-1 max-w-lg mx-auto sm:mx-0 text-[10px] font-mono">
                  <div className="rounded-lg bg-slate-950 p-1.5 border border-rose-900/50">
                    <div className="flex justify-between text-rose-300 font-bold mb-0.5">
                      <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5 fill-rose-500" /> HP</span>
                      <span>{targetChar.stats.hp}/{targetChar.stats.maxHp}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (targetChar.stats.hp / targetChar.stats.maxHp) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950 p-1.5 border border-sky-900/50">
                    <div className="flex justify-between text-sky-300 font-bold mb-0.5">
                      <span className="flex items-center gap-1"><Droplet className="h-2.5 w-2.5 fill-sky-500" /> MP</span>
                      <span>{targetChar.stats.mana}/{targetChar.stats.maxMana}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (targetChar.stats.mana / targetChar.stats.maxMana) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950 p-1.5 border border-amber-900/50">
                    <div className="flex justify-between text-amber-300 font-bold mb-0.5">
                      <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Ward</span>
                      <span>{targetChar.stats.ward}/{targetChar.stats.maxWard || 100}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (targetChar.stats.ward / (targetChar.stats.maxWard || 100)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Combat Power Score Card */}
            <div className="hidden md:flex flex-col items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-center shrink-0 min-w-[130px]">
              <Zap className="h-6 w-6 text-amber-400 animate-bounce mb-1" />
              <span className="text-[10px] text-amber-300 font-mono uppercase font-bold tracking-wider">GEAR SCORE</span>
              <span className="text-xl font-extrabold font-mono text-amber-200">
                {gearScore.toLocaleString()} CP
              </span>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* TORN-INSPIRED REACHABLE ACTION DOCK        */}
        {/* ========================================== */}
        <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/90 p-2 shadow-lg">
          {/* Guest / Non-Registered Warning Banner */}
          {!isSelf && targetChar && (!currentUser || !currentCharacter) && (
            <div className="w-full mb-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold">Interaction buttons are disabled for non-registered players & guests.</span>
              </div>
              {onOpenAuth && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="shrink-0 rounded-lg bg-amber-500 px-3 py-1 font-bold text-slate-950 hover:bg-amber-400 text-xs transition-all cursor-pointer shadow"
                >
                  Log In or Register
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs font-bold">
            {!isSelf && targetChar ? (
              <>
                <button
                  disabled={!currentUser || !currentCharacter}
                  onClick={() => {
                    if (!currentUser || !currentCharacter) {
                      alert('Interaction disabled for non-registered players. Please log in or register an account.');
                      if (onOpenAuth) { onClose(); onOpenAuth(); }
                      return;
                    }
                    alert(`Challenged ${targetChar.name} to a duel!`);
                  }}
                  className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 shadow-md transition-all ${
                    !currentUser || !currentCharacter
                      ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                      : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95'
                  }`}
                  title={!currentUser || !currentCharacter ? 'Log in or register to challenge players' : 'Challenge to Duel'}
                >
                  <Swords className="h-4 w-4" /> Challenge
                </button>

                {onInitiateTrade && (
                  <button
                    disabled={!currentUser || !currentCharacter}
                    onClick={() => {
                      if (!currentUser || !currentCharacter) {
                        alert('Interaction disabled for non-registered players. Please log in or register an account.');
                        if (onOpenAuth) { onClose(); onOpenAuth(); }
                        return;
                      }
                      onInitiateTrade(targetChar.name);
                    }}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 shadow-md transition-all ${
                      !currentUser || !currentCharacter
                        ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer active:scale-95'
                    }`}
                    title={!currentUser || !currentCharacter ? 'Log in or register to trade' : 'Initiate Trade'}
                  >
                    <ArrowLeftRight className="h-4 w-4" /> Trade
                  </button>
                )}

                {onSendPartyInvite && (
                  <button
                    disabled={!currentUser || !currentCharacter}
                    onClick={() => {
                      if (!currentUser || !currentCharacter) {
                        alert('Interaction disabled for non-registered players. Please log in or register an account.');
                        if (onOpenAuth) { onClose(); onOpenAuth(); }
                        return;
                      }
                      onSendPartyInvite(targetChar.name);
                    }}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 shadow-md transition-all ${
                      !currentUser || !currentCharacter
                        ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                        : 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer active:scale-95'
                    }`}
                    title={!currentUser || !currentCharacter ? 'Log in or register to invite to party' : 'Send Party Invite'}
                  >
                    <UserPlus className="h-4 w-4" /> Invite
                  </button>
                )}

                <button
                  disabled={!currentUser || !currentCharacter}
                  onClick={() => {
                    if (!currentUser || !currentCharacter) {
                      alert('Interaction disabled for non-registered players. Please log in or register an account.');
                      if (onOpenAuth) { onClose(); onOpenAuth(); }
                      return;
                    }
                    setShowPmModal(true);
                  }}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 transition-all ${
                    !currentUser || !currentCharacter
                      ? 'border-slate-800 bg-slate-950 text-slate-500 cursor-not-allowed opacity-60'
                      : 'border-amber-500/40 bg-amber-950/40 text-amber-200 hover:bg-amber-900/60 cursor-pointer active:scale-95'
                  }`}
                  title={!currentUser || !currentCharacter ? 'Log in or register to whisper' : 'Send Direct Message'}
                >
                  <MessageSquare className="h-4 w-4 text-amber-400" /> Whisper
                </button>

                <button
                  disabled={!currentUser || !currentCharacter}
                  onClick={() => {
                    if (!currentUser || !currentCharacter) {
                      alert('Interaction disabled for non-registered players. Please log in or register an account.');
                      if (onOpenAuth) { onClose(); onOpenAuth(); }
                      return;
                    }
                    setShowGiftModal(true);
                  }}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 transition-all ${
                    !currentUser || !currentCharacter
                      ? 'border-slate-800 bg-slate-950 text-slate-500 cursor-not-allowed opacity-60'
                      : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 cursor-pointer active:scale-95'
                  }`}
                  title={!currentUser || !currentCharacter ? 'Log in or register to gift gold' : 'Gift Gold Coins'}
                >
                  <Gift className="h-4 w-4 text-emerald-400" /> Gift Gold
                </button>

                <button
                  disabled={!currentUser || !currentCharacter}
                  onClick={async () => {
                    if (!currentCharacter) {
                      alert('Interaction disabled for non-registered players.');
                      return;
                    }
                    const isCurrentlyMuted = currentCharacter.mutedPlayerIds?.includes(targetChar.id);
                    const endpoint = isCurrentlyMuted ? '/api/player/unmute' : '/api/player/mute';
                    try {
                      const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          characterId: currentCharacter.id,
                          targetCharacterId: targetChar.id,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        currentCharacter.mutedPlayerIds = data.mutedPlayerIds;
                        alert(isCurrentlyMuted ? `Unmuted ${targetChar.name}.` : `Muted ${targetChar.name}.`);
                      }
                    } catch {
                      alert('Error toggling mute status.');
                    }
                  }}
                  className={`flex items-center justify-center gap-1 rounded-lg border px-2.5 py-2 transition-all ${
                    !currentUser || !currentCharacter
                      ? 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                      : currentCharacter?.mutedPlayerIds?.includes(targetChar.id)
                      ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-200 cursor-pointer'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-100 cursor-pointer'
                  }`}
                  title="Toggle Ignore / Mute Player"
                >
                  {currentCharacter?.mutedPlayerIds?.includes(targetChar.id) ? (
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </button>

                <button
                  disabled={!currentUser || !currentCharacter}
                  onClick={async () => {
                    if (!currentCharacter) {
                      alert('Interaction disabled for non-registered players.');
                      return;
                    }
                    const reason = prompt(`Reason for reporting ${targetChar.name}:`);
                    if (!reason || !reason.trim()) return;
                    try {
                      const res = await fetch('/api/player/report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          reporterId: currentCharacter.id,
                          reportedPlayerId: targetChar.id,
                          reason: reason.trim(),
                        }),
                      });
                      if (res.ok) {
                        alert(`Report against ${targetChar.name} submitted to GM moderators.`);
                      }
                    } catch {
                      alert('Error submitting report.');
                    }
                  }}
                  className={`flex items-center justify-center gap-1 rounded-lg border p-2 transition-all ${
                    !currentUser || !currentCharacter
                      ? 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50'
                      : 'border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 cursor-pointer'
                  }`}
                  title="Report Player to GM Admins"
                >
                  <Info className="h-4 w-4 text-rose-400" />
                </button>
              </>
            ) : (
              <>
                {(currentUser?.role === 'ADMIN' || currentUser?.userId === '1') && onOpenAdmin && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/60 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-300 hover:border-amber-400 py-2 px-3 cursor-pointer shadow-lg transition-all"
                  >
                    <Shield className="h-4 w-4 text-amber-400 animate-pulse" /> 👑 Open GM Admin Panel
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('customization')}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 px-3 cursor-pointer shadow-md transition-all"
                >
                  <ImageIcon className="h-4 w-4" /> Edit Avatar & Title
                </button>

                <button
                  onClick={() => setActiveTab('skills')}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 text-amber-200 hover:bg-amber-900/60 py-2 px-3 cursor-pointer transition-all"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" /> Battle Skills Loadout
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white py-2 px-3 cursor-pointer transition-all"
                >
                  <Shield className="h-4 w-4 text-slate-400" /> Account Security
                </button>
              </>
            )}
          </div>
        </div>

        {/* NAV TAB BUTTONS */}
        <div className="flex items-center gap-1 border-b border-slate-800 mb-3 text-xs font-bold overflow-x-auto shrink-0 pb-1">
          <button
            onClick={() => setActiveTab('paperdoll')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'paperdoll'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> Gear Showcase
          </button>

          <button
            onClick={() => setActiveTab('dossier')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dossier'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="h-3.5 w-3.5" /> Player Dossier & Stats
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'skills'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" /> Equipped Skills
          </button>

          {isSelf && (
            <>
              <button
                onClick={() => setActiveTab('customization')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'customization'
                    ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> Customization
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="h-3.5 w-3.5" /> Account & Security
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="h-3.5 w-3.5" /> Game Settings
              </button>
            </>
          )}
        </div>

        {/* ========================================== */}
        {/* MODAL MAIN CONTENT BODY                    */}
        {/* ========================================== */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-amber-300 animate-pulse font-semibold">
              Retrieving player dossier from realm database...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-950/20 rounded-xl border border-rose-900/40">
              {error}
            </div>
          ) : activeTab === 'paperdoll' && targetChar ? (
            <div className="space-y-4">
              {/* Paperdoll 12-Slot Gear Showcase Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Left 6 Equipment Slots */}
                <div className="md:col-span-4 space-y-2">
                  {leftEquipmentSlots.map(({ slot, label }) => {
                    const item = targetChar.equipment?.[slot];
                    return (
                      <div
                        key={slot}
                        onClick={() => item && setInspectedGear(item)}
                        className={`group rounded-xl border p-2 flex items-center gap-2.5 transition-all ${
                          item
                            ? 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400 shadow-md cursor-pointer hover:bg-slate-900'
                            : 'border-slate-800/80 bg-slate-950/50 text-slate-600'
                        }`}
                      >
                        <EquipmentSprite slot={slot} item={item} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-slate-400 uppercase font-semibold font-mono tracking-wider">{label}</p>
                          <p className={`text-xs font-bold truncate flex items-center justify-between ${item ? 'text-amber-200' : 'text-slate-600 italic'}`}>
                            <span>
                              {item ? item.name : 'Empty Slot'}
                            </span>
                            {item && (
                              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1 rounded border border-amber-500/30">
                                +{item.enchantLevel || 0}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Character Portrait & Power Card */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-slate-950 to-slate-900 text-center space-y-3 shadow-2xl">
                  <div className="relative h-32 w-32 rounded-full border-4 border-amber-500/60 bg-slate-900 p-1 shadow-inner flex items-center justify-center">
                    {targetChar.avatarUrl ? (
                      <img src={targetChar.avatarUrl} alt={targetChar.name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <span className="text-6xl">{targetChar.faction === 'HEAVENLY' ? '⚔️' : '🔥'}</span>
                    )}

                    {/* Faction Emblem Badge */}
                    <div className="absolute -bottom-2 bg-amber-500 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-mono shadow-lg border border-amber-300">
                      {targetChar.faction}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-serif text-lg font-bold text-amber-200">{targetChar.name}</h2>
                    <p className="text-xs text-amber-400/90 font-mono italic">"{targetChar.title || 'Vanguard Adventurer'}"</p>
                    <p className="text-[11px] text-slate-300 font-medium">Level {targetChar.level} • <span className="text-amber-300 font-semibold">{targetChar.characterClass || 'Sentinel'}</span></p>
                    <p className="text-[10px] text-purple-300 font-mono">Archetype: {targetChar.archetype || 'Tactical Commander'}</p>
                  </div>

                  {/* Gear Rating */}
                  <div className="w-full rounded-xl border border-amber-500/30 bg-amber-950/40 p-2.5 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-amber-300 font-mono uppercase font-bold">
                      <Zap className="h-3.5 w-3.5 text-amber-400" /> Gear Score Rating
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-200">
                      {gearScore.toLocaleString()} CP
                    </div>
                  </div>

                  {/* Active Preset Loadout Badge */}
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span>Active Spec Preset:</span>
                    <strong className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      Spec {targetChar.loadoutSpec || 'A'}
                    </strong>
                  </div>
                </div>

                {/* Right 6 Equipment Slots */}
                <div className="md:col-span-4 space-y-2">
                  {rightEquipmentSlots.map(({ slot, label }) => {
                    const item = targetChar.equipment?.[slot];
                    return (
                      <div
                        key={slot}
                        onClick={() => item && setInspectedGear(item)}
                        className={`group rounded-xl border p-2 flex items-center gap-2.5 transition-all ${
                          item
                            ? 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400 shadow-md cursor-pointer hover:bg-slate-900'
                            : 'border-slate-800/80 bg-slate-950/50 text-slate-600'
                        }`}
                      >
                        <EquipmentSprite slot={slot} item={item} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-slate-400 uppercase font-semibold font-mono tracking-wider">{label}</p>
                          <p className={`text-xs font-bold truncate flex items-center justify-between ${item ? 'text-amber-200' : 'text-slate-600 italic'}`}>
                            <span>
                              {item ? item.name : 'Empty Slot'}
                            </span>
                            {item && (
                              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1 rounded border border-amber-500/30">
                                +{item.enchantLevel || 0}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'dossier' && targetChar ? (
            <div className="space-y-4 text-xs">
              {/* Primary Attributes Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Sparkles className="h-4 w-4 text-amber-400" /> Primary Attributes & Combat Stats
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                    <span className="text-[10px] text-slate-400 block font-mono">STRENGTH</span>
                    <p className="font-bold text-amber-200 text-base">{targetChar.stats.str}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                    <span className="text-[10px] text-slate-400 block font-mono">DEFENSE</span>
                    <p className="font-bold text-amber-200 text-base">{targetChar.stats.def}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                    <span className="text-[10px] text-slate-400 block font-mono">INTELLIGENCE</span>
                    <p className="font-bold text-amber-200 text-base">{targetChar.stats.int}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                    <span className="text-[10px] text-slate-400 block font-mono">WISDOM</span>
                    <p className="font-bold text-amber-200 text-base">{targetChar.stats.wis}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                    <span className="text-[10px] text-slate-400 block font-mono">SPEED</span>
                    <p className="font-bold text-amber-200 text-base">{targetChar.stats.spd}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                    <span className="text-[10px] text-slate-400 block font-mono">DEXTERITY</span>
                    <p className="font-bold text-amber-200 text-base">{targetChar.stats.dex}</p>
                  </div>
                </div>
              </div>

              {/* World Career & Accomplishments Dossier */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Award className="h-4 w-4 text-amber-400" /> World Career & Record Statistics
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 font-mono">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Monsters Defeated</span>
                    <span className="text-base font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                      ⚔️ {(targetChar.monstersDefeated || 142).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Current Gold Wealth</span>
                    <span className="text-base font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                      <Coins className="h-4 w-4 text-amber-400" />
                      {targetChar.gold.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Tokens Balance</span>
                    <span className="text-base font-bold text-sky-300 flex items-center gap-1 mt-0.5">
                      🪙 {(targetChar.tokens || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Gold Leaf Currency</span>
                    <span className="text-base font-bold text-emerald-300 flex items-center gap-1 mt-0.5">
                      🍃 {(targetChar.goldLeaf || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'skills' && targetChar ? (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" /> Equipped Combat Loadout
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Active Spec Preset: Spec {targetChar.loadoutSpec || 'A'}
                  </span>
                </h3>

                {/* Equipped Skill Trees Section */}
                <div className="space-y-2 border-b border-slate-800 pb-3">
                  <h4 className="text-[11px] font-bold text-amber-300 font-mono flex items-center justify-between">
                    <span>Equipped Skill Trees (Max 4 Slots):</span>
                    <span className="text-[10px] text-slate-400">Skill Tree Masteries</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(targetChar.equippedTrees || ['tree_vanguard', 'tree_blade', 'tree_pyro', 'tree_sylvan']).map((treeId, idx) => {
                      const tree = SKILL_TREES.find((t) => t.id === treeId);
                      return (
                        <div key={`prof_tree_${idx}`} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex items-center gap-2">
                          <span className="text-2xl">{tree ? tree.icon : '🌳'}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] text-amber-400 font-mono block">Slot #{idx + 1}</span>
                            <p className="font-bold text-slate-100 text-xs truncate">{tree ? tree.name : 'Empty Tree'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 8 Active Battle Skill Slots */}
                {(() => {
                  const unlockedSkills = getUnlockedTreeSkills(targetChar);
                  const profileSkillsMap = new Map<string, Skill>();
                  (skillsData as Skill[]).forEach((s) => profileSkillsMap.set(s.id, s));
                  unlockedSkills.forEach((s) => profileSkillsMap.set(s.id, s));
                  const profileSkills = Array.from(profileSkillsMap.values());
                  const findProfileSkill = (skId: string | null) => (skId ? profileSkills.find((s) => s.id === skId) : null);

                  return (
                    <>
                      <div>
                        <h4 className="text-[11px] font-bold text-amber-400 mb-2 font-mono">
                          Active Battle Cast Slots (8 Slots):
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Array.from({ length: 8 }).map((_, idx) => {
                            const skId = targetChar.equippedSkills?.actives?.[idx];
                            const sk = findProfileSkill(skId);
                            return (
                              <div
                                key={`act_sk_${idx}`}
                                className="rounded-xl border border-slate-800 bg-slate-950 p-2 flex items-center gap-2"
                              >
                                <div className="h-8 w-8 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                                  {sk ? sk.icon : '⚔️'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] text-slate-500 font-mono block">Slot A{idx + 1}</span>
                                  <p className="font-bold text-slate-200 truncate">
                                    {sk ? sk.name : 'Empty Slot'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Auto-Cast & Passives */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {/* Auto-Cast Slot */}
                        <div>
                          <h4 className="text-[11px] font-bold text-sky-400 mb-2 font-mono">
                            Auto-Cast Slot (1 Slot):
                          </h4>
                          {(() => {
                            const skId = targetChar.equippedSkills?.autoCast;
                            const sk = findProfileSkill(skId);
                            return (
                              <div className="rounded-xl border border-sky-500/30 bg-slate-950 p-2.5 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-xl shrink-0">
                                  {sk ? sk.icon : '⚡'}
                                </div>
                                <div>
                                  <span className="text-[9px] text-sky-400 font-mono block">AUTOMATICALLY TRIGGERS TURN END</span>
                                  <p className="font-bold text-slate-100 text-sm">{sk ? sk.name : 'No Auto-Cast Equipped'}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Passive Traits */}
                        <div>
                          <h4 className="text-[11px] font-bold text-emerald-400 mb-2 font-mono">
                            Passive Traits (4 Slots):
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Array.from({ length: 4 }).map((_, idx) => {
                              const skId = targetChar.equippedSkills?.passives?.[idx];
                              const sk = findProfileSkill(skId);
                              return (
                                <div key={`pass_sk_${idx}`} className="rounded-xl border border-slate-800 bg-slate-950 p-2 flex items-center gap-2">
                                  <span className="text-base">{sk ? sk.icon : '✨'}</span>
                                  <span className="font-bold text-slate-200 truncate text-[11px]">
                                    {sk ? sk.name : 'Empty'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : activeTab === 'customization' && targetChar ? (
            <div className="space-y-4 text-xs">
              {/* Profile Picture / Custom Avatar Manager */}
              <div className="rounded-xl border border-amber-500/40 bg-slate-900/80 p-4 space-y-3">
                <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-amber-400" /> Custom Profile Picture & Avatar
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Provide an image URL or upload a custom picture to personalize your adventurer portrait across global chat, rankings, and public profiles.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl border-2 border-amber-500/50 bg-slate-950 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                    {avatarUrlInput ? (
                      <img src={avatarUrlInput} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl">{targetChar.faction === 'HEAVENLY' ? '⚔️' : '🔥'}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-[200px]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        placeholder="Paste image URL (https://...)"
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        onClick={async () => {
                          if (!currentCharacter) return;
                          try {
                            const res = await fetch('/api/player/update-avatar', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                characterId: currentCharacter.id,
                                avatarUrl: avatarUrlInput.trim(),
                              }),
                            });
                            if (res.ok) {
                              currentCharacter.avatarUrl = avatarUrlInput.trim();
                              alert('Avatar updated successfully!');
                            }
                          } catch {
                            alert('Failed to update avatar.');
                          }
                        }}
                        className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                      >
                        Save URL
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept="image/gif,image/jpeg,image/png,image/webp,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const MAX_SIZE_BYTES = 2128 * 1024; // 2128 KB limit
                          if (file.size > MAX_SIZE_BYTES) {
                            alert(`File size exceeds the 2128KB limit! (Current: ${Math.round(file.size / 1024)}KB). Please choose a smaller image.`);
                            return;
                          }

                          // Preserve GIF animations directly or optimize static images to protect server resources
                          if (file.type === 'image/gif') {
                            const reader = new FileReader();
                            reader.onload = async (evt) => {
                              const dataUrl = evt.target?.result as string;
                              if (dataUrl && currentCharacter) {
                                setAvatarUrlInput(dataUrl);
                                try {
                                  const res = await fetch('/api/player/update-avatar', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      characterId: currentCharacter.id,
                                      avatarUrl: dataUrl,
                                    }),
                                  });
                                  if (res.ok) {
                                    currentCharacter.avatarUrl = dataUrl;
                                    alert('GIF profile picture uploaded successfully!');
                                  } else {
                                    const errData = await res.json();
                                    alert(errData.error || 'Failed to update avatar.');
                                  }
                                } catch {
                                  alert('Error saving avatar.');
                                }
                              }
                            };
                            reader.readAsDataURL(file);
                          } else {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const img = new Image();
                              img.onload = async () => {
                                const canvas = document.createElement('canvas');
                                const MAX_DIM = 320;
                                let width = img.width;
                                let height = img.height;
                                if (width > height) {
                                  if (width > MAX_DIM) {
                                    height = Math.round((height * MAX_DIM) / width);
                                    width = MAX_DIM;
                                  }
                                } else {
                                  if (height > MAX_DIM) {
                                    width = Math.round((width * MAX_DIM) / height);
                                    height = MAX_DIM;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                }
                                // Compress to lightweight WebP/JPEG (quality 0.82) to protect server bandwidth & storage
                                const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                                if (optimizedDataUrl && currentCharacter) {
                                  setAvatarUrlInput(optimizedDataUrl);
                                  try {
                                    const res = await fetch('/api/player/update-avatar', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        characterId: currentCharacter.id,
                                        avatarUrl: optimizedDataUrl,
                                      }),
                                    });
                                    if (res.ok) {
                                      currentCharacter.avatarUrl = optimizedDataUrl;
                                      alert('Profile photo optimized (resource-saving) & uploaded successfully!');
                                    } else {
                                      const errData = await res.json();
                                      alert(errData.error || 'Failed to update avatar.');
                                    }
                                  } catch {
                                    alert('Error saving avatar.');
                                  }
                                }
                              };
                              img.src = evt.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">
                        Max size: 2128 KB • GIFs & images allowed (Auto-compressed to protect server resources)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Honor Title Selector */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" /> Select Active Honor Title
                </h4>
                <p className="text-slate-400">Choose your displayed honor title in public chat and profile inspects.</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {HONOR_TITLES.map((titleStr) => (
                    <button
                      key={titleStr}
                      onClick={() => handleUpdateTitle(titleStr)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        selectedTitle === titleStr
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      "{titleStr}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Character Name Change */}
              <div className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" /> Change Character Display Name
                  </h4>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                    🪙 {targetChar.tokens || 0} Tokens
                  </span>
                </div>

                <p className="text-slate-400 text-xs">
                  Change character name for <strong className="text-amber-300">500 Tokens</strong>. Your permanent User ID (<span className="font-mono text-amber-300">#{targetUser?.userId}</span>) will never change.
                </p>

                {nameChangeMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-semibold text-xs">
                    {nameChangeMsg}
                  </div>
                )}

                {nameChangeErr && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 font-semibold text-xs">
                    {nameChangeErr}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    placeholder="Enter new character name..."
                    maxLength={20}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    onClick={handleChangeName}
                    disabled={isSubmittingName || !newNameInput.trim() || (targetChar.tokens || 0) < 500}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmittingName ? 'Updating...' : 'Change Name (500 Tokens)'}
                  </button>
                </div>
              </div>

              {/* Loadout Preset Switcher */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h4 className="font-bold text-amber-200 text-sm">Preset Loadout Spec</h4>
                <p className="text-slate-400">Switch active equipment spec presets.</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdateLoadout && onUpdateLoadout('A')}
                    className={`px-4 py-2 rounded-xl font-bold border cursor-pointer transition-colors ${
                      targetChar.loadoutSpec === 'A'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Spec Preset A (Active)
                  </button>
                  <button
                    onClick={() => onUpdateLoadout && onUpdateLoadout('B')}
                    className={`px-4 py-2 rounded-xl font-bold border cursor-pointer transition-colors ${
                      targetChar.loadoutSpec === 'B'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Spec Preset B
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'security' && targetUser ? (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" /> Account Security & Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Assigned Permanent User ID</span>
                    <span className="font-mono text-base font-bold text-amber-300">#{targetUser.userId}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Account Role</span>
                    <span className="font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                      {targetUser.role === 'ADMIN' ? '👑 Primary GM Admin' : '🛡️ Standard Player'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Email Address</span>
                    <span className="font-semibold text-slate-200">{targetUser.email}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Account Created</span>
                    <span className="font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(targetUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {isSelf && onLogout && (
                <div className="pt-2">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-950/40 border border-rose-900/50 p-3 text-rose-300 font-bold hover:bg-rose-900/60 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out of Realm Account
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'settings' ? (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-emerald-400" /> Audio & Sound Effects
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Master Sound Toggle</span>
                  <button
                    onClick={() => {
                      const muted = audio.toggleMute();
                      setIsMuted(muted);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold border cursor-pointer ${
                      isMuted
                        ? 'border-rose-900/50 bg-rose-950/40 text-rose-300'
                        : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    }`}
                  >
                    {isMuted ? 'Muted' : 'Sound Enabled'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-amber-400" /> Display & Layout Mode
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onUiModeChange && onUiModeChange('auto')}
                    className={`p-2.5 rounded-xl font-bold border text-center cursor-pointer ${
                      uiMode === 'auto'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Auto Mode
                  </button>
                  <button
                    onClick={() => onUiModeChange && onUiModeChange('mobile')}
                    className={`p-2.5 rounded-xl font-bold border text-center cursor-pointer ${
                      uiMode === 'mobile'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Force Mobile
                  </button>
                  <button
                    onClick={() => onUiModeChange && onUiModeChange('desktop')}
                    className={`p-2.5 rounded-xl font-bold border text-center cursor-pointer ${
                      uiMode === 'desktop'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Force Desktop
                  </button>
                </div>
              </div>

              {/* Realm Navigation System Choice */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                  <Compass className="h-4 w-4 text-amber-400" /> Navigation Style & Layout
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Choose your primary interface for navigating zones, features, and realm menus.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => onChangeNavMode && onChangeNavMode('bottom')}
                    className={`p-3 rounded-xl font-bold border text-left cursor-pointer transition-all ${
                      navMode === 'bottom'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">Bottom Screen Bar</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500 text-slate-950">
                        PRIMARY
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal leading-normal">
                      Floating bottom dock with quick tabs & sheet drawer
                    </p>
                  </button>

                  <button
                    onClick={() => onChangeNavMode && onChangeNavMode('sidebar')}
                    className={`p-3 rounded-xl font-bold border text-left cursor-pointer transition-all ${
                      navMode === 'sidebar'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">Side Menu Drawer</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal leading-normal">
                      Classic collapsible left sidebar menu
                    </p>
                  </button>

                  <button
                    onClick={() => onChangeNavMode && onChangeNavMode('both')}
                    className={`p-3 rounded-xl font-bold border text-left cursor-pointer transition-all ${
                      navMode === 'both'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">Both (Hybrid)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal leading-normal">
                      Display both bottom dock and sidebar simultaneously
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Inspected Gear Tooltip Modal Overlay */}
        {inspectedGear && targetChar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setInspectedGear(null)}
                className="absolute top-4 right-3 z-20 rounded-lg bg-slate-900/90 p-1.5 text-slate-400 hover:text-slate-100 border border-slate-700 cursor-pointer"
                title="Close gear inspection"
              >
                <X className="h-4 w-4" />
              </button>

              <ItemStatCard item={inspectedGear} characterLevel={targetChar.level} />
            </div>
          </div>
        )}

        {/* Private Message Whisper Modal Overlay */}
        {showPmModal && targetChar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-950 p-5 space-y-4 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-400" /> Send Private Whisper to {targetChar.name}
                </h3>
                <button
                  onClick={() => setShowPmModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Send a direct encrypted message to <strong className="text-amber-300">{targetChar.name}</strong>.
              </p>

              {pmFeedback && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 font-semibold text-xs">
                  {pmFeedback}
                </div>
              )}

              <textarea
                value={pmText}
                onChange={(e) => setPmText(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPmModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendPm}
                  disabled={isSendingPm || !pmText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Send className="h-3.5 w-3.5" /> Send Whisper
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gift Gold Modal Overlay */}
        {showGiftModal && targetChar && currentCharacter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-950 p-5 space-y-4 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <Gift className="h-4 w-4 text-emerald-400" /> Gift Gold to {targetChar.name}
                </h3>
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Your Balance: <strong className="text-amber-300">{currentCharacter.gold.toLocaleString()} Gold</strong>
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Gold Amount to Gift:
                </label>
                <input
                  type="number"
                  value={giftGoldAmount}
                  onChange={(e) => setGiftGoldAmount(e.target.value)}
                  min={1}
                  max={currentCharacter.gold}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGiftGold}
                  disabled={isGifting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Gift className="h-3.5 w-3.5" /> Transfer Gold
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
