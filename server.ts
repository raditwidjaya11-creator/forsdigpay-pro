import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as db from './db.js';
import { env } from 'process';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const JWT_SECRET = env.JWT_SECRET || 'forsdigpay-secret-key-123';

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  app.use(express.json());

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

  const isAdmin = (req: any, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
  };

  // --- API Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, phone, role } = req.body;
    if (db.findOne('users', (u: any) => u.email === email)) return res.status(400).json({ message: 'Email exists' });
    const userRole = role === 'admin' ? 'admin' : 'user';
    const user = db.insert('users', { 
      id: Date.now().toString(), 
      name, 
      email, 
      password: await bcrypt.hash(password, 10), 
      phone, 
      role: userRole, 
      balance: userRole === 'admin' ? 1000000 : 0, 
      createdAt: new Date().toISOString() 
    });
    res.json({ token: jwt.sign({ id: user.id, role: user.role }, JWT_SECRET), user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance } });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.findOne('users', (u: any) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: jwt.sign({ id: user.id, role: user.role }, JWT_SECRET), user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance } });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user: any = db.findOne('users', (u: any) => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance });
  });

  app.get('/api/products', (req, res) => {
    const { category } = req.query;
    let products = db.readTable<any>('products');
    if (category) products = products.filter(p => p.category === category);
    res.json(products);
  });

  app.post('/api/transactions', authenticateToken, (req: any, res) => {
    const { productId, target } = req.body;
    const user: any = db.findOne('users', (u: any) => u.id === req.user.id);
    const product: any = db.findOne('products', (p: any) => p.id === productId);
    if (!product || user.balance < product.price) return res.status(400).json({ message: 'Invalid product or balance' });
    db.update('users', (u: any) => u.id === user.id, { balance: user.balance - product.price });
    const trx = db.insert('transactions', { id: 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase(), userId: user.id, productId, productName: product.name, amount: product.price, target, status: 'SUCCESS', createdAt: new Date().toISOString() });
    res.json(trx);
  });

  app.get('/api/history', authenticateToken, (req: any, res) => {
    res.json(db.readTable<any>('transactions').filter(t => t.userId === req.user.id).reverse());
  });

  app.post('/api/wallet/deposit', authenticateToken, (req: any, res) => {
    const { amount, method } = req.body;
    const user: any = db.findOne('users', (u: any) => u.id === req.user.id);
    db.update('users', (u: any) => u.id === user.id, { balance: user.balance + amount });
    res.json(db.insert('deposits', { id: 'DEP-' + Math.random().toString(36).substr(2, 9).toUpperCase(), userId: user.id, amount, method, status: 'SUCCESS', createdAt: new Date().toISOString() }));
  });

  app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
    const users = db.readTable('users');
    const txs = db.readTable<any>('transactions');
    res.json({ totalUsers: users.length, totalTransactions: txs.length, revenue: txs.reduce((a, t) => a + t.amount, 0), activeUsers: users.filter((u: any) => u.role === 'user').length });
  });

  // --- Admin User Management ---
  app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
    const users = db.readTable<any>('users').map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    res.json(users);
  });

  app.put('/api/admin/users/:id/balance', authenticateToken, isAdmin, (req, res) => {
    const { amount, action } = req.body; // action: 'ADD' or 'SET'
    const user = db.findOne('users', (u: any) => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let newBalance = action === 'SET' ? amount : (user.balance + amount);
    db.update('users', (u: any) => u.id === req.params.id, { balance: newBalance });
    res.json({ success: true, newBalance });
  });

  // --- Admin Product Management ---
  app.post('/api/admin/products', authenticateToken, isAdmin, (req, res) => {
    const product = db.insert('products', {
      id: 'p' + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    });
    res.json(product);
  });

  app.put('/api/admin/products/:id', authenticateToken, isAdmin, (req, res) => {
    const updated = db.update('products', (p: any) => p.id === req.params.id, req.body);
    res.json(updated);
  });

  app.delete('/api/admin/products/:id', authenticateToken, isAdmin, (req, res) => {
    const products = db.readTable<any>('products').filter(p => p.id !== req.params.id);
    db.writeTable('products', products);
    res.json({ success: true });
  });

  // --- Top Up Management ---
  app.get('/api/topups', authenticateToken, (req, res) => {
    const topups = db.readTable<any>('topups').filter(t => t.userId === (req as any).user.id);
    res.json(topups);
  });

  app.post('/api/topups', authenticateToken, (req, res) => {
    const { amount, paymentMethodId } = req.body;
    const method = db.findOne('payment_methods', (m: any) => m.id === paymentMethodId);
    
    if (!method) return res.status(404).json({ message: 'Payment method not found' });

    // Generate unique code (e.g., last 3 digits)
    const uniqueCode = Math.floor(Math.random() * 900) + 100;
    const totalAmount = amount + uniqueCode;

    const topup = db.insert('topups', {
      id: 'topup' + Date.now(),
      userId: (req as any).user.id,
      userName: (req as any).user.name,
      amount,
      uniqueCode,
      totalAmount,
      paymentMethod: method,
      status: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString()
    });

    res.json(topup);
  });

  app.put('/api/topups/:id/confirm', authenticateToken, (req, res) => {
    const topup = db.findOne('topups', (t: any) => t.id === req.params.id && t.userId === (req as any).user.id);
    if (!topup) return res.status(404).json({ message: 'Topup not found' });

    const updated = db.update('topups', (t: any) => t.id === req.params.id, { 
      status: 'AWAITING_CONFIRMATION',
      confirmedAt: new Date().toISOString()
    });
    res.json(updated);
  });

  // --- Admin Top Up Confirmation ---
  app.get('/api/admin/topups', authenticateToken, isAdmin, (req, res) => {
    res.json(db.readTable('topups'));
  });

  app.put('/api/admin/topups/:id/status', authenticateToken, isAdmin, (req, res) => {
    const { status } = req.body; // 'SUCCESS' or 'REJECTED'
    const topup = db.findOne('topups', (t: any) => t.id === req.params.id);
    
    if (!topup) return res.status(404).json({ message: 'Topup not found' });
    if (topup.status === 'SUCCESS' || topup.status === 'REJECTED') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    const updated = db.update('topups', (t: any) => t.id === req.params.id, { 
      status,
      processedAt: new Date().toISOString()
    });

    if (status === 'SUCCESS') {
      const user = db.findOne('users', (u: any) => u.id === topup.userId);
      if (user) {
        db.update('users', (u: any) => u.id === topup.userId, { 
          balance: user.balance + topup.totalAmount 
        });
        
        // Also log as a successful transaction in history
        db.insert('transactions', {
          id: 'tx_topup_' + Date.now(),
          userId: topup.userId,
          amount: topup.totalAmount,
          type: 'TOPUP',
          status: 'SUCCESS',
          createdAt: new Date().toISOString()
        });
      }
    }

    res.json(updated);
  });

  // --- Payment Methods Management ---
  app.get('/api/payment-methods', (req, res) => {
    res.json(db.readTable('payment_methods'));
  });

  app.post('/api/admin/payment-methods', authenticateToken, isAdmin, (req, res) => {
    const method = db.insert('payment_methods', {
      id: 'pm' + Date.now(),
      ...req.body,
      status: req.body.status ?? 'ENABLED',
      createdAt: new Date().toISOString()
    });
    res.json(method);
  });

  app.put('/api/admin/payment-methods/:id', authenticateToken, isAdmin, (req, res) => {
    const updated = db.update('payment_methods', (m: any) => m.id === req.params.id, req.body);
    res.json(updated);
  });

  app.delete('/api/admin/payment-methods/:id', authenticateToken, isAdmin, (req, res) => {
    const methods = db.readTable<any>('payment_methods').filter(m => m.id !== req.params.id);
    db.writeTable('payment_methods', methods);
    res.json({ success: true });
  });

  // --- Provider Management Routes ---
  app.get('/api/admin/providers', authenticateToken, isAdmin, (req, res) => {
    res.json(db.readTable('providers'));
  });

  app.post('/api/admin/providers', authenticateToken, isAdmin, (req, res) => {
    const provider = db.insert('providers', { 
      id: Date.now().toString(), 
      ...req.body, 
      status: req.body.status ?? 'ENABLED',
      createdAt: new Date().toISOString() 
    });
    res.json(provider);
  });

  app.put('/api/admin/providers/:id', authenticateToken, isAdmin, (req, res) => {
    const updated = db.update('providers', (p: any) => p.id === req.params.id, req.body);
    res.json(updated);
  });

  app.delete('/api/admin/providers/:id', authenticateToken, isAdmin, (req, res) => {
    const providers = db.readTable<any>('providers').filter(p => p.id !== req.params.id);
    db.writeTable('providers', providers);
    res.json({ success: true });
  });

  // --- Seed Data ---
  const adminEmail = 'admin@forsdigpay.com';
  if (!db.findOne('users', (u: any) => u.email === adminEmail)) {
    db.insert('users', { id: 'admin', name: 'Super Admin', email: adminEmail, password: await bcrypt.hash('admin123', 10), role: 'admin', balance: 1000000000, createdAt: new Date().toISOString() });
  }
  
  if (db.readTable('products').length === 0) {
    [
      { id: 'p1', name: 'Telkomsel 5rb', category: 'pulsa', price: 5500, provider: 'Digiflazz' },
      { id: 'p2', name: 'XL 10rb', category: 'pulsa', price: 10600, provider: 'Digiflazz' },
      { id: 'p3', name: 'PLN 20rb', category: 'pln', price: 20200, provider: 'Digiflazz' },
      { id: 'p4', name: 'Diamond ML 86', category: 'game', price: 22000, provider: 'Digiflazz' },
      { id: 'p5', name: 'DANA 50rb', category: 'ewallet', price: 51200, provider: 'Digiflazz' },
    ].forEach(p => db.insert('products', p));
  }

  if (db.readTable('providers').length === 0) {
    db.insert('providers', { 
      id: 'p1', 
      name: 'Digiflazz', 
      url: 'https://api.digiflazz.com/v1', 
      apiKey: 'demo_key', 
      username: 'demo_user', 
      secret: 'demo_secret', 
      priority: 1, 
      status: 'ENABLED' 
    });
  }

  if (db.readTable('payment_methods').length === 0) {
    [
      { id: 'pm1', name: 'Transfer Bank BCA', type: 'BANK', accountNo: '1234567890', accountName: 'PT FORSDIG DIGITAL', status: 'ENABLED', icon: 'CreditCard' },
      { id: 'pm2', name: 'QRIS (OVO/Dana/LinkAja)', type: 'EWALLET', accountNo: 'QR-CODE-LINK', accountName: 'FORSDIGPAY', status: 'ENABLED', icon: 'QrCode' },
      { id: 'pm3', name: 'Transfer Bank Mandiri', type: 'BANK', accountNo: '0987654321', accountName: 'PT FORSDIG DIGITAL', status: 'ENABLED', icon: 'CreditCard' },
    ].forEach(m => db.insert('payment_methods', m));
  }

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

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
}

import fs from 'fs';
startServer();
