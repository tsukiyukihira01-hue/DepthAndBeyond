import { Router } from 'express';
import { DB } from '../db';
import { Item, Rarity } from '../../src/types/game';
import petsDatabase from '../../src/data/pets.json';

export const familiarRouter = Router();

// FAMILIAR: Roll Pet Companion
familiarRouter.post('/roll', (req, res) => {
  const { characterId } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  const emptyIndex = character.inventory.findIndex((slot) => slot === null);
  if (emptyIndex === -1) {
    res.status(400).json({ error: 'Your inventory is full! Make space before rolling a new pet.' });
    return;
  }

  const isFreeRoll = !character.freePetRollUsed;
  const ROLL_COST_GOLD = 500000;
  const ROLL_COST_TOKENS = 50;

  if (!isFreeRoll) {
    if (character.gold < ROLL_COST_GOLD && (character.tokens || 0) < ROLL_COST_TOKENS) {
      res.status(400).json({ error: `Subsequent pet rolls cost ${ROLL_COST_GOLD.toLocaleString()} Gold or ${ROLL_COST_TOKENS} Tokens.` });
      return;
    }
    if (character.gold >= ROLL_COST_GOLD) {
      character.gold -= ROLL_COST_GOLD;
    } else {
      character.tokens -= ROLL_COST_TOKENS;
    }
  } else {
    character.freePetRollUsed = true;
  }

  const roll = Math.random() * 100;
  let rarity: Rarity = 'common';

  if (roll < 0.2) rarity = 'godly';
  else if (roll < 1.2) rarity = 'mythical';
  else if (roll < 4.5) rarity = 'legendary';
  else if (roll < 14.0) rarity = 'epic';
  else if (roll < 32.0) rarity = 'rare';
  else if (roll < 58.0) rarity = 'uncommon';
  else if (roll < 85.0) rarity = 'common';
  else rarity = 'garbage';

  const availablePets = petsDatabase.pets.filter((p: any) => p.rarity === rarity);
  const template = availablePets.length > 0
    ? availablePets[Math.floor(Math.random() * availablePets.length)]
    : petsDatabase.pets[Math.floor(Math.random() * petsDatabase.pets.length)];

  const petItem: Item = {
    id: `item_pet_egg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${rarity.toUpperCase()} Pet Seal: ${template.name}`,
    description: `A sealed ethereal pet companion (${rarity.toUpperCase()}). Use/Hatch from inventory to summon into active Familiar slot! Can be traded or listed on Marketplace.`,
    type: 'box',
    slot: 'familiar',
    rarity,
    levelReq: 1,
    enchantLevel: 0,
    valueGold: rarity === 'godly' ? 50000 : rarity === 'legendary' ? 20000 : rarity === 'epic' ? 8000 : 2000,
    stackable: false,
    quantity: 1,
    icon: template.icon,
    baseStats: template.baseStats,
  };

  character.inventory[emptyIndex] = petItem;

  res.json({
    success: true,
    isFree: isFreeRoll,
    petItem,
    character,
    message: isFreeRoll
      ? `🎉 Congratulations! You received your FIRST FREE PET ROLL and obtained [${petItem.name}]!`
      : `✨ Pet roll successful! Obtained [${petItem.name}]. Added to inventory.`,
  });
});

// FAMILIAR: Hatch or Equip Pet
familiarRouter.post('/hatch', (req, res) => {
  const { characterId, itemId } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  const itemIndex = character.inventory.findIndex((i) => i && i.id === itemId);
  if (itemIndex === -1 || !character.inventory[itemIndex]) {
    res.status(400).json({ error: 'Pet egg/seal item not found in inventory.' });
    return;
  }

  const petItem = character.inventory[itemIndex]!;
  if (petItem.slot !== 'familiar' && petItem.type !== 'box') {
    res.status(400).json({ error: 'Selected item is not a pet familiar egg or seal.' });
    return;
  }

  let oldFamiliarSeal: Item | null = null;
  if (character.familiar) {
    oldFamiliarSeal = {
      id: `item_pet_seal_${Date.now()}`,
      name: `${character.familiar.tier.toUpperCase()} Pet Seal: ${character.familiar.name}`,
      description: `Sealed pet companion level ${character.familiar.level}. Use to hatch into active slot or trade!`,
      type: 'box',
      slot: 'familiar',
      rarity: character.familiar.tier,
      levelReq: 1,
      enchantLevel: 0,
      valueGold: 5000,
      stackable: false,
      quantity: 1,
      icon: character.familiar.icon,
    };
  }

  const cleanName = petItem.name.replace(/^(GARBAGE|COMMON|UNCOMMON|RARE|EPIC|LEGENDARY|MYTHICAL|GODLY) Pet Seal:\s*/i, '');
  const template = petsDatabase.pets.find((p: any) => p.name === cleanName) || petsDatabase.pets[0];
  const tierMultiplier = petItem.rarity === 'godly' ? 4.5 : petItem.rarity === 'mythical' ? 3.8 : petItem.rarity === 'legendary' ? 3.0 : petItem.rarity === 'epic' ? 2.2 : petItem.rarity === 'rare' ? 1.6 : petItem.rarity === 'uncommon' ? 1.2 : petItem.rarity === 'garbage' ? 0.5 : 1.0;

  const baseStats = template.baseStats || { hp: 500, mana: 300, str: 15, def: 12, dex: 15, spd: 18, int: 15, wis: 12 };

  const newFamiliar = {
    id: `fam_${Date.now()}`,
    name: cleanName,
    tier: petItem.rarity,
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: Math.round(baseStats.hp * tierMultiplier),
    maxHp: Math.round(baseStats.hp * tierMultiplier),
    mana: Math.round(baseStats.mana * tierMultiplier),
    maxMana: Math.round(baseStats.mana * tierMultiplier),
    str: Math.round(baseStats.str * tierMultiplier),
    def: Math.round(baseStats.def * tierMultiplier),
    dex: Math.round(baseStats.dex * tierMultiplier),
    spd: Math.round(baseStats.spd * tierMultiplier),
    int: Math.round(baseStats.int * tierMultiplier),
    wis: Math.round(baseStats.wis * tierMultiplier),
    protectionRate: template.protectionRate ?? (petItem.rarity === 'godly' ? 0.65 : petItem.rarity === 'mythical' ? 0.60 : petItem.rarity === 'legendary' ? 0.50 : petItem.rarity === 'epic' ? 0.40 : petItem.rarity === 'rare' ? 0.30 : petItem.rarity === 'uncommon' ? 0.22 : petItem.rarity === 'garbage' ? 0.08 : 0.15),
    skills: template.skills || ['Aura Shield', 'Healing Pulse'],
    icon: petItem.icon || template.icon,
  };

  character.inventory[itemIndex] = oldFamiliarSeal;
  character.familiar = newFamiliar;

  res.json({
    success: true,
    activeFamiliar: newFamiliar,
    returnedSeal: oldFamiliarSeal,
    character,
    message: `🐣 Hatched [${newFamiliar.name}]! It is now your active pet companion.`,
  });
});

// FAMILIAR: Unsummon Active Pet
familiarRouter.post('/unsummon', (req, res) => {
  const { characterId } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  if (!character.familiar) {
    res.status(400).json({ error: 'You do not have an active pet companion summoned.' });
    return;
  }

  const emptyIndex = character.inventory.findIndex((slot) => slot === null);
  if (emptyIndex === -1) {
    res.status(400).json({ error: 'Your inventory is full! Make space before unsummoning your pet.' });
    return;
  }

  const pet = character.familiar;
  const petSeal: Item = {
    id: `item_pet_seal_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    name: `${pet.tier.toUpperCase()} Pet Seal: ${pet.name}`,
    description: `A sealed pet companion (${pet.tier.toUpperCase()}) level ${pet.level}. Use or hatch from inventory to summon into active familiar slot! Can be traded or listed on Marketplace.`,
    type: 'box',
    slot: 'familiar',
    rarity: pet.tier,
    levelReq: 1,
    enchantLevel: 0,
    valueGold: 5000,
    stackable: false,
    quantity: 1,
    icon: pet.icon,
  };

  character.inventory[emptyIndex] = petSeal;
  character.familiar = null;

  res.json({
    success: true,
    petSeal,
    character,
    message: `🐾 Resealed [${pet.name}] back into inventory as a tradeable Pet Seal!`,
  });
});
