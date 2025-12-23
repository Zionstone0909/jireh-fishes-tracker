
import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  Expense, Supplier, Role, Customer, Sale, AppUser, 
  ActivityLog, Product, PayrollEntry, Invitation, 
  SupplierTransaction, Transaction, TransactionType, 
  StockMovement, StaffMember 
} from '../types';
import ApiClient from '../services/ApiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface InventorySummary {
    totalItems: number;
    lowStockItems: number;
    totalValueAtCost: number;
    totalValueAtRetail: number;
    projectedMargin: number;
    lastAuditDate: string;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  expenses: Expense[];
  suppliers: Supplier[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  users: AppUser[];
  logs: ActivityLog[];
  payroll: PayrollEntry[];
  invitations: Invitation[];
  stockMovements: StockMovement[];
  supplierTransactions: SupplierTransaction[];
  inventorySummary: InventorySummary | null;
  staff: StaffMember[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense>;
  setExpenses: (expenses: Expense[]) => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setProducts: (products: Product[]) => void;
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  updateProductStock: (id: string, delta: number) => Promise<void>;
  adjustStock: (productId: string, quantity: number, type: StockMovement['type'], reason: string) => Promise<void>;
  receiveStock: (supplierId: string, items: { productId: string, quantity: number, cost: number }[]) => Promise<void>;
  addSupplierPayment: (paymentData: { supplierId: string, supplierName: string, amount: number, paymentMethod: string, reference?: string, description: string, date: string }) => Promise<void>;
  addSupplierFee: (feeData: { supplierId: string, supplierName: string, amount: number, description: string, date: string }) => Promise<void>;
  setSales: (sales: Sale[]) => void;
  addSale: (saleData: any) => Promise<void>;
  addPayroll: (payrollData: Omit<PayrollEntry, 'id'>) => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'transactions'>) => Promise<void>;
  addStaffMember: (data: Omit<StaffMember, 'id' | 'attendance'>) => Promise<void>;
  markAttendance: (staffId: string) => Promise<void>;
  updateStaffStatus: (staffId: string, status: StaffMember['status']) => Promise<void>;
  logout: () => void;
  validateInvitation: (token: string) => Promise<any>;
  acceptInvitation: (token: string, pass: string, email: string, name: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<any>;
  register: (name: string, email: string, pass: string, role: Role) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  createInvitation: (name: string, email: string, role: Role) => Promise<string>;
  revokeInvitation: (token: string) => Promise<void>;
  toggleUserStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  fetchLastInvitation: () => Promise<Invitation | null>;
  getInventoryValuation: () => Promise<any[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const Storage = {
  get: (key: string) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val)),
};

// CRITICAL: Helper to merge local state with server data instead of replacing it.
// This prevents history loss when the server resets or returns empty.
const mergeData = <T extends { id?: string | number; token?: string }>(local: T[], remote: T[]): T[] => {
  if (!remote || remote.length === 0) return local;
  const localMap = new Map(local.map(item => [item.id || item.token, item]));
  remote.forEach(item => {
    const key = item.id || item.token;
    if (key) localMap.set(key, item);
  });
  return Array.from(localMap.values()).sort((a: any, b: any) => {
    const timeA = new Date(a.date || a.createdAt || 0).getTime();
    const timeB = new Date(b.date || b.createdAt || 0).getTime();
    return timeB - timeA; // Descending for history
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => Storage.get('jireh_user'));
  const [loading, setLoading] = useState(false);
  
  const [expenses, setExpensesState] = useState<Expense[]>(() => Storage.get('jireh_expenses') || []);
  const [suppliers, setSuppliersState] = useState<Supplier[]>(() => Storage.get('jireh_suppliers') || []);
  const [products, setProductsState] = useState<Product[]>(() => Storage.get('jireh_products') || []);
  const [customers, setCustomersState] = useState<Customer[]>(() => Storage.get('jireh_customers') || []);
  const [sales, setSalesState] = useState<Sale[]>(() => Storage.get('jireh_sales') || []);
  const [users, setUsersState] = useState<AppUser[]>(() => Storage.get('jireh_users') || []);
  const [logs, setLogsState] = useState<ActivityLog[]>(() => Storage.get('jireh_logs') || []);
  const [payroll, setPayrollState] = useState<PayrollEntry[]>(() => Storage.get('jireh_payroll') || []);
  const [invitations, setInvitationsState] = useState<Invitation[]>(() => Storage.get('jireh_invitations') || []);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => Storage.get('jireh_stock_movements') || []);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(() => Storage.get('jireh_supplier_txs') || []);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(() => Storage.get('jireh_inv_summary'));
  const [staff, setStaffState] = useState<StaffMember[]>(() => Storage.get('jireh_staff_members') || []);

  useEffect(() => { Storage.set('jireh_expenses', expenses); }, [expenses]);
  useEffect(() => { Storage.set('jireh_suppliers', suppliers); }, [suppliers]);
  useEffect(() => { Storage.set('jireh_products', products); }, [products]);
  useEffect(() => { Storage.set('jireh_customers', customers); }, [customers]);
  useEffect(() => { Storage.set('jireh_sales', sales); }, [sales]);
  useEffect(() => { Storage.set('jireh_users', users); }, [users]);
  useEffect(() => { Storage.set('jireh_logs', logs); }, [logs]);
  useEffect(() => { Storage.set('jireh_payroll', payroll); }, [payroll]);
  useEffect(() => { Storage.set('jireh_invitations', invitations); }, [invitations]);
  useEffect(() => { Storage.set('jireh_stock_movements', stockMovements); }, [stockMovements]);
  useEffect(() => { Storage.set('jireh_supplier_txs', supplierTransactions); }, [supplierTransactions]);
  useEffect(() => { Storage.set('jireh_inv_summary', inventorySummary); }, [inventorySummary]);
  useEffect(() => { Storage.set('jireh_staff_members', staff); }, [staff]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [
            expData, supData, prodData, custData, 
            saleData, logData, payData, movData, stxData, invSum, staffData, invData
          ] = await Promise.all([
            ApiClient.get('/api/expenses').catch(() => []),
            ApiClient.get('/api/suppliers').catch(() => []),
            ApiClient.get('/api/products').catch(() => []),
            ApiClient.get('/api/customers').catch(() => []),
            ApiClient.get('/api/sales').catch(() => []),
            ApiClient.get('/api/logs').catch(() => []),
            ApiClient.get('/api/payroll').catch(() => []),
            ApiClient.get('/api/stock-movements').catch(() => []),
            ApiClient.get('/api/supplier-transactions').catch(() => []),
            ApiClient.get('/api/inventory/summary').catch(() => null),
            ApiClient.get('/api/staff').catch(() => []),
            ApiClient.get('/api/invitations').catch(() => [])
          ]);
          
          // Use merging to ensure local data is not deleted by empty server responses
          setExpensesState(prev => mergeData(prev, expData));
          setSuppliersState(prev => mergeData(prev, supData));
          setProductsState(prev => mergeData(prev, prodData));
          setCustomersState(prev => mergeData(prev, custData));
          setSalesState(prev => mergeData(prev, saleData));
          setLogsState(prev => mergeData(prev, logData));
          setPayrollState(prev => mergeData(prev, payData));
          setStockMovements(prev => mergeData(prev, movData));
          setSupplierTransactions(prev => mergeData(prev, stxData));
          if (invSum) setInventorySummary(invSum);
          setStaffState(prev => mergeData(prev, staffData));
          setInvitationsState(prev => mergeData(prev as any, invData as any) as any);
        } catch (e) {
          console.warn("Sync failed. Using Local-Only Mode.");
        }
      };
      fetchData();
    }
  }, [user]);

  const addLog = async (action: string, details: string) => {
    const newLog = {
        id: `log_${Date.now()}`,
        action,
        details,
        userId: user?.id || 'system',
        timestamp: new Date().toISOString()
    };
    setLogsState(prev => [newLog, ...prev]);
    try { await ApiClient.post('/api/logs', newLog); } catch (e) {}
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const tempId = `exp_${Date.now()}`;
    const newExpense = { ...expenseData, id: tempId };
    setExpensesState(prev => [newExpense, ...prev]);
    try {
        const saved = await ApiClient.post('/api/expenses', expenseData);
        setExpensesState(prev => prev.map(e => e.id === tempId ? saved : e));
        return saved;
    } catch (e) {
        return newExpense;
    }
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    const tempId = `sup_${Date.now()}`;
    const newItem = { ...supplierData, id: tempId };
    setSuppliersState(prev => [...prev, newItem]);
    try {
        const saved = await ApiClient.post('/api/suppliers', supplierData);
        setSuppliersState(prev => prev.map(s => s.id === tempId ? saved : s));
    } catch (e) {}
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const tempId = `prod_${Date.now()}`;
    const newItem = { ...productData, id: tempId };
    setProductsState(prev => [...prev, newItem]);
    try {
        const saved = await ApiClient.post('/api/products', productData);
        setProductsState(prev => prev.map(p => p.id === tempId ? saved : p));
    } catch (e) {}
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    setProductsState(prev => prev.map(p => p.id === id ? { ...p, ...productData } : p));
    try { await ApiClient.post(`/api/products/${id}`, productData); } catch (e) {}
  };

  const updateProductStock = async (id: string, delta: number) => {
    setProductsState(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity + delta } : p));
    try { await ApiClient.post(`/api/products/${id}/stock`, { delta }); } catch (e) {}
  };

  const adjustStock = async (productId: string, quantity: number, type: StockMovement['type'], reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const movement = {
      id: `mov_${Date.now()}`,
      productId,
      productName: product.name,
      type,
      quantity,
      date: new Date().toISOString(),
      reason,
      userId: user?.id || 'system',
      userName: user?.name || 'System'
    };
    setStockMovements(prev => [movement, ...prev]);
    await updateProductStock(productId, quantity);
    try { await ApiClient.post('/api/stock-movements', movement); } catch (e) {}
  };

  const receiveStock = async (supplierId: string, items: { productId: string, quantity: number, cost: number }[]) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    const supplierTx = {
      id: `stx_${Date.now()}`,
      supplierId,
      supplierName: supplier.name,
      amount: totalAmount,
      type: 'SUPPLY' as const,
      date: new Date().toISOString(),
      description: `Stock Received: ${items.length} SKUs`,
      initiatedByName: user?.name || 'System',
      items: items.map(it => ({ ...it, productName: products.find(prod => prod.id === it.productId)?.name || 'Unknown' }))
    };
    setSupplierTransactions(prev => [supplierTx, ...prev]);
    for (const item of items) { await adjustStock(item.productId, item.quantity, 'TRANSFER_IN', `From vendor ${supplier.name}`); }
    try { await ApiClient.post('/api/supplier-transactions', supplierTx); } catch (e) {}
  };

  const addSupplierPayment = async (paymentData: any) => {
    const supplierTx = { ...paymentData, id: `stx_${Date.now()}`, type: 'PAYMENT' as const, initiatedByName: user?.name || 'System' };
    setSupplierTransactions(prev => [supplierTx, ...prev]);
    await addExpense({
        type: 'EXPENSE',
        date: paymentData.date,
        category: 'Supplier Payment',
        description: `Paid ${paymentData.supplierName}`,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        status: 'Paid',
        supplierId: paymentData.supplierId,
        recordedByName: user?.name || 'System'
    });
    try { await ApiClient.post('/api/supplier-transactions', supplierTx); } catch (e) {}
  };

  const addSupplierFee = async (feeData: any) => {
    const supplierTx = { ...feeData, id: `stx_${Date.now()}`, type: 'EXPENSE' as const, initiatedByName: user?.name || 'System' };
    setSupplierTransactions(prev => [supplierTx, ...prev]);
    await addExpense({
        type: 'EXPENSE',
        date: feeData.date,
        category: 'Supplier Fee',
        description: feeData.description,
        amount: feeData.amount,
        paymentMethod: 'N/A',
        status: 'Paid',
        supplierId: feeData.supplierId,
        recordedByName: user?.name || 'System'
    });
    try { await ApiClient.post('/api/supplier-transactions', supplierTx); } catch (e) {}
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'transactions'>) => {
    const tempId = `cust_${Date.now()}`;
    const newItem = { ...customerData, id: tempId, transactions: [] };
    setCustomersState(prev => [...prev, newItem]);
    try {
        const saved = await ApiClient.post('/api/customers', customerData);
        setCustomersState(prev => prev.map(c => c.id === tempId ? saved : c));
    } catch (e) {}
  };

  const addSale = async (saleData: any) => {
    const tempId = `sale_${Date.now()}`;
    const newSale = { ...saleData, id: tempId };
    setSalesState(prev => [newSale, ...prev]);
    for (const item of newSale.items) { await updateProductStock(item.productId, -item.quantity); }
    if (newSale.customerId) {
        setCustomersState(prev => prev.map(c => {
            if (c.id === newSale.customerId) {
                return { ...c, balance: c.balance + (newSale.total - newSale.amountPaid), totalSpent: c.totalSpent + newSale.total, lastVisit: new Date().toISOString() };
            }
            return c;
        }));
    }
    try { await ApiClient.post('/api/sales', saleData); } catch (e) {}
  };

  const addPayroll = async (payrollData: Omit<PayrollEntry, 'id'>) => {
    const tempId = `pay_${Date.now()}`;
    const newEntry = { ...payrollData, id: tempId };
    setPayrollState(prev => [newEntry, ...prev]);
    await addExpense({ 
      type: 'EXPENSE', 
      date: payrollData.paymentDate, 
      category: 'Payroll', 
      description: `Salary: ${payrollData.staffName}`, 
      amount: payrollData.amount, 
      paymentMethod: 'Bank Transfer', 
      status: 'Paid', 
      recordedByName: user?.name || 'System' 
    });
    try { await ApiClient.post('/api/payroll', payrollData); } catch (e) {}
  };

  const addStaffMember = async (staffData: Omit<StaffMember, 'id' | 'attendance'>) => {
    const tempId = `staff_${Date.now()}`;
    const newItem = { ...staffData, id: tempId, attendance: [] };
    setStaffState(prev => [...prev, newItem]);
    try {
        const saved = await ApiClient.post('/api/staff', staffData);
        setStaffState(prev => prev.map(s => s.id === tempId ? saved : s));
    } catch (e) {}
  };

  const markAttendance = async (staffId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setStaffState(prev => prev.map(s => {
        if (s.id === staffId) {
            const att = Array.isArray(s.attendance) ? s.attendance : [];
            if (!att.includes(today)) return { ...s, attendance: [...att, today] };
        }
        return s;
    }));
    try { await ApiClient.post(`/api/staff/${staffId}/attendance`, {}); } catch (e) {}
  };

  const updateStaffStatus = async (staffId: string, status: StaffMember['status']) => {
    setStaffState(prev => prev.map(s => s.id === staffId ? { ...s, status } : s));
    try { await ApiClient.post(`/api/staff/${staffId}/update`, { status }); } catch (e) {}
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jireh_user');
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const authUsers = JSON.parse(localStorage.getItem('jireh_users_auth') || '[]');
        const found = authUsers.find((u: any) => u.email === email && u.password === pass);
        if (found) {
            const userObj: User = { id: found.id, name: found.name, email: found.email, role: found.role };
            setUser(userObj);
            Storage.set('jireh_user', userObj);
            return userObj;
        } else { throw new Error('Invalid credentials'); }
    } finally { setLoading(false); }
  };

  const register = async (name: string, email: string, pass: string, role: Role) => {
    const authUsers = JSON.parse(localStorage.getItem('jireh_users_auth') || '[]');
    if (authUsers.some((u: any) => u.email === email)) { await login(email, pass); return; }
    const newUser = { id: `u_${Date.now()}`, name, email, password: pass, role, isActive: true };
    localStorage.setItem('jireh_users_auth', JSON.stringify([...authUsers, newUser]));
    setUsersState(prev => [...prev, { id: newUser.id, name, email, role, isActive: true }]);
    await login(email, pass);
  };

  const updateUserProfile = async (name: string) => {
    if (!user) return;
    const updatedUser = { ...user, name };
    setUser(updatedUser);
    Storage.set('jireh_user', updatedUser);
    const authUsers = JSON.parse(localStorage.getItem('jireh_users_auth') || '[]');
    const idx = authUsers.findIndex((u: any) => u.id === user.id);
    if (idx !== -1) {
        authUsers[idx].name = name;
        localStorage.setItem('jireh_users_auth', JSON.stringify(authUsers));
    }
  };

  const getInventoryValuation = async () => {
      return products.map((p) => ({
          id: p.id, name: p.name, sku: p.sku, category: p.category, quantity: p.quantity,
          unitCost: p.cost || 0, unitPrice: p.price, totalCost: p.quantity * (p.cost || 0),
          totalRetailValue: p.quantity * p.price, potentialProfit: (p.quantity * p.price) - (p.quantity * (p.cost || 0))
      }));
  };

  const createInvitation = async (name: string, email: string, role: Role) => {
    const token = Math.random().toString(36).substring(7);
    const newInvite: Invitation = { token, name, email, role, status: 'PENDING', createdAt: new Date().toISOString() };
    setInvitationsState(prev => [newInvite, ...prev]);
    return token;
  };

  const revokeInvitation = async (token: string) => {
    setInvitationsState(prev => prev.filter(i => i.token !== token));
    try { await ApiClient.delete(`/api/invitations/${token}`); } catch (e) {}
  };

  const validateInvitation = async (token: string) => {
    const found = invitations.find(i => i.token === token && i.status === 'PENDING');
    if (!found) throw new Error("Invalid Token");
    return found;
  };

  return (
    <AppContext.Provider value={{ 
      user, loading, expenses, suppliers, products, customers, sales, users, logs, payroll, invitations, stockMovements, supplierTransactions, inventorySummary, staff,
      addExpense, setExpenses: setExpensesState, setSuppliers: setSuppliersState, setCustomers: setCustomersState, setProducts: setProductsState, setSales: setSalesState, addSale, addPayroll, addCustomer,
      addSupplier, addProduct, updateProduct, updateProductStock, adjustStock, receiveStock, addSupplierPayment, addSupplierFee, addStaffMember, markAttendance, updateStaffStatus, logout, login, register,
      updateUserProfile, getInventoryValuation, createInvitation, 
      validateInvitation, 
      acceptInvitation: async () => {}, 
      resetPassword: async () => {}, 
      revokeInvitation, 
      toggleUserStatus: async () => {}, 
      fetchLastInvitation: async () => null
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
