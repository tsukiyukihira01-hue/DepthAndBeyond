import React, { useState } from 'react';
import { Character, EquipmentSlot, CharacterStats, Item } from '../types/game';
import { EquipmentSprite } from './EquipmentSprite';
import { Shield, Sparkles, User, Plus, RefreshCw, Zap, Eye, X, Layers } from 'lucide-react';
import { ItemStatCard } from './ItemStatCard';
import { getClassDefinition } from '../data/classesAndArchetypes';
import { PoESocketModal } from './equipment/PoESocketModal';

interface CharacterSheetProps {
  character: Character;
  onAllocatePoint: (statKey: keyof CharacterStats) => void;
  onSwitchLoadout: (spec: 'A' | 'B') => void;
  onUnequipItem?: (slot: EquipmentSlot) => void;
  onResetStats?: () => void;
  onUpdateCharacter?: (updated: Partial<Character>) => void;
}

const ALL_SLOTS: EquipmentSlot[] = [
  'head',
  'amulet',
  'body',
  'mainHand',
  'offHand',
  'arms',
  'legs',
  'ring',
  'familiar',
  'mount',
  'wing',
  'costume',
];

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  onAllocatePoint,
  onSwitchLoadout,
  onUnequipItem,
  onResetStats,
  onUpdateCharacter,
}) => {
  const [inspectedItem, setInspectedItem] = useState<{ slot: EquipmentSlot; item: Item } | null>(null);
  const [socketModalItem, setSocketModalItem] = useState<Item | null>(null);

  const currentEquipment =
    character.loadoutSpec === 'A' ? character.equipment : character.specBEquipment || character.equipment;

  const classDef = getClassDefinition(character.characterClass);
  const expPct = Math.min(100, Math.round((character.exp / character.maxExp) * 100));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl space-y-4 text-slate-100">
      {/* Header & Spec Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-amber-400" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-lg font-bold text-amber-200">
                {character.name} — Character Sheet
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${classDef.typeBadgeColor}`}>
                {classDef.typeTitle}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Level {character.level} • <span className="font-bold text-amber-300">{classDef.name}</span> ({character.archetype || 'Tactical Commander'}) • {character.faction} Faction
            </p>
          </div>
        </div>

        {/* Loadout Preset Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
          <button
            onClick={() => onSwitchLoadout('A')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              character.loadoutSpec === 'A'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Spec A
          </button>
          <button
            onClick={() => onSwitchLoadout('B')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              character.loadoutSpec === 'B'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Spec B
          </button>
        </div>
      </div>

      {/* Prominent Visible EXP Progress Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-3 space-y-1.5 shadow-md">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-amber-300 font-serif flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Level {character.level} Experience Progress
          </span>
          <span className="text-amber-200 font-mono font-bold">{expPct}%</span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden border border-amber-950">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-300 shadow-sm"
            style={{ width: `${expPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Current XP: <strong className="text-amber-200">{character.exp.toLocaleString()}</strong></span>
          <span>Next Level: <strong className="text-slate-200">{character.maxExp.toLocaleString()} XP</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Attribute Stats & Growth */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" /> Character Attributes
            </h3>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${classDef.typeBadgeColor}`}>
              {classDef.characterType.toUpperCase()} GROWTH
            </span>
          </div>

          <div className="rounded-lg bg-amber-950/20 border border-amber-500/20 p-2 text-[11px] text-amber-200/90 leading-relaxed">
            💡 <strong>{classDef.name} ({classDef.typeTitle}):</strong> Base attributes are automatically assigned by the system upon level up based on class type (e.g. +2 {classDef.primaryStat.toUpperCase()} every level)!
          </div>

          {/* Stat List */}
          <div className="space-y-2 text-xs">
            {[
              { key: 'str', name: 'STR (Strength)', desc: 'Physical damage scaling' },
              { key: 'def', name: 'DEF (Defense)', desc: 'Physical damage reduction' },
              { key: 'int', name: 'INT (Intelligence)', desc: 'Magic damage & MP' },
              { key: 'wis', name: 'WIS (Wisdom)', desc: 'Magic defense & MP regen' },
              { key: 'spd', name: 'SPD (Speed)', desc: 'Turn order & hit chance' },
              { key: 'dex', name: 'DEX (Dexterity)', desc: 'Evasion chance & crit' },
            ].map(({ key, name, desc }) => {
              const statVal = (character.stats[key as keyof CharacterStats] as number) || 0;
              const isPrimary = classDef.primaryStat === key;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-xl border p-2.5 ${
                    isPrimary
                      ? 'border-amber-500/40 bg-amber-950/30'
                      : 'border-slate-800 bg-slate-950/80'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{name}</span>
                      {isPrimary && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                          PRIMARY (+2/lvl)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{desc}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300 text-sm">{statVal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 12 Equipment Slots */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-amber-400" /> Equipped Gears (12 Slots)
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {ALL_SLOTS.map((slotKey) => {
              const item = currentEquipment[slotKey];

              return (
                <div
                  key={slotKey}
                  onClick={() => item && setInspectedItem({ slot: slotKey, item })}
                  className={`group flex items-center justify-between gap-2 rounded-xl border p-2 text-xs transition-all ${
                    item
                      ? 'border-amber-500/40 bg-amber-950/20 text-amber-100 hover:border-amber-400 shadow-sm cursor-pointer'
                      : 'border-slate-800 bg-slate-950/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <EquipmentSprite slot={slotKey} item={item} size="sm" />
                    <div className="overflow-hidden min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold capitalize truncate">
                        {slotKey.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div className="font-bold text-slate-200 text-[11px] truncate flex items-center gap-1">
                        <span>{item ? `${item.name} ${item.enchantLevel > 0 ? `+${item.enchantLevel}` : ''}` : 'Empty Slot'}</span>
                        {item && <Eye className="h-3 w-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </div>
                  </div>

                  {item && onUnequipItem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnequipItem(slotKey);
                        if (inspectedItem?.slot === slotKey) setInspectedItem(null);
                      }}
                      className="rounded-lg bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 px-2 py-1 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer shrink-0 border border-slate-700"
                      title="Unequip back to inventory"
                    >
                      Unequip
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Equipped Item Detailed Inspection Modal */}
      {inspectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md space-y-2">
            <div className="flex items-center justify-between">
              {inspectedItem.item.sockets && inspectedItem.item.sockets.length > 0 && (
                <button
                  onClick={() => setSocketModalItem(inspectedItem.item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/60 text-amber-200 text-xs font-bold hover:bg-amber-900/80 cursor-pointer transition-all shadow-md"
                >
                  <Layers className="h-4 w-4 text-amber-400" />
                  <span>Manage Sockets & Skill Gems</span>
                </button>
              )}

              <button
                onClick={() => setInspectedItem(null)}
                className="ml-auto rounded-lg bg-slate-900/90 p-1.5 text-slate-400 hover:text-slate-100 border border-slate-700 cursor-pointer"
                title="Close item detail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ItemStatCard
              item={inspectedItem.item}
              characterLevel={character.level}
              showActions={true}
              onUnequip={onUnequipItem ? () => {
                onUnequipItem(inspectedItem.slot);
                setInspectedItem(null);
              } : undefined}
            />
          </div>
        </div>
      )}

      {/* PoE Socket Modal */}
      {socketModalItem && (
        <PoESocketModal
          item={socketModalItem}
          onClose={() => setSocketModalItem(null)}
          onUpdateItemSockets={(updatedItem) => {
            setSocketModalItem(updatedItem);
            if (inspectedItem) {
              setInspectedItem({ ...inspectedItem, item: updatedItem });
            }
            if (onUpdateCharacter) {
              const currentEq = { ...currentEquipment };
              if (inspectedItem?.slot) {
                currentEq[inspectedItem.slot] = updatedItem;
              }
              if (character.loadoutSpec === 'A') {
                onUpdateCharacter({ equipment: currentEq });
              } else {
                onUpdateCharacter({ specBEquipment: currentEq });
              }
            }
          }}
        />
      )}
    </div>
  );
};
