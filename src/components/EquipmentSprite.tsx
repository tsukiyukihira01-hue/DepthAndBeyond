import React from 'react';
import { Item, EquipmentSlot, Rarity } from '../types/game';
import { getEnchantLevelStyles } from './ItemStatCard';

interface EquipmentSpriteProps {
  slot: EquipmentSlot;
  item?: Item | null;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const slotDefaultIcons: Record<EquipmentSlot, string> = {
  head: '🪖',
  amulet: '📿',
  body: '🛡️',
  mainHand: '⚔️',
  offHand: '🛡️',
  arms: '🥊',
  legs: '🦿',
  ring: '💍',
  familiar: '🦅',
  mount: '🦄',
  wing: '🪽',
  costume: '🥋',
};

const slotNames: Record<EquipmentSlot, string> = {
  head: 'Helmet',
  amulet: 'Amulet',
  body: 'Chest Guard',
  mainHand: 'Main Weapon',
  offHand: 'Offhand Shield',
  arms: 'Gauntlets',
  legs: 'Greaves',
  ring: 'Ring',
  familiar: 'Pet Familiar',
  mount: 'Mount',
  wing: 'Wings Artifact',
  costume: 'Attire',
};

const rarityStyles: Record<Rarity, { border: string; bg: string; text: string; glow: string }> = {
  garbage: {
    border: 'border-slate-800',
    bg: 'bg-slate-950/80',
    text: 'text-slate-400',
    glow: '',
  },
  common: {
    border: 'border-slate-700',
    bg: 'bg-slate-900/90',
    text: 'text-slate-200',
    glow: '',
  },
  uncommon: {
    border: 'border-emerald-600/80',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-500/20 shadow-md',
  },
  rare: {
    border: 'border-sky-500/90',
    bg: 'bg-sky-950/50',
    text: 'text-sky-300',
    glow: 'shadow-sky-500/30 shadow-md',
  },
  epic: {
    border: 'border-purple-500/90',
    bg: 'bg-purple-950/50',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/40 shadow-lg',
  },
  legendary: {
    border: 'border-amber-400',
    bg: 'bg-amber-950/60',
    text: 'text-amber-200',
    glow: 'shadow-amber-500/50 shadow-xl ring-1 ring-amber-400/30',
  },
  mythical: {
    border: 'border-fuchsia-400',
    bg: 'bg-fuchsia-950/60',
    text: 'text-fuchsia-200',
    glow: 'shadow-fuchsia-500/60 shadow-2xl animate-pulse ring-1 ring-fuchsia-400/40',
  },
  godly: {
    border: 'border-rose-400 ring-2 ring-amber-400/60',
    bg: 'bg-gradient-to-br from-rose-950/80 via-amber-950/80 to-purple-950/80',
    text: 'text-rose-200 font-extrabold',
    glow: 'shadow-rose-500/70 shadow-2xl ring-2 ring-rose-400/50 animate-pulse',
  },
};

export const EquipmentSprite: React.FC<EquipmentSpriteProps> = ({
  slot,
  item,
  label,
  size = 'md',
  onClick,
  className = '',
}) => {
  const style = item?.rarity ? rarityStyles[item.rarity] : rarityStyles.garbage;
  const enchantStyle = getEnchantLevelStyles(item?.enchantLevel || 0);

  const sizeDimensions = {
    sm: 'h-10 w-10 text-xl',
    md: 'h-12 w-12 text-2xl',
    lg: 'h-16 w-16 text-3xl',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group relative flex flex-col items-center justify-center rounded-2xl border transition-all duration-200 ${sizeDimensions} ${style.border} ${style.bg} ${style.glow} ${
        onClick ? 'hover:scale-105 hover:border-amber-400 cursor-pointer' : 'cursor-default'
      } ${className}`}
      title={item ? `${item.name} (+${item.enchantLevel || 0}) (${item.rarity.toUpperCase()})` : label || slotNames[slot]}
    >
      {/* Background Frame Ornament */}
      <div className="absolute inset-0.5 rounded-xl border border-white/5 pointer-events-none" />

      {/* Main Icon Sprite */}
      <span className={`relative z-10 transition-transform group-hover:scale-110 drop-shadow-md ${enchantStyle.flameEffect}`}>
        {item ? item.icon : slotDefaultIcons[slot]}
      </span>

      {/* Enchantment Badge */}
      {item && item.enchantLevel > 0 && (
        <span className={`absolute -top-2 -right-2 z-20 rounded-full px-1.5 py-0.2 font-mono text-[9px] font-black shadow-md border border-slate-950 ${enchantStyle.badgeBg}`}>
          +{item.enchantLevel}
        </span>
      )}

      {/* Empty Slot Watermark Label */}
      {!item && (
        <span className="absolute bottom-0.5 text-[8px] uppercase tracking-wider text-slate-600 font-extrabold select-none truncate max-w-[90%]">
          {label || slotNames[slot]}
        </span>
      )}
    </button>
  );
};
