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
import ClientPortal from './pages/ClientPortal';

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

    return () => {
      socket.off('ticket_created', handleNewTicket);
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
