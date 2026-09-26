import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Account, Transaction } from '../types';
import { INITIAL_ACCOUNTS } from './demoData';

const LOCAL_STORAGE_KEY_PREFIX = 'moneyflow_accounts_';

function getLocalAccountsKey(userId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
}

export function subscribeToAccounts(
  userId: string,
  onUpdate: (accounts: Account[]) => void
): () => void {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const colPath = `users/${userId}/accounts`;
    const colRef = collection(db, 'users', userId, 'accounts');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          initializeDefaultAccounts(userId);
          return;
        }
        const accounts: Account[] = [];
        snapshot.forEach((docSnap) => {
          accounts.push({ id: docSnap.id, ...(docSnap.data() as Omit<Account, 'id'>) });
        });
        onUpdate(accounts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );

    return unsubscribe;
  }

  // Local storage fallback for demo user
  const localKey = getLocalAccountsKey(userId);
  const loadLocal = () => {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        onUpdate(parsed);
        return;
      } catch {
        // Fallback below
      }
    }
    localStorage.setItem(localKey, JSON.stringify(INITIAL_ACCOUNTS));
    onUpdate(INITIAL_ACCOUNTS);
  };

  loadLocal();

  const handleCustomEvent = (e: CustomEvent<{ userId: string }>) => {
    if (e.detail?.userId === userId) {
      loadLocal();
    }
  };

  window.addEventListener('moneyflow_accounts_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  return () => {
    window.removeEventListener('moneyflow_accounts_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  };
}

export async function initializeDefaultAccounts(userId: string): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const batch = writeBatch(db);
    for (const acc of INITIAL_ACCOUNTS) {
      const docRef = doc(db, 'users', userId, 'accounts', acc.id);
      batch.set(docRef, {
        name: acc.name,
        type: acc.type,
        icon: acc.icon,
        color: acc.color,
        initialBalance: acc.initialBalance,
        currentBalance: acc.initialBalance,
        currency: acc.currency,
        description: acc.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  } else {
    localStorage.setItem(getLocalAccountsKey(userId), JSON.stringify(INITIAL_ACCOUNTS));
    window.dispatchEvent(new CustomEvent('moneyflow_accounts_changed', { detail: { userId } }));
  }
}

export async function createAccount(
  userId: string,
  accountData: Omit<Account, 'id' | 'currentBalance'>
): Promise<string> {
  const id = `acc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/accounts/${id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'accounts', id), {
        ...accountData,
        currentBalance: accountData.initialBalance,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    }
  }

  const localKey = getLocalAccountsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Account[] = raw ? JSON.parse(raw) : [...INITIAL_ACCOUNTS];
  const newAcc: Account = {
    id,
    ...accountData,
    currentBalance: accountData.initialBalance,
    createdAt: now,
    updatedAt: now,
  };
  current.push(newAcc);
  localStorage.setItem(localKey, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('moneyflow_accounts_changed', { detail: { userId } }));
  return id;
}

export async function updateAccount(
  userId: string,
  accountId: string,
  updates: Partial<Omit<Account, 'id'>>
): Promise<void> {
  const now = new Date().toISOString();
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/accounts/${accountId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'accounts', accountId), {
        ...updates,
        updatedAt: now,
      });
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  }

  const localKey = getLocalAccountsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Account[] = raw ? JSON.parse(raw) : [...INITIAL_ACCOUNTS];
  const idx = current.findIndex((a) => a.id === accountId);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...updates, updatedAt: now };
    localStorage.setItem(localKey, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('moneyflow_accounts_changed', { detail: { userId } }));
  }
}

export async function deleteAccount(userId: string, accountId: string): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/accounts/${accountId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'accounts', accountId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  }

  const localKey = getLocalAccountsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Account[] = raw ? JSON.parse(raw) : [...INITIAL_ACCOUNTS];
  const filtered = current.filter((a) => a.id !== accountId);
  localStorage.setItem(localKey, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('moneyflow_accounts_changed', { detail: { userId } }));
}

/**
 * Calculates updated account balances given accounts and list of all transactions
 */
export function calculateAccountBalances(accounts: Account[], transactions: Transaction[]): Account[] {
  return accounts.map((acc) => {
    let balance = acc.initialBalance;

    for (const tx of transactions) {
      if (tx.type === 'income' && tx.accountId === acc.id) {
        balance += tx.amount;
      } else if (tx.type === 'expense' && tx.accountId === acc.id) {
        balance -= tx.amount;
      } else if (tx.type === 'transfer') {
        if (tx.fromAccountId === acc.id) {
          balance -= tx.amount;
        }
        if (tx.toAccountId === acc.id) {
          balance += tx.amount;
        }
      }
    }

    return {
      ...acc,
      currentBalance: Math.round(balance * 100) / 100,
    };
  });
}
