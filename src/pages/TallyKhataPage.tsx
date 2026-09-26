import React, { useState, useMemo } from 'react';
import { useTally } from '../contexts/TallyContext';
import { TallyHeader } from '../components/tally/TallyHeader';
import { TallyPromotionalBanner } from '../components/tally/TallyPromotionalBanner';
import { TallyQuickFeatures, TallyFeatureType } from '../components/tally/TallyQuickFeatures';
import { TallyBalanceCards } from '../components/tally/TallyBalanceCards';
import { TallySearchAndFilter } from '../components/tally/TallySearchAndFilter';
import { TallyContactList } from '../components/tally/TallyContactList';
import { TallyBottomNav, TallyNavTab } from '../components/tally/TallyBottomNav';
import { TallyAddContactModal } from '../components/tally/TallyAddContactModal';
import { TallyPersonLedger } from '../components/tally/TallyPersonLedger';
import { generateAllContactsPdf } from '../utils/tallyPdf';
import {
  TallyStoreModal,
  CashboxModal,
  StockModal,
  GroupTagadaModal,
  QrCodeModal,
  InboxModal,
  SupportModal,
} from '../components/tally/modals/TallyModals';

export const TallyKhataPage: React.FC = () => {
  const {
    contacts,
    transactions,
    totals,
    businessName,
    selectedContact,
    setSelectedContact,
    selectedContactTransactions,
    addNewContact,
    editContact,
    removeContact,
    addNewTransaction,
    editTransaction,
    removeTransaction,
  } = useTally();

  // Navigation and Filter States
  const [activeNavTab, setActiveNavTab] = useState<TallyNavTab>('tally');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'customer' | 'supplier'>('all');
  const [activeBalanceFilter, setActiveBalanceFilter] = useState<'all' | 'receive' | 'payable'>('all');

  // Modal Visibility States
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isCashboxOpen, setIsCashboxOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGroupTagadaOpen, setIsGroupTagadaOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Filter contacts by search, type, and balance
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Type tab filter
      if (activeTypeTab !== 'all' && c.type !== activeTypeTab) {
        return false;
      }

      // Balance filter
      if (activeBalanceFilter === 'receive' && c.currentBalance <= 0) {
        return false;
      }
      if (activeBalanceFilter === 'payable' && c.currentBalance >= 0) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone ? c.phone.toLowerCase().includes(q) : false;
        const matchesNote = c.note ? c.note.toLowerCase().includes(q) : false;
        return matchesName || matchesPhone || matchesNote;
      }

      return true;
    });
  }, [contacts, activeTypeTab, activeBalanceFilter, searchQuery]);

  const handleSelectFeature = (feat: TallyFeatureType) => {
    switch (feat) {
      case 'multi_business':
        setIsStoreModalOpen(true);
        break;
      case 'stock':
        setIsStockOpen(true);
        break;
      case 'notes':
        setIsStockOpen(true); // Can also show stock/notes
        break;
      case 'group_tagada':
        setIsGroupTagadaOpen(true);
        break;
      case 'qr_code':
        setIsQrModalOpen(true);
        break;
      case 'data_backup':
        setIsInboxOpen(true);
        break;
      case 'tally_message':
        setIsInboxOpen(true);
        break;
      case 'cashbox':
        setIsCashboxOpen(true);
        break;
    }
  };

  const handleDownloadAllPdf = () => {
    generateAllContactsPdf(contacts, businessName);
  };

  const handleBottomTabChange = (tab: TallyNavTab) => {
    setActiveNavTab(tab);
    if (tab === 'cashbox') {
      setIsCashboxOpen(true);
    } else if (tab === 'qr') {
      setIsQrModalOpen(true);
    } else if (tab === 'reports') {
      handleDownloadAllPdf();
    }
  };

  // If a contact is selected, show their full ledger details (Screenshot 2 & 3)!
  if (selectedContact) {
    return (
      <TallyPersonLedger
        contact={selectedContact}
        transactions={selectedContactTransactions}
        businessName={businessName}
        onBack={() => setSelectedContact(null)}
        onAddTransaction={(tx) => addNewTransaction(tx, selectedContact)}
        onEditTransaction={(id, updates) => editTransaction(id, updates, selectedContact)}
        onDeleteTransaction={(id) => removeTransaction(id, selectedContact)}
        onEditContact={(updates) => editContact(selectedContact.id, updates)}
        onDeleteContact={() => removeContact(selectedContact.id)}
      />
    );
  }

  return (
    <div id="tally-khata-container" className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* 1. Top Header matching Screenshot 4 */}
      <TallyHeader
        onOpenStoreModal={() => setIsStoreModalOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* 2. Promotional Banner matching Screenshot 4 */}
      <TallyPromotionalBanner />

      {/* Main Scrollable Dashboard Content */}
      <main className="flex-1 overflow-y-auto">
        {/* 3. 8 Quick Action Features matching Screenshot 4 */}
        <TallyQuickFeatures onSelectFeature={handleSelectFeature} />

        {/* 4. Large Highlight Metric Cards matching Screenshot 4 */}
        <TallyBalanceCards
          activeFilter={activeBalanceFilter}
          onFilterChange={setActiveBalanceFilter}
        />

        {/* 5. Search, Filter & PDF Download Bar matching Screenshot 4 */}
        <TallySearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTypeTab={activeTypeTab}
          onTypeTabChange={setActiveTypeTab}
          customerCount={totals.customerCount}
          supplierCount={totals.supplierCount}
          onDownloadReport={handleDownloadAllPdf}
          onOpenFilterDialog={() => {
            setActiveBalanceFilter((prev) =>
              prev === 'all' ? 'receive' : prev === 'receive' ? 'payable' : 'all'
            );
          }}
        />

        {/* 6. Contacts Ledger List matching Screenshot 4 */}
        <TallyContactList
          contacts={filteredContacts}
          onSelectContact={(c) => setSelectedContact(c)}
          onOpenAddContact={() => setIsAddContactOpen(true)}
        />
      </main>

      {/* 7. Bottom Navigation & Floating Action Button (FAB) matching Screenshot 4 */}
      <TallyBottomNav
        activeTab={activeNavTab}
        onTabChange={handleBottomTabChange}
        onOpenAddContact={() => setIsAddContactOpen(true)}
      />

      {/* Modals */}
      <TallyAddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        onSave={async (contactData) => {
          await addNewContact(contactData);
        }}
      />

      <TallyStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />

      <CashboxModal
        isOpen={isCashboxOpen}
        onClose={() => setIsCashboxOpen(false)}
      />

      <StockModal
        isOpen={isStockOpen}
        onClose={() => setIsStockOpen(false)}
      />

      <GroupTagadaModal
        isOpen={isGroupTagadaOpen}
        onClose={() => setIsGroupTagadaOpen(false)}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
};
