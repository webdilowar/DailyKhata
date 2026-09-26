import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

export const TallyPromotionalBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      id="tally-promo-banner"
      className="bg-[#fff7ed] border-b border-[#fed7aa] px-3 py-1.5 flex items-center justify-between text-xs text-[#9a3412]"
    >
      <div className="flex items-center gap-1.5 font-medium truncate">
        <Sparkles size={14} className="text-[#ea580c] shrink-0" />
        <span className="truncate">অবশিষ্ট ফ্রি দিনগুলো প্যাকেজের সাথে যোগ হবে</span>
      </div>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        aria-label="Close banner"
        className="p-1 hover:bg-[#ffedd5] text-[#9a3412] rounded transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};
