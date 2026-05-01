import React, { useState } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'motion/react';
import { CreditCard, Wallet as WalletIcon, Check, ArrowDownToLine, Smartphone, Clock } from 'lucide-react';

const DEPOSIT_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'instructions' | 'waiting'>('form');
  const [activeTopup, setActiveTopup] = useState<any>(null);

  React.useEffect(() => {
    fetchPaymentMethods();
    checkActiveTopup();
  }, []);

  const checkActiveTopup = async () => {
    try {
      const { data } = await api.get('/topups');
      const pending = data.find((t: any) => t.status === 'PENDING_PAYMENT' || t.status === 'AWAITING_CONFIRMATION');
      if (pending) {
        setActiveTopup(pending);
        setStep(pending.status === 'PENDING_PAYMENT' ? 'instructions' : 'waiting');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data } = await api.get('/payment-methods');
      setPaymentMethods(data.filter((m: any) => m.status === 'ENABLED'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTopup = async () => {
    if (!amount || !method) return alert('Pilih jumlah dan metode deposit');
    setLoading(true);
    try {
      const { data } = await api.post('/topups', { 
        amount: parseInt(amount.toString()), 
        paymentMethodId: method 
      });
      setActiveTopup(data);
      setStep('instructions');
    } catch (err: any) {
      alert('Gagal membuat pesanan top up');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!activeTopup) return;
    setLoading(true);
    try {
      await api.put(`/topups/${activeTopup.id}/confirm`);
      setStep('waiting');
      refreshUser();
    } catch (err: any) {
      alert('Gagal konfirmasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'instructions' && activeTopup) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Instruksi Pembayaran</h2>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Silahkan transfer sesuai nominal</p>
            
            <div className="mt-8 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Transfer</p>
               <h3 className="text-3xl font-black text-indigo-600">Rp {activeTopup.totalAmount.toLocaleString('id-ID')}</h3>
               <p className="text-[9px] font-bold text-slate-400 mt-2 italic">*Berisi kode unik Rp {activeTopup.uniqueCode}</p>
            </div>

            <div className="mt-6 space-y-4 text-left px-4">
               <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Metode</p>
                    <p className="font-black text-slate-700">{activeTopup.paymentMethod.name}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                     <CreditCard size={20} />
                  </div>
               </div>
               <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nomor Rekening</p>
                    <p className="text-lg font-black text-slate-800 tracking-wider font-mono">{activeTopup.paymentMethod.accountNo}</p>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(activeTopup.paymentMethod.accountNo)} className="text-[10px] font-black text-indigo-600 uppercase">Salin</button>
               </div>
               <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atas Nama</p>
                    <p className="font-black text-slate-700 uppercase">{activeTopup.paymentMethod.accountName}</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full mt-8 bg-indigo-600 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
            >
              {loading ? 'Memproses...' : 'SAYA SUDAH BAYAR'}
            </button>
            <button onClick={() => setStep('form')} className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Kembali ke Form</button>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
               <Clock size={48} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Menunggu Konfirmasi</h2>
            <p className="text-sm text-slate-400 font-bold mt-4 leading-relaxed">
              Admin sedang memverifikasi pembayaran Anda. Saldo akan otomatis bertambah setelah disetujui.
            </p>
            
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
              ID Transaksi: {activeTopup?.id.toUpperCase()}
            </div>

            <button 
              onClick={() => { setStep('form'); checkActiveTopup(); }}
              className="w-full mt-8 bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-slate-100 text-xs uppercase tracking-[0.2em]"
            >
              OKE, MENGERTI
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-2">
         <ArrowDownToLine className="text-indigo-600" />
         <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Top Up Saldo</h1>
      </div>

      <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
            <WalletIcon size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Rp {user?.balance.toLocaleString('id-ID')}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Saldo Dompet Anda</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800 px-2 underline decoration-indigo-200 underline-offset-4">1. Pilih Nominal</h3>
            <div className="grid grid-cols-2 gap-3">
              {DEPOSIT_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`py-4 rounded-2xl border-2 font-black transition-all text-sm ${amount === amt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}
                >
                  Rp {amt.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="px-2 mt-4">
              <input 
                type="number"
                placeholder="Nominal lainnya..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800 px-2 underline decoration-indigo-200 underline-offset-4">2. Pilih Metode Pembayaran</h3>
            <div className="space-y-3">
              {paymentMethods.map(m => {
                const Icon = m.icon === 'QrCode' ? Smartphone : CreditCard;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-3xl border-2 transition-all ${method === m.id ? 'bg-indigo-50 border-indigo-600 shadow-md ring-1 ring-indigo-600' : 'bg-white border-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${method === m.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="text-left">
                         <span className={`text-sm font-bold block ${method === m.id ? 'text-indigo-900' : 'text-gray-600'}`}>{m.name}</span>
                         <span className="text-[10px] text-gray-400 font-medium">{m.accountNo}</span>
                      </div>
                    </div>
                    {method === m.id && <Check size={20} className="text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleCreateTopup}
              disabled={loading || !amount || !method}
              className="w-full bg-indigo-600 text-white py-5 rounded-[2.5rem] font-black shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs"
            >
              {loading ? 'Memproses...' : 'Lanjut Pembayaran'}
              <ArrowDownToLine size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
