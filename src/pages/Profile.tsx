import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'motion/react';
import { 
  User, Mail, Phone, Shield, Calendar, 
  MapPin, LogOut, ChevronRight, Lock
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="relative">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-indigo-100 border-4 border-white mb-4">
             <User size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user.name}</h2>
          <div className="flex justify-center gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
               {user.role} Mitra
            </span>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-50">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Informasi Akun</h3>
         </div>
         <div className="p-2">
            {[
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Phone, label: 'Nomor HP', value: user.phone },
              { icon: MapPin, label: 'Alamat', value: 'Banyuwangi, Jawa Timur' },
              { icon: Calendar, label: 'Bergabung Sejak', value: '30 April 2024' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
                 <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                    <item.icon size={20} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-bold text-slate-700">{item.value}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-50">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Keamanan</h3>
         </div>
         <div className="p-2">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                     <Lock size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Ubah Kata Sandi</span>
               </div>
               <ChevronRight size={18} className="text-slate-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                     <Shield size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Atur PIN Transaksi</span>
               </div>
               <ChevronRight size={18} className="text-slate-300" />
            </button>
         </div>
      </div>

      {/* Logout */}
      <button 
        onClick={logout}
        className="w-full bg-red-50 text-red-600 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs border-2 border-red-100 hover:bg-red-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        Keluar Sekarang
      </button>

      <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pt-4">
        Forsdigpay v2.4.0 • Build ID: 77291
      </p>
    </div>
  );
}
