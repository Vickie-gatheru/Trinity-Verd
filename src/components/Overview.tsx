import React from 'react';
import { Farmer, SeedDistribution, HarvestRecord, SmsLog } from '../types';
import { KITUI_ADMIN_STRUCTURE } from '../sampleData';
import { Users, Sprout, ShoppingBag, CreditCard, Sparkles, Trophy, MapPin, Send } from 'lucide-react';

interface OverviewProps {
  farmers: Farmer[];
  distributions: SeedDistribution[];
  harvests: HarvestRecord[];
  smsLogs: SmsLog[];
  onNavigate: (tab: string) => void;
}

export default function Overview({ farmers, distributions, harvests, smsLogs, onNavigate }: OverviewProps) {
  // Stats calculations
  const totalFarmers = farmers.length;
  
  const totalSacksDistributed = distributions.reduce((sum, item) => sum + item.sacksGiven, 0);
  const totalSeedKgsDistributed = distributions.reduce((sum, item) => sum + item.kgsOffered, 0);

  const totalCleanKgs = harvests.reduce((sum, item) => sum + item.cleanSeedKgs, 0);
  const totalHuskKgs = harvests.reduce((sum, item) => sum + item.husksSeedKgs, 0);
  const totalHarvestKgs = totalCleanKgs + totalHuskKgs;

  const totalPaid = harvests
    .filter(h => h.paymentStatus === 'Paid')
    .reduce((sum, item) => sum + item.amountToPay, 0);
    
  const totalPending = harvests
    .filter(h => h.paymentStatus === 'Pending')
    .reduce((sum, item) => sum + item.amountToPay, 0);

  // Yield leaderboard grouping
  const yieldByFarmer: Record<string, { name: string; kgs: number; clean: number; husk: number; count: number }> = {};
  
  harvests.forEach(record => {
    if (!yieldByFarmer[record.farmerId]) {
      yieldByFarmer[record.farmerId] = {
        name: record.farmerName,
        kgs: 0,
        clean: 0,
        husk: 0,
        count: 0
      };
    }
    yieldByFarmer[record.farmerId].kgs += record.totalKgs;
    yieldByFarmer[record.farmerId].clean += record.cleanSeedKgs;
    yieldByFarmer[record.farmerId].husk += record.husksSeedKgs;
    yieldByFarmer[record.farmerId].count += 1;
  });

  const leaderboard = Object.entries(yieldByFarmer)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.kgs - a.kgs)
    .slice(0, 3); // top 3 farmers

  // Ward distribution data
  const farmerCountBySubCounty: Record<string, number> = {};
  farmers.forEach(f => {
    farmerCountBySubCounty[f.subCounty] = (farmerCountBySubCounty[f.subCounty] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Kitui County's Leading Castor Seed Partner
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl font-sans">
            Trinity Verd Limited
          </h1>
          <p className="text-emerald-100/90 text-sm md:text-base leading-relaxed">
            Dealers of premium organic castor oil. Facilitating registration, high-yield seed distribution, clean harvested castor bean intake, and streamlined MPesa payments for smallholder farmer groups in Kitui County.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              id="recruit-cta"
              onClick={() => onNavigate('farmers')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Recruit New Farmer
            </button>
            <button
              id="record-harvest-cta"
              onClick={() => onNavigate('buyer')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-sm rounded-lg transition-all cursor-pointer"
            >
              Record Raw Intake
            </button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/10">
          <Sprout className="h-80 w-80 text-emerald-300" />
        </div>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Farmers */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Total Farmers</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalFarmers}</p>
            <p className="text-xs text-slate-500 mt-0.5">Registered in Kitui</p>
          </div>
        </div>

        {/* Seed Distribution */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-700">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Distributed Seeds</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalSacksDistributed} Sacks</p>
            <p className="text-xs text-slate-500 mt-0.5">{totalSeedKgsDistributed.toLocaleString()} Kgs offered</p>
          </div>
        </div>

        {/* Harvest Yield */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-700">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Total Harvest</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{(totalHarvestKgs / 1000).toFixed(2)} Tons</p>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="text-emerald-600 font-semibold">{totalCleanKgs.toLocaleString()}kg</span> clean / <span className="text-emerald-700 font-semibold">{totalHuskKgs.toLocaleString()}kg</span> husks
            </p>
          </div>
        </div>

        {/* MPesa Payouts */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-55 p-3 bg-rose-50 rounded-lg text-rose-700">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Payments Disbursed</p>
            <p className="text-xl font-bold text-slate-900 mt-1">KSh {totalPaid.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="text-amber-600 font-semibold">KSh {totalPending.toLocaleString()}</span> pending Mpesa
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Yield Leaders & Regional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Yield Leaderboard - "Compete according to the kgs" */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">
                Castor Yield Competition Leaderboard
              </h3>
              <p className="text-xs text-slate-500">
                Recognizing farmers based on peak production weight (Clean + Husks)
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">
              <Trophy className="h-3 text-amber-500 w-3" />
              Kitui Top Producers
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No harvest deliveries recorded yet. Go to Buyer Dashboard to record intakes!
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((item, index) => {
                const colors = [
                  'from-amber-100 to-yellow-50 text-amber-800 border-amber-200',
                  'from-slate-100 to-slate-50 text-slate-700 border-slate-200',
                  'from-amber-700/10 to-amber-600/5 text-amber-900 border-amber-600/10'
                ];
                const rankText = ["1st Place", "2nd Place", "3rd Place"];
                
                return (
                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-100 rounded-xl gap-4 hover:border-emerald-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg border flex flex-col items-center justify-center font-bold text-sm w-12 h-12 bg-gradient-to-br ${colors[index] || 'bg-slate-50 text-slate-600'}`}>
                        <span className="text-xs leading-none font-mono">#{index + 1}</span>
                        <span className="text-[10px] leading-tight font-sans tracking-tight uppercase">Rank</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{item.name}</h4>
                        <p className="text-xs text-slate-500 font-mono">ID: {item.id} • {item.count} delivery recorded</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-mono block">Delivery Mix</span>
                        <span className="text-xs text-slate-600">
                          <span className="font-medium text-emerald-600">{item.clean}kg clean</span> / {item.husk}kg husks
                        </span>
                      </div>
                      <div className="text-right bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-50">
                        <span className="text-xs text-slate-500 block font-mono">Total Yield</span>
                        <span className="text-base font-bold text-emerald-700">{item.kgs.toLocaleString()} Kgs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="mt-4 pt-3 text-center border-t border-slate-50">
                <button 
                  onClick={() => onNavigate('buyer')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  View full harvest leaderboard & pricing settings &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Local Distribution / Subcounty Stats */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base font-sans pb-3 border-b border-slate-100 mb-3">
              Regional Outreach
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registered farmers segmented by Sub-counties of Kitui County
            </p>

            <div className="space-y-3">
              {Object.entries(KITUI_ADMIN_STRUCTURE).map(([subCounty]) => {
                const count = farmers.filter(f => f.subCounty === subCounty).length;
                const percentage = totalFarmers > 0 ? (count / totalFarmers) * 100 : 0;
                
                return (
                  <div key={subCounty} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{subCounty}</span>
                      <span className="text-slate-500 font-semibold font-mono">{count} Farmers ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-600 to-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage || 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-rose-500" /> Locked to Kitui County
            </span>
            <span>Active Operations</span>
          </div>
        </div>

      </div>

      {/* Bottom section showing quick shortcut tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SMS Communication Status */}
        <div className="border border-slate-100 bg-emerald-50/15 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-700" />
              Farmers SMS Communications
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Send fast updates regarding castor oil prices, seed distribution events, or MPesa dispatch alerts directly from the system.
            </p>
          </div>
          <button
            id="overview-sms-btn"
            onClick={() => onNavigate('sms')}
            className="shrink-0 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Open Bulk SMS Hub ({smsLogs.length} Sent)
          </button>
        </div>

        {/* Quick Operations Metrics */}
        <div className="border border-slate-100 bg-amber-50/15 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Sprout className="h-4 w-4 text-amber-700" />
              Seed Sacks Dispatch Status
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Monitor high-yielding hybrid seeds distributed, with automated KGs offered calculations context.
            </p>
          </div>
          <button
            id="overview-seed-btn"
            onClick={() => onNavigate('seeds')}
            className="shrink-0 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-850 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Manage Seed Distribution
          </button>
        </div>
      </div>
    </div>
  );
}
