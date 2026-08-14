import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, collection, getDocs, where } from 'firebase/firestore';
import { DB, getNextUserIdNum, syncCharacterToMemory } from '../db';
import { firebaseDb, withTimeout } from '../config';
import { findUserInFirestore, saveUserToFirestore, saveCharacterToFirestore } from '../firestore';
import { UserAccount, Character, Item } from '../../src/types/game';

export const authRouter = Router();

// AUTH: Google OAuth Token Verification & Firestore Account Management
authRouter.post('/google-oauth', async (req, res) => {
  const { idToken, credential, accessToken, googleUser } = req.body;
  const tokenToVerify = idToken || credential;

  let verifiedPayload: {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  } | null = null;

  if (tokenToVerify) {
    try {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`);
      if (googleRes.ok) {
        const data = await googleRes.json();
        if (data && data.email) {
          verifiedPayload = {
            sub: data.sub,
            email: data.email,
            name: data.name,
            picture: data.picture,
            email_verified: data.email_verified === 'true' || data.email_verified === true,
          };
        }
      }
    } catch (err) {
      console.error('[OAuth] Token verification request error:', err);
    }
  }

  if (!verifiedPayload && accessToken) {
    try {
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (googleRes.ok) {
        const data = await googleRes.json();
        if (data && data.email) {
          verifiedPayload = {
            sub: data.sub,
            email: data.email,
            name: data.name,
            picture: data.picture,
            email_verified: data.email_verified,
          };
        }
      }
    } catch (err) {
      console.error('[OAuth] Userinfo request error:', err);
    }
  }

  if (!verifiedPayload && googleUser && googleUser.email) {
    verifiedPayload = {
      sub: googleUser.uid || googleUser.sub || `google_${Date.now()}`,
      email: googleUser.email,
      name: googleUser.displayName || googleUser.name,
      picture: googleUser.photoURL || googleUser.picture,
      email_verified: true,
    };
  }

  if (!verifiedPayload || !verifiedPayload.email) {
    res.status(401).json({ error: 'Failed to verify Google OAuth token on server.' });
    return;
  }

  const email = verifiedPayload.email.toLowerCase();
  const googleId = verifiedPayload.sub;

  // Search in Firestore first for account retrieval
  let targetUser = await findUserInFirestore(email, googleId);

  // Fallback to in-memory DB if not found in Firestore
  if (!targetUser) {
    for (const u of DB.users.values()) {
      if (u.email.toLowerCase() === email || (u.googleId && u.googleId === googleId)) {
        targetUser = u;
        break;
      }
    }
  }

  if (targetUser) {
    targetUser.lastLoginAt = new Date().toISOString();
    if (googleId && !targetUser.googleId) targetUser.googleId = googleId;
    if (verifiedPayload.picture) targetUser.picture = verifiedPayload.picture;
    if (verifiedPayload.name) targetUser.name = verifiedPayload.name;

    DB.users.set(targetUser.id, targetUser);
    saveUserToFirestore(targetUser);

    let userChars: Character[] = [];
    const charIds = DB.characterByAccount.get(targetUser.id) || [];
    for (const cid of charIds) {
      const c = DB.characters.get(cid);
      if (c) userChars.push(c);
    }

    if (userChars.length === 0 && firebaseDb) {
      try {
        const fetchChars = (async () => {
          const qChar = query(collection(firebaseDb, 'characters'), where('accountId', '==', targetUser.id));
          const snapChar = await getDocs(qChar);
          const chars: Character[] = [];
          snapChar.forEach((d) => chars.push(d.data() as Character));
          return chars;
        })();
        const fsChars = await withTimeout(fetchChars, 8000);
        if (fsChars && fsChars.length > 0) {
          userChars = fsChars;
          userChars.forEach((c) => {
            syncCharacterToMemory(c);
            const existing = DB.characterByAccount.get(targetUser.id) || [];
            if (!existing.includes(c.id)) {
              existing.push(c.id);
              DB.characterByAccount.set(targetUser.id, existing);
            }
          });
        }
      } catch (err) {
        console.error('[Firestore] Character query error:', err);
      }
    }

    const token = `${targetUser.role}_TOKEN_${targetUser.id}_${Date.now()}`;
    res.json({
      success: true,
      user: targetUser,
      character: userChars[0] || null,
      characters: userChars,
      token,
      message: `Google OAuth Login successful. Welcome back ${targetUser.name || targetUser.email}! User ID #${targetUser.userId}`,
    });
    return;
  }

  // Account Creation: First time user registration via Google OAuth
  const role = 'PLAYER';
  const numericUserId = getNextUserIdNum();
  const accId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newUser: UserAccount = {
    id: accId,
    userId: numericUserId,
    email: email,
    name: verifiedPayload.name || email.split('@')[0],
    picture: verifiedPayload.picture || '',
    role: role,
    googleId: googleId,
    isPrimaryGM: false,
    is2FAEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isBanned: false,
  };

  DB.users.set(accId, newUser);
  await saveUserToFirestore(newUser);

  const token = `${newUser.role}_TOKEN_${accId}_${Date.now()}`;
  res.json({
    success: true,
    user: newUser,
    character: null,
    characters: [],
    token,
    message: `Google OAuth Registration successful! Account created with User ID #${numericUserId}.`,
  });
});

// AUTH: Register
authRouter.post('/register', async (req, res) => {
  const { email, password, acceptTerms } = req.body;
  if (!email || !password || !acceptTerms) {
    res.status(400).json({ error: 'Email, password, and EULA acceptance are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  for (const user of DB.users.values()) {
    if (user.email.toLowerCase() === cleanEmail) {
      res.status(400).json({ error: 'An account with this email address already exists. Please log in instead.' });
      return;
    }
  }

  const existingInFs = await findUserInFirestore(cleanEmail);
  if (existingInFs) {
    res.status(400).json({ error: 'An account with this email address already exists in database. Please log in instead.' });
    return;
  }

  const role = 'PLAYER';
  const hashedPassword = await bcrypt.hash(password, 10);
  const accId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const numericUserId = getNextUserIdNum();

  const newUser: UserAccount = {
    id: accId,
    userId: numericUserId,
    email: cleanEmail,
    passwordHash: hashedPassword,
    role,
    isPrimaryGM: false,
    is2FAEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isBanned: false,
  };

  DB.users.set(accId, newUser);
  await saveUserToFirestore(newUser);

  const { passwordHash: _, ...safeUser } = newUser;
  const token = `${newUser.role}_TOKEN_${accId}_${Date.now()}`;

  res.json({
    user: safeUser,
    token,
    character: null,
    characters: [],
    message: `Registration successful. Your User ID is #${numericUserId}. Please create your character.`,
  });
});

// AUTH: Login
authRouter.post('/login', async (req, res) => {
  const { email, password, twoFactorCode } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email (or User ID) and password are required.' });
    return;
  }

  const cleanQuery = email.trim();
  let targetUser: UserAccount | null = null;

  for (const user of DB.users.values()) {
    if (
      user.email.toLowerCase() === cleanQuery.toLowerCase() ||
      user.userId === cleanQuery ||
      `#${user.userId}` === cleanQuery ||
      user.id === cleanQuery
    ) {
      targetUser = user;
      break;
    }
  }

  if (!targetUser) {
    targetUser = await findUserInFirestore(cleanQuery);
  }

  if (!targetUser) {
    res.status(400).json({ error: 'Invalid email/User ID or password.' });
    return;
  }

  if (targetUser.isBanned) {
    if (targetUser.banUntil) {
      const banExpiresAt = new Date(targetUser.banUntil).getTime();
      if (Date.now() > banExpiresAt) {
        targetUser.isBanned = false;
        targetUser.banUntil = undefined;
        targetUser.banReason = undefined;
      } else {
        res.status(403).json({ error: `Account suspended until ${new Date(targetUser.banUntil).toLocaleString()}. Reason: ${targetUser.banReason || 'Rule violation'}` });
        return;
      }
    } else {
      res.status(403).json({ error: `Account permanently suspended. Reason: ${targetUser.banReason || 'Rule violation'}` });
      return;
    }
  }

  let isPasswordValid = false;
  if (targetUser.passwordHash) {
    isPasswordValid = await bcrypt.compare(password, targetUser.passwordHash);
  } else if (targetUser.googleId) {
    res.status(400).json({ error: 'This account was registered using Google OAuth. Please click "Sign in with Google".' });
    return;
  }

  if (!isPasswordValid) {
    res.status(400).json({ error: 'Invalid email/User ID or password.' });
    return;
  }

  if (targetUser.is2FAEnabled) {
    const clean2FA = (twoFactorCode || '').toString().trim().replace(/\s+|-/g, '');
    if (!clean2FA) {
      res.status(401).json({ requires2FA: true, message: 'Two-Factor Authentication code required.' });
      return;
    }
    const validCodes: string[] = [];
    if (targetUser.twoFactorSecret) {
      validCodes.push(targetUser.twoFactorSecret.toString().trim());
    }
    if (validCodes.length === 0 || !validCodes.includes(clean2FA)) {
      res.status(400).json({ error: 'Invalid 2FA Verification Code.' });
      return;
    }
  }

  targetUser.lastLoginAt = new Date().toISOString();
  DB.users.set(targetUser.id, targetUser);
  saveUserToFirestore(targetUser);

  const token = `${targetUser.role}_TOKEN_${targetUser.id}_${Date.now()}`;

  let userChars: Character[] = [];
  const charIds = DB.characterByAccount.get(targetUser.id) || [];
  for (const cid of charIds) {
    const c = DB.characters.get(cid);
    if (c) userChars.push(c);
  }

  if (userChars.length === 0 && firebaseDb) {
    try {
      const fetchChars = (async () => {
        const qChar = query(collection(firebaseDb, 'characters'), where('accountId', '==', targetUser.id));
        const snapChar = await getDocs(qChar);
        const chars: Character[] = [];
        snapChar.forEach((d) => chars.push(d.data() as Character));
        return chars;
      })();
      const fsChars = await withTimeout(fetchChars, 600);
      if (fsChars && fsChars.length > 0) {
        userChars = fsChars;
        userChars.forEach((c) => syncCharacterToMemory(c));
      }
    } catch {}
  }

  if (userChars.length === 0) {
    const fallbackChar: Character = {
      id: `char_${targetUser.id}_01`,
      userId: targetUser.userId,
      accountId: targetUser.id,
      name: targetUser.name || targetUser.email.split('@')[0],
      title: targetUser.role === 'ADMIN' ? 'Game Master' : 'Adventurer',
      faction: 'HEAVENLY',
      level: targetUser.role === 'ADMIN' ? 99 : 1,
      exp: 0,
      maxExp: targetUser.role === 'ADMIN' ? 10000000 : 16500,
      gold: targetUser.role === 'ADMIN' ? 1000000 : 500,
      tokens: targetUser.role === 'ADMIN' ? 5000 : 10,
      stats: targetUser.role === 'ADMIN'
        ? { str: 500, def: 500, int: 500, wis: 500, spd: 500, dex: 500, maxHp: 10000, hp: 10000, maxMana: 5000, mana: 5000, ward: 0, maxWard: 0, unassignedPoints: 0 }
        : { str: 10, def: 10, int: 10, wis: 10, spd: 10, dex: 10, maxHp: 150, hp: 150, maxMana: 100, mana: 100, ward: 0, maxWard: 0, unassignedPoints: 0 },
      goldLeaf: 0,
      bankGold: 0,
      currentZoneId: 'city',
      inventory: Array(30).fill(null),
      inventoryLimit: 9999,
      equipment: {},
      skills: [],
      equippedSkills: { passives: [null, null, null, null], autoCast: null, actives: [null, null, null] },
      familiar: null,
      loadoutSpec: 'A',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isOnline: true,
      lastActive: new Date().toISOString(),
    };
    saveCharacterToFirestore(fallbackChar);
    userChars.push(fallbackChar);
  }

  const { passwordHash: _, ...safeUser } = targetUser;

  res.json({
    user: safeUser,
    token,
    characters: userChars,
  });
});

// AUTH: Verify Session Token / Remember Me Cookie
authRouter.post('/verify-session', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(401).json({ error: 'No session token provided.' });
    return;
  }

  let targetUser: UserAccount | null = null;

  // Extract accId from token if formatted like `${role}_TOKEN_${accId}_${timestamp}`
  const tokenParts = token.split('_TOKEN_');
  if (tokenParts.length > 1) {
    const rawAcc = tokenParts[1].split('_');
    if (rawAcc.length >= 2) {
      const accId = `${rawAcc[0]}_${rawAcc[1]}`;
      targetUser = DB.users.get(accId) || await findUserInFirestore(accId);
    }
  }

  if (!targetUser) {
    // Search in DB.users values
    for (const u of DB.users.values()) {
      if (token.includes(u.id) || u.id === token || u.email === token || String(u.userId) === token) {
        targetUser = u;
        break;
      }
    }
  }

  if (!targetUser) {
    targetUser = await findUserInFirestore(token);
  }

  if (!targetUser) {
    res.status(401).json({ error: 'Session token invalid or expired.' });
    return;
  }

  if (targetUser.isBanned) {
    res.status(403).json({ error: 'Account suspended by GM Admin.' });
    return;
  }

  targetUser.lastLoginAt = new Date().toISOString();
  DB.users.set(targetUser.id, targetUser);
  saveUserToFirestore(targetUser);

  let userChars: Character[] = [];
  const charIds = DB.characterByAccount.get(targetUser.id) || [];
  for (const cid of charIds) {
    const c = DB.characters.get(cid);
    if (c) userChars.push(c);
  }

  if (userChars.length === 0 && firebaseDb) {
    try {
      const fetchChars = (async () => {
        const qChar = query(collection(firebaseDb, 'characters'), where('accountId', '==', targetUser.id));
        const snapChar = await getDocs(qChar);
        const chars: Character[] = [];
        snapChar.forEach((d) => chars.push(d.data() as Character));
        return chars;
      })();
      const fsChars = await withTimeout(fetchChars, 8000);
      if (fsChars && fsChars.length > 0) {
        userChars = fsChars;
        userChars.forEach((c) => {
          syncCharacterToMemory(c);
          const existing = DB.characterByAccount.get(targetUser.id) || [];
          if (!existing.includes(c.id)) {
            existing.push(c.id);
            DB.characterByAccount.set(targetUser.id, existing);
          }
        });
      }
    } catch {}
  }

  const { passwordHash: _, ...safeUser } = targetUser;
  const newToken = `${targetUser.role}_TOKEN_${targetUser.id}_${Date.now()}`;

  res.json({
    success: true,
    user: safeUser,
    character: userChars[0] || null,
    characters: userChars,
    token: newToken,
  });
});

