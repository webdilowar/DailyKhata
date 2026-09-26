import React from 'react';
import { X, Calculator, ArrowRightLeft, Target, FileSpreadsheet, HardDrive } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        id="help-modal"
        className="w-full max-w-md bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <h2 className="text-base font-bold text-[#f5f5f0]">MoneyFlow User Guide</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#c5c5b8]">
          <div className="flex gap-3 items-start p-3 bg-[#1e1e1c] rounded-xl border border-[#383832]">
            <Calculator size={20} className="text-[#e6c875] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#f5f5f0] text-sm">Built-in Calculator Keypad</h4>
              <p className="mt-1 leading-relaxed text-[#a3a398]">
                Calculate totals directly inside the amount input. You can type math like <span className="text-[#e6c875] font-mono">150 + 80 * 2</span> or hit <span className="font-mono text-[#e6c875]">=</span> to compute sums without opening a separate calculator app.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-[#1e1e1c] rounded-xl border border-[#383832]">
            <ArrowRightLeft size={20} className="text-[#60a5fa] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#f5f5f0] text-sm">Account Transfers</h4>
              <p className="mt-1 leading-relaxed text-[#a3a398]">
                Transfer money between Cash, Bank, and Mobile Wallets (e.g. Cash to bKash or Bank). Account balances update automatically without counting as expense or income.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-[#1e1e1c] rounded-xl border border-[#383832]">
            <Target size={20} className="text-[#f59e0b] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#f5f5f0] text-sm">Monthly Budgets</h4>
              <p className="mt-1 leading-relaxed text-[#a3a398]">
                Set monthly spending limits for categories like Food, Transport, and Entertainment. Visual progress bars show if you are on track or nearing your limits.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-[#1e1e1c] rounded-xl border border-[#383832]">
            <FileSpreadsheet size={20} className="text-[#4ade80] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#f5f5f0] text-sm">Reports & PDF Statements</h4>
              <p className="mt-1 leading-relaxed text-[#a3a398]">
                Generate printable PDF financial statements or export CSV spreadsheets formatted for Microsoft Excel and Google Sheets at any time.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-[#1e1e1c] rounded-xl border border-[#383832]">
            <HardDrive size={20} className="text-[#a855f7] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#f5f5f0] text-sm">Backup & Restore</h4>
              <p className="mt-1 leading-relaxed text-[#a3a398]">
                Download a JSON backup of your entire ledger to keep on your device or Google Drive. You can restore or migrate to another device anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#363630]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#e6c875] text-[#1c1c1a] font-bold text-xs rounded-xl"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
