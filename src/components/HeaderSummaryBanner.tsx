import React from 'react';
import { formatCurrency } from '../utils/currency';
import { ChevronRight } from 'lucide-react';

interface HeaderSummaryBannerProps {
  totalAccountBalance: number;
  totalExpenseSoFar: number;
  totalIncomeSoFar: number;
  currencyCode?: string;
  onAllAccountsClick?: () => void;
}

export const HeaderSummaryBanner: React.FC<HeaderSummaryBannerProps> = ({
  totalAccountBalance,
  totalExpenseSoFar,
  totalIncomeSoFar,
  currencyCode = 'BDT',
  onAllAccountsClick,
}) => {
  return (
    <div
      id="header-summary-banner"
      className="bg-[#262623] border-b border-[#363630] px-4 pt-3 pb-4 space-y-3"
    >
      {/* Top All Accounts Pill (Matches Screenshot 1) */}
      <div className="flex justify-center">
        <button
          id="btn-banner-all-accounts"
          type="button"
          onClick={onAllAccountsClick}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#44443c] bg-[#1e1e1b] hover:bg-[#2e2e2a] transition-colors text-xs text-[#c5c5b8] active-press shadow-xs"
        >
          <span>All Accounts</span>
          <span
            className={`font-semibold ${
              totalAccountBalance < 0 ? 'text-[#ff6565]' : 'text-[#4ade80]'
            }`}
          >
            {formatCurrency(totalAccountBalance, currencyCode)}
          </span>
          <ChevronRight size={14} className="text-[#888880]" />
        </button>
      </div>

      {/* Expense So Far & Income So Far */}
      <div className="grid grid-cols-2 gap-3 text-center pt-1">
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[#e6c875] uppercase">
            Expense so far
          </span>
          <span className="text-base sm:text-lg font-bold text-[#ff6565] tracking-tight mt-0.5">
            {formatCurrency(totalExpenseSoFar, currencyCode, { absolute: true })}
          </span>
        </div>

        <div className="flex flex-col items-center border-l border-[#363630]">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[#e6c875] uppercase">
            Income so far
          </span>
          <span className="text-base sm:text-lg font-bold text-[#4ade80] tracking-tight mt-0.5">
            {formatCurrency(totalIncomeSoFar, currencyCode, { absolute: true })}
          </span>
        </div>
      </div>
    </div>
  );
};
