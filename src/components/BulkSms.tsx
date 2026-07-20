import React, { useState } from 'react';
import { Farmer, SmsLog, SmsLogCreate, PricingRates } from '../types';
import { Send, Search, Check, Smartphone, Users, Trash2, HelpCircle, ArrowRight } from 'lucide-react';

interface BulkSmsProps {
  farmers: Farmer[];
  smsLogs: SmsLog[];
  pricing: PricingRates;
  onAddSmsLog: (sms: SmsLogCreate) => void;
  onClearLogs: () => void;
  privacyMode?: boolean;
}

export default function BulkSms({ farmers, smsLogs, pricing, onAddSmsLog, onClearLogs, privacyMode = false }: BulkSmsProps) {
  const [recipientScope, setRecipientScope] = useState<'all' | 'subcounty' | 'single'>('all');
  const [selectedSubCounty, setSelectedSubCounty] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState('');

  const [messageText, setMessageText] = useState('');
  const [searchLogQuery, setSearchLogQuery] = useState('');

  const [isSendingActive, setIsSendingActive] = useState(false);
  const [sendingProgress, setSendingProgress] = useState<string[]>([]);
  const [percentDone, setPercentDone] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Character calculation
  const charLength = messageText.length;
  const smsCount = Math.ceil(charLength / 160) || 1;

  // Set preset templates helper
  const handleApplyTemplate = (templateType: string) => {
    switch (templateType) {
      case 'seeds':
        setMessageText("Kumbukumbu kutoka Trinity Verd Ltd: Magunia ya mbegu mpya za castor yapo tayari kwa usambazaji katika ofisi za Ward yako ya Kitui County. Kubeba kitambulisho.");
        break;
      case 'prices':
        setMessageText(`Habari mkulima wa castor, Trinity Verd Limited Kitui tumesasisha bei ya kununua mbegu: Clean Castor Seeds hivi sasa ni KSh ${pricing.cleanSeedPerKg}/Kg na Husks ni KSh ${pricing.husksSeedPerKg}/Kg. Karibuni.`);
        break;
      case 'payout':
        setMessageText("Habari {Name}, Trinity Verd Limited imetuma malipo yako kwa uzalishaji wa kilo za castor kupitia MPESA. Asante sana kwa bidii yako.");
        break;
      case 'weather':
        setMessageText("Habari mkulima, Ofisi ya kilimo Kitui County inashauri kupanda kulingana na msimu wa mvua hivi karibuni. Tayarisha mashamba yako ya castor beans mapema.");
        break;
      default:
        break;
    }
  };

  // Safe Broadcast resolution
  const formatMobile = (phone: string) => {
    if (phone.startsWith('+')) return phone.slice(1);
    return phone;
  };

  const sendSmsThroughProxy = async (phone: string, message: string) => {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mobile: formatMobile(phone), message, sender_name: 'TRIN_VERD', response_type: 'json', service_id: 0 })
    });

    const result = await response.text();
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = result;
    }

    return {
      ok: response.ok,
      status: response.status,
      body: parsedResult
    };
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!messageText.trim()) {
      return setErrorMsg('Please write an SMS message content.');
    }

    // Identify target recipients
    let targets: Farmer[] = [];
    if (recipientScope === 'all') {
      targets = [...farmers];
    } else if (recipientScope === 'subcounty') {
      if (!selectedSubCounty) return setErrorMsg('Please specify a sub-county recipient target.');
      targets = farmers.filter(f => f.subCounty === selectedSubCounty);
    } else {
      if (!selectedFarmerId) return setErrorMsg('Please specify a particular farmer.');
      const chosen = farmers.find(f => f.id === selectedFarmerId);
      if (chosen) targets = [chosen];
    }

    if (targets.length === 0) {
      return setErrorMsg('Recipient group has zero active phone numbers.');
    }

    setIsSendingActive(true);
    setPercentDone(0);
    const logTrace: string[] = [`Initiating bulk alert queue for ${targets.length} targets...`];
    setSendingProgress(logTrace);

    let progressIndex = 0;
    let failedMessages = 0;

    for (const farmer of targets) {
      const personalizedMsg = messageText.replace(/{Name}/g, farmer.fullName);
      const result = await sendSmsThroughProxy(farmer.phone, personalizedMsg);

      const status = result.ok ? 'Delivered' : 'Failed';
      onAddSmsLog({
        recipientPhone: farmer.phone,
        recipientName: farmer.fullName,
        message: personalizedMsg,
        status
      });

      logTrace.push(
        result.ok
          ? `[SMS Sent] ${farmer.fullName} (${farmer.phone})`
          : `[SMS Failed] ${farmer.fullName} (${farmer.phone}) - ${JSON.stringify(result.body)}`
      );

      if (!result.ok) {
        failedMessages += 1;
      }

      progressIndex += 1;
      setSendingProgress([...logTrace]);
      setPercentDone(Math.round((progressIndex / targets.length) * 100));
    }

    setTimeout(() => {
      setIsSendingActive(false);
      setMessageText('');
      if (failedMessages === 0) {
        setSuccessMsg(`Bulk SMS successfully sent to ${targets.length} farmers.`);
      } else {
        setErrorMsg(`Sent ${targets.length - failedMessages} messages, but ${failedMessages} failed. Check logs.`);
      }
    }, 400);
  };

  // Filter sent logs list
  const filteredLogs = smsLogs.filter(log => {
    const q = searchLogQuery.toLowerCase();
    return (
      log.recipientName.toLowerCase().includes(q) ||
      log.recipientPhone.includes(q) ||
      log.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header element */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-sans">
          Bulk SMS Communications Suite
        </h2>
        <p className="text-xs text-slate-500">
          Direct bulk communication loop to deliver castor seed pricing, dispatch updates, and notifications targeting smallholders across Kitui.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SMS Draft form (Two-Column span on desktop) */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm font-sans pb-2 border-b border-slate-50 flex items-center gap-2">
            <Send className="h-4 w-4 text-emerald-700" />
            Compose Broadcast Message
          </h3>

          <form onSubmit={handleSendSms} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                Error Checklist: {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {/* Target Selectors */}
            <div className="space-y-3 p-4 bg-slate-50/50 rounded-lg border border-slate-150">
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider font-mono">Select Recipients Scope</label>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-650">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={recipientScope === 'all'}
                    onChange={() => setRecipientScope('all')}
                    className="accent-emerald-700"
                  />
                  All Registered Growers ({farmers.length})
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={recipientScope === 'subcounty'}
                    onChange={() => setRecipientScope('subcounty')}
                    className="accent-emerald-700"
                  />
                  Target Sub-county Wards
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={recipientScope === 'single'}
                    onChange={() => setRecipientScope('single')}
                    className="accent-emerald-700"
                  />
                  Single Target Farmer
                </label>
              </div>

              {/* Scope-specific filter views */}
              {recipientScope === 'subcounty' && (
                <div className="pt-2">
                  <select
                    value={selectedSubCounty}
                    onChange={e => setSelectedSubCounty(e.target.value)}
                    className="w-full max-w-sm border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    required
                  >
                    <option value="">-- Choose Target Kitui Sub-county --</option>
                    {Array.from(new Set(farmers.map(f => f.subCounty))).map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              )}

              {recipientScope === 'single' && (
                <div className="pt-2">
                  <select
                    value={selectedFarmerId}
                    onChange={e => setSelectedFarmerId(e.target.value)}
                    className="w-fit border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    required
                  >
                    <option value="">-- Choose Single Profile --</option>
                    {farmers.map(f => (
                      <option key={f.id} value={f.id}>{f.fullName} ({f.phone})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Presets and template indicators */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Quick Swahili / English Templates</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('seeds')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  🌱 Seeds Ready Alert
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('prices')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  💰 Pricing Update
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('payout')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  📱 MPesa Paid Confirm
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('weather')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  🌦️ Planting Weather
                </button>
              </div>
            </div>

            {/* Message Body Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <label>SMS Message Body</label>
                <span className="text-slate-400 font-mono">Variables allowed: <strong className="text-emerald-700 font-mono">{`{Name}`}</strong></span>
              </div>
              
              <textarea
                rows={4}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Andika ujumbe hapa mteja wako wa Kitui County... (Use {Name} variable to personalize message per farmer)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 placeholder-slate-400 font-sans"
              />
              
              <div className="flex justify-between items-center text-[11px] text-slate-450 font-mono">
                <span>Total Characters: <strong className="text-slate-800">{charLength}</strong></span>
                <span>Segment count: <strong className="text-slate-800">{smsCount} SMS segment</strong> (160 char limit each)</span>
              </div>
            </div>

            {/* Submission triggers */}
            <button
              type="submit"
              disabled={farmers.length === 0}
              className="px-4.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              Send Bulk SMS Broadcast
            </button>
          </form>
        </div>

        {/* Dynamic tips box */}
        <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1">
              <HelpCircle className="h-4 w-4 text-emerald-700" />
              Sms Broadcast Standards
            </h4>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>Personalization:</strong> Typing <code>{`{Name}`}</code> compiles dynamically for each recipient during transfer queue execution.
              </p>
              <p>
                <strong>Language Choice:</strong> High density farmer cohorts in Kitui County respond best to Swahili announcements for daily operations.
              </p>
              <p>
                <strong>Bulk Multipliers:</strong> Standard SMS costs KSh 1.00 per standard 160-char segment. This dashboard simulates actual gateway logs.
              </p>
            </div>
          </div>
          
          <div className="bg-slate-100 p-3 rounded-lg border text-xs text-slate-500 font-mono">
            <strong>Gateway Info:</strong>
            <span className="block mt-1">SenderID: TRIN_VERD</span>
            <span>API Handshake: ACTIVE</span>
          </div>
        </div>

      </div>

      {/* Dispatched logs viewer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchLogQuery}
              onChange={e => setSearchLogQuery(e.target.value)}
              placeholder="Search historical SMS log registry..."
              className="w-full border border-slate-200 bg-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-emerald-600 font-sans text-slate-800 placeholder-slate-400"
            />
          </div>

          {smsLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Clear Log History
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Recipient</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Message Contents</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Timestamp</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-150 text-slate-700 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">
                      No sent SMS records correspond to your query.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <strong className="text-slate-900 block font-semibold text-sm">{log.recipientName}</strong>
                          <span className="text-xs font-mono text-slate-400">
                            {privacyMode && log.recipientPhone.length > 6
                              ? `${log.recipientPhone.substring(0, 4)} *** *** ${log.recipientPhone.substring(log.recipientPhone.length - 3)}`
                              : log.recipientPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm whitespace-pre-wrap leading-relaxed text-slate-650">
                        "{log.message}"
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {log.sentAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                          <Check className="h-3 w-3 text-emerald-600" />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sending SMS progress overlay screen */}
      {isSendingActive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h4 className="font-extrabold text-sm font-sans tracking-wide uppercase text-slate-400">Gateway Alert Dispatch Queue</h4>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-305 text-slate-350">Progress: {percentDone}%</span>
                <span className="text-emerald-400 shrink-0 font-bold">{sendingProgress.length - 1} records sent</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${percentDone}%` }} />
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 text-xs font-mono text-emerald-300 max-h-48 overflow-y-auto space-y-1.5 flex flex-col justify-end">
              {sendingProgress.map((p, idx) => (
                <div key={idx} className="flex gap-1">
                  <span className="text-slate-600 text-[10px] select-none">[{idx}]</span>
                  <span className={idx === sendingProgress.length - 1 ? "text-amber-300" : ""}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
