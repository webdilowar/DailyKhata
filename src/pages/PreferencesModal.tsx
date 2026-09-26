import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { useTheme } from '../contexts/ThemeContext';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { X, Check } from 'lucide-react';
import { Account } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateUserSettings, accounts } = useFinancial();
  const { theme, setTheme } = useTheme();

  const [currency, setCurrency] = useState(settings.currency);
  const [defaultAccountId, setDefaultAccountId] = useState(settings.defaultAccountId || '');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(settings.firstDayOfWeek || 'sunday');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserSettings({
        currency,
        defaultAccountId: defaultAccountId || undefined,
        firstDayOfWeek: firstDayOfWeek as 'sunday' | 'monday',
        theme,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        id="preferences-modal"
        className="w-full max-w-md bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <h2 className="text-base font-semibold text-[#f5f5f0]">Preferences</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          {/* Currency */}
          <div>
            <label className="block font-semibold text-[#a3a398] uppercase text-[11px] mb-1.5">
              Primary Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-[#1c1c1a] border border-[#3e3e37] rounded-xl px-3.5 py-2.5 text-[#f5f5f0] outline-hidden"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol} {c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block font-semibold text-[#a3a398] uppercase text-[11px] mb-1.5">
              Visual Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`py-2 px-3 rounded-xl border capitalize text-xs font-semibold transition-colors ${
                    theme === t
                      ? 'border-[#e6c875] bg-[#e6c875]/15 text-[#e6c875]'
                      : 'border-[#383832] bg-[#1c1c1a] text-[#a3a398]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Default Account */}
          <div>
            <label className="block font-semibold text-[#a3a398] uppercase text-[11px] mb-1.5">
              Default Account For Transactions
            </label>
            <select
              value={defaultAccountId}
              onChange={(e) => setDefaultAccountId(e.target.value)}
              className="w-full bg-[#1c1c1a] border border-[#3e3e37] rounded-xl px-3.5 py-2.5 text-[#f5f5f0] outline-hidden"
            >
              <option value="">None (Auto-select first account)</option>
              {accounts.map((a: Account) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {/* First Day of the Week */}
          <div>
            <label className="block font-semibold text-[#a3a398] uppercase text-[11px] mb-1.5">
              First Day of the Week
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['sunday', 'monday'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFirstDayOfWeek(d)}
                  className={`py-2 px-3 rounded-xl border capitalize text-xs font-semibold transition-colors ${
                    firstDayOfWeek === d
                      ? 'border-[#e6c875] bg-[#e6c875]/15 text-[#e6c875]'
                      : 'border-[#383832] bg-[#1c1c1a] text-[#a3a398]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#363630] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#33332d] text-[#f5f5f0] text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#e6c875] text-[#1c1c1a] text-xs font-bold rounded-xl"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
