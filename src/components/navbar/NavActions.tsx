import React from 'react';
import {
  Gift,
  PanelLeft,
  PanelBottom,
  Layout,
  Volume2,
  VolumeX,
  Shield,
  User,
  Scroll,
} from 'lucide-react';
import { Character, UserAccount } from '../../types/game';
import { audio } from '../../utils/audio';

interface NavActionsProps {
  character: Character | null;
  user: UserAccount | null;
  isMuted: boolean;
  onToggleAudio: () => void;
  onOpenDailyReward?: () => void;
  onOpenEula?: () => void;
  navMode?: 'sidebar' | 'bottom' | 'both';
  onChangeNavMode?: (mode: 'sidebar' | 'bottom' | 'both') => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenPlayerProfile: (identifier: string) => void;
}

export const NavActions: React.FC<NavActionsProps> = ({
  character,
  user,
  isMuted,
  onToggleAudio,
  onOpenDailyReward,
  onOpenEula,
  navMode = 'sidebar',
  onChangeNavMode,
  onOpenAdmin,
  onOpenAuth,
  onOpenPlayerProfile,
}) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* Realm Rules & ToS Shortcut */}
      {onOpenEula && (
        <button
          onClick={() => {
            audio.playClick();
            onOpenEula();
          }}
          className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:text-amber-300 hover:border-amber-500/30 cursor-pointer transition-colors"
          title="Realm Laws, Rules & Terms of Service"
        >
          <Scroll className="h-4 w-4 text-amber-400" />
        </button>
      )}

      {/* Daily Reward Shortcut */}
      {character && onOpenDailyReward && (
        <button
          onClick={() => {
            audio.playClick();
            onOpenDailyReward();
          }}
          className="relative flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 to-amber-900/40 px-2.5 py-1.5 text-xs font-bold text-amber-200 hover:border-amber-400 hover:brightness-110 cursor-pointer shadow-md transition-all group"
          title="Daily Login Rewards & Streaks"
        >
          <Gift className="h-3.5 w-3.5 text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
          <span className="hidden xl:inline">Daily Gift</span>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        </button>
      )}

      {/* Navigation Layout Mode Toggle */}
      {character && onChangeNavMode && (
        <button
          onClick={() => {
            audio.playClick();
            const nextMode =
              navMode === 'sidebar' ? 'bottom' : navMode === 'bottom' ? 'both' : 'sidebar';
            onChangeNavMode(nextMode);
          }}
          className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 px-2 py-2 text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/30 cursor-pointer transition-colors"
          title={`Nav Mode: ${navMode.toUpperCase()} (Click to change)`}
        >
          {navMode === 'sidebar' && <PanelLeft className="h-4 w-4 text-amber-400" />}
          {navMode === 'bottom' && <PanelBottom className="h-4 w-4 text-amber-400" />}
          {navMode === 'both' && <Layout className="h-4 w-4 text-amber-400" />}
        </button>
      )}

      {/* Sound Mute Toggle */}
      <button
        onClick={onToggleAudio}
        className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:text-amber-300 hover:border-amber-500/30 cursor-pointer transition-colors"
        title="Toggle Sound FX"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-rose-400" />
        ) : (
          <Volume2 className="h-4 w-4 text-emerald-400" />
        )}
      </button>

      {/* GM Admin Badge */}
      {(user?.role === 'ADMIN' || user?.userId === '1') && (
        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-1 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-950/80 to-amber-900/60 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:border-amber-400 cursor-pointer shadow-md"
          title="Open Game Master Admin Dashboard"
        >
          <Shield className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">[GM]</span>
        </button>
      )}

      {/* Account Profile Launcher */}
      <button
        onClick={() => {
          if (character) {
            onOpenPlayerProfile('self');
          } else {
            onOpenAuth();
          }
        }}
        className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-amber-200 hover:border-amber-400 cursor-pointer transition-all hover:bg-slate-800"
      >
        <User className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">
          {character ? character.name : user ? user.email.split('@')[0] : 'Sign In'}
        </span>
      </button>
    </div>
  );
};
