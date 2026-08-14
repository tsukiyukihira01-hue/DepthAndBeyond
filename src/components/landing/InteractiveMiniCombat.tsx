import React, { useState } from 'react';
import { Sword, Flame, Shield, Heart, Zap, Sparkles, RefreshCw, Trophy } from 'lucide-react';
import { audio } from '../../utils/audio';

export const InteractiveMiniCombat: React.FC<{ onStartPlay: () => void }> = ({ onStartPlay }) => {
  const [dummyHp, setDummyHp] = useState<number>(1000);
  const [playerHp, setPlayerHp] = useState<number>(850);
  const [playerMana, setPlayerMana] = useState<number>(200);
  const [turn, setTurn] = useState<number>(1);
  const [combatLogs, setCombatLogs] = useState<string[]>([
    '⚔️ Training Sandbox Initialized against [Level 35 Primordial Wyrm Dummy].',
    'Select a tactical action below to test turn-based matrix combat mechanics!'
  ]);
  const [lastActionAnimation, setLastActionAnimation] = useState<string | null>(null);

  const maxDummyHp = 1000;
  const maxPlayerHp = 850;
  const maxPlayerMana = 200;

  const handleAction = (actionType: 'attack' | 'spell' | 'heal') => {
    if (dummyHp <= 0) return;

    let dmg = 0;
    let logMsg = '';

    if (actionType === 'attack') {
      audio.playAttack();
      dmg = Math.floor(Math.random() * 80) + 120; // 120-200 physical damage
      logMsg = `🗡️ You executed [Heavy Slash] dealing ${dmg} Physical Damage!`;
      setLastActionAnimation('slash');
    } else if (actionType === 'spell') {
      if (playerMana < 40) {
        setCombatLogs((prev) => ['⚠️ Insufficient Mana for Fireball! Restoring mana...', ...prev]);
        setPlayerMana(maxPlayerMana);
        return;
      }
      audio.playSpell();
      dmg = Math.floor(Math.random() * 120) + 180; // 180-300 fire magic damage
      setPlayerMana((prev) => Math.max(0, prev - 40));
      logMsg = `🔥 You channeled [Meteor Cascade] dealing ${dmg} Fire Magic Damage!`;
      setLastActionAnimation('meteor');
    } else if (actionType === 'heal') {
      audio.playHeal();
      const healAmt = 220;
      setPlayerHp((prev) => Math.min(maxPlayerHp, prev + healAmt));
      setPlayerMana((prev) => Math.max(0, prev - 30));
      logMsg = `✨ You cast [Radiant Healing Sanctuary] restoring +${healAmt} HP!`;
      setLastActionAnimation('heal');
    }

    const newDummyHp = Math.max(0, dummyHp - dmg);
    setDummyHp(newDummyHp);

    if (newDummyHp <= 0) {
      audio.playVictory();
      setCombatLogs((prev) => [
        `🏆 VICTORY! You defeated the [Primordial Wyrm Dummy] in ${turn} turns!`,
        logMsg,
        ...prev
      ]);
      return;
    }

    // Dummy counter-attack
    const enemyDmg = Math.floor(Math.random() * 40) + 30;
    setPlayerHp((prev) => Math.max(0, prev - enemyDmg));

    setCombatLogs((prev) => [
      `🐉 Primordial Wyrm retaliated with [Flame Breath] dealing ${enemyDmg} damage to your front line!`,
      logMsg,
      ...prev
    ]);

    setTurn((prev) => prev + 1);

    setTimeout(() => {
      setLastActionAnimation(null);
    }, 800);
  };

  const handleReset = () => {
    audio.playClick();
    setDummyHp(maxDummyHp);
    setPlayerHp(maxPlayerHp);
    setPlayerMana(maxPlayerMana);
    setTurn(1);
    setCombatLogs([
      '⚔️ Training Sandbox Reset against [Level 35 Primordial Wyrm Dummy].',
      'Select a tactical action below to test turn-based matrix combat mechanics!'
    ]);
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-5 shadow-2xl space-y-5">
      {/* Sandbox Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sword className="h-5 w-5 text-amber-400" />
          <h3 className="font-serif text-base font-bold text-amber-200">
            Live Interactive Combat Simulator (Try It Out!)
          </h3>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
          <span>Reset Dummy</span>
        </button>
      </div>

      {/* Combat Arena Canvas Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Player Squad Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 relative overflow-hidden">
          {lastActionAnimation === 'heal' && (
            <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none animate-pulse" />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <div>
                <h4 className="font-bold text-amber-200 text-xs">Your Tactical Squad</h4>
                <p className="text-[10px] text-slate-400">Front Vanguard + Backline Archmage</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">Turn {turn}</span>
          </div>

          {/* Player HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span>Squad HP</span>
              <span className="font-bold text-rose-300">{playerHp} / {maxPlayerHp}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-emerald-500 transition-all duration-300"
                style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
              />
            </div>
          </div>

          {/* Player Mana Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span>Squad Mana</span>
              <span className="font-bold text-cyan-300">{playerMana} / {maxPlayerMana}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-300"
                style={{ width: `${(playerMana / maxPlayerMana) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => handleAction('attack')}
              disabled={dummyHp <= 0}
              className="flex items-center justify-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-2 text-xs cursor-pointer shadow active:scale-95 transition-all disabled:opacity-50"
            >
              <Sword className="h-3.5 w-3.5" />
              <span>Heavy Slash</span>
            </button>

            <button
              onClick={() => handleAction('spell')}
              disabled={dummyHp <= 0}
              className="flex items-center justify-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold p-2 text-xs cursor-pointer shadow active:scale-95 transition-all disabled:opacity-50"
            >
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              <span>Meteor</span>
            </button>

            <button
              onClick={() => handleAction('heal')}
              disabled={dummyHp <= 0}
              className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2 text-xs cursor-pointer shadow active:scale-95 transition-all disabled:opacity-50"
            >
              <Heart className="h-3.5 w-3.5 text-emerald-200" />
              <span>Heal</span>
            </button>
          </div>
        </div>

        {/* Right: Enemy Target Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 relative overflow-hidden">
          {lastActionAnimation === 'meteor' && (
            <div className="absolute inset-0 bg-rose-500/20 pointer-events-none animate-pulse" />
          )}
          {lastActionAnimation === 'slash' && (
            <div className="absolute inset-0 bg-amber-500/20 pointer-events-none animate-pulse" />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-bounce">🐉</span>
              <div>
                <h4 className="font-bold text-rose-300 text-xs">Level 35 Primordial Wyrm</h4>
                <p className="text-[10px] text-slate-400">Raid Boss Dummy Target</p>
              </div>
            </div>
            {dummyHp <= 0 && (
              <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                DEFEATED!
              </span>
            )}
          </div>

          {/* Dummy HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span>Wyrm Boss Health</span>
              <span className="font-bold text-rose-400">{dummyHp} / {maxDummyHp}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                style={{ width: `${(dummyHp / maxDummyHp) * 100}%` }}
              />
            </div>
          </div>

          {/* Combat Log Box */}
          <div className="h-24 overflow-y-auto rounded-lg bg-slate-900 p-2 font-mono text-[10px] space-y-1 text-slate-300 border border-slate-800/80">
            {combatLogs.map((log, idx) => (
              <p key={idx} className={idx === 0 ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                {log}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
