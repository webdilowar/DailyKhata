import { Transaction, Account, Category } from '../types';
import { jsPDF } from 'jspdf';
import { formatCurrency } from '../utils/currency';
import { formatTransactionDate } from '../utils/date';

export function exportTransactionsToCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  currencyCode = 'BDT'
): void {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = ['Date', 'Type', 'Category', 'Account', 'Amount', 'Currency', 'Notes'];

  const rows = transactions.map((t) => {
    const accName = t.type === 'transfer'
      ? `${accountMap.get(t.fromAccountId || '') || 'Unknown'} -> ${accountMap.get(t.toAccountId || '') || 'Unknown'}`
      : (accountMap.get(t.accountId || '') || 'Unknown');
    const catName = categoryMap.get(t.categoryId || '') || (t.type === 'transfer' ? 'Transfer' : 'Uncategorized');
    const cleanNote = (t.note || '').replace(/"/g, '""');

    return [
      t.date,
      t.type.toUpperCase(),
      `"${catName}"`,
      `"${accName}"`,
      t.amount.toFixed(2),
      currencyCode,
      `"${cleanNote}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moneyflow_report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToPdf(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  currencyCode = 'BDT',
  dateRangeLabel = 'All Time'
): void {
  const doc = new jsPDF();
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });
  const balance = totalIncome - totalExpense;

  // Header Banner
  doc.setFillColor(34, 34, 32);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(230, 200, 117); // Warm Yellow/Cream
  doc.text('MoneyFlow', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(`Financial Report | ${dateRangeLabel}`, 14, 25);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 145, 25);

  // Summary Metrics Card
  doc.setFillColor(245, 245, 243);
  doc.roundedRect(14, 38, 182, 22, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('TOTAL INCOME', 22, 45);
  doc.text('TOTAL EXPENSE', 85, 45);
  doc.text('NET BALANCE', 148, 45);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94); // Green
  doc.text(formatCurrency(totalIncome, currencyCode), 22, 53);

  doc.setTextColor(239, 68, 68); // Red
  doc.text(formatCurrency(totalExpense, currencyCode), 85, 53);

  doc.setTextColor(balance >= 0 ? 34 : 239, balance >= 0 ? 197 : 68, balance >= 0 ? 94 : 68);
  doc.text(formatCurrency(balance, currencyCode), 148, 53);

  // Table Headers
  let y = 68;
  doc.setFillColor(42, 42, 38);
  doc.rect(14, y, 182, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 200, 117);
  doc.text('DATE', 18, y + 5.5);
  doc.text('TYPE', 45, y + 5.5);
  doc.text('CATEGORY', 70, y + 5.5);
  doc.text('ACCOUNT', 110, y + 5.5);
  doc.text('NOTES', 140, y + 5.5);
  doc.text('AMOUNT', 178, y + 5.5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];

    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
      // Header repeat
      doc.setFillColor(42, 42, 38);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(230, 200, 117);
      doc.text('DATE', 18, y + 5.5);
      doc.text('TYPE', 45, y + 5.5);
      doc.text('CATEGORY', 70, y + 5.5);
      doc.text('ACCOUNT', 110, y + 5.5);
      doc.text('NOTES', 140, y + 5.5);
      doc.text('AMOUNT', 178, y + 5.5);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // Zebra row background
    if (i % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(14, y - 4, 182, 7, 'F');
    }

    doc.setTextColor(60, 60, 60);
    doc.text(formatTransactionDate(t.date).slice(0, 12), 18, y);
    doc.text(t.type.toUpperCase(), 45, y);

    const catName = categoryMap.get(t.categoryId || '') || (t.type === 'transfer' ? 'Transfer' : 'Other');
    doc.text(catName.slice(0, 16), 70, y);

    const accName = t.type === 'transfer'
      ? `${accountMap.get(t.fromAccountId || '') || ''} -> ${accountMap.get(t.toAccountId || '') || ''}`
      : (accountMap.get(t.accountId || '') || 'Cash');
    doc.text(accName.slice(0, 15), 110, y);

    const note = (t.note || '-').slice(0, 20);
    doc.text(note, 140, y);

    if (t.type === 'expense') {
      doc.setTextColor(220, 38, 38);
      doc.text(`-${formatCurrency(t.amount, currencyCode)}`, 178, y);
    } else if (t.type === 'income') {
      doc.setTextColor(22, 163, 74);
      doc.text(`+${formatCurrency(t.amount, currencyCode)}`, 178, y);
    } else {
      doc.setTextColor(79, 70, 229);
      doc.text(formatCurrency(t.amount, currencyCode), 178, y);
    }

    y += 7;
  }

  doc.save(`moneyflow_statement_${new Date().toISOString().split('T')[0]}.pdf`);
}
