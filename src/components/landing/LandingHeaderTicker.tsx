import React, { useState, useEffect } from 'react';
import { Clock, Users, Shield, ShoppingBag, Flame, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { audio } from '../../utils/audio';

interface LandingHeaderTickerProps {
  stats: {
    totalUsers?: number;
    totalGuilds?: number;
    activeMarketListings?: number;
    activeRaids?: Array<{ name: string }>;
  } | null;
  activeUsersCount: number;
}

export const LandingHeaderTicker: React.FC<LandingHeaderTickerProps> = ({ stats, activeUsersCount }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(audio.getMuted());

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsAudioMuted(muted);
    if (!muted) {
      audio.playClick();
      audio.startAmbientBGM();
    }
  };

  return (
    <div className="relative z-20 border-b border-amber-500/20 bg-slate-950/95 backdrop-blur-md px-4 py-2 text-xs">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-amber-300 font-bold bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-500/30">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{currentTime || '00:00:00 UTC'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>REALM ONLINE • 100% UP</span>
          </div>
        </div>

        {/* Dynamic Telemetry Stats */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <strong className="text-slate-200">{stats?.totalUsers || activeUsersCount || 1}</strong> Adventurers
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden md:inline-flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-sky-400" />
            <strong className="text-slate-200">{stats?.totalGuilds || 2}</strong> Guilds
          </span>
          <span className="hidden md:inline">|</span>
          <span className="flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
            <strong className="text-slate-200">{stats?.activeMarketListings || 3}</strong> GE Listings
          </span>
          <span>|</span>
          <span className="flex items-center gap-1 text-rose-300 font-bold">
            <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            RAID: <strong className="text-rose-200">{stats?.activeRaids?.[0]?.name || 'Primordial Dragon'}</strong>
          </span>

          {/* Sound / Music Audio Toggle Button */}
          <button
            onClick={handleToggleMute}
            className={`ml-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer ${
              isAudioMuted
                ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow'
            }`}
            title={isAudioMuted ? 'Unmute Ambient Sound Synth' : 'Mute Sound Synth'}
          >
            {isAudioMuted ? <VolumeX className="h-3 w-3 text-slate-400" /> : <Volume2 className="h-3 w-3 text-amber-400 animate-pulse" />}
            <span>{isAudioMuted ? 'Audio Off' : 'Audio On'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
