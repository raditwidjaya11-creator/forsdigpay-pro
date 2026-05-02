import React, { useState } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'motion/react';
import { CreditCard, Wallet as WalletIcon, Check, ArrowDownToLine, Smartphone, Clock, QrCode, Building2 } from 'lucide-react';

const DEPOSIT_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm' | 'instructions' | 'waiting'>('form');
  const [activeTopup, setActiveTopup] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  React.useEffect(() => {
    fetchPaymentMethods();
    checkActiveTopup();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const checkActiveTopup = async () => {
    try {
      const { data } = await api.get('/topups');
      if (!Array.isArray(data)) return;
      const topupData = data as any[];
      const pending = topupData.find((t: any) => t.status === 'PENDING_PAYMENT' || t.status === 'AWAITING_CONFIRMATION');
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
      if (Array.isArray(data)) {
        setPaymentMethods(data.filter((m: any) => m.status === 'ENABLED'));
      } else {
        setPaymentMethods([]);
      }
    } catch (e) {
      console.error(e);
      setPaymentMethods([]);
    }
  };

  const handleCreateTopup = async () => {
    if (!amount || !method) return alert('Pilih jumlah dan metode deposit');
    setLoading(true);
    try {
      const { data } = await api.post('/topups', { 
        amount: parseInt(amount.toString()) || 0, 
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

  if (step === 'confirm') {
    const selectedMethod = paymentMethods.find(m => m.id === method);
    const amt = parseInt(amount.toString()) || 0;
    
    let fee = 0;
    if (selectedMethod?.fee_type === 'PERCENT') {
      fee = Math.ceil((amt * (selectedMethod?.fee || 0)) / 100);
    } else {
      fee = selectedMethod?.fee || 0;
    }
    
    const totalDraft = amt + fee;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
              <ArrowDownToLine size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Konfirmasi Top Up</h2>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Periksa kembali detail pesanan Anda</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Nominal Top Up</span>
                <span className="font-bold font-mono">Rp {amt.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Biaya Admin</span>
                <span className="font-bold font-mono text-indigo-500">
                  + {selectedMethod?.fee_type === 'PERCENT' ? `${selectedMethod?.fee}% (Rp ${fee.toLocaleString('id-ID')})` : `Rp ${fee.toLocaleString('id-ID')}`}
                </span>
              </div>
              <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Estimasi Total</span>
                <span className="font-black text-slate-800 font-mono text-lg">Rp {totalDraft.toLocaleString('id-ID')}*</span>
              </div>
              <p className="text-[8px] text-slate-400 font-bold uppercase text-right leading-tight">
                *Belum termasuk kode unik acak yang akan <br/>ditambahkan untuk verifikasi otomatis
              </p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
               <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                  {selectedMethod?.icon === 'QrCode' ? <QrCode size={20} /> : <CreditCard size={20} />}
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Melalui Metode</p>
                  <p className="text-xs font-black text-slate-800 mt-1 uppercase leading-none">{selectedMethod?.name}</p>
               </div>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <button 
              onClick={handleCreateTopup}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-5 rounded-[2.5rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
            >
              {loading ? 'Sesaat ya...' : 'BUAT PESANAN SEKARANG'}
            </button>
            <button 
              onClick={() => setStep('form')}
              className="w-full py-4 rounded-[2rem] font-black text-slate-400 hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest"
            >
              Ubah Detail
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'instructions' && activeTopup) {
    const Icon = activeTopup.paymentMethod?.icon === 'QrCode' ? QrCode : activeTopup.paymentMethod?.icon === 'Building2' ? Building2 : activeTopup.paymentMethod?.icon === 'Smartphone' ? Smartphone : CreditCard;

    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Instruksi Bayar</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {activeTopup.id?.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ring-1 ring-amber-200">
                <Clock size={10} />
                Menunggu
              </div>
            </div>
            
            <div className="p-8 bg-indigo-600 rounded-[3rem] text-center shadow-lg shadow-indigo-200 mb-8 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl font-black"></div>
               <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-2 relative z-10">Total Harus Dibayar</p>
               <h3 className="text-3xl font-black text-white relative z-10 font-mono">Rp {activeTopup?.totalAmount?.toLocaleString('id-ID')}</h3>
               <div className="mt-4 grid grid-cols-2 gap-2 relative z-10">
                 <div className="py-1.5 px-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                   <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-0.5">Biaya Admin</p>
                   <p className="text-[10px] font-black text-white">Rp {activeTopup?.fee?.toLocaleString('id-ID') || 0}</p>
                 </div>
                 <div className="py-1.5 px-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                   <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-0.5">Kode Unik</p>
                   <p className="text-[10px] font-black text-emerald-400">Rp {activeTopup?.uniqueCode}</p>
                 </div>
               </div>
               <p className="mt-4 text-[9px] font-bold text-white/60 uppercase tracking-widest relative z-10 italic">
                 *Transfer sesuai nominal persis ke rupiah terakhir
               </p>
            </div>

            <div className="space-y-4">
               <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tujuan Transfer</p>
                      <p className="text-lg font-black text-slate-800 font-mono tracking-wider">{activeTopup?.paymentMethod?.accountNo}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-tight">{activeTopup?.paymentMethod?.name} • {activeTopup?.paymentMethod?.accountName}</p>
                    </div>
                    <button 
                      onClick={() => handleCopy(activeTopup?.paymentMethod?.accountNo)} 
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600 border border-slate-200 shadow-sm'}`}
                    >
                      {copySuccess ? 'BERHASIL' : 'SALIN'}
                    </button>
                  </div>

                  <div className="pt-5 border-t border-slate-200/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">*PENTING:</p>
                    <ul className="space-y-2">
                       <li className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                         <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                         Transfer sesuai nominal persis ke rupiah terakhir.
                       </li>
                       <li className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                         <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                         Klik tombol konfirmasi dibawah jika sudah transfer.
                       </li>
                    </ul>
                  </div>
               </div>
            </div>

            <div className="mt-10 space-y-4">
              <button 
                onClick={handleConfirmPayment}
                disabled={loading}
                className="group w-full bg-emerald-600 text-white py-5 rounded-[2.5rem] font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2"
              >
                {loading ? 'Sabar ya...' : (
                  <>
                    KONFIRMASI SUDAH BAYAR
                    <Check size={20} className="group-hover:scale-125 transition-transform" />
                  </>
                )}
              </button>
              <p className="text-[9px] text-center font-bold text-slate-300 uppercase tracking-[0.15em]">Sistem otomatis memproses dalam 1-5 menit</p>
            </div>
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
              ID Transaksi: {activeTopup?.id?.toUpperCase()}
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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Rp {user?.balance?.toLocaleString('id-ID') || '0'}</h2>
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
                  Rp {amt?.toLocaleString()}
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

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-800 px-2 underline decoration-indigo-200 underline-offset-4">2. Pilih Metode Pembayaran</h3>
            
            {['BANK', 'EWALLET', 'RETAIL'].map(type => {
              const methodsOfType = paymentMethods.filter(m => m.type === type);
              if (methodsOfType.length === 0) return null;

              return (
                <div key={type} className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    {type === 'BANK' ? 'Transfer Bank' : type === 'EWALLET' ? 'E-Wallet / QRIS' : 'Gerai Retail'}
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {methodsOfType.map(m => {
                      const Icon = m.icon === 'QrCode' ? QrCode : m.icon === 'Building2' ? Building2 : m.icon === 'Smartphone' ? Smartphone : CreditCard;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMethod(m.id)}
                          className={`w-full flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all ${method === m.id ? 'bg-indigo-50 border-indigo-600 shadow-md ring-1 ring-indigo-600' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${method === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                              <Icon size={24} />
                            </div>
                            <div className="text-left">
                               <div className="flex items-center gap-2">
                                 <span className={`text-sm font-black block ${method === m.id ? 'text-indigo-900' : 'text-slate-700'}`}>{m.name}</span>
                                 {m.fee > 0 && (
                                   <span className="text-[8px] font-black px-1.5 bg-indigo-100 text-indigo-600 rounded border border-indigo-200">
                                     +{m.fee_type === 'PERCENT' ? `${m.fee}%` : `Rp ${m.fee.toLocaleString('id-ID')}`}
                                   </span>
                                 )}
                               </div>
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{m.type === 'BANK' ? m.accountNo : 'Otomatis'}</span>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${method === m.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`}>
                            {method === m.id && <Check size={14} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4">
            <button
              onClick={() => setStep('confirm')}
              disabled={loading || !amount || !method}
              className="w-full bg-indigo-600 text-white py-5 rounded-[2.5rem] font-black shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs"
            >
              Lanjut Pembayaran
              <ArrowDownToLine size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
