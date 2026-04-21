import React from 'react';
import { LayoutDashboard, Upload, FileText, Settings, LogOut, User } from 'lucide-react';
import { AppSection } from '../types';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const user = auth.currentUser;
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'upload', icon: Upload, label: 'Invoice Upload' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ] as const;

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      signOut(auth);
    }
  };

  return (
    <div className="w-64 bg-brand text-white flex flex-col h-full border-r border-blue-700">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6" /> IPT v2.1
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group font-medium",
                isActive 
                  ? "bg-blue-900 text-white shadow-sm" 
                  : "hover:bg-blue-700 text-blue-100"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-blue-200 group-hover:text-white")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-blue-700">
        <div className="flex items-center gap-3 px-2 py-3 bg-blue-900/50 rounded-xl mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold border border-blue-700">
            {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('') : <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate leading-none">{user?.displayName || 'User'}</p>
            <p className="text-[9px] text-blue-300 truncate mt-1 uppercase tracking-tighter opacity-70">
              {user?.email || 'Authenticated'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-blue-200 hover:text-white hover:bg-red-500/10 transition-all border border-blue-700/50 hover:border-red-500/30"
        >
          <LogOut className="w-4 h-4" />
          <span>SIGN OUT</span>
        </button>
      </div>

      <div className="px-6 py-4 text-[8px] text-blue-400 font-mono opacity-40 uppercase tracking-widest">
        SECURE CLOUD STORAGE ACTIVE
      </div>
    </div>
  );
};

export default Sidebar;
