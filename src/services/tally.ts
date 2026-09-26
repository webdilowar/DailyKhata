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
import { TallyContact, TallyTransaction, TallyTotals, TallyContactType } from '../types';
import { INITIAL_TALLY_CONTACTS, INITIAL_TALLY_TRANSACTIONS } from './tallyDemoData';

const LOCAL_CONTACTS_KEY_PREFIX = 'moneyflow_tally_contacts_';
const LOCAL_TXS_KEY_PREFIX = 'moneyflow_tally_txs_';
const LOCAL_BIZ_NAME_KEY = 'moneyflow_tally_biz_name';

function getLocalContactsKey(userId: string): string {
  return `${LOCAL_CONTACTS_KEY_PREFIX}${userId}`;
}

function getLocalTxsKey(userId: string): string {
  return `${LOCAL_TXS_KEY_PREFIX}${userId}`;
}

export function getStoredBusinessName(): string {
  try {
    return localStorage.getItem(LOCAL_BIZ_NAME_KEY) || 'Simanto Fashion';
  } catch {
    return 'Simanto Fashion';
  }
}

export function setStoredBusinessName(name: string): void {
  try {
    localStorage.setItem(LOCAL_BIZ_NAME_KEY, name);
  } catch {
    // Ignore
  }
}

// ---------------------- CONTACTS ----------------------

export function subscribeToTallyContacts(
  userId: string,
  onUpdate: (contacts: TallyContact[]) => void
): () => void {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const colPath = `users/${userId}/tally_contacts`;
    const colRef = collection(db, 'users', userId, 'tally_contacts');
    const q = query(colRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Initialize with demo contacts if empty
          INITIAL_TALLY_CONTACTS.forEach((c) => {
            const docRef = doc(db, 'users', userId, 'tally_contacts', c.id);
            setDoc(docRef, c).catch(() => {});
          });
          onUpdate(INITIAL_TALLY_CONTACTS);
        } else {
          const contacts: TallyContact[] = [];
          snapshot.forEach((docSnap) => {
            contacts.push({ id: docSnap.id, ...(docSnap.data() as Omit<TallyContact, 'id'>) });
          });
          onUpdate(contacts);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );

    return unsubscribe;
  }

  // Local storage fallback for demo or offline
  const localKey = getLocalContactsKey(userId);
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
    localStorage.setItem(localKey, JSON.stringify(INITIAL_TALLY_CONTACTS));
    onUpdate(INITIAL_TALLY_CONTACTS);
  };

  loadLocal();
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === localKey) {
      loadLocal();
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

export async function addTallyContact(
  userId: string,
  contact: Omit<TallyContact, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const contactId = `contact-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  const newContact: TallyContact = {
    ...contact,
    id: contactId,
    currentBalance: contact.openingBalance || 0,
    lastActiveAt: 'আজকে',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/tally_contacts/${contactId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'tally_contacts', contactId), newContact);
      return contactId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
      throw error;
    }
  }

  // Local storage
  const localKey = getLocalContactsKey(userId);
  const raw = localStorage.getItem(localKey);
  const contacts: TallyContact[] = raw ? JSON.parse(raw) : [...INITIAL_TALLY_CONTACTS];
  contacts.unshift(newContact);
  localStorage.setItem(localKey, JSON.stringify(contacts));
  window.dispatchEvent(new StorageEvent('storage', { key: localKey }));
  return contactId;
}

export async function updateTallyContact(
  userId: string,
  contactId: string,
  updates: Partial<TallyContact>
): Promise<void> {
  const updatedData = { ...updates, updatedAt: new Date().toISOString() };

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/tally_contacts/${contactId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'tally_contacts', contactId), updatedData);
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
      throw error;
    }
  }

  const localKey = getLocalContactsKey(userId);
  const raw = localStorage.getItem(localKey);
  if (raw) {
    const contacts: TallyContact[] = JSON.parse(raw);
    const index = contacts.findIndex((c) => c.id === contactId);
    if (index !== -1) {
      contacts[index] = { ...contacts[index], ...updatedData };
      localStorage.setItem(localKey, JSON.stringify(contacts));
      window.dispatchEvent(new StorageEvent('storage', { key: localKey }));
    }
  }
}

export async function deleteTallyContact(userId: string, contactId: string): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/tally_contacts/${contactId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'tally_contacts', contactId));
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
      throw error;
    }
  }

  const localKey = getLocalContactsKey(userId);
  const raw = localStorage.getItem(localKey);
  if (raw) {
    const contacts: TallyContact[] = JSON.parse(raw);
    const filtered = contacts.filter((c) => c.id !== contactId);
    localStorage.setItem(localKey, JSON.stringify(filtered));
    window.dispatchEvent(new StorageEvent('storage', { key: localKey }));
  }

  // Also remove transactions for this contact
  const txLocalKey = getLocalTxsKey(userId);
  const txRaw = localStorage.getItem(txLocalKey);
  if (txRaw) {
    const txs: TallyTransaction[] = JSON.parse(txRaw);
    const filteredTxs = txs.filter((t) => t.contactId !== contactId);
    localStorage.setItem(txLocalKey, JSON.stringify(filteredTxs));
    window.dispatchEvent(new StorageEvent('storage', { key: txLocalKey }));
  }
}

// ---------------------- TRANSACTIONS ----------------------

export function subscribeToTallyTransactions(
  userId: string,
  onUpdate: (transactions: TallyTransaction[]) => void
): () => void {
  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const colPath = `users/${userId}/tally_transactions`;
    const colRef = collection(db, 'users', userId, 'tally_transactions');
    const q = query(colRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          INITIAL_TALLY_TRANSACTIONS.forEach((tx) => {
            const docRef = doc(db, 'users', userId, 'tally_transactions', tx.id);
            setDoc(docRef, tx).catch(() => {});
          });
          onUpdate(INITIAL_TALLY_TRANSACTIONS);
        } else {
          const txs: TallyTransaction[] = [];
          snapshot.forEach((docSnap) => {
            txs.push({ id: docSnap.id, ...(docSnap.data() as Omit<TallyTransaction, 'id'>) });
          });
          onUpdate(txs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );

    return unsubscribe;
  }

  const localKey = getLocalTxsKey(userId);
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
    localStorage.setItem(localKey, JSON.stringify(INITIAL_TALLY_TRANSACTIONS));
    onUpdate(INITIAL_TALLY_TRANSACTIONS);
  };

  loadLocal();
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === localKey) {
      loadLocal();
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

export function calculateContactBalance(
  contact: TallyContact,
  transactions: TallyTransaction[]
): number {
  const contactTxs = transactions.filter((t) => t.contactId === contact.id);
  let balance = contact.openingBalance || 0;

  // For customer: 'gave' increases due (পাবো), 'received' decreases due
  // For supplier: 'gave' is cash paid (+ decreases payable), 'received' is goods bought (- increases payable)
  if (contact.type === 'customer') {
    contactTxs.forEach((tx) => {
      if (tx.type === 'gave') {
        balance += tx.amount;
      } else {
        balance -= tx.amount;
      }
    });
  } else {
    // Supplier
    contactTxs.forEach((tx) => {
      if (tx.type === 'gave') {
        // We paid supplier
        balance += tx.amount;
      } else {
        // We bought goods on credit
        balance -= tx.amount;
      }
    });
  }

  return balance;
}

export async function addTallyTransaction(
  userId: string,
  tx: Omit<TallyTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  currentContact: TallyContact,
  allTransactions: TallyTransaction[]
): Promise<string> {
  const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  const newTx: TallyTransaction = {
    ...tx,
    id: txId,
    createdAt: now,
    updatedAt: now,
  };

  const updatedTxs = [newTx, ...allTransactions];
  const newBalance = calculateContactBalance(currentContact, updatedTxs);

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/tally_transactions/${txId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'tally_transactions', txId), newTx);
      // Update contact balance
      await updateDoc(doc(db, 'users', userId, 'tally_contacts', currentContact.id), {
        currentBalance: newBalance,
        lastActiveAt: 'আজকে',
        updatedAt: now,
      });
      return txId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
      throw error;
    }
  }

  // Local storage
  const localKey = getLocalTxsKey(userId);
  const raw = localStorage.getItem(localKey);
  const txs: TallyTransaction[] = raw ? JSON.parse(raw) : [...INITIAL_TALLY_TRANSACTIONS];
  txs.unshift(newTx);
  localStorage.setItem(localKey, JSON.stringify(txs));
  window.dispatchEvent(new StorageEvent('storage', { key: localKey }));

  // Update contact in local storage
  const contactLocalKey = getLocalContactsKey(userId);
  const cRaw = localStorage.getItem(contactLocalKey);
  if (cRaw) {
    const contacts: TallyContact[] = JSON.parse(cRaw);
    const idx = contacts.findIndex((c) => c.id === currentContact.id);
    if (idx !== -1) {
      contacts[idx] = {
        ...contacts[idx],
        currentBalance: newBalance,
        lastActiveAt: 'আজকে',
        updatedAt: now,
      };
      localStorage.setItem(contactLocalKey, JSON.stringify(contacts));
      window.dispatchEvent(new StorageEvent('storage', { key: contactLocalKey }));
    }
  }

  return txId;
}

export async function updateTallyTransaction(
  userId: string,
  txId: string,
  updates: Partial<TallyTransaction>,
  contact: TallyContact,
  allTransactions: TallyTransaction[]
): Promise<void> {
  const updatedData = { ...updates, updatedAt: new Date().toISOString() };
  const updatedTxs = allTransactions.map((t) => (t.id === txId ? { ...t, ...updatedData } : t));
  const newBalance = calculateContactBalance(contact, updatedTxs);

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/tally_transactions/${txId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'tally_transactions', txId), updatedData);
      await updateDoc(doc(db, 'users', userId, 'tally_contacts', contact.id), {
        currentBalance: newBalance,
        updatedAt: new Date().toISOString(),
      });
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
      throw error;
    }
  }

  const localKey = getLocalTxsKey(userId);
  localStorage.setItem(localKey, JSON.stringify(updatedTxs));
  window.dispatchEvent(new StorageEvent('storage', { key: localKey }));

  const contactLocalKey = getLocalContactsKey(userId);
  const cRaw = localStorage.getItem(contactLocalKey);
  if (cRaw) {
    const contacts: TallyContact[] = JSON.parse(cRaw);
    const idx = contacts.findIndex((c) => c.id === contact.id);
    if (idx !== -1) {
      contacts[idx] = {
        ...contacts[idx],
        currentBalance: newBalance,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(contactLocalKey, JSON.stringify(contacts));
      window.dispatchEvent(new StorageEvent('storage', { key: contactLocalKey }));
    }
  }
}

export async function deleteTallyTransaction(
  userId: string,
  txId: string,
  contact: TallyContact,
  allTransactions: TallyTransaction[]
): Promise<void> {
  const filteredTxs = allTransactions.filter((t) => t.id !== txId);
  const newBalance = calculateContactBalance(contact, filteredTxs);

  if (isFirebaseConfigured && db && !userId.startsWith('demo-')) {
    const docPath = `users/${userId}/tally_transactions/${txId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'tally_transactions', txId));
      await updateDoc(doc(db, 'users', userId, 'tally_contacts', contact.id), {
        currentBalance: newBalance,
        updatedAt: new Date().toISOString(),
      });
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
      throw error;
    }
  }

  const localKey = getLocalTxsKey(userId);
  localStorage.setItem(localKey, JSON.stringify(filteredTxs));
  window.dispatchEvent(new StorageEvent('storage', { key: localKey }));

  const contactLocalKey = getLocalContactsKey(userId);
  const cRaw = localStorage.getItem(contactLocalKey);
  if (cRaw) {
    const contacts: TallyContact[] = JSON.parse(cRaw);
    const idx = contacts.findIndex((c) => c.id === contact.id);
    if (idx !== -1) {
      contacts[idx] = {
        ...contacts[idx],
        currentBalance: newBalance,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(contactLocalKey, JSON.stringify(contacts));
      window.dispatchEvent(new StorageEvent('storage', { key: contactLocalKey }));
    }
  }
}

export function computeTallyTotals(contacts: TallyContact[]): TallyTotals {
  let totalReceive = 0;
  let totalPayable = 0;
  let customerCount = 0;
  let supplierCount = 0;

  contacts.forEach((c) => {
    if (c.type === 'customer') {
      customerCount++;
    } else {
      supplierCount++;
    }

    if (c.currentBalance > 0) {
      totalReceive += c.currentBalance;
    } else if (c.currentBalance < 0) {
      totalPayable += Math.abs(c.currentBalance);
    }
  });

  return {
    totalReceive,
    totalPayable,
    netBalance: totalReceive - totalPayable,
    customerCount,
    supplierCount,
  };
}
