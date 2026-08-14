import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, AdminAuditLog, AnomalyLog, PlayerSearchResult } from '../types/game';
import {
  Shield,
  Megaphone,
  AlertTriangle,
  Database,
  Users,
  Activity,
  X,
  PackagePlus,
  Flame,
  UserX,
  Search,
  Sparkles,
  Coins,
  Zap,
  Crown,
  UserCheck,
  CheckCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  user: UserAccount;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onClose }) => {
  if (user?.role !== 'ADMIN' && user?.userId !== '1') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-lg font-bold text-rose-200">Access Restricted</h2>
          <p className="text-xs text-slate-400">
            The Admin Panel is strictly restricted to Admin accounts and User ID #1 only.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'metrics' | 'stats' | 'spawner' | 'world' | 'mod' | 'audit'>('metrics');

  const [metrics, setMetrics] = useState<{
    totalAccounts: number;
    totalCharacters: number;
    totalGuilds: number;
    totalMarketListings: number;
    maintenanceMode: boolean;
    primaryGM?: { userId: string; email: string };
    users?: Array<{ id: string; userId: string; email: string; role: string; isBanned: boolean; banUntil?: string }>;
    characters: Array<{ id: string; userId?: string; name: string; level: number; gold: number; faction: string; accountId: string }>;
    auditLogs: AdminAuditLog[];
    anomalyLogs: AnomalyLog[];
  } | null>(null);

  // Form States & Target Autocomplete
  const [targetCharId, setTargetCharId] = useState('');
  const [targetSuggestions, setTargetSuggestions] = useState<PlayerSearchResult[]>([]);
  const [goldAdd, setGoldAdd] = useState('');
  const [levelSet, setLevelSet] = useState('');

  // Item Spawner Form State
  const [spawnName, setSpawnName] = useState('Godly Divine Claymore');
  const [spawnType, setSpawnType] = useState<'gear' | 'core' | 'consumable' | 'voucher'>('gear');
  const [spawnSlot, setSpawnSlot] = useState<string>('mainHand');
  const [spawnRarity, setSpawnRarity] = useState<string>('godly');
  const [spawnStr, setSpawnStr] = useState('100');
  const [spawnInt, setSpawnInt] = useState('100');
  const [spawnEnchant, setSpawnEnchant] = useState('15');

  // World & Event Form State
  const [bossName, setBossName] = useState('Abyssal Dragon Lord');
  const [bossHp, setBossHp] = useState('5000000');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Moderation State & Ban Duration
  const [modAccId, setModAccId] = useState('');
  const [banDuration, setBanDuration] = useState<'1h' | '12h' | '24h' | '7d' | '30d' | 'perm'>('24h');
  const [banReason, setBanReason] = useState('Rule violation detected by GM audit.');

  // Single GM Rank Transfer
  const [transferTargetId, setTransferTargetId] = useState('');

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      setMetrics(data);
      if (data.characters && data.characters.length > 0 && !targetCharId) {
        setTargetCharId(data.characters[0].userId || data.characters[0].name);
      }
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 5000);
    return () => clearInterval(timer);
  }, []);

  // Autocomplete fetch for target input fields
  const handleTargetInputChange = async (query: string, setter: (val: string) => void) => {
    setter(query);
    if (!query.trim()) {
      setTargetSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setTargetSuggestions(data.results || []);
    } catch {
      setTargetSuggestions([]);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!metrics) return;
    try {
      await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          enabled: !metrics.maintenanceMode,
        }),
      });
      fetchMetrics();
    } catch {
      //
    }
  };

  const handleModifyCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/modify-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          targetCharacterId: targetCharId,
          goldAdd: goldAdd ? Number(goldAdd) : undefined,
          levelSet: levelSet ? Number(levelSet) : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert('Character modifications applied and recorded to GM audit trail.');
        setGoldAdd('');
        setLevelSet('');
        fetchMetrics();
      }
    } catch {
      //
    }
  };

  const handleSpawnItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/spawn-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          targetCharacterId: targetCharId,
          name: spawnName,
          type: spawnType,
          slot: spawnSlot,
          rarity: spawnRarity,
          str: Number(spawnStr),
          int: Number(spawnInt),
          enchantLevel: Number(spawnEnchant),
        }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert(`Successfully spawned item [${spawnName}] into target character's inventory!`);
        fetchMetrics();
      }
    } catch {
      //
    }
  };

  const handleSpawnBoss = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/spawn-boss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          bossName,
          hp: Number(bossHp),
          tier: 3,
        }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert(`World Raid Boss [${bossName}] spawned across server!`);
        fetchMetrics();
      }
    } catch {
      //
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          message: broadcastMsg,
        }),
      });
      alert('GM Broadcast sent across all player chat feeds!');
      setBroadcastMsg('');
      fetchMetrics();
    } catch {
      //
    }
  };

  const handleAccountMod = async (action: 'ban' | 'unban') => {
    if (!modAccId) return;
    try {
      const res = await fetch('/api/admin/moderate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          accountId: modAccId,
          action,
          banDuration,
          reason: banReason,
        }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        const untilStr = data.account.banUntil
          ? `until ${new Date(data.account.banUntil).toLocaleString()}`
          : 'permanently';
        alert(`Account ${action.toUpperCase()} action applied (${untilStr}).`);
        fetchMetrics();
      }
    } catch {
      //
    }
  };

  const handleTransferGM = async () => {
    if (!transferTargetId) return;
    if (
      !confirm(
        `Are you sure you want to TRANSFER SOLE GM AUTHORITY to User/Character [${transferTargetId}]? You will forfeit primary admin status!`
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/admin/transfer-gm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          targetIdentifier: transferTargetId,
        }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert(data.message);
        fetchMetrics();
      }
    } catch {
      //
    }
  };

  const handleEmergencyReset = async () => {
    if (confirm('ARE YOU SURE? This will snapshot the world state and reset character progress while preserving accounts.')) {
      try {
        const res = await fetch('/api/admin/emergency-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId: user.id }),
        });
        const data = await res.json();
        alert(data.message || 'Reset executed.');
        fetchMetrics();
      } catch {
        //
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-amber-500/40 bg-slate-950 p-6 text-slate-100 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 cursor-pointer">
          <X className="h-5 w-5" />
        </button>

        {/* Header & Sole GM Status Banner */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                GM Admin Suite — Gameplay Engine Control
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                  Single GM Enforced
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Active Officer: {user.email} (User ID #{user.userId}) • Sole Primary GM Authority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <Crown className="h-3.5 w-3.5 text-amber-400" /> Sole GM Active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'metrics'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" /> Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-4 w-4" /> Stat & Resource Modder
          </button>
          <button
            onClick={() => setActiveTab('spawner')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'spawner'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackagePlus className="h-4 w-4" /> Item Spawner
          </button>
          <button
            onClick={() => setActiveTab('world')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'world'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="h-4 w-4" /> World Boss & Broadcast
          </button>
          <button
            onClick={() => setActiveTab('mod')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'mod'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserX className="h-4 w-4" /> Account Moderation & Ban Duration
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-4 w-4" /> GM Audit Logs
          </button>
        </div>

        {/* Tab 1: Overview & Metrics */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <span className="text-[10px] text-slate-400 block">Total User Accounts</span>
                  <span className="font-bold text-amber-300 text-xl">{metrics?.totalAccounts || 0}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <span className="text-[10px] text-slate-400 block">Active Characters</span>
                  <span className="font-bold text-emerald-400 text-xl">{metrics?.totalCharacters || 0}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <span className="text-[10px] text-slate-400 block">Guild Sanctuaries</span>
                  <span className="font-bold text-sky-400 text-xl">{metrics?.totalGuilds || 0}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 block">Maintenance Mode</span>
                  <button
                    onClick={handleToggleMaintenance}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                      metrics?.maintenanceMode
                        ? 'bg-rose-600 text-slate-100'
                        : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {metrics?.maintenanceMode ? 'ACTIVE (BLOCKING)' : 'NORMAL MODE'}
                  </button>
                </div>
              </div>

              {/* Sole GM Management & Transfer Section */}
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-3 text-xs">
                <h3 className="font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-amber-400" /> Sole GM Authority Rank Control
                </h3>
                <p className="text-slate-300 text-[11px]">
                  By realm design rules, only ONE account holds the primary GM/Admin rank. You can transfer sole GM status to another user ID or character name.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Target User ID or Character Name (e.g. 2)..."
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-amber-200 focus:outline-none"
                  />
                  <button
                    onClick={handleTransferGM}
                    className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap"
                  >
                    Transfer Sole GM Rank
                  </button>
                </div>
              </div>

              {/* Active Accounts & Characters List */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs">
                <h3 className="font-bold text-amber-300 uppercase">Registered Adventurers (Select to Target)</h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {metrics?.characters.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setTargetCharId(c.userId || c.name);
                        setModAccId(c.userId || c.accountId);
                      }}
                      className={`flex items-center justify-between rounded-lg p-2 transition-all cursor-pointer ${
                        targetCharId === (c.userId || c.name)
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
                          : 'bg-slate-950 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{c.name}</span>
                        <span className="text-[10px] font-mono px-1.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                          User ID: #{c.userId || '1'}
                        </span>
                        <span className="text-[10px] text-slate-400">Lv {c.level}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-amber-400 font-mono">{c.gold.toLocaleString()} Gold</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Stat & Resource Modder */}
          {activeTab === 'stats' && (
            <form onSubmit={handleModifyCharacter} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs">
              <h3 className="font-bold text-amber-300 uppercase">Modify Character Stats & Gold</h3>

              <div className="space-y-1 relative">
                <label className="text-[10px] text-slate-400">Target User ID, Character Name, or Email</label>
                <input
                  type="text"
                  required
                  placeholder="Type first 3 letters or User ID (e.g. 1)..."
                  value={targetCharId}
                  onChange={(e) => handleTargetInputChange(e.target.value, setTargetCharId)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />

                {/* Suggestions */}
                {targetSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-amber-500/30 bg-slate-950 p-1 shadow-2xl space-y-1 max-h-40 overflow-y-auto">
                    {targetSuggestions.map((s) => (
                      <div
                        key={s.userId}
                        onClick={() => {
                          setTargetCharId(s.userId);
                          setTargetSuggestions([]);
                        }}
                        className="p-1.5 rounded hover:bg-slate-900 cursor-pointer flex justify-between items-center text-xs"
                      >
                        <span className="text-amber-200 font-bold">{s.characterName}</span>
                        <span className="text-[10px] font-mono text-amber-400">ID: #{s.userId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Add Gold Amount</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={goldAdd}
                    onChange={(e) => setGoldAdd(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Set Level Directly</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={levelSet}
                    onChange={(e) => setLevelSet(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 py-2.5 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Apply Stat & Resource Overrides (GM Logged)
              </button>
            </form>
          )}

          {/* Tab 3: Item Spawner */}
          {activeTab === 'spawner' && (
            <form onSubmit={handleSpawnItem} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs">
              <h3 className="font-bold text-amber-300 uppercase flex items-center gap-1.5">
                <PackagePlus className="h-4 w-4" /> Item Spawner Console
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Target User ID or Character Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Target User ID (e.g. 1)"
                    value={targetCharId}
                    onChange={(e) => setTargetCharId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Item Name</label>
                  <input
                    type="text"
                    required
                    value={spawnName}
                    onChange={(e) => setSpawnName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-amber-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Rarity</label>
                  <select
                    value={spawnRarity}
                    onChange={(e) => setSpawnRarity(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="godly">Godly (Tier 8)</option>
                    <option value="mythical">Mythical (Tier 7)</option>
                    <option value="legendary">Legendary (Tier 6)</option>
                    <option value="epic">Epic (Tier 5)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Enchantment Level</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={spawnEnchant}
                    onChange={(e) => setSpawnEnchant(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Slot</label>
                  <select
                    value={spawnSlot}
                    onChange={(e) => setSpawnSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="mainHand">Main Hand Weapon</option>
                    <option value="offHand">Offhand Shield</option>
                    <option value="body">Body Armor</option>
                    <option value="amulet">Amulet</option>
                    <option value="ring">Ring</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 py-2.5 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Spawn Item Into Player Inventory
              </button>
            </form>
          )}

          {/* Tab 4: World Boss & Broadcast */}
          {activeTab === 'world' && (
            <div className="space-y-4 text-xs">
              <form onSubmit={handleSpawnBoss} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h3 className="font-bold text-purple-300 uppercase flex items-center gap-1.5">
                  <Flame className="h-4 w-4" /> Trigger World Raid Boss Event
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Boss Name</label>
                    <input
                      type="text"
                      required
                      value={bossName}
                      onChange={(e) => setBossName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Max HP</label>
                    <input
                      type="number"
                      value={bossHp}
                      onChange={(e) => setBossHp(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-purple-600 py-2.5 font-bold text-slate-100 hover:bg-purple-500 cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  Spawn Server-Wide World Boss
                </button>
              </form>

              <form onSubmit={handleBroadcast} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h3 className="font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <Megaphone className="h-4 w-4" /> Global Server GM Broadcast
                </h3>

                <input
                  type="text"
                  required
                  placeholder="Enter GM announcement message..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-amber-200 focus:outline-none"
                />

                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-500 py-2 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                >
                  Broadcast Marquee Announcement
                </button>
              </form>
            </div>
          )}

          {/* Tab 5: Account Moderation */}
          {activeTab === 'mod' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h3 className="font-bold text-rose-300 uppercase flex items-center gap-1.5">
                  <UserX className="h-4 w-4" /> Account Sanction & Time-Based Banning
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Target User ID, Email, or Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 or player@realm.com"
                      value={modAccId}
                      onChange={(e) => setModAccId(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Ban Duration Period</label>
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
                    >
                      <option value="1h">1 Hour Ban</option>
                      <option value="12h">12 Hours Ban</option>
                      <option value="24h">24 Hours Ban</option>
                      <option value="7d">7 Days Ban</option>
                      <option value="30d">30 Days Ban</option>
                      <option value="perm">Permanent Ban</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Ban Reason Notice</label>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccountMod('ban')}
                    className="rounded-xl bg-rose-600 py-2.5 font-bold text-slate-100 hover:bg-rose-500 cursor-pointer"
                  >
                    Apply Ban ({banDuration.toUpperCase()})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccountMod('unban')}
                    className="rounded-xl bg-emerald-600/30 border border-emerald-500/40 py-2.5 font-bold text-emerald-300 hover:bg-emerald-600/50 cursor-pointer"
                  >
                    Lift Account Ban
                  </button>
                </div>
              </div>

              {/* Emergency Progress Reset */}
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 space-y-2">
                <h3 className="font-bold text-rose-300 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Emergency Progress Reset
                </h3>
                <p className="text-[11px] text-rose-200/80">
                  Creates a server snapshot and truncates character tables while keeping accounts intact.
                </p>
                <button
                  onClick={handleEmergencyReset}
                  className="w-full rounded-xl bg-rose-600 py-2 text-xs font-bold text-slate-100 hover:bg-rose-500 cursor-pointer"
                >
                  Execute Emergency Progress Reset
                </button>
              </div>
            </div>
          )}

          {/* Tab 6: GM Audit Logs */}
          {activeTab === 'audit' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs">
              <h3 className="font-bold text-amber-300 uppercase">2-Officer Signature Immutable Audit Logs</h3>
              <div className="max-h-60 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-300">
                {metrics?.auditLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800/60 pb-1.5 pt-1 space-y-0.5">
                    <div className="flex justify-between text-slate-400">
                      <span>[{log.createdAt.substring(11, 19)}] {log.adminEmail}</span>
                      <span className="text-amber-400 font-bold">{log.action}</span>
                    </div>
                    {log.targetId && <div className="text-slate-500">Target: {log.targetId}</div>}
                    {log.afterState && <div className="text-emerald-400/80 line-clamp-1">{log.afterState}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
