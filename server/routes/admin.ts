import { Router } from 'express';
import { DB } from '../db';
import { logAudit, purify } from '../middleware';
import { Item, UserAccount, ChatMessage, RaidBossInstance } from '../../src/types/game';
import { addItemToInventory, sanitizeAndStackInventory } from '../../src/utils/formulas';

export const adminRouter = Router();

// ADMIN: Full Moderation Chat Logs
adminRouter.get('/chat-logs', (req, res) => {
  res.json({ logs: DB.fullChatLog, count: DB.fullChatLog.length });
});

// ADMIN: Dashboard Overview Metrics
adminRouter.get('/metrics', (req, res) => {
  const charactersList = Array.from(DB.characters.values()).map((c) => ({
    id: c.id,
    userId: c.userId,
    name: c.name,
    level: c.level,
    gold: c.gold,
    faction: c.faction,
    accountId: c.accountId,
  }));

  const usersList = Array.from(DB.users.values()).map((u) => ({
    id: u.id,
    userId: u.userId,
    email: u.email,
    role: u.role,
    isPrimaryGM: u.isPrimaryGM,
    isBanned: u.isBanned,
    banUntil: u.banUntil,
    banReason: u.banReason,
  }));

  const primaryGM = usersList.find((u) => u.role === 'ADMIN' || u.isPrimaryGM);

  res.json({
    totalAccounts: DB.users.size,
    totalCharacters: DB.characters.size,
    totalGuilds: DB.guilds.size,
    totalMarketListings: DB.marketplace.size,
    maintenanceMode: DB.maintenanceMode,
    primaryGM,
    users: usersList,
    characters: charactersList,
    auditLogs: DB.adminAuditLogs.slice(0, 50),
    anomalyLogs: DB.anomalyLogs.slice(0, 50),
  });
});

// ADMIN: Character Inspector
adminRouter.get('/character/:id', (req, res) => {
  const charId = req.params.id;
  let character = DB.characters.get(charId);

  if (!character) {
    for (const c of DB.characters.values()) {
      if (c.name.toLowerCase() === charId.toLowerCase() || c.userId === charId) {
        character = c;
        break;
      }
    }
  }

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }
  const account = DB.users.get(character.accountId);
  res.json({ character, account });
});

// ADMIN: Item Spawner
adminRouter.post('/spawn-item', (req, res) => {
  const { adminId, targetCharacterId, name, type, slot, rarity, levelReq, str, int, spd, enchantLevel, quantity } = req.body;
  const adminAcc = DB.users.get(adminId);

  if (!adminAcc || (adminAcc.role !== 'ADMIN' && adminAcc.userId !== '1')) {
    res.status(403).json({ error: 'Unauthorized. GM Admin privileges or User ID #1 required.' });
    return;
  }

  let character = DB.characters.get(targetCharacterId);
  if (!character) {
    for (const c of DB.characters.values()) {
      if (c.name.toLowerCase() === targetCharacterId?.toLowerCase() || c.userId === targetCharacterId) {
        character = c;
        break;
      }
    }
  }

  if (!character) {
    res.status(404).json({ error: 'Target character not found. Please provide valid User ID or Character Name.' });
    return;
  }

  const isGear = type === 'gear' || type === 'weapon' || type === 'armor' || Boolean(slot);
  const isStackableItem = !isGear && (type === 'consumable' || type === 'material' || type === 'core' || type === 'stone' || type === 'box' || type === 'voucher');
  const normalizedType = isGear ? 'gear' : (type || 'gear');
  const assignedSlot = isGear ? (type === 'weapon' ? 'mainHand' : type === 'armor' ? 'body' : (slot || 'mainHand')) : slot;

  const newItem: Item = {
    id: `item_gm_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    name: name || 'GM Divine Masterpiece',
    description: 'A divine artifact spawned directly by GM Authority.',
    type: normalizedType as Item['type'],
    slot: assignedSlot,
    rarity: rarity || 'godly',
    levelReq: Number(levelReq) || 1,
    baseStats: {
      str: Number(str) || 50,
      int: Number(int) || 50,
      spd: Number(spd) || 20,
    },
    enchantLevel: Number(enchantLevel) || 10,
    valueGold: 100000,
    stackable: isStackableItem,
    quantity: Number(quantity) || 1,
    icon: rarity === 'godly' ? '👑' : rarity === 'legendary' ? '⚔️' : '🔮',
    weaponType: 'physical',
  };

  const { updatedInventory, remainingQuantity } = addItemToInventory(
    character.inventory,
    newItem,
    character.inventoryLimit || 64
  );

  if (remainingQuantity >= newItem.quantity) {
    res.status(400).json({ error: 'Target character inventory is full!' });
    return;
  }

  character.inventory = sanitizeAndStackInventory(updatedInventory, character.inventoryLimit || 64);

  logAudit(adminAcc.id, adminAcc.email, 'SPAWN_ITEM', character.id, null, newItem);

  res.json({ success: true, item: newItem, character });
});

// ADMIN: Account Moderation
adminRouter.post('/moderate-account', (req, res) => {
  const { adminId, accountId, action, banDuration, reason } = req.body;
  const adminAcc = DB.users.get(adminId);

  if (!adminAcc || (adminAcc.role !== 'ADMIN' && adminAcc.userId !== '1')) {
    res.status(403).json({ error: 'Unauthorized.' });
    return;
  }

  let targetAcc = DB.users.get(accountId);
  if (!targetAcc) {
    for (const u of DB.users.values()) {
      if (u.userId === accountId || u.email.toLowerCase() === accountId?.toLowerCase()) {
        targetAcc = u;
        break;
      }
    }
  }

  if (!targetAcc) {
    for (const c of DB.characters.values()) {
      if (c.name.toLowerCase() === accountId?.toLowerCase()) {
        targetAcc = DB.users.get(c.accountId);
        break;
      }
    }
  }

  if (!targetAcc) {
    res.status(404).json({ error: 'Target account not found. Provide valid User ID, Character Name, or Email.' });
    return;
  }

  const before = { isBanned: targetAcc.isBanned, banUntil: targetAcc.banUntil, banReason: targetAcc.banReason };

  if (action === 'ban') {
    targetAcc.isBanned = true;
    targetAcc.banReason = reason || 'Violation of Realm Terms by GM order.';

    let durationMs = 0;
    if (banDuration === '1h') durationMs = 3600000;
    else if (banDuration === '12h') durationMs = 43200000;
    else if (banDuration === '24h') durationMs = 86400000;
    else if (banDuration === '7d') durationMs = 604800000;
    else if (banDuration === '30d') durationMs = 2592000000;

    if (durationMs > 0) {
      targetAcc.banUntil = new Date(Date.now() + durationMs).toISOString();
    } else {
      targetAcc.banUntil = undefined;
    }
  } else if (action === 'unban') {
    targetAcc.isBanned = false;
    targetAcc.banReason = undefined;
    targetAcc.banUntil = undefined;
  }

  const after = { isBanned: targetAcc.isBanned, banUntil: targetAcc.banUntil, banReason: targetAcc.banReason };
  logAudit(adminAcc.id, adminAcc.email, `ACCOUNT_${action.toUpperCase()}`, targetAcc.id, before, after);

  res.json({ success: true, account: targetAcc });
});

// ADMIN: Transfer Sole GM Authority
adminRouter.post('/transfer-gm', (req, res) => {
  const { adminId, targetIdentifier } = req.body;
  const adminAcc = DB.users.get(adminId);

  if (!adminAcc || (adminAcc.role !== 'ADMIN' && adminAcc.userId !== '1')) {
    res.status(403).json({ error: 'Unauthorized. Sole GM authority required.' });
    return;
  }

  let targetAcc: UserAccount | undefined;
  for (const u of DB.users.values()) {
    if (u.userId === targetIdentifier || u.id === targetIdentifier || u.email.toLowerCase() === targetIdentifier?.toLowerCase()) {
      targetAcc = u;
      break;
    }
  }

  if (!targetAcc) {
    for (const c of DB.characters.values()) {
      if (c.name.toLowerCase() === targetIdentifier?.toLowerCase()) {
        targetAcc = DB.users.get(c.accountId);
        break;
      }
    }
  }

  if (!targetAcc) {
    res.status(404).json({ error: 'Target player/account not found.' });
    return;
  }

  for (const u of DB.users.values()) {
    if (u.id === targetAcc.id) {
      u.role = 'ADMIN';
      u.isPrimaryGM = true;
      u.is2FAEnabled = true;
      u.twoFactorSecret = '123456';
    } else {
      u.role = 'PLAYER';
      u.isPrimaryGM = false;
    }
  }

  logAudit(adminAcc.id, adminAcc.email, 'TRANSFER_SOLE_GM_RANK', targetAcc.id, { previousGMUserId: adminAcc.userId }, { newGMUserId: targetAcc.userId });

  res.json({ success: true, message: `Sole GM Authority transferred to User #${targetAcc.userId} (${targetAcc.email}).`, newGM: targetAcc });
});

// ADMIN: Spawn World Raid Boss
adminRouter.post('/spawn-boss', (req, res) => {
  const { adminId, bossName, tier, hp } = req.body;
  const adminAcc = DB.users.get(adminId);

  if (!adminAcc || (adminAcc.role !== 'ADMIN' && adminAcc.userId !== '1')) {
    res.status(403).json({ error: 'Unauthorized.' });
    return;
  }

  const instId = `raid_gm_${Date.now()}`;
  const maxHp = Number(hp) || 2000000;
  const newRaid: RaidBossInstance = {
    id: instId,
    bossId: 'boss_gm_custom',
    name: bossName || 'Sorrowful Witch of the Void (GM Event)',
    tier: (Number(tier) as 1 | 2 | 3) || 3,
    instanceNo: DB.raidInstances.size + 1,
    currentHp: maxHp,
    maxHp: maxHp,
    playerCount: 1,
    createdAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 7200000).toISOString(),
    turnEndsAt: Date.now() + 5000,
  };

  DB.raidInstances.set(instId, newRaid);
  DB.raidDamage.set(instId, new Map());

  const sysMsg: ChatMessage = {
    id: `ann_${Date.now()}`,
    channel: 'announcement',
    senderName: 'GM ANNOUNCEMENT',
    content: `🚨 [WORLD RAID EVENT] GM Authority spawned World Raid Boss: ${newRaid.name}! Join the raid arena immediately!`,
    timestamp: new Date().toLocaleTimeString(),
  };
  DB.chatMessages.push(sysMsg);

  logAudit(adminAcc.id, adminAcc.email, 'SPAWN_RAID_BOSS', instId, null, newRaid);

  res.json({ success: true, raid: newRaid });
});

// ADMIN: Broadcast Announcement
adminRouter.post('/broadcast', (req, res) => {
  const { adminId, message } = req.body;
  const adminAcc = DB.users.get(adminId);

  if (!adminAcc || (adminAcc.role !== 'ADMIN' && adminAcc.userId !== '1')) {
    res.status(403).json({ error: 'Unauthorized.' });
    return;
  }

  const sysMsg: ChatMessage = {
    id: `ann_${Date.now()}`,
    channel: 'announcement',
    senderName: 'GM BROADCAST',
    senderRole: 'ADMIN',
    content: purify.sanitize(`📢 [GM NOTICE]: ${message}`),
    timestamp: new Date().toLocaleTimeString(),
  };

  DB.chatMessages.push(sysMsg);
  logAudit(adminAcc.id, adminAcc.email, 'GM_SERVER_BROADCAST', undefined, null, { message });

  res.json({ success: true, message: sysMsg });
});

// ADMIN: Maintenance Mode Toggle
adminRouter.post('/maintenance', (req, res) => {
  const { adminId, enabled } = req.body;
  const adminAcc = DB.users.get(adminId);

  if (!adminAcc || (adminAcc.role !== 'ADMIN' && adminAcc.userId !== '1')) {
    res.status(403).json({ error: 'Unauthorized. GM Admin privileges or User ID #1 required.' });
    return;
  }

  const prev = DB.maintenanceMode;
  DB.maintenanceMode = Boolean(enabled);
  logAudit(adminAcc.id, adminAcc.email, 'TOGGLE_MAINTENANCE', undefined, { maintenanceMode: prev }, { maintenanceMode: DB.maintenanceMode });

  res.json({ maintenanceMode: DB.maintenanceMode });
});

// ADMIN: Modify Character Stats
adminRouter.post('/modify-character', (req, res) => {
  const { adminId, targetCharacterId, goldAdd, levelSet } = req.body;
  const adminAcc = DB.users.get(adminId);

  if (!adminAcc || (adminAcc.role !== 'ADMIN' && adminAcc.userId !== '1')) {
    res.status(403).json({ error: 'Unauthorized.' });
    return;
  }

  const character = DB.characters.get(targetCharacterId);
  if (!character) {
    res.status(404).json({ error: 'Target character not found.' });
    return;
  }

  const before = { gold: character.gold, level: character.level };

  if (goldAdd) character.gold += Number(goldAdd);
  if (levelSet) character.level = Number(levelSet);

  const after = { gold: character.gold, level: character.level };
  logAudit(adminAcc.id, adminAcc.email, 'MODIFY_CHARACTER_STATS', targetCharacterId, before, after);

  res.json({ character });
});

// ADMIN: Emergency Progress Reset
adminRouter.post('/emergency-reset', (req, res) => {
  const { adminId } = req.body;
  const adminAcc = DB.users.get(adminId);

  if (!adminAcc || (adminAcc.role !== 'ADMIN' && adminAcc.userId !== '1')) {
    res.status(403).json({ error: 'Unauthorized.' });
    return;
  }

  const snapId = `snap_${Date.now()}`;
  const snapData = JSON.stringify({
    characters: Array.from(DB.characters.entries()),
    guilds: Array.from(DB.guilds.entries()),
  });
  DB.snapshots.set(snapId, snapData);

  logAudit(adminAcc.id, adminAcc.email, 'EMERGENCY_PROGRESS_RESET', snapId, { charactersCount: DB.characters.size });

  DB.characters.clear();
  DB.characterByAccount.clear();

  res.json({ message: 'Emergency reset executed. Account credentials preserved. System snapshot created.', snapshotId: snapId });
});
