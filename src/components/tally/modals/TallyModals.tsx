import React, { useState } from 'react';
import {
  X,
  Store,
  Boxes,
  FileText,
  BellRing,
  QrCode,
  CloudUpload,
  MessageCircle,
  Coins,
  Check,
  Plus,
  Trash2,
  PhoneCall,
  Share2,
} from 'lucide-react';
import { useTally } from '../../../contexts/TallyContext';
import { toBengaliNumerals, formatTakaPlain, createWhatsAppReminderLink } from '../../../utils/bengali';

// 1. Store Modal (মাল্টি ব্যবসা)
export const TallyStoreModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { businessName, updateBusinessName } = useTally();
  const [nameInput, setNameInput] = useState(businessName);

  if (!isOpen) return null;

  const handleSave = () => {
    if (nameInput.trim()) {
      updateBusinessName(nameInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <Store size={20} className="text-[#be1e2d]" />
            <span>ব্যবসার নাম পরিবর্তন</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">দোকান / ব্যবসার নাম</label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="উদাঃ সিমান্ত ফ্যাশন"
            className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#be1e2d] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#be1e2d] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#a51926]"
          >
            সংরক্ষণ
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Cashbox Modal (ক্যাশবক্স)
export const CashboxModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [cashInHand, setCashInHand] = useState(15420);
  const [cashIn, setCashIn] = useState(25000);
  const [cashOut, setCashOut] = useState(9580);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-[#ca8a04] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <Coins size={20} />
            <span>দৈনিক ক্যাশবক্স হিসাব</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-[#fefce8] p-3 rounded-xl border border-[#fef08a] text-center">
            <span className="text-xs text-[#854d0e] font-semibold">হাতে নগদ ক্যাশ (Cash in Hand)</span>
            <div className="text-2xl font-black font-mono text-[#ca8a04] mt-1">
              ৳ {toBengaliNumerals(cashInHand.toLocaleString('en-IN'))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
              <span className="text-gray-500 font-medium">আজকে ক্যাশ জমা (+)</span>
              <div className="text-base font-bold font-mono text-green-700 mt-1">
                ৳ {toBengaliNumerals(cashIn.toLocaleString('en-IN'))}
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <span className="text-gray-500 font-medium">আজকে ক্যাশ খরচ (-)</span>
              <div className="text-base font-bold font-mono text-red-700 mt-1">
                ৳ {toBengaliNumerals(cashOut.toLocaleString('en-IN'))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            দোকানের প্রতিদিনের ক্যাশ ইন ও ক্যাশ আউট এখানে অটোমেটিক সমন্বয় হয়।
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Stock Modal (স্টক হিসাব)
export const StockModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [items, setItems] = useState([
    { id: '1', name: 'সুতি শার্ট (L)', qty: 45, price: 650 },
    { id: '2', name: 'জিন্স প্যান্ট (৩২)', qty: 28, price: 950 },
    { id: '3', name: 'কাতান শাড়ি', qty: 12, price: 3200 },
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newPrice, setNewPrice] = useState('');

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newQty) return;
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: newItemName.trim(),
        qty: parseInt(newQty, 10) || 0,
        price: parseFloat(newPrice) || 0,
      },
    ]);
    setNewItemName('');
    setNewQty('');
    setNewPrice('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="bg-[#d97706] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <Boxes size={20} />
            <span>স্টক ও ইনভেন্টরি হিসাব</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Add item form */}
          <form onSubmit={handleAddItem} className="bg-gray-50 p-2.5 rounded-xl border flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-700">+ নতুন পণ্য যুক্ত করুন</span>
            <div className="grid grid-cols-12 gap-1.5">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="পণ্যের নাম"
                className="col-span-6 px-2 py-1.5 bg-white border rounded-lg text-xs"
              />
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="পরিমাণ"
                className="col-span-3 px-2 py-1.5 bg-white border rounded-lg text-xs"
              />
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="মূল্য ৳"
                className="col-span-3 px-2 py-1.5 bg-white border rounded-lg text-xs"
              />
            </div>
            <button
              type="submit"
              className="py-1.5 bg-[#d97706] text-white rounded-lg text-xs font-bold hover:bg-[#b45309]"
            >
              স্টকে যুক্ত করুন
            </button>
          </form>

          {/* List */}
          <div className="divide-y divide-gray-100">
            {items.map((it) => (
              <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-gray-800">{it.name}</div>
                  <div className="text-gray-400 text-[11px]">মূল্য: ৳ {toBengaliNumerals(it.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded-md font-mono">
                    {toBengaliNumerals(it.qty)} টি
                  </span>
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((x) => x.id !== it.id))}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Group Tagada Modal (গ্রুপ তাগাদা)
export const GroupTagadaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { contacts, businessName } = useTally();
  const debtors = contacts.filter((c) => c.currentBalance > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="bg-[#e11d48] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <BellRing size={20} />
            <span>গ্রুপ তাগাদা মেসেজ</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-gray-600">
            যাদের কাছে বকেয়া পাওনা রয়েছে তাদেরকে এক ক্লিকেই হোয়াটসঅ্যাপ বা এসএমএস তাগাদা পাঠানো যাবে:
          </p>

          <div className="space-y-2">
            {debtors.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                কারো কাছে বকেয়া বাকি নেই!
              </div>
            ) : (
              debtors.map((d) => {
                const waUrl = createWhatsAppReminderLink(d.phone || '', d.name, d.currentBalance, businessName);
                return (
                  <div
                    key={d.id}
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{d.name}</span>
                      <div className="text-[11px] text-[#be1e2d] font-bold font-mono">
                        বাকি: ৳ {formatTakaPlain(d.currentBalance)}
                      </div>
                    </div>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg font-bold flex items-center gap-1 shadow-sm active:scale-95 text-[11px]"
                    >
                      <Share2 size={12} />
                      <span>মেসেজ পাঠান</span>
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. QR Code Modal (QR কোড)
export const QrCodeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { businessName } = useTally();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col text-center">
        <div className="bg-[#9333ea] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <QrCode size={20} />
            <span>বাংলা কিউআর / পেমেন্ট QR</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="font-bold text-gray-900 text-lg">{businessName}</div>
          <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#9333ea] inline-block mx-auto shadow-sm">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://ai.studio/build&color=9333ea"
              alt="Payment QR"
              className="w-44 h-44 mx-auto"
            />
          </div>
          <p className="text-xs text-gray-500">
            বিকাশ, নগদ, রকেট অথবা যেকোনো ব্যাংক অ্যাপ দিয়ে গ্রাহক সরাসরি আপনার দোকানে পেমেন্ট করতে পারবেন।
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-xl text-xs font-bold"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. Inbox Modal (ইনবক্স 99+)
export const InboxModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const messages = [
    { title: 'সফল ব্যাকআপ', desc: 'আজকের সকল টালি লেনদেন ক্লাউডে নিরাপদে ব্যাকআপ হয়েছে।', time: '১০ মিনিট আগে' },
    { title: 'তাগাদা নোটিফিকেশন', desc: 'শফিক সাহেবের বকেয়া তাগাদা সফলভাবে পৌঁছেছে।', time: '১ ঘণ্টা আগে' },
    { title: 'প্যাকেজ নোটিশ', desc: 'আপনার বিনামূল্যে স্ট্যান্ডার্ড ট্রায়ালের মেয়াদ সক্রিয় আছে।', time: 'গতকাল' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-[#be1e2d] text-white px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-base">ইনবক্স ও নোটিফিকেশন</span>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2 divide-y divide-gray-100">
          {messages.map((m, idx) => (
            <div key={idx} className="pt-2 first:pt-0">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span>{m.title}</span>
                <span className="text-[10px] text-gray-400 font-normal">{m.time}</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 7. Support Modal (সাহায্য ও সাপোর্ট)
export const SupportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col text-center p-5 space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-100 text-[#be1e2d] flex items-center justify-center mx-auto">
          <PhoneCall size={24} />
        </div>
        <h3 className="font-bold text-gray-900 text-base">টালি খাতা হেল্পলাইন</h3>
        <p className="text-xs text-gray-500">
          যেকোনো প্রয়োজনে আমাদের কাস্টমার কেয়ার নাম্বারে যোগাযোগ করুন (সকাল ৯টা - রাত ১০টা):
        </p>
        <div className="p-3 bg-gray-50 rounded-xl font-mono font-black text-gray-800 text-base border">
          ০৯৬১০-৯৯৯২২২
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-[#be1e2d] text-white rounded-xl text-xs font-bold"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
};
