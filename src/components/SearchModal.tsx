import React, { useState, useMemo } from 'react';
import { Transaction, Account, Category } from '../types';
import { TransactionCard } from './TransactionCard';
import { Search, X } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencyCode?: string;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  categories,
  currencyCode = 'BDT',
  onSelectTransaction,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const categoryMap = new Map<string, string>(categories.map((c) => [c.id, c.name.toLowerCase()]));
    const accountMap = new Map<string, string>(accounts.map((a) => [a.id, a.name.toLowerCase()]));

    return transactions.filter((t) => {
      const noteMatch = (t.note || '').toLowerCase().includes(q);
      const catMatch = t.categoryId ? (categoryMap.get(t.categoryId) || '').includes(q) : false;
      const accMatch = t.accountId ? (accountMap.get(t.accountId) || '').includes(q) : false;
      const amountMatch = t.amount.toString().includes(q);
      const typeMatch = t.type.toLowerCase().includes(q);

      return noteMatch || catMatch || accMatch || amountMatch || typeMatch;
    });
  }, [query, transactions, categories, accounts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="search-modal-container"
        className="w-full max-w-lg bg-[#222220] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] mt-4"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[#363630]">
          <Search size={20} className="text-[#a3a398]" />
          <input
            id="search-input-field"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by notes, categories, accounts, or amounts..."
            autoFocus
            className="flex-1 bg-transparent text-sm sm:text-base text-[#f5f5f0] placeholder-[#777770] outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#a3a398] hover:text-[#f5f5f0]"
            >
              <X size={18} />
            </button>
          )}
          <button
            id="btn-close-search"
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#e6c875] px-2 py-1"
          >
            Done
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-xs text-[#a3a398]">
              Type a note, category (e.g. Health, Food), or amount to find transactions.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#a3a398]">
              No transactions found matching "{query}"
            </div>
          ) : (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-[#a3a398]">
                Found {searchResults.length} result{searchResults.length > 1 ? 's' : ''}
              </div>
              {searchResults.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  accounts={accounts}
                  categories={categories}
                  currencyCode={currencyCode}
                  onClick={(clicked) => {
                    onSelectTransaction?.(clicked);
                    onClose();
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
