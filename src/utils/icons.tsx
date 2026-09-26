import React from 'react';
import {
  HeartPulse,
  Home,
  ShoppingCart,
  Bus,
  Baby,
  Utensils,
  Receipt,
  GraduationCap,
  Tv,
  Sparkles,
  Bike,
  Car,
  Flame,
  Users,
  Gift,
  Film,
  Plane,
  Coins,
  Wallet,
  Building2,
  CreditCard,
  Smartphone,
  Briefcase,
  TrendingUp,
  Percent,
  CircleDollarSign,
  Tag,
  CircleHelp,
  Milk,
  Award,
  CircleCheck,
  RotateCcw,
  LucideProps
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  // Expense
  Food: Utensils,
  Bills: Receipt,
  Health: HeartPulse,
  Shopping: ShoppingCart,
  Transportation: Bus,
  Home: Home,
  Baby: Baby,
  Education: GraduationCap,
  Electronics: Tv,
  Cosmetics: Sparkles,
  Bike: Bike,
  Car: Car,
  'Gas/Fuel': Flame,
  Gas: Flame,
  'Social/Donate': Users,
  'Gift Cost': Gift,
  Gift: Gift,
  Entertainment: Film,
  Travel: Plane,
  Cow: Milk,
  Others: Tag,

  // Income
  Salary: Wallet,
  Freelance: Briefcase,
  Business: Building2,
  Sale: Tag,
  Rental: Home,
  Awards: Award,
  Grants: CircleDollarSign,
  Refunds: RotateCcw,
  'Other Income': Coins,

  // Fallbacks
  Default: Tag,
};

export const ACCOUNT_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Cash: Coins,
  Bank: Building2,
  bKash: Smartphone,
  Nagad: Smartphone,
  'Credit Card': CreditCard,
  PayPal: CircleDollarSign,
  Other: Wallet,
};

export function getCategoryIconComponent(iconName: string): React.ComponentType<LucideProps> {
  return CATEGORY_ICON_MAP[iconName] || CATEGORY_ICON_MAP[iconName.trim()] || Tag;
}

export function getAccountIconComponent(iconName: string): React.ComponentType<LucideProps> {
  return ACCOUNT_ICON_MAP[iconName] || ACCOUNT_ICON_MAP[iconName.trim()] || Wallet;
}
