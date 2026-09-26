import React from 'react';
import { useTally } from '../../contexts/TallyContext';
import { toBengaliNumerals } from '../../utils/bengali';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TallyBalanceCardsProps {
  onFilterChange?: (filter: 'all' | 'receive' | 'payable') => void;
  activeFilter?: 'all' | 'receive' | 'payable';
}

export const TallyBalanceCards: React.FC<TallyBalanceCardsProps> = ({
  onFilterChange,
  activeFilter = 'all',
}) => {
  const { totals } = useTally();

  const formattedReceive = toBengaliNumerals(
    totals.totalReceive.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  );

  const formattedPayable = toBengaliNumerals(
    totals.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  );

  return (
    <section id="tally-balance-cards" className="bg-[#f8f9fa] px-3 py-3 border-b border-gray-200">
      <div className="grid grid-cols-2 gap-2.5">
        {/* Left: মোট পাবো (Customers owe me) */}
        <button
          id="card-total-receive"
          type="button"
          onClick={() => onFilterChange?.(activeFilter === 'receive' ? 'all' : 'receive')}
          className={`bg-white rounded-xl p-3 border text-left shadow-sm transition-all active:scale-[0.98] ${
            activeFilter === 'receive'
              ? 'border-[#be1e2d] ring-2 ring-[#be1e2d]/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">মোট পাবো</span>
            <span className="w-5 h-5 rounded-full bg-red-50 text-[#be1e2d] flex items-center justify-center">
              <ArrowDownLeft size={13} strokeWidth={2.5} />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#be1e2d] tracking-tight truncate">
            ৳ {formattedReceive}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {toBengaliNumerals(totals.customerCount)} জন কাস্টমার
          </div>
        </button>

        {/* Right: মোট দেবো (I owe suppliers/others) */}
        <button
          id="card-total-payable"
          type="button"
          onClick={() => onFilterChange?.(activeFilter === 'payable' ? 'all' : 'payable')}
          className={`bg-white rounded-xl p-3 border text-left shadow-sm transition-all active:scale-[0.98] ${
            activeFilter === 'payable'
              ? 'border-[#0f766e] ring-2 ring-[#0f766e]/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">মোট দেবো</span>
            <span className="w-5 h-5 rounded-full bg-teal-50 text-[#0f766e] flex items-center justify-center">
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0f766e] tracking-tight truncate">
            ৳ {formattedPayable}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {toBengaliNumerals(totals.supplierCount)} জন সাপ্লায়ার
          </div>
        </button>
      </div>
    </section>
  );
};
