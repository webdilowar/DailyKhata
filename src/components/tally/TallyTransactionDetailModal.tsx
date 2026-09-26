import React, { useState } from 'react';
import { X, Trash2, Edit3, Calendar, FileText, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { TallyTransaction, TallyContact } from '../../types';
import { formatBengaliDateTime, formatTakaPlain } from '../../utils/bengali';

interface TallyTransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TallyTransaction | null;
  contact: TallyContact;
  onDelete: (txId: string) => Promise<void>;
  onEdit: (tx: TallyTransaction) => void;
}

export const TallyTransactionDetailModal: React.FC<TallyTransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  contact,
  onDelete,
  onEdit,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      setShowConfirmDelete(false);
      onClose();
    } catch {
      // Handled
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        id="tally-tx-detail-modal"
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header matching Screenshot 1 */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-600 hover:text-gray-900 rounded-lg"
            >
              <ArrowLeft size={19} />
            </button>
            <h3 className="font-bold text-gray-900 text-base">লেনদেন বিবরণ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body matching Screenshot 1 */}
        <div className="p-4 space-y-4">
          {/* Amount Badge */}
          <div className="text-center py-4 bg-[#fafafa] rounded-2xl border border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {transaction.type === 'gave' ? 'টাকা / বাকি দিলাম' : 'টাকা পেলাম'}
            </div>
            <div
              className={`text-3xl font-black font-mono tracking-tight ${
                transaction.type === 'gave' ? 'text-[#be1e2d]' : 'text-[#16a34a]'
              }`}
            >
              ৳ {formatTakaPlain(transaction.amount)}
            </div>
            <div className="text-xs text-gray-600 font-medium mt-1">
              কাস্টমার: <span className="font-bold text-gray-900">{contact.name}</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-xs text-gray-600">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Calendar size={14} />
                তারিখ ও সময়
              </span>
              <span className="font-medium text-gray-900">
                {formatBengaliDateTime(transaction.date)}
              </span>
            </div>

            <div className="flex items-start justify-between py-1.5 border-b border-gray-100">
              <span className="flex items-center gap-1.5 text-gray-500 shrink-0">
                <FileText size={14} />
                বিবরণ
              </span>
              <span className="font-medium text-gray-900 text-right max-w-[200px] break-words">
                {transaction.description || 'কোন বিবরণ নেই'}
              </span>
            </div>

            {transaction.receiptUrl && (
              <div className="py-2">
                <span className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                  <ImageIcon size={14} />
                  রসিদ / ভাউচার ছবি
                </span>
                <img
                  src={transaction.receiptUrl}
                  alt="রসিদ"
                  className="w-full h-44 object-cover rounded-xl border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Delete confirmation alert if triggered */}
          {showConfirmDelete ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-center animate-fade-in">
              <p className="text-xs font-semibold text-red-700">
                আপনি কি নিশ্চিতভাবে এই লেনদেনটি মুছে ফেলতে চান?
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg"
                >
                  না
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-4 py-1.5 bg-[#be1e2d] hover:bg-[#a51926] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {isDeleting ? 'মুছছি...' : 'হ্যাঁ, ডিলিট করুন'}
                </button>
              </div>
            </div>
          ) : (
            /* Red Outlined Action Buttons (Screenshot 1: ডিলিট ও এডিট) */
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="py-2.5 px-3 border-2 border-[#be1e2d] text-[#be1e2d] hover:bg-red-50 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 size={16} />
                <span>ডিলিট</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onEdit(transaction);
                  onClose();
                }}
                className="py-2.5 px-3 border-2 border-[#be1e2d] bg-[#be1e2d] text-white hover:bg-[#a51926] rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Edit3 size={16} />
                <span>এডিট</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
