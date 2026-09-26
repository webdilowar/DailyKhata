import { TallyContact, TallyTransaction } from '../types';

export const INITIAL_TALLY_CONTACTS: TallyContact[] = [
  {
    id: 'contact-shofiq',
    name: 'Shofiq',
    phone: '+8801738512794',
    type: 'customer',
    openingBalance: 0,
    currentBalance: -525, // দেবো ৫২৫.০০
    address: 'চকবাজার, ঢাকা',
    note: 'রেগুলার কাস্টমার',
    lastActiveAt: '৪ দিন আগে',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-09-10T10:17:00.000Z',
  },
  {
    id: 'contact-fokrul',
    name: 'Fokrul Vai Ghor',
    phone: '+8801819234567',
    type: 'supplier',
    openingBalance: 0,
    currentBalance: -1698, // দেবো ১,৬৯৮.০০
    address: 'ইসলামপুর রোড, ঢাকা',
    note: 'কাপড় সাপ্লায়ার',
    lastActiveAt: '৪ দিন আগে',
    createdAt: '2026-08-20T11:00:00.000Z',
    updatedAt: '2026-09-10T15:20:00.000Z',
  },
  {
    id: 'contact-kamal',
    name: 'Kamal Store',
    phone: '+8801912345678',
    type: 'customer',
    openingBalance: 0,
    currentBalance: 312500, // পাবো ৩,১২,৫০০.০০
    address: 'নিউ মার্কেট, ঢাকা',
    note: 'পাইকারি কাস্টমার',
    lastActiveAt: '১ দিন আগে',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-09-13T12:45:00.000Z',
  },
  {
    id: 'contact-rafiq',
    name: 'Rafiq Cloth Merchant',
    phone: '+8801712998877',
    type: 'customer',
    openingBalance: 0,
    currentBalance: 214330, // পাবো ২,১৪,৩৩০.০০
    address: 'মিরপুর ১০, ঢাকা',
    note: 'বস্ত্র ব্যবসায়ী',
    lastActiveAt: 'আজকে',
    createdAt: '2026-08-10T14:30:00.000Z',
    updatedAt: '2026-09-14T08:10:00.000Z',
  },
];

export const INITIAL_TALLY_TRANSACTIONS: TallyTransaction[] = [
  // Transactions for Shofiq matching Screenshot 2
  {
    id: 'tx-shofiq-1',
    contactId: 'contact-shofiq',
    type: 'gave', // দিলাম ৫০,০০০
    amount: 50000,
    description: 'মাল ডেলিভারি ও বিক্রয় চালান #১০৪',
    date: '2026-08-27T23:21:00.000Z',
    createdAt: '2026-08-27T23:21:00.000Z',
    updatedAt: '2026-08-27T23:21:00.000Z',
  },
  {
    id: 'tx-shofiq-2',
    contactId: 'contact-shofiq',
    type: 'received', // পেলাম ২৫,০০০
    amount: 25000,
    description: 'ব্যাংক একাউন্টে নগদ জমা',
    date: '2026-08-28T00:23:00.000Z',
    createdAt: '2026-08-28T00:23:00.000Z',
    updatedAt: '2026-08-28T00:23:00.000Z',
  },
  {
    id: 'tx-shofiq-3',
    contactId: 'contact-shofiq',
    type: 'received', // পেলাম ২৫,৫২৫ -> ব্যালেন্স দেবো ৫২৫
    amount: 25525,
    description: 'বকেয়া পরিশোধ ও অতিরিক্ত অগ্রিম জমা',
    date: '2026-09-10T10:17:00.000Z',
    createdAt: '2026-09-10T10:17:00.000Z',
    updatedAt: '2026-09-10T10:17:00.000Z',
  },
  // Transactions for Fokrul Vai Ghor
  {
    id: 'tx-fokrul-1',
    contactId: 'contact-fokrul',
    type: 'received', // সাপ্লায়ার থেকে মাল পেলাম
    amount: 10000,
    description: 'সুতি থান কাপড় চালান #৪৫',
    date: '2026-08-25T14:00:00.000Z',
    createdAt: '2026-08-25T14:00:00.000Z',
    updatedAt: '2026-08-25T14:00:00.000Z',
  },
  {
    id: 'tx-fokrul-2',
    contactId: 'contact-fokrul',
    type: 'gave', // সাপ্লায়ারকে টাকা পরিশোধ করলাম
    amount: 8302,
    description: 'বকেয়া বিল পরিশোধ',
    date: '2026-09-10T15:20:00.000Z',
    createdAt: '2026-09-10T15:20:00.000Z',
    updatedAt: '2026-09-10T15:20:00.000Z',
  },
  // Transactions for Kamal Store
  {
    id: 'tx-kamal-1',
    contactId: 'contact-kamal',
    type: 'gave', // বাকিতে মাল দিলাম
    amount: 350000,
    description: 'রেডিমেড গার্মেন্টস লট ডেলিভারি',
    date: '2026-09-01T11:00:00.000Z',
    createdAt: '2026-09-01T11:00:00.000Z',
    updatedAt: '2026-09-01T11:00:00.000Z',
  },
  {
    id: 'tx-kamal-2',
    contactId: 'contact-kamal',
    type: 'received', // কিছু কিস্তি পেলাম
    amount: 37500,
    description: 'বিকাশ মারফত কিস্তি গ্রহণ',
    date: '2026-09-13T12:45:00.000Z',
    createdAt: '2026-09-13T12:45:00.000Z',
    updatedAt: '2026-09-13T12:45:00.000Z',
  },
  // Transactions for Rafiq Cloth Merchant
  {
    id: 'tx-rafiq-1',
    contactId: 'contact-rafiq',
    type: 'gave',
    amount: 214330,
    description: 'থ্রি-পিস ও শাড়ি হোলসেল চালান',
    date: '2026-09-14T08:10:00.000Z',
    createdAt: '2026-09-14T08:10:00.000Z',
    updatedAt: '2026-09-14T08:10:00.000Z',
  },
];
