import React, { useState } from 'react';
import { MapNode, GatheringResource } from '../../types/map';
import { Character, Item } from '../../types/game';
import { addItemToInventory, sanitizeAndStackInventory } from '../../utils/formulas';
import { Pickaxe, Sparkles, CheckCircle2, X } from 'lucide-react';

interface GatheringNodeModalProps {
  node: MapNode;
  character: Character;
  onClose: () => void;
  onUpdateCharacter: (char: Character) => void;
}

export const GatheringNodeModal: React.FC<GatheringNodeModalProps> = ({
  node,
  character,
  onClose,
  onUpdateCharacter,
}) => {
  const [selectedResource, setSelectedResource] = useState<GatheringResource | null>(
    node.gatheringResources?.[0] || null
  );
  const [isGathering, setIsGathering] = useState<boolean>(false);
  const [gatherProgress, setGatherProgress] = useState<number>(0);
  const [gatherResult, setGatherResult] = useState<string | null>(null);

  const startGathering = () => {
    if (!selectedResource || isGathering) return;

    setIsGathering(true);
    setGatherProgress(0);
    setGatherResult(null);

    const intervalTime = 100;
    const durationMs = 3000; // 3 seconds gathering animation
    const increment = 100 / (durationMs / intervalTime);

    let progress = 0;
    const timer = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        clearInterval(timer);
        setGatherProgress(100);
        setIsGathering(false);

        // Calculate yield quantity
        const minQty = selectedResource.yieldQuantity[0];
        const maxQty = selectedResource.yieldQuantity[1];
        const qty = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;

        const gatheredItem: Item = {
          id: `item_gather_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: selectedResource.yieldItemName,
          description: `Freshly harvested ${selectedResource.yieldItemName} from map node.`,
          type: 'material',
          rarity: 'uncommon',
          levelReq: 1,
          enchantLevel: 0,
          valueGold: 50,
          stackable: true,
          quantity: qty,
          icon: selectedResource.icon,
        };

        const { updatedInventory, addedQuantity } = addItemToInventory(
          character.inventory,
          gatheredItem,
          character.inventoryLimit || 64
        );

        if (addedQuantity <= 0) {
          setGatherResult('⚠️ Inventory is full! Free up space before harvesting.');
          return;
        }

        const cleanInv = sanitizeAndStackInventory(updatedInventory, character.inventoryLimit || 64);
        onUpdateCharacter({
          ...character,
          inventory: cleanInv,
        });

        setGatherResult(`✨ Success! Harvested ${qty}x ${selectedResource.yieldItemName}!`);
      } else {
        setGatherProgress(progress);
      }
    }, intervalTime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-3xl">
            ⛏️
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-amber-200">
              Resource Harvesting Node
            </h2>
            <p className="text-xs text-slate-400">
              {node.name} Resource Veins
            </p>
          </div>
        </div>

        {/* Gathering Resource Selector */}
        {node.gatheringResources && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Select Resource Vein:</div>
            <div className="space-y-2">
              {node.gatheringResources.map((res) => {
                const isSelected = selectedResource?.id === res.id;
                return (
                  <div
                    key={res.id}
                    onClick={() => setSelectedResource(res)}
                    className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/40 text-amber-100 shadow-md'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{res.icon}</span>
                      <div>
                        <div className="font-bold text-xs">{res.name}</div>
                        <div className="text-[10px] text-slate-400">Yields {res.yieldItemName}</div>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {res.yieldQuantity[0]}-{res.yieldQuantity[1]} Qty
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Bar during Gathering */}
        {isGathering && (
          <div className="space-y-1.5 animate-pulse">
            <div className="flex justify-between text-xs font-bold text-amber-300">
              <span>Harvesting resource vein...</span>
              <span>{Math.round(gatherProgress)}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-amber-950">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100"
                style={{ width: `${gatherProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Result Message */}
        {gatherResult && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/80 p-3 text-xs font-bold text-emerald-200 flex items-center justify-between">
            <span>{gatherResult}</span>
            <button onClick={() => setGatherResult(null)} className="text-slate-400 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={startGathering}
          disabled={isGathering || !selectedResource}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all cursor-pointer ${
            isGathering
              ? 'border border-amber-500/50 bg-amber-950/60 text-amber-300'
              : 'border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20'
          }`}
        >
          <Pickaxe className="h-4 w-4" />
          <span>{isGathering ? 'Harvesting...' : 'Harvest Selected Resource'}</span>
        </button>
      </div>
    </div>
  );
};
