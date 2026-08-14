import React from 'react';
import { PlayerSearchResult } from '../types/game';
import { X, Users, Shield, Award, Sparkles, ExternalLink } from 'lucide-react';

interface OnlinePlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlinePlayers: PlayerSearchResult[];
  onSelectPlayer: (userIdOrName: string) => void;
}

export const OnlinePlayersModal: React.FC<OnlinePlayersModalProps> = ({
  isOpen,
  onClose,
  onlinePlayers,
  onSelectPlayer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-slate-950/95 p-6 text-slate-100 shadow-2xl max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 cursor-pointer p-1 rounded-lg hover:bg-slate-900"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              Active Realm Adventurers
              <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                {onlinePlayers.length} Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">Current online champions exploring the depths in real-time</p>
          </div>
        </div>

        {/* Players Roster */}
        <div className="flex-1 overflow-y-auto my-4 space-y-2 pr-1">
          {onlinePlayers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm italic">No active adventurers detected in this realm instance.</div>
          ) : (
            onlinePlayers.map((player) => (
              <div
                key={player.characterId || player.userId}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-center font-serif text-amber-300 font-bold">
                    {player.faction === 'HEAVENLY' ? '⚔️' : '🔥'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{player.characterName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-semibold">
                        ID: #{player.userId}
                      </span>
                      {player.guildTag && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40">
                          [{player.guildTag}]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>Level {player.level}</span>
                      <span>•</span>
                      <span className="text-amber-300 font-medium">{(player as any).characterClass || 'Sentinel'}</span>
                      <span>•</span>
                      <span className={player.faction === 'HEAVENLY' ? 'text-amber-400/80' : 'text-purple-400/80'}>
                        {player.faction}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectPlayer(player.userId);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-900/60 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View Profile
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
