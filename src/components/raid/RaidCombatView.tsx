import React, { useState, useEffect, useRef } from 'react';
import { Character, Item, Skill } from '../../types/game';
import { Party } from '../../types/party';
import { RaidBoss, RaidCombatState, MinionSummon, RaidSquadParticipant, RaidLootResult } from '../../types/raid';
import {
  RAID_BOSSES,
  getRemainingDailyRaidAttempts,
  formatTimeSeconds,
} from '../../data/raidBosses';
import { audio } from '../../utils/audio';
import skillsData from '../../data/skills.json';
import {
  Sword,
  Shield,
  Zap,
  Sparkles,
  Flame,
  Heart,
  Skull,
  FlaskConical,
  Droplet,
  Crown,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Trophy,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Target,
  Clock,
  UserPlus,
  Hourglass,
  Coins,
} from 'lucide-react';

interface RaidCombatViewProps {
  character: Character;
  party?: Party | null;
  bossId?: string;
  onRaidEnd: (result: {
    victory: boolean;
    expGained: number;
    goldGained: number;
    droppedItems: Item[];
    remainingHp: number;
    remainingMana: number;
    redirectToCity?: boolean;
  }) => void;
  onUpdateCharacter?: (updatedChar: Character) => void;
  onCombatStatusChange?: (inProgress: boolean) => void;
}

export const RaidCombatView: React.FC<RaidCombatViewProps> = ({
  character,
  party,
  bossId = 'boss_solar_dragon',
  onRaidEnd,
  onUpdateCharacter,
  onCombatStatusChange,
}) => {
  // Load selected modular raid boss template
  const initialBoss = RAID_BOSSES.find((b) => b.id === bossId) || RAID_BOSSES[0];

  // Primary State
  const [boss, setBoss] = useState<RaidBoss>(initialBoss);
  const [currentBossHp, setCurrentBossHp] = useState<number>(initialBoss.baseHp);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [bossShield, setBossShield] = useState<number>(0);
  const [activeMinions, setActiveMinions] = useState<MinionSummon[]>(
    initialBoss.phases[0].summonsOnEnter ? [...initialBoss.phases[0].summonsOnEnter!] : []
  );

  // Turn and Timer Engine
  const [turn, setTurn] = useState<number>(1);
  const [enrageTurnsLeft, setEnrageTurnsLeft] = useState<number>(initialBoss.enrageTurnLimit);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(
    initialBoss.raidDurationSeconds || 900
  );
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [playerSummonCooldown, setPlayerSummonCooldown] = useState<number>(0);
  const [bossSummonCooldown, setBossSummonCooldown] = useState<number>(0);
  const [currentGold, setCurrentGold] = useState<number>(character.gold);
  const [vanguardSummonCount, setVanguardSummonCount] = useState<number>(0);
  const VANGUARD_SUMMON_GOLD_COST = 250;

  const [isAutoBattle, setIsAutoBattle] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('boss'); // 'boss' or minion.id

  // Player & Squad State
  const [playerHp, setPlayerHp] = useState<number>(character.stats.hp);
  const [playerMana, setPlayerMana] = useState<number>(character.stats.mana);
  const [playerWard, setPlayerWard] = useState<number>(character.stats.ward || 0);

  // Squad Allies (Party members or Mercenary Knights if solo)
  const [squad, setSquad] = useState<RaidSquadParticipant[]>(() => {
    const list: RaidSquadParticipant[] = [
      {
        id: character.id,
        name: character.name,
        isPlayer: true,
        level: character.level,
        classRole: 'Primary Hero',
        hp: character.stats.hp,
        maxHp: character.stats.maxHp,
        mana: character.stats.mana,
        maxMana: character.stats.maxMana,
        ward: character.stats.ward || 0,
        maxWard: character.stats.maxWard || 100,
        spd: character.stats.spd,
        str: character.stats.str,
        def: character.stats.def,
        int: character.stats.int,
        statusEffects: [],
        icon: '⚔️',
        damageDealt: 0,
      },
    ];

    // Add Familiar pet if active
    if (character.familiar) {
      list.push({
        id: character.familiar.id,
        name: character.familiar.name,
        isPlayer: false,
        isFamiliar: true,
        level: character.familiar.level,
        classRole: 'Celestial Familiar',
        hp: character.familiar.hp,
        maxHp: character.familiar.maxHp,
        mana: character.familiar.mana,
        maxMana: character.familiar.maxMana,
        ward: 50,
        maxWard: 50,
        spd: character.familiar.spd || 25,
        str: character.familiar.str,
        def: character.familiar.def,
        int: character.familiar.int,
        statusEffects: [],
        icon: '🐉',
        damageDealt: 0,
      });
    }

    // Add Party Allies or Mercenary Guards
    if (party && party.members.length > 1) {
      party.members.forEach((m) => {
        if (m.id !== character.id) {
          list.push({
            id: m.id,
            name: m.name,
            isPlayer: false,
            isPartyMember: true,
            level: m.level,
            classRole: m.classRole,
            hp: m.hp,
            maxHp: m.maxHp,
            mana: m.mana,
            maxMana: m.maxMana,
            ward: 100,
            maxWard: 100,
            spd: 26,
            str: 120,
            def: 80,
            int: 100,
            statusEffects: [],
            icon: m.icon || '🛡️',
            damageDealt: 0,
          });
        }
      });
    } else {
      // Add Mercenary Vanguard Guard for solo raids
      list.push({
        id: 'squad_merc_1',
        name: 'Mercenary Sentinel Guard',
        isPlayer: false,
        isPartyMember: true,
        level: character.level,
        classRole: 'Sentinel',
        hp: Math.round(character.stats.maxHp * 1.2),
        maxHp: Math.round(character.stats.maxHp * 1.2),
        mana: 300,
        maxMana: 300,
        ward: 150,
        maxWard: 150,
        spd: 22,
        str: character.stats.str,
        def: Math.round(character.stats.def * 1.3),
        int: 20,
        statusEffects: [],
        icon: '🛡️',
        damageDealt: 0,
      });
    }

    return list;
  });

  // Combat Log & Phase Alert Banner
  const [logs, setLogs] = useState<Array<{ id: string; text: string; type: string }>>([
    {
      id: 'log_init',
      text: `⚔️ RAID ENTERED! Facing [${boss.name}] in ${boss.title}!`,
      type: 'phase',
    },
  ]);
  const [phaseAlert, setPhaseAlert] = useState<string | null>(
    `PHASE 1: ${boss.phases[0].name} — ${boss.phases[0].description}`
  );
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isDefeat, setIsDefeat] = useState<boolean>(false);
  const [lootResult, setLootResult] = useState<RaidLootResult | null>(null);

  const isRaidCombatActive = currentBossHp > 0 && playerHp > 0 && !isVictory && !isDefeat && !isExpired;

  useEffect(() => {
    if (onCombatStatusChange) {
      onCombatStatusChange(isRaidCombatActive);
    }
  }, [isRaidCombatActive, onCombatStatusChange]);

  useEffect(() => {
    return () => {
      if (onCombatStatusChange) {
        onCombatStatusChange(false);
      }
    };
  }, [onCombatStatusChange]);

  // Auto Battle Loop Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoBattle && !isVictory && !isDefeat && !isExpired) {
      timer = setTimeout(() => {
        handleExecuteTurn('attack');
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isAutoBattle, turn, isVictory, isDefeat, isExpired]);

  // Raid Instance Expiry Countdown Timer
  useEffect(() => {
    if (isVictory || isDefeat || isExpired) return;
    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          addLog(`⏳ RAID INSTANCE EXPIRED! [${boss.name}] folded space and vanished into the void!`, 'warning');
          audio.playVictory();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isVictory, isDefeat, isExpired, boss.name]);

  // Synchronize Player HP/Mana/Ward with Squad[0]
  useEffect(() => {
    setSquad((prev) =>
      prev.map((unit) =>
        unit.isPlayer
          ? { ...unit, hp: playerHp, mana: playerMana, ward: playerWard }
          : unit
      )
    );
  }, [playerHp, playerMana, playerWard]);

  const addLog = (text: string, type: string = 'info') => {
    setLogs((prev) => [
      {
        id: `log_${Date.now()}_${Math.random()}`,
        text,
        type,
      },
      ...prev.slice(0, 49),
    ]);
  };

  // Turn Execution Engine
  const handleExecuteTurn = (actionType: 'attack' | 'skill' | 'heal' | 'defend' | 'summon', skillId?: string) => {
    if (isVictory || isDefeat || isExpired) return;

    audio.playClick();

    // Determine target
    const currentPhase = boss.phases[currentPhaseIndex];
    let nextBossHp = currentBossHp;
    let nextShield = bossShield;
    let updatedMinions = [...activeMinions];
    let playerDmgThisTurn = 0;

    // Check if frontline minion taunts
    const tauntMinion = updatedMinions.find((m) => m.tauntFrontline && m.hp > 0);
    const actualTarget = tauntMinion && selectedTargetId === 'boss' ? tauntMinion.id : selectedTargetId;

    if (tauntMinion && selectedTargetId === 'boss') {
      addLog(`🛡️ Frontline Minion [${tauntMinion.name}] taunts and intercepts your strike!`, 'warning');
    }

    // 1. Player Action Phase
    if (actionType === 'attack') {
      const baseDmg = Math.round(character.stats.str * (1.2 + Math.random() * 0.4));
      playerDmgThisTurn = baseDmg;

      if (actualTarget === 'boss') {
        if (nextShield > 0) {
          const absorbed = Math.min(nextShield, baseDmg);
          nextShield -= absorbed;
          const overflow = baseDmg - absorbed;
          nextBossHp = Math.max(0, nextBossHp - overflow);
          setBossShield(nextShield);
          addLog(`⚔️ You struck [${boss.name}] for ${baseDmg} damage (${absorbed} absorbed by barrier)!`, 'player');
        } else {
          nextBossHp = Math.max(0, nextBossHp - baseDmg);
          addLog(`⚔️ You struck [${boss.name}] for ${baseDmg} Physical damage!`, 'player');
        }
      } else {
        // Strike minion
        updatedMinions = updatedMinions
          .map((m) => {
            if (m.id === actualTarget) {
              const remaining = Math.max(0, m.hp - baseDmg);
              if (remaining === 0) {
                addLog(`☠️ Minion [${m.name}] slain!`, 'player');
              } else {
                addLog(`⚔️ You struck Minion [${m.name}] for ${baseDmg} damage!`, 'player');
              }
              return { ...m, hp: remaining };
            }
            return m;
          })
          .filter((m) => m.hp > 0);
      }
    } else if (actionType === 'heal') {
      const healAmt = Math.round(character.stats.maxHp * 0.4);
      setPlayerHp((prev) => Math.min(character.stats.maxHp, prev + healAmt));
      addLog(`🧪 You consumed a Health Vial restoring ${healAmt} HP!`, 'heal');
    } else if (actionType === 'defend') {
      setPlayerWard((prev) => Math.min(character.stats.maxWard || 200, prev + 150));
      addLog(`🛡️ You braced in Defense Matrix (+150 Shield Barrier)!`, 'player');
    } else if (actionType === 'summon') {
      if (vanguardSummonCount >= 1) {
        addLog(`⚠️ Celestial Vanguard already summoned! (Max 1 per raid battle)`, 'warning');
        return;
      }
      if (currentGold < VANGUARD_SUMMON_GOLD_COST) {
        addLog(`⚠️ Insufficient Gold! Summoning Celestial Vanguard requires ${VANGUARD_SUMMON_GOLD_COST} Gold (You have ${currentGold} Gold).`, 'warning');
        return;
      }

      // Deduct gold
      const nextGold = currentGold - VANGUARD_SUMMON_GOLD_COST;
      setCurrentGold(nextGold);
      if (onUpdateCharacter) {
        onUpdateCharacter({ ...character, gold: nextGold });
      }

      // Record max 1 summon
      setVanguardSummonCount(1);

      const newAlly: RaidSquadParticipant = {
        id: `summoned_vanguard_${Date.now()}`,
        name: `Celestial Vanguard Tank`,
        isPlayer: false,
        isPartyMember: true,
        level: character.level,
        classRole: 'Celestial Tank',
        hp: Math.round(character.stats.maxHp * 1.5),
        maxHp: Math.round(character.stats.maxHp * 1.5),
        mana: 200,
        maxMana: 200,
        ward: 100,
        maxWard: 100,
        spd: 24,
        str: Math.round(character.stats.str * 1.1),
        def: Math.round(character.stats.def * 1.4),
        int: 30,
        statusEffects: [],
        icon: '🛡️',
        damageDealt: 0,
      };
      setSquad((prev) => [...prev, newAlly]);
      addLog(`🔮 SUMMON: Expended ${VANGUARD_SUMMON_GOLD_COST} Gold to invoke Celestial Vanguard Tank! (Max 1 per battle)`, 'summon');
    }

    // 2. Squad Ally Attacks
    let squadTotalDmgTurn = playerDmgThisTurn;
    squad.forEach((ally) => {
      if (!ally.isPlayer && ally.hp > 0) {
        const allyDmg = Math.round(ally.str * (0.8 + Math.random() * 0.4));
        squadTotalDmgTurn += allyDmg;
        ally.damageDealt += allyDmg;

        if (nextBossHp > 0) {
          nextBossHp = Math.max(0, nextBossHp - allyDmg);
          addLog(`✨ Ally [${ally.name}] struck [${boss.name}] for ${allyDmg} damage!`, 'player');
        }
      }
    });

    setCurrentBossHp(nextBossHp);
    setActiveMinions(updatedMinions);

    // 3. Check Phase Transitions & Victory State
    if (nextBossHp <= 0) {
      handleRaidVictory(squadTotalDmgTurn);
      return;
    }

    const bossHpPercent = (nextBossHp / boss.baseHp) * 100;
    const nextPhase = boss.phases.find((p, idx) => idx > currentPhaseIndex && bossHpPercent <= p.triggerHpPercent);

    if (nextPhase) {
      const nextIdx = boss.phases.indexOf(nextPhase);
      setCurrentPhaseIndex(nextIdx);

      if (nextPhase.summonsOnEnter) {
        setActiveMinions((prev) => [...prev, ...nextPhase.summonsOnEnter!]);
      }

      setPhaseAlert(`🚨 RAID PHASE ${nextPhase.phaseNumber}: ${nextPhase.name}! ${nextPhase.description}`);
      addLog(`🚨 BOSS TRANSITIONED TO PHASE ${nextPhase.phaseNumber}: [${nextPhase.name}]!`, 'phase');
      audio.playVictory();
    }

    // Decrement player and boss summon cooldowns
    setPlayerSummonCooldown((prev) => Math.max(0, prev - 1));
    setBossSummonCooldown((prev) => Math.max(0, prev - 1));

    // 4. Boss Turn & Minion Counter-Attack Phase
    setTimeout(() => {
      let bossDmg = Math.round(boss.str * (0.9 + Math.random() * 0.3));
      if (currentPhase.flatDamageBoostPercent) {
        bossDmg = Math.round(bossDmg * (1 + currentPhase.flatDamageBoostPercent / 100));
      }

      // Filter available abilities considering boss summon cooldown
      let validAbilities = currentPhase.abilities;
      if (bossSummonCooldown > 0) {
        const nonSummons = currentPhase.abilities.filter((a) => a.type !== 'summon');
        if (nonSummons.length > 0) {
          validAbilities = nonSummons;
        }
      }

      // Boss casts chosen ability
      const chosenAbility = validAbilities[Math.floor(Math.random() * validAbilities.length)];

      if (chosenAbility) {
        if (chosenAbility.type === 'shield' && chosenAbility.shieldAmount) {
          setBossShield((prev) => prev + chosenAbility.shieldAmount!);
          addLog(`☀️ [${boss.name}] cast [${chosenAbility.name}] (+${chosenAbility.shieldAmount} Barrier)!`, 'boss');
        } else if (chosenAbility.type === 'summon' && chosenAbility.minionTemplate) {
          const newMinion: MinionSummon = {
            ...chosenAbility.minionTemplate,
            id: `minion_${Date.now()}`,
          };
          setActiveMinions((prev) => [...prev, newMinion]);
          setBossSummonCooldown(boss.summonCooldownTurns || 3);
          addLog(`🐉 [${boss.name}] summoned [${newMinion.name}]! (Summon Cooldown: ${boss.summonCooldownTurns || 3} Turns)`, 'summon');
        } else {
          // Boss strikes Player or Squad
          setPlayerHp((prev) => {
            const rem = Math.max(0, prev - bossDmg);
            if (rem === 0) handleRaidDefeat();
            return rem;
          });
          addLog(`🔥 [${boss.name}] cast [${chosenAbility.name}] dealing ${bossDmg} damage to your squad!`, 'boss');
        }
      }

      // 5. Enrage Counter update
      setEnrageTurnsLeft((prev) => {
        const nextTurns = prev - 1;
        if (nextTurns === 0) {
          addLog(`☠️ BOSS HAS ENRAGED! ENRAGE WIPEOUT DISCHARGED!`, 'warning');
          handleRaidDefeat();
        }
        return nextTurns;
      });

      setTurn((t) => t + 1);
    }, 400);
  };

  const handleRaidVictory = (finalDmg: number) => {
    setIsVictory(true);
    audio.playVictory();

    const totalDmgDealt = character.stats.str * turn * 2 + finalDmg;
    const expGained = 4500 * boss.tier;
    const goldGained = 1800 * boss.tier;

    const droppedItems: Item[] = boss.lootTable
      .filter((l) => Math.random() <= l.dropRate)
      .map((l) => ({
        id: `raid_loot_${l.itemId}_${Date.now()}`,
        name: l.name,
        description: `Mythic item dropped by Raid Boss ${boss.name}.`,
        type: 'weapon',
        rarity: l.rarity,
        levelReq: boss.recommendedLevel,
        enchantLevel: 0,
        valueGold: 2500,
        icon: l.icon,
      }));

    const result: RaidLootResult = {
      rankGrade: totalDmgDealt > 10000 ? 'S' : 'A',
      totalDamage: totalDmgDealt,
      damageContributionPercent: 100,
      expGained,
      goldGained,
      tokensGained: 50 * boss.tier,
      guildRepGained: 150 * boss.tier,
      droppedItems,
    };

    setLootResult(result);
  };

  const handleRaidDefeat = () => {
    setIsDefeat(true);
    addLog(`💀 Squad defeated by ${boss.name}!`, 'warning');
  };

  const handleClaimVictory = (redirectToCity: boolean = false) => {
    audio.playClick();
    if (lootResult && onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        exp: character.exp + lootResult.expGained,
        gold: currentGold + lootResult.goldGained,
      });
    }

    onRaidEnd({
      victory: isVictory,
      expGained: lootResult?.expGained || 0,
      goldGained: lootResult?.goldGained || 0,
      droppedItems: lootResult?.droppedItems || [],
      remainingHp: playerHp,
      remainingMana: playerMana,
      redirectToCity,
    });
  };

  const currentPhase = boss.phases[currentPhaseIndex];
  const bossHpPct = Math.round((currentBossHp / boss.baseHp) * 100);

  return (
    <div className="relative w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl space-y-4 text-slate-100">
      {/* Raid Top Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-3xl">
            {boss.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-amber-200">
                {boss.name}
              </h2>
              <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-[10px] font-bold text-red-300 uppercase">
                Tier {boss.tier} World Boss
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {boss.title} • Rec. Level {boss.recommendedLevel}+
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-200">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="font-mono">{currentGold} Gold</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-slate-900 px-3 py-1.5 text-xs">
            <Target className="h-4 w-4 text-amber-400" />
            <span className="text-slate-400">Daily Fights:</span>
            <span className="font-mono font-bold text-amber-300">
              {getRemainingDailyRaidAttempts(character, 3)}/3 Left
            </span>
          </div>

          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
              timeRemainingSeconds < 120
                ? 'border-red-500/50 bg-red-500/20 text-red-300 animate-pulse'
                : 'border-slate-800 bg-slate-900 text-slate-300'
            }`}
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-slate-400">Raid Expiry:</span>
            <span className="font-mono font-bold text-amber-300">
              {formatTimeSeconds(timeRemainingSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-slate-900 px-3 py-1.5 text-xs">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span className="text-slate-400">Enrage:</span>
            <span className="font-mono font-bold text-amber-300">{enrageTurnsLeft} T</span>
          </div>

          <button
            onClick={() => setIsAutoBattle(!isAutoBattle)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              isAutoBattle
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            }`}
          >
            {isAutoBattle ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAutoBattle ? 'Auto: ON' : 'Auto: OFF'}
          </button>
        </div>
      </div>

      {/* Phase Alert Notification */}
      {phaseAlert && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-semibold">{phaseAlert}</span>
          </div>
          <button
            onClick={() => setPhaseAlert(null)}
            className="text-slate-400 hover:text-slate-200 cursor-pointer text-[10px] font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* COMBAT MATRIX GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT & CENTER: MODULAR BATTLEFIELD GRIDS (HOSTILE & FRIENDLY 5x2 GRIDS) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 1. HOSTILE RAID FORMATION GRID (5x2 MATRIX = 10 SLOTS) */}
          <div className="rounded-2xl border border-rose-500/30 bg-slate-900/90 p-3.5 sm:p-5 space-y-3 relative overflow-hidden">
            {/* Background Atmosphere Glow */}
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <Skull className="h-5 w-5 text-rose-400" />
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Hostile Raid Formation (5x2 Matrix Grid)
                </h3>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                <Target className="h-3.5 w-3.5 text-amber-400" />
                <span>
                  Target: <strong className="text-amber-300 font-bold font-mono">
                    {selectedTargetId === 'boss'
                      ? boss.name
                      : activeMinions.find((m) => m.id === selectedTargetId)?.name || boss.name}
                  </strong>
                </span>
              </div>
            </div>

            {/* 5x2 Hostile Grid Slots */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {Array.from({ length: 10 }).map((_, slotIdx) => {
                const isFrontline = slotIdx < 5;
                const slotLabel = isFrontline ? 'FRONT' : 'REAR';

                // Slot #3 (Index 2 in Frontline) is the Apex Boss
                const isBossSlot = slotIdx === 2;

                if (isBossSlot) {
                  const isBossSelected = selectedTargetId === 'boss';

                  return (
                    <div
                      key={`hostile_slot_boss`}
                      onClick={() => {
                        setSelectedTargetId('boss');
                        audio.playClick();
                      }}
                      className={`relative min-h-[90px] sm:min-h-[110px] rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between text-xs cursor-pointer transition-all ${
                        isBossSelected
                          ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                          : 'border-rose-500/40 bg-slate-950/90 hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-rose-400 font-bold">
                        <span>#3 BOSS</span>
                        <span className="bg-rose-500/20 text-rose-300 px-1 rounded">APEX</span>
                      </div>

                      <div className="space-y-1 text-center my-auto">
                        <div className="relative inline-block text-2xl sm:text-3xl leading-none">
                          {boss.icon}
                          {bossShield > 0 && (
                            <span className="absolute -top-1 -right-1 text-[10px]" title="Shield Barrier Active">
                              🛡️
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-amber-200 text-[9px] sm:text-[11px] truncate max-w-full">
                          {boss.name}
                        </div>
                        <div className="text-[8px] sm:text-[9px] text-amber-400 font-mono">
                          P{currentPhase.phaseNumber}: {currentPhase.name}
                        </div>

                        {/* Boss HP & Shield Bar */}
                        <div className="h-1.5 sm:h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-rose-950 relative">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-300"
                            style={{ width: `${bossHpPct}%` }}
                          />
                          {bossShield > 0 && (
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-cyan-400/70 transition-all duration-300"
                              style={{ width: `${Math.min(100, (bossShield / boss.baseHp) * 100)}%` }}
                            />
                          )}
                        </div>
                      </div>

                      {isBossSelected && (
                        <div className="text-[8px] text-center font-extrabold text-amber-300 uppercase tracking-tighter bg-amber-500/20 rounded py-0.5">
                          🎯 TARGETED
                        </div>
                      )}
                    </div>
                  );
                }

                // Minion Mapping logic for non-boss slots
                // Calculate minion index skipping index 2 (reserved for boss)
                const minionIndex = slotIdx > 2 ? slotIdx - 1 : slotIdx;
                const minion = activeMinions[minionIndex];

                if (minion) {
                  const minionHpPct = Math.round((minion.hp / minion.maxHp) * 100);
                  const isMinionSelected = selectedTargetId === minion.id;

                  return (
                    <div
                      key={`hostile_slot_${minion.id}`}
                      onClick={() => {
                        setSelectedTargetId(minion.id);
                        audio.playClick();
                      }}
                      className={`relative min-h-[90px] sm:min-h-[110px] rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between text-xs cursor-pointer transition-all ${
                        isMinionSelected
                          ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/50 shadow-lg'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-500">
                        <span>#{slotIdx + 1}</span>
                        {minion.tauntFrontline ? (
                          <span className="bg-red-500/20 text-red-400 font-bold px-1 rounded">TAUNT</span>
                        ) : (
                          <span>{slotLabel}</span>
                        )}
                      </div>

                      <div className="space-y-1 text-center my-auto">
                        <div className="text-xl sm:text-2xl leading-none">{minion.icon}</div>
                        <div className="font-bold text-slate-200 text-[8px] sm:text-[10px] truncate max-w-full">
                          {minion.name}
                        </div>
                        <div className="text-[8px] text-slate-400 font-mono">
                          {minion.hp} / {minion.maxHp} HP
                        </div>

                        {/* Minion HP Bar */}
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-rose-950">
                          <div
                            className="h-full bg-rose-500 transition-all duration-300"
                            style={{ width: `${minionHpPct}%` }}
                          />
                        </div>
                      </div>

                      {isMinionSelected ? (
                        <div className="text-[8px] text-center font-extrabold text-amber-300 uppercase tracking-tighter bg-amber-500/20 rounded py-0.5">
                          🎯 TARGETED
                        </div>
                      ) : (
                        <div className="text-[8px] text-center text-slate-600 font-mono">
                          ADD MINION
                        </div>
                      )}
                    </div>
                  );
                }

                // Empty Hostile Slot
                return (
                  <div
                    key={`hostile_slot_empty_${slotIdx}`}
                    className="min-h-[90px] sm:min-h-[110px] rounded-xl border border-dashed border-slate-800/60 bg-slate-950/20 p-2 flex flex-col justify-between text-xs text-slate-700"
                  >
                    <div className="flex justify-between text-[8px] font-mono opacity-60">
                      <span>#{slotIdx + 1}</span>
                      <span>{slotLabel}</span>
                    </div>
                    <div className="my-auto text-center text-[8px] sm:text-[9px] font-mono italic">
                      Empty Zone
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* 2. FRIENDLY SQUAD & VANGUARD FORMATION GRID (5x2 MATRIX = 10 SLOTS) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-3.5 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Friendly Squad & Vanguard Formation (5x2 Matrix Grid)
                </h3>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                Units: <strong>{squad.length}/10 Active</strong>
              </span>
            </div>

            {/* 5x2 Friendly Grid Slots */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {Array.from({ length: 10 }).map((_, slotIdx) => {
                const isFrontline = slotIdx < 5;
                const slotLabel = isFrontline ? 'FRONT' : 'REAR';
                const ally = squad[slotIdx];

                if (ally) {
                  const hpPct = Math.round((ally.hp / ally.maxHp) * 100);

                  return (
                    <div
                      key={`friendly_slot_${ally.id}`}
                      className={`min-h-[90px] sm:min-h-[110px] rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between text-xs transition-all ${
                        ally.isPlayer
                          ? 'border-amber-500/60 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30'
                          : 'border-emerald-500/40 bg-slate-950/90 text-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono">
                        <span className="text-slate-500">#{slotIdx + 1}</span>
                        <span className={ally.isPlayer ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {ally.isPlayer ? 'HERO' : slotLabel}
                        </span>
                      </div>

                      <div className="space-y-1 text-center my-auto">
                        <div className="text-xl sm:text-2xl leading-none">{ally.icon}</div>
                        <div className="font-bold text-amber-200 text-[8px] sm:text-[10px] truncate max-w-full">
                          {ally.name}
                        </div>
                        <div className="text-[8px] text-emerald-400/90 truncate font-mono">
                          {ally.classRole}
                        </div>

                        {/* Ally HP Bar */}
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-emerald-950">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 border-t border-slate-800/80 pt-0.5">
                        <span>HP {ally.hp}</span>
                        <span className="text-amber-300 font-bold">DPS {ally.damageDealt}</span>
                      </div>
                    </div>
                  );
                }

                // Empty Friendly Slot
                return (
                  <div
                    key={`friendly_slot_empty_${slotIdx}`}
                    className="min-h-[90px] sm:min-h-[110px] rounded-xl border border-dashed border-slate-800/60 bg-slate-950/20 p-2 flex flex-col justify-between text-xs text-slate-700"
                  >
                    <div className="flex justify-between text-[8px] font-mono opacity-60">
                      <span>#{slotIdx + 1}</span>
                      <span>{slotLabel}</span>
                    </div>
                    <div className="my-auto text-center text-[8px] sm:text-[9px] font-mono italic">
                      Empty Slot
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT: TACTICAL CONTROLS & COMBAT LOG */}
        <div className="lg:col-span-4 space-y-4">
          {/* Action Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Raid Tactical Commands
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                vanguardSummonCount >= 1
                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
              }`}>
                <Coins className="h-3 w-3 text-amber-400" />
                Vanguard: {vanguardSummonCount}/1 (250g)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExecuteTurn('attack')}
                disabled={isVictory || isDefeat || isExpired}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/20 to-amber-600/10 p-3 text-xs font-bold text-amber-200 hover:border-amber-400 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <Sword className="h-5 w-5 text-amber-400" />
                Heavy Strike
              </button>

              <button
                onClick={() => handleExecuteTurn('heal')}
                disabled={isVictory || isDefeat || isExpired}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 p-3 text-xs font-bold text-emerald-200 hover:border-emerald-400 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <FlaskConical className="h-5 w-5 text-emerald-400" />
                Consume Vial
              </button>

              <button
                onClick={() => handleExecuteTurn('defend')}
                disabled={isVictory || isDefeat || isExpired}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-cyan-500/40 bg-gradient-to-b from-cyan-500/20 to-cyan-600/10 p-3 text-xs font-bold text-cyan-200 hover:border-cyan-400 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <Shield className="h-5 w-5 text-cyan-400" />
                Guard Matrix
              </button>

              <button
                onClick={() => handleExecuteTurn('summon')}
                disabled={isVictory || isDefeat || isExpired || vanguardSummonCount >= 1 || currentGold < VANGUARD_SUMMON_GOLD_COST}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer ${
                  vanguardSummonCount >= 1
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 opacity-90 cursor-not-allowed'
                    : currentGold < VANGUARD_SUMMON_GOLD_COST
                    ? 'border-slate-800 bg-slate-950 text-slate-500 opacity-60 cursor-not-allowed'
                    : 'border-purple-500/40 bg-gradient-to-b from-purple-500/20 to-purple-600/10 text-purple-200 hover:border-purple-400 active:scale-95'
                }`}
              >
                <UserPlus className={`h-5 w-5 ${vanguardSummonCount >= 1 ? 'text-emerald-400' : 'text-purple-400'}`} />
                <span>
                  {vanguardSummonCount >= 1 ? 'Vanguard Active' : 'Summon Vanguard'}
                </span>
                <span className="text-[9px] font-mono font-normal text-amber-300">
                  {vanguardSummonCount >= 1 ? '1/1 Max (Used)' : `Cost: ${VANGUARD_SUMMON_GOLD_COST} Gold`}
                </span>
              </button>
            </div>
          </div>

          {/* COMBAT LOG */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2 flex flex-col h-64">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Raid Combat Ticker
            </h4>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`rounded-lg px-2.5 py-1.5 leading-snug ${
                    log.type === 'boss'
                      ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                      : log.type === 'phase'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold'
                      : log.type === 'summon'
                      ? 'bg-purple-500/10 text-purple-300'
                      : log.type === 'heal'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'bg-slate-950 text-slate-300'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VICTORY MODAL OVERLAY */}
      {isVictory && lootResult && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-amber-400/50 bg-slate-900 p-6 space-y-5 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400 text-4xl">
              🏆
            </div>

            <div className="space-y-1">
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                RANK {lootResult.rankGrade} VICTORY
              </span>
              <h3 className="font-serif text-2xl font-bold text-amber-200">
                RAID BOSS CONQUERED!
              </h3>
              <p className="text-xs text-slate-400">
                [${boss.name}] was vanquished! Outstanding squad performance!
              </p>
            </div>

            {/* Loot Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="rounded-lg bg-slate-900 p-2 text-slate-300">
                  <p className="text-[10px] text-slate-500">EXP Gained</p>
                  <p className="font-bold text-emerald-400">+{lootResult.expGained} EXP</p>
                </div>
                <div className="rounded-lg bg-slate-900 p-2 text-slate-300">
                  <p className="text-[10px] text-slate-500">Gold Reward</p>
                  <p className="font-bold text-amber-300">+{lootResult.goldGained} Gold</p>
                </div>
              </div>

              {lootResult.droppedItems.length > 0 && (
                <div className="space-y-1.5 text-left pt-1">
                  <p className="text-[10px] font-bold uppercase text-amber-400">Mythic Raid Drops</p>
                  <div className="space-y-1">
                    {lootResult.droppedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs"
                      >
                        <span className="font-bold text-amber-200">
                          {item.icon} {item.name}
                        </span>
                        <span className="uppercase text-[9px] font-bold text-amber-400">
                          {item.rarity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => handleClaimVictory(true)}
                className="w-full rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
              >
                Claim Raid Rewards & Return to City
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEFEAT MODAL OVERLAY */}
      {isDefeat && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-slate-900 p-6 space-y-4 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/40 text-4xl">
              💀
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-red-400">
                RAID SQUAD DEFEATED
              </h3>
              <p className="text-xs text-slate-400">
                The Primordial Boss overwhelmed your squad defenses. Regroup your party and try again!
              </p>
            </div>

            <button
              onClick={() => onRaidEnd({ victory: false, expGained: 0, goldGained: 0, droppedItems: [], remainingHp: 1, remainingMana: 1, redirectToCity: true })}
              className="w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-slate-100 hover:bg-red-500 transition cursor-pointer"
            >
              Return to City Sanctuary
            </button>
          </div>
        </div>
      )}

      {/* RAID EXPIRY MODAL OVERLAY */}
      {isExpired && !isVictory && !isDefeat && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-900 p-6 space-y-5 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-3xl">
              <Clock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-300 uppercase">
                Instance Time Expired (0:00)
              </span>
              <h3 className="font-serif text-xl font-bold text-amber-200">
                RAID INSTANCE EXPIRED
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                [{boss.name}] folded dimensional space and fled into the celestial rift before your squad could finish the encounter!
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-slate-950 p-3 text-xs text-amber-300 flex items-center justify-center gap-2 font-semibold">
              <Target className="h-4 w-4 text-amber-400" />
              <span>Daily Fight Attempts: {getRemainingDailyRaidAttempts(character, 3)}/3 Left</span>
            </div>

            <button
              onClick={() => onRaidEnd({ victory: false, expGained: 200, goldGained: 100, droppedItems: [], remainingHp: playerHp, remainingMana: playerMana, redirectToCity: true })}
              className="w-full rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              RETREAT TO CITY SANCTUARY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
