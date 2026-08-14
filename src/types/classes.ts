export type CharacterType = 'physical' | 'magical' | 'defensive' | 'support';

export interface ClassStatBonus {
  hp: number;
  mana: number;
  str: number;
  int: number;
  def: number;
  wis: number;
  spd: number;
  dex: number;
}

export interface LevelUpGrowth {
  hp: number;
  mana: number;
  str: number;
  int: number;
  def: number;
  wis: number;
  spd: number;
  dex: number;
}

export interface CharacterClassDefinition {
  id: string;
  name: string;
  icon: string;
  roleTitle: string;
  badgeColor: string; // CSS border/bg class string
  characterType: CharacterType;
  typeTitle: string;
  typeBadgeColor: string;
  description: string;
  primaryStat: 'str' | 'int' | 'spd' | 'dex' | 'wis' | 'def';
  baseStatsBonus: ClassStatBonus;
  levelUpGrowth: LevelUpGrowth;
  starterSkills: string[];
  starterWeaponName: string;
  starterWeaponType: 'physical' | 'magical';
  starterWeaponIcon: string;
  starterWeaponStats: {
    str?: number;
    int?: number;
    def?: number;
    spd?: number;
    dex?: number;
    wis?: number;
    hp?: number;
  };
}

export interface ArchetypeDefinition {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
  description: string;
  perksSummary: string;
  statBonus: Partial<ClassStatBonus>;
  passiveSkillId?: string;
}
