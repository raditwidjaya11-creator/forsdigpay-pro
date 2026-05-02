import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion } from 'motion/react';
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  BarChart3, Settings, AlertCircle, ArrowUpRight, ArrowDownRight,
  ChevronRight, Database, CreditCard, ArrowDownLeft, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';
import ProviderSettings from './ProviderSettings.js';
import UserManagement from './UserManagement.js';
import ProductManagement from './ProductManagement.js';
import PaymentManagement from './PaymentManagement.js';
import TopUpConfirmation from './TopUpConfirmation.js';
import ReportManagement from './ReportManagement.js';

import { useSocket } from '../context/SocketContext.js';

import { useAuth } from '../context/AuthContext.js';
import { ROLES, PERMISSIONS } from '../constants.js';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'providers' | 'users' | 'products' | 'payments' | 'topups' | 'reports'>('dashboard');
  const { socket } = useSocket();

  const hasPermission = (allowedRoles: readonly string[]) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN || (user.role as string) === 'admin') return true;
    return (allowedRoles as string[]).includes(user.role);
  };

  useEffect(() => {
    if (hasPermission(PERMISSIONS.VIEW_STATS)) {
      fetchStats();
    } else {
      setLoading(false);
    }
    fetchPendingTopups();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', () => {
      // Refresh data when any notification comes in
      fetchStats();
      fetchPendingTopups();
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  const [pendingTopups, setPendingTopups] = useState(0);

  const fetchPendingTopups = async () => {
    try {
      const { data } = await api.get('/admin/topups');
      const txData = data as any[];
      setPendingTopups(txData.filter(t => t.status === 'AWAITING_CONFIRMATION' || t.status === 'PENDING_PAYMENT').length);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const trendData = stats?.trends?.map((t: any) => ({
    name: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    revenue: t.revenue,
    txs: t.transactions
  })) || [];

  const growthData = stats?.userGrowth?.map((g: any) => ({
    name: new Date(g.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    users: g.count
  })) || [];

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold">Memuat Panel Admin...</div>;

  if (view === 'providers') return <div className="max-w-4xl mx-auto"><ProviderSettings onBack={() => setView('dashboard')} /></div>;
  const handleViewBack = () => {
    setView('dashboard');
    fetchStats();
    fetchPendingTopups();
  };

  if (view === 'users') return <div className="max-w-4xl mx-auto"><UserManagement onBack={handleViewBack} /></div>;
  if (view === 'products') return <div className="max-w-4xl mx-auto"><ProductManagement onBack={handleViewBack} /></div>;
  if (view === 'payments') return <div className="max-w-4xl mx-auto"><PaymentManagement onBack={handleViewBack} /></div>;
  if (view === 'topups') return <div className="max-w-4xl mx-auto"><TopUpConfirmation onBack={handleViewBack} /></div>;
  if (view === 'reports') return <div className="max-w-4xl mx-auto"><ReportManagement onBack={handleViewBack} /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
            <Settings size={22} />
          </div>
          Admin Dashboard
        </h1>
        <div className="flex gap-2">
          <button className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm">
             <AlertCircle size={20} />
          </button>
        </div>
      </div>

      {hasPermission(PERMISSIONS.VIEW_STATS) && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-5">
            {[
              { name: 'Total Users', val: stats?.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 12 },
              { name: 'Transactions', val: stats?.totalTransactions, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50', trend: 8 },
              { name: 'Total Revenue', val: `Rp ${stats?.revenue?.toLocaleString('id-ID') || '0'}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 24 },
              { name: 'Active Resellers', val: stats?.activeUsers, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', trend: -2 },
            ].map(s => (
              <motion.div 
                whileHover={{ y: -6, shadow: '0 20px 30px -10px rgba(0,0,0,0.05)' }}
                key={s.name} 
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`${s.bg} ${s.color} p-3 rounded-2xl shadow-sm`}>
                    <s.icon size={22} />
                  </div>
                  <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg border shadow-sm ${s.trend > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                     {s.trend > 0 ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                     {Math.abs(s.trend)}%
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{s.name}</p>
                <p className="text-xl font-black text-slate-800 mt-2 tracking-tight">{s.val}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart Section - Revenue & Transactions */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-gray-800">Tren Pendapatan & Transaksi</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">14 Hari Terakhir</p>
              </div>
              <BarChart3 size={20} className="text-indigo-500" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? `Rp ${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Pendapatan' : 'Transaksi'
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* User Growth Chart */}
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h3 className="font-bold text-gray-800">Pertumbuhan Pengguna</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Reseller Baru</p>
                   </div>
                   <Users size={18} className="text-blue-500" />
                </div>
                <div className="h-48 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthData}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#9CA3AF'}} />
                         <YAxis hide />
                         <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                         />
                         <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Provider Performance */}
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h3 className="font-bold text-gray-800">Performa Provider</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Success Rate (%)</p>
                   </div>
                   <Database size={18} className="text-emerald-500" />
                </div>
                <div className="space-y-4">
                   {stats?.providerStats?.slice(0, 4).map((p: any) => (
                      <div key={p.name}>
                         <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-slate-700">{p.name}</span>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{p.successRate}%</span>
                         </div>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${p.successRate}%` }}
                               className={`h-full rounded-full ${p.successRate > 90 ? 'bg-emerald-500' : p.successRate > 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                            />
                         </div>
                         <div className="flex justify-between mt-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Vol: Rp {p.revenue.toLocaleString()}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total: {p.total} tx</span>
                         </div>
                      </div>
                   ))}
                   {(!stats?.providerStats || stats.providerStats.length === 0) && (
                      <div className="h-32 flex items-center justify-center text-slate-300 text-xs font-bold italic">
                         Belum ada data provider
                      </div>
                   )}
                </div>
             </div>
          </div>
        </>
      )}

      {/* Management Menu */}
      <div className="grid grid-cols-1 gap-3">
         {hasPermission(PERMISSIONS.MANAGE_USERS) && (
           <button 
             onClick={() => setView('users')}
             className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors group"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <Users size={20} />
                 </div>
                 <span className="font-bold text-gray-800">Manajemen Pengguna</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
           </button>
         )}

         {hasPermission(PERMISSIONS.MANAGE_PRODUCTS) && (
           <button 
             onClick={() => setView('products')}
             className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors group"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-purple-600 group-hover:text-white">
                    <ShoppingBag size={20} />
                 </div>
                 <span className="font-bold text-gray-800">Manajemen Produk & Harga</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
           </button>
         )}

         {hasPermission(PERMISSIONS.MANAGE_PROVIDERS) && (
           <button 
             onClick={() => setView('providers')}
             className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 transition-all hover:border-indigo-200 group"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <Database size={20} />
                 </div>
                 <div className="text-left">
                    <span className="font-bold text-gray-800 block">Integrasi API Provider</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Provider API Settings</span>
                 </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
           </button>
         )}

         {hasPermission(PERMISSIONS.MANAGE_PAYMENTS) && (
           <button 
             onClick={() => setView('payments')}
             className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 transition-all hover:border-indigo-200 group"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-amber-600 group-hover:text-white">
                    <CreditCard size={20} />
                 </div>
                 <div className="text-left">
                    <span className="font-bold text-gray-800 block">Metode Pembayaran</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Payment Methods</span>
                 </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
           </button>
         )}

         {hasPermission(PERMISSIONS.MANAGE_TOPUPS) && (
           <button 
             onClick={() => setView('topups')}
             className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 transition-all hover:border-indigo-200 group"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-red-600 group-hover:text-white relative">
                    <ArrowDownLeft size={20} />
                    {pendingTopups > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                        {pendingTopups}
                      </span>
                    )}
                 </div>
                 <div className="text-left">
                    <span className="font-bold text-gray-800 block">Konfirmasi Top Up</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pending Deposits</span>
                 </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
           </button>
         )}

         {hasPermission(PERMISSIONS.VIEW_REPORTS) && (
           <button 
             onClick={() => setView('reports')}
             className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 transition-all hover:border-indigo-200 group"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <FileText size={20} />
                 </div>
                 <div className="text-left">
                    <span className="font-bold text-gray-800 block">Laporan Transaksi</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Transaction Reports</span>
                 </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
           </button>
         )}
      </div>
    </div>
  );
}
