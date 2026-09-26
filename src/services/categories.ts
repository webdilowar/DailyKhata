import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Category } from '../types';
import { INITIAL_CATEGORIES } from './demoData';

const LOCAL_STORAGE_KEY_PREFIX = 'moneyflow_categories_';

function getLocalCategoriesKey(userId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
}

export function subscribeToCategories(
  userId: string,
  onUpdate: (categories: Category[]) => void
): () => void {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const colPath = `users/${userId}/categories`;
    const colRef = collection(db, 'users', userId, 'categories');
    const q = query(colRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Initialize with default categories
          initializeDefaultCategories(userId);
          return;
        }
        const categories: Category[] = [];
        snapshot.forEach((docSnap) => {
          categories.push({ id: docSnap.id, ...(docSnap.data() as Omit<Category, 'id'>) });
        });
        onUpdate(categories);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );

    return unsubscribe;
  }

  // Local storage fallback for demo user
  const localKey = getLocalCategoriesKey(userId);
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
    localStorage.setItem(localKey, JSON.stringify(INITIAL_CATEGORIES));
    onUpdate(INITIAL_CATEGORIES);
  };

  loadLocal();

  const handleCustomEvent = (e: CustomEvent<{ userId: string }>) => {
    if (e.detail?.userId === userId) {
      loadLocal();
    }
  };

  window.addEventListener('moneyflow_categories_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  return () => {
    window.removeEventListener('moneyflow_categories_changed' as unknown as keyof WindowEventMap, handleCustomEvent as EventListener);
  };
}

export async function initializeDefaultCategories(userId: string): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const batch = writeBatch(db);
    for (const cat of INITIAL_CATEGORIES) {
      const docRef = doc(db, 'users', userId, 'categories', cat.id);
      batch.set(docRef, {
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
        order: cat.order || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  } else {
    localStorage.setItem(getLocalCategoriesKey(userId), JSON.stringify(INITIAL_CATEGORIES));
    window.dispatchEvent(new CustomEvent('moneyflow_categories_changed', { detail: { userId } }));
  }
}

export async function createCategory(
  userId: string,
  categoryData: Omit<Category, 'id'>
): Promise<string> {
  const id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/categories/${id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'categories', id), {
        ...categoryData,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    }
  }

  const localKey = getLocalCategoriesKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Category[] = raw ? JSON.parse(raw) : [...INITIAL_CATEGORIES];
  const newCat: Category = {
    id,
    ...categoryData,
    createdAt: now,
    updatedAt: now,
  };
  current.push(newCat);
  localStorage.setItem(localKey, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('moneyflow_categories_changed', { detail: { userId } }));
  return id;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  updates: Partial<Omit<Category, 'id'>>
): Promise<void> {
  const now = new Date().toISOString();
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/categories/${categoryId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'categories', categoryId), {
        ...updates,
        updatedAt: now,
      });
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  }

  const localKey = getLocalCategoriesKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Category[] = raw ? JSON.parse(raw) : [...INITIAL_CATEGORIES];
  const idx = current.findIndex((c) => c.id === categoryId);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...updates, updatedAt: now };
    localStorage.setItem(localKey, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('moneyflow_categories_changed', { detail: { userId } }));
  }
}

export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/categories/${categoryId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  }

  const localKey = getLocalCategoriesKey(userId);
  const raw = localStorage.getItem(localKey);
  const current: Category[] = raw ? JSON.parse(raw) : [...INITIAL_CATEGORIES];
  const filtered = current.filter((c) => c.id !== categoryId);
  localStorage.setItem(localKey, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('moneyflow_categories_changed', { detail: { userId } }));
}
