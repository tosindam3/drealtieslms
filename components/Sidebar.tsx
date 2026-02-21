
import React from 'react';
import { 
  Layers, 
  Users, 
  FileText, 
  Video, 
  Settings, 
  Hexagon,
  LayoutDashboard,
  ClipboardCheck,
  Home
} from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  onItemClick: (label: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard' },
    { icon: Layers, label: 'Course Builder' },
    { icon: Users, label: 'Manage Cohorts' },
    { icon: FileText, label: 'Assignments' },
    { icon: Video, label: 'Live Sessions' },
    { icon: ClipboardCheck, label: 'Publish & Valid...' },
    { icon: LayoutDashboard, label: 'Cohort Dashboard' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-[#1e293b] text-white flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="bg-blue-500 p-2 rounded-lg">
          <Hexagon className="w-6 h-6 fill-white" />
        </div>
        <span className="text-xl font-bold tracking-tight uppercase">DrealtiesFX</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onItemClick(item.label)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
              activeItem === item.label || (activeItem === 'Publish & Validation' && item.label === 'Publish & Valid...')
                ? 'bg-blue-600/10 text-blue-400' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};
