import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatCurrency } from '../utils/currency';
import { getAccountIconComponent } from '../utils/icons';
import { Account, AccountType } from '../types';
import { Plus, ArrowRightLeft, Edit3, Trash2, Shield } from 'lucide-react';

interface AccountsPageProps {
  onOpenTransfer: () => void;
}

const ACCOUNT_TYPES: AccountType[] = ['Cash', 'Bank', 'bKash', 'Nagad', 'Credit Card', 'PayPal', 'Other'];

export const AccountsPage: React.FC<AccountsPageProps> = ({ onOpenTransfer }) => {
  const {
    accounts,
    transactions,
    settings,
    totalAccountBalance,
    addNewAccount,
    editAccount,
    removeAccount,
  } = useFinancial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Cash');
  const [initialBalance, setInitialBalance] = useState('0');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string; hasTx: boolean } | null>(null);

  const openCreateModal = () => {
    setEditingAcc(null);
    setName('');
    setType('Cash');
    setInitialBalance('0');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAcc(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance(String(acc.initialBalance));
    setDescription(acc.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const parsedBalance = parseFloat(initialBalance) || 0;
      if (editingAcc) {
        await editAccount(editingAcc.id, {
          name: name.trim(),
          type,
          icon: type,
          initialBalance: parsedBalance,
          description: description.trim(),
        });
      } else {
        await addNewAccount({
          name: name.trim(),
          type,
          icon: type,
          color: '#3b82f6',
          initialBalance: parsedBalance,
          currency: settings.currency,
          description: description.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (acc: Account) => {
    const hasTx = transactions.some((t) => t.accountId === acc.id || t.fromAccountId === acc.id || t.toAccountId === acc.id);
    setAccountToDelete({ id: acc.id, name: acc.name, hasTx });
  };

  return (
    <div id="accounts-page" className="pb-28">
      {/* Total Balance Card */}
      <div className="p-5 bg-[#262623] border-b border-[#363630]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#a3a398] uppercase tracking-wider">
            Total Net Worth
          </span>
          <div className="flex gap-2">
            <button
              id="btn-quick-transfer"
              type="button"
              onClick={onOpenTransfer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#3e3e37] bg-[#1e1e1b] hover:bg-[#2d2d28] text-xs font-semibold text-[#f5f5f0] transition-colors active-press"
            >
              <ArrowRightLeft size={13} className="text-[#60a5fa]" />
              <span>Transfer</span>
            </button>
            <button
              id="btn-open-create-account"
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e6c875] text-[#e6c875] hover:bg-[#e6c875]/10 text-xs font-semibold transition-colors active-press"
            >
              <Plus size={14} />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        <div className="mt-3">
          <h2
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              totalAccountBalance < 0 ? 'text-[#ff6565]' : 'text-[#4ade80]'
            }`}
          >
            {formatCurrency(totalAccountBalance, settings.currency)}
          </h2>
          <p className="text-xs text-[#888880] mt-0.5">
            Sum of all cash, banks, mobile wallets & cards
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="p-4 space-y-3">
        <h3 className="text-xs font-semibold text-[#a3a398] uppercase tracking-wider mb-2">
          Your Accounts ({accounts.length})
        </h3>

        {accounts.map((acc) => {
          const IconComp = getAccountIconComponent(acc.icon || acc.type);
          const balance = acc.currentBalance ?? acc.initialBalance;
          const accTxCount = transactions.filter(
            (t) => t.accountId === acc.id || t.fromAccountId === acc.id || t.toAccountId === acc.id
          ).length;

          return (
            <div
              key={acc.id}
              id={`account-row-${acc.id}`}
              className="p-4 bg-[#262622] rounded-xl border border-[#363630] space-y-2.5 transition-colors hover:border-[#4a4a40]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: acc.color || '#3b82f6' }}
                  >
                    <IconComp size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#f5f5f0]">{acc.name}</h4>
                    <span className="inline-block text-[10px] text-[#a3a398] bg-[#1e1e1b] px-2 py-0.5 rounded-full mt-0.5 border border-[#363630]">
                      {acc.type}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm sm:text-base font-bold tracking-tight ${
                      balance < 0 ? 'text-[#ff6565]' : 'text-[#4ade80]'
                    }`}
                  >
                    {formatCurrency(balance, acc.currency || settings.currency)}
                  </p>
                  <p className="text-[10px] text-[#888880]">
                    {accTxCount} transaction{accTxCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {acc.description && (
                <p className="text-xs text-[#888880] italic px-1">{acc.description}</p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#363630]/70">
                <button
                  type="button"
                  onClick={() => openEditModal(acc)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#a3a398] hover:text-[#e6c875] rounded-lg hover:bg-[#33332d] transition-colors"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
                {accounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(acc)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#a3a398] hover:text-[#ff6565] rounded-lg hover:bg-[#33332d] transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#242420] border border-[#3e3e37] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-[#f5f5f0]">
              {editingAcc ? 'Edit Account' : 'Add New Account'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">Account Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dutch Bangla Bank, bKash Agent"
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">Account Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3 py-2.5 text-xs text-[#f5f5f0] outline-hidden"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">
                  Starting / Initial Balance ({settings.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#33332d] text-[#f5f5f0] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex-1 py-2.5 bg-[#e6c875] text-[#1c1c1a] text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(accountToDelete)}
        onClose={() => setAccountToDelete(null)}
        onConfirm={async () => {
          if (accountToDelete) {
            await removeAccount(accountToDelete.id);
            setAccountToDelete(null);
          }
        }}
        title="Delete Account"
        message={
          accountToDelete?.hasTx
            ? `Account "${accountToDelete.name}" has transactions linked to it. Deleting it will keep historical transaction records. Are you sure you want to proceed?`
            : `Are you sure you want to delete "${accountToDelete?.name}"?`
        }
        confirmText="Delete Account"
        isDestructive={true}
      />
    </div>
  );
};
