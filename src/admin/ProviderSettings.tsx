import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Key, User, Lock, Link2, Hash, 
  ToggleLeft, ToggleRight, Plus, Trash2, Edit2, 
  Save, X, ChevronLeft, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  username: string;
  secret: string;
  signatureKey: string;
  callbackUrl: string;
  priority: number;
  status: 'ENABLED' | 'DISABLED';
}

export default function ProviderSettings({ onBack }: { onBack: () => void }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Provider>>({
    name: '',
    url: '',
    apiKey: '',
    username: '',
    secret: '',
    signatureKey: '',
    callbackUrl: '',
    priority: 1,
    status: 'ENABLED'
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data } = await api.get('/admin/providers');
      setProviders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/providers/${editingId}`, formData);
      } else {
        await api.post('/admin/providers', formData);
      }
      fetchProviders();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '', url: '', apiKey: '', username: '', 
        secret: '', signatureKey: '', callbackUrl: '', 
        priority: 1, status: 'ENABLED'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus provider ini?')) return;
    try {
      await api.delete(`/admin/providers/${id}`);
      fetchProviders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (provider: Provider) => {
    try {
      const newStatus = provider.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
      await api.put(`/admin/providers/${provider.id}`, { status: newStatus });
      fetchProviders();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (p: Provider) => {
    setFormData(p);
    setEditingId(p.id);
    setShowForm(true);
  };

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold">Memuat Pengaturan Provider...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-black text-slate-800 text-lg">Integrasi API Provider</h2>
        <button 
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-[2.5rem] border-2 border-indigo-50 shadow-xl shadow-indigo-50/50 overflow-hidden"
          >
            <form onSubmit={handleSave} className="p-8 space-y-6">
               <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <h3 className="font-black text-indigo-600 uppercase tracking-widest text-xs">
                    {editingId ? 'Edit Configuration' : 'Add New Provider'}
                  </h3>
                  <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fields */}
                  {[
                    { label: 'Provider Name', key: 'name', icon: Globe, placeholder: 'Digiflazz, IAK, etc' },
                    { label: 'API URL Base', key: 'url', icon: Link2, placeholder: 'https://api.example.com/v1' },
                    { label: 'API Key', key: 'apiKey', icon: Key, placeholder: 'Your API Key' },
                    { label: 'Username', key: 'username', icon: User, placeholder: 'API Username' },
                    { label: 'Secret / Token', key: 'secret', icon: Lock, placeholder: 'API Secret' },
                    { label: 'Signature Key', key: 'signatureKey', icon: Hash, placeholder: 'Static Signature Key' },
                    { label: 'Callback URL', key: 'callbackUrl', icon: Link2, placeholder: 'https://yourdomain.com/callback' },
                    { label: 'Priority (Lower = Higher)', key: 'priority', icon: Hash, placeholder: '1', type: 'number' },
                  ].map(f => (
                    <div key={f.key} className="space-y-2">
                       <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          <f.icon size={12} />
                          {f.label}
                       </label>
                       <input 
                          type={f.type || 'text'}
                          value={((formData as any)[f.key]) === 0 && !isNaN((formData as any)[f.key]) ? 0 : (formData as any)[f.key] || ''}
                          required
                          onChange={e => {
                             const val = e.target.value;
                             setFormData({ ...formData, [f.key]: f.type === 'number' ? (val === '' ? 0 : parseInt(val) || 0) : val });
                          }}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm focus:border-indigo-500 focus:bg-white transition-all outline-none"
                          placeholder={f.placeholder}
                       />
                    </div>
                  ))}
               </div>

               <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
               >
                  <Save size={20} />
                  Simpan Konfigurasi
               </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider List */}
      <div className="grid grid-cols-1 gap-4">
        {providers.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[3rem] border-2 border-dashed border-slate-200">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-bold">Belum ada provider yang dikonfigurasi</p>
          </div>
        ) : (
          providers.sort((a, b) => a.priority - b.priority).map(p => (
            <motion.div 
              layout
              key={p.id}
              className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all shadow-sm ${p.status === 'ENABLED' ? 'border-indigo-50' : 'border-slate-100 grayscale opacity-70'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${p.status === 'ENABLED' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe size={28} />
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                         <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{p.name}</h4>
                         <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${p.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                            {p.status}
                         </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] mt-1">{p.url}</p>
                      <div className="flex items-center gap-4 mt-3">
                         <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-black">
                            <Hash size={12} strokeWidth={3} />
                            Priority: {p.priority}
                         </div>
                         <div className="flex items-center gap-1.5 text-xs text-slate-400 font-black">
                            <User size={12} strokeWidth={3} />
                            {p.username}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button 
                      onClick={() => handleToggleStatus(p)}
                      className={`p-3 rounded-2xl transition-all ${p.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                   >
                      {p.status === 'ENABLED' ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                   </button>
                   <button 
                      onClick={() => startEdit(p)}
                      className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"
                   >
                      <Edit2 size={22} />
                   </button>
                   <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"
                   >
                      <Trash2 size={22} />
                   </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 border-dashed">
         <div className="flex gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl flex-shrink-0">
               <AlertCircle size={24} />
            </div>
            <div>
               <h5 className="font-black text-amber-900 text-sm mb-1 uppercase tracking-widest">Penting!</h5>
               <p className="text-xs text-amber-700 leading-relaxed font-medium">
                 Pastikan Callback URL sudah terdaftar di dashboard provider untuk sinkronisasi status transaksi secara real-time. Priority menentukan urutan pengecekan stok jika terdapat lebih dari satu provider.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
