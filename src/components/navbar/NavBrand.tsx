import React from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { audio } from '../../utils/audio';

interface NavBrandProps {
  hasCharacter: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar?: () => void;
  activeUsersCount: number;
  serverTime: string;
  onOpenOnlinePlayers: () => void;
}

export const NavBrand: React.FC<NavBrandProps> = ({
  hasCharacter,
  isSidebarOpen,
  onToggleSidebar,
  activeUsersCount,
  serverTime,
  onOpenOnlinePlayers,
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      {hasCharacter && onToggleSidebar && (
        <button
          onClick={() => {
            audio.playClick();
            onToggleSidebar();
          }}
          className={`relative group flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200 cursor-pointer ${
            isSidebarOpen
              ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/20 to-amber-950/40 text-amber-200 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
              : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:text-amber-200 hover:border-amber-500/40 hover:bg-slate-800/90'
          }`}
          title="Toggle Navigation Menu"
        >
          <Menu className="h-4 w-4 transition-transform group-hover:scale-110" />
        </button>
      )}

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse hidden sm:inline-block" />
            <span className="font-serif text-sm sm:text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 drop-shadow-sm">
              DEPTH AND BEYOND
            </span>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            v0.2.5
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
          <span className="hidden md:inline font-mono text-slate-400/90">
            {serverTime || '00:00:00 UTC'}
          </span>
          <span className="hidden md:inline text-slate-700">•</span>
          <button
            onClick={onOpenOnlinePlayers}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold transition-colors group"
            title="Click to view Active Players"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="group-hover:underline">{activeUsersCount || 1} Online</span>
          </button>
        </div>
      </div>
    </div>
  );
};
