
import React from 'react';
import { useApp } from '../context/AppContext';
import { useSyncData } from '../hooks/useSyncData';
import { Card, Badge } from './Shared';
import { ActivityFeed } from './ActivityFeed';
import { 
    DollarSign, 
    Package, 
    ShoppingCart, 
    AlertTriangle, 
    Activity,
    ArrowRight,
    TrendingUp,
    ChevronRight,
    Users as UsersIcon,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Role } from '../types';

interface DashboardProps {
    onNavigate: (view: string, params?: any) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
    const { user, sales, products, logs, users, lastSync, syncData } = useApp();
    useSyncData(); // Execute cloud handshake on dashboard view initialization
    
    const isAdmin = user?.role === Role.ADMIN;
    
    // Metrics Calculation
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const mySales = sales.filter(s => s.initiatedBy === user?.id);
    const myRevenue = mySales.reduce((acc, sale) => acc + sale.total, 0);
    
    const lowStockProducts = products.filter(p => p.quantity <= (p.minStockLevel || 10));
    
    const revenue = isAdmin ? totalRevenue : myRevenue;
    const totalTransactions = isAdmin ? sales.length : mySales.length;
    const relevantSales = isAdmin ? sales : mySales;

    // Chart Data Preparation (Last 7 Days)
    const today = new Date();
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i)); 
        const dateString = date.toISOString().split('T')[0];
        
        const daySales = relevantSales.filter(sale => 
            sale.date.split('T')[0] === dateString
        );

        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: daySales.reduce((acc, sale) => acc + sale.total, 0),
            transactions: daySales.length
        };
    });
    
    const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: any) => {
        const colorStyles: Record<string, string> = {
            blue: "bg-blue-50 text-blue-600 ring-blue-100",
            green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
            purple: "bg-purple-50 text-purple-600 ring-purple-100",
            red: "bg-red-50 text-red-600 ring-red-100",
            gray: "bg-slate-50 text-slate-600 ring-slate-100",
        };
        const style = colorStyles[color] || colorStyles.gray;
        
        return (
            <div 
                className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
                onClick={onClick}
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-3.5 rounded-2xl ring-1 ${style} group-hover:rotate-6 transition-transform shadow-sm`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <div className="text-[10px] font-black flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {trend}
                        </div>
                    )}
                </div>
                <p className="text-[10px] font-black text-slate-400 mb-1 truncate uppercase tracking-widest">{title}</p>
                <h2 className="text-2xl font-black text-slate-900 mb-2 truncate tracking-tight">
                    {typeof value === 'number' ? 
                        (title.toLowerCase().includes('revenue') ? `₦${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : value.toLocaleString()) : 
                        value
                    }
                </h2>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-600 group-hover:text-indigo-800 transition-colors">
                    <span>Audit Details</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                        {isAdmin ? "Command Center" : "Personal Dashboard"}
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {isAdmin ? "Enterprise-wide sales & inventory telemetry" : "Individual performance & activity tracking"}
                    </p>
                </div>
                
                {/* SYNC INDICATOR */}
                <div 
                    className="flex items-center gap-4 bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-slate-100 group cursor-pointer hover:bg-indigo-50 transition-all"
                    onClick={() => syncData()}
                >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:rotate-180 transition-transform duration-700 shadow-sm border border-indigo-100">
                        <RefreshCw size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Global Node Sync</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {lastSync ? `Updated ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not Syncing'}
                        </p>
                    </div>
                </div>
            </div>

            {lowStockProducts.length > 0 && (
                <div className="bg-red-50 border border-red-100 text-red-900 p-6 rounded-[2rem] flex items-center shadow-lg shadow-red-100/50 animate-pulse">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-red-600 mr-5">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm font-black uppercase tracking-widest">Inventory Depletion Alert</p>
                        <p className="text-xs font-bold text-red-700/70 uppercase tracking-tight mt-1">{lowStockProducts.length} high-priority SKUs are currently below operational minimums.</p>
                    </div>
                    <button 
                        onClick={() => onNavigate(isAdmin ? 'inventory' : 'stock')}
                        className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                    >
                        Replenish
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title={isAdmin ? "Gross Revenue" : "My Revenue"}
                    value={revenue}
                    icon={DollarSign}
                    color="blue"
                    onClick={() => onNavigate('sales')}
                />
                <StatCard 
                    title={isAdmin ? "Total Transactions" : "My Sales Count"}
                    value={totalTransactions}
                    icon={ShoppingCart}
                    color="green"
                    onClick={() => onNavigate('sales')}
                />
                <StatCard 
                    title="Active SKUs"
                    value={products.length}
                    icon={Package}
                    color="purple"
                    onClick={() => onNavigate(isAdmin ? 'inventory' : 'stock')}
                />
                {isAdmin ? (
                    <StatCard 
                        title="Registered Nodes"
                        value={users.filter(u => u.isActive).length}
                        icon={UsersIcon}
                        color="red"
                        onClick={() => onNavigate('admin/staff-management')}
                    />
                ) : (
                    <StatCard 
                        title="Health Status"
                        value="OPERATIONAL"
                        icon={ShieldCheck}
                        color="red"
                        onClick={() => {}}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8 rounded-[2.5rem] border-0 shadow-2xl bg-white ring-1 ring-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                                <TrendingUp size={20} className="text-indigo-600" /> 
                                Performance Telemetry
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">7-Day revenue projection matrix</p>
                        </div>
                        <Badge color="blue" className="!px-4 !py-1.5 !rounded-xl !text-[9px]">Last 7 Cycles</Badge>
                    </div>
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#94a3b8" 
                                    tick={{fontSize: 9, fontWeight: 800}} 
                                    tickFormatter={(val: string) => val.toUpperCase()}
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10} 
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    tickFormatter={(value) => `₦${value >= 1000 ? value/1000 + 'k' : value}`} 
                                    tick={{fontSize: 9, fontWeight: 800}}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: '#1e293b', padding: '12px' }}
                                    itemStyle={{ color: '#818cf8', fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.6 }}
                                    formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#4f46e5" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                    name="Revenue"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="space-y-8">
                    <ActivityFeed maxItems={8} />
                </div>
            </div>
        </div>
    );
};
