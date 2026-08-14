import React, { useRef, useEffect } from 'react';
import { Search, ChevronRight, X, User } from 'lucide-react';
import { PlayerSearchResult } from '../../types/game';

interface NavSearchProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearching: boolean;
  suggestions: PlayerSearchResult[];
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  onSelectPlayer: (identifier: string) => void;
}

export const NavSearch: React.FC<NavSearchProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  suggestions,
  showDropdown,
  setShowDropdown,
  onSelectPlayer,
}) => {
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSelectPlayer(searchQuery.trim());
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xs hidden md:block">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder="Search adventurer name or ID..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-1.5 pl-8 pr-7 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
        />
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setShowDropdown(false);
            }}
            className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {isSearching && (
          <span className="absolute right-2.5 top-2 h-3.5 w-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        )}
      </form>

      {/* Dropdown Suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-amber-500/30 bg-slate-950/95 p-1.5 shadow-2xl z-50 text-xs space-y-1 max-h-60 overflow-y-auto backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400/80 border-b border-slate-800/80 flex items-center justify-between">
            <span>Matching Adventurers</span>
            <span className="text-[9px] font-normal text-slate-500">{suggestions.length} found</span>
          </div>

          {suggestions.map((p) => (
            <button
              key={p.characterId || p.userId}
              onClick={() => {
                onSelectPlayer(p.userId || p.characterName);
                setSearchQuery('');
                setShowDropdown(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/90 transition-colors text-left cursor-pointer group border border-transparent hover:border-amber-500/30"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-amber-300 border border-slate-800 text-xs font-bold">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-amber-200 group-hover:text-amber-300 truncate">
                    {p.characterName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    ID: #{p.userId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0 ml-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                  Lv {p.level}
                </span>
                <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-amber-300 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
