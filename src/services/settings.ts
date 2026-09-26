import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { UserSettings } from '../types';
import { DEFAULT_USER_SETTINGS } from './demoData';

const LOCAL_STORAGE_KEY_PREFIX = 'moneyflow_settings_';

function getLocalSettingsKey(userId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
}

export function subscribeToSettings(
  userId: string,
  onUpdate: (settings: UserSettings) => void
): () => void {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/settings/preferences`;
    const docRef = doc(db, 'users', userId, 'settings', 'preferences');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as UserSettings);
        } else {
          // Initialize with default
          setDoc(docRef, { ...DEFAULT_USER_SETTINGS, updatedAt: new Date().toISOString() });
          onUpdate(DEFAULT_USER_SETTINGS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    );

    return unsubscribe;
  }

  // Local storage fallback for demo user
  const localKey = getLocalSettingsKey(userId);
  const loadLocal = () => {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        onUpdate(parsed);
        return;
      } catch {
        // Fallback
      }
    }
    localStorage.setItem(localKey, JSON.stringify(DEFAULT_USER_SETTINGS));
    onUpdate(DEFAULT_USER_SETTINGS);
  };

  loadLocal();

  const handleCustomEvent = (e: CustomEvent<{ userId: string }>) => {
    if (e.detail?.userId === userId) {
      loadLocal();
    }
  };

  window.addEventListener('moneyflow_settings_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  return () => {
    window.removeEventListener('moneyflow_settings_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  };
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<UserSettings>
): Promise<void> {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/settings/preferences`;
    try {
      await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), {
        ...updates,
        updatedAt: now,
      }, { merge: true });
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  }

  const localKey = getLocalSettingsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: UserSettings = raw ? JSON.parse(raw) : { ...DEFAULT_USER_SETTINGS };
  const updated: UserSettings = { ...current, ...updates, updatedAt: now };
  localStorage.setItem(localKey, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('moneyflow_settings_changed', { detail: { userId } }));
}
