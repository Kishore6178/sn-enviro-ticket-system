import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { differenceInHours, format } from 'date-fns';
import { Search, Filter, Layers, Calendar, Clock as ClockIcon, User as UserIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      if (response.data.success) {
        setTickets(response.data.data);
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
    
    socket.on('ticket:onNewTicket', (newTicket) => {
      setTickets(prev => [newTicket, ...prev]);
    });
    
    socket.on('ticket_updated', (updatedTicket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    });

    return () => {
      socket.off('ticket:onNewTicket');
      socket.off('ticket_updated');
    };
  }, [socket]);

  const getTargetBadge = (createdAt: string, status: string) => {
    if (status === 'Resolved') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Resolved</span>;
    
    const hoursElapsed = differenceInHours(new Date(), new Date(createdAt));
    const hoursRemaining = 48 - hoursElapsed;

    if (hoursRemaining < 0) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">Overdue by {Math.abs(hoursRemaining)}h</span>;
    }
    if (hoursRemaining <= 24) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">{hoursRemaining}h left</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{hoursRemaining}h left</span>;
  };

  const getStatusDot = (status: string) => {
    if (status === 'Resolved') return "bg-emerald-500";
    if (status === 'Pending') return "bg-amber-500";
    return "bg-blue-500";
  };

  const filteredTickets = tickets.filter(t => 
    t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.stationId?.stationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      toast.error('No tickets to export');
      return;
    }
    
    const headers = ['Ticket ID', 'Status', 'Created At', 'Station', 'Subject', 'Assigned To'];
    const csvContent = [
      headers.join(','),
      ...filteredTickets.map(t => {
        const station = t.stationId?.stationNumber || 'Unknown';
        const assignedTo = t.assignedTo?.name || 'Unassigned';
        // Escape commas and quotes in subject
        const subject = `"${t.subject.replace(/"/g, '""')}"`;
        return `${t.ticketId},${t.status},${new Date(t.createdAt).toISOString()},${station},${subject},${assignedTo}`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tickets_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exported Successfully');
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center">
            <Layers className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tickets</h2>
            <p className="text-muted-foreground text-sm mt-1">Manage and assign service requests</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search ID, Station, or Subject..." 
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportCSV}
          <button 
            onClick={handleExportCSV}
            className="h-[42px] px-4 bg-card border border-input rounded-lg flex items-center justify-center text-foreground hover:text-blue-600 hover:border-blue-300 hover:bg-secondary transition-all font-medium text-sm shadow-sm"
            title="Export to CSV"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button className="h-[42px] px-4 bg-card border border-input rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-blue-600 animate-pulse font-medium">Loading Tickets...</div>
        ) : (
          <div className="w-full">
            {/* Desktop Table Header - Hidden on Mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Ticket ID & Time</div>
              <div className="col-span-3">Station Target</div>
              <div className="col-span-2">Subject</div>
              <div className="col-span-2">Assigned To</div>
              <div className="col-span-1 text-right">Target</div>
            </div>

            <div className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {filteredTickets.map((ticket) => (
                  <motion.div 
                    key={ticket._id} 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="group cursor-pointer hover:bg-secondary transition-colors p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center relative"
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                  >
                    {/* Mobile: Top Row with Status & Target */}
                    <div className="flex justify-between items-start md:hidden mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(ticket.status)} ring-4 ring-card shadow-sm`} />
                        <span className="font-semibold text-foreground text-sm">{ticket.status}</span>
                      </div>
                      <div>{getTargetBadge(ticket.createdAt, ticket.status)}</div>
                    </div>

                    {/* Status Column (Desktop) */}
                    <div className="hidden md:flex items-center space-x-3 col-span-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(ticket.status)} ring-4 ring-card shadow-sm`} />
                      <span className="font-semibold text-foreground text-sm">{ticket.status}</span>
                    </div>

                    {/* Ticket ID & Time Column */}
                    <div className="col-span-2 flex flex-col mb-3 md:mb-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-blue-600 font-mono tracking-tight text-lg md:text-base">{ticket.ticketId}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                        <span className="flex items-center text-muted-foreground"><ClockIcon className="w-3 h-3 mr-1" /> {format(new Date(ticket.createdAt), 'HH:mm')}</span>
                      </div>
                    </div>

                    {/* Station Target Column */}
                    <div className="col-span-3 mb-3 md:mb-0 flex flex-col">
                      <span className="font-semibold text-foreground text-sm">
                        Stn {ticket.stationId?.stationNumber || '??'}
                      </span>
                      <span className="text-muted-foreground text-xs mt-0.5 max-w-[200px] truncate">
                        {ticket.stationId?.industryName?.replace('Manual: ', '') || 'Unknown Location'}
                      </span>
                    </div>

                    {/* Subject Column */}
                    <div className="col-span-2 mb-4 md:mb-0">
                      <p className="text-sm text-foreground font-medium line-clamp-2 md:line-clamp-1 leading-snug">
                        {ticket.subject}
                      </p>
                    </div>

                    {/* Assigned To Column */}
                    <div className="col-span-2 flex items-center mb-1 md:mb-0 min-w-0 pr-2">
                      {ticket.assignedTo?.name ? (
                        <div className="flex items-center space-x-2 bg-secondary md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg min-w-0 w-full">
                          <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-700 shadow-sm shrink-0">
                            {ticket.assignedTo.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate" title={ticket.assignedTo.name}>{ticket.assignedTo.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-muted-foreground bg-secondary md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg">
                          <UserIcon className="w-4 h-4" />
                          <span className="text-xs font-semibold italic">Unassigned</span>
                        </div>
                      )}
                    </div>

                    {/* Target Column (Desktop) */}
                    <div className="hidden md:flex justify-end col-span-1">
                      {getTargetBadge(ticket.createdAt, ticket.status)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredTickets.length === 0 && (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">No tickets found</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm mx-auto">We couldn't find any tickets matching your search or filters.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
