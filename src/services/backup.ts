import { Account, Category, Transaction, Budget, UserSettings } from '../types';
import { db, isFirebaseConfigured } from './firebase';
import { doc, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, DEFAULT_USER_SETTINGS } from './demoData';

export interface BackupData {
  version: string;
  exportedAt: string;
  appName: string;
  ownerEmail?: string;
  ownerUid?: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  settings?: UserSettings;
}

export function generateBackupJson(
  accounts: Account[],
  categories: Category[],
  transactions: Transaction[],
  budgets: Budget[],
  settings?: UserSettings,
  ownerEmail?: string,
  ownerUid?: string
): string {
  const data: BackupData = {
    version: '1.0',
    appName: 'MoneyFlow',
    exportedAt: new Date().toISOString(),
    ownerEmail: ownerEmail || undefined,
    ownerUid: ownerUid || undefined,
    accounts,
    categories,
    transactions,
    budgets,
    settings,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadJsonFile(content: string, filename = 'moneyflow-backup.json') {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackupJson(jsonString: string): { valid: boolean; data?: BackupData; error?: string } {
  try {
    const data = JSON.parse(jsonString) as BackupData;
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid JSON format' };
    }
    if (!Array.isArray(data.accounts) || !Array.isArray(data.categories) || !Array.isArray(data.transactions)) {
      return { valid: false, error: 'Backup is missing required collections (accounts, categories, or transactions)' };
    }
    return { valid: true, data };
  } catch (err) {
    return { valid: false, error: 'Could not parse JSON file: ' + (err instanceof Error ? err.message : String(err)) };
  }
}

export async function restoreBackup(
  userId: string,
  backup: BackupData,
  mode: 'replace' | 'merge',
  currentUserEmail?: string
): Promise<void> {
  // STRICT USER DATA ISOLATION SECURITY CHECK:
  // Ensure that backup data belonging to one user can NEVER be restored into another user's session
  if (currentUserEmail && backup.ownerEmail) {
    const cleanCurrent = currentUserEmail.trim().toLowerCase();
    const cleanOwner = backup.ownerEmail.trim().toLowerCase();
    if (cleanCurrent !== cleanOwner) {
      throw new Error(
        `Security Error: This backup belongs to "${backup.ownerEmail}". It cannot be restored into account "${currentUserEmail}". User data isolation is enforced.`
      );
    }
  }

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    if (mode === 'replace') {
      // Clear existing subcollections
      const subcollections = ['transactions', 'budgets', 'categories', 'accounts'];
      for (const sub of subcollections) {
        const snap = await getDocs(collection(db, 'users', userId, sub));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
    }

    // Write new items
    const batch = writeBatch(db);
    for (const acc of backup.accounts) {
      batch.set(doc(db, 'users', userId, 'accounts', acc.id), acc);
    }
    for (const cat of backup.categories) {
      batch.set(doc(db, 'users', userId, 'categories', cat.id), cat);
    }
    for (const tx of backup.transactions) {
      batch.set(doc(db, 'users', userId, 'transactions', tx.id), tx);
    }
    for (const bgt of backup.budgets || []) {
      batch.set(doc(db, 'users', userId, 'budgets', bgt.id), bgt);
    }
    if (backup.settings) {
      batch.set(doc(db, 'users', userId, 'settings', 'preferences'), backup.settings);
    }
    await batch.commit();
    return;
  }

  // Local storage mode
  const accountsKey = `moneyflow_accounts_${userId}`;
  const categoriesKey = `moneyflow_categories_${userId}`;
  const transactionsKey = `moneyflow_transactions_${userId}`;
  const budgetsKey = `moneyflow_budgets_${userId}`;
  const settingsKey = `moneyflow_settings_${userId}`;

  if (mode === 'replace') {
    localStorage.setItem(accountsKey, JSON.stringify(backup.accounts));
    localStorage.setItem(categoriesKey, JSON.stringify(backup.categories));
    localStorage.setItem(transactionsKey, JSON.stringify(backup.transactions));
    localStorage.setItem(budgetsKey, JSON.stringify(backup.budgets || []));
    if (backup.settings) {
      localStorage.setItem(settingsKey, JSON.stringify(backup.settings));
    }
  } else {
    // Merge
    const existingAcc: Account[] = JSON.parse(localStorage.getItem(accountsKey) || '[]');
    const existingCat: Category[] = JSON.parse(localStorage.getItem(categoriesKey) || '[]');
    const existingTx: Transaction[] = JSON.parse(localStorage.getItem(transactionsKey) || '[]');
    const existingBgt: Budget[] = JSON.parse(localStorage.getItem(budgetsKey) || '[]');

    const mergedAcc = [...existingAcc];
    for (const a of backup.accounts) {
      if (!mergedAcc.some((x) => x.id === a.id)) mergedAcc.push(a);
    }

    const mergedCat = [...existingCat];
    for (const c of backup.categories) {
      if (!mergedCat.some((x) => x.id === c.id)) mergedCat.push(c);
    }

    const mergedTx = [...existingTx];
    for (const t of backup.transactions) {
      if (!mergedTx.some((x) => x.id === t.id)) mergedTx.push(t);
    }

    const mergedBgt = [...existingBgt];
    for (const b of backup.budgets || []) {
      if (!mergedBgt.some((x) => x.id === b.id)) mergedBgt.push(b);
    }

    localStorage.setItem(accountsKey, JSON.stringify(mergedAcc));
    localStorage.setItem(categoriesKey, JSON.stringify(mergedCat));
    localStorage.setItem(transactionsKey, JSON.stringify(mergedTx));
    localStorage.setItem(budgetsKey, JSON.stringify(mergedBgt));
  }

  window.dispatchEvent(new CustomEvent('moneyflow_accounts_changed', { detail: { userId } }));
  window.dispatchEvent(new CustomEvent('moneyflow_categories_changed', { detail: { userId } }));
  window.dispatchEvent(new CustomEvent('moneyflow_transactions_changed', { detail: { userId } }));
  window.dispatchEvent(new CustomEvent('moneyflow_budgets_changed', { detail: { userId } }));
  window.dispatchEvent(new CustomEvent('moneyflow_settings_changed', { detail: { userId } }));
}

export async function resetUserData(
  userId: string,
  target: 'all' | 'transactions' | 'budgets' | 'categories' | 'accounts'
): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    if (target === 'all' || target === 'transactions') {
      const snap = await getDocs(collection(db, 'users', userId, 'transactions'));
      for (const d of snap.docs) await deleteDoc(d.ref);
    }
    if (target === 'all' || target === 'budgets') {
      const snap = await getDocs(collection(db, 'users', userId, 'budgets'));
      for (const d of snap.docs) await deleteDoc(d.ref);
    }
    if (target === 'all' || target === 'categories') {
      const snap = await getDocs(collection(db, 'users', userId, 'categories'));
      for (const d of snap.docs) await deleteDoc(d.ref);
      // Re-seed default categories
      const batch = writeBatch(db);
      for (const cat of INITIAL_CATEGORIES) {
        batch.set(doc(db, 'users', userId, 'categories', cat.id), cat);
      }
      await batch.commit();
    }
    if (target === 'all' || target === 'accounts') {
      const snap = await getDocs(collection(db, 'users', userId, 'accounts'));
      for (const d of snap.docs) await deleteDoc(d.ref);
      // Re-seed default accounts
      const batch = writeBatch(db);
      for (const acc of INITIAL_ACCOUNTS) {
        batch.set(doc(db, 'users', userId, 'accounts', acc.id), acc);
      }
      await batch.commit();
    }
    return;
  }

  // Local storage reset
  if (target === 'all' || target === 'transactions') {
    localStorage.setItem(`moneyflow_transactions_${userId}`, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('moneyflow_transactions_changed', { detail: { userId } }));
  }
  if (target === 'all' || target === 'budgets') {
    localStorage.setItem(`moneyflow_budgets_${userId}`, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('moneyflow_budgets_changed', { detail: { userId } }));
  }
  if (target === 'all' || target === 'categories') {
    localStorage.setItem(`moneyflow_categories_${userId}`, JSON.stringify(INITIAL_CATEGORIES));
    window.dispatchEvent(new CustomEvent('moneyflow_categories_changed', { detail: { userId } }));
  }
  if (target === 'all' || target === 'accounts') {
    localStorage.setItem(`moneyflow_accounts_${userId}`, JSON.stringify(INITIAL_ACCOUNTS));
    window.dispatchEvent(new CustomEvent('moneyflow_accounts_changed', { detail: { userId } }));
  }
  if (target === 'all') {
    localStorage.setItem(`moneyflow_settings_${userId}`, JSON.stringify(DEFAULT_USER_SETTINGS));
    window.dispatchEvent(new CustomEvent('moneyflow_settings_changed', { detail: { userId } }));
  }
}
