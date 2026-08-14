import { Router } from 'express';
import { DB } from '../db';
import { ChatMessage } from '../../src/types/game';

export const blacksmithRouter = Router();

// BLACKSMITH: Atomic Item Fusion & Enchantment Transaction
blacksmithRouter.post('/enchant', (req, res) => {
  const { characterId, itemId } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  const itemIndex = character.inventory.findIndex((i) => i && i.id === itemId);
  if (itemIndex === -1 || !character.inventory[itemIndex]) {
    res.status(400).json({ error: 'Item not found in inventory.' });
    return;
  }

  const item = character.inventory[itemIndex]!;
  if (item.slot === 'familiar' || item.type === 'box' || (item.name && item.name.includes('Pet Seal')) || item.type !== 'gear') {
    res.status(400).json({ error: 'Pets and familiar seals cannot be enchanted! Blacksmith enchantment is strictly for equipment gear.' });
    return;
  }

  if (item.enchantLevel >= 20) {
    res.status(400).json({ error: 'Item has already reached maximum +20 enchantment!' });
    return;
  }

  const costGold = 500 * (item.enchantLevel + 1);
  if (character.gold < costGold) {
    res.status(400).json({ error: `Insufficient gold. Required: ${costGold} Gold.` });
    return;
  }

  character.gold -= costGold;

  const rates: Record<number, number> = {
    0: 0.90, 1: 0.85, 2: 0.80, 3: 0.75, 4: 0.70,
    5: 0.65, 6: 0.60, 7: 0.55, 8: 0.50, 9: 0.45,
    10: 0.40, 11: 0.35, 12: 0.30, 13: 0.25, 14: 0.20,
    15: 0.15, 16: 0.10, 17: 0.08, 18: 0.05, 19: 0.035,
  };
  const successChance = rates[item.enchantLevel] || 0.035;
  const roll = Math.random();
  const isSuccess = roll < successChance;

  const oldLevel = item.enchantLevel;
  if (isSuccess) {
    item.enchantLevel += 1;
  } else {
    item.enchantLevel = 0;
  }

  if (oldLevel >= 10) {
    const sysMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      channel: 'announcement',
      senderName: 'SYSTEM',
      content: isSuccess
        ? `🔥 [CELEBRATION] ${character.name} successfully enchanted [${item.name}] to +${item.enchantLevel}!`
        : `💀 [ENCHANT FAIL] ${character.name} attempted +${oldLevel + 1} on [${item.name}] but it shattered back to +0!`,
      timestamp: new Date().toLocaleTimeString(),
    };
    DB.chatMessages.push(sysMsg);
  }

  res.json({
    success: isSuccess,
    item,
    newLevel: item.enchantLevel,
    goldRemaining: character.gold,
  });
});
