
import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Expense, Supplier, Role, Customer, Sale, AppUser, 
  ActivityLog, Product, PayrollEntry, Invitation, 
  SupplierTransaction, Transaction, TransactionType, 
  StockMovement, StaffMember, UserSystemStatus 
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
  lastSync: string | null;
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
  logout: () => Promise<void>;
  login: (email: string, pass: string) => Promise<any>;
  register: (name: string, email: string, pass: string, role: Role) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  getInventoryValuation: () => Promise<any[]>;
  syncData: () => Promise<void>;
  generateSyncKey: () => string;
  importFromSyncKey: (key: string) => boolean;
  createInvitation: (name: string, email: string, role: Role) => Promise<string>;
  revokeInvitation: (token: string) => Promise<void>;
  validateInvitation: (token: string) => Promise<any>;
  acceptInvitation: (token: string, name: string, password: string) => Promise<void>;
  updateUserStatus: (id: string, systemStatus: UserSystemStatus) => Promise<void>;
  deleteUserNode: (id: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  toggleUserStatus: (id: string, currentStatus: boolean) => Promise<void>;
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

/**
 * Enhanced Merge Logic: Prioritizes Server Data.
 * If server returns a list, we assume it's the master copy for that user's access level.
 */
const mergeData = <T extends { id?: string | number; token?: string }>(local: T[], remote: T[]): T[] => {
  // If remote exists, it becomes the new source of truth
  if (remote && Array.isArray(remote) && remote.length > 0) {
      return remote.sort((a: any, b: any) => {
        const timeA = new Date(a.date || a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.date || b.createdAt || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
  }
  return local;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => Storage.get('jireh_user'));
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => Storage.get('jireh_last_sync'));
  
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
  useEffect(() => { Storage.set('jireh_last_sync', lastSync); }, [lastSync]);

  const syncData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        expData, supData, prodData, custData, 
        saleData, logData, payData, movData, stxData, invSum, staffData, invData, userData
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
        ApiClient.get('/api/invitations').catch(() => []),
        ApiClient.get('/api/users').catch(() => [])
      ]);
      
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
      setUsersState(prev => mergeData(prev, userData));
      setLastSync(new Date().toISOString());
    } catch (e) {
      console.warn("Sync partially failed. System active in hybrid mode.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) syncData();
  }, [user, syncData]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const authUsers = JSON.parse(localStorage.getItem('jireh_users_auth') || '[]');
        const foundIdx = authUsers.findIndex((u: any) => u.email === email && u.password === pass);
        if (foundIdx !== -1) {
            const found = authUsers[foundIdx];
            
            if (found.systemStatus === 'SUSPENDED') throw new Error('Account Suspended. Contact Admin.');

            const now = new Date().toISOString();
            found.lastLogin = now;
            found.isOnline = true;
            authUsers[foundIdx] = found;
            localStorage.setItem('jireh_users_auth', JSON.stringify(authUsers));

            const userObj: User = { id: found.id, name: found.name, email: found.email, role: found.role };
            setUser(userObj);
            Storage.set('jireh_user', userObj);
            
            try {
              await ApiClient.post(`/api/users/${found.id}/session`, { lastLogin: now, isOnline: true });
            } catch(e) {}

            await syncData();
            return found;
        } else { throw new Error('Invalid credentials'); }
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    if (user) {
      const now = new Date().toISOString();
      try {
        await ApiClient.post(`/api/users/${user.id}/session`, { lastLogout: now, isOnline: false });
      } catch(e) {}
    }
    setUser(null);
    localStorage.removeItem('jireh_user');
    // Clear local storage on logout to ensure next login fetches fresh data
    const keysToKeep = ['jireh_users_auth']; 
    Object.keys(localStorage).forEach(k => {
        if (k.startsWith('jireh_') && !keysToKeep.includes(k)) localStorage.removeItem(k);
    });
  };

  const register = async (name: string, email: string, pass: string, role: Role) => {
    const authUsers = JSON.parse(localStorage.getItem('jireh_users_auth') || '[]');
    if (authUsers.some((u: any) => u.email === email)) { await login(email, pass); return; }
    const newUser = { 
      id: `u_${Date.now()}`, 
      name, 
      email, 
      password: pass, 
      role, 
      isActive: true, 
      systemStatus: 'OPERATIONAL' as UserSystemStatus,
      isOnline: false,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('jireh_users_auth', JSON.stringify([...authUsers, newUser]));
    setUsersState(prev => [...prev, { ...newUser } as any]);
    await login(email, pass);
  };

  const updateUserStatus = async (id: string, systemStatus: UserSystemStatus) => {
    setUsersState(prev => prev.map(u => u.id === id ? { ...u, systemStatus, isActive: systemStatus === 'OPERATIONAL' } : u));
    const authUsers = JSON.parse(localStorage.getItem('jireh_users_auth') || '[]');
    const idx = authUsers.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
        authUsers[idx].systemStatus = systemStatus;
        authUsers[idx].isActive = systemStatus === 'OPERATIONAL';
        localStorage.setItem('jireh_users_auth', JSON.stringify(authUsers));
    }
    try {
        await ApiClient.post(`/api/users/${id}/status`, { systemStatus });
    } catch(e) {}
  };

  const deleteUserNode = async (id: string) => {
    setUsersState(prev => prev.filter(u => u.id !== id));
    const authUsers = JSON.parse(localStorage.getItem('jireh_users_auth') || '[]');
    localStorage.setItem('jireh_users_auth', JSON.stringify(authUsers.filter((u: any) => u.id !== id)));
    try {
        await ApiClient.delete(`/api/users/${id}`);
    } catch(e) {}
  };

  const generateSyncKey = () => {
    const data = {
      expenses, suppliers, products, customers, sales, users, logs, payroll, invitations, stockMovements, supplierTransactions, staff
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  };

  const importFromSyncKey = (key: string) => {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(key))));
      if (data.expenses) setExpensesState(data.expenses);
      if (data.suppliers) setSuppliersState(data.suppliers);
      if (data.products) setProductsState(data.products);
      if (data.customers) setCustomersState(data.customers);
      if (data.sales) setSalesState(data.sales);
      if (data.users) setUsersState(data.users);
      if (data.logs) setLogsState(data.logs);
      if (data.payroll) setPayrollState(data.payroll);
      if (data.invitations) setInvitationsState(data.invitations);
      if (data.stockMovements) setStockMovements(data.stockMovements);
      if (data.supplierTransactions) setSupplierTransactions(data.supplierTransactions);
      if (data.staff) setStaffState(data.staff);
      return true;
    } catch (e) {
      return false;
    }
  };

  const getInventoryValuation = useCallback(async () => {
      return products.map((p) => ({
          id: p.id, name: p.name, sku: p.sku, category: p.category, quantity: p.quantity,
          unitCost: p.cost || 0, unitPrice: p.price, totalCost: p.quantity * (p.cost || 0),
          totalRetailValue: p.quantity * p.price, potentialProfit: (p.quantity * p.price) - (p.quantity * (p.cost || 0))
      }));
  }, [products]);

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

  const createInvitation = async (name: string, email: string, role: Role) => {
    try {
        const saved = await ApiClient.post('/api/invitations', { name, email, role });
        setInvitationsState(prev => [saved, ...prev]);
        return saved.token;
    } catch (e) {
        const token = Math.random().toString(36).substring(7);
        const newInvite: Invitation = { token, name, email, role, status: 'PENDING', createdAt: new Date().toISOString() };
        setInvitationsState(prev => [newInvite, ...prev]);
        return token;
    }
  };

  const revokeInvitation = async (token: string) => {
    setInvitationsState(prev => prev.filter(i => i.token !== token));
    try { await ApiClient.delete(`/api/invitations/${token}`); } catch (e) {}
  };

  const validateInvitation = async (token: string) => {
    try {
        return await ApiClient.get(`/api/invitations/validate/${token}`);
    } catch (e) {
        const found = invitations.find(i => i.token === token && i.status === 'PENDING');
        if (!found) throw new Error("Invalid Token");
        return found;
    }
  };

  const acceptInvitation = async (token: string, name: string, password: string) => {
    try {
        const result = await ApiClient.post('/api/invitations/accept', { token, name, password });
        const authUsers = JSON.parse(localStorage.getItem('jireh_users_auth') || '[]');
        const newUser = { 
          id: result.user.id, 
          name: result.user.name, 
          email: result.user.email, 
          password, 
          role: result.user.role, 
          isActive: true,
          systemStatus: 'OPERATIONAL' as UserSystemStatus,
          isOnline: true
        };
        localStorage.setItem('jireh_users_auth', JSON.stringify([...authUsers, newUser]));
        await login(result.user.email, password);
    } catch (e) {
        const invite = await validateInvitation(token);
        await register(name, invite.email, password, invite.role);
        setInvitationsState(prev => prev.map(i => i.token === token ? { ...i, status: 'ACCEPTED' } : i));
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUsersState(prev => prev.map(u => u.id === id ? { ...u, isActive: nextStatus } : u));
    try {
      await ApiClient.post(`/api/users/${id}/status`, { isActive: nextStatus });
    } catch (e) {
      console.warn("Status sync failure. Local update persisted.");
    }
  };

  const resetPassword = async (email: string) => {
    console.log("Password reset link requested for:", email);
    return new Promise<void>((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <AppContext.Provider value={{ 
      user, loading, expenses, suppliers, products, customers, sales, users, logs, payroll, invitations, stockMovements, supplierTransactions, inventorySummary, staff, lastSync,
      addExpense, setExpenses: setExpensesState, setSuppliers: setSuppliersState, setCustomers: setCustomersState, setProducts: setProductsState, setSales: setSalesState, addSale, addPayroll, addCustomer,
      addSupplier, addProduct, updateProduct, updateProductStock, adjustStock, receiveStock, addSupplierPayment, addSupplierFee, addStaffMember, markAttendance, updateStaffStatus, logout, login, register,
      updateUserProfile, getInventoryValuation, createInvitation, syncData, generateSyncKey, importFromSyncKey,
      validateInvitation, acceptInvitation, revokeInvitation, toggleUserStatus, resetPassword, updateUserStatus, deleteUserNode
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
