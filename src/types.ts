export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'barber' | 'superadmin';
  shopName?: string;
  createdAt: string;
  status?: 'active' | 'suspended' | 'trial';
  planId?: string;
  phone?: string;
  billingCycle?: 'monthly' | 'yearly';
  slug?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  ownerUid: string;
  createdAt: string;
  loyaltyPoints: number;
  loyaltyVisits: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  ownerUid: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  staffId?: string;
  staffName?: string;
  date: string; // ISO string
  status: 'scheduled' | 'completed' | 'cancelled';
  price: number;
  ownerUid: string;
  isFitIn?: boolean;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  ownerUid: string;
}

export interface Staff {
  id: string;
  name: string;
  phone?: string;
  ownerUid: string;
  active: boolean;
  commissionPercentage: number;
  portfolio?: string[];
}

export interface ShopSettings {
  uid: string;
  name?: string;
  logoUrl?: string;
  address?: string;
  addressNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cnpj?: string;
  slug?: string;
  description?: string;
  timezone?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  siteUrl?: string;
  website?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  businessHours?: BusinessHours[];
  whatsappConfig?: {
    enabled: boolean;
    reminders: boolean;
    confirmations: boolean;
  };
  holidays?: Holiday[];
  fidelityConfig?: FidelityConfig;
}

export interface FidelityConfig {
  enabled: boolean;
  pointsPerVisit: number;
  pointsPerCurrency: number;
  minPointsToRedeem: number;
  redeemValue: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  ownerUid?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  ownerUid: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  features: {
    staffLimit: number | null;
    inventory: boolean;
    reports: boolean;
    whatsapp: boolean;
  };
}

export interface Subscription {
  uid: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: string;
}

export interface BusinessHours {
  day: string; // 'Monday', 'Tuesday', etc.
  open: string; // '08:00'
  close: string; // '18:00'
  closed: boolean;
}
