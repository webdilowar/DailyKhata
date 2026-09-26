import React from 'react';
import { Search, Filter, Download, X } from 'lucide-react';
import { toBengaliNumerals } from '../../utils/bengali';

interface TallySearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTypeTab: 'all' | 'customer' | 'supplier';
  onTypeTabChange: (tab: 'all' | 'customer' | 'supplier') => void;
  customerCount: number;
  supplierCount: number;
  onDownloadReport: () => void;
  onOpenFilterDialog: () => void;
}

export const TallySearchAndFilter: React.FC<TallySearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  activeTypeTab,
  onTypeTabChange,
  customerCount,
  supplierCount,
  onDownloadReport,
  onOpenFilterDialog,
}) => {
  return (
    <div id="tally-search-filter-section" className="bg-white px-3 pt-3 pb-2 border-b border-gray-100">
      {/* Search Bar + Filter + Download PDF */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="flex-1 relative flex items-center">
          <Search size={17} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            id="input-tally-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="খোঁজ (নাম অথবা মোবাইল নম্বর)..."
            className="w-full pl-9 pr-8 py-2 bg-[#f3f4f6] text-gray-800 placeholder-gray-400 text-xs sm:text-sm rounded-xl border border-transparent focus:border-red-400 focus:bg-white focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          id="btn-tally-filter"
          type="button"
          onClick={onOpenFilterDialog}
          title="ফিল্টার করুন"
          className="p-2.5 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-600 rounded-xl transition-colors active-press"
        >
          <Filter size={18} />
        </button>

        {/* Download PDF button matching Screenshot 4 */}
        <button
          id="btn-tally-download-pdf"
          type="button"
          onClick={onDownloadReport}
          title="রিপোর্ট ডাউনলোড করুন"
          className="p-2.5 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#be1e2d] border border-[#fecaca] rounded-xl transition-all active-press flex items-center justify-center"
        >
          <Download size={18} strokeWidth={2.2} />
        </button>
      </div>

      {/* Segmented Tabs & Counts */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="text-gray-500 font-medium">
          কাস্টমার <span className="font-bold text-gray-800">{toBengaliNumerals(customerCount)}</span> /{' '}
          সাপ্লায়ার <span className="font-bold text-gray-800">{toBengaliNumerals(supplierCount)}</span>
        </div>

        {/* Filter pills */}
        <div className="flex items-center bg-[#f3f4f6] p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onTypeTabChange('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              activeTypeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            সবাই
          </button>
          <button
            type="button"
            onClick={() => onTypeTabChange('customer')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              activeTypeTab === 'customer'
                ? 'bg-white text-[#be1e2d] shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            কাস্টমার
          </button>
          <button
            type="button"
            onClick={() => onTypeTabChange('supplier')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              activeTypeTab === 'supplier'
                ? 'bg-white text-[#0f766e] shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            সাপ্লায়ার
          </button>
        </div>
      </div>
    </div>
  );
};
