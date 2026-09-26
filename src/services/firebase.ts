import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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
  };
}

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: appletConfig.apiKey || env.VITE_FIREBASE_API_KEY || '',
  authDomain: appletConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: appletConfig.projectId || env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: appletConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: appletConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: appletConfig.appId || env.VITE_FIREBASE_APP_ID || '',
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== ''
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    authInstance = getAuth(app);
    
    // Initialize Firestore with specific databaseId if provisioned
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(app);
    }

    // Initial connection test as recommended by skill
    getDocFromServer(doc(dbInstance, 'test', 'connection')).catch((error) => {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Firebase client is offline or network unreachable.');
      }
    });
  } catch (err) {
    console.error('Failed to initialize Firebase with provided environment config:', err);
  }
}

export const auth = authInstance;
export const db = dbInstance;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentAuthUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuthUser?.uid || null,
      email: currentAuthUser?.email || null,
      emailVerified: currentAuthUser?.emailVerified || false,
      isAnonymous: currentAuthUser?.isAnonymous || false,
      tenantId: currentAuthUser?.tenantId || null,
      providerInfo:
        currentAuthUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
