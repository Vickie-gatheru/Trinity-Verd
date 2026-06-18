import React, { useState } from 'react';
import { Farmer } from '../types';
import { KITUI_ADMIN_STRUCTURE } from '../sampleData';
import { Search, UserPlus, Trash2, Edit2, Check, UserCheck, Phone, MapPin, CreditCard, ChevronRight } from 'lucide-react';

interface FarmersListProps {
  farmers: Farmer[];
  onAddFarmer: (farmer: Omit<Farmer, 'id' | 'registeredAt'>) => void;
  onUpdateFarmer: (farmer: Farmer) => void;
  onDeleteFarmer: (id: string) => void;
}

export default function FarmersList({ farmers, onAddFarmer, onUpdateFarmer, onDeleteFarmer }: FarmersListProps) {
  // Navigation tabs or toggle state
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit mode state
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);

  // Form Field states for new/editing farmer
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [subCounty, setSubCounty] = useState(Object.keys(KITUI_ADMIN_STRUCTURE)[0]);
  const [ward, setWard] = useState(KITUI_ADMIN_STRUCTURE[Object.keys(KITUI_ADMIN_STRUCTURE)[0]][0]);
  const [county] = useState('Kitui'); // locked to Kitui County

  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle sub county selection change & update ward lists
  const handleSubCountyChange = (sc: string) => {
    setSubCounty(sc);
    const availableWards = KITUI_ADMIN_STRUCTURE[sc] || [];
    if (availableWards.length > 0) {
      setWard(availableWards[0]);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    // Essential validation
    if (!fullName.trim()) return setFormError('Farmer names are required.');
    if (!idNumber.trim() || idNumber.length < 6) return setFormError('Please enter a valid National ID number.');
    if (!phone.trim()) return setFormError('Phone number is required.');
    if (!village.trim()) return setFormError('Village of origin is required.');

    // Simple Kenyan phone format helper (+2547... or 07...)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    if (editingFarmer) {
      // Edit mode
      onUpdateFarmer({
        ...editingFarmer,
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
        phone: formattedPhone,
        village: village.trim(),
        subCounty,
        ward,
        county
      });
      setSuccessMessage(`Farmer details updated successfully for ${fullName}`);
      setEditingFarmer(null);
    } else {
      // Add mode
      onAddFarmer({
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
        phone: formattedPhone,
        village: village.trim(),
        subCounty,
        ward,
        county
      });
      setSuccessMessage(`New farmer registered successfully: ${fullName}`);
    }

    // Reset Form
    resetForm();
    
    // Auto-close form after a brief delay
    setTimeout(() => {
      setIsRegistering(false);
      setSuccessMessage('');
    }, 1500);
  };

  const resetForm = () => {
    setFullName('');
    setIdNumber('');
    setPhone('');
    setVillage('');
    const defaultSub = Object.keys(KITUI_ADMIN_STRUCTURE)[0];
    setSubCounty(defaultSub);
    setWard(KITUI_ADMIN_STRUCTURE[defaultSub][0]);
    setFormError('');
  };

  const handleStartEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFullName(farmer.fullName);
    setIdNumber(farmer.idNumber);
    setPhone(farmer.phone);
    setVillage(farmer.village);
    setSubCounty(farmer.subCounty);
    setWard(farmer.ward);
    setIsRegistering(true);
  };

  const handleCancelRegister = () => {
    setEditingFarmer(null);
    setIsRegistering(false);
    resetForm();
  };

  // Filtering Farmers
  const filteredFarmers = farmers.filter(f => {
    const q = searchQuery.toLowerCase();
    return (
      f.fullName.toLowerCase().includes(q) ||
      f.idNumber.includes(q) ||
      f.phone.includes(q) ||
      f.ward.toLowerCase().includes(q) ||
      f.subCounty.toLowerCase().includes(q) ||
      f.village.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header operations row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            Farmers Enrollment Registry
          </h2>
          <p className="text-xs text-slate-500">
            Enrolling new members and keeping updated registration files for castor oil growers in Kitui.
          </p>
        </div>

        {!isRegistering && (
          <button
            id="enroll-farmer-btn"
            onClick={() => { resetForm(); setIsRegistering(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-center"
          >
            <UserPlus className="h-4 w-4" />
            Recruit New Farmer
          </button>
        )}
      </div>

      {isRegistering ? (
        /* Dynamic form drawer context */
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm max-w-2xl">
          <div className="pb-4 border-b border-slate-100 mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">
                {editingFarmer ? 'Edit Member Registry' : 'Recruit & Register Farmer'}
              </h3>
              <p className="text-xs text-slate-500">
                Ensure ID details & mobile wallet number are perfectly correct for secure payout routing.
              </p>
            </div>
            <button
              onClick={handleCancelRegister}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 font-mono"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Success and Error Indicators */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold font-sans">
                Error Checklist: {formError}
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Names */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Full Names</label>
                <input
                  type="text"
                  placeholder="e.g. Grace Mukami Musyoka"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 placeholder-slate-400 font-sans"
                  required
                />
              </div>

              {/* National Citizen ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">National ID Number</label>
                <input
                  type="number"
                  placeholder="e.g. 28945032"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 placeholder-slate-400 font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>

              {/* Mobile Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Mobile Wallet Phone (MPesa)</label>
                <input
                  type="text"
                  placeholder="e.g. 0712345678 or +254..."
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 placeholder-slate-400 font-sans"
                  required
                />
              </div>

              {/* Village */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Village</label>
                <input
                  type="text"
                  placeholder="e.g. Kaveta / Mutomo East"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 placeholder-slate-400 font-sans"
                  required
                />
              </div>

              {/* Sub County */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Sub County</label>
                <select
                  value={subCounty}
                  onChange={e => handleSubCountyChange(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-sans"
                >
                  {Object.keys(KITUI_ADMIN_STRUCTURE).map(sc => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </div>

              {/* Ward */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Ward</label>
                <select
                  value={ward}
                  onChange={e => setWard(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-sans"
                >
                  {(KITUI_ADMIN_STRUCTURE[subCounty] || []).map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Locked County display */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">County (Locked Access)</label>
                <input
                  type="text"
                  value="Kitui County"
                  disabled
                  className="w-full border border-slate-100 bg-slate-50 text-slate-400 rounded-lg px-3 py-2 text-sm font-sans"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-slate-50">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                {editingFarmer ? 'Apply Updates' : 'Complete Recruitment'}
              </button>
              <button
                type="button"
                onClick={handleCancelRegister}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* Member list interactive table and search filters */
        <div className="space-y-4">
          
          {/* Filtering operations bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by full names, phone number, village, National ID, or ward..."
                className="w-full border border-slate-200 bg-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-emerald-600 font-sans text-slate-800 placeholder-slate-450"
              />
            </div>
            
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg px-4 py-2 text-xs flex items-center gap-1.5 text-emerald-800 font-medium">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>Registered Database: <strong>{farmers.length} Growers</strong> across Kitui county</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Farmer Profile / ID</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Contact Number</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Administration Area</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Registration Date</th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-150">
                  {filteredFarmers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                        No farmer profiles match your search criteria. Try a different keyword or recruit a new farmer.
                      </td>
                    </tr>
                  ) : (
                    filteredFarmers.map(farmer => (
                      <tr key={farmer.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100/75 flex items-center justify-center text-emerald-800 font-bold text-xs uppercase">
                              {farmer.fullName.split(' ').map(n => n[0]).join('').substring(0,2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">{farmer.fullName}</div>
                              <div className="text-xs text-slate-400 font-mono">ID: {farmer.idNumber} | CID: {farmer.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span className="font-mono">{farmer.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-xs text-slate-800 font-semibold">{farmer.village} Village</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                              <span>{farmer.ward} Ward, {farmer.subCounty}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {farmer.registeredAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              id={`edit-${farmer.id}`}
                              onClick={() => handleStartEdit(farmer)}
                              className="p-1 px-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors font-medium flex items-center gap-1 cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              id={`delete-${farmer.id}`}
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${farmer.fullName} from the registry?`)) {
                                  onDeleteFarmer(farmer.id);
                                }
                              }}
                              className="p-1 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-md transition-colors font-medium flex items-center gap-1 cursor-pointer"
                              title="Remove Farmer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
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
