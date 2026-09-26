import React from 'react';
import { TallyContact } from '../../types';
import { getInitials, getAvatarColor, formatTakaPlain } from '../../utils/bengali';
import { ChevronRight, UserPlus, Phone } from 'lucide-react';

interface TallyContactListProps {
  contacts: TallyContact[];
  onSelectContact: (contact: TallyContact) => void;
  onOpenAddContact: () => void;
}

export const TallyContactList: React.FC<TallyContactListProps> = ({
  contacts,
  onSelectContact,
  onOpenAddContact,
}) => {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-white min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-red-50 text-[#be1e2d] flex items-center justify-center mb-3">
          <UserPlus size={30} />
        </div>
        <h3 className="font-bold text-gray-800 text-base">কোন কাস্টমার বা সাপ্লায়ার নেই</h3>
        <p className="text-gray-500 text-xs mt-1 max-w-xs">
          নিচের লাল বাটনে ক্লিক করে নতুন কাস্টমার অথবা সাপ্লায়ারের নাম ও মোবাইল নম্বর যোগ করুন।
        </p>
        <button
          type="button"
          onClick={onOpenAddContact}
          className="mt-4 px-4 py-2 bg-[#be1e2d] text-white text-xs font-semibold rounded-xl hover:bg-[#a51926] shadow-sm transition-all active:scale-95"
        >
          + কাস্টমার / সাপ্লায়ার যোগ করুন
        </button>
      </div>
    );
  }

  return (
    <div id="tally-contact-list" className="bg-white divide-y divide-gray-100 pb-24">
      {contacts.map((contact) => {
        const initials = getInitials(contact.name);
        const { bg, text } = getAvatarColor(contact.name);
        const isReceive = contact.currentBalance > 0;
        const isPayable = contact.currentBalance < 0;
        const isZero = contact.currentBalance === 0;

        return (
          <div
            key={contact.id}
            id={`tally-contact-row-${contact.id}`}
            onClick={() => onSelectContact(contact)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-[#fafafa] cursor-pointer transition-colors active:bg-gray-100"
          >
            {/* Left: Avatar + Name + Subtitle */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-11 h-11 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-sm shadow-sm shrink-0`}
              >
                {initials}
              </div>

              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {contact.name}
                  </h4>
                  {contact.type === 'supplier' && (
                    <span className="text-[10px] font-medium bg-teal-50 text-[#0f766e] px-1.5 py-0.2 rounded border border-teal-200">
                      সাপ্লায়ার
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="truncate">{contact.lastActiveAt || 'আজকে'}</span>
                  {contact.phone && (
                    <>
                      <span>•</span>
                      <span className="truncate text-gray-400 font-mono text-[11px]">
                        {contact.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Amount + Label + Chevron */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div
                  className={`text-sm sm:text-base font-bold font-mono tracking-tight ${
                    isReceive
                      ? 'text-[#16a34a]'
                      : isPayable
                      ? 'text-[#dc2626]'
                      : 'text-gray-500'
                  }`}
                >
                  ৳ {formatTakaPlain(contact.currentBalance)}
                </div>
                <div className="text-[10px] font-medium">
                  {isReceive && <span className="text-[#16a34a]">পাবো</span>}
                  {isPayable && <span className="text-[#dc2626]">দেবো</span>}
                  {isZero && <span className="text-gray-400">সমান</span>}
                </div>
              </div>

              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
