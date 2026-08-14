import React, { useState, useEffect } from 'react';
import { Character, Guild } from '../types/game';
import {
  Shield,
  Users,
  Castle,
  Store,
  Sparkles,
  PlusCircle,
  Search,
  Building,
  Crown,
  Check,
  AlertCircle,
  Edit3,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { ErrorNoticeModal } from './ErrorNoticeModal';

interface GuildViewProps {
  character: Character;
  onUpdateCharacter?: (updatedChar: Character) => void;
  initialGuildId?: string | null;
  onNavigateToDungeon?: () => void;
}

export const GuildView: React.FC<GuildViewProps> = ({
  character,
  onUpdateCharacter,
  initialGuildId,
  onNavigateToDungeon,
}) => {
  const [activeTab, setActiveTab] = useState<'my_guild' | 'directory' | 'create'>(
    character.guildId ? 'my_guild' : 'directory'
  );

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    requiredGold?: number;
    currentGold?: number;
  }>({
    isOpen: false,
    message: '',
  });

  // My Guild state
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [isLoadingMyGuild, setIsLoadingMyGuild] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);

  // Guild Directory & Public View state
  const [guildsList, setGuildsList] = useState<Guild[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPublicGuild, setSelectedPublicGuild] = useState<Guild | null>(null);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);

  // Create Guild form state
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTag, setNewGuildTag] = useState('');
  const [newGuildSymbol, setNewGuildSymbol] = useState('🌸');
  const [newGuildColor, setNewGuildColor] = useState('#38bdf8');
  const [isCreating, setIsCreating] = useState(false);

  // Notifications
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Fetch My Guild
  const fetchMyGuild = async () => {
    if (!character.guildId) return;
    setIsLoadingMyGuild(true);
    try {
      const res = await fetch(`/api/guild/${character.guildId}`);
      const data = await res.json();
      if (res.ok && data.guild) {
        setMyGuild(data.guild);
        setAnnouncementInput(data.guild.announcement || '');
      }
    } catch {
      // Silently catch network errors
    } finally {
      setIsLoadingMyGuild(false);
    }
  };

  // Fetch Guild Directory
  const fetchDirectory = async () => {
    setIsLoadingDirectory(true);
    try {
      const res = await fetch('/api/guild/list');
      const data = await res.json();
      if (res.ok && data.guilds) {
        setGuildsList(data.guilds);
        // Default select Guild ID 1 (Frieren Guildios) if available
        if (!selectedPublicGuild && data.guilds.length > 0) {
          const frieren = data.guilds.find((g: Guild) => g.id === '1' || g.name.includes('Frieren'));
          setSelectedPublicGuild(frieren || data.guilds[0]);
        }
      }
    } catch {
      // Silently catch directory fetch errors
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  useEffect(() => {
    fetchMyGuild();
    fetchDirectory();
  }, [character.guildId]);

  useEffect(() => {
    if (initialGuildId) {
      setActiveTab('directory');
      fetch(`/api/guild/${initialGuildId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.guild) setSelectedPublicGuild(data.guild);
        });
    }
  }, [initialGuildId]);

  // Handle Create Guild
  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildName.trim()) return;

    if (character.gold < 10000) {
      setErrorModal({
        isOpen: true,
        title: 'Insufficient Gold for Guild Charter Registration!',
        message: `Establishing a new Royal Guild Charter requires 10,000 Gold for administrative hall taxes, but you currently only have ${character.gold.toLocaleString()} Gold in your pouch.`,
        requiredGold: 10000,
        currentGold: character.gold,
      });
      return;
    }

    setIsCreating(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch('/api/guild/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          name: newGuildName.trim(),
          tag: newGuildTag.trim().toUpperCase(),
          symbol: newGuildSymbol,
          color: newGuildColor,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || 'Failed to create guild.');
      } else {
        setMsg(data.message);
        if (data.character && onUpdateCharacter) {
          onUpdateCharacter(data.character);
        }
        setMyGuild(data.guild);
        setActiveTab('my_guild');
      }
    } catch {
      setErr('Network error while creating guild.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Join Guild
  const handleJoinGuild = async (guildId: string) => {
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch('/api/guild/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, guildId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || 'Failed to join guild.');
      } else {
        setMsg(data.message);
        if (data.character && onUpdateCharacter) {
          onUpdateCharacter(data.character);
        }
        setMyGuild(data.guild);
        setActiveTab('my_guild');
      }
    } catch {
      setErr('Network error while joining guild.');
    }
  };

  // Handle Update Announcement
  const handleSaveAnnouncement = async () => {
    if (!myGuild) return;
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch('/api/guild/update-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          guildId: myGuild.id,
          announcement: announcementInput,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || 'Failed to update announcement.');
      } else {
        setMsg(data.message);
        setMyGuild({ ...myGuild, announcement: data.announcement });
        setIsEditingAnnouncement(false);
      }
    } catch {
      setErr('Network error updating announcement.');
    }
  };

  // Handle Upgrade Building
  const handleUpgradeBuilding = async (buildingKey: 'fort' | 'market' | 'camp' | 'church') => {
    if (!myGuild) return;
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch('/api/guild/upgrade-building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          guildId: myGuild.id,
          buildingKey,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || 'Failed to upgrade building.');
      } else {
        setMsg(data.message);
        setMyGuild(data.guild);
        if (data.character && onUpdateCharacter) {
          onUpdateCharacter(data.character);
        }
      }
    } catch {
      setErr('Network error upgrading building.');
    }
  };

  const isLeaderOrOfficer =
    myGuild &&
    myGuild.members.some(
      (m) =>
        m.characterId === character.id &&
        (m.role === 'LEADER' || m.role === 'CO_LEADER' || m.role === 'OFFICER')
    );

  // Filter directory guilds
  const filteredDirectory = guildsList.filter((g) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      g.id.toLowerCase() === q ||
      g.name.toLowerCase().includes(q) ||
      g.tag.toLowerCase().includes(q) ||
      g.leaderName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl space-y-4 text-slate-100 font-sans">
      {/* View Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <Shield className="h-6 w-6 text-amber-400" />
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200">
              Realm Guild Sanctuary & Alliance Directory
            </h2>
            <p className="text-xs text-slate-400">
              Public Guild Profiles • ID-Based Guild Lookup • Building Buff Upgrades
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 text-xs font-bold">
          {character.guildId && (
            <button
              onClick={() => setActiveTab('my_guild')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'my_guild'
                  ? 'border-amber-500/50 bg-amber-500 text-slate-950 shadow-md'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-amber-200'
              }`}
            >
              <Shield className="h-3.5 w-3.5" /> My Guild Sanctuary
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('directory');
              fetchDirectory();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'border-amber-500/50 bg-amber-500 text-slate-950 shadow-md'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-amber-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Public Guild Directory
          </button>

          {!character.guildId && (
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'border-amber-500/50 bg-amber-500 text-slate-950 shadow-md'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-amber-200'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" /> Form Guild (10k Gold)
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {err && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* TAB 1: MY GUILD (PRIVATE SANCTUARY VIEW) */}
      {activeTab === 'my_guild' && myGuild && (
        <div className="space-y-4 text-xs">
          {/* Guild Header Banner */}
          <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-5 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-amber-500/50 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  {myGuild.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-amber-200">
                      [{myGuild.tag}] {myGuild.name}
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                      Guild ID: #{myGuild.id}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs pt-0.5">
                    Leader: <strong className="text-amber-300">{myGuild.leaderName}</strong> • Member Count: <strong className="text-slate-200">{myGuild.memberCount}/{myGuild.maxMembers}</strong> • Reputation: <strong className="text-amber-400">{myGuild.reputation} Points</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold">
                  🟢 Your Role: {character.guildRole || 'MEMBER'}
                </span>
              </div>
            </div>

            {/* Guild Announcement & Editor */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Guild Announcement
                </h4>
                {isLeaderOrOfficer && !isEditingAnnouncement && (
                  <button
                    onClick={() => setIsEditingAnnouncement(true)}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline cursor-pointer font-semibold"
                  >
                    <Edit3 className="h-3 w-3" /> Edit Announcement
                  </button>
                )}
              </div>

              {isEditingAnnouncement ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-sans"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveAnnouncement}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                    >
                      Save Announcement
                    </button>
                    <button
                      onClick={() => setIsEditingAnnouncement(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-slate-300 text-xs leading-relaxed italic"
                  dangerouslySetInnerHTML={{ __html: myGuild.announcement || 'No active announcement.' }}
                />
              )}
            </div>
          </div>

          {/* Building Upgrades Grid */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-amber-200 flex items-center gap-2">
              <Building className="h-4 w-4 text-amber-400" /> Guild Sanctuary Building Upgrades
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Fort */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300 text-xs">🏰 Guild Fort</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                      Level {myGuild.buildings.fort}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Increases max guild member capacity (+5 capacity per level). Max: {myGuild.maxMembers} Members.
                  </p>
                </div>
                <button
                  onClick={() => handleUpgradeBuilding('fort')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-[11px] transition-all cursor-pointer border border-slate-700"
                >
                  Upgrade (Cost: {(myGuild.buildings.fort * 5000).toLocaleString()} Gold)
                </button>
              </div>

              {/* Market */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300 text-xs">🏪 Guild Market</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                      Level {myGuild.buildings.market}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Grants +2% bonus reputation gain and Marketplace transaction discount per level.
                  </p>
                </div>
                <button
                  onClick={() => handleUpgradeBuilding('market')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-[11px] transition-all cursor-pointer border border-slate-700"
                >
                  Upgrade (Cost: {(myGuild.buildings.market * 5000).toLocaleString()} Gold)
                </button>
              </div>

              {/* Camp */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300 text-xs">🏕️ Guild Camp</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                      Level {myGuild.buildings.camp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Grants +2% global Party EXP bonus to all guild members across all zones.
                  </p>
                </div>
                <button
                  onClick={() => handleUpgradeBuilding('camp')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-[11px] transition-all cursor-pointer border border-slate-700"
                >
                  Upgrade (Cost: {(myGuild.buildings.camp * 5000).toLocaleString()} Gold)
                </button>
              </div>

              {/* Church */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300 text-xs">⛪ Guild Church</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                      Level {myGuild.buildings.church}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Provides free party HP/MP restoration & +0.25% rare drop rate boost per level.
                  </p>
                </div>
                <button
                  onClick={() => handleUpgradeBuilding('church')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-[11px] transition-all cursor-pointer border border-slate-700"
                >
                  Upgrade (Cost: {(myGuild.buildings.church * 5000).toLocaleString()} Gold)
                </button>
              </div>
            </div>
          </div>

          {/* Member Roster */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-amber-200 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" /> Active Guild Member Roster ({myGuild.members.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {myGuild.members.map((m) => (
                <div
                  key={m.characterId}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0">
                      {m.role === 'LEADER' ? <Crown className="h-4 w-4 text-amber-400" /> : '🧙'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-xs">{m.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Level {m.level} • Role: <strong className="text-amber-300 uppercase">{m.role}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PUBLIC GUILD DIRECTORY & SEARCH */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          {/* Left Column: Guild List & Search */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Guild ID (e.g. 1) or Name..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredDirectory.map((g) => {
                const isSelected = selectedPublicGuild?.id === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedPublicGuild(g)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-950/20 shadow-md'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{g.symbol}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-amber-200 truncate">
                            [{g.tag}] {g.name}
                          </p>
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                            ID: #{g.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Leader: {g.leaderName} • {g.memberCount}/{g.maxMembers} Members
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-500 shrink-0" />
                  </div>
                );
              })}

              {filteredDirectory.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No guilds matching search query.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Public Guild Information */}
          <div className="lg:col-span-2 space-y-4">
            {selectedPublicGuild ? (
              <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-5 space-y-4 shadow-xl">
                {/* Public Guild Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-amber-500/50 flex items-center justify-center text-3xl shadow-inner shrink-0">
                      {selectedPublicGuild.symbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-xl font-bold text-amber-200">
                          [{selectedPublicGuild.tag}] {selectedPublicGuild.name}
                        </h3>
                        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                          Guild ID: #{selectedPublicGuild.id}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs pt-0.5">
                        Guildmaster: <strong className="text-amber-300">{selectedPublicGuild.leaderName}</strong> • Roster: <strong className="text-slate-200">{selectedPublicGuild.memberCount}/{selectedPublicGuild.maxMembers} Members</strong>
                      </p>
                    </div>
                  </div>

                  {!character.guildId && selectedPublicGuild.isOpenInvite && (
                    <button
                      onClick={() => handleJoinGuild(selectedPublicGuild.id)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer shadow-md shrink-0"
                    >
                      <UserPlus className="h-4 w-4" /> Join Guild #{selectedPublicGuild.id}
                    </button>
                  )}
                </div>

                {/* Public Announcement */}
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    Public Guild Announcement
                  </h4>
                  <div
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-300 text-xs italic leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: selectedPublicGuild.announcement || 'No public announcement recorded.',
                    }}
                  />
                </div>

                {/* Building Upgrades Buff Summary */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    Guild Sanctuary Building Buffs
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <span className="font-bold text-amber-300 block">🏰 Fort (Lv {selectedPublicGuild.buildings.fort})</span>
                      <span className="text-[10px] text-slate-400">Max {selectedPublicGuild.maxMembers} Members</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <span className="font-bold text-amber-300 block">🏪 Market (Lv {selectedPublicGuild.buildings.market})</span>
                      <span className="text-[10px] text-slate-400">+{selectedPublicGuild.buildings.market * 2}% Rep Gain</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <span className="font-bold text-amber-300 block">🏕️ Camp (Lv {selectedPublicGuild.buildings.camp})</span>
                      <span className="text-[10px] text-slate-400">+{selectedPublicGuild.buildings.camp * 2}% Party EXP</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <span className="font-bold text-amber-300 block">⛪ Church (Lv {selectedPublicGuild.buildings.church})</span>
                      <span className="text-[10px] text-slate-400">+{selectedPublicGuild.buildings.church * 0.25}% Drop Boost</span>
                    </div>
                  </div>
                </div>

                {/* Public Member Roster */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    Public Roster ({selectedPublicGuild.members ? selectedPublicGuild.members.length : 0})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedPublicGuild.members &&
                      selectedPublicGuild.members.map((m) => (
                        <div
                          key={m.characterId}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex items-center gap-2"
                        >
                          <span className="text-lg shrink-0">
                            {m.role === 'LEADER' ? '👑' : '🧙'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-200 text-xs truncate">{m.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Level {m.level} • <span className="text-amber-300 uppercase">{m.role}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 rounded-xl border border-dashed border-slate-800">
                Select a guild from the directory to inspect its public profile.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FORM NEW GUILD */}
      {activeTab === 'create' && !character.guildId && (
        <div className="max-w-md mx-auto rounded-xl border border-amber-500/40 bg-slate-900/90 p-6 space-y-4 text-xs shadow-2xl">
          <div className="text-center space-y-1">
            <Castle className="h-10 w-10 text-amber-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-amber-200">Establish a New Guild Alliance</h3>
            <p className="text-slate-400">
              Form a new guild alliance in the Realm. Creation fee: <strong className="text-amber-300">10,000 Gold</strong>.
            </p>
          </div>

          <form onSubmit={handleCreateGuild} className="space-y-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Guild Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Frieren Guildios"
                value={newGuildName}
                onChange={(e) => setNewGuildName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Guild Tag (4-5 Chars)</label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="e.g. FRRN"
                value={newGuildTag}
                onChange={(e) => setNewGuildTag(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Guild Symbol</label>
                <input
                  type="text"
                  maxLength={2}
                  value={newGuildSymbol}
                  onChange={(e) => setNewGuildSymbol(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-center text-xl focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Guild Theme Color</label>
                <input
                  type="color"
                  value={newGuildColor}
                  onChange={(e) => setNewGuildColor(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-800 bg-slate-950 p-1 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating || !newGuildName.trim()}
              className="w-full py-3 rounded-xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-xs mt-2"
            >
              {isCreating ? 'Forming Guild...' : 'Form Guild (10,000 Gold)'}
            </button>
          </form>
        </div>
      )}

      <ErrorNoticeModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        requiredGold={errorModal.requiredGold}
        currentGold={errorModal.currentGold}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
        onGoToDungeon={onNavigateToDungeon}
      />
    </div>
  );
};
