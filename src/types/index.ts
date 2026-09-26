export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 
  | 'Cash' 
  | 'Bank' 
  | 'bKash' 
  | 'Nagad' 
  | 'Credit Card' 
  | 'PayPal' 
  | 'Other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  initialBalance: number;
  currentBalance?: number;
  currency: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId?: string;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  note?: string;
  date: string; // ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  categoryId: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettings {
  currency: string;
  theme: 'dark' | 'light' | 'system';
  dateFormat: string;
  firstDayOfWeek: 'sunday' | 'monday' | 'saturday';
  defaultAccountId?: string;
  defaultTransactionType: TransactionType;
  confirmBeforeDelete: boolean;
  startScreen: string;
  updatedAt?: string;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export interface DateGroupedTransactions {
  dateStr: string; // "2026-09-13"
  displayDate: string; // "Sep 13, Sunday"
  totalExpense: number;
  totalIncome: number;
  transactions: Transaction[];
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  netCashFlow: number;
  largestExpenseCategory: string | null;
  largestExpenseAmount: number;
  largestSingleTransaction: Transaction | null;
  averageDailySpending: number;
  transactionCount: number;
}

export type AnalysisViewType =
  | 'expense_overview'
  | 'income_overview'
  | 'six_month_trend'
  | 'expense_flow'
  | 'income_flow'
  | 'account_analysis';

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType | 'all';
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

export type AppMode = 'moneyflow' | 'tallykhata';

export type TallyContactType = 'customer' | 'supplier';

export interface TallyContact {
  id: string;
  name: string;
  phone: string;
  type: TallyContactType;
  openingBalance: number; // positive = I receive (পাবো), negative = I give (দেবো)
  currentBalance: number; // positive = পাবো, negative = দেবো, 0 = সমান
  address?: string;
  note?: string;
  lastActiveAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TallyTxType = 'gave' | 'received'; // gave = দিলাম (বেচা/বাকি প্রদান), received = পেলাম (টাকা জমা/বকেয়া আদায়)

export interface TallyTransaction {
  id: string;
  contactId: string;
  type: TallyTxType;
  amount: number;
  description?: string;
  date: string; // YYYY-MM-DD or ISO string
  receiptUrl?: string;
  sendSms?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TallyTotals {
  totalReceive: number; // মোট পাবো (from customers who owe me, + opening positive)
  totalPayable: number; // মোট দেবো (to suppliers/others whom I owe, + opening negative)
  netBalance: number;   // মোট ব্যালেন্স
  customerCount: number;
  supplierCount: number;
}

