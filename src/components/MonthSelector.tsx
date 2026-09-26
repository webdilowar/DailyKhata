import React from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { addMonths, getMonthKey, getMonthYearString, parseMonthKey } from '../utils/date';

interface MonthSelectorProps {
  currentMonthKey: string; // "YYYY-MM"
  onMonthChange: (newMonthKey: string) => void;
  onOpenFilter?: () => void;
  hasActiveFilters?: boolean;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentMonthKey,
  onMonthChange,
  onOpenFilter,
  hasActiveFilters,
}) => {
  const date = parseMonthKey(currentMonthKey);

  const handlePrev = () => {
    const prevDate = addMonths(date, -1);
    onMonthChange(getMonthKey(prevDate));
  };

  const handleNext = () => {
    const nextDate = addMonths(date, 1);
    onMonthChange(getMonthKey(nextDate));
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#252522] border-b border-[#363630]">
      <div className="flex items-center gap-2">
        <button
          id="btn-nav-prev-month"
          type="button"
          onClick={handlePrev}
          aria-label="Previous month"
          className="p-1.5 rounded-lg text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#33332d] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="font-script text-2xl sm:text-3xl font-bold text-[#e6c875] tracking-wide select-none">
          {getMonthYearString(date)}
        </span>

        <button
          id="btn-nav-next-month"
          type="button"
          onClick={handleNext}
          aria-label="Next month"
          className="p-1.5 rounded-lg text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#33332d] transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {onOpenFilter && (
        <button
          id="btn-open-filter-modal"
          type="button"
          onClick={onOpenFilter}
          aria-label="Filter transactions"
          className={`p-2 rounded-xl border transition-colors relative active-press ${
            hasActiveFilters
              ? 'bg-[#e6c875]/20 text-[#e6c875] border-[#e6c875]'
              : 'border-[#3d3d36] text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#33332d]'
          }`}
        >
          <SlidersHorizontal size={18} />
          {hasActiveFilters && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#e6c875] rounded-full" />
          )}
        </button>
      )}
    </div>
  );
};
