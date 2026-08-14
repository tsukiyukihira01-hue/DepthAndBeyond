import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, setLogLevel, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Read config from firebase-applet-config.json
import firebaseConfig from '../../firebase-applet-config.json';

try {
  setLogLevel('silent');
} catch {}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreInstance: Firestore | null = null;

export const getDb = (): Firestore => {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
};

export const auth = getAuth(app);
export default app;

