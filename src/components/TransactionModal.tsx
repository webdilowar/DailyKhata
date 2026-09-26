import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Account, Category } from '../types';
import { NumericKeypad } from './NumericKeypad';
import { CategoryPickerModal } from './CategoryPickerModal';
import { AccountPickerModal } from './AccountPickerModal';
import { DatePickerModal } from './DatePickerModal';
import { ConfirmModal } from './ConfirmModal';
import { evaluateExpression } from '../utils/calculator';
import { formatShortDate, formatTime, getIsoDateOnly } from '../utils/date';
import { Delete, Calendar, Clock, ArrowRightLeft, Wallet, Tag, Trash2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  accounts: Account[];
  categories: Category[];
  defaultAccountId?: string;
  defaultType?: TransactionType;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAddAccount: (data: Omit<Account, 'id' | 'currentBalance'>) => Promise<string | undefined>;
  onAddCategory: (data: Omit<Category, 'id'>) => Promise<string | undefined>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
  accounts,
  categories,
  defaultAccountId,
  defaultType = 'expense',
  onSave,
  onUpdate,
  onDelete,
  onAddAccount,
  onAddCategory,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [expression, setExpression] = useState<string>('0');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(() => getIsoDateOnly(new Date()));
  const [timeStr, setTimeStr] = useState<string>('14:30');

  // Sub-modals
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [pickingAccountRole, setPickingAccountRole] = useState<'single' | 'from' | 'to'>('single');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setExpression(String(transactionToEdit.amount));
      setSelectedAccountId(transactionToEdit.accountId || (accounts[0]?.id ?? ''));
      setSelectedCategoryId(transactionToEdit.categoryId || '');
      setFromAccountId(transactionToEdit.fromAccountId || '');
      setToAccountId(transactionToEdit.toAccountId || '');
      setNotes(transactionToEdit.note || '');

      const d = new Date(transactionToEdit.date);
      if (!isNaN(d.getTime())) {
        setDateStr(getIsoDateOnly(d));
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        setTimeStr(`${hours}:${mins}`);
      }
    } else {
      setType(defaultType);
      setExpression('0');
      const defAcc = defaultAccountId || accounts[0]?.id || '';
      setSelectedAccountId(defAcc);
      setFromAccountId(defAcc);
      setToAccountId(accounts[1]?.id || defAcc);

      // Default first matching category
      const matchingCats = categories.filter((c) => c.type === defaultType);
      setSelectedCategoryId(matchingCats[0]?.id || '');
      setNotes('');
      setDateStr(getIsoDateOnly(new Date()));
      const now = new Date();
      setTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
  }, [transactionToEdit, isOpen, defaultType, defaultAccountId, accounts, categories]);

  if (!isOpen) return null;

  // Resolved Account & Category
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const fromAccount = accounts.find((a) => a.id === fromAccountId) || accounts[0];
  const toAccount = accounts.find((a) => a.id === toAccountId) || accounts[1] || accounts[0];
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Keypad Handlers
  const handleDigit = (digit: string) => {
    setExpression((prev) => {
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const handleOperator = (op: string) => {
    setExpression((prev) => {
      // If already ends with an operator, replace it
      if (/[+\-×÷]$/.test(prev)) {
        return prev.slice(0, -1) + op;
      }
      return prev + op;
    });
  };

  const handleDecimal = () => {
    setExpression((prev) => {
      // Check last number segment
      const segments = prev.split(/[+\-×÷]/);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.includes('.')) return prev;
      return prev + '.';
    });
  };

  const handleEqual = () => {
    const val = evaluateExpression(expression);
    setExpression(String(val));
  };

  const handleBackspace = () => {
    setExpression((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleSave = async () => {
    const finalAmount = evaluateExpression(expression);
    if (finalAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    setIsSaving(true);
    try {
      const fullIsoDate = `${dateStr}T${timeStr}:00`;

      if (type === 'transfer') {
        if (fromAccountId === toAccountId) {
          alert('From account and To account must be different');
          setIsSaving(false);
          return;
        }

        const data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'transfer',
          amount: finalAmount,
          fromAccountId,
          toAccountId,
          note: notes.trim(),
          date: fullIsoDate,
        };

        if (transactionToEdit && onUpdate) {
          await onUpdate(transactionToEdit.id, data);
        } else {
          await onSave(data);
        }
      } else {
        const catId = selectedCategoryId || (categories.find((c) => c.type === type)?.id ?? '');
        const data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          type,
          amount: finalAmount,
          accountId: selectedAccountId || accounts[0]?.id,
          categoryId: catId,
          note: notes.trim(),
          date: fullIsoDate,
        };

        if (transactionToEdit && onUpdate) {
          await onUpdate(transactionToEdit.id, data);
        } else {
          await onSave(data);
        }
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!transactionToEdit || !onDelete) return;
    setIsConfirmDeleteOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="transaction-modal-container"
        className="w-full max-w-md bg-[#222220] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh]"
      >
        {/* Top Action Bar (Screenshot 4: CANCEL on left, SAVE on right in yellow) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#363630]">
          <button
            id="btn-tx-cancel"
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-[#e6c875] hover:opacity-80 transition-opacity uppercase tracking-wider flex items-center gap-1"
          >
            ✕ CANCEL
          </button>

          {transactionToEdit && onDelete && (
            <button
              id="btn-tx-delete"
              type="button"
              onClick={handleDelete}
              className="text-xs font-semibold text-[#ff6565] hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              <Trash2 size={14} />
              <span>DELETE</span>
            </button>
          )}

          <button
            id="btn-tx-save"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="text-sm font-bold text-[#e6c875] hover:opacity-80 transition-opacity uppercase tracking-wider flex items-center gap-1 disabled:opacity-50"
          >
            ✓ {isSaving ? 'SAVING...' : 'SAVE'}
          </button>
        </div>

        {/* Transaction Type Radio Selector (INCOME | EXPENSE | TRANSFER) */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 py-2.5 px-4 bg-[#1a1a18] border-b border-[#363630]">
          {(['income', 'expense', 'transfer'] as TransactionType[]).map((t) => {
            const isActive = type === t;
            return (
              <button
                key={t}
                id={`tx-type-btn-${t}`}
                type="button"
                onClick={() => {
                  setType(t);
                  // switch default category if switching to income/expense
                  if (t !== 'transfer') {
                    const firstMatch = categories.find((c) => c.type === t);
                    if (firstMatch) setSelectedCategoryId(firstMatch.id);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors ${
                  isActive ? 'text-[#e6c875]' : 'text-[#a3a398] hover:text-[#f5f5f0]'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                    isActive
                      ? 'border-[#e6c875] bg-[#e6c875]'
                      : 'border-[#666660] bg-transparent'
                  }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1c1c1a]" />}
                </span>
                <span>{t}</span>
              </button>
            );
          })}
        </div>

        {/* Account & Category Selection Pills */}
        <div className="p-3 grid grid-cols-2 gap-2 bg-[#222220]">
          {type !== 'transfer' ? (
            <>
              {/* Account Button */}
              <button
                id="btn-select-account"
                type="button"
                onClick={() => {
                  setPickingAccountRole('single');
                  setIsAccountPickerOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#3e3e37] bg-[#2a2a26] hover:bg-[#33332d] text-xs font-semibold text-[#f5f5f0] transition-colors truncate"
              >
                <Wallet size={14} className="text-[#e6c875] shrink-0" />
                <span className="truncate">{selectedAccount?.name || 'Account'}</span>
              </button>

              {/* Category Button */}
              <button
                id="btn-select-category"
                type="button"
                onClick={() => setIsCategoryPickerOpen(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#3e3e37] bg-[#2a2a26] hover:bg-[#33332d] text-xs font-semibold text-[#f5f5f0] transition-colors truncate"
              >
                <Tag size={14} className="text-[#e6c875] shrink-0" />
                <span className="truncate">{selectedCategory?.name || 'Category'}</span>
              </button>
            </>
          ) : (
            <>
              {/* Transfer: From Account */}
              <button
                id="btn-select-from-account"
                type="button"
                onClick={() => {
                  setPickingAccountRole('from');
                  setIsAccountPickerOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#3e3e37] bg-[#2a2a26] hover:bg-[#33332d] text-xs font-semibold text-[#f5f5f0] transition-colors truncate"
              >
                <span className="text-[#a3a398]">From:</span>
                <span className="truncate text-[#e6c875]">{fromAccount?.name || 'Account'}</span>
              </button>

              {/* Transfer: To Account */}
              <button
                id="btn-select-to-account"
                type="button"
                onClick={() => {
                  setPickingAccountRole('to');
                  setIsAccountPickerOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#3e3e37] bg-[#2a2a26] hover:bg-[#33332d] text-xs font-semibold text-[#f5f5f0] transition-colors truncate"
              >
                <span className="text-[#a3a398]">To:</span>
                <span className="truncate text-[#e6c875]">{toAccount?.name || 'Account'}</span>
              </button>
            </>
          )}
        </div>

        {/* Notes Input Field */}
        <div className="px-3 pb-2">
          <input
            id="tx-notes-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#f5f5f0] placeholder-[#777770] outline-hidden"
          />
        </div>

        {/* Large Amount Display with Backspace button */}
        <div className="px-4 py-2 flex items-center justify-between bg-[#191917] border-y border-[#363630]">
          <div className="flex-1 overflow-x-auto text-left mr-2">
            <span
              id="tx-amount-display"
              className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[#f5f5f0]"
            >
              {expression}
            </span>
          </div>

          <button
            id="btn-keypad-backspace"
            type="button"
            onClick={handleBackspace}
            className="p-2.5 text-[#a3a398] hover:text-[#e6c875] bg-[#2a2a26] hover:bg-[#33332d] rounded-xl transition-colors shrink-0 active-press"
          >
            <Delete size={22} />
          </button>
        </div>

        {/* Custom Numeric Keypad */}
        <div className="px-2 pt-2">
          <NumericKeypad
            onDigit={handleDigit}
            onOperator={handleOperator}
            onEqual={handleEqual}
            onDecimal={handleDecimal}
          />
        </div>

        {/* Bottom Bar: Date & Time selector */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-[#1e1e1c] border-t border-[#363630]">
          <button
            id="btn-open-datepicker"
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#383832] bg-[#252522] hover:bg-[#2d2d28] text-xs font-semibold text-[#f5f5f0] transition-colors active-press"
          >
            <Calendar size={14} className="text-[#e6c875]" />
            <span>{formatShortDate(dateStr)}</span>
          </button>

          <button
            id="btn-open-timepicker"
            type="button"
            onClick={() => setIsTimePickerOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#383832] bg-[#252522] hover:bg-[#2d2d28] text-xs font-semibold text-[#f5f5f0] transition-colors active-press"
          >
            <Clock size={14} className="text-[#e6c875]" />
            <span>{formatTime(`${dateStr}T${timeStr}:00`)}</span>
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      <CategoryPickerModal
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        defaultType={type === 'transfer' ? 'expense' : type}
        onSelectCategory={(c) => setSelectedCategoryId(c.id)}
        onAddCategory={onAddCategory}
      />

      <AccountPickerModal
        isOpen={isAccountPickerOpen}
        onClose={() => setIsAccountPickerOpen(false)}
        accounts={accounts}
        selectedAccountId={
          pickingAccountRole === 'single'
            ? selectedAccountId
            : pickingAccountRole === 'from'
            ? fromAccountId
            : toAccountId
        }
        onSelectAccount={(acc) => {
          if (pickingAccountRole === 'single') setSelectedAccountId(acc.id);
          else if (pickingAccountRole === 'from') setFromAccountId(acc.id);
          else setToAccountId(acc.id);
        }}
        onAddAccount={onAddAccount}
      />

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={dateStr}
        onSelectDate={(d) => setDateStr(d)}
      />

      {/* Quick Time Picker Modal */}
      {isTimePickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75">
          <div className="w-full max-w-xs bg-[#242420] border border-[#3e3e37] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-[#f5f5f0]">Select Time</h3>
            <input
              id="time-picker-input"
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl p-3 text-lg text-[#f5f5f0] outline-hidden text-center"
            />
            <button
              type="button"
              onClick={() => setIsTimePickerOpen(false)}
              className="w-full py-2.5 bg-[#e6c875] text-[#1c1c1a] font-semibold text-sm rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={async () => {
          if (transactionToEdit && onDelete) {
            await onDelete(transactionToEdit.id);
            onClose();
          }
        }}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This record will be permanently deleted."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};
