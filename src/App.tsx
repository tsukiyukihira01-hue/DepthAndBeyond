import React, { useState, useEffect } from 'react';
import { UserAccount, Character, Item, CharacterStats, EquipmentSlot } from './types/game';
import { Navbar } from './components/Navbar';
import { SidebarNav, NavViewId } from './components/SidebarNav';
import { BottomNav } from './components/BottomNav';
import { EventTicker } from './components/EventTicker';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { EulaModal } from './components/EulaModal';
import { CityHubView } from './components/CityHubView';
import { WorldMap } from './components/WorldMap';
import { CombatView } from './components/CombatView';
import { CharacterSheet } from './components/CharacterSheet';
import { InventoryView } from './components/InventoryView';
import { BlacksmithView } from './components/BlacksmithView';
import { SkillManager } from './components/SkillManager';
import { FamiliarView } from './components/FamiliarView';
import { MarketplaceView } from './components/MarketplaceView';
import { MercenaryView } from './components/MercenaryView';
import { GuildView } from './components/GuildView';
import { QuestView } from './components/QuestView';
import { ChatWindow } from './components/ChatWindow';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { OnlinePlayersModal } from './components/OnlinePlayersModal';
import { TradeModal } from './components/TradeModal';
import { AdminDashboard } from './components/AdminDashboard';
import { DailyRewardModal } from './components/DailyRewardModal';
import { PartyManagerModal } from './components/party/PartyManagerModal';
import { PartyHubView } from './components/party/PartyHubView';
import { RaidCombatView } from './components/raid/RaidCombatView';
import { RaidConfirmationModal } from './components/raid/RaidConfirmationModal';
import { Party } from './types/party';
import { PlayerSearchResult } from './types/game';
import { audio } from './utils/audio';
import { calculateLevelUpStatsPlayer, calculateLevelUpStatsPet, addItemToInventory, sanitizeAndStackInventory } from './utils/formulas';
import { calculateEquipmentTotalBonuses } from './utils/poeItemUtils';
import { getAuthCookie, setAuthCookie, clearAuthCookie } from './utils/cookie';

export default function App() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [activeUsersCount, setActiveUsersCount] = useState<number>(1);
  const [uiMode, setUiMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');
  const [activeView, setActiveView] = useState<
    | 'landing'
    | 'city'
    | 'map'
    | 'combat'
    | 'character'
    | 'inventory'
    | 'blacksmith'
    | 'skills'
    | 'familiar'
    | 'market'
    | 'mercenary'
    | 'guild'
    | 'quests'
    | 'raid'
  >('landing');

  // Navigation & Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [navMode, setNavMode] = useState<'sidebar' | 'bottom' | 'both'>(() => {
    const saved = localStorage.getItem('depth_nav_mode');
    if (saved === 'bottom' || saved === 'both' || saved === 'sidebar') return saved;
    return 'bottom';
  });

  const handleNavModeChange = (mode: 'sidebar' | 'bottom' | 'both') => {
    setNavMode(mode);
    localStorage.setItem('depth_nav_mode', mode);
  };

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEulaOpen, setIsEulaOpen] = useState(false);
  const [isEulaAccepted, setIsEulaAccepted] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<string | null>(null);
  const [tradePartnerName, setTradePartnerName] = useState<string | null>(null);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isRaidConfirmOpen, setIsRaidConfirmOpen] = useState(false);
  const [activeRaidParty, setActiveRaidParty] = useState<Party | null>(null);
  const [onlinePlayersList, setOnlinePlayersList] = useState<PlayerSearchResult[]>([]);
  const [isCombatLocked, setIsCombatLocked] = useState(false);
  const [combatLockModalOpen, setCombatLockModalOpen] = useState(false);

  const handleNavigateView = (view: NavViewId) => {
    audio.playClick();
    if (isCombatLocked && (activeView === 'combat' || activeView === 'raid') && view !== activeView) {
      setCombatLockModalOpen(true);
      return;
    }
    setActiveView(view);
  };

  // Fetch online players list when online modal opens
  const handleOpenOnlineModal = () => {
    fetch('/api/players/online')
      .then((res) => res.json())
      .then((data) => {
        setOnlinePlayersList(data.onlinePlayers || []);
        setIsOnlineModalOpen(true);
      })
      .catch(() => {
        setIsOnlineModalOpen(true);
      });
  };

  // Poll Server Health & Online Count & Restore Session from Remember Me Cookie
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.activeUsers) setActiveUsersCount(data.activeUsers);
      } catch {
        // Silently catch server health polling
      }
    };

    checkServerHealth();
    const timer = setInterval(checkServerHealth, 10000);

    // Auto-login via Remember Me Cookie
    const savedToken = getAuthCookie();
    if (savedToken && !user) {
      fetch('/api/auth/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: savedToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            setToken(data.token);
            setAuthCookie(data.token, true);
            if (data.characters && data.characters.length > 0) {
              const restoredChar = ensureStarterVials(data.characters[0]);
              setCharacter(restoredChar);
              setActiveView('city');
            }
          }
        })
        .catch(() => {});
    }

    return () => clearInterval(timer);
  }, []);

  const ensureStarterVials = (char: Character): Character => {
    let mergedChar = { ...char };
    try {
      const cachedRaw = localStorage.getItem(`dandb_char_${char.id}`);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.id === char.id) {
          mergedChar = {
            ...mergedChar,
            treeAllocations: cached.treeAllocations || mergedChar.treeAllocations,
            equippedTrees: cached.equippedTrees || mergedChar.equippedTrees,
            equippedSkills: cached.equippedSkills || mergedChar.equippedSkills,
            skills: cached.skills || mergedChar.skills,
          };
        }
      }
    } catch {}

    const charToUse = mergedChar;
    const hasHpVial = charToUse.inventory.some((i) => i?.name?.includes('Health Vial') || i?.name?.includes('HP Vial'));
    const hasMpVial = charToUse.inventory.some((i) => i?.name?.includes('Mana Vial') || i?.name?.includes('MP Vial'));

    if (hasHpVial && hasMpVial) return charToUse;

    const newInv = [...charToUse.inventory];

    if (!hasHpVial) {
      const emptyIdx = newInv.findIndex((slot) => slot === null);
      const hpVial: Item = {
        id: `item_hp_vial_${Date.now()}_1`,
        name: 'Novice Health Vial',
        description: 'Restores 250 Health points instantly upon consumption.',
        type: 'consumable',
        rarity: 'common',
        levelReq: 1,
        enchantLevel: 0,
        valueGold: 10,
        stackable: true,
        quantity: 500,
        icon: '🧪',
      };
      if (emptyIdx !== -1) newInv[emptyIdx] = hpVial;
      else newInv.push(hpVial);
    }

    if (!hasMpVial) {
      const emptyIdx = newInv.findIndex((slot) => slot === null);
      const mpVial: Item = {
        id: `item_mp_vial_${Date.now()}_2`,
        name: 'Novice Mana Vial',
        description: 'Restores 250 Mana points instantly upon consumption.',
        type: 'consumable',
        rarity: 'common',
        levelReq: 1,
        enchantLevel: 0,
        valueGold: 10,
        stackable: true,
        quantity: 500,
        icon: '💧',
      };
      if (emptyIdx !== -1) newInv[emptyIdx] = mpVial;
      else newInv.push(mpVial);
    }

    return { ...charToUse, inventory: newInv };
  };

  const handleLoginSuccess = (usr: UserAccount, tok: string, chars: Character[]) => {
    setUser(usr);
    setToken(tok);
    if (chars.length > 0) {
      setCharacter(ensureStarterVials(chars[0]));
      setActiveView('city');
    }
  };

  const handleCharacterSelect = (char: Character) => {
    setCharacter(ensureStarterVials(char));
    setActiveView('city');
  };

  const handleAllocatePoint = (statKey: keyof CharacterStats) => {
    if (!character || character.stats.unassignedPoints <= 0) return;
    audio.playClick();

    setCharacter((prev) => {
      if (!prev) return prev;
      const currentVal = (prev.stats[statKey] as number) || 0;
      const newStats = {
        ...prev.stats,
        [statKey]: currentVal + 1,
        unassignedPoints: prev.stats.unassignedPoints - 1,
      };

      // Increase Max HP if STR/DEF increased, Max Mana if INT/WIS increased
      if (statKey === 'str' || statKey === 'def') {
        newStats.maxHp += 15;
        newStats.hp = Math.min(newStats.hp + 15, newStats.maxHp);
      } else if (statKey === 'int' || statKey === 'wis') {
        newStats.maxMana += 10;
        newStats.mana = Math.min(newStats.mana + 10, newStats.maxMana);
      }

      return {
        ...prev,
        stats: newStats,
      };
    });
  };

  const handleResetStats = async () => {
    if (!character) return;
    const RESET_COST = 10000000;
    if (character.gold < RESET_COST) {
      alert(`Insufficient Gold! Resetting attribute bonus points costs 10,000,000 Gold. You currently have ${character.gold.toLocaleString()} Gold.`);
      return;
    }

    const confirmed = confirm(`Are you sure you want to reset all attribute bonus points for 10,000,000 Gold? All ${character.level * 5} level attribute points will be refunded to unassigned points.`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/character/reset-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to reset stat attributes.');
      } else {
        audio.playVictory();
        alert(data.message || 'Stat attributes successfully reset!');
        if (data.character) {
          setCharacter(data.character);
        }
      }
    } catch {
      alert('Network error while attempting to reset stat attributes.');
    }
  };

  const syncCharacterStateToServer = (char: Character) => {
    if (!char || !char.id) return;
    try {
      localStorage.setItem(`dandb_char_${char.id}`, JSON.stringify(char));
    } catch {}
    fetch('/api/character/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: char.id,
        inventory: char.inventory,
        gold: char.gold,
        exp: char.exp,
        level: char.level,
        maxExp: char.maxExp,
        stats: char.stats,
        familiar: char.familiar,
        treeAllocations: char.treeAllocations,
        equippedTrees: char.equippedTrees,
        equippedSkills: char.equippedSkills,
        skills: char.skills,
      }),
    }).catch(() => {});
  };

  const handleSwitchLoadout = (spec: 'A' | 'B') => {
    if (!character) return;
    audio.playClick();
    setCharacter((prev) => (prev ? { ...prev, loadoutSpec: spec } : prev));
  };

  const handleEquipItem = (item: Item) => {
    if (!character || !item.slot) return;
    audio.playClick();

    setCharacter((prev) => {
      if (!prev) return prev;
      const slot = item.slot as EquipmentSlot;
      const currentlyEquipped = prev.equipment[slot];

      // Remove the newly equipped item from inventory
      let updatedInv = prev.inventory.filter((i) => i?.id !== item.id);

      // If there was previously an item in this slot, put it back into inventory
      if (currentlyEquipped) {
        const { updatedInventory } = addItemToInventory(updatedInv, currentlyEquipped, prev.inventoryLimit || 64);
        updatedInv = updatedInventory;
      }

      const cleanInv = sanitizeAndStackInventory(updatedInv, prev.inventoryLimit || 64);
      const updatedEquipment = {
        ...prev.equipment,
        [slot]: item,
      };

      // Recalculate stats bonus from equipment with penalties applied
      const bonuses = calculateEquipmentTotalBonuses(
        updatedEquipment,
        prev.level,
        { str: prev.stats.str, dex: prev.stats.dex, int: prev.stats.int }
      );

      const nextChar = {
        ...prev,
        inventory: cleanInv,
        equipment: updatedEquipment,
        stats: {
          ...prev.stats,
          str: Math.max(10, prev.stats.str + bonuses.totalStr),
          int: Math.max(10, prev.stats.int + bonuses.totalInt),
          def: Math.max(5, prev.stats.def + bonuses.totalDef + bonuses.totalArmour),
          spd: Math.max(10, prev.stats.spd + bonuses.totalSpd),
          dex: Math.max(10, prev.stats.dex + bonuses.totalDex),
          wis: Math.max(10, prev.stats.wis + bonuses.totalWis),
          ward: Math.max(0, bonuses.totalEnergyShield),
        },
      };

      syncCharacterStateToServer(nextChar);
      return nextChar;
    });
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    if (!character) return;
    const itemToUnequip = character.equipment[slot];
    if (!itemToUnequip) return;

    audio.playClick();

    setCharacter((prev) => {
      if (!prev) return prev;
      const item = prev.equipment[slot];
      if (!item) return prev;

      const { updatedInventory } = addItemToInventory(prev.inventory, item, prev.inventoryLimit || 64);
      const cleanInv = sanitizeAndStackInventory(updatedInventory, prev.inventoryLimit || 64);

      const updatedEquipment = {
        ...prev.equipment,
        [slot]: null,
      };

      const nextChar = {
        ...prev,
        inventory: cleanInv,
        equipment: updatedEquipment,
      };

      syncCharacterStateToServer(nextChar);
      return nextChar;
    });
  };

  const handleDismantleItem = (item: Item) => {
    if (!character) return;
    audio.playClick();

    setCharacter((prev) => {
      if (!prev) return prev;
      const updatedInv = [...prev.inventory];
      const index = updatedInv.findIndex((i) => i?.id === item.id);
      if (index === -1) return prev;

      const currentItem = updatedInv[index]!;
      const qty = currentItem.quantity || 1;
      const goldGained = (currentItem.valueGold || 10);

      if (qty > 1) {
        updatedInv[index] = { ...currentItem, quantity: qty - 1 };
      } else {
        updatedInv[index] = null;
      }

      const cleanInv = sanitizeAndStackInventory(updatedInv, prev.inventoryLimit || 64);
      const nextChar = {
        ...prev,
        gold: prev.gold + goldGained,
        inventory: cleanInv,
      };

      syncCharacterStateToServer(nextChar);
      return nextChar;
    });
  };

  const handleEnchantSubmit = async (item: Item) => {
    if (!character) return { success: false, error: 'Character not initialized.' };
    try {
      const res = await fetch('/api/blacksmith/enchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, itemId: item.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Enchantment failed.' };
      }

      if (data.item) {
        setCharacter((prev) => {
          if (!prev) return prev;
          const newInv = prev.inventory.map((i) => (i?.id === item.id ? data.item : i));
          return { ...prev, gold: data.goldRemaining, inventory: newInv };
        });
      }

      return {
        success: Boolean(data.success),
        newLevel: data.newLevel as number,
        item: data.item as Item,
        goldRemaining: data.goldRemaining as number,
      };
    } catch {
      return { success: false, error: 'Error connecting to Blacksmith service.' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none max-w-full overflow-x-hidden">
      {/* Global Navigation Header */}
      <Navbar
        character={character}
        user={user}
        activeUsersCount={activeUsersCount}
        uiMode={uiMode}
        onUiModeChange={setUiMode}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenMod={() => setIsAdminOpen(true)}
        onOpenPlayerProfile={(id) => setSelectedProfilePlayer(id)}
        onOpenOnlinePlayers={handleOpenOnlineModal}
        onOpenDailyReward={() => setIsDailyRewardOpen(true)}
        onOpenEula={() => setIsEulaOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        navMode={navMode}
        onChangeNavMode={handleNavModeChange}
      />

      {/* Main Body Layout with Sidebar & Bottom Bar */}
      <div className="flex-1 flex relative">
        {character && activeView !== 'landing' && (navMode === 'sidebar' || navMode === 'both') && (
          <SidebarNav
            character={character}
            activeView={activeView}
            onNavigateView={handleNavigateView}
            isOpen={isSidebarOpen}
            onCloseMobile={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            onOpenDailyReward={() => setIsDailyRewardOpen(true)}
            onOpenPartyModal={() => setIsPartyModalOpen(true)}
            onOpenRaidConfirm={() => {
              if (isCombatLocked && (activeView === 'combat' || activeView === 'raid')) {
                setCombatLockModalOpen(true);
                return;
              }
              setIsRaidConfirmOpen(true);
            }}
            isCombatLocked={isCombatLocked}
          />
        )}

        <main
          className={`flex-1 transition-all duration-300 w-full max-w-7xl mx-auto p-3 space-y-4 ${
            character && activeView !== 'landing' && (navMode === 'sidebar' || navMode === 'both')
              ? isSidebarOpen
                ? isSidebarCollapsed
                  ? 'lg:pl-20'
                  : 'lg:pl-68'
                : 'lg:pl-0'
              : ''
          } ${
            character && activeView !== 'landing' && (navMode === 'bottom' || navMode === 'both')
              ? 'pb-20'
              : ''
          }`}
        >
          {/* Global Event Ticker Bar */}
          <EventTicker />

          {activeView === 'landing' && (
            <LandingPage
              onStartPlay={() => setIsAuthOpen(true)}
              openEulaModal={() => setIsEulaOpen(true)}
              activeUsersCount={activeUsersCount}
            />
          )}

          {/* View Switch Router */}
        {character && activeView === 'city' && (
          <CityHubView
            character={character}
            onUpdateCharacter={setCharacter}
            onNavigateView={handleNavigateView}
          />
        )}

        {character && activeView === 'raid' && (
          <RaidCombatView
            character={character}
            party={activeRaidParty}
            onCombatStatusChange={(active) => setIsCombatLocked(active)}
            onRaidEnd={(result) => {
              if (result.victory) {
                setCharacter((prev) => {
                  if (!prev) return prev;
                  let newExp = prev.exp + result.expGained;
                  let newLevel = prev.level;
                  let newMaxExp = prev.maxExp;
                  let leveledUp = false;

                  while (newExp >= newMaxExp) {
                    newExp -= newMaxExp;
                    newLevel += 1;
                    newMaxExp = Math.round(newMaxExp * 1.5);
                    leveledUp = true;
                  }

                  let newStats = { ...prev.stats, unassignedPoints: 0 };
                  if (leveledUp) {
                    const gains = calculateLevelUpStatsPlayer(prev.level, newLevel, prev.stats, prev.characterClass);
                    newStats = {
                      ...newStats,
                      maxHp: gains.maxHp,
                      hp: result.remainingHp ? Math.max(result.remainingHp, gains.hp) : gains.hp,
                      maxMana: gains.maxMana,
                      mana: result.remainingMana ? Math.max(result.remainingMana, gains.mana) : gains.mana,
                      str: gains.str,
                      int: gains.int,
                      def: gains.def,
                      wis: gains.wis,
                      spd: gains.spd,
                      dex: gains.dex,
                      unassignedPoints: 0,
                    };
                  } else {
                    newStats.hp = result.remainingHp ?? prev.stats.hp;
                    newStats.mana = result.remainingMana ?? prev.stats.mana;
                  }

                  let updatedInv = [...prev.inventory];
                  if (result.droppedItems && result.droppedItems.length > 0) {
                    result.droppedItems.forEach((drop) => {
                      const res = addItemToInventory(updatedInv, drop, prev.inventoryLimit || 64);
                      updatedInv = res.updatedInventory;
                    });
                  }

                  const nextChar = {
                    ...prev,
                    exp: newExp,
                    level: newLevel,
                    maxExp: newMaxExp,
                    gold: prev.gold + result.goldGained,
                    inventory: sanitizeAndStackInventory(updatedInv, prev.inventoryLimit || 64),
                    stats: newStats,
                  };
                  syncCharacterStateToServer(nextChar);
                  return nextChar;
                });
              }
              setActiveView('city');
            }}
            onUpdateCharacter={setCharacter}
          />
        )}
        {character && activeView === 'map' && (
          <WorldMap
            character={character}
            uiMode={uiMode}
            onZoneChange={(zoneId) => setCharacter((prev) => (prev ? { ...prev, currentZoneId: zoneId } : prev))}
            onEnterCombat={() => setActiveView('combat')}
            onUpdateCharacter={setCharacter}
          />
        )}

        {character && activeView === 'combat' && (
          <CombatView
            character={character}
            onUpdateCharacter={setCharacter}
            onCombatStatusChange={(active) => setIsCombatLocked(active)}
            onCombatEnd={(result) => {
              if (result.victory) {
                setCharacter((prev) => {
                  if (!prev) return prev;
                  let newExp = prev.exp + result.expGained;
                  let newLevel = prev.level;
                  let newMaxExp = prev.maxExp;
                  let newUnallocatedPoints = prev.stats.unassignedPoints;
                  let leveledUp = false;

                  while (newExp >= newMaxExp) {
                    newExp -= newMaxExp;
                    newLevel += 1;
                    newMaxExp = Math.round(newMaxExp * 1.5);
                    leveledUp = true;
                  }

                  if (leveledUp) {
                    audio.playVictory();
                  }

                  // Add items dropped to inventory using stacking helper
                  let updatedInv = [...prev.inventory];
                  if (result.droppedItemsList && result.droppedItemsList.length > 0) {
                    result.droppedItemsList.forEach((drop) => {
                      const isGear = drop.type === 'weapon' || drop.type === 'armor' || drop.type === 'gear' || !!(drop as any).slot;
                      const isStackable = !isGear && (drop.type === 'consumable' || drop.type === 'material' || drop.type === 'core' || drop.type === 'stone' || drop.type === 'box' || drop.type === 'voucher');
                      const normalizedType = isGear ? 'gear' : drop.type;
                      const assignedSlot = isGear ? ((drop as any).slot || (drop.type === 'weapon' ? 'mainHand' : drop.type === 'armor' ? 'body' : 'mainHand')) : (drop as any).slot;
                      const droppedItem: Item = {
                        id: drop.id || `item_drop_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                        name: drop.name,
                        description: drop.description,
                        type: normalizedType as Item['type'],
                        slot: assignedSlot,
                        rarity: drop.rarity,
                        levelReq: (drop as any).levelReq || 1,
                        enchantLevel: (drop as any).enchantLevel || 0,
                        baseStats: (drop as any).baseStats || undefined,
                        weaponType: (drop as any).weaponType || undefined,
                        valueGold: (drop as any).valueGold || (drop.rarity === 'legendary' ? 1200 : drop.rarity === 'epic' ? 500 : 150),
                        stackable: isStackable,
                        quantity: drop.quantity || 1,
                        icon: drop.icon,
                      };
                      const res = addItemToInventory(updatedInv, droppedItem, prev.inventoryLimit || 64);
                      updatedInv = res.updatedInventory;
                    });
                  } else if (result.itemsDropped && result.itemsDropped.length > 0) {
                    result.itemsDropped.forEach((itemName) => {
                      const isVial = itemName.includes('Vial') || itemName.includes('Potion') || itemName.includes('Elixir');
                      const droppedItem: Item = {
                        id: `item_drop_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                        name: itemName,
                        description: `Monster loot drop from combat victory.`,
                        type: isVial ? 'consumable' : 'material',
                        rarity: 'uncommon',
                        levelReq: 1,
                        enchantLevel: 0,
                        valueGold: 120,
                        stackable: true,
                        quantity: isVial ? 5 : 1,
                        icon: isVial ? '🧪' : '💎',
                      };
                      const res = addItemToInventory(updatedInv, droppedItem, prev.inventoryLimit || 64);
                      updatedInv = res.updatedInventory;
                    });
                  }

                  // Handle Pet EXP and Level Up (strictly if pet is equipped and petExpGained > 0)
                  let updatedFamiliar = prev.familiar;
                  if (updatedFamiliar && result.petExpGained && result.petExpGained > 0) {
                    let petExp = updatedFamiliar.exp + result.petExpGained;
                    let petMaxExp = updatedFamiliar.maxExp;
                    let petLvl = updatedFamiliar.level;
                    const oldPetLvl = updatedFamiliar.level;

                    while (petExp >= petMaxExp) {
                      petExp -= petMaxExp;
                      petLvl += 1;
                      petMaxExp = Math.floor(petMaxExp * 1.4);
                    }

                    if (petLvl > oldPetLvl) {
                      const petStatsUpdate = calculateLevelUpStatsPet(oldPetLvl, petLvl, updatedFamiliar.tier, updatedFamiliar);
                      updatedFamiliar = {
                        ...updatedFamiliar,
                        level: petLvl,
                        exp: petExp,
                        maxExp: petMaxExp,
                        ...petStatsUpdate,
                      };
                    } else {
                      updatedFamiliar = {
                        ...updatedFamiliar,
                        exp: petExp,
                      };
                    }
                  }

                  const currentMaxFloor = prev.stats.maxFloorReached || 1;
                  const newMaxFloor = result.floorCleared ? Math.max(currentMaxFloor, result.floorCleared + 1) : currentMaxFloor;

                  let endStats = { ...prev.stats, unassignedPoints: newUnallocatedPoints, maxFloorReached: newMaxFloor };
                  if (leveledUp) {
                    const playerStatGain = calculateLevelUpStatsPlayer(prev.level, newLevel, prev.stats, prev.characterClass);
                    endStats = {
                      ...endStats,
                      maxHp: playerStatGain.maxHp,
                      hp: playerStatGain.hp,
                      maxMana: playerStatGain.maxMana,
                      mana: playerStatGain.mana,
                      str: playerStatGain.str,
                      int: playerStatGain.int,
                      def: playerStatGain.def,
                      wis: playerStatGain.wis,
                      spd: playerStatGain.spd,
                      dex: playerStatGain.dex,
                      unassignedPoints: playerStatGain.unassignedPoints,
                    };
                  } else {
                    endStats = {
                      ...endStats,
                      hp: result.remainingHp ?? prev.stats.hp,
                      mana: result.remainingMana ?? prev.stats.mana,
                    };
                  }

                  const nextChar = {
                    ...prev,
                    exp: newExp,
                    level: newLevel,
                    maxExp: newMaxExp,
                    gold: prev.gold + result.goldGained,
                    inventory: sanitizeAndStackInventory(updatedInv, prev.inventoryLimit || 64),
                    familiar: updatedFamiliar,
                    stats: endStats,
                  };

                  syncCharacterStateToServer(nextChar);
                  return nextChar;
                });
              } else {
                // Defeat: keep remaining HP and MP
                setCharacter((prev) =>
                  prev
                    ? {
                        ...prev,
                        stats: {
                          ...prev.stats,
                          hp: result.remainingHp ?? prev.stats.hp,
                          mana: result.remainingMana ?? prev.stats.mana,
                        },
                      }
                    : prev
                );
              }

              if (result.redirectToCity) {
                setActiveView('city');
              } else if (result.redirectToMap) {
                setActiveView('map');
              }
            }}
          />
        )}

        {character && activeView === 'character' && (
          <CharacterSheet
            character={character}
            onAllocatePoint={handleAllocatePoint}
            onSwitchLoadout={handleSwitchLoadout}
            onUnequipItem={handleUnequipItem}
            onResetStats={handleResetStats}
            onUpdateCharacter={(updated) => setCharacter((prev) => (prev ? { ...prev, ...updated } : prev))}
          />
        )}

        {character && activeView === 'inventory' && (
          <InventoryView
            character={character}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
            onDismantleItem={handleDismantleItem}
            onUpdateInventory={(updatedInv) => setCharacter((prev) => (prev ? { ...prev, inventory: updatedInv } : prev))}
          />
        )}

        {character && activeView === 'blacksmith' && (
          <BlacksmithView
            character={character}
            onEnchantSubmit={handleEnchantSubmit}
            onSmartFuseSubmit={() => alert('Smart Fill Fusion detected 8 duplicates! Upgraded to Tier II.')}
            onNavigateToDungeon={() => setActiveView('combat')}
            onUpdateCharacter={(updated) => setCharacter((prev) => (prev ? { ...prev, ...updated } : prev))}
          />
        )}

        {character && activeView === 'skills' && (
          <SkillManager
            character={character}
            onUpdateCharacter={(updatedChar) => {
              setCharacter(updatedChar);
              syncCharacterStateToServer(updatedChar);
            }}
            onLearnSkill={(sk) =>
              setCharacter((prev) => {
                if (!prev) return prev;
                const updated = { ...prev, skills: [...prev.skills, sk.id] };
                syncCharacterStateToServer(updated);
                return updated;
              })
            }
            onUpgradeSkill={(skId) => alert(`Upgraded skill [${skId}] effectiveness by +2%!`)}
            onEquipSkill={(skId, slotType, slotIndex) => {
              setCharacter((prev) => {
                if (!prev) return prev;
                const currentEquipped = prev.equippedSkills || {
                  passives: [null, null, null, null],
                  autoCast: null,
                  actives: [null, null, null, null, null, null, null, null],
                };

                let newEquipped = { ...currentEquipped };

                if (slotType === 'autoCast') {
                  newEquipped.autoCast = skId;
                } else if (slotType === 'passives') {
                  const newPassives = [...(currentEquipped.passives || [null, null, null, null])];
                  if (skId !== null) {
                    newPassives.forEach((s, i) => {
                      if (s === skId) newPassives[i] = null;
                    });
                  }
                  newPassives[slotIndex] = skId;
                  newEquipped.passives = newPassives;
                } else if (slotType === 'actives') {
                  const defaultActives = [null, null, null, null, null, null, null, null];
                  const existingActives = currentEquipped.actives || [];
                  const newActives = defaultActives.map((_, i) => existingActives[i] ?? null);
                  if (skId !== null) {
                    newActives.forEach((s, i) => {
                      if (s === skId) newActives[i] = null;
                    });
                  }
                  newActives[slotIndex] = skId;
                  newEquipped.actives = newActives;
                }

                const updated = {
                  ...prev,
                  equippedSkills: newEquipped,
                };
                syncCharacterStateToServer(updated);
                return updated;
              });
            }}
            onNavigateToDungeon={() => setActiveView('combat')}
          />
        )}

        {character && activeView === 'familiar' && (
          <FamiliarView
            character={character}
            onUpdateCharacter={(updatedChar) => setCharacter(updatedChar)}
          />
        )}

        {character && activeView === 'market' && (
          <MarketplaceView
            character={character}
            onUpdateCharacter={setCharacter}
            onNavigateToDungeon={() => setActiveView('combat')}
          />
        )}

        {character && activeView === 'mercenary' && (
          <MercenaryView
            character={character}
            onNavigateToDungeon={() => setActiveView('combat')}
          />
        )}

        {character && activeView === 'party' && (
          <PartyHubView
            character={character}
            onUpdateCharacter={setCharacter}
            onStartRaidWithParty={(p) => {
              setActiveRaidParty(p);
              setIsRaidConfirmOpen(true);
            }}
            onNavigateView={(v) => {
              audio.playClick();
              setActiveView(v);
            }}
          />
        )}

        {character && activeView === 'guild' && (
          <GuildView
            character={character}
            onUpdateCharacter={(updatedChar) => setCharacter(updatedChar)}
            onNavigateToDungeon={() => setActiveView('combat')}
          />
        )}

        {character && activeView === 'quests' && (
          <QuestView
            character={character}
            onUpdateCharacter={(updatedChar) => setCharacter(updatedChar)}
            onNavigateToDungeon={() => setActiveView('combat')}
          />
        )}

        {/* Global Chat Bar */}
        {character && <ChatWindow character={character} onSelectPlayer={setSelectedProfilePlayer} />}
      </main>

      {/* Floating Bottom Navigation Bar */}
      {character && activeView !== 'landing' && (navMode === 'bottom' || navMode === 'both') && (
        <BottomNav
          character={character}
          activeView={activeView}
          onNavigateView={handleNavigateView}
          onOpenRaidConfirm={() => {
            if (isCombatLocked && (activeView === 'combat' || activeView === 'raid')) {
              setCombatLockModalOpen(true);
              return;
            }
            setIsRaidConfirmOpen(true);
          }}
          navMode={navMode}
          onChangeNavMode={handleNavModeChange}
          isCombatLocked={isCombatLocked}
        />
      )}
    </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onCharacterSelect={handleCharacterSelect}
        openEulaModal={() => setIsEulaOpen(true)}
        isEulaAccepted={isEulaAccepted}
      />

      <EulaModal
        isOpen={isEulaOpen}
        onClose={() => setIsEulaOpen(false)}
        onAccept={() => {
          setIsEulaAccepted(true);
          setIsEulaOpen(false);
        }}
      />

      {selectedProfilePlayer && (
        <PlayerProfileModal
          isOpen={Boolean(selectedProfilePlayer)}
          targetIdentifier={selectedProfilePlayer}
          currentUser={user}
          currentCharacter={character}
          onClose={() => setSelectedProfilePlayer(null)}
          onInitiateTrade={(pName) => {
            setSelectedProfilePlayer(null);
            setTradePartnerName(pName);
          }}
          onSendPartyInvite={(pName) => alert(`Party invite sent to ${pName}!`)}
          onLogout={() => {
            clearAuthCookie();
            setUser(null);
            setCharacter(null);
            setToken(null);
            setSelectedProfilePlayer(null);
            setActiveView('landing');
          }}
          onUpdateLoadout={handleSwitchLoadout}
          uiMode={uiMode}
          onUiModeChange={setUiMode}
          navMode={navMode}
          onChangeNavMode={handleNavModeChange}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      )}

      {isOnlineModalOpen && (
        <OnlinePlayersModal
          isOpen={isOnlineModalOpen}
          onClose={() => setIsOnlineModalOpen(false)}
          onlinePlayers={onlinePlayersList}
          onSelectPlayer={(id) => setSelectedProfilePlayer(id)}
        />
      )}

      {tradePartnerName && character && (
        <TradeModal
          isOpen={Boolean(tradePartnerName)}
          partnerName={tradePartnerName}
          character={character}
          onClose={() => setTradePartnerName(null)}
        />
      )}

      {isAdminOpen && user && (user.role === 'ADMIN' || user.userId === '1') && (
        <AdminDashboard
          user={user}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {character && isDailyRewardOpen && (
        <DailyRewardModal
          isOpen={isDailyRewardOpen}
          onClose={() => setIsDailyRewardOpen(false)}
          character={character}
          onUpdateCharacter={(updatedChar) => setCharacter(updatedChar)}
        />
      )}

      {character && (
        <PartyManagerModal
          isOpen={isPartyModalOpen}
          onClose={() => setIsPartyModalOpen(false)}
          character={character}
          onStartRaidWithParty={(party) => {
            setActiveRaidParty(party);
            setIsRaidConfirmOpen(true);
          }}
          onUpdateCharacter={(updatedChar) => setCharacter(updatedChar)}
        />
      )}

      {character && (
        <RaidConfirmationModal
          isOpen={isRaidConfirmOpen}
          onClose={() => setIsRaidConfirmOpen(false)}
          character={character}
          party={activeRaidParty}
          onConfirmLaunchRaid={() => {
            setActiveView('raid');
          }}
          onUpdateCharacter={(updatedChar) => setCharacter(updatedChar)}
        />
      )}

      {/* Combat Navigation Lock Warning Modal */}
      {combatLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/50 bg-slate-900 p-5 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-950 border border-rose-500/40 text-2xl shadow-lg shadow-rose-950/50">
              🔒
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-rose-200">
                Locked in Combat!
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                You are currently engaged in active combat. You must complete or resolve the battle before switching pages or leaving the dungeon!
              </p>
            </div>
            <button
              onClick={() => {
                audio.playClick();
                setCombatLockModalOpen(false);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 transition-all cursor-pointer"
            >
              Return to Battle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
