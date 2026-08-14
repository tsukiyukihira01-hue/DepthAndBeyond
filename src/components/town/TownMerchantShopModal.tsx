import React, { useState } from 'react';
import { Character, Item } from '../../types/game';
import { GENERAL_STORE_ITEMS } from '../../data/townsData';
import { addItemToInventory, sanitizeAndStackInventory } from '../../utils/formulas';
import { Store, Coins, ShoppingBag, X, Check, AlertCircle } from 'lucide-react';

interface TownMerchantShopModalProps {
  character: Character;
  onClose: () => void;
  onUpdateCharacter: (char: Character) => void;
}

export const TownMerchantShopModal: React.FC<TownMerchantShopModalProps> = ({
  character,
  onClose,
  onUpdateCharacter,
}) => {
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const handleBuyItem = (storeItem: typeof GENERAL_STORE_ITEMS[0]) => {
    setPurchaseSuccess(null);
    setPurchaseError(null);

    const totalCost = storeItem.priceGold * storeItem.quantity;
    if (character.gold < totalCost) {
      setPurchaseError(`Insufficient Gold! Need ${totalCost.toLocaleString()} Gold, but you have ${character.gold.toLocaleString()} Gold.`);
      return;
    }

    const boughtItem: Item = {
      id: `store_item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: storeItem.name,
      description: storeItem.description,
      type: storeItem.type as Item['type'],
      rarity: 'common',
      levelReq: 1,
      enchantLevel: 0,
      valueGold: Math.floor(storeItem.priceGold * 0.5),
      stackable: storeItem.type === 'consumable',
      quantity: storeItem.quantity,
      icon: storeItem.icon,
    };

    const { updatedInventory, addedQuantity } = addItemToInventory(
      character.inventory,
      boughtItem,
      character.inventoryLimit || 64
    );

    if (addedQuantity <= 0) {
      setPurchaseError('Inventory full! Please free up space before purchasing.');
      return;
    }

    const cleanInv = sanitizeAndStackInventory(updatedInventory, character.inventoryLimit || 64);
    onUpdateCharacter({
      ...character,
      gold: character.gold - totalCost,
      inventory: cleanInv,
    });

    setPurchaseSuccess(` Purchased ${storeItem.quantity}x ${storeItem.name} for ${totalCost.toLocaleString()} Gold!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-3xl">
              🛒
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-amber-200">
                Sun City General Goods Merchant
              </h2>
              <p className="text-xs text-slate-400">
                Potions, Travel Rations, Recall Scrolls & Gathering Tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-300">
            <Coins className="h-4 w-4 text-amber-400" />
            <span>{character.gold.toLocaleString()} Gold</span>
          </div>
        </div>

        {/* Feedback Banners */}
        {purchaseSuccess && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/80 p-3 text-xs font-bold text-emerald-200 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{purchaseSuccess}</span>
          </div>
        )}
        {purchaseError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/80 p-3 text-xs font-bold text-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <span>{purchaseError}</span>
          </div>
        )}

        {/* Store Catalog */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GENERAL_STORE_ITEMS.map((item) => {
            const totalPrice = item.priceGold * item.quantity;
            const canAfford = character.gold >= totalPrice;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 hover:border-amber-500/40 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/20">
                      x{item.quantity} Pack
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-200">{item.name}</h4>
                  <p className="text-xs text-slate-400 leading-snug">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                    <Coins className="h-3.5 w-3.5" /> {totalPrice.toLocaleString()} Gold
                  </div>

                  <button
                    onClick={() => handleBuyItem(item)}
                    disabled={!canAfford}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      canAfford
                        ? 'border border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200'
                        : 'border border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Buy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
