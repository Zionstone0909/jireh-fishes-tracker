import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, Input, BackButton, Table, Badge, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import { DollarSign, Save, UserCheck, Search, History, Loader2 } from 'lucide-react';
import { Expense } from '../types';

export const BankDeposit = ({ onBack }: { onBack?: () => void }) => {
  // addExpense should handle the API POST and updating the global 'expenses' state
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

  // Filtering global expenses for DEPOSITS 
  // This updates automatically when addExpense is called
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
      // Map form to the API structure
      const depositData: Omit<Expense, 'id'> = {
        type: 'DEPOSIT',
        date: formData.date,
        category: 'Income', // Default category for deposits
        description: formData.description,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        status: 'Paid',
        recordedByName: user?.name || 'Admin'
      };

      // This call updates the Database via API and then updates the AppContext state
      await addExpense(depositData);
      
      // Clear specific form fields but keep the date for convenience
      setFormData({
        ...formData,
        amount: '',
        description: '',
        reference: '',
      });

      alert('Deposit successfully synchronized with company expenses.');
    } catch (err: any) {
      alert(`Sync Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton onClick={onBack} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bank Deposit Registry</h1>
          <p className="text-sm font-medium text-slate-500">Document income and capital inflows to the business account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORM SECTION */}
          <div className="lg:col-span-1">
            <Card className="p-4 sm:p-6 border-t-4 border-t-emerald-500 shadow-xl sticky top-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-black text-xs text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        New Inflow Entry
                    </h3>

                    <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                    <Input label="Amount (₦)" type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
                    <Input label="Description / Source" placeholder="Daily Sales, Capital, etc." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                    <Select label="Payment Mode" value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash Deposit">Cash Deposit</option>
                        <option value="POS Collection">POS Collection</option>
                        <option value="Check">Check</option>
                    </Select>
                    <Input label="Reference / Slip #" placeholder="Optional receipt ID" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} />

                    <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 mt-4 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Record Deposit</>}
                    </Button>
                </form>
            </Card>
          </div>

          {/* HISTORY TABLE SECTION */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border-0 shadow-lg">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                    <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-400" /> Recent Deposits
                    </h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input placeholder="Search logs..." className="pl-10 w-full rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <Table headers={['Date', 'Description', 'Reference', 'Amount', 'Method', 'Logged By']}>
                        {deposits.map(deposit => (
                            <tr key={deposit.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                                <td className="px-6 py-4 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase">
                                  {new Date(deposit.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-900">{deposit.description}</td>
                                <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                  {deposit.reference || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-emerald-600 whitespace-nowrap">
                                  ₦{Number(deposit.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge color="green">{deposit.paymentMethod}</Badge>
                                </td>
                                <td className="px-6 py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                        <UserCheck className="w-3 h-3" />
                                        <span>{deposit.recordedByName || 'System'}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {deposits.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-16 text-center text-slate-300 font-bold uppercase tracking-widest italic text-xs">
                                No bank deposits documented.
                              </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </Card>
          </div>
      </div>
    </div>
  );
};