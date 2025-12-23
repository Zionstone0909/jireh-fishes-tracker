
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, BackButton, Table, Badge, Button, Input } from './Shared';
import { 
    DollarSign, TrendingUp, Activity, 
    Calendar, FileText, Download, Filter, Search, 
    Briefcase, Truck, PieChart as PieChartIcon, 
    ArrowUpRight, ArrowDownLeft, Package, Sparkles,
    FileSpreadsheet, History, BarChart3
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, PieChart, Pie, 
    Cell, Legend, AreaChart, Area 
} from 'recharts';

export const Reports = () => {
  const { sales, expenses, inventorySummary, getInventoryValuation, products, customers } = useApp();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'inventory' | 'summary'>('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [valuationData, setValuationData] = useState<any[]>([]);
  const [loadingValuation, setLoadingValuation] = useState(false);

  useEffect(() => {
      if (activeTab === 'inventory') {
          setLoadingValuation(true);
          getInventoryValuation()
            .then(data => setValuationData(data))
            .finally(() => setLoadingValuation(false));
      }
  }, [activeTab, getInventoryValuation]);

  const dateFilteredSales = useMemo(() => {
    return sales.filter(s => {
        const d = s.date.split('T')[0];
        return d >= startDate && d <= endDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, startDate, endDate]);

  const dateFilteredExpenses = useMemo(() => {
    return expenses.filter(e => {
        const d = e.date;
        return e.type === 'EXPENSE' && d >= startDate && d <= endDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, startDate, endDate]);

  const totalSalesRevenue = dateFilteredSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalExpenses = dateFilteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalSalesRevenue - totalExpenses;

  // --- Export Functions ---
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMasterData = () => {
    // Sales Export
    const salesExport = sales.map(s => ({
        ID: s.id,
        Date: new Date(s.date).toLocaleString(),
        Customer: s.customerName,
        Total: s.total,
        Paid: s.amountPaid,
        Method: s.paymentMethod,
        Agent: s.initiatedByName
    }));
    downloadCSV(salesExport, 'Sales_Master_Report');

    // Expense Export
    const expenseExport = expenses.map(e => ({
        Date: e.date,
        Category: e.category,
        Description: e.description,
        Amount: e.amount,
        Type: e.type,
        RecordedBy: e.recordedByName
    }));
    setTimeout(() => downloadCSV(expenseExport, 'Expense_Master_Report'), 500);
  };

  const setRange = (days: number) => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Intelligence & Analytics</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <Activity size={14} className="text-indigo-500" /> Historical Performance Matrix
            </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-end md:items-center">
             <div className="flex bg-slate-50 p-1 rounded-xl self-start md:self-center shrink-0 w-full md:w-auto overflow-x-auto border border-slate-200">
                <button onClick={() => setRange(7)} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white rounded-lg transition whitespace-nowrap">7 Days</button>
                <button onClick={() => setRange(30)} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white rounded-lg transition whitespace-nowrap">30 Days</button>
                <button onClick={() => setRange(365)} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white rounded-lg transition whitespace-nowrap">Fiscal Year</button>
             </div>
             
             <div className="grid grid-cols-2 gap-2 items-end w-full md:w-auto">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 mb-1 ml-1">START</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none bg-white shadow-sm" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 mb-1 ml-1">END</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none bg-white shadow-sm" />
                </div>
             </div>

             <Button onClick={exportMasterData} className="!bg-emerald-600 hover:!bg-emerald-700 !rounded-xl !py-2.5 !text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                <FileSpreadsheet size={16} /> Excel Export
             </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-indigo-600 rounded-2xl shadow-sm hover:shadow-md transition-all">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Gross Revenue</span>
           <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><DollarSign className="w-5 h-5" /></div>
              <span className="text-2xl font-black text-slate-900 truncate">₦{totalSalesRevenue.toLocaleString()}</span>
           </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-red-500 rounded-2xl shadow-sm hover:shadow-md transition-all">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Operating Costs</span>
           <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><ArrowUpRight className="w-5 h-5" /></div>
              <span className="text-2xl font-black text-slate-900 truncate">₦{totalExpenses.toLocaleString()}</span>
           </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-emerald-500 rounded-2xl shadow-sm hover:shadow-md transition-all">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Inventory Asset Value</span>
           <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Package className="w-5 h-5" /></div>
              <span className="text-2xl font-black text-slate-900 truncate">₦{inventorySummary?.totalValueAtCost.toLocaleString() || '0'}</span>
           </div>
        </Card>
        <Card className={`p-6 border-l-4 rounded-2xl shadow-xl transition-all ${netProfit >= 0 ? 'border-l-indigo-900 bg-indigo-900 text-white' : 'border-l-orange-500 bg-orange-50'}`}>
           <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-3 ${netProfit >= 0 ? 'text-indigo-300' : 'text-slate-400'}`}>Net Operating Profit</span>
           <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${netProfit >= 0 ? 'bg-white/10 text-white' : 'bg-orange-100 text-orange-600'}`}>
                  <BarChart3 className="w-5 h-5" />
              </div>
              <span className={`text-2xl font-black truncate ${netProfit >= 0 ? 'text-white' : 'text-orange-700'}`}>₦{netProfit.toLocaleString()}</span>
           </div>
        </Card>
      </div>

      <div className="space-y-4">
         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-2">
             <div className="flex gap-4 overflow-x-auto w-full lg:w-auto no-scrollbar">
                 {['summary', 'sales', 'expenses', 'inventory'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.25em] transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
                    >
                        {tab === 'inventory' ? 'Stock valuation' : tab} Audit
                    </button>
                 ))}
             </div>
             
             <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    placeholder="Search historical logs..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
         </div>

         <Card className="rounded-[2.5rem] border-0 shadow-lg overflow-hidden bg-white min-h-[500px]">
            {activeTab === 'summary' && (
                <div className="p-8 space-y-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <History size={16} className="text-indigo-500" /> P&L Quick Snapshot
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-600 uppercase">Gross Sales</span>
                                    <span className="text-sm font-black text-indigo-600">₦{totalSalesRevenue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-600 uppercase">Operating Expenses</span>
                                    <span className="text-sm font-black text-red-500">₦{totalExpenses.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <span className="text-sm font-black text-indigo-900 uppercase">Net Margin</span>
                                    <span className={`text-lg font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₦{netProfit.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <TrendingUp size={16} className="text-indigo-500" /> Stakeholder Volume
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Customers</p>
                                    <p className="text-3xl font-black text-slate-900">{customers.length}</p>
                                </div>
                                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total SKU Types</p>
                                    <p className="text-3xl font-black text-slate-900">{products.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120} /></div>
                        <div className="relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300 mb-6">Financial Telemetry</h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sales.slice(-10).map(s => ({ date: s.date.split('T')[0], amt: s.total }))}>
                                        <defs>
                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="amt" stroke="#818cf8" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mt-4">Real-time revenue flux across recent nodes</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto no-scrollbar">
                {activeTab === 'sales' && (
                    <Table headers={['Timestamp', 'Reference', 'Customer Account', 'Gross Total', 'Status', 'Agent']}>
                        {dateFilteredSales.filter(s => s.id.includes(searchTerm) || s.customerName.toLowerCase().includes(searchTerm.toLowerCase())).map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                <td className="px-6 py-5 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase">{new Date(sale.date).toLocaleString()}</td>
                                <td className="px-6 py-5 text-xs font-black text-slate-400 tracking-tighter">#{sale.id.slice(-8)}</td>
                                <td className="px-6 py-5 text-sm font-black text-slate-900">{sale.customerName || 'Walk-in'}</td>
                                <td className="px-6 py-5 text-sm font-black text-indigo-600">₦{sale.total.toLocaleString()}</td>
                                <td className="px-6 py-5">
                                    <Badge color={sale.amountPaid >= sale.total ? 'green' : 'red'}>
                                        {sale.amountPaid >= sale.total ? 'FULL' : 'OWED'}
                                    </Badge>
                                </td>
                                <td className="px-6 py-5 text-[10px] font-black uppercase text-slate-500">{sale.initiatedByName}</td>
                            </tr>
                        ))}
                    </Table>
                )}

                {activeTab === 'expenses' && (
                    <Table headers={['Date', 'Category', 'Description', 'Amount', 'Method', 'Agent']}>
                        {dateFilteredExpenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase())).map(expense => (
                            <tr key={expense.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                <td className="px-6 py-5 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase">{new Date(expense.date).toLocaleDateString()}</td>
                                <td className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{expense.category}</td>
                                <td className="px-6 py-5 text-sm font-bold text-slate-900">{expense.description}</td>
                                <td className="px-6 py-5 text-sm font-black text-red-600">₦{expense.amount.toLocaleString()}</td>
                                <td className="px-6 py-5"><Badge color="gray">{expense.paymentMethod}</Badge></td>
                                <td className="px-6 py-5 text-[10px] font-black uppercase text-slate-500">{expense.recordedByName}</td>
                            </tr>
                        ))}
                    </Table>
                )}

                {activeTab === 'inventory' && (
                    <Table headers={['SKU / Product', 'Quantity', 'Avg Cost', 'Retail Price', 'Book Value (Cost)', 'Potential Profit']}>
                        {valuationData.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.sku.toLowerCase().includes(searchTerm.toLowerCase())).map(val => (
                            <tr key={val.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="font-black text-slate-900 text-sm tracking-tight">{val.name}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{val.sku}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black border ${val.quantity < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                        {val.quantity}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-sm font-bold text-slate-600">₦{val.unitCost.toLocaleString()}</td>
                                <td className="px-6 py-5 text-sm font-bold text-slate-900">₦{val.unitPrice.toLocaleString()}</td>
                                <td className="px-6 py-5 text-sm font-black text-red-600">₦{val.totalCost.toLocaleString()}</td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-emerald-600">₦{val.potentialProfit.toLocaleString()}</span>
                                        <span className="text-[9px] font-black text-emerald-400 uppercase">Pro-rata</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </div>
            {(activeTab === 'inventory' && valuationData.length === 0 && loadingValuation) && (
                <div className="p-32 flex flex-col items-center justify-center opacity-20">
                    <Sparkles size={64} className="mb-4 animate-pulse" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">Generating Valuation Matrix...</p>
                </div>
            )}
         </Card>
      </div>
    </div>
  );
};
