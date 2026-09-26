import React, { useState, useMemo } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { MonthSelector } from '../components/MonthSelector';
import { formatCurrency } from '../utils/currency';
import { getCategoryIconComponent, getAccountIconComponent } from '../utils/icons';
import { AnalysisViewType, Transaction } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import {
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Calendar,
  Layers,
  BarChart2,
  PieChart as PieIcon,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface AnalysisPageProps {
  onOpenFilter: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

const VIEW_OPTIONS: { id: AnalysisViewType; label: string }[] = [
  { id: 'expense_overview', label: 'Expense overview' },
  { id: 'six_month_trend', label: '6-Month Spending Breakdown' },
  { id: 'income_overview', label: 'Income overview' },
  { id: 'expense_flow', label: 'Expense flow' },
  { id: 'income_flow', label: 'Income flow' },
  { id: 'account_analysis', label: 'Account analysis' },
];

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ onOpenFilter }) => {
  const {
    transactions,
    accounts,
    categories,
    settings,
    totalAccountBalance,
    selectedMonth,
    setSelectedMonth,
    monthlyStats,
  } = useFinancial();

  const [viewType, setViewType] = useState<AnalysisViewType>('expense_overview');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  // Toggle state for 6-Month Visual Breakdown: 'monthly' vs 'category'
  const [sixMonthViewMode, setSixMonthViewMode] = useState<'monthly' | 'category'>('monthly');

  // Filter transactions for the selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Total sums for active month
  const currentTotalExpense = monthlyStats.totalExpense;
  const currentTotalIncome = monthlyStats.totalIncome;

  // Breakdown by Category for Expense Overview (current month)
  const expenseCategoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of monthTransactions) {
      if (t.type === 'expense' && t.categoryId) {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      }
    }

    const items = Object.entries(map).map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const percentage = currentTotalExpense > 0 ? (amount / currentTotalExpense) * 100 : 0;
      return {
        id: catId,
        name: cat?.name || 'Unknown',
        icon: cat?.icon || 'Default',
        color: cat?.color || '#ef4444',
        amount,
        percentage,
      };
    });

    return items.sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, categories, currentTotalExpense]);

  // Breakdown by Category for Income Overview (current month)
  const incomeCategoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of monthTransactions) {
      if (t.type === 'income' && t.categoryId) {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      }
    }

    const items = Object.entries(map).map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const percentage = currentTotalIncome > 0 ? (amount / currentTotalIncome) * 100 : 0;
      return {
        id: catId,
        name: cat?.name || 'Unknown',
        icon: cat?.icon || 'Default',
        color: cat?.color || '#22c55e',
        amount,
        percentage,
      };
    });

    return items.sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, categories, currentTotalIncome]);

  // Account Breakdown for Account Analysis
  const accountBreakdown = useMemo(() => {
    return accounts.map((acc) => {
      const balance = acc.currentBalance ?? acc.initialBalance;
      const expense = monthTransactions
        .filter((t) => t.type === 'expense' && t.accountId === acc.id)
        .reduce((sum, t) => sum + t.amount, 0);
      const income = monthTransactions
        .filter((t) => t.type === 'income' && t.accountId === acc.id)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        color: acc.color,
        balance,
        expense,
        income,
      };
    });
  }, [accounts, monthTransactions]);

  // Daily flow data for Trend Charts
  const dailyFlowData = useMemo(() => {
    const year = parseInt(selectedMonth.split('-')[0], 10);
    const month = parseInt(selectedMonth.split('-')[1], 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const data: { day: string; amount: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const targetType = viewType === 'income_flow' ? 'income' : 'expense';
      const sum = monthTransactions
        .filter((t) => t.type === targetType && t.date.startsWith(dayStr))
        .reduce((acc, t) => acc + t.amount, 0);

      data.push({
        day: `${d}`,
        amount: sum,
      });
    }
    return data;
  }, [monthTransactions, selectedMonth, viewType]);

  // -------------------------------------------------------------
  // 6-Month Spending Patterns Analytics & Recharts Data
  // -------------------------------------------------------------
  const sixMonthsAnalytics = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const baseYear = parseInt(yearStr, 10) || new Date().getFullYear();
    const baseMonth = parseInt(monthStr, 10) || new Date().getMonth() + 1;

    const rawMonths: {
      key: string;
      shortLabel: string;
      fullLabel: string;
      expense: number;
      income: number;
      savings: number;
      txCount: number;
      categoryMap: Record<string, number>;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      let m = baseMonth - i;
      let y = baseYear;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      const monthKey = `${y}-${String(m).padStart(2, '0')}`;
      const dateObj = new Date(y, m - 1, 1);
      const shortMonth = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const fullMonth = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const shortLabel = `${shortMonth}`;

      const txs = transactions.filter((t) => t.date.startsWith(monthKey));
      const catMap: Record<string, number> = {};
      let exp = 0;
      let inc = 0;
      let txCount = 0;

      for (const t of txs) {
        if (t.type === 'expense') {
          exp += t.amount;
          txCount++;
          if (t.categoryId) {
            catMap[t.categoryId] = (catMap[t.categoryId] || 0) + t.amount;
          }
        } else if (t.type === 'income') {
          inc += t.amount;
        }
      }

      rawMonths.push({
        key: monthKey,
        shortLabel,
        fullLabel: fullMonth,
        expense: exp,
        income: inc,
        savings: inc - exp,
        txCount,
        categoryMap: catMap,
      });
    }

    const totalExpense = rawMonths.reduce((sum, m) => sum + m.expense, 0);
    const totalIncome = rawMonths.reduce((sum, m) => sum + m.income, 0);
    const avgExpense = Math.round(totalExpense / 6);

    // Compute month-over-month change and top category
    const monthData = rawMonths.map((m, idx) => {
      const prevExpense = idx > 0 ? rawMonths[idx - 1].expense : null;
      let momPercent: number | null = null;
      if (prevExpense !== null && prevExpense > 0) {
        momPercent = ((m.expense - prevExpense) / prevExpense) * 100;
      }

      let topCatId = '';
      let topCatAmount = 0;
      for (const [cId, amt] of Object.entries(m.categoryMap)) {
        if (amt > topCatAmount) {
          topCatAmount = amt;
          topCatId = cId;
        }
      }
      const topCat = categories.find((c) => c.id === topCatId);

      return {
        ...m,
        avgExpense,
        momPercent,
        topCategoryName: topCat?.name || (topCatAmount > 0 ? 'General' : 'None'),
        topCategoryColor: topCat?.color || '#ef4444',
        topCategoryAmount: topCatAmount,
      };
    });

    // Highest and lowest months
    let highestMonth = monthData[0];
    let lowestMonth = monthData[0];
    for (const m of monthData) {
      if (m.expense > highestMonth.expense) highestMonth = m;
      if (m.expense < lowestMonth.expense) lowestMonth = m;
    }

    // Category aggregation across all 6 months
    const catMapAll: Record<string, { total: number; monthlyAmounts: Record<string, number> }> = {};
    for (const m of monthData) {
      for (const [catId, amt] of Object.entries(m.categoryMap)) {
        if (!catMapAll[catId]) {
          catMapAll[catId] = { total: 0, monthlyAmounts: {} };
        }
        catMapAll[catId].total += amt;
        catMapAll[catId].monthlyAmounts[m.key] = amt;
      }
    }

    const categoryData = Object.entries(catMapAll)
      .map(([catId, data]) => {
        const cat = categories.find((c) => c.id === catId);
        const percentage = totalExpense > 0 ? (data.total / totalExpense) * 100 : 0;
        const monthlyAverage = Math.round(data.total / 6);

        let peakMonthKey = '';
        let peakAmt = 0;
        for (const [mKey, amt] of Object.entries(data.monthlyAmounts)) {
          if (amt > peakAmt) {
            peakAmt = amt;
            peakMonthKey = mKey;
          }
        }

        return {
          id: catId,
          name: cat?.name || 'Unknown',
          icon: cat?.icon || 'Default',
          color: cat?.color || '#e6c875',
          totalAmount: data.total,
          percentage,
          monthlyAverage,
          peakMonth: peakMonthKey,
          peakAmount: peakAmt,
          monthlyAmounts: data.monthlyAmounts,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      months: monthData,
      categories: categoryData,
      totalExpense,
      totalIncome,
      avgExpense,
      highestMonth,
      lowestMonth,
      topCategory: categoryData[0] || null,
    };
  }, [transactions, categories, selectedMonth]);

  const activeBreakdown =
    viewType === 'income_overview' ? incomeCategoryBreakdown : expenseCategoryBreakdown;
  const currentViewLabel =
    VIEW_OPTIONS.find((v) => v.id === viewType)?.label || 'Expense overview';

  return (
    <div id="analysis-page" className="pb-28">
      {/* Month Selector */}
      <MonthSelector
        currentMonthKey={selectedMonth}
        onMonthChange={setSelectedMonth}
        onOpenFilter={onOpenFilter}
      />

      {/* Top 3 Summary Stats */}
      <div className="grid grid-cols-3 bg-[#262623] border-b border-[#363630] py-3 px-2 text-center">
        <div>
          <span className="block text-[10px] font-bold text-[#e6c875] tracking-wider uppercase">
            Expense
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#ff6565] mt-0.5 block truncate">
            {formatCurrency(currentTotalExpense, settings.currency, { absolute: true })}
          </span>
        </div>

        <div className="border-x border-[#363630]">
          <span className="block text-[10px] font-bold text-[#e6c875] tracking-wider uppercase">
            Income
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#4ade80] mt-0.5 block truncate">
            {formatCurrency(currentTotalIncome, settings.currency, { absolute: true })}
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-[#e6c875] tracking-wider uppercase">
            Balance
          </span>
          <span
            className={`text-xs sm:text-sm font-bold mt-0.5 block truncate ${
              totalAccountBalance < 0 ? 'text-[#ff6565]' : 'text-[#4ade80]'
            }`}
          >
            {formatCurrency(totalAccountBalance, settings.currency)}
          </span>
        </div>
      </div>

      {/* Mode Dropdown Selector */}
      <div className="relative px-4 py-3 bg-[#20201e] border-b border-[#363630]">
        <button
          id="btn-analysis-mode-dropdown"
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#3e3e37] bg-[#2a2a26] hover:bg-[#33332d] text-xs sm:text-sm font-semibold text-[#f5f5f0] flex items-center justify-between gap-3 uppercase tracking-wide transition-colors"
        >
          <div className="flex items-center gap-2">
            {viewType === 'six_month_trend' && <BarChart2 size={16} className="text-[#e6c875]" />}
            <span>{currentViewLabel}</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-[#e6c875] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Options */}
        {isDropdownOpen && (
          <div
            id="analysis-mode-options"
            className="absolute top-14 left-4 right-4 sm:right-auto sm:w-72 bg-[#252522] border border-[#3e3e37] rounded-xl shadow-2xl py-1 z-40 animate-in fade-in duration-100"
          >
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                id={`analysis-opt-${opt.id}`}
                type="button"
                onClick={() => {
                  setViewType(opt.id);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between ${
                  viewType === opt.id
                    ? 'bg-[#e6c875]/15 text-[#e6c875] font-bold'
                    : 'text-[#f5f5f0] hover:bg-[#2d2d28]'
                }`}
              >
                <span>{opt.label}</span>
                {opt.id === 'six_month_trend' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#e6c875]/20 text-[#e6c875] font-semibold">
                    6M
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 bg-[#20201e] space-y-5">
        {/* ------------------------------------------------------------- */}
        {/* VIEW: 6-Month Spending Breakdown (Recharts with Toggle)        */}
        {/* ------------------------------------------------------------- */}
        {viewType === 'six_month_trend' && (
          <div id="six-month-spending-breakdown" className="space-y-4">
            {/* View Mode Toggle: Monthly View vs Category View */}
            <div className="flex items-center justify-between bg-[#262622] p-1.5 rounded-xl border border-[#363630]">
              <button
                id="btn-toggle-six-month-monthly"
                type="button"
                onClick={() => setSixMonthViewMode('monthly')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  sixMonthViewMode === 'monthly'
                    ? 'bg-[#e6c875] text-[#1c1c1a] shadow-xs'
                    : 'text-[#a3a398] hover:text-[#f5f5f0]'
                }`}
              >
                <BarChart2 size={15} />
                <span>Monthly View</span>
              </button>

              <button
                id="btn-toggle-six-month-category"
                type="button"
                onClick={() => setSixMonthViewMode('category')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  sixMonthViewMode === 'category'
                    ? 'bg-[#e6c875] text-[#1c1c1a] shadow-xs'
                    : 'text-[#a3a398] hover:text-[#f5f5f0]'
                }`}
              >
                <PieIcon size={15} />
                <span>Category View</span>
              </button>
            </div>

            {/* 4 Key Summary Stats for the 6-Month Period */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#262622] rounded-xl border border-[#363630]">
                <span className="text-[10px] text-[#a3a398] uppercase font-bold tracking-wider block">
                  6-Month Spent
                </span>
                <span className="text-sm sm:text-base font-bold text-[#ff6565] mt-1 block truncate">
                  {formatCurrency(sixMonthsAnalytics.totalExpense, settings.currency, { absolute: true })}
                </span>
              </div>

              <div className="p-3 bg-[#262622] rounded-xl border border-[#363630]">
                <span className="text-[10px] text-[#a3a398] uppercase font-bold tracking-wider block">
                  Monthly Avg
                </span>
                <span className="text-sm sm:text-base font-bold text-[#e6c875] mt-1 block truncate">
                  {formatCurrency(sixMonthsAnalytics.avgExpense, settings.currency, { absolute: true })}
                </span>
              </div>

              <div className="p-3 bg-[#262622] rounded-xl border border-[#363630]">
                <span className="text-[10px] text-[#a3a398] uppercase font-bold tracking-wider block">
                  Peak Month
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#f5f5f0] mt-1 block truncate">
                  {sixMonthsAnalytics.highestMonth.shortLabel} (
                  {formatCurrency(sixMonthsAnalytics.highestMonth.expense, settings.currency, { absolute: true })})
                </span>
              </div>

              <div className="p-3 bg-[#262622] rounded-xl border border-[#363630]">
                <span className="text-[10px] text-[#a3a398] uppercase font-bold tracking-wider block">
                  Top Category
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#e6c875] mt-1 block truncate">
                  {sixMonthsAnalytics.topCategory?.name || 'None'}
                </span>
              </div>
            </div>

            {/* SUB-VIEW 1: MONTHLY VIEW */}
            {sixMonthViewMode === 'monthly' && (
              <div className="space-y-4">
                {/* Recharts Bar Chart: 6-Month Monthly Spending */}
                <div className="p-4 bg-[#262622] rounded-xl border border-[#363630] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#f5f5f0] uppercase tracking-wider">
                        Monthly Spending Trend (Last 6 Months)
                      </h4>
                      <p className="text-[11px] text-[#a3a398]">
                        Average: {formatCurrency(sixMonthsAnalytics.avgExpense, settings.currency)}/month
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#a3a398]">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#ff6565]" />
                      <span>Monthly Spend</span>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sixMonthsAnalytics.months} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <XAxis dataKey="shortLabel" stroke="#888880" fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#888880"
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1c1c1a',
                            border: '1px solid #3e3e37',
                            borderRadius: '10px',
                            fontSize: '12px',
                            color: '#f5f5f0',
                          }}
                          formatter={(value: any) => [
                            formatCurrency(Number(value) || 0, settings.currency, { absolute: true }),
                            'Spent',
                          ]}
                          labelFormatter={(label: any, payload: any) => {
                            const item = payload?.[0]?.payload;
                            return item ? item.fullLabel : label;
                          }}
                        />
                        <Bar
                          dataKey="expense"
                          fill="#ff6565"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trajectory Area Chart */}
                <div className="p-4 bg-[#262622] rounded-xl border border-[#363630] space-y-3">
                  <h4 className="text-xs font-bold text-[#f5f5f0] uppercase tracking-wider">
                    Spending Trajectory Curve
                  </h4>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sixMonthsAnalytics.months} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="spendingCurveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e6c875" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#e6c875" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="shortLabel" stroke="#888880" fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#888880"
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1c1c1a',
                            border: '1px solid #3e3e37',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(val: any) => [formatCurrency(Number(val) || 0, settings.currency), 'Amount']}
                        />
                        <Area
                          type="monotone"
                          dataKey="expense"
                          stroke="#e6c875"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#spendingCurveGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Month-by-Month Detailed Cards */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-[#a3a398] uppercase tracking-wider">
                    Month-by-Month Comparison
                  </h4>
                  {sixMonthsAnalytics.months.map((m) => {
                    const isSelected = selectedMonth === m.key;
                    const maxExpense = sixMonthsAnalytics.highestMonth.expense || 1;
                    const relativePct = (m.expense / maxExpense) * 100;

                    return (
                      <div
                        key={m.key}
                        onClick={() => setSelectedMonth(m.key)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2d2d27] border-[#e6c875] ring-1 ring-[#e6c875]/40'
                            : 'bg-[#262622] hover:bg-[#2b2b26] border-[#363630]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#f5f5f0]">{m.fullLabel}</span>
                              {isSelected && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#e6c875]/20 text-[#e6c875]">
                                  Active Month
                                </span>
                              )}
                              {m.key === sixMonthsAnalytics.highestMonth.key && m.expense > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#ff6565]/20 text-[#ff6565]">
                                  Peak Month
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#a3a398] mt-0.5">
                              {m.txCount} transaction{m.txCount !== 1 ? 's' : ''} • Top: {m.topCategoryName}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs sm:text-sm font-bold text-[#ff6565] block">
                              -{formatCurrency(m.expense, settings.currency, { absolute: true })}
                            </span>
                            {m.momPercent !== null && (
                              <span
                                className={`text-[10px] font-semibold inline-flex items-center gap-0.5 ${
                                  m.momPercent > 0 ? 'text-[#ff6565]' : 'text-[#4ade80]'
                                }`}
                              >
                                {m.momPercent > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(m.momPercent).toFixed(1)}% vs prev
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Relative Progress Bar */}
                        <div className="w-full bg-[#1c1c1a] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(relativePct, 100)}%`,
                              backgroundColor: isSelected ? '#e6c875' : '#ff6565',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: CATEGORY VIEW (6 MONTHS AGGREGATED) */}
            {sixMonthViewMode === 'category' && (
              <div className="space-y-4">
                {/* Donut Chart with Category Breakdown */}
                {sixMonthsAnalytics.categories.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#a3a398]">
                    No category expenses recorded over the last 6 months.
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-[#262622] rounded-xl border border-[#363630]">
                      <h4 className="text-xs font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
                        6-Month Category Distribution
                      </h4>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                        <div className="w-52 h-52 relative flex items-center justify-center shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={sixMonthsAnalytics.categories}
                                dataKey="totalAmount"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={82}
                                paddingAngle={3}
                                stroke="#20201e"
                                strokeWidth={2}
                              >
                                {sixMonthsAnalytics.categories.map((entry) => (
                                  <Cell key={`six-cat-${entry.id}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute flex flex-col items-center pointer-events-none text-center">
                            <span className="text-[10px] text-[#a3a398]">6-Month Total</span>
                            <span className="text-xs font-bold text-[#e6c875]">
                              {formatCurrency(sixMonthsAnalytics.totalExpense, settings.currency)}
                            </span>
                          </div>
                        </div>

                        {/* Top Category Legend */}
                        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 w-full text-xs">
                          {sixMonthsAnalytics.categories.slice(0, 10).map((item) => (
                            <div key={item.id} className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-xs shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="truncate text-[#c5c5b8]">{item.name}</span>
                              <span className="text-[10px] text-[#888880] ml-auto">
                                {item.percentage.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Bar Chart for Top Spending Categories */}
                    <div className="p-4 bg-[#262622] rounded-xl border border-[#363630] space-y-3">
                      <h4 className="text-xs font-bold text-[#f5f5f0] uppercase tracking-wider">
                        Top Categories Ranked (6-Month Total)
                      </h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={sixMonthsAnalytics.categories.slice(0, 8)}
                            margin={{ top: 5, right: 10, left: 35, bottom: 5 }}
                          >
                            <XAxis
                              type="number"
                              stroke="#888880"
                              fontSize={10}
                              tickLine={false}
                              tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`)}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              stroke="#c5c5b8"
                              fontSize={11}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1c1c1a',
                                border: '1px solid #3e3e37',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              formatter={(val: any) => [
                                formatCurrency(Number(val) || 0, settings.currency),
                                'Total Spent',
                              ]}
                            />
                            <Bar dataKey="totalAmount" fill="#e6c875" radius={[0, 4, 4, 0]}>
                              {sixMonthsAnalytics.categories.slice(0, 8).map((cat) => (
                                <Cell key={`bar-${cat.id}`} fill={cat.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Detailed Category Cards */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-[#a3a398] uppercase tracking-wider">
                        Category Breakdown Across 6 Months
                      </h4>
                      {sixMonthsAnalytics.categories.map((item, idx) => {
                        const IconComp = getCategoryIconComponent(item.icon);
                        return (
                          <div
                            key={item.id}
                            className="p-3.5 bg-[#262622] rounded-xl border border-[#363630] space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: item.color }}
                                >
                                  <IconComp size={16} className="text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-[#f5f5f0]">{item.name}</p>
                                    {idx === 0 && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[#e6c875]/20 text-[#e6c875]">
                                        Top Expense
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#a3a398]">
                                    Avg: {formatCurrency(item.monthlyAverage, settings.currency)}/month
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-xs font-bold text-[#ff6565]">
                                  {formatCurrency(item.totalAmount, settings.currency, { absolute: true })}
                                </p>
                                <p className="text-[10px] font-semibold text-[#e6c875]">
                                  {item.percentage.toFixed(1)}% of 6M total
                                </p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-[#1c1c1a] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(item.percentage, 100)}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: Expense & Income Monthly Overview                       */}
        {/* ------------------------------------------------------------- */}
        {(viewType === 'expense_overview' || viewType === 'income_overview') && (
          <>
            {/* Quick banner linking to 6-Month Visual Breakdown */}
            <div
              id="banner-six-month-promo"
              onClick={() => setViewType('six_month_trend')}
              className="p-3 bg-gradient-to-r from-[#262622] to-[#2e2e28] rounded-xl border border-[#e6c875]/30 flex items-center justify-between cursor-pointer hover:border-[#e6c875] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#e6c875]/20 text-[#e6c875] flex items-center justify-center">
                  <BarChart2 size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#f5f5f0]">6-Month Spending Breakdown</h5>
                  <p className="text-[10px] text-[#a3a398]">
                    Explore monthly & category trends with interactive charts
                  </p>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-[#e6c875]" />
            </div>

            {activeBreakdown.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#a3a398]">
                No {viewType === 'expense_overview' ? 'expenses' : 'income'} recorded for {selectedMonth}
              </div>
            ) : (
              <div>
                {/* Donut Chart with Legend */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                  <div className="w-52 h-52 relative flex items-center justify-center shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeBreakdown}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={3}
                          stroke="#20201e"
                          strokeWidth={2}
                        >
                          {activeBreakdown.map((entry) => (
                            <Cell key={`cell-${entry.id}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center pointer-events-none">
                      <span className="text-[11px] text-[#a3a398]">
                        {viewType === 'expense_overview' ? 'Expenses' : 'Income'}
                      </span>
                      <span className="text-xs font-bold text-[#e6c875]">
                        {formatCurrency(
                          viewType === 'expense_overview' ? currentTotalExpense : currentTotalIncome,
                          settings.currency
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Legend Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 w-full text-xs">
                    {activeBreakdown.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-[#c5c5b8]">{item.name}</span>
                        <span className="text-[10px] text-[#888880] ml-auto">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Breakdown Progress Bar List */}
                <div className="mt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-[#a3a398] uppercase tracking-wider mb-2">
                    Category Breakdown
                  </h4>
                  {activeBreakdown.map((item) => {
                    const IconComp = getCategoryIconComponent(item.icon);
                    const isExpanded = selectedCategoryDetail === item.id;
                    const catTransactions = monthTransactions.filter((t) => t.categoryId === item.id);

                    return (
                      <div
                        key={item.id}
                        id={`breakdown-item-${item.id}`}
                        onClick={() =>
                          setSelectedCategoryDetail(isExpanded ? null : item.id)
                        }
                        className="p-3 bg-[#262622] hover:bg-[#2b2b26] rounded-xl border border-[#363630] cursor-pointer transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: item.color }}
                            >
                              <IconComp size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#f5f5f0]">{item.name}</p>
                              <p className="text-[10px] text-[#a3a398]">
                                {catTransactions.length} transaction{catTransactions.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-xs font-bold ${
                                viewType === 'expense_overview' ? 'text-[#ff6565]' : 'text-[#4ade80]'
                              }`}
                            >
                              {viewType === 'expense_overview' ? '-' : '+'}
                              {formatCurrency(item.amount, settings.currency, { absolute: true })}
                            </p>
                            <p className="text-[10px] font-semibold text-[#e6c875]">
                              {item.percentage.toFixed(2)}%
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#1c1c1a] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(item.percentage, 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>

                        {/* Drilldown transactions list if expanded */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-[#363630] space-y-1.5 animate-in fade-in">
                            {catTransactions.map((tx) => (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between text-[11px] py-1 text-[#c5c5b8]"
                              >
                                <span className="truncate max-w-[150px]">
                                  {tx.note || tx.date.split('T')[0]}
                                </span>
                                <span className="font-semibold text-[#f5f5f0]">
                                  {formatCurrency(tx.amount, settings.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: Daily Flow                                              */}
        {/* ------------------------------------------------------------- */}
        {(viewType === 'expense_flow' || viewType === 'income_flow') && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-[#a3a398] uppercase tracking-wider">
              Daily {viewType === 'expense_flow' ? 'Expense' : 'Income'} Flow (Day 1 - {dailyFlowData.length})
            </h4>
            <div className="h-64 w-full bg-[#262622] rounded-xl p-3 border border-[#363630]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyFlowData}>
                  <XAxis dataKey="day" stroke="#888880" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888880" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1c1a',
                      border: '1px solid #3e3e37',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill={viewType === 'expense_flow' ? '#ff6565' : '#4ade80'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#262622] rounded-xl border border-[#363630]">
                <span className="text-[10px] text-[#a3a398] uppercase block">Average Daily Spending</span>
                <span className="text-sm font-bold text-[#e6c875] mt-1 block">
                  {formatCurrency(monthlyStats.averageDailySpending, settings.currency)}
                </span>
              </div>
              <div className="p-3 bg-[#262622] rounded-xl border border-[#363630]">
                <span className="text-[10px] text-[#a3a398] uppercase block">Largest Category</span>
                <span className="text-sm font-bold text-[#ff6565] mt-1 block truncate">
                  {monthlyStats.largestExpenseCategory || 'None'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: Account Analysis                                        */}
        {/* ------------------------------------------------------------- */}
        {viewType === 'account_analysis' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#a3a398] uppercase tracking-wider">
              Account Activity & Balances
            </h4>
            {accountBreakdown.map((acc) => {
              const IconC = getAccountIconComponent(acc.type);
              return (
                <div
                  key={acc.id}
                  className="p-3.5 bg-[#262622] rounded-xl border border-[#363630] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: acc.color }}
                      >
                        <IconC size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#f5f5f0]">{acc.name}</p>
                        <p className="text-[10px] text-[#a3a398]">{acc.type}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-[#a3a398]">Net Balance</p>
                      <p
                        className={`text-xs font-bold ${
                          acc.balance < 0 ? 'text-[#ff6565]' : 'text-[#4ade80]'
                        }`}
                      >
                        {formatCurrency(acc.balance, settings.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#363630]/60 text-[11px]">
                    <div className="flex items-center justify-between text-[#c5c5b8]">
                      <span>Spent this month:</span>
                      <span className="text-[#ff6565] font-semibold">
                        -{formatCurrency(acc.expense, settings.currency, { absolute: true })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#c5c5b8]">
                      <span>Inflow this month:</span>
                      <span className="text-[#4ade80] font-semibold">
                        +{formatCurrency(acc.income, settings.currency, { absolute: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
