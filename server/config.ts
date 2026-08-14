import path from 'path';
import fs from 'fs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';

export const PORT = Number(process.env.PORT) || 3000;
export const SERVER_VERSION = 'v0.2.5_ALPHA';

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'xshiyanliu@gmail.com').toLowerCase().trim();
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nancha2020';

// Initialize Server-side Firestore
export let firebaseDb: ReturnType<typeof getFirestore> | null = null;
export let firebaseConfig: any = null;

try {
  setLogLevel('silent');
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const rawDbId = firebaseConfig.firestoreDatabaseId;
    const dbId =
      rawDbId &&
      typeof rawDbId === 'string' &&
      rawDbId.trim() !== '' &&
      rawDbId.trim() !== '(default)'
        ? rawDbId.trim()
        : undefined;
    firebaseDb = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    console.log('[Firestore] Server-side Firestore connection initialized successfully.');
  }
} catch (err) {
  console.error('[Firestore] Server-side initialization error:', err);
}

export function withTimeout<T>(promise: Promise<T>, ms = 600): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
