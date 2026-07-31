import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        login(response.data.data);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-[1000px] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Colorful Branding */}
        <div className="hidden md:flex md:w-1/2 bg-blue-600 p-8 md:p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 opacity-90 z-0"></div>
          
          {/* Decorative circles */}
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full bg-blue-400 opacity-20 blur-3xl z-0"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full bg-indigo-400 opacity-20 blur-3xl z-0"></div>

          <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-6 md:mb-12">
              <div className="p-2 bg-card/10 rounded-xl backdrop-blur-sm">
                <img src="/logo.jpeg" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain drop-shadow-md rounded-full" />
              </div>
              <span className="text-xl md:text-2xl font-bold tracking-wider">SN ENVIRO</span>
            </div>
            
            <h1 className="text-2xl md:text-5xl font-extrabold mb-2 md:mb-6 leading-tight">
              Ticket <br className="hidden md:block"/> System
            </h1>
            <p className="text-blue-100 text-sm md:text-lg max-w-sm mx-auto md:mx-0 leading-relaxed hidden md:block">
              Log in to manage telemetry systems, track field requests, and monitor network health across all stations.
            </p>
          </div>

          <div className="relative z-10 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-blue-400/30 hidden md:block">
            <p className="text-sm text-blue-200">
              © 2026 SN Enviro Systems. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex items-center bg-card">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in to your admin account.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground tracking-wide" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    placeholder="support@snenviro.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-medium placeholder:text-gray-400 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground tracking-wide" htmlFor="password">Password</label>
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-medium placeholder:text-gray-400 placeholder:font-normal"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-200 transition-all disabled:opacity-70 flex items-center justify-center group"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
                {!isLoading && <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
