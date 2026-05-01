import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion } from 'motion/react';
import { 
  Users, Search, UserMinus, Plus, Shield, 
  Smartphone, Wallet, ChevronLeft, Calendar
} from 'lucide-react';

export default function UserManagement({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (id: string) => {
    const amount = prompt('Masukkan nominal saldo tambahan (gunakan minus untuk mengurangi):');
    if (!amount) return;
    try {
      await api.put(`/admin/users/${id}/balance`, { amount: parseInt(amount), action: 'ADD' });
      fetchUsers();
    } catch (e) {
      alert('Gagal update saldo');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
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
        {filteredUsers.map(u => (
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
                        Rp {u.balance.toLocaleString()}
                     </span>
                  </div>
               </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
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
    </div>
  );
}
