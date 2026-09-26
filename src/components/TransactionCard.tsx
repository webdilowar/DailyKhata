import React from 'react';
import { Transaction, Account, Category } from '../types';
import { getCategoryIconComponent, getAccountIconComponent } from '../utils/icons';
import { formatCurrency } from '../utils/currency';
import { ArrowRightLeft, Trash2 } from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  currencyCode?: string;
  onClick?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  accounts,
  categories,
  currencyCode = 'BDT',
  onClick,
  onDelete,
}) => {
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  // Category resolution
  const category = categories.find((c) => c.id === transaction.categoryId);
  const categoryName = category?.name || (isTransfer ? 'Transfer' : 'Other');
  const CategoryIcon = isTransfer
    ? ArrowRightLeft
    : getCategoryIconComponent(category?.icon || category?.name || 'Default');

  // Account resolution
  const account = accounts.find((a) => a.id === transaction.accountId);
  const fromAccount = accounts.find((a) => a.id === transaction.fromAccountId);
  const toAccount = accounts.find((a) => a.id === transaction.toAccountId);
  const AccountIcon = getAccountIconComponent(account?.icon || account?.type || 'Cash');

  return (
    <div
      id={`tx-card-${transaction.id}`}
      onClick={() => onClick?.(transaction)}
      className="flex items-center justify-between py-2.5 px-3 hover:bg-[#282824] active:bg-[#2f2f2a] rounded-xl transition-colors cursor-pointer group"
    >
      {/* Left: Icon & Description */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
          style={{
            backgroundColor: isTransfer ? '#3b82f6' : (category?.color || '#ef4444'),
          }}
        >
          <CategoryIcon size={20} className="text-white drop-shadow-xs" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#f5f5f0] truncate">
            {isTransfer
              ? `${fromAccount?.name || 'Account'} → ${toAccount?.name || 'Account'}`
              : categoryName}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#a3a398] truncate">
            {!isTransfer && (
              <span className="flex items-center gap-1 shrink-0 text-[#c5c5b8]">
                <AccountIcon size={12} />
                <span>{account?.name || 'Cash'}</span>
              </span>
            )}
            {transaction.note && (
              <span className="truncate text-[#888880] italic">
                "{transaction.note}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="text-right">
          <span
            className={`text-sm font-bold tracking-tight ${
              isExpense
                ? 'text-[#ff6565]'
                : isIncome
                ? 'text-[#4ade80]'
                : 'text-[#60a5fa]'
            }`}
          >
            {isExpense && '-'}
            {isIncome && '+'}
            {formatCurrency(transaction.amount, currencyCode, { absolute: true })}
          </span>
        </div>

        {onDelete && (
          <button
            type="button"
            title="Delete transaction"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction);
            }}
            className="p-1.5 rounded-lg text-[#777770] hover:text-[#ff6565] hover:bg-[#383832] transition-colors ml-1 active-press"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
