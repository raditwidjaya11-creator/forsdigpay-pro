import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, UserMinus, Plus, Shield, 
  Smartphone, Wallet, ChevronLeft, Calendar,
  X, ShoppingBag, ArrowDownLeft, Clock, CheckCircle2, History
} from 'lucide-react';
import { format } from 'date-fns';

export default function UserManagement({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (id: string) => {
    const amount = prompt('Masukkan nominal saldo tambahan (gunakan minus untuk mengurangi):');
    if (!amount) return;
    const numAmount = parseInt(amount);
    if (isNaN(numAmount)) {
      alert('Nominal harus berupa angka');
      return;
    }
    try {
      await api.put(`/admin/users/${id}/balance`, { amount: numAmount, action: 'ADD' });
      fetchUsers();
    } catch (e) {
      alert('Gagal update saldo');
    }
  };

  const fetchUserTransactions = async (user: any) => {
    setSelectedUser(user);
    setLoadingTransactions(true);
    try {
      const { data } = await api.get(`/admin/users/${user.id}/transactions`);
      if (Array.isArray(data)) {
        setUserTransactions(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setUserTransactions([]);
      }
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil riwayat transaksi');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u?.name?.toLowerCase()?.includes(search.toLowerCase()) || 
    u?.email?.toLowerCase()?.includes(search.toLowerCase()) ||
    u?.phone?.includes(search)
  );

  if (loading) return <div className="p-8 text-center font-bold text-slate-400">Memuat Data Pengguna...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-black text-slate-800 text-lg">Manajemen Pengguna</h2>
        <div className="w-10"></div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Cari nama, email, atau nomor HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-5 text-sm focus:border-indigo-500 shadow-sm transition-all outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Array.isArray(filteredUsers) && filteredUsers.map(u => (
          <motion.div 
            layout
            key={u.id}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex gap-4">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                  {u.role === 'admin' ? <Shield size={28} /> : <Users size={28} />}
               </div>
               <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight">{u.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">{u.email} • {u.phone}</p>
                  <div className="flex items-center gap-3 mt-2">
                     <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {u.role}
                     </span>
                     <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Wallet size={12} strokeWidth={3} className="text-emerald-500" />
                        Rp {u?.balance?.toLocaleString()}
                     </span>
                  </div>
               </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                  onClick={() => fetchUserTransactions(u)}
                  className="flex-1 sm:flex-none py-2 px-4 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
               >
                  <History size={12} />
                  Riwayat
               </button>
               <button 
                  onClick={() => handleAdjustBalance(u.id)}
                  className="flex-1 sm:flex-none py-2 px-4 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors"
               >
                  Update Saldo
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="p-8 pb-4 border-b border-slate-100">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Users size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Riwayat Transaksi</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-3 pt-4">
                {loadingTransactions ? (
                   <div className="py-20 text-center font-bold text-slate-300">Memuat transaksi...</div>
                ) : userTransactions.length === 0 ? (
                   <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                        <ShoppingBag size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-400">Belum ada riwayat transaksi</p>
                   </div>
                ) : (
                  Array.isArray(userTransactions) && userTransactions.map(t => (
                    <div key={t.id} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.productId ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                             {t.productId ? <ShoppingBag size={20} /> : <ArrowDownLeft size={20} />}
                          </div>
                          <div>
                             <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{t.productName || 'Topup Saldo'}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{format(new Date(t.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-sm font-black ${t.productId ? 'text-slate-900' : 'text-emerald-600'}`}>
                             {t.productId ? '-' : '+'} Rp {t?.amount?.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-end gap-1 text-emerald-500">
                             <CheckCircle2 size={10} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Success</span>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
