import { Router } from 'express';
import { DB } from '../db';
import { purify } from '../middleware';
import { ChatMessage } from '../../src/types/game';

export const chatRouter = Router();

// CHAT: Post Message
chatRouter.post('/send', (req, res) => {
  const { characterId, channel, content, recipientId } = req.body;
  const character = DB.characters.get(characterId);

  if (!character) {
    res.status(404).json({ error: 'Character not found.' });
    return;
  }

  if (channel === 'global' || channel === 'trade' || channel === 'recruit') {
    if (character.level < 10) {
      res.status(403).json({ error: 'You must reach Level 10 to speak in public chat channels.' });
      return;
    }
  }

  if (channel === 'pm' && character.level < 20) {
    res.status(403).json({ error: 'Private messaging unlocks at Level 20.' });
    return;
  }

  const userAcc = DB.users.get(character.accountId);
  const guild = character.guildId ? DB.guilds.get(character.guildId) : null;

  if (channel === 'announcement' || channel === 'announcements') {
    const role = userAcc?.role || 'PLAYER';
    if (role !== 'ADMIN' && role !== 'MOD' && character.title !== 'Game Master' && character.title !== 'Realm GM') {
      res.status(403).json({ error: 'The Announcement channel is read-only. Only GMs and Admins can broadcast messages here.' });
      return;
    }
  }

  if (channel === 'guild') {
    if (!character.guildId) {
      res.status(403).json({ error: 'You must be a member of a Guild to chat in Guild channel.' });
      return;
    }
  }

  if (channel === 'party') {
    if (!character.partyId) {
      res.status(403).json({ error: 'You must be in a Party to chat in Party channel.' });
      return;
    }
  }

  if (recipientId) {
    let recipientChar = DB.characters.get(recipientId);
    if (!recipientChar) {
      for (const c of DB.characters.values()) {
        if (c.id === recipientId || c.name.toLowerCase() === recipientId.toLowerCase() || c.userId === recipientId) {
          recipientChar = c;
          break;
        }
      }
    }
    if (recipientChar && recipientChar.mutedPlayerIds?.includes(character.id)) {
      res.status(403).json({ error: 'This player has muted you. You cannot send private messages to them.' });
      return;
    }
  }

  const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    channel: channel === 'all' ? 'global' : channel,
    senderId: character.id,
    senderName: character.name,
    senderAvatarUrl: character.avatarUrl,
    senderRole: userAcc?.role || 'PLAYER',
    senderGuildTag: guild?.tag,
    senderTitle: character.title,
    guildId: character.guildId,
    partyId: character.partyId,
    isPrivilege: Boolean(userAcc?.privilegeExpiresAt && new Date(userAcc.privilegeExpiresAt) > new Date()),
    content: purify.sanitize(content),
    timestamp: new Date().toLocaleTimeString(),
    recipientId,
  };

  DB.fullChatLog.push(msg);
  DB.chatMessages.push(msg);
  if (DB.chatMessages.length > 50) {
    DB.chatMessages.shift();
  }

  res.json({ message: msg });
});

// CHAT: Fetch Messages
chatRouter.get('/messages', (req, res) => {
  res.json({
    messages: DB.chatMessages.slice(-50),
    totalLogged: DB.fullChatLog.length,
    viewLimit: 50,
  });
});
