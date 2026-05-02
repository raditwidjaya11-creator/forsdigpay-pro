import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../utils/api.js';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const { data } = await api.post('/auth/login', { email, password }) as any;
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || 'Koneksi ke server gagal. Pastikan internet Anda aktif.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Decorative background atoms */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sm:mx-auto sm:w-full sm:max-w-sm"
      >
        <div className="flex justify-center mb-8">
           <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-12 hover:rotate-0 transition-transform duration-500 overflow-hidden relative group">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/10 group-hover:h-full transition-all duration-300"></div>
              <span className="text-white font-black text-4xl italic tracking-tighter">F</span>
           </div>
        </div>
        <h2 className="text-center text-4xl font-black tracking-tight text-slate-800">
          Selamat Datang <span className="text-indigo-600 italic">!</span>
        </h2>
        <p className="mt-3 text-center text-sm font-medium text-slate-500 leading-relaxed max-w-[280px] mx-auto">
          Masuk dan nikmati kemudahan transaksi digital di genggaman Anda.
        </p>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/60 border border-white"
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
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
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 mb-2">Alamat Email</label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border-2 border-slate-100 py-3.5 px-6 text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-indigo-500 focus:ring-0 transition-all font-medium sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kata Sandi</label>
                <a href="#" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-500 transition-colors">Lupa?</a>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border-2 border-slate-100 py-3.5 px-6 text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-indigo-500 focus:ring-0 transition-all font-medium sm:text-sm pr-12"
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
              className="flex w-full justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-200 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              ) : 'Masuk Sekarang'}
            </button>
          </form>
        </motion.div>

        <p className="mt-8 text-center text-sm font-bold text-slate-400">
          Belum punya akun?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-500 transition-colors underline decoration-2 underline-offset-4">
            Daftar Gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
