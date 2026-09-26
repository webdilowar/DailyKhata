import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { X, Trash2, AlertOctagon } from 'lucide-react';

interface DeleteResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteResetModal: React.FC<DeleteResetModalProps> = ({ isOpen, onClose }) => {
  const { transactions, resetAllFinancialData, refreshData } = useFinancial();
  const [confirmText, setConfirmText] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFactoryReset = async () => {
    if (confirmText.toLowerCase() !== 'reset') {
      alert('Please type "RESET" into the confirmation box to proceed.');
      return;
    }

    setProcessing(true);
    try {
      await resetAllFinancialData();
      await refreshData();
      alert('Application data has been reset to defaults.');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error during reset.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        id="delete-reset-modal"
        className="w-full max-w-md bg-[#242420] border border-[#ff6565]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630] bg-[#2d1b1b]">
          <div className="flex items-center gap-2 text-[#ff6565]">
            <AlertOctagon size={20} />
            <h2 className="text-base font-bold">Delete & Factory Reset</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm">
          <p className="text-[#c5c5b8] leading-relaxed">
            This action will permanently delete all your logged transactions, custom budgets, and account balances, restoring default clean accounts and categories.
          </p>

          <div className="bg-[#1c1c1a] p-3 rounded-xl border border-[#383832] space-y-1 text-xs">
            <p className="text-[#a3a398]">
              Current records: <span className="font-bold text-[#f5f5f0]">{transactions.length}</span> transactions
            </p>
            <p className="text-[#ff6565] font-semibold">
              Warning: This action cannot be undone unless you have a JSON backup.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a3a398] mb-1.5">
              Type <span className="text-[#ff6565] font-mono font-bold">RESET</span> to confirm:
            </label>
            <input
              id="input-reset-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#ff6565] rounded-xl px-3.5 py-2.5 text-sm text-[#f5f5f0] outline-hidden uppercase font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#33332d] text-[#f5f5f0] text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-factory-reset"
              type="button"
              onClick={handleFactoryReset}
              disabled={confirmText.toLowerCase() !== 'reset' || processing}
              className="flex-1 py-2.5 bg-[#ff6565] hover:bg-[#ff7b7b] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
            >
              {processing ? 'Resetting...' : 'Permanently Reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
