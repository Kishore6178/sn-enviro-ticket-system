import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const payload: any = {};
      if (name !== user?.name) payload.name = name;
      if (password) payload.password = password;
      
      if (Object.keys(payload).length === 0) {
        toast('No changes to update', { icon: 'ℹ️' });
        setIsLoading(false);
        return;
      }

      await api.patch('/auth/profile', payload);
      toast.success('Profile updated successfully!');
      setPassword('');
      
      // Update global context so UI changes instantly
      if (user) {
        login({ ...user, name: payload.name || user.name });
      }
      
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[800px] mx-auto pb-12">
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Account</h2>
          <p className="text-gray-500 text-sm mt-1">Update your admin credentials</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Admin Profile Settings</h3>
          <p className="text-sm text-gray-500">Update your account details here.</p>
        </div>
        
        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
              value={user?.email || ''}
              disabled
            />
            <p className="text-xs text-gray-500">Email cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Appearance Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Appearance</h3>
          <p className="text-sm text-gray-500">Customize how the dashboard looks.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {theme === 'dark' ? <Moon className="h-5 w-5 text-gray-700" /> : <Sun className="h-5 w-5 text-gray-700" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Toggle dark mode on or off</p>
              </div>
            </div>
            
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
