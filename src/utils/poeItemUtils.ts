import { CharacterStats, Item, ItemAffix, ItemSocket, PoeCurrencyType, SocketColor, SocketedGem } from '../types/game';
import { POE_BASE_TEMPLATES, POE_PREFIX_AFFIXES, POE_SUFFIX_AFFIXES, PoeBaseItemTemplate } from '../data/poeItemsData';

/**
 * Generate random socket color based on item attribute requirements ratio.
 * Str -> Red, Dex -> Green, Int -> Blue, White (universal, 3% chance).
 */
export function rollSocketColor(reqStr: number = 0, reqDex: number = 0, reqInt: number = 0): SocketColor {
  if (Math.random() < 0.03) return 'white';

  const total = (reqStr || 1) + (reqDex || 1) + (reqInt || 1);
  const pRed = (reqStr || 1) / total;
  const pGreen = (reqDex || 1) / total;

  const roll = Math.random();
  if (roll < pRed) return 'red';
  if (roll < pRed + pGreen) return 'green';
  return 'blue';
}

/**
 * Generate sockets and socket links for an item.
 */
export function generateItemSockets(
  maxSockets: number,
  reqStr: number = 0,
  reqDex: number = 0,
  reqInt: number = 0,
  numSocketsOverride?: number
): ItemSocket[] {
  if (maxSockets <= 0) return [];

  const count = numSocketsOverride ?? Math.min(maxSockets, 1 + Math.floor(Math.random() * maxSockets));
  const sockets: ItemSocket[] = [];

  // Default link logic: random linked groups
  let currentGroupId = 0;
  for (let i = 0; i < count; i++) {
    const isLinkedToPrevious = i > 0 && Math.random() < 0.45;
    if (!isLinkedToPrevious) {
      currentGroupId = i;
    }
    sockets.push({
      id: `sock_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      color: rollSocketColor(reqStr, reqDex, reqInt),
      linkedGroupId: currentGroupId,
    });
  }

  return sockets;
}

/**
 * Reroll socket links for an item (Orb of Fusing).
 */
export function rerollSocketLinks(sockets: ItemSocket[]): ItemSocket[] {
  if (!sockets || sockets.length <= 1) return sockets;

  const newSockets = [...sockets];
  let currentGroupId = 0;

  for (let i = 0; i < newSockets.length; i++) {
    // Chance to link decreases with consecutive links
    const linkChance = 0.50 - i * 0.05;
    const isLinkedToPrevious = i > 0 && Math.random() < Math.max(0.20, linkChance);
    if (!isLinkedToPrevious) {
      currentGroupId = i;
    }
    newSockets[i] = {
      ...newSockets[i],
      linkedGroupId: currentGroupId,
    };
  }

  return newSockets;
}

/**
 * Generate random affixes for an item based on requested prefix & suffix counts.
 */
export function rollAffixes(numPrefixes: number, numSuffixes: number): { prefixes: ItemAffix[]; suffixes: ItemAffix[] } {
  const prefixes: ItemAffix[] = [];
  const suffixes: ItemAffix[] = [];

  // Pick random prefixes
  const prefixPool = [...POE_PREFIX_AFFIXES];
  for (let i = 0; i < numPrefixes && prefixPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * prefixPool.length);
    const chosen = prefixPool.splice(idx, 1)[0];
    const tier = 1 + Math.floor(Math.random() * 5); // Tier 1-5
    const tierMultiplier = 1.0 - (tier - 1) * 0.15; // Tier 1 is highest
    const val = Math.max(1, Math.round(chosen.value * tierMultiplier * (0.85 + Math.random() * 0.3)));
    const secVal = chosen.secondaryValue ? Math.max(1, Math.round(chosen.secondaryValue * tierMultiplier * (0.85 + Math.random() * 0.3))) : undefined;

    const labelText = secVal
      ? `+${val} to ${secVal} ${chosen.label}`
      : `${chosen.isPercentage ? '+' : '+'}${val}${chosen.label}`;

    prefixes.push({
      type: 'prefix',
      tier,
      name: chosen.name,
      statKey: chosen.statKey,
      label: labelText,
      value: val,
      secondaryValue: secVal,
      isPercentage: chosen.isPercentage,
    });
  }

  // Pick random suffixes
  const suffixPool = [...POE_SUFFIX_AFFIXES];
  for (let i = 0; i < numSuffixes && suffixPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * suffixPool.length);
    const chosen = suffixPool.splice(idx, 1)[0];
    const tier = 1 + Math.floor(Math.random() * 5);
    const tierMultiplier = 1.0 - (tier - 1) * 0.15;
    const val = Math.max(1, Math.round(chosen.value * tierMultiplier * (0.85 + Math.random() * 0.3)));

    suffixes.push({
      type: 'suffix',
      tier,
      name: chosen.name,
      statKey: chosen.statKey,
      label: `+${val}${chosen.label}`,
      value: val,
      isPercentage: chosen.isPercentage,
    });
  }

  return { prefixes, suffixes };
}

/**
 * Generate a complete Astral Rare name (e.g., "Gloom Razor Battle Axe").
 */
export function generateRareItemName(baseName: string, prefixes: ItemAffix[], suffixes: ItemAffix[]): string {
  const rarePrefixes = ['Gloom', 'Demon', 'Vengeance', 'Soul', 'Dread', 'Brimstone', 'Apocalypse', 'Storm', 'Shadow', 'Phoenix'];
  const rareSuffixes = ['Razor', 'Shell', 'Bite', 'Grasp', 'Pillar', 'Song', 'Roar', 'Bane', 'Ward', 'Aegis'];

  const pName = rarePrefixes[Math.floor(Math.random() * rarePrefixes.length)];
  const sName = rareSuffixes[Math.floor(Math.random() * rareSuffixes.length)];

  return `${pName} ${sName} ${baseName}`;
}

/**
 * Converts template or base data into a full equipment item.
 */
export function createPoeEquipmentItem(template: PoeBaseItemTemplate, poeRarity: 'normal' | 'magic' | 'rare' = 'rare'): Item {
  let numPrefixes = 0;
  let numSuffixes = 0;

  if (poeRarity === 'magic') {
    numPrefixes = Math.random() < 0.5 ? 1 : 0;
    numSuffixes = numPrefixes === 0 ? 1 : Math.random() < 0.5 ? 1 : 0;
  } else if (poeRarity === 'rare') {
    numPrefixes = 2 + Math.floor(Math.random() * 2); // 2-3 prefixes
    numSuffixes = 2 + Math.floor(Math.random() * 2); // 2-3 suffixes
  }

  const { prefixes, suffixes } = rollAffixes(numPrefixes, numSuffixes);
  const sockets = generateItemSockets(template.maxSockets, template.reqStr, template.reqDex, template.reqInt);

  let name = template.name;
  if (poeRarity === 'magic') {
    const prefStr = prefixes.length > 0 ? `${prefixes[0].name} ` : '';
    const suffStr = suffixes.length > 0 ? ` ${suffixes[0].name}` : '';
    name = `${prefStr}${template.name}${suffStr}`;
  } else if (poeRarity === 'rare') {
    name = generateRareItemName(template.name, prefixes, suffixes);
  }

  // Calculate actual baseStats for character attribute integration
  const rarityMult = poeRarity === 'rare' ? 1.8 : poeRarity === 'magic' ? 1.3 : 1.0;
  const baseStats: Partial<Record<keyof CharacterStats, number>> = {};

  if (template.reqStr > 0 || template.baseArmour) {
    baseStats.str = Math.max(1, Math.round((template.reqStr * 0.4 + (template.baseArmour || 0) * 0.2 + 4) * rarityMult));
    baseStats.def = Math.max(1, Math.round(((template.baseArmour || 0) * 0.7 + template.levelReq * 1.8 + 4) * rarityMult));
  }
  if (template.reqDex > 0 || template.baseEvasion) {
    baseStats.dex = Math.max(1, Math.round((template.reqDex * 0.4 + (template.baseEvasion || 0) * 0.2 + 4) * rarityMult));
    baseStats.spd = Math.max(1, Math.round(((template.baseEvasion || 0) * 0.4 + (template.baseAttackSpeed || 1.2) * 4 + 3) * rarityMult));
  }
  if (template.reqInt > 0 || template.baseEnergyShield) {
    baseStats.int = Math.max(1, Math.round((template.reqInt * 0.4 + (template.baseEnergyShield || 0) * 0.25 + 4) * rarityMult));
    baseStats.wis = Math.max(1, Math.round(((template.baseEnergyShield || 0) * 0.35 + template.levelReq * 1.5 + 3) * rarityMult));
  }

  if (template.basePhysDmgMax) {
    const avgDmg = ((template.basePhysDmgMin || 1) + template.basePhysDmgMax) / 2;
    if (template.weaponType === 'magical') {
      baseStats.int = (baseStats.int || 0) + Math.round(avgDmg * 0.6 * rarityMult);
      baseStats.wis = (baseStats.wis || 0) + Math.round(avgDmg * 0.35 * rarityMult);
    } else {
      baseStats.str = (baseStats.str || 0) + Math.round(avgDmg * 0.6 * rarityMult);
      baseStats.dex = (baseStats.dex || 0) + Math.round(avgDmg * 0.35 * rarityMult);
    }
  }

  const slotLabels: Record<string, string> = {
    mainHand: 'weapon',
    offHand: 'secondary equipment',
    head: 'helm',
    body: 'body armour',
    legs: 'greaves',
    ring: 'trinket ring',
    amulet: 'mystic amulet',
  };
  const slotDesc = slotLabels[template.slot] || 'equipment';
  const description = `Crafted as a ${template.name} (${slotDesc}). Requires Level ${template.levelReq}. Features ${sockets.length} socket group(s) with innate ${poeRarity} affixes.`;

  return {
    id: `poe_gear_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    description,
    type: 'gear',
    slot: template.slot,
    rarity: poeRarity === 'rare' ? 'rare' : poeRarity === 'magic' ? 'uncommon' : 'common',
    poeRarity,
    itemLevel: Math.max(1, template.levelReq + Math.floor(Math.random() * 10)),
    quality: 0,
    levelReq: template.levelReq,
    enchantLevel: 0,
    reqStr: template.reqStr,
    reqDex: template.reqDex,
    reqInt: template.reqInt,
    baseArmour: template.baseArmour,
    baseEvasion: template.baseEvasion,
    baseEnergyShield: template.baseEnergyShield,
    basePhysDmgMin: template.basePhysDmgMin,
    basePhysDmgMax: template.basePhysDmgMax,
    baseCritChance: template.baseCritChance,
    baseAttackSpeed: template.baseAttackSpeed,
    implicitStat: template.implicitStat,
    prefixes,
    suffixes,
    sockets,
    baseStats,
    isCorrupted: false,
    valueGold: poeRarity === 'rare' ? 1200 : poeRarity === 'magic' ? 450 : 150,
    stackable: false,
    quantity: 1,
    icon: template.icon,
    weaponType: template.weaponType || 'physical',
  };
}

export interface EquipmentPenaltyInfo {
  efficiency: number; // 0.15 to 1.0 (multiplier)
  penaltyPercent: number; // 0 to 85%
  isUnderLeveled: boolean;
  levelDeficit: number;
  isUnderStat: boolean;
  statDeficit: number;
  message: string;
}

/**
 * Calculates equipment efficiency multiplier based on character level and attribute requirements.
 * Items can be equipped without meeting requirements, but stats are penalized accordingly.
 */
export function getEquipmentEfficiency(
  item: Item,
  characterLevel?: number,
  charStats?: { str?: number; dex?: number; int?: number }
): EquipmentPenaltyInfo {
  const reqLvl = item.levelReq || 1;
  const levelDeficit = Math.max(0, reqLvl - (characterLevel ?? reqLvl));

  const reqStr = item.reqStr || 0;
  const reqDex = item.reqDex || 0;
  const reqInt = item.reqInt || 0;

  const strDeficit = Math.max(0, reqStr - (charStats?.str ?? reqStr));
  const dexDeficit = Math.max(0, reqDex - (charStats?.dex ?? reqDex));
  const intDeficit = Math.max(0, reqInt - (charStats?.int ?? reqInt));
  const statDeficit = strDeficit + dexDeficit + intDeficit;

  const isUnderLeveled = levelDeficit > 0;
  const isUnderStat = statDeficit > 0;

  if (!isUnderLeveled && !isUnderStat) {
    return {
      efficiency: 1.0,
      penaltyPercent: 0,
      isUnderLeveled: false,
      levelDeficit: 0,
      isUnderStat: false,
      statDeficit: 0,
      message: 'Full Equipment Efficiency (100%)',
    };
  }

  // Penalty scaling: 8% stat reduction per missing level + 1% per missing attribute point
  const levelPenalty = levelDeficit * 0.08;
  const statPenalty = statDeficit * 0.01;

  // Maximum penalty 85% (minimum 15% efficiency)
  const totalPenalty = Math.min(0.85, levelPenalty + statPenalty);
  const efficiency = Math.max(0.15, 1.0 - totalPenalty);
  const penaltyPercent = Math.round(totalPenalty * 100);

  let message = '';
  if (isUnderLeveled && isUnderStat) {
    message = `Under-Leveled (-${levelDeficit} Lv) & Attribute Penalty (-${penaltyPercent}% Stats)`;
  } else if (isUnderLeveled) {
    message = `Under-Leveled Penalty (-${levelDeficit} Lv): Stats reduced by ${penaltyPercent}%`;
  } else {
    message = `Attribute Deficit Penalty: Stats reduced by ${penaltyPercent}%`;
  }

  return {
    efficiency,
    penaltyPercent,
    isUnderLeveled,
    levelDeficit,
    isUnderStat,
    statDeficit,
    message,
  };
}

/**
 * Calculates total combined stats for an item including quality, implicits, prefixes, suffixes, and socketed gems.
 * Optionally applies equipment efficiency penalty if character level / stats are provided.
 */
export function calculateTotalItemStats(
  item: Item,
  characterLevel?: number,
  charStats?: { str?: number; dex?: number; int?: number }
) {
  const penalty = getEquipmentEfficiency(item, characterLevel, charStats);
  const eff = penalty.efficiency;

  const quality = item.quality || 0;
  const qualityMult = 1 + quality / 100;

  let armour = Math.round((item.baseArmour || 0) * qualityMult * eff);
  let evasion = Math.round((item.baseEvasion || 0) * qualityMult * eff);
  let energyShield = Math.round((item.baseEnergyShield || 0) * qualityMult * eff);

  let physMin = Math.round((item.basePhysDmgMin || 0) * qualityMult * eff);
  let physMax = Math.round((item.basePhysDmgMax || 0) * qualityMult * eff);

  let flatLife = 0;
  let flatMana = 0;
  let flatStr = 0;
  let flatDex = 0;
  let flatInt = 0;
  let flatWis = 0;
  let allAttributes = 0;

  let fireRes = 0;
  let coldRes = 0;
  let lightningRes = 0;
  let chaosRes = 0;

  let attackSpeedPct = 0;
  let castSpeedPct = 0;
  let critChancePct = 0;
  let critMulti = 0;
  let physDmgPct = 0;
  let spellDmgPct = 0;
  let elemDmgPct = 0;

  let allSkillGems = 0;
  let fireSkillGems = 0;
  let manaCostReductionPct = 0;
  let cooldownRecoveryPct = 0;
  let aoePct = 0;
  let manaRegenPct = 0;
  let strScalingPhys = 0;
  let intScalingSpell = 0;

  // Aggregate implicits
  if (item.implicitStat) {
    const { statKey, value } = item.implicitStat;
    if (statKey === 'physDmgPct') physDmgPct += value;
    if (statKey === 'spellDmgPct') spellDmgPct += value;
    if (statKey === 'elemDmgPct') elemDmgPct += value;
    if (statKey === 'flatLife') flatLife += value;
    if (statKey === 'flatMana') flatMana += value;
    if (statKey === 'flatStr') flatStr += value;
    if (statKey === 'flatDex') flatDex += value;
    if (statKey === 'flatInt') flatInt += value;
    if (statKey === 'allSkillGems') allSkillGems += value;
    if (statKey === 'allRes') {
      fireRes += value;
      coldRes += value;
      lightningRes += value;
    }
  }

  // Aggregate explicit affixes (prefixes & suffixes)
  const allAffixes = [...(item.prefixes || []), ...(item.suffixes || [])];
  for (const affix of allAffixes) {
    if (affix.statKey === 'physDmgPct') physDmgPct += affix.value;
    if (affix.statKey === 'spellDmgPct') spellDmgPct += affix.value;
    if (affix.statKey === 'elemDmgPct') elemDmgPct += affix.value;
    if (affix.statKey === 'flatPhys') {
      physMin += affix.value;
      physMax += affix.secondaryValue || affix.value;
    }
    if (affix.statKey === 'flatLife') flatLife += affix.value;
    if (affix.statKey === 'flatMana') flatMana += affix.value;
    if (affix.statKey === 'flatArmour') armour += affix.value;
    if (affix.statKey === 'flatEvasion') evasion += affix.value;
    if (affix.statKey === 'flatES') energyShield += affix.value;

    if (affix.statKey === 'fireRes') fireRes += affix.value;
    if (affix.statKey === 'coldRes') coldRes += affix.value;
    if (affix.statKey === 'lightningRes') lightningRes += affix.value;
    if (affix.statKey === 'chaosRes') chaosRes += affix.value;

    if (affix.statKey === 'attackSpeed') attackSpeedPct += affix.value;
    if (affix.statKey === 'castSpeed') castSpeedPct += affix.value;
    if (affix.statKey === 'critChance') critChancePct += affix.value;
    if (affix.statKey === 'critMulti') critMulti += affix.value;

    if (affix.statKey === 'flatStr') flatStr += affix.value;
    if (affix.statKey === 'flatDex') flatDex += affix.value;
    if (affix.statKey === 'flatInt') flatInt += affix.value;
    if (affix.statKey === 'flatWis') flatWis += affix.value;
    if (affix.statKey === 'allAttributes') {
      allAttributes += affix.value;
      flatStr += affix.value;
      flatDex += affix.value;
      flatInt += affix.value;
    }

    // Skill & attribute synergy stats
    if (affix.statKey === 'allSkillGems') allSkillGems += affix.value;
    if (affix.statKey === 'fireSkillGems') fireSkillGems += affix.value;
    if (affix.statKey === 'manaCostReduction') manaCostReductionPct += affix.value;
    if (affix.statKey === 'cooldownRecovery') cooldownRecoveryPct += affix.value;
    if (affix.statKey === 'aoePct') aoePct += affix.value;
    if (affix.statKey === 'manaRegenPct') manaRegenPct += affix.value;
    if (affix.statKey === 'strScalingPhys') strScalingPhys += affix.value;
    if (affix.statKey === 'intScalingSpell') intScalingSpell += affix.value;
  }

  // Scale bonus flat stats by equipment efficiency penalty
  if (eff < 1.0) {
    flatLife = Math.round(flatLife * eff);
    flatMana = Math.round(flatMana * eff);
    flatStr = Math.round(flatStr * eff);
    flatDex = Math.round(flatDex * eff);
    flatInt = Math.round(flatInt * eff);
    flatWis = Math.round(flatWis * eff);
    allAttributes = Math.round(allAttributes * eff);
    fireRes = Math.round(fireRes * eff);
    coldRes = Math.round(coldRes * eff);
    lightningRes = Math.round(lightningRes * eff);
    chaosRes = Math.round(chaosRes * eff);
    spellDmgPct = Math.round(spellDmgPct * eff);
    elemDmgPct = Math.round(elemDmgPct * eff);
    manaCostReductionPct = Math.round(manaCostReductionPct * eff);
    cooldownRecoveryPct = Math.round(cooldownRecoveryPct * eff);
    aoePct = Math.round(aoePct * eff);
    manaRegenPct = Math.round(manaRegenPct * eff);
  }

  // Apply % Phys Dmg multiplier to weapon base
  if (physDmgPct > 0) {
    physMin = Math.round(physMin * (1 + physDmgPct / 100));
    physMax = Math.round(physMax * (1 + physDmgPct / 100));
  }

  // Socketed Gems calculations
  let linkedGemCount = 0;
  let activeGems: SocketedGem[] = [];
  let supportGems: SocketedGem[] = [];

  if (item.sockets) {
    for (const sock of item.sockets) {
      if (sock.socketedGem) {
        linkedGemCount++;
        // Boost socketed gem level if skill gem level bonus exists
        let gem = sock.socketedGem;
        let bonusLevels = allSkillGems;
        if (gem.tags.includes('Fire')) bonusLevels += fireSkillGems;

        if (bonusLevels > 0) {
          gem = { ...gem, level: gem.level + bonusLevels };
        }

        if (gem.gemType === 'active') activeGems.push(gem);
        else supportGems.push(gem);
      }
    }
  }

  return {
    armour,
    evasion,
    energyShield,
    physMin,
    physMax,
    flatLife,
    flatMana,
    flatStr,
    flatDex,
    flatInt,
    flatWis,
    allAttributes,
    fireRes,
    coldRes,
    lightningRes,
    chaosRes,
    attackSpeedPct,
    castSpeedPct,
    critChancePct,
    critMulti,
    physDmgPct,
    spellDmgPct,
    elemDmgPct,
    allSkillGems,
    fireSkillGems,
    manaCostReductionPct,
    cooldownRecoveryPct,
    aoePct,
    manaRegenPct,
    strScalingPhys,
    intScalingSpell,
    linkedGemCount,
    activeGems,
    supportGems,
    penalty,
  };
}

/**
 * Executes Astral Orb Currency Crafting.
 */
export function applyPoeCurrencyOrb(
  item: Item,
  orbType: PoeCurrencyType
): { updatedItem: Item; success: boolean; message: string } {
  if (!item || item.type !== 'gear') {
    return { updatedItem: item, success: false, message: 'Orbs can only be used on Equipment Gear.' };
  }

  if (item.isCorrupted) {
    return { updatedItem: item, success: false, message: 'Item is CORRUPTED and cannot be modified!' };
  }

  const baseItemTemplate = POE_BASE_TEMPLATES.find((t) => item.name.includes(t.name)) || POE_BASE_TEMPLATES[0];
  const reqStr = item.reqStr || baseItemTemplate.reqStr;
  const reqDex = item.reqDex || baseItemTemplate.reqDex;
  const reqInt = item.reqInt || baseItemTemplate.reqInt;
  const maxSockets = baseItemTemplate.maxSockets;

  const currentRarity = item.poeRarity || 'normal';
  const prefixes = [...(item.prefixes || [])];
  const suffixes = [...(item.suffixes || [])];

  switch (orbType) {
    case 'transmutation': {
      if (currentRarity !== 'normal') {
        return { updatedItem: item, success: false, message: 'Orb of Transmutation can only be used on Normal items!' };
      }
      const newItem = createPoeEquipmentItem(baseItemTemplate, 'magic');
      return { updatedItem: newItem, success: true, message: `Transmuted ${baseItemTemplate.name} into a Magic Item!` };
    }

    case 'alteration': {
      if (currentRarity !== 'magic') {
        return { updatedItem: item, success: false, message: 'Orb of Alteration can only be used on Magic items!' };
      }
      const newItem = createPoeEquipmentItem(baseItemTemplate, 'magic');
      return { updatedItem: { ...newItem, sockets: item.sockets, quality: item.quality }, success: true, message: 'Reforged Magic Item affixes!' };
    }

    case 'augmentation': {
      if (currentRarity !== 'magic') {
        return { updatedItem: item, success: false, message: 'Orb of Augmentation can only be used on Magic items!' };
      }
      if (prefixes.length + suffixes.length >= 2) {
        return { updatedItem: item, success: false, message: 'Magic item already has max 2 affixes!' };
      }
      const needPrefix = prefixes.length === 0;
      const rolled = rollAffixes(needPrefix ? 1 : 0, needPrefix ? 0 : 1);
      const newPrefixes = [...prefixes, ...rolled.prefixes];
      const newSuffixes = [...suffixes, ...rolled.suffixes];

      return {
        updatedItem: { ...item, prefixes: newPrefixes, suffixes: newSuffixes },
        success: true,
        message: 'Augmented Magic item with a new affix!',
      };
    }

    case 'regal': {
      if (currentRarity !== 'magic') {
        return { updatedItem: item, success: false, message: 'Regal Orb can only be used on Magic items!' };
      }
      const rolled = rollAffixes(1, 0);
      const newPrefixes = [...prefixes, ...rolled.prefixes];
      const newName = generateRareItemName(baseItemTemplate.name, newPrefixes, suffixes);

      return {
        updatedItem: {
          ...item,
          name: newName,
          poeRarity: 'rare',
          rarity: 'rare',
          prefixes: newPrefixes,
        },
        success: true,
        message: 'Upgraded Magic item to a RARE item!',
      };
    }

    case 'chaos': {
      if (currentRarity !== 'rare') {
        return { updatedItem: item, success: false, message: 'Chaos Orb can only be used on Rare items!' };
      }
      const newItem = createPoeEquipmentItem(baseItemTemplate, 'rare');
      return {
        updatedItem: {
          ...newItem,
          sockets: item.sockets,
          quality: item.quality,
        },
        success: true,
        message: 'Chaos Orb reforged all Rare affixes!',
      };
    }

    case 'exalted': {
      if (currentRarity !== 'rare') {
        return { updatedItem: item, success: false, message: 'Exalted Orb can only be used on Rare items!' };
      }
      if (prefixes.length + suffixes.length >= 6) {
        return { updatedItem: item, success: false, message: 'Rare item already has max 6 affixes!' };
      }
      const isPrefix = prefixes.length < 3;
      const rolled = rollAffixes(isPrefix ? 1 : 0, isPrefix ? 0 : 1);

      return {
        updatedItem: {
          ...item,
          prefixes: [...prefixes, ...rolled.prefixes],
          suffixes: [...suffixes, ...rolled.suffixes],
        },
        success: true,
        message: 'Exalted Orb added a powerful new explicit affix!',
      };
    }

    case 'divine': {
      if (prefixes.length === 0 && suffixes.length === 0) {
        return { updatedItem: item, success: false, message: 'Item has no affixes to reroll!' };
      }
      const rerolledPrefixes = prefixes.map((p) => ({
        ...p,
        value: Math.max(1, Math.round(p.value * (0.85 + Math.random() * 0.3))),
      }));
      const rerolledSuffixes = suffixes.map((s) => ({
        ...s,
        value: Math.max(1, Math.round(s.value * (0.85 + Math.random() * 0.3))),
      }));

      return {
        updatedItem: { ...item, prefixes: rerolledPrefixes, suffixes: rerolledSuffixes },
        success: true,
        message: 'Divine Orb randomized numeric values of all affixes!',
      };
    }

    case 'scouring': {
      return {
        updatedItem: {
          ...item,
          name: baseItemTemplate.name,
          poeRarity: 'normal',
          rarity: 'common',
          prefixes: [],
          suffixes: [],
        },
        success: true,
        message: 'Scoured item back to Normal quality!',
      };
    }

    case 'jeweller': {
      if (maxSockets <= 0) {
        return { updatedItem: item, success: false, message: 'This item slot cannot have sockets!' };
      }
      const numSockets = 1 + Math.floor(Math.random() * maxSockets);
      const newSockets = generateItemSockets(maxSockets, reqStr, reqDex, reqInt, numSockets);

      return {
        updatedItem: { ...item, sockets: newSockets },
        success: true,
        message: `Jeweller's Orb reforged sockets: Now has ${newSockets.length} Sockets!`,
      };
    }

    case 'fusing': {
      if (!item.sockets || item.sockets.length <= 1) {
        return { updatedItem: item, success: false, message: 'Item needs at least 2 sockets to link!' };
      }
      const linkedSockets = rerollSocketLinks(item.sockets);
      return {
        updatedItem: { ...item, sockets: linkedSockets },
        success: true,
        message: 'Orb of Fusing rerolled socket links!',
      };
    }

    case 'chromatic': {
      if (!item.sockets || item.sockets.length === 0) {
        return { updatedItem: item, success: false, message: 'Item has no sockets to recolor!' };
      }
      const recolored = item.sockets.map((sock) => ({
        ...sock,
        color: rollSocketColor(reqStr, reqDex, reqInt),
      }));

      return {
        updatedItem: { ...item, sockets: recolored },
        success: true,
        message: 'Chromatic Orb recolored item sockets!',
      };
    }

    case 'whetstone':
    case 'scrap': {
      const currentQuality = item.quality || 0;
      if (currentQuality >= 20) {
        return { updatedItem: item, success: false, message: 'Item is already at maximum +20% Quality!' };
      }
      const nextQuality = Math.min(20, currentQuality + 5);
      return {
        updatedItem: { ...item, quality: nextQuality },
        success: true,
        message: `Quality increased to +${nextQuality}%!`,
      };
    }

    case 'vaal': {
      const roll = Math.random();
      if (roll < 0.25) {
        // White socket outcome
        const whiteSockets = (item.sockets || []).map((s) => ({ ...s, color: 'white' as SocketColor }));
        return {
          updatedItem: { ...item, sockets: whiteSockets, isCorrupted: true },
          success: true,
          message: 'VAAL CORRUPTION: Turned ALL Sockets WHITE!',
        };
      } else if (roll < 0.50) {
        // Implicit upgrade
        return {
          updatedItem: {
            ...item,
            implicitStat: { label: '+1 to Level of Socketed Skill Gems', value: 1, statKey: 'gemLevel' },
            isCorrupted: true,
          },
          success: true,
          message: 'VAAL CORRUPTION: Granted +1 to Level of Socketed Gems!',
        };
      } else {
        // Corrupt only
        return {
          updatedItem: { ...item, isCorrupted: true },
          success: true,
          message: 'Item has been CORRUPTED!',
        };
      }
    }

    default:
      return { updatedItem: item, success: false, message: 'Unknown orb type.' };
  }
}

/**
 * Calculates total combined stat bonuses across all equipped items, applying equipment stat penalties for under-leveled or under-stat gear.
 */
export function calculateEquipmentTotalBonuses(
  equipment: Record<string, Item | null>,
  characterLevel: number = 1,
  charBaseStats?: { str?: number; dex?: number; int?: number }
) {
  let totalStr = 0;
  let totalDex = 0;
  let totalInt = 0;
  let totalDef = 0;
  let totalSpd = 0;
  let totalWis = 0;

  let totalArmour = 0;
  let totalEvasion = 0;
  let totalEnergyShield = 0;
  let totalFlatLife = 0;
  let totalFlatMana = 0;

  let totalFireRes = 0;
  let totalColdRes = 0;
  let totalLightningRes = 0;
  let totalChaosRes = 0;

  let totalAllSkillGems = 0;
  let totalFireSkillGems = 0;
  let totalManaCostReductionPct = 0;
  let totalCooldownRecoveryPct = 0;
  let totalAoePct = 0;
  let totalSpellDmgPct = 0;
  let totalElemDmgPct = 0;
  let totalManaRegenPct = 0;

  Object.values(equipment).forEach((item) => {
    if (!item) return;
    const totals = calculateTotalItemStats(item, characterLevel, charBaseStats);
    const ench = item.enchantLevel || 0;
    const eff = totals.penalty?.efficiency ?? 1.0;

    // Base legacy stats
    if (item.baseStats?.str) totalStr += Math.round((item.baseStats.str + ench * 3) * eff);
    if (item.baseStats?.int) totalInt += Math.round((item.baseStats.int + ench * 3) * eff);
    if (item.baseStats?.def) totalDef += Math.round((item.baseStats.def + ench * 2) * eff);
    if (item.baseStats?.spd) totalSpd += Math.round((item.baseStats.spd + ench) * eff);
    if (item.baseStats?.wis) totalWis += Math.round((item.baseStats.wis + ench * 2) * eff);
    if (item.baseStats?.dex) totalDex += Math.round((item.baseStats.dex + ench * 2) * eff);

    // PoE stats
    totalStr += totals.flatStr;
    totalDex += totals.flatDex;
    totalInt += totals.flatInt;
    totalWis += totals.flatWis;
    totalArmour += totals.armour;
    totalEvasion += totals.evasion;
    totalEnergyShield += totals.energyShield;
    totalFlatLife += totals.flatLife;
    totalFlatMana += totals.flatMana;
    totalFireRes += totals.fireRes;
    totalColdRes += totals.coldRes;
    totalLightningRes += totals.lightningRes;
    totalChaosRes += totals.chaosRes;

    // Skill & Attribute synergy totals
    totalAllSkillGems += totals.allSkillGems;
    totalFireSkillGems += totals.fireSkillGems;
    totalManaCostReductionPct += totals.manaCostReductionPct;
    totalCooldownRecoveryPct += totals.cooldownRecoveryPct;
    totalAoePct += totals.aoePct;
    totalSpellDmgPct += totals.spellDmgPct;
    totalElemDmgPct += totals.elemDmgPct;
    totalManaRegenPct += totals.manaRegenPct;
  });

  return {
    totalStr,
    totalDex,
    totalInt,
    totalDef,
    totalSpd,
    totalWis,
    totalArmour,
    totalEvasion,
    totalEnergyShield,
    totalFlatLife,
    totalFlatMana,
    totalFireRes,
    totalColdRes,
    totalLightningRes,
    totalChaosRes,
    totalAllSkillGems,
    totalFireSkillGems,
    totalManaCostReductionPct,
    totalCooldownRecoveryPct,
    totalAoePct,
    totalSpellDmgPct,
    totalElemDmgPct,
    totalManaRegenPct,
  };
}
