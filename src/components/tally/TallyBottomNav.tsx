import React from 'react';
import { BookOpen, Coins, QrCode, BarChart3, ArrowLeftRight, UserPlus } from 'lucide-react';
import { useTally } from '../../contexts/TallyContext';

export type TallyNavTab = 'tally' | 'cashbox' | 'qr' | 'reports';

interface TallyBottomNavProps {
  activeTab: TallyNavTab;
  onTabChange: (tab: TallyNavTab) => void;
  onOpenAddContact: () => void;
}

export const TallyBottomNav: React.FC<TallyBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddContact,
}) => {
  const { toggleAppMode } = useTally();

  return (
    <>
      {/* Floating Action Button (FAB) matching Screenshot 4 */}
      <div className="fixed bottom-20 right-5 z-40">
        <button
          id="btn-tally-fab-add-contact"
          type="button"
          onClick={onOpenAddContact}
          title="নতুন কাস্টমার বা সাপ্লায়ার যোগ করুন"
          className="w-14 h-14 rounded-full bg-[#be1e2d] hover:bg-[#a51926] text-white flex items-center justify-center shadow-2xl transition-all active:scale-95 group border-2 border-white"
        >
          <UserPlus size={26} className="group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      {/* Bottom Nav Bar matching Screenshot 4 */}
      <nav
        id="tally-bottom-nav"
        className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 py-1 px-2 safe-area-bottom shadow-lg"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          {/* 1. টালি */}
          <button
            type="button"
            onClick={() => onTabChange('tally')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              activeTab === 'tally' ? 'text-[#be1e2d]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookOpen size={20} className={activeTab === 'tally' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className={`text-[11px] mt-0.5 ${activeTab === 'tally' ? 'font-bold' : 'font-medium'}`}>
              টালি
            </span>
          </button>

          {/* 2. ক্যাশবক্স */}
          <button
            type="button"
            onClick={() => onTabChange('cashbox')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              activeTab === 'cashbox' ? 'text-[#be1e2d]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Coins size={20} className={activeTab === 'cashbox' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className={`text-[11px] mt-0.5 ${activeTab === 'cashbox' ? 'font-bold' : 'font-medium'}`}>
              ক্যাশবক্স
            </span>
          </button>

          {/* 3. Middle Switch Button to MoneyFlow! (Directly in middle tab of bottom bar as requested) */}
          <button
            id="btn-tally-bottom-switch"
            type="button"
            onClick={toggleAppMode}
            title="MoneyFlow এ যান"
            className="flex flex-col items-center justify-center -mt-3 group"
          >
            <div className="w-11 h-11 rounded-full bg-[#be1e2d] text-white shadow-lg flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform border-2 border-white">
              <ArrowLeftRight size={20} className="group-hover:rotate-180 transition-transform duration-300" />
            </div>
            <span className="text-[10px] font-bold text-[#be1e2d] mt-0.5">সুইচ</span>
          </button>

          {/* 4. QR স্ক্যান */}
          <button
            type="button"
            onClick={() => onTabChange('qr')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              activeTab === 'qr' ? 'text-[#be1e2d]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <QrCode size={20} className={activeTab === 'qr' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className={`text-[11px] mt-0.5 ${activeTab === 'qr' ? 'font-bold' : 'font-medium'}`}>
              QR স্ক্যান
            </span>
          </button>

          {/* 5. রিপোর্ট */}
          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              activeTab === 'reports' ? 'text-[#be1e2d]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <BarChart3 size={20} className={activeTab === 'reports' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className={`text-[11px] mt-0.5 ${activeTab === 'reports' ? 'font-bold' : 'font-medium'}`}>
              রিপোর্ট
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
