import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownLeft, Check, X, Clock, ChevronLeft, 
  Wallet, User, CreditCard, Bell, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export default function TopUpConfirmation({ onBack }: { onBack: () => void }) {
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopups();
  }, []);

  const fetchTopups = async () => {
    try {
      const { data } = await api.get('/admin/topups');
      setTopups(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'SUCCESS' | 'REJECTED') => {
    if (!confirm(`Konfirmasi untuk ${status === 'SUCCESS' ? 'MENYETUJUI' : 'MENOLAK'} transaksi ini?`)) return;
    try {
      await api.put(`/admin/topups/${id}/status`, { status });
      fetchTopups();
    } catch (e) {
      alert('Gagal memproses transaksi');
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400">Memuat Data Top Up...</div>;

  const pendingCount = topups.filter(t => t.status === 'AWAITING_CONFIRMATION').length;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h2 className="font-black text-slate-800 text-lg">Konfirmasi Top Up</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Permintaan Deposit Mitra</p>
        </div>
        <div className="w-10 flex justify-center">
          {pendingCount > 0 && (
            <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">
              {pendingCount}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {topups.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[3rem] border border-slate-100">
            <p className="text-sm font-bold text-slate-400">Tidak ada riwayat top up</p>
          </div>
        ) : topups.map(t => (
          <motion.div 
            layout
            key={t.id}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="flex gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${t.status === 'AWAITING_CONFIRMATION' ? 'bg-amber-50 text-amber-500' : t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                     {t.status === 'AWAITING_CONFIRMATION' ? <Clock size={28} /> : t.status === 'SUCCESS' ? <Check size={28} /> : <X size={28} />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">{t.userName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(t.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                    <div className={`mt-1.5 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border w-fit ${t.status === 'AWAITING_CONFIRMATION' ? 'bg-amber-50 text-amber-600 border-amber-100' : t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                       {t.status.replace('_', ' ')}
                    </div>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-lg font-black text-slate-900">Rp {t.totalAmount.toLocaleString('id-ID')}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Method: {t.paymentMethod.name}</p>
               </div>
            </div>

            {t.status === 'AWAITING_CONFIRMATION' && (
              <div className="flex gap-2 pt-4 border-t border-slate-50">
                 <button 
                   onClick={() => handleStatusUpdate(t.id, 'SUCCESS')}
                   className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                 >
                   YES / KONFIRMASI
                 </button>
                 <button 
                   onClick={() => handleStatusUpdate(t.id, 'REJECTED')}
                   className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-100 active:scale-95 transition-all"
                 >
                   NO / TOLAK
                 </button>
              </div>
            )}

            {(t.status === 'SUCCESS' || t.status === 'REJECTED') && (
              <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                 <Calendar size={12} />
                 Diproses pada: {format(new Date(t.processedAt), 'dd MMM, HH:mm')}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
