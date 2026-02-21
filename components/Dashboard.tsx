import React, { useState, useEffect } from 'react';
import {
  Users,
  Layers,
  TrendingUp,
  Zap,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Activity,
  Loader2
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface DashboardProps {
  onSelectCohort?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectCohort }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get('/api/admin/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleInitializeCourse = async () => {
    try {
      setIsInitializing(true);
      await apiClient.post('/api/admin/courses/init', {
        title: `Alpha Stream - ${new Date().toLocaleDateString()}`,
        description: 'Automatically initialized pedagogical stream for the current session.'
      });
      alert("New pedagogical stream initialized.");
      await fetchStats();
    } catch (err) {
      console.error("Failed to initialize course:", err);
      alert("Failed to initialize course. Possible auth or validation error.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAccessAuditLogs = async () => {
    await apiClient.get('/api/admin/audit-logs');
    alert("Neural feed logs retrieved for current session.");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
      {/* HEADER */}
      <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Academy Control Center</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Systems Online</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">Alpha Dashboard</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Real-time pedagogical stream and performance analytics.</p>
          </div>
          <button
            onClick={handleInitializeCourse}
            disabled={isInitializing}
            className="flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-[#D4AF37]/10 hover:bg-[#B8962E] transition-all active:scale-95 disabled:opacity-50"
          >
            {isInitializing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Create Course
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-12">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {(stats?.metrics || [
              { label: 'Total Registered', value: '0', trend: '+0%', color: 'bg-blue-400/10' },
              { label: 'Active Subscriptions', value: '0', trend: '+0', color: 'bg-purple-400/10' },
              { label: 'Total Revenue', value: '$0', trend: '+0%', color: 'bg-emerald-400/10' },
              { label: 'Avg. Completion', value: '0%', trend: '+0%', color: 'bg-[#D4AF37]/10' },
              { label: 'Total Contacts', value: '0', trend: '+0', color: 'bg-orange-400/10' },
              { label: 'Active Enrollments', value: '0', trend: '+0', color: 'bg-indigo-400/10' },
            ]).map((m, idx) => (
              <div key={idx} className="bg-[#161b22] p-8 rounded-[2rem] border border-white/5 shadow-2xl hover:border-[#D4AF37]/30 transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-xl ${m.color || 'bg-white/5'} group-hover:scale-110 transition-transform`}>
                    {m.label.toLowerCase().includes('registered') ? <Users className="w-5 h-5 text-blue-400" /> :
                      m.label.toLowerCase().includes('subscription') ? <Layers className="w-5 h-5 text-purple-400" /> :
                        m.label.toLowerCase().includes('revenue') ? <TrendingUp className="w-5 h-5 text-emerald-400" /> :
                          m.label.toLowerCase().includes('completion') ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                            m.label.toLowerCase().includes('contacts') ? <Activity className="w-5 h-5 text-orange-400" /> :
                              <ShieldCheck className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {m.trend}
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{m.label}</p>
                <h3 className="text-3xl font-black text-white mt-1 italic tracking-tighter">{m.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-10">
            {/* Main Content: Recent Programs */}
            <div className="col-span-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Activity className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Active Deployments</h2>
                </div>
                <button className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                  View all Cohorts <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {(stats?.recentPrograms || []).map((p: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => onSelectCohort?.(p.id)}
                    className="text-left bg-[#161b22] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl group hover:border-[#D4AF37]/50 transition-all"
                  >
                    <div className="relative aspect-video">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover opacity-60 transition-transform group-hover:scale-105 duration-1000" />
                      <div className="absolute top-6 left-6">
                        <span className={`px-4 py-1.5 text-[9px] font-black rounded-full border shadow-2xl uppercase tracking-widest ${p.status === 'Published' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                          p.status === 'Draft' ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' :
                            'bg-slate-800/20 border-slate-700/40 text-slate-400'
                          }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent opacity-60" />
                    </div>
                    <div className="p-8">
                      <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">{p.category} Deployment</span>
                      <h3 className="text-xl font-black text-white mt-2 mb-6 line-clamp-1 italic tracking-tight">{p.title}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Readiness Protocol</span>
                          <span className="text-white">{p.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden shadow-inner">
                          <div className="bg-[#D4AF37] h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(212,175,55,0.5)]" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {(!stats?.recentPrograms || stats.recentPrograms.length === 0) && (
                  <div className="col-span-2 py-20 text-center text-[10px] font-black text-slate-700 uppercase tracking-[.4em]">No active cohort found.</div>
                )}
              </div>
            </div>

            {/* Sidebar: Recent Activity & Quick Links */}
            <div className="col-span-4 space-y-10">
              {/* Quick Actions */}
              <div className="bg-[#161b22] border border-white/5 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <h3 className="text-xs font-black mb-8 flex items-center gap-3 uppercase tracking-widest">
                  <Zap className="w-4 h-4 text-[#D4AF37]" />
                  Command Center
                </h3>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <QuickActionButton icon={<Calendar className="w-5 h-5" />} label="Schedule" />
                  <QuickActionButton icon={<Users className="w-5 h-5" />} label="Enroll" />
                  <QuickActionButton icon={<Play className="w-5 h-5" />} label="Broadcast" />
                  <QuickActionButton icon={<ShieldCheck className="w-5 h-5" />} label="Security" />
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-1000" />
              </div>

              {/* Activity Feed */}
              <div className="bg-[#161b22] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Neural Feed
                  </h3>
                </div>
                <div className="space-y-8">
                  {(stats?.activities || []).map((act: any, idx: number) => (
                    <div key={idx} className="flex gap-5 group">
                      <div className="relative shrink-0">
                        <img src={act.avatar} alt={act.user} className="w-12 h-12 rounded-2xl border border-white/5 shadow-2xl group-hover:scale-110 transition-transform" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#161b22] rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                          <span className="text-white">{act.user}</span> {act.action} <span className="text-[#D4AF37]">{act.target}</span>
                        </p>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1 block">{act.time}</span>
                      </div>
                    </div>
                  ))}
                  {(!stats?.activities || stats.activities.length === 0) && (
                    <div className="py-10 text-center text-[9px] font-black text-slate-700 uppercase tracking-widest">No recent neural activity.</div>
                  )}
                </div>
                <button
                  onClick={handleAccessAuditLogs}
                  className="w-full mt-10 py-4 border border-white/5 bg-white/5 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  Access Audit Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button
    onClick={async () => {
      await apiClient.post('/api/admin/command/execute', { action: label });
      alert(`Instruction: ${label} transmitted.`);
    }}
    className="flex flex-col items-center justify-center gap-3 p-6 rounded-[1.5rem] bg-black/20 hover:bg-white/5 border border-white/5 transition-all group shadow-inner"
  >
    <div className="text-slate-500 group-hover:text-[#D4AF37] transition-colors">
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-white transition-colors">{label}</span>
  </button>
);
