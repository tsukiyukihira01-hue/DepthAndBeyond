import React, { useState } from 'react';
import { Item, SocketedGem } from '../../types/game';
import { POE_GEMS_DATABASE } from '../../data/poeItemsData';
import { Layers, X, Plus, Trash2, Zap, Sparkles, Check, ChevronRight } from 'lucide-react';
import { audio } from '../../utils/audio';

interface PoESocketModalProps {
  item: Item;
  onUpdateItemSockets: (updatedItem: Item) => void;
  onClose: () => void;
}

export const PoESocketModal: React.FC<PoESocketModalProps> = ({
  item,
  onUpdateItemSockets,
  onClose,
}) => {
  const [selectedSocketIndex, setSelectedSocketIndex] = useState<number>(0);
  const sockets = item.sockets || [];

  const handleSocketGem = (gem: SocketedGem) => {
    audio.playClick();
    if (!item.sockets || item.sockets.length <= selectedSocketIndex) return;

    const newSockets = [...item.sockets];
    newSockets[selectedSocketIndex] = {
      ...newSockets[selectedSocketIndex],
      socketedGem: {
        ...gem,
        id: `socketed_gem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      },
    };

    onUpdateItemSockets({
      ...item,
      sockets: newSockets,
    });
  };

  const handleRemoveGem = (socketIndex: number) => {
    audio.playClick();
    if (!item.sockets || item.sockets.length <= socketIndex) return;

    const newSockets = [...item.sockets];
    newSockets[socketIndex] = {
      ...newSockets[socketIndex],
      socketedGem: undefined,
    };

    onUpdateItemSockets({
      ...item,
      sockets: newSockets,
    });
  };

  const selectedSocket = sockets[selectedSocketIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/40 bg-slate-900/95 p-5 shadow-2xl space-y-4 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-serif text-base font-bold text-amber-200">
                Socket & Gem Chamber — {item.name}
              </h3>
              <p className="text-xs text-slate-400">
                Socket Skill & Support Gems into linked sockets to empower abilities!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Item Sockets Grid */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Item Sockets ({sockets.length})</span>
            <span className="text-[10px] font-mono text-amber-400/80">Select socket to insert Gem</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 py-2">
            {sockets.map((sock, idx) => {
              const isSelected = selectedSocketIndex === idx;
              const isLinkedToNext =
                idx < sockets.length - 1 && sockets[idx + 1].linkedGroupId === sock.linkedGroupId;

              return (
                <React.Fragment key={sock.id || idx}>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setSelectedSocketIndex(idx)}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border-2 text-sm shadow-xl cursor-pointer transition-all ${
                        isSelected ? 'ring-4 ring-amber-400 scale-110' : ''
                      } ${
                        sock.color === 'red'
                          ? 'bg-rose-950 border-rose-500 text-rose-200'
                          : sock.color === 'green'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                          : sock.color === 'blue'
                          ? 'bg-sky-950 border-sky-500 text-sky-200'
                          : 'bg-slate-200 border-white text-slate-900 font-bold'
                      }`}
                    >
                      {sock.socketedGem ? (
                        <span>{sock.socketedGem.icon}</span>
                      ) : (
                        <span className="font-mono text-xs font-bold uppercase">{sock.color[0]}</span>
                      )}
                    </button>

                    <span className="text-[9px] font-mono text-slate-400">Socket #{idx + 1}</span>

                    {sock.socketedGem && (
                      <button
                        onClick={() => handleRemoveGem(idx)}
                        className="text-[9px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 cursor-pointer font-bold"
                        title="Remove Gem"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        <span>Unsocket</span>
                      </button>
                    )}
                  </div>

                  {isLinkedToNext && (
                    <div className="h-1.5 w-4 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full animate-pulse shadow-md shadow-amber-400/50 my-auto" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Socket Details & Gem Selector */}
        {selectedSocket && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Available Gems for Socket #{selectedSocketIndex + 1} ({selectedSocket.color.toUpperCase()})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {POE_GEMS_DATABASE.map((gem) => (
                <div
                  key={gem.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 hover:border-amber-500/40 transition-all space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-amber-200">
                        <span>{gem.icon}</span>
                        <span>{gem.name}</span>
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${
                          gem.gemType === 'active'
                            ? 'bg-amber-950 border-amber-500/40 text-amber-300'
                            : 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                        }`}
                      >
                        {gem.gemType}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {gem.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSocketGem(gem)}
                    className="w-full flex items-center justify-center gap-1 py-1 rounded-lg border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Plus className="h-3 w-3 text-amber-400" />
                    <span>Insert into Socket #{selectedSocketIndex + 1}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
