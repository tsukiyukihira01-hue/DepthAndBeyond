import React, { useState, useEffect } from 'react';
import { Character, UserAccount, PlayerSearchResult } from '../types/game';
import { audio } from '../utils/audio';
import { NavBrand } from './navbar/NavBrand';
import { NavSearch } from './navbar/NavSearch';
import { NavPlayerCard } from './navbar/NavPlayerCard';
import { NavActions } from './navbar/NavActions';

interface NavbarProps {
  character: Character | null;
  user: UserAccount | null;
  activeUsersCount: number;
  uiMode: 'auto' | 'mobile' | 'desktop';
  onUiModeChange: (mode: 'auto' | 'mobile' | 'desktop') => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenMod: () => void;
  onOpenPlayerProfile: (identifier: string) => void;
  onOpenOnlinePlayers: () => void;
  onOpenDailyReward?: () => void;
  onOpenEula?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  navMode?: 'sidebar' | 'bottom' | 'both';
  onChangeNavMode?: (mode: 'sidebar' | 'bottom' | 'both') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  character,
  user,
  activeUsersCount,
  onOpenAuth,
  onOpenAdmin,
  onOpenPlayerProfile,
  onOpenOnlinePlayers,
  onOpenDailyReward,
  onOpenEula,
  onToggleSidebar,
  isSidebarOpen = true,
  navMode = 'sidebar',
  onChangeNavMode,
}) => {
  const [serverTime, setServerTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setServerTime(now.toUTCString().replace('GMT', 'UTC'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live player search trigger
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const isNumeric = /^\d+$/.test(trimmed);
    if (trimmed.length < 3 && !isNumeric) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      fetch(`/api/players/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data.results || []);
          setShowDropdown(true);
          setIsSearching(false);
        })
        .catch(() => {
          setIsSearching(false);
        });
    }, 200);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleAudioToggle = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectPlayer = (target: string) => {
    audio.playClick();
    onOpenPlayerProfile(target);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-amber-500/20 bg-slate-950/95 backdrop-blur-xl px-3 sm:px-4 py-2 text-slate-100 shadow-2xl transition-all">
      <div className="mx-auto flex max-w-full items-center justify-between gap-3">
        {/* Left Section: Menu Toggle, Brand Logo & Server Status */}
        <NavBrand
          hasCharacter={Boolean(character)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={onToggleSidebar}
          activeUsersCount={activeUsersCount}
          serverTime={serverTime}
          onOpenOnlinePlayers={onOpenOnlinePlayers}
        />

        {/* Center: Live Player Search */}
        <NavSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          suggestions={suggestions}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onSelectPlayer={handleSelectPlayer}
        />

        {/* Character Status Card (when loaded) */}
        {character && (
          <NavPlayerCard
            character={character}
            user={user}
            onOpenPlayerProfile={onOpenPlayerProfile}
          />
        )}

        {/* Right Section: Actions & Utilities */}
        <NavActions
          character={character}
          user={user}
          isMuted={isMuted}
          onToggleAudio={handleAudioToggle}
          onOpenDailyReward={onOpenDailyReward}
          onOpenEula={onOpenEula}
          navMode={navMode}
          onChangeNavMode={onChangeNavMode}
          onOpenAdmin={onOpenAdmin}
          onOpenAuth={onOpenAuth}
          onOpenPlayerProfile={onOpenPlayerProfile}
        />
      </div>
    </header>
  );
};

