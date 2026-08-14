import React, { useState, useEffect } from 'react';
import { Character, MarketplaceListing, Item } from '../types/game';
import { Store, Gavel, Search, Coins, ShieldAlert, Sparkles, Eye, X, PlusCircle, ArrowRightLeft, Clock, Tag, Package, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorNoticeModal } from './ErrorNoticeModal';
import { ItemStatCard } from './ItemStatCard';
import { addItemToInventory, sanitizeAndStackInventory } from '../utils/formulas';

interface MarketplaceViewProps {
  character: Character;
  onUpdateCharacter?: (updated: Character) => void;
  onNavigateToDungeon?: () => void;
}

const STORAGE_KEY_LISTINGS = 'ge_marketplace_listings_v1';

// Initial default listings
const DEFAULT_LISTINGS: MarketplaceListing[] = [
  {
    id: 'list_01',
    sellerId: 'usr_99',
    sellerName: 'Eisen The Iron',
    item: {
      id: 'item_ge_01',
      name: 'Goddess Blessed Staff',
      description: 'An ancient wooden staff infused with holy leyline mana.',
      type: 'gear',
      slot: 'mainHand',
      rarity: 'epic',
      levelReq: 35,
      enchantLevel: 12,
      valueGold: 50000,
      stackable: false,
      quantity: 1,
      icon: '🪄',
      weaponType: 'magical',
    },
    priceGold: 120000,
    type: 'GE',
    expiresAt: new Date(Date.now() + 13 * 86400000 + 18 * 3600000).toISOString(),
  },
  {
    id: 'list_02',
    sellerId: 'usr_88',
    sellerName: 'Flamme The Mage',
    item: {
      id: 'item_ge_02',
      name: 'Sorrowful Witch Magic Core',
      description: 'Unique raid boss magic core used for grand familiar summoning.',
      type: 'core',
      rarity: 'godly',
      levelReq: 50,
      enchantLevel: 0,
      valueGold: 250000,
      stackable: false,
      quantity: 1,
      icon: '💎',
    },
    priceGold: 500000,
    type: 'AUCTION',
    currentBidTokens: 1500,
    expiresAt: new Date(Date.now() + 10 * 86400000).toISOString(),
  },
  {
    id: 'list_03',
    sellerId: 'usr_77',
    sellerName: 'Frieren The Ancient',
    item: {
      id: 'item_ge_03',
      name: 'Solar Empyrean Ore',
      description: 'High-grade celestial ore gathered from apex solar leyline veins.',
      type: 'material',
      rarity: 'legendary',
      levelReq: 1,
      enchantLevel: 0,
      valueGold: 5000,
      stackable: true,
      quantity: 10,
      icon: '🪙',
    },
    priceGold: 80000,
    type: 'GE',
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
  },
];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  character,
  onUpdateCharacter,
  onNavigateToDungeon,
}) => {
  const [activeTab, setActiveTab] = useState<'ge' | 'sell' | 'my_listings' | 'auction'>('ge');
  const [listings, setListings] = useState<MarketplaceListing[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LISTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_LISTINGS;
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarityFilter, setSelectedRarityFilter] = useState<string>('all');

  // Inspection modal
  const [inspectedItem, setInspectedItem] = useState<Item | null>(null);

  // Send to GE Modal State
  const [selectedItemForListing, setSelectedItemForListing] = useState<Item | null>(null);
  const [listQuantity, setListQuantity] = useState<number>(1);
  const [askingPrice, setAskingPrice] = useState<number>(0);
  const [listingDurationDays, setListingDurationDays] = useState<number>(14); // Max 14 days
  const [priceInputError, setPriceInputError] = useState<string | null>(null);

  // Toast / Error Notifications
  const [successToast, setSuccessToast] = useState<string | null>(null);
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

  // Save listings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(listings));
    } catch (e) {
      console.error('Failed to save GE listings:', e);
    }
  }, [listings]);

  // Open modal for listing an item from inventory
  const handleOpenListingModal = (item: Item) => {
    setSelectedItemForListing(item);
    const initialQty = item.stackable ? Math.min(item.quantity || 1, 1) : 1;
    setListQuantity(initialQty);
    
    // System valuation is item.valueGold * listQuantity
    const minValuation = Math.max(1, (item.valueGold || 10) * initialQty);
    setAskingPrice(minValuation);
    setListingDurationDays(14); // Default to maximum 14 days limit
    setPriceInputError(null);
  };

  // Update quantity handler
  const handleQuantityChange = (newQty: number) => {
    if (!selectedItemForListing) return;
    const maxAvailable = selectedItemForListing.quantity || 1;
    const clampedQty = Math.max(1, Math.min(maxAvailable, newQty));
    setListQuantity(clampedQty);

    const minValuation = Math.max(1, (selectedItemForListing.valueGold || 10) * clampedQty);
    if (askingPrice < minValuation) {
      setAskingPrice(minValuation);
      setPriceInputError(null);
    }
  };

  // Calculate system minimum price
  const currentMinPrice = selectedItemForListing
    ? Math.max(1, (selectedItemForListing.valueGold || 10) * listQuantity)
    : 0;

  // Validate price input
  const handlePriceChange = (val: number) => {
    setAskingPrice(val);
    if (val < currentMinPrice) {
      setPriceInputError(
        `Asking price cannot be lower than the item system valuation minimum of ${currentMinPrice.toLocaleString()} Gold!`
      );
    } else {
      setPriceInputError(null);
    }
  };

  // Confirm listing sending item into Grand Exchange
  const handleConfirmListing = () => {
    if (!selectedItemForListing || !onUpdateCharacter) return;

    if (askingPrice < currentMinPrice) {
      setPriceInputError(
        `Cannot list below system valuation minimum price (${currentMinPrice.toLocaleString()} Gold)!`
      );
      return;
    }

    if (listingDurationDays > 14) {
      setListingDurationDays(14);
    }

    // 1. Deduct item from player's inventory
    const updatedInventory = [...character.inventory];
    let removed = false;

    for (let i = 0; i < updatedInventory.length; i++) {
      const slot = updatedInventory[i];
      if (slot && slot.id === selectedItemForListing.id) {
        if (slot.stackable && slot.quantity > listQuantity) {
          slot.quantity -= listQuantity;
        } else {
          updatedInventory[i] = null;
        }
        removed = true;
        break;
      }
    }

    if (!removed) {
      setErrorModal({
        isOpen: true,
        title: 'Listing Failed',
        message: 'The selected item was not found in your inventory.',
      });
      return;
    }

    const cleanInventory = sanitizeAndStackInventory(updatedInventory, character.inventoryLimit || 64);

    // 2. Create GE item and marketplace listing
    const itemToList: Item = {
      ...selectedItemForListing,
      id: `item_ge_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      quantity: listQuantity,
    };

    const newListing: MarketplaceListing = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      sellerId: character.id,
      sellerName: character.name,
      item: itemToList,
      priceGold: askingPrice,
      type: 'GE',
      expiresAt: new Date(Date.now() + Math.min(14, listingDurationDays) * 86400000).toISOString(),
    };

    // 3. Update State
    setListings((prev) => [newListing, ...prev]);
    onUpdateCharacter({
      ...character,
      inventory: cleanInventory,
    });

    const estTax = Math.floor(askingPrice * 0.10);
    const estNet = askingPrice - estTax;

    setSuccessToast(
      `✨ Successfully sent "${itemToList.name} (x${listQuantity})" to Grand Exchange for ${askingPrice.toLocaleString()} Gold! (Est. Net Payout after 10% Tax: ${estNet.toLocaleString()} Gold)`
    );

    // Reset modal
    setSelectedItemForListing(null);
  };

  // Buy Item Handler with 10% Escrow Tax
  const handleBuyItem = (listing: MarketplaceListing) => {
    if (!onUpdateCharacter) return;

    if (character.gold < listing.priceGold) {
      setErrorModal({
        isOpen: true,
        title: 'Insufficient Gold for Grand Exchange Buy!',
        message: `Purchasing "${listing.item.name}" from ${listing.sellerName} requires ${listing.priceGold.toLocaleString()} Gold, but you currently only have ${character.gold.toLocaleString()} Gold in your pouch.`,
        requiredGold: listing.priceGold,
        currentGold: character.gold,
      });
      return;
    }

    // Attempt adding item to buyer's inventory
    const { updatedInventory, addedQuantity } = addItemToInventory(
      character.inventory,
      listing.item,
      character.inventoryLimit || 64
    );

    if (addedQuantity <= 0) {
      setErrorModal({
        isOpen: true,
        title: 'Inventory Full!',
        message: 'Your inventory is completely full! Please free up a slot before purchasing items from the Grand Exchange.',
      });
      return;
    }

    const cleanInv = sanitizeAndStackInventory(updatedInventory, character.inventoryLimit || 64);

    // Calculate 10% tax fee
    const taxFee = Math.floor(listing.priceGold * 0.10);
    const sellerPayout = listing.priceGold - taxFee;

    // Remove listing from GE
    setListings((prev) => prev.filter((l) => l.id !== listing.id));

    // Deduct gold & update inventory for buyer
    onUpdateCharacter({
      ...character,
      gold: character.gold - listing.priceGold,
      inventory: cleanInv,
    });

    setSuccessToast(
      `✨ Purchase Complete! Acquired "${listing.item.name}" for ${listing.priceGold.toLocaleString()} Gold. (10% Tax Fee: ${taxFee.toLocaleString()} Gold deducted for Escrow, Seller received ${sellerPayout.toLocaleString()} Gold)`
    );
  };

  // Cancel My Listing and Return Item to Inventory
  const handleCancelListing = (listing: MarketplaceListing) => {
    if (!onUpdateCharacter) return;

    const { updatedInventory, addedQuantity } = addItemToInventory(
      character.inventory,
      listing.item,
      character.inventoryLimit || 64
    );

    if (addedQuantity <= 0) {
      setErrorModal({
        isOpen: true,
        title: 'Inventory Full!',
        message: 'Cannot cancel listing because your inventory is full. Please make space to reclaim your item.',
      });
      return;
    }

    const cleanInv = sanitizeAndStackInventory(updatedInventory, character.inventoryLimit || 64);

    setListings((prev) => prev.filter((l) => l.id !== listing.id));
    onUpdateCharacter({
      ...character,
      inventory: cleanInv,
    });

    setSuccessToast(`↩️ Cancelled listing for "${listing.item.name}". Item returned to your inventory.`);
  };

  // Format Expiration String
  const getExpirationBadge = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr).getTime();
    const now = Date.now();
    const diff = expiresAt - now;

    if (diff <= 0) {
      return { text: 'EXPIRED (14d Max)', isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) {
      return { text: `${days}d ${hours}h left`, isExpired: false };
    }
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${hours}h ${mins}m left`, isExpired: false };
  };

  // Filtered listings
  const filteredListings = listings.filter((l) => {
    if (activeTab === 'ge') {
      if (l.type !== 'GE') return false;
    } else if (activeTab === 'auction') {
      if (l.type !== 'AUCTION') return false;
    } else if (activeTab === 'my_listings') {
      if (l.sellerId !== character.id && l.sellerName !== character.name) return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = l.item.name.toLowerCase().includes(q);
      const matchSeller = l.sellerName.toLowerCase().includes(q);
      if (!matchName && !matchSeller) return false;
    }

    if (selectedRarityFilter !== 'all') {
      if (l.item.rarity !== selectedRarityFilter) return false;
    }

    return true;
  });

  // Player's inventory items (non-null)
  const inventoryItems = character.inventory.filter((slot): slot is Item => slot !== null);

  // My active listings count
  const myActiveListings = listings.filter(
    (l) => l.sellerId === character.id || l.sellerName === character.name
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl space-y-4 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-amber-500/10 p-2 border border-amber-500/30">
            <Store className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              Grand Exchange & Escrow Marketplace
              <span className="text-[10px] font-sans font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                10% Tax Fee • 14 Days Max Limit
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              List items directly from your inventory. Minimum valuation enforced by system pricing.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ge')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ge' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>Grand Exchange</span>
          </button>

          <button
            onClick={() => setActiveTab('sell')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sell' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-amber-400 hover:text-amber-200 bg-amber-500/10'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Send Item to GE ({inventoryItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my_listings')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_listings' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>My Listings ({myActiveListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('auction')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'auction' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gavel className="h-3.5 w-3.5" />
            <span>Blind Auction</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/70 p-3 text-xs text-emerald-200 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-100 p-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar (Visible in GE / Auction / My Listings) */}
      {activeTab !== 'sell' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/60 p-2 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item name or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Rarity:</span>
            <select
              value={selectedRarityFilter}
              onChange={(e) => setSelectedRarityFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythical">Mythical</option>
              <option value="godly">Godly</option>
            </select>
          </div>
        </div>
      )}

      {/* MAIN TAB CONTENT */}

      {/* TAB 1: BROWSE GE / AUCTION / MY LISTINGS */}
      {(activeTab === 'ge' || activeTab === 'auction' || activeTab === 'my_listings') && (
        <div>
          {filteredListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
              <Package className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">No active listings found</p>
              <p className="text-xs text-slate-500">
                {activeTab === 'my_listings'
                  ? 'You currently have no items listed on the Grand Exchange. Go to "Send Item to GE" to list an item!'
                  : 'Try adjusting your search query or rarity filter.'}
              </p>
              {activeTab === 'my_listings' && (
                <button
                  onClick={() => setActiveTab('sell')}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 text-xs hover:bg-amber-400 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  List an Item from Inventory
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredListings.map((listing) => {
                const expBadge = getExpirationBadge(listing.expiresAt);
                const isMyListing = listing.sellerId === character.id || listing.sellerName === character.name;
                const estTax = Math.floor(listing.priceGold * 0.10);
                const netPayout = listing.priceGold - estTax;

                return (
                  <div
                    key={listing.id}
                    className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs shadow-md hover:border-slate-700 transition-all space-x-2"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        onClick={() => setInspectedItem(listing.item)}
                        className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-2xl hover:border-amber-500 transition-colors"
                      >
                        <span>{listing.item.icon}</span>
                        {listing.item.quantity > 1 && (
                          <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-slate-950 border border-slate-900">
                            x{listing.item.quantity}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div
                          onClick={() => setInspectedItem(listing.item)}
                          className="font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer hover:text-amber-300 truncate"
                        >
                          <span className="truncate">
                            {listing.item.name} {listing.item.enchantLevel > 0 ? `+${listing.item.enchantLevel}` : ''}
                          </span>
                          <Eye className="h-3 w-3 text-amber-400 shrink-0" />
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>Seller: {listing.sellerName}</span>
                          {isMyListing && (
                            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                              YOU
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1 pt-1">
                          <Coins className="h-3.5 w-3.5 text-amber-400" />
                          <span>{listing.priceGold.toLocaleString()} Gold</span>
                          <span className="text-[9px] text-slate-400 font-normal ml-1">
                            (10% Tax: -{estTax.toLocaleString()} G)
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span className={expBadge.isExpired ? 'text-red-400 font-bold' : 'text-slate-400'}>
                            {expBadge.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between gap-2 h-full">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setInspectedItem(listing.item)}
                          className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                          title="Inspect Item Stats"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {isMyListing ? (
                          <button
                            onClick={() => handleCancelListing(listing)}
                            className="rounded-lg border border-red-500/40 bg-red-950/60 hover:bg-red-900/80 px-2.5 py-1.5 font-bold text-red-300 cursor-pointer flex items-center gap-1"
                            title="Cancel Listing & Reclaim Item"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyItem(listing)}
                            className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 font-bold text-slate-950 cursor-pointer flex items-center gap-1 shadow"
                          >
                            <span>Buy</span>
                          </button>
                        )}
                      </div>

                      <span className="text-[9px] text-slate-500 font-medium">
                        Max 14d Escrow
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SELL / SEND ITEM TO GRAND EXCHANGE (INVENTORY INTERACTION) */}
      {activeTab === 'sell' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2">
            <ArrowRightLeft className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Select an item from your Inventory to Send into the Grand Exchange:</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                • Minimum listing price is locked to the item's system valuation.<br />
                • Listings expire after a maximum of 14 days.<br />
                • A 10% Escrow tax fee is automatically deducted upon successful sale.
              </p>
            </div>
          </div>

          {inventoryItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
              <Package className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">Your Inventory is Empty</p>
              <p className="text-xs text-slate-500">
                Defeat monsters or complete quests to acquire sellable materials, gear, and cores!
              </p>
              {onNavigateToDungeon && (
                <button
                  onClick={onNavigateToDungeon}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 text-xs hover:bg-amber-400 cursor-pointer"
                >
                  Go to Dungeon
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {inventoryItems.map((item) => {
                const systemVal = Math.max(1, item.valueGold || 10);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs space-y-3 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => setInspectedItem(item)}
                        className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-2xl hover:border-amber-400 transition-colors"
                      >
                        <span>{item.icon}</span>
                        {item.quantity > 1 && (
                          <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-slate-950 border border-slate-900">
                            x{item.quantity}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          onClick={() => setInspectedItem(item)}
                          className="font-bold text-amber-200 hover:text-amber-300 cursor-pointer truncate flex items-center gap-1"
                        >
                          <span className="truncate">{item.name} {item.enchantLevel > 0 ? `+${item.enchantLevel}` : ''}</span>
                          <Eye className="h-3 w-3 text-amber-400 shrink-0" />
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          Rarity: <span className="font-semibold text-slate-300">{item.rarity}</span>
                        </div>
                        <div className="text-[10px] text-amber-400 font-semibold mt-1">
                          System Valuation: {systemVal.toLocaleString()} Gold / unit
                        </div>
                      </div>
                    </div>

                    {/* INTERACTION BUTTON TO SEND INTO GRAND EXCHANGE */}
                    <button
                      onClick={() => handleOpenListingModal(item)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 font-bold text-slate-950 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Send to Grand Exchange</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SEND TO GRAND EXCHANGE MODAL */}
      {selectedItemForListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4 text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-amber-200">
                  Send Item to Grand Exchange
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemForListing(null)}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-slate-100 border border-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Item Summary */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-3xl">
                {selectedItemForListing.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-200 text-sm">
                  {selectedItemForListing.name} {selectedItemForListing.enchantLevel > 0 ? `+${selectedItemForListing.enchantLevel}` : ''}
                </h4>
                <p className="text-[11px] text-slate-400 capitalize">
                  {selectedItemForListing.rarity} {selectedItemForListing.type} • Available in Inventory: x{selectedItemForListing.quantity}
                </p>
                <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                  Base System Valuation: {(selectedItemForListing.valueGold || 10).toLocaleString()} Gold / unit
                </p>
              </div>
            </div>

            {/* Quantity Selector (if stackable and qty > 1) */}
            {selectedItemForListing.stackable && selectedItemForListing.quantity > 1 && (
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span>Quantity to Send:</span>
                  <span className="text-amber-400 font-bold">{listQuantity} / {selectedItemForListing.quantity}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={selectedItemForListing.quantity}
                    value={listQuantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={selectedItemForListing.quantity}
                    value={listQuantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-16 rounded-lg bg-slate-950 border border-slate-800 p-1.5 text-center font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Minimum System Valuation Badge */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-400" />
                Minimum Valuation (System Base):
              </span>
              <span className="font-bold text-amber-300 text-sm">
                {currentMinPrice.toLocaleString()} Gold
              </span>
            </div>

            {/* Asking Price Input */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200">
                  Total Asking Price (Gold):
                </label>
                <span className="text-[10px] text-slate-400">Min: {currentMinPrice.toLocaleString()} G</span>
              </div>
              <div className="relative">
                <Coins className="absolute left-3 top-2.5 h-4 w-4 text-amber-400" />
                <input
                  type="number"
                  min={currentMinPrice}
                  value={askingPrice}
                  onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0)}
                  className={`w-full rounded-xl bg-slate-950 border pl-9 pr-3 py-2 text-sm font-bold text-amber-200 focus:outline-none ${
                    askingPrice < currentMinPrice
                      ? 'border-red-500 text-red-300'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handlePriceChange(currentMinPrice)}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Min ({currentMinPrice.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceChange(Math.round(currentMinPrice * 1.25))}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                >
                  +25%
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceChange(Math.round(currentMinPrice * 1.5))}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                >
                  +50%
                </button>
                <button
                  type="button"
                  onClick={() => handlePriceChange(currentMinPrice * 2)}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                >
                  2x Min
                </button>
              </div>

              {/* Validation Warning */}
              {priceInputError && (
                <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1 pt-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>{priceInputError}</span>
                </p>
              )}
            </div>

            {/* Listing Duration Limit (Max 14 Days) */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-200 flex items-center justify-between">
                <span>Listing Duration Limit:</span>
                <span className="text-[10px] text-amber-400 font-bold">14 Days Maximum Limit</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 7, 14].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setListingDurationDays(days)}
                    className={`rounded-xl border py-2 text-center text-xs font-bold transition-colors cursor-pointer ${
                      listingDurationDays === days
                        ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {days} {days === 1 ? 'Day' : 'Days'}
                    {days === 14 && <span className="block text-[8px] text-amber-400 font-bold">MAX</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 10% Escrow Tax Breakdown Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Listed Price:</span>
                <span className="font-bold text-slate-100">{askingPrice.toLocaleString()} Gold</span>
              </div>
              <div className="flex items-center justify-between text-red-400">
                <span>Escrow Tax Fee (10%):</span>
                <span className="font-bold">-{Math.floor(askingPrice * 0.10).toLocaleString()} Gold</span>
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-emerald-400 font-bold text-sm">
                <span>Net Estimated Seller Payout:</span>
                <span>{Math.floor(askingPrice * 0.90).toLocaleString()} Gold</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedItemForListing(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-bold text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmListing}
                disabled={askingPrice < currentMinPrice}
                className={`rounded-xl px-5 py-2 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  askingPrice < currentMinPrice
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-[0.98]'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Confirm & Send to GE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM STAT INSPECTION MODAL */}
      {inspectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setInspectedItem(null)}
              className="absolute top-4 right-3 z-20 rounded-lg bg-slate-900/90 p-1.5 text-slate-400 hover:text-slate-100 border border-slate-700 cursor-pointer"
              title="Close item inspection"
            >
              <X className="h-4 w-4" />
            </button>

            <ItemStatCard item={inspectedItem} characterLevel={character.level} />
          </div>
        </div>
      )}

      {/* ERROR / INSUFFICIENT GOLD MODAL */}
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
