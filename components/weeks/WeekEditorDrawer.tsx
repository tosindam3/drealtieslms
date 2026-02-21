import React, { useState } from 'react';
import { X, Save, Lock, Coins, Percent, Calendar, Shield, Unlock, Layers, Settings } from 'lucide-react';
import { Week } from '../../types';

interface WeekEditorDrawerProps {
  week: Week;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWeek: Week) => void;
}

export const WeekEditorDrawer: React.FC<WeekEditorDrawerProps> = ({ week, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Week>(week);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0a0a0b] h-full border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                <Settings className="w-5 h-5 text-[#D4AF37]" />
             </div>
             <div>
                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Week {week.number} Settings</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Course Management</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Access Control */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" /> Enrollment Access
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
               <div className="space-y-1">
                 <p className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    Free Introductory Week <Unlock className="w-3 h-3 text-emerald-500" />
                 </p>
                 <p className="text-[9px] text-slate-500 uppercase">Visible to all registered students</p>
               </div>
               <button 
                 onClick={() => setFormData({ ...formData, isFree: !formData.isFree })}
                 className={`w-10 h-5 rounded-full relative transition-colors ${formData.isFree ? 'bg-emerald-500' : 'bg-slate-700'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isFree ? 'right-1' : 'left-1'}`} />
               </button>
            </div>
          </section>

          {/* Identity Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Week Information
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Week Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Technical Analysis Foundations"
                className="w-full bg-[#121214] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 outline-none transition-all shadow-inner"
              />
            </div>
          </section>

          {/* Locking Policy */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" /> Drip Content Settings
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
               <div className="space-y-1">
                 <p className="text-xs font-bold text-white uppercase tracking-widest">Locked by Default</p>
                 <p className="text-[9px] text-slate-500 uppercase">Requires previous week completion</p>
               </div>
               <button 
                 onClick={() => setFormData({ ...formData, lockPolicy: { ...formData.lockPolicy, lockedByDefault: !formData.lockPolicy.lockedByDefault } })}
                 className={`w-10 h-5 rounded-full relative transition-colors ${formData.lockPolicy.lockedByDefault ? 'bg-[#D4AF37]' : 'bg-slate-700'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.lockPolicy.lockedByDefault ? 'right-1' : 'left-1'}`} />
               </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Percent className="w-3 h-3" /> Min. Progress (%)
                </label>
                <input 
                  type="number" 
                  value={formData.lockPolicy.minCompletionPercent}
                  onChange={e => setFormData({ ...formData, lockPolicy: { ...formData.lockPolicy, minCompletionPercent: parseInt(e.target.value) } })}
                  className="w-full bg-[#121214] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Coins className="w-3 h-3" /> Min. Points
                </label>
                <input 
                  type="number" 
                  value={formData.lockPolicy.minCoinsToUnlockNextWeek}
                  onChange={e => setFormData({ ...formData, lockPolicy: { ...formData.lockPolicy, minCoinsToUnlockNextWeek: parseInt(e.target.value) } })}
                  className="w-full bg-[#121214] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>
          </section>
        </div>

        <footer className="p-6 border-t border-slate-800 bg-[#121214] flex gap-3">
          <button onClick={onClose} className="p-1 px-4 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors">Discard</button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 py-3 bg-[#D4AF37] text-black text-[10px] font-black uppercase rounded shadow-xl shadow-[#D4AF37]/10 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};
