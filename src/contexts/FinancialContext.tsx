import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Account,
  Category,
  Transaction,
  Budget,
  UserSettings,
  MonthlyStats,
  FilterOptions,
} from '../types';
import { useAuth } from './AuthContext';
import {
  subscribeToAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  calculateAccountBalances,
} from '../services/accounts';
import {
  subscribeToCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categories';
import {
  subscribeToTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  calculateMonthlyStats,
} from '../services/transactions';
import {
  subscribeToBudgets,
  saveBudget,
  deleteBudget,
} from '../services/budgets';
import {
  subscribeToSettings,
  updateUserSettings,
} from '../services/settings';
import { resetUserData } from '../services/backup';
import { DEFAULT_USER_SETTINGS } from '../services/demoData';
import { getMonthKey } from '../utils/date';
import {
  saveUserDataToDrive,
  restoreUserDataFromDrive,
  buildBackupPayload,
  getLastDriveSyncTime,
  getDriveAccessToken,
  findDriveBackupFile,
} from '../services/googleDrive';

interface FinancialContextType {
  accounts: Account[];
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: UserSettings;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  monthlyStats: MonthlyStats;
  totalAccountBalance: number;
  filteredTransactions: Transaction[];
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
  resetFilterOptions: () => void;
  loading: boolean;

  // Actions
  addNewTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
  editTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  addNewAccount: (data: Omit<Account, 'id' | 'currentBalance'>) => Promise<string | undefined>;
  editAccount: (id: string, updates: Partial<Omit<Account, 'id'>>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;

  addNewCategory: (data: Omit<Category, 'id'>) => Promise<string | undefined>;
  editCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  setCategoryBudget: (month: string, categoryId: string, amount: number) => Promise<string | undefined>;
  removeBudget: (id: string) => Promise<void>;

  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
  resetAllFinancialData: () => Promise<void>;

  // Google Drive Cloud Backup & Restore
  saveToGoogleDrive: () => Promise<{ success: boolean; message: string; fileName: string; modifiedTime: string }>;
  restoreFromGoogleDrive: (mode?: 'replace' | 'merge', targetFileId?: string) => Promise<{ success: boolean; message: string }>;
  lastDriveSyncTime: string | null;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid || 'demo-user-123';

  const [rawAccounts, setRawAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Month navigation: defaults to current month (e.g. 2026-09)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getMonthKey(new Date()));

  // Active filters
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    type: 'all',
  });

  // Real-time subscriptions based on active user
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    setLoading(true);

    // CRITICAL USER ISOLATION SECURITY MEASURE:
    // Instantly reset in-memory data when user changes to completely prevent data cross-contamination
    setRawAccounts([]);
    setCategories([]);
    setTransactions([]);
    setBudgets([]);
    setSettings(DEFAULT_USER_SETTINGS);

    const unsubAcc = subscribeToAccounts(userId, (accs) => {
      setRawAccounts(accs);
    });
    unsubs.push(unsubAcc);

    const unsubCat = subscribeToCategories(userId, (cats) => {
      setCategories(cats);
    });
    unsubs.push(unsubCat);

    const unsubTx = subscribeToTransactions(userId, (txs) => {
      setTransactions(txs);
      setLoading(false);
    });
    unsubs.push(unsubTx);

    const unsubBgt = subscribeToBudgets(userId, (bgts) => {
      setBudgets(bgts);
    });
    unsubs.push(unsubBgt);

    const unsubSet = subscribeToSettings(userId, (stgs) => {
      setSettings(stgs);
    });
    unsubs.push(unsubSet);

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [userId]);

  // Derived accounts with accurately calculated live balances
  const accounts = useMemo(() => {
    return calculateAccountBalances(rawAccounts, transactions);
  }, [rawAccounts, transactions]);

  // Total balance across all accounts
  const totalAccountBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.currentBalance ?? acc.initialBalance), 0);
  }, [accounts]);

  // Income & Expense categories
  const incomeCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'income');
  }, [categories]);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  // CONTINUOUS BACKGROUND DRIVE SYNC:
  // Automatically saves changes to user's Google Drive when logged in and Drive token is present
  useEffect(() => {
    if (!user?.email || !getDriveAccessToken() || loading) return;
    if (accounts.length === 0 && transactions.length === 0) return;

    const timer = setTimeout(() => {
      const payload = buildBackupPayload(
        accounts,
        categories,
        transactions,
        budgets,
        settings,
        user.email || undefined,
        user.uid
      );
      saveUserDataToDrive(payload, user.email || undefined)
        .then((res) => {
          setLastDriveSyncTime(res.modifiedTime);
        })
        .catch((err) => {
          console.warn('Auto-save to Google Drive background sync notice:', err);
        });
    }, 3000);

    return () => clearTimeout(timer);
  }, [accounts, categories, transactions, budgets, settings, user?.email, user?.uid, loading]);

  // AUTO-RESTORE FROM USER GOOGLE DRIVE ON SIGN-IN
  useEffect(() => {
    if (!user?.email || !getDriveAccessToken()) return;

    let isSubscribed = true;
    const autoRestoreDrive = async () => {
      try {
        const file = await findDriveBackupFile(undefined, user.email || undefined);
        if (file && isSubscribed) {
          await restoreUserDataFromDrive(userId, user.email || undefined, undefined, 'replace');
          if (isSubscribed) {
            setLastDriveSyncTime(file.modifiedTime || new Date().toISOString());
          }
        }
      } catch (err) {
        console.warn('Auto-restore from Google Drive on sign-in notice:', err);
      }
    };

    autoRestoreDrive();
    return () => {
      isSubscribed = false;
    };
  }, [user?.email, userId]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Month check (unless custom start/end date overrides it)
      if (!filterOptions.startDate && !filterOptions.endDate) {
        if (!t.date.startsWith(selectedMonth)) {
          return false;
        }
      } else {
        const txDate = t.date.split('T')[0];
        if (filterOptions.startDate && txDate < filterOptions.startDate) return false;
        if (filterOptions.endDate && txDate > filterOptions.endDate) return false;
      }

      // Type filter
      if (filterOptions.type && filterOptions.type !== 'all' && t.type !== filterOptions.type) {
        return false;
      }

      // Account filter
      if (filterOptions.accountId) {
        if (t.type === 'transfer') {
          if (t.fromAccountId !== filterOptions.accountId && t.toAccountId !== filterOptions.accountId) {
            return false;
          }
        } else if (t.accountId !== filterOptions.accountId) {
          return false;
        }
      }

      // Category filter
      if (filterOptions.categoryId && t.categoryId !== filterOptions.categoryId) {
        return false;
      }

      // Min/Max amount
      if (filterOptions.minAmount !== undefined && t.amount < filterOptions.minAmount) return false;
      if (filterOptions.maxAmount !== undefined && t.amount > filterOptions.maxAmount) return false;

      // Search query (note, category, account)
      if (filterOptions.searchQuery && filterOptions.searchQuery.trim()) {
        const q = filterOptions.searchQuery.toLowerCase().trim();
        const noteMatch = (t.note || '').toLowerCase().includes(q);
        const cat = categories.find((c) => c.id === t.categoryId);
        const catMatch = cat ? cat.name.toLowerCase().includes(q) : false;
        const acc = accounts.find((a) => a.id === t.accountId);
        const accMatch = acc ? acc.name.toLowerCase().includes(q) : false;
        const amountMatch = t.amount.toString().includes(q);

        if (!noteMatch && !catMatch && !accMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedMonth, filterOptions, categories, accounts]);

  // Monthly summary stats calculated for the selected month
  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(transactions, selectedMonth, categories);
  }, [transactions, selectedMonth, categories]);

  const resetFilters = () => {
    setFilterOptions({ type: 'all' });
  };

  // Action handlers
  const addNewTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await createTransaction(userId, data);
  };

  const editTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    await updateTransaction(userId, id, updates);
  };

  const removeTransaction = async (id: string) => {
    await deleteTransaction(userId, id);
  };

  const addNewAccount = async (data: Omit<Account, 'id' | 'currentBalance'>) => {
    return await createAccount(userId, data);
  };

  const editAccount = async (id: string, updates: Partial<Omit<Account, 'id'>>) => {
    await updateAccount(userId, id, updates);
  };

  const removeAccount = async (id: string) => {
    await deleteAccount(userId, id);
  };

  const addNewCategory = async (data: Omit<Category, 'id'>) => {
    return await createCategory(userId, data);
  };

  const editCategory = async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    await updateCategory(userId, id, updates);
  };

  const removeCategory = async (id: string) => {
    await deleteCategory(userId, id);
  };

  const setCategoryBudget = async (month: string, categoryId: string, amount: number) => {
    return await saveBudget(userId, month, categoryId, amount);
  };

  const removeBudget = async (id: string) => {
    await deleteBudget(userId, id);
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    await updateUserSettings(userId, updates);
  };

  const refreshData = async () => {
    window.dispatchEvent(new CustomEvent('moneyflow_accounts_changed', { detail: { userId } }));
    window.dispatchEvent(new CustomEvent('moneyflow_categories_changed', { detail: { userId } }));
    window.dispatchEvent(new CustomEvent('moneyflow_transactions_changed', { detail: { userId } }));
    window.dispatchEvent(new CustomEvent('moneyflow_budgets_changed', { detail: { userId } }));
    window.dispatchEvent(new CustomEvent('moneyflow_settings_changed', { detail: { userId } }));
  };

  const resetAllFinancialData = async () => {
    await resetUserData(userId, 'all');
  };

  const [lastDriveSyncTime, setLastDriveSyncTime] = useState<string | null>(getLastDriveSyncTime);

  const saveToGoogleDrive = async () => {
    const payload = buildBackupPayload(
      accounts,
      categories,
      transactions,
      budgets,
      settings,
      user?.email || undefined,
      user?.uid
    );
    const result = await saveUserDataToDrive(payload, user?.email || undefined);
    setLastDriveSyncTime(result.modifiedTime);
    return {
      success: true,
      message: `Successfully backed up all financial data to Google Drive (${result.fileName})!`,
      fileName: result.fileName,
      modifiedTime: result.modifiedTime,
    };
  };

  const restoreFromGoogleDrive = async (mode: 'replace' | 'merge' = 'replace', targetFileId?: string) => {
    const result = await restoreUserDataFromDrive(userId, user?.email || undefined, undefined, mode, targetFileId);
    await refreshData();
    setLastDriveSyncTime(new Date().toISOString());
    return {
      success: true,
      message: result.message,
    };
  };

  return (
    <FinancialContext.Provider
      value={{
        accounts,
        categories,
        incomeCategories,
        expenseCategories,
        transactions,
        budgets,
        settings,
        selectedMonth,
        setSelectedMonth,
        monthlyStats,
        totalAccountBalance,
        filteredTransactions,
        filterOptions,
        setFilterOptions,
        resetFilters,
        resetFilterOptions: resetFilters,
        loading,
        addNewTransaction,
        editTransaction,
        removeTransaction,
        addNewAccount,
        editAccount,
        removeAccount,
        addNewCategory,
        editCategory,
        removeCategory,
        setCategoryBudget,
        removeBudget,
        updateSettings,
        updateUserSettings: updateSettings,
        refreshData,
        resetAllFinancialData,
        saveToGoogleDrive,
        restoreFromGoogleDrive,
        lastDriveSyncTime,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export function useFinancial(): FinancialContextType {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
