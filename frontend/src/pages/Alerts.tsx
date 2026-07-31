import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import { Bell, CheckCircle2, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const Alerts: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      if (response.data.success) {
        // Filter pending review tickets and tickets that were resolved by an engineer (have notes)
        const alerts = response.data.data.filter((t: any) => 
          t.status === 'Pending Review' || (t.status === 'Resolved' && t.notes)
        );
        // Sort pending review first, then by updated date
        alerts.sort((a: any, b: any) => {
          if (a.status === 'Pending Review' && b.status !== 'Pending Review') return -1;
          if (a.status !== 'Pending Review' && b.status === 'Pending Review') return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setTickets(alerts);
      }
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('ticket_updated', (updatedTicket) => {
      if (updatedTicket.status === 'Pending Review' || (updatedTicket.status === 'Resolved' && updatedTicket.notes)) {
        setTickets(prev => {
          const exists = prev.find(t => t._id === updatedTicket._id);
          let newTickets = exists 
            ? prev.map(t => t._id === updatedTicket._id ? updatedTicket : t)
            : [updatedTicket, ...prev];
            
          // Sort again to keep pending review at the top
          return newTickets.sort((a: any, b: any) => {
            if (a.status === 'Pending Review' && b.status !== 'Pending Review') return -1;
            if (a.status !== 'Pending Review' && b.status === 'Pending Review') return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
        });
        
        if (updatedTicket.status === 'Pending Review') {
          toast.success(`New Alert: Engineer resolved ticket ${updatedTicket.ticketId}`);
        }
      } else {
        // Remove if it's no longer an alert (e.g. status changed to something else and not resolved with notes)
        setTickets(prev => prev.filter(t => t._id !== updatedTicket._id));
      }
    });

    return () => {
      socket.off('ticket_updated');
    };
  }, [socket]);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      <div className="flex items-center space-x-4 border-b border-border pb-4">
        <div className="p-3 bg-red-100 rounded-xl flex items-center justify-center">
          <Bell className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Admin Alerts</h2>
          <p className="text-muted-foreground mt-1">Review tickets marked as fixed by engineers before resolving them.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">There are no pending tickets awaiting your review.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => {
            const isPending = ticket.status === 'Pending Review';
            return (
            <div key={ticket._id} className={`bg-card rounded-xl border ${isPending ? 'border-red-200' : 'border-emerald-200'} shadow-sm hover:shadow-md transition-shadow p-6 relative overflow-hidden group`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${isPending ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${isPending ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                      {isPending ? 'Needs Review' : 'Resolved'}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      {ticket.ticketId}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-1">{ticket.subject}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{ticket.description}</p>
                  
                  {ticket.notes && (
                    <div className="bg-secondary rounded-lg p-4 border border-border mb-4">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        Engineer Notes
                      </div>
                      <p className="text-foreground text-sm whitespace-pre-wrap font-medium">{ticket.notes}</p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground flex items-center">
                    Assigned to: <span className="font-bold text-foreground ml-1">{ticket.assignedTo?.name || 'Unknown'}</span>
                    <span className="mx-2">•</span>
                    Completed: {format(new Date(ticket.updatedAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-3">
                  <button
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className={`flex items-center justify-center px-6 py-2.5 text-white rounded-lg transition-colors font-medium shadow-sm ${isPending ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  >
                    {isPending ? 'Review Ticket' : 'View Ticket'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};
