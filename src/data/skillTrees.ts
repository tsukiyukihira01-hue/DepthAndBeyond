import { CharacterStats } from '../types/game';

export interface SkillTreeNode {
  id: string;
  name: string;
  icon: string;
  type: 'passive' | 'autoCast' | 'active';
  description: string;
  tier: number; // 1, 2, 3, 4
  maxRank: number;
  costPerRank: number;
  prerequisites?: string[];
  skillId?: string;
  typeDetail?: 'physical' | 'magical' | 'buff' | 'debuff' | 'support';
  manaCost?: number;
  cooldownTurns?: number;
  channelTurns?: number;
  damageMultiplier?: number;
  targetType?: 'single' | 'all' | 'random_2' | 'random_3' | 'highest_hp' | 'lowest_hp' | 'self' | 'ally_single' | 'ally_all';
  wardGrant?: number;
  statBonusPerRank?: Partial<CharacterStats>;
}

export interface SkillTree {
  id: string;
  name: string;
  archetype: string;
  icon: string;
  color: 'amber' | 'rose' | 'sky' | 'emerald' | 'purple' | 'indigo' | 'cyan' | 'yellow' | 'red' | 'teal' | 'blue' | 'violet' | 'fuchsia' | 'orange' | 'lime' | 'stone';
  bgGradient: string;
  description: string;
  primaryStat: keyof CharacterStats;
  nodes: SkillTreeNode[];
}

export const SKILL_TREES: SkillTree[] = [
  // 1. VANGUARD AEGIS
  {
    id: 'tree_vanguard',
    name: 'Vanguard Aegis',
    archetype: 'Tanking, Fortification & Counter',
    icon: '🛡️',
    color: 'amber',
    bgGradient: 'from-amber-950/80 via-slate-900 to-amber-900/40',
    description: 'Master defensive warfare through steady travel nodes and fortress passives leading into impenetrable shields.',
    primaryStat: 'def',
    nodes: [
      // Tier 1 Minor Nodes
      { id: 'vg_t1_1', name: 'Iron Reflex', icon: '🛡️', type: 'passive', description: '+2 DEF, +10 HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { def: 2, maxHp: 10 } },
      { id: 'vg_t1_2', name: 'Steel Core', icon: '🧱', type: 'passive', description: '+3 DEF per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { def: 3 } },
      { id: 'vg_t1_3', name: 'Stalwart Guard', icon: '🪨', type: 'passive', description: '+15 Max HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { maxHp: 15 } },
      
      // Tier 2 Intermediate Nodes
      { id: 'vg_t2_1', name: 'Defensive Stance', icon: '🛡️', type: 'passive', description: '+3 DEF, +1 STR per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['vg_t1_1'], statBonusPerRank: { def: 3, str: 1 } },
      { id: 'vg_n2', name: 'Shield Bash', icon: '💥', type: 'active', skillId: 's_shield_bash', description: 'Strike dealing 140% DEF-scaling physical damage and stuns target.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['vg_t1_2'], typeDetail: 'physical', manaCost: 18, cooldownTurns: 2, damageMultiplier: 1.4, targetType: 'single' },
      { id: 'vg_t2_3', name: 'Armored Joints', icon: '🔩', type: 'passive', description: '+2 DEF, +20 HP per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['vg_t1_3'], statBonusPerRank: { def: 2, maxHp: 20 } },
      { id: 'vg_n3', name: 'Guardian Ward', icon: '✨', type: 'autoCast', skillId: 's_auto_guardian_ward', description: 'Auto-Cast: Grants Ward shield equal to 120 + 200% DEF at turn start.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['vg_t2_1'], wardGrant: 150 },

      // Tier 3 Notables
      { id: 'vg_n4', name: 'Fortress Stance', icon: '🏰', type: 'passive', description: 'Reduces damage received. +5 DEF, +25 HP per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['vg_t2_3'], statBonusPerRank: { def: 5, maxHp: 25 } },
      { id: 'vg_t3_2', name: 'Stoic Endurance', icon: '🛡️', type: 'passive', description: '+4 DEF, +2 STR per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['vg_n3'], statBonusPerRank: { def: 4, str: 2 } },
      { id: 'vg_n5', name: 'Taunting Warcry', icon: '🗣️', type: 'active', skillId: 's_taunting_warcry', description: 'Forces enemies to attack you and reduces enemy ATK by 25%.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['vg_n2', 'vg_n4'], typeDetail: 'debuff', manaCost: 25, cooldownTurns: 3, targetType: 'all' },
      { id: 'vg_t3_4', name: 'Bulwark Mastery', icon: '👑', type: 'passive', description: '+6 DEF per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['vg_n4'], statBonusPerRank: { def: 6 } },

      // Tier 4 Keystones
      { id: 'vg_n6', name: 'Fortress Shield', icon: '🏆', type: 'active', skillId: 's_bastion_sovereign', description: 'Ultimate: Invulnerability Ward for 1 turn, reflects 80% damage.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['vg_n5', 'vg_t3_4'], typeDetail: 'support', manaCost: 50, cooldownTurns: 5, targetType: 'self', wardGrant: 800 },
      { id: 'vg_t4_2', name: 'Aegis Keystone', icon: '⭐', type: 'passive', description: '+12 DEF, +80 Max HP.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['vg_t3_2', 'vg_t3_4'], statBonusPerRank: { def: 12, maxHp: 80 } },
    ],
  },

  // 2. BLADE TEMPEST
  {
    id: 'tree_blade',
    name: 'Blade Tempest',
    archetype: 'Melee Criticals & Flurry Strikes',
    icon: '⚔️',
    color: 'rose',
    bgGradient: 'from-rose-950/80 via-slate-900 to-red-900/40',
    description: 'Progress through blade mastery travel nodes to unlock whirlwind sweeps and heavy strikes.',
    primaryStat: 'str',
    nodes: [
      // Tier 1
      { id: 'bt_t1_1', name: 'Blade Edge', icon: '🗡️', type: 'passive', description: '+3 STR per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 3 } },
      { id: 'bt_t1_2', name: 'Swift Stride', icon: '👟', type: 'passive', description: '+2 STR, +1 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 2, spd: 1 } },
      { id: 'bt_t1_3', name: 'Keen Eye', icon: '🎯', type: 'passive', description: '+2 DEX, +1 STR per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { dex: 2, str: 1 } },

      // Tier 2
      { id: 'bt_t2_1', name: 'Martial Focus', icon: '⚔️', type: 'passive', description: '+4 STR per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['bt_t1_1'], statBonusPerRank: { str: 4 } },
      { id: 'bt_n2', name: 'Whirlwind Strike', icon: '🌀', type: 'active', skillId: 's_whirlwind_strike', description: 'Sweeps weapon in a wide circle dealing 130% physical damage to ALL enemies.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['bt_t1_2'], typeDetail: 'physical', manaCost: 15, cooldownTurns: 1, damageMultiplier: 1.3, targetType: 'all' },
      { id: 'bt_t2_3', name: 'Razor Precision', icon: '🗡️', type: 'passive', description: '+3 STR, +2 DEX per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['bt_t1_3'], statBonusPerRank: { str: 3, dex: 2 } },
      { id: 'bt_n3', name: 'Bloodthirst Strike', icon: '🩸', type: 'active', skillId: 's_bloodthirst_strike', description: 'Lethal strike dealing 180% damage and healing self for 35% of damage.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['bt_t2_1'], typeDetail: 'physical', manaCost: 22, cooldownTurns: 2, damageMultiplier: 1.8, targetType: 'single' },

      // Tier 3
      { id: 'bt_n4', name: 'Duelist Precision', icon: '🎯', type: 'passive', description: '+5 STR, +3 SPD per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['bt_t2_3'], statBonusPerRank: { str: 5, spd: 3 } },
      { id: 'bt_t3_2', name: 'Heavy Cleave Focus', icon: '💥', type: 'passive', description: '+6 STR, +15 HP per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['bt_n3'], statBonusPerRank: { str: 6, maxHp: 15 } },
      { id: 'bt_n5', name: 'Blade Flurry', icon: '⚔️', type: 'active', skillId: 's_blade_flurry', description: 'Unleashes 3 rapid slashes dealing 110% damage each to random targets.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['bt_n2', 'bt_n4'], typeDetail: 'physical', manaCost: 35, cooldownTurns: 3, damageMultiplier: 1.1, targetType: 'random_3' },
      { id: 'bt_t3_4', name: 'Relentless Tempo', icon: '⚡', type: 'passive', description: '+4 STR, +2 SPD per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['bt_n4'], statBonusPerRank: { str: 4, spd: 2 } },

      // Tier 4
      { id: 'bt_n6', name: 'Heavy Strike', icon: '💥', type: 'active', skillId: 's_headhunter_strike', description: 'Pinnacle: Locks onto highest HP target dealing 320% crushing critical damage.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['bt_n5', 'bt_t3_4'], typeDetail: 'physical', manaCost: 45, cooldownTurns: 4, damageMultiplier: 3.2, targetType: 'highest_hp' },
      { id: 'bt_t4_2', name: 'Blademaster Keystone', icon: '👑', type: 'passive', description: '+14 STR, +5 SPD.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['bt_t3_2', 'bt_t3_4'], statBonusPerRank: { str: 14, spd: 5 } },
    ],
  },

  // 3. PYROMANCY ARC
  {
    id: 'tree_pyro',
    name: 'Pyromancy Arc',
    archetype: 'Fire Destruction & Ignition DoTs',
    icon: '🔥',
    color: 'orange',
    bgGradient: 'from-orange-950/80 via-slate-900 to-amber-900/40',
    description: 'Channel minor embers into world-burning fireballs and supernovas.',
    primaryStat: 'int',
    nodes: [
      // Tier 1
      { id: 'py_t1_1', name: 'Sparks of Intellect', icon: '✨', type: 'passive', description: '+3 INT per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 3 } },
      { id: 'py_t1_2', name: 'Ember Affinity', icon: '🔥', type: 'passive', description: '+2 INT, +10 Mana per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 2, maxMana: 10 } },
      { id: 'py_t1_3', name: 'Warmth Focus', icon: '☀️', type: 'passive', description: '+2 INT, +1 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 2, spd: 1 } },

      // Tier 2
      { id: 'py_t2_1', name: 'Thermal Flow', icon: '🌋', type: 'passive', description: '+4 INT per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['py_t1_1'], statBonusPerRank: { int: 4 } },
      { id: 'py_n2', name: 'Fireball Blast', icon: '☄️', type: 'active', skillId: 's_fireball', description: 'Hurls fiery orb dealing 175% magical fire damage to target.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['py_t1_2'], typeDetail: 'magical', manaCost: 20, cooldownTurns: 1, damageMultiplier: 1.75, targetType: 'single' },
      { id: 'py_t2_3', name: 'Pyre Mastery', icon: '💥', type: 'passive', description: '+3 INT, +15 Mana per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['py_t1_3'], statBonusPerRank: { int: 3, maxMana: 15 } },
      { id: 'py_n4', name: 'Ignition Aura', icon: '🌟', type: 'autoCast', skillId: 's_auto_ignition', description: 'Auto-Cast: Automatically burns all enemies for 40 fire magic damage every turn.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['py_t2_1'], damageMultiplier: 0.5 },

      // Tier 3
      { id: 'py_n3', name: 'Flame Nova', icon: '💥', type: 'active', skillId: 's_flame_nova', description: 'Detonates a fiery ring dealing 145% fire damage to ALL enemies.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['py_n2', 'py_t2_3'], typeDetail: 'magical', manaCost: 32, cooldownTurns: 2, damageMultiplier: 1.45, targetType: 'all' },
      { id: 'py_t3_2', name: 'Molten Intellect', icon: '🔥', type: 'passive', description: '+5 INT, +2 SPD per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['py_n4'], statBonusPerRank: { int: 5, spd: 2 } },
      { id: 'py_n5', name: 'Infernal Combustion', icon: '🌋', type: 'active', skillId: 's_infernal_combustion', description: 'Solar ray dealing 280% massive fire damage to lowest HP target.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['py_n3', 'py_t3_2'], typeDetail: 'magical', manaCost: 40, cooldownTurns: 3, damageMultiplier: 2.8, targetType: 'lowest_hp' },
      { id: 'py_t3_4', name: 'Blazing Mastery', icon: '🌟', type: 'passive', description: '+6 INT per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['py_t3_2'], statBonusPerRank: { int: 6 } },

      // Tier 4
      { id: 'py_n6', name: 'Supernova', icon: '🌌', type: 'active', skillId: 's_supernova_cataclysm', description: 'Ultimate: Unleashes supernova dealing 350% fire damage to ALL enemies.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['py_n5', 'py_t3_4'], typeDetail: 'magical', manaCost: 65, cooldownTurns: 5, damageMultiplier: 3.5, targetType: 'all' },
      { id: 'py_t4_2', name: 'Arch-Pyromancer Keystone', icon: '👑', type: 'passive', description: '+14 INT, +40 Max Mana.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['py_t3_2', 'py_t3_4'], statBonusPerRank: { int: 14, maxMana: 40 } },
    ],
  },

  // 4. TEMPEST STORMCALLER
  {
    id: 'tree_tempest',
    name: 'Tempest Stormcaller',
    archetype: 'Lightning Magic & Overcharge Stuns',
    icon: '⚡',
    color: 'yellow',
    bgGradient: 'from-yellow-950/80 via-slate-900 to-amber-950/40',
    description: 'Harness high-speed static charges through passive pathways to call down storm tempests.',
    primaryStat: 'int',
    nodes: [
      // Tier 1
      { id: 'ts_t1_1', name: 'Static Charge', icon: '⚡', type: 'passive', description: '+2 INT, +1 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 2, spd: 1 } },
      { id: 'ts_t1_2', name: 'Lightning Reflexes', icon: '👟', type: 'passive', description: '+2 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { spd: 2 } },
      { id: 'ts_t1_3', name: 'Spark Conduit', icon: '🔋', type: 'passive', description: '+3 INT per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 3 } },

      // Tier 2
      { id: 'ts_t2_1', name: 'Electron Velocity', icon: '⚡', type: 'passive', description: '+3 INT, +2 SPD per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ts_t1_1'], statBonusPerRank: { int: 3, spd: 2 } },
      { id: 'ts_n2', name: 'Lightning Bolt', icon: '🌩️', type: 'active', skillId: 's_lightning_bolt', description: 'Fires high-speed electric current dealing 160% magical damage.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ts_t1_2'], typeDetail: 'magical', manaCost: 18, cooldownTurns: 1, damageMultiplier: 1.6, targetType: 'single' },
      { id: 'ts_t2_3', name: 'Overcharge Battery', icon: '🔋', type: 'passive', description: '+4 INT per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ts_t1_3'], statBonusPerRank: { int: 4 } },
      { id: 'ts_n3', name: 'Chain Shock', icon: '⛓️', type: 'active', skillId: 's_chain_shock', description: 'Lightning leaps across 3 random enemies dealing 135% magical damage each.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ts_t2_1'], typeDetail: 'magical', manaCost: 28, cooldownTurns: 2, damageMultiplier: 1.35, targetType: 'random_3' },

      // Tier 3
      { id: 'ts_t3_1', name: 'Storm Mastery', icon: '🌪️', type: 'passive', description: '+5 INT, +2 SPD per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ts_n3'], statBonusPerRank: { int: 5, spd: 2 } },
      { id: 'ts_n5', name: 'Thunder Strike Slam', icon: '🌩️', type: 'active', skillId: 's_thunder_strike_slam', description: 'Slam dealing 250% damage and stunning target for 1 turn.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['ts_n2', 'ts_t2_3'], typeDetail: 'magical', manaCost: 38, cooldownTurns: 3, damageMultiplier: 2.5, targetType: 'single' },
      { id: 'ts_t3_3', name: 'Voltaic Surge', icon: '⚡', type: 'passive', description: '+6 INT per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ts_t3_1'], statBonusPerRank: { int: 6 } },

      // Tier 4
      { id: 'ts_n6', name: 'Thunderstorm', icon: '🌪️', type: 'active', skillId: 's_giga_tempest', description: 'Ultimate: Apocalyptic thunderhead dealing 290% lightning damage to ALL enemies with 40% stun.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ts_n5', 'ts_t3_3'], typeDetail: 'magical', manaCost: 60, cooldownTurns: 5, damageMultiplier: 2.9, targetType: 'all' },
      { id: 'ts_t4_2', name: 'Stormbringer Keystone', icon: '👑', type: 'passive', description: '+12 INT, +6 SPD.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ts_t3_1', 'ts_t3_3'], statBonusPerRank: { int: 12, spd: 6 } },
    ],
  },

  // 5. FROSTBITE CRYOMANCY
  {
    id: 'tree_frost',
    name: 'Frostbite Cryomancy',
    archetype: 'Glacial Barriers & Freeze Control',
    icon: '❄️',
    color: 'cyan',
    bgGradient: 'from-cyan-950/80 via-slate-900 to-blue-900/40',
    description: 'Erect glacial barriers through steady passive paths leading to absolute freezing tempests.',
    primaryStat: 'wis',
    nodes: [
      // Tier 1
      { id: 'fr_t1_1', name: 'Chilling Mind', icon: '❄️', type: 'passive', description: '+2 WIS, +2 DEF per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 2, def: 2 } },
      { id: 'fr_t1_2', name: 'Frost Lining', icon: '🧊', type: 'passive', description: '+3 WIS per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 3 } },
      { id: 'fr_t1_3', name: 'Crystal Guard', icon: '💎', type: 'passive', description: '+2 DEF, +10 HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { def: 2, maxHp: 10 } },

      // Tier 2
      { id: 'fr_t2_1', name: 'Glacial Focus', icon: '🏔️', type: 'passive', description: '+3 WIS, +2 DEF per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['fr_t1_1'], statBonusPerRank: { wis: 3, def: 2 } },
      { id: 'fr_n2', name: 'Ice Shard Blast', icon: '💎', type: 'active', skillId: 's_ice_shard_blast', description: 'Launches razor ice shards dealing 150% magical damage and slows target.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['fr_t1_2'], typeDetail: 'magical', manaCost: 16, cooldownTurns: 1, damageMultiplier: 1.5, targetType: 'single' },
      { id: 'fr_t2_3', name: 'Permafrost Layer', icon: '🛡️', type: 'passive', description: '+4 WIS per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['fr_t1_3'], statBonusPerRank: { wis: 4 } },
      { id: 'fr_n3', name: 'Frost Barrier', icon: '🛡️', type: 'active', skillId: 's_frost_shield', description: 'Erects frozen shield granting 300 Ward and slowing attackers.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['fr_t2_1'], typeDetail: 'support', manaCost: 25, cooldownTurns: 3, wardGrant: 300, targetType: 'self' },

      // Tier 3
      { id: 'fr_t3_1', name: 'Absolute Zero Mastery', icon: '❄️', type: 'passive', description: '+5 WIS, +3 DEF per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['fr_n3'], statBonusPerRank: { wis: 5, def: 3 } },
      { id: 'fr_n5', name: 'Blizzard Storm', icon: '🌨️', type: 'active', skillId: 's_blizzard_storm', description: 'Glacial storm dealing 180% ice damage to ALL enemies with 25% freeze.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['fr_n2', 'fr_t2_3'], typeDetail: 'magical', manaCost: 36, cooldownTurns: 3, damageMultiplier: 1.8, targetType: 'all' },
      { id: 'fr_t3_3', name: 'Sub-Zero Resonance', icon: '🧊', type: 'passive', description: '+6 WIS per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['fr_t3_1'], statBonusPerRank: { wis: 6 } },

      // Tier 4
      { id: 'fr_n6', name: 'Glacial Freeze', icon: '👑', type: 'active', skillId: 's_glacial_sovereign', description: 'Ultimate: Freezes enemies for 1 turn and deals 300% ice damage.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['fr_n5', 'fr_t3_3'], typeDetail: 'magical', manaCost: 55, cooldownTurns: 5, damageMultiplier: 3.0, targetType: 'all' },
      { id: 'fr_t4_2', name: 'Frozen Monarch Keystone', icon: '⭐', type: 'passive', description: '+12 WIS, +8 DEF.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['fr_t3_1', 'fr_t3_3'], statBonusPerRank: { wis: 12, def: 8 } },
    ],
  },

  // 6. SYLVAN WARDEN
  {
    id: 'tree_sylvan',
    name: 'Sylvan Warden',
    archetype: 'Nature Regeneration & Thorn Armor',
    icon: '🌿',
    color: 'emerald',
    bgGradient: 'from-emerald-950/80 via-slate-900 to-green-900/40',
    description: 'Grow deep roots through minor vitality nodes to command healing lifeblooms and thorn counter strikes.',
    primaryStat: 'wis',
    nodes: [
      // Tier 1
      { id: 'sy_t1_1', name: 'Seed of Life', icon: '🌱', type: 'passive', description: '+15 Max HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { maxHp: 15 } },
      { id: 'sy_t1_2', name: 'Barkskin Touch', icon: '🪵', type: 'passive', description: '+2 DEF, +2 WIS per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { def: 2, wis: 2 } },
      { id: 'sy_t1_3', name: 'Wild Wisdom', icon: '🌿', type: 'passive', description: '+3 WIS per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 3 } },

      // Tier 2
      { id: 'sy_t2_1', name: 'Living Root', icon: '🌿', type: 'passive', description: '+2 WIS, +20 HP per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['sy_t1_1'], statBonusPerRank: { wis: 2, maxHp: 20 } },
      { id: 'sy_n2', name: 'Nature Grace', icon: '🍃', type: 'active', skillId: 's_healing_bloom', description: 'Heals target ally/self for 200 HP + 180% WIS scaling.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['sy_t1_2'], typeDetail: 'support', manaCost: 22, cooldownTurns: 2, targetType: 'ally_single' },
      { id: 'sy_t2_3', name: 'Thorn Weave', icon: '🌵', type: 'passive', description: '+3 WIS, +2 DEF per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['sy_t1_3'], statBonusPerRank: { wis: 3, def: 2 } },
      { id: 'sy_n3', name: 'Regrowth Blessing', icon: '✨', type: 'autoCast', skillId: 's_auto_regrowth', description: 'Auto-Cast: Automatically restores 45 HP to self every combat turn.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['sy_t2_1'] },

      // Tier 3
      { id: 'sy_t3_1', name: 'Photosynthesis', icon: '☀️', type: 'passive', description: '+5 WIS, +25 HP per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['sy_n3'], statBonusPerRank: { wis: 5, maxHp: 25 } },
      { id: 'sy_n5', name: 'Entangling Roots', icon: '🌾', type: 'active', skillId: 's_entangling_vines', description: 'Restrains all enemies dealing 130% nature damage and slowing ATK.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['sy_n2', 'sy_t2_3'], typeDetail: 'magical', manaCost: 32, cooldownTurns: 3, damageMultiplier: 1.3, targetType: 'all' },
      { id: 'sy_t3_3', name: 'Verdant Fortitude', icon: '🌳', type: 'passive', description: '+6 WIS, +3 DEF per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['sy_t3_1'], statBonusPerRank: { wis: 6, def: 3 } },

      // Tier 4
      { id: 'sy_n6', name: 'Healing Blossom', icon: '🌺', type: 'active', skillId: 's_world_tree_blossom', description: 'Ultimate: Heals entire team for 500 HP and grants 250 Ward shield.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['sy_n5', 'sy_t3_3'], typeDetail: 'support', manaCost: 50, cooldownTurns: 5, wardGrant: 250, targetType: 'ally_all' },
      { id: 'sy_t4_2', name: 'Heartwood Keystone', icon: '👑', type: 'passive', description: '+12 WIS, +100 Max HP.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['sy_t3_1', 'sy_t3_3'], statBonusPerRank: { wis: 12, maxHp: 100 } },
    ],
  },

  // 7. SHADOW STALKER
  {
    id: 'tree_shadow',
    name: 'Shadow Stalker',
    archetype: 'Stealth, Assassination & Bleed',
    icon: '🗡️',
    color: 'purple',
    bgGradient: 'from-purple-950/80 via-slate-900 to-indigo-950/40',
    description: 'Travel through shadow paths to execute lethal assassinations and continuous bleed strikes.',
    primaryStat: 'dex',
    nodes: [
      // Tier 1
      { id: 'sd_t1_1', name: 'Footpad Silence', icon: '👣', type: 'passive', description: '+2 DEX, +1 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { dex: 2, spd: 1 } },
      { id: 'sd_t1_2', name: 'Venomous Edge', icon: '🗡️', type: 'passive', description: '+3 DEX per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { dex: 3 } },
      { id: 'sd_t1_3', name: 'Night Sense', icon: '👁️', type: 'passive', description: '+2 DEX, +2 STR per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { dex: 2, str: 2 } },

      // Tier 2
      { id: 'sd_t2_1', name: 'Shadow Step', icon: '🕶️', type: 'passive', description: '+3 DEX, +2 SPD per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['sd_t1_1'], statBonusPerRank: { dex: 3, spd: 2 } },
      { id: 'sd_n2', name: 'Shadow Strike', icon: '🗡️', type: 'active', skillId: 's_shadow_strike', description: 'Teleports behind target dealing 190% dark physical damage.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['sd_t1_2'], typeDetail: 'physical', manaCost: 20, cooldownTurns: 1, damageMultiplier: 1.9, targetType: 'single' },
      { id: 'sd_t2_3', name: 'Subterfuge Mastery', icon: '🌑', type: 'passive', description: '+4 DEX per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['sd_t1_3'], statBonusPerRank: { dex: 4 } },
      { id: 'sd_n3', name: 'Vanish', icon: '💨', type: 'active', skillId: 's_vanish', description: 'Enters stealth state granting massive critical rate bonus for 2 turns.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['sd_t2_1'], typeDetail: 'buff', manaCost: 25, cooldownTurns: 3, targetType: 'self' },

      // Tier 3
      { id: 'sd_t3_1', name: 'Assassination Lore', icon: '💀', type: 'passive', description: '+5 DEX, +3 SPD per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['sd_n3'], statBonusPerRank: { dex: 5, spd: 3 } },
      { id: 'sd_n5', name: 'Death Mark', icon: '🎯', type: 'active', skillId: 's_death_mark', description: 'Marks target taking 40% increased damage from all attacks.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['sd_n2', 'sd_t2_3'], typeDetail: 'debuff', manaCost: 30, cooldownTurns: 3, targetType: 'single' },
      { id: 'sd_t3_3', name: 'Lethal Precision', icon: '🗡️', type: 'passive', description: '+6 DEX per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['sd_t3_1'], statBonusPerRank: { dex: 6 } },

      // Tier 4
      { id: 'sd_n6', name: 'Shadow Execute', icon: '💀', type: 'active', skillId: 's_executioner_sovereign', description: 'Ultimate: Deals 360% armor-ignoring dark damage to target.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['sd_n5', 'sd_t3_3'], typeDetail: 'physical', manaCost: 50, cooldownTurns: 4, damageMultiplier: 3.6, targetType: 'single' },
      { id: 'sd_t4_2', name: 'Nightfall Keystone', icon: '👑', type: 'passive', description: '+14 DEX, +6 SPD.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['sd_t3_1', 'sd_t3_3'], statBonusPerRank: { dex: 14, spd: 6 } },
    ],
  },

  // 8. ABYSSAL VOID
  {
    id: 'tree_abyssal',
    name: 'Abyssal Void',
    archetype: 'Dark Magic, Lifesteal & Curses',
    icon: '🔮',
    color: 'indigo',
    bgGradient: 'from-indigo-950/80 via-slate-900 to-purple-900/40',
    description: 'Weave dark nether travel nodes into life-draining void bolts and soul-shattering explosions.',
    primaryStat: 'int',
    nodes: [
      // Tier 1
      { id: 'ab_t1_1', name: 'Void Whisper', icon: '🔮', type: 'passive', description: '+3 INT per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 3 } },
      { id: 'ab_t1_2', name: 'Dark Flow', icon: '🌌', type: 'passive', description: '+2 INT, +10 Mana per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 2, maxMana: 10 } },
      { id: 'ab_t1_3', name: 'Siphon Touch', icon: '🩸', type: 'passive', description: '+2 INT, +10 HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 2, maxHp: 10 } },

      // Tier 2
      { id: 'ab_t2_1', name: 'Nether Channeling', icon: '🌑', type: 'passive', description: '+4 INT per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ab_t1_1'], statBonusPerRank: { int: 4 } },
      { id: 'ab_n2', name: 'Life Siphon Bolt', icon: '🩸', type: 'active', skillId: 's_life_siphon', description: 'Void bolt dealing 160% dark damage and heals caster for 40% of damage.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ab_t1_2'], typeDetail: 'magical', manaCost: 20, cooldownTurns: 1, damageMultiplier: 1.6, targetType: 'single' },
      { id: 'ab_t2_3', name: 'Abyssal Corruption', icon: '☠️', type: 'passive', description: '+3 INT, +15 Mana per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ab_t1_3'], statBonusPerRank: { int: 3, maxMana: 15 } },
      { id: 'ab_n3', name: 'Curse of Frailty', icon: '📜', type: 'active', skillId: 's_curse_frailty', description: 'Curses target reducing defense and attack by 20% for 3 turns.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ab_t2_1'], typeDetail: 'debuff', manaCost: 24, cooldownTurns: 3, targetType: 'single' },

      // Tier 3
      { id: 'ab_t3_1', name: 'Void Resonance', icon: '🔮', type: 'passive', description: '+5 INT, +20 Mana per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ab_n3'], statBonusPerRank: { int: 5, maxMana: 20 } },
      { id: 'ab_n5', name: 'Void Nova Burst', icon: '💥', type: 'active', skillId: 's_void_nova', description: 'Detonates void pulse dealing 170% dark damage to ALL enemies with life drain.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['ab_n2', 'ab_t2_3'], typeDetail: 'magical', manaCost: 38, cooldownTurns: 3, damageMultiplier: 1.7, targetType: 'all' },
      { id: 'ab_t3_3', name: 'Soul Feast', icon: '👑', type: 'passive', description: '+6 INT per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ab_t3_1'], statBonusPerRank: { int: 6 } },

      // Tier 4
      { id: 'ab_n6', name: 'Void Singularity', icon: '🌌', type: 'active', skillId: 's_void_singularity', description: 'Ultimate: Collapses space dealing 340% dark void damage to ALL enemies.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ab_n5', 'ab_t3_3'], typeDetail: 'magical', manaCost: 60, cooldownTurns: 5, damageMultiplier: 3.4, targetType: 'all' },
      { id: 'ab_t4_2', name: 'Void Keystone', icon: '⭐', type: 'passive', description: '+14 INT, +50 Max Mana.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ab_t3_1', 'ab_t3_3'], statBonusPerRank: { int: 14, maxMana: 50 } },
    ],
  },

  // 9. CELESTIAL LIGHT
  {
    id: 'tree_celestial',
    name: 'Celestial Light',
    archetype: 'Holy Shielding, Radiance & Smite',
    icon: '☀️',
    color: 'teal',
    bgGradient: 'from-teal-950/80 via-slate-900 to-cyan-950/40',
    description: 'Walk holy light travel paths to channel divine smites and heavenly shielding.',
    primaryStat: 'wis',
    nodes: [
      // Tier 1
      { id: 'cl_t1_1', name: 'Holy Glow', icon: '☀️', type: 'passive', description: '+2 WIS, +10 HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 2, maxHp: 10 } },
      { id: 'cl_t1_2', name: 'Divine Grace', icon: '✨', type: 'passive', description: '+3 WIS per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 3 } },
      { id: 'cl_t1_3', name: 'Radiant Shield', icon: '🛡️', type: 'passive', description: '+2 WIS, +2 DEF per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 2, def: 2 } },

      // Tier 2
      { id: 'cl_t2_1', name: 'Sanctified Aura', icon: '🌟', type: 'passive', description: '+3 WIS, +2 DEF per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['cl_t1_1'], statBonusPerRank: { wis: 3, def: 2 } },
      { id: 'cl_n2', name: 'Holy Smite', icon: '⚡', type: 'active', skillId: 's_holy_smite', description: 'Calls down radiant pillar dealing 170% holy magic damage to target.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['cl_t1_2'], typeDetail: 'magical', manaCost: 18, cooldownTurns: 1, damageMultiplier: 1.7, targetType: 'single' },
      { id: 'cl_t2_3', name: 'Luminous Protection', icon: '✨', type: 'passive', description: '+4 WIS per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['cl_t1_3'], statBonusPerRank: { wis: 4 } },
      { id: 'cl_n3', name: 'Aegis of Light', icon: '🛡️', type: 'autoCast', skillId: 's_auto_aegis_light', description: 'Auto-Cast: Grants 180 Ward shield to team at start of combat turn.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['cl_t2_1'], wardGrant: 180 },

      // Tier 3
      { id: 'cl_t3_1', name: 'Seraphic Devotion', icon: '👼', type: 'passive', description: '+5 WIS, +25 HP per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['cl_n3'], statBonusPerRank: { wis: 5, maxHp: 25 } },
      { id: 'cl_n5', name: 'Radiant Wrath Nova', icon: '💥', type: 'active', skillId: 's_radiant_wrath', description: 'Unleashes holy nova dealing 160% holy damage to ALL enemies and heals team for 100 HP.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['cl_n2', 'cl_t2_3'], typeDetail: 'magical', manaCost: 35, cooldownTurns: 3, damageMultiplier: 1.6, targetType: 'all' },
      { id: 'cl_t3_3', name: 'Divine Judgment', icon: '⚖️', type: 'passive', description: '+6 WIS, +3 DEF per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['cl_t3_1'], statBonusPerRank: { wis: 6, def: 3 } },

      // Tier 4
      { id: 'cl_n6', name: 'Holy Avatar', icon: '☀️', type: 'active', skillId: 's_avatar_heavens', description: 'Ultimate: Calls down solar judgment dealing 330% holy damage to ALL enemies.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['cl_n5', 'cl_t3_3'], typeDetail: 'magical', manaCost: 55, cooldownTurns: 5, damageMultiplier: 3.3, targetType: 'all' },
      { id: 'cl_t4_2', name: 'Celestial Archon Keystone', icon: '👑', type: 'passive', description: '+14 WIS, +8 DEF.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['cl_t3_1', 'cl_t3_3'], statBonusPerRank: { wis: 14, def: 8 } },
    ],
  },

  // 10. MARKSMAN PRECISION
  {
    id: 'tree_marksman',
    name: 'Marksman Precision',
    archetype: 'Ranged Archery, Accuracy & Sniping',
    icon: '🏹',
    color: 'blue',
    bgGradient: 'from-blue-950/80 via-slate-900 to-indigo-900/40',
    description: 'Advance step-by-step through archery travel nodes to unlock sniper shots and arrow rain.',
    primaryStat: 'dex',
    nodes: [
      // Tier 1
      { id: 'mk_t1_1', name: 'Fletching Practice', icon: '🏹', type: 'passive', description: '+3 DEX per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { dex: 3 } },
      { id: 'mk_t1_2', name: 'Hawk Eye', icon: '👁️', type: 'passive', description: '+2 DEX, +1 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { dex: 2, spd: 1 } },
      { id: 'mk_t1_3', name: 'Steady Draw', icon: '🎯', type: 'passive', description: '+2 DEX, +2 STR per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { dex: 2, str: 2 } },

      // Tier 2
      { id: 'mk_t2_1', name: 'Wind Reading', icon: '💨', type: 'passive', description: '+3 DEX, +2 SPD per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['mk_t1_1'], statBonusPerRank: { dex: 3, spd: 2 } },
      { id: 'mk_n2', name: 'Piercing Arrow', icon: '🎯', type: 'active', skillId: 's_piercing_arrow', description: 'Fires armor-piercing arrow dealing 165% physical damage.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['mk_t1_2'], typeDetail: 'physical', manaCost: 16, cooldownTurns: 1, damageMultiplier: 1.65, targetType: 'single' },
      { id: 'mk_t2_3', name: 'Eagle Instincts', icon: '🦅', type: 'passive', description: '+4 DEX per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['mk_t1_3'], statBonusPerRank: { dex: 4 } },
      { id: 'mk_n3', name: 'Rain of Arrows', icon: '🌧️', type: 'active', skillId: 's_rain_arrows', description: 'Rains arrows from sky dealing 130% damage to ALL enemies.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['mk_t2_1'], typeDetail: 'physical', manaCost: 28, cooldownTurns: 2, damageMultiplier: 1.3, targetType: 'all' },

      // Tier 3
      { id: 'mk_t3_1', name: 'Sniper Focus', icon: '🎯', type: 'passive', description: '+5 DEX, +3 SPD per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['mk_n3'], statBonusPerRank: { dex: 5, spd: 3 } },
      { id: 'mk_n5', name: 'Headshot Snipe', icon: '💥', type: 'active', skillId: 's_headshot_snipe', description: 'Precision shot dealing 280% damage to highest HP enemy target.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['mk_n2', 'mk_t2_3'], typeDetail: 'physical', manaCost: 35, cooldownTurns: 3, damageMultiplier: 2.8, targetType: 'highest_hp' },
      { id: 'mk_t3_3', name: 'Master Archery', icon: '🏹', type: 'passive', description: '+6 DEX per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['mk_t3_1'], statBonusPerRank: { dex: 6 } },

      // Tier 4
      { id: 'mk_n6', name: 'Arrow Volley', icon: '🏹', type: 'active', skillId: 's_ballista_barrage', description: 'Ultimate: Unleashes ballista volley dealing 350% physical damage to ALL enemies.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['mk_n5', 'mk_t3_3'], typeDetail: 'physical', manaCost: 55, cooldownTurns: 5, damageMultiplier: 3.5, targetType: 'all' },
      { id: 'mk_t4_2', name: 'Grandmaster Sniper Keystone', icon: '👑', type: 'passive', description: '+14 DEX, +6 SPD.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['mk_t3_1', 'mk_t3_3'], statBonusPerRank: { dex: 14, spd: 6 } },
    ],
  },

  // 11. WINDWALKER
  {
    id: 'tree_windwalker',
    name: 'Windwalker',
    archetype: 'Agility, Evasion & Speed',
    icon: '🌪️',
    color: 'violet',
    bgGradient: 'from-violet-950/80 via-slate-900 to-purple-950/40',
    description: 'Harness high agility through small velocity nodes to unleash cyclone flurries and gale strikes.',
    primaryStat: 'spd',
    nodes: [
      // Tier 1
      { id: 'ww_t1_1', name: 'Light Footed', icon: '👟', type: 'passive', description: '+2 SPD, +1 DEX per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { spd: 2, dex: 1 } },
      { id: 'ww_t1_2', name: 'Zephyr Flow', icon: '💨', type: 'passive', description: '+3 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { spd: 3 } },
      { id: 'ww_t1_3', name: 'Wind Sense', icon: '🌪️', type: 'passive', description: '+2 SPD, +2 STR per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { spd: 2, str: 2 } },

      // Tier 2
      { id: 'ww_t2_1', name: 'Gale Stride', icon: '💨', type: 'passive', description: '+3 SPD, +2 DEX per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ww_t1_1'], statBonusPerRank: { spd: 3, dex: 2 } },
      { id: 'ww_n2', name: 'Gale Strike', icon: '🍃', type: 'active', skillId: 's_gale_strike', description: 'High-speed wind dash dealing 155% physical damage and boosting speed.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ww_t1_2'], typeDetail: 'physical', manaCost: 15, cooldownTurns: 1, damageMultiplier: 1.55, targetType: 'single' },
      { id: 'ww_t2_3', name: 'Cyclone Grace', icon: '🌪️', type: 'passive', description: '+4 SPD per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ww_t1_3'], statBonusPerRank: { spd: 4 } },
      { id: 'ww_n3', name: 'Cyclone Kick', icon: '🌀', type: 'active', skillId: 's_cyclone_kick', description: 'Spinning kick hitting 3 random targets for 125% damage each.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ww_t2_1'], typeDetail: 'physical', manaCost: 24, cooldownTurns: 2, damageMultiplier: 1.25, targetType: 'random_3' },

      // Tier 3
      { id: 'ww_t3_1', name: 'Tempest Reflexes', icon: '⚡', type: 'passive', description: '+5 SPD, +3 DEX per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ww_n3'], statBonusPerRank: { spd: 5, dex: 3 } },
      { id: 'ww_n5', name: 'Hurricane Blitz', icon: '🌪️', type: 'active', skillId: 's_hurricane_blitz', description: 'Rapid wind strikes dealing 240% speed-scaled damage to target.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['ww_n2', 'ww_t2_3'], typeDetail: 'physical', manaCost: 35, cooldownTurns: 3, damageMultiplier: 2.4, targetType: 'single' },
      { id: 'ww_t3_3', name: 'Wind Realm Mastery', icon: '👑', type: 'passive', description: '+6 SPD per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ww_t3_1'], statBonusPerRank: { spd: 6 } },

      // Tier 4
      { id: 'ww_n6', name: 'Typhoon', icon: '🌪️', type: 'active', skillId: 's_typhoon_decimation', description: 'Ultimate: Unleashes typhoon dealing 320% damage to ALL enemies.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ww_n5', 'ww_t3_3'], typeDetail: 'physical', manaCost: 50, cooldownTurns: 5, damageMultiplier: 3.2, targetType: 'all' },
      { id: 'ww_t4_2', name: 'Wind God Keystone', icon: '⭐', type: 'passive', description: '+14 SPD, +6 DEX.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ww_t3_1', 'ww_t3_3'], statBonusPerRank: { spd: 14, dex: 6 } },
    ],
  },

  // 12. ARCANA WEAVER
  {
    id: 'tree_arcana',
    name: 'Arcana Weaver',
    archetype: 'Raw Magic, Mana Flow & Spell Echo',
    icon: '🔮',
    color: 'fuchsia',
    bgGradient: 'from-fuchsia-950/80 via-slate-900 to-pink-900/40',
    description: 'Weave arcane energy through small intelligence nodes into spell echoes and reality pulses.',
    primaryStat: 'int',
    nodes: [
      // Tier 1
      { id: 'ar_t1_1', name: 'Arcane Spark', icon: '🔮', type: 'passive', description: '+3 INT per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 3 } },
      { id: 'ar_t1_2', name: 'Mana Well', icon: '💧', type: 'passive', description: '+2 INT, +15 Mana per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 2, maxMana: 15 } },
      { id: 'ar_t1_3', name: 'Spell Affinity', icon: '✨', type: 'passive', description: '+2 INT, +1 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { int: 2, spd: 1 } },

      // Tier 2
      { id: 'ar_t2_1', name: 'Mana Flow', icon: '🔮', type: 'passive', description: '+4 INT per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ar_t1_1'], statBonusPerRank: { int: 4 } },
      { id: 'ar_n2', name: 'Arcane Missile', icon: '✨', type: 'active', skillId: 's_arcane_missile', description: 'Hurls 3 magic bolts dealing 120% magical damage total.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ar_t1_2'], typeDetail: 'magical', manaCost: 16, cooldownTurns: 1, damageMultiplier: 1.2, targetType: 'single' },
      { id: 'ar_t2_3', name: 'Ethereal Weave', icon: '🌟', type: 'passive', description: '+3 INT, +20 Mana per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ar_t1_3'], statBonusPerRank: { int: 3, maxMana: 20 } },
      { id: 'ar_n3', name: 'Mana Overload', icon: '💥', type: 'active', skillId: 's_mana_overload', description: 'Consumes mana to deal 220% massive raw magic damage to target.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ar_t2_1'], typeDetail: 'magical', manaCost: 35, cooldownTurns: 3, damageMultiplier: 2.2, targetType: 'single' },

      // Tier 3
      { id: 'ar_t3_1', name: 'Spell Echo Mastery', icon: '🔮', type: 'passive', description: '+5 INT, +25 Mana per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ar_n3'], statBonusPerRank: { int: 5, maxMana: 25 } },
      { id: 'ar_n5', name: 'Arcane Singularity', icon: '🌌', type: 'active', skillId: 's_arcane_singularity', description: 'Detonates arcane orb dealing 180% damage to ALL enemies.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['ar_n2', 'ar_t2_3'], typeDetail: 'magical', manaCost: 40, cooldownTurns: 3, damageMultiplier: 1.8, targetType: 'all' },
      { id: 'ar_t3_3', name: 'Supreme Spellcraft', icon: '👑', type: 'passive', description: '+6 INT per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ar_t3_1'], statBonusPerRank: { int: 6 } },

      // Tier 4
      { id: 'ar_n6', name: 'Cosmic Blast', icon: '🌌', type: 'active', skillId: 's_cosmic_oblivion', description: 'Ultimate: Unleashes raw cosmic force dealing 360% magic damage to ALL enemies.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ar_n5', 'ar_t3_3'], typeDetail: 'magical', manaCost: 65, cooldownTurns: 5, damageMultiplier: 3.6, targetType: 'all' },
      { id: 'ar_t4_2', name: 'Arch-Mage Keystone', icon: '⭐', type: 'passive', description: '+15 INT, +60 Max Mana.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ar_t3_1', 'ar_t3_3'], statBonusPerRank: { int: 15, maxMana: 60 } },
    ],
  },

  // 13. DRAGON BLOOD
  {
    id: 'tree_dragon',
    name: 'Dragon Blood',
    archetype: 'Fire/Physical Hybrids & Draconic Might',
    icon: '🐉',
    color: 'red',
    bgGradient: 'from-red-950/80 via-slate-900 to-amber-950/40',
    description: 'Awaken draconic strength through small stat nodes to unleash dragon breaths and draconic roar.',
    primaryStat: 'str',
    nodes: [
      // Tier 1
      { id: 'dr_t1_1', name: 'Dragon Scale', icon: '🛡️', type: 'passive', description: '+2 STR, +2 DEF per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 2, def: 2 } },
      { id: 'dr_t1_2', name: 'Wyrm Might', icon: '🐉', type: 'passive', description: '+3 STR per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 3 } },
      { id: 'dr_t1_3', name: 'Draconic Vigor', icon: '🔥', type: 'passive', description: '+2 STR, +15 HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 2, maxHp: 15 } },

      // Tier 2
      { id: 'dr_t2_1', name: 'Infernal Blood', icon: '🔥', type: 'passive', description: '+3 STR, +2 INT per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['dr_t1_1'], statBonusPerRank: { str: 3, int: 2 } },
      { id: 'dr_n2', name: 'Dragon Claw', icon: '🗡️', type: 'active', skillId: 's_dragon_claw', description: 'Fiery slash dealing 175% hybrid physical/fire damage.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['dr_t1_2'], typeDetail: 'physical', manaCost: 18, cooldownTurns: 1, damageMultiplier: 1.75, targetType: 'single' },
      { id: 'dr_t2_3', name: 'Drake Resilience', icon: '🛡️', type: 'passive', description: '+4 STR per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['dr_t1_3'], statBonusPerRank: { str: 4 } },
      { id: 'dr_n3', name: 'Draconic Roar', icon: '🗣️', type: 'active', skillId: 's_draconic_roar', description: 'Terrifying roar stunning all enemies with 40% chance.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['dr_t2_1'], typeDetail: 'debuff', manaCost: 26, cooldownTurns: 3, targetType: 'all' },

      // Tier 3
      { id: 'dr_t3_1', name: 'Ancient Wyrm Vigor', icon: '🐉', type: 'passive', description: '+5 STR, +25 HP per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['dr_n3'], statBonusPerRank: { str: 5, maxHp: 25 } },
      { id: 'dr_n5', name: 'Dragon Breath', icon: '🔥', type: 'active', skillId: 's_dragon_breath', description: 'Exhales fire cone dealing 210% damage to ALL enemies.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['dr_n2', 'dr_t2_3'], typeDetail: 'magical', manaCost: 40, cooldownTurns: 3, damageMultiplier: 2.1, targetType: 'all' },
      { id: 'dr_t3_3', name: 'Dragon Power', icon: '👑', type: 'passive', description: '+6 STR, +3 DEF per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['dr_t3_1'], statBonusPerRank: { str: 6, def: 3 } },

      // Tier 4
      { id: 'dr_n6', name: 'Dragon Form', icon: '🐉', type: 'active', skillId: 's_dragon_transformation', description: 'Ultimate: Transforms into elder dragon dealing 350% fire physical damage to ALL.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['dr_n5', 'dr_t3_3'], typeDetail: 'physical', manaCost: 60, cooldownTurns: 5, damageMultiplier: 3.5, targetType: 'all' },
      { id: 'dr_t4_2', name: 'Dragon Lord Keystone', icon: '⭐', type: 'passive', description: '+14 STR, +60 Max HP.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['dr_t3_1', 'dr_t3_3'], statBonusPerRank: { str: 14, maxHp: 60 } },
    ],
  },

  // 14. TITAN STRENGTH
  {
    id: 'tree_titan',
    name: 'Titan Strength',
    archetype: 'Heavy Two-Handed Crushing Blows',
    icon: '🔨',
    color: 'orange',
    bgGradient: 'from-amber-950/80 via-slate-900 to-stone-900/40',
    description: 'Build colossal strength through dense travel nodes to smash ground with earthshatter slams.',
    primaryStat: 'str',
    nodes: [
      // Tier 1
      { id: 'tt_t1_1', name: 'Heavy Grip', icon: '✊', type: 'passive', description: '+3 STR per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 3 } },
      { id: 'tt_t1_2', name: 'Brawn', icon: '💪', type: 'passive', description: '+2 STR, +15 HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 2, maxHp: 15 } },
      { id: 'tt_t1_3', name: 'Iron Frame', icon: '🧱', type: 'passive', description: '+2 STR, +2 DEF per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 2, def: 2 } },

      // Tier 2
      { id: 'tt_t2_1', name: 'Colossal Muscle', icon: '💪', type: 'passive', description: '+4 STR per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['tt_t1_1'], statBonusPerRank: { str: 4 } },
      { id: 'tt_n2', name: 'Heavy Overhead Slam', icon: '🔨', type: 'active', skillId: 's_heavy_slam', description: 'Crushing overhead hammer smash dealing 185% physical damage.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['tt_t1_2'], typeDetail: 'physical', manaCost: 18, cooldownTurns: 1, damageMultiplier: 1.85, targetType: 'single' },
      { id: 'tt_t2_3', name: 'Unshakable Mass', icon: '🪨', type: 'passive', description: '+3 STR, +20 HP per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['tt_t1_3'], statBonusPerRank: { str: 3, maxHp: 20 } },
      { id: 'tt_n3', name: 'Earthshatter', icon: '💥', type: 'active', skillId: 's_earthshatter', description: 'Smashes ground dealing 145% damage to ALL enemies.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['tt_t2_1'], typeDetail: 'physical', manaCost: 30, cooldownTurns: 2, damageMultiplier: 1.45, targetType: 'all' },

      // Tier 3
      { id: 'tt_t3_1', name: 'Titan Power', icon: '🔨', type: 'passive', description: '+5 STR, +2 DEF per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['tt_n3'], statBonusPerRank: { str: 5, def: 2 } },
      { id: 'tt_n5', name: 'Earthquake', icon: '🌋', type: 'active', skillId: 's_seismic_crack', description: 'Splits earth dealing 260% crushing physical damage to highest HP enemy.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['tt_n2', 'tt_t2_3'], typeDetail: 'physical', manaCost: 40, cooldownTurns: 3, damageMultiplier: 2.6, targetType: 'highest_hp' },
      { id: 'tt_t3_3', name: 'Pinnacle Might', icon: '👑', type: 'passive', description: '+6 STR per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['tt_t3_1'], statBonusPerRank: { str: 6 } },

      // Tier 4
      { id: 'tt_n6', name: 'Titan Slam', icon: '💥', type: 'active', skillId: 's_world_shatter_slam', description: 'Ultimate: Obliterates ground dealing 360% physical damage to ALL enemies.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['tt_n5', 'tt_t3_3'], typeDetail: 'physical', manaCost: 60, cooldownTurns: 5, damageMultiplier: 3.6, targetType: 'all' },
      { id: 'tt_t4_2', name: 'Unstoppable Titan Keystone', icon: '⭐', type: 'passive', description: '+16 STR, +80 Max HP.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['tt_t3_1', 'tt_t3_3'], statBonusPerRank: { str: 16, maxHp: 80 } },
    ],
  },

  // 15. BERSERKER RAGE
  {
    id: 'tree_berserker',
    name: 'Berserker Rage',
    archetype: 'High Risk Low HP Bloodlust',
    icon: '🪓',
    color: 'red',
    bgGradient: 'from-red-950/80 via-slate-900 to-rose-950/40',
    description: 'Fuel wild frenzy through rage travel nodes into blood rampages and berserk states.',
    primaryStat: 'str',
    nodes: [
      // Tier 1
      { id: 'bb_t1_1', name: 'Frenzy Spark', icon: '💢', type: 'passive', description: '+3 STR per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 3 } },
      { id: 'bb_t1_2', name: 'Wild Blood', icon: '🩸', type: 'passive', description: '+2 STR, +1 SPD per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 2, spd: 1 } },
      { id: 'bb_t1_3', name: 'Savage Drive', icon: '🪓', type: 'passive', description: '+2 STR, +10 HP per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { str: 2, maxHp: 10 } },

      // Tier 2
      { id: 'bb_t2_1', name: 'Low HP Frenzy', icon: '🔥', type: 'passive', description: '+3 STR, +2 SPD per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['bb_t1_1'], statBonusPerRank: { str: 3, spd: 2 } },
      { id: 'bb_n2', name: 'Wild Cleave Strike', icon: '🪓', type: 'active', skillId: 's_wild_cleave', description: 'Wild axe strike dealing 220% damage to single target.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['bb_t1_2'], typeDetail: 'physical', manaCost: 10, cooldownTurns: 1, damageMultiplier: 2.2, targetType: 'single' },
      { id: 'bb_t2_3', name: 'Vampiric Fangs', icon: '🧛', type: 'passive', description: '+4 STR per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['bb_t1_3'], statBonusPerRank: { str: 4 } },
      { id: 'bb_n5', name: 'Blood Rampage', icon: '💢', type: 'active', skillId: 's_blood_rampage', description: 'Rampage hitting 3 random enemies for 170% physical damage with lifesteal.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['bb_t2_1'], typeDetail: 'physical', manaCost: 30, cooldownTurns: 2, damageMultiplier: 1.7, targetType: 'random_3' },

      // Tier 3
      { id: 'bb_t3_1', name: 'Bloodthirst Mastery', icon: '🩸', type: 'passive', description: '+5 STR, +3 SPD per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['bb_n5'], statBonusPerRank: { str: 5, spd: 3 } },
      { id: 'bb_n3', name: 'Reckless Assault', icon: '🪓', type: 'active', skillId: 's_reckless_assault', description: 'Sacrifices 20 HP to deal 270% massive strike.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['bb_n2', 'bb_t2_3'], typeDetail: 'physical', manaCost: 15, cooldownTurns: 2, damageMultiplier: 2.7, targetType: 'single' },
      { id: 'bb_t3_3', name: 'Unstoppable Frenzy', icon: '👑', type: 'passive', description: '+6 STR per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['bb_t3_1'], statBonusPerRank: { str: 6 } },

      // Tier 4
      { id: 'bb_n6', name: 'Berserk Charge', icon: '👹', type: 'active', skillId: 's_immortal_berserk', description: 'Ultimate: Death prevention Ward for 1 turn and deals 350% lethal strike.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['bb_n3', 'bb_t3_3'], typeDetail: 'physical', manaCost: 40, cooldownTurns: 4, damageMultiplier: 3.5, targetType: 'lowest_hp', wardGrant: 500 },
      { id: 'bb_t4_2', name: 'Warmonger Keystone', icon: '⭐', type: 'passive', description: '+16 STR, +6 SPD.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['bb_t3_1', 'bb_t3_3'], statBonusPerRank: { str: 16, spd: 6 } },
    ],
  },

  // 16. RUNIC SCHOLAR
  {
    id: 'tree_runic',
    name: 'Runic Scholar',
    archetype: 'Elemental Inscriptions, Glyphs & Ward Barrier',
    icon: '📜',
    color: 'fuchsia',
    bgGradient: 'from-fuchsia-950/80 via-slate-900 to-purple-950/40',
    description: 'Carve ancient runic inscriptions through travel nodes into glyph barriers and rune storms.',
    primaryStat: 'wis',
    nodes: [
      // Tier 1
      { id: 'ru_t1_1', name: 'Runic Inscription', icon: '📜', type: 'passive', description: '+2 WIS, +10 Mana per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 2, maxMana: 10 } },
      { id: 'ru_t1_2', name: 'Glyph Crafting', icon: '🔮', type: 'passive', description: '+3 WIS per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 3 } },
      { id: 'ru_t1_3', name: 'Ward Tracing', icon: '🛡️', type: 'passive', description: '+2 WIS, +2 DEF per rank.', tier: 1, maxRank: 3, costPerRank: 1, statBonusPerRank: { wis: 2, def: 2 } },

      // Tier 2
      { id: 'ru_t2_1', name: 'Arcane Carving', icon: '✍️', type: 'passive', description: '+3 WIS, +15 Mana per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ru_t1_1'], statBonusPerRank: { wis: 3, maxMana: 15 } },
      { id: 'ru_n2', name: 'Glyph of Blasting', icon: '🔮', type: 'active', skillId: 's_glyph_blast', description: 'Places explosive glyph dealing 165% magic damage to target.', tier: 2, maxRank: 1, costPerRank: 1, prerequisites: ['ru_t1_2'], typeDetail: 'magical', manaCost: 18, cooldownTurns: 1, damageMultiplier: 1.65, targetType: 'single' },
      { id: 'ru_t2_3', name: 'Runic Barrier Focus', icon: '🛡️', type: 'passive', description: '+4 WIS per rank.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ru_t1_3'], statBonusPerRank: { wis: 4 } },
      { id: 'ru_n3', name: 'Auto Glyph Barrier', icon: '🛡️', type: 'autoCast', skillId: 's_auto_glyph_barrier', description: 'Auto-Cast: Grants 160 Ward shield at start of every combat turn.', tier: 2, maxRank: 2, costPerRank: 1, prerequisites: ['ru_t2_1'], wardGrant: 160 },

      // Tier 3
      { id: 'ru_t3_1', name: 'Runic Amplification', icon: '⚡', type: 'passive', description: '+5 WIS, +3 DEF per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ru_n3'], statBonusPerRank: { wis: 5, def: 3 } },
      { id: 'ru_n5', name: 'Rune Matrix Explosion', icon: '💥', type: 'active', skillId: 's_rune_matrix', description: 'Detonates runic grid dealing 200% elemental magical damage to ALL enemies.', tier: 3, maxRank: 1, costPerRank: 1, prerequisites: ['ru_n2', 'ru_t2_3'], typeDetail: 'magical', manaCost: 40, cooldownTurns: 3, damageMultiplier: 2.0, targetType: 'all' },
      { id: 'ru_t3_3', name: 'High Inscriptor', icon: '📜', type: 'passive', description: '+6 WIS per rank.', tier: 3, maxRank: 2, costPerRank: 1, prerequisites: ['ru_t3_1'], statBonusPerRank: { wis: 6 } },

      // Tier 4
      { id: 'ru_n6', name: 'Rune Storm', icon: '🔯', type: 'active', skillId: 's_prismatic_rune', description: 'Ultimate: Grants 600 Ward shield to team and deals 310% magical damage to ALL.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ru_n5', 'ru_t3_3'], typeDetail: 'magical', manaCost: 65, cooldownTurns: 5, damageMultiplier: 3.1, targetType: 'all', wardGrant: 600 },
      { id: 'ru_t4_2', name: 'Rune Master Keystone', icon: '👑', type: 'passive', description: '+14 WIS, +40 Max Mana.', tier: 4, maxRank: 1, costPerRank: 1, prerequisites: ['ru_t3_1', 'ru_t3_3'], statBonusPerRank: { wis: 14, maxMana: 40 } },
    ],
  },
];
