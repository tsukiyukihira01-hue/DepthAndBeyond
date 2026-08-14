import { Router } from 'express';
import { DB } from '../db';
import { purify } from '../middleware';
import { isCharacterNameTaken, saveCharacterToFirestore } from '../firestore';
import { Character, Item } from '../../src/types/game';
import { sanitizeAndStackInventory, calculateLevelUpStatsPlayer } from '../../src/utils/formulas';
import {
  getClassDefinition,
  getArchetypeDefinition,
  calculateStartingStats,
} from '../../src/data/classesAndArchetypes';

export const characterRouter = Router();

// CHARACTER: Create Character
characterRouter.post('/create', async (req, res) => {
  const { accountId, name, faction, characterClass, archetype } = req.body;
  if (!accountId || !name || !faction) {
    res.status(400).json({ error: 'Missing required character creation parameters.' });
    return;
  }

  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 20) {
    res.status(400).json({ error: 'Character name must be between 2 and 20 characters in length.' });
    return;
  }

  const taken = await isCharacterNameTaken(cleanName);
  if (taken) {
    res.status(400).json({ error: `Character name "${cleanName}" is already taken by another player. Please choose a unique name.` });
    return;
  }

  const existingChars = DB.characterByAccount.get(accountId) || [];
  if (existingChars.length >= 2) {
    res.status(400).json({ error: 'Maximum 2 character slots reached.' });
    return;
  }

  const parentUser = DB.users.get(accountId);

  // Modular class & archetype definitions
  const classDef = getClassDefinition(characterClass);
  const archDef = getArchetypeDefinition(archetype);
  const computedStats = calculateStartingStats(classDef.id, archDef.id);

  const charId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newChar: Character = {
    id: charId,
    accountId,
    userId: parentUser?.userId || '0',
    name: cleanName,
    level: 1,
    exp: 0,
    maxExp: 16500,
    faction,
    characterClass: classDef.name,
    archetype: archDef.name,
    gold: 100,
    tokens: 0,
    goldLeaf: 10,
    bankGold: 0,
    currentZoneId: 'zone_sun_city',
    stats: computedStats,
    equipment: {},
    inventory: (() => {
      const inv: Array<Item | null> = Array(64).fill(null);
      inv[0] = {
        id: `item_starter_weapon_${Date.now()}`,
        name: classDef.starterWeaponName,
        description: `Starter weapon for ${classDef.name} (${archDef.name}).`,
        type: 'gear',
        slot: 'mainHand',
        rarity: 'garbage',
        levelReq: 1,
        baseStats: classDef.starterWeaponStats,
        enchantLevel: 0,
        valueGold: 20,
        stackable: false,
        quantity: 1,
        icon: classDef.starterWeaponIcon,
        weaponType: classDef.starterWeaponType,
      };
      inv[1] = {
        id: `item_hp_vial_init_${Date.now()}`,
        name: 'Novice Health Vial',
        description: 'Restores 250 Health points instantly upon consumption.',
        type: 'consumable',
        rarity: 'common',
        levelReq: 1,
        enchantLevel: 0,
        valueGold: 10,
        stackable: true,
        quantity: 500,
        icon: '🧪',
      };
      inv[2] = {
        id: `item_mp_vial_init_${Date.now()}`,
        name: 'Novice Mana Vial',
        description: 'Restores 250 Mana points instantly upon consumption.',
        type: 'consumable',
        rarity: 'common',
        levelReq: 1,
        enchantLevel: 0,
        valueGold: 10,
        stackable: true,
        quantity: 500,
        icon: '💧',
      };
      return inv;
    })(),
    inventoryLimit: 9999,
    skills: ['s_heavy_strike', 's_fireball', 's_light_heal', 's_shield_bash', 's_whirlwind_strike', 's_arcane_cluster', 's_cleave'],
    equippedSkills: {
      passives: [null, null, null, null],
      autoCast: null,
      actives: classDef.starterSkills.slice(0, 3),
    },
    familiar: null,
    loadoutSpec: 'A',
    isOnline: true,
    lastActive: new Date().toISOString(),
  };

  DB.characters.set(charId, newChar);
  DB.characterByAccount.set(accountId, [...existingChars, charId]);
  await saveCharacterToFirestore(newChar);

  res.json({ character: newChar });
});

// CHARACTER: Change Display Name
characterRouter.post('/change-name', async (req, res) => {
  const { characterId, newName } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  const cleanName = purify.sanitize(newName || '').trim();
  if (!cleanName || cleanName.length < 2 || cleanName.length > 20) {
    res.status(400).json({ error: 'Character name must be between 2 and 20 characters.' });
    return;
  }

  if (character.name.toLowerCase() === cleanName.toLowerCase()) {
    res.status(400).json({ error: 'You are already using this name.' });
    return;
  }

  const taken = await isCharacterNameTaken(cleanName, character.id);
  if (taken) {
    res.status(400).json({ error: `Character name "${cleanName}" is already taken by another player.` });
    return;
  }

  const RENAME_COST = 500;
  if ((character.tokens || 0) < RENAME_COST) {
    res.status(400).json({ error: `Insufficient Tokens. Changing name requires flat ${RENAME_COST} Tokens. Current balance: ${character.tokens || 0} Tokens.` });
    return;
  }

  const oldName = character.name;
  character.tokens -= RENAME_COST;
  character.name = cleanName;

  DB.characters.set(character.id, character);
  await saveCharacterToFirestore(character);

  if (character.guildId) {
    const guild = DB.guilds.get(character.guildId);
    if (guild) {
      if (guild.leaderId === character.id) {
        guild.leaderName = cleanName;
      }
      const member = guild.members.find((m) => m.characterId === character.id);
      if (member) {
        member.name = cleanName;
      }
    }
  }

  res.json({
    success: true,
    message: `Character display name changed from "${oldName}" to "${cleanName}". Your permanent User ID #${character.userId} remains unchanged.`,
    character,
    tokensRemaining: character.tokens,
  });
});

// CHARACTER: Sync & Save State
characterRouter.post('/sync', async (req, res) => {
  const {
    characterId,
    inventory,
    gold,
    exp,
    level,
    maxExp,
    stats,
    familiar,
    treeAllocations,
    equippedTrees,
    equippedSkills,
    skills,
  } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  if (Array.isArray(inventory)) {
    character.inventory = sanitizeAndStackInventory(inventory, character.inventoryLimit || 64);
  }
  if (typeof gold === 'number' && !isNaN(gold) && gold >= 0) {
    character.gold = gold;
  }
  if (typeof exp === 'number' && !isNaN(exp) && exp >= 0) {
    character.exp = exp;
  }
  if (typeof level === 'number' && !isNaN(level) && level >= 1) {
    character.level = level;
  }
  if (typeof maxExp === 'number' && !isNaN(maxExp) && maxExp > 0) {
    character.maxExp = maxExp;
  }
  if (stats) {
    character.stats = { ...character.stats, ...stats };
  }
  if (familiar !== undefined) {
    character.familiar = familiar;
  }
  if (treeAllocations !== undefined) {
    character.treeAllocations = treeAllocations;
  }
  if (equippedTrees !== undefined) {
    character.equippedTrees = equippedTrees;
  }
  if (equippedSkills !== undefined) {
    character.equippedSkills = equippedSkills;
  }
  if (Array.isArray(skills)) {
    character.skills = skills;
  }

  DB.characters.set(character.id, character);
  await saveCharacterToFirestore(character);

  res.json({ success: true, character });
});

// CHARACTER: Reset Skill Tree Allocations (Cost: 500,000,000 Gold)
characterRouter.post('/reset-skills', async (req, res) => {
  const { characterId } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  const RESET_SKILLS_COST_GOLD = 500000000;
  if (character.gold < RESET_SKILLS_COST_GOLD) {
    res.status(400).json({
      error: `Insufficient Gold! Resetting Skill Points requires 500,000,000 Gold. Current balance: ${character.gold.toLocaleString()} Gold.`,
    });
    return;
  }

  character.gold -= RESET_SKILLS_COST_GOLD;
  character.treeAllocations = {};
  character.equippedSkills = {
    actives: Array(8).fill(null),
    autoCast: null,
    passives: Array(4).fill(null),
  };

  DB.characters.set(character.id, character);
  await saveCharacterToFirestore(character);

  res.json({
    success: true,
    message: 'Skill Points successfully reset! 500,000,000 Gold deducted.',
    character,
  });
});

// CHARACTER: Reset Attribute Stats (Cost: 10,000,000 Gold)
characterRouter.post('/reset-stats', async (req, res) => {
  const { characterId } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  const RESET_COST_GOLD = 10000000;
  if (character.gold < RESET_COST_GOLD) {
    res.status(400).json({
      error: `Insufficient Gold! Resetting attribute bonus points costs 10,000,000 Gold. Current balance: ${character.gold.toLocaleString()} Gold.`,
    });
    return;
  }

  character.gold -= RESET_COST_GOLD;

  // Reset stats to baseline starting stats plus automatic level up growth based on class type
  const classDef = getClassDefinition(character.characterClass);
  const archDef = getArchetypeDefinition(character.archetype);
  const baseStats = calculateStartingStats(classDef.id, archDef.id);

  let newStats = { ...baseStats, unassignedPoints: 0 };
  if (character.level > 1) {
    const gains = calculateLevelUpStatsPlayer(1, character.level, baseStats, classDef.id);
    newStats = {
      ...newStats,
      maxHp: gains.maxHp,
      hp: gains.hp,
      maxMana: gains.maxMana,
      mana: gains.mana,
      str: gains.str,
      int: gains.int,
      def: gains.def,
      wis: gains.wis,
      spd: gains.spd,
      dex: gains.dex,
      unassignedPoints: 0,
    };
  }

  character.stats = newStats;

  DB.characters.set(character.id, character);
  await saveCharacterToFirestore(character);

  res.json({
    success: true,
    message: `Character attributes successfully recalculating according to ${classDef.name} (${classDef.typeTitle}) growth profile!`,
    character,
  });
});
