import React from 'react';
import { Item } from '../../types/game';
import { calculateTotalItemStats } from '../../utils/poeItemUtils';
import { Shield, Zap, Sparkles, Layers, Flame, Lock, Tag, Info, Heart, Droplet, Sword, Activity } from 'lucide-react';

interface PoEItemCardProps {
  item: Item;
  characterLevel?: number;
  charStats?: { str?: number; dex?: number; int?: number };
  onSocketClick?: (socketIndex: number) => void;
  showAffixTiers?: boolean;
}

export const PoEItemCard: React.FC<PoEItemCardProps> = ({
  item,
  characterLevel,
  charStats,
  onSocketClick,
  showAffixTiers = true,
}) => {
  const poeRarity = item.poeRarity || (item.rarity === 'rare' ? 'rare' : item.rarity === 'uncommon' ? 'magic' : 'normal');
  const totals = calculateTotalItemStats(item, characterLevel, charStats);

  // Rarity color schemes matching PoE exactly
  const headerBg =
    poeRarity === 'rare'
      ? 'from-amber-950 via-yellow-950 to-amber-950 border-amber-500/80 text-amber-300'
      : poeRarity === 'magic'
      ? 'from-blue-950 via-sky-950 to-blue-950 border-sky-500/80 text-sky-300'
      : poeRarity === 'unique'
      ? 'from-orange-950 via-amber-950 to-orange-950 border-orange-500/90 text-orange-400'
      : 'from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-slate-200';

  const socketBgColor: Record<string, string> = {
    red: 'bg-rose-600 border-rose-400 text-rose-100 shadow-rose-500/50',
    green: 'bg-emerald-600 border-emerald-400 text-emerald-100 shadow-emerald-500/50',
    blue: 'bg-sky-600 border-sky-400 text-sky-100 shadow-sky-500/50',
    white: 'bg-slate-100 border-white text-slate-900 font-black shadow-white/80',
  };

  // Determine traits
  const traits: string[] = [];
  if (item.weaponType) traits.push(`${item.weaponType.toUpperCase()} WEAPON`);
  if (item.slot) traits.push(item.slot.toUpperCase());
  if (item.baseArmour) traits.push('ARMOUR');
  if (item.baseEvasion) traits.push('EVASION');
  if (item.baseEnergyShield) traits.push('ENERGY SHIELD');
  if (item.enchantLevel && item.enchantLevel > 0) traits.push(`ENCHANTED +${item.enchantLevel}`);
  if (item.quality && item.quality > 0) traits.push(`QUALITY +${item.quality}%`);
  if (item.sockets && item.sockets.length > 0) traits.push(`${item.sockets.length} SOCKETS`);

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950/95 p-3 font-sans text-xs shadow-2xl text-slate-100 space-y-2.5 backdrop-blur-md">
      {/* PoE Header Box */}
      <div className={`relative rounded-lg border bg-gradient-to-r ${headerBg} p-2 text-center shadow-md`}>
        <div className="text-sm font-black tracking-wide font-serif">{item.name}</div>
        {item.quality ? (
          <div className="text-[10px] font-mono text-cyan-300 font-bold">
            Quality: +{item.quality}%
          </div>
        ) : null}
      </div>

      {/* Equipment Traits Badges */}
      {traits.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {traits.map((trait, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-slate-900 border border-slate-700/70 text-amber-200/90 tracking-wide"
            >
              {trait}
            </span>
          ))}
        </div>
      )}

      {/* Base Stats Panel */}
      <div className="space-y-1 text-slate-300 font-mono text-[11px] border-b border-slate-800/80 pb-2">
        {totals.physMax > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Physical Damage:</span>
            <span className="text-sky-300 font-bold">
              {totals.physMin} - {totals.physMax}
            </span>
          </div>
        )}
        {totals.armour > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Armour:</span>
            <span className="text-sky-300 font-bold">{totals.armour}</span>
          </div>
        )}
        {totals.evasion > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Evasion Rating:</span>
            <span className="text-sky-300 font-bold">{totals.evasion}</span>
          </div>
        )}
        {totals.energyShield > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Energy Shield (Ward):</span>
            <span className="text-sky-300 font-bold">{totals.energyShield}</span>
          </div>
        )}
        {item.baseCritChance ? (
          <div className="flex justify-between">
            <span className="text-slate-400">Critical Strike Chance:</span>
            <span className="text-slate-200">{item.baseCritChance.toFixed(2)}%</span>
          </div>
        ) : null}
        {item.baseAttackSpeed ? (
          <div className="flex justify-between">
            <span className="text-slate-400">Attacks per Second:</span>
            <span className="text-slate-200">{item.baseAttackSpeed.toFixed(2)}</span>
          </div>
        ) : null}
        {item.baseStats?.str ? (
          <div className="flex justify-between">
            <span className="text-slate-400">Base Strength:</span>
            <span className="text-rose-400 font-bold">+{item.baseStats.str}</span>
          </div>
        ) : null}
        {item.baseStats?.dex ? (
          <div className="flex justify-between">
            <span className="text-slate-400">Base Dexterity:</span>
            <span className="text-emerald-400 font-bold">+{item.baseStats.dex}</span>
          </div>
        ) : null}
        {item.baseStats?.int ? (
          <div className="flex justify-between">
            <span className="text-slate-400">Base Intelligence:</span>
            <span className="text-sky-400 font-bold">+{item.baseStats.int}</span>
          </div>
        ) : null}
        {item.baseStats?.def ? (
          <div className="flex justify-between">
            <span className="text-slate-400">Base Defense:</span>
            <span className="text-amber-300 font-bold">+{item.baseStats.def}</span>
          </div>
        ) : null}
        {item.baseStats?.spd ? (
          <div className="flex justify-between">
            <span className="text-slate-400">Base Speed:</span>
            <span className="text-teal-300 font-bold">+{item.baseStats.spd}</span>
          </div>
        ) : null}
        {item.baseStats?.wis ? (
          <div className="flex justify-between">
            <span className="text-slate-400">Base Wisdom:</span>
            <span className="text-purple-300 font-bold">+{item.baseStats.wis}</span>
          </div>
        ) : null}
      </div>

      {/* Item Requirements & Level */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 border-b border-slate-800/80 pb-2">
        <span>Item Level: <strong className="text-slate-200">{item.itemLevel || item.levelReq}</strong> (Req Lv.{item.levelReq || 1})</span>
        <span>
          Req: {item.reqStr ? <strong className="text-rose-400">{item.reqStr} Str </strong> : null}
          {item.reqDex ? <strong className="text-emerald-400">{item.reqDex} Dex </strong> : null}
          {item.reqInt ? <strong className="text-sky-400">{item.reqInt} Int</strong> : null}
        </span>
      </div>

      {/* Equipment Penalty Banner if equipped below requirements */}
      {totals.penalty && totals.penalty.penaltyPercent > 0 && (
        <div className="rounded-lg bg-amber-950/50 border border-amber-500/60 p-2 text-[10px] text-amber-200 font-mono space-y-0.5 shadow-inner">
          <div className="font-bold flex items-center justify-between text-amber-300">
            <span>⚠️ Stat Penalty Active</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 font-black">- {totals.penalty.penaltyPercent}% Stats</span>
          </div>
          <div className="text-[9px] text-amber-200/90 leading-tight">
            {totals.penalty.message}
          </div>
        </div>
      )}

      {/* Sockets & Links Bar */}
      {item.sockets && item.sockets.length > 0 && (
        <div className="rounded-lg bg-slate-900/90 p-2 border border-slate-800/80">
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center justify-between">
            <span>Sockets & Links ({item.sockets.length})</span>
            <span className="text-[8px] text-slate-500 font-mono">Linked Groups</span>
          </div>

          <div className="flex items-center justify-center gap-1">
            {item.sockets.map((sock, idx) => {
              const isLinkedToNext =
                idx < item.sockets!.length - 1 &&
                item.sockets![idx + 1].linkedGroupId === sock.linkedGroupId;

              return (
                <React.Fragment key={sock.id || idx}>
                  <button
                    onClick={() => onSocketClick?.(idx)}
                    className={`relative flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] shadow-lg transition-transform hover:scale-110 cursor-pointer ${
                      socketBgColor[sock.color] || socketBgColor.white
                    }`}
                    title={
                      sock.socketedGem
                        ? `Gem: ${sock.socketedGem.name} (${sock.socketedGem.gemType.toUpperCase()})`
                        : `Empty ${sock.color.toUpperCase()} Socket (Click to manage)`
                    }
                  >
                    {sock.socketedGem ? (
                      <span className="text-xs">{sock.socketedGem.icon}</span>
                    ) : (
                      <span className="font-mono text-[8px] uppercase font-bold">{sock.color[0]}</span>
                    )}
                  </button>

                  {/* Socket Link Connection Line */}
                  {isLinkedToNext && (
                    <div className="h-1 w-3 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full animate-pulse shadow-sm shadow-amber-400/50" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Socketed Gem Traits & Active Skills Summary */}
      {(totals.activeGems.length > 0 || totals.supportGems.length > 0) && (
        <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2 space-y-1.5">
          <div className="text-[9px] uppercase tracking-wider font-bold text-amber-300 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Socketed Gem Traits & Skills</span>
          </div>
          {totals.activeGems.map((gem, i) => (
            <div key={`agem_${i}`} className="text-[10px] text-slate-200">
              <div className="font-bold text-amber-200 flex items-center gap-1">
                <span>{gem.icon}</span>
                <span>{gem.name}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {gem.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="text-[8px] px-1 bg-amber-950/60 border border-amber-500/30 text-amber-300 rounded font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {totals.supportGems.map((gem, i) => (
            <div key={`sgem_${i}`} className="text-[10px] text-slate-300 border-t border-slate-800/60 pt-1">
              <div className="font-bold text-indigo-300 flex items-center gap-1">
                <span>{gem.icon}</span>
                <span>{gem.name}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {gem.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="text-[8px] px-1 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 rounded font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Implicit Stat */}
      {item.implicitStat && (
        <div className="rounded-lg bg-amber-950/20 border border-amber-500/20 p-2 text-[11px] text-amber-200 font-mono font-semibold text-center">
          {item.implicitStat.label}
        </div>
      )}

      {/* Explicit Affixes (Prefixes & Suffixes) */}
      <div className="space-y-1 text-[11px] font-mono">
        {item.prefixes?.map((p, idx) => (
          <div key={`p_${idx}`} className="flex items-center justify-between text-sky-300">
            <span>{p.label}</span>
            {showAffixTiers && (
              <span className="text-[9px] px-1 rounded bg-sky-950 text-sky-400 border border-sky-800/50">
                P{p.tier}
              </span>
            )}
          </div>
        ))}

        {item.suffixes?.map((s, idx) => (
          <div key={`s_${idx}`} className="flex items-center justify-between text-indigo-300">
            <span>{s.label}</span>
            {showAffixTiers && (
              <span className="text-[9px] px-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                S{s.tier}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Total Combined Stat Summary */}
      <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2 space-y-1 font-mono text-[10px] text-slate-300">
        <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800 pb-1">
          Net Bonus Stats
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5">
          {totals.flatLife > 0 && <span className="text-rose-300">+ {totals.flatLife} Max Life</span>}
          {totals.flatMana > 0 && <span className="text-cyan-300">+ {totals.flatMana} Max Mana</span>}
          {totals.flatStr > 0 && <span className="text-rose-400">+ {totals.flatStr} Strength</span>}
          {totals.flatDex > 0 && <span className="text-emerald-400">+ {totals.flatDex} Dexterity</span>}
          {totals.flatInt > 0 && <span className="text-sky-400">+ {totals.flatInt} Intelligence</span>}
          {totals.flatWis > 0 && <span className="text-purple-300">+ {totals.flatWis} Wisdom</span>}
          {totals.allAttributes > 0 && <span className="text-amber-200">+ {totals.allAttributes} All Attributes</span>}
          {totals.allSkillGems > 0 && <span className="text-amber-300 font-bold">+ {totals.allSkillGems} All Skill Gems Lv</span>}
          {totals.fireSkillGems > 0 && <span className="text-orange-300 font-bold">+ {totals.fireSkillGems} Fire Skill Gems Lv</span>}
          {totals.manaCostReductionPct > 0 && <span className="text-cyan-300">- {totals.manaCostReductionPct}% Skill Mana Cost</span>}
          {totals.cooldownRecoveryPct > 0 && <span className="text-teal-300">+ {totals.cooldownRecoveryPct}% Cooldown Recovery</span>}
          {totals.aoePct > 0 && <span className="text-yellow-300">+ {totals.aoePct}% Area of Effect</span>}
          {totals.spellDmgPct > 0 && <span className="text-blue-300">+ {totals.spellDmgPct}% Spell Damage</span>}
          {totals.elemDmgPct > 0 && <span className="text-amber-300">+ {totals.elemDmgPct}% Elem Damage</span>}
          {totals.manaRegenPct > 0 && <span className="text-sky-300">+ {totals.manaRegenPct}% Mana Regen</span>}
          {totals.fireRes > 0 && <span className="text-orange-400">+ {totals.fireRes}% Fire Res</span>}
          {totals.coldRes > 0 && <span className="text-cyan-400">+ {totals.coldRes}% Cold Res</span>}
          {totals.lightningRes > 0 && <span className="text-amber-300">+ {totals.lightningRes}% Light. Res</span>}
          {totals.chaosRes > 0 && <span className="text-purple-300">+ {totals.chaosRes}% Chaos Res</span>}
          {totals.attackSpeedPct > 0 && <span className="text-emerald-300">+ {totals.attackSpeedPct}% Attack Speed</span>}
          {totals.castSpeedPct > 0 && <span className="text-blue-300">+ {totals.castSpeedPct}% Cast Speed</span>}
          {totals.critChancePct > 0 && <span className="text-yellow-300">+ {totals.critChancePct}% Crit Chance</span>}
          {totals.critMulti > 0 && <span className="text-amber-400">+ {totals.critMulti}% Crit Multi</span>}
        </div>
      </div>

      {/* Visible Equipment Description */}
      {item.description && (
        <div className="rounded-lg bg-slate-900/60 border border-slate-800 border-l-2 border-l-amber-500/70 p-2 text-[10.5px] italic font-serif text-amber-100/80 leading-snug">
          "{item.description}"
        </div>
      )}

      {/* Corrupted Tag */}
      {item.isCorrupted && (
        <div className="flex items-center justify-center gap-1 rounded-md bg-red-950/80 border border-red-500/80 py-1 text-[11px] font-black text-red-400 tracking-wider uppercase">
          <Lock className="h-3 w-3 text-red-400" />
          <span>Corrupted</span>
        </div>
      )}
    </div>
  );
};

