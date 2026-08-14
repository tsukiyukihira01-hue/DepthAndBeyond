import React, { useState } from 'react';
import { FEATURE_CARDS, FeatureCardData } from '../../data/landingData';
import { Sparkles, Sword, Flame, ShoppingBag, Zap, Shield, Users, ChevronRight, CheckCircle2, X, Play } from 'lucide-react';
import { audio } from '../../utils/audio';

interface FeatureGridProps {
  onStartPlay: () => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ onStartPlay }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectedFeature, setInspectedFeature] = useState<FeatureCardData | null>(null);

  const handleInspect = (feature: FeatureCardData) => {
    audio.playClick();
    setInspectedFeature(feature);
  };

  const filteredFeatures = FEATURE_CARDS.filter((f) => {
    if (selectedCategory === 'all') return true;
    return f.category === selectedCategory;
  });

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Sword':
        return Sword;
      case 'Flame':
        return Flame;
      case 'ShoppingBag':
        return ShoppingBag;
      case 'Zap':
        return Zap;
      case 'Shield':
        return Shield;
      case 'Users':
        return Users;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Pills & Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 font-serif text-lg font-bold text-amber-200">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <span>Realm Systems & Mechanics</span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'All Systems' },
            { id: 'combat', label: 'Combat & Raids' },
            { id: 'economy', label: 'Trade & GE' },
            { id: 'crafting', label: 'Blacksmithing' },
            { id: 'social', label: 'Guilds & Heroes' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                audio.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFeatures.map((feature) => {
          const IconComp = getIconComponent(feature.iconName);

          return (
            <div
              key={feature.id}
              onClick={() => handleInspect(feature)}
              className="group relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-slate-900/90 p-5 space-y-3 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/10 transition-all cursor-pointer overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <IconComp className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400/80 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/20">
                  {feature.badge}
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-amber-200 group-hover:text-amber-100 transition-colors">
                {feature.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {feature.description}
              </p>

              <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-amber-400/80 group-hover:text-amber-300">
                <span>Inspect System Breakdown</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* INSPECTION MODAL */}
      {inspectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-100">
            <button
              onClick={() => setInspectedFeature(null)}
              className="absolute top-4 right-4 rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                {React.createElement(getIconComponent(inspectedFeature.iconName), { className: 'h-6 w-6' })}
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-amber-200">{inspectedFeature.title}</h3>
                <p className="text-xs text-slate-400">{inspectedFeature.subtitle}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{inspectedFeature.description}</p>

            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Key System Mechanics & Highlights:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {inspectedFeature.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setInspectedFeature(null);
                  onStartPlay();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 text-xs cursor-pointer shadow transition-all"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Experience In-Game Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
