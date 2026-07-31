import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, CheckCircle, Cpu, Clock, Mail, User, ArrowRight, ExternalLink, X, AlertCircle, History } from 'lucide-react';
import { engineersData } from '../lib/engineers';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, Activity } from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [closingNotes, setClosingNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await api.get('/tickets');
        if (response.data.success) {
          const found = response.data.data.find((t: any) => t._id === id);
          setTicket(found);
        }
      } catch (error) {
        console.error('Failed to fetch ticket details', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    
    const handleTicketUpdated = (updatedTicket: any) => {
      if (updatedTicket._id === id) {
        setTicket(updatedTicket);
      }
    };

    socket.on('ticket_updated', handleTicketUpdated);
    return () => {
      socket.off('ticket_updated', handleTicketUpdated);
    };
  }, [socket, id]);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const finalNotes = closingNotes.trim() === '' 
        ? "Issue has been resolved." 
        : closingNotes;
        
      const response = await api.patch(`/tickets/${id}`, { status: 'Resolved', notes: finalNotes });
      
      if (response.data.emailSent) {
        toast.success('Ticket Resolved & Email Sent!');
      } else {
        toast('Ticket Resolved (Email failed, check server logs)', { icon: '⚠️' });
      }
      
      navigate('/tickets');
    } catch (error) {
      console.error('Failed to resolve ticket', error);
      toast.error('Error resolving ticket');
    } finally {
      setIsResolving(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) {
      toast.error('Please select a technician');
      return;
    }
    
    try {
      const response = await api.patch(`/tickets/${id}`, { assignedTo: selectedUser });
      
      if (response.data.emailSent) {
        toast.success('Ticket Assigned & Email Forwarded!');
      } else {
        toast('Ticket Assigned (Email failed, check server logs)', { icon: '⚠️' });
      }
      
      setTicket((prev: any) => ({ 
        ...prev, 
        assignedTo: { 
          email: selectedUser,
          name: selectedUser.split('@')[0]
        } 
      }));
      setSelectedUser('');
    } catch (error) {
      toast.error('Error assigning ticket');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      await api.post(`/tickets/${id}/comments`, { text: newComment });
      setNewComment('');
      // Socket will update the ticket state automatically
    } catch (error) {
      toast.error('Failed to post comment');
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  const filteredEngineers = engineersData.filter(e => 
    e.name.toLowerCase().includes(selectedUser.toLowerCase()) || 
    e.email.toLowerCase().includes(selectedUser.toLowerCase())
  );

  if (loading) return <div className="p-8 text-blue-600 font-medium animate-pulse">Loading Ticket Details...</div>;
  if (!ticket) return <div className="p-8 text-red-500 font-medium">Ticket not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 px-4 sm:px-6">
      <button onClick={() => navigate('/tickets')} className="flex items-center text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tickets
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Details */}
        <div className="flex-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{ticket.subject}</h2>
              <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-full ${ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {ticket.status}
              </span>
            </div>
            <h3 className="text-xl text-muted-foreground font-mono font-semibold">#{ticket.ticketId}</h3>
            
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground font-medium">
              <span className="flex items-center bg-secondary px-3.5 py-2 rounded-lg border border-border"><Cpu className="w-4.5 h-4.5 mr-2.5 text-gray-400" /> Station {ticket.stationId?.stationNumber}</span>
              <span className="flex items-center"><MapPin className="w-4.5 h-4.5 mr-2 text-gray-400" /> {ticket.stationId?.industryName}</span>
              {ticket.telemetryIssueType && (
                <span className="flex items-center bg-blue-50/50 px-3.5 py-2 rounded-lg border border-blue-100/50 text-blue-700 font-bold">
                  <AlertCircle className="w-4.5 h-4.5 mr-2.5 text-blue-500" /> {ticket.telemetryIssueType}
                </span>
              )}
              <span className="flex items-center"><Clock className="w-4.5 h-4.5 mr-2 text-gray-400" /> Raised {new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
              <div>
                <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Issue Description</h4>
                <p className="text-foreground leading-relaxed bg-secondary p-5 rounded-xl border border-border text-[15px]">{ticket.description}</p>
              </div>

              {ticket.remoteSoftware && ticket.remoteSoftware !== 'None' && (
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-6">
                  <h4 className="text-sm font-extrabold text-emerald-800 mb-4 uppercase tracking-wider flex items-center">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2.5 animate-pulse"></span>
                    Remote Access Credentials
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-card p-4 rounded-xl border border-emerald-100/50 shadow-sm">
                      <span className="text-[11px] font-bold text-gray-400 uppercase block tracking-wider mb-1">Software Tool</span>
                      <span className="text-[15px] font-bold text-foreground">{ticket.remoteSoftware}</span>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-emerald-100/50 shadow-sm">
                      <span className="text-[11px] font-bold text-gray-400 uppercase block tracking-wider mb-1">User ID / Name</span>
                      <span className="text-[15px] font-mono font-bold text-foreground select-all">{ticket.remoteId || 'N/A'}</span>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-emerald-100/50 shadow-sm">
                      <span className="text-[11px] font-bold text-gray-400 uppercase block tracking-wider mb-1">Password</span>
                      <span className="text-[15px] font-mono font-bold text-foreground select-all">{ticket.remotePassword || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {ticket.s3ImageUrl && (
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Attached Evidence</h4>
                  {(() => {
                    const safeImageUrl = ticket.s3ImageUrl.includes('mock-s3-bucket') 
                      ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000' 
                      : ticket.s3ImageUrl;
                    return (
                      <>
                        <div onClick={() => setIsImageModalOpen(true)} className="block cursor-pointer hover:opacity-90 transition-opacity group">
                          <img src={safeImageUrl} alt="Evidence" className="max-w-full max-h-[400px] object-contain bg-secondary rounded-xl border border-border shadow-sm" />
                          <p className="text-xs text-blue-600 mt-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Click to view full resolution
                          </p>
                        </div>
                        
                        {isImageModalOpen && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setIsImageModalOpen(false)}>
                            <button 
                              onClick={() => setIsImageModalOpen(false)}
                              className="absolute top-6 right-6 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full transition-colors z-50"
                            >
                              <X className="w-8 h-8" />
                            </button>
                            <img src={safeImageUrl} alt="Evidence Full" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* NEW: Live Chat / Internal Notes Section */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b border-border bg-secondary flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground tracking-tight">Internal Discussion</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/50">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment: any, idx: number) => {
                  const isMe = user?.name === comment.authorName;
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-card border border-border text-foreground shadow-sm rounded-tl-none'}`}>
                        <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {comment.authorName} • {comment.authorRole}
                        </div>
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium mt-1 mx-1">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <MessageSquare className="w-10 h-10 opacity-20" />
                  <p className="font-medium">No comments yet. Start the discussion!</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handlePostComment} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a message or internal note..."
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-[14px] text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  disabled={isPosting}
                />
                <button
                  type="submit"
                  disabled={isPosting || !newComment.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Actions (Now only contains Assign Technician) */}
        <div className="w-full lg:w-[400px] space-y-6">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center space-x-3 border-b border-border pb-5 mb-8">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">Automation</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-blue-100 shadow-sm overflow-visible">
                <div className="bg-blue-50/40 p-5 border-b border-blue-100 flex items-center space-x-4">
                  <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700 shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-foreground">Assign Technician</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Automated HTML email dispatch</p>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Changed to flex-col to give maximum width to the input */}
                  <div className="flex flex-col space-y-4">
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="text"
                        className="w-full bg-secondary border border-border rounded-xl text-[15px] text-foreground pl-11 pr-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                        placeholder="Search name or email..."
                        value={selectedUser}
                        onChange={(e) => {
                          setSelectedUser(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      />
                      
                      {/* Autocomplete Dropdown: onMouseDown fixes the click bug */}
                      {showDropdown && selectedUser && filteredEngineers.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden left-0 top-full">
                          {filteredEngineers.map((engineer, idx) => (
                            <div 
                              key={idx}
                              className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex items-center"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevents input blur
                                setSelectedUser(engineer.email);
                                setShowDropdown(false);
                              }}
                            >
                              <Mail className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                              <span className="text-[15px] text-foreground font-semibold truncate">{engineer.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleAssign} 
                      disabled={!selectedUser || !selectedUser.includes('@')}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center whitespace-nowrap"
                    >
                      Forward Email
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </div>
                  
                  {ticket.assignedTo && (
                    <div className="mt-5 flex items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm min-w-0">
                      <CheckCircle className="w-5 h-5 text-emerald-600 mr-3 shrink-0" />
                      <p className="text-[13px] text-emerald-900 leading-tight min-w-0 flex-1">
                        Currently assigned to <br/>
                        <span className="font-extrabold text-[14px] mt-0.5 block truncate" title={ticket.assignedTo.email || ticket.assignedTo.name}>{ticket.assignedTo.email || ticket.assignedTo.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* NEW: Activity Timeline / Audit Trail */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center space-x-3 border-b border-border pb-5 mb-8">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                <History className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">Audit Trail</h3>
            </div>
            
            <div className="relative border-l-2 border-border ml-3 space-y-8 pb-4">
              {ticket.activityLog && ticket.activityLog.length > 0 ? (
                ticket.activityLog.slice().reverse().map((log: any, idx: number) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-card border-4 border-blue-500"></div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <h4 className="text-[14px] font-semibold text-foreground leading-snug">{log.details}</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">by <span className="text-primary">{log.performedBy}</span></p>
                  </div>
                ))
              ) : (
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-card border-4 border-gray-300"></div>
                  <p className="text-sm text-muted-foreground italic">No activity logged yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Simple Resolution Action at the bottom */}
      <div className={`rounded-2xl border p-6 sm:p-8 shadow-sm mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 ${ticket.status === 'Pending Review' ? 'bg-red-50 border-red-200' : 'bg-card border-border'}`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl shadow-sm shrink-0 ${ticket.status === 'Pending Review' ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {ticket.status === 'Pending Review' ? <AlertCircle className="h-7 w-7" /> : <CheckCircle className="h-7 w-7" />}
          </div>
          <div>
            <h3 className={`text-xl font-extrabold tracking-tight ${ticket.status === 'Pending Review' ? 'text-red-900' : 'text-foreground'}`}>
              {ticket.status === 'Pending Review' ? 'Approve & Resolve Ticket' : 'Close & Resolve'}
            </h3>
            <p className={`text-sm mt-1 font-medium ${ticket.status === 'Pending Review' ? 'text-red-700' : 'text-muted-foreground'}`}>
              {ticket.status === 'Pending Review' 
                ? 'The engineer marked this as fixed. Review their notes and click approve to finalize and notify the client.' 
                : 'This will resolve the ticket and automatically notify stakeholders.'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleResolve}
          disabled={isResolving || ticket.status === 'Resolved'}
          className={`w-full sm:w-auto px-8 py-3.5 text-white rounded-xl text-[15px] font-bold tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 ${ticket.status === 'Pending Review' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          {isResolving ? 'Resolving...' : (ticket.status === 'Pending Review' ? 'Approve & Resolve' : 'Resolve & Trigger Email')}
        </button>
      </div>
    </div>
  );
};
