import { Farmer, SeedDistribution, HarvestRecord, SmsLog, PricingRates } from './types';

export const KITUI_ADMIN_STRUCTURE: Record<string, string[]> = {
  'Kitui Central': ['Township', 'Miambani', 'Mulango', 'Kyangwithya East', 'Kyangwithya West'],
  'Kitui West': ['Mutonguni', 'Kauwi', 'Matinyani', 'Kwa Vonza'],
  'Kitui East': ['Zombe/Mwitika', 'Mutitu/Kaliku', 'Chuluni', 'Voo/Kyamatu', 'Endau/Malalani', 'Nzambani'],
  'Kitui South': ['Mutomo', 'Ikutha', 'Mutha', 'Kanziku', 'Athi'],
  'Mwingi Central': ['Kivou', 'Nguni', 'Nuu', 'Mwingi Central Township', 'Waita'],
  'Mwingi West': ['Kyome/Thaana', 'Nguutani', 'Migwani', 'Kiomo/Kyethoni'],
  'Mwingi North': ['Kyuso', 'Ngomeni', 'Mumoni', 'Tharaka', 'Tseikuru'],
  'Kitui Rural': ['Kisasi', 'Mbitini', 'Yatta/Kwa Vonza', 'Kanyangi']
};

export const INITIAL_PRICING: PricingRates = {
  cleanSeedPerKg: 130, // KSh 130 per Kg for Clean Castor Seeds
  husksSeedPerKg: 75,   // KSh 75 per Kg for Husks Castor Seeds
};

export const INITIAL_FARMERS: Farmer[] = [
  {
    id: "FARM-101",
    idNumber: "29482103",
    fullName: "Emmanuel Mwaria Kimanga",
    phone: "+254712345678",
    village: "Kaveta",
    ward: "Township",
    subCounty: "Kitui Central",
    county: "Kitui",
    registeredAt: "2026-03-12"
  },
  {
    id: "FARM-102",
    idNumber: "31548291",
    fullName: "Grace Syokau Mwendwa",
    phone: "+254722987654",
    village: "Kanyoonyoo",
    ward: "Mutonguni",
    subCounty: "Kitui West",
    county: "Kitui",
    registeredAt: "2026-03-24"
  },
  {
    id: "FARM-103",
    idNumber: "28405912",
    fullName: "John Musyoka Nzamba",
    phone: "+254705112233",
    village: "Mutomo Central",
    ward: "Mutomo",
    subCounty: "Kitui South",
    county: "Kitui",
    registeredAt: "2026-04-02"
  },
  {
    id: "FARM-104",
    idNumber: "34910283",
    fullName: "Agnes Kalumi Mutua",
    phone: "+254799334455",
    village: "Zombe West",
    ward: "Zombe/Mwitika",
    subCounty: "Kitui East",
    county: "Kitui",
    registeredAt: "2026-04-15"
  },
  {
    id: "FARM-105",
    idNumber: "22349051",
    fullName: "Peter Ndambuki Kisilu",
    phone: "+254711556677",
    village: "Nguutani Market",
    ward: "Nguutani",
    subCounty: "Mwingi West",
    county: "Kitui",
    registeredAt: "2026-05-01"
  }
];

export const INITIAL_DISTRIBUTIONS: SeedDistribution[] = [
  {
    id: "DIST-201",
    farmerId: "FARM-101",
    farmerName: "Emmanuel Mwaria Kimanga",
    sacksGiven: 3,
    kgsOffered: 75,
    dateOffered: "2026-03-15",
    isRegisteredOnPortal: true
  },
  {
    id: "DIST-202",
    farmerId: "FARM-102",
    farmerName: "Grace Syokau Mwendwa",
    sacksGiven: 5,
    kgsOffered: 125,
    dateOffered: "2026-03-26",
    isRegisteredOnPortal: true
  },
  {
    id: "DIST-203",
    farmerId: "FARM-103",
    farmerName: "John Musyoka Nzamba",
    sacksGiven: 2,
    kgsOffered: 50,
    dateOffered: "2026-04-05",
    isRegisteredOnPortal: true
  },
  {
    id: "DIST-204",
    farmerId: "FARM-104",
    farmerName: "Agnes Kalumi Mutua",
    sacksGiven: 4,
    kgsOffered: 100,
    dateOffered: "2026-04-18",
    isRegisteredOnPortal: true
  },
  {
    id: "DIST-205",
    farmerId: "FARM-101",
    farmerName: "Emmanuel Mwaria Kimanga",
    sacksGiven: 2,
    kgsOffered: 50,
    dateOffered: "2026-05-10",
    isRegisteredOnPortal: true
  }
];

export const INITIAL_HARVESTS: HarvestRecord[] = [
  {
    id: "HARV-301",
    farmerId: "FARM-101",
    farmerName: "Emmanuel Mwaria Kimanga",
    cleanSeedKgs: 180,
    husksSeedKgs: 60,
    totalKgs: 240,
    amountToPay: (180 * 130) + (60 * 75), // 180 * 130 + 60 * 75 = 23400 + 4500 = 27900
    paymentStatus: 'Paid',
    paymentDate: "2026-05-20",
    mpesaTransId: "MPW5E3K8L2",
    dateSold: "2026-05-18"
  },
  {
    id: "HARV-302",
    farmerId: "FARM-102",
    farmerName: "Grace Syokau Mwendwa",
    cleanSeedKgs: 350,
    husksSeedKgs: 110,
    totalKgs: 460,
    amountToPay: (350 * 130) + (110 * 75), // 45500 + 8250 = 53750
    paymentStatus: 'Paid',
    paymentDate: "2026-05-25",
    mpesaTransId: "MPW9F6T0M8",
    dateSold: "2026-05-24"
  },
  {
    id: "HARV-303",
    farmerId: "FARM-103",
    farmerName: "John Musyoka Nzamba",
    cleanSeedKgs: 95,
    husksSeedKgs: 40,
    totalKgs: 135,
    amountToPay: (95 * 130) + (40 * 75), // 12350 + 3000 = 15350
    paymentStatus: 'Pending',
    dateSold: "2026-06-10"
  },
  {
    id: "HARV-304",
    farmerId: "FARM-104",
    farmerName: "Agnes Kalumi Mutua",
    cleanSeedKgs: 210,
    husksSeedKgs: 85,
    totalKgs: 295,
    amountToPay: (210 * 130) + (85 * 75), // 27300 + 6375 = 33675
    paymentStatus: 'Paid',
    paymentDate: "2026-06-14",
    mpesaTransId: "MPW1Z4B5P0",
    dateSold: "2026-06-12"
  }
];

export const INITIAL_SMS_LOGS: SmsLog[] = [
  {
    id: "SMS-401",
    recipientPhone: "+254712345678",
    recipientName: "Emmanuel Mwaria Kimanga",
    message: "Hujambo Emmanuel, Trinity Verd Limited imepokea magunia 3 ya castor seed (180kg Clean, 60kg Husks). Malipo ya KSh 27,900 yatatumwa kwa Mpesa hivi punde.",
    sentAt: "2026-05-18 14:15",
    status: "Delivered"
  },
  {
    id: "SMS-402",
    recipientPhone: "+254712345678",
    recipientName: "Emmanuel Mwaria Kimanga",
    message: "Habari Emmanuel! Malipo yako ya KSh 27,900 yametumwa kupitia MPESA. Trans ID: MPW5E3K8L2. Ahsante kwa kushirikiana na Trinity Verd LLC.",
    sentAt: "2026-05-20 09:30",
    status: "Delivered"
  },
  {
    id: "SMS-403",
    recipientPhone: "+254722987654",
    recipientName: "Grace Syokau Mwendwa",
    message: "Habari Grace Syokau, mbegu zako mpya za castor zipo tayari kuchukuliwa katika ofisi yetu ya Mutonguni. Tafadhali beba kitambulisho chako.",
    sentAt: "2026-03-24 11:00",
    status: "Delivered"
  }
];
