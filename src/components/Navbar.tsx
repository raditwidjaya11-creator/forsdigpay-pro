import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, History, User, Shield, Smartphone, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'motion/react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <span className="text-white font-black text-lg">F</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-800">Forsdig<span className="text-indigo-600">pay</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-slate-100 rounded-full px-4 py-1.5 items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">System Online</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-colors active:scale-95"
          >
            <LogOut size={14} strokeWidth={3} />
            <span className="hidden xs:inline">Keluar</span>
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-8 py-4 flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-t-[2.5rem]">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50 shadow-inner' : ''}`}>
                <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/wallet" className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50 shadow-inner' : ''}`}>
                <Wallet size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Wallet</span>
            </>
          )}
        </NavLink>
        
        <div className="relative -top-10">
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-200 border-4 border-white transform cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Smartphone size={32} className="text-white" />
          </motion.div>
        </div>

        <NavLink to="/history" className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50 shadow-inner' : ''}`}>
                <History size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">History</span>
            </>
          )}
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50 shadow-inner' : ''}`}>
                <User size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Akun</span>
            </>
          )}
        </NavLink>
      </nav>
    </>
  );
}
