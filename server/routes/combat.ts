import { Router } from 'express';
import { DB } from '../db';
import { logAnomaly } from '../middleware';
import { calcMaxDPS } from '../../src/utils/formulas';

export const combatRouter = Router();

// COMBAT: Raid Damage Submission
combatRouter.post('/raid-damage', (req, res) => {
  const { characterId, instanceId, damageAmount, nonce } = req.body;

  const character = DB.characters.get(characterId);
  const raid = DB.raidInstances.get(instanceId);

  if (!character || !raid) {
    res.status(404).json({ error: 'Character or Raid instance not found.' });
    return;
  }

  // Anti-Cheat: Validate maximum possible DPS
  const maxAllowed = calcMaxDPS(character.stats) * 1.5;
  if (damageAmount > maxAllowed) {
    logAnomaly(character.accountId, 'DAMAGE_INJECTION_ATTEMPT', JSON.stringify({ damageAmount, maxAllowed, nonce }), 'high');

    res.status(400).json({
      error: 'Combat action rejected by Anti-Cheat verification.',
      forceStateFetch: true,
    });
    return;
  }

  // Atomic HP reduction
  const appliedDamage = Math.min(raid.currentHp, damageAmount);
  raid.currentHp = Math.max(0, raid.currentHp - appliedDamage);

  // Track player damage contribution
  let dmgMap = DB.raidDamage.get(instanceId);
  if (!dmgMap) {
    dmgMap = new Map();
    DB.raidDamage.set(instanceId, dmgMap);
  }
  const currentDmg = dmgMap.get(characterId) || 0;
  dmgMap.set(characterId, currentDmg + appliedDamage);

  res.json({
    success: true,
    raidHp: raid.currentHp,
    maxHp: raid.maxHp,
    yourTotalDamage: currentDmg + appliedDamage,
  });
});
