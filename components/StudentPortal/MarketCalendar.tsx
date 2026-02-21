
import React, { useState } from 'react';
import {
   Calendar as CalendarIcon,
   Clock,
   Globe,
   TrendingUp,
   AlertTriangle,
   Filter,
   ChevronRight,
   Search,
   Zap,
   Info,
   Activity,
   ArrowUpRight,
   ShieldAlert
} from 'lucide-react';

interface MarketEvent {
   id: string;
   time: string;
   currency: string;
   event: string;
   impact: 'High' | 'Medium' | 'Low';
   actual?: string;
   forecast: string;
   previous: string;
}

export const MarketCalendar: React.FC = () => {
   const [filterImpact, setFilterImpact] = useState<'All' | 'High'>('All');

   const events: MarketEvent[] = [
      { id: '1', time: '14:30', currency: 'USD', event: 'Core CPI m/m', impact: 'High', forecast: '0.3%', previous: '0.2%' },
      { id: '2', time: '14:30', currency: 'USD', event: 'CPI y/y', impact: 'High', actual: '3.1%', forecast: '2.9%', previous: '3.4%' },
      { id: '3', time: '15:15', currency: 'EUR', event: 'Main Refinancing Rate', impact: 'High', forecast: '4.50%', previous: '4.50%' },
      { id: '4', time: '15:45', currency: 'EUR', event: 'ECB Press Conference', impact: 'High', forecast: '-', previous: '-' },
      { id: '5', time: '16:00', currency: 'USD', event: 'Consumer Confidence', impact: 'Medium', forecast: '114.2', previous: '110.1' },
      { id: '6', time: '18:30', currency: 'CAD', event: 'BOC Gov Speaking', impact: 'Medium', forecast: '-', previous: '-' },
      { id: '7', time: '22:00', currency: 'AUD', event: 'Retail Sales m/m', impact: 'Low', forecast: '0.1%', previous: '0.4%' },
   ];

   const filteredEvents = filterImpact === 'High' ? events.filter(e => e.impact === 'High') : events;

   return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-[1700px] mx-auto animate-in fade-in duration-700 select-none pb-32">
         {/* HEADER SECTION */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div>
               <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h1 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Market Intel</h1>
                  <div className="w-fit px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                     <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Synchronized Global Stream</span>
                  </div>
               </div>
               <p className="text-slate-500 text-xs sm:text-sm font-bold mt-2 uppercase italic tracking-widest opacity-60">High-fidelity fundamental transmission and volatility forecast.</p>
            </div>

            <div className="flex items-center gap-4">
               <div className="w-full sm:w-auto bg-[#161b22] border border-white/5 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-4 justify-center sm:justify-start">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                     <Globe className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Session</span>
                     <span className="text-xs font-black text-white tracking-widest uppercase">New York [NY]</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* LEFT: MAIN CALENDAR FEED */}
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-[#161b22] border border-white/5 rounded-[2rem] lg:rounded-[2.5rem] p-1 shadow-2xl overflow-hidden">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between p-6 border-b border-white/5 bg-black/20 gap-6">
                     <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-8">
                        <div className="flex items-center gap-3">
                           <CalendarIcon className="w-5 h-5 text-[#D4AF37]" />
                           <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Institutional Calendar</h2>
                        </div>
                        <div className="hidden md:block h-6 w-px bg-white/5" />
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                           <button
                              onClick={() => setFilterImpact('All')}
                              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterImpact === 'All' ? 'bg-[#D4AF37] text-black' : 'text-slate-500 hover:text-white'}`}
                           >
                              All Signals
                           </button>
                           <button
                              onClick={() => setFilterImpact('High')}
                              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterImpact === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-slate-500 hover:text-white'}`}
                           >
                              High Impact Only
                           </button>
                        </div>
                     </div>
                     <div className="relative w-full xl:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                        <input type="text" placeholder="Search events..." className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-bold uppercase text-white outline-none focus:border-[#D4AF37]/30" />
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-[#0f172a]/40 border-b border-white/5">
                              <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Execution Time [UTC]</th>
                              <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Node [CCY]</th>
                              <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Criticality</th>
                              <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Intel Package</th>
                              <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] text-right">Metrics [A/F/P]</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {filteredEvents.map((ev) => (
                              <tr key={ev.id} className="group hover:bg-white/5 transition-all">
                                 <td className="px-6 lg:px-8 py-4 lg:py-6">
                                    <div className="flex items-center gap-3">
                                       <Clock className="w-3.5 h-3.5 text-slate-700 group-hover:text-blue-400 transition-colors" />
                                       <span className="text-xs font-black text-slate-300">{ev.time}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 lg:px-8 py-4 lg:py-6">
                                    <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10 text-[10px] font-black text-white tracking-widest">{ev.currency}</span>
                                 </td>
                                 <td className="px-6 lg:px-8 py-4 lg:py-6">
                                    <ImpactBadge impact={ev.impact} />
                                 </td>
                                 <td className="px-6 lg:px-8 py-4 lg:py-6">
                                    <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors tracking-tight uppercase">{ev.event}</span>
                                 </td>
                                 <td className="px-6 lg:px-8 py-4 lg:py-6 text-right font-mono">
                                    <div className="flex items-center justify-end gap-3">
                                       <span className={`text-xs font-black italic tracking-tighter ${ev.actual && parseFloat(ev.actual) > parseFloat(ev.forecast) ? 'text-emerald-500' : ev.actual ? 'text-red-500' : 'text-slate-600'}`}>
                                          {ev.actual || '--'}
                                       </span>
                                       <span className="text-[10px] font-bold text-slate-500">{ev.forecast}</span>
                                       <span className="text-[10px] font-bold text-slate-700">{ev.previous}</span>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>

            {/* RIGHT: CONTEXTUAL INTELLIGENCE */}
            <div className="lg:col-span-4 space-y-8">
               {/* VOLATILITY MATRIX */}
               <div className="bg-[#161b22] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-[#D4AF37]" />
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Volatility Matrix</h2>
                     </div>
                     <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-6">
                     <VolMeter label="VIX Index" value={18.4} target={20} color="text-blue-400" />
                     <VolMeter label="DXY Strength" value={104.2} target={105} color="text-[#D4AF37]" />
                     <VolMeter label="S&P 500 Drift" value={0.4} target={1} color="text-emerald-400" />
                  </div>

                  <div className="pt-6 border-t border-white/5">
                     <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                        Volatility is currently within nominal institutional parameters. Prepare for spikes during New York open.
                     </p>
                  </div>
               </div>

               {/* ALPHA ADVISORY */}
               <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
                  <div className="flex items-center gap-3 text-[#D4AF37] relative z-10">
                     <ShieldAlert className="w-5 h-5" />
                     <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Neural Advisory</h3>
                  </div>
                  <p className="text-sm font-bold text-slate-400 italic leading-relaxed relative z-10 group-hover:text-slate-200 transition-colors">
                     "CPI and ECB packets overlapping. Historical backtests suggest 80% probability of liquidity wicks within 15m of transmission. Neutral bias recommended until structure confirms."
                  </p>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-[50px] group-hover:scale-125 transition-transform duration-1000" />
               </div>

               {/* QUICK DATA FEED */}
               <div className="bg-[#161b22] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Resource Links</h3>
                  <div className="space-y-3">
                     <ResourceButton label="TradingView Charts" />
                     <ResourceButton label="Forex Factory Primary" />
                     <ResourceButton label="Institutional Orderflow" />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

const ImpactBadge: React.FC<{ impact: 'High' | 'Medium' | 'Low' }> = ({ impact }) => {
   const styles = {
      High: 'bg-red-500/20 text-red-500 border-red-500/30',
      Medium: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      Low: 'bg-slate-800/20 text-slate-500 border-slate-700/30',
   };
   return (
      <div className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border w-fit ${styles[impact]}`}>
         {impact} Node
      </div>
   );
};

const VolMeter: React.FC<{ label: string; value: number; target: number; color: string }> = ({ label, value, target, color }) => {
   const percent = Math.min((value / target) * 100, 100);
   return (
      <div className="space-y-2">
         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-500">{label}</span>
            <span className={color}>{value}</span>
         </div>
         <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 rounded-full bg-current ${color.replace('text', 'bg')}`} style={{ width: `${percent}%` }} />
         </div>
      </div>
   );
};

const ResourceButton: React.FC<{ label: string }> = ({ label }) => (
   <button className="w-full flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:border-[#D4AF37]/30 transition-all group">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white">{label}</span>
      <ArrowUpRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-[#D4AF37]" />
   </button>
);
