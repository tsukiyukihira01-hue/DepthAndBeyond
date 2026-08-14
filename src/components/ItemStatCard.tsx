import React from 'react';
import { Item, CharacterStats, Rarity, EquipmentSlot } from '../types/game';
import { PoEItemCard } from './equipment/PoEItemCard';
import {
  Sword,
  Shield,
  Zap,
  Sparkles,
  Heart,
  Droplet,
  Target,
  ArrowUp,
  ArrowDown,
  Coins,
  Lock,
  CheckCircle2,
  BookOpen,
  Award,
} from 'lucide-react';

interface ItemStatCardProps {
  item: Item;
  comparedItem?: Item | null;
  characterLevel?: number;
  showActions?: boolean;
  onEquip?: () => void;
  onUnequip?: () => void;
  onDismantle?: () => void;
  actionButtonLabel?: string;
}

export interface DerivedItemStats {
  baseStats: Partial<Record<keyof CharacterStats, number>>;
  enchantBonus: Partial<Record<keyof CharacterStats, number>>;
  totalStats: Partial<Record<keyof CharacterStats, number>>;
  isGear: boolean;
}

// Rarity color mappings for RPG UI
export const RARITY_STYLES: Record<
  Rarity | 'garbage',
  {
    border: string;
    bg: string;
    text: string;
    badgeBg: string;
    glow: string;
    gradient: string;
  }
> = {
  garbage: {
    border: 'border-slate-700',
    bg: 'bg-slate-900/90',
    text: 'text-slate-400',
    badgeBg: 'bg-slate-800 text-slate-400',
    glow: '',
    gradient: 'from-slate-800 to-slate-900',
  },
  common: {
    border: 'border-slate-600',
    bg: 'bg-slate-900/90',
    text: 'text-slate-200',
    badgeBg: 'bg-slate-800 text-slate-300 border border-slate-600',
    glow: '',
    gradient: 'from-slate-800/80 to-slate-900',
  },
  uncommon: {
    border: 'border-emerald-600/90 shadow-md shadow-emerald-900/20',
    bg: 'bg-emerald-950/70',
    text: 'text-emerald-300 font-bold',
    badgeBg: 'bg-emerald-900/90 text-emerald-200 border border-emerald-500/60 shadow-sm shadow-emerald-500/20',
    glow: 'shadow-emerald-900/40',
    gradient: 'from-emerald-900/50 via-slate-900 to-slate-950',
  },
  rare: {
    border: 'border-sky-500/90 shadow-md shadow-sky-900/30',
    bg: 'bg-sky-950/70',
    text: 'text-sky-300 font-bold',
    badgeBg: 'bg-sky-900/90 text-sky-200 border border-sky-400/60 shadow-sm shadow-sky-400/20',
    glow: 'shadow-sky-900/50',
    gradient: 'from-sky-900/50 via-slate-900 to-slate-950',
  },
  epic: {
    border: 'border-purple-500/90 shadow-lg shadow-purple-900/40',
    bg: 'bg-purple-950/70',
    text: 'text-purple-300 font-bold',
    badgeBg: 'bg-purple-900/90 text-purple-200 border border-purple-400/60 shadow-md shadow-purple-500/30',
    glow: 'shadow-purple-900/50',
    gradient: 'from-purple-900/60 via-slate-900 to-slate-950',
  },
  legendary: {
    border: 'border-amber-400 shadow-xl shadow-amber-500/20',
    bg: 'bg-amber-950/80',
    text: 'text-amber-200 font-extrabold drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    badgeBg: 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-200 border border-amber-400 shadow-md shadow-amber-500/30',
    glow: 'shadow-amber-500/30 ring-1 ring-amber-500/20',
    gradient: 'from-amber-900/60 via-amber-950/40 to-slate-950',
  },
  mythical: {
    border: 'border-fuchsia-400 shadow-2xl shadow-fuchsia-500/30',
    bg: 'bg-fuchsia-950/80',
    text: 'text-fuchsia-200 font-extrabold drop-shadow-[0_0_10px_rgba(232,121,249,0.6)]',
    badgeBg: 'bg-gradient-to-r from-fuchsia-500/30 to-purple-500/30 text-fuchsia-200 border border-fuchsia-400 shadow-lg shadow-fuchsia-500/30',
    glow: 'shadow-fuchsia-500/40 ring-1 ring-fuchsia-400/30',
    gradient: 'from-fuchsia-900/60 via-purple-950/50 to-slate-950',
  },
  godly: {
    border: 'border-rose-400 ring-2 ring-amber-400/50 animate-pulse shadow-2xl shadow-rose-500/40',
    bg: 'bg-rose-950/85',
    text: 'text-rose-200 font-black tracking-wide drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]',
    badgeBg: 'bg-gradient-to-r from-rose-500/40 via-amber-500/40 to-purple-500/40 text-amber-200 border border-rose-400 shadow-xl shadow-rose-500/40 font-extrabold',
    glow: 'shadow-rose-500/50 ring-2 ring-rose-400/40',
    gradient: 'from-rose-900/70 via-purple-950/60 to-slate-950',
  },
};

export function getEnchantLevelStyles(level: number = 0) {
  if (level <= 0) {
    return {
      badgeBg: 'bg-slate-800 text-slate-400 border border-slate-700',
      glow: '',
      textColor: 'text-slate-400',
      ringColor: 'border-slate-700',
      flameEffect: '',
      tierLabel: 'Base +0',
    };
  }
  if (level <= 3) {
    return {
      badgeBg: 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow-sm shadow-emerald-500/20 font-bold',
      glow: 'shadow-emerald-500/20 shadow-md',
      textColor: 'text-emerald-300 font-bold',
      ringColor: 'border-emerald-400/80 ring-2 ring-emerald-500/30',
      flameEffect: '',
      tierLabel: `Safe (+${level})`,
    };
  }
  if (level <= 9) {
    return {
      badgeBg: 'bg-amber-950/90 text-amber-300 border border-amber-400/80 shadow-md shadow-amber-500/30 font-extrabold',
      glow: 'shadow-amber-500/30 shadow-lg',
      textColor: 'text-amber-300 font-extrabold',
      ringColor: 'border-amber-400 ring-2 ring-amber-400/40 animate-pulse',
      flameEffect: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
      tierLabel: `Refined (+${level})`,
    };
  }
  if (level <= 15) {
    return {
      badgeBg: 'bg-purple-950/90 text-purple-200 border border-purple-400/90 shadow-xl shadow-purple-500/40 font-black',
      glow: 'shadow-purple-500/40 shadow-xl',
      textColor: 'text-purple-300 font-black',
      ringColor: 'border-purple-400 ring-4 ring-purple-500/50 animate-pulse',
      flameEffect: 'drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]',
      tierLabel: `Master (+${level})`,
    };
  }
  return {
    badgeBg: 'bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 text-slate-950 font-black border border-amber-300 shadow-2xl shadow-amber-400/60 animate-bounce',
    glow: 'shadow-amber-400/50 shadow-2xl',
    textColor: 'text-amber-300 font-black tracking-widest',
    ringColor: 'border-rose-400 ring-4 ring-amber-400/70 animate-pulse',
    flameEffect: 'drop-shadow-[0_0_16px_rgba(244,63,94,0.9)] animate-pulse',
    tierLabel: `Godly (+${level})`,
  };
}

/**
 * Calculates or extracts the base stats, enchantment bonus, and total stats for any item.
 */
export function getItemEffectiveStats(item: Item): DerivedItemStats {
  const isGear = Boolean(
    item.type === 'gear' ||
      (item as any).type === 'weapon' ||
      (item as any).type === 'armor' ||
      item.slot
  );

  if (!isGear) {
    return {
      baseStats: {},
      enchantBonus: {},
      totalStats: {},
      isGear: false,
    };
  }

  let baseStats: Partial<Record<keyof CharacterStats, number>> = {};

  if (item.baseStats && Object.keys(item.baseStats).length > 0) {
    baseStats = { ...item.baseStats };
  } else {
    // Derive realistic RPG base stats if baseStats is empty
    const reqLv = item.levelReq || 1;
    const rarity = item.rarity || 'common';
    const mult =
      rarity === 'godly'
        ? 4.0
        : rarity === 'mythical'
        ? 3.2
        : rarity === 'legendary'
        ? 2.5
        : rarity === 'epic'
        ? 1.9
        : rarity === 'rare'
        ? 1.4
        : rarity === 'uncommon'
        ? 1.2
        : 1.0;

    const baseVal = Math.round((10 + reqLv * 2.2) * mult);
    const itemName = item.name.toLowerCase();
    const slot = item.slot || 'mainHand';

    if (
      item.weaponType === 'physical' ||
      itemName.includes('sword') ||
      itemName.includes('cleaver') ||
      itemName.includes('dagger') ||
      itemName.includes('hammer') ||
      itemName.includes('spear') ||
      itemName.includes('shield') ||
      itemName.includes('aegis')
    ) {
      baseStats = {
        str: Math.round(baseVal * 1.0),
        def: Math.round(baseVal * 0.6),
        spd: Math.round(baseVal * 0.3),
        dex: Math.round(baseVal * 0.2),
        int: -Math.round(baseVal * 0.35),
        wis: -Math.round(baseVal * 0.25),
      };
    } else if (
      item.weaponType === 'magical' ||
      itemName.includes('staff') ||
      itemName.includes('wand') ||
      itemName.includes('book') ||
      itemName.includes('grimoire') ||
      itemName.includes('orb') ||
      itemName.includes('scepter') ||
      itemName.includes('crown')
    ) {
      baseStats = {
        int: Math.round(baseVal * 1.0),
        wis: Math.round(baseVal * 0.7),
        spd: Math.round(baseVal * 0.3),
        dex: Math.round(baseVal * 0.2),
        str: -Math.round(baseVal * 0.35),
        def: -Math.round(baseVal * 0.25),
      };
    } else if (
      slot === 'body' ||
      slot === 'legs' ||
      slot === 'head' ||
      itemName.includes('cuirass') ||
      itemName.includes('sabatons') ||
      itemName.includes('helm')
    ) {
      baseStats = {
        def: Math.round(baseVal * 1.0),
        str: Math.round(baseVal * 0.4),
        maxHp: Math.round(baseVal * 5),
        spd: Math.round(baseVal * 0.2),
        int: -Math.round(baseVal * 0.2),
      };
    } else if (slot === 'ring' || slot === 'amulet' || slot === 'arms') {
      baseStats = {
        dex: Math.round(baseVal * 0.7),
        spd: Math.round(baseVal * 0.5),
        str: Math.round(baseVal * 0.3),
        int: Math.round(baseVal * 0.3),
        maxHp: Math.round(baseVal * 3),
      };
    } else {
      baseStats = {
        str: Math.round(baseVal * 0.6),
        def: Math.round(baseVal * 0.6),
        spd: Math.round(baseVal * 0.3),
      };
    }
  }

  const enchantLevel = item.enchantLevel || 0;
  const enchantBonus: Partial<Record<keyof CharacterStats, number>> = {};
  const totalStats: Partial<Record<keyof CharacterStats, number>> = {};

  const keys: (keyof CharacterStats)[] = ['str', 'def', 'int', 'wis', 'spd', 'dex', 'maxHp', 'maxMana'];

  keys.forEach((key) => {
    const val = baseStats[key] || 0;
    if (val !== 0) {
      if (val > 0) {
        // Positive stats gain extra bonus from enchantment
        const bonusPerEnchant = key === 'maxHp' ? 15 : key === 'maxMana' ? 10 : 3;
        const enchVal = enchantLevel * bonusPerEnchant;
        enchantBonus[key] = enchVal;
        totalStats[key] = val + enchVal;
      } else {
        // Negative stat penalty does NOT worsen with enchantment
        enchantBonus[key] = 0;
        totalStats[key] = val;
      }
    }
  });

  return {
    baseStats,
    enchantBonus,
    totalStats,
    isGear: true,
  };
}

export const ItemStatCard: React.FC<ItemStatCardProps> = ({
  item,
  comparedItem,
  characterLevel,
  showActions = false,
  onEquip,
  onUnequip,
  onDismantle,
  actionButtonLabel,
}) => {
  const rarityStyle = RARITY_STYLES[item.rarity || 'common'];
  const enchantStyle = getEnchantLevelStyles(item.enchantLevel || 0);
  const derived = getItemEffectiveStats(item);
  const comparedDerived = comparedItem ? getItemEffectiveStats(comparedItem) : null;

  const levelSufficient = characterLevel === undefined || characterLevel >= (item.levelReq || 1);

  const statMeta: {
    key: keyof CharacterStats;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    { key: 'str', label: 'STR (Strength)', icon: <Sword className="h-3.5 w-3.5 text-amber-400" />, color: 'text-amber-300' },
    { key: 'def', label: 'DEF (Defense)', icon: <Shield className="h-3.5 w-3.5 text-blue-400" />, color: 'text-blue-300' },
    { key: 'int', label: 'INT (Intelligence)', icon: <Sparkles className="h-3.5 w-3.5 text-purple-400" />, color: 'text-purple-300' },
    { key: 'wis', label: 'WIS (Wisdom)', icon: <BookOpen className="h-3.5 w-3.5 text-indigo-400" />, color: 'text-indigo-300' },
    { key: 'spd', label: 'SPD (Speed)', icon: <Zap className="h-3.5 w-3.5 text-emerald-400" />, color: 'text-emerald-300' },
    { key: 'dex', label: 'DEX (Dexterity)', icon: <Target className="h-3.5 w-3.5 text-sky-400" />, color: 'text-sky-300' },
    { key: 'maxHp', label: 'Max HP', icon: <Heart className="h-3.5 w-3.5 text-rose-400" />, color: 'text-rose-300' },
    { key: 'maxMana', label: 'Max Mana', icon: <Droplet className="h-3.5 w-3.5 text-cyan-400" />, color: 'text-cyan-300' },
  ];

  const formatSlotName = (slot?: EquipmentSlot) => {
    if (!slot) return 'General Item';
    return slot.replace(/([A-Z])/g, ' $1').toUpperCase();
  };

  if (item.type === 'gear' || item.poeRarity || item.sockets) {
    return (
      <div className="space-y-3">
        <PoEItemCard item={item} characterLevel={characterLevel} />

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onEquip && (
              <button
                onClick={onEquip}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold hover:brightness-110 shadow-md cursor-pointer transition-all ${
                  levelSufficient
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950'
                    : 'bg-gradient-to-r from-orange-600 to-amber-700 text-amber-100 border border-amber-400/50'
                }`}
              >
                {actionButtonLabel || (levelSufficient ? 'Equip Item' : 'Equip (With Stat Penalty)')}
              </button>
            )}

            {onUnequip && (
              <button
                onClick={onUnequip}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold cursor-pointer transition-all border border-slate-700"
              >
                Unequip
              </button>
            )}

            {onDismantle && (
              <button
                onClick={onDismantle}
                className="py-2 px-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold cursor-pointer transition-all"
              >
                Dismantle
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${rarityStyle.border} ${rarityStyle.bg} p-4 shadow-xl backdrop-blur-md space-y-3.5 transition-all ${rarityStyle.glow} ${enchantStyle.glow}`}
    >
      {/* Top Banner Background Tint */}
      <div className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b ${rarityStyle.gradient} opacity-40 pointer-events-none`} />

      {/* Header: Icon, Item Name, Rarity & Slot Badges */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Icon Container with Metallic Border & Enchant Glow */}
          <div
            className={`relative flex items-center justify-center h-14 w-14 rounded-2xl border-2 ${rarityStyle.border} ${enchantStyle.ringColor} bg-slate-950 p-2 shadow-inner shrink-0 transition-all`}
          >
            <span className={`text-3xl ${enchantStyle.flameEffect}`}>{item.icon}</span>
            {item.enchantLevel > 0 && (
              <span className={`absolute -top-2.5 -right-2.5 rounded-full px-2 py-0.5 text-[10px] ${enchantStyle.badgeBg}`}>
                +{item.enchantLevel}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-serif text-base font-bold leading-tight ${rarityStyle.text}`}>
                {item.name}
              </h3>
              {item.enchantLevel > 0 && (
                <span className={`text-xs ${enchantStyle.textColor}`}>
                  +{item.enchantLevel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {/* Rarity Pill */}
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-black tracking-wide uppercase ${rarityStyle.badgeBg}`}>
                {item.rarity}
              </span>

              {/* Enchantment Tier Pill */}
              {item.enchantLevel > 0 && (
                <span className={`rounded-md px-2 py-0.5 text-[10px] uppercase ${enchantStyle.badgeBg}`}>
                  {enchantStyle.tierLabel}
                </span>
              )}

              {/* Slot / Type Pill */}
              <span className="rounded-md border border-slate-700 bg-slate-900/90 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                {formatSlotName(item.slot)}
              </span>

              {item.weaponType && (
                <span className="rounded-md border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 capitalize">
                  {item.weaponType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Level Requirement Badge */}
        <div className="text-right shrink-0">
          <div
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${
              levelSufficient
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                : 'border-rose-500/50 bg-rose-950/60 text-rose-300 animate-pulse'
            }`}
          >
            {levelSufficient ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Lock className="h-3 w-3 text-rose-400" />}
            <span>Lv. Req {item.levelReq || 1}</span>
          </div>
        </div>
      </div>

      {/* Primary RPG Attributes Matrix */}
      {derived.isGear && (
        <div className="relative z-10 rounded-xl border border-slate-800/90 bg-slate-950/90 p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-amber-400" /> Attribute Modifiers
            </span>
            {item.enchantLevel > 0 && (
              <span className="text-[10px] font-bold text-amber-400 font-mono">
                +{item.enchantLevel} Enchantment Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {statMeta.map(({ key, label, icon, color }) => {
              const baseVal = derived.baseStats[key] || 0;
              const enchVal = derived.enchantBonus[key] || 0;
              const totalVal = derived.totalStats[key] || 0;

              if (totalVal === 0 && baseVal === 0) return null;

              const isPositive = totalVal > 0;

              // Comparison difference if compared with another item
              let diff = 0;
              if (comparedDerived) {
                const comparedTotal = comparedDerived.totalStats[key] || 0;
                diff = totalVal - comparedTotal;
              }

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-mono transition-colors ${
                    isPositive
                      ? 'border-emerald-950/80 bg-emerald-950/20 text-emerald-200'
                      : 'border-rose-950/80 bg-rose-950/20 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {icon}
                    <span className="font-sans font-medium text-[11px] text-slate-300 truncate">{label.split(' ')[0]}</span>
                  </div>

                  <div className="flex items-center gap-1 font-bold">
                    <span className={isPositive ? 'text-emerald-300' : 'text-rose-400'}>
                      {isPositive ? `+${totalVal}` : totalVal}
                    </span>

                    {enchVal > 0 && (
                      <span className="text-[9px] text-amber-400 font-semibold" title={`Base +${baseVal}, Enchant +${enchVal}`}>
                        (+{enchVal})
                      </span>
                    )}

                    {comparedItem && diff !== 0 && (
                      <span
                        className={`text-[10px] font-extrabold flex items-center ${
                          diff > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {diff > 0 ? <ArrowUp className="h-2.5 w-2.5 inline" /> : <ArrowDown className="h-2.5 w-2.5 inline" />}
                        {Math.abs(diff)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Special Affixes & Enchants */}
      {item.affixes && item.affixes.length > 0 && (
        <div className="relative z-10 rounded-xl border border-amber-500/20 bg-amber-950/20 p-2.5 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" /> Mythic Affixes
          </div>
          <div className="space-y-0.5">
            {item.affixes.map((affix, idx) => (
              <div key={idx} className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                <span className="text-amber-400">✦</span>
                <span>
                  {affix.stat}: +{affix.value}
                  {affix.isPercentage ? '%' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-By-Side Comparison Card Header if comparing items */}
      {comparedItem && (
        <div className="relative z-10 rounded-xl border border-slate-800 bg-slate-950/90 p-2.5 space-y-1 text-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Comparing with Currently Equipped ({formatSlotName(item.slot)}):
          </div>
          <div className="flex items-center justify-between">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <span className="text-lg">{comparedItem.icon}</span>
              <span>
                {comparedItem.name} {comparedItem.enchantLevel > 0 ? `+${comparedItem.enchantLevel}` : ''}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 capitalize">[{comparedItem.rarity}]</span>
          </div>
        </div>
      )}

      {/* Item Lore & Description */}
      <div className="relative z-10 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Item Details & Lore</div>
        <p className="text-xs text-slate-300 italic leading-relaxed">{item.description}</p>
      </div>

      {/* Footer: Gold Value & Quantity */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-amber-300">
          <Coins className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-bold">Value: {item.valueGold?.toLocaleString() || 0} Gold</span>
        </div>

        {((item.quantity && item.quantity > 1) || item.stackable) && (
          <div className="text-slate-400 font-sans text-[11px]">
            Stack Quantity: <span className="font-bold text-slate-200">x{(item.quantity || 1).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Action Buttons if Enabled */}
      {showActions && (
        <div className="relative z-10 flex items-center gap-2 pt-1">
          {onEquip && levelSufficient && (
            <button
              onClick={onEquip}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Sword className="h-4 w-4" />
              <span>{actionButtonLabel || 'Equip Item'}</span>
            </button>
          )}

          {onUnequip && (
            <button
              onClick={onUnequip}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Shield className="h-4 w-4 text-slate-400" />
              <span>Unequip</span>
            </button>
          )}

          {onDismantle && (
            <button
              onClick={onDismantle}
              className="flex items-center justify-center gap-1 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
            >
              <span>Dismantle</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
