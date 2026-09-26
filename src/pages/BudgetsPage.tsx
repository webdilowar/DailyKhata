import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { MonthSelector } from '../components/MonthSelector';
import { ConfirmModal } from '../components/ConfirmModal';
import { calculateBudgetStatuses } from '../services/budgets';
import { formatCurrency } from '../utils/currency';
import { getCategoryIconComponent } from '../utils/icons';
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Category } from '../types';

interface BudgetsPageProps {
  onOpenFilter: () => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({ onOpenFilter }) => {
  const {
    budgets,
    categories,
    expenseCategories,
    transactions,
    settings,
    selectedMonth,
    setSelectedMonth,
    setCategoryBudget,
    removeBudget,
  } = useFinancial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<{ id: string; categoryName: string } | null>(null);

  const budgetStatuses = calculateBudgetStatuses(budgets, selectedMonth, transactions);

  const totalBudgeted = budgetStatuses.reduce((acc, b) => acc + b.budget.amount, 0);
  const totalSpentInBudgets = budgetStatuses.reduce((acc, b) => acc + b.spent, 0);
  const overallRemaining = Math.round((totalBudgeted - totalSpentInBudgets) * 100) / 100;

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !budgetAmount) return;
    setSaving(true);
    try {
      await setCategoryBudget(selectedMonth, selectedCatId, parseFloat(budgetAmount) || 0);
      setIsModalOpen(false);
      setBudgetAmount('');
      setSelectedCatId('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditBudget = (categoryId: string, amount: number) => {
    setSelectedCatId(categoryId);
    setBudgetAmount(String(amount));
    setIsModalOpen(true);
  };

  const handleDeleteBudget = (budgetId: string, categoryName: string) => {
    setBudgetToDelete({ id: budgetId, categoryName });
  };

  return (
    <div id="budgets-page" className="pb-28">
      {/* Month Selector */}
      <MonthSelector
        currentMonthKey={selectedMonth}
        onMonthChange={setSelectedMonth}
        onOpenFilter={onOpenFilter}
      />

      {/* Overview Card */}
      <div className="p-4 bg-[#262623] border-b border-[#363630]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#a3a398] uppercase tracking-wider">
            Monthly Budget Overview
          </span>
          <button
            id="btn-open-add-budget"
            type="button"
            onClick={() => {
              setSelectedCatId(expenseCategories[0]?.id || '');
              setBudgetAmount('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e6c875] text-[#e6c875] hover:bg-[#e6c875]/10 text-xs font-semibold transition-colors active-press"
          >
            <Plus size={14} />
            <span>Set Budget</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center py-2 bg-[#1e1e1b] rounded-xl border border-[#383832]">
          <div>
            <span className="text-[10px] text-[#a3a398] uppercase block">Total Budget</span>
            <span className="text-xs sm:text-sm font-bold text-[#f5f5f0] mt-0.5 block">
              {formatCurrency(totalBudgeted, settings.currency)}
            </span>
          </div>

          <div className="border-x border-[#383832]">
            <span className="text-[10px] text-[#a3a398] uppercase block">Spent</span>
            <span className="text-xs sm:text-sm font-bold text-[#ff6565] mt-0.5 block">
              {formatCurrency(totalSpentInBudgets, settings.currency)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#a3a398] uppercase block">Remaining</span>
            <span
              className={`text-xs sm:text-sm font-bold mt-0.5 block ${
                overallRemaining < 0 ? 'text-[#ff6565]' : 'text-[#4ade80]'
              }`}
            >
              {formatCurrency(overallRemaining, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Budget Items List */}
      <div className="p-4 space-y-3">
        {budgetStatuses.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm font-medium text-[#a3a398]">
              No budgets set for {selectedMonth}
            </p>
            <p className="text-xs text-[#777770]">
              Plan your category spending to stay in control of your finances.
            </p>
          </div>
        ) : (
          budgetStatuses.map((item) => {
            const cat = categories.find((c) => c.id === item.budget.categoryId);
            const IconComp = getCategoryIconComponent(cat?.icon || cat?.name || 'Default');
            const isOver = item.status === 'over_budget';
            const isNear = item.status === 'near_limit';

            return (
              <div
                key={item.budget.id}
                id={`budget-card-${item.budget.id}`}
                className="p-3.5 bg-[#262622] rounded-xl border border-[#363630] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat?.color || '#ef4444' }}
                    >
                      <IconComp size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#f5f5f0]">{cat?.name || 'Category'}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ff6565]">
                            <AlertTriangle size={11} />
                            Over budget
                          </span>
                        ) : isNear ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f59e0b]">
                            <AlertTriangle size={11} />
                            Near limit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4ade80]">
                            <CheckCircle2 size={11} />
                            On track
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#f5f5f0]">
                        {formatCurrency(item.spent, settings.currency)} /{' '}
                        <span className="text-[#a3a398]">
                          {formatCurrency(item.budget.amount, settings.currency)}
                        </span>
                      </p>
                      <p className="text-[10px] text-[#888880]">
                        {item.percentage}% used
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEditBudget(item.budget.categoryId, item.budget.amount)}
                      className="p-1.5 text-[#a3a398] hover:text-[#e6c875] rounded-lg hover:bg-[#33332d] transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(item.budget.id, cat?.name || 'Category')}
                      className="p-1.5 text-[#a3a398] hover:text-[#ff6565] rounded-lg hover:bg-[#33332d] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#1c1c1a] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver
                        ? 'bg-[#ff6565]'
                        : isNear
                        ? 'bg-[#f59e0b]'
                        : 'bg-[#e6c875]'
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#242420] border border-[#3e3e37] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-[#f5f5f0]">
              Set Monthly Budget ({selectedMonth})
            </h3>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">
                  Category
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] rounded-xl px-3 py-2.5 text-xs text-[#f5f5f0] outline-hidden"
                  required
                >
                  <option value="" disabled>Select Expense Category</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">
                  Budget Limit ({settings.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 8000"
                  className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-sm text-[#f5f5f0] outline-hidden"
                  required
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
                  disabled={saving || !selectedCatId || !budgetAmount}
                  className="flex-1 py-2.5 bg-[#e6c875] text-[#1c1c1a] text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(budgetToDelete)}
        onClose={() => setBudgetToDelete(null)}
        onConfirm={async () => {
          if (budgetToDelete) {
            await removeBudget(budgetToDelete.id);
            setBudgetToDelete(null);
          }
        }}
        title="Delete Budget"
        message={`Are you sure you want to remove the budget for "${budgetToDelete?.categoryName}"? This will not delete any transactions.`}
        confirmText="Remove Budget"
        isDestructive={true}
      />
    </div>
  );
};
