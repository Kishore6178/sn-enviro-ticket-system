import React, { useState, useRef, useEffect } from 'react';
import { Camera, Send, Hexagon, X, MapPin, AlertCircle, FileText, Factory, CheckCircle, LogIn, Sun, Moon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';
import { db } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function App() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    stationId: '',
    manualStationName: '',
    locationDetails: '',
    subject: '',
    telemetryIssueType: '',
    description: '',
    contactEmail: '',
    remoteSoftware: 'None',
    remoteId: '',
    remotePassword: '',
  });
  const [location] = useState<{ lat: number, lng: number } | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const syncOfflineTickets = async () => {
    try {
      const offlineRecords = await db.offlineTickets.toArray();
      if (offlineRecords.length === 0) return;

      toast.loading(`Syncing ${offlineRecords.length} offline records...`, { id: 'sync-toast' });
      
      for (const record of offlineRecords) {
        try {
          await api.post('/tickets', record.payload);
          await db.offlineTickets.delete(record.id as number);
        } catch (err) {
          console.error('Failed to sync offline record:', err);
        }
      }
      
      toast.success('Offline records synced successfully', { id: 'sync-toast' });
    } catch (error) {
      console.error('Error during offline sync:', error);
      toast.error('Failed to sync offline records', { id: 'sync-toast' });
    }
  };

  useEffect(() => {
    // Network connectivity listeners
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineTickets();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      syncOfflineTickets();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress the image (70% quality JPEG)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(compressedDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let s3ImageUrl = null;
      if (image && imagePreview) {
        s3ImageUrl = imagePreview; // Use the captured base64 image
      }

      const payload = {
        ...formData,
        s3ImageUrl,
        stationId: 'STN-999', // Tell backend to process as manual entry
        fieldEngineerLocation: location ? {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        } : undefined
      };

      if (!isOnline) {
        await db.offlineTickets.add({ payload, timestamp: Date.now() });
        toast.success('Connection offline. Tracking record queued securely in client memory.', { duration: 5000 });
        setFormData({ stationId: '', manualStationName: '', locationDetails: '', subject: '', telemetryIssueType: '', description: '', contactEmail: '', remoteSoftware: 'None', remoteId: '', remotePassword: '' });
        setImage(null);
        setImagePreview(null);
        return;
      }

      const res = await api.post('/tickets', payload);
      if (res.data.success) {
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-br from-background via-white to-secondary/30 relative font-sans overflow-x-hidden">
        
        {/* Header */}
        <header className="w-full bg-card/50 backdrop-blur-md border-b border-border py-4 px-6 flex justify-between items-center sticky top-0 z-50">
          <div className="w-10 invisible hidden sm:block"></div> {/* Spacer for centering on desktop */}
          <div className="flex items-center space-x-3 mx-auto sm:mx-0">
             <div className="relative">
                <img src="/logo.jpeg" alt="Logo" className="h-10 w-10 object-cover rounded-full border border-white/50 shadow-sm" />
             </div>
             <h1 className="text-xl font-bold text-foreground tracking-tight">SN enviro <span className="text-primary">Support</span></h1>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full bg-card hover:bg-secondary border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Background decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>

        <div className="max-w-md mx-auto w-full pb-24 pt-8 md:pt-12 px-4 relative z-10">

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">SN Enviro Ticket Raising System</h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed max-w-[280px] mx-auto font-medium">
              Report issues quickly to our team. Make sure all details are correct so we can fix it fast.
            </p>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 rounded-[2rem] p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-5">
                <div className="relative group">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-primary">Plant / Station Name</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors">
                      <Factory className="w-5 h-5" />
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="e.g. North Sector Plant"
                      className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-gray-400 font-medium text-[15px]"
                      value={formData.manualStationName}
                      onChange={(e) => setFormData({ ...formData, manualStationName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-primary">Your Email (For Updates)</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <input
                      required
                      type="email"
                      placeholder="e.g. engineer@snenviro.com"
                      className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-gray-400 font-medium text-[15px]"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-primary">Specific Location</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Boiler Room 4"
                      className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-gray-400 font-medium text-[15px]"
                      value={formData.locationDetails}
                      onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-primary">Issue Category</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <select
                      required
                      className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-2xl pl-12 pr-10 py-3.5 text-foreground focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium text-[15px] appearance-none cursor-pointer"
                      value={formData.telemetryIssueType}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        const requiresSubjectSelect = ['CAAQMS', 'CEMS', 'EQMS'].includes(newCategory);
                        setFormData({ 
                          ...formData, 
                          telemetryIssueType: newCategory, 
                          subject: requiresSubjectSelect ? 'Service Issue' : '' 
                        });
                      }}
                    >
                      <option value="" disabled>Select Category</option>
                      <option value="CAAQMS">CAAQMS</option>
                      <option value="CEMS">CEMS</option>
                      <option value="EQMS">EQMS</option>
                      <option value="DATA UPLOADING ISSUE">DATA UPLOADING ISSUE</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-primary">Subject</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
                      <FileText className="w-5 h-5" />
                    </div>
                    {['CAAQMS', 'CEMS', 'EQMS'].includes(formData.telemetryIssueType) ? (
                      <>
                        <select
                          required
                          className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-2xl pl-12 pr-10 py-3.5 text-foreground focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium text-[15px] appearance-none cursor-pointer"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        >
                          <option value="Service Issue">Service Issue</option>
                          <option value="Software Issue">Software Issue</option>
                        </select>
                        <div className="absolute right-4 pointer-events-none text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </>
                    ) : (
                      <input
                        required
                        type="text"
                        placeholder="e.g. Data upload failed"
                        className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-gray-400 font-medium text-[15px]"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                {/* Remote Connection Details Section */}
                <div className="space-y-4 p-4 bg-secondary/50 rounded-2xl border border-border/80">
                  <div className="relative group">
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-primary">Remote Connection Tool</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="18" height="12" x="3" y="4" rx="2" ry="2"/><line x1="2" x2="22" y1="20" y2="20"/><line x1="5" x2="19" y1="20" y2="20"/><line x1="12" x2="12" y1="16" y2="20"/></svg>
                      </div>
                      <select
                        className="w-full bg-card hover:bg-secondary border border-border rounded-xl pl-12 pr-10 py-3 text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium text-[14px] appearance-none cursor-pointer"
                        value={formData.remoteSoftware}
                        onChange={(e) => setFormData({ ...formData, remoteSoftware: e.target.value, remoteId: '', remotePassword: '' })}
                      >
                        <option value="None">None / Not Applicable</option>
                        <option value="AnyDesk">AnyDesk</option>
                        <option value="TeamViewer">TeamViewer</option>
                        <option value="UltraViewer">UltraViewer</option>
                      </select>
                      <div className="absolute right-4 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {formData.remoteSoftware !== 'None' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-2 gap-3 overflow-hidden"
                      >
                        <div className="group">
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 ml-1">Remote ID / Username</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. 123 456 789"
                            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-foreground text-[14px] focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-semibold font-mono"
                            value={formData.remoteId}
                            onChange={(e) => setFormData({ ...formData, remoteId: e.target.value })}
                          />
                        </div>
                        <div className="group">
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 ml-1">Password</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. 9876"
                            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-foreground text-[14px] focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-semibold font-mono"
                            value={formData.remotePassword}
                            onChange={(e) => setFormData({ ...formData, remotePassword: e.target.value })}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-primary">Brief Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide brief description of the issue..."
                    className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-2xl p-4 text-foreground focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/50 resize-none transition-all outline-none placeholder:text-gray-400 font-medium text-[15px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Camera Capture */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">Evidence Capture</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageCapture}
                  />
                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm group">
                      <img src={imagePreview} alt="Fault preview" className="w-full h-56 object-cover cursor-pointer hover:scale-105 transition-transform duration-500" onClick={() => fileInputRef.current?.click()} />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Camera className="text-white h-10 w-10 drop-shadow-lg" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md hover:bg-red-500 text-white rounded-full transition-colors z-10 shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-primary/30 bg-primary/[0.03] rounded-2xl p-8 flex flex-col items-center justify-center text-primary/70 hover:text-primary hover:border-primary/60 hover:bg-primary/[0.08] transition-all outline-none group"
                    >
                      <div className="bg-card p-3.5 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-[15px] font-bold tracking-wide">Tap to Snap Evidence</span>
                      <span className="text-xs text-muted-foreground mt-1 font-medium">Include clear photo of fault</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgb(0,0,0,0.12)] flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed outline-none"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Hexagon className="h-5 w-5 text-white/80" />
                      </motion.div>
                      <span>Transmitting...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-[16px]">SUBMIT TICKET</span>
                      <Send className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          <div className="mt-8 text-center pb-8">
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Powered by SN ENVIRO</p>
          </div>

          <div className="flex justify-center mb-8">
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-6 py-2.5 bg-card border border-border hover:bg-secondary text-muted-foreground rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm transition-all hover:shadow hover:text-foreground"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-border"
              >
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground mb-2">Ticket Sent Successfully!</h3>
                <p className="text-muted-foreground font-medium text-sm mb-8 leading-relaxed">
                  We will resolve the issue as soon as possible. Our engineering team has been notified.
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setFormData({ stationId: '', manualStationName: '', locationDetails: '', subject: '', telemetryIssueType: '', description: '', contactEmail: '', remoteSoftware: 'None', remoteId: '', remotePassword: '' });
                    setImage(null);
                    setImagePreview(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all"
                >
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

