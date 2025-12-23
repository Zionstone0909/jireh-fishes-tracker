
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import usePersistentState from '../hooks/usePersistentState';
import ApiClient from '../services/ApiClient';
import {
  Plus, Filter, Download, X, DollarSign, PieChart,
  TrendingUp, Search, Building, ArrowUpRight, ArrowDownLeft, UserCheck
} from 'lucide-react';
import { Expense } from '../types';

export const CompanyExpenses = ({ onBack }: { onBack?: () => void }) => {
  const { expenses, suppliers, addExpense, setExpenses } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Load initial data if not already present
  useEffect(() => {
    const load = async () => {
      try {
        const data = await ApiClient.get('/api/expenses');
        setExpenses(data);
      } catch (e) {
        console.error("Failed to load expenses", e);
      }
    };
    if (expenses.length === 0) load();
  }, []);

  const totalExpenses = expenses
    .filter(e => e.type !== 'DEPOSIT')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalDeposits = expenses
    .filter(e => e.type === 'DEPOSIT')
    .reduce((sum, item) => sum + item.amount, 0);

  const netBalance = totalDeposits - totalExpenses;

  const categories = [
    'All', 'Utilities', 'Rent', 'Supplies', 'Payroll',
    'Marketing', 'Software', 'Maintenance', 'Inventory/Supply',
    'Supplier Payment', 'Income', 'Deposit'
  ];

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(expense => {
        const matchesSearch =
          expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (expense.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.amount || !formData.description) {
      setErrorMessage('Amount and Description are required.');
      return;
    }

    setLoading(true);
    try {
      const savedExpense: Expense = await ApiClient.post('/api/expenses', {
        ...formData,
        recordedByName: 'Admin'
      });
      addExpense(savedExpense); 
      setFormData(initialFormState);
      setShowForm(false);
      alert('Record saved successfully!');
    } catch (err: any) {
      setErrorMessage('Failed to save record. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount', 'Method', 'Reference', 'Status', 'RecordedBy'],
      ...expenses.map(e => [
        e.date, e.type, e.category, e.description, e.amount, e.paymentMethod, e.reference || '', e.status, e.recordedByName || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "financial_records.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Financial Records</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring Jireh Fishes cash flow and profitability.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={exportData} variant="secondary">
            <Download size={16} /> Export CSV
          </Button>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'danger'}>
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Close' : 'Add Expense'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-red-500">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-black text-slate-900">₦{totalExpenses.toLocaleString()}</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-green-500">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Deposits</p>
          <p className="text-2xl font-black text-slate-900">₦{totalDeposits.toLocaleString()}</p>
        </Card>
        <Card className={`p-5 border-l-4 ${netBalance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Net Balance</p>
          <p className={`text-2xl font-black ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            ₦{netBalance.toLocaleString()}
          </p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-6 bg-slate-50 border-blue-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">New Transaction</h3>
          {errorMessage && <p className="text-red-600 text-xs mb-4 font-bold">{errorMessage}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
            <Select label="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              {categories.filter(c => c !== 'All' && c !== 'Deposit' && c !== 'Income').map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Amount (₦)" type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} required />
            <Input label="Description" placeholder="e.g. Fuel for generator" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
            <Input label="Reference" placeholder="Receipt #" value={formData.reference || ''} onChange={e => setFormData({ ...formData, reference: e.target.value })} />
            <Select label="Supplier" value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}>
              <option value="">-- None --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Record'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input className="pl-9" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-1 overflow-x-auto w-full md:w-auto">
            {['All', 'Utilities', 'Payroll', 'Supplies'].map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>{cat}</button>
            ))}
          </div>
        </div>
        <Table headers={['Date', 'Type', 'Description', 'Amount', 'Status', 'Recorded By']}>
          {filteredExpenses.map(e => (
            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
              <td className="px-6 py-4">
                <Badge color={e.type === 'DEPOSIT' ? 'green' : 'red'}>{e.type}</Badge>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-800">{e.description}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">{e.category}</p>
              </td>
              <td className={`px-6 py-4 text-sm font-black ${e.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-500'}`}>
                ₦{e.amount.toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <Badge color={e.status === 'Paid' ? 'blue' : 'orange'}>{e.status}</Badge>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500 italic">
                {e.recordedByName || 'System'}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
