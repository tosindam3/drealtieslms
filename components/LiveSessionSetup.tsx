import React, { useState } from 'react';
import {
   ChevronDown,
   ArrowLeft,
   Save,
   Clock,
   Globe,
   Video,
   ExternalLink,
   ShieldCheck,
   Zap,
   Settings,
   Calendar,
   Users,
   Activity,
   Radio,
   Monitor,
   AlertCircle
} from 'lucide-react';
import { LessonBlock } from '../types';

interface LiveSessionSetupProps {
   block: LessonBlock;
   onSave: (updatedPayload: any) => void;
   onCancel: () => void;
}

export const LiveSessionSetup: React.FC<LiveSessionSetupProps> = ({ block, onSave, onCancel }) => {
   const [formData, setFormData] = useState({
      title: block.title || "Live Workshop Session",
      joinUrl: block.payload?.joinUrl || '',
      startAt: block.payload?.startAt || '',
      duration: block.payload?.duration || 60,
      trackingEnabled: block.payload?.trackingEnabled ?? true,
      platform: block.payload?.platform || 'zoom',
      liveClassId: block.payload?.liveClassId || null
   });

   const platforms = [
      { id: 'zoom', label: 'Zoom', icon: Video },
      { id: 'teams', label: 'MS Teams', icon: Users },
      { id: 'direct', label: 'Direct Stream', icon: Radio },
      { id: 'youtube', label: 'YouTube Live', icon: Monitor }
   ];

   return (
      <div className="h-full min-h-screen bg-[#0a0a0b] text-slate-300 animate-in fade-in duration-500 flex flex-col font-['Inter']">
         <header className="h-24 border-b border-white/5 px-12 flex items-center justify-between shrink-0 bg-[#121214]/80 backdrop-blur-xl sticky top-0 z-[60]">
            <div className="flex items-center gap-6">
               <button
                  onClick={onCancel}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all hover:bg-white/10 group"
               >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
               </button>
               <div className="h-10 w-px bg-white/5" />
               <div>
                  <div className="flex items-center gap-3">
                     <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        <Radio className="w-6 h-6 text-blue-500 animate-pulse" />
                        Workshop Setup
                     </h1>
                     <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Synchronous Session</span>
                     </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Status: Configuring Broadcast Link</p>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <button
                  onClick={onCancel}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
               >
                  Discard
               </button>
               <button
                  onClick={() => onSave(formData)}
                  className="px-10 py-3 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-[#D4AF37]/20 hover:bg-[#B8962E] transition-all active:scale-95 flex items-center gap-3"
               >
                  <Save className="w-4 h-4" /> Save Session
               </button>
            </div>
         </header>

         <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#0a0a0b]">
               <div className="max-w-4xl mx-auto space-y-12">
                  <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                     <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Session Details</h2>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Workshop Title</label>
                           <input
                              type="text"
                              value={formData.title}
                              onChange={e => setFormData({ ...formData, title: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 px-8 py-5 rounded-[1.2rem] text-xl font-black text-white outline-none focus:border-blue-500/40 shadow-inner transition-all"
                              placeholder="e.g. Q&A and Backtesting Session..."
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Scheduled Start (UTC)</label>
                              <div className="relative">
                                 <input
                                    type="datetime-local"
                                    value={formData.startAt}
                                    onChange={e => setFormData({ ...formData, startAt: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest outline-none focus:border-blue-500/40"
                                 />
                                 <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Duration (Minutes)</label>
                              <div className="relative">
                                 <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                                    className="w-full bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-lg font-black text-white outline-none focus:border-blue-500/40 shadow-inner"
                                 />
                                 <Clock className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800" />
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>

                  <section className="space-y-8">
                     <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Meeting Link</h2>
                     </div>

                     <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                           {platforms.map((p) => (
                              <button
                                 key={p.id}
                                 onClick={() => setFormData({ ...formData, platform: p.id })}
                                 className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${formData.platform === p.id
                                    ? 'bg-blue-500/10 border-blue-500/40 shadow-lg ring-1 ring-blue-500/20'
                                    : 'bg-black/20 border-white/5 hover:border-white/10'
                                    }`}
                              >
                                 <p.icon className={`w-5 h-5 ${formData.platform === p.id ? 'text-blue-400' : 'text-slate-600'}`} />
                                 <span className={`text-[9px] font-black uppercase tracking-widest ${formData.platform === p.id ? 'text-white' : 'text-slate-500'}`}>{p.label}</span>
                              </button>
                           ))}
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Invite URL</label>
                           <div className="relative">
                              <input
                                 type="text"
                                 value={formData.joinUrl}
                                 onChange={e => setFormData({ ...formData, joinUrl: e.target.value })}
                                 className="w-full bg-black/40 border border-white/10 px-8 py-4 rounded-2xl text-xs font-bold text-blue-400 outline-none focus:border-blue-500/40 shadow-inner pr-16"
                                 placeholder="https://zoom.us/j/..."
                              />
                              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                 <ExternalLink className="w-4 h-4 text-slate-700" />
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>
               </div>
            </div>

            <aside className="w-[420px] border-l border-white/5 bg-[#121214]/50 backdrop-blur-md p-10 space-y-10 overflow-y-auto custom-scrollbar shadow-2xl">
               <section className="space-y-8">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Session Controls</h3>
                  <div className="space-y-6">
                     <div className="flex items-center justify-between p-6 bg-black/30 border border-white/5 rounded-2xl group transition-all hover:border-blue-500/20 shadow-xl">
                        <div className="space-y-1">
                           <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Attendance Tracking</h4>
                           </div>
                           <p className="text-[8px] text-slate-600 font-bold uppercase">Auto-sync with enrollment log</p>
                        </div>
                        <button
                           onClick={() => setFormData({ ...formData, trackingEnabled: !formData.trackingEnabled })}
                           className={`w-12 h-6 rounded-full relative transition-all duration-500 ${formData.trackingEnabled ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${formData.trackingEnabled ? 'right-1' : 'left-1'}`} />
                        </button>
                     </div>
                  </div>
               </section>
            </aside>
         </div>
      </div>
   );
};