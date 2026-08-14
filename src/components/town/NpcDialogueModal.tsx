import React, { useState } from 'react';
import { NpcCharacter, NpcOption } from '../../types/town';
import { MessageSquare, ChevronRight, X, Sparkles, BookOpen } from 'lucide-react';

interface NpcDialogueModalProps {
  npc: NpcCharacter;
  onClose: () => void;
  onSelectOption: (option: NpcOption) => void;
}

export const NpcDialogueModal: React.FC<NpcDialogueModalProps> = ({ npc, onClose, onSelectOption }) => {
  const [activeTab, setActiveTab] = useState<'dialogue' | 'lore'>('dialogue');
  const [activeResponse, setActiveResponse] = useState<string | null>(null);

  const handleOptionClick = (option: NpcOption) => {
    if (option.actionType === 'talk_lore' && option.dialogueResponse) {
      setActiveResponse(option.dialogueResponse);
    } else {
      onSelectOption(option);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* NPC Header Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-4xl shadow-inner">
            {npc.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`font-serif text-xl font-bold ${npc.colorTheme.split(' ')[0]}`}>{npc.name}</h2>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                District NPC
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">{npc.title}</p>
          </div>
        </div>

        {/* Dialogue Body / Lore Box */}
        <div className="space-y-3">
          <div className="flex gap-2 text-xs font-bold border-b border-slate-800/80 pb-2">
            <button
              onClick={() => {
                setActiveTab('dialogue');
                setActiveResponse(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'dialogue'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Dialogue
            </button>
            <button
              onClick={() => setActiveTab('lore')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'lore'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> NPC History & Lore
            </button>
          </div>

          {activeTab === 'dialogue' ? (
            <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs italic text-slate-200 leading-relaxed shadow-inner">
              <span className="absolute -top-2 left-4 bg-slate-900 px-2 text-[10px] not-italic font-bold text-amber-400">
                {npc.name} says
              </span>
              {activeResponse || npc.quote}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs text-slate-300 leading-relaxed">
              <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Background & District Lore
              </h4>
              <p>{npc.loreText}</p>
            </div>
          )}
        </div>

        {/* Action Options Grid */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Action or Topic:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {npc.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleOptionClick(opt)}
                className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-left transition-all hover:border-amber-500/50 hover:bg-slate-800/90 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-amber-200 group-hover:text-amber-300 transition-colors">
                      {opt.label}
                    </div>
                    {opt.badge && (
                      <span className="text-[9px] font-semibold text-emerald-400">{opt.badge}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
