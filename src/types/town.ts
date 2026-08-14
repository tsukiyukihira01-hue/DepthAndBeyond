export interface NpcOption {
  id: string;
  label: string;
  icon: string;
  actionType: 'open_facility' | 'talk_lore' | 'accept_bounty' | 'donate_city' | 'fountain_rest' | 'open_shop';
  facilityView?: 
    | 'blacksmith' 
    | 'market' 
    | 'inventory' 
    | 'skills' 
    | 'quests' 
    | 'familiar' 
    | 'mercenary' 
    | 'guild' 
    | 'character';
  dialogueResponse?: string;
  badge?: string;
}

export interface NpcCharacter {
  id: string;
  name: string;
  title: string;
  avatar: string;
  districtId: string;
  quote: string;
  loreText: string;
  options: NpcOption[];
  affinityLevel?: number; // Player NPC Favor
  colorTheme: string;
}

export interface TownDistrict {
  id: string;
  name: string;
  description: string;
  icon: string;
  bgGradient: string;
  npcs: NpcCharacter[];
}

export interface TownBounty {
  id: string;
  title: string;
  description: string;
  targetType: 'kill' | 'gather' | 'travel';
  targetCount: number;
  rewardGold: number;
  rewardExp: number;
  rewardReputation: number;
  rewardItemName?: string;
  levelReq: number;
}

export interface CityFacility {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  upgradeCostGold: number;
  upgradeCostMaterials: number;
  effectDescription: string;
  icon: string;
}

export interface TownData {
  id: string;
  name: string;
  title: string;
  levelReq: number;
  description: string;
  bannerImage?: string;
  townLevel: number;
  reputationName: string; // e.g. "Hero of Sun City"
  districts: TownDistrict[];
  facilities: CityFacility[];
  bounties: TownBounty[];
  newsBulletin: string[];
}
