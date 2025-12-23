export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  SALES = 'SALES',
  USER = 'USER'
}

// --- App Identity & Security Types ---

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  // Added for the Settings profile sync
  lastLogin?: string;
}

export interface Invitation {
  token: string;
  email: string;
  name: string;
  role: Role;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  userId: string;
}

// --- Business Logic Types ---

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  customerId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  totalSpent: number;
  lastVisit: string;
  status: 'Active' | 'Inactive';
  createdByName?: string;
  transactions: Transaction[];
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
  createdByName?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  minStockLevel: number;
  createdByName?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  amountPaid: number;
  paymentMethod: string;
  initiatedBy?: string;
  initiatedByName?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'absent' | 'on-leave';
  attendance: string[]; // dates
}

export interface Expense {
  id: string;
  type: 'EXPENSE' | 'DEBIT' | 'DEPOSIT';
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  status: string;
  recordedByName?: string;
  supplierId?: string;
}

export interface PayrollEntry {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  amount: number;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  processedByName?: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  amount: number;
  type: 'SUPPLY' | 'PAYMENT' | 'REFUND' | 'EXPENSE';
  description: string;
  reference?: string;
  initiatedByName?: string;
  items?: { productId: string; productName: string; quantity: number; cost: number }[];
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'CORRECTION' | 'DAMAGE' | 'LOSS' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'INTERNAL_USE' | 'RETURN';
  quantity: number;
  date: string;
  reason: string;
  userId: string;
  userName: string;
}