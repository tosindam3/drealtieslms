import React from 'react';
import { Lock, Coins, CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { Week } from '../../types';

interface WeekCardProps {
  week: Week;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({ week, isActive, onClick, onEdit }) => {
  const isConfigured = week.title && week.modules.length > 0;

  return (
    <div 
      onClick={onClick}
      className={`min-w-[280px] p-6 rounded-2xl border transition-all cursor-pointer relative group ${
        isActive 
          ? 'bg-[#D4AF37]/10 border-[#D4AF37] ring-1 ring-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
          : 'bg-[#121214] border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-[#D4AF37]' : 'text-slate-500'}`}>
          Week {week.number}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-[#D4AF37] hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
        {week.title || `Untitled Week ${week.number}`}
      </h3>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
            <Lock className="w-3 h-3" /> Access
          </div>
          <span className={`text-[9px] font-black uppercase ${week.lockPolicy.lockedByDefault ? 'text-orange-500' : 'text-emerald-500'}`}>
            {week.lockPolicy.lockedByDefault ? 'Locked' : 'Unlocked'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
            <Coins className="w-3 h-3" /> Min. Points
          </div>
          <span className="text-[9px] font-black text-white">{week.lockPolicy.minCoinsToUnlockNextWeek}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
            <CheckCircle2 className="w-3 h-3" /> Status
          </div>
          <span className={`text-[9px] font-black uppercase ${isConfigured ? 'text-emerald-500' : 'text-slate-600'}`}>
            {isConfigured ? 'Ready' : 'Incomplete'}
          </span>
        </div>
      </div>

      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_10px_#D4AF37]" />
      )}
    </div>
  );
};
