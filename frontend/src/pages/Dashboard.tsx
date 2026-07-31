import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const navigate = useNavigate();

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
    
    socket.on('ticket_created', (newTicket) => {
      setTickets(prev => [newTicket, ...prev]);
    });
    
    socket.on('ticket_updated', (updatedTicket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    });

    return () => {
      socket.off('ticket_created');
      socket.off('ticket_updated');
    };
  }, [socket]);

  const pendingCount = tickets.filter(t => t.status === 'Pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'In-Progress').length;
  const pendingReviewCount = tickets.filter(t => t.status === 'Pending Review').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const criticalCount = tickets.filter(t => t.status !== 'Resolved').length;

  const getTargetHours = (ticket: any) => {
    const created = new Date(ticket.createdAt).getTime();
    const now = new Date().getTime();
    const hoursElapsed = (now - created) / (1000 * 60 * 60);
    const targetHours = 48; // 48 hours target
    return Math.max(0, Math.floor(targetHours - hoursElapsed));
  };

  const barData = [
    { name: 'Pending', count: pendingCount, fill: '#fbbf24' },
    { name: 'In-Progress', count: inProgressCount, fill: '#22d3ee' },
    { name: 'Reviewing', count: pendingReviewCount, fill: '#f87171' },
    { name: 'Resolved', count: resolvedCount, fill: '#34d399' }
  ];

  const issueCounts = tickets.reduce((acc, t) => {
    const type = t.telemetryIssueType || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'];
  const pieData = Object.keys(issueCounts).map((key, index) => ({
    name: key,
    value: issueCounts[key],
    color: PIE_COLORS[index % PIE_COLORS.length]
  })).sort((a, b) => b.value - a.value);

  if (loading) return <div className="p-8 text-cyan-400 animate-pulse font-medium">Initializing SN Enviro Dashboard...</div>;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Activity className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">SN Enviro Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1 italic">"Efficiency is doing things right; effectiveness is doing the right things."</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Active Tickets', value: pendingCount + inProgressCount, icon: Ticket, color: 'text-cyan-400', bg: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', hover: 'hover:border-cyan-500/50' },
          { title: 'Pending Tickets', value: pendingCount, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/20', hover: 'hover:border-amber-500/50' },
          { title: 'Critical Tickets', value: criticalCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', borderColor: 'border-red-500/20', hover: 'hover:border-red-500/50' },
          { title: 'Resolved (30D)', value: resolvedCount, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', hover: 'hover:border-emerald-500/50' }
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => navigate('/tickets')}
            className={`bg-card/80 backdrop-blur-sm rounded-xl p-6 border ${stat.borderColor} shadow-sm transition-all duration-300 cursor-pointer ${stat.hover}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{stat.title}</h3>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-baseline space-x-3">
              <span className={`text-4xl font-bold text-foreground`}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-7 pt-4">
        {/* Live Ticket Feed */}
        <div className="xl:col-span-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border p-6 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <h3 className="text-lg font-semibold text-foreground mb-4">Live Ticket Feed</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {tickets.slice(0, 20).map((ticket) => {
                const target = getTargetHours(ticket);
                const isCritical = target < 12 && ticket.status !== 'Resolved';
                return (
                  <motion.div
                    key={ticket._id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className="bg-background/50 border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-cyan-600 font-mono text-sm whitespace-nowrap">{ticket.ticketId}</span>
                        <span className="text-gray-400 text-xs hidden sm:inline">•</span>
                        <span className="text-foreground font-medium truncate">{ticket.subject}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{ticket.stationId?.stationNumber || 'Unknown Station'} - {ticket.telemetryIssueType || 'General Issue'}</p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end shrink-0 bg-secondary/50 sm:bg-transparent p-2 sm:p-0 rounded-md">
                      {ticket.status !== 'Resolved' ? (
                        <div className={`flex items-center space-x-1 ${isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-bold font-mono">{target}h Target</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-emerald-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-bold">Resolved</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {tickets.length === 0 && (
              <div className="text-center text-muted-foreground mt-10">No recent events.</div>
            )}
          </div>
        </div>
        
        <div className="xl:col-span-3 bg-card/80 backdrop-blur-sm rounded-xl border border-border p-6 shadow-sm flex flex-col h-[500px]">
          <h3 className="text-lg font-semibold text-foreground mb-4">Ticket Status Overview</h3>
          {tickets.length > 0 ? (
            <div style={{ width: '100%', height: 350, minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }} 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center">
              <Activity className="h-16 w-16 text-cyan-400/20 mb-4 animate-pulse" />
              <p className="text-muted-foreground font-mono text-sm">System Nominal - No Data</p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Analytics Row */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-7 pt-2">
        <div className="xl:col-span-3 bg-card/80 backdrop-blur-sm rounded-xl border border-border p-6 shadow-sm flex flex-col h-[400px]">
          <h3 className="text-lg font-semibold text-foreground mb-1">Issue Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Breakdown of tickets by telemetry issue type</p>
          {tickets.length > 0 && pieData.length > 0 ? (
            <div style={{ width: '100%', height: 300, minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#111827' }}
                    itemStyle={{ color: '#111827', fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center">
              <Activity className="h-12 w-12 text-cyan-400/20 mb-4 animate-pulse" />
              <p className="text-muted-foreground font-mono text-sm">No Categorized Data</p>
            </div>
          )}
        </div>
        
        <div className="xl:col-span-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border p-6 shadow-sm flex flex-col h-[400px]">
          <h3 className="text-lg font-semibold text-foreground mb-1">Resolution Efficiency</h3>
          <p className="text-xs text-muted-foreground mb-4">Target compliance metrics</p>
          
          <div className="flex-1 flex items-center justify-center">
             <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                   <h4 className="text-4xl font-extrabold text-emerald-500 mb-2">{resolvedCount > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0}%</h4>
                   <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Total Resolution Rate</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
                   <h4 className="text-4xl font-extrabold text-blue-500 mb-2">{tickets.filter(t => t.status !== 'Resolved' && getTargetHours(t) > 0).length}</h4>
                   <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Tickets Within Target</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
