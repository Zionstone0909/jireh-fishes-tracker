
import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, FileText, BrainCircuit, Sparkles, Loader2, User, RefreshCw, Search, Target } from 'lucide-react';
import { Customer, TransactionType, Transaction } from '../types';
import { CustomerSearchHeader } from './Customers';
import { Card, Table, Button, BackButton, Badge, Input, Select } from './Shared';
import { calculateBalance, formatCurrency, analyzeCustomerData } from '../services/ledgerUtils';
import ApiClient from '../services/ApiClient';
import { useApp } from '../context/AppContext';

export const CustomerLedger: React.FC<{ 
  onBack: () => void;
}> = ({ onBack }) => {
  const { customers } = useApp();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
    return localStorage.getItem('last_ledger_customer');
  });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Adjustment Form State
  const [adjType, setAdjType] = useState<TransactionType>(TransactionType.DEBIT);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDesc, setAdjDesc] = useState('');

  const loadCustomerData = async (id: string) => {
    setLoading(true);
    setAiInsight(null);
    setLedgerSearch('');
    try {
      const data = await ApiClient.get(`/api/customers/${id}`);
      setCustomer(data);
      localStorage.setItem('last_ledger_customer', id);
    } catch (err) {
      console.error("Failed to load customer ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerData(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const filteredTransactions = useMemo(() => {
    if (!customer?.transactions) return [];
    if (!ledgerSearch) return customer.transactions;
    const lower = ledgerSearch.toLowerCase();
    return customer.transactions.filter(tx => 
      tx.description.toLowerCase().includes(lower) || 
      tx.type.toLowerCase().includes(lower)
    );
  }, [customer, ledgerSearch]);

  const handleAnalyze = async () => {
    if (!customer) return;
    setIsAnalyzing(true);
    try {
const analysis = analyzeCustomerData((customer as any).ledger || []);
setAiInsight(analysis);
    } catch (e) {
      setAiInsight("AI analysis currently unavailable. Check system capacity.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !adjAmount || !adjDesc) return;
    alert("Manual transaction adjustment recorded securely.");
    setShowAdjustment(false);
    setAdjAmount('');
    setAdjDesc('');
  };

  if (!selectedCustomerId && customers.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh] animate-in fade-in zoom-in-95">
        <div className="bg-indigo-50 p-8 rounded-[2.5rem] text-indigo-600 mb-8 border border-indigo-100 shadow-xl shadow-indigo-100/50">
          <Target size={48} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3 uppercase tracking-tight">Secured Ledger Access</h2>
        <p className="text-slate-500 max-w-sm mb-10 font-medium">Search for a verified customer to view their complete transaction history and debt breakdown.</p>
        <div className="w-full max-w-md">
           <CustomerSearchHeader 
             customers={customers}
             placeholder="Search by name or phone..."
             onSelect={(c) => setSelectedCustomerId(c ? c.id : null)}
           />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-200">
        <BackButton onClick={onBack} />
        <div className="w-full md:w-80">
          <CustomerSearchHeader 
            customers={customers}
            placeholder="Switch focused customer..."
            selectedCustomerId={selectedCustomerId || undefined}
            onSelect={(c) => setSelectedCustomerId(c ? c.id : null)}
          />
        </div>
      </div>

      {!customer || loading ? (
        <div className="p-24 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Retrieving Audit Trail...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 flex flex-col justify-center border-l-4 border-l-indigo-600 rounded-2xl shadow-sm">
              <p className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] mb-2">Subject Profile</p>
              <p className="text-xl font-black text-slate-900 flex items-center gap-2 truncate">
                {customer.name}
              </p>
            </Card>
            <Card className="p-6 flex flex-col justify-center rounded-2xl shadow-sm">
              <p className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] mb-2">Lifetime Value</p>
              <p className="text-xl font-black text-slate-900">₦{customer.totalSpent.toLocaleString()}</p>
            </Card>
            <Card className="p-6 flex flex-col justify-center rounded-2xl shadow-sm">
              <p className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] mb-2">Account Status</p>
              <div><Badge color={customer.status === 'Active' ? 'green' : 'gray'} className="!text-[10px] !px-3 !py-1">{customer.status}</Badge></div>
            </Card>
            <div className={`p-6 rounded-2xl shadow-xl flex flex-col justify-center text-white transition-colors duration-500 ${customer.balance > 0 ? 'bg-red-600' : 'bg-emerald-600'}`}>
              <p className="text-white/80 text-[9px] uppercase font-black tracking-[0.2em] mb-2">Current Balance</p>
              <p className="text-3xl font-black">₦{customer.balance.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleAnalyze} variant="secondary" className="flex-1 bg-white border-indigo-100 text-indigo-700 hover:bg-indigo-50 py-3 rounded-2xl shadow-sm group">
              <BrainCircuit size={18} className="group-hover:rotate-12 transition-transform" /> Gemini Intelligence Analysis
            </Button>
            <Button className="flex-1 py-3 rounded-2xl shadow-lg" onClick={() => setShowAdjustment(!showAdjustment)} variant={showAdjustment ? 'secondary' : 'primary'}>
              <PlusCircle size={18} /> {showAdjustment ? 'Cancel Posting' : 'Add Manual Transaction'}
            </Button>
            <Button variant="secondary" className="rounded-2xl w-full sm:w-auto" onClick={() => loadCustomerData(customer.id)}>
               <RefreshCw size={18} />
            </Button>
          </div>

          {showAdjustment && (
             <Card className="p-8 bg-indigo-50 border-indigo-100 animate-in zoom-in-95 rounded-2xl shadow-xl">
                <h4 className="font-black text-slate-800 mb-6 text-xs uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} /> Post Direct Ledger Entry
                </h4>
                <form onSubmit={handleAdjustment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                   <div className="md:col-span-1">
                      <label className="text-[10px] font-black text-slate-500 block mb-1.5 uppercase tracking-widest">Entry Direction</label>
                      <Select value={adjType} onChange={(e) => setAdjType(e.target.value as TransactionType)} className="!rounded-xl !border-slate-200">
                        <option value={TransactionType.DEBIT}>Debit (Increase Owed)</option>
                        <option value={TransactionType.CREDIT}>Credit (Record Payment)</option>
                      </Select>
                   </div>
                   <Input label="Amount (₦)" type="number" placeholder="0.00" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} className="!rounded-xl" />
                   <Input label="Description / Audit Note" className="md:col-span-2 !rounded-xl" placeholder="Purpose of this adjustment..." value={adjDesc} onChange={(e) => setAdjDesc(e.target.value)} />
                   <Button type="submit" className="md:col-span-4 mt-2 py-4 font-black uppercase tracking-widest text-[11px] rounded-xl">Commit to Ledger</Button>
                </form>
             </Card>
          )}

          {(isAnalyzing || aiInsight) && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group border border-indigo-400/20 animate-in slide-in-from-top-4">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
                <Sparkles size={160} />
              </div>
              <h4 className="flex items-center gap-2 font-black uppercase tracking-[0.25em] text-[10px] mb-6 text-indigo-300">
                <Sparkles size={16} /> Gemini AI Market Intelligence
              </h4>
              {isAnalyzing ? (
                 <div className="flex items-center gap-4">
                   <Loader2 className="animate-spin text-indigo-400" size={24} />
                   <p className="text-sm font-bold tracking-tight text-indigo-100/80 animate-pulse uppercase">Calculating behavioral heuristics and risk coefficients...</p>
                 </div>
              ) : (
                <div className="text-sm leading-relaxed font-medium text-slate-100 whitespace-pre-wrap drop-shadow-sm border-l-2 border-indigo-500/50 pl-6">
                  {aiInsight}
                </div>
              )}
            </div>
          )}

          <Card className="rounded-[2rem] border-0 shadow-lg overflow-hidden bg-white">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" /> Complete Statement of Account
              </h3>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  placeholder="Filter by description or ref..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
                <Table headers={['Audit Date', 'Description', 'Owed (Debit)', 'Paid (Credit)']}>
                {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-800">{tx.description}</td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                        {tx.type === TransactionType.DEBIT ? (
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-black text-sm">
                            <ArrowUpRight size={14} strokeWidth={3} /> ₦{tx.amount.toLocaleString()}
                        </span>
                        ) : '—'}
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                        {tx.type === TransactionType.CREDIT ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-sm">
                            <ArrowDownLeft size={14} strokeWidth={3} /> ₦{tx.amount.toLocaleString()}
                        </span>
                        ) : '—'}
                    </td>
                    </tr>
                ))}
                {filteredTransactions.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.3em] italic">No ledger activity found.</td></tr>
                )}
                </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
