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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK',
    accountNo: '',
    accountName: '',
    status: 'ENABLED',
    icon: 'CreditCard'
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const { data } = await api.get('/payment-methods');
      setMethods(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/payment-methods/${editingId}`, formData);
      } else {
        await api.post('/admin/payment-methods', formData);
      }
      fetchMethods();
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', type: 'BANK', accountNo: '', accountName: '', status: 'ENABLED', icon: 'CreditCard' });
    } catch (e) {
      alert('Gagal menyimpan metode pembayaran');
    }
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
          onClick={() => { setShowForm(true); setEditingId(null); }}
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ikon</label>
                      <select 
                        value={formData.icon}
                        onChange={e => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm appearance-none outline-none"
                      >
                        <option value="CreditCard">Bank Card</option>
                        <option value="QrCode">QRis</option>
                        <option value="Smartphone">Smartphone / App</option>
                        <option value="Building2">Building / Retail</option>
                      </select>
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
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Simpan Metode Pembayaran
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3">
        {methods.map(m => (
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
