import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Transaction, DateGroupedTransactions, MonthlyStats, Category } from '../types';
import { DEMO_TRANSACTIONS } from './demoData';
import { formatTransactionDate } from '../utils/date';

const LOCAL_STORAGE_KEY_PREFIX = 'moneyflow_transactions_';

function getLocalTransactionsKey(userId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
}

export function subscribeToTransactions(
  userId: string,
  onUpdate: (transactions: Transaction[]) => void
): () => void {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const colPath = `users/${userId}/transactions`;
    const colRef = collection(db, 'users', userId, 'transactions');
    const q = query(colRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactions: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          transactions.push({ id: docSnap.id, ...(docSnap.data() as Omit<Transaction, 'id'>) });
        });
        onUpdate(transactions);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );

    return unsubscribe;
  }

  // Local storage fallback for demo user
  const localKey = getLocalTransactionsKey(userId);
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
    // Seed with demo transactions if user has nothing
    localStorage.setItem(localKey, JSON.stringify(DEMO_TRANSACTIONS));
    onUpdate(DEMO_TRANSACTIONS);
  };

  loadLocal();

  const handleCustomEvent = (e: CustomEvent<{ userId: string }>) => {
    if (e.detail?.userId === userId) {
      loadLocal();
    }
  };

  window.addEventListener('moneyflow_transactions_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  return () => {
    window.removeEventListener('moneyflow_transactions_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  };
}

export async function createTransaction(
  userId: string,
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/transactions/${id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'transactions', id), {
        ...data,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    }
  }

  const localKey = getLocalTransactionsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Transaction[] = raw ? JSON.parse(raw) : [...DEMO_TRANSACTIONS];
  const newTx: Transaction = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  // Prepend to show immediately at top
  current.unshift(newTx);
  localStorage.setItem(localKey, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('moneyflow_transactions_changed', { detail: { userId } }));
  return id;
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<void> {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/transactions/${transactionId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'transactions', transactionId), {
        ...updates,
        updatedAt: now,
      });
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  }

  const localKey = getLocalTransactionsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Transaction[] = raw ? JSON.parse(raw) : [...DEMO_TRANSACTIONS];
  const idx = current.findIndex((t) => t.id === transactionId);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...updates, updatedAt: now };
    localStorage.setItem(localKey, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('moneyflow_transactions_changed', { detail: { userId } }));
  }
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/transactions/${transactionId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  }

  const localKey = getLocalTransactionsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Transaction[] = raw ? JSON.parse(raw) : [...DEMO_TRANSACTIONS];
  const filtered = current.filter((t) => t.id !== transactionId);
  localStorage.setItem(localKey, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('moneyflow_transactions_changed', { detail: { userId } }));
}

/**
 * Group transactions by day: e.g. Sep 13, Sunday
 */
export function groupTransactionsByDate(transactions: Transaction[]): DateGroupedTransactions[] {
  const map: Record<string, Transaction[]> = {};

  // Sort descending by date
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const tx of sorted) {
    const dateKey = tx.date.split('T')[0];
    if (!map[dateKey]) {
      map[dateKey] = [];
    }
    map[dateKey].push(tx);
  }

  return Object.keys(map)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((dateStr) => {
      const txs = map[dateStr];
      const totalExpense = txs
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = txs
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        dateStr,
        displayDate: formatTransactionDate(dateStr),
        totalExpense,
        totalIncome,
        transactions: txs,
      };
    });
}

/**
 * Calculate full monthly summary statistics
 */
export function calculateMonthlyStats(
  transactions: Transaction[],
  monthKey: string, // YYYY-MM
  categories: Category[]
): MonthlyStats {
  const monthTransactions = transactions.filter((t) => t.date.startsWith(monthKey));

  let totalIncome = 0;
  let totalExpense = 0;
  let largestExpenseAmount = 0;
  let largestExpenseCategory: string | null = null;
  let largestSingleTransaction: Transaction | null = null;

  const categoryExpenseMap: Record<string, number> = {};
  const activeDays = new Set<string>();

  for (const t of monthTransactions) {
    activeDays.add(t.date.split('T')[0]);
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
      if (t.categoryId) {
        categoryExpenseMap[t.categoryId] = (categoryExpenseMap[t.categoryId] || 0) + t.amount;
      }
      if (!largestSingleTransaction || t.amount > largestSingleTransaction.amount) {
        largestSingleTransaction = t;
      }
    }
  }

  // Find largest expense category
  for (const catId of Object.keys(categoryExpenseMap)) {
    const amt = categoryExpenseMap[catId];
    if (amt > largestExpenseAmount) {
      largestExpenseAmount = amt;
      const cat = categories.find((c) => c.id === catId);
      largestExpenseCategory = cat ? cat.name : 'Unknown';
    }
  }

  const dayCount = activeDays.size || 1;
  const averageDailySpending = Math.round((totalExpense / dayCount) * 100) / 100;
  const netCashFlow = Math.round((totalIncome - totalExpense) * 100) / 100;

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    balance: netCashFlow,
    netCashFlow,
    largestExpenseCategory,
    largestExpenseAmount,
    largestSingleTransaction,
    averageDailySpending,
    transactionCount: monthTransactions.length,
  };
}
