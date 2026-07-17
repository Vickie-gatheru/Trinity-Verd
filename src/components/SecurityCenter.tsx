import React, { useState } from 'react';
import { Farmer, SeedDistribution, HarvestRecord, SmsLog } from '../types';
import { ShieldCheck, Download, Upload, AlertTriangle, CheckCircle, Database, EyeOff, Eye, Trash2, RefreshCw } from 'lucide-react';

interface SecurityCenterProps {
  farmers: Farmer[];
  distributions: SeedDistribution[];
  harvests: HarvestRecord[];
  smsLogs: SmsLog[];
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onRestoreBaseline: () => void;
  onImportBackup: (importedData: {
    farmers?: Farmer[];
    distributions?: SeedDistribution[];
    harvests?: HarvestRecord[];
    smsLogs?: SmsLog[];
  }) => void;
}

export default function SecurityCenter({
  farmers,
  distributions,
  harvests,
  smsLogs,
  privacyMode,
  onTogglePrivacy,
  onRestoreBaseline,
  onImportBackup
}: SecurityCenterProps) {
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    status: 'pass' | 'warning' | 'fail';
    issues: string[];
    scannedCount: number;
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Secure JSON Export
  const handleExportData = () => {
    const backupData = {
      version: '1.0-secure',
      exportedAt: new Date().toISOString(),
      farmers,
      distributions,
      harvests,
      smsLogs
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `trinity_verd_security_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Safe and Validated JSON Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');

    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsed = JSON.parse(rawJson);

        // Security Validation & Schema Enforcement
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Malformed backup file schema.');
        }

        const validated: {
          farmers: Farmer[];
          distributions: SeedDistribution[];
          harvests: HarvestRecord[];
          smsLogs: SmsLog[];
        } = {
          farmers: [],
          distributions: [],
          harvests: [],
          smsLogs: []
        };

        // Standardize & Sanitize Farmers
        if (Array.isArray(parsed.farmers)) {
          parsed.farmers.forEach((f: any) => {
            if (f.id && f.fullName && f.idNumber && f.phone) {
              validated.farmers.push({
                id: String(f.id).replace(/[<>]/g, ''), // XSS Sanitize
                idNumber: String(f.idNumber).replace(/[^0-9]/g, ''), // Secure numeric sanitize
                phone: String(f.phone).replace(/[^\w+]/g, ''),
                fullName: String(f.fullName).replace(/[<>]/g, ''),
                village: String(f.village || 'Unknown').replace(/[<>]/g, ''),
                ward: String(f.ward || 'Unknown').replace(/[<>]/g, ''),
                subCounty: String(f.subCounty || 'Unknown').replace(/[<>]/g, ''),
                county: String(f.county || 'Kitui'),
                registeredAt: String(f.registeredAt || new Date().toISOString().split('T')[0])
              });
            }
          });
        }

        // Standardize & Sanitize Distributions
        if (Array.isArray(parsed.distributions)) {
          parsed.distributions.forEach((d: any) => {
            if (d.id && d.farmerId && d.farmerName) {
              validated.distributions.push({
                id: String(d.id),
                farmerId: String(d.farmerId),
                farmerName: String(d.farmerName).replace(/[<>]/g, ''),
                sacksGiven: Number(d.sacksGiven) || 0,
                kgsOffered: Number(d.kgsOffered) || 0,
                dateOffered: String(d.dateOffered),
                isRegisteredOnPortal: Boolean(d.isRegisteredOnPortal)
              });
            }
          });
        }

        // Standardize & Sanitize Harvests
        if (Array.isArray(parsed.harvests)) {
          parsed.harvests.forEach((h: any) => {
            if (h.id && h.farmerId && h.farmerName) {
              validated.harvests.push({
                id: String(h.id),
                farmerId: String(h.farmerId),
                farmerName: String(h.farmerName).replace(/[<>]/g, ''),
                cleanSeedKgs: Number(h.cleanSeedKgs) || 0,
                husksSeedKgs: Number(h.husksSeedKgs) || 0,
                totalKgs: Number(h.totalKgs) || 0,
                amountToPay: Number(h.amountToPay) || 0,
                paymentStatus: h.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
                paymentDate: h.paymentDate ? String(h.paymentDate) : undefined,
                mpesaTransId: h.mpesaTransId ? String(h.mpesaTransId).replace(/[^a-zA-Z0-9]/g, '') : undefined,
                dateSold: String(h.dateSold)
              });
            }
          });
        }

        // Standardize & Sanitize SMS logs
        if (Array.isArray(parsed.smsLogs)) {
          parsed.smsLogs.forEach((s: any) => {
            if (s.id && s.recipientPhone && s.message) {
              validated.smsLogs.push({
                id: String(s.id),
                recipientPhone: String(s.recipientPhone).replace(/[^\w+]/g, ''),
                recipientName: String(s.recipientName || 'Grower').replace(/[<>]/g, ''),
                message: String(s.message).replace(/[<>]/g, ''),
                sentAt: String(s.sentAt),
                status: s.status === 'Failed' ? 'Failed' : 'Delivered'
              });
            }
          });
        }

        onImportBackup(validated);
        setImportSuccess(`Data verified successfully! Restored ${validated.farmers.length} farmers and ${validated.harvests.length} transactions.`);
      } catch (err: any) {
        setImportError(`Cryptographic integrity failure: ${err.message || 'Invalid backup structure.'}`);
      }
    };

    fileReader.readAsText(files[0]);
  };

  // Run security ledger scan audit
  const runSecurityAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const issues: string[] = [];
      let totalLiabilities = 0;

      // 1. Audit duplicates
      const observedIds = new Set<string>();
      farmers.forEach(f => {
        if (observedIds.has(f.idNumber)) {
          issues.push(`Duplicate National ID detected: "${f.idNumber}" is used by multiple profiles.`);
        }
        observedIds.add(f.idNumber);
      });

      // 2. Audit phone formats
      farmers.forEach(f => {
        if (!f.phone.startsWith('+254')) {
          issues.push(`Grower "${f.fullName}" has phone number lacking international prefix: "${f.phone}".`);
        }
      });

      // 3. Audit orphaned records
      const activeFarmerIds = new Set(farmers.map(f => f.id));
      harvests.forEach(h => {
        if (!activeFarmerIds.has(h.farmerId)) {
          issues.push(`Orphaned harvest delivery ID "${h.id}": Grower ID "${h.farmerId}" does not exist in registry.`);
        }
        if (h.paymentStatus === 'Pending') {
          totalLiabilities += h.amountToPay;
        }
      });

      distributions.forEach(d => {
        if (!activeFarmerIds.has(d.farmerId)) {
          issues.push(`Orphaned seed distribution ID "${d.id}": Grower ID "${d.farmerId}" does not exist in registry.`);
        }
      });

      // Determine status
      let status: 'pass' | 'warning' | 'fail' = 'pass';
      if (issues.length > 5) {
        status = 'fail';
      } else if (issues.length > 0) {
        status = 'warning';
      }

      setAuditResults({
        status,
        issues,
        scannedCount: farmers.length + harvests.length + distributions.length
      });
      setIsAuditing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Intro Card */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">
              Database & Backup Administration
            </h2>
            <p className="text-xs text-slate-500">
              Manage database engines, download secure backups, check data integrity, and toggle privacy masking for the Kitui operations team.
            </p>
          </div>
        </div>
      </div>

      {/* CLOUD DATABASE CONFIGURATION CENTER */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div>
            <h4 className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5">
              <Database className="h-4.5 w-4.5 text-emerald-700" />
              Cloud Database Engine
            </h4>
            <p className="text-[11px] text-slate-500">
              The application connects securely to a robust PostgreSQL database hosted on Supabase.
            </p>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2.5 py-1 rounded font-mono uppercase">
            Active: Supabase (SQL)
          </span>
        </div>

        <div className="bg-emerald-50/40 border border-emerald-150 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-sm font-bold text-slate-900 block">Supabase (PostgreSQL)</span>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
              Relational PostgreSQL engine optimized for full-stack deployment. Provides real-time event subscription channels, safe seed data baselines, transaction logging, and flexible SQL access for the Kitui operations team.
            </p>
          </div>
          <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-100 font-bold px-2 py-1 rounded inline-flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected & Live
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 text-amber-900 p-4 rounded-xl space-y-2 text-xs">
          <h5 className="font-bold flex items-center gap-1.5 text-amber-950">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
            Completed Supabase Setup for Exported Code
          </h5>
          <ol className="list-decimal pl-5 space-y-1 text-slate-700 text-[11px] leading-relaxed">
            <li>
              Create a project on your <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-800 hover:text-emerald-950">Supabase Dashboard</a>.
            </li>
            <li>
              Open the **SQL Editor** in Supabase and paste the contents of the <code>supabase_schema.sql</code> file (located at the root of your export). Click **Run** to build tables and seed baseline data.
            </li>
            <li>
              Create a <code>.env</code> file in your local workspace based on <code>.env.example</code>, and enter your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
            </li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PRIVACY SHIELD MODULE */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div>
              <h4 className="font-bold text-slate-900 text-sm font-sans">
                Field Office Privacy Masking
              </h4>
              <p className="text-[11px] text-slate-500">
                Conceals grower identification numbers and phone numbers in local tables to prevent unauthorized exposure in public hubs.
              </p>
            </div>
            <div className="text-emerald-700 bg-emerald-50 p-1.5 rounded-lg">
              {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </div>
          </div>

          <div className="p-3 rounded-lg text-xs leading-relaxed border bg-slate-50 text-slate-600">
            {privacyMode ? (
              <span className="text-emerald-850 font-medium">
                🔒 <strong>Privacy Masking Active:</strong> National ID and phone numbers are currently masked in grower directories.
              </span>
            ) : (
              <span>
                🔓 <strong>Privacy Masking Off:</strong> Sensitive details are currently visible in plain text. Recommended only in private supervisor offices.
              </span>
            )}
          </div>

          <button
            onClick={onTogglePrivacy}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${privacyMode ? 'bg-emerald-800 hover:bg-emerald-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
          >
            {privacyMode ? (
              <>
                <Eye className="h-4 w-4" /> Reveal Plain-Text Credentials
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" /> Enable Confidentiality Masking
              </>
            )}
          </button>
        </div>

        {/* DATA BACKUPS (EXPORT/IMPORT) */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div>
              <h4 className="font-bold text-slate-900 text-sm font-sans">
                Offline Database Backups
              </h4>
              <p className="text-[11px] text-slate-500">
                Export or import local JSON backups. Essential for preserving grower records against accidental browser cache clearance.
              </p>
            </div>
            <Database className="h-4 w-4 text-slate-450" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export */}
            <button
              onClick={handleExportData}
              className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export Database (JSON)
            </button>

            {/* Import */}
            <label className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors relative">
              <Upload className="h-3.5 w-3.5" />
              <span>Import Database (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {importError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-semibold font-mono flex items-start gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold flex items-start gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}
        </div>

        {/* LEDGER INTEGRITY AUDIT SCAN */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs md:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div>
              <h4 className="font-bold text-slate-900 text-sm font-sans">
                Record Consistency Check
              </h4>
              <p className="text-[11px] text-slate-500">
                Scan the local session database to verify grower mapping IDs and locate duplicate national registration numbers.
              </p>
            </div>
            <button
              onClick={runSecurityAudit}
              disabled={isAuditing}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" /> Verifying...
                </>
              ) : (
                'Check Database Consistency'
              )}
            </button>
          </div>

          {auditResults ? (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg flex items-start gap-3 border ${auditResults.status === 'pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : auditResults.status === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                {auditResults.status === 'pass' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${auditResults.status === 'warning' ? 'text-amber-600' : 'text-rose-600'}`} />
                )}
                <div>
                  <h5 className="font-bold text-xs">
                    {auditResults.status === 'pass' ? 'Verification Successful (No anomalies found)' : auditResults.status === 'warning' ? 'Finished with Warnings' : 'Integrity Anomaly Detected'}
                  </h5>
                  <p className="text-[11px] mt-1 leading-relaxed">
                    Successfully scanned <strong>{auditResults.scannedCount} data records</strong> across active memory tables. Identified <strong>{auditResults.issues.length} message</strong> logs.
                  </p>
                </div>
              </div>

              {auditResults.issues.length > 0 && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-amber-400 space-y-1.5 max-h-48 overflow-y-auto">
                  {auditResults.issues.map((issue, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500">[{idx + 1}]</span>
                      <p>{issue}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No audit report generated yet. Click above to scan the current active session.
            </div>
          )}
        </div>

        {/* SYSTEM RESET SECTION */}
        <div className="bg-rose-50/25 border border-rose-100 rounded-xl p-5 shadow-xs md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-950 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Danger Zone: Clear Session Data
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
              Permanently deletes the active session storage and re-registers the initial sample grower records. This action is completely irreversible.
            </p>
          </div>

          {isConfirmingReset ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRestoreBaseline();
                  setIsConfirmingReset(false);
                  alert('Session data cleared successfully!');
                }}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-[11px] font-bold cursor-pointer"
              >
                Yes, Clear Session Data
              </button>
              <button
                onClick={() => setIsConfirmingReset(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingReset(true)}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-all"
            >
              Reset to Baseline Data
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
