import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { HeaderSummaryBanner } from '../components/HeaderSummaryBanner';
import { ConfirmModal } from '../components/ConfirmModal';
import { getCategoryIconComponent } from '../utils/icons';
import { Category, TransactionType } from '../types';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

interface CategoriesPageProps {
  onOpenAccountsTab: () => void;
}

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'
];

const AVAILABLE_ICONS = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment',
  'Education', 'Housing', 'Travel', 'Gift', 'Salary', 'Investment',
  'Bonus', 'Personal', 'Groceries', 'Fuel', 'Default'
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onOpenAccountsTab }) => {
  const {
    categories,
    incomeCategories,
    expenseCategories,
    settings,
    totalAccountBalance,
    monthlyStats,
    addNewCategory,
    editCategory,
    removeCategory,
    transactions,
  } = useFinancial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedIcon, setSelectedIcon] = useState('Food');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [saving, setSaving] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string; isUsed: boolean } | null>(null);

  const openAddModal = (initialType: TransactionType = 'expense') => {
    setEditingCategory(null);
    setName('');
    setType(initialType);
    setSelectedIcon(initialType === 'income' ? 'Salary' : 'Food');
    setSelectedColor(initialType === 'income' ? '#10b981' : '#ef4444');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        await editCategory(editingCategory.id, {
          name: name.trim(),
          type,
          icon: selectedIcon,
          color: selectedColor,
        });
      } else {
        await addNewCategory({
          name: name.trim(),
          type,
          icon: selectedIcon,
          color: selectedColor,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (cat: Category) => {
    const isUsed = transactions.some((t) => t.categoryId === cat.id);
    setCategoryToDelete({ id: cat.id, name: cat.name, isUsed });
  };

  return (
    <div id="categories-page" className="pb-28">
      {/* Header Summary Banner (Matches screenshot 7) */}
      <HeaderSummaryBanner
        totalAccountBalance={totalAccountBalance}
        totalExpenseSoFar={monthlyStats.totalExpense}
        totalIncomeSoFar={monthlyStats.totalIncome}
        currencyCode={settings.currency}
        onAllAccountsClick={onOpenAccountsTab}
      />

      {/* Main Categories Sections (Matches Screenshot 7) */}
      <div className="p-4 space-y-6">
        {/* Income Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-[#363630] pb-2">
            <h3 className="font-script text-2xl font-bold text-[#e6c875]">
              Income categories
            </h3>
            <button
              id="btn-add-income-cat"
              type="button"
              onClick={() => openAddModal('income')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#e6c875] text-[#e6c875] text-xs font-semibold hover:bg-[#e6c875]/10 transition-colors"
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {incomeCategories.map((cat) => {
              const IconComp = getCategoryIconComponent(cat.icon || cat.name);
              return (
                <div
                  key={cat.id}
                  id={`cat-income-${cat.id}`}
                  className="flex items-center justify-between p-3 bg-[#262622] rounded-xl border border-[#363630] hover:border-[#44443c] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconComp size={20} className="text-white drop-shadow-xs" />
                    </div>
                    <span className="text-sm font-semibold text-[#f5f5f0]">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-[#a3a398] hover:text-[#e6c875] rounded-lg transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    {incomeCategories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-[#a3a398] hover:text-[#ff6565] rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-[#363630] pb-2">
            <h3 className="font-script text-2xl font-bold text-[#e6c875]">
              Expense categories
            </h3>
            <button
              id="btn-add-expense-cat"
              type="button"
              onClick={() => openAddModal('expense')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#e6c875] text-[#e6c875] text-xs font-semibold hover:bg-[#e6c875]/10 transition-colors"
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {expenseCategories.map((cat) => {
              const IconComp = getCategoryIconComponent(cat.icon || cat.name);
              return (
                <div
                  key={cat.id}
                  id={`cat-expense-${cat.id}`}
                  className="flex items-center justify-between p-3 bg-[#262622] rounded-xl border border-[#363630] hover:border-[#44443c] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconComp size={20} className="text-white drop-shadow-xs" />
                    </div>
                    <span className="text-sm font-semibold text-[#f5f5f0]">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-[#a3a398] hover:text-[#e6c875] rounded-lg transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    {expenseCategories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-[#a3a398] hover:text-[#ff6565] rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#242420] border border-[#3e3e37] rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#f5f5f0]">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#a3a398] hover:text-[#f5f5f0]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">Category Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['expense', 'income'] as TransactionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 text-xs font-semibold rounded-xl capitalize transition-colors ${
                        type === t
                          ? 'bg-[#e6c875] text-[#1c1c1a]'
                          : 'bg-[#1a1a18] text-[#a3a398] border border-[#383832]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Subscriptions, Freelance"
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Pick Icon</label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-[#1a1a18] rounded-xl border border-[#383832]">
                  {AVAILABLE_ICONS.map((iconKey) => {
                    const Comp = getCategoryIconComponent(iconKey);
                    const isSelected = selectedIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setSelectedIcon(iconKey)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#e6c875] text-[#1c1c1a]' : 'text-[#a3a398] hover:bg-[#282824]'
                        }`}
                      >
                        <Comp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        selectedColor === c ? 'scale-115 ring-2 ring-[#e6c875]' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={async () => {
          if (categoryToDelete) {
            await removeCategory(categoryToDelete.id);
            setCategoryToDelete(null);
          }
        }}
        title="Delete Category"
        message={
          categoryToDelete?.isUsed
            ? `Category "${categoryToDelete.name}" has existing transactions. Deleting it will keep the records, but they will be categorized under Other. Proceed?`
            : `Are you sure you want to delete category "${categoryToDelete?.name}"?`
        }
        confirmText="Delete Category"
        isDestructive={true}
      />
    </div>
  );
};
