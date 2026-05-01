import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../utils/api.js';
import { motion } from 'motion/react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData) as any;
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">Mulai Bisnis Anda</h2>
        <p className="mt-2 text-center text-sm text-gray-500 text-pretty">Daftar sebagai mitra atau pengelola Forsdigpay</p>
      </motion.div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{error}</div>}
          
          <div className="p-1 bg-slate-100 rounded-2xl flex gap-1 mb-6 border border-slate-200 shadow-inner">
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, role: 'user' })}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === 'user' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Mitra (User)
            </button>
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, role: 'admin' })}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === 'admin' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Admin
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
            <input
              type="text"
              required
              className="mt-2 block w-full rounded-2xl border-2 border-slate-100 py-3.5 px-5 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all sm:text-sm"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
            <input
              type="email"
              required
              className="mt-2 block w-full rounded-2xl border-2 border-slate-100 py-3.5 px-5 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all sm:text-sm"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">No. HP (WhatsApp)</label>
            <input
              type="tel"
              required
              className="mt-2 block w-full rounded-2xl border-2 border-slate-100 py-3.5 px-5 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all sm:text-sm"
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kata Sandi</label>
            <input
              type="password"
              required
              className="mt-2 block w-full rounded-2xl border-2 border-slate-100 py-3.5 px-5 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all sm:text-sm"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-400">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
