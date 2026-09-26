import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Download,
  MoreVertical,
  BellRing,
  Share2,
  Phone,
  MessageSquare,
  Calendar,
  Camera,
  Trash2,
  Edit2,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import { TallyContact, TallyTransaction, TallyTxType } from '../../types';
import {
  getInitials,
  getAvatarColor,
  formatTakaPlain,
  formatBengaliDateTime,
  formatBengaliDateShort,
  toBengaliNumerals,
  createWhatsAppReminderLink,
  createSmsLink,
} from '../../utils/bengali';
import { generateCustomerPdf } from '../../utils/tallyPdf';
import { TallyTransactionDetailModal } from './TallyTransactionDetailModal';

interface TallyPersonLedgerProps {
  contact: TallyContact;
  transactions: TallyTransaction[];
  businessName: string;
  onBack: () => void;
  onAddTransaction: (
    tx: Omit<TallyTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  onEditTransaction: (
    id: string,
    updates: Partial<TallyTransaction>
  ) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onEditContact: (updates: Partial<TallyContact>) => Promise<void>;
  onDeleteContact: () => Promise<void>;
}

export const TallyPersonLedger: React.FC<TallyPersonLedgerProps> = ({
  contact,
  transactions,
  businessName,
  onBack,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onEditContact,
  onDeleteContact,
}) => {
  // Add Transaction Form State (Screenshot 3)
  const [txType, setTxType] = useState<TallyTxType>('gave'); // 'gave' (দিলাম/বেচা) or 'received' (পেলাম)
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals & Menu State
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<TallyTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<TallyTransaction | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isEditingContact, setIsEditingContact] = useState<boolean>(false);
  const [editContactName, setEditContactName] = useState<string>(contact.name);
  const [editContactPhone, setEditContactPhone] = useState<string>(contact.phone);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const initials = getInitials(contact.name);
  const { bg, text } = getAvatarColor(contact.name);
  const isReceive = contact.currentBalance > 0;
  const isPayable = contact.currentBalance < 0;

  // Calculate Running Totals for Table Footer
  let totalGave = 0;
  let totalReceived = 0;
  transactions.forEach((tx) => {
    if (tx.type === 'gave') totalGave += tx.amount;
    if (tx.type === 'received') totalReceived += tx.amount;
  });

  const handleQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setFormError('দয়া করে সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      await onAddTransaction({
        contactId: contact.id,
        type: txType,
        amount: num,
        description: description.trim() || undefined,
        date: new Date(date).toISOString(),
        sendSms,
        receiptUrl: receiptUrl || undefined,
      });

      // Clear input
      setAmount('');
      setDescription('');
      setReceiptUrl('');
    } catch (err: any) {
      setFormError(err?.message || 'লেনদেন সংরক্ষণ করা সম্ভব হয়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    try {
      await onEditTransaction(editingTx.id, {
        type: txType,
        amount: num,
        description: description.trim() || undefined,
        date: new Date(date).toISOString(),
        receiptUrl: receiptUrl || undefined,
      });
      setEditingTx(null);
      setAmount('');
      setDescription('');
      setReceiptUrl('');
    } catch {
      // Handled
    }
  };

  const startEditTx = (tx: TallyTransaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setAmount(tx.amount.toString());
    setDescription(tx.description || '');
    setDate(new Date(tx.date).toISOString().split('T')[0]);
    setReceiptUrl(tx.receiptUrl || '');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTx(null);
    setAmount('');
    setDescription('');
    setReceiptUrl('');
  };

  const handleSaveContactEdit = async () => {
    if (!editContactName.trim()) return;
    await onEditContact({
      name: editContactName.trim(),
      phone: editContactPhone.trim(),
    });
    setIsEditingContact(false);
  };

  const handleDownloadPdf = () => {
    generateCustomerPdf(contact, transactions, businessName);
  };

  const whatsappUrl = createWhatsAppReminderLink(
    contact.phone || '',
    contact.name,
    contact.currentBalance,
    businessName
  );

  const smsUrl = createSmsLink(
    contact.phone || '',
    contact.name,
    contact.currentBalance,
    businessName
  );

  return (
    <div id="tally-person-ledger" className="min-h-screen bg-[#f3f4f6] flex flex-col pb-12">
      {/* 1. Header Bar matching Screenshot 2 */}
      <header className="sticky top-0 z-30 bg-[#be1e2d] text-white px-3 py-2.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            id="btn-ledger-back"
            type="button"
            onClick={onBack}
            aria-label="Back to contacts list"
            className="p-1.5 hover:bg-[#a51926] rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft size={22} />
          </button>

          <div
            className={`w-9 h-9 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-xs shadow-sm shrink-0`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm sm:text-base leading-tight truncate">
              {contact.name}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-white/80">
              <span className="font-mono">{contact.phone || 'মোবাইল নেই'}</span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Download Statement PDF Button */}
          <button
            id="btn-ledger-download-pdf"
            type="button"
            onClick={handleDownloadPdf}
            title="স্টেটমেন্ট ডাউনলোড করুন"
            className="flex items-center gap-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <Download size={14} />
            <span className="hidden sm:inline">ডাউনলোড</span>
          </button>

          {/* Three dots menu */}
          <div className="relative">
            <button
              id="btn-ledger-more-menu"
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="More options"
              className="p-1.5 hover:bg-[#a51926] rounded-lg transition-colors"
            >
              <MoreVertical size={19} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-fade-in text-xs font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {contact.phone && (
                  <>
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                    >
                      <Phone size={15} className="text-green-600" />
                      <span>কল করুন</span>
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                    >
                      <MessageSquare size={15} className="text-[#25D366]" />
                      <span>হোয়াটসঅ্যাপে মেসেজ</span>
                    </a>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingContact(true)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                >
                  <Edit2 size={15} className="text-blue-600" />
                  <span>কাস্টমার তথ্য এডিট</span>
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
                >
                  <Trash2 size={15} />
                  <span>কাস্টমার ডিলিট করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Top Summary Ribbon (Screenshot 2: দেবো ৫২৫.০০ বা পাবো...) */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">বর্তমান অবস্থা:</span>
          <span
            className={`text-sm sm:text-base font-extrabold font-mono px-2 py-0.5 rounded-lg ${
              isReceive
                ? 'bg-green-50 text-[#16a34a] border border-green-200'
                : isPayable
                ? 'bg-red-50 text-[#be1e2d] border border-red-200'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isReceive && `পাবো ৳ ${formatTakaPlain(contact.currentBalance)}`}
            {isPayable && `দেবো ৳ ${formatTakaPlain(contact.currentBalance)}`}
            {!isReceive && !isPayable && 'বাকি নেই (০.০০)'}
          </span>
        </div>

        <span className="text-[11px] text-gray-400 font-medium">
          {contact.lastActiveAt || 'আজকে'}
        </span>
      </div>

      {/* 3. Send Tagada Reminder Banner (Screenshot 2: তাগাদা মেসেজ পাঠাই) */}
      <div className="bg-[#fffbeb] border-b border-[#fef3c7] px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#92400e] font-semibold">
          <BellRing size={16} className="text-[#d97706]" />
          <span>তাগাদা মেসেজ পাঠাই</span>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            id="btn-tagada-whatsapp"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-bold shadow-sm transition-transform active:scale-95"
          >
            <MessageSquare size={13} />
            <span>হোয়াটসঅ্যাপ</span>
          </a>

          {contact.phone && (
            <a
              id="btn-tagada-sms"
              href={smsUrl}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm transition-transform active:scale-95"
            >
              <span>SMS</span>
            </a>
          )}
        </div>
      </div>

      {/* 4. Ledger Transactions History Table (Screenshot 2) */}
      <div className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header matching Screenshot 2 */}
          <div className="bg-[#f8f9fa] border-b border-gray-200 grid grid-cols-12 px-3 py-2 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
            <div className="col-span-6">লেনদেনের বিবরণ</div>
            <div className="col-span-3 text-right">দিলাম</div>
            <div className="col-span-3 text-right">পেলাম</div>
          </div>

          {/* Table Rows */}
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              এখনও কোন লেনদেন যোগ করা হয়নি। নিচের ফর্মে টাকা যোগ করুন।
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const isGave = tx.type === 'gave';
                return (
                  <div
                    key={tx.id}
                    id={`tally-tx-row-${tx.id}`}
                    onClick={() => setSelectedTxForDetail(tx)}
                    className="grid grid-cols-12 px-3 py-2.5 hover:bg-red-50/40 cursor-pointer transition-colors items-center active:bg-gray-100"
                  >
                    {/* Left: Date + Note */}
                    <div className="col-span-6 pr-2">
                      <div className="text-[11px] text-gray-400 font-medium">
                        {formatBengaliDateTime(tx.date)}
                      </div>
                      <div className="text-xs font-semibold text-gray-800 truncate mt-0.5">
                        {tx.description || (isGave ? 'মাল বা টাকা দিলাম' : 'টাকা পরিশোধ পেলাম')}
                      </div>
                    </div>

                    {/* Middle: দিলাম */}
                    <div className="col-span-3 text-right font-mono font-bold text-xs sm:text-sm text-gray-900">
                      {isGave ? formatTakaPlain(tx.amount) : '-'}
                    </div>

                    {/* Right: পেলাম */}
                    <div className="col-span-3 text-right font-mono font-bold text-xs sm:text-sm text-gray-900">
                      {!isGave ? formatTakaPlain(tx.amount) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table Footer Summary Row matching Screenshot 2 */}
          <div className="bg-[#f8f9fa] border-t border-gray-200 grid grid-cols-12 px-3 py-2.5 text-xs font-bold text-gray-800">
            <div className="col-span-6 flex items-center gap-1.5">
              <span>মোট</span>
              <span className="text-[10px] text-gray-400 font-normal">
                ({toBengaliNumerals(transactions.length)}টি লেনদেন)
              </span>
            </div>
            <div className="col-span-3 text-right font-mono text-gray-900">
              {formatTakaPlain(totalGave)}
            </div>
            <div className="col-span-3 text-right font-mono text-gray-900">
              {formatTakaPlain(totalReceived)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Add / Edit Transaction Card matching Screenshot 3 */}
      <div className="px-3 py-2 sticky bottom-0 z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-300 p-3.5 animate-slide-up">
          <form onSubmit={editingTx ? handleUpdateTransaction : handleConfirmAddTransaction}>
            {/* Top 2 side-by-side buttons: দিলাম vs পেলাম */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                id="btn-tab-gave"
                onClick={() => setTxType('gave')}
                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 border-2 transition-all ${
                  txType === 'gave'
                    ? 'bg-[#be1e2d] text-white border-[#be1e2d] shadow-md scale-[1.01]'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>৳ দিলাম / বেচা</span>
              </button>

              <button
                type="button"
                id="btn-tab-received"
                onClick={() => setTxType('received')}
                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 border-2 transition-all ${
                  txType === 'received'
                    ? 'bg-[#16a34a] text-white border-[#16a34a] shadow-md scale-[1.01]'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>৳ পেলাম</span>
              </button>
            </div>

            {/* Error message */}
            {formError && (
              <div className="mb-2 text-[11px] text-red-600 font-semibold bg-red-50 p-1.5 rounded-lg">
                {formError}
              </div>
            )}

            {/* Amount input field */}
            <div className="relative flex items-center mb-2">
              <span className="absolute left-3 text-lg font-black text-gray-400 font-mono">৳</span>
              <input
                id="input-tally-tx-amount"
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="০.০০"
                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black font-mono text-gray-900 focus:bg-white focus:border-[#be1e2d] focus:outline-none transition-all"
              />
            </div>

            {/* Quick addition chips: +100, +500, +1000, +5000 */}
            <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-0.5">
              {[100, 500, 1000, 5000].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickAmount(chip)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold transition-all shrink-0 active:scale-95"
                >
                  +{toBengaliNumerals(chip)}
                </button>
              ))}
            </div>

            {/* Description input */}
            <div className="mb-2.5">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="বিবরণ লিখুন (যেমন: মাল বিক্রয়, বকেয়া আদায়)"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#be1e2d] focus:outline-none transition-all"
              />
            </div>

            {/* Extra Options Row: Date, SMS toggle, Photo (Screenshot 3) */}
            <div className="flex items-center justify-between text-xs text-gray-600 mb-3 pt-1 border-t border-gray-100">
              {/* Date button */}
              <div className="flex items-center gap-1 text-gray-700 font-medium">
                <Calendar size={14} className="text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Photo Upload */}
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                    receiptUrl
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Camera size={13} />
                  <span>{receiptUrl ? 'ছবি যুক্ত' : 'ছবি'}</span>
                </button>
              </div>

              {/* Tally SMS Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="rounded text-[#be1e2d] focus:ring-0"
                />
                <span className="text-[11px] font-medium">টালি-মেসেজ</span>
              </label>
            </div>

            {/* Bottom Big Confirm Button matching Screenshot 3 */}
            <div className="flex items-center gap-2">
              {editingTx && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl"
                >
                  বাতিল
                </button>
              )}

              <button
                id="btn-confirm-tally-tx"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#be1e2d] hover:bg-[#a51926] text-white text-sm font-extrabold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : editingTx ? 'আপডেট নিশ্চিত করুন' : 'নিশ্চিত'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Transaction Detail Modal (Screenshot 1) */}
      <TallyTransactionDetailModal
        isOpen={Boolean(selectedTxForDetail)}
        onClose={() => setSelectedTxForDetail(null)}
        transaction={selectedTxForDetail}
        contact={contact}
        onDelete={onDeleteTransaction}
        onEdit={startEditTx}
      />

      {/* Edit Contact Modal */}
      {isEditingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-2xl space-y-3">
            <h3 className="font-bold text-gray-900 text-base">কাস্টমার তথ্য এডিট</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">নাম</label>
              <input
                type="text"
                value={editContactName}
                onChange={(e) => setEditContactName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">মোবাইল নম্বর</label>
              <input
                type="tel"
                value={editContactPhone}
                onChange={(e) => setEditContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingContact(false)}
                className="px-3 py-1.5 text-xs text-gray-600 rounded-lg hover:bg-gray-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveContactEdit}
                className="px-4 py-1.5 bg-[#be1e2d] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Contact Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[#be1e2d] flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">কাস্টমার ডিলিট করবেন?</h3>
            <p className="text-xs text-gray-500">
              "{contact.name}" এর সকল লেনদেনের তথ্য মুছে যাবে। এই প্রক্রিয়া ফেরত আনা যাবে না।
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await onDeleteContact();
                  onBack();
                }}
                className="px-4 py-2 bg-[#be1e2d] text-white text-xs font-bold rounded-xl shadow-md"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
