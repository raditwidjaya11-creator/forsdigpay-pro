import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import api from '../utils/api.js';
import { motion } from 'motion/react';
import { 
  Smartphone, Zap, Droplets, Gamepad2, CreditCard, 
  Tv, Bus, Heart, Plus, ArrowUpRight, Search, Bell, AlertTriangle
} from 'lucide-react';

const CATEGORIES = [
  { id: 'pulsa', name: 'Pulsa', icon: Smartphone, color: 'bg-orange-100 text-orange-600' },
  { id: 'data', name: 'Paket Data', icon: Smartphone, color: 'bg-blue-100 text-blue-600' },
  { id: 'pln', name: 'Token PLN', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'game', name: 'Game', icon: Gamepad2, color: 'bg-purple-100 text-purple-600' },
  { id: 'ewallet', name: 'E-Money', icon: CreditCard, color: 'bg-green-100 text-green-600' },
  { id: 'pdam', name: 'PDAM', icon: Droplets, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'tv', name: 'TV Kabel', icon: Tv, color: 'bg-pink-100 text-pink-600' },
  { id: 'travel', name: 'Travel', icon: Bus, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'donasi', name: 'Donasi', icon: Heart, color: 'bg-red-100 text-red-600' },
  { id: 'lainnya', name: 'Lainnya', icon: Plus, color: 'bg-gray-100 text-gray-600' },
];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState<any>(null);
  const [targetNumber, setTargetNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
    // Regular polling for balance updates
    const interval = setInterval(refreshUser, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async (cat?: string) => {
    try {
      const { data } = await api.get('/products' + (cat ? `?category=${cat}` : ''));
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTransaction = async (product: any) => {
    if (!targetNumber) return alert('Masukkan nomor tujuan / ID Pelanggan');
    setLoading(true);
    try {
      await api.post('/transactions', { productId: product.id, target: targetNumber });
      await refreshUser(); // Refresh balance immediately
      setMessage(`Transaksi ${product.name} Berhasil!`);
      setShowProductModal(null);
      setTargetNumber('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Transaksi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-800">Halo, {user?.name?.split(' ')?.[0] || 'User'}!</h1>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mitra Premium Gold</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="p-2 bg-slate-100 rounded-xl relative cursor-pointer hover:bg-slate-200 transition-colors">
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
          </div>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Low Balance Warning */}
      {user && user.balance < 10000 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border-2 border-amber-200 p-4 rounded-3xl flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Saldo Hampir Habis!</h4>
            <p className="text-[11px] text-amber-700 font-bold leading-tight">Saldo Anda Rp {user?.balance?.toLocaleString('id-ID')}, segera isi saldo agar transaksi tetap lancar.</p>
          </div>
          <button 
            onClick={() => window.location.href = '/wallet'}
            className="px-3 py-2 bg-amber-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm active:scale-95 transition-all"
          >
            TOPUP
          </button>
        </motion.div>
      )}

      {/* Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden"
      >
        <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Saldo Tersedia</p>
          <h2 className="text-3xl font-extrabold mb-6 tracking-tight">Rp {user?.balance?.toLocaleString('id-ID') || '0'}</h2>
          <div className="grid grid-cols-2 gap-4">
             <button className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl py-3 px-4 text-xs font-bold transition-all active:scale-95 shadow-sm border border-white/10">
                <Plus size={16} /> Isi Saldo
             </button>
             <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl py-3 px-4 text-xs font-bold transition-all active:scale-95 border border-white/5">
                <ArrowUpRight size={16} /> Transfer
             </button>
          </div>
        </div>
      </motion.div>

      {/* Categories Grid */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-6 px-1">Produk & Layanan</h3>
        <div className="grid grid-cols-4 gap-y-8 gap-x-2">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => { fetchProducts(cat.id); }}
              className="flex flex-col items-center gap-3 group"
            >
              <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center group-active:scale-90 transition-transform shadow-sm border border-transparent hover:border-slate-200`}>
                <cat.icon size={22} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-center">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Display */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-extrabold text-slate-800">Daftar Pilihan</h3>
            <button className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline">Semua</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {products.map((p) => (
              <motion.button
                whileTap={{ scale: 0.98 }}
                key={p.id}
                onClick={() => setShowProductModal(p)}
                className="flex items-center justify-between bg-white p-5 rounded-3xl shadow-sm border border-slate-100 text-left group hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                      <Smartphone size={20} className="text-slate-400 group-hover:text-indigo-600" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-800">{p.name}</p>
                     <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{p.provider}</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-indigo-600">Rp {p?.price?.toLocaleString('id-ID')}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Ready</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Success Message Toast */}
      {message && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl z-[100] font-bold flex items-center gap-2">
           <Zap size={18} fill="white" /> {message}
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Konfirmasi Transaksi</h3>
              <button onClick={() => setShowProductModal(null)} className="text-gray-400"><Plus className="rotate-45" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-2xl flex justify-between items-center border border-indigo-100">
                <div>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Produk</p>
                  <p className="text-sm font-bold text-indigo-900">{showProductModal.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Harga</p>
                  <p className="text-sm font-extrabold text-indigo-900">Rp {showProductModal?.price?.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Nomor Tujuan / ID Pelanggan</label>
                <input 
                  type="number"
                  autoFocus
                  placeholder="Contoh: 081234567XXX"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-lg font-bold tracking-widest focus:ring-2 focus:ring-indigo-600"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button 
                  disabled={loading}
                  onClick={() => handleTransaction(showProductModal)}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-4 px-4 font-medium uppercase tracking-tighter">
                  Pastikan nomor tujuan sudah benar sebelum melakukan transaksi.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
