import React, { useState } from 'react';
import { Character, Item } from '../types/game';
import { getEnchantSuccessRate } from '../utils/formulas';
import {
  Hammer,
  Sparkles,
  AlertTriangle,
  CheckSquare,
  Square,
  Layers,
  X,
  Flame,
  ShieldCheck,
  Zap,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  Check,
  Coins,
} from 'lucide-react';
import { ErrorNoticeModal } from './ErrorNoticeModal';
import { ItemStatCard, RARITY_STYLES, getEnchantLevelStyles } from './ItemStatCard';
import { PoECraftingBench } from './equipment/PoECraftingBench';
import { audio } from '../utils/audio';

interface BlacksmithViewProps {
  character: Character;
  onEnchantSubmit: (item: Item) => Promise<{
    success?: boolean;
    newLevel?: number;
    item?: Item;
    goldRemaining?: number;
    error?: string;
  } | void>;
  onSmartFuseSubmit: () => void;
  onNavigateToDungeon?: () => void;
  onUpdateCharacter?: (updated: Partial<Character>) => void;
}

export const BlacksmithView: React.FC<BlacksmithViewProps> = ({
  character,
  onEnchantSubmit,
  onSmartFuseSubmit,
  onNavigateToDungeon,
  onUpdateCharacter,
}) => {
  const [selectedEnchantItem, setSelectedEnchantItem] = useState<Item | null>(null);
  const [confirmRisk, setConfirmRisk] = useState(false);
  const [activeTab, setActiveTab] = useState<'poeCraft' | 'enchant' | 'fuse'>('poeCraft');

  // Forging strike state & result prompt state
  const [isStriking, setIsStriking] = useState(false);
  const [enchantResult, setEnchantResult] = useState<{
    isOpen: boolean;
    success: boolean;
    oldLevel: number;
    newLevel: number;
    item: Item;
  } | null>(null);

  // Error Modal State
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

  const gearItems = character.inventory.filter(
    (i): i is Item =>
      Boolean(i && (i.type === 'gear' || (i as any).type === 'weapon' || (i as any).type === 'armor' || Boolean(i.slot)) && i.slot !== 'familiar' && i.type !== 'box' && (!i.name || !i.name.includes('Pet Seal')))
  );

  const currentLevel = selectedEnchantItem?.enchantLevel || 0;
  const successRate = getEnchantSuccessRate(currentLevel);
  const costGold = 500 * (currentLevel + 1);

  const handleEnchantClick = async () => {
    if (!selectedEnchantItem || isStriking) return;

    if (character.gold < costGold) {
      setErrorModal({
        isOpen: true,
        title: 'Insufficient Gold for Enchantment!',
        message: `Attempting to enchant "${selectedEnchantItem.name}" to +${currentLevel + 1} requires ${costGold.toLocaleString()} Gold, but you currently only have ${character.gold.toLocaleString()} Gold in your pouch.`,
        requiredGold: costGold,
        currentGold: character.gold,
      });
      return;
    }

    const oldLevel = selectedEnchantItem.enchantLevel || 0;

    // Trigger Anvil Strike Animation
    setIsStriking(true);
    try {
      audio.playAttack();
    } catch {
      // Audio fallback
    }

    // Wait 1 second for anvil strike animation
    setTimeout(async () => {
      const res = await onEnchantSubmit(selectedEnchantItem);
      setIsStriking(false);

      if (res && res.error) {
        setErrorModal({
          isOpen: true,
          title: 'Enchantment Failed',
          message: res.error,
        });
        return;
      }

      if (res && res.item) {
        const isSuccess = Boolean(res.success);
        const newLv = res.newLevel ?? (isSuccess ? oldLevel + 1 : 0);

        try {
          if (isSuccess) {
            audio.playVictory();
          }
        } catch {
          // Audio fallback
        }

        // Update local selected item state
        setSelectedEnchantItem(res.item);

        // Open custom Enchantment Prompt Modal
        setEnchantResult({
          isOpen: true,
          success: isSuccess,
          oldLevel,
          newLevel: newLv,
          item: res.item,
        });
      }
    }, 1000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-2xl space-y-4 text-slate-100 relative">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-2 text-amber-400">
            <Hammer className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              Blacksmith Forge & Anvil
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-sans font-semibold border border-amber-500/30">
                Max +20
              </span>
            </h2>
            <p className="text-xs text-slate-400">Crafting, Tier Fusion, and High-Tier Equipment Upgrades</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('poeCraft')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'poeCraft'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hammer className="h-3.5 w-3.5" />
            <span>Alchemy & Reforging</span>
          </button>
          <button
            onClick={() => setActiveTab('enchant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'enchant'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>+20 Enchantment</span>
          </button>
          <button
            onClick={() => setActiveTab('fuse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'fuse'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Smart Fill Fusion</span>
          </button>
        </div>
      </div>

      {/* TAB 0: ALCHEMY CRAFTING BENCH */}
      {activeTab === 'poeCraft' && (
        <PoECraftingBench
          inventory={character.inventory}
          onUpdateInventory={(updatedInv) => {
            onUpdateCharacter?.({ inventory: updatedInv });
          }}
          gold={character.gold}
          onDeductGold={(amt) => {
            onUpdateCharacter?.({ gold: Math.max(0, character.gold - amt) });
          }}
        />
      )}

      {/* TAB 1: ENCHANTMENT */}
      {activeTab === 'enchant' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Item */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                Select Gear to Enchant ({gearItems.length})
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Gold: <span className="text-amber-300 font-bold">{character.gold.toLocaleString()}</span>
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {gearItems.map((item) => {
                const rStyle = RARITY_STYLES[item.rarity || 'common'];
                const eStyle = getEnchantLevelStyles(item.enchantLevel || 0);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedEnchantItem(item);
                      setConfirmRisk(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-xs text-left transition-all cursor-pointer ${
                      selectedEnchantItem?.id === item.id
                        ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold ring-1 ring-amber-400/50'
                        : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`relative flex items-center justify-center h-10 w-10 rounded-xl border ${rStyle.border} ${eStyle.ringColor} bg-slate-900 shrink-0`}>
                        <span className="text-xl">{item.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate text-slate-100 flex items-center gap-1">
                          <span className="truncate">{item.name}</span>
                          {item.enchantLevel > 0 && (
                            <span className={`text-[11px] font-extrabold ${eStyle.textColor}`}>
                              +{item.enchantLevel}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {item.rarity} • {item.slot ? item.slot.toUpperCase() : 'GEAR'}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2 text-right">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase font-bold ${eStyle.badgeBg}`}>
                        +{item.enchantLevel}
                      </span>
                    </div>
                  </button>
                );
              })}

              {gearItems.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs font-serif">
                  No equipment found in inventory. Clear dungeons to acquire gear for the forge!
                </div>
              )}
            </div>
          </div>

          {/* Enchantment Details & Anvil Action */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Anvil Forge Chamber
            </h3>

            {selectedEnchantItem ? (
              <div className="space-y-3.5 text-xs">
                {/* Detailed RPG Item Stat Card */}
                <ItemStatCard item={selectedEnchantItem} characterLevel={character.level} />

                {/* Target Upgrade Stats Preview Panel */}
                <div className="rounded-xl border border-amber-500/30 bg-slate-950/90 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-amber-400" /> Target Level Upgrade
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <span>+{currentLevel}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-amber-300 text-sm">+{currentLevel + 1}</span>
                    </span>
                  </div>

                  {/* Success Rate Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Success Rate:</span>
                      <span className={`font-mono font-extrabold ${successRate >= 0.7 ? 'text-emerald-400' : successRate >= 0.4 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {(successRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          successRate >= 0.7
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-500'
                            : successRate >= 0.4
                            ? 'bg-amber-500 shadow-sm shadow-amber-500'
                            : 'bg-rose-500 shadow-sm shadow-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, successRate * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="flex items-center justify-between text-xs pt-1 font-mono">
                    <span className="text-slate-400">Enchantment Fee:</span>
                    <span className={`font-bold ${character.gold >= costGold ? 'text-amber-300' : 'text-rose-400'}`}>
                      {costGold.toLocaleString()} Gold
                    </span>
                  </div>

                  {/* Risk Tier Badge */}
                  <div className="pt-1">
                    {currentLevel < 3 ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span><strong>Safe Tier (+0 to +3):</strong> 100% Guaranteed Success / Zero penalty.</span>
                      </div>
                    ) : currentLevel < 10 ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                        <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span><strong>Refined Tier (+4 to +9):</strong> Failure resets level back to +0.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                        <Flame className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        <span><strong>Master Tier (+10 to +20):</strong> High failure risk. Level resets to +0 on fail.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* High Risk Confirmation for +10 and above */}
                {currentLevel >= 10 && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-rose-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                      <AlertTriangle className="h-4 w-4 text-rose-400" /> High Risk Enchantment Acknowledgment
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-300/90">
                      Failing an enchantment above +10 resets your equipment level to +0.
                    </p>
                    <button
                      onClick={() => setConfirmRisk(!confirmRisk)}
                      className="flex items-center gap-2 text-xs font-semibold hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      {confirmRisk ? (
                        <CheckSquare className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-500" />
                      )}
                      <span>I accept the risk of reset on failure.</span>
                    </button>
                  </div>
                )}

                {/* Strike Anvil Button */}
                <button
                  disabled={isStriking || (currentLevel >= 10 && !confirmRisk)}
                  onClick={handleEnchantClick}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black tracking-wide uppercase transition-all shadow-xl cursor-pointer ${
                    isStriking
                      ? 'bg-amber-600 text-slate-950 animate-pulse'
                      : currentLevel >= 10 && !confirmRisk
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 hover:brightness-110 shadow-amber-500/30 hover:scale-[1.01]'
                  }`}
                >
                  {isStriking ? (
                    <>
                      <Hammer className="h-5 w-5 animate-spin text-slate-950" />
                      <span>Striking Anvil Sparks...</span>
                    </>
                  ) : (
                    <>
                      <Hammer className="h-4 w-4" />
                      <span>Strike Anvil & Enchant (+{currentLevel + 1})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs font-serif space-y-2">
                <Hammer className="h-8 w-8 text-slate-700 mx-auto" />
                <p>Select equipment from your inventory list to inspect forge parameters and strike the anvil!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SMART FILL FUSION */}
      {activeTab === 'fuse' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-amber-200">
            Smart Fill Tier Fusion (8 Duplicates Required)
          </h3>
          <p className="max-w-md mx-auto text-xs text-slate-300 leading-relaxed">
            Automatically scans your inventory for 8 matching duplicate items of the same tier and merges them into 1 higher-tier equipment piece with upgraded stat slots!
          </p>

          <button
            onClick={onSmartFuseSubmit}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-xs font-extrabold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> Auto-Detect & Fuse 8 Duplicates
          </button>
        </div>
      )}

      {/* ENCHANTMENT RESULT PROMPT MODAL */}
      {enchantResult?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center overflow-hidden">
            {/* Background Glow */}
            <div
              className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${
                enchantResult.success ? 'from-amber-500/30 via-emerald-500/10' : 'from-rose-500/30 via-rose-950/10'
              } opacity-50 pointer-events-none`}
            />

            <button
              onClick={() => setEnchantResult(null)}
              className="absolute top-3 right-3 z-10 rounded-lg bg-slate-950/80 p-1.5 text-slate-400 hover:text-slate-100 border border-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {enchantResult.success ? (
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-xl shadow-amber-500/40 animate-bounce">
                  <Sparkles className="h-8 w-8" />
                </div>

                <div>
                  <h3 className="font-serif text-xl font-black text-amber-200 tracking-wide uppercase">
                    ✨ Enchantment Success! ✨
                  </h3>
                  <p className="text-xs text-amber-300/90 font-medium mt-1">
                    The forge anvil glows brightly! Your equipment has been empowered.
                  </p>
                </div>

                {/* Level Up Banner */}
                <div className="rounded-xl border border-amber-500/40 bg-slate-950/90 p-3 flex items-center justify-center gap-3">
                  <span className="text-2xl">{enchantResult.item.icon}</span>
                  <div>
                    <div className="font-bold text-amber-200 text-sm">{enchantResult.item.name}</div>
                    <div className="text-xs font-mono font-black text-emerald-400 flex items-center justify-center gap-2 mt-0.5">
                      <span className="text-slate-400 line-through">+{enchantResult.oldLevel}</span>
                      <ArrowRight className="h-3 w-3 text-amber-400" />
                      <span className="text-amber-300 text-base">+{enchantResult.newLevel}</span>
                    </div>
                  </div>
                </div>

                <ItemStatCard item={enchantResult.item} characterLevel={character.level} />

                <button
                  onClick={() => setEnchantResult(null)}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-black text-slate-950 uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/30 cursor-pointer"
                >
                  Accept & Continue
                </button>
              </div>
            ) : (
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rose-950 border-2 border-rose-500 text-rose-400 shadow-xl shadow-rose-900/40">
                  <Flame className="h-8 w-8 animate-pulse" />
                </div>

                <div>
                  <h3 className="font-serif text-xl font-black text-rose-300 tracking-wide uppercase">
                    💀 Enchantment Failed 💀
                  </h3>
                  <p className="text-xs text-rose-300/90 font-medium mt-1">
                    The magic within the anvil violently recoiled! Your gear level has reset to +0.
                  </p>
                </div>

                <div className="rounded-xl border border-rose-500/40 bg-slate-950/90 p-3 flex items-center justify-center gap-3">
                  <span className="text-2xl">{enchantResult.item.icon}</span>
                  <div>
                    <div className="font-bold text-slate-200 text-sm">{enchantResult.item.name}</div>
                    <div className="text-xs font-mono font-bold text-rose-400 mt-0.5">
                      Reset to +0
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEnchantResult(null)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  Close & Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Notice Modal */}
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

