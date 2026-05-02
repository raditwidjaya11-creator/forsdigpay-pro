import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext.js';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) return;

    const newSocket = io(window.location.origin);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected');
      
      // If admin, join admin room
      if (user.role === 'admin') {
        newSocket.emit('join_admin');
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    newSocket.on('notification', (payload: any) => {
      console.log('New notification:', payload);
      
      toast(payload.type === 'TRANSACTION' ? 'Transaksi Baru' : 'Konfirmasi Top Up', {
        description: payload.message,
        action: {
          label: 'Lihat',
          onClick: () => {
            // Redirect based on type if needed
            if (payload.type === 'TRANSACTION') {
              window.location.href = '/admin/reports';
            } else {
              window.location.href = '/admin/topups';
            }
          }
        },
        duration: 8000,
      });

      // Also trigger a sound or something if needed
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (err) {
        console.log('Sound notification failed');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
