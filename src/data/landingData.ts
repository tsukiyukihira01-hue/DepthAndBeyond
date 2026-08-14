import {
  Sword,
  Shield,
  ShoppingBag,
  Zap,
  Users,
  Flame,
  Crown,
  BookOpen,
  Compass,
  Coins,
  Sparkles,
  Scroll,
  Wand2,
  Crosshair,
  Pickaxe,
  Heart,
  ShieldAlert,
  Dna,
  Layers,
  MapPin,
  Trophy
} from 'lucide-react';

export interface ClassPreview {
  id: string;
  name: string;
  role: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  icon: string;
  color: string;
  quote: string;
  description: string;
  stats: {
    str: number;
    int: number;
    dex: number;
    vit: number;
  };
  spells: Array<{
    name: string;
    icon: string;
    type: 'physical' | 'magical' | 'heal' | 'buff';
    description: string;
    manaCost: number;
  }>;
}

export interface FeatureCardData {
  id: string;
  category: 'combat' | 'economy' | 'social' | 'crafting';
  title: string;
  subtitle: string;
  iconName: string;
  badge: string;
  colorTheme: string;
  description: string;
  highlights: string[];
}

export interface WorldZonePreview {
  id: string;
  name: string;
  levelRange: string;
  icon: string;
  environment: string;
  description: string;
  resources: string[];
  bossThreat: string;
}

export interface LoreChapter {
  id: string;
  chapterNumber: string;
  title: string;
  era: string;
  excerpt: string;
  fullText: string;
  icon: string;
}

export interface PatchNoteEntry {
  version: string;
  date: string;
  type: 'Major Update' | 'Balance Patch' | 'Hotfix';
  title: string;
  highlights: string[];
}

// LANDING PAGE CONFIGURATION & DATA ENGINE
export const LANDING_HERO_DATA = {
  realmTitle: 'DEPTH AND BEYOND',
  realmSubtitle: 'Persistent Dark Fantasy Web MMORPG',
  versionTag: 'v0.2.5 Alpha Realm',
  heroTagline:
    'Step into a realm of centuries-old leyline secrets, player-governed atomic trade, and tactical 5x2 squad combat. Form unbreakable guilds, construct sanctuaries, and dive into primordial depths.',
  statsBanner: [
    { label: 'Active Adventurers', value: '1,240+', icon: 'Users' },
    { label: 'Atomic Direct Swaps', value: '18.4K+', icon: 'ShoppingBag' },
    { label: 'World Raid Defeats', value: '450+', icon: 'Flame' },
    { label: 'Max Refined (+20) Items', value: '82', icon: 'Zap' },
  ],
};

export const CLASS_PREVIEWS: ClassPreview[] = [
  {
    id: 'mage',
    name: 'Mage',
    role: 'Backline Magic DPS & Area Burst',
    difficulty: 'Medium',
    icon: '🪄',
    color: 'from-amber-500 to-purple-600',
    quote: '"Mana is not summoned; it is commanded from the core of the ancient world."',
    description:
      'Master of arcana and elemental ruin. Harnesses multi-turn channeled magic to unleash devastating area-of-effect spells against entire frontline matrices.',
    stats: { str: 10, int: 95, dex: 25, vit: 40 },
    spells: [
      {
        name: 'Infernal Meteor Cascade',
        icon: '☄️',
        type: 'magical',
        description: 'Channels for 2 turns to rain down celestial fire dealing massive AOE magic damage.',
        manaCost: 80,
      },
      {
        name: 'Frostbite Barrier',
        icon: '❄️',
        type: 'buff',
        description: 'Creates a crystal shield absorbing damage and reducing attacker speed.',
        manaCost: 45,
      },
    ],
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Frontline Meatshield & Aggro Tank',
    difficulty: 'Easy',
    icon: '🛡️',
    color: 'from-amber-600 to-red-700',
    quote: '"Stand firm as mountain granite; no blade shall pass my shield while breath remains."',
    description:
      'Immovable iron vanguard. Occupies the front row of the 5x2 combat matrix, intercepting physical strikes to protect fragile backline casters.',
    stats: { str: 85, int: 15, dex: 30, vit: 95 },
    spells: [
      {
        name: 'Bastion Provocation',
        icon: '📢',
        type: 'physical',
        description: 'Taunts all enemies, forcing threat aggro onto the vanguard for 3 turns.',
        manaCost: 30,
      },
      {
        name: 'Ironclad Counter-Strike',
        icon: '⚔️',
        type: 'physical',
        description: 'Raises shield defense by +50% and automatically counters incoming melee hits.',
        manaCost: 40,
      },
    ],
  },
  {
    id: 'priest',
    name: 'Priest',
    role: 'Squad Support & Divine Regeneration',
    difficulty: 'Medium',
    icon: '✨',
    color: 'from-emerald-400 to-cyan-600',
    quote: '"Light breaks through the deepest dark, mending wounds and banishing corruption."',
    description:
      'Channeler of primordial holy light. Keeps frontline tanks alive through heavy area heals, status cleansing, and divine resurrection blessings.',
    stats: { str: 20, int: 80, dex: 35, vit: 65 },
    spells: [
      {
        name: 'Radiant Sanctuary',
        icon: '🌟',
        type: 'heal',
        description: 'Restores +45% HP to all 5 squad allies over 3 turns with light regeneration.',
        manaCost: 60,
      },
      {
        name: 'Aegis of Protection',
        icon: '🛡️',
        type: 'buff',
        description: 'Grants damage reduction and status immunity to target ally.',
        manaCost: 50,
      },
    ],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    role: 'Backline Piercing Single-Target Burst',
    difficulty: 'Hard',
    icon: '🗡️',
    color: 'from-purple-500 to-slate-800',
    quote: '"The quietest strike cuts deepest. Before they register my shadow, the fight is done."',
    description:
      'Lethal stealth infiltrator. Bypasses front-row defenders to strike high-priority backline casters with critical armor-piercing damage.',
    stats: { str: 60, int: 20, dex: 95, vit: 35 },
    spells: [
      {
        name: 'Shadowstep Evoke',
        icon: '👣',
        type: 'physical',
        description: 'Teleports behind the enemy backline, dealing 300% critical physical damage.',
        manaCost: 50,
      },
      {
        name: 'Venomous Ambush',
        icon: '🐍',
        type: 'physical',
        description: 'Applies stacking deadly poison that melts enemy HP percentage over time.',
        manaCost: 35,
      },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    role: 'Ranged Physical Artillery & Trapper',
    difficulty: 'Medium',
    icon: '🏹',
    color: 'from-emerald-500 to-amber-500',
    quote: '"From half a league away, my arrow lands precisely where fate demands."',
    description:
      'Master marksman utilizing bows and traps. Rains precision arrows while maintaining distance from incoming melee threats.',
    stats: { str: 40, int: 35, dex: 90, vit: 45 },
    spells: [
      {
        name: 'Solar Arrow Barrage',
        icon: '🏹',
        type: 'physical',
        description: 'Fires a volley of 5 solar arrows targeting random matrix positions.',
        manaCost: 55,
      },
      {
        name: 'Grasping Thorn Trap',
        icon: '🌿',
        type: 'buff',
        description: 'Lays a nature trap that immobilizes advancing frontliners for 2 turns.',
        manaCost: 30,
      },
    ],
  },
];

export const FEATURE_CARDS: FeatureCardData[] = [
  {
    id: 'combat',
    category: 'combat',
    title: '5x2 Matrix Turn-Based Tactical Combat',
    subtitle: 'Precision Positioning, Frontline Tanks & 5s Turn Timers',
    iconName: 'Sword',
    badge: 'Core Battle System',
    colorTheme: 'amber',
    description:
      'Engage in tactical squad battles on a 5x2 position grid. Position tanks in front to block melee attacks, channel multi-turn spells, and deploy familiar pets as meat shields under 5-second turn timers.',
    highlights: [
      '5-second turn timeout auto-action engine',
      'Front row melee blocking and threat aggressive meters',
      '4-turn spell channeling with interruption risks',
      'Familiar pet summons taking frontline damage',
      'Real-time damage logs & battle replay summary',
    ],
  },
  {
    id: 'raids',
    category: 'combat',
    title: '100-Player Synchronized World Boss Raids',
    subtitle: '01:00, 07:00, 13:00, 19:00 UTC Scheduled Spawns',
    iconName: 'Flame',
    badge: 'Mass Co-Op',
    colorTheme: 'rose',
    description:
      'Unite with up to 100 players in synchronized boss instances. Fight primordial dragons and abyss monarchs with anti-leech chest rewards scaled to damage output.',
    highlights: [
      '9 Primordial Boss Archetypes with shifting phases',
      '100-Player shared health pool instances',
      'Anti-leech damage contribution chest loot',
      'Scheduled UTC world spawn alert timer',
      'Global Hall of Fame burst damage leaderboards',
    ],
  },
  {
    id: 'economy',
    category: 'economy',
    title: 'Grand Exchange & Atomic 4-Step Direct Trade',
    subtitle: 'Zero-Exploit Level 25 Atomic Swaps & 10% Escrow Tax',
    iconName: 'ShoppingBag',
    badge: 'Player Economy',
    colorTheme: 'emerald',
    description:
      'A player-driven market featuring Grand Exchange listings with a 14-day limit, 10% tax fee, system minimum valuation locks, and 4-step direct player atomic trading.',
    highlights: [
      'Atomic 4-step direct player trade (Offer -> Lock -> Confirm -> Swap)',
      'Grand Exchange with 14-day max duration & 10% tax',
      'Minimum price valuation locks preventing gold exploits',
      'Level 25 account safety requirement against bot transfers',
      'Blind auctions for rare mythic drops',
    ],
  },
  {
    id: 'blacksmith',
    category: 'crafting',
    title: 'Blacksmithing & +20 Mythic Item Enchanting',
    subtitle: 'Refining Stones, Socket Gemming & Global Realm Broadcasts',
    iconName: 'Zap',
    badge: 'Equipment Crafting',
    colorTheme: 'cyan',
    description:
      'Refine weapons and armor up to +20 using Arcane Dust. Reaching +15 or higher triggers realm-wide chat broadcasts announcing your epic triumph to all active players.',
    highlights: [
      '+1 to +20 Equipment refinement stat multipliers',
      'Socket gemming for elemental damage & defenses',
      'Realm-wide global announcements on +15+ success',
      'Durability repair and preservation scrolls',
      'Salvaging unwanted items for crafting materials',
    ],
  },
  {
    id: 'guilds',
    category: 'social',
    title: 'Guild Sanctuaries & Fortress Construction',
    subtitle: 'Construct Forts, Camps, Markets & Churches for Realm Buffs',
    iconName: 'Shield',
    badge: 'Guild Warfare',
    colorTheme: 'purple',
    description:
      'Gather up to 50 guild members under custom tags and symbols. Construct sanctuary structures to gain passive EXP multipliers, drop bonuses, and shared guild vault storage.',
    highlights: [
      'Upgradable Forts, Markets, Camps & Churches',
      'Custom Guild Banner Tags, Colors & Symbols',
      'Shared Guild Vault for material pooling',
      'Officer permission hierarchy & roster controls',
      'Reputation leaderboards tracking guild dominance',
    ],
  },
  {
    id: 'mercenaries',
    category: 'social',
    title: 'Mercenary Guild & Hero Rentals',
    subtitle: 'Rent Offline Hero Squads or Earn Passive Gold Income',
    iconName: 'Users',
    badge: 'Squad AI',
    colorTheme: 'sky',
    description:
      'Rent offline player heroes as AI squad allies for dungeon dives. Earn passive gold whenever other adventurers hire your character while you are offline.',
    highlights: [
      'Rent offline player heroes with complete loadouts',
      'Earn gold passively while away from the game',
      'AI squad tactical behaviors during solo runs',
      'Fair rental pricing based on level & gear score',
    ],
  },
];

export const WORLD_ZONES: WorldZonePreview[] = [
  {
    id: 'town',
    name: 'City of Sun Sanctuary',
    levelRange: 'Level 1 - 100 (Safe Hub)',
    icon: '🏰',
    environment: 'Majestic Stone Plaza & Sacred Fount',
    description:
      'The bustling capital where adventurers gather. Home to the Blacksmith, Grand Exchange, Guild Hall, Sacred Healing Fountain, and Mercenary Tavern.',
    resources: ['Basic Herbal Leaf', 'Iron Ore', 'Fresh Spring Water'],
    bossThreat: 'None (Protected Realm Zone)',
  },
  {
    id: 'leyline',
    name: 'Sun Leyline Veins',
    levelRange: 'Level 5 - 25',
    icon: '✨',
    environment: 'Radiant Crystal Caverns & Mana Springs',
    description:
      'Glowing underground fissures overflowing with ancient arcana. Ideal for gathering magic cores and solar crystals.',
    resources: ['Solar Empyrean Ore', 'Mana Dust', 'Arcane Core'],
    bossThreat: 'Leyline Overcharge Golem',
  },
  {
    id: 'abyss',
    name: 'Endless Nether Vaults',
    levelRange: 'Level 25 - 50',
    icon: '🔥',
    environment: 'Obsidian Citadel & Lava Lakes',
    description:
      'Ancient subterranean ruins corrupted by shadow magic. High-grade gear drops and rare enchanting stones await deep within.',
    resources: ['Obsidian Shard', 'Demon Essence', 'Refining Stone'],
    bossThreat: 'Shadow Lord Malakor',
  },
  {
    id: 'peak',
    name: 'Apex Primordial Peak',
    levelRange: 'Level 50+ (Raid Realm)',
    icon: '🐉',
    environment: 'Storm-Swept Celestial Summit',
    description:
      'The highest sanctuary where 100-player World Raid Bosses descend during scheduled UTC hours.',
    resources: ['Dragon Scale', 'Godly Essence', 'Celestial Core'],
    bossThreat: 'Primordial Solar Dragon',
  },
];

export const REALM_LORE: LoreChapter[] = [
  {
    id: 'ch1',
    chapterNumber: 'Chapter I',
    title: 'The Shattered Leylines',
    era: 'Age of Arcana • 200 Years Ago',
    icon: '📜',
    excerpt: 'When the ancient magic core fractured, mana poured across the continents, awakening sleeping horrors and sacred sanctuaries alike.',
    fullText:
      'Centuries ago, the Great Leyline Core fractured beneath the continent of Aethelgard. The resulting eruption scattered pure elemental mana across the lands. Ancient stone sanctuaries reawakened, and magical beasts emerged from the depths beyond. Wandering spellcasters and steel-clad crusaders gathered in the City of Sun to forge a new order of balance.',
  },
  {
    id: 'ch2',
    chapterNumber: 'Chapter II',
    title: 'Rise of the Guild Sanctuaries',
    era: 'Era of Fortresses • 50 Years Ago',
    icon: '🏰',
    excerpt: 'To survive the awakening monstrosities, adventurers bound themselves under guild banners, building fortified sanctuaries.',
    fullText:
      'As monsters swarmed from subterranean abyss vaults, individual survival became impossible. Mighty heroes formed guilds, erecting Fortresses, Markets, Camps, and Holy Churches. These sanctuaries provided refuge, passive blessings, and shared vaults for stockpiling precious refining stones and legendary equipment.',
  },
  {
    id: 'ch3',
    chapterNumber: 'Chapter III',
    title: 'The Primordial Awakening',
    era: 'Present Day • The Dawn of Depth',
    icon: '🐉',
    excerpt: 'At scheduled UTC hours, primordial dragons descend upon Apex Peak. Only 100 synchronized squad commanders can halt the cataclysm.',
    fullText:
      'Now, at precisely 01:00, 07:00, 13:00, and 19:00 UTC, the skies above Apex Peak tear open. Primordial bosses descend with apocalyptic power. The Grand Exchange buzzes with trade, blacksmith hammers ring out +20 enchantments, and squad leaders prepare their matrices to dive into Depth and Beyond.',
  },
];

export const PATCH_NOTES: PatchNoteEntry[] = [
  {
    version: 'v0.2.5 Alpha',
    date: 'August 2026',
    type: 'Major Update',
    title: 'Class Type System & Automatic Attribute Growth Overhaul',
    highlights: [
      'Introduced 4 Core Character Types: Physical, Magical, Defensive, and Support with specialized growth profiles.',
      'Added 5 New Playable Classes: Heavy Knight, Pierrot (Jester), Sacred Priest, Steel Swordsman, and Red Mage.',
      'Overhauled Level Up progression: Base attributes are now automatically allocated by the system based on Class Type (e.g. Heavy Knight gains +2 DEF per level).',
      'Removed manual unassigned attribute point distribution for balanced, class-identity focused scaling.',
      'Updated Character Creation UI with interactive Class Type tabs and attribute growth previews.',
      'Updated Character Sheet and Player Profile inspector to display Class Type badges and primary growth indicators.',
    ],
  },
  {
    version: 'v1.0.1 Official Realm',
    date: 'July 2026',
    type: 'Major Update',
    title: 'Grand Exchange, 100-Player Raids & Blacksmith Expansion',
    highlights: [
      'Added Grand Exchange item interaction with system valuation floor and 14-day max duration.',
      '10% Escrow tax fee integrated into marketplace purchases for player economy gold sink.',
      '100-Player World Raid Boss instances with scheduled 6-hour UTC spawns and anti-leech scaling.',
      '+20 Blacksmith Refinement system with global server broadcasts for +15+ successes.',
      'Mercenary Guild offline player hero rentals for passive gold income.',
    ],
  },
  {
    version: 'v1.0.0 Realm Launch',
    date: 'June 2026',
    type: 'Major Update',
    title: 'Official Public Release of Depth and Beyond',
    highlights: [
      '5x2 Matrix Turn-Based Combat with 5-second decision timers and front/back positioning.',
      'Player Authentication and cloud persistence integration.',
      'Guild Sanctuaries featuring Forts, Markets, Camps, and Churches.',
      'Interactive World Map with gathering node resource gathering.',
    ],
  },
];
