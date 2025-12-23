
import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, CreditCard, Banknote, User, Fish } from 'lucide-react';
import { Customer, SaleItem, Role } from '../types';
import { Card, Table, Button, Input, Badge } from './Shared';
import { CustomerSearchHeader } from './Customers';

export const Sale: React.FC<{ 
  customers: Customer[];
  onProcessSale: (saleData: any) => void;
}> = ({ customers, onProcessSale }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const addItem = () => {
    if (!newItemName || newItemQty <= 0 || newItemPrice < 0) return;
    // Fixed: Updated property names to match SaleItem interface: productId instead of id, productName instead of name, and added required subtotal
    const item: SaleItem = {
      productId: Date.now().toString(),
      productName: newItemName,
      quantity: newItemQty,
      price: newItemPrice,
      subtotal: newItemQty * newItemPrice
    };
    setItems([...items, item]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  // Fixed: Updated to use productId instead of id as per SaleItem interface
  const removeItem = (id: string) => setItems(items.filter(i => i.productId !== id));
  
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleProcess = () => {
    if (!selectedCustomer) { alert("Please select a customer"); return; }
    if (items.length === 0) { alert("Cart is empty"); return; }
    
    onProcessSale({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items,
      total,
      amountPaid,
      paymentMethod,
      date: new Date().toISOString()
    });
    
    // Reset
    setItems([]);
    setSelectedCustomer(null);
    setAmountPaid(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <ShoppingCart size={24} className="text-blue-600" /> New Sale Transaction
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <label className="text-xs font-black uppercase text-slate-500 mb-2 block">1. Select Customer</label>
               <CustomerSearchHeader 
                  customers={customers}
                  placeholder="Type name or phone number..."
                  onSelect={setSelectedCustomer}
                  selectedCustomerId={selectedCustomer?.id}
               />
               {selectedCustomer && (
                 <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                       <User size={14} className="text-blue-500" /> {selectedCustomer.name}
                    </div>
                    <Badge color={selectedCustomer.balance > 0 ? 'red' : 'green'}>
                       Bal: ₦{selectedCustomer.balance.toLocaleString()}
                    </Badge>
                 </div>
               )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-xs font-black uppercase text-slate-500 mb-4 block">2. Add Items to Cart</label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Input 
                    placeholder="Item Name (e.g. Catfish Jumbo)" 
                    value={newItemName} 
                    onChange={e => setNewItemName(e.target.value)} 
                  />
                </div>
                <Input 
                  type="number" 
                  placeholder="Qty" 
                  value={newItemQty} 
                  onChange={e => setNewItemQty(Number(e.target.value))} 
                />
                <Input 
                  type="number" 
                  placeholder="Price" 
                  value={newItemPrice} 
                  onChange={e => setNewItemPrice(Number(e.target.value))} 
                />
              </div>
              <Button onClick={addItem} className="w-full mt-3 bg-slate-800 hover:bg-slate-900">
                <Plus size={16} /> Add to Cart
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <Table headers={['Item', 'Qty', 'Unit Price', 'Subtotal', '']}>
            {items.map(item => (
              // Fixed: Using productId instead of id and productName instead of name as per SaleItem interface
              <tr key={item.productId} className="text-sm font-medium text-slate-700">
                <td className="px-6 py-4 flex items-center gap-2"><Fish size={14} className="text-slate-400" /> {item.productName}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4">₦{item.price.toLocaleString()}</td>
                <td className="px-6 py-4 font-black">₦{(item.price * item.quantity).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => removeItem(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Your cart is empty.</td></tr>
            )}
          </Table>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6 bg-slate-900 text-white shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Order Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-bold">₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Discount</span>
              <span className="font-bold text-green-400">₦0.00</span>
            </div>
            <div className="pt-4 border-t border-slate-800 flex justify-between">
              <span className="text-lg font-black">Grand Total</span>
              <span className="text-2xl font-black text-blue-400">₦{total.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
           <label className="text-xs font-black uppercase text-slate-500 mb-4 block">3. Payment Information</label>
           <div className="space-y-4">
              <Input 
                label="Amount Paid" 
                type="number" 
                value={amountPaid} 
                onChange={e => setAmountPaid(Number(e.target.value))} 
              />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex items-center justify-center gap-2 py-2 border rounded-lg text-sm font-bold transition-all ${paymentMethod === 'Cash' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    <Banknote size={16} /> Cash
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('Transfer')}
                    className={`flex items-center justify-center gap-2 py-2 border rounded-lg text-sm font-bold transition-all ${paymentMethod === 'Transfer' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    <CreditCard size={16} /> Transfer
                  </button>
                </div>
              </div>
           </div>
           
           <Button onClick={handleProcess} className="w-full mt-6 py-4 text-lg font-black uppercase tracking-widest shadow-lg">
             Complete Sale
           </Button>
        </Card>
      </div>
    </div>
  );
};
