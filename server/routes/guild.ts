import { Router } from 'express';
import { DB } from '../db';
import { purify } from '../middleware';
import { Guild } from '../../src/types/game';

export const guildRouter = Router();

// GUILD: List All Guilds
guildRouter.get('/list', (req, res) => {
  const list = Array.from(DB.guilds.values()).map((g) => ({
    id: g.id,
    name: g.name,
    tag: g.tag,
    symbol: g.symbol,
    color: g.color,
    leaderName: g.leaderName,
    memberCount: g.members.length,
    maxMembers: g.maxMembers,
    reputation: g.reputation,
    announcement: g.announcement,
    isOpenInvite: g.isOpenInvite,
    buildings: g.buildings,
  }));
  res.json({ guilds: list });
});

// GUILD: Create New Guild
guildRouter.post('/create', (req, res) => {
  const { characterId, name, tag, symbol, color } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  if (character.guildId) {
    res.status(400).json({ error: 'You are already a member of a Guild.' });
    return;
  }

  if (character.gold < 10000) {
    res.status(400).json({ error: 'Creating a guild requires 10,000 Gold.' });
    return;
  }

  for (const g of DB.guilds.values()) {
    if (g.name.toLowerCase() === name.trim().toLowerCase()) {
      res.status(400).json({ error: `Guild name "${name}" is already taken.` });
      return;
    }
  }

  character.gold -= 10000;
  const nextNumericId = (DB.guilds.size + 1).toString();

  const newGuild: Guild = {
    id: nextNumericId,
    name: name.trim(),
    tag: (tag || name.substring(0, 4)).toUpperCase().substring(0, 5),
    symbol: symbol || '🛡️',
    color: color || '#f59e0b',
    leaderId: character.id,
    leaderName: character.name,
    memberCount: 1,
    maxMembers: 30,
    reputation: 100,
    announcement: purify.sanitize(`Welcome to <b>${name}</b> [Guild ID: ${nextNumericId}]! Conquer Depth and Beyond together.`),
    isOpenInvite: true,
    buildings: { fort: 1, market: 1, camp: 1, church: 1 },
    members: [
      {
        characterId: character.id,
        name: character.name,
        level: character.level,
        role: 'LEADER',
        joinedAt: new Date().toISOString(),
      },
    ],
  };

  DB.guilds.set(nextNumericId, newGuild);
  character.guildId = nextNumericId;
  character.guildRole = 'LEADER';

  res.json({ guild: newGuild, character, message: `✨ Guild "${name}" [Guild ID: ${nextNumericId}] created successfully!` });
});

// GUILD: Join Guild
guildRouter.post('/join', (req, res) => {
  const { characterId, guildId } = req.body;
  const character = DB.characters.get(characterId);
  const guild = DB.guilds.get(guildId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }
  if (!guild) {
    res.status(404).json({ error: 'Guild not found.' });
    return;
  }
  if (character.guildId) {
    res.status(400).json({ error: 'You are already in a guild! Leave your current guild first.' });
    return;
  }
  if (guild.members.length >= guild.maxMembers) {
    res.status(400).json({ error: 'This guild has reached its maximum member capacity.' });
    return;
  }

  guild.members.push({
    characterId: character.id,
    name: character.name,
    level: character.level,
    role: 'MEMBER',
    joinedAt: new Date().toISOString(),
  });
  guild.memberCount = guild.members.length;
  character.guildId = guild.id;
  character.guildRole = 'MEMBER';

  res.json({
    success: true,
    guild,
    character,
    message: `🎉 Successfully joined Guild "${guild.name}" [Guild ID: ${guild.id}]!`,
  });
});

// GUILD: Update Announcement
guildRouter.post('/update-announcement', (req, res) => {
  const { characterId, guildId, announcement } = req.body;
  const character = DB.characters.get(characterId);
  const guild = DB.guilds.get(guildId);

  if (!character || !guild) {
    res.status(404).json({ error: 'Character or Guild not found.' });
    return;
  }
  if (character.guildId !== guild.id || (character.guildRole !== 'LEADER' && character.guildRole !== 'CO_LEADER')) {
    res.status(403).json({ error: 'Only Guild Leaders and Co-Leaders can update announcements.' });
    return;
  }

  guild.announcement = purify.sanitize(announcement);
  res.json({ success: true, announcement: guild.announcement, message: 'Guild announcement updated.' });
});

// GUILD: Upgrade Building
guildRouter.post('/upgrade-building', (req, res) => {
  const { characterId, guildId, buildingKey } = req.body;
  const character = DB.characters.get(characterId);
  const guild = DB.guilds.get(guildId);

  if (!character || !guild) {
    res.status(404).json({ error: 'Character or Guild not found.' });
    return;
  }
  if (character.guildId !== guild.id) {
    res.status(403).json({ error: 'You are not a member of this guild.' });
    return;
  }

  const validKeys = ['fort', 'market', 'camp', 'church'] as const;
  if (!validKeys.includes(buildingKey)) {
    res.status(400).json({ error: 'Invalid building specified.' });
    return;
  }

  const key = buildingKey as 'fort' | 'market' | 'camp' | 'church';
  const currentLv = guild.buildings[key] || 1;
  const upgradeCostGold = currentLv * 5000;

  if (character.gold < upgradeCostGold) {
    res.status(400).json({ error: `Insufficient Gold. Upgrading ${key.toUpperCase()} to Level ${currentLv + 1} requires ${upgradeCostGold.toLocaleString()} Gold.` });
    return;
  }

  character.gold -= upgradeCostGold;
  guild.buildings[key] = currentLv + 1;
  if (key === 'fort') {
    guild.maxMembers = 20 + guild.buildings.fort * 5;
  }

  res.json({
    success: true,
    guild,
    character,
    message: `🏰 Upgraded Guild ${key.toUpperCase()} to Level ${guild.buildings[key]}!`,
  });
});

// GUILD: Fetch Details
guildRouter.get('/:guildId', (req, res) => {
  const queryId = req.params.guildId.trim().toLowerCase();
  let foundGuild: Guild | undefined;

  for (const g of DB.guilds.values()) {
    if (g.id.toLowerCase() === queryId || g.name.toLowerCase() === queryId || g.tag.toLowerCase() === queryId) {
      foundGuild = g;
      break;
    }
  }

  if (!foundGuild) {
    res.status(404).json({ error: 'Guild not found.' });
    return;
  }

  res.json({ guild: foundGuild });
});
