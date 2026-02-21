
import React from 'react';
import { Bell, UserCircle } from 'lucide-react';

interface NavbarProps {
  onTabClick: (tab: string) => void;
  activeMainTab: string;
  onSwitchRole?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onTabClick, activeMainTab, onSwitchRole }) => {
  const tabs = ['Dashboard', 'Courses', 'Cohorts', 'Library', 'Reports'];

  return (
    <header className="h-16 bg-[#1e293b] text-slate-300 px-8 flex items-center justify-between shrink-0 border-b border-slate-800">
      <nav className="flex items-center gap-8 h-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabClick(tab)}
            className={`h-full px-2 text-sm font-medium transition-colors border-b-2 flex items-center ${
              activeMainTab === tab 
                ? 'text-white border-blue-500' 
                : 'border-transparent hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-6">
        <button 
          onClick={onSwitchRole}
          className="flex items-center gap-2 px-4 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-full text-xs font-bold text-white transition-all active:scale-95"
        >
          <UserCircle className="w-4 h-4" />
          Switch to Student
        </button>
        <button className="text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 cursor-pointer group">
          <img
            src="https://picsum.photos/seed/user/100/100"
            alt="User"
            className="w-8 h-8 rounded-full ring-2 ring-slate-700 group-hover:ring-slate-500 transition-all"
          />
          <span className="text-sm font-medium text-white">Alex Johnson</span>
        </div>
      </div>
    </header>
  );
};
