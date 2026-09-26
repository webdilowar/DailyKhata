import React from 'react';
import { Menu, Search, ShieldCheck, LogIn, User, ArrowLeftRight, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTally } from '../contexts/TallyContext';

interface TopBarProps {
  onOpenDrawer: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  title?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenDrawer,
  onOpenSearch,
  onOpenAuth,
  title = 'MoneyFlow',
}) => {
  const { user, isConfigured } = useAuth();
  const { toggleAppMode } = useTally();
  const isLoggedIn = Boolean(user && !user.isDemo);

  return (
    <header
      id="app-top-bar"
      className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#20201e] border-b border-[#363630] backdrop-blur-md"
    >
      <div className="flex items-center gap-1">
        <button
          id="btn-open-drawer"
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open main menu"
          className="p-1.5 sm:p-2 -ml-1 text-[#f5f5f0] hover:text-[#e6c875] hover:bg-[#2c2c28] rounded-xl transition-colors active-press"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="font-script text-xl sm:text-2xl font-bold tracking-wide text-[#e6c875] select-none">
            {title}
          </h1>
          {isConfigured && isLoggedIn && (
            <span
              title={`Cloud Synced: ${user?.email || user?.phoneNumber || 'Active'}`}
              className="hidden sm:flex items-center gap-1 text-[11px] text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-full border border-[#4ade80]/20"
            >
              <ShieldCheck size={13} />
              <span>Synced</span>
            </span>
          )}
        </div>
      </div>

      {/* Middle Switch Button to TallyKhata */}
      <div className="flex items-center justify-center">
        <button
          id="btn-topbar-switch-mode"
          type="button"
          onClick={toggleAppMode}
          title="টালিখাতা (বাকি খাতা) ইন্টারফেসে যান"
          className="flex items-center gap-1.5 px-3 py-1 bg-[#be1e2d] hover:bg-[#a51926] text-white text-xs font-bold rounded-full shadow-md border border-[#ef4444]/40 transition-all active:scale-95 animate-pulse hover:animate-none"
        >
          <ArrowLeftRight size={13} className="text-white" />
          <span>টালিখাতা</span>
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          id="btn-open-search"
          type="button"
          onClick={onOpenSearch}
          aria-label="Search transactions"
          className="p-2 text-[#f5f5f0] hover:text-[#e6c875] hover:bg-[#2c2c28] rounded-xl transition-colors active-press"
        >
          <Search size={20} />
        </button>

        {isLoggedIn ? (
          <button
            id="btn-topbar-profile"
            type="button"
            onClick={onOpenDrawer}
            title={`Logged in as ${user?.displayName || user?.email || user?.phoneNumber || 'User'}`}
            className="flex items-center gap-1.5 p-1.5 bg-[#2a2a26] hover:bg-[#33332d] border border-[#3e3e37] text-[#e6c875] rounded-xl text-xs transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#e6c875] text-[#1c1c1a] flex items-center justify-center font-bold text-[11px]">
              {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
          </button>
        ) : (
          <button
            id="btn-topbar-signin"
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e6c875]/15 hover:bg-[#e6c875]/25 border border-[#e6c875]/40 text-[#e6c875] hover:text-[#f0d58c] rounded-xl text-xs font-semibold transition-all active-press"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
