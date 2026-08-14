import { RaidBoss } from '../types/raid';

export const RAID_BOSSES: RaidBoss[] = [
  {
    id: 'boss_solar_dragon',
    name: 'Primordial Solar Dragon',
    title: 'Monarch of Apex Celestial Peak',
    tier: 1,
    icon: '🐉',
    description:
      'A majestic elemental dragon reawakened by leyline overcharge. Channels devastating Solar Flares and summons fiery Hatchlings to protect its roost.',
    recommendedLevel: 25,
    baseHp: 28000,
    str: 140,
    def: 95,
    spd: 28,
    enrageTurnLimit: 20,
    dailyFightLimit: 3,
    raidDurationSeconds: 900, // 15 minute instance expiry
    summonCooldownTurns: 3, // 3 turns between boss summons
    phases: [
      {
        phaseNumber: 1,
        name: 'Solar Awakening',
        triggerHpPercent: 100,
        description: 'The Dragon strikes with massive tail swipes and summons Solar Hatchlings.',
        bossIcon: '🐉',
        abilities: [
          {
            id: 'ab_solar_swipe',
            name: 'Solar Claw Cleave',
            icon: '🐾',
            type: 'single',
            description: 'Strikes the frontline vanguard for heavy physical fire damage.',
            damageMultiplier: 1.2,
          },
          {
            id: 'ab_hatchling_call',
            name: 'Hatchling Nest Call',
            icon: '🥚',
            type: 'summon',
            description: 'Calls 2 Solar Hatchling minion ads to shield the Dragon.',
            summonMinionCount: 2,
            minionTemplate: {
              id: 'minion_solar_hatchling',
              name: 'Solar Hatchling',
              icon: '🦎',
              hp: 1200,
              maxHp: 1200,
              str: 45,
              def: 25,
              spd: 22,
              tauntFrontline: true,
              description: 'Shields the Primordial Dragon and bites squad frontliners.',
            },
          },
        ],
        summonsOnEnter: [
          {
            id: 'minion_hatchling_1',
            name: 'Solar Hatchling Alpha',
            icon: '🦎',
            hp: 1200,
            maxHp: 1200,
            str: 50,
            def: 30,
            spd: 24,
            tauntFrontline: true,
            description: 'Frontline hatchling guarding the Solar Dragon.',
          },
        ],
      },
      {
        phaseNumber: 2,
        name: 'Sunburst Barrier',
        triggerHpPercent: 60,
        description: 'The Dragon raises a solar barrier absorbing damage and summons a Solar Fiend Commander.',
        bossIcon: '☀️',
        flatDamageBoostPercent: 20,
        abilities: [
          {
            id: 'ab_sunburst_shield',
            name: 'Sunburst Solar Aegis',
            icon: '🛡️',
            type: 'shield',
            description: 'Erects a solar barrier absorbing 2,500 damage.',
            shieldAmount: 2500,
          },
          {
            id: 'ab_commander_call',
            name: 'Summon Solar Commander',
            icon: '🔥',
            type: 'summon',
            description: 'Summons a powerful Solar Fiend Commander into the enemy row.',
            summonMinionCount: 1,
            minionTemplate: {
              id: 'minion_solar_commander',
              name: 'Solar Fiend Commander',
              icon: '👹',
              hp: 2800,
              maxHp: 2800,
              str: 85,
              def: 50,
              spd: 26,
              tauntFrontline: false,
              description: 'Commands the dragon hatchlings and attacks the backline casters.',
            },
          },
        ],
        summonsOnEnter: [
          {
            id: 'minion_solar_commander_p2',
            name: 'Solar Fiend Commander',
            icon: '👹',
            hp: 2800,
            maxHp: 2800,
            str: 85,
            def: 50,
            spd: 26,
            tauntFrontline: false,
            description: 'Commands the dragon hatchlings and attacks the backline casters.',
          },
        ],
      },
      {
        phaseNumber: 3,
        name: 'Cataclysmic Supernova',
        triggerHpPercent: 25,
        description: 'The Dragon enters absolute enrage, unleashing Cataclysmic Supernova every 3 turns!',
        bossIcon: '💥',
        flatDamageBoostPercent: 50,
        abilities: [
          {
            id: 'ab_supernova',
            name: 'Cataclysmic Supernova',
            icon: '💥',
            type: 'aoe',
            description: 'Channels a celestial explosion dealing immense fire magic damage to all squad members.',
            damageMultiplier: 2.2,
            channelTurns: 1,
          },
        ],
      },
    ],
    lootTable: [
      { itemId: 'item_solar_dragon_helm', name: 'Empyrean Dragon Crown', rarity: 'mythical', dropRate: 0.15, icon: '👑' },
      { itemId: 'item_solar_blade', name: 'Solaris Greatsword', rarity: 'legendary', dropRate: 0.3, icon: '⚔️' },
      { itemId: 'item_refining_stone_mythic', name: 'Mythic Refining Stone', rarity: 'epic', dropRate: 0.7, icon: '💎' },
      { itemId: 'item_dragon_scale', name: 'Primordial Dragon Scale', rarity: 'rare', dropRate: 1.0, icon: '🐲' },
    ],
  },

  {
    id: 'boss_malakor_shadow',
    name: 'Malakor the Shadow Sovereign',
    title: 'Monarch of Nether Vaults Abyss',
    tier: 2,
    icon: '👺',
    description:
      'An ancient nether lord wrapped in dark corruption. Commands Shadow Voidlings and drains squad mana.',
    recommendedLevel: 45,
    baseHp: 52000,
    str: 220,
    def: 140,
    spd: 32,
    enrageTurnLimit: 22,
    dailyFightLimit: 3,
    raidDurationSeconds: 900, // 15 minute instance expiry
    summonCooldownTurns: 3, // 3 turns between boss summons
    phases: [
      {
        phaseNumber: 1,
        name: 'Shadow Manifestation',
        triggerHpPercent: 100,
        description: 'Malakor weaves dark arcana and summons Shadow Voidlings.',
        bossIcon: '👺',
        abilities: [
          {
            id: 'ab_void_slash',
            name: 'Void Reaper Strike',
            icon: '🗡️',
            type: 'single',
            description: 'Strikes for heavy shadow damage.',
            damageMultiplier: 1.3,
          },
          {
            id: 'ab_voidling_summon',
            name: 'Spawn Shadow Voidlings',
            icon: '🕷️',
            type: 'summon',
            description: 'Summons 2 Shadow Voidlings.',
            summonMinionCount: 2,
            minionTemplate: {
              id: 'minion_voidling',
              name: 'Shadow Voidling',
              icon: '🕷️',
              hp: 1800,
              maxHp: 1800,
              str: 65,
              def: 35,
              spd: 28,
              tauntFrontline: true,
              description: 'Small voidling that explodes on death dealing shadow damage.',
            },
          },
        ],
        summonsOnEnter: [
          {
            id: 'minion_voidling_1',
            name: 'Shadow Voidling Prime',
            icon: '🕷️',
            hp: 1800,
            maxHp: 1800,
            str: 65,
            def: 35,
            spd: 28,
            tauntFrontline: true,
            description: 'Small voidling shielding Malakor.',
          },
        ],
      },
      {
        phaseNumber: 2,
        name: 'Abyssal Oblivion',
        triggerHpPercent: 50,
        description: 'Malakor channels shadow storm and summons Obsidian Sentinel.',
        bossIcon: '🔥',
        flatDamageBoostPercent: 35,
        abilities: [
          {
            id: 'ab_abyssal_storm',
            name: 'Abyssal Shadow Storm',
            icon: '🌩️',
            type: 'aoe',
            description: 'Deals shadow damage to all squad members.',
            damageMultiplier: 1.6,
          },
        ],
        summonsOnEnter: [
          {
            id: 'minion_obsidian_sentinel',
            name: 'Obsidian Guard Sentinel',
            icon: '🗿',
            hp: 4500,
            maxHp: 4500,
            str: 110,
            def: 90,
            spd: 20,
            tauntFrontline: true,
            description: 'Heavily armored sentinel shielding Malakor.',
          },
        ],
      },
    ],
    lootTable: [
      { itemId: 'item_shadow_ring', name: 'Sovereign Nether Band', rarity: 'mythical', dropRate: 0.12, icon: '💍' },
      { itemId: 'item_malakor_staff', name: 'Malakor Shadow Staff', rarity: 'legendary', dropRate: 0.35, icon: '🪄' },
      { itemId: 'item_obsidian_shard', name: 'Obsidian Shard Core', rarity: 'rare', dropRate: 1.0, icon: '⬛' },
    ],
  },
];

export const getRemainingDailyRaidAttempts = (character: { dailyRaidAttemptsUsed?: number; lastRaidResetDate?: string }, maxLimit: number = 3): number => {
  const today = new Date().toISOString().split('T')[0];
  if (character.lastRaidResetDate !== today) {
    return maxLimit;
  }
  const used = character.dailyRaidAttemptsUsed || 0;
  return Math.max(0, maxLimit - used);
};

export const getSecondsUntilDailyReset = (): number => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
};

export const formatTimeSeconds = (totalSecs: number): string => {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export interface RaidEventStatus {
  isActive: boolean;
  activeSecondsRemaining: number;
  secondsUntilNextEvent: number;
  timerFormatted: string;
}

/**
 * Calculates Raid Event Spawn Status.
 * Raid events spawn every 6 hours starting from 00:00 UTC (00:00, 06:00, 12:00, 18:00 UTC).
 * Each raid event stays active for 1 hour (3600 seconds).
 */
export const getRaidEventStatus = (): RaidEventStatus => {
  const now = new Date();
  const utcMs = now.getTime();
  const cycleMs = 6 * 3600 * 1000; // 6 hours
  const activeMs = 1 * 3600 * 1000; // 1 hour active event

  const startOfTodayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const msIntoToday = utcMs - startOfTodayUtc;
  const msIntoCycle = msIntoToday % cycleMs;

  const isActive = msIntoCycle < activeMs;
  const activeSecondsRemaining = isActive ? Math.max(0, Math.floor((activeMs - msIntoCycle) / 1000)) : 0;
  const secondsUntilNextEvent = isActive ? 0 : Math.max(0, Math.floor((cycleMs - msIntoCycle) / 1000));

  const secsToFormat = isActive ? activeSecondsRemaining : secondsUntilNextEvent;

  return {
    isActive,
    activeSecondsRemaining,
    secondsUntilNextEvent,
    timerFormatted: formatTimeSeconds(secsToFormat),
  };
};


