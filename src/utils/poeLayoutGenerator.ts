import { SkillTree, SkillTreeNode } from '../data/skillTrees';
import { Character, CharacterStats } from '../types/game';

export interface Point {
  x: number;
  y: number;
}

export interface BranchLayout {
  coords: Record<string, Point>;
  branchCenters: Point[];
  hub: Point;
}

export type NodeCategory = 'keystone' | 'notable' | 'passive';

/**
 * Computes node category based on node tier, type, and maxRank.
 */
export const getNodeCategory = (node: SkillTreeNode): NodeCategory => {
  if (node.tier === 4 || node.maxRank === 1 && node.tier >= 3) {
    return 'keystone';
  }
  if (node.tier === 3 || node.type === 'active' || node.type === 'autoCast') {
    return 'notable';
  }
  return 'passive';
};

/**
 * Dynamically computes node relative coordinates (x, y) centered at origin (0,0)
 * for the given list of equipped trees.
 * Slot 0: North (-90°), Slot 1: East (0°), Slot 2: South (+90°), Slot 3: West (180°).
 */
export const calculatePoELayout = (
  equippedTrees: SkillTree[],
  tierRadii = { tier1: 180, tier2: 340, tier3: 500, tier4: 660 }
): BranchLayout => {
  const coords: Record<string, Point> = {};
  const branchCenters: Point[] = [];

  // Quadrant base angles for 4 slots: North (-90°), East (0°), South (+90°), West (180°)
  const quadrantAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  equippedTrees.forEach((tree, slotIdx) => {
    const baseAngle = quadrantAngles[slotIdx % 4];

    // Branch center at intermediate distance for camera quick-jumps
    const branchCenterX = 380 * Math.cos(baseAngle);
    const branchCenterY = 380 * Math.sin(baseAngle);
    branchCenters.push({ x: branchCenterX, y: branchCenterY });

    const tier1 = tree.nodes.filter((n) => n.tier === 1);
    const tier2 = tree.nodes.filter((n) => n.tier === 2);
    const tier3 = tree.nodes.filter((n) => n.tier === 3);
    const tier4 = tree.nodes.filter((n) => n.tier === 4);

    // Layout nodes in a tier along a radial arc
    const layoutTierArc = (nodes: SkillTreeNode[], radius: number, arcSpreadRad: number) => {
      const count = nodes.length;
      if (count === 0) return;

      const angleStep = count > 1 ? arcSpreadRad / (count - 1) : 0;
      const startAngle = baseAngle - arcSpreadRad / 2;

      nodes.forEach((node, idx) => {
        const angle = count > 1 ? startAngle + idx * angleStep : baseAngle;
        coords[node.id] = {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        };
      });
    };

    // Layout Tier 1 -> Tier 4
    layoutTierArc(tier1, tierRadii.tier1, 0.45);
    layoutTierArc(tier2, tierRadii.tier2, 0.60);
    layoutTierArc(tier3, tierRadii.tier3, 0.70);
    layoutTierArc(tier4, tierRadii.tier4, 0.50);

    // Fallback for any node without coordinates
    tree.nodes.forEach((node) => {
      if (!coords[node.id]) {
        const tierMap: Record<number, number> = {
          1: tierRadii.tier1,
          2: tierRadii.tier2,
          3: tierRadii.tier3,
          4: tierRadii.tier4,
        };
        const r = tierMap[node.tier] || 400;
        coords[node.id] = {
          x: r * Math.cos(baseAngle),
          y: r * Math.sin(baseAngle),
        };
      }
    });
  });

  return {
    coords,
    branchCenters,
    hub: { x: 0, y: 0 },
  };
};

/**
 * Aggregates all stat bonuses granted across allocated nodes in active trees.
 */
export const calculateTotalBuildStats = (
  equippedTrees: SkillTree[],
  treeAllocations: Record<string, Record<string, number>>
) => {
  const stats: Partial<CharacterStats> = {};
  let totalPointsSpent = 0;

  equippedTrees.forEach((tree) => {
    const allocations = treeAllocations[tree.id] || {};
    tree.nodes.forEach((node) => {
      const rank = allocations[node.id] || 0;
      if (rank > 0) {
        totalPointsSpent += rank;
        if (node.statBonusPerRank) {
          Object.entries(node.statBonusPerRank).forEach(([k, v]) => {
            const statKey = k as keyof CharacterStats;
            stats[statKey] = ((stats[statKey] || 0) as number) + (v as number) * rank;
          });
        }
      }
    });
  });

  return { stats, totalPointsSpent };
};
