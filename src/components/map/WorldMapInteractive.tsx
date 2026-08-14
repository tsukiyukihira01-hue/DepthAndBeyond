import React, { useState } from 'react';
import { Character } from '../../types/game';
import { MAP_REGIONS, WEATHER_EFFECTS, TRAVEL_ENCOUNTERS } from '../../data/mapsData';
import { MapNode, MapRegion, TravelEncounter } from '../../types/map';
import { NodeDetailModal } from './NodeDetailModal';
import { TravelEncounterModal } from './TravelEncounterModal';
import { GatheringNodeModal } from './GatheringNodeModal';
import {
  Compass,
  MapPin,
  Navigation,
  ShieldCheck,
  Flame,
  Zap,
  Pickaxe,
  Sparkles,
  ChevronRight,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface WorldMapInteractiveProps {
  character: Character;
  uiMode: 'auto' | 'mobile' | 'desktop';
  onZoneChange: (zoneId: string) => void;
  onEnterCombat: (monsterId?: string) => void;
  onUpdateCharacter?: (updated: Character) => void;
}

export const WorldMapInteractive: React.FC<WorldMapInteractiveProps> = ({
  character,
  uiMode,
  onZoneChange,
  onEnterCombat,
  onUpdateCharacter,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('reg_sun_kingdom');
  const [inspectedNode, setInspectedNode] = useState<MapNode | null>(null);
  const [gatheringNode, setGatheringNode] = useState<MapNode | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<TravelEncounter | null>(null);

  // Travel engine state
  const [travellingTargetId, setTravellingTargetId] = useState<string | null>(null);
  const [travelProgress, setTravelProgress] = useState<number>(0);

  const activeRegion = MAP_REGIONS.find((r) => r.id === selectedRegionId) || MAP_REGIONS[0];
  const activeWeather = WEATHER_EFFECTS[activeRegion.weather];

  // Find node corresponding to current player position across all regions
  const allNodes = MAP_REGIONS.flatMap((r) => r.nodes);
  const currentPositionNode =
    allNodes.find((n) => n.id === character.currentZoneId || n.townId === character.currentZoneId) ||
    allNodes[0];

  const handleStartTravel = (targetNodeId: string) => {
    if (targetNodeId === character.currentZoneId || travellingTargetId) return;

    setTravellingTargetId(targetNodeId);
    setTravelProgress(0);

    const delaySeconds = 3;
    const intervalTime = 100;
    const increment = 100 / ((delaySeconds * 1000) / intervalTime);

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        clearInterval(timer);
        setTravelProgress(100);
        setTravellingTargetId(null);
        onZoneChange(targetNodeId);

        // 35% Chance to trigger a Travel Event Encounter upon arrival!
        if (Math.random() < 0.35) {
          const randomEnc = TRAVEL_ENCOUNTERS[Math.floor(Math.random() * TRAVEL_ENCOUNTERS.length)];
          setActiveEncounter(randomEnc);
        }
      } else {
        setTravelProgress(currentProgress);
      }
    }, intervalTime);
  };

  const handleFastTravel = (targetNodeId: string) => {
    const FAST_TRAVEL_COST = 100;
    if (character.gold < FAST_TRAVEL_COST) {
      alert(`Insufficient Gold! Fast Travel requires ${FAST_TRAVEL_COST} Gold.`);
      return;
    }

    if (onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        gold: character.gold - FAST_TRAVEL_COST,
      });
    }

    onZoneChange(targetNodeId);
  };

  const isMobileLayout = uiMode === 'mobile' || (uiMode === 'auto' && typeof window !== 'undefined' && window.innerWidth < 768);

  return (
    <div className="relative w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl space-y-4">
      {/* Map Header & Weather Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/40 text-2xl">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-amber-200">
                Interactive World Map — {activeRegion.name}
              </h2>
              <span className="rounded-full bg-slate-900 border border-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                {activeRegion.recommendedLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Current Location: <span className="text-amber-300 font-bold">{currentPositionNode.name}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Regional Weather Indicator */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3.5 py-2 text-xs">
          <span className="text-xl">{activeWeather.icon}</span>
          <div>
            <div className="font-bold text-amber-300">{activeWeather.name}</div>
            <div className="text-[10px] text-emerald-300 font-semibold">{activeWeather.statBonus}</div>
          </div>
        </div>
      </div>

      {/* Travel Engine Progress Overlay */}
      {travellingTargetId && (
        <div className="my-2 rounded-xl border border-amber-500/50 bg-slate-900 p-3.5 space-y-1.5 animate-pulse">
          <div className="flex justify-between text-xs text-amber-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Navigation className="h-4 w-4 animate-spin text-amber-400" /> Travelling across regional paths...
            </span>
            <span>{Math.round(travelProgress)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-amber-950">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-100"
              style={{ width: `${travelProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Region Selector Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-bold">
        {MAP_REGIONS.map((region) => {
          const isActive = region.id === selectedRegionId;
          return (
            <button
              key={region.id}
              onClick={() => setSelectedRegionId(region.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-amber-200'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>{region.name}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop / Interactive Map Canvas View */}
      {!isMobileLayout ? (
        <div className="relative min-h-[420px] w-full rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden p-6 shadow-inner">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e2b857_1.5px,transparent_1.5px)] [background-size:20px_20px]" />

          {/* Canvas Connection SVG Lines between Nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {activeRegion.nodes.map((node) =>
              node.connections.map((conn) => {
                const targetNode = activeRegion.nodes.find((n) => n.id === conn.targetNodeId);
                if (!targetNode) return null;

                return (
                  <line
                    key={`${node.id}-${conn.targetNodeId}`}
                    x1={`${node.coordinates.x}%`}
                    y1={`${node.coordinates.y}%`}
                    x2={`${targetNode.coordinates.x}%`}
                    y2={`${targetNode.coordinates.y}%`}
                    stroke="#e2b857"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeOpacity="0.35"
                  />
                );
              })
            )}
          </svg>

          {/* Interactive Canvas Nodes */}
          <div className="relative z-10 w-full h-full min-h-[380px]">
            {activeRegion.nodes.map((node) => {
              const isCurrent = node.id === currentPositionNode.id;
              const isLevelMet = character.level >= node.minLevelReq;

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.coordinates.x}%`, top: `${node.coordinates.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <button
                    onClick={() => setInspectedNode(node)}
                    className={`group relative flex items-center gap-2 rounded-xl border p-2.5 shadow-xl transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 scale-110 shadow-emerald-500/20'
                        : isLevelMet
                        ? 'border-amber-500/50 bg-slate-900/90 hover:scale-105 hover:border-amber-400 text-amber-200'
                        : 'border-slate-800 bg-slate-950/90 text-slate-500 opacity-80'
                    }`}
                  >
                    <span className="text-xl">
                      {node.type === 'city'
                        ? '🏰'
                        : node.type === 'dungeon'
                        ? '⛩️'
                        : node.type === 'shrine'
                        ? '☀️'
                        : node.type === 'gathering'
                        ? '⛏️'
                        : '🌲'}
                    </span>

                    <div className="text-left leading-none">
                      <div className="font-bold text-xs whitespace-nowrap flex items-center gap-1">
                        <span>{node.name}</span>
                        {isCurrent && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">Lv {node.levelRange}</span>
                    </div>

                    {!isLevelMet && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Mobile Mode: Vertical Interactive Zone List */
        <div className="space-y-2.5">
          {activeRegion.nodes.map((node) => {
            const isCurrent = node.id === currentPositionNode.id;
            const isLevelMet = character.level >= node.minLevelReq;

            return (
              <div
                key={node.id}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                  isCurrent
                    ? 'border-emerald-400/80 bg-emerald-950/20 text-emerald-100'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className="text-lg">
                      {node.type === 'city' ? '🏰' : node.type === 'dungeon' ? '⛩️' : '🌲'}
                    </span>
                    <span>{node.name}</span>
                    <span className="text-[10px] text-slate-400">[{node.levelRange}]</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{node.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectedNode(node)}
                    className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-900/60 transition-colors cursor-pointer"
                  >
                    {isCurrent ? 'Inspect Node' : 'Travel →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Modals */}
      {inspectedNode && (
        <NodeDetailModal
          node={inspectedNode}
          character={character}
          onClose={() => setInspectedNode(null)}
          onTravel={handleStartTravel}
          onFastTravel={handleFastTravel}
          onEnterCombat={onEnterCombat}
          onGatherResource={(node) => setGatheringNode(node)}
        />
      )}

      {activeEncounter && (
        <TravelEncounterModal
          encounter={activeEncounter}
          character={character}
          onClose={() => setActiveEncounter(null)}
          onEnterCombat={onEnterCombat}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {gatheringNode && (
        <GatheringNodeModal
          node={gatheringNode}
          character={character}
          onClose={() => setGatheringNode(null)}
          onUpdateCharacter={(char) => onUpdateCharacter?.(char)}
        />
      )}
    </div>
  );
};
