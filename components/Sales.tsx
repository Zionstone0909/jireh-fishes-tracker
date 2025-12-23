
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import usePersistentState from '../hooks/usePersistentState';
import { Card, Button, Input, Badge, Table, BackButton, Select } from './Shared';
import { CustomerSearchHeader } from './Customers';
import { 
  Plus, Search, Trash2, ShoppingCart, 
  User as UserIcon, X, Wallet, CreditCard, 
  DollarSign, UserCheck, LayoutList, PackageOpen, 
  Fish, Receipt, RefreshCw 
} from 'lucide-react';
import { SaleItem, Sale as SaleType, Customer, Role } from '../types';
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

  const goToLedger = (customerId: string) => {
    localStorage.setItem('last_ledger_customer', customerId);
    navigate(isAdmin ? '/admin/customer-ledger' : '/staff/customer-ledger');
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
             <div className="w-full md:w-80">
                <CustomerSearchHeader 
                    customers={customers}
                    placeholder="Assign client..."
                    onSelect={(c) => setSelectedCustomer(c)}
                    selectedCustomerId={selectedCustomer?.id}
                />
            </div>
        )}
      </div>

      {activeTab === 'pos' ? (
        <div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          style={{ height: 'auto', minHeight: 'calc(100vh - 280px)' }}
        >
          {/* Inventory Selection (Left Column) */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
            <div className="relative shrink-0">
                <Search className="w-4 h-4 absolute left-3.5 top-4 text-slate-400" />
                <input 
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white shadow-sm"
                  placeholder="Scan SKU or search product catalog..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div 
              className="flex-1 overflow-y-auto pr-2 scroll-smooth no-scrollbar"
              style={{ maxHeight: 'calc(100vh - 350px)' }}
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-8">
                    {filteredProducts.map(product => (
                        <div 
                            key={product.id} 
                            className={`p-4 bg-white border border-slate-100 rounded-3xl flex flex-col justify-between shadow-sm transition-all group ${product.quantity > 0 ? 'hover:shadow-xl cursor-pointer hover:border-indigo-400 hover:-translate-y-1' : 'opacity-60 cursor-not-allowed bg-slate-50'}`}
                            onClick={() => addToCart(product)}
                            style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        >
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge color={product.quantity > product.minStockLevel ? 'green' : 'red'}>
                                        Qty: {product.quantity}
                                    </Badge>
                                </div>
                                <h4 className="font-black text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors h-10">{product.name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter truncate">{product.sku}</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tighter">₦{product.price.toLocaleString()}</span>
                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${product.quantity > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 group-hover:scale-110 active:scale-95' : 'bg-slate-200 text-slate-400'}`}>
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-24 text-center text-slate-300">
                            <PackageOpen className="w-16 h-16 mx-auto mb-4 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No products identified</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Cart & Checkout (Right Column) */}
          <Card 
            className="flex flex-col h-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-0 ring-1 ring-slate-100"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 shrink-0">
               <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">
                  <span className="flex items-center gap-1.5"><UserCheck className="w-3 h-3" /> Staff: {user?.name}</span>
                  <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Sync Active</span>
               </div>
              {selectedCustomer ? (
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200 shrink-0">
                              <UserIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                              <p className="font-black text-slate-900 text-sm truncate tracking-tight">{selectedCustomer.name}</p>
                              <div className="flex gap-3">
                                <button 
                                    onClick={() => goToLedger(selectedCustomer.id)}
                                    className="text-[9px] text-indigo-600 font-black uppercase hover:underline tracking-widest"
                                >
                                    Ledger
                                </button>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedCustomer.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    ₦{selectedCustomer.balance.toLocaleString()}
                                </span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
              ) : (
                  <div className="text-center p-5 text-slate-400 bg-white/50 border border-dashed border-slate-200 rounded-3xl text-[9px] font-black uppercase tracking-[0.3em]">
                       Walk-in Transaction
                  </div>
              )}
            </div>

            <div 
              className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar"
              style={{ minHeight: '200px' }}
            >
              {cart.map(item => (
                <div key={item.productId} className="flex gap-4 border-b border-slate-50 pb-5 last:border-0 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-900 truncate tracking-tight">{item.productName}</p>
                    <div className="flex items-center gap-3 mt-2">
                         <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                             <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-200 transition-colors font-bold" onClick={() => updateCartItem(item.productId, 'quantity', item.quantity - 1)}>-</button>
                             <input className="w-9 text-center text-xs font-black text-indigo-700 bg-white border-x border-slate-200 py-1.5" value={item.quantity} readOnly />
                             <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-200 transition-colors font-bold" onClick={() => updateCartItem(item.productId, 'quantity', item.quantity + 1)}>+</button>
                         </div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">@ ₦{item.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-black text-slate-900 text-sm tracking-tighter">₦{(item.subtotal || 0).toLocaleString()}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="text-slate-200 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-200 py-12 opacity-60">
                  <div className="p-7 bg-slate-50 rounded-full border border-dashed border-slate-200 mb-5">
                    <PackageOpen className="w-14 h-14" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Order</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-8 border-t border-slate-100 space-y-6 shadow-inner shrink-0">
              <div className="flex justify-between items-center">
                <span className="uppercase text-[9px] font-black tracking-[0.3em] text-slate-400">Total Payable</span>
                <span className="text-3xl sm:text-4xl font-black text-indigo-700 tracking-tighter">₦{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <Select 
                    label="PAY METHOD"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="!font-black !text-[10px] !uppercase !tracking-[0.2em] !rounded-2xl"
                  >
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Bank Transfer</option>
                      <option value="Card">POS Terminal</option>
                      <option value="Credit">Ledger Debit</option>
                  </Select>
                  <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</label>
                      <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-xs">₦</span>
                          <input 
                              type="number"
                              className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-black text-sm shadow-sm transition-all"
                              value={amountPaid}
                              onChange={(e) => setAmountPaid(e.target.value)}
                          />
                      </div>
                  </div>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-4 border-t border-slate-200 border-dashed">
                  {Number(amountPaid) >= cartTotal ? (
                      <>
                        <span className="text-slate-400 font-black uppercase tracking-[0.2em]">Change Back:</span>
                        <span className="font-black text-emerald-600 text-base tracking-tighter">₦{changeDue.toLocaleString()}</span>
                      </>
                  ) : (
                      <>
                        <span className="text-slate-400 font-black uppercase tracking-[0.2em]">Owed Balance:</span>
                        <span className="font-black text-red-600 text-base tracking-tighter">₦{balanceDue.toLocaleString()}</span>
                      </>
                  )}
              </div>

              <Button 
                className="w-full py-5 text-[11px] font-black uppercase tracking-[0.35em] shadow-2xl shadow-indigo-100 rounded-2xl active:scale-95 transition-all bg-indigo-600 hover:bg-indigo-700 text-white" 
                onClick={handleCheckout} 
                disabled={cart.length === 0}
              >
                Submit Transaction
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-white rounded-[2.5rem] overflow-hidden shadow-lg border-0 ring-1 ring-slate-100 animate-in slide-in-from-bottom-4 duration-700">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/20">
            <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Audit Trail Logs</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction History & Forensic Verification</p>
            </div>
            <div className="w-full md:w-96 relative">
              <Search className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
              <input 
                placeholder="Filter by ref ID or customer..." 
                className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white shadow-sm"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <Table headers={['Audit ID', 'Timestamp', 'Client Entity', 'Line Items', 'Total', 'Payment', 'Agent']}>
                {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-6 py-6 text-[10px] text-slate-400 font-black uppercase tracking-tighter">#{sale.id.slice(-6)}</td>
                    <td className="px-6 py-6 text-xs font-bold text-slate-500 whitespace-nowrap">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-6 py-6 text-sm font-black text-slate-900 whitespace-nowrap tracking-tight">{sale.customerName}</td>
                    <td className="px-6 py-6">
                        <div className="flex flex-col gap-1 max-w-[250px] truncate">
                            {sale.items.map((i, idx) => (
                                <span key={idx} className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                   <span className="text-indigo-600">{i.quantity}x</span> {i.productName}
                                </span>
                            ))}
                        </div>
                    </td>
                    <td className="px-6 py-6 text-sm font-black text-slate-900 whitespace-nowrap tracking-tight">₦{sale.total.toLocaleString()}</td>
                    <td className="px-6 py-6 whitespace-nowrap">
                        <Badge color={sale.paymentMethod === 'Credit' ? 'red' : 'emerald'} className="!px-3 !py-1">{sale.paymentMethod}</Badge>
                    </td>
                    <td className="px-6 py-6 text-[10px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5" />
                            {sale.initiatedByName}
                        </div>
                    </td>
                </tr>
                ))}
            </Table>
          </div>
          {filteredSales.length === 0 && (
              <div className="p-32 text-center text-slate-300">
                  <Receipt className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">No history detected</p>
              </div>
          )}
        </Card>
      )}
    </div>
  );
};
