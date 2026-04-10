export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'barber' | 'superadmin' | 'professional';
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
  pendingDebt?: number; // New: No-show fee
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
  phone?: string;
  staffId?: string;
  staffName?: string;
  date: string; // ISO string
  status: 'scheduled' | 'cancelled' | 'cancelled_on_time' | 'cancelled_late' | 'no_show' | 'completed' | 'in_progress';
  price: number;
  ownerUid: string;
  isFitIn?: boolean;

  // Scheduling precision
  startTime?: string;          // ISO datetime — exact slot start
  endTime?: string;            // ISO datetime — exact slot end
  totalDurationMin?: number;   // Total duration in minutes

  // Recurrence & Combo
  recurrenceGroupId?: string;
  comboId?: string;

  // Cancellation & Workflow Metadata
  noShow?: boolean;
  cancellationReason?: string;
  cancellationDate?: string;
  checkInAt?: string;
  finishedAt?: string;
}

// --- Combos ---

export interface ComboItem {
  id: string;
  comboId: string;
  serviceId: string;
  order: number;
  service: Service;
}

export interface ServiceCombo {
  id: string;
  ownerUid: string;
  name: string;
  description?: string;
  price?: number;
  createdAt: string;
  items: ComboItem[];
  totalDurationMin: number; // Computed by backend
}

// --- Recurrence ---

export interface RecurrenceGroup {
  id: string;
  ownerUid: string;
  staffId?: string;
  frequency: 'weekly' | 'biweekly';
  dayOfWeek: number; // 0=Sun ... 6=Sat
  startDate: string;
  endDate: string;
  startTime: string; // "HH:MM"
  serviceId?: string;
  comboId?: string;
  status: 'active' | 'cancelled';
  createdAt: string;
}

export interface RecurrenceConflict {
  originalDate: string;       // "YYYY-MM-DD"
  reason: 'holiday' | 'closed_day' | 'overlap';
  holidayName?: string;
  overlappingAppointmentId?: string;
  suggestedDate?: string | null; // Filled by user in the modal
  suggestedStartTime?: string | null;
  skipped?: boolean;
}

export interface RecurrenceValidationResult {
  hasConflicts: boolean;
  summary: {
    totalDates: number;
    validDates: number;
    conflictDates: number;
  };
  validDatesList: string[];
  conflicts: RecurrenceConflict[];
}

export interface ResolvedDate {
  date: string;           // "YYYY-MM-DD"
  startTime: string;      // "HH:MM"
  skipped?: boolean;
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
  status?: 'Livre' | 'Ocupado' | 'Em Intervalo'; // New: Desk status
  notes?: string;
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
  allowProfessionalViewAllAgendas?: boolean;
  podologyAnamnesisActive?: boolean;
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

export interface WhatsAppChatMessage {
  id: string;
  fromMe: boolean;
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  chatId: string;
  contactName?: string;
}

export interface WhatsAppChat {
  chatId: string;
  contactName: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
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
