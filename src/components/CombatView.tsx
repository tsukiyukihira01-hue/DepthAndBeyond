import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Character, CombatParticipant, Item, Skill } from '../types/game';
import { calculateDamage, generateDungeonFloorEncounter, generateLootForEncounter, LootDropResult, getSkillCategory } from '../utils/formulas';
import { audio } from '../utils/audio';
import skillsData from '../data/skills.json';
import { getUnlockedTreeSkills, getCharacterEffectiveStats } from '../utils/skillTreeUtils';
import { ItemStatCard } from './ItemStatCard';
import { CombatHeader } from './combat/CombatHeader';
import { CombatTurnTimeline } from './combat/CombatTurnTimeline';
import { CombatPlayerStatus } from './combat/CombatPlayerStatus';
import { CombatSquadGrid } from './combat/CombatSquadGrid';
import { CombatActionPanel } from './combat/CombatActionPanel';
import { CombatConsoleLog } from './combat/CombatConsoleLog';
import { CombatVictoryModal } from './combat/CombatVictoryModal';
import { CombatQuickEquipModal } from './combat/CombatQuickEquipModal';
import { CombatGrimoireModal } from './combat/CombatGrimoireModal';
import {
  Sword,
  Shield,
  Zap,
  Sparkles,
  Play,
  Pause,
  Flame,
  Heart,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Skull,
  FlaskConical,
  Droplet,
  Gift,
  Compass,
  Trophy,
  ArrowRight,
  RotateCcw,
  MapPin,
  Building,
  Eye,
  X,
  Lock,
  ShieldCheck,
  BookOpen,
  Plus,
  Check,
  Settings,
  Sparkles as SparklesIcon,
} from 'lucide-react';

interface CombatViewProps {
  character: Character;
  onCombatEnd: (result: {
    victory: boolean;
    expGained: number;
    goldGained: number;
    itemsDropped: string[];
    remainingHp: number;
    remainingMana: number;
    petExpGained?: number;
    redirectToCity?: boolean;
    redirectToMap?: boolean;
    droppedItemsList?: LootDropResult['items'];
  }) => void;
  onUpdateCharacter?: (updatedChar: Character) => void;
  isRaidMode?: boolean;
  onCombatStatusChange?: (inProgress: boolean) => void;
}

interface CombatLogEntry {
  id: string;
  turn: number;
  text: string;
  type: 'friendly' | 'hostile' | 'pet' | 'heal' | 'crit' | 'system' | 'evasion' | 'boss_strike';
  timestamp: string;
}

interface TurnActor {
  id: string;
  name: string;
  type: 'player' | 'pet' | 'enemy';
  spd: number;
  icon: string;
  hp: number;
  maxHp: number;
}

export const CombatView: React.FC<CombatViewProps> = ({
  character,
  onCombatEnd,
  onUpdateCharacter,
  isRaidMode = false,
  onCombatStatusChange,
}) => {
  const maxFloorReached = Math.max(1, character.stats?.maxFloorReached || 1);
  const [currentFloor, setCurrentFloor] = useState<number>(1);

  // Combine unlocked Skill Tree abilities with default skillsData fallback, deduplicating by ID
  const unlockedTreeSkills = getUnlockedTreeSkills(character);
  const allAvailableSkills: Skill[] = useMemo(() => {
    const map = new Map<string, Skill>();
    (skillsData as Skill[]).forEach((s) => map.set(s.id, s));
    unlockedTreeSkills.forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  }, [character]);

  useEffect(() => {
    if (currentFloor > maxFloorReached) {
      setCurrentFloor(maxFloorReached);
    }
  }, [maxFloorReached]);
  const [turnEndsAt, setTurnEndsAt] = useState<number>(Date.now() + 5000);
  const [timeLeft, setTimeLeft] = useState<number>(5);
  const [isAutoBattle, setIsAutoBattle] = useState<boolean>(false);

  // AFK Auto-Grind System State
  const [isAfkGrinding, setIsAfkGrinding] = useState<boolean>(false);
  const [afkRunCount, setAfkRunCount] = useState<number>(0);
  const [afkTotalExp, setAfkTotalExp] = useState<number>(0);
  const [afkTotalGold, setAfkTotalGold] = useState<number>(0);
  const [afkTotalItems, setAfkTotalItems] = useState<number>(0);
  const isAfkGrindingRef = useRef(isAfkGrinding);
  isAfkGrindingRef.current = isAfkGrinding;

  const [turnCount, setTurnCount] = useState<number>(1);
  const [logFilter, setLogFilter] = useState<'all' | 'friendly' | 'hostile' | 'pet' | 'system'>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  // Encounter state rewards
  const [floorExpReward, setFloorExpReward] = useState<number>(100);
  const [floorGoldReward, setFloorGoldReward] = useState<number>(80);

  // Calculate effective stats including Skill Tree branch stat bonuses
  const effectiveStats = getCharacterEffectiveStats(character);

  // Player persistent HP and MP
  const [playerHp, setPlayerHp] = useState<number>(effectiveStats.hp);
  const [playerMana, setPlayerMana] = useState<number>(effectiveStats.mana);

  // Friendly Team Setup
  const [friendlies, setFriendlies] = useState<CombatParticipant[]>(() => {
    const list: CombatParticipant[] = [
      {
        id: character.id,
        name: character.name,
        isPlayer: true,
        level: character.level,
        hp: effectiveStats.hp,
        maxHp: effectiveStats.maxHp,
        mana: effectiveStats.mana,
        maxMana: effectiveStats.maxMana,
        ward: effectiveStats.ward,
        maxWard: effectiveStats.maxWard,
        spd: effectiveStats.spd,
        str: effectiveStats.str,
        def: effectiveStats.def,
        int: effectiveStats.int,
        wis: effectiveStats.wis,
        dex: effectiveStats.dex,
        statusEffects: [],
        icon: '⚔️',
        team: 'friendly',
      },
    ];

    if (character.familiar) {
      const pet = character.familiar;
      list.push({
        id: pet.id,
        name: pet.name,
        isPlayer: false,
        isFamiliar: true,
        level: pet.level,
        hp: pet.hp,
        maxHp: pet.maxHp,
        mana: pet.mana,
        maxMana: pet.maxMana,
        ward: 50,
        maxWard: 50,
        spd: pet.spd || 22,
        str: pet.str,
        def: pet.def,
        int: pet.int,
        wis: 20,
        dex: 20,
        statusEffects: [],
        icon: pet.icon || '🐾',
        team: 'friendly',
      });
    }

    return list;
  });

  // Enemy Team Setup
  const [enemies, setEnemies] = useState<CombatParticipant[]>([]);

  // Turn Processing Order State
  const [turnQueue, setTurnQueue] = useState<TurnActor[]>([]);
  const [activeActorIndex, setActiveActorIndex] = useState<number>(0);
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);

  // Consumed Items Counters
  const [consumedHpVials, setConsumedHpVials] = useState<number>(0);
  const [consumedMpVials, setConsumedMpVials] = useState<number>(0);

  // Victory Loot Pop-up Modal State
  const [showVictoryLootModal, setShowVictoryLootModal] = useState<boolean>(false);
  const [victoryLootData, setVictoryLootData] = useState<LootDropResult | null>(null);
  const [inspectedLootItem, setInspectedLootItem] = useState<Item | null>(null);

  // Death / Redirect Modal State
  const [showDeathModal, setShowDeathModal] = useState<boolean>(false);
  const [deathType, setDeathType] = useState<'camp' | 'city_square' | null>(null);

  // Active Combat State (Unfinished fight in progress)
  const isCombatActive = enemies.length > 0 && enemies.some((e) => e.hp > 0) && playerHp > 0 && !showVictoryLootModal && !showDeathModal;

  useEffect(() => {
    if (onCombatStatusChange) {
      onCombatStatusChange(isCombatActive);
    }
  }, [isCombatActive, onCombatStatusChange]);

  useEffect(() => {
    return () => {
      if (onCombatStatusChange) {
        onCombatStatusChange(false);
      }
    };
  }, [onCombatStatusChange]);

  // Logs
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);

  // Refs for current state to avoid stale closure during async turns
  const enemiesRef = useRef(enemies);
  enemiesRef.current = enemies;
  const friendliesRef = useRef(friendlies);
  friendliesRef.current = friendlies;
  const playerHpRef = useRef(playerHp);
  playerHpRef.current = playerHp;
  const playerManaRef = useRef(playerMana);
  playerManaRef.current = playerMana;
  const turnQueueRef = useRef(turnQueue);
  turnQueueRef.current = turnQueue;
  const activeActorIndexRef = useRef(activeActorIndex);
  activeActorIndexRef.current = activeActorIndex;

  // Skill Cooldown Tracking & Auto-Skill Pre-Action Ref
  const isExecutingTurnRef = useRef(false);
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});
  const autoSkillTriggeredTurnRef = useRef<number | null>(null);

  // In-Combat Skill Modals
  const [showQuickEquipModal, setShowQuickEquipModal] = useState<boolean>(false);
  const [equipCategory, setEquipCategory] = useState<'actives' | 'autoCast' | 'passives' | null>(null);
  const [equipSlotIndex, setEquipSlotIndex] = useState<number>(0);
  const [showGrimoireModal, setShowGrimoireModal] = useState<boolean>(false);

  // Build Turn Initiative Queue (Sorted by SPD descending)
  const buildTurnQueue = (
    currentEnemies: CombatParticipant[],
    currentFriendlies: CombatParticipant[],
    curPlayerHp?: number
  ) => {
    const queue: TurnActor[] = [];
    const effectiveHp = curPlayerHp !== undefined ? curPlayerHp : playerHpRef.current;

    // Player
    if (effectiveHp > 0) {
      queue.push({
        id: character.id,
        name: character.name,
        type: 'player',
        spd: effectiveStats.spd || 25,
        icon: '⚔️',
        hp: effectiveHp,
        maxHp: effectiveStats.maxHp,
      });
    }

    // Pet / Familiar
    const petUnit = currentFriendlies.find((f) => f.isFamiliar && f.hp > 0);
    if (petUnit) {
      queue.push({
        id: petUnit.id,
        name: petUnit.name,
        type: 'pet',
        spd: petUnit.spd || 22,
        icon: petUnit.icon || '🐾',
        hp: petUnit.hp,
        maxHp: petUnit.maxHp,
      });
    }

    // Enemies alive
    currentEnemies.filter((e) => e.hp > 0).forEach((e) => {
      queue.push({
        id: e.id,
        name: e.name,
        type: 'enemy',
        spd: e.spd || 15,
        icon: e.icon || '👹',
        hp: e.hp,
        maxHp: e.maxHp,
      });
    });

    // Sort by Speed descending
    queue.sort((a, b) => b.spd - a.spd);
    return queue;
  };

  // Initialize or reload encounter for current floor
  const initEncounterForFloor = (floor: number) => {
    const enc = generateDungeonFloorEncounter(floor);
    const initialEnemies = enc.enemies as CombatParticipant[];
    setEnemies(initialEnemies);
    setFloorExpReward(enc.expReward);
    setFloorGoldReward(enc.goldReward);
    setTurnCount(1);
    setTurnEndsAt(Date.now() + 5000);
    setActionError(null);
    setConsumedHpVials(0);
    setConsumedMpVials(0);
    setShowVictoryLootModal(false);
    setShowDeathModal(false);

    const queue = buildTurnQueue(initialEnemies, friendlies);
    setTurnQueue(queue);
    setActiveActorIndex(0);
    setIsProcessingTurn(false);

    const isGuaranteedBoss = enc.isBossFloor;
    const isAmbush = enc.isAmbushBoss;

    let logText = `⚔️ [Floor ${floor} Challenge] Encountered ${enc.enemies.length} hostile target(s)! Initiative order established.`;
    if (isAmbush) {
      logText = `⚠️ [RARE BOSS AMBUSH!] ${enc.enemies[0].name} ambushed Floor ${floor} alongside ${enc.enemies.length - 1} minion(s)! (+Bonus Rewards)`;
    } else if (isGuaranteedBoss) {
      logText = `🔥 [Floor ${floor} APEX BOSS FIGHT] Engaged ${enc.enemies[0].name} and minions! Stand your ground!`;
    }

    const initLog: CombatLogEntry = {
      id: `log_init_${Date.now()}`,
      turn: 1,
      text: logText,
      type: 'system',
      timestamp: new Date().toLocaleTimeString(),
    };

    const logs: CombatLogEntry[] = [initLog];
    if (enc.bossAura) {
      logs.push({
        id: `log_aura_${Date.now()}`,
        turn: 1,
        text: `✨ [BOSS AURA ACTIVE] ${enc.bossAura}`,
        type: 'boss_strike',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    setCombatLogs(logs);
  };

  useEffect(() => {
    initEncounterForFloor(currentFloor);
  }, [currentFloor]);

  // Keep friendlies player HP/MP updated with local state
  useEffect(() => {
    setFriendlies((prev) =>
      prev.map((f) =>
        f.isPlayer
          ? {
              ...f,
              hp: playerHp,
              mana: playerMana,
              maxHp: effectiveStats.maxHp,
              maxMana: effectiveStats.maxMana,
            }
          : f
      )
    );
  }, [playerHp, playerMana, effectiveStats.maxHp, effectiveStats.maxMana]);

  // Count Vials in Character Inventory
  const hpVialsInInv = character.inventory.filter(
    (i): i is Item => i !== null && (i.name.includes('Health Vial') || i.name.includes('HP Vial'))
  );
  const mpVialsInInv = character.inventory.filter(
    (i): i is Item => i !== null && (i.name.includes('Mana Vial') || i.name.includes('MP Vial'))
  );

  const totalHpVialCount = hpVialsInInv.reduce((sum, item) => sum + item.quantity, 0);
  const totalMpVialCount = mpVialsInInv.reduce((sum, item) => sum + item.quantity, 0);

  // Consume HP Vial Quick Action
  const handleUseHpVial = () => {
    if (totalHpVialCount <= 0) {
      setActionError('No Novice Health Vials left in your inventory!');
      return;
    }
    if (playerHp >= effectiveStats.maxHp) {
      setActionError('Your Health is already at maximum!');
      return;
    }

    const healAmount = 250;
    const newHp = Math.min(effectiveStats.maxHp, playerHp + healAmount);
    setPlayerHp(newHp);
    setConsumedHpVials((prev) => prev + 1);
    audio.playHeal();
    setActionError(null);

    // Consume 1 vial from character inventory
    const updatedInv = [...character.inventory];
    const vialIdx = updatedInv.findIndex(
      (i) => i !== null && (i.name.includes('Health Vial') || i.name.includes('HP Vial'))
    );
    if (vialIdx !== -1) {
      const item = updatedInv[vialIdx]!;
      if (item.quantity > 1) {
        updatedInv[vialIdx] = { ...item, quantity: item.quantity - 1 };
      } else {
        updatedInv[vialIdx] = null;
      }
    }

    const updatedChar = {
      ...character,
      inventory: updatedInv,
      stats: { ...character.stats, hp: newHp },
    };
    if (onUpdateCharacter) onUpdateCharacter(updatedChar);

    setCombatLogs((prev) => [
      {
        id: `log_${Date.now()}_vial_hp`,
        turn: turnCount,
        text: `🧪 ${character.name} consumed Novice Health Vial restoring +${healAmount} HP (${newHp}/${effectiveStats.maxHp})!`,
        type: 'heal',
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  // Consume Mana Vial Quick Action
  const handleUseMpVial = () => {
    if (totalMpVialCount <= 0) {
      setActionError('No Novice Mana Vials left in your inventory!');
      return;
    }
    if (playerMana >= effectiveStats.maxMana) {
      setActionError('Your Mana is already at maximum!');
      return;
    }

    const manaAmount = 250;
    const newMana = Math.min(effectiveStats.maxMana, playerMana + manaAmount);
    setPlayerMana(newMana);
    setConsumedMpVials((prev) => prev + 1);
    audio.playHeal();
    setActionError(null);

    // Consume 1 vial from character inventory
    const updatedInv = [...character.inventory];
    const vialIdx = updatedInv.findIndex(
      (i) => i !== null && (i.name.includes('Mana Vial') || i.name.includes('MP Vial'))
    );
    if (vialIdx !== -1) {
      const item = updatedInv[vialIdx]!;
      if (item.quantity > 1) {
        updatedInv[vialIdx] = { ...item, quantity: item.quantity - 1 };
      } else {
        updatedInv[vialIdx] = null;
      }
    }

    const updatedChar = {
      ...character,
      inventory: updatedInv,
      stats: { ...character.stats, mana: newMana },
    };
    if (onUpdateCharacter) onUpdateCharacter(updatedChar);

    setCombatLogs((prev) => [
      {
        id: `log_${Date.now()}_vial_mp`,
        turn: turnCount,
        text: `💧 ${character.name} consumed Novice Mana Vial restoring +${manaAmount} MP (${newMana}/${character.stats.maxMana})!`,
        type: 'heal',
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  // Advance Turn Queue to Next Actor
  const advanceTurn = (nextEnemies: CombatParticipant[], nextFriendlies: CombatParticipant[], nextPlayerHp: number, nextPlayerMana: number) => {
    // Check Victory
    if (nextEnemies.every((e) => e.hp <= 0)) {
      audio.playVictory();
      const hasPetInFight = Boolean(character.familiar && nextFriendlies.some((f) => f.isFamiliar));
      const isAfk = isAfkGrindingRef.current;

      const lootResult = generateLootForEncounter(
        currentFloor,
        currentFloor % 10 === 0,
        nextEnemies,
        hasPetInFight,
        isAfk
      );

      if (isAfk) {
        setAfkRunCount((prev) => prev + 1);
        setAfkTotalExp((prev) => prev + lootResult.exp);
        setAfkTotalGold((prev) => prev + lootResult.gold);
        setAfkTotalItems((prev) => prev + lootResult.items.length);
      } else {
        setVictoryLootData(lootResult);
        setShowVictoryLootModal(true);
      }

      const victoryLog: CombatLogEntry = {
        id: `log_${Date.now()}_vic`,
        turn: turnCount,
        text: isAfk
          ? `🔄 [AFK Auto-Grind] Floor #${currentFloor} Cleared! Earned +${lootResult.exp} XP, +${lootResult.gold} Gold, ${lootResult.items.length} loot item(s) (10% AFK Rate). Auto-rechallenging Floor #${currentFloor} in 1.5s...`
          : `🏆 VICTORY ON FLOOR ${currentFloor}! Earned +${lootResult.exp} XP, +${lootResult.gold} Gold, and ${lootResult.items.length} loot item(s)!`,
        type: 'friendly',
        timestamp: new Date().toLocaleTimeString(),
      };
      setCombatLogs((prev) => [victoryLog, ...prev]);

      onCombatEnd({
        victory: true,
        expGained: lootResult.exp,
        goldGained: lootResult.gold,
        itemsDropped: lootResult.items.map((i) => i.name),
        remainingHp: nextPlayerHp,
        remainingMana: nextPlayerMana,
        petExpGained: hasPetInFight ? lootResult.petExp : 0,
        droppedItemsList: lootResult.items,
        floorCleared: currentFloor,
      });

      if (isAfk) {
        setTimeout(() => {
          if (isAfkGrindingRef.current) {
            initEncounterForFloor(currentFloor);
          }
        }, 1500);
      }
      return;
    }

    // Check Defeat
    if (nextPlayerHp <= 0) {
      audio.playDefeat();
      if (isAfkGrindingRef.current) {
        setIsAfkGrinding(false);
      }
      if (character.gold >= 5) {
        setDeathType('camp');
      } else {
        setDeathType('city_square');
      }
      setShowDeathModal(true);
      return;
    }

    // Rebuild queue filtering out dead actors
    const updatedQueue = buildTurnQueue(nextEnemies, nextFriendlies, nextPlayerHp);
    setTurnQueue(updatedQueue);

    let nextIndex = activeActorIndex + 1;
    if (nextIndex >= updatedQueue.length) {
      nextIndex = 0;
      setTurnCount((prev) => prev + 1);
    }
    setActiveActorIndex(nextIndex);
    setTurnEndsAt(Date.now() + 5000);
    setIsProcessingTurn(false);
    isExecutingTurnRef.current = false;
  };

  // Turn Timer Countdown Sync
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((turnEndsAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0 && !isProcessingTurn && !isExecutingTurnRef.current && !showVictoryLootModal && !showDeathModal) {
        // Auto pass turn or attack if timer runs out
        if (turnQueue.length > 0) {
          const currentActor = turnQueue[activeActorIndex];
          if (currentActor?.type === 'player') {
            handlePlayerTurnAction('normal_attack');
          } else if (currentActor?.type === 'enemy') {
            executeEnemyTurn(currentActor);
          } else if (currentActor?.type === 'pet') {
            executePetTurn();
          }
        }
        setTurnEndsAt(Date.now() + 5000);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [turnEndsAt, activeActorIndex, turnQueue, isProcessingTurn, showVictoryLootModal, showDeathModal]);

  // Anti-stall watchdog effect to automatically recover if turn gets stuck
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (isProcessingTurn && isExecutingTurnRef.current && !showVictoryLootModal && !showDeathModal) {
        console.warn('Turn watchdog triggered! Recovering from turn freeze/stall...');
        isExecutingTurnRef.current = false;
        setIsProcessingTurn(false);
        if (turnQueue.length > 0) {
          setActiveActorIndex((prev) => (prev + 1) % turnQueue.length);
        }
      }
    }, 2500);
    return () => clearInterval(watchdog);
  }, [isProcessingTurn, turnQueue.length, showVictoryLootModal, showDeathModal]);

  // Execute Non-Player Turn (Pet or Enemy)
  useEffect(() => {
    if (turnQueue.length === 0 || showVictoryLootModal || showDeathModal) return;

    if (activeActorIndex >= turnQueue.length) {
      setActiveActorIndex(0);
      return;
    }

    const currentActor = turnQueue[activeActorIndex];
    if (!currentActor || currentActor.hp <= 0) {
      setActiveActorIndex((prev) => (prev + 1) % Math.max(1, turnQueue.length));
      return;
    }

    if (currentActor.type === 'pet' && !isExecutingTurnRef.current) {
      isExecutingTurnRef.current = true;
      setIsProcessingTurn(true);
      const timer = setTimeout(() => {
        executePetTurn();
      }, 400);
      return () => {
        clearTimeout(timer);
        isExecutingTurnRef.current = false;
        setIsProcessingTurn(false);
      };
    }

    if (currentActor.type === 'enemy' && !isExecutingTurnRef.current) {
      isExecutingTurnRef.current = true;
      setIsProcessingTurn(true);
      const timer = setTimeout(() => {
        executeEnemyTurn(currentActor);
      }, 400);
      return () => {
        clearTimeout(timer);
        isExecutingTurnRef.current = false;
        setIsProcessingTurn(false);
      };
    }

    if (currentActor.type === 'player' && (isAutoBattle || isAfkGrinding) && !isExecutingTurnRef.current) {
      isExecutingTurnRef.current = true;
      setIsProcessingTurn(true);
      const timer = setTimeout(() => {
        // Auto-consume Health Vial if player HP is critical (<35%)
        if (playerHpRef.current < effectiveStats.maxHp * 0.35 && totalHpVialCount > 0) {
          handleUseHpVial();
        } else if (playerManaRef.current < effectiveStats.maxMana * 0.20 && totalMpVialCount > 0) {
          handleUseMpVial();
        }

        // Pick best active skill if available, off cooldown and affordable
        const activeSkillIds = (character.equippedSkills?.actives || []).filter(Boolean) as string[];
        let chosenAction = 'normal_attack';

        for (const skId of activeSkillIds) {
          const sk = allAvailableSkills.find((s) => s.id === skId);
          if (sk) {
            const cd = skillCooldowns[sk.id] || 0;
            if (cd === 0 && playerManaRef.current >= (sk.manaCost || 0)) {
              chosenAction = sk.id;
              break;
            }
          }
        }

        if (chosenAction === 'normal_attack' && playerManaRef.current >= 15) {
          chosenAction = 'heavy_attack';
        }

        handlePlayerTurnAction(chosenAction);
      }, 500);
      return () => {
        clearTimeout(timer);
        isExecutingTurnRef.current = false;
        setIsProcessingTurn(false);
      };
    }
  }, [activeActorIndex, turnQueue, showVictoryLootModal, showDeathModal, isAutoBattle, isAfkGrinding]);

  // Execute Pet Turn
  const executePetTurn = () => {
    const curFriendlies = friendliesRef.current;
    const curEnemies = enemiesRef.current;
    const curPlayerHp = playerHpRef.current;
    const curPlayerMana = playerManaRef.current;

    const petUnit = curFriendlies.find((f) => f.isFamiliar && f.hp > 0);
    let updatedEnemies = [...curEnemies];
    let updatedFriendlies = [...curFriendlies];
    let newHp = curPlayerHp;

    if (petUnit) {
      const aliveEnemies = updatedEnemies.filter((e) => e.hp > 0);
      if (aliveEnemies.length > 0) {
        const petTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        const petStr = petUnit.str || 20;
        const petInt = petUnit.int || 20;
        const roll = Math.random();

        if (roll < 0.25 && curPlayerHp < effectiveStats.maxHp * 0.8) {
          // Heal Skill
          const petHealVal = Math.round(petInt * 1.6);
          newHp = Math.min(effectiveStats.maxHp, curPlayerHp + petHealVal);
          setPlayerHp(newHp);

          setCombatLogs((prev) => [
            {
              id: `log_${Date.now()}_pet`,
              turn: turnCount,
              text: `🐾 [Pet Turn - SPD ${petUnit.spd || 22}] ${petUnit.name} cast Nature's Blessing, restoring +${petHealVal} HP to ${character.name}!`,
              type: 'pet',
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 24),
          ]);
        } else if (roll < 0.50) {
          // Magic Skill
          const petSkillName = '🌟 Starlight Burst';
          const petDmg = Math.max(5, Math.round(petInt * 1.8 - (petTarget.def || 10) * 0.4));

          updatedEnemies = updatedEnemies.map((e) =>
            e.id === petTarget.id ? { ...e, hp: Math.max(0, e.hp - petDmg) } : e
          );
          setEnemies(updatedEnemies);

          setCombatLogs((prev) => [
            {
              id: `log_${Date.now()}_pet`,
              turn: turnCount,
              text: `🐾 [Pet Turn - SPD ${petUnit.spd || 22}] ${petUnit.name} used ${petSkillName} dealing ${petDmg} magic damage to ${petTarget.name}!`,
              type: 'pet',
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 24),
          ]);
        } else if (roll < 0.70) {
          // Shield / Barrier Skill
          const shieldVal = 40;
          updatedFriendlies = updatedFriendlies.map((f) =>
            f.isPlayer ? { ...f, ward: Math.min(f.maxWard || 100, (f.ward || 0) + shieldVal) } : f
          );
          setFriendlies(updatedFriendlies);

          setCombatLogs((prev) => [
            {
              id: `log_${Date.now()}_pet`,
              turn: turnCount,
              text: `🛡️ [Pet Turn - SPD ${petUnit.spd || 22}] ${petUnit.name} cast Aegis Barrier, granting +${shieldVal} Ward to ${character.name}!`,
              type: 'pet',
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 24),
          ]);
        } else {
          // Physical Strike
          const petSkillName = '🐾 Claw Slash';
          const petDmg = Math.max(5, Math.round(petStr * 1.5 - (petTarget.def || 10) * 0.5));

          updatedEnemies = updatedEnemies.map((e) =>
            e.id === petTarget.id ? { ...e, hp: Math.max(0, e.hp - petDmg) } : e
          );
          setEnemies(updatedEnemies);

          setCombatLogs((prev) => [
            {
              id: `log_${Date.now()}_pet`,
              turn: turnCount,
              text: `🐾 [Pet Turn - SPD ${petUnit.spd || 22}] ${petUnit.name} used ${petSkillName} dealing ${petDmg} damage to ${petTarget.name}!`,
              type: 'pet',
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 24),
          ]);
        }
      }
    }

    advanceTurn(updatedEnemies, updatedFriendlies, newHp, curPlayerMana);
  };

  // Execute Enemy Turn
  const executeEnemyTurn = (enemyActor: TurnActor) => {
    const curEnemies = enemiesRef.current;
    const curFriendlies = friendliesRef.current;
    const curPlayerHp = playerHpRef.current;
    const curPlayerMana = playerManaRef.current;

    const attacker = curEnemies.find((e) => e.id === enemyActor.id && e.hp > 0);
    let updatedEnemies = [...curEnemies];
    let updatedFriendlies = [...curFriendlies];
    let newPlayerHp = curPlayerHp;

    if (attacker) {
      const isBoss = attacker.isBoss;
      const roll = Math.random();

      let skillName = 'Quick Slash';
      let damageMult = 1.2;
      let isMagic = false;
      let isVampiric = false;
      let isAoE = false;
      let isRegen = false;

      if (isBoss) {
        if (roll < 0.25) {
          skillName = '🔥 Cataclysmic Nova';
          damageMult = 2.2;
          isMagic = true;
          isAoE = true;
        } else if (roll < 0.50) {
          skillName = '💥 Abyssal Earth Shatter';
          damageMult = 1.8;
        } else if (roll < 0.70) {
          skillName = '🩸 Vampiric Soul Drain';
          damageMult = 1.5;
          isVampiric = true;
        } else if (roll < 0.85 && attacker.hp < attacker.maxHp * 0.7) {
          skillName = '💚 Ancient Regeneration';
          isRegen = true;
        } else {
          skillName = '⚔️ Overlord Strike';
          damageMult = 1.4;
        }
      } else {
        if (roll < 0.30) {
          skillName = '⚔️ Heavy Strike';
          damageMult = 1.5;
        } else if (roll < 0.55) {
          skillName = '🔥 Elemental Blast';
          damageMult = 1.6;
          isMagic = true;
        } else if (roll < 0.75) {
          skillName = '🩸 Shadow Bite';
          damageMult = 1.3;
          isVampiric = true;
        } else {
          skillName = '🗡️ Quick Slash';
          damageMult = 1.1;
        }
      }

      if (isRegen) {
        const healAmt = Math.round(attacker.maxHp * 0.12);
        updatedEnemies = updatedEnemies.map((e) =>
          e.id === attacker.id ? { ...e, hp: Math.min(e.maxHp, e.hp + healAmt) } : e
        );
        setEnemies(updatedEnemies);
        setCombatLogs((prev) => [
          {
            id: `log_${Date.now()}_regen`,
            turn: turnCount,
            text: `💚 [Boss Turn - SPD ${attacker.spd}] ${attacker.name} cast ${skillName}, restoring +${healAmt} HP!`,
            type: 'boss_strike',
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 24),
        ]);
      } else {
        const statAtk = isMagic ? (attacker.int || 15) : (attacker.str || 15);
        const statDef = isMagic ? (character.stats.wis || 10) : (character.stats.def || 10);
        let rawEnemyDmg = Math.max(8, Math.floor(statAtk * damageMult - statDef * 0.4));

        const petCompanion = curFriendlies.find((f) => f.isFamiliar && f.hp > 0);
        const protectionRate = character.familiar?.protectionRate || 0.30;
        const isIntercepted = petCompanion && Math.random() < protectionRate && !isAoE;

        if (isIntercepted && petCompanion) {
          const newPetHp = Math.max(0, petCompanion.hp - rawEnemyDmg);
          updatedFriendlies = updatedFriendlies.map((f) => (f.isFamiliar ? { ...f, hp: newPetHp } : f));
          setFriendlies(updatedFriendlies);

          setCombatLogs((prev) => [
            {
              id: `log_${Date.now()}_intercept`,
              turn: turnCount,
              text: `🛡️ [Enemy Turn - SPD ${attacker.spd}] ${attacker.name} used ${skillName}, but ${petCompanion.name} jumped in front, absorbing ${rawEnemyDmg} damage! (${newPetHp}/${petCompanion.maxHp} HP)`,
              type: 'pet',
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 24),
          ]);
        } else {
          newPlayerHp = Math.max(0, curPlayerHp - rawEnemyDmg);
          setPlayerHp(newPlayerHp);

          if (isAoE && petCompanion) {
            const petDmg = Math.max(5, Math.floor(rawEnemyDmg * 0.6));
            const newPetHp = Math.max(0, petCompanion.hp - petDmg);
            updatedFriendlies = updatedFriendlies.map((f) => (f.isFamiliar ? { ...f, hp: newPetHp } : f));
            setFriendlies(updatedFriendlies);
          }

          if (isVampiric) {
            const lifeStolen = Math.round(rawEnemyDmg * 0.5);
            updatedEnemies = updatedEnemies.map((e) =>
              e.id === attacker.id ? { ...e, hp: Math.min(e.maxHp, e.hp + lifeStolen) } : e
            );
            setEnemies(updatedEnemies);
          }

          setCombatLogs((prev) => [
            {
              id: `log_${Date.now()}_e`,
              turn: turnCount,
              text: isBoss
                ? `🔥 [BOSS TURN - SPD ${attacker.spd}] ${attacker.name} unleashed ${skillName} dealing ${rawEnemyDmg} damage to ${character.name}! (${newPlayerHp}/${effectiveStats.maxHp} HP)`
                : `🩸 [Enemy Turn - SPD ${attacker.spd}] ${attacker.name} used ${skillName} dealing ${rawEnemyDmg} damage to ${character.name}! (${newPlayerHp}/${effectiveStats.maxHp} HP)`,
              type: isBoss ? 'boss_strike' : 'hostile',
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 24),
          ]);
        }
      }
    }

    advanceTurn(updatedEnemies, updatedFriendlies, newPlayerHp, curPlayerMana);
  };

  // Helper to execute any skill (damage, healing, ward) against target(s)
  const executeSkillLogic = (
    skill: Skill,
    currentEnemies: CombatParticipant[],
    currentFriendlies: CombatParticipant[],
    curPlayerHp: number,
    curPlayerMana: number
  ) => {
    let updatedEnemies = [...currentEnemies];
    let updatedFriendlies = [...currentFriendlies];
    let nextPlayerHp = curPlayerHp;
    let nextPlayerMana = curPlayerMana;
    let logSummary = '';

    const aliveEnemies = updatedEnemies.filter((e) => e.hp > 0);
    const mult = skill.damageMultiplier || 1.0;

    if (skill.type === 'support' || skill.wardGrant) {
      if (skill.wardGrant) {
        const wardAmt = Math.round(
          (skill.wardGrant || 50) +
            (character.stats.def || 10) * 1.5 +
            (character.stats.wis || 10) * 1.0
        );
        updatedFriendlies = updatedFriendlies.map((f) =>
          f.isPlayer
            ? { ...f, ward: Math.min(f.maxWard || 200, (f.ward || 0) + wardAmt) }
            : f
        );
        logSummary = `Granted +${wardAmt} Ward Barrier to ${character.name}!`;
      } else {
        const healAmt = Math.round(
          120 +
            (character.stats.wis || 10) * 2.8 +
            (character.stats.int || 10) * 1.1 +
            character.level * 5
        );
        nextPlayerHp = Math.min(effectiveStats.maxHp, curPlayerHp + healAmt);
        updatedFriendlies = updatedFriendlies.map((f) =>
          f.isPlayer ? { ...f, hp: nextPlayerHp } : f
        );
        logSummary = `Restored +${healAmt} HP to ${character.name} (${nextPlayerHp}/${effectiveStats.maxHp})!`;
      }
    } else {
      let targetUnits: CombatParticipant[] = [];
      const tType = skill.targetType || (skill.isArea ? 'all' : 'single');

      if (tType === 'all') {
        targetUnits = aliveEnemies;
      } else if (tType === 'random_2') {
        const shuffled = [...aliveEnemies].sort(() => 0.5 - Math.random());
        targetUnits = shuffled.slice(0, 2);
      } else if (tType === 'random_3') {
        const shuffled = [...aliveEnemies].sort(() => 0.5 - Math.random());
        targetUnits = shuffled.slice(0, 3);
      } else if (tType === 'highest_hp') {
        const highest = [...aliveEnemies].sort((a, b) => b.hp - a.hp)[0];
        if (highest) targetUnits = [highest];
      } else if (tType === 'lowest_hp') {
        const lowest = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
        if (lowest) targetUnits = [lowest];
      } else {
        targetUnits = aliveEnemies.length > 0 ? [aliveEnemies[0]] : [];
      }

      const dmgType = skill.type === 'physical' ? 'physical' : 'magical';

      targetUnits.forEach((targetUnit) => {
        const { damage, isEvaded, isCritical, wardAbsorbed } = calculateDamage(
          { ...character.stats, hp: curPlayerHp, mana: curPlayerMana },
          {
            hp: targetUnit.hp,
            maxHp: targetUnit.maxHp,
            mana: targetUnit.mana,
            maxMana: targetUnit.maxMana,
            ward: targetUnit.ward,
            maxWard: targetUnit.maxWard,
            str: targetUnit.str || 15,
            def: targetUnit.def || 10,
            int: targetUnit.int || 15,
            wis: targetUnit.wis || 10,
            spd: targetUnit.spd,
            dex: targetUnit.dex || 10,
            unassignedPoints: 0,
          },
          dmgType,
          mult
        );

        updatedEnemies = updatedEnemies.map((e) => {
          if (e.id === targetUnit.id) {
            return { ...e, hp: Math.max(0, e.hp - damage) };
          }
          return e;
        });

        if (isEvaded) {
          logSummary += ` [${targetUnit.name}: EVADED]`;
        } else {
          logSummary += ` [${targetUnit.name}: -${damage} ${dmgType.toUpperCase()}${
            isCritical ? ' 💥CRIT' : ''
          }${wardAbsorbed > 0 ? ` (${wardAbsorbed} Ward)` : ''}]`;
        }
      });
    }

    const isAllEnemiesDefeated = updatedEnemies.length > 0 && updatedEnemies.every((e) => e.hp <= 0);

    return {
      updatedEnemies,
      updatedFriendlies,
      nextPlayerHp,
      nextPlayerMana,
      logSummary,
      isAllEnemiesDefeated,
    };
  };

  // Auto-Skill Pre-Action Execution at start of player's turn (0 Turn Cost)
  useEffect(() => {
    if (turnQueue.length === 0 || showVictoryLootModal || showDeathModal) return;

    if (activeActorIndex >= turnQueue.length) return;
    const currentActor = turnQueue[activeActorIndex];

    if (currentActor?.type === 'player' && playerHpRef.current > 0) {
      if (autoSkillTriggeredTurnRef.current !== turnCount) {
        autoSkillTriggeredTurnRef.current = turnCount;

        // Decrement active skill cooldowns at start of new turn
        setSkillCooldowns((prev) => {
          const next = { ...prev };
          let changed = false;
          Object.keys(next).forEach((k) => {
            if (next[k] > 0) {
              next[k] -= 1;
              changed = true;
            }
          });
          return changed ? next : prev;
        });

        // Award Mastery XP to equipped passives
        const equippedPassives = (character.equippedSkills?.passives || []).filter(Boolean) as string[];
        for (const pId of equippedPassives) {
          awardSkillMastery(pId, 10);
        }

        // Trigger Equipped Auto-Cast Skill
        const autoCastId = character.equippedSkills?.autoCast;
        if (autoCastId) {
          const autoSkill = allAvailableSkills.find((s) => s.id === autoCastId);
          if (autoSkill) {
            const curMana = playerManaRef.current;
            const requiredMp = autoSkill.manaCost || 0;

            if (curMana >= requiredMp) {
              const manaAfterAuto = curMana - requiredMp;
              setPlayerMana(manaAfterAuto);

              awardSkillMastery(autoSkill.id, 25);

              const res = executeSkillLogic(
                autoSkill,
                enemiesRef.current,
                friendliesRef.current,
                playerHpRef.current,
                manaAfterAuto
              );

              setEnemies(res.updatedEnemies);
              setFriendlies(res.updatedFriendlies);
              setPlayerHp(res.nextPlayerHp);
              setPlayerMana(res.nextPlayerMana);

              audio.playSpell();

              setCombatLogs((prev) => [
                {
                  id: `log_${Date.now()}_autocast`,
                  turn: turnCount,
                  text: `⚡ [AUTO-SKILL PRE-ACTION] ${character.name} auto-casted ${autoSkill.icon || '✨'} ${autoSkill.name}: ${res.logSummary}`,
                  type: 'friendly',
                  timestamp: new Date().toLocaleTimeString(),
                },
                ...prev.slice(0, 24),
              ]);

              if (res.isAllEnemiesDefeated) {
                advanceTurn(res.updatedEnemies, res.updatedFriendlies, res.nextPlayerHp, res.nextPlayerMana);
              }
            } else {
              setCombatLogs((prev) => [
                {
                  id: `log_${Date.now()}_autocast_fail`,
                  turn: turnCount,
                  text: `⚠️ [AUTO-SKILL PRE-ACTION] Unable to auto-cast ${autoSkill.icon || '✨'} ${autoSkill.name} (Requires ${requiredMp} MP, current: ${curMana} MP).`,
                  type: 'system',
                  timestamp: new Date().toLocaleTimeString(),
                },
                ...prev.slice(0, 24),
              ]);
            }
          }
        }
      }
    }
  }, [activeActorIndex, turnCount, turnQueue, showVictoryLootModal, showDeathModal]);

  // Award Skill Mastery XP
  const awardSkillMastery = (skillId: string, xpGain: number) => {
    if (!character.skillMasteries) {
      character.skillMasteries = {};
    }
    const current = character.skillMasteries[skillId] || { masteryLevel: 1, masteryXp: 0, maxMasteryXp: 100 };
    let newXp = current.masteryXp + xpGain;
    let newLevel = current.masteryLevel;
    let maxExp = current.maxMasteryXp || (100 * newLevel);

    if (newXp >= maxExp && newLevel < 10) {
      newXp -= maxExp;
      newLevel += 1;
      maxExp = 100 * newLevel;
      setCombatLogs((prev) => [
        {
          id: `log_${Date.now()}_mastery_${Math.random()}`,
          turn: turnCount,
          text: `🌟 SKILL MASTERY LEVELED UP! Your skill reached Mastery Level ${newLevel}! Power increased & cooldown reduced!`,
          type: 'buff',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 24),
      ]);
    }

    character.skillMasteries[skillId] = {
      masteryLevel: newLevel,
      masteryXp: newXp,
      maxMasteryXp: maxExp,
    };

    if (onUpdateCharacter) {
      onUpdateCharacter({ ...character });
    }
  };

  // Handle Quick Skill Equip in Combat
  const handleEquipSkillInCombat = (
    category: 'actives' | 'autoCast' | 'passives',
    slotIdx: number,
    skillId: string | null
  ) => {
    const updatedEquipped = {
      passives: [...(character.equippedSkills?.passives || [null, null, null, null])],
      autoCast: character.equippedSkills?.autoCast || null,
      actives: [...(character.equippedSkills?.actives || [null, null, null, null, null, null, null, null])],
    };

    if (category === 'actives') {
      updatedEquipped.actives[slotIdx] = skillId;
    } else if (category === 'autoCast') {
      updatedEquipped.autoCast = skillId;
    } else if (category === 'passives') {
      updatedEquipped.passives[slotIdx] = skillId;
    }

    const updatedChar: Character = {
      ...character,
      equippedSkills: updatedEquipped,
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }
  };

  // Execute Player Turn Action
  const handlePlayerTurnAction = (actionType: string) => {
    setActionError(null);
    if (enemies.every((e) => e.hp <= 0)) return;
    if (playerHp <= 0) {
      setActionError('You are defeated! Consume a Health Vial or leave combat.');
      return;
    }

    const currentActor = turnQueue[activeActorIndex];
    if (currentActor?.type !== 'player' && !isAutoBattle) {
      setActionError(`⏳ Not your turn yet! Currently waiting for ${currentActor?.name} (SPD ${currentActor?.spd})`);
      return;
    }

    let skillToUse: Skill | undefined;
    let requiredMana = 0;
    let actionText = 'Normal Attack';

    if (actionType === 'normal_attack') {
      requiredMana = 0;
      actionText = '🗡️ Normal Attack';
    } else if (actionType === 'heavy_attack') {
      requiredMana = 15;
      actionText = '⚡ Heavy Slash (1.5x)';
    } else {
      skillToUse = allAvailableSkills.find((s) => s.id === actionType);
      if (skillToUse) {
        // Check cooldown
        const currentCd = skillCooldowns[skillToUse.id] || 0;
        if (currentCd > 0) {
          setActionError(`⏳ ${skillToUse.name} is on cooldown for ${currentCd} more turn(s)!`);
          return;
        }
        requiredMana = skillToUse.manaCost || 0;
        actionText = `${skillToUse.icon || '✨'} ${skillToUse.name}`;
      } else {
        setActionError('Skill not found!');
        return;
      }
    }

    if (playerMana < requiredMana) {
      setActionError(`⚠️ Not enough Mana! Need ${requiredMana} MP, but you have ${playerMana} MP. Use a Mana Vial!`);
      return;
    }

    setIsProcessingTurn(true);
    const nextMana = playerMana - requiredMana;
    setPlayerMana(nextMana);

    if (skillToUse) {
      if (skillToUse.cooldownTurns && skillToUse.cooldownTurns > 0) {
        setSkillCooldowns((prev) => ({ ...prev, [skillToUse!.id]: skillToUse!.cooldownTurns }));
      }
      audio.playSpell();
    } else {
      audio.playAttack();
    }

    let updatedEnemies = [...enemies];
    let updatedFriendlies = [...friendlies];
    let nextHp = playerHp;

    if (skillToUse) {
      awardSkillMastery(skillToUse.id, 35);
      const res = executeSkillLogic(skillToUse, enemies, friendlies, playerHp, nextMana);
      updatedEnemies = res.updatedEnemies;
      updatedFriendlies = res.updatedFriendlies;
      nextHp = res.nextPlayerHp;

      setEnemies(updatedEnemies);
      setFriendlies(updatedFriendlies);
      setPlayerHp(nextHp);

      setCombatLogs((prev) => [
        {
          id: `log_${Date.now()}_p_skill`,
          turn: turnCount,
          text: `[Turn ${turnCount} - SPD ${character.stats.spd}] ⚔️ ${character.name} used ${actionText}: ${res.logSummary}`,
          type: 'friendly',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 24),
      ]);
    } else {
      // Normal attack or Heavy slash
      const mult = actionType === 'heavy_attack' ? 1.5 : 1.0;
      const aliveEnemies = enemies.filter((e) => e.hp > 0);
      if (aliveEnemies.length === 0) return;

      const targetUnit = aliveEnemies[0];
      const { damage, isEvaded, isCritical, wardAbsorbed } = calculateDamage(
        { ...character.stats, hp: playerHp, mana: nextMana },
        {
          hp: targetUnit.hp,
          maxHp: targetUnit.maxHp,
          mana: targetUnit.mana,
          maxMana: targetUnit.maxMana,
          ward: targetUnit.ward,
          maxWard: targetUnit.maxWard,
          str: targetUnit.str || 15,
          def: targetUnit.def || 10,
          int: targetUnit.int || 15,
          wis: targetUnit.wis || 10,
          spd: targetUnit.spd,
          dex: targetUnit.dex || 10,
          unassignedPoints: 0,
        },
        'physical',
        mult
      );

      updatedEnemies = updatedEnemies.map((e) =>
        e.id === targetUnit.id ? { ...e, hp: Math.max(0, e.hp - damage) } : e
      );
      setEnemies(updatedEnemies);

      let attackLogStr = isEvaded
        ? ` [${targetUnit.name}: EVADED]`
        : ` [${targetUnit.name}: -${damage} Physical DMG${isCritical ? ' 💥CRIT' : ''}${wardAbsorbed > 0 ? ` (${wardAbsorbed} Ward)` : ''}]`;

      setCombatLogs((prev) => [
        {
          id: `log_${Date.now()}_p_atk`,
          turn: turnCount,
          text: `[Turn ${turnCount} - SPD ${character.stats.spd}] ⚔️ ${character.name} used ${actionText}:${attackLogStr}`,
          type: 'friendly',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 24),
      ]);
    }

    advanceTurn(updatedEnemies, updatedFriendlies, nextHp, nextMana);
  };

  const currentActor = turnQueue[activeActorIndex];
  const isPlayerTurn = currentActor?.type === 'player';

  const filteredLogs = combatLogs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  const handleToggleAfkGrinding = () => {
    if (!isAfkGrinding) {
      setIsAfkGrinding(true);
      setIsAutoBattle(true);
      setCombatLogs((prev) => [
        {
          id: `log_${Date.now()}_afk_on`,
          turn: turnCount,
          text: `🤖 [AFK Auto-Grind ENABLED] Auto rechallenging Floor #${currentFloor}. All combat turns automated. EXP, Gold & Loot Drop Rates are reduced to 10% (90% AFK penalty).`,
          type: 'system',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } else {
      setIsAfkGrinding(false);
      setCombatLogs((prev) => [
        {
          id: `log_${Date.now()}_afk_off`,
          turn: turnCount,
          text: `⏹️ [AFK Auto-Grind DISABLED] Returned to manual grinding. Full 100% EXP, Gold & Rates restored.`,
          type: 'system',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-5 shadow-2xl space-y-4 text-slate-100 select-none max-w-full overflow-x-hidden">
      {/* Top Header Controls Bar */}
      <CombatHeader
        currentFloor={currentFloor}
        maxFloorReached={maxFloorReached}
        isRaidMode={isRaidMode}
        isAutoBattle={isAutoBattle}
        onToggleAutoBattle={() => setIsAutoBattle(!isAutoBattle)}
        isAfkGrinding={isAfkGrinding}
        onToggleAfkGrinding={handleToggleAfkGrinding}
        isCombatActive={isCombatActive}
        onChangeFloor={(f) => {
          if (isCombatActive) {
            setActionError('🔒 Cannot change floors mid-battle! Defeat the enemies first.');
            return;
          }
          setCurrentFloor(f);
        }}
        onRetreatToCity={() => {
          if (isCombatActive) {
            setActionError('🔒 Cannot leave mid-battle! Defeat all enemies or resolve the fight first.');
            return;
          }
          onCombatEnd({
            victory: false,
            expGained: 0,
            goldGained: 0,
            itemsDropped: [],
            remainingHp: playerHp,
            remainingMana: playerMana,
            redirectToCity: true,
          });
        }}
        onRetreatToMap={() => {
          if (isCombatActive) {
            setActionError('🔒 Cannot leave mid-battle! Defeat all enemies or resolve the fight first.');
            return;
          }
          onCombatEnd({
            victory: false,
            expGained: 0,
            goldGained: 0,
            itemsDropped: [],
            remainingHp: playerHp,
            remainingMana: playerMana,
            redirectToMap: true,
          });
        }}
      />

      {/* AFK Active Session Banner */}
      {isAfkGrinding && (
        <div className="rounded-2xl border border-purple-500/50 bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-indigo-950/90 p-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg shadow-purple-950/50">
          <div className="flex items-center gap-2 text-purple-200 font-medium">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="font-bold text-purple-200">🤖 AFK Auto-Rechallenge Active (Floor #{currentFloor})</span>
            <span className="text-[10px] text-amber-300 bg-purple-900/80 px-2 py-0.5 rounded-md border border-purple-500/40 font-mono font-semibold">
              ⚡ 10% EXP, Gold & Drops Penalty
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-200">
            <span>Runs: <strong className="text-amber-300">{afkRunCount}</strong></span>
            <span>Exp: <strong className="text-emerald-300">+{afkTotalExp}</strong></span>
            <span>Gold: <strong className="text-yellow-300">+{afkTotalGold}</strong></span>
            <span>Loot: <strong className="text-sky-300">+{afkTotalItems}</strong></span>
            <button
              onClick={() => setIsAfkGrinding(false)}
              className="ml-1 rounded-lg bg-rose-950 hover:bg-rose-900 px-2.5 py-0.5 text-[10px] font-bold text-rose-200 border border-rose-500/40 cursor-pointer transition-colors"
            >
              Stop AFK
            </button>
          </div>
        </div>
      )}

      {/* Turn Order Timeline Bar */}
      <CombatTurnTimeline
        actors={turnQueue}
        currentActorId={currentActor?.id || null}
        turnNumber={turnCount}
      />

      {/* Action Error Banner */}
      {actionError && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/80 p-2.5 text-xs font-semibold text-rose-200 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}

      {/* Player Stats & Quick Vials Card */}
      <CombatPlayerStatus
        character={character}
        playerHp={playerHp}
        playerMana={playerMana}
        totalHpVials={totalHpVialCount}
        totalMpVials={totalMpVialCount}
        onUseHpVial={handleUseHpVial}
        onUseMpVial={handleUseMpVial}
      />

      {/* 5x2 Friendly vs 5x2 Hostile Combat Formations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CombatSquadGrid
          title="Friendly Squad"
          side="friendly"
          units={friendlies}
          currentActorId={currentActor?.id || null}
        />

        <CombatSquadGrid
          title="Hostile Enemies"
          side="hostile"
          units={enemies}
          currentActorId={currentActor?.id || null}
          currentFloor={currentFloor}
        />
      </div>

      {/* Battle Action Command Buttons Bar */}
      <CombatActionPanel
        character={character}
        allAvailableSkills={allAvailableSkills}
        skillCooldowns={skillCooldowns}
        playerMana={playerMana}
        isPlayerTurn={isPlayerTurn}
        isProcessingTurn={isProcessingTurn}
        currentActorName={currentActor?.name}
        onPlayerAction={handlePlayerTurnAction}
        onOpenGrimoire={() => setShowGrimoireModal(true)}
        onOpenQuickEquip={(cat, slotIdx) => {
          setEquipCategory(cat);
          setEquipSlotIndex(slotIdx);
          setShowQuickEquipModal(true);
        }}
      />

      {/* Combat Console Log */}
      <CombatConsoleLog
        logs={combatLogs}
        filter={logFilter}
        onFilterChange={setLogFilter}
      />

      {/* Victory & Loot Summary Pop-up Modal */}
      {showVictoryLootModal && victoryLootData && (
        <CombatVictoryModal
          currentFloor={currentFloor}
          victoryLootData={victoryLootData}
          consumedHpVials={consumedHpVials}
          consumedMpVials={consumedMpVials}
          playerHp={playerHp}
          playerMana={playerMana}
          inspectedLootItem={inspectedLootItem}
          onInspectItem={setInspectedLootItem}
          onNextFloor={() => {
            const nextF = currentFloor + 1;
            setCurrentFloor(nextF);
            initEncounterForFloor(nextF);
          }}
          onRechallenge={() => initEncounterForFloor(currentFloor)}
          onRetreatToMap={() => {
            setShowVictoryLootModal(false);
            onCombatEnd({
              victory: true,
              expGained: 0,
              goldGained: 0,
              itemsDropped: [],
              remainingHp: playerHp,
              remainingMana: playerMana,
              redirectToMap: true,
            });
          }}
          onRetreatToCity={() => {
            setShowVictoryLootModal(false);
            onCombatEnd({
              victory: true,
              expGained: 0,
              goldGained: 0,
              itemsDropped: [],
              remainingHp: playerHp,
              remainingMana: playerMana,
              redirectToCity: true,
            });
          }}
          characterLevel={character.level}
        />
      )}

      {/* Death & Emergency Camp Redirect Modal */}
      {showDeathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950/80 border border-rose-500/40 text-3xl">
              💀
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-rose-200">
                You Collapsed in Combat!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {deathType === 'camp'
                  ? 'Field Medics evacuated you to the Emergency Camp. You can pay 5 Gold to immediately recover 100% HP & MP!'
                  : 'Insufficient gold for Emergency Camp medics! You were transported back to Capital City Square at 1 HP & 1 MP.'}
              </p>
            </div>

            {deathType === 'camp' ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs space-y-2">
                <div className="font-bold text-amber-200">🚑 Emergency Camp Medic Fee: 5 Gold</div>
                <p className="text-[11px] text-slate-300">
                  Restores <span className="font-bold text-emerald-300">100% HP ({effectiveStats.maxHp})</span> & <span className="font-bold text-sky-300">100% MP ({effectiveStats.maxMana})</span> instantly!
                </p>
                <button
                  onClick={() => {
                    const updatedChar = {
                      ...character,
                      gold: Math.max(0, character.gold - 5),
                      stats: {
                        ...character.stats,
                        hp: effectiveStats.maxHp,
                        mana: effectiveStats.maxMana,
                      },
                    };
                    if (onUpdateCharacter) onUpdateCharacter(updatedChar);
                    setPlayerHp(effectiveStats.maxHp);
                    setPlayerMana(effectiveStats.maxMana);
                    setShowDeathModal(false);
                    initEncounterForFloor(currentFloor);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg cursor-pointer"
                >
                  🚑 Pay 5 Gold & Recover at Emergency Camp
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-3 text-xs space-y-2">
                <div className="font-bold text-sky-200">🏰 City Square Sacred Fountain</div>
                <p className="text-[11px] text-slate-300">
                  Head to Capital City Square and use the 15-second Sacred Fountain Meditation to recover 50% HP & MP for free!
                </p>
                <button
                  onClick={() => {
                    setShowDeathModal(false);
                    onCombatEnd({
                      victory: false,
                      expGained: 0,
                      goldGained: 0,
                      itemsDropped: [],
                      remainingHp: 1,
                      remainingMana: 1,
                      redirectToCity: true,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg cursor-pointer"
                >
                  🏰 Transport to City Square (Sacred Fountain)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-Combat Quick Equip Modal */}
      {showQuickEquipModal && (
        <CombatQuickEquipModal
          character={character}
          allAvailableSkills={allAvailableSkills}
          unlockedTreeSkills={unlockedTreeSkills}
          equipCategory={equipCategory || 'actives'}
          equipSlotIndex={equipSlotIndex}
          onCategoryChange={setEquipCategory}
          onSlotIndexChange={setEquipSlotIndex}
          onEquipSkill={handleEquipSkillInCombat}
          onClose={() => setShowQuickEquipModal(false)}
        />
      )}

      {/* Full Grimoire Spellbook Modal */}
      {showGrimoireModal && (
        <CombatGrimoireModal
          character={character}
          allAvailableSkills={allAvailableSkills}
          unlockedTreeSkills={unlockedTreeSkills}
          skillCooldowns={skillCooldowns}
          playerMana={playerMana}
          isPlayerTurn={isPlayerTurn}
          isProcessingTurn={isProcessingTurn}
          onCastSkill={(skId) => handlePlayerTurnAction(skId)}
          onClose={() => setShowGrimoireModal(false)}
        />
      )}
    </div>
  );
};
