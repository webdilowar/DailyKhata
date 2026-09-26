import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="confirm-modal"
        className="w-full max-w-sm bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isDestructive ? 'bg-[#ff6565]/15 text-[#ff6565]' : 'bg-[#e6c875]/15 text-[#e6c875]'
              }`}
            >
              {isDestructive ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f5f5f0]">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#c5c5b8] leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-[#2e2e2a] hover:bg-[#383832] text-[#c5c5b8] font-semibold text-xs sm:text-sm rounded-xl border border-[#44443c] transition-colors"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 font-bold text-xs sm:text-sm rounded-xl transition-colors ${
              isDestructive
                ? 'bg-[#ff6565] hover:bg-[#ff7d7d] text-white shadow-lg shadow-[#ff6565]/20'
                : 'bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
