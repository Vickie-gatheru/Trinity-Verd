import React, { useState, useEffect } from 'react';
import { Farmer, SeedDistribution, HarvestRecord, SmsLog, PricingRates } from './types';
import { INITIAL_PRICING } from './sampleData';

import { isSupabaseConfigured } from './supabase';
import {
  sbGetFarmers,
  sbAddFarmer,
  sbUpdateFarmer,
  sbDeleteFarmer,
  sbGetDistributions,
  sbAddDistribution,
  sbDeleteDistribution,
  sbGetHarvests,
  sbAddHarvest,
  sbUpdateHarvest,
  sbGetSmsLogs,
  sbAddSmsLog,
  sbClearSmsLogs,
  sbGetPricing,
  sbUpdatePricing,
  sbResetToBaseline,
  sbSubscribeAll
} from './supabaseDb';

// Sub-components import
import Overview from './components/Overview';
import FarmersList from './components/FarmersList';
import SeedDistributionComponent from './components/SeedDistribution';
import BuyerDashboard from './components/BuyerDashboard';
import BulkSms from './components/BulkSms';
import SecurityCenter from './components/SecurityCenter';

// Icons for navigation sidebar/topbar
import { LayoutDashboard, Users, Sprout, ShoppingBag, Send, Award, Droplets, MapPin, Menu, X, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export default function App() {
  // --- Core Data State Holders ---
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [distributions, setDistributions] = useState<SeedDistribution[]>([]);
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [pricing, setPricing] = useState<PricingRates>(INITIAL_PRICING);
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('trinity_verd_privacy_mode');
    return saved === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);

  // --- Active Module switching ---
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Mobile drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync privacy mode settings back to LocalStorage
  useEffect(() => {
    localStorage.setItem('trinity_verd_privacy_mode', String(privacyMode));
  }, [privacyMode]);

  // Real-time synchronization listeners for Supabase
  useEffect(() => {
    setLoading(true);

    const loadSupabaseData = async () => {
      try {
        const [f, d, h, s, p] = await Promise.all([
          sbGetFarmers(),
          sbGetDistributions(),
          sbGetHarvests(),
          sbGetSmsLogs(),
          sbGetPricing()
        ]);
        setFarmers(f);
        setDistributions(d);
        setHarvests(h);
        setSmsLogs(s);
        setPricing(p);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data from Supabase:", error);
        setLoading(false);
      }
    };

    loadSupabaseData();

    // Subscribe to real-time changes
    const unsub = sbSubscribeAll(() => {
      loadSupabaseData();
    });

    return () => {
      unsub();
    };
  }, []);

  // --- Action Handlers mapping to Cloud Database ---

  const handleRestoreBaseline = async () => {
    setLoading(true);
    try {
      await sbResetToBaseline();
      const [f, d, h, s, p] = await Promise.all([
        sbGetFarmers(),
        sbGetDistributions(),
        sbGetHarvests(),
        sbGetSmsLogs(),
        sbGetPricing()
      ]);
      setFarmers(f);
      setDistributions(d);
      setHarvests(h);
      setSmsLogs(s);
      setPricing(p);
      setPrivacyMode(false);
    } catch (err) {
      console.error("Error resetting database:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (imported: {
    farmers?: Farmer[];
    distributions?: SeedDistribution[];
    harvests?: HarvestRecord[];
    smsLogs?: SmsLog[];
  }) => {
    setLoading(true);
    try {
      if (imported.farmers) {
        for (const f of imported.farmers) {
          await sbAddFarmer(f);
        }
      }
      if (imported.distributions) {
        for (const d of imported.distributions) {
          await sbAddDistribution(d);
        }
      }
      if (imported.harvests) {
        for (const h of imported.harvests) {
          await sbAddHarvest(h);
        }
      }
      if (imported.smsLogs) {
        for (const sms of imported.smsLogs) {
          await sbAddSmsLog(sms);
        }
      }
      const [f, d, h, s] = await Promise.all([
        sbGetFarmers(),
        sbGetDistributions(),
        sbGetHarvests(),
        sbGetSmsLogs()
      ]);
      setFarmers(f);
      setDistributions(d);
      setHarvests(h);
      setSmsLogs(s);
    } catch (err) {
      console.error("Error importing data backup:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Farmers Handlers
  const handleAddFarmer = async (f: Omit<Farmer, 'id' | 'registeredAt'>) => {
    const newFarmerId = `FARM-${Date.now().toString().substring(7)}`;
    const newFarmer: Farmer = {
      ...f,
      id: newFarmerId,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    await sbAddFarmer(newFarmer);
    const list = await sbGetFarmers();
    setFarmers(list);
  };

  const handleUpdateFarmer = async (updated: Farmer) => {
    await sbUpdateFarmer(updated);
    const list = await sbGetFarmers();
    setFarmers(list);
  };

  const handleDeleteFarmer = async (id: string) => {
    await sbDeleteFarmer(id);
    const list = await sbGetFarmers();
    setFarmers(list);
  };

  // Seed Distribution Handlers
  const handleAddDistribution = async (d: Omit<SeedDistribution, 'id'>) => {
    const newDist: SeedDistribution = {
      ...d,
      id: `DIST-${Date.now().toString().substring(7)}`
    };
    await sbAddDistribution(newDist);
    const list = await sbGetDistributions();
    setDistributions(list);
  };

  const handleDeleteDistribution = async (id: string) => {
    await sbDeleteDistribution(id);
    const list = await sbGetDistributions();
    setDistributions(list);
  };

  // Harvest Intakes Handlers
  const handleAddHarvest = async (h: Omit<HarvestRecord, 'id' | 'paymentStatus' | 'amountToPay' | 'totalKgs'>) => {
    const standardAmount = (h.cleanSeedKgs * pricing.cleanSeedPerKg) + (h.husksSeedKgs * pricing.husksSeedPerKg);
    const totalW = h.cleanSeedKgs + h.husksSeedKgs;
    const newHarvest: HarvestRecord = {
      ...h,
      id: `HARV-${Date.now().toString().substring(7)}`,
      totalKgs: totalW,
      amountToPay: standardAmount,
      paymentStatus: 'Pending'
    };
    await sbAddHarvest(newHarvest);
    const list = await sbGetHarvests();
    setHarvests(list);
  };

  const handlePayFarmer = async (harvestId: string, transId: string, timestamp: string) => {
    const record = harvests.find(h => h.id === harvestId);
    if (record) {
      const updated: HarvestRecord = {
        ...record,
        paymentStatus: 'Paid',
        mpesaTransId: transId,
        paymentDate: timestamp
      };
      await sbUpdateHarvest(updated);
      const list = await sbGetHarvests();
      setHarvests(list);
    }
  };

  // Pricing Configuration Setting Handlers
  const handleUpdatePricing = async (newPricing: PricingRates) => {
    await sbUpdatePricing(newPricing);
    const list = await sbGetPricing();
    setPricing(list);
  };

  // Bulk SMS Handlers
  const handleAddSmsLog = async (sms: Omit<SmsLog, 'id' | 'sentAt' | 'status'>) => {
    const currentLocal = new Date();
    const dateStr = currentLocal.toISOString().split('T')[0];
    const timeStr = currentLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const newLog: SmsLog = {
      ...sms,
      id: `SMS-${Date.now().toString().substring(7)}`,
      sentAt: `${dateStr} ${timeStr}`,
      status: 'Delivered'
    };
    await sbAddSmsLog(newLog);
    const list = await sbGetSmsLogs();
    setSmsLogs(list);
  };

  const handleClearLogs = async () => {
    await sbClearSmsLogs();
    setSmsLogs([]);
  };


  // Dynamic tab routing render helper
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview
            farmers={farmers}
            distributions={distributions}
            harvests={harvests}
            smsLogs={smsLogs}
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'farmers':
        return (
          <FarmersList
            farmers={farmers}
            onAddFarmer={handleAddFarmer}
            onUpdateFarmer={handleUpdateFarmer}
            onDeleteFarmer={handleDeleteFarmer}
            privacyMode={privacyMode}
          />
        );
      case 'seeds':
        return (
          <SeedDistributionComponent
            farmers={farmers}
            distributions={distributions}
            onAddDistribution={handleAddDistribution}
            onDeleteDistribution={handleDeleteDistribution}
          />
        );
      case 'buyer':
        return (
          <BuyerDashboard
            farmers={farmers}
            harvests={harvests}
            pricing={pricing}
            onUpdatePricing={handleUpdatePricing}
            onAddHarvest={handleAddHarvest}
            onPayFarmer={handlePayFarmer}
            onAddSmsLog={handleAddSmsLog}
            privacyMode={privacyMode}
          />
        );
      case 'sms':
        return (
          <BulkSms
            farmers={farmers}
            smsLogs={smsLogs}
            pricing={pricing}
            onAddSmsLog={handleAddSmsLog}
            onClearLogs={handleClearLogs}
            privacyMode={privacyMode}
          />
        );
      case 'security':
        return (
          <SecurityCenter
            farmers={farmers}
            distributions={distributions}
            harvests={harvests}
            smsLogs={smsLogs}
            privacyMode={privacyMode}
            onTogglePrivacy={() => setPrivacyMode(prev => !prev)}
            onRestoreBaseline={handleRestoreBaseline}
            onImportBackup={handleImportBackup}
          />
        );
      default:
        return <div className="text-slate-500 py-12 text-center text-sm">Select a tab from directory tree sidebar...</div>;
    }
  };

  // Navigation Links configuration
  const navigationItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'farmers', label: 'Farmers Enrollment', icon: Users },
    { id: 'seeds', label: 'Seed Distribution', icon: Sprout },
    { id: 'buyer', label: 'Buyer & Payments', icon: ShoppingBag },
    { id: 'sms', label: 'Bulk SMS Hub', icon: Send },
    { id: 'security', label: 'Database & Backups', icon: Database }
  ];

  const activeLabel = navigationItems.find(i => i.id === activeTab)?.label || 'Overview';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-2xl p-8 shadow-xs text-center flex flex-col items-center gap-6">
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl animate-pulse">
            <Database className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-sans text-slate-900">Synchronizing with Cloud</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Establishing a real-time secure connection to the Trinity Verd cloud database. Loading enrollment directories, distribution logs, and active market rates...
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/60 border border-emerald-100/60 rounded-xl px-4 py-2">
            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
            Connecting to Supabase (PostgreSQL)...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-700/10 selection:text-emerald-800">
      
      {/* Top Universal Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-750 to-amber-700 bg-emerald-800 text-amber-400 rounded-xl flex items-center justify-center shadow-xs">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span id="title-main" className="font-sans font-black text-slate-900 text-base">Trinity Verd Limited</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-1.5 py-0.5 font-bold font-mono">Caster Seed App</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-rose-500" />
                Kitui County, Kenya • Dealers of Castor Oil
              </div>
            </div>
          </div>

          {/* Desktop Right corner stat indicators */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Clean Buying Rate</span>
              <span className="text-sm font-bold text-emerald-700">KSh {pricing.cleanSeedPerKg}/Kg</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Husks Buying Rate</span>
              <span className="text-sm font-bold text-amber-700">KSh {pricing.husksSeedPerKg}/Kg</span>
            </div>
            <div className="h-8 w-px bg-slate-150" />
            <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1 bg-white rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-500 font-medium">MPESA System Active</span>
            </div>
          </div>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Structural Frame container (desktop sidebar layout) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Desktop Sidebar navigation rail */}
        <aside className="hidden md:block w-64 shrink-0 space-y-2 select-none">
          <div className="bg-white border md:border-slate-100 rounded-xl p-3 space-y-1.5 shadow-xs sticky top-22">
            <span className="text-[10px] font-bold text-slate-350 block px-3 uppercase tracking-wider font-mono">MAIN MENU</span>
            {navigationItems.map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isActive ? 'bg-emerald-700 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <IconComp className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 text-white rounded-xl p-4 shadow-xs sticky top-[420px] border border-emerald-900">
            <h5 className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-mono">Kitui Castor Farming</h5>
            <p className="text-[11px] text-emerald-100/90 leading-relaxed mt-1.5">
              Castor plants are highly drought-tolerant, making them ideal cash crops for Kitui's semi-arid terrain, generating stable family revenues.
            </p>
          </div>
        </aside>

        {/* Mobile menu modal drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs flex items-start justify-end pt-18">
            <div className="bg-white border-l border-slate-100 max-w-[280px] w-full h-full p-4 space-y-4 shadow-xl">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">Navigation Menu</span>
              <div className="space-y-1.5">
                {navigationItems.map(item => {
                  const IconComp = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg cursor-pointer ${isActive ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <IconComp className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-2 text-xs font-medium text-slate-500">
                <div className="flex justify-between">
                  <span>Clean Seed Rate:</span>
                  <strong className="text-emerald-700">KSh {pricing.cleanSeedPerKg}/kg</strong>
                </div>
                <div className="flex justify-between">
                  <span>Husks Seed Rate:</span>
                  <strong className="text-amber-700">KSh {pricing.husksSeedPerKg}/kg</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Core application presentation board */}
        <main className="flex-1 min-w-0 bg-transparent">
          {renderTabContent()}
        </main>

      </div>

      {/* Universal Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 bg-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-450 text-slate-400 font-mono">
          <div>
            &copy; 2026 <strong>Trinity Verd Limited</strong> • All rights reserved. Registered in Kenya.
          </div>
          <div className="flex items-center gap-4">
            <span>Dealers of Organic Castor Oil</span>
            <span>Kitui County Operations Board</span>
            <span className="text-emerald-600">Direct MPesa Payments</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
