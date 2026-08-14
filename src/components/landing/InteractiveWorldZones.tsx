import React, { useState } from 'react';
import { WORLD_ZONES, WorldZonePreview } from '../../data/landingData';
import { Compass, MapPin, Pickaxe, ShieldAlert, ChevronRight } from 'lucide-react';
import { audio } from '../../utils/audio';

export const InteractiveWorldZones: React.FC<{ onStartPlay: () => void }> = ({ onStartPlay }) => {
  const [selectedZone, setSelectedZone] = useState<WorldZonePreview>(WORLD_ZONES[0]);

  const handleSelectZone = (zone: WorldZonePreview) => {
    audio.playClick();
    setSelectedZone(zone);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-amber-400" />
            <h3 className="font-serif text-lg font-bold text-amber-200">
              Interactive Realm World Map & Gathering Zones
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Explore zones across Aethelgard to preview node gathering resources and monster boss threats.
          </p>
        </div>

        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold">
          Dynamic Zone Scanner
        </span>
      </div>

      {/* Zone Tabs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {WORLD_ZONES.map((zone) => {
          const isSelected = selectedZone.id === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => handleSelectZone(zone)}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/15 text-amber-200 shadow-lg shadow-amber-500/10'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="text-2xl">{zone.icon}</span>
              <div className="min-w-0">
                <div className="font-bold text-xs truncate">{zone.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{zone.levelRange}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Zone Detail Showcase */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{selectedZone.icon}</span>
            <div>
              <h4 className="font-serif text-lg font-bold text-amber-200">{selectedZone.name}</h4>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>{selectedZone.environment} • {selectedZone.levelRange}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onStartPlay}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs cursor-pointer shadow transition-all"
          >
            <span>Travel to {selectedZone.name.split(' ')[0]}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-serif italic">
          "{selectedZone.description}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          {/* Node Gathering Resources */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
            <h5 className="font-bold text-amber-300 font-mono text-[11px] flex items-center gap-1.5">
              <Pickaxe className="h-4 w-4 text-amber-400" /> Gathering Node Harvest Drops:
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {selectedZone.resources.map((res, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 font-semibold text-amber-200 text-[11px]"
                >
                  ✨ {res}
                </span>
              ))}
            </div>
          </div>

          {/* Boss Threat */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
            <h5 className="font-bold text-rose-300 font-mono text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-400" /> Primordial Threat & Boss Encounter:
            </h5>
            <div className="rounded-lg bg-rose-950/60 border border-rose-500/30 px-2.5 py-1 font-bold text-rose-200 text-[11px]">
              🐉 {selectedZone.bossThreat}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
