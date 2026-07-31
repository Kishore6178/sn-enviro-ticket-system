import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { PageLayout } from './components/layout/PageLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tickets } from './pages/Tickets';
import { TicketDetail } from './pages/TicketDetail';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { MagicResolve } from './pages/MagicResolve';
import { Alerts } from './pages/Alerts';
import { AdminPortal } from './pages/AdminPortal';
import { Leaderboard } from './pages/Leaderboard';
import ClientPortal from './pages/ClientPortal';
import { db } from './services/db';
import api from './services/api';

// Dedicated Logout Handler Component
const LogoutRoute = () => {
  const { logout } = useAuth();
  React.useEffect(() => {
    logout();
  }, [logout]);
  return <Navigate to="/" replace />;
};

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <PageLayout>{children}</PageLayout>;
};

// Admin Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/login" replace />;
  return <PageLayout>{children}</PageLayout>;
};

const RootRedirect = () => {
  return <ClientPortal />;
};

const AppRoutes = () => {
  const { socket } = useSocket();

  React.useEffect(() => {
    if (!socket) return;
    
    const handleNewTicket = (newTicket: any) => {
      // Global toast notification for admins when a new ticket arrives
      toast.success(`New Ticket Raised: ${newTicket.ticketId} - ${newTicket.subject}`, {
        duration: 5000,
        icon: '🚨',
      });
    };

    socket.on('ticket_created', handleNewTicket);

    // Global listener for PWA Offline Sync
    const syncOfflineTickets = async () => {
      try {
        const offlineTickets = await db.offlineTickets.toArray();
        if (offlineTickets.length > 0) {
          toast.loading(`Syncing ${offlineTickets.length} offline ticket(s)...`, { id: 'sync' });
          let successCount = 0;
          for (const ticket of offlineTickets) {
            try {
              await api.post('/tickets', ticket.payload);
              await db.offlineTickets.delete(ticket.id as number);
              successCount++;
            } catch (err) {
              console.error('Failed to sync ticket:', err);
            }
          }
          if (successCount > 0) {
            toast.success(`Successfully synced ${successCount} ticket(s) to the cloud!`, { id: 'sync' });
          } else {
            toast.dismiss('sync');
          }
        }
      } catch (err) {
        console.error('Error during offline sync:', err);
      }
    };

    window.addEventListener('online', syncOfflineTickets);

    return () => {
      socket.off('ticket_created', handleNewTicket);
      window.removeEventListener('online', syncOfflineTickets);
    };
  }, [socket]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route path="/resolve/:id" element={<MagicResolve />} />
      
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin-portal" element={<AdminRoute><AdminPortal /></AdminRoute>} />
      {/* Admin only routes */}
      <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/tickets" element={<AdminRoute><Tickets /></AdminRoute>} />
      <Route path="/tickets/:id" element={<AdminRoute><TicketDetail /></AdminRoute>} />
      <Route path="/alerts" element={<AdminRoute><Alerts /></AdminRoute>} />
      <Route path="/leaderboard" element={<AdminRoute><Leaderboard /></AdminRoute>} />
      <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />

      <Route path="/" element={<RootRedirect />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <AppRoutes />
          </BrowserRouter>
        </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
