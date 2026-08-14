export interface MonsterTemplate {
  id: string;
  name: string;
  icon: string;
  category: 'Undead' | 'Beast' | 'Demon' | 'Construct' | 'Element' | 'Humanoid' | 'Void' | 'Dragon' | 'Serpent';
  archetype: 'tank' | 'assassin' | 'caster' | 'berserker' | 'support' | 'balanced';
  minFloor: number;
  maxFloor: number;
  tier: 'common' | 'uncommon' | 'rare' | 'elite';
  statMultipliers: {
    hp: number;
    str: number;
    def: number;
    spd: number;
    int: number;
    wis: number;
  };
  traits?: string[];
}

export interface BossTemplate {
  id: string;
  name: string;
  title: string;
  icon: string;
  category: 'Undead' | 'Demon' | 'Construct' | 'Dragon' | 'Void' | 'Celestial' | 'Serpent' | 'Titan' | 'Abyssal' | 'Beast' | 'Humanoid' | 'Element';
  minFloor: number;
  maxFloor: number;
  statMultipliers: {
    hp: number;
    str: number;
    def: number;
    spd: number;
    int: number;
    wis: number;
    ward: number;
  };
  bossAura?: string;
  specialSkills?: string[];
}

export const MONSTER_POOL: MonsterTemplate[] = [
  // Tier 1: Floors 1 - 15
  {
    id: 'm_slime_acid',
    name: 'Sun Valley Acid Slime',
    icon: '🧪',
    category: 'Element',
    archetype: 'tank',
    minFloor: 1,
    maxFloor: 15,
    tier: 'common',
    statMultipliers: { hp: 1.35, str: 0.85, def: 1.25, spd: 0.8, int: 0.7, wis: 1.0 },
    traits: ['Corrosive Coating', 'Slow'],
  },
  {
    id: 'm_goblin_skulker',
    name: 'Grotto Goblin Skulker',
    icon: '👺',
    category: 'Humanoid',
    archetype: 'assassin',
    minFloor: 1,
    maxFloor: 20,
    tier: 'common',
    statMultipliers: { hp: 0.85, str: 1.2, def: 0.8, spd: 1.35, int: 0.8, wis: 0.8 },
    traits: ['Backstab', 'Quick Step'],
  },
  {
    id: 'm_direwolf_savage',
    name: 'Sunland Savage Direwolf',
    icon: '🐺',
    category: 'Beast',
    archetype: 'berserker',
    minFloor: 1,
    maxFloor: 25,
    tier: 'common',
    statMultipliers: { hp: 1.1, str: 1.3, def: 0.9, spd: 1.15, int: 0.6, wis: 0.8 },
    traits: ['Savage Bite', 'Pack Howl'],
  },
  {
    id: 'm_skeleton_guard',
    name: 'Crypt Skeleton Shieldbearer',
    icon: '💀',
    category: 'Undead',
    archetype: 'tank',
    minFloor: 2,
    maxFloor: 25,
    tier: 'common',
    statMultipliers: { hp: 1.3, str: 0.95, def: 1.4, spd: 0.75, int: 0.5, wis: 0.9 },
    traits: ['Bone Wall', 'Undead Fortitude'],
  },
  {
    id: 'm_imp_flame',
    name: 'Abyssal Flame Imp',
    icon: '👿',
    category: 'Demon',
    archetype: 'caster',
    minFloor: 3,
    maxFloor: 30,
    tier: 'uncommon',
    statMultipliers: { hp: 0.8, str: 0.7, def: 0.75, spd: 1.2, int: 1.4, wis: 1.1 },
    traits: ['Hellfire Burst', 'Mana Singe'],
  },
  {
    id: 'm_viper_poison',
    name: 'Sunken Emerald Viper',
    icon: '🐍',
    category: 'Serpent',
    archetype: 'assassin',
    minFloor: 5,
    maxFloor: 30,
    tier: 'uncommon',
    statMultipliers: { hp: 0.85, str: 1.25, def: 0.85, spd: 1.3, int: 0.9, wis: 0.9 },
    traits: ['Venomous Fangs', 'Evasion'],
  },
  {
    id: 'm_golem_stone',
    name: 'Runic Moss Golem',
    icon: '🗿',
    category: 'Construct',
    archetype: 'tank',
    minFloor: 8,
    maxFloor: 35,
    tier: 'uncommon',
    statMultipliers: { hp: 1.5, str: 1.1, def: 1.5, spd: 0.6, int: 0.5, wis: 1.0 },
    traits: ['Stun Slam', 'Granite Shell'],
  },

  // Tier 2: Floors 16 - 40
  {
    id: 'm_centurion_solar',
    name: 'Solar Temple Centurion',
    icon: '🛡️',
    category: 'Humanoid',
    archetype: 'tank',
    minFloor: 16,
    maxFloor: 45,
    tier: 'uncommon',
    statMultipliers: { hp: 1.35, str: 1.15, def: 1.35, spd: 0.9, int: 0.9, wis: 1.1 },
    traits: ['Radiant Shield', 'Holy Cleave'],
  },
  {
    id: 'm_phantom_shadow',
    name: 'Shadowland Spectre',
    icon: '👻',
    category: 'Undead',
    archetype: 'caster',
    minFloor: 18,
    maxFloor: 50,
    tier: 'rare',
    statMultipliers: { hp: 0.85, str: 0.6, def: 0.8, spd: 1.25, int: 1.45, wis: 1.3 },
    traits: ['Soul Drain', 'Curse of Frailty'],
  },
  {
    id: 'm_hound_infernal',
    name: 'Brimstone Hellhound',
    icon: '🐕‍🦺',
    category: 'Demon',
    archetype: 'berserker',
    minFloor: 20,
    maxFloor: 55,
    tier: 'rare',
    statMultipliers: { hp: 1.15, str: 1.4, def: 0.95, spd: 1.2, int: 0.8, wis: 0.8 },
    traits: ['Fiery Pounce', 'Terror Howl'],
  },
  {
    id: 'm_cultist_dark',
    name: 'Blood Cult Zealot',
    icon: '🧙‍♂️',
    category: 'Humanoid',
    archetype: 'support',
    minFloor: 22,
    maxFloor: 55,
    tier: 'uncommon',
    statMultipliers: { hp: 0.95, str: 0.8, def: 0.9, spd: 1.1, int: 1.25, wis: 1.3 },
    traits: ['Dark Ritual', 'Siphon Life'],
  },
  {
    id: 'm_bat_vampire',
    name: 'Nightwing Bloodbat',
    icon: '🦇',
    category: 'Beast',
    archetype: 'assassin',
    minFloor: 25,
    maxFloor: 60,
    tier: 'rare',
    statMultipliers: { hp: 0.8, str: 1.3, def: 0.8, spd: 1.4, int: 0.8, wis: 0.8 },
    traits: ['Vampiric Fangs', 'Echolocation'],
  },

  // Tier 3: Floors 41 - 70
  {
    id: 'm_drake_lava',
    name: 'Lava Basin Drake Spawn',
    icon: '🐉',
    category: 'Dragon',
    archetype: 'berserker',
    minFloor: 35,
    maxFloor: 75,
    tier: 'rare',
    statMultipliers: { hp: 1.25, str: 1.45, def: 1.15, spd: 1.1, int: 1.0, wis: 0.9 },
    traits: ['Molten Breath', 'Scaly Hide'],
  },
  {
    id: 'm_frost_wight',
    name: 'Glacier Frost Wight',
    icon: '❄️',
    category: 'Undead',
    archetype: 'caster',
    minFloor: 40,
    maxFloor: 80,
    tier: 'rare',
    statMultipliers: { hp: 1.0, str: 0.8, def: 1.1, spd: 1.05, int: 1.4, wis: 1.3 },
    traits: ['Chilling Aura', 'Ice Lance'],
  },
  {
    id: 'm_void_stalker',
    name: 'Abyssal Void Stalker',
    icon: '👁️',
    category: 'Void',
    archetype: 'assassin',
    minFloor: 45,
    maxFloor: 85,
    tier: 'elite',
    statMultipliers: { hp: 0.9, str: 1.45, def: 0.9, spd: 1.45, int: 1.1, wis: 0.9 },
    traits: ['Void Strike', 'Phase Shift'],
  },
  {
    id: 'm_mind_flayer',
    name: 'Eldritch Mind Flayer',
    icon: '🦑',
    category: 'Void',
    archetype: 'support',
    minFloor: 50,
    maxFloor: 90,
    tier: 'elite',
    statMultipliers: { hp: 1.05, str: 0.7, def: 1.0, spd: 1.15, int: 1.5, wis: 1.4 },
    traits: ['Mind Blast', 'Psychic Ward'],
  },
  {
    id: 'm_automaton_iron',
    name: 'Clockwork Steel Colossus',
    icon: '🤖',
    category: 'Construct',
    archetype: 'tank',
    minFloor: 55,
    maxFloor: 95,
    tier: 'elite',
    statMultipliers: { hp: 1.6, str: 1.2, def: 1.6, spd: 0.7, int: 0.6, wis: 1.1 },
    traits: ['Overclock', 'Iron Fortress'],
  },

  // Tier 4: Floors 71 - 100+
  {
    id: 'm_solar_archon',
    name: 'Empyrean Sunward Knight',
    icon: '⚔️',
    category: 'Humanoid',
    archetype: 'balanced',
    minFloor: 65,
    maxFloor: 120,
    tier: 'elite',
    statMultipliers: { hp: 1.25, str: 1.35, def: 1.3, spd: 1.15, int: 1.1, wis: 1.2 },
    traits: ['Sunburst Blade', 'Aegis Aura'],
  },
  {
    id: 'm_chaos_wyrm',
    name: 'Cataclysmic Chaos Wyrm',
    icon: '🐲',
    category: 'Dragon',
    archetype: 'berserker',
    minFloor: 70,
    maxFloor: 120,
    tier: 'elite',
    statMultipliers: { hp: 1.4, str: 1.6, def: 1.2, spd: 1.1, int: 1.2, wis: 1.0 },
    traits: ['Disaster Flare', 'Dragon Fear'],
  },
  {
    id: 'm_void_specter_apex',
    name: 'Apex Dimensional Phantom',
    icon: '🌌',
    category: 'Void',
    archetype: 'assassin',
    minFloor: 75,
    maxFloor: 120,
    tier: 'elite',
    statMultipliers: { hp: 1.0, str: 1.5, def: 1.0, spd: 1.5, int: 1.3, wis: 1.1 },
    traits: ['Singularity Cut', 'Unstable Reality'],
  },
  {
    id: 'm_doom_behemoth',
    name: 'Titan Earthbreaker Behemoth',
    icon: '💥',
    category: 'Construct',
    archetype: 'tank',
    minFloor: 80,
    maxFloor: 120,
    tier: 'elite',
    statMultipliers: { hp: 1.7, str: 1.35, def: 1.65, spd: 0.75, int: 0.7, wis: 1.2 },
    traits: ['Tectonic Quake', 'Unbreakable Wall'],
  },
];

export const BOSS_POOL: BossTemplate[] = [
  // Floor 1 - 20 Bosses
  {
    id: 'boss_gargoyle_stone',
    name: 'Gargoyle Stone Overlord',
    title: 'Grotto Warden',
    icon: '🗿',
    category: 'Construct',
    minFloor: 1,
    maxFloor: 20,
    statMultipliers: { hp: 4.5, str: 2.1, def: 2.2, spd: 1.1, int: 1.5, wis: 1.8, ward: 2.0 },
    bossAura: 'Granite Citadel (Boosts party Defense)',
    specialSkills: ['Rockfall Stun', 'Gargoyle Roar'],
  },
  {
    id: 'boss_goblin_king',
    name: 'King Gulgam the Ravenous',
    title: 'Horde Chieftain',
    icon: '👑',
    category: 'Humanoid',
    minFloor: 5,
    maxFloor: 25,
    statMultipliers: { hp: 4.0, str: 2.3, def: 1.7, spd: 1.35, int: 1.4, wis: 1.4, ward: 1.5 },
    bossAura: 'Bloodlust Call (Increases Minion Attack)',
    specialSkills: ['Gold Theft Slash', 'Rally Minions'],
  },

  // Floor 21 - 40 Bosses
  {
    id: 'boss_sunken_kraken',
    name: 'Sunken Kraken Fiend',
    title: 'Terror of the Abyss',
    icon: '🐙',
    category: 'Abyssal',
    minFloor: 15,
    maxFloor: 35,
    statMultipliers: { hp: 5.0, str: 2.0, def: 1.9, spd: 1.05, int: 2.0, wis: 1.8, ward: 2.2 },
    bossAura: 'Tidal Wave (Periodically slows enemies)',
    specialSkills: ['Tentacle Constrict', 'Ink Cloud Blind'],
  },
  {
    id: 'boss_vampire_matriarch',
    name: 'Vampiric Shadow Matriarch',
    title: 'Blood Empress',
    icon: '🦇',
    category: 'Undead',
    minFloor: 25,
    maxFloor: 45,
    statMultipliers: { hp: 4.2, str: 2.4, def: 1.8, spd: 1.4, int: 2.2, wis: 1.9, ward: 1.8 },
    bossAura: 'Vampiric Field (Heals on dealing damage)',
    specialSkills: ['Crimson Drain', 'Swarm of Night'],
  },

  // Floor 41 - 60 Bosses
  {
    id: 'boss_infernal_drake',
    name: 'Infernal Nether Drake',
    title: 'Ashen Dragon Prince',
    icon: '🐲',
    category: 'Dragon',
    minFloor: 35,
    maxFloor: 60,
    statMultipliers: { hp: 5.2, str: 2.5, def: 2.0, spd: 1.2, int: 2.3, wis: 1.8, ward: 2.0 },
    bossAura: 'Scorching Heat (Applies Burn to attackers)',
    specialSkills: ['Inferno Nova', 'Cataclysm Wing Slam'],
  },
  {
    id: 'boss_gorgon_queen',
    name: 'Gorgon Queen of Serpents',
    title: 'Venom Sovereign',
    icon: '🐍',
    category: 'Serpent',
    minFloor: 45,
    maxFloor: 70,
    statMultipliers: { hp: 4.6, str: 2.2, def: 1.9, spd: 1.3, int: 2.4, wis: 2.0, ward: 1.9 },
    bossAura: 'Petrifying Stare (Lowers speed & physical resist)',
    specialSkills: ['Stone Gaze', 'Venomous Deluge'],
  },

  // Floor 61 - 80 Bosses
  {
    id: 'boss_frost_titan',
    name: 'Frostbite Titan Monarch',
    title: 'Ruler of the Frozen Wastes',
    icon: '❄️',
    category: 'Titan',
    minFloor: 55,
    maxFloor: 80,
    statMultipliers: { hp: 5.5, str: 2.3, def: 2.4, spd: 1.0, int: 2.2, wis: 2.2, ward: 2.5 },
    bossAura: 'Absolute Zero (Reduces player Mana regen)',
    specialSkills: ['Glacial Avalanche', 'Frozen Prison'],
  },
  {
    id: 'boss_void_conqueror',
    name: 'Eldritch Void Conqueror',
    title: 'Harbinger of Nonexistence',
    icon: '👁️',
    category: 'Void',
    minFloor: 65,
    maxFloor: 90,
    statMultipliers: { hp: 4.8, str: 2.4, def: 2.0, spd: 1.35, int: 2.7, wis: 2.5, ward: 2.4 },
    bossAura: 'Singularity Aura (Periodically silences skills)',
    specialSkills: ['Void Obliteration', 'Mind Shatter'],
  },

  // Floor 81 - 100+ Bosses
  {
    id: 'boss_sol_tyrant',
    name: 'Celestial Sol Tyrant',
    title: 'Solar Deity Champion',
    icon: '☀️',
    category: 'Celestial',
    minFloor: 75,
    maxFloor: 110,
    statMultipliers: { hp: 5.6, str: 2.6, def: 2.3, spd: 1.3, int: 2.8, wis: 2.6, ward: 2.8 },
    bossAura: 'Supernova Radiance (Deal constant radiant AoE damage)',
    specialSkills: ['Solar Flare Cleave', 'Judgment of Dawn'],
  },
  {
    id: 'boss_god_destroyer',
    name: 'Sun Realm God Destroyer',
    title: 'The End of Light',
    icon: '👑',
    category: 'Titan',
    minFloor: 85,
    maxFloor: 150,
    statMultipliers: { hp: 6.5, str: 3.0, def: 2.6, spd: 1.4, int: 3.0, wis: 2.8, ward: 3.2 },
    bossAura: 'Omnipotent Doom (Massively reduces player armor and wards)',
    specialSkills: ['Universe Shatter', 'Final Eradication', 'Aegis Nullification'],
  },
];

/**
  Pick monsters for a floor from the pool
 */
export function getMonstersForFloor(floor: number, count: number): MonsterTemplate[] {
  // Filter monsters that can appear on this floor
  let eligible = MONSTER_POOL.filter((m) => floor >= m.minFloor && floor <= m.maxFloor);

  // Fallback if floor is higher or out of range
  if (eligible.length === 0) {
    eligible = MONSTER_POOL.filter((m) => m.minFloor <= floor);
  }
  if (eligible.length === 0) {
    eligible = MONSTER_POOL;
  }

  const selected: MonsterTemplate[] = [];
  for (let i = 0; i < count; i++) {
    const randomIdx = Math.floor(Math.random() * eligible.length);
    selected.push(eligible[randomIdx]);
  }
  return selected;
}

/**
  Pick a Boss for a floor from the boss pool
 */
export function getBossForFloor(floor: number): BossTemplate {
  let eligible = BOSS_POOL.filter((b) => floor >= b.minFloor && floor <= b.maxFloor);

  if (eligible.length === 0) {
    eligible = BOSS_POOL.filter((b) => b.minFloor <= floor);
  }
  if (eligible.length === 0) {
    eligible = BOSS_POOL;
  }

  const randomIdx = Math.floor(Math.random() * eligible.length);
  return eligible[randomIdx];
}

/**
  Determine if a random Boss Ambush occurs on a non-boss floor.
  Base chance: 18% (0.18). Can scale slightly with floor depth.
 */
export function shouldSpawnRandomBoss(floor: number): boolean {
  // Floor 1 is kept smooth for beginners, starting at 12% chance, ramping up to 20% on higher floors
  const baseChance = Math.min(0.22, 0.12 + Math.floor(floor / 10) * 0.01);
  return Math.random() < baseChance;
}
