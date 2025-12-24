
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from './context/AppContext';
import usePersistentState from './hooks/usePersistentState';
import { Card, Button, Input, Badge, Table, Select } from './components/Shared';
import { CustomerSearchHeader } from './components/Customers';
import { 
  Plus, Search, Trash2, ShoppingCart, 
  User as UserIcon, X, UserCheck, RefreshCw, 
  PackageOpen, Fish, Receipt 
} from 'lucide-react';
import { SaleItem, Customer, Role } from './types';
import { useNavigate } from 'react-router-dom';

export const Sales = () => {
  const { products, user, addSale, sales, customers } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = usePersistentState<'pos' | 'history'>('Sales.activeTab', 'pos');
  
  // POS State
  const [cart, setCart] = usePersistentState<SaleItem[]>('Sales.cart', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = usePersistentState<Customer | null>('Sales.selectedCustomer', null);
  const [amountPaid, setAmountPaid] = usePersistentState<string>('Sales.amountPaid', '');
  const [paymentMethod, setPaymentMethod] = usePersistentState('Sales.paymentMethod', 'Cash');
  
  // History State
  const [historySearch, setHistorySearch] = useState('');

  const cartTotal = cart.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  
  useEffect(() => {
     if (cartTotal > 0 && (!amountPaid || amountPaid === '0' || amountPaid === '')) {
         setAmountPaid(cartTotal.toFixed(2));
     }
  }, [cartTotal]);

  const filteredProducts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.sku.toLowerCase().includes(s)
    );
  }, [products, searchTerm]);

  const addToCart = (product: any) => {
    if (product.quantity <= 0) {
        alert("Out of Stock!");
        return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      const currentQtyInCart = existing ? existing.quantity : 0;
      
      if (currentQtyInCart + 1 > product.quantity) {
          alert(`Insufficient Inventory. Only ${product.quantity} available.`);
          return prev;
      }

      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        price: product.price, 
        subtotal: product.price 
      }];
    });
  };

  const updateCartItem = (productId: string, field: 'quantity' | 'price', value: number) => {
     setCart(prev => prev.map(item => {
         if (item.productId === productId) {
             const product = products.find(p => p.id === productId);
             let newQty = item.quantity;
             let newPrice = item.price;

             if (field === 'quantity') {
                 if (product && value > product.quantity) {
                     alert(`Maximum Inventory Reached: ${product.quantity} available.`);
                     newQty = product.quantity;
                 } else {
                     newQty = Math.max(1, value);
                 }
             }
             
             if (field === 'price') {
                 newPrice = Math.max(0, value);
             }

             return {
                 ...item,
                 quantity: newQty,
                 price: newPrice,
                 subtotal: newQty * newPrice
             };
         }
         return item;
     }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    for (const item of cart) {
        const p = products.find(prod => prod.id === item.productId);
        if (p && p.quantity < item.quantity) {
            alert(`Stock level for ${p.name} changed. Only ${p.quantity} left. Please adjust cart.`);
            return;
        }
    }

    const paid = Number(amountPaid);
    const newSale: any = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: cartTotal,
      amountPaid: paid,
      items: [...cart],
      initiatedBy: user!.id,
      initiatedByName: user!.name,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      customerId: selectedCustomer?.id,
      paymentMethod: paymentMethod
    };
    
    try {
        await addSale(newSale);
        setCart([]);
        setSelectedCustomer(null);
        setAmountPaid('');
        setPaymentMethod('Cash');
        alert('Transaction committed. Inventory updated globally.');
    } catch (err: any) {
        alert(`Checkout Failed: ${err.message}`);
    }
  };

  const balanceDue = Math.max(0, cartTotal - Number(amountPaid));
  const changeDue = Math.max(0, Number(amountPaid) - cartTotal);

  const filteredSales = useMemo(() => {
    const s = historySearch.toLowerCase();
    return sales.filter(sale => 
      sale.id.includes(s) ||
      (sale.initiatedByName || '').toLowerCase().includes(s) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(s))
    );
  }, [sales, historySearch]);

  const goToLedger = (customerId: string) => {
    localStorage.setItem('last_ledger_customer', customerId);
    navigate(isAdmin ? '/admin/customer-ledger' : '/staff/customer-ledger');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 overflow-hidden" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-2">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button 
                className={`px-4 py-3 font-black text-[10px] uppercase tracking-[0.25em] transition-all whitespace-nowrap border-b-2 ${activeTab === 'pos' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-800'}`}
                onClick={() => setActiveTab('pos')}
            >
                Point of Sale
            </button>
            <button 
                className={`px-4 py-3 font-black text-[10px] uppercase tracking-[0.25em] transition-all whitespace-nowrap border-b-2 ${activeTab === 'history' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-800'}`}
                onClick={() => setActiveTab('history')}
            >
                Audit History
            </button>
        </div>
        
        {activeTab === 'pos' && (
             <div className="w-full md:w-96">
                <CustomerSearchHeader 
                    customers={customers}
                    placeholder="Assign client entity..."
                    onSelect={(c) => setSelectedCustomer(c)}
                    selectedCustomerId={selectedCustomer?.id}
                />
            </div>
        )}
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Inventory Selection (Left Column - 7/12 width) */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="relative shrink-0">
                <Search className="w-5 h-5 absolute left-5 top-5 text-slate-400" />
                <input 
                  className="w-full pl-14 pr-6 py-4.5 border border-slate-200 rounded-[2rem] focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-base bg-white shadow-xl"
                  placeholder="Scan SKU or search product catalog..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div 
              className="flex-1 overflow-y-auto pr-2 scroll-smooth no-scrollbar"
              style={{ maxHeight: 'calc(100vh - 350px)' }}
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                    {filteredProducts.map(product => (
                        <div 
                            key={product.id} 
                            className={`p-5 bg-white border border-slate-100 rounded-[2rem] flex flex-col justify-between shadow-sm transition-all group ${product.quantity > 0 ? 'hover:shadow-2xl cursor-pointer hover:border-indigo-400 hover:-translate-y-1' : 'opacity-60 cursor-not-allowed bg-slate-50'}`}
                            onClick={() => addToCart(product)}
                        >
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge color={product.quantity > product.minStockLevel ? 'green' : 'red'}>
                                        Qty: {product.quantity}
                                    </Badge>
                                </div>
                                <h4 className="font-black text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors h-10 line-clamp-2">{product.name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-tighter truncate">{product.sku}</p>
                            </div>
                            <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                                <span className="text-xl font-black text-slate-900 tracking-tighter">₦{product.price.toLocaleString()}</span>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${product.quantity > 0 ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 group-hover:scale-110 active:scale-95' : 'bg-slate-200 text-slate-400'}`}>
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-32 text-center text-slate-300">
                            <PackageOpen className="w-20 h-20 mx-auto mb-4 opacity-10" />
                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">No nodes found</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Cart & Checkout (Right Column - 5/12 width) */}
          <div className="xl:col-span-5">
            <Card 
                className="flex flex-col h-full bg-white rounded-[3rem] overflow-hidden shadow-2xl border-0 ring-1 ring-slate-100 sticky top-32"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
                <div className="p-8 bg-slate-50/50 border-b border-slate-100 shrink-0">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">
                        <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Staff: {user?.name}</span>
                        <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Sync Active</span>
                    </div>
                    {selectedCustomer ? (
                        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-indigo-100 shadow-xl animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-xl shadow-indigo-100 shrink-0">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 text-sm truncate tracking-tight">{selectedCustomer.name}</p>
                                    <div className="flex gap-4 mt-1">
                                        <button 
                                            onClick={() => goToLedger(selectedCustomer.id)}
                                            className="text-[10px] text-indigo-600 font-black uppercase hover:underline tracking-widest"
                                        >
                                            View Ledger
                                        </button>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCustomer.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            Bal: ₦{selectedCustomer.balance.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="text-slate-300 hover:text-red-500 transition-colors p-2 shrink-0">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-6 text-slate-400 bg-white/50 border border-dashed border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em]">
                            Walk-in Client Node
                        </div>
                    )}
                </div>

                <div 
                    className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar"
                    style={{ minHeight: '200px' }}
                >
                    {cart.map(item => (
                        <div key={item.productId} className="flex gap-5 border-b border-slate-50 pb-6 last:border-0 group">
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-sm text-slate-900 truncate tracking-tight">{item.productName}</p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3">
                                    <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                                        <button className="px-4 py-2 text-slate-500 hover:bg-slate-200 transition-colors font-black" onClick={() => updateCartItem(item.productId, 'quantity', item.quantity - 1)}>-</button>
                                        <input className="w-10 text-center text-xs font-black text-indigo-700 bg-white border-x border-slate-200 py-2" value={item.quantity} readOnly />
                                        <button className="px-4 py-2 text-slate-500 hover:bg-slate-200 transition-colors font-black" onClick={() => updateCartItem(item.productId, 'quantity', item.quantity + 1)}>+</button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate:</span>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1.5 text-[10px] font-bold text-slate-400">₦</span>
                                            <input 
                                                type="number" 
                                                className="pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black w-24 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                value={item.price}
                                                onChange={(e) => updateCartItem(item.productId, 'price', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="font-black text-slate-900 text-base tracking-tighter">₦{(item.subtotal || 0).toLocaleString()}</span>
                                <button onClick={() => removeFromCart(item.productId)} className="text-slate-200 hover:text-red-500 transition-colors p-1">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-200 py-20 opacity-60">
                            <div className="p-8 bg-slate-50 rounded-full border border-dashed border-slate-200 mb-6">
                                <PackageOpen className="w-16 h-16" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">Cart is empty</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 p-10 space-y-8 text-white shrink-0">
                    <div className="flex justify-between items-center">
                        <span className="uppercase text-[10px] font-black tracking-[0.4em] text-slate-400">Grand Total Payable</span>
                        <span className="text-4xl font-black text-indigo-400 tracking-tighter">₦{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <Select 
                            label="LOG CHANNEL"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="!bg-white/5 !border-white/10 !text-white !rounded-2xl !py-4 !font-black !text-[11px] !tracking-widest"
                        >
                            <option value="Cash" className="text-slate-900">Physical Cash</option>
                            <option value="Transfer" className="text-slate-900">Bank Transfer</option>
                            <option value="Card" className="text-slate-900">POS Terminal</option>
                            <option value="Credit" className="text-slate-900">Ledger Debit</option>
                        </Select>
                        <div className="flex flex-col gap-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">AMOUNT SETTLED</label>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-slate-400 font-bold text-sm">₦</span>
                                <input 
                                    type="number"
                                    className="w-full pl-10 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-black text-lg text-indigo-400 shadow-inner"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-8 border-t border-white/5 uppercase font-black tracking-widest">
                        {Number(amountPaid) >= cartTotal ? (
                            <>
                                <span className="text-slate-500">Change Due</span>
                                <span className="text-xl font-black text-emerald-400 tracking-tighter">₦{changeDue.toLocaleString()}</span>
                            </>
                        ) : (
                            <>
                                <span className="text-slate-500">Node Balance</span>
                                <span className="text-xl font-black text-red-400 tracking-tighter">₦{balanceDue.toLocaleString()}</span>
                            </>
                        )}
                    </div>

                    <Button 
                        className="w-full py-6 text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl !rounded-2xl bg-indigo-600 hover:bg-indigo-700 !text-white border-0 active:scale-95 transition-all" 
                        onClick={handleCheckout} 
                        disabled={cart.length === 0}
                    >
                        Synchronize Entry
                    </Button>
                </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border-0 ring-1 ring-slate-100 animate-in slide-in-from-bottom-6 duration-700">
          <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/30">
            <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Audit Ledger Logs</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Full transaction history & node tracking</p>
            </div>
            <div className="w-full md:w-[500px] relative">
              <Search className="w-5 h-5 absolute left-5 top-5 text-slate-400" />
              <input 
                placeholder="Search by Audit ID or Client Identity..." 
                className="w-full pl-14 pr-6 py-4.5 border border-slate-200 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-8 focus:ring-indigo-500/5 bg-white shadow-sm"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <Table headers={['Audit ID', 'Timestamp', 'Subject Entity', 'Flux Items', 'Gross Total', 'State', 'Agent']}>
                {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-8 py-7 text-[10px] text-slate-400 font-black uppercase tracking-tighter whitespace-nowrap">#{sale.id.slice(-8)}</td>
                    <td className="px-8 py-7 text-xs font-bold text-slate-500 whitespace-nowrap">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-8 py-7">
                        <div className="font-black text-slate-900 text-sm tracking-tight">{sale.customerName}</div>
                    </td>
                    <td className="px-8 py-7">
                        <div className="flex flex-col gap-1 max-w-[300px]">
                            {sale.items.map((i, idx) => (
                                <span key={idx} className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">
                                   <span className="text-indigo-600 font-black">{i.quantity}x</span> {i.productName}
                                </span>
                            ))}
                        </div>
                    </td>
                    <td className="px-8 py-7 text-base font-black text-indigo-600 whitespace-nowrap tracking-tighter">₦{sale.total.toLocaleString()}</td>
                    <td className="px-8 py-7 whitespace-nowrap">
                        <Badge color={sale.paymentMethod === 'Credit' ? 'red' : 'green'} className="!px-4 !py-1.5">{sale.paymentMethod}</Badge>
                    </td>
                    <td className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        <div className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5" /> {sale.initiatedByName}</div>
                    </td>
                </tr>
                ))}
            </Table>
          </div>
          {filteredSales.length === 0 && (
              <div className="p-40 text-center text-slate-300">
                  <Receipt className="w-20 h-20 mx-auto mb-6 opacity-10" />
                  <p className="text-[11px] font-black uppercase tracking-[0.5em]">Audit logs are clean</p>
              </div>
          )}
        </Card>
      )}
    </div>
  );
};
