
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useSyncData } from './hooks/useSyncData';
import { Role } from './types';
import { Settings } from './components/Settings';
import { Customers } from './components/Customers';
import { SupplierManagement } from './components/SupplierManagement';
import { CustomerLedger } from './components/CustomerLedger';
import { SupplierLedger } from './components/SupplierLedger';
import { LoginPage } from './components/LoginPage';
import { JoinPage } from './components/JoinPage';

import { Loader2 } from 'lucide-react';

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
import { Badge } from './components/Shared';

import { 
  ShoppingCart, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  User as UserIcon, 
  X,
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

export const Layout = () => {
  const { user, products, logout } = useApp();
  const isAdmin = user?.role === Role.ADMIN;
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { type: 'header', label: 'Operations' },
    { name: "Terminal POS", href: isAdmin ? "/admin/sales" : "/staff/sales", icon: <Zap className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Inventory Master", href: "/admin/inventory", icon: <Package className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Live Stock", href: isAdmin ? "/admin/stock" : "/staff/stock", icon: <Truck className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF], badge: lowStockProducts.length },
    
    { type: 'header', label: 'Commercial' },
    { name: "Clients", href: isAdmin ? "/admin/customers" : "/staff/customers", icon: <Users className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Client Ledgers", href: isAdmin ? "/admin/customer-ledger" : "/staff/customer-ledger", icon: <BookOpen className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Vendors", href: "/admin/suppliers", icon: <Truck className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Vendor Matrix", href: "/admin/supplier-ledger", icon: <FileText className="w-5 h-5" />, roles: [Role.ADMIN] },

    { type: 'header', label: 'Human Capital' },
    { name: "Personnel Roster", href: isAdmin ? "/admin/staff-roster" : "/staff/staff-roster", icon: <UserCheck className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
    { name: "Payroll Terminal", href: "/admin/payroll", icon: <CreditCard className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Access Nodes", href: "/admin/staff-management", icon: <SettingsIcon className="w-5 h-5" />, roles: [Role.ADMIN] },

    { type: 'header', label: 'Treasury' },
    { name: "Expenses", href: "/admin/company-expenses", icon: <DollarSign className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Bank Deposits", href: "/admin/bank-deposit", icon: <Briefcase className="w-5 h-5" />, roles: [Role.ADMIN] },
    { name: "Audit Reports", href: isAdmin ? "/admin/reports" : "/staff/reports", icon: <FileText className="w-5 h-5" />, roles: [Role.ADMIN, Role.STAFF] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.type === 'header') return true;
    return item.roles?.includes(user?.role || Role.STAFF);
  });

  const getPageTitle = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return 'System Console';
    const segment = location.pathname.split('/').pop();
    return segment ? segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Console';
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen bg-[#F8FAFC] flex font-sans overflow-hidden selection:bg-indigo-100 relative">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-[60] md:hidden backdrop-blur-sm transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-slate-100 transform transition-all duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static shrink-0 flex flex-col h-full`}
      >
        <div className="h-24 flex items-center gap-4 px-8 shrink-0">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 text-white rotate-6 transition-transform hover:rotate-0">
              <Zap className="w-7 h-7" fill="currentColor" />
           </div>
           <div className="min-w-0">
              <h1 className="font-black text-xl text-slate-900 tracking-tighter uppercase leading-none">Jireh Core</h1>
              <p className="text-[10px] text-slate-400 font-black tracking-[0.25em] uppercase mt-2 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SYNC ACTIVE
              </p>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 px-5 space-y-1.5 no-scrollbar scroll-smooth">
            {filteredItems.map((item: any, index) => {
              if (item.type === 'header') {
                return (
                  <div key={index} className="px-6 mt-12 mb-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">{item.label}</p>
                  </div>
                );
              }

              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(`${item.href}`));
              
              return (
                <button 
                  key={index}
                  onClick={() => { navigate(item.href); }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-600'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left text-sm tracking-tight font-bold">{item.name}</span>
                  
                  {item.badge > 0 && (
                     <span className={`flex items-center justify-center text-[10px] font-black h-5 min-w-[20px] px-2 rounded-lg ${isActive ? 'bg-indigo-50 text-white' : 'bg-red-50 text-white animate-pulse'}`}>
                        {item.badge}
                     </span>
                  )}
                </button>
              );
            })}
        </nav>

        <div className="p-8 border-t border-slate-50 bg-slate-50/20 shrink-0">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-slate-100">
                 <UserIcon className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate tracking-tight uppercase leading-none mb-1.5">{user?.name}</p>
                <Badge color="blue" className="!px-2 !py-0.5">{user?.role}</Badge>
              </div>
           </div>
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm active:scale-95"
           >
             <LogOut className="w-4 h-4" /> 
             Sign Out Console
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-[50] px-6 sm:px-12 h-24 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 sm:gap-6">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
               <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
             </button>
             <div>
               <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">
                  {getPageTitle()}
               </h2>
               <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-8">
             <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-indigo-50/50 text-indigo-700 rounded-2xl border border-indigo-100 shadow-sm">
               <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
               <span className="text-[10px] font-black uppercase tracking-widest">Master Node Live</span>
             </div>
             <button onClick={() => navigate('/settings')} className="p-3 sm:p-4 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl sm:rounded-2xl transition-all shadow-sm group">
                <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-700" />
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-12 no-scrollbar scroll-smooth">
           <div className="max-w-[1600px] w-full mx-auto pb-24">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const { user, loading } = useApp();
    useSyncData();
    
    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-indigo-600 mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Initializing System Node...</p>
            </div>
        );
    }
    
    if (!user) return <Navigate to="/login" replace />;
    return children ? <>{children}</> : <Outlet />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useApp();
    if (loading) return null;
    if (user) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

export const AppRoutes = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const goBack = () => navigate(-1);
    const dashboardTarget = user?.role === Role.ADMIN ? "/admin/dashboard" : "/staff/dashboard";

    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/join" element={<PublicRoute><JoinPage /></PublicRoute>} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Navigate to={dashboardTarget} replace />} />
                <Route path="admin/dashboard" element={<Dashboard onNavigate={(p: string) => navigate(p === 'sales' ? '/admin/sales' : `/admin/${p}`)} />} />
                <Route path="admin/sales" element={<Sales />} />
                <Route path="admin/inventory" element={<Inventory onBack={goBack} />} />
                <Route path="admin/stock" element={<Stock onBack={goBack} />} />
                <Route path="admin/staff-management" element={<StaffManagement onBack={goBack} />} />
                <Route path="admin/staff-roster" element={<Staff onBack={goBack} />} />
                <Route path="admin/company-expenses" element={<CompanyExpenses onBack={goBack} />} />
                <Route path="admin/bank-deposit" element={<BankDeposit onBack={goBack} />} />
                <Route path="admin/payroll" element={<Payroll onBack={goBack} />} />
                <Route path="admin/customers" element={<Customers onBack={goBack} onViewLedger={(c) => { localStorage.setItem('last_ledger_customer', c.id); navigate('/admin/customer-ledger'); }} />} />
                <Route path="admin/customer-ledger" element={<CustomerLedger onBack={() => navigate('/admin/customers')} />} />
                <Route path="admin/suppliers" element={<SupplierManagement onBack={goBack} onViewLedger={(s) => { localStorage.setItem('SupplierLedger.selectedSupplier', JSON.stringify(s)); navigate('/admin/supplier-ledger'); }} />} />
                <Route path="admin/supplier-ledger" element={<SupplierLedger onBack={() => navigate('/admin/suppliers')} />} />
                <Route path="admin/reports" element={<Reports />} />
                
                <Route path="staff/dashboard" element={<Dashboard onNavigate={(p: string) => navigate(p === 'sales' ? '/staff/sales' : `/staff/${p}`)} />} />
                <Route path="staff/sales" element={<Sales />} />
                <Route path="staff/stock" element={<Stock onBack={goBack} />} />
                <Route path="staff/staff-roster" element={<Staff onBack={goBack} />} />
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
