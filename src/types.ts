export interface Farmer {
  id: string; // Citizen ID or custom Farmer Registration Number (e.g. TRN-001)
  idNumber: string; // Kenya ID Number
  phone: string;
  fullName: string;
  village: string;
  ward: string;
  subCounty: string;
  county: string; // Default: Kitui County
  registeredAt: string;
}

export interface SeedDistribution {
  id: string;
  farmerId: string;
  farmerName: string;
  sacksGiven: number;
  kgsOffered: number;
  dateOffered: string;
  isRegisteredOnPortal: boolean;
}

export interface HarvestRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  cleanSeedKgs: number;
  husksSeedKgs: number;
  totalKgs: number;
  amountToPay: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentDate?: string;
  mpesaTransId?: string;
  dateSold: string;
}

export interface SmsLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  sentAt: string;
  status: 'Delivered' | 'Failed';
}

export interface SmsLogCreate {
  recipientPhone: string;
  recipientName: string;
  message: string;
  status?: 'Delivered' | 'Failed';
}

export interface PricingRates {
  cleanSeedPerKg: number; // e.g., KSh 120
  husksSeedPerKg: number; // e.g., KSh 60
}
