import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PORT, SERVER_VERSION, firebaseDb } from './server/config';
import { DB } from './server/db';
import { corsAndNonceMiddleware } from './server/middleware';
import { authRouter } from './server/routes/auth';
import { characterRouter } from './server/routes/character';
import { playerRouter, playersRouter } from './server/routes/player';
import { familiarRouter } from './server/routes/familiar';
import { combatRouter } from './server/routes/combat';
import { blacksmithRouter } from './server/routes/blacksmith';
import { guildRouter } from './server/routes/guild';
import { chatRouter } from './server/routes/chat';
import { adminRouter } from './server/routes/admin';

const app = express();

app.use(express.json());
app.use(corsAndNonceMiddleware);

// HEALTH CHECK API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: SERVER_VERSION,
    serverTime: new Date().toISOString(),
    activeUsers: DB.users.size,
    maintenance: DB.maintenanceMode,
    firestoreConnected: !!firebaseDb,
  });
});

// PUBLIC LANDING STATS API
app.get('/api/public/landing-stats', (req, res) => {
  const totalUsers = DB.users.size;
  const totalCharacters = DB.characters.size;
  const totalGuilds = DB.guilds.size;
  const activeMarketListings = DB.marketplace.size;
  const activeRaids = Array.from(DB.raidInstances.values()).map((r) => ({
    id: r.id,
    name: r.name,
    currentHp: r.currentHp,
    maxHp: r.maxHp,
    turnEndsAt: r.turnEndsAt,
  }));
  const topGuilds = Array.from(DB.guilds.values())
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 5)
    .map((g) => ({
      id: g.id,
      name: g.name,
      tag: g.tag,
      symbol: g.symbol,
      reputation: g.reputation,
      memberCount: g.memberCount,
      leaderName: g.leaderName,
    }));

  const recentEvents = DB.adminAuditLogs.slice(-5).map((l) => ({
    id: l.id,
    action: l.action,
    details: `${l.adminEmail} performed ${l.action}`,
    timestamp: l.createdAt,
  }));

  res.json({
    totalUsers,
    totalCharacters,
    totalGuilds,
    activeMarketListings,
    activeRaids,
    topGuilds,
    recentEvents,
    serverTime: new Date().toISOString(),
    maintenance: DB.maintenanceMode,
  });
});

// ROUTE MODULE MOUNTING
app.use('/api/auth', authRouter);
app.use('/api/character', characterRouter);
app.use('/api/player', playerRouter);
app.use('/api/players', playersRouter);
app.use('/api/familiar', familiarRouter);
app.use('/api/combat', combatRouter);
app.use('/api/blacksmith', blacksmithRouter);
app.use('/api/guild', guildRouter);
app.use('/api/chat', chatRouter);
app.use('/api/admin', adminRouter);

// Periodic 1s Server Tick for Raid Turn Timer
setInterval(() => {
  const now = Date.now();
  for (const [, raid] of DB.raidInstances) {
    if (now > raid.turnEndsAt) {
      raid.turnEndsAt = now + 5000;
    }
  }
}, 1000);

// VITE MIDDLEWARE & SERVER BOOTSTRAP
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Depth and Beyond] Modular server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
