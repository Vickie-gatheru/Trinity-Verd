import React, { useState } from 'react';
import { Farmer, HarvestRecord, PricingRates, SmsLog } from '../types';
import { ShoppingBag, RefreshCw, Smartphone, DollarSign, Check, Award, ArrowUpRight, ShieldCheck, ChevronRight, Settings } from 'lucide-react';

interface BuyerDashboardProps {
  farmers: Farmer[];
  harvests: HarvestRecord[];
  pricing: PricingRates;
  onUpdatePricing: (pricing: PricingRates) => void;
  onAddHarvest: (harvest: Omit<HarvestRecord, 'id' | 'paymentStatus' | 'amountToPay' | 'totalKgs'>) => void;
  onPayFarmer: (id: string, mpesaTransId: string, paymentDate: string) => void;
  onAddSmsLog: (sms: Omit<SmsLog, 'id' | 'sentAt' | 'status'>) => void;
  privacyMode?: boolean;
}

export default function BuyerDashboard({
  farmers,
  harvests,
  pricing,
  onUpdatePricing,
  onAddHarvest,
  onPayFarmer,
  onAddSmsLog,
  privacyMode = false
}: BuyerDashboardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'intake' | 'pricing' | 'leaderboard'>('intake');

  // New Harvest Form Fields
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [cleanKgs, setCleanKgs] = useState<number>(50);
  const [huskKgs, setHuskKgs] = useState<number>(20);
  const [dateSold, setDateSold] = useState(() => new Date().toISOString().split('T')[0]);

  // Pricing Fields
  const [cleanRate, setCleanRate] = useState(pricing.cleanSeedPerKg);
  const [huskRate, setHuskRate] = useState(pricing.husksSeedPerKg);

  // MPesa API Simulation Dialog state
  const [payingRecord, setPayingRecord] = useState<HarvestRecord | null>(null);
  const [mpesaProgress, setMpesaProgress] = useState<string[]>([]);
  const [isPayingActive, setIsPayingActive] = useState(false);
  const [currentMpesaStep, setCurrentMpesaStep] = useState(0);
  const [simulatedTransId, setSimulatedTransId] = useState('');

  // Digital Receipt Modal state
  const [viewingReceipt, setViewingReceipt] = useState<HarvestRecord | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Computive calculation preview
  const previewTotalKgs = cleanKgs + huskKgs;
  const previewAmountToPay = (cleanKgs * pricing.cleanSeedPerKg) + (huskKgs * pricing.husksSeedPerKg);

  // Derived Receipt values
  const receiptFarmer = viewingReceipt ? farmers.find(f => f.id === viewingReceipt.farmerId) : null;
  const receiptPhone = receiptFarmer?.phone || '+2547XXXXXXXX';
  const receiptId = receiptFarmer?.idNumber || 'XXXXXX';
  const displayReceiptPhone = privacyMode 
    ? receiptPhone.substring(0, 4) + ' *** *** ' + receiptPhone.substring(receiptPhone.length - 3)
    : receiptPhone;
  const displayReceiptId = privacyMode
    ? receiptId.substring(0, 2) + '****' + receiptId.substring(receiptId.length - 2)
    : receiptId;

  // Group harvest results by farmer ID for "Compete according to Kgs"
  const leaderboardData = React.useMemo(() => {
    const dataMap: Record<string, { farmerId: string; name: string; cleanTotal: number; huskTotal: number; totalKgs: number; subCounty: string; deliveries: number }> = {};
    
    // Seed standard registered farmers first to guarantee they appear
    farmers.forEach(f => {
      dataMap[f.id] = {
        farmerId: f.id,
        name: f.fullName,
        cleanTotal: 0,
        huskTotal: 0,
        totalKgs: 0,
        subCounty: f.subCounty,
        deliveries: 0
      };
    });

    // Accumulate harvests
    harvests.forEach(record => {
      if (dataMap[record.farmerId]) {
        dataMap[record.farmerId].cleanTotal += record.cleanSeedKgs;
        dataMap[record.farmerId].huskTotal += record.husksSeedKgs;
        dataMap[record.farmerId].totalKgs += record.totalKgs;
        dataMap[record.farmerId].deliveries += 1;
      } else {
        // Fallback for farmers pre-seeded but deleted
        dataMap[record.farmerId] = {
          farmerId: record.farmerId,
          name: record.farmerName,
          cleanTotal: record.cleanSeedKgs,
          huskTotal: record.husksSeedKgs,
          totalKgs: record.totalKgs,
          subCounty: "Kitui County",
          deliveries: 1
        };
      }
    });

    return Object.values(dataMap).sort((a, b) => b.totalKgs - a.totalKgs);
  }, [farmers, harvests]);

  // Submit recorded harvest raw intake
  const handleSubmitHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedFarmerId) {
      return setErrorMsg('Please choose a registered farmer profile.');
    }
    if (cleanKgs < 0 || huskKgs < 0) {
      return setErrorMsg('Weight inputs cannot be negative.');
    }
    if (cleanKgs === 0 && huskKgs === 0) {
      return setErrorMsg('Either Clean Castor Seeds or Husks weight must exceed 0kg.');
    }
    if (cleanKgs > 1000 || huskKgs > 1000) {
      return setErrorMsg('Input Protection Warning: Castor weight intake cannot exceed 1,000 kg per individual delivery to prevent entry typos.');
    }

    const linkedFarmer = farmers.find(f => f.id === selectedFarmerId);
    if (!linkedFarmer) {
      return setErrorMsg('Selected farmer profile could not be retrieved.');
    }

    onAddHarvest({
      farmerId: linkedFarmer.id,
      farmerName: linkedFarmer.fullName,
      cleanSeedKgs: cleanKgs,
      husksSeedKgs: huskKgs,
      dateSold
    });

    setSuccessMsg(`Recorded castor intake for ${linkedFarmer.fullName}: ${cleanKgs}kg clean / ${huskKgs}kg husks.`);
    setSelectedFarmerId('');
    setCleanKgs(50);
    setHuskKgs(20);

    setTimeout(() => {
      setIsRecording(false);
      setSuccessMsg('');
    }, 1200);
  };

  // Safe pricing configuration update helper
  const handleUpdateRates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePricing({
      cleanSeedPerKg: cleanRate,
      husksSeedPerKg: huskRate
    });
    alert(`Successfully updated buying rates:\n- Clean seeds: KSh ${cleanRate}/Kg\n- Husk seeds: KSh ${huskRate}/Kg`);
  };

  // MPesa simulation generator
  const triggerMpesaPayout = (record: HarvestRecord) => {
    setPayingRecord(record);
    setIsPayingActive(true);
    setCurrentMpesaStep(0);
    
    const randomTrans = 'MPW' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setSimulatedTransId(randomTrans);

    const foundFarmer = farmers.find(f => f.id === record.farmerId);
    const rawPhone = foundFarmer?.phone || '+254712345678';
    const displayPhone = privacyMode 
      ? rawPhone.substring(0, 4) + ' *** *** ' + rawPhone.substring(rawPhone.length - 3)
      : rawPhone;

    const steps = [
      'Connecting to Safaricom MPesa API Gateway...',
      `Verifying subscriber status for ${displayPhone}...`,
      'Checking corporate account balance...',
      `Initiating B2C disbursement: KSh ${record.amountToPay.toLocaleString()} to ${record.farmerName}...`,
      'Awaiting response confirmation from Safaricom...',
      `Disbursement successful. SMS receipt dispatched. Transaction ID: ${randomTrans}.`
    ];
    setMpesaProgress(steps);

    // Step-by-step timer animation
    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      if (stepCount < steps.length) {
        setCurrentMpesaStep(stepCount);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          // Commit payment to state
          const today = new Date().toISOString().split('T')[0];
          onPayFarmer(record.id, randomTrans, today);
          
          // Auto trigger corresponding confirmation SMS as requested by user
          onAddSmsLog({
            recipientPhone: rawPhone,
            recipientName: record.farmerName,
            message: `Habari ${record.farmerName}, Trinity Verd Limited imetuma malipo yako ya KSh ${record.amountToPay.toLocaleString()} kupitia MPESA. Trans ID: ${randomTrans}. Ahsante kwa kuuza Castor Seed Kitui.`
          });

          setIsPayingActive(false);
          setPayingRecord(null);
        }, 800);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar Navigation */}
      <div className="flex flex-col md:flex-row pb-3 border-b border-slate-100 justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            Castor Intake & Payments
          </h2>
          <p className="text-xs text-slate-500">
            Computive system to evaluate grower yields, manage castor buying rates, and issue instant MPesa disbursements.
          </p>
        </div>

        {/* Modular Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold gap-1 self-stretch md:self-auto">
          <button
            onClick={() => { setActiveTab('intake'); setIsRecording(false); }}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${activeTab === 'intake' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Harvest Intakes
          </button>
          <button
            onClick={() => { setActiveTab('leaderboard'); }}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${activeTab === 'leaderboard' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🌾 Competition Board
          </button>
          <button
            onClick={() => { setActiveTab('pricing'); }}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors flex items-center gap-1 ${activeTab === 'pricing' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Settings className="h-3 w-3" />
            Pricing Matrix
          </button>
        </div>
      </div>

      {activeTab === 'pricing' && (
        /* Configuration rates dashboard option */
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm max-w-lg">
          <h3 className="font-bold text-slate-900 text-sm font-sans pb-3 border-b border-slate-50 mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-emerald-700" />
            Trinity Verd Castor buying rates (KSh / Kg)
          </h3>
          <form onSubmit={handleUpdateRates} className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Standard rates are set by the Trinity Verd marketing board in Kitui County. Adjusting rates here updates calculations for all unregistered / new harvest intakes recorded from this moment forward.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Clean Castor Seeds rate (per KG)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-mono">KSh</span>
                  <input
                    type="number"
                    min="1"
                    value={cleanRate}
                    onChange={e => setCleanRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg pl-12 pr-4 py-2 text-sm focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Husks Castor Seeds rate (per KG)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-mono">KSh</span>
                  <input
                    type="number"
                    min="1"
                    value={huskRate}
                    onChange={e => setHuskRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg pl-12 pr-4 py-2 text-sm focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Set New buying rates
            </button>
          </form>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        /* The requested dynamic yield competition leaderboard "Compete according to the KGs" */
        <div className="space-y-4">
          <div className="bg-emerald-950 p-5 rounded-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold font-mono text-amber-500 uppercase tracking-widest block">Season Productivity</span>
              <h3 className="text-lg font-extrabold tracking-tight font-sans">Compete According to the Harvest Kgs</h3>
              <p className="text-xs text-emerald-105 text-slate-350 max-w-xl">
                Encourages castor seed production in Kitui by ranking standard registered growers based on cumulative clean weight and raw husk outputs sold to Trinity Verd Limited.
              </p>
            </div>
            <div className="bg-emerald-900 border border-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-500 animate-bounce" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-mono">Current Champion</span>
                <span className="font-bold text-amber-400 text-xs">{leaderboardData[0]?.name || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Rank</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Farmer Profile</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Clean Seeds (KGs)</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Husks Seeds (KGs)</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Total Cumulative Yield</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Deliveries</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {leaderboardData.map((item, idx) => {
                    const isTopThree = idx < 3;
                    const awards = ["🥇 Champion", "🥈 Runner Up", "🥉 Third Place"];
                    
                    return (
                      <tr key={item.farmerId} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isTopThree ? (
                            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200/50 rounded-full text-xs font-semibold text-amber-800">
                              {awards[idx]}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-xs font-medium pl-3">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: {item.farmerId} • {item.subCounty}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-800">
                          {item.cleanTotal.toLocaleString()} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-650">
                          {item.huskTotal.toLocaleString()} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-emerald-800">{item.totalKgs.toLocaleString()} Kgs</span>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-full rounded-full" 
                                style={{ width: `${Math.min(100, (item.totalKgs / 600) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                          {item.deliveries} sold
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'intake' && (
        <div className="space-y-4">
          {/* Quick Record CTA bar */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Delivery & MPesa Registry
            </span>
            {!isRecording && (
              <button
                id="record-intake-btn"
                onClick={() => setIsRecording(true)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Record Raw Castor Intake
              </button>
            )}
          </div>

          {isRecording && (
            /* Computive system entry form */
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm max-w-2xl">
              <div className="pb-3 border-b border-slate-100 mb-5 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-sans">
                    Record Grower Castor Beans Intake
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated according to dry clean seed weights vs raw husky byproduct.
                  </p>
                </div>
                <button
                  onClick={() => setIsRecording(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 font-mono"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitHarvest} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold font-sans">
                    Error Details: {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    {successMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Choose Farmer */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 block">Select Farmer Profile</label>
                    <select
                      value={selectedFarmerId}
                      onChange={e => setSelectedFarmerId(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-sans"
                      required
                    >
                      <option value="">-- Choose Registered Grower --</option>
                      {farmers.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.fullName} (CID: {f.id} • Ward: {f.ward} • {f.subCounty})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clean Seed weight */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-800 block">* Clean Seed * Volume</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={cleanKgs}
                        onChange={e => setCleanKgs(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg pr-12 pl-4 py-2 text-sm focus:outline-emerald-600 font-mono"
                        required
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 font-mono">Kgs</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium block">
                      Buying rate: KSh {pricing.cleanSeedPerKg}/Kg (Subtotal: <strong>KSh {(cleanKgs * pricing.cleanSeedPerKg).toLocaleString()}</strong>)
                    </span>
                  </div>

                  {/* Husks seed weight */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-900 block">Husks Seeds Volume</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={huskKgs}
                        onChange={e => setHuskKgs(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg pr-12 pl-4 py-2 text-sm focus:outline-emerald-600 font-mono"
                        required
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 font-mono">Kgs</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-medium block">
                      Buying rate: KSh {pricing.husksSeedPerKg}/Kg (Subtotal: <strong>KSh {(huskKgs * pricing.husksSeedPerKg).toLocaleString()}</strong>)
                    </span>
                  </div>

                  {/* Date of Sale */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">Date Sold</label>
                    <input
                      type="date"
                      value={dateSold}
                      onChange={e => setDateSold(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-sans"
                      required
                    />
                  </div>

                  {/* Computive payout preview box */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between md:col-span-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Total Computive Weight</span>
                      <span className="text-base font-bold text-slate-800">{previewTotalKgs} Kgs</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Est. MPesa Payout</span>
                      <span className="text-lg font-black text-emerald-800">KSh {previewAmountToPay.toLocaleString()}</span>
                    </div>
                  </div>

                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <button
                    type="submit"
                    disabled={farmers.length === 0}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    Register Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecording(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Records Table with MPesa actions */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Date</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Grower</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Composition (KGs)</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Payment Amount</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Mpesa Status</th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-150">
                  {harvests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                        No castor seeds raw harvest intakes logged yet.
                      </td>
                    </tr>
                  ) : (
                    harvests.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {h.dateSold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className="font-semibold text-slate-930 text-sm block">{h.farmerName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {h.farmerId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <span className="font-semibold text-emerald-600">{h.cleanSeedKgs}kg Clean</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-amber-700">{h.husksSeedKgs}kg Husks</span>
                            <span className="block text-[11px] text-slate-400 mt-0.5">Total weight: {h.totalKgs} Kgs</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-extrabold text-slate-800">
                          KSh {h.amountToPay.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {h.paymentStatus === 'Paid' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="h-3 w-3 text-emerald-600" />
                                MPESA Paid
                              </span>
                              <span className="block text-[9px] text-slate-400 font-mono text-center">Tx: {h.mpesaTransId}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Pending MPesa
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          {h.paymentStatus === 'Pending' ? (
                            <button
                              id={`pay-${h.id}`}
                              onClick={() => triggerMpesaPayout(h)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs hover:shadow-sm inline-flex items-center gap-1 transition-colors"
                            >
                              <Smartphone className="h-3 w-3" />
                              Pay Mpesa
                            </button>
                          ) : (
                            <button
                              onClick={() => setViewingReceipt(h)}
                              className="px-2.5 py-1 text-emerald-750 hover:bg-emerald-50 bg-emerald-50/50 border border-emerald-100 rounded-md text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> View Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MPesa Instant API processing simulated dialog modal view */}
      {isPayingActive && payingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative bg-slate-900 text-white border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 animate-pulse">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">M-PESA B2C PAYOUT</span>
                <h4 className="text-base font-extrabold text-slate-100">Trinity Verd Mobile Wallet Dispatch</h4>
              </div>
            </div>

            {/* Simulated interactive logs */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-xs space-y-2 max-h-60 overflow-y-auto text-emerald-400 flex flex-col justify-end">
              {mpesaProgress.slice(0, currentMpesaStep + 1).map((stepMsg, stepIdx) => (
                <div key={stepIdx} className="flex gap-2">
                  <span className="text-slate-500 select-none">[{new Date().toLocaleTimeString()}]</span>
                  <p className={stepIdx === mpesaProgress.length - 1 ? "text-amber-400 font-bold" : ""}>
                    {stepMsg}
                  </p>
                </div>
              ))}
              {currentMpesaStep < mpesaProgress.length - 1 && (
                <div className="flex items-center gap-2 text-slate-500">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                  <span>Processing...</span>
                </div>
              )}
            </div>

            {/* Static pay receipt values */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50 flex justify-between text-xs text-slate-350">
              <div>
                <span className="text-[9px] text-slate-500 block font-mono font-bold uppercase">RECIPIENT GROWER</span>
                <strong className="text-slate-200">{payingRecord.farmerName}</strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 block font-mono font-bold uppercase">OUTSTANDING PAY</span>
                <strong className="text-emerald-400 text-sm font-black">KSh {payingRecord.amountToPay.toLocaleString()}</strong>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Printable Castor Intake Delivery Note & Payment Voucher Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white text-slate-800 max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-6 relative print:p-0 print:border-none print:shadow-none">
            
            {/* Header section with brand info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-wide uppercase font-sans">
                  TRINITY VERD LIMITED
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Dealers of Pure Castor Oil • Kitui County, Kenya
                </p>
              </div>
              <div className="text-right sm:text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold uppercase rounded-lg">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Payment Voucher
                </span>
              </div>
            </div>

            {/* Inner Printable Sheet container */}
            <div className="space-y-4 text-xs font-sans print:m-0">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">Grower Details</span>
                  <strong className="text-sm text-slate-900">{viewingReceipt.farmerName}</strong>
                  <span className="block mt-0.5 text-slate-500">Citizen ID: {displayReceiptId}</span>
                  <span className="block text-slate-500">Phone: {displayReceiptPhone}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">Location / Registry</span>
                  <span className="block mt-0.5 text-slate-700 font-medium">Village: {receiptFarmer?.village || 'Unknown'}</span>
                  <span className="block text-slate-500">Ward: {receiptFarmer?.ward || 'Unknown'}</span>
                  <span className="block text-slate-500">Sub-county: {receiptFarmer?.subCounty || 'Unknown'}</span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] text-slate-500 font-mono uppercase tracking-wider border-b border-slate-150">
                    <tr>
                      <th className="p-3">Castor Seed Composition</th>
                      <th className="p-3 text-right">Net Weight</th>
                      <th className="p-3 text-right">Buying Rate</th>
                      <th className="p-3 text-right">Subtotal Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    <tr>
                      <td className="p-3 font-semibold text-emerald-850">Clean Castor Seeds</td>
                      <td className="p-3 text-right font-mono">{viewingReceipt.cleanSeedKgs} Kgs</td>
                      <td className="p-3 text-right font-mono font-semibold">KSh {pricing.cleanSeedPerKg}/Kg</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">KSh {(viewingReceipt.cleanSeedKgs * pricing.cleanSeedPerKg).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-amber-800">Castor Seed Husks</td>
                      <td className="p-3 text-right font-mono">{viewingReceipt.husksSeedKgs} Kgs</td>
                      <td className="p-3 text-right font-mono font-semibold">KSh {pricing.husksSeedPerKg}/Kg</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">KSh {(viewingReceipt.husksSeedKgs * pricing.husksSeedPerKg).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-emerald-50/20 font-bold text-slate-900 border-t-2 border-slate-200">
                      <td className="p-3 uppercase text-[10px] tracking-wider text-slate-500">Computive Totals</td>
                      <td className="p-3 text-right font-mono text-slate-800">{viewingReceipt.totalKgs} Kgs</td>
                      <td className="p-3"></td>
                      <td className="p-3 text-right font-mono text-emerald-900 text-sm">KSh {viewingReceipt.amountToPay.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Audit Security Footer */}
              <div className="p-4 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 block font-bold uppercase">MPESA TRANSACTION DETAILS</span>
                  <span className="block text-slate-200 font-semibold">Status: SUCCESSFUL (Direct B2C Payout)</span>
                  <span className="block text-slate-400">MPesa Receipt No: {viewingReceipt.mpesaTransId}</span>
                </div>
                <div className="space-y-1 sm:text-right">
                  <span className="text-[9px] text-slate-500 block font-bold uppercase">VOUCHER METADATA</span>
                  <span className="block text-slate-400">Voucher Ref: TVL-REC-{viewingReceipt.id.split('-')[1]}</span>
                  <span className="block text-slate-400">Date Issued: {viewingReceipt.paymentDate || viewingReceipt.dateSold}</span>
                </div>
              </div>

              {/* Signature Block */}
              <div className="pt-4 border-t border-dashed border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
                <div className="space-y-3">
                  <div className="h-6 border-b border-slate-300"></div>
                  <span className="block">Trinity Weighing Clerk Signature</span>
                </div>
                <div className="space-y-3 text-right">
                  <div className="h-6 border-b border-slate-300"></div>
                  <span className="block">Grower Acceptance Signature</span>
                </div>
              </div>
            </div>

            {/* Action operations buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                Print Voucher / Save PDF
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Close Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
