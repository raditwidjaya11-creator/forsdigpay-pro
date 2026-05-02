import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownLeft, Check, X, Clock, ChevronLeft, 
  Wallet, User, CreditCard, Bell, Calendar, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function TopUpConfirmation({ onBack }: { onBack: () => void }) {
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTopups();
  }, []);

  const fetchTopups = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data } = await api.get('/admin/topups');
      if (Array.isArray(data)) {
        setTopups(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setTopups([]);
      }
    } catch (e) {
      console.error(e);
      setTopups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'SUCCESS' | 'REJECTED') => {
    const action = status === 'SUCCESS' ? 'MENYETUJUI' : 'MENOLAK';
    if (!confirm(`Konfirmasi untuk ${action} transaksi ini? Saldo akan bertambah otomatis jika disetujui.`)) return;
    try {
      await api.put(`/admin/topups/${id}/status`, { status });
      fetchTopups();
    } catch (e) {
      alert('Gagal memproses transaksi');
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING_PAYMENT': return { text: 'Belum Bayar', color: 'bg-slate-100 text-slate-500 border-slate-200' };
      case 'AWAITING_CONFIRMATION': return { text: 'Perlu Konfirmasi', color: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-50' };
      case 'SUCCESS': return { text: 'Berhasil', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'REJECTED': return { text: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200' };
      default: return { text: status, color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <RefreshCw size={48} className="animate-spin text-indigo-300" />
      <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">Memuat Data...</p>
    </div>
  );

  const pendingCount = topups.filter(t => t.status === 'AWAITING_CONFIRMATION' || t.status === 'PENDING_PAYMENT').length;
  const totalPendingVal = topups.filter(t => t.status === 'AWAITING_CONFIRMATION').reduce((acc, t) => acc + t.totalAmount, 0);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-0 z-10 backdrop-blur-md bg-white/90">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h2 className="font-black text-slate-800 text-lg tracking-tight">Konfirmasi Top Up</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Control Panel</p>
        </div>
        <button 
          onClick={() => fetchTopups(true)} 
          disabled={refreshing}
          className={`p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 ${refreshing ? 'animate-spin text-indigo-600' : ''}`}
        >
          <RefreshCw size={24} />
        </button>
      </div>

      {pendingCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white flex justify-between items-center"
        >
            <div>
               <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Pending Konfirmasi</p>
               <h3 className="text-2xl font-black tracking-tight">Rp {totalPendingVal?.toLocaleString('id-ID')}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
               <Bell size={24} className="animate-bounce" />
            </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {topups.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[3rem] border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowDownLeft size={40} />
            </div>
            <p className="text-sm font-bold text-slate-400">Tidak ada riwayat top up ditemukan.</p>
          </div>
        ) : Array.isArray(topups) && topups.map(t => {
          const statusCfg = getStatusLabel(t.status);
          return (
            <motion.div 
              layout
              key={t.id}
              className={`bg-white p-6 rounded-[2.5rem] border ${t.status === 'AWAITING_CONFIRMATION' ? 'border-amber-200 shadow-lg shadow-amber-50 ring-1 ring-amber-50' : 'border-slate-100 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${t.status === 'AWAITING_CONFIRMATION' ? 'bg-amber-50 text-amber-500' : t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                       {t.status === 'AWAITING_CONFIRMATION' ? <Clock size={28} /> : t.status === 'SUCCESS' ? <Check size={28} /> : <X size={28} />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{t.userName || 'Unknown User'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{format(new Date(t.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                      <div className={`mt-2 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border w-fit ${statusCfg.color}`}>
                         {statusCfg.text}
                      </div>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-xl font-black text-slate-900 leading-none">Rp {t?.totalAmount?.toLocaleString('id-ID')}</p>
                    <div className="mt-1 flex flex-col items-end">
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t.paymentMethod.name}</p>
                       <p className="text-[8px] text-indigo-400 font-bold italic" title="Nominal + Fee + Kode Unik">
                          {t?.amount?.toLocaleString()} + {t?.fee || 0} + {t?.uniqueCode}
                       </p>
                    </div>
                 </div>
              </div>

              {(t.status === 'AWAITING_CONFIRMATION' || t.status === 'PENDING_PAYMENT') && (
                <div className="flex gap-2 pt-4 border-t border-slate-50 mt-4">
                   <button 
                     onClick={() => handleStatusUpdate(t.id, 'SUCCESS')}
                     className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     <Check size={14} />
                     YES / KONFIRMASI
                   </button>
                   <button 
                     onClick={() => handleStatusUpdate(t.id, 'REJECTED')}
                     className="flex-none aspect-square bg-red-50 text-red-600 p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-100 hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center"
                     title="Tolak Transaksi"
                   >
                     <X size={18} />
                   </button>
                </div>
              )}

              {(t.status === 'SUCCESS' || t.status === 'REJECTED') && (
                <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center">
                   <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      <Calendar size={12} />
                      Selesai: {format(new Date(t.processedAt), 'dd MMM, HH:mm')}
                   </div>
                   <div className="text-[8px] font-bold text-slate-200">ID: {t.id}</div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
