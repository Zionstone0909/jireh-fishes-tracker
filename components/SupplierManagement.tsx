
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Supplier, Role } from '../types';
import { Card, Table, Button, Input, Badge, BackButton } from './Shared';
import { 
  Plus, Search, Building, Phone, Mail, 
  MapPin, LayoutList, UserPlus, Trash2, 
  ChevronDown, ChevronUp, AlertCircle, Check 
} from 'lucide-react';

export const SupplierManagement = ({ onBack, onViewLedger }: { onBack: () => void, onViewLedger: (s: Supplier) => void }) => {
  const { suppliers, supplierTransactions, addSupplier, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', 
    contactPerson: '', 
    email: '', 
    phone: '', 
    address: '',
    status: 'Active' as const 
  });

  const isAdmin = user?.role === Role.ADMIN;

  // Calculate balances for all suppliers
  const supplierBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    suppliers.forEach(s => balances[s.id] = 0);
    
    supplierTransactions.forEach(tx => {
      if (balances[tx.supplierId] !== undefined) {
        if (tx.type === 'SUPPLY' || tx.type === 'EXPENSE') {
          balances[tx.supplierId] += tx.amount; // We owe them
        } else if (tx.type === 'PAYMENT') {
          balances[tx.supplierId] -= tx.amount; // We paid them
        }
      }
    });
    return balances;
  }, [suppliers, supplierTransactions]);

  const filteredSuppliers = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return suppliers.filter(sup => 
        sup.name.toLowerCase().includes(s) || 
        (sup.phone && sup.phone.includes(s)) ||
        sup.contactPerson?.toLowerCase().includes(s)
    );
  }, [suppliers, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addSupplier(formData);
      setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Active' });
      setShowForm(false);
      alert('Supplier registered successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <BackButton onClick={onBack} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Supplier Management</h1>
          <p className="text-slate-500 text-sm font-medium">Register and track all vendors and goods providers.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="w-full md:w-auto font-black uppercase tracking-widest text-xs">
            {showForm ? 'Close Form' : <><Plus className="w-4 h-4 mr-2" /> Add New Supplier</>}
          </Button>
        )}
      </div>

      {showForm && isAdmin && (
        <Card className="p-6 bg-indigo-50 border-indigo-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <UserPlus size={16} /> Vendor Registration
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input 
              label="Business / Company Name" 
              placeholder="e.g. Premium Fish Feeds Ltd"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
            <Input 
              label="Contact Person" 
              placeholder="e.g. Mr. John Ade"
              value={formData.contactPerson} 
              onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
            />
            <Input 
              label="Phone Number" 
              placeholder="080..."
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
            />
            <Input 
              label="Email Address" 
              type="email"
              placeholder="vendor@example.com"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            <div className="lg:col-span-2">
              <Input 
                label="Physical Address" 
                placeholder="Warehouse location..."
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>
            <div className="lg:col-span-3 flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="w-full md:w-48 font-black uppercase tracking-widest text-xs py-3 shadow-lg">
                {loading ? 'Processing...' : 'Register Vendor'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden shadow-md border-0">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              placeholder="Search by company, name or phone..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Vendors: <span className="text-slate-900">{suppliers.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table headers={['Company Information', 'Contact', 'Outstanding Balance', 'Status', 'Actions']}>
            {filteredSuppliers.map(s => {
              const bal = supplierBalances[s.id] || 0;
              return (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black border border-indigo-100">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                          <MapPin size={10} /> {s.address || 'No address'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700">{s.contactPerson || 'N/A'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="p-1 bg-slate-100 rounded text-slate-500" title={s.phone}><Phone size={10} /></span>
                      <span className="p-1 bg-slate-100 rounded text-slate-500" title={s.email}><Mail size={10} /></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-black ${bal > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₦{bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      {bal > 0 ? 'Due for payment' : 'Cleared account'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={s.status === 'Active' ? 'green' : 'gray'}>{s.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="secondary" 
                      className="!py-1.5 !px-3 !text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all"
                      onClick={() => onViewLedger(s)}
                    >
                      <LayoutList size={14} /> Full Ledger
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <Building size={48} className="opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">No vendors match your search</p>
                  </div>
                </td>
              </tr>
            )}
          </Table>
        </div>
      </Card>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-white border-l-4 border-l-red-500 flex justify-between items-center shadow-sm">
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payables</p>
                  <h3 className="text-2xl font-black text-slate-900">
                    ₦{Object.values(supplierBalances).reduce((a, b) => a + (b > 0 ? b : 0), 0).toLocaleString()}
                  </h3>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                  <AlertCircle size={24} />
              </div>
          </Card>
          <Card className="p-6 bg-white border-l-4 border-l-emerald-500 flex justify-between items-center shadow-sm">
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prepaid / Credits</p>
                  <h3 className="text-2xl font-black text-slate-900">
                    ₦{Math.abs(Object.values(supplierBalances).reduce((a, b) => a + (b < 0 ? b : 0), 0)).toLocaleString()}
                  </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <Check size={24} />
              </div>
          </Card>
      </div>
    </div>
  );
};
