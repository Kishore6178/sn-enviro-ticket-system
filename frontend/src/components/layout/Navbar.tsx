import { Menu, UserCircle, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    navigate('/logout', { replace: true });
  };

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-8 w-full sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="flex items-center md:hidden min-w-0 flex-1">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="mr-1 shrink-0">
          <Menu className="h-6 w-6 text-foreground" />
        </Button>
        <a href="/dashboard" className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity truncate">
          <h1 className="text-base sm:text-lg font-extrabold text-foreground leading-tight truncate tracking-tight">SN Enviro</h1>
          <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 truncate uppercase tracking-widest">Ticket System</span>
        </a>
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        <div className="hidden md:flex items-center mr-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2 hidden lg:inline-block">SN Enviro Live</span>
          <span className="text-[13px] font-mono font-bold text-blue-600 dark:text-blue-400">
            {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium text-foreground">{user?.name || 'Admin User'}</span>
            <span className="text-xs text-primary capitalize">{user?.role || 'Admin'}</span>
          </div>
          <UserCircle className="h-8 w-8 text-muted-foreground" />
          <div className="h-6 w-px bg-border mx-2" />
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
