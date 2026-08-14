import React from 'react';

export interface CombatLogEntry {
  id: string;
  turn: number;
  text: string;
  type: 'friendly' | 'hostile' | 'pet' | 'heal' | 'crit' | 'system' | 'evasion' | 'boss_strike';
  timestamp: string;
}

interface CombatConsoleLogProps {
  logs: CombatLogEntry[];
  filter: 'all' | 'friendly' | 'hostile' | 'pet' | 'system';
  onFilterChange: (filter: 'all' | 'friendly' | 'hostile' | 'pet' | 'system') => void;
}

export const CombatConsoleLog: React.FC<CombatConsoleLogProps> = ({
  logs,
  filter,
  onFilterChange,
}) => {
  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'friendly') return log.type === 'friendly' || log.type === 'heal';
    if (filter === 'hostile') return log.type === 'hostile' || log.type === 'boss_strike';
    if (filter === 'pet') return log.type === 'pet';
    if (filter === 'system') return log.type === 'system';
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-4 space-y-2.5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
          📜 Live Battle Combat Console Log
        </span>

        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 text-[10px] font-bold">
          {[
            { id: 'all', label: 'All' },
            { id: 'friendly', label: 'Player' },
            { id: 'hostile', label: 'Enemy' },
            { id: 'pet', label: 'Pet' },
            { id: 'system', label: 'System' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onFilterChange(id as any)}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-36 sm:h-40 overflow-y-auto space-y-1 font-mono text-[11px] p-1 no-scrollbar">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className={`p-1.5 rounded-lg border leading-relaxed ${
              log.type === 'friendly'
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                : log.type === 'hostile'
                ? 'border-rose-500/30 bg-rose-950/20 text-rose-200'
                : log.type === 'pet'
                ? 'border-purple-500/30 bg-purple-950/20 text-purple-200'
                : log.type === 'heal'
                ? 'border-sky-500/30 bg-sky-950/20 text-sky-200'
                : 'border-slate-800 bg-slate-900/60 text-slate-400'
            }`}
          >
            <span className="text-slate-500 text-[10px] mr-1.5 font-bold">[{log.timestamp}]</span>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
};
