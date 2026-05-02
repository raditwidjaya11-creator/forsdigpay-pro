import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from 'process';
import { createServer as createViteServer } from 'vite';

import { supabase } from './src/lib/supabase.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = env.JWT_SECRET || 'forsdigpay-secret-key-123';

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);
    
    // Admin room for specific notifications
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`Socket ${socket.id} joined admin room`);
    });
  });

  app.use(express.json());

  // --- Initial Data Seeding ---
  /*
  SQL Schema for payment_methods:
  CREATE TABLE payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- BANK, EWALLET, RETAIL
    account_no TEXT,
    account_name TEXT,
    status TEXT DEFAULT 'ENABLED', -- ENABLED, DISABLED
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  */
  const seedData = async () => {
    console.log('[DEBUG] Checking payment_methods table...');
    const { count, error } = await supabase.from('payment_methods').select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('[DEBUG] payment_methods table check failed:', error);
      // If table doesn't exist, this might be why
      return;
    }
    
    console.log('[DEBUG] payment_methods count:', count);
    if (count === 0) {
      console.log('Seeding default payment methods...');
      const { error: seedError } = await supabase.from('payment_methods').insert([
        { id: 'bank-bca', name: 'BCA Transfer Manual', type: 'BANK', account_no: '8705332111', account_name: 'PT FORSDIG DIGITAL INDONESIA', status: 'ENABLED', icon: 'CreditCard', fee: 0, created_at: new Date().toISOString() },
        { id: 'ewallet-qris', name: 'QRIS All Payment', type: 'EWALLET', account_no: '0001928374', account_name: 'FORSDIGPAY QRIS', status: 'ENABLED', icon: 'QrCode', fee: 1000, created_at: new Date().toISOString() },
        { id: 'bank-mandiri', name: 'Mandiri Transfer', type: 'BANK', account_no: '1230009988776', account_name: 'PT FORSDIG DIGITAL INDONESIA', status: 'ENABLED', icon: 'CreditCard', fee: 0, created_at: new Date().toISOString() }
      ]);
      if (seedError) console.error('[DEBUG] Seeding error:', seedError);
    }
  };
  seedData().catch(console.error);

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // --- RBAC Config ---
  const ROLES = {
    SUPER_ADMIN: 'super_admin',
    FINANCE_ADMIN: 'finance_admin',
    SUPPORT_ADMIN: 'support_admin',
    USER: 'user',
    ADMIN_LEGACY: 'admin' // for backward compatibility
  };

  const ALL_ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY];

  const authorize = (allowedRoles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Akses ditolak: Izin tidak memadai' });
      }
      next();
    };
  };

  const isAdmin = (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !ALL_ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };

  // --- Email Service (Simulated) ---
  const sendEmail = (to: string, subject: string, body: string) => {
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${body}`);
    console.log('-----------------------------------');
  };

  const notifySuccessTransaction = (user: any, transaction: any) => {
    sendEmail(
      user.email,
      'Transaksi Berhasil - Forsdigpay',
      `Halo ${user.name},\n\nTransaksi Anda senilai Rp ${transaction.amount.toLocaleString('id-ID')} untuk ${transaction.productName || 'Topup Saldo'} telah BERHASIL.\nID Transaksi: ${transaction.id}\n\nTerima kasih telah menggunakan Forsdigpay!`
    );
  };

  const notifyLowBalance = (user: any, balance: number) => {
    if (balance < 10000) {
      sendEmail(
        user.email,
        'Peringatan Saldo Rendah - Forsdigpay',
        `Halo ${user.name},\n\nSudah saatnya isi ulang! Saldo Anda saat ini adalah Rp ${balance.toLocaleString('id-ID')}.\nSegera lakukan top up agar transaksi Anda tidak terhambat.`
      );
    }
  };

  // --- API Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, phone, role } = req.body;
    
    try {
      // Check if email exists
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (existingUser) return res.status(400).json({ message: 'Email sudah terdaftar. Silakan gunakan email lain.' });
      
      const userRole = role === 'admin' ? 'admin' : 'user';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { data: user, error } = await supabase.from('users').insert({ 
        id: Date.now().toString(), 
        name, 
        email, 
        password: hashedPassword, 
        phone, 
        role: userRole, 
        balance: userRole === 'admin' ? 1000000 : 0, 
        created_at: new Date().toISOString() 
      }).select('id, name, email, phone, role, balance, createdAt:created_at').single();
  
      if (error) throw error;
      
      sendEmail(user.email, 'Selamat Datang di Forsdigpay!', `Halo ${user.name},\n\nTerima kasih telah mendaftar di Forsdigpay. Akun Anda telah aktif dan siap digunakan.\n\nSelamat bertransaksi!`);
      
      res.json({ 
        token: jwt.sign({ id: user.id, role: user.role }, JWT_SECRET), 
        user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance } 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: error.message || 'Terjadi kesalahan saat mendaftar.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: user, error } = await supabase.from('users').select('id, name, email, password, role, balance, phone, createdAt:created_at').eq('email', email).maybeSingle();
      
      if (error) throw error;
      if (!user) return res.status(400).json({ message: 'Akun tidak ditemukan.' });
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Email atau password salah.' });
      
      res.json({ 
        token: jwt.sign({ id: user.id, role: user.role }, JWT_SECRET), 
        user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance } 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message || 'Terjadi kesalahan saat masuk.' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const { data: user, error } = await supabase.from('users').select('id, name, email, password, role, balance, phone, createdAt:created_at').eq('id', req.user.id).single();
      if (error || !user) return res.status(404).json({ message: 'Sesi berakhir, silakan masuk kembali.' });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance });
    } catch (error: any) {
      res.status(401).json({ message: 'Sesi tidak valid.' });
    }
  });

  app.get('/api/products', async (req, res) => {
    const { category } = req.query;
    let query = supabase.from('products').select('*');
    if (category) query = query.eq('category', category);
    
    const { data: products } = await query;
    res.json(products || []);
  });

  app.post('/api/transactions', authenticateToken, async (req: any, res) => {
    const { productId, target } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
    
    if (!product || !user || user.balance < product.price) return res.status(400).json({ message: 'Invalid product or balance' });
    
    const newBalance = user.balance - product.price;
    await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
    
    const { data: trx } = await supabase.from('transactions').insert({ 
      id: 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase(), 
      user_id: user.id, 
      product_id: productId, 
      product_name: product.name, 
      amount: product.price, 
      target, 
      status: 'SUCCESS', 
      created_at: new Date().toISOString() 
    }).select('id, userId:user_id, productId:product_id, productName:product_name, amount, target, status, createdAt:created_at').single();

    if (trx) {
      notifySuccessTransaction(user, trx);
      notifyLowBalance(user, newBalance);
      
      // Emit real-time notification to admin
      io.to('admin_room').emit('notification', {
        type: 'TRANSACTION',
        message: `Transaksi baru dari ${user.name}: ${trx.productName}`,
        data: trx,
        timestamp: new Date().toISOString()
      });
    }

    res.json(trx);
  });

  app.get('/api/history', authenticateToken, async (req: any, res) => {
    const { data } = await supabase.from('transactions').select('id, userId:user_id, productId:product_id, productName:product_name, amount, target, status, type, createdAt:created_at').eq('user_id', req.user.id).order('created_at', { ascending: false });
    res.json(data || []);
  });

  app.post('/api/wallet/deposit', authenticateToken, async (req: any, res) => {
    const { amount, method } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const newBalance = user.balance + amount;
    await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
    
    const { data: deposit } = await supabase.from('transactions').insert({ 
      id: 'DEP-' + Math.random().toString(36).substr(2, 9).toUpperCase(), 
      user_id: user.id, 
      amount, 
      type: 'TOPUP',
      status: 'SUCCESS', 
      created_at: new Date().toISOString() 
    }).select('id, userId:user_id, amount, type, status, createdAt:created_at').single();
    
    res.json(deposit);
  });

  app.get('/api/admin/stats', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { data: users } = await supabase.from('users').select('created_at');
    const { data: txs } = await supabase.from('transactions').select('amount, created_at, product_id, status');
    const { data: products } = await supabase.from('products').select('id, provider');
    
    const totalTransactions = txs?.length || 0;
    const revenue = txs?.filter(t => t.status === 'SUCCESS').reduce((a, t) => a + t.amount, 0) || 0;
    const activeUsers = totalUsers || 0;

    // --- Analytics Processing ---
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const trends = last14Days.map(date => {
      const dayTxs = txs?.filter(t => t.created_at.startsWith(date)) || [];
      return {
        date,
        transactions: dayTxs.length,
        revenue: dayTxs.filter(t => t.status === 'SUCCESS').reduce((a, t) => a + t.amount, 0)
      };
    });

    const userGrowth = last14Days.map(date => {
      const dayUsers = users?.filter(u => u.created_at.startsWith(date)) || [];
      return {
        date,
        count: dayUsers.length
      };
    });

    const providerPerformance: Record<string, { total: number, success: number, revenue: number }> = {};
    const productToProvider: Record<string, string> = {};
    products?.forEach(p => productToProvider[p.id] = p.provider);

    txs?.forEach(t => {
      const provider = productToProvider[t.product_id] || 'System/Topup';
      if (!providerPerformance[provider]) {
        providerPerformance[provider] = { total: 0, success: 0, revenue: 0 };
      }
      providerPerformance[provider].total++;
      if (t.status === 'SUCCESS') {
        providerPerformance[provider].success++;
        providerPerformance[provider].revenue += t.amount;
      }
    });

    const providerStats = Object.entries(providerPerformance).map(([name, stats]) => ({
      name,
      ...stats,
      successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
    }));

    res.json({ 
      totalUsers, 
      totalTransactions, 
      revenue, 
      activeUsers,
      trends,
      userGrowth,
      providerStats
    });
  });

  app.get('/api/admin/reports/transactions', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { startDate, endDate, status, type } = req.query;
    let query = supabase.from('transactions').select('id, userId:user_id, productId:product_id, productName:product_name, amount, target, status, createdAt:created_at');

    if (startDate) query = query.gte('created_at', startDate as string);
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }
    if (status && status !== 'ALL') query = query.eq('status', status);
    
    const { data: transactions } = await query.order('created_at', { ascending: false });
    
    let filtered = transactions || [];
    if (type && type !== 'ALL') {
      if (type === 'PURCHASE') {
        filtered = filtered.filter((t: any) => t.productId);
      } else if (type === 'TOPUP') {
        filtered = filtered.filter((t: any) => !t.productId);
      }
    }

    res.json(filtered);
  });

  app.post('/api/admin/reports/send', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { startDate, endDate, status, type, recipientEmail, transactionCount } = req.body;
    
    sendEmail(
      recipientEmail,
      `Laporan Transaksi Forsdigpay (${startDate} - ${endDate})`,
      `Halo,\n\nTerlampir adalah ringkasan laporan transaksi Anda untuk periode ${startDate} hingga ${endDate}.\n\nTotal Transaksi: ${transactionCount}\nStatus Filter: ${status}\nJenis Filter: ${type}\n\nSilahkan login ke dashboard untuk detail selengkapnya.`
    );

    const { data: report } = await supabase.from('reports').insert({
      id: 'rep_' + Date.now(),
      start_date: startDate,
      end_date: endDate,
      status,
      type,
      recipient_email: recipientEmail,
      transaction_count: transactionCount,
      sent_at: new Date().toISOString()
    }).select('id, startDate:start_date, endDate:end_date, status, type, recipientEmail:recipient_email, transactionCount:transaction_count, sentAt:sent_at').single();

    res.json(report);
  });

  app.get('/api/admin/reports/history', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { data } = await supabase.from('reports').select('id, startDate:start_date, endDate:end_date, status, type, recipientEmail:recipient_email, transactionCount:transaction_count, sentAt:sent_at').order('sent_at', { ascending: false });
    res.json(data || []);
  });

  app.get('/api/admin/users/:id/transactions', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { data } = await supabase.from('transactions').select('id, userId:user_id, productId:product_id, productName:product_name, amount, target, status, createdAt:created_at').eq('user_id', req.params.id);
    res.json(data || []);
  });

  // --- Admin User Management ---
  app.get('/api/admin/users', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { data: users } = await supabase.from('users').select('id, name, email, phone, role, balance, createdAt:created_at');
    res.json(users || []);
  });

  app.put('/api/admin/users/:id/balance', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { amount, action } = req.body; // action: 'ADD' or 'SET'
    const { data: user } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let newBalance = action === 'SET' ? amount : (user.balance + amount);
    await supabase.from('users').update({ balance: newBalance }).eq('id', req.params.id);
    res.json({ success: true, newBalance });
  });

  app.put('/api/admin/users/:id/role', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { role } = req.body;
    const { data: updated, error } = await supabase.from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, name, email, role')
      .single();

    if (error) return res.status(500).json({ message: error.message });
    res.json(updated);
  });

  // --- External Integration Support (Manual Confirmation Flow) ---
  app.patch('/api/transactions', authenticateToken, isAdmin, async (req, res) => {
    const idParam = req.query.id as string;
    // Handle Supabase-style query param eq.ID
    const trxId = idParam?.startsWith('eq.') ? idParam.substring(3) : idParam;
    const { status } = req.body;
    
    if (!trxId) return res.status(400).json({ message: 'Missing transaction ID' });
    
    // Check if it's a Topup
    const { data: topup } = await supabase.from('topups').select('*').eq('id', trxId).single();
    
    if (topup) {
      const { data: updated, error } = await supabase.from('topups')
        .update({ status })
        .eq('id', trxId)
        .select('*')
        .single();
        
      if (error) return res.status(500).json({ message: error.message });
      return res.json(updated);
    }

    // Try normal transaction history
    const { data: trx, error: trxErr } = await supabase.from('transactions')
      .update({ status })
      .eq('id', trxId)
      .select('*')
      .single();

    if (trxErr) return res.status(500).json({ message: trxErr.message });
    res.json(trx);
  });

  app.post('/api/update-balance', authenticateToken, isAdmin, async (req, res) => {
    const { user_id, amount } = req.body;
    
    if (!user_id || amount === undefined) {
      return res.status(400).json({ message: 'Missing user_id or amount' });
    }

    const { data: user } = await supabase.from('users').select('*').eq('id', user_id).single();
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const newBalance = (user.balance || 0) + parseFloat(amount);
    const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', user_id);
    
    if (error) return res.status(500).json({ message: error.message });
    
    res.send("Saldo berhasil ditambahkan");
  });

  // --- Payment Webhook handler ---
  app.post('/api/webhooks/payment', async (req, res) => {
    const { transaction_id, status } = req.body;
    console.log('[WEBHOOK] Received payment notification:', JSON.stringify(req.body, null, 2));

    if (!transaction_id || !status) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    if (status !== 'SUCCESS') {
      console.log(`[WEBHOOK] Status is ${status}, skipping balance update.`);
      return res.json({ message: 'Webhook received but status not SUCCESS' });
    }

    try {
      // 1. Find the topup record
      const { data: topup, error: topupError } = await supabase.from('topups')
        .select('*')
        .eq('id', transaction_id)
        .single();

      if (topupError || !topup) {
        console.error('[WEBHOOK] Topup not found:', transaction_id);
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // 2. Prevent double processing
      if (topup.status === 'SUCCESS') {
        return res.json({ message: 'Transaction already processed' });
      }

      // 3. Update topup status
      const { error: updateError } = await supabase.from('topups')
        .update({ 
          status: 'SUCCESS',
          processed_at: new Date().toISOString()
        })
        .eq('id', transaction_id);

      if (updateError) throw updateError;

      // 4. Update user balance
      const { data: user, error: userError } = await supabase.from('users')
        .select('*')
        .eq('id', topup.user_id)
        .single();

      if (userError || !user) throw new Error('User not found during balance update');

      const creditAmount = topup.total_amount || (topup.amount + (topup.fee || 0) + (topup.unique_code || 0));
      const newBalance = (user.balance || 0) + creditAmount;

      const { error: balanceError } = await supabase.from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // 5. Create transaction record for history
      await supabase.from('transactions').insert({
        id: 'tx_webhook_' + Date.now().toString().slice(-8),
        user_id: user.id,
        amount: creditAmount,
        product_name: 'Top Up Saldo (Webhook)',
        type: 'TOPUP',
        status: 'SUCCESS',
        created_at: new Date().toISOString()
      });

      // 6. Notifications
      sendEmail(
        user.email,
        'Top Up Berhasil (Otomatis) - Forsdigpay',
        `Halo ${user.name},\n\nTop up saldo sebesar Rp ${creditAmount.toLocaleString('id-ID')} telah BERHASIL diverifikasi secara otomatis.\nSaldo Anda saat ini: Rp ${newBalance.toLocaleString('id-ID')}.\n\nTerima kasih!`
      );

      io.to('admin_room').emit('notification', {
        type: 'TOPUP_SUCCESS',
        message: `Topup otomatis berhasil: ${user.name} - Rp ${creditAmount.toLocaleString('id-ID')}`,
        data: { transaction_id, user_id: user.id, amount: creditAmount },
        timestamp: new Date().toISOString()
      });

      console.log(`[WEBHOOK] Successfully processed transaction ${transaction_id} for user ${user.id}`);
      res.json({ message: 'Success', status: 'PAID', balance_added: creditAmount });

    } catch (err: any) {
      console.error('[WEBHOOK] Error processing webhook:', err);
      res.status(500).json({ message: 'Internal server error processing webhook', error: err.message });
    }
  });

  // --- Admin Product Management ---
  app.post('/api/admin/products', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { data: product } = await supabase.from('products').insert({
      id: 'p' + Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    }).select('id, name, category, price, provider, createdAt:created_at').single();
    res.json(product);
  });

  app.put('/api/admin/products/:id', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { data: updated } = await supabase.from('products').update(req.body).eq('id', req.params.id).select('id, name, category, price, provider, createdAt:created_at').single();
    res.json(updated);
  });

  app.delete('/api/admin/products/:id', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    await supabase.from('products').delete().eq('id', req.params.id);
    res.json({ success: true });
  });

  // --- Top Up Management ---
  app.get('/api/topups', authenticateToken, async (req, res) => {
    const { data } = await supabase.from('topups').select('id, userId:user_id, userName:user_name, amount, uniqueCode:unique_code, totalAmount:total_amount, paymentMethod:payment_method, status, createdAt:created_at, confirmedAt:confirmed_at, processedAt:processed_at').eq('user_id', (req as any).user.id);
    res.json(data || []);
  });

  app.post('/api/topups', authenticateToken, async (req, res) => {
    const { amount, paymentMethodId } = req.body;
    const { data: rawMethod } = await supabase.from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .single();
    
    if (!rawMethod) return res.status(404).json({ message: 'Payment method not found' });
    const method = mapPaymentMethod(rawMethod);
    if (!method) return res.status(404).json({ message: 'Gagal memproses metode pembayaran' });
    
    if (method.status !== 'ENABLED') return res.status(400).json({ message: 'Payment method is currently disabled' });

    // Calculate Fee
    let calculatedFee = 0;
    if (method.fee_type === 'PERCENT') {
      calculatedFee = Math.ceil((amount * (method.fee || 0)) / 100);
    } else {
      calculatedFee = method.fee || 0;
    }

    const uniqueCode = Math.floor(Math.random() * 900) + 100;
    const totalAmount = amount + calculatedFee + uniqueCode;

    const { data: user } = await supabase.from('users').select('*').eq('id', (req as any).user.id).single();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const topupId = 'T' + Date.now() + Math.random().toString(36).substr(2, 3).toUpperCase();

    const { data: topups, error } = await supabase.from('topups').insert({
      id: topupId,
      user_id: user.id,
      user_name: user.name,
      amount,
      unique_code: uniqueCode,
      fee: calculatedFee,
      total_amount: totalAmount,
      payment_method: method,
      status: 'PENDING_PAYMENT',
      created_at: new Date().toISOString()
    }).select('id, userId:user_id, userName:user_name, amount, uniqueCode:unique_code, totalAmount:total_amount, paymentMethod:payment_method, fee, status, createdAt:created_at');

    if (error) {
      console.error('[DEBUG] Error creating topup:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    const topup = topups && topups[0];
    if (!topup) return res.status(500).json({ message: 'Gagal membuat topup' });

    // Response in requested format
    res.json({
      transaction_id: topupId,
      nominal: amount,
      fee: calculatedFee,
      unique_code: uniqueCode,
      total: totalAmount,
      payment_detail: `${method.name} - ${method.accountNo} (${method.accountName})`,
      status: 'PENDING',
      raw_data: topup
    });
  });

  app.put('/api/topups/:id/confirm', authenticateToken, async (req, res) => {
    const { data: updated, error } = await supabase.from('topups').update({ 
      status: 'AWAITING_CONFIRMATION',
      confirmed_at: new Date().toISOString()
    }).eq('id', req.params.id).eq('user_id', (req as any).user.id).select('id, userId:user_id, userName:user_name, totalAmount:total_amount, confirmedAt:confirmed_at').single();

    if (error) return res.status(404).json({ message: 'Topup not found' });

    // Emit notification to admin
    io.to('admin_room').emit('notification', {
      type: 'TOPUP_CONFIRMATION',
      message: `Konfirmasi pembayaran baru dari ${updated.userName} sebesar Rp ${updated.totalAmount.toLocaleString('id-ID')}`,
      data: updated,
      timestamp: new Date().toISOString()
    });

    sendEmail(
      'admin@forsdigpay.com',
      'Pembayaran Mitra Masuk',
      `Mitra ${updated.userName} telah melakukan konfirmasi pembayaran top up.\nNominal: Rp ${updated.totalAmount.toLocaleString('id-ID')}\nWaktu: ${updated.confirmedAt}\n\nSilahkan cek dashboard admin untuk verifikasi.`
    );

    res.json(updated);
  });

  // --- Admin Top Up Confirmation ---
  app.get('/api/admin/topups', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { data } = await supabase.from('topups').select('id, userId:user_id, userName:user_name, amount, uniqueCode:unique_code, totalAmount:total_amount, paymentMethod:payment_method, status, createdAt:created_at, confirmedAt:confirmed_at, processedAt:processed_at');
    res.json(data || []);
  });

  app.put('/api/admin/topups/:id/status', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { status } = req.body; // 'SUCCESS' or 'REJECTED'
    const { data: topup } = await supabase.from('topups').select('*').eq('id', req.params.id).single();
    
    if (!topup) return res.status(404).json({ message: 'Topup not found' });
    if (topup.status === 'SUCCESS' || topup.status === 'REJECTED') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    const { data: user } = await supabase.from('users').select('*').eq('id', topup.user_id).single();
    if (!user && status === 'SUCCESS') return res.status(400).json({ message: 'Owner of this topup not found' });

    const { data: updated, error } = await supabase.from('topups').update({ 
      status,
      processed_at: new Date().toISOString()
    }).eq('id', req.params.id).select('id, userId:user_id, totalAmount:total_amount, status').single();

    if (error) return res.status(500).json({ message: error.message });

    if (status === 'SUCCESS' && user) {
      const newBalance = user.balance + topup.total_amount;
      await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
        
      await supabase.from('transactions').insert({
        id: 'tx_topup_' + Date.now(),
        user_id: topup.user_id,
        amount: topup.total_amount,
        product_name: 'Top Up Saldo Mitra',
        type: 'TOPUP',
        status: 'SUCCESS',
        created_at: new Date().toISOString()
      });

      sendEmail(
        user.email,
        'Top Up Berhasil - Forsdigpay',
        `Halo ${user.name},\n\nTop up saldo sebesar Rp ${topup.total_amount.toLocaleString('id-ID')} telah BERHASIL ditambahkan ke akun Anda.\nSaldo Anda saat ini: Rp ${newBalance.toLocaleString('id-ID')}.\n\nTerima kasih!`
      );
    } else if (status === 'REJECTED' && user) {
      sendEmail(
        user.email,
        'Top Up Ditolak - Forsdigpay',
        `Halo ${user.name},\n\nMohon maaf, permintaan top up saldo Anda senilai Rp ${topup.total_amount.toLocaleString('id-ID')} telah DITOLAK.\nPastikan bukti transfer dan nominal sudah sesuai.\n\nSilahkan coba lagi atau hubungi admin.`
      );
    }

    res.json(updated);
  });

  // --- Payment Methods Management ---
  const mapPaymentMethod = (m: any) => {
    if (!m) return null;
    let fee = m.fee ?? 0;
    let feeType = m.fee_type ?? 'FIXED';
    let icon = m.icon || 'CreditCard';

    // Fallback: If icon contains encoded data (icon:feeType:fee) from old schema
    if (icon && typeof icon === 'string' && icon.includes(':')) {
      const parts = icon.split(':');
      icon = parts[0];
      if (parts[1]) feeType = parts[1];
      if (parts[2]) fee = parseFloat(parts[2]) || 0;
    }

    return {
      id: m.id,
      name: m.name,
      type: m.type,
      accountNo: m.account_no,
      accountName: m.account_name,
      status: m.status,
      icon: icon,
      fee: fee,
      fee_type: feeType,
      createdAt: m.created_at
    };
  };

  /**
   * Helper to insert/update data with fallback for missing columns fee/fee_type
   */
  async function savePaymentMethod(id: string | null, data: any, isUpdate: boolean = false) {
    const { fee, fee_type, ...baseFields } = data;
    
    // Prepare data based on columns. We try to be smart.
    let encodedIcon = baseFields.icon || 'CreditCard';
    const resolvedFee = fee !== undefined ? fee : 0;
    const resolvedType = fee_type !== undefined ? fee_type : 'FIXED';
    
    // If we have fee info, encode it into the icon string for fallback
    if (fee !== undefined || fee_type !== undefined) {
      const iconName = encodedIcon.split(':')[0];
      encodedIcon = `${iconName}:${resolvedType}:${resolvedFee}`;
    }
    
    // Create baseData and filter out undefineds
    const baseData: any = {
      ...baseFields,
      icon: encodedIcon
    };
    Object.keys(baseData).forEach(key => baseData[key] === undefined && delete baseData[key]);

    const formatErr = (e: any) => {
      if (!e) return 'Unknown error';
      if (typeof e === 'string') return e;
      return e.message || JSON.stringify(e);
    };

    try {
      // Attempt 1: Try with fee/fee_type columns
      const fullData = { 
        ...baseData, 
        fee: resolvedFee, 
        fee_type: resolvedType 
      };
      if (id) fullData.id = id;

      console.log(`[DEBUG] Save Attempt (isUpdate=${isUpdate}):`, JSON.stringify(fullData));
      
      let result;
      if (isUpdate) {
        result = await supabase.from('payment_methods').update(fullData).eq('id', id).select('*');
      } else {
        result = await supabase.from('payment_methods').insert([fullData]).select('*');
      }

      if (!result.error && result.data && result.data[0]) {
        return { data: mapPaymentMethod(result.data[0]), error: null };
      }

      const err = result.error;
      if (err) {
        console.warn(`[DEBUG] Primary save failed: ${formatErr(err)} (code: ${err.code})`);
        
        // Scenario: Missing columns
        if (err.code === '42703' || err.message?.includes('column')) {
          console.log(`[DEBUG] Falling back to base fields only...`);
          let result2;
          const insertData = { ...baseData };
          if (id) insertData.id = id;

          if (isUpdate) {
            result2 = await supabase.from('payment_methods').update(baseData).eq('id', id).select('*');
          } else {
            result2 = await supabase.from('payment_methods').insert([insertData]).select('*');
          }
          
          if (result2.error) {
            console.error(`[DEBUG] Fallback failed: ${formatErr(result2.error)}`);
            throw result2.error;
          }
          return { data: mapPaymentMethod(result2.data && result2.data[0]), error: null };
        }

        throw err;
      }

      return { data: null, error: new Error('Save succeeded but no data returned. Check RLS policies.') };
    } catch (err: any) {
      console.error('[DEBUG] savePaymentMethod caught:', err);
      return { data: null, error: err };
    }
  }

  app.get('/api/payment-methods', async (req, res) => {
    const { data, error } = await supabase.from('payment_methods')
      .select('*')
      .eq('status', 'ENABLED');
    
    if (error) return res.json([]);
    res.json((data || []).map(mapPaymentMethod));
  });

  app.get('/api/admin/payment-methods', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { data, error } = await supabase.from('payment_methods')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return res.json([]);
    res.json((data || []).map(mapPaymentMethod));
  });

  app.post('/api/admin/payment-methods', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { name, type, accountNo, accountName, status, icon, fee, fee_type } = req.body;
    console.log('[DEBUG] POST payment-method payload:', JSON.stringify(req.body, null, 2));
    
    const id = 'pm' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4);
    
    const payload = {
      name: name || '',
      type: type || 'BANK',
      account_no: accountNo || '',
      account_name: accountName || '',
      status: status || 'ENABLED',
      icon: icon || 'CreditCard',
      fee: fee,
      fee_type: fee_type,
      created_at: new Date().toISOString()
    };

    const { data, error } = await savePaymentMethod(id, payload, false);
    
    if (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      };
      console.error('[DEBUG] Payment Create Error:', errorDetails);
      return res.status(500).json({ 
        message: `Gagal menyimpan: ${error.message || 'Unknown error'}`,
        details: errorDetails
      });
    }
    
    res.json(data);
  });

  app.put('/api/admin/payment-methods/:id', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    console.log(`[DEBUG] PUT payment-method/${req.params.id} payload:`, JSON.stringify(req.body, null, 2));
    
    const { name, type, accountNo, accountName, status, icon, fee, fee_type } = req.body;
    const payload: any = {};
    if (name !== undefined) payload.name = name;
    if (type !== undefined) payload.type = type;
    if (accountNo !== undefined) payload.account_no = accountNo;
    if (accountName !== undefined) payload.account_name = accountName;
    if (status !== undefined) payload.status = status;
    if (icon !== undefined) payload.icon = icon;
    if (fee !== undefined) payload.fee = fee;
    if (fee_type !== undefined) payload.fee_type = fee_type;

    const { data, error } = await savePaymentMethod(req.params.id, payload, true);
    
    if (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      };
      console.error('[DEBUG] Payment Update Error:', errorDetails);
      return res.status(500).json({ 
        message: `Gagal mengupdate: ${error.message || 'Unknown error'}`,
        details: errorDetails
      });
    }
    
    res.json(data);
  });


  app.delete('/api/admin/payment-methods/:id', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    await supabase.from('payment_methods').delete().eq('id', req.params.id);
    res.json({ success: true });
  });

  // --- Provider Management Routes ---
  app.get('/api/admin/providers', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { data } = await supabase.from('providers').select('id, name, url, apiKey:api_key, username, secret, priority, status, createdAt:created_at');
    res.json(data || []);
  });

  app.post('/api/admin/providers', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { name, url, apiKey, username, secret, priority, status } = req.body;
    const { data: provider, error } = await supabase.from('providers').insert({ 
      id: Date.now().toString(), 
      name,
      url,
      api_key: apiKey,
      username,
      secret,
      priority: priority ?? 1,
      status: status ?? 'ENABLED',
      created_at: new Date().toISOString() 
    }).select('id, name, url, apiKey:api_key, username, secret, priority, status, createdAt:created_at').single();

    if (error) return res.status(500).json({ message: error.message });
    res.json(provider);
  });

  app.put('/api/admin/providers/:id', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    const { name, url, apiKey, username, secret, priority, status } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (apiKey !== undefined) updateData.api_key = apiKey;
    if (username !== undefined) updateData.username = username;
    if (secret !== undefined) updateData.secret = secret;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;

    const { data: updated, error } = await supabase.from('providers')
      .update(updateData)
      .eq('id', req.params.id)
      .select('id, name, url, apiKey:api_key, username, secret, priority, status, createdAt:created_at')
      .single();

    if (error) return res.status(500).json({ message: error.message });
    res.json(updated);
  });

  app.delete('/api/admin/providers/:id', authenticateToken, authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN_LEGACY]), async (req, res) => {
    await supabase.from('providers').delete().eq('id', req.params.id);
    res.json({ success: true });
  });

  // --- Vite / Static ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist/index.html')));
  }

  httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
}

import fs from 'fs';
startServer();
