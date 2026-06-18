import React, { useState } from 'react';
import { Farmer, SeedDistribution } from '../types';
import { Sprout, Plus, Calendar, Search, ArrowDownCircle, Check, Trash2 } from 'lucide-react';

interface SeedDistributionProps {
  farmers: Farmer[];
  distributions: SeedDistribution[];
  onAddDistribution: (distribution: Omit<SeedDistribution, 'id'>) => void;
  onDeleteDistribution: (id: string) => void;
}

export default function SeedDistributionComponent({ farmers, distributions, onAddDistribution, onDeleteDistribution }: SeedDistributionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [sacksGiven, setSacksGiven] = useState(2);
  const [kgPerSack, setKgPerSack] = useState(25); // standard castor seed sack is 25kg
  const [dateOffered, setDateOffered] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const totalSacks = distributions.reduce((sum, d) => sum + d.sacksGiven, 0);
  const totalKgs = distributions.reduce((sum, d) => sum + d.kgsOffered, 0);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedFarmerId) {
      return setErrorMsg('Please select a registered farmer.');
    }
    if (sacksGiven <= 0) {
      return setErrorMsg('Number of sacks must be greater than zero.');
    }
    if (kgPerSack <= 0) {
      return setErrorMsg('Kgs per sack must be greater than zero.');
    }

    const targetFarmer = farmers.find(f => f.id === selectedFarmerId);
    if (!targetFarmer) {
      return setErrorMsg('Farmer profile not found.');
    }

    const calculatedKgs = sacksGiven * kgPerSack;

    onAddDistribution({
      farmerId: targetFarmer.id,
      farmerName: targetFarmer.fullName,
      sacksGiven,
      kgsOffered: calculatedKgs,
      dateOffered,
      isRegisteredOnPortal: true
    });

    setSuccessMsg(`Distributed ${sacksGiven} sacks (${calculatedKgs} Kgs) to ${targetFarmer.fullName} successfully.`);
    setSelectedFarmerId('');
    setSacksGiven(2);
    
    setTimeout(() => {
      setIsAdding(false);
      setSuccessMsg('');
    }, 1500);
  };

  const filteredDistributions = distributions.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.farmerName.toLowerCase().includes(q) ||
      d.dateOffered.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Statistics summary cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            Castor Seeds Distribution
          </h2>
          <p className="text-xs text-slate-500">
            Dispatch, log, and audit high-yield castor hybrid seeds provided to local farmers in Kitui.
          </p>
        </div>

        {!isAdding && (
          <button
            id="seed-disburse-btn"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer self-start sm:self-center"
          >
            <Plus className="h-4 w-4" />
            Distribute Seeds
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI: Total Sacks */}
        <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Total Sacks Dispatched</span>
            <div className="text-3xl font-extrabold text-amber-800">{totalSacks} Sacks</div>
            <span className="text-[11px] text-slate-500">Provided to registered members</span>
          </div>
          <div className="p-3 bg-amber-100 rounded-lg text-amber-800">
            <Sprout className="h-6 w-6" />
          </div>
        </div>

        {/* KPI: Total KGs Offered */}
        <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Total Volume (KGs)</span>
            <div className="text-3xl font-extrabold text-emerald-800">{totalKgs.toLocaleString()} Kgs</div>
            <span className="text-[11px] text-slate-500">Based on standard weight multipliers</span>
          </div>
          <div className="p-3 bg-emerald-100 rounded-lg text-emerald-850">
            <ArrowDownCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Info card regarding standard density */}
        <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-5 shadow-xs flex-col flex justify-center text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800 font-semibold mb-1 block">Castor Seed Sowing Standards</strong>
          Trinity Verd Limited issues seeds in standard 25Kg sacks. Approx. 2.5 Kgs are needed per acre. Distributed sacks enable corresponding tracking of projected harvest yields later in the season.
        </div>
      </div>

      {isAdding ? (
        /* Form to record standard seed delivery */
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm max-w-2xl">
          <div className="pb-4 border-b border-slate-100 mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">
                Record New Seed Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Liaise with registered farmer members to dispatch certified high-yield seeds.
              </p>
            </div>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 font-mono"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              
              {/* Select Farmer */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block">Select Registered Farmer</label>
                {farmers.length === 0 ? (
                  <div className="text-xs text-rose-500 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                    No registered farmers in database. Form locked. Go to enrollment registry tab and recruit a member first!
                  </div>
                ) : (
                  <select
                    value={selectedFarmerId}
                    onChange={e => setSelectedFarmerId(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-sans"
                    required
                  >
                    <option value="">-- Choose Farmer Profile from Kitui --</option>
                    {farmers.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.fullName} (CID: {f.id} • Ward: {f.ward} • ID: {f.idNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sacks Given */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Number of Sacks Given</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={sacksGiven}
                  onChange={e => setSacksGiven(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-sans"
                  required
                />
              </div>

              {/* KG Multiplier */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Kgs per Sack (Multiplier)</label>
                <input
                  type="number"
                  min="1"
                  value={kgPerSack}
                  onChange={e => setKgPerSack(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-sans"
                  required
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  Calculated: <strong>{sacksGiven * kgPerSack} Total Kgs</strong> offered to farmer.
                </span>
              </div>

              {/* Date Offered */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Date Dispatched
                </label>
                <input
                  type="date"
                  value={dateOffered}
                  onChange={e => setDateOffered(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-sans"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-slate-50">
              <button
                type="submit"
                disabled={farmers.length === 0}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50"
              >
                Distribute Sacks
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Logs display */
        <div className="space-y-4">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search distributions by farmer name or date..."
              className="w-full border border-slate-200 bg-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-emerald-600 font-sans text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Farmer Name & Target</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Sacks Distributed</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Offered Volume (KGs)</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Dispatch Date</th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-150">
                  {filteredDistributions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                        No seed distribution histories correspond to that search query.
                      </td>
                    </tr>
                  ) : (
                    filteredDistributions.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className="font-semibold text-slate-900 text-sm block">{item.farmerName}</span>
                            <span className="text-xs text-slate-400 font-mono">MEMBER ID: {item.farmerId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                            <Sprout className="h-3 w-3 text-amber-600" />
                            {item.sacksGiven} Sacks
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold font-mono text-xs text-slate-800">
                          {item.kgsOffered} Kgs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {item.dateOffered}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <button
                            id={`delete-dist-${item.id}`}
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this distribution entry?')) {
                                onDeleteDistribution(item.id);
                              }
                            }}
                            className="p-1 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3.5" />
                            Remove
                          </button>
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

    </div>
  );
}
