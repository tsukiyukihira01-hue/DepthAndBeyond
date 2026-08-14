import React, { useState } from 'react';
import { ClassPreview, CLASS_PREVIEWS } from '../../data/landingData';
import { Sparkles, Wand2, Shield, Heart, Zap, Crosshair, Play } from 'lucide-react';
import { audio } from '../../utils/audio';

export const InteractiveClassShowcase: React.FC<{ onStartPlay: () => void }> = ({ onStartPlay }) => {
  const [selectedClass, setSelectedClass] = useState<ClassPreview>(CLASS_PREVIEWS[0]);
  const [castingSpell, setCastingSpell] = useState<string | null>(null);
  const [castMessage, setCastMessage] = useState<string | null>(null);

  const handleSelectClass = (cls: ClassPreview) => {
    audio.playClick();
    setSelectedClass(cls);
    setCastMessage(null);
  };

  const handleCastSpell = (spell: ClassPreview['spells'][0]) => {
    if (spell.type === 'magical') {
      audio.playSpell();
    } else if (spell.type === 'physical') {
      audio.playAttack();
    } else if (spell.type === 'heal') {
      audio.playHeal();
    } else {
      audio.playClick();
    }

    setCastingSpell(spell.name);
    setCastMessage(`✨ Executed spell: "${spell.name}"! (${spell.description})`);

    setTimeout(() => {
      setCastingSpell(null);
    }, 1200);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 md:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-serif text-lg font-bold text-amber-200">
              Interactive Class & Archetype Showcase
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Select an adventurer class below to test iconic spell channeling and inspect base matrix stats.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold">
            Live Spell Preview Engine
          </span>
        </div>
      </div>

      {/* Class Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {CLASS_PREVIEWS.map((cls) => {
          const isSelected = selectedClass.id === cls.id;
          return (
            <button
              key={cls.id}
              onClick={() => handleSelectClass(cls)}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-gradient-to-r from-amber-500/20 to-purple-500/10 text-amber-200 shadow-lg shadow-amber-500/10'
                  : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="text-2xl">{cls.icon}</span>
              <div className="min-w-0">
                <div className="font-bold text-xs truncate">{cls.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{cls.role.split('&')[0]}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Class Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
        {/* Left: Identity & Role */}
        <div className="space-y-3 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-3xl shadow-inner">
              {selectedClass.icon}
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-amber-200">{selectedClass.name}</h4>
              <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                Role: {selectedClass.role}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 italic font-serif leading-relaxed">
            {selectedClass.quote}
          </p>

          <p className="text-xs text-slate-400 leading-relaxed">
            {selectedClass.description}
          </p>

          <div className="pt-2">
            <button
              onClick={onStartPlay}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 text-xs cursor-pointer shadow transition-all"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Create {selectedClass.name}</span>
            </button>
          </div>
        </div>

        {/* Middle: Stats Distribution */}
        <div className="space-y-3 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
          <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-400" /> Matrix Base Attributes
          </h5>

          <div className="space-y-2 text-xs font-mono">
            {/* STR */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Strength (STR)</span>
                <span className="text-amber-300 font-bold">{selectedClass.stats.str}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${selectedClass.stats.str}%` }}
                />
              </div>
            </div>

            {/* INT */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Intelligence (INT)</span>
                <span className="text-purple-300 font-bold">{selectedClass.stats.int}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                  style={{ width: `${selectedClass.stats.int}%` }}
                />
              </div>
            </div>

            {/* DEX */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Dexterity (DEX)</span>
                <span className="text-emerald-300 font-bold">{selectedClass.stats.dex}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${selectedClass.stats.dex}%` }}
                />
              </div>
            </div>

            {/* VIT */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Vitality (VIT)</span>
                <span className="text-rose-300 font-bold">{selectedClass.stats.vit}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
                  style={{ width: `${selectedClass.stats.vit}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Iconic Spells & Interactive Casting Test */}
        <div className="space-y-3 md:col-span-1">
          <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Wand2 className="h-4 w-4 text-amber-400" /> Iconic Spells & Test Channeling
          </h5>

          <div className="space-y-2.5">
            {selectedClass.spells.map((spell) => {
              const isCasting = castingSpell === spell.name;
              return (
                <div
                  key={spell.name}
                  className={`rounded-xl border p-2.5 transition-all text-xs space-y-1.5 ${
                    isCasting
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 animate-pulse'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-amber-200 flex items-center gap-1.5">
                      <span className="text-base">{spell.icon}</span>
                      <span>{spell.name}</span>
                    </div>

                    <button
                      onClick={() => handleCastSpell(spell)}
                      className="rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 px-2 py-1 font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      {isCasting ? '✨ Casting...' : 'Cast Spell'}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">{spell.description}</p>
                </div>
              );
            })}
          </div>

          {castMessage && (
            <div className="rounded-lg bg-emerald-950/80 border border-emerald-500/40 p-2 text-[11px] text-emerald-200 animate-in fade-in">
              {castMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
