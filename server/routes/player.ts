import { Router } from 'express';
import { DB } from '../db';
import { DailyRewardDay, UserReport } from '../../src/types/game';
import { addItemToInventory, sanitizeAndStackInventory } from '../../src/utils/formulas';

export const playerRouter = Router();

// DAILY LOGIN REWARDS TABLE
const DAILY_REWARDS_TABLE: DailyRewardDay[] = [
  { day: 1, type: 'gold', name: '5,000 Gold', description: 'Starter reward for your daily adventure.', goldAmount: 5000, icon: '🪙' },
  { day: 2, type: 'item', name: '3x EXP Boost Vouchers (+50%)', description: 'Scrolls that increase experience gained.', item: { id: 'item_exp_v2', name: '50% EXP Booster Voucher', description: 'Increases EXP gained by 50% for 1 hour.', type: 'voucher', rarity: 'uncommon', levelReq: 1, enchantLevel: 0, valueGold: 200, stackable: true, quantity: 3, icon: '📜' }, icon: '📜' },
  { day: 3, type: 'gold', name: '20,000 Gold', description: 'Abundant gold reward for continuous loyalty.', goldAmount: 20000, icon: '💰' },
  { day: 4, type: 'item', name: '10x Grand Health & Mana Potions', description: 'Full vitality restoration potions.', item: { id: 'item_hp_v4', name: 'Grand Elixir of Life', description: 'Restores 1000 HP instantly.', type: 'consumable', rarity: 'rare', levelReq: 1, enchantLevel: 0, valueGold: 500, stackable: true, quantity: 10, icon: '🧪' }, icon: '🧪' },
  { day: 5, type: 'gold', name: '50,000 Gold & 25 Gold Leaf', description: 'Large sum of gold and gold leaves.', goldAmount: 50000, icon: '💎' },
  { day: 6, type: 'item', name: '2x Mythical Upgrade Blessing Stones', description: 'Increases equipment upgrade rate to 100%.', item: { id: 'item_stone_v6', name: 'Mythical Blessing Stone', description: 'Prevents item destruction on upgrade failure.', type: 'stone', rarity: 'mythical', levelReq: 1, enchantLevel: 0, valueGold: 1000, stackable: true, quantity: 2, icon: '💎' }, icon: '💎' },
  { day: 7, type: 'item', name: '1x Celestial Godly Companion Egg', description: 'Divine egg that hatches into a Godly pet!', item: { id: 'item_godly_egg_v7', name: 'GODLY Pet Seal: Celestial Phoenix', description: 'Summons a divine godly pet companion.', type: 'box', slot: 'familiar', rarity: 'godly', levelReq: 1, enchantLevel: 0, valueGold: 50000, stackable: false, quantity: 1, icon: '👑' }, icon: '👑' },
];

// PLAYER: Claim Daily Login Reward
playerRouter.post('/daily-claim', (req, res) => {
  const { characterId } = req.body;
  const character = DB.characters.get(characterId);
  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  const now = Date.now();
  const lastClaim = character.lastDailyClaimTime ? new Date(character.lastDailyClaimTime).getTime() : 0;
  const timeDiff = now - lastClaim;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  if (lastClaim > 0 && timeDiff < TWENTY_FOUR_HOURS) {
    const nextAvailableInMs = TWENTY_FOUR_HOURS - timeDiff;
    const hoursLeft = Math.ceil(nextAvailableInMs / (1000 * 60 * 60));
    res.status(400).json({
      error: `Daily login reward already claimed today! Next claim available in ~${hoursLeft} hour(s).`,
      nextClaimTime: new Date(now + nextAvailableInMs).toISOString(),
    });
    return;
  }

  let streak = character.dailyStreakDays || 0;
  if (lastClaim === 0 || timeDiff > TWENTY_FOUR_HOURS * 2) {
    streak = 1;
  } else {
    streak += 1;
  }

  const dayIndex = ((streak - 1) % 7);
  const rewardDay = DAILY_REWARDS_TABLE[dayIndex];

  if (rewardDay.goldAmount) {
    character.gold += rewardDay.goldAmount;
  }
  if (rewardDay.item) {
    const itemToAdd = { ...rewardDay.item, id: `${rewardDay.item.id}_${Date.now()}` };
    const { updatedInventory, remainingQuantity } = addItemToInventory(
      character.inventory,
      itemToAdd,
      character.inventoryLimit || 64
    );
    character.inventory = sanitizeAndStackInventory(updatedInventory, character.inventoryLimit || 64);
    if (remainingQuantity > 0) {
      character.gold += (rewardDay.item.valueGold || 500) * remainingQuantity;
    }
  }

  character.dailyStreakDays = streak;
  character.lastDailyClaimTime = new Date(now).toISOString();

  res.json({
    success: true,
    streakDays: streak,
    claimedReward: rewardDay,
    character,
    message: `🎉 Day ${rewardDay.day} Daily Login Reward Claimed: [${rewardDay.name}]! Streak: ${streak} Days!`,
  });
});

// PLAYER: Update Avatar
playerRouter.post('/update-avatar', (req, res) => {
  const { characterId, avatarUrl } = req.body;
  const character = DB.characters.get(characterId);
  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')) {
    if (avatarUrl.length > 3100000) {
      res.status(400).json({ error: 'Avatar image exceeds 2128KB size limit.' });
      return;
    }
  }

  character.avatarUrl = avatarUrl;
  res.json({ success: true, avatarUrl, character });
});

// PLAYER: Update Honor Title
playerRouter.post('/update-title', (req, res) => {
  const { characterId, title } = req.body;
  const character = DB.characters.get(characterId);
  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  character.title = title;
  res.json({ success: true, title, character });
});

// PLAYER: Mute Player
playerRouter.post('/mute', (req, res) => {
  const { characterId, targetPlayerId } = req.body;
  const character = DB.characters.get(characterId);
  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  if (!character.mutedPlayerIds) character.mutedPlayerIds = [];
  if (!character.mutedPlayerIds.includes(targetPlayerId)) {
    character.mutedPlayerIds.push(targetPlayerId);
  }

  res.json({ success: true, mutedPlayerIds: character.mutedPlayerIds, character });
});

// PLAYER: Unmute Player
playerRouter.post('/unmute', (req, res) => {
  const { characterId, targetPlayerId } = req.body;
  const character = DB.characters.get(characterId);
  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  if (character.mutedPlayerIds) {
    character.mutedPlayerIds = character.mutedPlayerIds.filter((id) => id !== targetPlayerId);
  }

  res.json({ success: true, mutedPlayerIds: character.mutedPlayerIds, character });
});

// PLAYER: Report User
playerRouter.post('/report', (req, res) => {
  const { reporterId, reporterName, targetId, targetName, reason, details } = req.body;
  const report: UserReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    reporterId: reporterId || 'anonymous',
    reporterName: reporterName || 'Player',
    targetId: targetId || 'unknown',
    targetName: targetName || 'Unknown',
    reason: reason || 'Other',
    details: details || 'No additional details provided.',
    createdAt: new Date().toISOString(),
  };

  DB.userReports.unshift(report);
  res.json({ success: true, report, message: `Report against ${targetName} submitted successfully. Moderators will review the incident.` });
});

// PLAYERS: Search
export const playersRouter = Router();

playersRouter.get('/search', (req, res) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  if (!query) {
    res.json({ results: [] });
    return;
  }

  const results: any[] = [];
  
  for (const char of DB.characters.values()) {
    const user = DB.users.get(char.accountId);
    const userIdStr = user?.userId || char.userId || '';
    
    const nameMatch = char.name.toLowerCase().startsWith(query) || char.name.toLowerCase().includes(query);
    const idMatch = userIdStr.toLowerCase().startsWith(query) || userIdStr === query;

    if (nameMatch || idMatch) {
      const guild = char.guildId ? DB.guilds.get(char.guildId) : undefined;
      results.push({
        userId: userIdStr,
        accountId: char.accountId,
        characterId: char.id,
        characterName: char.name,
        level: char.level,
        faction: char.faction,
        characterClass: char.characterClass || 'Vanguard Crusader',
        archetype: char.archetype || 'Tactical Commander',
        gold: char.gold,
        title: char.title,
        isOnline: char.isOnline ?? true,
        guildTag: guild?.tag,
      });
    }
  }

  res.json({ results: results.slice(0, 15) });
});

// PLAYERS: Fetch Profile
playersRouter.get('/profile/:identifier', (req, res) => {
  const identifier = req.params.identifier.trim().toLowerCase();
  let targetUser: any;
  let targetChar: any;

  for (const user of DB.users.values()) {
    if (user.userId.toLowerCase() === identifier || user.id.toLowerCase() === identifier || user.email.toLowerCase() === identifier) {
      targetUser = user;
      break;
    }
  }

  if (targetUser) {
    const charIds = DB.characterByAccount.get(targetUser.id) || [];
    if (charIds.length > 0) {
      targetChar = DB.characters.get(charIds[0]);
    }
  }

  if (!targetChar) {
    for (const char of DB.characters.values()) {
      if (char.name.toLowerCase() === identifier || char.id.toLowerCase() === identifier) {
        targetChar = char;
        targetUser = DB.users.get(char.accountId);
        break;
      }
    }
  }

  if (!targetChar || !targetUser) {
    res.status(404).json({ error: 'Player profile not found.' });
    return;
  }

  const guild = targetChar.guildId ? DB.guilds.get(targetChar.guildId) : undefined;

  res.json({
    user: {
      id: targetUser.id,
      userId: targetUser.userId,
      email: targetUser.email,
      role: targetUser.role,
      isPrimaryGM: targetUser.isPrimaryGM,
      createdAt: targetUser.createdAt,
      isBanned: targetUser.isBanned,
    },
    character: targetChar,
    guildName: guild?.name,
  });
});

// PLAYERS: Online Players List
playersRouter.get('/online', (req, res) => {
  const onlineList: any[] = [];
  for (const char of DB.characters.values()) {
    const user = DB.users.get(char.accountId);
    const guild = char.guildId ? DB.guilds.get(char.guildId) : undefined;
    onlineList.push({
      userId: user?.userId || char.userId || '0',
      accountId: char.accountId,
      characterId: char.id,
      characterName: char.name,
      level: char.level,
      faction: char.faction,
      characterClass: char.characterClass || 'Vanguard Crusader',
      archetype: char.archetype || 'Tactical Commander',
      gold: char.gold,
      title: char.title,
      isOnline: char.isOnline ?? true,
      guildTag: guild?.tag,
    });
  }
  res.json({ onlinePlayers: onlineList });
});
