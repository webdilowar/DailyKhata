import React, { useState } from 'react';
import { FilterOptions, Account, Category, TransactionType } from '../types';
import { X, RotateCcw } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: FilterOptions;
  onApply: (newOptions: FilterOptions) => void;
  onReset: () => void;
  accounts: Account[];
  categories: Category[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  options,
  onApply,
  onReset,
  accounts,
  categories,
}) => {
  const [localOptions, setLocalOptions] = useState<FilterOptions>(options);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localOptions);
    onClose();
  };

  const handleReset = () => {
    onReset();
    setLocalOptions({ type: 'all' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="filter-modal-container"
        className="w-full max-w-md bg-[#222220] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <h2 className="text-base font-semibold text-[#f5f5f0]">Filter Records</h2>
          <button
            id="btn-close-filter"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-semibold text-[#a3a398] uppercase mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['all', 'expense', 'income', 'transfer'] as (TransactionType | 'all')[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLocalOptions({ ...localOptions, type: t })}
                  className={`py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    localOptions.type === t
                      ? 'bg-[#e6c875] text-[#1c1c1a]'
                      : 'bg-[#1a1a18] text-[#a3a398] hover:text-[#f5f5f0]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-[#a3a398] uppercase mb-1.5">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-[#777770] block mb-1">From</span>
                <input
                  type="date"
                  value={localOptions.startDate || ''}
                  onChange={(e) =>
                    setLocalOptions({ ...localOptions, startDate: e.target.value || undefined })
                  }
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3 py-2 text-xs text-[#f5f5f0] outline-hidden"
                />
              </div>
              <div>
                <span className="text-[11px] text-[#777770] block mb-1">To</span>
                <input
                  type="date"
                  value={localOptions.endDate || ''}
                  onChange={(e) =>
                    setLocalOptions({ ...localOptions, endDate: e.target.value || undefined })
                  }
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3 py-2 text-xs text-[#f5f5f0] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#a3a398] uppercase mb-1.5">
              Account
            </label>
            <select
              value={localOptions.accountId || ''}
              onChange={(e) =>
                setLocalOptions({ ...localOptions, accountId: e.target.value || undefined })
              }
              className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3 py-2.5 text-xs text-[#f5f5f0] outline-hidden"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#a3a398] uppercase mb-1.5">
              Category
            </label>
            <select
              value={localOptions.categoryId || ''}
              onChange={(e) =>
                setLocalOptions({ ...localOptions, categoryId: e.target.value || undefined })
              }
              className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3 py-2.5 text-xs text-[#f5f5f0] outline-hidden"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-xs font-semibold text-[#a3a398] uppercase mb-1.5">
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={localOptions.minAmount ?? ''}
                onChange={(e) =>
                  setLocalOptions({
                    ...localOptions,
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3 py-2 text-xs text-[#f5f5f0] outline-hidden"
              />
              <input
                type="number"
                placeholder="Max"
                value={localOptions.maxAmount ?? ''}
                onChange={(e) =>
                  setLocalOptions({
                    ...localOptions,
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3 py-2 text-xs text-[#f5f5f0] outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 p-4 border-t border-[#363630]">
          <button
            id="btn-filter-reset"
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#3e3e37] text-xs font-semibold text-[#a3a398] hover:text-[#f5f5f0]"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <button
            id="btn-filter-apply"
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a] font-semibold text-xs rounded-xl transition-colors text-center"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
