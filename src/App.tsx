import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import UserDashboard from './pages/Dashboard.js';
import Wallet from './pages/Wallet.js';
import History from './pages/History.js';
import Profile from './pages/Profile.js';
import AdminDashboard from './admin/AdminDashboard.js';
import Navbar from './components/Navbar.js';
import ChatBot from './components/ChatBot.js';

import { Toaster } from 'sonner';
import { SocketProvider } from './context/SocketContext.js';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100">
      {user && <Navbar />}
      <main className={user ? "pb-32 pt-24 px-6 max-w-lg mx-auto" : ""}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
            </ProtectedRoute>
          } />
          
          <Route path="/wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {user && <ChatBot />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppContent />
          <Toaster position="top-right" richColors />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
