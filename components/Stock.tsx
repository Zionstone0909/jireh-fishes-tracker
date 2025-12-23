
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Table, Button, Input, Badge, BackButton, Select } from './Shared';
import { History, Package, AlertTriangle, ArrowRightLeft, ShieldAlert, Search } from 'lucide-react';
import { StockMovement, Role } from '../types';
import usePersistentState from '../hooks/usePersistentState';

// --- Components ---

const CurrentStockList = () => {
  const { products } = useApp();
  const [filter, setFilter] = useState('');

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.sku.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text"
            placeholder="Search current stock..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="overflow-x-auto">
            <Table headers={['Product Name', 'SKU', 'Category', 'Quantity', 'Status', 'Book Value']}>
            {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{p.name}</td>
                <td className="px-6 py-4 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-tighter">{p.sku}</td>
                <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{p.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className="text-lg font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{p.quantity}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {p.quantity <= p.minStockLevel ? (
                    <Badge color="red">Low Stock</Badge>
                    ) : (
                    <Badge color="green">Stable</Badge>
                    )}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-600 whitespace-nowrap">
                    ₦{(p.quantity * p.price).toLocaleString()}
                </td>
                </tr>
            ))}
            {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-black uppercase text-xs">No matching products.</td></tr>
            )}
            </Table>
        </div>
      </Card>
    </div>
  );
};

const StockAdjustmentForm = () => {
  const { products, adjustStock, user } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  
    const [formData, setFormData] = usePersistentState('Stock.adjustment.formData', {
        productId: '',
        type: 'CORRECTION' as StockMovement['type'],
        quantity: '',
        action: 'add', // add or remove
        reason: ''
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) return;
    
    let qty = Number(formData.quantity);
    if (qty <= 0) {
        alert("Please enter a valid positive quantity.");
        return;
    }

    // Determine sign based on type/action
    let finalQty = qty;
    
    if (formData.type === 'DAMAGE' || formData.type === 'LOSS') {
        finalQty = -qty; // Always negative
    } else if (formData.type === 'CORRECTION') {
        finalQty = formData.action === 'remove' ? -qty : qty;
    }

    adjustStock(formData.productId, finalQty, formData.type, formData.reason);
    setFormData({ productId: '', type: 'CORRECTION', quantity: '', action: 'add', reason: '' });
    alert('Stock adjustment recorded.');
  };

  if (!isAdmin) {
      return (
        <Card className="p-12 text-center text-slate-500 bg-slate-50 border-dashed border-2">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-black uppercase tracking-widest text-xs">Managerial access required for manual overrides.</p>
        </Card>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1">
          <Card className="p-6 border-t-4 border-t-orange-500 shadow-xl">
             <h3 className="text-xs font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Manual Correction
             </h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Target Item"
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                    required
                >
                    <option value="">Select Product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Now: {p.quantity})</option>)}
                </Select>

                <Select
                    label="Log Category"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                    <option value="CORRECTION">Recount / Correction</option>
                    <option value="DAMAGE">Damaged / Expired</option>
                    <option value="LOSS">Shrinkage / Theft</option>
                </Select>

                {formData.type === 'CORRECTION' && (
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Action</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, action: 'add'})}
                                className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${formData.action === 'add' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Increment (+)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, action: 'remove'})}
                                className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${formData.action === 'remove' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Decrement (-)
                            </button>
                        </div>
                    </div>
                )}

                <Input 
                    label="Units Changed" 
                    type="number" 
                    placeholder="0" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                />

                <Input 
                    label="Justification" 
                    placeholder="e.g. End of month audit" 
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                />

                <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 shadow-lg">
                    Process Adjustment
                </Button>
             </form>
          </Card>
       </div>
       <div className="lg:col-span-2">
          <Card className="p-8 bg-slate-50 h-full border-dashed border-2 border-slate-200">
             <h4 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">Audit Protocols</h4>
             <div className="space-y-4">
                 <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 font-bold text-xs">01</div>
                     <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">Corrections should only be used after a physical shelf count. Mismatches must be documented.</p>
                 </div>
                 <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 font-bold text-xs">02</div>
                     <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">Damaged goods records automatically reduce the book value of inventory without generating sales income.</p>
                 </div>
                 <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 font-bold text-xs">03</div>
                     <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">Frequent 'Loss' entries trigger security reviews and system-wide inventory re-validation.</p>
                 </div>
             </div>
          </Card>
       </div>
    </div>
  );
};

const StockMovementForm = () => {
  const { products, adjustStock, user } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  
    const [formData, setFormData] = usePersistentState('Stock.movement.formData', {
        productId: '',
        type: 'TRANSFER_OUT' as StockMovement['type'],
        quantity: '',
        reason: ''
    });

  if (!isAdmin) return null; // Component completely hidden for staff

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) return;
    
    let qty = Number(formData.quantity);
    if (qty <= 0) {
        alert("Please enter a valid positive quantity.");
        return;
    }

    let finalQty = qty;
    // Logic for movement direction
    if (['TRANSFER_OUT', 'INTERNAL_USE', 'RETURN'].includes(formData.type)) {
        finalQty = -qty;
    }
    // TRANSFER_IN is positive

    adjustStock(formData.productId, finalQty, formData.type, formData.reason);
    setFormData({ productId: '', type: 'TRANSFER_OUT', quantity: '', reason: '' });
    alert('Stock movement recorded.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1">
          <Card className="p-6 border-t-4 border-t-blue-500 shadow-xl">
             <h3 className="text-xs font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-500" /> Physical Movement
             </h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Item"
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                    required
                >
                    <option value="">Select Item...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>)}
                </Select>

                <Select
                    label="Flow Direction"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                    <option value="TRANSFER_OUT">Transfer Out (-)</option>
                    <option value="TRANSFER_IN">Transfer In (+)</option>
                    <option value="INTERNAL_USE">Business Consumption (-)</option>
                    <option value="RETURN">Return to Supplier (-)</option>
                </Select>

                <Input 
                    label="Quantity" 
                    type="number" 
                    placeholder="0" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                />

                <Input 
                    label="Ref / Destination" 
                    placeholder="e.g. Cold Room B" 
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                />

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 shadow-lg">
                    Confirm Movement
                </Button>
             </form>
          </Card>
       </div>
       <div className="lg:col-span-2">
          <Card className="p-8 bg-blue-50 h-full border-dashed border-2 border-blue-100 flex flex-col justify-center">
             <h4 className="text-sm font-black text-blue-900 mb-2 uppercase tracking-widest text-center">Logistics Tracking</h4>
             <p className="text-xs font-bold text-blue-700 text-center uppercase tracking-tight max-w-sm mx-auto leading-relaxed">
                 Use physical movements to track items leaving the main warehouse for internal consumption or inter-branch transfers.
             </p>
          </Card>
       </div>
    </div>
  );
};

const StockHistory = () => {
    const { stockMovements, user } = useApp();
    const [filter, setFilter] = useState('');
    const isAdmin = user?.role === Role.ADMIN;

    if (!isAdmin) return null; // History is admin only

    const filtered = stockMovements.filter(m => 
        m.productName.toLowerCase().includes(filter.toLowerCase()) ||
        m.type.toLowerCase().includes(filter.toLowerCase()) ||
        (m.reason || '').toLowerCase().includes(filter.toLowerCase())
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card className="overflow-hidden border-0 shadow-md">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" /> Movement Logs
                </h3>
                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                        placeholder="Search audit trail..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <Table headers={['Timestamp', 'Item', 'Category', 'Net Delta', 'Notes', 'System User']}>
                    {filtered.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase">{new Date(m.date).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">{m.productName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Badge color={m.quantity > 0 ? 'green' : 'red'}>{m.type}</Badge>
                            </td>
                            <td className={`px-6 py-4 text-sm font-black whitespace-nowrap ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {m.quantity > 0 ? '+' : ''}{m.quantity}
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase min-w-[200px] tracking-tight">{m.reason}</td>
                            <td className="px-6 py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">{m.userName}</td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-300 font-black uppercase text-xs">Audit log is currently empty.</td></tr>
                    )}
                </Table>
            </div>
        </Card>
    );
};

// --- Main Page ---

export const Stock = ({ onBack }: { onBack?: () => void }) => {
  const { user } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  const [activeTab, setActiveTab] = useState<'stock' | 'adjustment' | 'movement' | 'history'>('stock');

  const allTabs = [
    { id: 'stock', label: 'Stock Levels', icon: Package, roles: [Role.ADMIN, Role.STAFF] },
    { id: 'adjustment', label: 'Adjustments', icon: AlertTriangle, roles: [Role.ADMIN] },
    { id: 'movement', label: 'Physical Flow', icon: ArrowRightLeft, roles: [Role.ADMIN] },
    { id: 'history', label: 'Audit Trail', icon: History, roles: [Role.ADMIN] },
  ];

  const visibleTabs = allTabs.filter(t => t.roles.includes(user?.role || Role.STAFF));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <BackButton onClick={onBack} />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                    {isAdmin ? 'Stock Operations' : 'Inventory Check'}
                </h1>
                <p className="text-slate-500 text-sm font-medium">Monitoring SKU quantities across the warehouse.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex overflow-x-auto max-w-full">
                {visibleTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'stock' && <CurrentStockList />}
            {activeTab === 'adjustment' && <StockAdjustmentForm />}
            {activeTab === 'movement' && <StockMovementForm />}
            {activeTab === 'history' && <StockHistory />}
        </div>
    </div>
  );
};
