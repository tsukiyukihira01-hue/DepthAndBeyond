import { CharacterStats, Item, Rarity, EquipmentSlot, PoeItemRarity } from '../types/game';
import equipmentDatabase from '../data/equipments.json';
import { getClassDefinition } from '../data/classesAndArchetypes';
import { createPoeEquipmentItem } from './poeItemUtils';
import { POE_BASE_TEMPLATES } from '../data/poeItemsData';
import {
  getMonstersForFloor,
  getBossForFloor,
  shouldSpawnRandomBoss,
} from '../data/monsterPool';

// Stat multipliers for easy game balance tweaks
export const BALANCE = {
  STR_PHYS_DMG: 2.2,
  INT_MAG_DMG: 2.4,
  DEF_REDUCTION_SCALE: 150, // damage = dmg * (150 / (150 + def))
  WIS_REDUCTION_SCALE: 160, // mag damage = dmg * (160 / (160 + wis))
  BASE_EVASION_CAP: 0.30,   // Max 30% evasion from DEX vs SPD
  SKILL_EVASION_CAP: 0.40,  // Max 40% with skills
  FAMILIAR_BASE_PROTECT_CAP: 0.35, // Cap familiar protection at 35% base
  FAMILIAR_MAX_PROTECT_CAP: 0.45,  // Up to 45% with skills
  EXP_PARTY_LEVEL_DIFF_LIMIT: 20,  // Max 20 level difference for party EXP
  ENCHANT_MAX_LEVEL: 20,
};

/**
 * Calculates Physical or Magical damage output given stats and defender stats.
 */
export function calculateDamage(
  attackerStats: CharacterStats,
  defenderStats: CharacterStats,
  damageType: 'physical' | 'magical',
  skillMultiplier: number = 1.0,
  ignoreArmorPercent: number = 0
) {
  // Hit / Evasion check based on SPD vs DEX
  const spdDiff = attackerStats.spd - defenderStats.dex;
  let evasionChance = Math.max(0.05, 0.20 - spdDiff * 0.005);
  evasionChance = Math.min(BALANCE.BASE_EVASION_CAP, evasionChance);

  const isEvaded = Math.random() < evasionChance;
  if (isEvaded) {
    return { damage: 0, isEvaded: true, isCritical: false, wardAbsorbed: 0 };
  }

  // Base damage calculation
  let rawDmg = 0;
  if (damageType === 'physical') {
    rawDmg = (attackerStats.str * BALANCE.STR_PHYS_DMG + attackerStats.dex * 0.5) * skillMultiplier;
    const effectiveDef = defenderStats.def * (1 - ignoreArmorPercent);
    rawDmg *= BALANCE.DEF_REDUCTION_SCALE / (BALANCE.DEF_REDUCTION_SCALE + effectiveDef);
  } else {
    rawDmg = (attackerStats.int * BALANCE.INT_MAG_DMG + attackerStats.wis * 0.4) * skillMultiplier;
    rawDmg *= BALANCE.WIS_REDUCTION_SCALE / (BALANCE.WIS_REDUCTION_SCALE + defenderStats.wis);
  }

  // Critical hit check (based on DEX)
  const critChance = Math.min(0.50, 0.05 + attackerStats.dex * 0.002);
  const isCritical = Math.random() < critChance;
  if (isCritical) {
    rawDmg *= 1.5;
  }

  let finalDamage = Math.max(1, Math.round(rawDmg));

  // Ward absorption logic
  let wardAbsorbed = 0;
  if (defenderStats.ward > 0) {
    if (defenderStats.ward >= finalDamage) {
      wardAbsorbed = finalDamage;
      finalDamage = 0;
    } else {
      wardAbsorbed = defenderStats.ward;
      finalDamage -= defenderStats.ward;
    }
  }

  return { damage: finalDamage, isEvaded: false, isCritical, wardAbsorbed };
}

/**
 * Anti-cheat cap: Server estimates max possible DPS for a character to detect damage injection.
 */
export function calcMaxDPS(stats: CharacterStats): number {
  const physDmg = stats.str * BALANCE.STR_PHYS_DMG * 2.5; // Max heavy attack
  const magDmg = stats.int * BALANCE.INT_MAG_DMG * 2.5;
  return Math.max(physDmg, magDmg) * 2; // Upper bound cap
}

/**
 * Dynamic Raid Boss HP scaling formula as specified in user prompt.
 */
export function calcRaidBossMaxHP(
  baseHp: number,
  tier: 1 | 2 | 3,
  playerCount: number,
  avgPlayerLevel: number
): number {
  const TIER_MULT = tier === 1 ? 1.0 : tier === 2 ? 2.5 : 6.0;
  const count = Math.max(1, playerCount);
  const scalingFactor = 1 + (count - 1) * Math.pow(0.35, 0.7);
  const levelFactor = 1 + avgPlayerLevel * 0.015;

  return Math.round(baseHp * TIER_MULT * scalingFactor * levelFactor);
}

/**
 * Calculates equipment enchantment success rate from +1 to +20.
 */
export function getEnchantSuccessRate(currentLevel: number): number {
  if (currentLevel >= BALANCE.ENCHANT_MAX_LEVEL) return 0;
  // +1 starts at 90%, drops to 3.5% at +20
  const rates: Record<number, number> = {
    0: 0.90, // To +1
    1: 0.85,
    2: 0.80,
    3: 0.75,
    4: 0.70,
    5: 0.65,
    6: 0.60,
    7: 0.55,
    8: 0.50,
    9: 0.45,
    10: 0.40,
    11: 0.35,
    12: 0.30,
    13: 0.25,
    14: 0.20,
    15: 0.15,
    16: 0.10,
    17: 0.08,
    18: 0.05,
    19: 0.035, // To +20
  };
  return rates[currentLevel] ?? 0.035;
}

/**
 * Calculates party EXP distribution with diminishing returns for level differences > 20.
 */
export function calculatePartyExp(
  baseExp: number,
  monsterLevel: number,
  playerLevel: number,
  partyLevels: number[]
): number {
  const maxPartyLevel = Math.max(...partyLevels);
  const minPartyLevel = Math.min(...partyLevels);

  if (maxPartyLevel - minPartyLevel > BALANCE.EXP_PARTY_LEVEL_DIFF_LIMIT) {
    if (playerLevel < maxPartyLevel - BALANCE.EXP_PARTY_LEVEL_DIFF_LIMIT) {
      return 0; // Low level player gets 0 exp to prevent boosting exploit
    }
  }

  const count = partyLevels.length;
  const partyBonus = 1 + (count - 1) * 0.15; // +15% per extra party member
  const share = (baseExp * partyBonus) / count;

  // Level difference vs monster modifier
  const diff = monsterLevel - playerLevel;
  let levelMod = 1.0;
  if (diff > 10) levelMod = 0.5; // Monster too high
  if (diff < -20) levelMod = 0.1; // Monster too low

  return Math.round(share * levelMod);
}

/**
 * Rarity tier rank ordering for sorting and auto-dismantle filters.
 */
export const RARITY_ORDER: Record<Rarity, number> = {
  garbage: 1,
  common: 2,
  uncommon: 3,
  rare: 4,
  epic: 5,
  legendary: 6,
  mythical: 7,
  godly: 8,
};

/**
 * Monster EXP Gain Formula based on monster count and levels:
 * - 1 monster at Level 1 = 30 EXP
 * - 2 monsters at Level 1 = 70 EXP
 * - 3 monsters at Level 1 = 130 EXP
 *
 * Mathematical Formula:
 * Base EXP per monster i = 30 * Level_i * TierScale (Boss = 3.8x)
 * Multi-Monster Combo Bonus = 10 * AvgLevel * (N - 1)^2 * TierScale
 */
export function calculateMonsterEncounterExp(
  enemies: Array<{ level: number; isBoss?: boolean }>
): number {
  if (!enemies || enemies.length === 0) return 35;

  const N = enemies.length;
  let totalBaseExp = 0;
  let totalLevel = 0;

  for (const enemy of enemies) {
    const lvl = Math.max(1, enemy.level || 1);
    totalLevel += lvl;

    const baseExpForLevel = 35 * Math.pow(1.20, lvl - 1);

    let tierScale = 1.0;
    if (lvl > 30) {
      tierScale = Math.pow(1 + (lvl - 30) * 0.12, 1.8);
    }

    if (enemy.isBoss) {
      totalBaseExp += Math.round(baseExpForLevel * 3.8 * Math.sqrt(tierScale));
    } else {
      totalBaseExp += Math.round(baseExpForLevel * Math.sqrt(tierScale));
    }
  }

  const avgLevel = totalLevel / N;
  let avgTierScale = 1.0;
  if (avgLevel > 30) {
    avgTierScale = Math.pow(1 + (avgLevel - 30) * 0.12, 1.8);
  }

  const comboBonus = Math.round(12 * avgLevel * Math.pow(N - 1, 2) * Math.sqrt(avgTierScale));

  return Math.max(35, totalBaseExp + comboBonus);
}

/**
 * Challenge Dungeon Floor Encounter Generator (Floors 1 to 100+)
 * Uses dynamic Monster Pool and Boss Pool with random Boss spawn chance!
 */
export function generateDungeonFloorEncounter(floorNumber: number) {
  const floor = Math.max(1, Math.min(100, floorNumber));
  const isGuaranteedBossFloor = floor % 10 === 0;
  const isAmbushBoss = !isGuaranteedBossFloor && shouldSpawnRandomBoss(floor);
  const isBossEncounter = isGuaranteedBossFloor || isAmbushBoss;

  let scaleFactor = 1.0;
  if (floor > 30) {
    const extraFloors = floor - 30;
    scaleFactor = Math.pow(1 + extraFloors * 0.12, 1.8);
  }

  const baseLevel = floor;
  const baseHp = Math.round((90 + floor * 40) * scaleFactor);
  const baseAtk = Math.round((14 + floor * 7) * (1 + (scaleFactor - 1) * 0.5));
  const baseDef = Math.round((6 + floor * 2.8) * (1 + (scaleFactor - 1) * 0.4));
  const baseSpeed = Math.round(10 + floor * 0.4);

  const baseGoldReward = Math.round((30 + floor * 25) * scaleFactor);

  if (isBossEncounter) {
    // Boss Encounter: 1 Boss from Boss Pool + 1 to 3 Minions/Monsters from Monster Pool
    const bossTemplate = getBossForFloor(floor);
    const m = bossTemplate.statMultipliers;

    const bossHp = Math.round(baseHp * m.hp);
    const bossAtk = Math.round(baseAtk * m.str);
    const bossDef = Math.round(baseDef * m.def);
    const bossSpd = Math.round(baseSpeed * m.spd + 4);
    const bossInt = Math.round(baseAtk * m.int);
    const bossWis = Math.round(baseDef * m.wis);
    const bossWard = Math.round(floor * 25 * scaleFactor * m.ward);

    const bossUnit = {
      id: `boss_f${floor}_${Date.now()}`,
      name: isAmbushBoss
        ? `⚠️ [AMBUSH BOSS] ${bossTemplate.name}`
        : `👑 [Floor ${floor} BOSS] ${bossTemplate.name}`,
      isPlayer: false,
      isBoss: true,
      level: baseLevel + (isGuaranteedBossFloor ? 2 : 1),
      hp: bossHp,
      maxHp: bossHp,
      mana: 600,
      maxMana: 600,
      ward: bossWard,
      maxWard: bossWard,
      spd: bossSpd,
      str: bossAtk,
      def: bossDef,
      int: bossInt,
      wis: bossWis,
      statusEffects: [],
      icon: bossTemplate.icon,
      team: 'enemy' as const,
    };

    // Accompanying Monsters/Minions (1 to 3 monsters from the Monster Pool)
    const minionCount = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
    const minionTemplates = getMonstersForFloor(floor, minionCount);

    const minionUnits = minionTemplates.map((t, idx) => {
      const sm = t.statMultipliers;
      const mHp = Math.round(baseHp * 0.85 * sm.hp);
      const mAtk = Math.round(baseAtk * 0.8 * sm.str);
      const mDef = Math.round(baseDef * 0.8 * sm.def);
      const mSpd = Math.round(baseSpeed * sm.spd);

      return {
        id: `minion_f${floor}_${idx}_${Date.now()}`,
        name: `${t.name} ${String.fromCharCode(65 + idx)}`,
        isPlayer: false,
        isBoss: false,
        level: baseLevel,
        hp: mHp,
        maxHp: mHp,
        mana: Math.round(120 * sm.int),
        maxMana: Math.round(120 * sm.int),
        ward: 0,
        maxWard: 0,
        spd: mSpd,
        str: mAtk,
        def: mDef,
        int: Math.round(baseAtk * 0.8 * sm.int),
        wis: Math.round(baseDef * 0.8 * sm.wis),
        statusEffects: [],
        icon: t.icon,
        team: 'enemy' as const,
      };
    });

    const enemies = [bossUnit, ...minionUnits];
    const baseExp = calculateMonsterEncounterExp(enemies);
    const expReward = Math.round(baseExp * (isAmbushBoss ? 1.6 : 1.2));
    const goldReward = Math.round(baseGoldReward * (isGuaranteedBossFloor ? 4.5 : 3.2));

    return {
      isBossFloor: isGuaranteedBossFloor,
      isAmbushBoss,
      enemies,
      expReward,
      goldReward,
      bossAura: bossTemplate.bossAura,
      bossTitle: bossTemplate.title,
    };
  } else {
    // Standard Non-Boss Floor: 1 to 4 monsters selected from Monster Pool
    const mobCount = 1 + Math.floor(Math.random() * 3); // 1 to 3 monsters
    const templates = getMonstersForFloor(floor, mobCount);

    // Track name frequencies to add A, B, C suffixes if duplicate names appear
    const nameCounts: Record<string, number> = {};
    templates.forEach((t) => {
      nameCounts[t.name] = (nameCounts[t.name] || 0) + 1;
    });
    const currentNameIndex: Record<string, number> = {};

    const enemies = templates.map((t, idx) => {
      const levelVar = Math.floor(Math.random() * 3) - 1;
      const mobLevel = Math.max(1, baseLevel + levelVar);
      const hpVar = 0.9 + Math.random() * 0.2;
      const sm = t.statMultipliers;

      const mobHp = Math.round(baseHp * sm.hp * hpVar);
      const mobAtk = Math.round(baseAtk * sm.str * (0.9 + Math.random() * 0.2));
      const mobDef = Math.round(baseDef * sm.def * (0.9 + Math.random() * 0.2));
      const mobSpd = Math.round(baseSpeed * sm.spd) + idx;

      let displayName = t.name;
      if (nameCounts[t.name] > 1) {
        const charCode = 65 + (currentNameIndex[t.name] || 0);
        displayName = `${t.name} ${String.fromCharCode(charCode)}`;
        currentNameIndex[t.name] = (currentNameIndex[t.name] || 0) + 1;
      }

      return {
        id: `mob_f${floor}_${idx}_${Date.now()}`,
        name: displayName,
        isPlayer: false,
        isBoss: false,
        level: mobLevel,
        hp: mobHp,
        maxHp: mobHp,
        mana: Math.round(100 * sm.int),
        maxMana: Math.round(100 * sm.int),
        ward: 0,
        maxWard: 0,
        spd: mobSpd,
        str: mobAtk,
        def: mobDef,
        int: Math.round(baseAtk * sm.int * (0.9 + Math.random() * 0.2)),
        wis: Math.round(baseDef * sm.wis * (0.9 + Math.random() * 0.2)),
        statusEffects: [],
        icon: t.icon,
        team: 'enemy' as const,
      };
    });

    const expReward = calculateMonsterEncounterExp(enemies);

    return {
      isBossFloor: false,
      isAmbushBoss: false,
      enemies,
      expReward,
      goldReward: Math.round(baseGoldReward * mobCount * 0.85),
    };
  }
}

function getMinionNameForFloor(floor: number): string {
  if (floor <= 30) return 'Solar Temple Minion';
  if (floor <= 60) return 'Shadowland Cultist';
  return 'Abyssal Void Horror';
}

function getMonsterIconForFloor(floor: number): string {
  if (floor <= 10) return '🐺';
  if (floor <= 20) return '💀';
  if (floor <= 30) return '🛡️';
  if (floor <= 40) return '👻';
  if (floor <= 50) return '🦎';
  if (floor <= 60) return '🐍';
  if (floor <= 70) return '🧊';
  if (floor <= 80) return '👁️';
  if (floor <= 90) return '⚔️';
  return '👹';
}

export interface LootDropResult {
  gold: number;
  exp: number;
  petExp: number;
  items: Item[];
}

/**
 * Multi-Monster Gold Formula Generator
 * - Base Gold per monster = (20 + level * 15) * (isBoss ? 4.5 : 1.0)
 * - Multi-Monster Combo Multiplier = 1 + 0.35 * (N - 1)
 */
export function calculateMonsterEncounterGold(
  enemies: Array<{ level: number; isBoss?: boolean }>
): number {
  if (!enemies || enemies.length === 0) return 25;

  const N = enemies.length;
  let baseGoldSum = 0;

  for (const enemy of enemies) {
    const lvl = Math.max(1, enemy.level || 1);
    const goldPerMob = (20 + lvl * 15) * (enemy.isBoss ? 4.5 : 1.0);
    baseGoldSum += goldPerMob;
  }

  const multiMobMultiplier = 1 + 0.35 * (N - 1);
  return Math.round(baseGoldSum * multiMobMultiplier);
}

/**
 * Dynamic Equipment Drop Formula Generator
 * Calculates equipment drop chance and generates equipment items based on monster count, floor, and difficulty.
 * Features an exclusive, highly rewarding rarity occurrence system where Legendary and Godly items remain rare chase rewards.
 */
export function generateEquipmentLoot(
  floor: number,
  isBoss: boolean,
  enemies?: Array<{ level: number; isBoss?: boolean }>,
  isAfkMode: boolean = false
): LootDropResult['items'][0] | null {
  const N = enemies ? enemies.length : 1;
  
  // 1. Calculate Equipment Drop Chance (scaled to 10% in AFK Mode)
  // Bosses guarantee high equipment drop rates (85%), regular mobs have a rewarding ~18% base chance.
  const baseRate = isBoss ? 0.85 : 0.18;
  const multiMobBonus = (N - 1) * 0.04;
  const rawDropChance = Math.min(0.95, baseRate + multiMobBonus);
  const totalDropChance = isAfkMode ? rawDropChance * 0.10 : rawDropChance;
  
  if (Math.random() > totalDropChance) {
    return null; // No equipment dropped
  }

  // 2. Exclusive Rarity Roll System (0-100 base score + Floor/Boss Luck Modifiers)
  const baseRoll = Math.random() * 100;
  
  // Luck Shift Bonuses
  const floorBonus = Math.min(10.0, floor * 0.08); // Max +10 for deep dungeon floors (floor 125+)
  const bossBonus = isBoss ? (floor >= 90 ? 25.0 : floor >= 50 ? 18.0 : 12.0) : 0;
  const multiBonus = Math.min(4.0, (N - 1) * 1.0);
  
  const totalLuckScore = baseRoll + floorBonus + bossBonus + multiBonus;

  let rarity: Rarity = 'common';

  // Strict & Rewarding Thresholds
  if (totalLuckScore >= 107.5) {
    rarity = 'godly'; // Apex Divine Artifact (~0.08% base, ~25% on Floor 90+ Apex Boss)
  } else if (totalLuckScore >= 102.0) {
    rarity = 'mythical'; // Sovereign Relic (~0.5% base, ~18% on high bosses)
  } else if (totalLuckScore >= 96.0) {
    rarity = 'legendary'; // Ancient Masterpiece (~1.8% base, ~28% on bosses)
  } else if (totalLuckScore >= 88.0) {
    rarity = 'epic'; // Elemental Infused (~6.5% base)
  } else if (totalLuckScore >= 75.0) {
    rarity = 'rare'; // Specialized Adventurer (~15.0% base)
  } else if (totalLuckScore >= 48.0) {
    rarity = 'uncommon'; // Sturdy Steel (~28.0% base)
  } else if (totalLuckScore >= 15.0 || floor > 15) {
    rarity = 'common'; // Novice Iron
  } else {
    rarity = 'garbage'; // Scrap gear (decaying to 0% past floor 15)
  }

  // Multiplier scale for stats based on floor and rarity
  const rarityMult =
    rarity === 'godly' ? 7.5 :
    rarity === 'mythical' ? 5.2 :
    rarity === 'legendary' ? 3.8 :
    rarity === 'epic' ? 2.6 :
    rarity === 'rare' ? 1.85 :
    rarity === 'uncommon' ? 1.35 :
    rarity === 'garbage' ? 0.4 : 1.0;

  const statBase = Math.round((10 + floor * 2.5) * rarityMult);

  // 3. Modular Equipment Selection from Database
  const availableTemplates = equipmentDatabase.equipments.filter((eq: any) => eq.rarity === rarity);
  const template = availableTemplates.length > 0
    ? availableTemplates[Math.floor(Math.random() * availableTemplates.length)]
    : equipmentDatabase.equipments[Math.floor(Math.random() * equipmentDatabase.equipments.length)];

  // Base stats scaling
  let baseStats: Partial<Record<keyof CharacterStats, number>> = {};
  if (template.baseStats) {
    for (const [k, v] of Object.entries(template.baseStats)) {
      if (typeof v === 'number') {
        if (v < 0) {
          baseStats[k as keyof CharacterStats] = -Math.round(Math.abs(v) * (rarityMult * 0.6));
        } else {
          baseStats[k as keyof CharacterStats] = Math.max(1, Math.round(v * rarityMult * (1 + floor * 0.05)));
        }
      }
    }
  } else {
    if (template.weaponType === 'magical') {
      baseStats = {
        int: Math.round(statBase * 1.0),
        wis: Math.round(statBase * 0.7),
        spd: Math.round(statBase * 0.3),
      };
    } else {
      baseStats = {
        str: Math.round(statBase * 1.0),
        def: Math.round(statBase * 0.7),
        spd: Math.round(statBase * 0.3),
      };
    }
  }

  const enchantPlus = rarity === 'garbage' ? 0 : Math.min(10, Math.floor(floor / 10));
  const itemName = enchantPlus > 0 ? `${template.name} +${enchantPlus}` : template.name;

  // Map RPG rarity to PoE Item Rarity
  const poeRarityType: 'normal' | 'magic' | 'rare' =
    rarity === 'godly' || rarity === 'legendary' || rarity === 'mythical' || rarity === 'rare' || rarity === 'epic'
      ? 'rare'
      : rarity === 'uncommon'
      ? 'magic'
      : 'normal';

  const matchingPoeTemplate =
    POE_BASE_TEMPLATES.find((t) => t.slot === (template.slot as any)) ||
    POE_BASE_TEMPLATES[Math.floor(Math.random() * POE_BASE_TEMPLATES.length)];

  const poeItem = createPoeEquipmentItem(matchingPoeTemplate, poeRarityType);

  return {
    ...poeItem,
    id: `loot_gear_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    enchantLevel: enchantPlus,
    baseStats: baseStats || poeItem.baseStats,
    valueGold: Math.round(250 * rarityMult * (1 + floor * 0.1)),
    description: template.description || poeItem.description,
  };
}

/**
 * Probability Loot Formula Generator based on Floor, Boss status, enemies, and pet fight participation
 */
export function generateLootForEncounter(
  floor: number,
  isBoss: boolean,
  enemies?: Array<{ level: number; isBoss?: boolean }>,
  hasPetInFight: boolean = false,
  isAfkMode: boolean = false
): LootDropResult {
  const isHighTier = floor > 30;
  const items: LootDropResult['items'] = [];
  const N = enemies ? enemies.length : 1;
  const afkRate = isAfkMode ? 0.10 : 1.0;

  // 1. Dynamic Gold Gain Formula (Multi-monster non-flat scaling, 10% in AFK)
  const rawGold = enemies && enemies.length > 0
    ? calculateMonsterEncounterGold(enemies)
    : Math.round((25 + floor * 20) * (isBoss ? 4.5 : 1.0));
  const baseGold = Math.max(1, Math.round(rawGold * afkRate));
  
  // 2. Exp Formula using monster count & levels (10% in AFK)
  const rawExp = enemies && enemies.length > 0
    ? calculateMonsterEncounterExp(enemies)
    : Math.round((30 + floor * 30) * (isBoss ? 3.8 : 1.0));
  const baseExp = Math.max(1, Math.round(rawExp * afkRate));

  // Pet Companion EXP is strictly 0 if no pet was equipped and in fight!
  const petExp = hasPetInFight ? Math.round(baseExp * 0.5) : 0;

  // 3. Health Vials Drop (10% drop chance in AFK Mode)
  const hpDropChance = Math.min(0.95, (0.45 + (N - 1) * 0.15) * afkRate);
  if (isBoss || Math.random() < hpDropChance) {
    const qty = isBoss
      ? 5 + Math.floor(Math.random() * 6)
      : Math.max(2, N) + Math.floor(Math.random() * 3);
    items.push({
      id: `loot_hp_${Date.now()}_${Math.random()}`,
      name: isHighTier ? 'Empowered Health Potion' : 'Novice Health Vial',
      type: 'consumable',
      rarity: isHighTier ? 'uncommon' : 'common',
      quantity: qty,
      icon: '🧪',
      description: `Restores ${isHighTier ? 500 : 250} HP instantly.`,
      levelReq: 1,
      enchantLevel: 0,
      valueGold: 25,
      stackable: true,
    });
  }

  // 4. Mana Vials Drop (10% drop chance in AFK Mode)
  const mpDropChance = Math.min(0.95, (0.45 + (N - 1) * 0.15) * afkRate);
  if (isBoss || Math.random() < mpDropChance) {
    const qty = isBoss
      ? 5 + Math.floor(Math.random() * 6)
      : Math.max(2, N) + Math.floor(Math.random() * 3);
    items.push({
      id: `loot_mp_${Date.now()}_${Math.random()}`,
      name: isHighTier ? 'Empowered Mana Potion' : 'Novice Mana Vial',
      type: 'consumable',
      rarity: isHighTier ? 'uncommon' : 'common',
      quantity: qty,
      icon: '💧',
      description: `Restores ${isHighTier ? 500 : 250} MP instantly.`,
      levelReq: 1,
      enchantLevel: 0,
      valueGold: 25,
      stackable: true,
    });
  }

  // 5. Monster Core / Material (10% drop chance in AFK Mode)
  const coreDropChance = Math.min(0.90, (0.35 + (N - 1) * 0.15) * afkRate);
  if (isBoss || Math.random() < coreDropChance) {
    items.push({
      id: `loot_core_${Date.now()}_${Math.random()}`,
      name: isBoss ? `[Apex Floor ${floor}] Dragon Core` : `Floor ${floor} Monster Essence`,
      type: 'material',
      rarity: isBoss ? 'epic' : 'uncommon',
      quantity: isBoss ? 2 : Math.min(3, N),
      icon: isBoss ? '🔮' : '💎',
      description: 'Rare crafting material used for gear enchantment & alchemy.',
      levelReq: 1,
      enchantLevel: 0,
      valueGold: 100,
      stackable: true,
    });
  }

  // 6. Dynamic Equipment Drop Formula (Passes isAfkMode)
  const gearItem = generateEquipmentLoot(floor, isBoss, enemies, isAfkMode);
  if (gearItem) {
    items.push(gearItem);
  }

  // 7. Pet Egg / Seal Drop (10% drop chance in AFK Mode)
  const sealChance = (isBoss ? 0.25 : Math.min(0.12, 0.03 + (N - 1) * 0.015)) * afkRate;
  if (Math.random() < sealChance) {
    const sealRoll = Math.random() * 100 + (isBoss ? (floor >= 50 ? 15 : 10) : 0);
    let sealRarity: Rarity = 'rare';
    if (sealRoll >= 108.0) sealRarity = 'godly';
    else if (sealRoll >= 102.0) sealRarity = 'mythical';
    else if (sealRoll >= 92.0) sealRarity = 'legendary';
    else if (sealRoll >= 72.0) sealRarity = 'epic';
    else sealRarity = 'rare';

    items.push({
      id: `loot_seal_${Date.now()}_${Math.random()}`,
      name: `${sealRarity.toUpperCase()} Pet Seal: Celestial Companion`,
      type: 'box',
      rarity: sealRarity,
      quantity: 1,
      icon: '🥚',
      description: `Hatch in Pet Sanctuary to summon a loyal ${sealRarity.toUpperCase()} pet companion!`,
      levelReq: 1,
      enchantLevel: 0,
      valueGold: 500,
      stackable: false,
    });
  }

  return {
    gold: baseGold,
    exp: baseExp,
    petExp,
    items,
  };
}

/**
 * Maximum quantity allowed per item stack slot (99,999x)
 */
export const MAX_STACK_QUANTITY = 99999;

/**
 * Checks if two items are stackable together in inventory.
 * Items with baseStats, enchantLevels, or assigned gear slots cannot be stacked.
 */
export function isStackableWith(itemA: Item, itemB: Item): boolean {
  if (!itemA || !itemB) return false;
  const isAStackable = itemA.stackable || itemA.type === 'consumable' || itemA.type === 'material' || itemA.type === 'core' || itemA.type === 'stone' || itemA.type === 'box' || itemA.type === 'voucher';
  const isBStackable = itemB.stackable || itemB.type === 'consumable' || itemB.type === 'material' || itemB.type === 'core' || itemB.type === 'stone' || itemB.type === 'box' || itemB.type === 'voucher';
  if (!isAStackable || !isBStackable) return false;

  // Equipment gear or items with enchantments or stats cannot be stacked
  if (
    itemA.type === 'gear' || itemB.type === 'gear' ||
    (itemA as any).type === 'weapon' || (itemB as any).type === 'weapon' ||
    (itemA as any).type === 'armor' || (itemB as any).type === 'armor' ||
    itemA.slot || itemB.slot
  ) return false;
  if ((itemA.enchantLevel || 0) > 0 || (itemB.enchantLevel || 0) > 0) return false;
  if (itemA.baseStats || itemB.baseStats) return false;

  return (
    itemA.name.trim().toLowerCase() === itemB.name.trim().toLowerCase() &&
    itemA.type === itemB.type &&
    itemA.rarity === itemB.rarity
  );
}

/**
 * Safely adds an item or stack of items into an inventory array up to MAX_STACK_QUANTITY (99,999x per stack).
 * Prevents item loss, duplication, or invalid negative quantities.
 */
export function addItemToInventory(
  inventory: Array<Item | null>,
  itemToAdd: Item,
  inventoryLimit: number = 9999
): { updatedInventory: Array<Item | null>; addedQuantity: number; remainingQuantity: number } {
  const inv = inventory.map((slot) => (slot ? { ...slot } : null));
  let qtyToAdd = Math.max(1, itemToAdd.quantity || 1);
  const initialQty = qtyToAdd;

  const isStackableItem = itemToAdd.stackable || itemToAdd.type === 'consumable' || itemToAdd.type === 'material' || itemToAdd.type === 'core' || itemToAdd.type === 'stone' || itemToAdd.type === 'box' || itemToAdd.type === 'voucher';

  // 1. Try to stack onto existing matching items first
  if (isStackableItem) {
    for (let i = 0; i < inv.length; i++) {
      const current = inv[i];
      if (current && isStackableWith(current, itemToAdd)) {
        const currentQty = Math.max(1, current.quantity || 1);
        if (currentQty < MAX_STACK_QUANTITY) {
          const spaceLeft = MAX_STACK_QUANTITY - currentQty;
          const amount = Math.min(qtyToAdd, spaceLeft);
          current.quantity = currentQty + amount;
          current.stackable = true;
          qtyToAdd -= amount;
          if (qtyToAdd <= 0) break;
        }
      }
    }
  }

  // 2. Place remaining quantity into empty slots
  while (qtyToAdd > 0) {
    const emptyIndex = inv.findIndex((slot) => slot === null);
    if (emptyIndex !== -1 && emptyIndex < inventoryLimit) {
      const placedQty = isStackableItem ? Math.min(qtyToAdd, MAX_STACK_QUANTITY) : 1;
      inv[emptyIndex] = {
        ...itemToAdd,
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        quantity: placedQty,
        stackable: isStackableItem,
      };
      qtyToAdd -= placedQty;
    } else if (inv.length < inventoryLimit) {
      const placedQty = isStackableItem ? Math.min(qtyToAdd, MAX_STACK_QUANTITY) : 1;
      inv.push({
        ...itemToAdd,
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        quantity: placedQty,
        stackable: isStackableItem,
      });
      qtyToAdd -= placedQty;
    } else {
      // Inventory is completely full
      break;
    }
  }

  return {
    updatedInventory: inv,
    addedQuantity: initialQty - qtyToAdd,
    remainingQuantity: qtyToAdd,
  };
}

/**
 * Compacts and sanitizes inventory array:
 * - Removes items with quantity <= 0
 * - Clamps item quantities between 1 and 99,999
 * - Merges duplicate unmerged stacks if possible
 * - Prevents duplication glitches
 */
export function sanitizeAndStackInventory(
  inventory: Array<Item | null>,
  inventoryLimit: number = 9999
): Array<Item | null> {
  const cleanInv: Array<Item | null> = [];

  for (const rawSlot of inventory) {
    if (!rawSlot) continue;
    if (typeof rawSlot.quantity === 'number' && rawSlot.quantity <= 0) continue;

    const slot: Item = {
      ...rawSlot,
      quantity: Math.min(MAX_STACK_QUANTITY, Math.max(1, rawSlot.quantity || 1)),
    };

    let merged = false;
    const isStackableItem = slot.stackable || slot.type === 'consumable' || slot.type === 'material' || slot.type === 'core' || slot.type === 'stone' || slot.type === 'box' || slot.type === 'voucher';

    if (isStackableItem) {
      for (const existing of cleanInv) {
        if (existing && isStackableWith(existing, slot)) {
          const spaceLeft = MAX_STACK_QUANTITY - existing.quantity;
          if (spaceLeft > 0) {
            const addAmount = Math.min(slot.quantity, spaceLeft);
            existing.quantity += addAmount;
            slot.quantity -= addAmount;
            if (slot.quantity <= 0) {
              merged = true;
              break;
            }
          }
        }
      }
    }

    if (!merged && slot.quantity > 0) {
      cleanInv.push(slot);
    }
  }

  // Dynamically allocate array grid (at least 64 slots for clean UI grid presentation, expanding endlessly)
  const targetLength = Math.min(inventoryLimit, Math.max(64, cleanInv.length));
  const result: Array<Item | null> = Array(targetLength).fill(null);
  for (let i = 0; i < Math.min(cleanInv.length, targetLength); i++) {
    result[i] = cleanInv[i];
  }
  return result;
}

/**
 * Formula for player gaining attributes, Max HP & Max Mana upon Level Up based on Class & Type.
 * Each level gain grants class & type specific growth in HP, Mana, and core attributes (STR, INT, DEF, WIS, SPD, DEX),
 * plus +3 customizable unassigned attribute points for steady, long-term progression.
 * Fully restores current HP and MP on level up.
 */
export function calculateLevelUpStatsPlayer(
  oldLevel: number,
  newLevel: number,
  currentStats: CharacterStats,
  characterClass?: string
): {
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  str: number;
  int: number;
  def: number;
  wis: number;
  spd: number;
  dex: number;
  unassignedPoints: number;
} {
  const levelsGained = Math.max(1, newLevel - oldLevel);
  const classDef = getClassDefinition(characterClass);
  const growth = classDef.levelUpGrowth || {
    hp: 30,
    mana: 20,
    str: 1.5,
    int: 1.5,
    def: 1.5,
    wis: 1.5,
    spd: 1.0,
    dex: 1.0,
  };

  const hpGain = Math.round(levelsGained * growth.hp);
  const manaGain = Math.round(levelsGained * growth.mana);

  const strGain = Math.round(levelsGained * growth.str);
  const intGain = Math.round(levelsGained * growth.int);
  const defGain = Math.round(levelsGained * growth.def);
  const wisGain = Math.round(levelsGained * growth.wis);
  const spdGain = Math.round(levelsGained * growth.spd);
  const dexGain = Math.round(levelsGained * growth.dex);

  const newMaxHp = currentStats.maxHp + hpGain;
  const newMaxMana = currentStats.maxMana + manaGain;

  return {
    maxHp: newMaxHp,
    hp: newMaxHp, // Fully restored on level up
    maxMana: newMaxMana,
    mana: newMaxMana, // Fully restored on level up
    str: (currentStats.str || 10) + strGain,
    int: (currentStats.int || 10) + intGain,
    def: (currentStats.def || 10) + defGain,
    wis: (currentStats.wis || 10) + wisGain,
    spd: (currentStats.spd || 10) + spdGain,
    dex: (currentStats.dex || 10) + dexGain,
    unassignedPoints: 0,
  };
}

/**
 * Formula for Pet / Familiar gaining stats and Max HP/MP on Level Up.
 */
export function calculateLevelUpStatsPet(
  oldLevel: number,
  newLevel: number,
  tier: Rarity,
  pet: {
    maxHp: number;
    maxMana: number;
    str: number;
    def: number;
    int: number;
    wis: number;
    spd: number;
    dex: number;
  }
) {
  const levelsGained = Math.max(1, newLevel - oldLevel);
  const tierBonus = tier === 'godly' ? 5 : tier === 'mythical' ? 4 : tier === 'legendary' ? 4 : tier === 'epic' ? 3 : tier === 'rare' ? 2 : 1;

  const newStr = pet.str + levelsGained * (2 + tierBonus);
  const newDef = pet.def + levelsGained * (2 + tierBonus);
  const newInt = pet.int + levelsGained * (2 + tierBonus);
  const newWis = pet.wis + levelsGained * (2 + tierBonus);
  const newSpd = pet.spd + levelsGained * Math.ceil(tierBonus * 0.5);
  const newDex = pet.dex + levelsGained * Math.ceil(tierBonus * 0.5);

  const baseHp = 120 + newLevel * 35;
  const baseMana = 60 + newLevel * 20;

  const newMaxHp = Math.round(baseHp + newStr * 3 + newDef * 2);
  const newMaxMana = Math.round(baseMana + newInt * 2.5 + newWis * 1.5);

  return {
    str: newStr,
    def: newDef,
    int: newInt,
    wis: newWis,
    spd: newSpd,
    dex: newDex,
    maxHp: newMaxHp,
    hp: newMaxHp,
    maxMana: newMaxMana,
    mana: newMaxMana,
  };
}

export interface CalculatedSkillStats {
  scalingStat: string;
  minVal: number;
  maxVal: number;
  average: number;
  primaryOutput: string;
  formulaStr: string;
  dpm: string;
  damageType: string;
  targetDesc: string;
}

/**
 * Real-time RPG Skill Damage / Formula calculation based on Character Stats
 */
export function getSkillCategory(skill: {
  id: string;
  skillCategory?: 'passive' | 'autoCast' | 'active';
  isPassive?: boolean;
  isAutoCast?: boolean;
}): 'passive' | 'autoCast' | 'active' {
  if (skill.skillCategory) return skill.skillCategory;
  if (skill.isPassive || skill.id.startsWith('s_passive_')) return 'passive';
  if (skill.isAutoCast || skill.id.startsWith('s_auto_')) return 'autoCast';
  return 'active';
}

export function calculateSkillStats(
  skill: {
    type: string;
    damageMultiplier?: number;
    wardGrant?: number;
    isArea?: boolean;
    targetType?: string;
    isPassive?: boolean;
    manaCost: number;
  },
  stats: CharacterStats,
  characterLevel: number = 1,
  masteryLevel: number = 1
): CalculatedSkillStats {
  const masteryBonusMultiplier = 1 + (Math.max(1, masteryLevel) - 1) * 0.06;
  const baseMult = skill.damageMultiplier || 1.0;
  const mult = baseMult * masteryBonusMultiplier;
  const str = stats.str || 10;
  const int = stats.int || 10;
  const wis = stats.wis || 10;
  const dex = stats.dex || 10;
  const def = stats.def || 10;

  let scalingStat = 'STR';
  let minVal = 0;
  let maxVal = 0;
  let primaryOutput = '';
  let formulaStr = '';
  let damageType = skill.type.toUpperCase();

  const targetTypeLabels: Record<string, string> = {
    all: 'ALL ENEMIES (AOE)',
    random_2: '2 RANDOM TARGETS',
    random_3: '3 RANDOM TARGETS',
    highest_hp: 'HIGHEST HP TARGET',
    lowest_hp: 'LOWEST HP TARGET',
    single: 'SINGLE TARGET',
    self: 'CASTER ONLY',
    ally_single: 'SINGLE ALLY',
    ally_all: 'ALL ALLIES',
  };

  const targetDesc = skill.isArea
    ? 'ALL ENEMIES (AOE)'
    : targetTypeLabels[skill.targetType || 'single'] || 'SINGLE TARGET';

  if (skill.type === 'physical') {
    scalingStat = 'STR & DEX';
    damageType = 'PHYSICAL';
    const baseAtk = str * BALANCE.STR_PHYS_DMG + dex * 0.5 + characterLevel * 2;
    minVal = Math.round(baseAtk * mult * 0.88);
    maxVal = Math.round(baseAtk * mult * 1.15 * 1.5);
    const avg = Math.round((minVal + maxVal) / 2);
    primaryOutput = `${minVal} - ${maxVal} Phys DMG (Avg ~${avg})`;
    formulaStr = `(${Math.round(mult * 100)}% ATK) ➔ [STR ${str} × ${BALANCE.STR_PHYS_DMG} + DEX ${dex} × 0.5 + Lv ${characterLevel}] × ${mult}`;
  } else if (skill.type === 'magical') {
    scalingStat = 'INT & WIS';
    damageType = 'MAGICAL';
    const baseMatk = int * BALANCE.INT_MAG_DMG + wis * 0.4 + characterLevel * 2;
    minVal = Math.round(baseMatk * mult * 0.90);
    maxVal = Math.round(baseMatk * mult * 1.18 * 1.5);
    const avg = Math.round((minVal + maxVal) / 2);
    primaryOutput = `${minVal} - ${maxVal} Mag DMG (Avg ~${avg})`;
    formulaStr = `(${Math.round(mult * 100)}% MATK) ➔ [INT ${int} × ${BALANCE.INT_MAG_DMG} + WIS ${wis} × 0.4 + Lv ${characterLevel}] × ${mult}`;
  } else if (skill.type === 'support') {
    scalingStat = 'WIS & INT';
    damageType = 'HOLY / SUPPORT';
    if (skill.wardGrant) {
      const wardBase = (skill.wardGrant || 50) + def * 1.5 + wis * 1.0;
      minVal = Math.round(wardBase * 0.95);
      maxVal = Math.round(wardBase * 1.1);
      primaryOutput = `+${Math.round(wardBase)} Ward Barrier`;
      formulaStr = `[Base ${skill.wardGrant} Ward + DEF ${def} × 1.5 + WIS ${wis} × 1.0]`;
    } else {
      const healBase = 120 + wis * 2.8 + int * 1.1 + characterLevel * 5;
      minVal = Math.round(healBase * 0.9);
      maxVal = Math.round(healBase * 1.15);
      primaryOutput = `+${Math.round(healBase)} HP Restoration`;
      formulaStr = `[Base 120 HP + WIS ${wis} × 2.8 + INT ${int} × 1.1 + Lv ${characterLevel} × 5]`;
    }
  } else if (skill.isPassive) {
    scalingStat = 'PASSIVE AURA';
    damageType = 'PASSIVE BUFF';
    minVal = Math.round(mult * 10);
    maxVal = Math.round(mult * 10);
    primaryOutput = `+${Math.round((mult || 1) * 10)}% Permanent Attribute Aura`;
    formulaStr = `Passive Effect: Always active in combat without Mana cost`;
  } else {
    scalingStat = 'WIS / INT';
    damageType = skill.type.toUpperCase();
    minVal = 15;
    maxVal = 30;
    primaryOutput = `+${Math.round((mult || 1.15) * 15)}% Stat Boost for 3 Turns`;
    formulaStr = `Base Duration: 3 Turns • Scaled by Caster WIS (${wis})`;
  }

  const average = Math.round((minVal + maxVal) / 2);
  const dpm =
    skill.manaCost > 0
      ? average > 0
        ? `${(average / skill.manaCost).toFixed(1)} Eff/MP`
        : 'N/A'
      : '0 Mana (Free)';

  return {
    scalingStat,
    minVal,
    maxVal,
    average,
    primaryOutput,
    formulaStr,
    dpm,
    damageType,
    targetDesc,
  };
}

/**
 * Calculates the experience required to advance from the given level to the next level.
 * Level 1 to 2 requires 16,500 XP.
 * Each subsequent level increases the XP needed by 50% (1.5x) from the last level requirement.
 */
export function getExpRequiredForLevel(level: number): number {
  let exp = 16500;
  for (let i = 1; i < level; i++) {
    exp = Math.round(exp * 1.5);
  }
  return exp;
}




