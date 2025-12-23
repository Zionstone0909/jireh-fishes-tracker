
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button, Input, Table, Badge, BackButton } from './Shared';
import { Plus, Edit2, Archive, User as UserIcon, Loader2, X, ShieldAlert } from 'lucide-react';
import usePersistentState from '../hooks/usePersistentState';
import { Product, Role } from '../types';

export const Inventory = ({ onBack }: { onBack?: () => void }) => {
  const { products, addProduct, updateProduct, updateProductStock, user } = useApp();
  const [showAddForm, setShowAddForm] = usePersistentState<boolean>('Inventory.showAddForm', false);
  
  const [newProduct, setNewProduct] = usePersistentState<Partial<Product>>('Inventory.newProduct', {});
  const [editingId, setEditingId] = usePersistentState<string | null>('Inventory.editingId', null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === Role.ADMIN;

  // STRICT ACCESS CONTROL
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <BackButton onClick={onBack} />
        <Card className="p-12 text-center bg-red-50 border-dashed border-2 border-red-200">
           <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
           <h2 className="text-xl font-black text-red-900 uppercase">Access Denied</h2>
           <p className="text-red-600 mt-2">Only administrators can manage the master inventory list.</p>
        </Card>
      </div>
    );
  }

  const handleAddNewClick = () => {
      setNewProduct({});
      setEditingId(null);
      setShowAddForm(true);
  };

  const handleEditClick = (product: Product) => {
      setNewProduct({
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          cost: product.cost,
          quantity: product.quantity,
          minStockLevel: product.minStockLevel
      });
      setEditingId(product.id);
      setShowAddForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
      setShowAddForm(false);
      setNewProduct({});
      setEditingId(null);
      setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    
    setIsSubmitting(true);
    try {
      const productData = {
        name: newProduct.name!,
        sku: newProduct.sku || 'N/A',
        category: newProduct.category || 'General',
        price: Number(newProduct.price),
        cost: Number(newProduct.cost) || 0,
        quantity: Number(newProduct.quantity) || 0,
        minStockLevel: Number(newProduct.minStockLevel) || 5
      };

      if (editingId) {
          await updateProduct(editingId, productData);
          alert('Product updated successfully');
      } else {
          await addProduct(productData);
      }

      setNewProduct({});
      setEditingId(null);
      setShowAddForm(false);
      
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <BackButton onClick={onBack} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Master Inventory</h1>
          <p className="text-slate-500 text-sm font-medium">Full control over product registry and pricing.</p>
        </div>
        {!showAddForm && (
          <Button onClick={handleAddNewClick} disabled={isSubmitting} className="w-full sm:w-auto font-black uppercase tracking-widest text-xs">
            <Plus className="w-4 h-4 mr-1" /> Create New Item
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-4 sm:p-6 mb-6 bg-indigo-50 border-indigo-100 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-indigo-900 uppercase tracking-widest text-xs">{editingId ? 'Modify Record' : 'Add to Catalog'}</h3>
            <button onClick={handleCancel} className="text-indigo-400 hover:text-indigo-700 transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input 
              label="Product Name"
              placeholder="e.g. Jumbo Catfish" 
              value={newProduct.name || ''} 
              onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
              required 
              disabled={isSubmitting}
            />
            <Input 
              label="SKU / Barcode"
              placeholder="e.g. CF-001" 
              value={newProduct.sku || ''} 
              onChange={e => setNewProduct({...newProduct, sku: e.target.value})} 
              required 
              disabled={isSubmitting}
            />
            <Input 
              label="Category"
              placeholder="e.g. Fresh Fish" 
              value={newProduct.category || ''} 
              onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
              disabled={isSubmitting}
            />
            <Input 
              label="Selling Price (₦)"
              placeholder="0.00" 
              type="number" 
              value={newProduct.price || ''} 
              onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} 
              required 
              disabled={isSubmitting}
            />
            <Input 
              label="Cost Price (₦)"
              placeholder="0.00" 
              type="number" 
              value={newProduct.cost !== undefined ? newProduct.cost : ''} 
              onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} 
              disabled={isSubmitting}
            />
            <Input 
              label="Initial Quantity"
              placeholder="0" 
              type="number" 
              value={newProduct.quantity !== undefined ? newProduct.quantity : ''} 
              onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})} 
              disabled={isSubmitting}
            />
            <Input 
              label="Alert Level"
              placeholder="5" 
              type="number" 
              value={newProduct.minStockLevel !== undefined ? newProduct.minStockLevel : ''} 
              onChange={e => setNewProduct({...newProduct, minStockLevel: Number(e.target.value)})} 
              disabled={isSubmitting}
            />
            <div className="flex items-end gap-2">
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting} className="flex-1 font-bold">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 font-bold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing
                  </>
                ) : (editingId ? 'Update' : 'Save')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden border-slate-200/60 shadow-md">
        <div className="overflow-x-auto">
          <Table headers={['Name', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions']}>
            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50 group transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                </td>
                <td className="px-6 py-4 text-xs font-black text-slate-400 whitespace-nowrap uppercase tracking-tighter">{product.sku}</td>
                <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{product.category}</td>
                <td className="px-6 py-4 text-sm font-black text-slate-900 whitespace-nowrap">₦{product.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg min-w-[40px] text-center border border-indigo-100 shadow-sm">{product.quantity}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateProductStock(product.id, 1)} className="w-6 h-6 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md font-black transition-colors border border-emerald-100">+</button>
                      <button onClick={() => updateProductStock(product.id, -1)} className="w-6 h-6 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-black transition-colors border border-red-100">-</button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.quantity <= product.minStockLevel ? (
                    <Badge color="red">Critically Low</Badge>
                  ) : (
                    <Badge color="green">Healthy</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  <button 
                      onClick={() => handleEditClick(product)}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-black text-[10px] uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Item
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                     <Archive size={48} className="opacity-20" />
                     <p className="font-black uppercase tracking-widest text-xs">The inventory is empty.</p>
                  </div>
                </td>
              </tr>
            )}
          </Table>
        </div>
      </Card>
    </div>
  );
};
