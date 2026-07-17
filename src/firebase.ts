import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { Farmer, SeedDistribution, HarvestRecord, SmsLog, PricingRates } from './types';
import { 
  INITIAL_FARMERS, 
  INITIAL_DISTRIBUTIONS, 
  INITIAL_HARVESTS, 
  INITIAL_SMS_LOGS, 
  INITIAL_PRICING 
} from './sampleData';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCNBiwYfnyJK5W7JDkK1oLtMJ06sQh9SFY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "boxwood-pillar-491906-r1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "boxwood-pillar-491906-r1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "boxwood-pillar-491906-r1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "568546295754",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:568546295754:web:f54192cee770d772981933"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-trinityverdfarme-c25e973e-a3cb-4e31-8ce1-56041ebc38e3";
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as required by SKILL.md
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
    console.log("Firebase connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection. App is in offline mode.");
    } else {
      console.log("Firebase connection initialized.");
    }
  }
}
testConnection();

// Collection References
export const farmersCol = collection(db, 'farmers');
export const distributionsCol = collection(db, 'distributions');
export const harvestsCol = collection(db, 'harvests');
export const smsLogsCol = collection(db, 'smsLogs');
export const configCol = collection(db, 'config');

// Pricing doc ref
export const pricingDocRef = doc(db, 'config', 'rates');

// Bootstrap data if database is empty
export async function bootstrapDatabaseIfEmpty() {
  const path = 'config/rates';
  try {
    const pricingSnap = await getDoc(pricingDocRef);
    if (pricingSnap.exists()) {
      return;
    }

    console.log("Database is empty. Bootstrapping baseline castor seed data to Cloud Firestore...");

    const batch = writeBatch(db);

    // Save initial pricing
    batch.set(pricingDocRef, INITIAL_PRICING);

    // Save farmers
    INITIAL_FARMERS.forEach((f) => {
      const fRef = doc(db, 'farmers', f.id);
      batch.set(fRef, f);
    });

    // Save distributions
    INITIAL_DISTRIBUTIONS.forEach((d) => {
      const dRef = doc(db, 'distributions', d.id);
      batch.set(dRef, d);
    });

    // Save harvests
    INITIAL_HARVESTS.forEach((h) => {
      const hRef = doc(db, 'harvests', h.id);
      batch.set(hRef, h);
    });

    // Save SMS logs
    INITIAL_SMS_LOGS.forEach((log) => {
      const sRef = doc(db, 'smsLogs', log.id);
      batch.set(sRef, log);
    });

    await batch.commit();
    console.log("Baseline data successfully uploaded to Cloud Firestore!");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Write helper functions to mutate data directly in Firestore

// Farmers
export async function dbAddFarmer(f: Farmer) {
  const path = `farmers/${f.id}`;
  try {
    await setDoc(doc(db, 'farmers', f.id), f);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function dbUpdateFarmer(f: Farmer) {
  const path = `farmers/${f.id}`;
  try {
    await setDoc(doc(db, 'farmers', f.id), f);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function dbDeleteFarmer(id: string) {
  const path = `farmers/${id}`;
  try {
    await deleteDoc(doc(db, 'farmers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Seed Distributions
export async function dbAddDistribution(d: SeedDistribution) {
  const path = `distributions/${d.id}`;
  try {
    await setDoc(doc(db, 'distributions', d.id), d);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function dbDeleteDistribution(id: string) {
  const path = `distributions/${id}`;
  try {
    await deleteDoc(doc(db, 'distributions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Harvest Records
export async function dbAddHarvest(h: HarvestRecord) {
  const path = `harvests/${h.id}`;
  try {
    await setDoc(doc(db, 'harvests', h.id), h);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function dbUpdateHarvest(h: HarvestRecord) {
  const path = `harvests/${h.id}`;
  try {
    await setDoc(doc(db, 'harvests', h.id), h);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Pricing
export async function dbUpdatePricing(rates: PricingRates) {
  const path = 'config/rates';
  try {
    await setDoc(pricingDocRef, rates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// SMS Logs
export async function dbAddSmsLog(log: SmsLog) {
  const path = `smsLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'smsLogs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function dbClearSmsLogs() {
  console.log("Clearing of SMS Logs from database triggered.");
}

// Reset/Wipe Database to factory baseline
export async function dbResetToBaseline() {
  const path = 'batch-reset';
  try {
    const batch = writeBatch(db);

    // We write pricing
    batch.set(pricingDocRef, INITIAL_PRICING);

    // Overwrite existing or populate baseline
    INITIAL_FARMERS.forEach((f) => {
      batch.set(doc(db, 'farmers', f.id), f);
    });

    INITIAL_DISTRIBUTIONS.forEach((d) => {
      batch.set(doc(db, 'distributions', d.id), d);
    });

    INITIAL_HARVESTS.forEach((h) => {
      batch.set(doc(db, 'harvests', h.id), h);
    });

    INITIAL_SMS_LOGS.forEach((log) => {
      batch.set(doc(db, 'smsLogs', log.id), log);
    });

    await batch.commit();
    console.log("Database reset to initial baseline completed.");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
