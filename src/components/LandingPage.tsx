import React, { useState, useEffect } from 'react';
import bgImage from '../assets/images/depth_beyond_bg_1785266771550.jpg';

// Modular Landing Components
import { LandingCanvasBg } from './landing/LandingCanvasBg';
import { LandingHeaderTicker } from './landing/LandingHeaderTicker';
import { HeroSection } from './landing/HeroSection';
import { InteractiveClassShowcase } from './landing/InteractiveClassShowcase';
import { InteractiveMiniCombat } from './landing/InteractiveMiniCombat';
import { InteractiveWorldZones } from './landing/InteractiveWorldZones';
import { FeatureGrid } from './landing/FeatureGrid';
import { GuildRankingsSection } from './landing/GuildRankingsSection';
import { LoreBookSection } from './landing/LoreBookSection';
import { PatchNotesTimeline } from './landing/PatchNotesTimeline';
import { LandingFooter } from './landing/LandingFooter';

import { Sparkles, Sword, Compass, Crown, BookOpen, Scroll, Flame, Zap } from 'lucide-react';
import { audio } from '../utils/audio';

interface LandingPageProps {
  onStartPlay: () => void;
  openEulaModal: () => void;
  activeUsersCount: number;
}

interface LandingStats {
  totalUsers: number;
  totalCharacters: number;
  totalGuilds: number;
  activeMarketListings: number;
  activeRaids: Array<{
    id: string;
    name: string;
    currentHp: number;
    maxHp: number;
    turnEndsAt: number;
  }>;
  topGuilds: Array<{
    id: string;
    name: string;
    tag: string;
    symbol: string;
    reputation: number;
    memberCount: number;
    leaderName: string;
  }>;
  recentEvents: Array<{
    id: string;
    action: string;
    details: string;
    timestamp: string;
  }>;
  serverTime: string;
  maintenance: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartPlay, openEulaModal, activeUsersCount }) => {
  const [activeTab, setActiveTab] = useState<
    'classes' | 'combat' | 'world' | 'features' | 'leaderboards' | 'lore' | 'patchnotes'
  >('classes');

  const [stats, setStats] = useState<LandingStats | null>(null);

  // Fetch Live Public Landing Stats from API
  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        const res = await fetch('/api/public/landing-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to fetch landing stats:', e);
      }
    };

    fetchLandingStats();
    const interval = setInterval(fetchLandingStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (
    tab: 'classes' | 'combat' | 'world' | 'features' | 'leaderboards' | 'lore' | 'patchnotes'
  ) => {
    audio.playClick();
    setActiveTab(tab);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* BACKGROUND FANTASY IMAGE LAYER */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-20 scale-105 transform filter blur-[1px] pointer-events-none transition-all duration-1000"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* GRADIENT VIGNETTE OVERLAYS */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950/85 to-slate-950 pointer-events-none" />

      {/* ANIMATED CANVAS PARTICLE OVERLAY */}
      <LandingCanvasBg />

      {/* AMBIENT GLOW ORBS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[950px] h-[450px] bg-gradient-to-b from-amber-500/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none animate-pulse" />

      {/* TOP REALM TELEMETRY TICKER */}
      <LandingHeaderTicker stats={stats} activeUsersCount={activeUsersCount} />

      {/* MAIN CONTAINER */}
      <div className="relative z-20 mx-auto max-w-6xl px-4 py-8 space-y-10">
        {/* HERO SECTION */}
        <HeroSection onStartPlay={onStartPlay} openEulaModal={openEulaModal} />

        {/* NAVIGATION TABS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl text-xs max-w-full">
              <button
                onClick={() => handleTabChange('classes')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'classes'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Class Showcase</span>
              </button>

              <button
                onClick={() => handleTabChange('combat')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'combat'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sword className="h-4 w-4" />
                <span>Mini Combat Sandbox</span>
              </button>

              <button
                onClick={() => handleTabChange('world')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'world'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Compass className="h-4 w-4" />
                <span>World Zones</span>
              </button>

              <button
                onClick={() => handleTabChange('features')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'features'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Systems & Mechanics</span>
              </button>

              <button
                onClick={() => handleTabChange('leaderboards')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'leaderboards'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Crown className="h-4 w-4" />
                <span>Guild Standings</span>
              </button>

              <button
                onClick={() => handleTabChange('lore')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'lore'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>World Lore</span>
              </button>

              <button
                onClick={() => handleTabChange('patchnotes')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'patchnotes'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Scroll className="h-4 w-4" />
                <span>Patch Notes</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC TAB CONTENT SHOWCASE */}
          <div className="transition-all duration-300">
            {activeTab === 'classes' && <InteractiveClassShowcase onStartPlay={onStartPlay} />}
            {activeTab === 'combat' && <InteractiveMiniCombat onStartPlay={onStartPlay} />}
            {activeTab === 'world' && <InteractiveWorldZones onStartPlay={onStartPlay} />}
            {activeTab === 'features' && <FeatureGrid onStartPlay={onStartPlay} />}
            {activeTab === 'leaderboards' && <GuildRankingsSection topGuilds={stats?.topGuilds} />}
            {activeTab === 'lore' && <LoreBookSection />}
            {activeTab === 'patchnotes' && <PatchNotesTimeline />}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <LandingFooter openEulaModal={openEulaModal} onStartPlay={onStartPlay} />
    </div>
  );
};
