import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Users, Settings, X, Bell, Contact, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onClose }) => {
  const { user } = useAuth();
  const [hoveredPath, setHoveredPath] = React.useState<string | null>(null);
  
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', showTo: ['admin'] },
    { label: 'Tickets', icon: Ticket, path: '/tickets', showTo: ['admin'] },
    { label: 'Alerts', icon: Bell, path: '/alerts', showTo: ['admin'] },
    { label: 'Leaderboard', icon: Trophy, path: '/leaderboard', showTo: ['admin'] },
    { label: 'Engineers & Technicians', icon: Users, path: '/users', showTo: ['admin'] },
    { label: 'Admin Portal', icon: Settings, path: '/admin-portal', showTo: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.showTo.includes(user.role));

  return (
    <aside className={cn("flex flex-col w-64 bg-card/80 backdrop-blur-xl border-r border-border h-screen fixed top-0 left-0 z-50", className)}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <a href="/dashboard" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
          <img src="/logo.jpeg" alt="Logo" className="h-8 w-8 object-contain mr-2 drop-shadow-sm rounded-full" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">SN Enviro <br/><span className="text-sm font-semibold text-blue-600">Ticket System</span></h1>
        </a>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            onMouseEnter={() => setHoveredPath(item.path)}
            onMouseLeave={() => setHoveredPath(null)}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors z-10",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => {
              const isHovered = hoveredPath === item.path;
              return (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full z-20"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <motion.div 
                      layoutId="activeBackground"
                      className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {isHovered && !isActive && (
                    <motion.div 
                      layoutId="hoverBackground"
                      className="absolute inset-0 bg-secondary/80 rounded-lg -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <item.icon className={cn("h-5 w-5 z-20 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                  <span className="z-20">{item.label}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
