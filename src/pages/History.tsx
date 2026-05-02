import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, ArrowDownLeft, ChevronRight, Clock, 
  CheckCircle2, Download, X, Hash, User, Wallet 
} from 'lucide-react';
import { format } from 'date-fns';
import { generateReceipt } from '../utils/receipt.js';

export default function History() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/history');
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-xl font-bold text-slate-800">Riwayat Transaksi</h1>
        <button className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">Filter</button>
      </div>

      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(n => <div key={n} className="h-20 bg-gray-100 rounded-3xl animate-pulse" />)
        ) : history.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[3rem] border border-gray-100 shadow-sm">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={32} className="text-gray-300" />
             </div>
             <p className="text-gray-500 font-medium">Belum ada transaksi</p>
          </div>
        ) : (
          history.map((t, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={t.id}
              onClick={() => setSelectedTx(t)}
              className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer active:scale-[0.99] transition-all hover:border-indigo-100"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${t.productId ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  {t.productId ? <ShoppingBag size={24} /> : <ArrowDownLeft size={24} />}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{t.productName || 'Topup Saldo'}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    <Clock size={12} className="text-slate-300" />
                    {format(new Date(t.createdAt), 'dd MMM yyyy • HH:mm')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-base font-black ${t.productId ? 'text-slate-900' : 'text-emerald-600'}`}>
                  {t.productId ? '-' : '+'} Rp {t?.amount?.toLocaleString('id-ID')}
                </p>
                <div className={`flex items-center justify-end gap-1.5 mt-1.5 px-2 py-0.5 rounded-full w-fit ml-auto border ${
                  t.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100' : 
                  t.status === 'FAILED' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                }`}>
                   {t.status === 'SUCCESS' ? <CheckCircle2 size={10} className="text-emerald-500" /> : 
                    t.status === 'FAILED' ? <X size={10} className="text-rose-500" /> : <Clock size={10} className="text-amber-500" />}
                   <span className={`text-[9px] font-black uppercase tracking-wider ${
                     t.status === 'SUCCESS' ? 'text-emerald-600' : 
                     t.status === 'FAILED' ? 'text-rose-600' : 'text-amber-600'
                   }`}>{t.status === 'SUCCESS' ? 'Success' : t.status === 'FAILED' ? 'Gagal' : 'Pending'}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedTx(null)}
                className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="text-center mb-8">
                  <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-4 shadow-inner ${selectedTx.productId ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {selectedTx.productId ? <ShoppingBag size={40} /> : <ArrowDownLeft size={40} />}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedTx.productName || 'Topup Saldo'}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {selectedTx.status === 'SUCCESS' ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Transaksi Berhasil</span>
                      </>
                    ) : selectedTx.status === 'FAILED' ? (
                      <>
                        <X size={14} className="text-rose-500" />
                        <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Transaksi Gagal</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Menunggu</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-[2rem] p-6 space-y-4 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Hash size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Order ID</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 font-mono">#{selectedTx.id.toUpperCase().slice(0, 12)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Waktu</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{format(new Date(selectedTx.createdAt), 'dd MMMM yyyy, HH:mm')}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ShoppingBag size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Jenis</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{selectedTx.type === 'TOPUP' ? 'Isi Saldo' : 'Pembelian Produk'}</span>
                  </div>

                  {selectedTx.target && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-400">
                        <User size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Tujuan</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{selectedTx.target}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Wallet size={16} strokeWidth={2.5} />
                      <span className="text-xs font-black uppercase tracking-widest">Total Bayar</span>
                    </div>
                    <span className="text-lg font-black text-slate-900">Rp {selectedTx?.amount?.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => generateReceipt(selectedTx)}
                    className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                  >
                    <Download size={18} />
                    Download Struk
                  </button>
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
