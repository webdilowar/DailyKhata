import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FinancialProvider, useFinancial } from './contexts/FinancialContext';

// Components
import { TopBar } from './components/TopBar';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { DrawerMenu, DrawerAction } from './components/DrawerMenu';
import { TransactionModal } from './components/TransactionModal';
import { SearchModal } from './components/SearchModal';
import { FilterModal } from './components/FilterModal';

// Pages
import { RecordsPage } from './pages/RecordsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { AccountsPage } from './pages/AccountsPage';
import { CategoriesPage } from './pages/CategoriesPage';

// Modals
import { PreferencesModal } from './pages/PreferencesModal';
import { ExportModal } from './pages/ExportModal';
import { BackupRestoreModal } from './pages/BackupRestoreModal';
import { DeleteResetModal } from './pages/DeleteResetModal';
import { AuthModal } from './pages/AuthModal';
import { CloudSyncModal } from './pages/CloudSyncModal';
import { HelpModal } from './pages/HelpModal';
import { FeedbackModal } from './pages/FeedbackModal';

import { Transaction, TransactionType } from './types';
import { TallyProvider, useTally } from './contexts/TallyContext';
import { TallyKhataPage } from './pages/TallyKhataPage';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const { appMode } = useTally();
  const {
    transactions,
    accounts,
    categories,
    filterOptions,
    setFilterOptions,
    resetFilterOptions,
    addNewTransaction,
    editTransaction,
    removeTransaction,
    addNewAccount,
    addNewCategory,
    settings,
  } = useFinancial();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('records');

  // Modals State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('expense');
  const [activeDrawerModal, setActiveDrawerModal] = useState<DrawerAction | null>(null);

  // If in TallyKhata Mode, render TallyKhata Interface directly!
  if (appMode === 'tallykhata') {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-gray-900 flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen flex flex-col bg-white shadow-2xl relative border-x border-gray-200">
          <TallyKhataPage />
        </div>
      </div>
    );
  }

  const handleOpenAddTransaction = (type: TransactionType = 'expense') => {
    setTxToEdit(null);
    setDefaultTxType(type);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTxToEdit(tx);
    setDefaultTxType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleDrawerAction = (action: DrawerAction) => {
    setActiveDrawerModal(action);
  };

  return (
    <div className="min-h-screen bg-[#1c1c1a] text-[#f5f5f0] flex flex-col items-center">
      {/* Container restricted to mobile/tablet width for pristine ergonomics, responsive up to desktop */}
      <div className="w-full max-w-lg min-h-screen flex flex-col bg-[#20201e] shadow-2xl relative border-x border-[#2d2d28]">
        {/* Top Header */}
        <TopBar
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setActiveDrawerModal('auth')}
          title="MoneyFlow"
        />

        {/* Main Content Pages */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'records' && (
            <RecordsPage
              onOpenAddTransaction={() => handleOpenAddTransaction('expense')}
              onEditTransaction={handleEditTransaction}
              onOpenFilter={() => setIsFilterOpen(true)}
              onOpenAccountsTab={() => setActiveTab('accounts')}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisPage
              onOpenFilter={() => setIsFilterOpen(true)}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsPage onOpenFilter={() => setIsFilterOpen(true)} />
          )}

          {activeTab === 'accounts' && (
            <AccountsPage
              onOpenTransfer={() => handleOpenAddTransaction('transfer')}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesPage
              onOpenAccountsTab={() => setActiveTab('accounts')}
            />
          )}
        </main>

        {/* Bottom Navigation & Floating Add Button */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAddTransaction={() => handleOpenAddTransaction('expense')}
        />

        {/* Transaction Modal (Add / Edit) with Keypad */}
        <TransactionModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setTxToEdit(null);
          }}
          transactionToEdit={txToEdit}
          accounts={accounts}
          categories={categories}
          defaultAccountId={settings.defaultAccountId}
          defaultType={defaultTxType}
          onSave={addNewTransaction}
          onUpdate={editTransaction}
          onDelete={removeTransaction}
          onAddAccount={addNewAccount}
          onAddCategory={addNewCategory}
        />

        {/* Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          currencyCode={settings.currency}
          onSelectTransaction={handleEditTransaction}
        />

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          options={filterOptions}
          onApply={setFilterOptions}
          onReset={resetFilterOptions}
          accounts={accounts}
          categories={categories}
        />

        {/* Navigation Drawer Menu */}
        <DrawerMenu
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSelectAction={handleDrawerAction}
        />

        {/* Preferences Modal */}
        <PreferencesModal
          isOpen={activeDrawerModal === 'preferences'}
          onClose={() => setActiveDrawerModal(null)}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={activeDrawerModal === 'export'}
          onClose={() => setActiveDrawerModal(null)}
        />

        {/* Backup & Restore Modal */}
        <BackupRestoreModal
          isOpen={activeDrawerModal === 'backup'}
          onClose={() => setActiveDrawerModal(null)}
        />

        {/* Delete & Reset Modal */}
        <DeleteResetModal
          isOpen={activeDrawerModal === 'reset'}
          onClose={() => setActiveDrawerModal(null)}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={activeDrawerModal === 'auth'}
          onClose={() => setActiveDrawerModal(null)}
        />

        {/* Cloud Sync Modal */}
        <CloudSyncModal
          isOpen={activeDrawerModal === 'cloud_sync'}
          onClose={() => setActiveDrawerModal(null)}
        />

        {/* Help Modal */}
        <HelpModal
          isOpen={activeDrawerModal === 'help'}
          onClose={() => setActiveDrawerModal(null)}
        />

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={activeDrawerModal === 'feedback'}
          onClose={() => setActiveDrawerModal(null)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FinancialProvider>
          <TallyProvider>
            <MainAppContent />
          </TallyProvider>
        </FinancialProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
