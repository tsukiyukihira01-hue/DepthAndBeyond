import React from 'react';
import { Sparkles, Play, ChevronRight, Scroll, Flame, Shield, ShoppingBag, Zap, Users } from 'lucide-react';
import { LANDING_HERO_DATA } from '../../data/landingData';
import { audio } from '../../utils/audio';

interface HeroSectionProps {
  onStartPlay: () => void;
  openEulaModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartPlay, openEulaModal }) => {
  const handleStartPlay = () => {
    audio.playVictory();
    onStartPlay();
  };

  const handleOpenEula = () => {
    audio.playClick();
    openEulaModal();
  };

  return (
    <div className="text-center space-y-6 pt-4 relative z-20">
      {/* Version & Realm Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-amber-950/70 px-4 py-1.5 text-xs text-amber-300 font-semibold tracking-wide shadow-xl shadow-amber-950/60 animate-in fade-in">
        <Sparkles className="h-4 w-4 text-amber-400 animate-spin-slow" />
        <span>{LANDING_HERO_DATA.realmSubtitle} • {LANDING_HERO_DATA.versionTag}</span>
      </div>

      {/* Main Title */}
      <h1 className="font-serif text-4xl sm:text-7xl font-extrabold tracking-widest bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_8px_20px_rgba(245,158,11,0.35)]">
        {LANDING_HERO_DATA.realmTitle}
      </h1>

      {/* Tagline */}
      <p className="mx-auto max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed font-serif italic px-2">
        "{LANDING_HERO_DATA.heroTagline}"
      </p>

      {/* Main Action CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          onClick={handleStartPlay}
          className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-9 py-4 text-base font-extrabold text-slate-950 shadow-2xl shadow-amber-500/30 hover:brightness-110 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/60 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Play className="h-5 w-5 fill-slate-950" />
          <span>ENTER THE REALM NOW</span>
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          onClick={handleOpenEula}
          className="flex items-center gap-2.5 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-6 py-4 text-sm font-bold text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition-all cursor-pointer shadow-lg hover:bg-slate-800/80"
        >
          <Scroll className="h-4 w-4 text-amber-400" />
          <span>Realm Laws & Terms</span>
        </button>
      </div>

      {/* Hero Quick Stat Highlight Bar */}
      <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-xs">
        {LANDING_HERO_DATA.statsBanner.map((stat, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 text-center backdrop-blur-sm hover:border-amber-500/30 transition-colors"
          >
            <span className="font-mono text-base font-bold text-amber-300">{stat.value}</span>
            <span className="text-[11px] text-slate-400 font-medium">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
