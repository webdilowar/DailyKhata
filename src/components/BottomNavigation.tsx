import React from 'react';
import { ClipboardCheck, PieChart, Target, Wallet, ArrowLeftRight, Plus } from 'lucide-react';
import { useTally } from '../contexts/TallyContext';

export type TabType = 'records' | 'analysis' | 'budgets' | 'accounts' | 'categories';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAddTransaction: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenAddTransaction,
}) => {
  const { toggleAppMode } = useTally();

  return (
    <>
      {/* Floating Action Button (FAB) matching screenshot 1 */}
      <div className="fixed bottom-20 right-5 z-40">
        <button
          id="btn-fab-add-transaction"
          type="button"
          onClick={onOpenAddTransaction}
          aria-label="Add transaction"
          className="w-14 h-14 rounded-full bg-[#34342e] hover:bg-[#3e3e36] text-[#e6c875] border-2 border-[#e6c875] flex items-center justify-center shadow-xl transition-transform active:scale-95 group"
        >
          <Plus size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* Bottom Bar with Middle Switch Button as requested */}
      <nav
        id="app-bottom-nav"
        className="fixed bottom-0 inset-x-0 z-30 bg-[#222220] border-t border-[#363630] py-1.5 px-2 safe-area-bottom backdrop-blur-md"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
          {/* 1. Records */}
          <button
            id="nav-tab-records"
            type="button"
            onClick={() => onTabChange('records')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors active-press ${
              activeTab === 'records' ? 'text-[#e6c875]' : 'text-[#888880] hover:text-[#c5c5b8]'
            }`}
          >
            <ClipboardCheck size={20} className={activeTab === 'records' ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
            <span
              className={`text-[11px] mt-1 tracking-tight truncate ${
                activeTab === 'records' ? 'font-semibold italic' : 'font-normal'
              }`}
            >
              Records
            </span>
          </button>

          {/* 2. Analysis */}
          <button
            id="nav-tab-analysis"
            type="button"
            onClick={() => onTabChange('analysis')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors active-press ${
              activeTab === 'analysis' ? 'text-[#e6c875]' : 'text-[#888880] hover:text-[#c5c5b8]'
            }`}
          >
            <PieChart size={20} className={activeTab === 'analysis' ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
            <span
              className={`text-[11px] mt-1 tracking-tight truncate ${
                activeTab === 'analysis' ? 'font-semibold italic' : 'font-normal'
              }`}
            >
              Analysis
            </span>
          </button>

          {/* 3. Middle Switch Button (টালিখাতা / TallyKhata Switcher) */}
          <button
            id="nav-btn-middle-switch"
            type="button"
            onClick={toggleAppMode}
            title="টালিখাতা (বাকি খাতা) ইন্টারফেসে সুইচ করুন"
            className="flex flex-col items-center justify-center -mt-3.5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#be1e2d] hover:bg-[#a51926] text-white shadow-xl flex items-center justify-center border-2 border-[#fef2f2] group-hover:scale-105 group-active:scale-95 transition-all">
              <ArrowLeftRight size={22} className="group-hover:rotate-180 transition-transform duration-300" />
            </div>
            <span className="text-[10px] font-bold text-[#f87171] mt-0.5 tracking-tight animate-pulse group-hover:animate-none">
              টালিখাতা
            </span>
          </button>

          {/* 4. Budgets */}
          <button
            id="nav-tab-budgets"
            type="button"
            onClick={() => onTabChange('budgets')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors active-press ${
              activeTab === 'budgets' ? 'text-[#e6c875]' : 'text-[#888880] hover:text-[#c5c5b8]'
            }`}
          >
            <Target size={20} className={activeTab === 'budgets' ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
            <span
              className={`text-[11px] mt-1 tracking-tight truncate ${
                activeTab === 'budgets' ? 'font-semibold italic' : 'font-normal'
              }`}
            >
              Budgets
            </span>
          </button>

          {/* 5. Accounts */}
          <button
            id="nav-tab-accounts"
            type="button"
            onClick={() => onTabChange('accounts')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors active-press ${
              activeTab === 'accounts' ? 'text-[#e6c875]' : 'text-[#888880] hover:text-[#c5c5b8]'
            }`}
          >
            <Wallet size={20} className={activeTab === 'accounts' ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
            <span
              className={`text-[11px] mt-1 tracking-tight truncate ${
                activeTab === 'accounts' ? 'font-semibold italic' : 'font-normal'
              }`}
            >
              Accounts
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
