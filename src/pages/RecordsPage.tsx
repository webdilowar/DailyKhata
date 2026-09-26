import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { HeaderSummaryBanner } from '../components/HeaderSummaryBanner';
import { MonthSelector } from '../components/MonthSelector';
import { TransactionCard } from '../components/TransactionCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { groupTransactionsByDate } from '../services/transactions';
import { Transaction } from '../types';
import { PlusCircle } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface RecordsPageProps {
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenFilter: () => void;
  onOpenAccountsTab: () => void;
}

export const RecordsPage: React.FC<RecordsPageProps> = ({
  onOpenAddTransaction,
  onEditTransaction,
  onOpenFilter,
  onOpenAccountsTab,
}) => {
  const {
    filteredTransactions,
    accounts,
    categories,
    settings,
    totalAccountBalance,
    monthlyStats,
    selectedMonth,
    setSelectedMonth,
    filterOptions,
    removeTransaction,
  } = useFinancial();

  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const grouped = groupTransactionsByDate(filteredTransactions);
  const hasActiveFilters = Boolean(
    filterOptions.accountId ||
    filterOptions.categoryId ||
    (filterOptions.type && filterOptions.type !== 'all') ||
    filterOptions.startDate ||
    filterOptions.endDate ||
    filterOptions.minAmount !== undefined ||
    filterOptions.maxAmount !== undefined ||
    filterOptions.searchQuery
  );

  return (
    <div id="records-page" className="pb-28">
      {/* Header Summary Banner (Matches screenshot 1) */}
      <HeaderSummaryBanner
        totalAccountBalance={totalAccountBalance}
        totalExpenseSoFar={monthlyStats.totalExpense}
        totalIncomeSoFar={monthlyStats.totalIncome}
        currencyCode={settings.currency}
        onAllAccountsClick={onOpenAccountsTab}
      />

      {/* Month Navigator with Filter Button */}
      <MonthSelector
        currentMonthKey={selectedMonth}
        onMonthChange={setSelectedMonth}
        onOpenFilter={onOpenFilter}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Filter Active Warning Pill */}
      {hasActiveFilters && (
        <div className="bg-[#2e2e28] px-4 py-1.5 flex items-center justify-between text-xs text-[#e6c875] border-b border-[#3d3d36]">
          <span>Filters currently applied</span>
          <button
            type="button"
            onClick={onOpenFilter}
            className="underline hover:text-white"
          >
            Edit Filters
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className="px-3 py-2 space-y-4">
        {grouped.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm font-medium text-[#a3a398]">
              No transactions found for this period
            </p>
            <button
              id="btn-empty-add-tx"
              type="button"
              onClick={onOpenAddTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e6c875] text-[#1c1c1a] font-semibold text-xs hover:bg-[#f0d58c] transition-colors"
            >
              <PlusCircle size={16} />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.dateStr} className="space-y-1">
              {/* Date Group Header (Matches screenshot 1: "Sep 12, Saturday" in warm yellow) */}
              <div className="flex items-center justify-between pt-2 pb-1 border-b border-[#363630]">
                <h3 className="text-xs sm:text-sm font-bold text-[#e6c875]">
                  {group.displayDate}
                </h3>
                <div className="text-[11px] font-semibold space-x-2 text-[#a3a398]">
                  {group.totalExpense > 0 && (
                    <span className="text-[#ff6565]">
                      -{formatCurrency(group.totalExpense, settings.currency, { absolute: true })}
                    </span>
                  )}
                  {group.totalIncome > 0 && (
                    <span className="text-[#4ade80]">
                      +{formatCurrency(group.totalIncome, settings.currency, { absolute: true })}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions on that day */}
              <div className="divide-y divide-[#2a2a26]/50">
                {group.transactions.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    accounts={accounts}
                    categories={categories}
                    currencyCode={settings.currency}
                    onClick={onEditTransaction}
                    onDelete={(t) => setTransactionToDelete(t)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(transactionToDelete)}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={async () => {
          if (transactionToDelete) {
            await removeTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
          }
        }}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction record? This will update your account balance and category totals."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};
