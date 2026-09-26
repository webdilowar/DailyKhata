import React, { useState } from 'react';
import { ChevronDown, MessageSquare, HelpCircle, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { useTally } from '../../contexts/TallyContext';

interface TallyHeaderProps {
  onOpenStoreModal: () => void;
  onOpenInbox: () => void;
  onOpenSupport: () => void;
}

export const TallyHeader: React.FC<TallyHeaderProps> = ({
  onOpenStoreModal,
  onOpenInbox,
  onOpenSupport,
}) => {
  const { businessName, toggleAppMode } = useTally();

  return (
    <header
      id="tally-top-header"
      className="sticky top-0 z-30 bg-[#be1e2d] text-white px-3 py-2.5 shadow-md flex items-center justify-between"
    >
      {/* Left Store Info */}
      <div className="flex items-center gap-1.5">
        <button
          id="btn-tally-store-select"
          type="button"
          onClick={onOpenStoreModal}
          className="flex items-center gap-1 hover:bg-[#a51926] px-2 py-1 rounded-lg transition-colors text-left"
        >
          <span className="font-bold text-base sm:text-lg tracking-tight truncate max-w-[130px] sm:max-w-[160px]">
            {businessName}
          </span>
          <ChevronDown size={16} className="text-white/80 shrink-0" />
        </button>

        <span className="bg-[#15803d] text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm shrink-0">
          <CheckCircle2 size={10} />
          স্ট্যান্ডার্ড
        </span>
      </div>

      {/* Center Switcher Button (Middle Button requested by user) */}
      <div className="flex items-center justify-center">
        <button
          id="btn-switch-to-moneyflow"
          type="button"
          onClick={toggleAppMode}
          title="MoneyFlow এ ফিরে যান"
          className="flex items-center gap-1 px-2.5 py-1 bg-white text-[#be1e2d] hover:bg-[#fef2f2] font-semibold text-xs rounded-full shadow-md border border-white/40 transition-all active:scale-95 animate-pulse hover:animate-none"
        >
          <ArrowLeftRight size={13} className="text-[#be1e2d]" />
          <span className="font-bold">MoneyFlow</span>
        </button>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1">
        {/* Inbox with 99+ badge */}
        <button
          id="btn-tally-inbox"
          type="button"
          onClick={onOpenInbox}
          aria-label="ইনবক্স মেসেজ"
          className="p-1.5 hover:bg-[#a51926] rounded-full relative transition-colors"
        >
          <MessageSquare size={19} />
          <span className="absolute -top-1 -right-1 bg-white text-[#be1e2d] text-[9px] font-black px-1 py-0.2 rounded-full border border-[#be1e2d] shadow-sm leading-none">
            99+
          </span>
        </button>

        {/* Support */}
        <button
          id="btn-tally-support"
          type="button"
          onClick={onOpenSupport}
          aria-label="সাহায্য ও সাপোর্ট"
          className="p-1.5 hover:bg-[#a51926] rounded-full transition-colors"
        >
          <HelpCircle size={19} />
        </button>
      </div>
    </header>
  );
};
