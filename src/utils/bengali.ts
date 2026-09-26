/**
 * Bengali numeric and currency formatting utilities
 */

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumerals(num: number | string): string {
  if (num === null || num === undefined) return '০';
  const str = typeof num === 'number' ? num.toString() : num;
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)] || digit);
}

export function formatTaka(amount: number, useBengaliNumerals: boolean = true): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format with commas like 5,26,830 or 2,223
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  const displayStr = useBengaliNumerals ? toBengaliNumerals(formatted) : formatted;
  return `${isNegative ? '-' : ''}৳ ${displayStr}`;
}

export function formatTakaPlain(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);
  return toBengaliNumerals(formatted);
}

export function formatBengaliDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const months = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ];
    const day = toBengaliNumerals(d.getDate());
    const month = months[d.getMonth()];
    const year = toBengaliNumerals(d.getFullYear());

    let hours = d.getHours();
    const minutes = toBengaliNumerals(d.getMinutes().toString().padStart(2, '0'));
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hourStr = toBengaliNumerals(hours);

    return `${day} ${month}, ${year} ${hourStr}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

export function formatBengaliDateShort(isoString: string): string {
  try {
    const d = new Date(isoString);
    const months = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ];
    const day = toBengaliNumerals(d.getDate());
    const month = months[d.getMonth()];
    return `${day} ${month}`;
  } catch {
    return isoString;
  }
}

export function getInitials(name: string): string {
  if (!name) return 'TK';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: 'bg-[#22c55e]', text: 'text-white' }, // Green (like Shofiq SH in Screenshot 4)
    { bg: 'bg-[#eab308]', text: 'text-slate-900' }, // Amber/Yellow
    { bg: 'bg-[#ef4444]', text: 'text-white' }, // Red
    { bg: 'bg-[#3b82f6]', text: 'text-white' }, // Blue
    { bg: 'bg-[#8b5cf6]', text: 'text-white' }, // Purple
    { bg: 'bg-[#14b8a6]', text: 'text-white' }, // Teal
    { bg: 'bg-[#f97316]', text: 'text-white' }, // Orange
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function createWhatsAppReminderLink(
  phone: string,
  personName: string,
  balance: number,
  businessName: string
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
  const amountStr = formatTaka(Math.abs(balance));

  const text =
    balance > 0
      ? `সম্মানিত ${personName} ভাই/ম্যাডাম, ${businessName} থেকে আপনার কাছে বকেয়া পাওনা ${amountStr} পরিশোধের জন্য বিনীত অনুরোধ জানাচ্ছি। ধন্যবাদ!`
      : `সম্মানিত ${personName} ভাই/ম্যাডাম, ${businessName} থেকে আপনার জমার পরিমাণ ${amountStr}। ধন্যবাদ!`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export function createSmsLink(phone: string, personName: string, balance: number, businessName: string): string {
  const amountStr = formatTaka(Math.abs(balance));
  const text =
    balance > 0
      ? `সম্মানিত ${personName}, ${businessName} থেকে বকেয়া ${amountStr} পরিশোধের জন্য অনুরোধ করছি।`
      : `সম্মানিত ${personName}, ${businessName} এ আপনার জমা ${amountStr}।`;

  return `sms:${phone}?body=${encodeURIComponent(text)}`;
}
