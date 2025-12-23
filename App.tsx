import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Role } from './types';
import { Settings } from './components/Settings';
import { Customers } from './components/Customers';
import { SupplierManagement } from './components/SupplierManagement';
import { CustomerLedger } from './components/CustomerLedger';
import { SupplierLedger } from './components/SupplierLedger';
import { LoginPage } from './components/LoginPage';

// --- Shared Components ---
import { Loader2 } from 'lucide-react';

// --- Imports ---
import { Dashboard } from './components/Dashboard'; 
import { Inventory } from './components/Inventory';
import { Stock } from './components/Stock';
import { Sales } from './components/Sales';
import { CompanyExpenses } from './components/CompanyExpenses';
import { BankDeposit } from './components/BankDeposit';
import { Payroll } from './components/Payroll';
import { Reports } from './components/Reports';
import { StaffManagement } from './components/StaffManagement';
import { Staff } from './components/Staff';

import { 
  ShoppingCart, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  User as UserIcon, 
  X,
  ChevronRight,
  Package,
  DollarSign,
  Briefcase,
  Users,
  FileText,
  CreditCard,
  Settings as SettingsIcon,
  Truck,
  BookOpen,
  Zap,
  UserCheck
} from 'lucide-react';

// --- Layout & Navigation ---
export const Layout = () => {
  const { user, products, logout } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { type: 'header', label: 'Trading Desk' },
    { name: "Sales POS", href: isAdmin ? "/admin/sales" : "/staff/sales", icon: <Zap className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Inventory", href: "/admin/inventory", icon: <Package className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Stock Matrix", href: "/admin/stock", icon: <Truck className="w-5 h-5" />, roles: [Role.ADMIN], badge: lowStockProducts.length },
    { name: "Stock View", href: "/staff/stock", icon: <Package className="w-5 h-5" />, roles: [Role.STAFF] },
    
    { type: 'header', label: 'Stakeholders' },
    { name: "Customers", href: isAdmin ? "/admin/customers" : "/staff/customers", icon: <Users className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Customer Ledger", href: isAdmin ? "/admin/customer-ledger" : "/staff/customer-ledger", icon: <BookOpen className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Suppliers", href: "/admin/suppliers", icon: <Truck className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Supplier Ledger", href: "/admin/supplier-ledger", icon: <FileText className="w-5 h-5" />, roles: [Role.ADMIN] },

    { type: 'header', label: 'Personnel' },
    { name: "Staff Roster", href: isAdmin ? "/admin/staff-roster" : "/staff/staff-roster", icon: <UserCheck className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Payroll Hub", href: "/admin/payroll", icon: <CreditCard className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Access Control", href: "/admin/staff-management", icon: <SettingsIcon className="w-5 h-5" />, roles: [Role.ADMIN] },

    { type: 'header', label: 'Treasury' },
    { name: "Expenses", href: "/admin/company-expenses", icon: <DollarSign className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Bank Deposits", href: "/admin/bank-deposit", icon: <Briefcase className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "BI Reports", href: isAdmin ? "/admin/reports" : "/staff/reports", icon: <FileText className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.type === 'header') return true;
    return item.roles?.includes(user?.role || Role.STAFF);
  });

  const getPageTitle = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return 'Overview';
    const segment = location.pathname.split('/').pop();
    return segment ? segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'System';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-md transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static shrink-0 flex flex-col shadow-2xl md:shadow-none`}
        style={{ height: '100vh' }}
      >
        <div className="h-20 flex items-center gap-4 px-6 border-b border-slate-100 shrink-0">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-200 text-white transform rotate-3">
              <Zap className="w-6 h-6" fill="currentColor" />
           </div>
           <div className="min-w-0">
              <h1 className="font-black text-xl text-slate-900 leading-none tracking-tight truncate uppercase">Jireh Fishes</h1>
              <p className="text-[10px] text-slate-400 font-black tracking-[0.25em] uppercase mt-1.5 flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> CORE-01
              </p>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-1 no-scrollbar scroll-smooth">
            {filteredItems.map((item: any, index) => {
              if (item.type === 'header') {
                return (
                  <div key={index} className="px-5 mt-10 mb-3">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{item.label}</p>
                  </div>
                );
              }

              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(`${item.href}`));
              
              return (
                <button 
                  key={index}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-bold scale-[1.02]' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-600'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left text-sm tracking-tight">{item.name}</span>
                  
                  {item.badge > 0 && (
                     <span className={`flex items-center justify-center text-[10px] font-black h-5 min-w-[20px] px-2 rounded-full shadow-sm animate-pulse ${isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                        {item.badge}
                     </span>
                  )}
                </button>
              );
            })}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
           <div className="flex items-center gap-3.5 px-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-white border-2 border-slate-100 shadow-md flex items-center justify-center text-indigo-600 font-bold overflow-hidden transition-transform hover:scale-105">
                 <UserIcon className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate tracking-tight uppercase">{user?.name}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {user?.role}
                </p>
              </div>
           </div>
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm hover:shadow-red-50"
           >
             <LogOut className="w-4 h-4" /> 
             <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 px-6 sm:px-10 h-20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3 -ml-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">
               <Menu className="w-6 h-6" />
             </button>
             <div>
               <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                  {getPageTitle()}
               </h2>
               <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
             <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
               <span className="text-[10px] font-black uppercase tracking-widest">Global Link Active</span>
             </div>
             <button onClick={() => navigate('/settings')} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 rounded-2xl transition-all shadow-sm group">
                <SettingsIcon className="w-5 h-5 group-hover:rotate-45 transition-transform" />
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-10 no-scrollbar scroll-smooth bg-slate-50/50">
           <div className="max-w-7xl w-full mx-auto pb-10">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};

// --- Guards ---
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const { user, loading } = useApp();
    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authenticating Node...</p>
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children ? <>{children}</> : <Outlet />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useApp();
    if (loading) return null;
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

export const AppRoutes = () => {
    // Corrected: Destructure staff from useApp
    const { user, staff } = useApp(); 
    const navigate = useNavigate();
    const goBack = () => navigate(-1);
    
    const dashboardTarget = user?.role === Role.ADMIN ? "/admin/dashboard" : "/staff/dashboard";

    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Navigate to={dashboardTarget} replace />} />
                <Route path="admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                
                {/* Unified Admin Routes */}
                <Route path="admin/dashboard" element={<Dashboard onNavigate={(p: string) => navigate(p === 'sales' ? '/admin/sales' : `/admin/${p}`)} />} />
                <Route path="admin/sales" element={<Sales />} />
                <Route path="admin/inventory" element={<Inventory onBack={goBack} />} />
                <Route path="admin/stock" element={<Stock onBack={goBack} />} />
                <Route path="admin/staff-management" element={<StaffManagement onBack={goBack} />} />
                
                {/* Fixed: Passing staff prop, omitting onBack if Staff component doesn't support it */}
                <Route path="admin/staff-roster" element={<Staff staff={staff} />} />
                
                <Route path="admin/company-expenses" element={<CompanyExpenses onBack={goBack} />} />
                <Route path="admin/bank-deposit" element={<BankDeposit onBack={goBack} />} />
                <Route path="admin/payroll" element={<Payroll onBack={goBack} />} />
                <Route path="admin/customers" element={<Customers onBack={goBack} onViewLedger={(c) => { localStorage.setItem('last_ledger_customer', c.id); navigate('/admin/customer-ledger'); }} />} />
                <Route path="admin/customer-ledger" element={<CustomerLedger onBack={() => navigate('/admin/customers')} />} />
                <Route path="admin/suppliers" element={<SupplierManagement onBack={goBack} onViewLedger={(s) => { localStorage.setItem('SupplierLedger.selectedSupplier', JSON.stringify(s)); navigate('/admin/supplier-ledger'); }} />} />
                <Route path="admin/supplier-ledger" element={<SupplierLedger onBack={() => navigate('/admin/suppliers')} />} />
                <Route path="admin/reports" element={<Reports />} />
                
                {/* Unified Staff Routes */}
                <Route path="staff/dashboard" element={<Dashboard onNavigate={(p: string) => navigate(p === 'sales' ? '/staff/sales' : `/staff/${p}`)} />} />
                <Route path="staff/sales" element={<Sales />} />
                <Route path="staff/stock" element={<Stock onBack={goBack} />} />
                
                {/* Fixed: Passing staff prop, omitting onBack if Staff component doesn't support it */}
                <Route path="staff/staff-roster" element={<Staff staff={staff} />} />
                
                <Route path="staff/customers" element={<Customers onBack={goBack} onViewLedger={(c) => { localStorage.setItem('last_ledger_customer', c.id); navigate('/staff/customer-ledger'); }} />} />
                <Route path="staff/customer-ledger" element={<CustomerLedger onBack={() => navigate('/staff/customers')} />} />
                <Route path="staff/reports" element={<Reports />} />
                
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <AppProvider>
                <AppRoutes />
            </AppProvider>
        </BrowserRouter>
    );
}