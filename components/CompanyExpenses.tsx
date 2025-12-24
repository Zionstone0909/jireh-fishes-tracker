
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import ApiClient from '../services/ApiClient';
import { Plus, Download, X, DollarSign, Search, History, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Expense } from '../types';

export const CompanyExpenses = ({ onBack }: { onBack?: () => void }) => {
  const { expenses, suppliers, addExpense, setExpenses } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const initialFormState: Partial<Expense> = {
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    category: 'Utilities',
    status: 'Paid',
    paymentMethod: 'Cash',
    amount: 0,
    description: '',
    reference: '',
    supplierId: ''
  };

  const [formData, setFormData] = usePersistentState<Partial<Expense>>('CompanyExpenses.formData', initialFormState);

  const totalExpenses = expenses.filter(e => e.type !== 'DEPOSIT').reduce((sum, item) => sum + item.amount, 0);
  const totalDeposits = expenses.filter(e => e.type === 'DEPOSIT').reduce((sum, item) => sum + item.amount, 0);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    setLoading(true);
    try {
      await addExpense(formData as any); 
      setFormData(initialFormState);
      alert('Node Transaction Logged.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <BackButton onClick={onBack} />
           <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Treasury Ledger</h1>
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Operational expenditure tracking</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <Card className="p-4 bg-red-50 border-red-100 flex-1 sm:w-48 text-center rounded-3xl">
                <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Outflow</p>
                <p className="text-lg font-black text-red-600">₦{totalExpenses.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-emerald-50 border-emerald-100 flex-1 sm:w-48 text-center rounded-3xl">
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Inflow</p>
                <p className="text-lg font-black text-emerald-600">₦{totalDeposits.toLocaleString()}</p>
            </Card>
        </div>
      </div>

      {/* TOP FORM: FULL WIDTH COMMAND CENTER */}
      <Card className="p-10 border-0 shadow-2xl relative overflow-hidden ring-1 ring-slate-100">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-600 opacity-40"></div>
          <form onSubmit={handleSubmit} className="space-y-10">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="p-3 bg-red-50 rounded-2xl text-red-600 shadow-sm"><DollarSign size={24} /></div> Post Operational Debit
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <Input label="Audit Date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                  <Select label="Fiscal Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      <option value="Utilities">Utilities</option>
                      <option value="Rent">Facility Rent</option>
                      <option value="Supplies">Staff Supplies</option>
                      <option value="Logistics">Logistics / Fuel</option>
                      <option value="Marketing">Growth / Marketing</option>
                  </Select>
                  <Input label="Net Amount (₦)" type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} required />
                  <Input label="Detail / Purpose" placeholder="Subject description..." value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                  
                  <div className="lg:col-span-4 flex justify-end">
                      <Button type="submit" disabled={loading} size="lg" className="w-full md:w-auto !bg-slate-900 !rounded-[1.5rem]">
                          {loading ? <Loader2 className="animate-spin" /> : 'Log Expenditure Node'}
                      </Button>
                  </div>
              </div>
          </form>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg animate-in slide-in-from-bottom-4 duration-700">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 justify-between items-center bg-white">
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest flex items-center gap-3">
                <History className="text-slate-400" /> Fiscal Timeline
            </h3>
            <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
                <input placeholder="Search audit trails..." className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
        </div>
        <div className="overflow-x-auto">
            <Table headers={['Date', 'Category', 'Description', 'Flux Sum', 'Status', 'Audit Agent']}>
                {filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-8 py-6"><Badge color={e.type === 'DEPOSIT' ? 'green' : 'red'}>{e.category}</Badge></td>
                        <td className="px-8 py-6 text-sm font-black text-slate-800 tracking-tight">{e.description}</td>
                        <td className={`px-8 py-6 text-base font-black ${e.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {e.type === 'DEPOSIT' ? '+' : '-'}₦{e.amount.toLocaleString()}
                        </td>
                        <td className="px-8 py-6"><Badge color="blue">{e.status}</Badge></td>
                        <td className="px-8 py-6 text-[10px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">{e.recordedByName || 'System'}</td>
                    </tr>
                ))}
            </Table>
        </div>
      </Card>
    </div>
  );
};
