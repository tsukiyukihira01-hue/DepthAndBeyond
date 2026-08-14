import { Item, Rarity } from './game';

export interface MinionSummon {
  id: string;
  name: string;
  icon: string;
  hp: number;
  maxHp: number;
  str: number;
  def: number;
  spd: number;
  tauntFrontline: boolean;
  description: string;
}

export interface RaidBossAbility {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'aoe' | 'single' | 'summon' | 'shield' | 'enrage';
  damageMultiplier?: number;
  summonMinionCount?: number;
  minionTemplate?: MinionSummon;
  shieldAmount?: number;
  channelTurns?: number;
}

export interface RaidPhase {
  phaseNumber: number;
  name: string;
  triggerHpPercent: number; // e.g. 100, 60, 25
  description: string;
  bossIcon: string;
  abilities: RaidBossAbility[];
  summonsOnEnter?: MinionSummon[];
  flatDamageBoostPercent?: number;
}

export interface RaidBoss {
  id: string;
  name: string;
  title: string;
  tier: 1 | 2 | 3;
  icon: string;
  description: string;
  recommendedLevel: number;
  baseHp: number;
  str: number;
  def: number;
  spd: number;
  enrageTurnLimit: number; // e.g. 20 turns
  dailyFightLimit?: number; // e.g. 3 attempts per day
  raidDurationSeconds?: number; // e.g. 600 seconds (10 minutes)
  summonCooldownTurns?: number; // e.g. 3 turns between boss summons
  eventExpiresAt?: string; // ISO string or time until rotation
  phases: RaidPhase[];
  lootTable: Array<{
    itemId: string;
    name: string;
    rarity: Rarity;
    dropRate: number;
    icon: string;
  }>;
}

export interface RaidSquadParticipant {
  id: string;
  name: string;
  isPlayer: boolean;
  isFamiliar?: boolean;
  isPartyMember?: boolean;
  level: number;
  classRole?: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  ward: number;
  maxWard: number;
  spd: number;
  str: number;
  def: number;
  int: number;
  statusEffects: Array<{ name: string; duration: number; icon: string }>;
  icon: string;
  damageDealt: number;
}

export interface RaidCombatState {
  boss: RaidBoss;
  bossInstanceId: string;
  currentBossHp: number;
  maxBossHp: number;
  currentPhaseIndex: number;
  activeBossShield: number;
  isEnraged: boolean;
  enrageTurnCount: number;
  activeMinions: MinionSummon[];
  squad: RaidSquadParticipant[];
  turn: number;
  turnEndsAt: number;
  combatLogs: Array<{
    id: string;
    turn: number;
    text: string;
    type: 'player' | 'boss' | 'minion' | 'phase' | 'summon' | 'warning' | 'heal' | 'crit';
    timestamp: string;
  }>;
  totalPlayerDamage: number;
  totalSquadDamage: number;
  isVictory: boolean;
  isDefeat: boolean;
}

export interface RaidLootResult {
  rankGrade: 'S' | 'A' | 'B' | 'C';
  totalDamage: number;
  damageContributionPercent: number;
  expGained: number;
  goldGained: number;
  tokensGained: number;
  guildRepGained: number;
  droppedItems: Item[];
}
