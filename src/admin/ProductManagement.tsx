import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Plus, Trash2, Edit2, Save, X, 
  ChevronLeft, Smartphone, Zap, Droplets, Gamepad2, 
  Tv, Bus, Heart, Package, Tag, Tag as PriceTag
} from 'lucide-react';

const CATEGORIES = [
  { id: 'pulsa', label: 'Pulsa', icon: Smartphone },
  { id: 'data', label: 'Paket Data', icon: Zap },
  { id: 'pln', label: 'PLN', icon: Zap },
  { id: 'pdam', label: 'PDAM', icon: Droplets },
  { id: 'game', label: 'Games', icon: Gamepad2 },
  { id: 'tv', label: 'TV Cable', icon: Tv },
  { id: 'transport', label: 'Transport', icon: Bus },
  { id: 'bpjs', label: 'BPJS', icon: Heart }
];

export default function ProductManagement({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'pulsa',
    price: 0,
    provider: 'Digiflazz'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, formData);
      } else {
        await api.post('/admin/products', formData);
      }
      fetchProducts();
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', category: 'pulsa', price: 0, provider: 'Digiflazz' });
    } catch (e) {
      alert('Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (e) {
      alert('Gagal menghapus produk');
    }
  };

  const startEdit = (p: any) => {
    setFormData({ name: p.name, category: p.category, price: p.price, provider: p.provider });
    setEditingId(p.id);
    setShowForm(true);
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400">Memuat Data Produk...</div>;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-black text-slate-800 text-lg">Manajemen Produk</h2>
        <button 
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', category: 'pulsa', price: 0, provider: 'Digiflazz' }); }}
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
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Produk</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm focus:border-indigo-500 transition-all outline-none"
                    placeholder="Contoh: Telkomsel 10rb"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm focus:border-indigo-500 transition-all outline-none appearance-none"
                      >
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Harga Jual</label>
                      <input 
                        type="number"
                        required
                        value={formData.price === 0 && formData.price !== null && formData.price !== undefined && !isNaN(formData.price) ? 0 : formData.price || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({ ...formData, price: val === '' ? 0 : parseInt(val) || 0 });
                        }}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm focus:border-indigo-500 transition-all outline-none"
                      />
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Provider API</label>
                   <input 
                     type="text"
                     required
                     value={formData.provider}
                     onChange={e => setFormData({ ...formData, provider: e.target.value })}
                     className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm focus:border-indigo-500 transition-all outline-none"
                   />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Simpan Produk
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3">
        {Array.isArray(products) && products.map(p => {
          const CategoryIcon = CATEGORIES.find(c => c.id === p.category)?.icon || Package;
          return (
            <motion.div 
              layout
              key={p.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border border-slate-100">
                    <CategoryIcon size={24} />
                 </div>
                 <div>
                    <h4 className="font-black text-slate-800 text-sm">{p.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">{p.category}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase">{p.provider}</span>
                    </div>
                    <p className="text-sm font-black text-emerald-600 mt-1">Rp {p?.price?.toLocaleString()}</p>
                 </div>
              </div>

              <div className="flex gap-2">
                 <button onClick={() => startEdit(p)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100">
                    <Edit2 size={18} />
                 </button>
                 <button onClick={() => handleDelete(p.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                    <Trash2 size={18} />
                 </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
