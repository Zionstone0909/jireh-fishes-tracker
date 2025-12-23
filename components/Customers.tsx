
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Role, Supplier } from '../types';
import { BackButton, Button, Card, Table, Badge, Input } from './Shared';
import { 
  Plus, Mail, Phone, Search, X, 
  UserCheck, Trash2, MapPin, LayoutList, Building, Check 
} from 'lucide-react';

// Explicitly exported to resolve the "is not exported" build error from Vercel logs
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
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
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
        {setSearchTerm && !onSelect && <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{title}</h1>}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input 
              placeholder={placeholder || `Search ${title.toLowerCase()}...`}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white"
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
            <Button onClick={onAddClick} className="whitespace-nowrap w-full sm:w-auto font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-indigo-100">
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

const AddCustomerModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { addCustomer } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', status: 'Active' as const });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addCustomer({
        ...formData,
        totalSpent: 0,
        balance: 0,
        lastVisit: new Date().toISOString()
      });
      setFormData({ name: '', email: '', phone: '', status: 'Active' });
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-8 shadow-2xl rounded-[3rem] border-0 bg-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-black text-xs uppercase tracking-[0.25em] text-slate-800 flex items-center gap-3">
             <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600"><UserCheck className="w-5 h-5" /></div> Onboard Client
          </h3>
          <button onClick={onClose} className="hover:bg-slate-100 p-2.5 rounded-2xl transition-all text-slate-400 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="FULL IDENTITY" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="!rounded-2xl" placeholder="Full Legal Name" />
          <Input label="EMAIL CHANNEL" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="!rounded-2xl" placeholder="address@domain.com" />
          <Input label="VOICE LINE (PHONE)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="!rounded-2xl" placeholder="080 0000 0000" />
          <div className="flex gap-4 pt-6">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 py-4 !rounded-[1.5rem] !font-black !uppercase !tracking-widest !text-[10px]">Abort</Button>
            <Button type="submit" className="flex-1 py-4 !rounded-[1.5rem] !font-black !uppercase !tracking-widest !text-[10px] shadow-xl shadow-indigo-100" disabled={loading}>
              {loading ? "Syncing..." : "Provision Node"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const Customers = ({ onBack, onViewLedger }: { onBack: () => void, onViewLedger: (c: Customer) => void }) => {
  const { customers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(s) || 
      (c.phone && c.phone.includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s))
    );
  }, [customers, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <BackButton onClick={onBack} />
      <CustomerSearchHeader customers={customers} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAddClick={() => setShowAddModal(true)} />
      
      <Card className="overflow-hidden border-0 shadow-2xl rounded-[2.5rem] bg-white ring-1 ring-slate-100">
        <div className="overflow-x-auto no-scrollbar">
            <Table headers={['Subject Name', 'Contact Matrix', 'Cumulative Value', 'Status', 'Directives']}>
            {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-700 font-black border border-indigo-100 uppercase text-base shadow-sm">
                            {c.name.charAt(0)}
                        </div>
                        <span className="font-black text-slate-900 text-sm tracking-tight">{c.name}</span>
                    </div>
                </td>
                <td className="px-8 py-6 text-xs text-slate-500 font-bold uppercase tracking-widest">
                    <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400"/> {c.phone || 'N/A'}</span>
                        {c.email && <span className="flex items-center gap-2 text-[10px] text-slate-400 font-medium tracking-tight lowercase"><Mail className="w-3 h-3 text-slate-400"/> {c.email}</span>}
                    </div>
                </td>
                <td className="px-8 py-6 font-black text-indigo-600 text-base whitespace-nowrap tracking-tight">₦{(c.totalSpent || 0).toLocaleString()}</td>
                <td className="px-8 py-6"><Badge color={(c.status || 'Active') === 'Active' ? 'green' : 'gray'} className="!px-4 !py-1.5">{c.status || 'Active'}</Badge></td>
                <td className="px-8 py-6">
                    <Button variant="secondary" className="!py-2.5 !px-5 !text-[10px] font-black uppercase tracking-[0.2em] shadow-sm !rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all" onClick={() => onViewLedger(c)}>
                    <LayoutList className="w-4 h-4 mr-1.5" /> Statement
                    </Button>
                </td>
                </tr>
            ))}
            {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] text-[10px]">Registry is clean</td></tr>
            )}
            </Table>
        </div>
      </Card>
      <AddCustomerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};
