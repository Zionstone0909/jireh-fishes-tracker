
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, Input, BackButton, Table, Badge, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import ApiClient from '../services/ApiClient';
import { DollarSign, Save, UserCheck, Search, History, Loader2 } from 'lucide-react';
import { Expense } from '../types';

export const BankDeposit = ({ onBack }: { onBack?: () => void }) => {
  const { addExpense, expenses, user } = useApp();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = usePersistentState('BankDeposit.formData', {
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    reference: '',
    paymentMethod: 'Bank Transfer'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const deposits = useMemo(() => {
    return expenses
      .filter(e => e.type === 'DEPOSIT')
      .filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (e.reference && e.reference.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    setLoading(true);
    try {
      const depositData: Omit<Expense, 'id'> = {
        type: 'DEPOSIT',
        date: formData.date,
        category: 'Income',
        description: formData.description,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        status: 'Paid',
        recordedByName: user?.name || 'Admin'
      };

      await addExpense(depositData);
      
      alert('Deposit recorded and synchronized.');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        reference: '',
        paymentMethod: 'Bank Transfer'
      });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <BackButton onClick={onBack} />
      <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Bank Deposit Registry</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Capital inflow documentation</p>
      </div>

      <Card className="p-10 border-0 shadow-2xl bg-white rounded-[3rem] relative overflow-hidden ring-1 ring-slate-100">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          <form onSubmit={handleSubmit} className="space-y-8">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 shadow-sm">
                      <DollarSign className="w-6 h-6" />
                  </div>
                  New Cash Inflow Entry
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Input label="AUDIT DATE" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="!rounded-2xl !py-3.5" />
                  <Input label="AMOUNT (₦)" type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required className="!rounded-2xl !py-3.5" />
                  <Select label="COLLECTION CHANNEL" value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="!rounded-2xl !py-3.5">
                      <option>Bank Transfer</option>
                      <option>Cash Deposit</option>
                      <option>POS Collection</option>
                      <option>Check</option>
                  </Select>
                  <div className="md:col-span-2 lg:col-span-1">
                      <Input label="DESCRIPTION / SOURCE" placeholder="Daily Sales, Capital, etc." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required className="!rounded-2xl !py-3.5" />
                  </div>
                  <Input label="REFERENCE / SLIP #" placeholder="Optional receipt ID" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="!rounded-2xl !py-3.5" />
                  
                  <div className="flex items-end">
                      <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-emerald-100 rounded-2xl active:scale-95 transition-all">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Commit Deposit</>}
                      </Button>
                  </div>
              </div>
          </form>
      </Card>

      <Card className="overflow-hidden border-0 shadow-xl rounded-[2.5rem] bg-white ring-1 ring-slate-50">
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/30">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <History className="w-5 h-5 text-slate-400" /> Recent Node Handshakes
              </h3>
              <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
                  <input placeholder="Search audit logs..." className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
          </div>
          
          <div className="overflow-x-auto no-scrollbar">
              <Table headers={['Audit Date', 'Subject Description', 'Log Reference', 'Amount Delta', 'Channel', 'Logged By']}>
                  {deposits.map(deposit => (
                      <tr key={deposit.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                          <td className="px-8 py-6 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">{new Date(deposit.date).toLocaleDateString()}</td>
                          <td className="px-8 py-6 text-sm font-black text-slate-800">{deposit.description}</td>
                          <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{deposit.reference || '-'}</td>
                          <td className="px-8 py-6 text-base font-black text-emerald-600 whitespace-nowrap tracking-tight">₦{deposit.amount.toLocaleString()}</td>
                          <td className="px-8 py-6 whitespace-nowrap"><Badge color="green" className="!px-3 !py-1">{deposit.paymentMethod}</Badge></td>
                          <td className="px-8 py-6 text-[10px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                  <UserCheck className="w-4 h-4" />
                                  <span>{deposit.recordedByName || 'System'}</span>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {deposits.length === 0 && (
                      <tr><td colSpan={6} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-[0.5em] text-[10px]">Registry is empty</td></tr>
                  )}
              </Table>
          </div>
      </Card>
    </div>
  );
};
