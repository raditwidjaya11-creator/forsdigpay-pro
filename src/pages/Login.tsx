import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'motion/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // simpan session
      login(data.session.access_token, data.user);

      navigate('/');
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa email & password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex justify-center">
          <img src="https://api.dicebear.com/7.x/shapes/svg?seed=Forsdigpay" alt="Logo" className="w-16 h-16 bg-indigo-600 rounded-2xl p-2" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Selamat Datang Kembali
        </h2>
      </motion.div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl">{error}</div>}

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border"
          />

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl">
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4">
          Belum punya akun? <Link to="/register">Daftar</Link>
        </p>
      </div>
    </div>
  );
}
