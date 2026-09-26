import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, FileText, Check } from 'lucide-react';
import { TallyContactType } from '../../types';

interface TallyAddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: {
    name: string;
    phone: string;
    type: TallyContactType;
    openingBalance: number;
    address?: string;
    note?: string;
  }) => Promise<void>;
}

export const TallyAddContactModal: React.FC<TallyAddContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<TallyContactType>('customer');
  const [balanceDirection, setBalanceDirection] = useState<'receive' | 'give' | 'none'>('none');
  const [openingAmount, setOpeningAmount] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('দয়া করে নাম লিখুন');
      return;
    }

    setIsSubmitting(true);
    setError('');

    let numBalance = 0;
    const rawNum = parseFloat(openingAmount);
    if (!isNaN(rawNum) && rawNum > 0) {
      numBalance = balanceDirection === 'give' ? -rawNum : rawNum;
    }

    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        type,
        openingBalance: numBalance,
        address: address.trim() || undefined,
        note: note.trim() || undefined,
      });

      // Reset form
      setName('');
      setPhone('');
      setType('customer');
      setBalanceDirection('none');
      setOpeningAmount('');
      setAddress('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'কাস্টমার যোগ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        id="tally-add-contact-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#be1e2d] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <UserPlus size={20} />
            <span>নতুন {type === 'customer' ? 'কাস্টমার' : 'সাপ্লায়ার'} যোগ করুন</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 hover:bg-[#a51926] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-[#dc2626] rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Selector: Customer vs Supplier */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ধরণ নির্বাচন করুন</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('customer')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  type === 'customer'
                    ? 'bg-[#be1e2d] text-white border-[#be1e2d] shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                👤 কাস্টমার (গ্রাহক)
              </button>
              <button
                type="button"
                onClick={() => setType('supplier')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  type === 'supplier'
                    ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                🏢 সাপ্লায়ার (মহাজন)
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              নাম <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="উদাঃ শফিক আহমেদ"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#be1e2d] focus:outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">মোবাইল নম্বর</label>
            <div className="relative flex items-center">
              <Phone size={16} className="absolute left-3 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-[#be1e2d] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Opening Balance */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">পূর্বের বাকি / জমা</label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setBalanceDirection('none')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                  balanceDirection === 'none'
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                বাকি নেই (০)
              </button>
              <button
                type="button"
                onClick={() => setBalanceDirection('receive')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                  balanceDirection === 'receive'
                    ? 'bg-[#16a34a] text-white border-[#16a34a]'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                আমি পাবো
              </button>
              <button
                type="button"
                onClick={() => setBalanceDirection('give')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                  balanceDirection === 'give'
                    ? 'bg-[#dc2626] text-white border-[#dc2626]'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                আমি দেবো
              </button>
            </div>

            {balanceDirection !== 'none' && (
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 font-bold">৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  placeholder="টাকার পরিমাণ লিখুন"
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-[#be1e2d] focus:outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ঠিকানা (ঐচ্ছিক)</label>
            <div className="relative flex items-center">
              <MapPin size={16} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="দোকান বা এলাকার নাম"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#be1e2d] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">নোট / বিবরণ (ঐচ্ছিক)</label>
            <div className="relative flex items-center">
              <FileText size={16} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: নিয়মিত খুচরা ক্রেতা"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#be1e2d] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#be1e2d] hover:bg-[#a51926] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'যুক্ত করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
