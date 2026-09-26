import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { getAccountIconComponent } from '../utils/icons';
import { formatCurrency } from '../utils/currency';
import { X, Plus, Check } from 'lucide-react';

interface AccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  selectedAccountId?: string;
  onSelectAccount: (account: Account) => void;
  onAddAccount: (accountData: Omit<Account, 'id' | 'currentBalance'>) => Promise<string | undefined>;
  currencyCode?: string;
}

const ACCOUNT_TYPES: AccountType[] = ['Cash', 'Bank', 'bKash', 'Nagad', 'Credit Card', 'PayPal', 'Other'];

export const AccountPickerModal: React.FC<AccountPickerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  selectedAccountId,
  onSelectAccount,
  onAddAccount,
  currencyCode = 'BDT',
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Cash');
  const [initialBalance, setInitialBalance] = useState('0');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const parsedBalance = parseFloat(initialBalance) || 0;
      const id = await onAddAccount({
        name: name.trim(),
        type,
        icon: type,
        color: '#3b82f6',
        initialBalance: parsedBalance,
        currency: currencyCode,
        description: description.trim(),
      });
      if (id) {
        const created: Account = {
          id,
          name: name.trim(),
          type,
          icon: type,
          color: '#3b82f6',
          initialBalance: parsedBalance,
          currentBalance: parsedBalance,
          currency: currencyCode,
        };
        onSelectAccount(created);
        setIsCreating(false);
        setName('');
        setInitialBalance('0');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="account-picker-modal"
        className="w-full max-w-md bg-[#252522] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <h2 className="text-lg font-semibold text-[#f5f5f0]">
            {isCreating ? 'Add New Account' : 'Select an Account'}
          </h2>
          <button
            id="close-account-picker"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#33332d] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!isCreating ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {accounts.map((acc) => {
                const IconComp = getAccountIconComponent(acc.icon || acc.type);
                const isSelected = selectedAccountId === acc.id;
                const balance = acc.currentBalance ?? acc.initialBalance;

                return (
                  <button
                    key={acc.id}
                    id={`account-picker-item-${acc.id}`}
                    type="button"
                    onClick={() => {
                      onSelectAccount(acc);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all active-press ${
                      isSelected
                        ? 'bg-[#2f2f29] border-[#e6c875]'
                        : 'bg-[#1e1e1c] border-[#383832] hover:bg-[#262622]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: acc.color || '#3b82f6' }}
                      >
                        <IconComp size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#f5f5f0]">{acc.name}</p>
                        <p className="text-xs text-[#a3a398]">{acc.type}</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          balance < 0 ? 'text-[#ff6565]' : 'text-[#4ade80]'
                        }`}
                      >
                        {formatCurrency(balance, acc.currency || currencyCode)}
                      </span>
                      {isSelected && <Check size={18} className="text-[#e6c875]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#363630]">
              <button
                id="btn-add-new-account"
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full py-3 px-4 border border-[#e6c875] text-[#e6c875] hover:bg-[#e6c875]/10 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors active-press"
              >
                <Plus size={16} />
                <span>+ ADD NEW ACCOUNT</span>
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Account Name</label>
              <input
                id="new-account-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. City Bank, Pocket Cash, Nagad"
                className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-sm text-[#f5f5f0] outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Account Type</label>
              <select
                id="new-account-type"
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-sm text-[#f5f5f0] outline-hidden"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Starting Balance</label>
              <input
                id="new-account-balance"
                type="number"
                step="any"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-sm text-[#f5f5f0] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Description (Optional)</label>
              <input
                id="new-account-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Daily spending account"
                className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-sm text-[#f5f5f0] outline-hidden"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2.5 bg-[#33332d] hover:bg-[#3d3d36] text-[#f5f5f0] text-sm font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-save-new-account"
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 py-2.5 bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a] text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
