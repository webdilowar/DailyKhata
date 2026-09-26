import jsPDF from 'jspdf';
import { TallyContact, TallyTransaction } from '../types';

export function generateCustomerPdf(
  contact: TallyContact,
  transactions: TallyTransaction[],
  businessName: string
): void {
  const doc = new jsPDF();
  const contactTxs = transactions.filter((t) => t.contactId === contact.id);

  // Colors
  const primaryColor = [200, 30, 30]; // Red accent
  const darkColor = [30, 30, 30];

  // Header
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(businessName || 'TallyKhata Business', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Customer / Supplier Ledger Statement', 14, 26);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 32);

  // Line divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 36, 196, 36);

  // Contact info
  doc.setFontSize(13);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Name: ${contact.name}`, 14, 44);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Phone: ${contact.phone || 'N/A'}`, 14, 50);
  doc.text(`Type: ${contact.type === 'customer' ? 'Customer (Buyer)' : 'Supplier'}`, 14, 56);
  if (contact.address) {
    doc.text(`Address: ${contact.address}`, 14, 62);
  }

  // Balance box
  const balanceY = 44;
  const isReceive = contact.currentBalance > 0;
  const balanceLabel = isReceive ? 'Total Due (To Receive)' : 'Advance / Payable (To Give)';
  const balanceAmount = Math.abs(contact.currentBalance).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
  });

  doc.setFillColor(isReceive ? 240 : 255, isReceive ? 253 : 240, isReceive ? 244 : 240);
  doc.roundedRect(120, balanceY - 4, 76, 22, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(isReceive ? 22 : 180, isReceive ? 101 : 30, isReceive ? 52 : 30);
  doc.text(balanceLabel, 124, balanceY + 3);

  doc.setFontSize(14);
  doc.text(`BDT ${balanceAmount}`, 124, balanceY + 12);

  // Table header
  let startY = 74;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, startY, 182, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('Date', 16, startY + 5.5);
  doc.text('Description', 48, startY + 5.5);
  doc.text('Gave (Debit)', 120, startY + 5.5);
  doc.text('Received (Credit)', 158, startY + 5.5);

  startY += 12;
  let totalGave = 0;
  let totalReceived = 0;

  if (contactTxs.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('No transaction records found.', 16, startY + 5);
    startY += 10;
  } else {
    contactTxs.forEach((tx) => {
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }

      const dateStr = new Date(tx.date).toLocaleDateString('en-GB');
      const desc = (tx.description || '-').slice(0, 35);
      const gaveStr = tx.type === 'gave' ? tx.amount.toLocaleString('en-IN') : '-';
      const receivedStr = tx.type === 'received' ? tx.amount.toLocaleString('en-IN') : '-';

      if (tx.type === 'gave') totalGave += tx.amount;
      if (tx.type === 'received') totalReceived += tx.amount;

      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(dateStr, 16, startY);
      doc.text(desc, 48, startY);
      doc.text(gaveStr, 120, startY);
      doc.text(receivedStr, 158, startY);

      doc.setDrawColor(240, 240, 240);
      doc.line(14, startY + 2, 196, startY + 2);
      startY += 7;
    });
  }

  // Summary footer
  startY += 4;
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Total Gave: BDT ${totalGave.toLocaleString('en-IN')}`, 90, startY);
  doc.text(`Total Received: BDT ${totalReceived.toLocaleString('en-IN')}`, 145, startY);

  // Save
  const safeName = contact.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeName}_Tally_Statement.pdf`);
}

export function generateAllContactsPdf(
  contacts: TallyContact[],
  businessName: string
): void {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(200, 30, 30);
  doc.text(businessName || 'TallyKhata Business', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('All Contacts Ledger Summary (বাকি খাতা সামারি)', 14, 26);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 32);

  // Line divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 36, 196, 36);

  // Table header
  let startY = 44;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, startY, 182, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('Name', 16, startY + 5.5);
  doc.text('Phone', 70, startY + 5.5);
  doc.text('Type', 115, startY + 5.5);
  doc.text('Balance (BDT)', 150, startY + 5.5);

  startY += 12;
  let totalReceive = 0;
  let totalPayable = 0;

  contacts.forEach((c) => {
    if (startY > 270) {
      doc.addPage();
      startY = 20;
    }

    const typeStr = c.type === 'customer' ? 'Customer' : 'Supplier';
    const isReceive = c.currentBalance > 0;
    const balanceStr = `${isReceive ? 'To Receive: ' : c.currentBalance < 0 ? 'To Give: ' : ''}${Math.abs(c.currentBalance).toLocaleString('en-IN')}`;

    if (c.currentBalance > 0) totalReceive += c.currentBalance;
    if (c.currentBalance < 0) totalPayable += Math.abs(c.currentBalance);

    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(c.name.slice(0, 25), 16, startY);
    doc.text(c.phone || '-', 70, startY);
    doc.text(typeStr, 115, startY);

    if (c.currentBalance > 0) {
      doc.setTextColor(22, 101, 52); // green
    } else if (c.currentBalance < 0) {
      doc.setTextColor(180, 30, 30); // red
    } else {
      doc.setTextColor(100, 100, 100);
    }
    doc.text(balanceStr, 150, startY);

    doc.setDrawColor(240, 240, 240);
    doc.line(14, startY + 2, 196, startY + 2);
    startY += 7;
  });

  // Footer summary
  startY += 6;
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.text(`Total To Receive: BDT ${totalReceive.toLocaleString('en-IN')}`, 14, startY);
  startY += 6;
  doc.setTextColor(180, 30, 30);
  doc.text(`Total To Give: BDT ${totalPayable.toLocaleString('en-IN')}`, 14, startY);

  doc.save('TallyKhata_All_Contacts_Summary.pdf');
}
