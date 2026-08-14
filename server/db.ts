import bcrypt from 'bcryptjs';
import {
  UserAccount,
  Character,
  Item,
  ChatMessage,
  Guild,
  MarketplaceListing,
  MercenaryRental,
  AdminAuditLog,
  AnomalyLog,
  RaidBossInstance,
  UserReport,
} from '../src/types/game';
import raidBossesData from '../src/data/raid_bosses.json';
import { calcRaidBossMaxHP } from '../src/utils/formulas';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './config';

export const DB = {
  users: new Map<string, UserAccount>(),
  characters: new Map<string, Character>(), // key: characterId
  characterByAccount: new Map<string, string[]>(), // key: accountId -> characterIds
  guilds: new Map<string, Guild>([
    [
      '1',
      {
        id: '1',
        name: 'Frieren Guildios',
        tag: 'FRRN',
        symbol: '🌸',
        color: '#38bdf8',
        leaderId: 'char_frieren_01',
        leaderName: 'Frieren',
        memberCount: 18,
        maxMembers: 50,
        reputation: 9850,
        announcement: 'Welcome to <b>Frieren Guildios</b>! Seeking lost ancient magic and conquering world raid dungeons.',
        isOpenInvite: true,
        buildings: { fort: 5, market: 4, camp: 5, church: 5 },
        members: [
          { characterId: 'char_frieren_01', name: 'Frieren', level: 99, role: 'LEADER', joinedAt: '2026-01-01' },
          { characterId: 'char_stark_02', name: 'Stark', level: 78, role: 'CO_LEADER', joinedAt: '2026-01-02' },
          { characterId: 'char_fern_03', name: 'Fern', level: 82, role: 'OFFICER', joinedAt: '2026-01-02' },
          { characterId: 'char_seine_04', name: 'Sein', level: 75, role: 'MEMBER', joinedAt: '2026-01-05' },
        ],
      },
    ],
    [
      '2',
      {
        id: '2',
        name: 'Hero Party',
        tag: 'HERO',
        symbol: '🛡️',
        color: '#f59e0b',
        leaderId: 'char_himmel_01',
        leaderName: 'Himmel',
        memberCount: 12,
        maxMembers: 30,
        reputation: 5400,
        announcement: 'The legendary Hero Party! Defending humanity across all realms.',
        isOpenInvite: true,
        buildings: { fort: 3, market: 2, camp: 3, church: 3 },
        members: [
          { characterId: 'char_himmel_01', name: 'Himmel', level: 90, role: 'LEADER', joinedAt: '2026-01-01' },
          { characterId: 'char_heiter_02', name: 'Heiter', level: 85, role: 'CO_LEADER', joinedAt: '2026-01-01' },
          { characterId: 'char_eisen_03', name: 'Eisen', level: 88, role: 'OFFICER', joinedAt: '2026-01-01' },
        ],
      },
    ],
  ]),
  marketplace: new Map<string, MarketplaceListing>(),
  mercenaryRentals: new Map<string, MercenaryRental>(),
  adminAuditLogs: [] as AdminAuditLog[],
  anomalyLogs: [] as AnomalyLog[],
  chatMessages: [] as ChatMessage[],
  fullChatLog: [] as ChatMessage[],
  userReports: [] as UserReport[],
  raidInstances: new Map<string, RaidBossInstance>(),
  raidDamage: new Map<string, Map<string, number>>(), // instanceId -> (characterId -> totalDamage)
  maintenanceMode: false,
  snapshots: new Map<string, string>(), // snapshotId -> JSON string
};

// Seed Default Admin User
const defaultAdminPasswordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

export const defaultAdminUser: UserAccount = {
  id: 'usr_admin_default',
  userId: '1',
  email: ADMIN_EMAIL,
  passwordHash: defaultAdminPasswordHash,
  name: 'Game Master',
  role: 'ADMIN',
  isPrimaryGM: true,
  is2FAEnabled: false,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  isBanned: false,
};

export const defaultAdminChar: Character = {
  id: 'char_gm_01',
  userId: '1',
  accountId: 'usr_admin_default',
  name: 'GM Realm',
  title: 'Game Master',
  faction: 'HEAVENLY',
  level: 99,
  exp: 0,
  maxExp: 1000000,
  gold: 1000000,
  tokens: 5000,
  goldLeaf: 10000,
  bankGold: 5000000,
  currentZoneId: 'city',
  stats: { str: 500, def: 500, int: 500, wis: 500, spd: 500, dex: 500, maxHp: 10000, hp: 10000, maxMana: 5000, mana: 5000, ward: 0, maxWard: 0, unassignedPoints: 0 },
  inventory: (() => {
    const inv: Array<Item | null> = Array(64).fill(null);
    inv[0] = {
      id: `item_admin_sword`,
      name: 'Novice Wooden Blade',
      description: 'A sturdy wooden sword crafted for new adventurers.',
      type: 'gear',
      slot: 'mainHand',
      rarity: 'garbage',
      levelReq: 1,
      baseStats: { str: 5, spd: 2 },
      enchantLevel: 0,
      valueGold: 20,
      stackable: false,
      quantity: 1,
      icon: '🗡️',
      weaponType: 'physical',
    };
    inv[1] = {
      id: `item_hp_vial_admin`,
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
      id: `item_mp_vial_admin`,
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
  equipment: {},
  skills: [],
  equippedSkills: { passives: [null, null, null, null], autoCast: null, actives: [null, null, null] },
  familiar: null,
  loadoutSpec: 'A',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  guildId: '1',
  guildRole: 'LEADER',
  isOnline: true,
  lastActive: new Date().toISOString(),
};

DB.users.set(defaultAdminUser.id, defaultAdminUser);
DB.characters.set(defaultAdminChar.id, defaultAdminChar);
DB.characterByAccount.set(defaultAdminUser.id, [defaultAdminChar.id]);

export let nextUserIdNum = 2;

export function getNextUserIdNum(): string {
  const existingUserIds = new Set<string>();
  for (const u of DB.users.values()) {
    if (u.userId) {
      existingUserIds.add(String(u.userId));
    }
  }
  let candidate = nextUserIdNum;
  while (existingUserIds.has(String(candidate))) {
    candidate++;
  }
  nextUserIdNum = candidate + 1;
  return String(candidate);
}

export function syncCharacterToMemory(character: Character): void {
  if (!character || !character.id) return;
  DB.characters.set(character.id, character);
  if (character.accountId) {
    const existing = DB.characterByAccount.get(character.accountId) || [];
    if (!existing.includes(character.id)) {
      DB.characterByAccount.set(character.accountId, [...existing, character.id]);
    }
  }
}

export function initRaidInstances() {
  if (DB.raidInstances.size === 0) {
    const firstBoss = raidBossesData[0];
    const instId = `raid_t3_01`;
    const maxHp = calcRaidBossMaxHP(firstBoss.baseHpTier3, 3, 12, 50);
    DB.raidInstances.set(instId, {
      id: instId,
      bossId: firstBoss.id,
      name: firstBoss.name,
      tier: 3,
      instanceNo: 1,
      currentHp: maxHp,
      maxHp: maxHp,
      playerCount: 12,
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 3600000).toISOString(),
      turnEndsAt: Date.now() + 5000,
    });
    DB.raidDamage.set(instId, new Map());
  }
}

initRaidInstances();
