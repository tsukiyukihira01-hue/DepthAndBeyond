import React, { useState, useEffect } from 'react';
import { Character } from '../../types/game';
import { TOWNS_DATA } from '../../data/townsData';
import { TownDistrict, NpcCharacter, NpcOption } from '../../types/town';
import { getRemainingDailyRaidAttempts, getRaidEventStatus } from '../../data/raidBosses';
import { NpcDialogueModal } from './NpcDialogueModal';
import { TownNoticeBoardModal } from './TownNoticeBoardModal';
import { TownMerchantShopModal } from './TownMerchantShopModal';
import {
  Castle,
  Coins,
  Zap,
  Sparkles,
  Scroll,
  MessageSquare,
  ChevronRight,
  Shield,
  ShoppingBag,
  Building,
  Flame,
  Users,
  Target,
  Swords,
  Clock,
  Lock,
} from 'lucide-react';

interface PlayableTownHubProps {
  character: Character;
  onUpdateCharacter?: (updated: Character) => void;
  onNavigateView: (
    view:
      | 'map'
      | 'combat'
      | 'raid'
      | 'party'
      | 'character'
      | 'inventory'
      | 'blacksmith'
      | 'skills'
      | 'familiar'
      | 'market'
      | 'mercenary'
      | 'guild'
      | 'quests'
  ) => void;
}

export const PlayableTownHub: React.FC<PlayableTownHubProps> = ({
  character,
  onUpdateCharacter,
  onNavigateView,
}) => {
  // Determine town data based on character current zone or default to Sun City
  const currentTownKey =
    character.currentZoneId === 'zone_merchant_city' || character.currentZoneId === 'node_merchant_city'
      ? 'town_merchant_city'
      : character.currentZoneId === 'zone_goddess_city' || character.currentZoneId === 'node_goddess_city'
      ? 'town_goddess_city'
      : 'town_sun_city';

  const town = TOWNS_DATA[currentTownKey] || TOWNS_DATA.town_sun_city;

  const [activeDistrictId, setActiveDistrictId] = useState<string>(town.districts[0]?.id || 'dist_square');
  const [selectedNpc, setSelectedNpc] = useState<NpcCharacter | null>(null);
  const [isNoticeBoardOpen, setIsNoticeBoardOpen] = useState<boolean>(false);
  const [isMerchantShopOpen, setIsMerchantShopOpen] = useState<boolean>(false);

  // Sacred Fountain Heal State
  const [fountainTimer, setFountainTimer] = useState<number>(0);
  const [isFountainHealing, setIsFountainHealing] = useState<boolean>(false);
  const [fountainSuccessMessage, setFountainSuccessMessage] = useState<string | null>(null);

  // Raid Event Live Status
  const [eventStatus, setEventStatus] = useState(getRaidEventStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setEventStatus(getRaidEventStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeDistrict = town.districts.find((d) => d.id === activeDistrictId) || town.districts[0];

  const startFountainHeal = () => {
    if (isFountainHealing) return;
    setIsFountainHealing(true);
    setFountainTimer(15);
    setFountainSuccessMessage(null);

    let remainingSeconds = 15;
    const interval = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setFountainTimer(0);
        setIsFountainHealing(false);

        const healedHp = Math.min(
          character.stats.maxHp,
          character.stats.hp + Math.round(character.stats.maxHp * 0.5)
        );
        const healedMana = Math.min(
          character.stats.maxMana,
          character.stats.mana + Math.round(character.stats.maxMana * 0.5)
        );

        if (onUpdateCharacter) {
          onUpdateCharacter({
            ...character,
            stats: {
              ...character.stats,
              hp: healedHp,
              mana: healedMana,
            },
          });
        }

        setFountainSuccessMessage(
          `✨ Sacred Fountain Meditation Complete! Restored +50% HP (${healedHp}/${character.stats.maxHp}) & +50% MP (${healedMana}/${character.stats.maxMana})!`
        );
      } else {
        setFountainTimer(remainingSeconds);
      }
    }, 1000);
  };

  const handleNpcOptionSelect = (option: NpcOption) => {
    setSelectedNpc(null);
    if (option.actionType === 'open_facility' && option.facilityView) {
      onNavigateView(option.facilityView);
    } else if (option.actionType === 'open_shop') {
      setIsMerchantShopOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* City Banner & Status Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/60 p-5 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#e2b857_2px,transparent_2px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-3xl shadow-inner">
              🏰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-bold text-amber-200">{town.name}</h1>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  🛡️ Safe Sanctuary Zone
                </span>
              </div>
              <p className="text-xs text-slate-400">{town.title}</p>
            </div>
          </div>

          {/* Player Quick Stats & Town Reputation */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs">
              <span className="text-slate-400">Reputation:</span>
              <span className="font-bold text-amber-300">{town.reputationName}</span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="font-mono font-bold text-amber-300">
                  {character.gold.toLocaleString()} Gold
                </span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="font-mono font-bold text-slate-200">
                  Lv {character.level}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sacred City Fountain & Quick Notice Bar */}
      <div className="rounded-2xl border border-sky-500/40 bg-slate-950/90 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-950/80 border border-sky-500/40 text-2xl">
            ⛲
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-sky-200 flex items-center gap-2">
              Sacred Fountain Meditation
              <span className="text-[10px] font-sans font-normal text-slate-400">
                (Free Sanctuary Recovery)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Restores <span className="font-bold text-emerald-300">+50% HP & MP</span> after 15 seconds of quiet meditation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNoticeBoardOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 px-3.5 py-2 text-xs font-bold text-amber-200 transition-all cursor-pointer"
          >
            <Scroll className="h-4 w-4 text-amber-400" /> Notice Board Bounties
          </button>

          <button
            onClick={startFountainHeal}
            disabled={
              isFountainHealing ||
              (character.stats.hp >= character.stats.maxHp &&
                character.stats.mana >= character.stats.maxMana)
            }
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              isFountainHealing
                ? 'border border-amber-500/50 bg-amber-950/60 text-amber-300 animate-pulse'
                : character.stats.hp >= character.stats.maxHp &&
                  character.stats.mana >= character.stats.maxMana
                ? 'border border-slate-800 bg-slate-900 text-slate-500 opacity-60 cursor-not-allowed'
                : 'border border-sky-500/50 bg-sky-950/80 hover:bg-sky-900 text-sky-200 shadow-lg shadow-sky-500/10'
            }`}
          >
            {isFountainHealing ? (
              <>⏳ Meditating... ({fountainTimer}s left)</>
            ) : character.stats.hp >= character.stats.maxHp &&
              character.stats.mana >= character.stats.maxMana ? (
              <>✨ Full HP & MP Already</>
            ) : (
              <>⛲ Pray at Sacred Fountain (15s)</>
            )}
          </button>
        </div>
      </div>

      {fountainSuccessMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/80 p-3 text-xs font-semibold text-emerald-200 flex items-center justify-between">
          <span>{fountainSuccessMessage}</span>
          <button onClick={() => setFountainSuccessMessage(null)} className="text-slate-400 hover:text-white font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* APEX WORLD RAID PORTAL BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-950 via-amber-950/40 to-rose-950/60 p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-3xl shadow-inner">
            <Flame className="h-6 w-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-bold text-amber-200">
                APEX WORLD RAID ARENA & CELESTIAL RIFT
              </h3>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                15-Min Instance Limit
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold font-mono ${
                eventStatus.isActive
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}>
                {eventStatus.isActive ? `🔥 Event Active (${eventStatus.timerFormatted})` : `🔒 Spawns in ${eventStatus.timerFormatted}`}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Raid events initiate every 6h UTC (1-hour window). Battle the Primordial Solar Dragon & Shadow Sovereign!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-slate-950 px-3 py-1.5 text-xs text-amber-300 font-mono">
            <Target className="h-4 w-4 text-amber-400" />
            <span>Attempts: <strong>{getRemainingDailyRaidAttempts(character, 3)}/3</strong></span>
          </div>

          <button
            onClick={() => onNavigateView('party')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all cursor-pointer"
          >
            <Users className="h-4 w-4 text-amber-400" />
            Party Squad Hub
          </button>

          {(() => {
            const remaining = getRemainingDailyRaidAttempts(character, 3);
            const isLocked = remaining <= 0 || !eventStatus.isActive;

            return (
              <button
                onClick={() => onNavigateView('raid')}
                disabled={isLocked}
                className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-all ${
                  isLocked
                    ? 'border-slate-800 bg-slate-900 text-slate-500 opacity-60 cursor-not-allowed'
                    : 'border-amber-400/60 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95'
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="h-4 w-4 text-rose-400" />
                    {!eventStatus.isActive ? `RESPAWNS IN ${eventStatus.timerFormatted}` : '0/3 ATTEMPTS LEFT'}
                  </>
                ) : (
                  <>
                    <Swords className="h-4 w-4" />
                    ENTER RAID LOBBY
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Town District Navigation Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pr-2 whitespace-nowrap flex items-center gap-1">
            <Building className="h-3.5 w-3.5 text-amber-400" /> Town Districts:
          </span>
          {town.districts.map((district) => {
            const isActive = district.id === activeDistrictId;
            return (
              <button
                key={district.id}
                onClick={() => setActiveDistrictId(district.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-amber-200'
                }`}
              >
                <span>{district.icon}</span>
                <span>{district.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active District Layout & NPC Roster */}
        <div className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${activeDistrict.bgGradient} p-5 shadow-xl space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl">{activeDistrict.icon}</span>
              <div>
                <h3 className="font-serif text-base font-bold text-amber-200">{activeDistrict.name}</h3>
                <p className="text-xs text-slate-300">{activeDistrict.description}</p>
              </div>
            </div>

            <span className="text-xs font-bold text-amber-400 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
              {activeDistrict.npcs.length} District Citizens
            </span>
          </div>

          {/* NPC Roster Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeDistrict.npcs.map((npc) => (
              <div
                key={npc.id}
                onClick={() => setSelectedNpc(npc)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4 transition-all hover:border-amber-500/50 hover:scale-[1.02] cursor-pointer shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl">{npc.avatar}</span>
                    <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-slate-800">
                      Talk & Action
                    </span>
                  </div>

                  <div>
                    <h4 className={`font-bold text-sm ${npc.colorTheme.split(' ')[0]}`}>{npc.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{npc.title}</p>
                  </div>

                  <p className="text-[11px] italic text-slate-300 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                    "{npc.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/60 mt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-400 group-hover:underline flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Interact
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Town Facilities & Infrastructure Level Summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-serif text-sm font-bold text-amber-200 flex items-center gap-2">
            <Building className="h-4 w-4 text-amber-400" /> Town Infrastructure & Perks
          </h3>
          <span className="text-xs text-slate-400 font-mono">Town Level {town.townLevel}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {town.facilities.map((fac) => (
            <div
              key={fac.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-200 flex items-center gap-1.5">
                  <span>{fac.icon}</span> {fac.name}
                </span>
                <span className="rounded bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Lv {fac.level}/{fac.maxLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{fac.effectDescription}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Modals */}
      {selectedNpc && (
        <NpcDialogueModal
          npc={selectedNpc}
          onClose={() => setSelectedNpc(null)}
          onSelectOption={handleNpcOptionSelect}
        />
      )}

      {isNoticeBoardOpen && (
        <TownNoticeBoardModal
          town={town}
          character={character}
          onClose={() => setIsNoticeBoardOpen(false)}
          onUpdateCharacter={(char) => onUpdateCharacter?.(char)}
        />
      )}

      {isMerchantShopOpen && (
        <TownMerchantShopModal
          character={character}
          onClose={() => setIsMerchantShopOpen(false)}
          onUpdateCharacter={(char) => onUpdateCharacter?.(char)}
        />
      )}
    </div>
  );
};
