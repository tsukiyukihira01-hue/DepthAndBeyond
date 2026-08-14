import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { UserAccount, Character } from '../src/types/game';
import { firebaseDb, withTimeout } from './config';
import { DB, defaultAdminUser, defaultAdminChar, syncCharacterToMemory } from './db';

export async function findUserInFirestore(emailOrQuery: string, googleId?: string): Promise<UserAccount | null> {
  if (!firebaseDb) return null;
  const clean = emailOrQuery.trim().toLowerCase();
  const numericId = clean.replace(/^#/, '');

  try {
    const fetchPromise = (async () => {
      // 1. Search by googleId
      if (googleId) {
        const q = query(collection(firebaseDb, 'users'), where('googleId', '==', googleId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const users = snap.docs.map((d) => d.data() as UserAccount);
          // Pick primary / earliest created user account if duplicates exist
          users.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          const primaryUser = users[0];
          DB.users.set(primaryUser.id, primaryUser);
          return primaryUser;
        }
      }

      // 2. Search by email
      if (clean.includes('@')) {
        const q = query(collection(firebaseDb, 'users'), where('email', '==', clean));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const users = snap.docs.map((d) => d.data() as UserAccount);
          users.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          const primaryUser = users[0];
          DB.users.set(primaryUser.id, primaryUser);
          return primaryUser;
        }
      }

      // 3. Search by numeric userId
      if (numericId && !isNaN(Number(numericId))) {
        const q = query(collection(firebaseDb, 'users'), where('userId', '==', numericId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const u = snap.docs[0].data() as UserAccount;
          DB.users.set(u.id, u);
          return u;
        }
      }

      // 4. Search by account document id (e.g., usr_...)
      if (clean.startsWith('usr_')) {
        const q = query(collection(firebaseDb, 'users'), where('id', '==', clean));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const u = snap.docs[0].data() as UserAccount;
          DB.users.set(u.id, u);
          return u;
        }
      }

      return null;
    })();

    return await withTimeout(fetchPromise, 8000);
  } catch (err) {
    console.error('[Firestore] findUserInFirestore error:', err);
    return null;
  }
}

export function saveUserToFirestore(user: UserAccount): void {
  if (!user) return;
  DB.users.set(user.id, user);
  if (!firebaseDb) return;
  setDoc(doc(firebaseDb, 'users', user.id), user).catch(() => {});
}

export function saveCharacterToFirestore(character: Character): void {
  if (!character) return;
  syncCharacterToMemory(character);
  if (!firebaseDb) return;
  setDoc(doc(firebaseDb, 'characters', character.id), character).catch(() => {});
}

export async function isCharacterNameTaken(name: string, excludeCharId?: string): Promise<boolean> {
  const targetLower = name.trim().toLowerCase();

  // 1. Check in-memory map (0ms)
  for (const c of DB.characters.values()) {
    if (excludeCharId && c.id === excludeCharId) continue;
    if (c.name && c.name.trim().toLowerCase() === targetLower) {
      return true;
    }
  }

  // 2. Check Firestore with timeout (600ms max)
  if (firebaseDb) {
    try {
      const fetchPromise = (async () => {
        const q = query(collection(firebaseDb, 'characters'), where('name', '==', name.trim()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          for (const d of snap.docs) {
            const char = d.data() as Character;
            if (excludeCharId && char.id === excludeCharId) continue;
            return true;
          }
        }
        return false;
      })();
      const res = await withTimeout(fetchPromise, 600);
      if (res === true) return true;
    } catch {}
  }

  return false;
}

// Automatically persist default admin account and character to Firestore on boot
if (firebaseDb) {
  saveUserToFirestore(defaultAdminUser);
  saveCharacterToFirestore(defaultAdminChar);
}
