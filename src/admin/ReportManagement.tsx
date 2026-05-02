import React, { useState } from 'react';
import api from '../utils/api.js';
import { motion } from 'motion/react';
import { 
  FileText, Download, Calendar, Filter, 
  ChevronLeft, Search, RefreshCw, ArrowDownWideNarrow,
  Send, History, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

export default function ReportManagement({ onBack }: { onBack: () => void }) {
  const [startDate, setStartDate] = useState(format(prevMonth(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  function prevMonth() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/admin/reports/history');
      const histData = data as any[];
      setHistory(histData);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchHistory();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reports/transactions', {
        params: { startDate, endDate, status, type }
      });
      setData(data);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil data laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (data.length === 0) return alert('Tampilkan data terlebih dahulu');
    const email = prompt('Masukkan email tujuan:', 'admin@forsdigpay.com');
    if (!email) return;

    setSending(true);
    try {
      await api.post('/admin/reports/send', {
        startDate,
        endDate,
        status,
        type,
        recipientEmail: email,
        transactionCount: data.length
      });
      alert('Laporan berhasil dikirim ke antrian email!');
      fetchHistory();
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim laporan');
    } finally {
      setSending(false);
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return alert('Tidak ada data untuk diekspor');
    
    const headers = ['ID', 'User ID', 'Product', 'Amount', 'Target', 'Status', 'Date'];
    const rows = data.map(t => [
      t.id,
      t.userId,
      t.productName || 'Top Up',
      t.amount,
      t.target || '-',
      t.status,
      format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report_transactions_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h2 className="font-black text-slate-800 text-lg tracking-tight">Laporan Transaksi</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Download Data & Analytics</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`p-2 rounded-xl transition-colors ${showHistory ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          title="Riwayat Laporan"
        >
          <History size={24} />
        </button>
      </div>

      {showHistory ? (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="px-4">
             <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Riwayat Pengiriman</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Laporan yang telah terkirim</p>
          </div>
          
          <div className="grid gap-3">
            {history.length === 0 ? (
               <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
                  <p className="text-sm font-bold text-slate-400">Belum ada riwayat pengiriman</p>
               </div>
            ) : history.map(h => (
              <div key={h.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex justify-between items-center group hover:border-indigo-100 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                       <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{h.recipientEmail}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          {h.startDate} - {h.endDate} • {h.transactionCount} Transaksi
                        </p>
                    </div>
                 </div>
                 <p className="text-[10px] font-black text-slate-300 uppercase">{format(new Date(h.sentAt), 'dd MMM, HH:mm')}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                 <Calendar size={10} /> Tanggal Mulai
              </label>
              <input 
                 type="date" 
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                 <Calendar size={10} /> Tanggal Akhir
              </label>
              <input 
                 type="date" 
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                 <Filter size={10} /> Status
              </label>
              <select 
                 value={status}
                 onChange={(e) => setStatus(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none"
              >
                 <option value="ALL">Semua Status</option>
                 <option value="SUCCESS">Berhasil</option>
                 <option value="PENDING">Pending</option>
                 <option value="REJECTED">Ditolak</option>
              </select>
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                 <ArrowDownWideNarrow size={10} /> Jenis
              </label>
              <select 
                 value={type}
                 onChange={(e) => setType(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none"
              >
                 <option value="ALL">Semua Jenis</option>
                 <option value="PURCHASE">Pembelian Produk</option>
                 <option value="TOPUP">Top Up Saldo</option>
              </select>
           </div>
        </div>

        <button 
           onClick={fetchReport}
           disabled={loading}
           className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
           {loading ? <RefreshCw size={20} className="animate-spin" /> : <Search size={20} />}
           Tampilkan Data
        </button>
      </div>

      {data.length > 0 && (
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-4"
        >
           <div className="flex justify-between items-center px-4">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ditemukan</p>
                 <h3 className="text-xl font-black text-slate-800">{data.length} Transaksi</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSendReport}
                  disabled={sending}
                  className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl border border-indigo-100 flex items-center gap-2 font-black text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  KIRIM EMAIL
                </button>
                <button 
                  onClick={exportToCSV}
                  className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 flex items-center gap-2 font-black text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  <Download size={18} />
                  CSV
                </button>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                       <tr>
                          <th className="p-4 pl-8">Waktu</th>
                          <th className="p-4">Produk</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 pr-8 text-right">Nominal</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                       {data.slice(0, 50).map(t => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="p-4 pl-8 whitespace-nowrap">{format(new Date(t.createdAt), 'dd MMM, HH:mm')}</td>
                             <td className="p-4">
                                <p className="text-slate-800 uppercase tracking-tight">{t.productName || 'Top Up'}</p>
                                <p className="text-[9px] text-slate-400">{t.target || '-'}</p>
                             </td>
                             <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                   {t.status}
                                </span>
                             </td>
                             <td className="p-4 pr-8 text-right text-slate-900">Rp {t?.amount?.toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              {data.length > 50 && (
                <div className="p-4 bg-slate-50 text-center text-[10px] font-black text-slate-400 uppercase tracking-tight">
                   Menampilkan 50 data terbaru. Gunakan Export untuk semua data.
                </div>
              )}
           </div>
        </motion.div>
      )}
      </>
      )}
    </div>
  );
}
