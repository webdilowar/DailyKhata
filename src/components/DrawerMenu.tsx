import React from 'react';
import {
  Settings,
  FileSpreadsheet,
  HardDriveDownload,
  Trash2,
  Cloud,
  HelpCircle,
  MessageSquare,
  LogOut,
  LogIn,
  X,
  User,
  BookOpen,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTally } from '../contexts/TallyContext';

export type DrawerAction =
  | 'preferences'
  | 'export'
  | 'backup'
  | 'reset'
  | 'cloud_sync'
  | 'help'
  | 'feedback'
  | 'auth';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: DrawerAction) => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const { user, isConfigured, logout } = useAuth();
  const { toggleAppMode } = useTally();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        id="drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
      />

      {/* Drawer Panel */}
      <div
        id="drawer-menu-panel"
        className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-[#20201e] border-r border-[#363630] flex flex-col shadow-2xl z-10"
      >
        {/* Drawer Header (Matches screenshot 8) */}
        <div className="p-6 bg-[#1a1a18] border-b border-[#363630]">
          <div className="flex items-center justify-between">
            <h2 className="font-script text-3xl font-bold text-[#e6c875]">
              MoneyFlow
            </h2>
            <button
              id="btn-close-drawer"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#2a2a26] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-[#a3a398]">
            <span className="font-medium text-[#c5c5b8]">
              {user?.displayName || (user?.isDemo ? 'Demo Mode' : user?.email || 'Guest')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#2a2a26] text-[10px] text-[#e6c875] border border-[#3e3e37]">
              {isConfigured ? 'Firebase Active' : 'Local / Demo'}
            </span>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {/* TallyKhata Switcher in Drawer */}
          <div className="bg-[#be1e2d]/15 border border-[#be1e2d]/40 p-2.5 rounded-xl hover:bg-[#be1e2d]/25 transition-colors">
            <button
              id="drawer-btn-tallykhata"
              type="button"
              onClick={() => {
                toggleAppMode();
                onClose();
              }}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#be1e2d] text-white flex items-center justify-center shadow-md">
                  <BookOpen size={17} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>টালিখাতা মোড</span>
                    <span className="text-[9px] bg-[#be1e2d] text-white px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                      Switch
                    </span>
                  </div>
                  <div className="text-[11px] text-[#fca5a5]">বাকি ও দেনা-পাওনা খাতা</div>
                </div>
              </div>
              <ArrowLeftRight size={15} className="text-[#fca5a5]" />
            </button>
          </div>

          {/* Preferences */}
          <div className="space-y-1">
            <button
              id="menu-btn-preferences"
              type="button"
              onClick={() => {
                onSelectAction('preferences');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#f5f5f0] hover:bg-[#2a2a26] hover:text-[#e6c875] transition-colors active-press text-left"
            >
              <Settings size={18} className="text-[#a3a398]" />
              <span>Preferences</span>
            </button>
          </div>

          {/* Section: Management */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-[#70706a] uppercase tracking-wider mb-1">
              Management
            </p>
            <div className="space-y-0.5">
              <button
                id="menu-btn-export"
                type="button"
                onClick={() => {
                  onSelectAction('export');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#f5f5f0] hover:bg-[#2a2a26] hover:text-[#e6c875] transition-colors active-press text-left"
              >
                <FileSpreadsheet size={18} className="text-[#a3a398]" />
                <span>Export Report</span>
              </button>

              <button
                id="menu-btn-backup"
                type="button"
                onClick={() => {
                  onSelectAction('backup');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#f5f5f0] hover:bg-[#2a2a26] hover:text-[#e6c875] transition-colors active-press text-left"
              >
                <HardDriveDownload size={18} className="text-[#a3a398]" />
                <span>Backup & Restore</span>
              </button>

              <button
                id="menu-btn-reset"
                type="button"
                onClick={() => {
                  onSelectAction('reset');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#ff6565] hover:bg-[#2a2a26] transition-colors active-press text-left"
              >
                <Trash2 size={18} className="text-[#ff6565]" />
                <span>Delete & Reset</span>
              </button>
            </div>
          </div>

          {/* Section: Application */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-[#70706a] uppercase tracking-wider mb-1">
              Application
            </p>
            <div className="space-y-0.5">
              <button
                id="menu-btn-cloud"
                type="button"
                onClick={() => {
                  onSelectAction('cloud_sync');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#f5f5f0] hover:bg-[#2a2a26] hover:text-[#e6c875] transition-colors active-press text-left"
              >
                <Cloud size={18} className="text-[#a3a398]" />
                <span>Firebase Cloud Sync</span>
              </button>

              <button
                id="menu-btn-help"
                type="button"
                onClick={() => {
                  onSelectAction('help');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#f5f5f0] hover:bg-[#2a2a26] hover:text-[#e6c875] transition-colors active-press text-left"
              >
                <HelpCircle size={18} className="text-[#a3a398]" />
                <span>Help & Documentation</span>
              </button>

              <button
                id="menu-btn-feedback"
                type="button"
                onClick={() => {
                  onSelectAction('feedback');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#f5f5f0] hover:bg-[#2a2a26] hover:text-[#e6c875] transition-colors active-press text-left"
              >
                <MessageSquare size={18} className="text-[#a3a398]" />
                <span>Feedback</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer / Account Auth */}
        <div className="p-4 border-t border-[#363630] bg-[#1a1a18]">
          {user && !user.isDemo ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <div className="w-8 h-8 rounded-full bg-[#e6c875] text-[#1c1c1a] flex items-center justify-center font-bold text-xs shrink-0">
                  <User size={16} />
                </div>
                <div className="truncate text-xs">
                  <p className="font-medium text-[#f5f5f0] truncate">{user.displayName || 'User'}</p>
                  <p className="text-[#a3a398] truncate text-[11px]">{user.email}</p>
                </div>
              </div>

              <button
                id="drawer-btn-logout"
                type="button"
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                title="Sign out"
                className="p-2 rounded-xl text-[#a3a398] hover:text-[#ff6565] hover:bg-[#262622] transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              id="drawer-btn-login"
              type="button"
              onClick={() => {
                onSelectAction('auth');
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a] font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors active-press"
            >
              <LogIn size={16} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
