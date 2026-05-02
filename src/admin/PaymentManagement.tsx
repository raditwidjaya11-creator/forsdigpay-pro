import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, Plus, Trash2, Edit2, Save, X, 
  ChevronLeft, QrCode, Building2, Smartphone, 
  ToggleLeft, ToggleRight, Info
} from 'lucide-react';

export default function PaymentManagement({ onBack }: { onBack: () => void }) {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK',
    accountNo: '',
    accountName: '',
    status: 'ENABLED',
    icon: 'CreditCard',
    fee: 0,
    fee_type: 'FIXED'
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const { data } = await api.get('/admin/payment-methods');
      if (Array.isArray(data)) {
        setMethods(data);
      } else {
        console.error('Invalid payment methods data format:', data);
        setMethods([]);
      }
    } catch (e) {
      console.error(e);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Nama metode harus diisi');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/payment-methods/${editingId}`, formData);
      } else {
        await api.post('/admin/payment-methods', formData);
      }
      await fetchMethods();
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', type: 'BANK', accountNo: '', accountName: '', status: 'ENABLED', icon: 'CreditCard', fee: 0, fee_type: 'FIXED' });
    } catch (e: any) {
      console.error('Error saving payment method:', e);
      alert(e.response?.data?.message || 'Gagal menyimpan metode pembayaran');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setFormData({
      name: m.name,
      type: m.type,
      accountNo: m.accountNo,
      accountName: m.accountName,
      status: m.status,
      icon: m.icon || 'CreditCard',
      fee: m.fee || 0,
      fee_type: m.fee_type || 'FIXED'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus metode pembayaran ini?')) return;
    try {
      await api.delete(`/admin/payment-methods/${id}`);
      fetchMethods();
    } catch (e) {
      alert('Gagal menghapus');
    }
  };

  const handleToggle = async (m: any) => {
    try {
      await api.put(`/admin/payment-methods/${m.id}`, { status: m.status === 'ENABLED' ? 'DISABLED' : 'ENABLED' });
      fetchMethods();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400">Memuat Data Pembayaran...</div>;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-black text-slate-800 text-lg">Metode Pembayaran</h2>
        <button 
          onClick={() => { 
            setFormData({ name: '', type: 'BANK', accountNo: '', accountName: '', status: 'ENABLED', icon: 'CreditCard', fee: 0, fee_type: 'FIXED' });
            setEditingId(null); 
            setShowForm(true); 
          }}
          className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2.5rem] border-2 border-indigo-50 shadow-xl overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-indigo-600 uppercase tracking-widest text-xs">
                  {editingId ? 'Edit Payment Method' : 'Add New Payment Method'}
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Metode (Tampil ke User)</label>
                  <input 
                    type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm focus:border-indigo-500 outline-none"
                    placeholder="Contoh: BCA Transfer Manual"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Jenis</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm appearance-none outline-none"
                      >
                        <option value="BANK">BANK</option>
                        <option value="EWALLET">E-WALLET / QRIS</option>
                        <option value="RETAIL">RETAIL (ALFA/INDO)</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipe Biaya</label>
                      <select 
                        value={formData.fee_type}
                        onChange={e => setFormData({ ...formData, fee_type: e.target.value })}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm appearance-none outline-none font-bold"
                      >
                        <option value="FIXED">FIXED (Rp)</option>
                        <option value="PERCENT">PERCENT (%)</option>
                      </select>
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Biaya Admin ({formData.fee_type === 'FIXED' ? 'Rupiah' : 'Persen'})
                   </label>
                   <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 mt-1 text-[10px] font-black text-slate-400">
                         {formData.fee_type === 'FIXED' ? 'RP' : '%'}
                      </span>
                      <input 
                        type="number" required value={formData.fee}
                        onChange={e => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-5 text-sm font-black focus:border-indigo-500 outline-none"
                      />
                   </div>
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nomor Rekening / ID</label>
                      <input 
                        type="text" required value={formData.accountNo}
                        onChange={e => setFormData({ ...formData, accountNo: e.target.value })}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Atas Nama</label>
                      <input 
                        type="text" required value={formData.accountName}
                        onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm outline-none"
                      />
                   </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ikon Tampilan</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { id: 'CreditCard', icon: CreditCard, label: 'Bank' },
                      { id: 'QrCode', icon: QrCode, label: 'QRIS' },
                      { id: 'Smartphone', icon: Smartphone, label: 'E-Wallet' },
                      { id: 'Building2', icon: Building2, label: 'Retail' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: item.id })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${formData.icon === item.id ? 'bg-indigo-50 border-indigo-500 scale-105 shadow-sm' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                      >
                        <item.icon size={20} className={formData.icon === item.id ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Aktifkan Metode</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">Metode ini akan tampil di halaman user</p>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setFormData({ ...formData, status: formData.status === 'ENABLED' ? 'DISABLED' : 'ENABLED' })}
                     className={`p-1 rounded-full transition-all w-12 flex ${formData.status === 'ENABLED' ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                   >
                     <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                   </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save size={20} />
                )}
                {editingId ? 'Simpan Perubahan' : 'Tambah Metode Pembayaran'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3">
        {Array.isArray(methods) && methods.map(m => (
          <motion.div 
            layout key={m.id}
            className={`bg-white p-5 rounded-3xl border transition-all shadow-sm flex items-center justify-between ${m.status === 'ENABLED' ? 'border-slate-100 font-bold' : 'border-slate-100 opacity-50 grayscale'}`}
          >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border border-slate-100">
                  {m.icon === 'QrCode' ? <QrCode size={24} /> : m.icon === 'Building2' ? <Building2 size={24} /> : m.icon === 'Smartphone' ? <Smartphone size={24} /> : <CreditCard size={24} />}
               </div>
               <div>
                  <h4 className="font-black text-slate-800 text-sm">{m.name}</h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{m.accountNo} • {m.accountName}</p>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${m.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {m.status}
                     </span>
                     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{m.type}</span>
                     {m.fee > 0 && (
                       <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                         Fee: {m.fee_type === 'PERCENT' ? `${m.fee}%` : `Rp ${m.fee.toLocaleString('id-ID')}`}
                       </span>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={() => handleToggle(m)}
                 className={`p-2.5 rounded-xl transition-all ${m.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
               >
                  {m.status === 'ENABLED' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
               </button>
               <button onClick={() => { setFormData(m); setEditingId(m.id); setShowForm(true); }} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
                  <Edit2 size={18} />
               </button>
               <button onClick={() => handleDelete(m.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <Trash2 size={18} />
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
