import React from 'react';
import { PATCH_NOTES } from '../../data/landingData';
import { Sparkles, CheckCircle2, Scroll, Tag } from 'lucide-react';

export const PatchNotesTimeline: React.FC = () => {
  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-serif text-base font-bold text-amber-200">
        <Scroll className="h-5 w-5 text-amber-400" />
        <span>Realm Update Logs & Patch Notes</span>
      </div>

      <div className="space-y-4">
        {PATCH_NOTES.map((patch, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2 hover:border-amber-500/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-amber-200">{patch.version}</span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                  {patch.type}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{patch.date}</span>
            </div>

            <h4 className="font-bold text-slate-200 text-xs">{patch.title}</h4>

            <ul className="space-y-1.5 pt-1 text-slate-300">
              {patch.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
