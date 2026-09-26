import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  TallyContact,
  TallyTransaction,
  TallyTotals,
  AppMode,
} from '../types';
import {
  subscribeToTallyContacts,
  subscribeToTallyTransactions,
  addTallyContact,
  updateTallyContact,
  deleteTallyContact,
  addTallyTransaction,
  updateTallyTransaction,
  deleteTallyTransaction,
  computeTallyTotals,
  getStoredBusinessName,
  setStoredBusinessName,
} from '../services/tally';

interface TallyContextType {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;
  contacts: TallyContact[];
  transactions: TallyTransaction[];
  totals: TallyTotals;
  businessName: string;
  updateBusinessName: (name: string) => void;
  selectedContact: TallyContact | null;
  setSelectedContact: (contact: TallyContact | null) => void;
  selectedContactTransactions: TallyTransaction[];
  addNewContact: (
    contact: Omit<TallyContact, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  editContact: (id: string, updates: Partial<TallyContact>) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  addNewTransaction: (
    tx: Omit<TallyTransaction, 'id' | 'createdAt' | 'updatedAt'>,
    contact: TallyContact
  ) => Promise<string>;
  editTransaction: (
    id: string,
    updates: Partial<TallyTransaction>,
    contact: TallyContact
  ) => Promise<void>;
  removeTransaction: (id: string, contact: TallyContact) => Promise<void>;
  isLoading: boolean;
}

const TallyContext = createContext<TallyContextType | undefined>(undefined);

export const TallyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid || 'demo-user';

  const [appMode, setAppMode] = useState<AppMode>('moneyflow');
  const [contacts, setContacts] = useState<TallyContact[]>([]);
  const [transactions, setTransactions] = useState<TallyTransaction[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>(getStoredBusinessName());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to contacts
  useEffect(() => {
    setIsLoading(true);
    setContacts([]);
    setSelectedContactId(null);
    const unsub = subscribeToTallyContacts(userId, (loadedContacts) => {
      setContacts(loadedContacts);
      setIsLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // Subscribe to transactions
  useEffect(() => {
    setTransactions([]);
    const unsub = subscribeToTallyTransactions(userId, (loadedTxs) => {
      setTransactions(loadedTxs);
    });
    return () => unsub();
  }, [userId]);

  const toggleAppMode = () => {
    setAppMode((prev) => (prev === 'moneyflow' ? 'tallykhata' : 'moneyflow'));
  };

  const updateBusinessName = (name: string) => {
    setBusinessName(name);
    setStoredBusinessName(name);
  };

  const totals = useMemo(() => {
    return computeTallyTotals(contacts);
  }, [contacts]);

  const selectedContact = useMemo(() => {
    if (!selectedContactId) return null;
    return contacts.find((c) => c.id === selectedContactId) || null;
  }, [selectedContactId, contacts]);

  const selectedContactTransactions = useMemo(() => {
    if (!selectedContactId) return [];
    return transactions
      .filter((t) => t.contactId === selectedContactId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedContactId, transactions]);

  const setSelectedContact = (contact: TallyContact | null) => {
    setSelectedContactId(contact ? contact.id : null);
  };

  const handleAddContact = async (
    contact: Omit<TallyContact, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>
  ) => {
    return await addTallyContact(userId, contact);
  };

  const handleEditContact = async (id: string, updates: Partial<TallyContact>) => {
    await updateTallyContact(userId, id, updates);
  };

  const handleRemoveContact = async (id: string) => {
    if (selectedContactId === id) {
      setSelectedContactId(null);
    }
    await deleteTallyContact(userId, id);
  };

  const handleAddTransaction = async (
    tx: Omit<TallyTransaction, 'id' | 'createdAt' | 'updatedAt'>,
    contact: TallyContact
  ) => {
    return await addTallyTransaction(userId, tx, contact, transactions);
  };

  const handleEditTransaction = async (
    id: string,
    updates: Partial<TallyTransaction>,
    contact: TallyContact
  ) => {
    await updateTallyTransaction(userId, id, updates, contact, transactions);
  };

  const handleRemoveTransaction = async (id: string, contact: TallyContact) => {
    await deleteTallyTransaction(userId, id, contact, transactions);
  };

  return (
    <TallyContext.Provider
      value={{
        appMode,
        setAppMode,
        toggleAppMode,
        contacts,
        transactions,
        totals,
        businessName,
        updateBusinessName,
        selectedContact,
        setSelectedContact,
        selectedContactTransactions,
        addNewContact: handleAddContact,
        editContact: handleEditContact,
        removeContact: handleRemoveContact,
        addNewTransaction: handleAddTransaction,
        editTransaction: handleEditTransaction,
        removeTransaction: handleRemoveTransaction,
        isLoading,
      }}
    >
      {children}
    </TallyContext.Provider>
  );
};

export const useTally = (): TallyContextType => {
  const context = useContext(TallyContext);
  if (!context) {
    throw new Error('useTally must be used within a TallyProvider');
  }
  return context;
};
