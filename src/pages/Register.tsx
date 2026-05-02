import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../utils/api.js';
import { motion } from 'motion/react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Decorative background atoms */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        <h2 className="text-4xl font-black tracking-tight text-slate-800">Mulai Bisnis <span className="text-indigo-600 italic">Anda</span></h2>
        <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed max-w-[320px] mx-auto">Daftar sebagai mitra Forsdigpay dan raih keuntungan dari setiap transaksi digital.</p>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/60 border border-white"
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                {error}
              </motion.div>
            )}
            
            <div className="p-1.5 bg-slate-100 rounded-2xl flex gap-1 mb-4 border border-slate-200 shadow-inner">
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, role: 'user' })}
                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${formData.role === 'user' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Mitra (User)
              </button>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${formData.role === 'admin' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Pengelola (Admin)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  className="block w-full rounded-2xl border-2 border-slate-100 py-3 px-5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all font-medium sm:text-sm"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  placeholder="budi@email.com"
                  className="block w-full rounded-2xl border-2 border-slate-100 py-3 px-5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all font-medium sm:text-sm"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5">No. HP (WhatsApp)</label>
              <input
                type="tel"
                required
                placeholder="081234567890"
                className="block w-full rounded-2xl border-2 border-slate-100 py-3 px-5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all font-medium sm:text-sm"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 6 karakter"
                  className="block w-full rounded-2xl border-2 border-slate-100 py-3 px-5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all font-medium sm:text-sm pr-12"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-200 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              ) : 'Daftar Sekarang'}
            </button>
          </form>
        </motion.div>

        <p className="mt-8 text-center text-sm font-bold text-slate-400">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-400 transition-colors underline decoration-2 underline-offset-4">Masuk ke Akun</Link>
        </p>
      </div>
    </div>
  );
}
