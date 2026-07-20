import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Farmer, SeedDistribution, HarvestRecord, SmsLog, PricingRates } from './types';
import { 
  INITIAL_FARMERS, 
  INITIAL_DISTRIBUTIONS, 
  INITIAL_HARVESTS, 
  INITIAL_SMS_LOGS, 
  INITIAL_PRICING 
} from './sampleData';

// ----------------------------------------------------------------------------
// Local Storage Fallback Helpers (for zero-config AI Studio Preview)
// ----------------------------------------------------------------------------

function getLocal<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

let localListeners: Array<() => void> = [];

function notifyListeners() {
  localListeners.forEach(l => {
    try {
      l();
    } catch (e) {
      console.error(e);
    }
  });
}

// ----------------------------------------------------------------------------
// 1. Data Mapping Helpers (CamelCase JSON <-> SnakeCase SQL)
// ----------------------------------------------------------------------------

export function mapFarmerToDb(f: Farmer) {
  return {
    id: f.id,
    id_number: f.idNumber,
    full_name: f.fullName,
    phone: f.phone,
    village: f.village,
    ward: f.ward,
    sub_county: f.subCounty,
    county: f.county,
    registered_at: f.registeredAt
  };
}

export function mapFarmerFromDb(row: any): Farmer {
  return {
    id: row.id,
    idNumber: row.id_number,
    fullName: row.full_name,
    phone: row.phone,
    village: row.village,
    ward: row.ward,
    subCounty: row.sub_county,
    county: row.county,
    registeredAt: row.registered_at
  };
}

export function mapDistributionToDb(d: SeedDistribution) {
  return {
    id: d.id,
    farmer_id: d.farmerId,
    farmer_name: d.farmerName,
    sacks_given: d.sacksGiven,
    kgs_offered: d.kgsOffered,
    date_offered: d.dateOffered,
    is_registered_on_portal: d.isRegisteredOnPortal
  };
}

export function mapDistributionFromDb(row: any): SeedDistribution {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    sacksGiven: Number(row.sacks_given),
    kgsOffered: Number(row.kgs_offered),
    dateOffered: row.date_offered,
    isRegisteredOnPortal: row.is_registered_on_portal
  };
}

export function mapHarvestToDb(h: HarvestRecord) {
  return {
    id: h.id,
    farmer_id: h.farmerId,
    farmer_name: h.farmerName,
    clean_seed_kgs: h.cleanSeedKgs,
    husks_seed_kgs: h.husksSeedKgs,
    total_kgs: h.totalKgs,
    amount_to_pay: h.amountToPay,
    payment_status: h.paymentStatus,
    payment_date: h.paymentDate || null,
    mpesa_trans_id: h.mpesaTransId || null,
    date_sold: h.dateSold
  };
}

export function mapHarvestFromDb(row: any): HarvestRecord {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    cleanSeedKgs: Number(row.clean_seed_kgs),
    husksSeedKgs: Number(row.husks_seed_kgs),
    totalKgs: Number(row.total_kgs),
    amountToPay: Number(row.amount_to_pay),
    paymentStatus: row.payment_status as 'Pending' | 'Paid' | 'Failed',
    paymentDate: row.payment_date || undefined,
    mpesaTransId: row.mpesa_trans_id || undefined,
    dateSold: row.date_sold
  };
}

export function mapSmsLogToDb(log: SmsLog) {
  return {
    id: log.id,
    recipient_phone: log.recipientPhone,
    recipient_name: log.recipientName,
    message: log.message,
    sent_at: log.sentAt,
    status: log.status
  };
}

export function mapSmsLogFromDb(row: any): SmsLog {
  return {
    id: row.id,
    recipientPhone: row.recipient_phone,
    recipientName: row.recipient_name,
    message: row.message,
    sentAt: row.sent_at,
    status: row.status as 'Delivered' | 'Failed'
  };
}

export function mapPricingFromDb(row: any): PricingRates {
  return {
    cleanSeedPerKg: Number(row.clean_seed_per_kg),
    husksSeedPerKg: Number(row.husks_seed_per_kg)
  };
}

// ----------------------------------------------------------------------------
// 2. Fetch/CRUD Methods
// ----------------------------------------------------------------------------

export async function sbGetFarmers(): Promise<Farmer[]> {
  if (!isSupabaseConfigured) {
    return getLocal('trinity_verd_farmers', INITIAL_FARMERS);
  }
  try {
    const { data, error } = await supabase.from('farmers').select('*');
    if (error) throw error;
    const list = (data || []).map(mapFarmerFromDb);
    return list.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  } catch (error) {
    console.warn("Supabase getFarmers failed, using local storage:", error);
    return getLocal('trinity_verd_farmers', INITIAL_FARMERS);
  }
}

export async function sbAddFarmer(f: Farmer) {
  if (!isSupabaseConfigured) {
    const list = getLocal<Farmer[]>('trinity_verd_farmers', INITIAL_FARMERS);
    list.unshift(f);
    setLocal('trinity_verd_farmers', list);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('farmers').insert(mapFarmerToDb(f));
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase addFarmer failed, using local storage:", error);
    const list = getLocal<Farmer[]>('trinity_verd_farmers', INITIAL_FARMERS);
    list.unshift(f);
    setLocal('trinity_verd_farmers', list);
    notifyListeners();
  }
}

export async function sbUpdateFarmer(f: Farmer) {
  if (!isSupabaseConfigured) {
    const list = getLocal<Farmer[]>('trinity_verd_farmers', INITIAL_FARMERS);
    const idx = list.findIndex(item => item.id === f.id);
    if (idx !== -1) {
      list[idx] = f;
    } else {
      list.unshift(f);
    }
    setLocal('trinity_verd_farmers', list);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('farmers').upsert(mapFarmerToDb(f));
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase updateFarmer failed, using local storage:", error);
    const list = getLocal<Farmer[]>('trinity_verd_farmers', INITIAL_FARMERS);
    const idx = list.findIndex(item => item.id === f.id);
    if (idx !== -1) {
      list[idx] = f;
    } else {
      list.unshift(f);
    }
    setLocal('trinity_verd_farmers', list);
    notifyListeners();
  }
}

export async function sbDeleteFarmer(id: string) {
  if (!isSupabaseConfigured) {
    const list = getLocal<Farmer[]>('trinity_verd_farmers', INITIAL_FARMERS);
    const filtered = list.filter(item => item.id !== id);
    setLocal('trinity_verd_farmers', filtered);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('farmers').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase deleteFarmer failed, using local storage:", error);
    const list = getLocal<Farmer[]>('trinity_verd_farmers', INITIAL_FARMERS);
    const filtered = list.filter(item => item.id !== id);
    setLocal('trinity_verd_farmers', filtered);
    notifyListeners();
  }
}

export async function sbGetDistributions(): Promise<SeedDistribution[]> {
  if (!isSupabaseConfigured) {
    return getLocal('trinity_verd_distributions', INITIAL_DISTRIBUTIONS);
  }
  try {
    const { data, error } = await supabase.from('distributions').select('*');
    if (error) throw error;
    const list = (data || []).map(mapDistributionFromDb);
    return list.sort((a, b) => b.dateOffered.localeCompare(a.dateOffered));
  } catch (error) {
    console.warn("Supabase getDistributions failed, using local storage:", error);
    return getLocal('trinity_verd_distributions', INITIAL_DISTRIBUTIONS);
  }
}

export async function sbAddDistribution(d: SeedDistribution) {
  if (!isSupabaseConfigured) {
    const list = getLocal<SeedDistribution[]>('trinity_verd_distributions', INITIAL_DISTRIBUTIONS);
    list.unshift(d);
    setLocal('trinity_verd_distributions', list);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('distributions').insert(mapDistributionToDb(d));
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase addDistribution failed, using local storage:", error);
    const list = getLocal<SeedDistribution[]>('trinity_verd_distributions', INITIAL_DISTRIBUTIONS);
    list.unshift(d);
    setLocal('trinity_verd_distributions', list);
    notifyListeners();
  }
}

export async function sbDeleteDistribution(id: string) {
  if (!isSupabaseConfigured) {
    const list = getLocal<SeedDistribution[]>('trinity_verd_distributions', INITIAL_DISTRIBUTIONS);
    const filtered = list.filter(item => item.id !== id);
    setLocal('trinity_verd_distributions', filtered);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('distributions').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase deleteDistribution failed, using local storage:", error);
    const list = getLocal<SeedDistribution[]>('trinity_verd_distributions', INITIAL_DISTRIBUTIONS);
    const filtered = list.filter(item => item.id !== id);
    setLocal('trinity_verd_distributions', filtered);
    notifyListeners();
  }
}

export async function sbGetHarvests(): Promise<HarvestRecord[]> {
  if (!isSupabaseConfigured) {
    return getLocal('trinity_verd_harvests', INITIAL_HARVESTS);
  }
  try {
    const { data, error } = await supabase.from('harvests').select('*');
    if (error) throw error;
    const list = (data || []).map(mapHarvestFromDb);
    return list.sort((a, b) => b.dateSold.localeCompare(a.dateSold));
  } catch (error) {
    console.warn("Supabase getHarvests failed, using local storage:", error);
    return getLocal('trinity_verd_harvests', INITIAL_HARVESTS);
  }
}

export async function sbAddHarvest(h: HarvestRecord) {
  if (!isSupabaseConfigured) {
    const list = getLocal<HarvestRecord[]>('trinity_verd_harvests', INITIAL_HARVESTS);
    list.unshift(h);
    setLocal('trinity_verd_harvests', list);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('harvests').insert(mapHarvestToDb(h));
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase addHarvest failed, using local storage:", error);
    const list = getLocal<HarvestRecord[]>('trinity_verd_harvests', INITIAL_HARVESTS);
    list.unshift(h);
    setLocal('trinity_verd_harvests', list);
    notifyListeners();
  }
}

export async function sbUpdateHarvest(h: HarvestRecord) {
  if (!isSupabaseConfigured) {
    const list = getLocal<HarvestRecord[]>('trinity_verd_harvests', INITIAL_HARVESTS);
    const idx = list.findIndex(item => item.id === h.id);
    if (idx !== -1) {
      list[idx] = h;
    } else {
      list.unshift(h);
    }
    setLocal('trinity_verd_harvests', list);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('harvests').upsert(mapHarvestToDb(h));
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase updateHarvest failed, using local storage:", error);
    const list = getLocal<HarvestRecord[]>('trinity_verd_harvests', INITIAL_HARVESTS);
    const idx = list.findIndex(item => item.id === h.id);
    if (idx !== -1) {
      list[idx] = h;
    } else {
      list.unshift(h);
    }
    setLocal('trinity_verd_harvests', list);
    notifyListeners();
  }
}

export async function sbGetSmsLogs(): Promise<SmsLog[]> {
  if (!isSupabaseConfigured) {
    return getLocal('trinity_verd_sms_logs', INITIAL_SMS_LOGS);
  }
  try {
    const { data, error } = await supabase.from('sms_logs').select('*');
    if (error) throw error;
    const list = (data || []).map(mapSmsLogFromDb);
    return list.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  } catch (error) {
    console.warn("Supabase getSmsLogs failed, using local storage:", error);
    return getLocal('trinity_verd_sms_logs', INITIAL_SMS_LOGS);
  }
}

export async function sbAddSmsLog(log: SmsLog) {
  if (!isSupabaseConfigured) {
    const list = getLocal<SmsLog[]>('trinity_verd_sms_logs', INITIAL_SMS_LOGS);
    list.unshift(log);
    setLocal('trinity_verd_sms_logs', list);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('sms_logs').insert(mapSmsLogToDb(log));
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase addSmsLog failed, using local storage:", error);
    const list = getLocal<SmsLog[]>('trinity_verd_sms_logs', INITIAL_SMS_LOGS);
    list.unshift(log);
    setLocal('trinity_verd_sms_logs', list);
    notifyListeners();
  }
}

export async function sbClearSmsLogs() {
  if (!isSupabaseConfigured) {
    setLocal('trinity_verd_sms_logs', []);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('sms_logs').delete().neq('id', 'placeholder-to-delete-all');
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase clearSmsLogs failed, using local storage:", error);
    setLocal('trinity_verd_sms_logs', []);
    notifyListeners();
  }
}

export async function sbGetPricing(): Promise<PricingRates> {
  if (!isSupabaseConfigured) {
    return getLocal('trinity_verd_pricing', INITIAL_PRICING);
  }
  try {
    const { data, error } = await supabase.from('pricing').select('*').eq('id', 'rates').single();
    if (error) {
      return INITIAL_PRICING;
    }
    return mapPricingFromDb(data);
  } catch (error) {
    console.warn("Supabase getPricing failed, using local storage:", error);
    return getLocal('trinity_verd_pricing', INITIAL_PRICING);
  }
}

export async function sbUpdatePricing(rates: PricingRates) {
  if (!isSupabaseConfigured) {
    setLocal('trinity_verd_pricing', rates);
    notifyListeners();
    return;
  }
  try {
    const { error } = await supabase.from('pricing').upsert({
      id: 'rates',
      clean_seed_per_kg: rates.cleanSeedPerKg,
      husks_seed_per_kg: rates.husksSeedPerKg
    });
    if (error) throw error;
  } catch (error) {
    console.warn("Supabase updatePricing failed, using local storage:", error);
    setLocal('trinity_verd_pricing', rates);
    notifyListeners();
  }
}

// ----------------------------------------------------------------------------
// 3. Database Initialization & Seeding
// ----------------------------------------------------------------------------

export async function sbResetToBaseline() {
  console.log("Supabase wipe & seed triggered...");

  if (!isSupabaseConfigured) {
    setLocal('trinity_verd_farmers', INITIAL_FARMERS);
    setLocal('trinity_verd_distributions', INITIAL_DISTRIBUTIONS);
    setLocal('trinity_verd_harvests', INITIAL_HARVESTS);
    setLocal('trinity_verd_sms_logs', INITIAL_SMS_LOGS);
    setLocal('trinity_verd_pricing', INITIAL_PRICING);
    notifyListeners();
    console.log("Local Baseline reset successful!");
    return;
  }

  try {
    // Delete all rows in child tables (handled via cascade or manual triggers)
    await supabase.from('sms_logs').delete().neq('id', '');
    await supabase.from('harvests').delete().neq('id', '');
    await supabase.from('distributions').delete().neq('id', '');
    await supabase.from('farmers').delete().neq('id', '');
    
    // Update pricing
    await sbUpdatePricing(INITIAL_PRICING);

    // Bulk inserts using mapped objects
    const { error: fErr } = await supabase.from('farmers').insert(INITIAL_FARMERS.map(mapFarmerToDb));
    if (fErr) throw fErr;

    const { error: dErr } = await supabase.from('distributions').insert(INITIAL_DISTRIBUTIONS.map(mapDistributionToDb));
    if (dErr) throw dErr;

    const { error: hErr } = await supabase.from('harvests').insert(INITIAL_HARVESTS.map(mapHarvestToDb));
    if (hErr) throw hErr;

    const { error: sErr } = await supabase.from('sms_logs').insert(INITIAL_SMS_LOGS.map(mapSmsLogToDb));
    if (sErr) throw sErr;

    console.log("Supabase reset successful!");
  } catch (error) {
    console.warn("Supabase reset to baseline failed, using local storage fallback:", error);
    setLocal('trinity_verd_farmers', INITIAL_FARMERS);
    setLocal('trinity_verd_distributions', INITIAL_DISTRIBUTIONS);
    setLocal('trinity_verd_harvests', INITIAL_HARVESTS);
    setLocal('trinity_verd_sms_logs', INITIAL_SMS_LOGS);
    setLocal('trinity_verd_pricing', INITIAL_PRICING);
    notifyListeners();
  }
}

// ----------------------------------------------------------------------------
// 4. Real-Time Publication Subscription
// ----------------------------------------------------------------------------

export function sbSubscribeAll(onChange: () => void) {
  if (!isSupabaseConfigured) {
    localListeners.push(onChange);
    return () => {
      localListeners = localListeners.filter(l => l !== onChange);
    };
  }

  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      () => {
        console.log('Real-time database mutation detected in Supabase, triggering reload.');
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
