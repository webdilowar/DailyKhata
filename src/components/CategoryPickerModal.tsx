import React, { useState } from 'react';
import { Category, TransactionType } from '../types';
import { getCategoryIconComponent, CATEGORY_ICON_MAP } from '../utils/icons';
import { X, Plus, Check } from 'lucide-react';

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (category: Category) => void;
  onAddCategory: (categoryData: Omit<Category, 'id'>) => Promise<string | undefined>;
  defaultType?: TransactionType;
}

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#ec4899', '#64748b'
];

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  defaultType = 'expense',
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(
    defaultType === 'income' ? 'income' : 'expense'
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('Default');
  const [newColor, setNewColor] = useState('#ef4444');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const id = await onAddCategory({
        name: newName.trim(),
        type: activeTab,
        icon: newIcon,
        color: newColor,
        isDefault: false,
        order: categories.length + 1,
      });
      if (id) {
        const created: Category = {
          id,
          name: newName.trim(),
          type: activeTab,
          icon: newIcon,
          color: newColor,
        };
        onSelectCategory(created);
        setIsCreating(false);
        setNewName('');
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
        id="category-picker-modal"
        className="w-full max-w-md bg-[#252522] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <h2 className="text-lg font-semibold text-[#f5f5f0]">
            {isCreating ? 'Create Category' : 'Select a category'}
          </h2>
          <button
            id="close-category-picker"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0] hover:bg-[#33332d] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!isCreating ? (
          <>
            {/* Category Type Tabs */}
            <div className="flex px-4 pt-3 pb-2 gap-2 border-b border-[#363630]">
              <button
                id="cat-tab-expense"
                type="button"
                onClick={() => setActiveTab('expense')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'expense'
                    ? 'bg-[#e6c875] text-[#1c1c1a] font-semibold'
                    : 'text-[#a3a398] hover:bg-[#2d2d28]'
                }`}
              >
                Expense
              </button>
              <button
                id="cat-tab-income"
                type="button"
                onClick={() => setActiveTab('income')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'income'
                    ? 'bg-[#e6c875] text-[#1c1c1a] font-semibold'
                    : 'text-[#a3a398] hover:bg-[#2d2d28]'
                }`}
              >
                Income
              </button>
            </div>

            {/* Category Grid (3 Columns like screenshot) */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-y-5 gap-x-2">
                {filteredCategories.map((cat) => {
                  const IconComp = getCategoryIconComponent(cat.icon || cat.name);
                  const isSelected = selectedCategoryId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      id={`cat-picker-item-${cat.id}`}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat);
                        onClose();
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-xl group transition-transform active:scale-95 text-center"
                    >
                      <div
                        className={`relative w-14 h-14 rounded-full flex items-center justify-center mb-1.5 transition-all shadow-md ${
                          isSelected ? 'ring-2 ring-[#e6c875] ring-offset-2 ring-offset-[#252522]' : ''
                        }`}
                        style={{ backgroundColor: cat.color || '#ef4444' }}
                      >
                        <IconComp size={24} className="text-white drop-shadow-xs" />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-[#e6c875] text-[#1c1c1a] rounded-full p-0.5 shadow">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-[#f5f5f0] line-clamp-1 w-full px-1">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Button */}
            <div className="p-4 border-t border-[#363630]">
              <button
                id="btn-add-new-category"
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full py-3 px-4 border border-[#e6c875] text-[#e6c875] hover:bg-[#e6c875]/10 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors active-press"
              >
                <Plus size={16} />
                <span>+ ADD NEW CATEGORY</span>
              </button>
            </div>
          </>
        ) : (
          /* Create New Category Form */
          <form onSubmit={handleCreateCategory} className="p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Category Name</label>
              <input
                id="new-category-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Freelance, Groceries"
                className="w-full bg-[#1c1c1a] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl px-3.5 py-2.5 text-sm text-[#f5f5f0] outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Category Color</label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform active:scale-90 flex items-center justify-center ${
                      newColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#252522]' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {newColor === c && <Check size={14} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a3a398] mb-1.5">Category Icon</label>
              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                {Object.keys(CATEGORY_ICON_MAP).map((iconKey) => {
                  const IconC = CATEGORY_ICON_MAP[iconKey];
                  const isChosen = newIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setNewIcon(iconKey)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                        isChosen ? 'bg-[#e6c875] text-[#1c1c1a]' : 'bg-[#1c1c1a] text-[#a3a398] hover:text-white'
                      }`}
                    >
                      <IconC size={20} />
                    </button>
                  );
                })}
              </div>
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
                id="btn-save-new-category"
                type="submit"
                disabled={saving || !newName.trim()}
                className="flex-1 py-2.5 bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a] text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
