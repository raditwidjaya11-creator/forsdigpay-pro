import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion } from 'motion/react';
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  BarChart3, Settings, AlertCircle, ArrowUpRight, ArrowDownRight,
  ChevronRight, Database, CreditCard, ArrowDownLeft
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'providers' | 'users' | 'products' | 'payments' | 'topups'>('dashboard');

  useEffect(() => {
    fetchStats();
  }, []);

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

  const dummyChartData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
  ];

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold">Memuat Panel Admin...</div>;

  if (view === 'providers') return <div className="max-w-4xl mx-auto"><ProviderSettings onBack={() => setView('dashboard')} /></div>;
  if (view === 'users') return <div className="max-w-4xl mx-auto"><UserManagement onBack={() => setView('dashboard')} /></div>;
  if (view === 'products') return <div className="max-w-4xl mx-auto"><ProductManagement onBack={() => setView('dashboard')} /></div>;
  if (view === 'payments') return <div className="max-w-4xl mx-auto"><PaymentManagement onBack={() => setView('dashboard')} /></div>;
  if (view === 'topups') return <div className="max-w-4xl mx-auto"><TopUpConfirmation onBack={() => setView('dashboard')} /></div>;

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

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-5">
        {[
          { name: 'Total Users', val: stats?.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 12 },
          { name: 'Transactions', val: stats?.totalTransactions, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50', trend: 8 },
          { name: 'Total Revenue', val: `Rp ${stats?.revenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 24 },
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

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800">Analisa Pendapatan (7 Hari Terakhir)</h3>
          <BarChart3 size={20} className="text-gray-400" />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dummyChartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Management Menu */}
      <div className="grid grid-cols-1 gap-3">
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

         <button 
           onClick={() => setView('topups')}
           className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 transition-all hover:border-indigo-200 group"
         >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-red-600 group-hover:text-white">
                  <ArrowDownLeft size={20} />
               </div>
               <div className="text-left">
                  <span className="font-bold text-gray-800 block">Konfirmasi Top Up</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pending Deposits</span>
               </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
         </button>
      </div>
    </div>
  );
}
