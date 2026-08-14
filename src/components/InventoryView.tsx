import React, { useState } from 'react';
import { Character, Item, EquipmentSlot, CharacterStats } from '../types/game';
import { Package, X, Layers, ArrowUp, ArrowDown } from 'lucide-react';
import { ItemStatCard, RARITY_STYLES, getEnchantLevelStyles, getItemEffectiveStats } from './ItemStatCard';
import { PoESocketModal } from './equipment/PoESocketModal';

interface InventoryViewProps {
  character: Character;
  onEquipItem: (item: Item) => void;
  onUnequipItem?: (slot: EquipmentSlot) => void;
  onDismantleItem: (item: Item) => void;
  onUpdateInventory?: (inv: (Item | null)[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  character,
  onEquipItem,
  onDismantleItem,
  onUpdateInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'gear' | 'core' | 'consumable' | 'material'>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [socketModalItem, setSocketModalItem] = useState<Item | null>(null);
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);

  // Filter inventory items by active tab category
  const filteredItems = character.inventory.filter((item): item is Item => {
    if (!item) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'gear') return item.type === 'gear' || (item as any).type === 'weapon' || (item as any).type === 'armor' || Boolean(item.slot);
    if (activeTab === 'core') return item.type === 'core' || item.type === 'stone';
    if (activeTab === 'consumable') return item.type === 'consumable' || item.type === 'box' || item.type === 'voucher';
    if (activeTab === 'material') return item.type === 'material';
    return true;
  });

  const equippedComparisonItem = selectedItem?.slot ? character.equipment[selectedItem.slot as EquipmentSlot] : null;

  // Hover comparison data
  const hoveredDerived = hoveredItem ? getItemEffectiveStats(hoveredItem) : null;
  const hoveredEquippedItem = hoveredItem?.slot ? character.equipment[hoveredItem.slot as EquipmentSlot] : null;
  const hoveredEquippedDerived = hoveredEquippedItem ? getItemEffectiveStats(hoveredEquippedItem) : null;
  const statKeys: (keyof CharacterStats)[] = ['str', 'def', 'int', 'wis', 'spd', 'dex', 'maxHp', 'maxMana'];
  const statLabels: Record<string, string> = {
    str: 'Strength',
    def: 'Defense',
    int: 'Intelligence',
    wis: 'Wisdom',
    spd: 'Speed',
    dex: 'Dexterity',
    maxHp: 'Max HP',
    maxMana: 'Max Mana',
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl space-y-4 text-slate-100">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200">
              Inventory & Storage ({filteredItems.length} Items • Unlimited Capacity)
            </h2>
            <p className="text-xs text-slate-400">Unlimited Dynamic Storage System</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            [All]
          </button>
          <button
            onClick={() => setActiveTab('gear')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'gear' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            [Gear]
          </button>
          <button
            onClick={() => setActiveTab('core')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'core' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            [Cores/Stones]
          </button>
          <button
            onClick={() => setActiveTab('consumable')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'consumable' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            [Consumables]
          </button>
          <button
            onClick={() => setActiveTab('material')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'material' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            [Mats/Quests]
          </button>
        </div>
      </div>

      {/* Grid of Inventory Slots */}
      <div className="relative grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-80 overflow-y-auto p-1">
        {filteredItems.map((item) => {
          const rStyle = RARITY_STYLES[item.rarity || 'common'];
          const eStyle = getEnchantLevelStyles(item.enchantLevel || 0);

          return (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`group relative flex flex-col items-center justify-center rounded-xl border p-2 aspect-square transition-all cursor-pointer ${
                selectedItem?.id === item.id
                  ? 'border-amber-400 bg-amber-950/60 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                  : `${rStyle.border} bg-slate-900/90 hover:brightness-110`
              }`}
            >
              <span className={`text-2xl ${eStyle.flameEffect}`}>{item.icon}</span>
              <span className="text-[10px] font-bold text-slate-200 truncate w-full text-center mt-1">
                {item.name}
              </span>

              {item.enchantLevel > 0 && (
                <span className={`absolute top-1 right-1 rounded-full px-1 py-0.2 text-[9px] ${eStyle.badgeBg}`}>
                  +{item.enchantLevel}
                </span>
              )}

              {((item.quantity && item.quantity > 1) || item.stackable) && (
                <span className="absolute bottom-1 right-1 rounded-md bg-amber-500/90 px-1 py-0.5 text-[9px] font-black text-slate-950 shadow">
                  x{item.quantity ? item.quantity.toLocaleString() : 1}
                </span>
              )}
            </button>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 text-xs font-serif">
            No items found in this category slot.
          </div>
        )}

        {/* Floating Hover Comparison Tooltip Popup */}
        {hoveredItem && (
          <div className="absolute z-50 pointer-events-none bg-slate-950/95 border border-amber-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md w-72 text-xs space-y-2 left-4 bottom-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-2xl">{hoveredItem.icon}</span>
              <div className="truncate">
                <div className="font-serif font-bold text-amber-200 truncate">
                  {hoveredItem.name} {hoveredItem.enchantLevel ? `+${hoveredItem.enchantLevel}` : ''}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {hoveredItem.rarity} • {hoveredItem.slot ? hoveredItem.slot.toUpperCase() : hoveredItem.type}
                </div>
              </div>
            </div>

            {hoveredDerived?.isGear && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Stat Comparison vs Equipped ({hoveredItem.slot ? hoveredItem.slot.toUpperCase() : 'Gear'}):
                </div>
                {statKeys.map((key) => {
                  const hoverVal = hoveredDerived.totalStats[key] || 0;
                  const equipVal = hoveredEquippedDerived ? (hoveredEquippedDerived.totalStats[key] || 0) : 0;
                  if (hoverVal === 0 && equipVal === 0) return null;
                  const diff = hoverVal - equipVal;
                  return (
                    <div key={key} className="flex items-center justify-between font-mono">
                      <span className="text-slate-300">{statLabels[key]}:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={hoverVal >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                          {hoverVal > 0 ? `+${hoverVal}` : hoverVal}
                        </span>
                        {hoveredEquippedItem && diff !== 0 && (
                          <span
                            className={`text-[10px] flex items-center font-extrabold ${
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
            )}

            {hoveredEquippedItem ? (
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 truncate">
                Equipped: <span className="text-slate-200 font-bold">{hoveredEquippedItem.name}</span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 italic">
                Slot currently empty.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Inspection & Side-By-Side Comparison Modal */}
      {selectedItem && (
        <div className="relative pt-2 space-y-2">
          <div className="flex items-center justify-between">
            {selectedItem.sockets && selectedItem.sockets.length > 0 && (
              <button
                onClick={() => setSocketModalItem(selectedItem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/60 text-amber-200 text-xs font-bold hover:bg-amber-900/80 cursor-pointer transition-all shadow-md"
              >
                <Layers className="h-4 w-4 text-amber-400" />
                <span>Manage Sockets & Skill Gems</span>
              </button>
            )}

            <button
              onClick={() => setSelectedItem(null)}
              className="ml-auto rounded-lg bg-slate-900/80 p-1.5 text-slate-400 hover:text-slate-100 border border-slate-700 cursor-pointer"
              title="Close item view"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ItemStatCard
            item={selectedItem}
            comparedItem={equippedComparisonItem}
            characterLevel={character.level}
            showActions={true}
            onEquip={(selectedItem.type === 'gear' || (selectedItem as any).type === 'weapon' || (selectedItem as any).type === 'armor' || Boolean(selectedItem.slot)) ? () => {
              onEquipItem(selectedItem);
              setSelectedItem(null);
            } : undefined}
            onDismantle={() => {
              onDismantleItem(selectedItem);
              setSelectedItem(null);
            }}
            actionButtonLabel="Equip Gear"
          />
        </div>
      )}

      {/* PoE Socket Modal */}
      {socketModalItem && (
        <PoESocketModal
          item={socketModalItem}
          onClose={() => setSocketModalItem(null)}
          onUpdateItemSockets={(updatedItem) => {
            setSocketModalItem(updatedItem);
            setSelectedItem(updatedItem);
            if (onUpdateInventory) {
              const newInv = character.inventory.map((i) => (i?.id === updatedItem.id ? updatedItem : i));
              onUpdateInventory(newInv);
            }
          }}
        />
      )}
    </div>
  );
};
