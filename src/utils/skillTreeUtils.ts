import { Character, CharacterStats, Skill } from '../types/game';
import { SKILL_TREES, SkillTree, SkillTreeNode } from '../data/skillTrees';
import skillsData from '../data/skills.json';

// Calculate total skill points earned by level (Flat 1 Skill Point per level)
export function getTotalSkillPoints(character: Character): number {
  return Math.max(1, (character?.level || 1) * 1);
}

// Calculate effective character stats including tree stat bonuses
export function getCharacterEffectiveStats(character: Character): CharacterStats {
  const baseStats = character?.stats || {
    str: 10,
    def: 10,
    int: 10,
    wis: 10,
    spd: 10,
    dex: 10,
    maxHp: 150,
    hp: 150,
    maxMana: 100,
    mana: 100,
    ward: 0,
    maxWard: 0,
    unassignedPoints: 0,
  };

  const treeBonuses = calculateTreeStatBonuses(character);

  return {
    ...baseStats,
    str: (baseStats.str || 0) + (treeBonuses.str || 0),
    def: (baseStats.def || 0) + (treeBonuses.def || 0),
    int: (baseStats.int || 0) + (treeBonuses.int || 0),
    wis: (baseStats.wis || 0) + (treeBonuses.wis || 0),
    spd: (baseStats.spd || 0) + (treeBonuses.spd || 0),
    dex: (baseStats.dex || 0) + (treeBonuses.dex || 0),
    maxHp: (baseStats.maxHp || 0) + (treeBonuses.maxHp || 0),
    maxMana: (baseStats.maxMana || 0) + (treeBonuses.maxMana || 0),
    unassignedPoints: 0,
  };
}

// Calculate total skill points spent across all trees
export function getSpentSkillPoints(character: Character): number {
  if (!character.treeAllocations) return 0;
  let spent = 0;
  for (const treeId in character.treeAllocations) {
    const nodeMap = character.treeAllocations[treeId];
    if (nodeMap) {
      for (const nodeId in nodeMap) {
        spent += nodeMap[nodeId] || 0;
      }
    }
  }
  return spent;
}

// Calculate unspent skill points available
export function getAvailableSkillPoints(character: Character): number {
  const total = getTotalSkillPoints(character);
  const spent = getSpentSkillPoints(character);
  return Math.max(0, total - spent);
}

// Calculate total stat bonuses granted by equipped skill tree nodes
export function calculateTreeStatBonuses(character: Character): Partial<CharacterStats> {
  const bonuses: Partial<CharacterStats> = {
    str: 0,
    int: 0,
    wis: 0,
    dex: 0,
    def: 0,
    maxHp: 0,
    maxMana: 0,
    spd: 0,
  };

  if (!character.treeAllocations) return bonuses;

  // Collect active equipped tree IDs (or all allocated trees)
  const equippedTreeIds = character.equippedTrees || ['tree_vanguard', 'tree_blade', 'tree_pyro', 'tree_sylvan'];

  for (const treeId of equippedTreeIds) {
    if (!treeId) continue;
    const tree = SKILL_TREES.find((t) => t.id === treeId);
    if (!tree) continue;

    const allocations = character.treeAllocations[treeId] || {};
    for (const node of tree.nodes) {
      const rank = allocations[node.id] || 0;
      if (rank > 0 && node.statBonusPerRank) {
        for (const statKey in node.statBonusPerRank) {
          const key = statKey as keyof CharacterStats;
          const bonusVal = node.statBonusPerRank[key] || 0;
          bonuses[key] = (bonuses[key] || 0) + bonusVal * rank;
        }
      }
    }
  }

  return bonuses;
}

// Find skill tree by ID
export function getSkillTreeById(id: string): SkillTree | undefined {
  return SKILL_TREES.find((t) => t.id === id);
}

// Helper to convert a SkillTreeNode into a Skill object for combat
export function nodeToSkill(node: SkillTreeNode, tree: SkillTree, rank: number = 1): Skill {
  const rankMult = 1 + 0.2 * Math.max(0, rank - 1);
  return {
    id: node.skillId || `s_${node.id}`,
    name: node.name,
    type: node.typeDetail || (node.type === 'active' ? 'physical' : node.type === 'autoCast' ? 'support' : 'buff'),
    skillCategory: node.type,
    description: `[${tree.name} Rk ${rank}/${node.maxRank}] ${node.description}`,
    manaCost: node.manaCost || 0,
    channelTurns: node.channelTurns || 0,
    cooldownTurns: node.cooldownTurns || 1,
    level: rank,
    isPassive: node.type === 'passive',
    isAutoCast: node.type === 'autoCast',
    targetType: node.targetType || 'single',
    wardGrant: node.wardGrant ? Math.round(node.wardGrant * rankMult) : undefined,
    damageMultiplier: node.damageMultiplier ? Number((node.damageMultiplier * rankMult).toFixed(2)) : 1.0,
    icon: node.icon,
    bookCostGold: 0,
  };
}

// Collect all skills unlocked across allocated nodes in equipped trees
export function getUnlockedTreeSkills(character: Character): Skill[] {
  const resultSkills: Skill[] = [];
  const equippedTreeIds = character.equippedTrees || ['tree_vanguard', 'tree_blade', 'tree_pyro', 'tree_sylvan'];

  for (const treeId of equippedTreeIds) {
    if (!treeId) continue;
    const tree = SKILL_TREES.find((t) => t.id === treeId);
    if (!tree) continue;

    const allocations = character.treeAllocations?.[treeId] || {};
    for (const node of tree.nodes) {
      const rank = allocations[node.id] || 0;
      if (rank > 0) {
        // Look up in existing skills.json or create from node
        const existingSkill = (skillsData as Skill[]).find(
          (s) => s.id === node.skillId || s.name.toLowerCase() === node.name.toLowerCase()
        );

        if (existingSkill) {
          const rankMult = 1 + 0.2 * Math.max(0, rank - 1);
          resultSkills.push({
            ...existingSkill,
            level: rank,
            description: `[${tree.name} Rk ${rank}/${node.maxRank}] ${node.description}`,
            icon: node.icon,
            damageMultiplier: existingSkill.damageMultiplier ? Number((existingSkill.damageMultiplier * rankMult).toFixed(2)) : undefined,
            wardGrant: existingSkill.wardGrant ? Math.round(existingSkill.wardGrant * rankMult) : undefined,
            skillCategory: node.type,
          });
        } else {
          resultSkills.push(nodeToSkill(node, tree, rank));
        }
      }
    }
  }

  // Fallback starter skills if character has no allocations yet
  if (resultSkills.length === 0) {
    const defaultStarterSkills: Skill[] = [
      {
        id: 's_heavy_strike',
        name: 'Heavy Slash',
        type: 'physical',
        skillCategory: 'active',
        description: 'Starter Heavy Slash dealing 150% physical damage.',
        manaCost: 15,
        channelTurns: 0,
        cooldownTurns: 1,
        level: 1,
        targetType: 'single',
        damageMultiplier: 1.5,
        icon: '⚔️',
        bookCostGold: 0,
      },
      {
        id: 's_whirlwind_strike',
        name: 'Whirlwind Sweep',
        type: 'physical',
        skillCategory: 'active',
        description: 'Starter AoE Strike dealing 125% physical damage to ALL targets.',
        manaCost: 15,
        channelTurns: 0,
        cooldownTurns: 1,
        level: 1,
        targetType: 'all',
        damageMultiplier: 1.25,
        icon: '🌀',
        bookCostGold: 0,
      },
      {
        id: 's_arcane_cluster',
        name: 'Arcane Cluster',
        type: 'magical',
        skillCategory: 'active',
        description: 'Starter Magic Barrage dealing 130% magical damage to ALL targets.',
        manaCost: 20,
        channelTurns: 0,
        cooldownTurns: 1,
        level: 1,
        targetType: 'all',
        damageMultiplier: 1.3,
        icon: '✨',
        bookCostGold: 0,
      },
    ];
    return defaultStarterSkills;
  }

  return resultSkills;
}

// Synchronize equipped skills based on unlocked tree allocations
export function synchronizeEquippedSkills(character: Character): {
  actives: (string | null)[];
  autoCast: string | null;
  passives: (string | null)[];
} {
  const unlocked = getUnlockedTreeSkills(character);
  const currentActives = [...(character.equippedSkills?.actives || Array(8).fill(null))];
  let currentAutoCast = character.equippedSkills?.autoCast || null;
  const currentPassives = [...(character.equippedSkills?.passives || Array(4).fill(null))];

  // Fill empty active slots with unlocked active skills
  const unlockedActives = unlocked.filter((s) => s.skillCategory === 'active');
  for (const sk of unlockedActives) {
    if (!currentActives.includes(sk.id)) {
      const emptyIdx = currentActives.findIndex((slot) => slot === null);
      if (emptyIdx !== -1) {
        currentActives[emptyIdx] = sk.id;
      }
    }
  }

  // AutoCast slot
  const unlockedAutoCast = unlocked.find((s) => s.skillCategory === 'autoCast');
  if (!currentAutoCast && unlockedAutoCast) {
    currentAutoCast = unlockedAutoCast.id;
  }

  // Fill empty passive slots with unlocked passive skills
  const unlockedPassives = unlocked.filter((s) => s.skillCategory === 'passive');
  for (const sk of unlockedPassives) {
    if (!currentPassives.includes(sk.id)) {
      const emptyIdx = currentPassives.findIndex((slot) => slot === null);
      if (emptyIdx !== -1) {
        currentPassives[emptyIdx] = sk.id;
      }
    }
  }

  return {
    actives: currentActives,
    autoCast: currentAutoCast,
    passives: currentPassives,
  };
}
