import React from 'react';
import {
  Store,
  Boxes,
  FileText,
  BellRing,
  QrCode,
  CloudUpload,
  MessageCircle,
  Coins,
} from 'lucide-react';

export type TallyFeatureType =
  | 'multi_business'
  | 'stock'
  | 'notes'
  | 'group_tagada'
  | 'qr_code'
  | 'data_backup'
  | 'tally_message'
  | 'cashbox';

interface TallyQuickFeaturesProps {
  onSelectFeature: (feature: TallyFeatureType) => void;
}

export const TallyQuickFeatures: React.FC<TallyQuickFeaturesProps> = ({ onSelectFeature }) => {
  const features = [
    {
      id: 'multi_business' as TallyFeatureType,
      label: 'মাল্টি ব্যবসা',
      icon: Store,
      iconColor: 'text-[#0284c7]',
      bgColor: 'bg-[#e0f2fe]',
    },
    {
      id: 'stock' as TallyFeatureType,
      label: 'স্টক হিসাব',
      icon: Boxes,
      iconColor: 'text-[#d97706]',
      bgColor: 'bg-[#fef3c7]',
    },
    {
      id: 'notes' as TallyFeatureType,
      label: 'ব্যবসার নোট',
      icon: FileText,
      iconColor: 'text-[#16a34a]',
      bgColor: 'bg-[#dcfce7]',
    },
    {
      id: 'group_tagada' as TallyFeatureType,
      label: 'গ্রুপ তাগাদা',
      icon: BellRing,
      iconColor: 'text-[#e11d48]',
      bgColor: 'bg-[#ffe4e6]',
    },
    {
      id: 'qr_code' as TallyFeatureType,
      label: 'QR কোড',
      icon: QrCode,
      iconColor: 'text-[#9333ea]',
      bgColor: 'bg-[#f3e8ff]',
    },
    {
      id: 'data_backup' as TallyFeatureType,
      label: 'ডাটা ব্যাকআপ',
      icon: CloudUpload,
      iconColor: 'text-[#2563eb]',
      bgColor: 'bg-[#dbeafe]',
    },
    {
      id: 'tally_message' as TallyFeatureType,
      label: 'টালি-মেসেজ',
      icon: MessageCircle,
      iconColor: 'text-[#0d9488]',
      bgColor: 'bg-[#ccfbf1]',
    },
    {
      id: 'cashbox' as TallyFeatureType,
      label: 'ক্যাশবক্স',
      icon: Coins,
      iconColor: 'text-[#ca8a04]',
      bgColor: 'bg-[#fef08a]',
    },
  ];

  return (
    <section id="tally-quick-features" className="bg-white px-2 py-3 border-b border-gray-200">
      <div className="grid grid-cols-4 gap-y-3 gap-x-1">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <button
              key={feat.id}
              id={`tally-btn-feat-${feat.id}`}
              type="button"
              onClick={() => onSelectFeature(feat.id)}
              className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-gray-50 transition-all active:scale-95 group"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${feat.bgColor} ${feat.iconColor} shadow-sm group-hover:shadow transition-all`}
              >
                <Icon size={22} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-medium text-gray-700 mt-1.5 text-center leading-tight">
                {feat.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
