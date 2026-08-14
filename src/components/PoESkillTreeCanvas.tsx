import React, { useState, useRef, useMemo } from 'react';
import { SkillTree, SkillTreeNode } from '../data/skillTrees';
import { Character, CharacterStats } from '../types/game';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import {
  Point,
  calculatePoELayout,
  calculateTotalBuildStats,
  getNodeCategory,
} from '../utils/poeLayoutGenerator';
import { PoENodeCard } from './PoENodeCard';
import { PoEInspectorPanel } from './PoEInspectorPanel';

interface PoESkillTreeCanvasProps {
  equippedTrees: SkillTree[]; // The 4 active equipped core branches
  character: Character;
  availableSP: number;
  totalSP: number;
  spentSP: number;
  onIncreaseRank: (node: SkillTreeNode, treeId: string) => void;
  onDecreaseRank: (node: SkillTreeNode, treeId: string) => void;
  onRespecAll?: () => void;
  onOpenTreePicker: (slotIndex: number) => void;
}

export const PoESkillTreeCanvas: React.FC<PoESkillTreeCanvasProps> = ({
  equippedTrees,
  character,
  availableSP,
  totalSP,
  spentSP,
  onIncreaseRank,
  onDecreaseRank,
  onRespecAll,
  onOpenTreePicker,
}) => {
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeData, setSelectedNodeData] = useState<{
    node: SkillTreeNode;
    tree: SkillTree;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Pointer tracking ref for unified mouse + touch panning
  const pointerRef = useRef<{ isDragging: boolean; startX: number; startY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0,
  });

  // Touch pinch zoom ref
  const touchPinchRef = useRef<{ initialDistance: number | null; initialZoom: number }>({
    initialDistance: null,
    initialZoom: 0.75,
  });

  const treeAllocations = character.treeAllocations || {};

  // Color map helper
  const colorStyles: Record<
    string,
    { lineActive: string; lineGlow: string; bg: string; border: string; text: string; badge: string }
  > = {
    amber: { lineActive: '#f59e0b', lineGlow: '#d97706', bg: 'bg-amber-950/70', border: 'border-amber-500/60', text: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    rose: { lineActive: '#f43f5e', lineGlow: '#e11d48', bg: 'bg-rose-950/70', border: 'border-rose-500/60', text: 'text-rose-300', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    sky: { lineActive: '#38bdf8', lineGlow: '#0284c7', bg: 'bg-sky-950/70', border: 'border-sky-500/60', text: 'text-sky-300', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    emerald: { lineActive: '#10b981', lineGlow: '#059669', bg: 'bg-emerald-950/70', border: 'border-emerald-500/60', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    purple: { lineActive: '#c084fc', lineGlow: '#9333ea', bg: 'bg-purple-950/70', border: 'border-purple-500/60', text: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    indigo: { lineActive: '#818cf8', lineGlow: '#4f46e5', bg: 'bg-indigo-950/70', border: 'border-indigo-500/60', text: 'text-indigo-300', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    cyan: { lineActive: '#22d3ee', lineGlow: '#0891b2', bg: 'bg-cyan-950/70', border: 'border-cyan-500/60', text: 'text-cyan-300', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    yellow: { lineActive: '#facc15', lineGlow: '#ca8a04', bg: 'bg-yellow-950/70', border: 'border-yellow-500/60', text: 'text-yellow-300', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    red: { lineActive: '#ef4444', lineGlow: '#dc2626', bg: 'bg-red-950/70', border: 'border-red-500/60', text: 'text-red-300', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
    teal: { lineActive: '#2dd4bf', lineGlow: '#0d9488', bg: 'bg-teal-950/70', border: 'border-teal-500/60', text: 'text-teal-300', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    fuchsia: { lineActive: '#e879f9', lineGlow: '#c026d3', bg: 'bg-fuchsia-950/70', border: 'border-fuchsia-500/60', text: 'text-fuchsia-300', badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
    orange: { lineActive: '#fb923c', lineGlow: '#ea580c', bg: 'bg-orange-950/70', border: 'border-orange-500/60', text: 'text-orange-300', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  };

  // Compute layout coordinates dynamically
  const branchLayout = useMemo(() => {
    return calculatePoELayout(equippedTrees);
  }, [equippedTrees]);

  // Aggregate total stats
  const totalBuildStats = useMemo(() => {
    return calculateTotalBuildStats(equippedTrees, treeAllocations);
  }, [equippedTrees, treeAllocations]);

  // Check if node is allocatable
  const isNodeAllocatable = (node: SkillTreeNode, treeId: string): boolean => {
    const allocations = treeAllocations[treeId] || {};
    const rank = allocations[node.id] || 0;
    if (rank >= node.maxRank) return false;
    if (availableSP < 1) return false;

    // Tier 1 nodes connect directly to Central Origin Hub
    if (node.tier === 1) return true;

    // Check prerequisites
    if (node.prerequisites && node.prerequisites.length > 0) {
      return node.prerequisites.some((pId) => (allocations[pId] || 0) > 0);
    }

    // Default tier check
    const tree = equippedTrees.find((t) => t.id === treeId);
    if (!tree) return false;
    const prevTierNodes = tree.nodes.filter((n) => n.tier === node.tier - 1);
    return prevTierNodes.some((n) => (allocations[n.id] || 0) > 0);
  };

  // Check if node can be refunded safely
  const isNodeRefundable = (node: SkillTreeNode, treeId: string): boolean => {
    const allocations = treeAllocations[treeId] || {};
    const rank = allocations[node.id] || 0;
    if (rank <= 0) return false;
    if (rank > 1) return true;

    const tree = equippedTrees.find((t) => t.id === treeId);
    if (!tree) return true;

    const downstreamAllocated = tree.nodes.filter(
      (n) => (allocations[n.id] || 0) > 0 && n.prerequisites?.includes(node.id)
    );

    for (const child of downstreamAllocated) {
      const altAllocatedPrereq = child.prerequisites?.some(
        (pId) => pId !== node.id && (allocations[pId] || 0) > 0
      );
      if (!altAllocatedPrereq) return false;
    }

    return true;
  };

  // Quick Jump to origin or quadrant
  const jumpToBranch = (target: 'origin' | number) => {
    if (target === 'origin') {
      setPan({ x: 0, y: 0 });
      setZoom(0.75);
      return;
    }

    // Offsets for the 4 quadrants: Slot 0 (North), Slot 1 (East), Slot 2 (South), Slot 3 (West)
    const offsets: Point[] = [
      { x: 0, y: 320 },
      { x: -320, y: 0 },
      { x: 0, y: -320 },
      { x: 320, y: 0 },
    ];

    setPan(offsets[target % 4] || { x: 0, y: 0 });
    setZoom(0.85);
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.75);
  };

  // Mouse & Touch Drag Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.poe-node-card, .poe-touch-control')) return;
    pointerRef.current = {
      isDragging: true,
      startX: e.clientX - pan.x,
      startY: e.clientY - pan.y,
    };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerRef.current.isDragging) return;
    setPan({
      x: e.clientX - pointerRef.current.startX,
      y: e.clientY - pointerRef.current.startY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointerRef.current.isDragging = false;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Touch Pinch-to-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchPinchRef.current = { initialDistance: dist, initialZoom: zoom };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchPinchRef.current.initialDistance) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / touchPinchRef.current.initialDistance;
      const newZoom = Math.min(1.6, Math.max(0.4, touchPinchRef.current.initialZoom * ratio));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchPinchRef.current.initialDistance = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.min(1.6, Math.max(0.4, z + delta)));
  };

  return (
    <div className="space-y-4">
      {/* 1. POE CANVAS CONTROLS & SEARCH BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
        {/* Left: Search Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all 4 core trees (STR, Ward, Shield)..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500/60 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Center: Quick Jump Buttons for the 4 Quadrants */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 text-[11px] font-bold hidden sm:inline">Jump:</span>
          <button
            onClick={() => jumpToBranch('origin')}
            className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900 font-bold transition-all cursor-pointer touch-manipulation"
          >
            🌟 Origin Hub
          </button>
          {equippedTrees.map((tree, idx) => (
            <button
              key={`jump_btn_${idx}`}
              onClick={() => jumpToBranch(idx)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-500 hover:text-amber-300 transition-all cursor-pointer touch-manipulation flex items-center gap-1"
            >
              <span>{tree.icon}</span>
              <span className="hidden md:inline">{tree.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Right: Zoom & Recenter Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer touch-manipulation"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-mono px-1 text-amber-300">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer touch-manipulation"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded cursor-pointer ml-1 touch-manipulation"
            title="Recenter Map"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. GRAND POE CONSTELLATION CANVAS STAGE */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`relative w-full h-[560px] sm:h-[680px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden select-none cursor-${
          isDragging ? 'grabbing' : 'grab'
        } shadow-2xl touch-none`}
        style={{
          touchAction: 'none',
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.98) 100%), radial-gradient(rgba(51, 65, 85, 0.18) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 28px 28px',
        }}
      >
        {/* Background Radial Constellation Grids */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] rounded-full border border-slate-800/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-slate-800/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full border border-slate-800/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-amber-500/20" />
        </div>

        {/* FLOATING MOBILE TOUCH DIRECTIONAL D-PAD CONTROLS */}
        <div className="absolute bottom-3 right-3 z-40 bg-slate-950/90 border border-slate-800/90 p-2 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-1 backdrop-blur pointer-events-auto poe-touch-control">
          <button
            onClick={() => setPan((p) => ({ ...p, y: p.y + 120 }))}
            className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center shadow transition-all touch-manipulation active:scale-95"
            title="Pan Up"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPan((p) => ({ ...p, x: p.x + 120 }))}
              className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center shadow transition-all touch-manipulation active:scale-95"
              title="Pan Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={resetView}
              className="h-7 w-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px] shadow"
              title="Recenter"
            >
              🎯
            </button>
            <button
              onClick={() => setPan((p) => ({ ...p, x: p.x - 120 }))}
              className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center shadow transition-all touch-manipulation active:scale-95"
              title="Pan Right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setPan((p) => ({ ...p, y: p.y - 120 }))}
            className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center shadow transition-all touch-manipulation active:scale-95"
            title="Pan Down"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* MOBILE GESTURE INSTRUCTION BADGE */}
        <div className="absolute top-3 left-3 z-30 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-400 pointer-events-none hidden sm:block">
          👆 Drag to pan • ✌️ Pinch to zoom • Tap nodes to allocate SP
        </div>

        {/* TRANSFORMABLE STAGE CENTERED AT (50%, 50%) */}
        <div
          className="absolute left-1/2 top-1/2 transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* SVG CONNECTOR LINES FOR ALL 4 BRANCHES */}
          <svg
            className="absolute overflow-visible pointer-events-none"
            style={{ left: '-1200px', top: '-1200px', width: '2400px', height: '2400px' }}
            viewBox="-1200 -1200 2400 2400"
          >
            <defs>
              <filter id="glowEffect" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Central Origin Hub -> Tier 1 Node Radial Lines for each Equipped Tree */}
            {equippedTrees.map((tree) => {
              const allocations = treeAllocations[tree.id] || {};
              const tier1Nodes = tree.nodes.filter((n) => n.tier === 1);
              const treeStyle = colorStyles[tree.color] || colorStyles.amber;

              return tier1Nodes.map((node) => {
                const targetPos = branchLayout.coords[node.id];
                if (!targetPos) return null;
                const isAllocated = (allocations[node.id] || 0) > 0;

                return (
                  <g key={`hub_line_${tree.id}_${node.id}`}>
                    <line
                      x1={0}
                      y1={0}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={isAllocated ? treeStyle.lineActive : '#334155'}
                      strokeWidth={isAllocated ? 4 : 2}
                      strokeDasharray={isAllocated ? undefined : '5 5'}
                      filter={isAllocated ? 'url(#glowEffect)' : undefined}
                    />
                  </g>
                );
              });
            })}

            {/* Intra-Branch Prerequisite Node Path Lines */}
            {equippedTrees.map((tree) => {
              const allocations = treeAllocations[tree.id] || {};
              const treeStyle = colorStyles[tree.color] || colorStyles.amber;

              return tree.nodes.map((node) => {
                const targetPos = branchLayout.coords[node.id];
                if (!targetPos) return null;
                const isTargetAllocated = (allocations[node.id] || 0) > 0;

                // Determine parent IDs (explicit prerequisites or fallback to first node in tier - 1)
                let parentIds = node.prerequisites && node.prerequisites.length > 0 ? node.prerequisites : [];
                if (parentIds.length === 0 && node.tier > 1) {
                  const prevTierNodes = tree.nodes.filter((n) => n.tier === node.tier - 1);
                  if (prevTierNodes.length > 0) {
                    parentIds = [prevTierNodes[0].id];
                  }
                }
                if (parentIds.length === 0) return null;

                return parentIds.map((pId) => {
                  const parentPos = branchLayout.coords[pId];
                  if (!parentPos) return null;

                  const isParentAllocated = (allocations[pId] || 0) > 0;
                  const isPathActive = isParentAllocated && isTargetAllocated;

                  return (
                    <g key={`link_${tree.id}_${pId}_to_${node.id}`}>
                      <line
                        x1={parentPos.x}
                        y1={parentPos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isPathActive ? treeStyle.lineActive : isParentAllocated ? '#eab308' : '#334155'}
                        strokeWidth={isPathActive ? 4 : isParentAllocated ? 3 : 2}
                        strokeDasharray={isPathActive ? undefined : '4 4'}
                        filter={isPathActive ? 'url(#glowEffect)' : undefined}
                      />
                    </g>
                  );
                });
              });
            })}
          </svg>

          {/* CENTRAL HERO ORIGIN HUB NODE AT (0, 0) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-auto z-30"
            style={{ left: '0px', top: '0px' }}
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-950 p-1 shadow-2xl shadow-amber-500/50 ring-4 ring-amber-400/40 animate-pulse flex items-center justify-center">
              <div className="h-full w-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-3xl border-2 border-amber-300">
                👑
              </div>
            </div>
            <div className="mt-2 text-center space-y-0.5">
              <div className="text-xs font-serif font-black text-amber-200 bg-slate-950/90 border border-amber-500/40 px-3 py-1 rounded-lg shadow-xl uppercase tracking-widest">
                {character.name || 'Hero'} Core Origin
              </div>
              <div className="text-[10px] font-mono text-amber-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                Level {character.level} • {totalBuildStats.totalPointsSpent} / {totalSP} SP Allocated
              </div>
            </div>
          </div>

          {/* RENDERING ALL SKILL NODES ACROSS THE 4 CORE BRANCHES */}
          {equippedTrees.map((tree) => {
            const allocations = treeAllocations[tree.id] || {};
            const treeStyle = colorStyles[tree.color] || colorStyles.amber;

            return tree.nodes.map((node) => {
              const pos = branchLayout.coords[node.id];
              if (!pos) return null;

              const rank = allocations[node.id] || 0;
              const allocatable = isNodeAllocatable(node, tree.id);
              const refundable = isNodeRefundable(node, tree.id);
              const isSelected = selectedNodeData?.node.id === node.id;

              const isSearchMatch =
                searchQuery.trim().length > 0 &&
                (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  Object.keys(node.statBonusPerRank || {}).some((k) =>
                    k.toLowerCase().includes(searchQuery.toLowerCase())
                  ));

              return (
                <PoENodeCard
                  key={`${tree.id}_node_${node.id}`}
                  node={node}
                  tree={tree}
                  pos={pos}
                  rank={rank}
                  allocatable={allocatable}
                  refundable={refundable}
                  isSelected={isSelected}
                  isSearchMatch={isSearchMatch}
                  colorStyle={treeStyle}
                  onSelectNode={(n, t) => setSelectedNodeData({ node: n, tree: t })}
                  onIncreaseRank={onIncreaseRank}
                />
              );
            });
          })}
        </div>
      </div>

      {/* 3. INSPECTOR & BUILD TOTAL STATS SUMMARY PANEL */}
      <PoEInspectorPanel
        selectedNodeData={selectedNodeData}
        character={character}
        totalBuildStats={totalBuildStats}
        spentSP={spentSP}
        isNodeAllocatable={isNodeAllocatable}
        isNodeRefundable={isNodeRefundable}
        onIncreaseRank={onIncreaseRank}
        onDecreaseRank={onDecreaseRank}
        onRespecAll={onRespecAll}
      />
    </div>
  );
};
