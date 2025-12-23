
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import { Search, Check, Building, ArrowUpRight, ArrowDownLeft, LayoutList, PlusCircle, Package, FileText, DollarSign, Loader2, X } from 'lucide-react';
import { Supplier, Role } from '../types';

export const SupplierLedger = ({ onBack }: { onBack: () => void }) => {
  const { suppliers, products, supplierTransactions, receiveStock, addSupplierPayment, addSupplierFee, user } = useApp();
  
  const [selectedSupplier, setSelectedSupplier] = usePersistentState<Supplier | null>('SupplierLedger.selectedSupplier', null);
  const isAdmin = user?.role === Role.ADMIN;
  
  const [activeTab, setActiveTab] = usePersistentState<'history' | 'transaction'>('SupplierLedger.activeTab', 'history');
  const [txType, setTxType] = usePersistentState<'STOCK' | 'EXPENSE' | 'PAYMENT'>('SupplierLedger.txType', 'STOCK');

  const [searchTerm, setSearchTerm] = usePersistentState('SupplierLedger.searchTerm', '');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [startDate, setStartDate] = usePersistentState('SupplierLedger.startDate', (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
  })());
  const [endDate, setEndDate] = usePersistentState('SupplierLedger.endDate', (() => new Date().toISOString().split('T')[0])());
  const [tableSearch, setTableSearch] = usePersistentState('SupplierLedger.tableSearch', '');
  
  const [stockItem, setStockItem] = usePersistentState('SupplierLedger.stockItem', { productId: '', quantity: '', cost: '' });
  const [paymentData, setPaymentData] = usePersistentState('SupplierLedger.paymentData', { amount: '', method: 'Bank Transfer', reference: '' });
  const [expenseData, setExpenseData] = usePersistentState('SupplierLedger.expenseData', { description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAdmin) {
      return (
        <div className="space-y-6">
            <BackButton onClick={onBack} />
            <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-red-200 bg-red-50">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-900">Access Restricted</h3>
                <p className="text-red-600 max-w-sm mt-1">This page is restricted to administrators only.</p>
            </Card>
        </div>
      );
  }

  const filteredDropdown = searchTerm ? suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : suppliers;

  const allTransactions = useMemo(() => {
      if (!selectedSupplier) return [];
      return supplierTransactions.filter(t => t.supplierId === selectedSupplier.id);
  }, [supplierTransactions, selectedSupplier]);

  const stats = useMemo(() => {
    if (!selectedSupplier) return { debit: 0, credit: 0 };
    let debit = 0; // Owed to supplier (Stock Inflow / Expense)
    let credit = 0; // Paid to supplier
    allTransactions.forEach(t => {
        if (t.type === 'SUPPLY' || t.type === 'EXPENSE') {
            debit += t.amount;
        } else if (t.type === 'PAYMENT') {
            credit += t.amount;
        }
    });
    return { debit, credit };
  }, [allTransactions, selectedSupplier]);

  const balance = useMemo(() => {
      return stats.debit - stats.credit;
  }, [stats]);

  const filteredTransactions = useMemo(() => {
     let data = allTransactions;

     data = data.filter(t => {
        const d = t.date.includes('T') ? t.date.split('T')[0] : t.date;
        return d >= startDate && d <= endDate;
     });

     if (tableSearch) {
        const lower = tableSearch.toLowerCase();
        data = data.filter(t => 
            t.description.toLowerCase().includes(lower) || 
            t.type.toLowerCase().includes(lower) ||
            (t.reference || '').toLowerCase().includes(lower) ||
            (t.items?.some(it => it.productName.toLowerCase().includes(lower)))
        );
     }

     return data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions, startDate, endDate, tableSearch]);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSupplier) return;
      
      setIsSubmitting(true);
      try {
        if (txType === 'STOCK') {
            if (!stockItem.productId || !stockItem.quantity || !stockItem.cost) {
                alert('Please fill all stock fields.');
                return;
            }
            await receiveStock(selectedSupplier.id, [{ 
                productId: stockItem.productId, 
                quantity: parseFloat(stockItem.quantity), 
                cost: parseFloat(stockItem.cost) 
            }]);
        } else if (txType === 'EXPENSE') {
            if (!expenseData.amount || !expenseData.description) {
                 alert('Please fill all expense fields.');
                 return;
            }
            // FLOW TO MASTER EXPENSES: Log as supplier fee
            await addSupplierFee({
                supplierId: selectedSupplier.id,
                supplierName: selectedSupplier.name,
                date: expenseData.date,
                amount: Number(expenseData.amount),
                description: expenseData.description
            });
        } else if (txType === 'PAYMENT') {
            if (!paymentData.amount) {
                alert('Please enter an amount.');
                return;
            }
            // FLOW TO MASTER EXPENSES: Log as supplier payment
            await addSupplierPayment({
                supplierId: selectedSupplier.id,
                supplierName: selectedSupplier.name,
                date: new Date().toISOString().split('T')[0],
                amount: Number(paymentData.amount),
                reference: paymentData.reference,
                description: `Settlement via ${paymentData.method}`,
                paymentMethod: paymentData.method
            });
        }

        setActiveTab('history');
        setStockItem({ productId: '', quantity: '', cost: '' });
        setPaymentData({ amount: '', method: 'Bank Transfer', reference: '' });
        setExpenseData({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
        alert('Transaction processed successfully and recorded in company expenses.');
      } catch (err: any) {
        console.error("Transaction failed:", err);
        alert(`Error: Failed to process transaction. ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BackButton onClick={onBack} />
      <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Supplier Ledger</h1>
      <Card>
          <div className="p-4 sm:p-6 border-b flex flex-col md:flex-row gap-4 items-end bg-slate-50 rounded-t-lg">
              <div className="flex-1 w-full relative" ref={searchRef}>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Focus Supplier</label>
                  <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                        placeholder="Type to search supplier..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setIsFocused(true); }}
                        onFocus={() => setIsFocused(true)}
                      />
                      {isFocused && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                            {filteredDropdown.map(s => (
                                <div 
                                    key={s.id} 
                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                    onClick={() => {
                                        setSelectedSupplier(s);
                                        setSearchTerm(s.name);
                                        setIsFocused(false);
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-900">{s.name}</span>
                                        {selectedSupplier?.id === s.id && <Check className="w-4 h-4 text-emerald-600" />}
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.contactPerson} • {s.email}</p>
                                </div>
                            ))}
                            {filteredDropdown.length === 0 && (
                                <div className="px-4 py-3 text-xs text-slate-400 font-bold uppercase text-center">No matches</div>
                            )}
                        </div>
                      )}
                  </div>
              </div>
          </div>

          {selectedSupplier ? (
             <div className="overflow-hidden">
                <div className="p-4 sm:p-6 bg-white border-b border-slate-100">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex items-center gap-4 min-w-[200px]">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl sm:text-2xl font-black text-indigo-600 border border-indigo-100 shrink-0">
                                {selectedSupplier.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-black text-slate-900 break-words tracking-tight">{selectedSupplier.name}</h2>
                                <div className="flex flex-col text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="truncate">{selectedSupplier.contactPerson}</span>
                                    <span>{selectedSupplier.phone}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Stock Inflow (Debt)</span>
                                <span className="text-lg font-black text-red-600 flex items-center gap-1">
                                    <ArrowUpRight className="w-4 h-4" /> ₦{stats.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Settled / Payments</span>
                                <span className="text-lg font-black text-emerald-600 flex items-center gap-1">
                                    <ArrowDownLeft className="w-4 h-4" /> ₦{stats.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col col-span-2 lg:col-span-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Owed to Vendor</span>
                                <span className={`text-xl sm:text-2xl font-black ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] font-black uppercase text-slate-300">
                                    {balance > 0 ? 'Payment outstanding' : 'Account fully paid'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-slate-200 overflow-x-auto bg-slate-50 px-4">
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutList className="w-4 h-4" /> Ledger History
                    </button>
                    <button 
                        onClick={() => setActiveTab('transaction')}
                        className={`px-4 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'transaction' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <PlusCircle className="w-4 h-4" /> Add Transaction
                    </button>
                </div>

                {activeTab === 'history' ? (
                    <div className="animate-in fade-in duration-300">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end w-full lg:w-auto">
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <div className="flex flex-col gap-1 w-full">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</span>
                                        <input 
                                            type="date" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</span>
                                        <input 
                                            type="date" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="relative w-full lg:w-64">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input 
                                    placeholder="Filter logs..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table headers={['Date', 'Type', 'Description', 'Items Brought', 'Credit (Paid)', 'Debit (Debt)', 'Initiated By']}>
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge color={t.type === 'PAYMENT' ? 'green' : t.type === 'SUPPLY' ? 'blue' : 'yellow'}>
                                                {t.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800 min-w-[150px]">{t.description}</td>
                                        <td className="px-6 py-4 text-[10px] text-slate-500 font-bold uppercase tracking-tight min-w-[150px]">
                                            {t.items && t.items.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {t.items.map((i, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <span className="text-indigo-600">{i.quantity}x</span>
                                                            <span className="truncate">{i.productName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (t.reference || '—')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-emerald-600 whitespace-nowrap text-right">
                                            {t.type === 'PAYMENT' ? `₦${t.amount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-red-600 whitespace-nowrap text-right">
                                            {t.type !== 'PAYMENT' ? `₦${t.amount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-black text-indigo-600 whitespace-nowrap uppercase tracking-widest">
                                            {t.initiatedByName || 'System'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-300 font-bold uppercase tracking-widest italic text-xs">No records found for selected period.</td>
                                    </tr>
                                )}
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6 animate-in zoom-in-95 duration-300">
                        <div className="lg:col-span-1">
                            <Card className="p-4 sm:p-6 h-full border-t-4 border-t-indigo-600 shadow-xl">
                                <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
                                    <PlusCircle size={16} className="text-indigo-600" /> Post New Entry
                                </h3>
                                <form onSubmit={handleTransactionSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category</label>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setTxType('STOCK')}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'STOCK' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    Receive Stock
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTxType('EXPENSE')}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'EXPENSE' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    Other Fee
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setTxType('PAYMENT')}
                                                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'PAYMENT' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                Register Payment
                                            </button>
                                        </div>
                                    </div>

                                    {txType === 'STOCK' && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2">
                                            <Select
                                                label="SKU / PRODUCT"
                                                value={stockItem.productId}
                                                onChange={(e) => setStockItem({...stockItem, productId: e.target.value})}
                                                required
                                            >
                                                <option value="">Choose item...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</option>)}
                                            </Select>
                                            <Input 
                                                label="QUANTITY BROUGHT" 
                                                type="number" 
                                                placeholder="0.00"
                                                value={stockItem.quantity} 
                                                onChange={(e) => setStockItem({...stockItem, quantity: e.target.value})}
                                                required
                                            />
                                            <Input 
                                                label="UNIT COST (₦)" 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="0.00"
                                                value={stockItem.cost} 
                                                onChange={(e) => setStockItem({...stockItem, cost: e.target.value})}
                                                required
                                            />
                                        </div>
                                    )}

                                    {txType === 'EXPENSE' && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2">
                                            <Input 
                                                label="SERVICE DESCRIPTION" 
                                                placeholder="e.g. Offloading charges"
                                                value={expenseData.description} 
                                                onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                                                required
                                            />
                                            <Input 
                                                label="TOTAL AMOUNT (₦)" 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="0.00"
                                                value={expenseData.amount} 
                                                onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                                                required
                                            />
                                            <Input 
                                                label="BILLING DATE" 
                                                type="date"
                                                value={expenseData.date} 
                                                onChange={(e) => setExpenseData({...expenseData, date: e.target.value})}
                                                required
                                            />
                                        </div>
                                    )}

                                    {txType === 'PAYMENT' && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2">
                                            <Input 
                                                label="AMOUNT PAID (₦)" 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="0.00"
                                                value={paymentData.amount} 
                                                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                                                required
                                            />
                                            <Select
                                                label="PAYMENT CHANNEL"
                                                value={paymentData.method}
                                                onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                                            >
                                                <option>Bank Transfer</option>
                                                <option>Cash</option>
                                                <option>Check</option>
                                                <option>Credit Card</option>
                                            </Select>
                                            <Input 
                                                label="REFERENCE / SLIP #" 
                                                placeholder="Optional receipt number"
                                                value={paymentData.reference} 
                                                onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                                            />
                                        </div>
                                    )}

                                    <Button type="submit" disabled={isSubmitting} className="w-full mt-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirm Record'}
                                    </Button>
                                </form>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card className="p-4 sm:p-8 h-full bg-slate-50 flex flex-col justify-center border-dashed border-2 border-slate-200">
                                  <div className="max-w-md mx-auto space-y-6">
                                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest text-center border-b border-slate-200 pb-4">Posting Logic</h4>
                                      <div className="grid grid-cols-1 gap-4">
                                          <div className={`p-5 rounded-2xl border transition-all duration-300 ${txType === 'STOCK' ? 'bg-white shadow-xl ring-2 ring-indigo-500 scale-105' : 'bg-slate-100 opacity-60'}`}>
                                              <div className="flex items-center gap-3 mb-2 font-black text-indigo-700 uppercase tracking-widest text-[10px]">
                                                  <div className="p-2 bg-indigo-50 rounded-lg"><Package className="w-4 h-4" /></div> Stock Goods Inflow
                                              </div>
                                              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Increases debt to supplier based on total quantity x cost. Updates physical inventory SKU quantities for both Admin and Staff views.</p>
                                          </div>
                                          <div className={`p-5 rounded-2xl border transition-all duration-300 ${txType === 'EXPENSE' ? 'bg-white shadow-xl ring-2 ring-orange-500 scale-105' : 'bg-slate-100 opacity-60'}`}>
                                              <div className="flex items-center gap-3 mb-2 font-black text-orange-700 uppercase tracking-widest text-[10px]">
                                                  <div className="p-2 bg-orange-50 rounded-lg"><FileText className="w-4 h-4" /></div> Service Cost
                                              </div>
                                              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Records additional fees like logistics. Increases debt and automatically logs a company-wide expense.</p>
                                          </div>
                                          <div className={`p-5 rounded-2xl border transition-all duration-300 ${txType === 'PAYMENT' ? 'bg-white shadow-xl ring-2 ring-emerald-500 scale-105' : 'bg-slate-100 opacity-60'}`}>
                                              <div className="flex items-center gap-3 mb-2 font-black text-emerald-700 uppercase tracking-widest text-[10px]">
                                                  <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="w-4 h-4" /></div> Settle Payment
                                              </div>
                                              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Decreases vendor debt. Automatically synced with Company Expenses for profit tracking.</p>
                                          </div>
                                      </div>
                                  </div>
                            </Card>
                        </div>
                    </div>
                )}
             </div>
          ) : (
            <div className="p-24 text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-slate-50 p-8 rounded-full inline-block mb-6 border border-slate-100 shadow-inner">
                    <Building className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-slate-800 font-black uppercase tracking-widest text-sm mb-2">No Supplier Selected</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Select a verified supplier to begin tracking inflow and settling accounts.</p>
            </div>
          )}
      </Card>
    </div>
  );
};
