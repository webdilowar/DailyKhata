import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { exportTransactionsToCsv, exportTransactionsToPdf } from '../services/export';
import { X, FileSpreadsheet, FileText, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, accounts, categories, settings } = useFinancial();
  const [rangeType, setRangeType] = useState<'all' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const getFilteredTransactions = () => {
    if (rangeType === 'all') return transactions;
    if (rangeType === 'month') {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return transactions.filter((t) => t.date.startsWith(currentMonthKey));
    }
    return transactions.filter((t) => {
      const d = t.date.split('T')[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  };

  const handleExportCsv = () => {
    const list = getFilteredTransactions();
    if (list.length === 0) {
      alert('No transactions found in selected range');
      return;
    }
    exportTransactionsToCsv(list, accounts, categories, settings.currency);
    onClose();
  };

  const handleExportPdf = () => {
    const list = getFilteredTransactions();
    if (list.length === 0) {
      alert('No transactions found in selected range');
      return;
    }
    setExporting(true);
    try {
      const title =
        rangeType === 'month'
          ? 'Monthly Financial Statement'
          : rangeType === 'custom'
          ? `Statement (${startDate || 'Start'} to ${endDate || 'Now'})`
          : 'Complete Financial Statement';

      exportTransactionsToPdf(list, accounts, categories, settings.currency, title);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error generating PDF statement');
    } finally {
      setExporting(false);
    }
  };

  const targetCount = getFilteredTransactions().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        id="export-modal"
        className="w-full max-w-md bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <h2 className="text-base font-semibold text-[#f5f5f0]">Export Reports</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0]">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-[#a3a398] uppercase text-[11px] mb-1.5">
              Export Range
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'month', label: 'Current Month' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom Range' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRangeType(r.id as any)}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-colors ${
                    rangeType === r.id
                      ? 'border-[#e6c875] bg-[#e6c875]/15 text-[#e6c875]'
                      : 'border-[#383832] bg-[#1c1c1a] text-[#a3a398]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {rangeType === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-[#777770] block mb-1">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#1c1c1a] border border-[#3e3e37] rounded-xl px-3 py-2 text-xs text-[#f5f5f0] outline-hidden"
                />
              </div>
              <div>
                <span className="text-[11px] text-[#777770] block mb-1">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#1c1c1a] border border-[#3e3e37] rounded-xl px-3 py-2 text-xs text-[#f5f5f0] outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="bg-[#1c1c1a] p-3 rounded-xl border border-[#383832] text-xs text-[#a3a398]">
            <p>
              Selected records to export: <span className="font-bold text-[#e6c875]">{targetCount}</span> transactions
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCsv}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#3e3e37] bg-[#2a2a26] hover:bg-[#33332d] text-[#f5f5f0] font-semibold text-xs transition-colors"
            >
              <FileSpreadsheet size={18} className="text-[#4ade80]" />
              <span>Export as CSV Spreadsheet (.csv)</span>
            </button>

            <button
              id="btn-export-pdf"
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#3e3e37] bg-[#2a2a26] hover:bg-[#33332d] text-[#f5f5f0] font-semibold text-xs transition-colors"
            >
              <FileText size={18} className="text-[#e6c875]" />
              <span>{exporting ? 'Generating Statement...' : 'Export as PDF Statement (.pdf)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
