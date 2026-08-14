import React from 'react';
import { Character } from '../types/game';
import { audio } from '../utils/audio';
import {
  Castle,
  Map,
  Sword,
  Flame,
  Users,
  User,
  Package,
  Hammer,
  BookOpen,
  Sparkles,
  Store,
  Shield,
  Scroll,
  ChevronLeft,
  ChevronRight,
  X,
  Gift,
  Compass,
  Briefcase,
  Users2,
  Sparkle,
} from 'lucide-react';

export type NavViewId =
  | 'city'
  | 'map'
  | 'combat'
  | 'raid'
  | 'party'
  | 'character'
  | 'inventory'
  | 'blacksmith'
  | 'skills'
  | 'familiar'
  | 'market'
  | 'mercenary'
  | 'guild'
  | 'quests';

export interface NavCategory {
  title: string;
  items: {
    id: NavViewId;
    name: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[];
}

interface SidebarNavProps {
  character: Character | null;
  activeView: NavViewId | string;
  onNavigateView: (view: NavViewId) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenDailyReward?: () => void;
  onOpenPartyModal?: () => void;
  onOpenRaidConfirm?: () => void;
  isCombatLocked?: boolean;
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    title: 'SANCTUARY & WORLD',
    items: [
      {
        id: 'city',
        name: 'Town Sanctuary',
        description: 'Trade, rest, notice board & shops',
        icon: Castle,
      },
      {
        id: 'map',
        name: 'World Map',
        description: 'Explore wilderness zones & travel',
        icon: Map,
      },
      {
        id: 'combat',
        name: 'Dungeon Dive',
        description: 'Tactical squad combat & loot',
        icon: Sword,
        badge: 'ACTIVE',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      },
      {
        id: 'raid',
        name: 'Apex Raid Arena',
        description: 'Co-op boss battle encounters',
        icon: Flame,
        badge: 'RAID',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      },
    ],
  },
  {
    title: 'HERO & EQUIPMENT',
    items: [
      {
        id: 'character',
        name: 'Character & Stats',
        description: 'Growth attributes & equipment loadouts',
        icon: User,
      },
      {
        id: 'inventory',
        name: 'Inventory',
        description: 'Manage gear, materials & consumables',
        icon: Package,
      },
      {
        id: 'skills',
        name: 'Skillbook & Trees',
        description: 'Constellation passive & active skills',
        icon: BookOpen,
      },
      {
        id: 'blacksmith',
        name: 'Blacksmith Workshop',
        description: 'Enchant, fuse & forge equipment',
        icon: Hammer,
      },
      {
        id: 'familiar',
        name: 'Pet Companion',
        description: 'Evolve familiars & stat aura bonuses',
        icon: Sparkles,
      },
    ],
  },
  {
    title: 'COMMUNITY & COMMERCE',
    items: [
      {
        id: 'party',
        name: 'Party Squad Hub',
        description: 'Form 5-player combat fireteams',
        icon: Users2,
      },
      {
        id: 'guild',
        name: 'Guild Sanctuary',
        description: 'Sanctuary structures & guild wars',
        icon: Shield,
      },
      {
        id: 'market',
        name: 'Grand Exchange',
        description: 'Atomic player marketplace',
        icon: Store,
      },
      {
        id: 'mercenary',
        name: 'Tavern Mercenaries',
        description: 'Hire NPC mercenaries for combat',
        icon: Users,
      },
      {
        id: 'quests',
        name: 'Quest Director',
        description: 'Realm quests & bounty rewards',
        icon: Scroll,
      },
    ],
  },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  character,
  activeView,
  onNavigateView,
  isOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  onOpenDailyReward,
  onOpenPartyModal,
  onOpenRaidConfirm,
  isCombatLocked = false,
}) => {
  if (!character) return null;

  const invCount = character.inventory ? character.inventory.filter(Boolean).length : 0;

  const handleItemClick = (id: NavViewId) => {
    audio.playClick();
    if (id === 'raid' && onOpenRaidConfirm) {
      onOpenRaidConfirm();
    } else {
      onNavigateView(id);
    }
    // Close mobile overlay on selection
    if (window.innerWidth < 1024) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-[53px] bottom-0 left-0 z-40 flex flex-col border-r border-amber-500/20 bg-slate-950/95 backdrop-blur-xl text-slate-100 shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Header Bar inside Sidebar */}
        <div className="flex items-center justify-between border-b border-amber-500/20 px-3 py-3 shrink-0 bg-slate-900/60">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
              <span className="font-serif text-xs font-bold tracking-wider text-amber-200 uppercase">
                Realm Navigation
              </span>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="flex lg:hidden items-center justify-center h-7 w-7 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Categories & List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-slate-950">
          {NAV_CATEGORIES.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center justify-between">
                  <span>{cat.title}</span>
                </div>
              )}

              <div className="space-y-0.5">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  // Dynamic badge override (e.g. Inventory count)
                  let displayBadge = item.badge;
                  let displayBadgeColor = item.badgeColor;

                  if (item.id === 'inventory') {
                    displayBadge = `${invCount}`;
                    displayBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  }

                  const isItemLocked = isCombatLocked && item.id !== 'combat' && item.id !== 'raid';
                  if (isItemLocked) {
                    displayBadge = '🔒 LOCKED';
                    displayBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold';
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`group relative flex items-center w-full rounded-xl transition-all cursor-pointer ${
                        isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5 text-left'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 border border-amber-400/50'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-amber-200 border border-transparent'
                      }`}
                      title={isCollapsed ? `${item.name} — ${item.description}` : undefined}
                    >
                      {/* Active Indicator Bar on left edge when collapsed */}
                      {isActive && isCollapsed && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full" />
                      )}

                      <Icon
                        className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          isCollapsed ? 'h-5 w-5' : 'h-4 w-4'
                        } ${
                          isActive
                            ? 'text-slate-950'
                            : 'text-amber-400/90 group-hover:text-amber-300'
                        }`}
                      />

                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs truncate ${
                                isActive ? 'font-black text-slate-950' : 'font-bold text-slate-200 group-hover:text-amber-200'
                              }`}
                            >
                              {item.name}
                            </span>
                            {displayBadge && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold border ${
                                  isActive
                                    ? 'bg-slate-950/30 text-slate-950 border-slate-950/20'
                                    : displayBadgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {displayBadge}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[10px] truncate ${
                              isActive ? 'text-slate-900/80 font-medium' : 'text-slate-400'
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Quick Shortcuts inside Sidebar */}
        {!isCollapsed && onOpenDailyReward && (
          <div className="p-2 border-t border-amber-500/20 bg-slate-900/80 shrink-0 space-y-1.5">
            <button
              onClick={() => {
                audio.playClick();
                onOpenDailyReward();
              }}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-amber-950/90 to-amber-900/60 border border-amber-500/40 p-2 text-xs font-bold text-amber-200 hover:brightness-110 transition-all cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-400 animate-pulse" />
                <span>Daily Rewards</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500 text-slate-950 font-black">
                CLAIM
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
