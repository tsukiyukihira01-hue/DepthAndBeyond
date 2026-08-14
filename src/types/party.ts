export type PartyLootMode = 'Free for All' | 'Round Robin' | 'Leader Pick';

export type PartyTargetActivity =
  | 'Apex World Raid'
  | 'Nether Abyss Dungeons'
  | 'Leyline Core Gathering'
  | 'Guild Fortress Defense'
  | 'Casual Grouping';

export interface PartyMember {
  id: string; // characterId
  name: string;
  level: number;
  classRole: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  isLeader: boolean;
  isReady: boolean;
  avatarUrl?: string;
  icon: string;
  joinedAt: string;
}

export interface Party {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  members: PartyMember[];
  maxMembers: number; // 5
  targetActivity: PartyTargetActivity;
  lootMode: PartyLootMode;
  createdAt: string;
  isPrivate: boolean;
  passcode?: string;
  sharedExpBonusPercent: number; // e.g. +10% when in party
}

export interface PartyInvite {
  id: string;
  partyId: string;
  partyName: string;
  senderName: string;
  senderLevel: number;
  targetCharacterId: string;
  createdAt: string;
}
