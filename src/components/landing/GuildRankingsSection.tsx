import React, { useState } from 'react';
import { Crown, Search, Shield, Users, Award } from 'lucide-react';

interface GuildRankingsProps {
  topGuilds?: Array<{
    id: string;
    name: string;
    tag: string;
    symbol: string;
    reputation: number;
    memberCount: number;
    leaderName: string;
  }>;
}

export const GuildRankingsSection: React.FC<GuildRankingsProps> = ({ topGuilds = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuilds = topGuilds.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.tag.toLowerCase().includes(q) || g.leaderName.toLowerCase().includes(q);
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 font-serif text-base font-bold text-amber-200">
          <Crown className="h-5 w-5 text-amber-400" />
          <span>Dynamic Realm Guild Rankings</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter guilds or leaders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-36 sm:w-48"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Rank</th>
              <th className="py-2.5 px-3">Guild Name</th>
              <th className="py-2.5 px-3">Guild Master</th>
              <th className="py-2.5 px-3">Members</th>
              <th className="py-2.5 px-3 text-right">Reputation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredGuilds.length > 0 ? (
              filteredGuilds.map((g, idx) => (
                <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-amber-400">
                    {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-100 flex items-center gap-2">
                    <span className="text-base">{g.symbol}</span>
                    <span>{g.name}</span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                      [{g.tag}]
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{g.leaderName}</td>
                  <td className="py-3 px-3 text-slate-400">{g.memberCount} / 50 Heroes</td>
                  <td className="py-3 px-3 text-right font-bold text-amber-300">
                    {g.reputation.toLocaleString()} Rep
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  {topGuilds.length === 0
                    ? 'Fetching live guild standings from realm backend...'
                    : 'No guilds match your search query.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
