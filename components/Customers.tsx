
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Role, Supplier, CustomerType } from '../types';
import { BackButton, Button, Card, Table, Badge, Input, Select } from './Shared';
import { 
  Plus, Mail, Phone, Search, X, 
  MapPin, LayoutList, UserPlus, Loader2,
  Check, Info
} from 'lucide-react';

export const CustomerSearchHeader = ({ 
  searchTerm, 
  setSearchTerm, 
  onAddClick,
  title = "Customers",
  customers = [],
  placeholder,
  onSelect,
  selectedCustomerId
}: { 
  searchTerm?: string; 
  setSearchTerm?: (val: string) => void; 
  onAddClick?: () => void;
  title?: string;
  customers?: (Customer | Supplier)[];
  placeholder?: string;
  onSelect?: (c: any) => void;
  selectedCustomerId?: string;
}) => {
  const [localTerm, setLocalTerm] = useState(searchTerm || '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedCustomerId) {
      if (!searchTerm) setLocalTerm('');
    } else {
      const found = customers.find(c => c.id === selectedCustomerId);
      if (found) setLocalTerm(found.name);
    }
  }, [selectedCustomerId, customers, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    const searchRef = wrapperRef;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalTerm(val);
    if (setSearchTerm) setSearchTerm(val);
    if (onSelect) setIsOpen(true);
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(localTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(localTerm))
  );

  return (
    <div className="relative w-full" ref={wrapperRef} style={{ zIndex: 50 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {setSearchTerm && !onSelect && <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">{title}</h1>}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input 
              placeholder={placeholder || `Search ${title.toLowerCase()}...`}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white"
              value={localTerm}
              onChange={handleSearch}
              onFocus={() => onSelect && setIsOpen(true)}
            />
            {localTerm && (
              <button 
                onClick={() => { setLocalTerm(''); if(setSearchTerm) setSearchTerm(''); if(onSelect) onSelect(null); }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {onAddClick && (
            <Button onClick={onAddClick} className="whitespace-nowrap w-full sm:w-auto font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-2xl shadow-lg shadow-indigo-100">
              <Plus className="w-4 h-4 mr-1" /> Register Entity
            </Button>
          )}
        </div>
      </div>
      {isOpen && onSelect && (
         <div 
           className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
           style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #f1f5f9', zIndex: 60 }}
         >
            {filtered.map(c => (
              <div 
                key={c.id} 
                className={`px-6 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors ${c.id === selectedCustomerId ? 'bg-indigo-50' : ''}`}
                onClick={() => {
                   onSelect(c);
                   setLocalTerm(c.name);
                   setIsOpen(false);
                }}
              >
                 <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{c.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone || 'No direct line'}</p>
                 </div>
                 {c.id === selectedCustomerId && <Check className="w-4 h-4 text-indigo-600" strokeWidth={3} />}
              </div>
            ))}
            {filtered.length === 0 && <div className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">No matches identified</div>}
         </div>
       )}
    </div>
  );
};

export const Customers = ({ onBack, onViewLedger }: { onBack: () => void, onViewLedger: (c: Customer) => void }) => {
  const { customers, addCustomer } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '',
    type: 'Retail' as CustomerType,
    initialBalance: 0,
    notes: '',
    status: 'Active' as const 
  });

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(s) || 
      (c.phone && c.phone.includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s))
    );
  }, [customers, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addCustomer({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        type: formData.type,
        notes: formData.notes,
        totalSpent: 0,
        balance: Number(formData.initialBalance),
        lastVisit: new Date().toISOString(),
        status: 'Active'
      });
      setFormData({ name: '', email: '', phone: '', address: '', type: 'Retail', initialBalance: 0, notes: '', status: 'Active' });
      setShowForm(false);
      alert('Client node synchronized successfully.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <BackButton onClick={onBack} />
           <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">Client Directory</h1>
           <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Consumer relations & balance tracking</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="w-full md:w-auto font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-100">
           {showForm ? <><X className="w-4 h-4 mr-1.5" /> Abort Form</> : <><Plus className="w-4 h-4 mr-1.5" /> Register Client</>}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 sm:p-10 bg-indigo-900 text-white shadow-3xl animate-in slide-in-from-top-10 relative overflow-hidden border-0">
          <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 pointer-events-none rotate-12"><UserPlus size={200} /></div>
          <div className="flex justify-between items-center mb-8 sm:mb-10 pb-4 sm:pb-6 border-b border-white/10">
            <h3 className="font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-indigo-300 text-[10px] sm:text-xs">Initialize New Client Node</h3>
            <button onClick={() => setShowForm(false)} className="hover:rotate-90 transition-transform p-2 text-white/50 hover:text-white"><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
                <Input label="FULL LEGAL IDENTITY" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="!bg-white/5 !border-white/10 !text-white !rounded-xl" placeholder="Ademola Adeyemi..." />
                <Input label="SECURED VOICE LINE" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="!bg-white/5 !border-white/10 !text-white !rounded-xl" placeholder="080..." />
                <Input label="COMMUNICATION EMAIL" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="!bg-white/5 !border-white/10 !text-white !rounded-xl" placeholder="client@domain.com" />
                
                <Select label="CUSTOMER TIER" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as CustomerType})} className="!bg-white/5 !border-white/10 !text-white !rounded-xl">
                    <option value="Retail">Retail Node (Walk-in)</option>
                    <option value="Wholesale">Wholesale Node (Bulk)</option>
                    <option value="Distributor">Regional Distributor</option>
                </Select>
                
                <Input label="INITIAL LEDGER BALANCE (₦)" type="number" value={formData.initialBalance} onChange={e => setFormData({...formData, initialBalance: Number(e.target.value)})} className="!bg-white/5 !border-white/10 !text-white !rounded-xl" placeholder="Outstanding debt if any..." />
                
                <div className="sm:col-span-2 lg:col-span-3">
                   <Input label="RESIDENTIAL / DELIVERY ADDRESS" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="!bg-white/5 !border-white/10 !text-white !rounded-xl" placeholder="Street, State, Nigeria..." />
                </div>
                
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-[9px] sm:text-[10px] font-black text-indigo-300 uppercase tracking-[0.25em] ml-2 mb-2 block">INTERNAL REGISTRY NOTES</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-white/20"
                    rows={3}
                    placeholder="Specific delivery instructions, payment history notes, or preferences..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} variant="success" className="w-full sm:w-64 py-4 sm:py-5 !rounded-xl sm:!rounded-2xl !bg-white !text-indigo-900 font-black shadow-2xl active:scale-95 transition-all">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Provision Client Node'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4 sm:p-0 overflow-hidden border-0 shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white ring-1 ring-slate-100">
        <div className="p-6 sm:p-8 border-b border-slate-50 bg-slate-50/30">
            <CustomerSearchHeader customers={customers} searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Filter by name, phone or email..." />
        </div>
        <div className="overflow-x-auto no-scrollbar">
            <Table headers={['Subject Identity', 'Tier', 'Contact Matrix', 'Book Value (Spent)', 'Account Status', 'Directives']}>
            {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                <td className="px-4 py-5 sm:px-8 sm:py-6 whitespace-nowrap">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-700 font-black border border-indigo-100 uppercase text-sm sm:text-base shadow-sm shrink-0">
                            {c.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                           <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight block truncate max-w-[150px] sm:max-w-none">{c.name}</span>
                           <span className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                              <MapPin size={10} /> {c.address || 'Location Unknown'}
                           </span>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-5 sm:px-8 sm:py-6">
                   <Badge color={c.type === 'Wholesale' ? 'purple' : c.type === 'Distributor' ? 'orange' : 'blue'}>{c.type || 'Retail'}</Badge>
                </td>
                <td className="px-4 py-5 sm:px-8 sm:py-6 text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">
                    <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-2 whitespace-nowrap"><Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400"/> {c.phone || 'N/A'}</span>
                        {c.email && <span className="flex items-center gap-2 text-[8px] sm:text-[10px] text-slate-400 font-medium tracking-tight lowercase truncate max-w-[120px] sm:max-w-none"><Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400"/> {c.email}</span>}
                    </div>
                </td>
                <td className="px-4 py-5 sm:px-8 sm:py-6">
                    <div className="flex flex-col">
                       <span className="font-black text-indigo-600 text-sm sm:text-base whitespace-nowrap tracking-tight">₦{(c.totalSpent || 0).toLocaleString()}</span>
                       <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest mt-1 ${c.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {c.balance > 0 ? `Owed: ₦${c.balance.toLocaleString()}` : 'Cleared'}
                       </span>
                    </div>
                </td>
                <td className="px-4 py-5 sm:px-8 sm:py-6">
                   <Badge color={(c.status || 'Active') === 'Active' ? 'green' : 'gray'} className="!px-3 !py-1 sm:!px-4 sm:!py-1.5">{c.status || 'Active'}</Badge>
                </td>
                <td className="px-4 py-5 sm:px-8 sm:py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                        {c.notes && (
                           <div className="group relative">
                              <Info className="w-4 h-4 text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
                              <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 uppercase tracking-widest leading-relaxed">
                                {c.notes}
                              </div>
                           </div>
                        )}
                        <Button variant="secondary" className="!py-2 !px-3 sm:!py-2.5 sm:!px-5 !text-[8px] sm:!text-[10px] font-black uppercase tracking-[0.2em] shadow-sm !rounded-xl sm:!rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all whitespace-nowrap" onClick={() => onViewLedger(c)}>
                        <LayoutList className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /> Ledger
                        </Button>
                    </div>
                </td>
                </tr>
            ))}
            {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] text-[10px]">Registry is clean</td></tr>
            )}
            </Table>
        </div>
      </Card>
    </div>
  );
};
