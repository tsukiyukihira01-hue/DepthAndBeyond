export type UserRole = 'PLAYER' | 'MOD' | 'ADMIN';

export type Faction = 'HEAVENLY' | 'UNDERWORLD';

export interface UserAccount {
  id: string;
  userId: string; // Clean numeric/string User ID e.g. "1", "2", "1001"
  email: string;
  name?: string;
  picture?: string;
  googleId?: string;
  passwordHash?: string;
  role: UserRole;
  isPrimaryGM?: boolean; // Single GM Account flag
  is2FAEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: string;
  lastLoginAt: string;
  isBanned: boolean;
  banReason?: string;
  banUntil?: string;
  privilegeExpiresAt?: string; // Pass Voucher 31-day expiration
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  ward: number;
  maxWard: number;
  str: number;
  def: number;
  int: number;
  wis: number;
  spd: number;
  dex: number;
  unassignedPoints: number;
}

export type EquipmentSlot =
  | 'head'
  | 'body'
  | 'arms'
  | 'legs'
  | 'mainHand'
  | 'offHand'
  | 'amulet'
  | 'ring'
  | 'familiar'
  | 'mount'
  | 'wing'
  | 'costume';

export type Rarity =
  | 'garbage'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythical'
  | 'godly';

export type SocketColor = 'red' | 'green' | 'blue' | 'white';

export interface SocketedGem {
  id: string;
  name: string;
  gemType: 'active' | 'support';
  level: number;
  quality: number;
  icon: string;
  description: string;
  tags: string[]; // e.g. ['Spell', 'Fire', 'AOE'] or ['Support', 'Melee', 'Damage']
  multipliers?: {
    damageMult?: number;     // e.g. 1.30 (+30% More Damage)
    manaCostMult?: number;   // e.g. 1.20 (120% Mana Cost)
    addedFlatPhys?: number;
    addedFlatFire?: number;
    critChanceAdd?: number;
    attackSpeedPct?: number;
    castSpeedPct?: number;
    resBonus?: number;
  };
}

export interface ItemSocket {
  id: string;
  color: SocketColor;
  linkedGroupId: number; // e.g., 0 for group 0, 1 for group 1
  socketedGem?: SocketedGem;
}

export interface ItemAffix {
  type: 'prefix' | 'suffix';
  tier: number; // Tier 1 to Tier 5 (Tier 1 highest)
  name: string; // e.g. "Merciless", "of the Lion"
  statKey: string; // e.g. "physDmgPct", "flatLife", "fireRes", "attackSpeed"
  label: string; // e.g. "+85% Increased Physical Damage"
  value: number;
  secondaryValue?: number;
  isPercentage?: boolean;
}

export type PoeCurrencyType =
  | 'transmutation'
  | 'alteration'
  | 'augmentation'
  | 'regal'
  | 'chaos'
  | 'exalted'
  | 'divine'
  | 'scouring'
  | 'jeweller'
  | 'fusing'
  | 'chromatic'
  | 'whetstone'
  | 'scrap'
  | 'vaal';

export type PoeItemRarity = 'normal' | 'magic' | 'rare' | 'unique';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'gear' | 'core' | 'stone' | 'consumable' | 'material' | 'voucher' | 'box' | 'currency' | 'gem';
  slot?: EquipmentSlot;
  rarity: Rarity;
  poeRarity?: 'normal' | 'magic' | 'rare' | 'unique';
  itemLevel?: number;
  quality?: number; // 0% to +20%
  levelReq: number;
  baseStats?: Partial<Record<keyof CharacterStats, number>>;
  enchantLevel: number; // +0 to +20
  affixes?: Array<{ stat: string; value: number; isPercentage?: boolean }>;
  prefixes?: ItemAffix[];
  suffixes?: ItemAffix[];
  sockets?: ItemSocket[];
  implicitStat?: { label: string; value: number; statKey: string };
  isCorrupted?: boolean;
  currencyType?: PoeCurrencyType;
  reqStr?: number;
  reqDex?: number;
  reqInt?: number;
  baseArmour?: number;
  baseEvasion?: number;
  baseEnergyShield?: number;
  basePhysDmgMin?: number;
  basePhysDmgMax?: number;
  baseCritChance?: number;
  baseAttackSpeed?: number;
  valueGold: number;
  stackable: boolean;
  quantity: number;
  icon: string;
  weaponType?: 'physical' | 'magical';
}

export interface Familiar {
  id: string;
  name: string;
  tier: Rarity;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  str: number;
  def: number;
  dex: number;
  spd: number;
  int: number;
  wis: number;
  protectionRate: number; // 10% - 60%
  skills: string[];
  icon: string;
}

export interface Character {
  id: string;
  accountId: string;
  userId?: string; // Clean User ID e.g. "1"
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  faction: Faction;
  characterClass?: string;
  archetype?: string;
  gold: number;
  tokens: number;
  goldLeaf: number;
  bankGold: number;
  currentZoneId: string;
  stats: CharacterStats;
  equipment: Partial<Record<EquipmentSlot, Item>>;
  inventory: (Item | null)[]; // 64 or 128 slots
  inventoryLimit: number;
  skills: string[]; // Skill IDs known
  equippedSkills: {
    passives: (string | null)[]; // 4 slots
    autoCast: string | null;     // 1 slot
    actives: (string | null)[];  // 8 slots
  };
  familiar: Familiar | null;
  freePetRollUsed?: boolean;
  loadoutSpec: 'A' | 'B';
  specBEquipment?: Partial<Record<EquipmentSlot, Item>>;
  guildId?: string;
  guildRole?: 'LEADER' | 'CO_LEADER' | 'OFFICER' | 'MEMBER';
  partyId?: string;
  title?: string;
  claimedQuestIds?: string[];
  monstersDefeated?: number;
  isOnline: boolean;
  lastActive: string;
  avatarUrl?: string;
  lastDailyClaimTime?: string;
  dailyStreakDays?: number;
  dailyRaidAttemptsUsed?: number;
  lastRaidResetDate?: string;
  mutedPlayerIds?: string[];
  skillMasteries?: Record<string, { masteryLevel: number; masteryXp: number; maxMasteryXp: number }>;
  equippedTrees?: (string | null)[]; // Max 4 slots for active Skill Trees
  treeAllocations?: Record<string, Record<string, number>>; // { [treeId]: { [nodeId]: rank } }
  availableSkillPoints?: number;
}

export interface DailyRewardDay {
  day: number;
  type: 'gold' | 'item' | 'exp_booster';
  name: string;
  description: string;
  goldAmount?: number;
  item?: Item;
  icon: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  reason: 'Spam' | 'Harassment' | 'Cheating' | 'Inappropriate Name/Avatar' | 'Other';
  details: string;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  type: 'physical' | 'magical' | 'buff' | 'debuff' | 'support';
  skillCategory?: 'passive' | 'autoCast' | 'active';
  description: string;
  manaCost: number;
  channelTurns: number; // 0 for instant, up to 4 turns
  cooldownTurns: number;
  level: number; // 1 to 5
  isPassive?: boolean;
  isAutoCast?: boolean;
  isArea?: boolean;
  targetType?: 'single' | 'all' | 'random_2' | 'random_3' | 'highest_hp' | 'lowest_hp' | 'self' | 'ally_single' | 'ally_all';
  targetCount?: number;
  wardGrant?: number;
  damageMultiplier?: number;
  icon: string;
  bookCostGold: number;
  masteryLevel?: number;
  masteryXp?: number;
  maxMasteryXp?: number;
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  tier: Rarity;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  ward: number;
  str: number;
  def: number;
  int: number;
  wis: number;
  spd: number;
  dex: number;
  skills: string[];
  expReward: number;
  goldReward: number;
  lootTable: Array<{ itemId: string; dropRate: number }>;
  icon: string;
  isBoss?: boolean;
}

export interface RaidBossInstance {
  id: string;
  bossId: string;
  name: string;
  tier: 1 | 2 | 3;
  instanceNo: number;
  currentHp: number;
  maxHp: number;
  playerCount: number;
  createdAt: string;
  endsAt: string;
  turnEndsAt: number;
}

export interface CombatParticipant {
  id: string;
  name: string;
  isPlayer: boolean;
  isFamiliar?: boolean;
  isBoss?: boolean;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  ward: number;
  maxWard: number;
  spd: number;
  str?: number;
  def?: number;
  int?: number;
  wis?: number;
  dex?: number;
  statusEffects: Array<{ name: string; duration: number; icon: string }>;
  channelingSkill?: { skillId: string; remainingTurns: number };
  icon: string;
  team: 'friendly' | 'enemy';
}

export interface ChatMessage {
  id: string;
  channel: 'all' | 'global' | 'trade' | 'recruit' | 'guild' | 'party' | 'system' | 'log' | 'announcement' | 'pm';
  senderId?: string;
  senderName: string;
  senderAvatarUrl?: string;
  senderRole?: UserRole;
  senderGuildTag?: string;
  senderTitle?: string;
  isPrivilege?: boolean;
  content: string;
  timestamp: string;
  recipientId?: string;
  guildId?: string;
  partyId?: string;
}

export interface Guild {
  id: string;
  name: string;
  tag: string; // 4-5 chars
  symbol: string;
  color: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  maxMembers: number;
  reputation: number;
  announcement: string; // Sanitized HTML
  isOpenInvite: boolean;
  buildings: {
    fort: number;     // Lv 0-10 (+3 max members/lv)
    market: number;   // Lv 0-10 (+2% rep gain/lv)
    camp: number;     // Lv 0-10 (+2% exp/lv)
    church: number;   // Lv 0-10 (+0.25% drop rate/lv, free heal)
  };
  members: Array<{
    characterId: string;
    name: string;
    level: number;
    role: 'LEADER' | 'CO_LEADER' | 'OFFICER' | 'MEMBER';
    joinedAt: string;
  }>;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  item: Item;
  priceGold: number;
  type: 'GE' | 'AUCTION';
  currentBidTokens?: number;
  highestBidderId?: string;
  expiresAt: string;
}

export interface MercenaryRental {
  id: string;
  ownerCharacterId: string;
  ownerName: string;
  characterLevel: number;
  characterStats: CharacterStats;
  feeGold: number;
  durationHours: number;
  isRented: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'tutorial' | 'main' | 'daily' | 'weekly' | 'monthly' | 'guild';
  levelReq: number;
  requiredTarget: { type: 'kill' | 'craft' | 'gather' | 'travel'; targetId: string; count: number };
  currentProgress: number;
  rewards: { exp: number; gold: number; items?: Item[] };
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  beforeState?: string;
  afterState?: string;
  ipAddress: string;
  createdAt: string;
}

export interface AnomalyLog {
  id: string;
  accountId: string;
  type: string;
  payload: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface PlayerSearchResult {
  userId: string;
  accountId: string;
  characterId: string;
  characterName: string;
  level: number;
  faction: Faction;
  gold: number;
  title?: string;
  isOnline: boolean;
  guildTag?: string;
}

export interface PlayerProfileData {
  user: {
    id: string;
    userId: string;
    email: string;
    role: UserRole;
    isPrimaryGM?: boolean;
    createdAt: string;
    isBanned: boolean;
  };
  character: Character;
  guildName?: string;
}

