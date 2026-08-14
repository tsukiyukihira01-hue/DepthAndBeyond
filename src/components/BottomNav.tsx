import React, { useState } from 'react';
import { Character } from '../types/game';
import { audio } from '../utils/audio';
import { NAV_CATEGORIES, NavViewId } from './SidebarNav';
import {
  Castle,
  Map,
  Sword,
  User,
  Package,
  Sparkles,
  Grid,
  X,
  Compass,
  LayoutGrid,
  ChevronUp,
} from 'lucide-react';

interface BottomNavProps {
  character: Character | null;
  activeView: NavViewId | string;
  onNavigateView: (view: NavViewId) => void;
  onOpenRaidConfirm?: () => void;
  navMode: 'sidebar' | 'bottom' | 'both';
  onChangeNavMode: (mode: 'sidebar' | 'bottom' | 'both') => void;
  isCombatLocked?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  character,
  activeView,
  onNavigateView,
  onOpenRaidConfirm,
  navMode,
  onChangeNavMode,
  isCombatLocked = false,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  if (!character) return null;

  const invCount = character.inventory ? character.inventory.filter(Boolean).length : 0;

  const PRIMARY_DOCK_ITEMS: { id: NavViewId; label: string; icon: React.ElementType }[] = [
    { id: 'city', label: 'Sanctuary', icon: Castle },
    { id: 'map', label: 'World Map', icon: Map },
    { id: 'combat', label: 'Dungeon', icon: Sword },
    { id: 'skills', label: 'Skills', icon: Sparkles },
    { id: 'character', label: 'Hero', icon: User },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ];

  const handleSelectView = (id: NavViewId) => {
    audio.playClick();
    if (id === 'raid' && onOpenRaidConfirm) {
      onOpenRaidConfirm();
    } else {
      onNavigateView(id);
    }
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* Full "More..." Navigation Modal Drawer Sheet */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md transition-all animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-amber-500/40 bg-slate-950/95 p-4 text-slate-100 shadow-2xl space-y-4 border-x border-slate-800">
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
                <h3 className="font-serif font-bold text-sm text-amber-200 uppercase tracking-wider">
                  Full Realm Navigation
                </h3>
              </div>

              {/* Navigation Style Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => onChangeNavMode('sidebar')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    navMode === 'sidebar'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sidebar
                </button>
                <button
                  onClick={() => onChangeNavMode('bottom')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    navMode === 'bottom'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bottom Bar
                </button>
                <button
                  onClick={() => onChangeNavMode('both')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    navMode === 'both'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Both
                </button>
              </div>

              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Categorized Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {NAV_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="space-y-2 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 block border-b border-amber-500/10 pb-1">
                    {cat.title}
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectView(item.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-950/80 text-slate-200 hover:bg-slate-800 hover:text-amber-300 border border-slate-800/60'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                          <div className="flex-1 text-left min-w-0">
                            <div className="truncate text-xs font-extrabold">{item.name}</div>
                            <div className={`text-[9px] truncate font-normal ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                              {item.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Fancy Bottom Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-500/30 bg-slate-950/95 backdrop-blur-xl px-2 py-1.5 shadow-2xl">
        <div className="mx-auto flex max-w-lg items-center justify-around gap-1">
          {PRIMARY_DOCK_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectView(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-amber-300 font-extrabold'
                    : 'text-slate-400 hover:text-amber-200'
                }`}
              >
                {/* Highlight Glow pill under active icon */}
                {isActive && (
                  <div className="absolute inset-0 bg-amber-500/15 rounded-xl border border-amber-500/30 shadow-inner" />
                )}

                <div className="relative">
                  <Icon
                    className={`h-5 w-5 transition-transform ${
                      isActive ? 'scale-110 text-amber-400 drop-shadow' : 'text-slate-400'
                    }`}
                  />
                  {item.id === 'inventory' && !isCombatLocked && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 rounded-full text-[8px] font-mono font-black border bg-amber-500 text-slate-950 border-amber-400">
                      {invCount}
                    </span>
                  )}
                  {isCombatLocked && item.id !== 'combat' && item.id !== 'raid' && (
                    <span className="absolute -top-1.5 -right-2.5 px-0.5 rounded-full text-[9px] font-bold border bg-rose-950 text-rose-300 border-rose-500/50" title="Locked during active combat">
                      🔒
                    </span>
                  )}
                </div>

                <span className="text-[10px] leading-tight mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => {
              audio.playClick();
              setIsMoreMenuOpen((prev) => !prev);
            }}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
              isMoreMenuOpen
                ? 'text-amber-300 font-extrabold bg-amber-500/20 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-200'
            }`}
            title="Open Full Navigation Menu"
          >
            <Grid className="h-5 w-5 text-amber-400" />
            <span className="text-[10px] leading-tight mt-0.5 tracking-tight flex items-center gap-0.5">
              More <ChevronUp className="h-2.5 w-2.5" />
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
