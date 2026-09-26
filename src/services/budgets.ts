import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Budget, Transaction } from '../types';
import { DEMO_BUDGETS } from './demoData';

const LOCAL_STORAGE_KEY_PREFIX = 'moneyflow_budgets_';

function getLocalBudgetsKey(userId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
}

export function subscribeToBudgets(
  userId: string,
  onUpdate: (budgets: Budget[]) => void
): () => void {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const colPath = `users/${userId}/budgets`;
    const colRef = collection(db, 'users', userId, 'budgets');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const budgets: Budget[] = [];
        snapshot.forEach((docSnap) => {
          budgets.push({ id: docSnap.id, ...(docSnap.data() as Omit<Budget, 'id'>) });
        });
        onUpdate(budgets);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );

    return unsubscribe;
  }

  // Local storage fallback for demo user
  const localKey = getLocalBudgetsKey(userId);
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
    localStorage.setItem(localKey, JSON.stringify(DEMO_BUDGETS));
    onUpdate(DEMO_BUDGETS);
  };

  loadLocal();

  const handleCustomEvent = (e: CustomEvent<{ userId: string }>) => {
    if (e.detail?.userId === userId) {
      loadLocal();
    }
  };

  window.addEventListener('moneyflow_budgets_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  return () => {
    window.removeEventListener('moneyflow_budgets_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  };
}

export async function saveBudget(
  userId: string,
  month: string, // YYYY-MM
  categoryId: string,
  amount: number
): Promise<string> {
  const id = `bgt-${month}-${categoryId}`;
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/budgets/${id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'budgets', id), {
        month,
        categoryId,
        amount,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  }

  const localKey = getLocalBudgetsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Budget[] = raw ? JSON.parse(raw) : [...DEMO_BUDGETS];
  const existingIdx = current.findIndex((b) => b.month === month && b.categoryId === categoryId);

  const budgetRecord: Budget = {
    id,
    month,
    categoryId,
    amount,
    createdAt: now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    current[existingIdx] = budgetRecord;
  } else {
    current.push(budgetRecord);
  }

  localStorage.setItem(localKey, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('moneyflow_budgets_changed', { detail: { userId } }));
  return id;
}

export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/budgets/${budgetId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'budgets', budgetId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  }

  const localKey = getLocalBudgetsKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Budget[] = raw ? JSON.parse(raw) : [...DEMO_BUDGETS];
  const filtered = current.filter((b) => b.id !== budgetId);
  localStorage.setItem(localKey, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('moneyflow_budgets_changed', { detail: { userId } }));
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'normal' | 'near_limit' | 'over_budget';
}

export function calculateBudgetStatuses(
  budgets: Budget[],
  month: string,
  transactions: Transaction[]
): BudgetStatus[] {
  const monthTransactions = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(month)
  );

  return budgets
    .filter((b) => b.month === month)
    .map((b) => {
      const spent = monthTransactions
        .filter((t) => t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = Math.round((b.amount - spent) * 100) / 100;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      let status: 'normal' | 'near_limit' | 'over_budget' = 'normal';
      if (percentage >= 100) {
        status = 'over_budget';
      } else if (percentage >= 85) {
        status = 'near_limit';
      }

      return {
        budget: b,
        spent: Math.round(spent * 100) / 100,
        remaining,
        percentage,
        status,
      };
    });
}
