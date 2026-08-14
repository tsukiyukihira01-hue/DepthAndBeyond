export type MapNodeType = 
  | 'city' 
  | 'wilderness' 
  | 'dungeon' 
  | 'waypoint' 
  | 'shrine' 
  | 'gathering' 
  | 'event';

export type WeatherType = 
  | 'clear' 
  | 'mist' 
  | 'rain' 
  | 'storm' 
  | 'leyline_surge' 
  | 'solar_blessing' 
  | 'abyssal_miasma';

export interface WeatherEffect {
  name: string;
  description: string;
  statBonus: string;
  icon: string;
}

export interface RouteConnection {
  targetNodeId: string;
  distanceKm: number;
  travelTimeSeconds: number;
  dangerLevel: 'safe' | 'low' | 'moderate' | 'high' | 'deadly';
}

export interface GatheringResource {
  id: string;
  name: string;
  type: 'herb' | 'ore' | 'crystal' | 'wood';
  icon: string;
  levelReq: number;
  yieldItemId: string;
  yieldItemName: string;
  yieldQuantity: [number, number]; // [min, max]
  respawnTimeSeconds: number;
}

export interface MapNode {
  id: string;
  regionId: string;
  name: string;
  type: MapNodeType;
  levelRange: string;
  minLevelReq: number;
  description: string;
  coordinates: { x: number; y: number }; // percentage 0-100 on map canvas
  isSafeCity?: boolean;
  townId?: string; // Associated town data ID if type === 'city'
  isDungeon?: boolean;
  maxFloor?: number;
  monsters?: string[];
  connections: RouteConnection[];
  gatheringResources?: GatheringResource[];
  shrineBuff?: {
    name: string;
    description: string;
    durationMinutes: number;
    statBonus: { hpPercent?: number; expPercent?: number; goldPercent?: number; strBonus?: number };
    icon: string;
  };
  unlockRequirement?: {
    minLevel?: number;
    prerequisiteNodeId?: string;
    questId?: string;
  };
}

export interface MapRegion {
  id: string;
  name: string;
  description: string;
  recommendedLevel: string;
  weather: WeatherType;
  primaryColor: string; // Tailwind color class or hex
  nodes: MapNode[];
}

export interface TravelEncounter {
  id: string;
  title: string;
  description: string;
  type: 'combat' | 'merchant' | 'shrine' | 'treasure' | 'flavor';
  icon: string;
  monsterId?: string;
  rewards?: {
    gold?: number;
    exp?: number;
    items?: Array<{ name: string; icon: string; rarity: string; quantity: number }>;
  };
}
