import { Party, PartyMember, PartyTargetActivity, PartyLootMode } from '../types/party';
import { Character } from '../types/game';

// In-Memory Global Party Store (Simulated or Sync with Server)
let partyListStore: Party[] = [
  {
    id: 'party_apex_01',
    name: 'Apex Dragon Slayer Squad',
    leaderId: 'char_frieren_01',
    leaderName: 'Frieren',
    maxMembers: 5,
    targetActivity: 'Apex World Raid',
    lootMode: 'Free for All',
    createdAt: new Date().toISOString(),
    isPrivate: false,
    sharedExpBonusPercent: 15,
    members: [
      {
        id: 'char_frieren_01',
        name: 'Frieren',
        level: 99,
        classRole: 'Mage',
        hp: 3800,
        maxHp: 3800,
        mana: 2500,
        maxMana: 2500,
        isLeader: true,
        isReady: true,
        icon: '🪄',
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'char_stark_02',
        name: 'Stark',
        level: 78,
        classRole: 'Sentinel',
        hp: 5200,
        maxHp: 5200,
        mana: 600,
        maxMana: 600,
        isLeader: false,
        isReady: true,
        icon: '🛡️',
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'char_fern_03',
        name: 'Fern',
        level: 82,
        classRole: 'Mage',
        hp: 3100,
        maxHp: 3100,
        mana: 2100,
        maxMana: 2100,
        isLeader: false,
        isReady: true,
        icon: '✨',
        joinedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'party_abyss_02',
    name: 'Nether Abyss Vault Runners',
    leaderId: 'char_himmel_01',
    leaderName: 'Himmel',
    maxMembers: 5,
    targetActivity: 'Nether Abyss Dungeons',
    lootMode: 'Round Robin',
    createdAt: new Date().toISOString(),
    isPrivate: false,
    sharedExpBonusPercent: 10,
    members: [
      {
        id: 'char_himmel_01',
        name: 'Himmel',
        level: 90,
        classRole: 'Sentinel',
        hp: 6100,
        maxHp: 6100,
        mana: 800,
        maxMana: 800,
        isLeader: true,
        isReady: true,
        icon: '⚔️',
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'char_heiter_02',
        name: 'Heiter',
        level: 85,
        classRole: 'Priest',
        hp: 4200,
        maxHp: 4200,
        mana: 2900,
        maxMana: 2900,
        isLeader: false,
        isReady: true,
        icon: '🌟',
        joinedAt: new Date().toISOString(),
      },
    ],
  },
];

export const getPartyList = (): Party[] => {
  return [...partyListStore];
};

export const getPartyById = (partyId: string): Party | null => {
  return partyListStore.find((p) => p.id === partyId) || null;
};

export const getPartyForCharacter = (characterId: string): Party | null => {
  return partyListStore.find((p) => p.members.some((m) => m.id === characterId)) || null;
};

export const createNewParty = (
  leader: Character,
  name: string,
  targetActivity: PartyTargetActivity,
  lootMode: PartyLootMode
): Party => {
  // Leave previous party if any
  leaveCurrentParty(leader.id);

  const leaderMember: PartyMember = {
    id: leader.id,
    name: leader.name,
    level: leader.level,
    classRole: leader.characterClass || 'Sentinel', // Derived from character class
    hp: leader.stats.hp,
    maxHp: leader.stats.maxHp,
    mana: leader.stats.mana,
    maxMana: leader.stats.maxMana,
    isLeader: true,
    isReady: true,
    icon: '⚔️',
    joinedAt: new Date().toISOString(),
  };

  const newParty: Party = {
    id: `party_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim() || `${leader.name}'s Party`,
    leaderId: leader.id,
    leaderName: leader.name,
    members: [leaderMember],
    maxMembers: 5,
    targetActivity,
    lootMode,
    createdAt: new Date().toISOString(),
    isPrivate: false,
    sharedExpBonusPercent: 10,
  };

  partyListStore.push(newParty);
  return newParty;
};

export const joinParty = (partyId: string, character: Character): { success: boolean; message: string; party?: Party } => {
  const party = partyListStore.find((p) => p.id === partyId);
  if (!party) {
    return { success: false, message: 'Party no longer exists.' };
  }

  if (party.members.length >= party.maxMembers) {
    return { success: false, message: 'Party is currently full (5/5).' };
  }

  // Check if character is already in this party
  if (party.members.some((m) => m.id === character.id)) {
    return { success: true, message: 'Already in party.', party };
  }

  // Remove from any other party first
  leaveCurrentParty(character.id);

  const newMember: PartyMember = {
    id: character.id,
    name: character.name,
    level: character.level,
    classRole: character.characterClass || 'Mage',
    hp: character.stats.hp,
    maxHp: character.stats.maxHp,
    mana: character.stats.mana,
    maxMana: character.stats.maxMana,
    isLeader: false,
    isReady: true,
    icon: '✨',
    joinedAt: new Date().toISOString(),
  };

  party.members.push(newMember);

  // Recalculate bonus
  party.sharedExpBonusPercent = Math.min(25, party.members.length * 5);

  return { success: true, message: `Joined party "${party.name}"!`, party };
};

export const leaveCurrentParty = (characterId: string): void => {
  for (let i = 0; i < partyListStore.length; i++) {
    const party = partyListStore[i];
    const memberIdx = party.members.findIndex((m) => m.id === characterId);

    if (memberIdx !== -1) {
      party.members.splice(memberIdx, 1);

      if (party.members.length === 0) {
        // Disband party if empty
        partyListStore.splice(i, 1);
        i--;
      } else if (party.leaderId === characterId) {
        // Transfer leadership to next member
        party.members[0].isLeader = true;
        party.leaderId = party.members[0].id;
        party.leaderName = party.members[0].name;
      }
    }
  }
};

export const toggleMemberReadyState = (partyId: string, characterId: string): boolean => {
  const party = getPartyById(partyId);
  if (!party) return false;

  const member = party.members.find((m) => m.id === characterId);
  if (member) {
    member.isReady = !member.isReady;
    return member.isReady;
  }
  return false;
};

export const kickMemberFromParty = (partyId: string, leaderId: string, targetId: string): boolean => {
  const party = getPartyById(partyId);
  if (!party || party.leaderId !== leaderId) return false;

  const idx = party.members.findIndex((m) => m.id === targetId);
  if (idx !== -1) {
    party.members.splice(idx, 1);
    return true;
  }
  return false;
};
