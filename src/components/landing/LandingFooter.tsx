import React from 'react';
import { Scroll, ShieldCheck, Heart, Sparkles, Terminal } from 'lucide-react';
import { audio } from '../../utils/audio';

interface LandingFooterProps {
  openEulaModal: () => void;
  onStartPlay: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ openEulaModal, onStartPlay }) => {
  return (
    <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 text-xs text-slate-400">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-serif text-base font-extrabold text-amber-200 tracking-wider">
              DEPTH AND BEYOND
            </h3>
            <p className="text-[11px] text-slate-400">
              Persistent Dark Fantasy Web MMORPG • Player-Governed Atomic Economy & 5x2 Matrix Squad Tactics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => {
                audio.playVictory();
                onStartPlay();
              }}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 px-4 py-2 cursor-pointer transition-all shadow"
            >
              Play Game Now
            </button>

            <button
              onClick={() => {
                audio.playClick();
                openEulaModal();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-amber-500/40 hover:text-amber-300 px-4 py-2 text-slate-300 font-semibold cursor-pointer transition-all"
            >
              <Scroll className="h-3.5 w-3.5 text-amber-400" />
              <span>Realm EULA & Terms</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Official Realm Server • Cloud Run Container Sandbox Active</span>
          </div>

          <div>
            © {new Date().getFullYear()} Depth and Beyond. All rights reserved. Built for players.
          </div>
        </div>
      </div>
    </footer>
  );
};
