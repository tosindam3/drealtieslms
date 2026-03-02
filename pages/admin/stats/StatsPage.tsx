import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Cpu,
  Activity,
  ChevronRight,
  Filter,
  Download,
  Calendar,
  Globe,
  X,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { apiClient, API_BASE_URL } from '../../../lib/apiClient';
import { FullPageSkeletonLoader } from '../../../components/loading/index';

export const StatsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const [cohortStudents, setCohortStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/api/admin/dashboard/stats');
        setData(response);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExport = () => {
    window.open(`${API_BASE_URL}/api/admin/stats/export?token=${apiClient.getAuthToken()}`, '_blank');
  };

  const handleRowClick = async (cohort: any) => {
    setSelectedCohort(cohort);
    setPanelOpen(true);
    setLoadingStudents(true);
    try {
      const res = await apiClient.get(`/api/admin/cohorts/${cohort.id}/students`);
      if (res && res.students) {
        setCohortStudents(res.students);
      }
    } catch (err) {
      console.error('Failed to fetch cohort students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
        <FullPageSkeletonLoader />
      </div>
    );
  }

  const metrics = data?.metrics || [];
  const timeSeries = data?.timeSeries || [];
  const recentPrograms = data?.recentPrograms || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
      {/* HEADER */}
      <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Academy Operational Stream</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live System Analytics</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">Academic Intel</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Quantifying real-time pedagogical performance across the network.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-3 px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-[#D4AF37]/10 hover:bg-[#B8962E] transition-all" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export Performance Data
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-12">

          {/* TOP METRICS GRID */}
          <div className="grid grid-cols-3 gap-6">
            {metrics.map((m: any, i: number) => (
              <div key={i} className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-10 h-10 rounded-xl ${m.color || 'bg-blue-500/10'} border border-white/10 flex items-center justify-center`}>
                    {i === 0 ? <Users className="w-5 h-5 text-blue-400" /> :
                      i === 1 ? <Zap className="w-5 h-5 text-purple-400" /> :
                        i === 2 ? <Globe className="w-5 h-5 text-emerald-400" /> :
                          <Activity className="w-5 h-5 text-[#D4AF37]" />}
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${m.trend?.startsWith('+') ? 'text-emerald-500' : 'text-blue-400'}`}>
                    {m.trend} {m.trend?.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{m.label}</p>
                <h3 className="text-4xl font-black text-white mt-1 italic tracking-tighter">{m.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-10">
            {/* PERFORMANCE GRAPH SECTION */}
            <div className="col-span-8 bg-[#161b22] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <Activity className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Enrollment Velocity</h2>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Daily Enrollments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Efficiency</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '10px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RADIAL / PIE CHART REPLACEMENT */}
            <div className="col-span-4 bg-[#161b22] border border-white/5 rounded-[3rem] p-10 shadow-2xl flex flex-col items-center justify-center text-center">
              <div className="relative w-48 h-48 mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" strokeWidth="8"
                    strokeDasharray={`${(data?.globalRetention || 0) * 2.82} 282`}
                    strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white italic">{data?.globalRetention || 0}%</span>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Batch Retention</span>
                </div>
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Retention Integrity</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                System-wide average completion and retention rates across all active pedagogical intakes.
              </p>
            </div>
          </div>

          {/* COHORT BREAKDOWN TABLE */}
          <div className="bg-[#161b22] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Target className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Intake Lifecycle Intelligence</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5" />
                Real-time Data Active
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0f172a]/40">
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Intake Identifier</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Population</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Progress</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Capacity</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Stream Status</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentPrograms.map((c: any, i: number) => (
                    <tr key={i} onClick={() => handleRowClick(c)} className="hover:bg-white/5 transition-all group overflow-hidden cursor-pointer">
                      <td className="px-10 py-8">
                        <span className="text-xs font-black text-white uppercase tracking-widest">{c.title}</span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Users className="w-3.5 h-3.5" />
                          {c.students} Students
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden w-32">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-white">{c.progress}%</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-xs font-black text-slate-500 uppercase italic">
                        {c.students} / {c.capacity}
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          c.status === 'Published' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                            'bg-slate-800/10 border-slate-700/30 text-slate-500'
                          }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button className="p-2 text-slate-700 hover:text-white transition-all group-hover:translate-x-1">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM AUDIT FOOTER */}
          <div className="flex items-center justify-between p-10 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-[2.5rem]">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Data Integrity Verified</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest leading-relaxed">
                  All analytics points synchronized with the core ledger. Audit trail secured and authenticated.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">System Status</span>
              <p className="text-xs font-black text-[#D4AF37] italic uppercase tracking-tighter">Operational v2.0</p>
            </div>
          </div>

        </div>
      </div>

      {/* SLIDE-OVER PANEL */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#0d1117] border-l border-white/10 shadow-2xl transform transition-transform duration-500 ease-in-out z-50 flex flex-col ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Panel Header */}
        <div className="p-8 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter shrink-0">{selectedCohort?.title || 'Cohort Details'}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Intake Lifecycle Active Roster</p>
          </div>
          <button onClick={() => setPanelOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors relative z-10">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {loadingStudents ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
                <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Extracting Records...</p>
              </div>
            </div>
          ) : cohortStudents.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Roster Data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cohortStudents.map((student: any) => (
                <div key={student.enrollment_id} className="bg-[#161b22] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 group hover:border-white/10 transition-colors">
                  {/* Status Ribbon */}
                  {student.analytics?.is_at_risk && (
                    <div className="absolute top-0 right-0 border-b-[40px] border-l-[40px] border-b-transparent border-l-transparent border-r-[40px] border-t-[40px] border-r-rose-500/20 border-t-rose-500/20 z-0">
                      <AlertTriangle className="absolute top-[-25px] right-[-25px] w-4 h-4 text-rose-500" />
                    </div>
                  )}

                  {/* Student Header */}
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {student.user.avatar_url ? (
                        <img src={student.user.avatar_url} alt={student.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-blue-400 uppercase">{student.user.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white tracking-widest uppercase">{student.user.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">{student.user.email}</p>
                    </div>
                  </div>

                  {/* Top Metrics Row */}
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Completion</span>
                        <span className="text-xs font-black text-blue-400">{student.completion_percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${student.completion_percentage}%` }} />
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg Score</span>
                        <span className="text-xs font-black text-[#D4AF37]">{student.analytics?.average_score || 0}%</span>
                      </div>
                      <p className="text-[8px] text-slate-600 font-bold uppercase mt-1">Cumulative Assessment</p>
                    </div>
                  </div>

                  {/* Bottom Metrics Row */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2 relative z-10">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5 px-2 py-1 rounded bg-black/40">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        Engagement:
                        <span className={student.analytics?.engagement_label === 'High' ? 'text-emerald-400' : student.analytics?.engagement_label === 'Medium' ? 'text-blue-400' : 'text-rose-400'}>
                          {student.analytics?.engagement_label || 'N/A'} ({student.analytics?.engagement_rate || 0}%)
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 border border-white/5 px-2 py-1 rounded bg-black/40">
                        <TrendingUp className="w-3 h-3 text-purple-400" /> Velocity: <span className="text-purple-400">{student.analytics?.velocity || 0}%/wk</span>
                      </span>
                    </div>
                  </div>

                  {/* At-Risk Warning */}
                  {student.analytics?.is_at_risk && (
                    <div className="mt-2 text-[10px] font-bold text-rose-500/80 uppercase tracking-widest flex items-center gap-2 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20 relative z-10">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Critical: Flagged for high drop-off probability.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY */}
      {panelOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setPanelOpen(false)}
        />
      )}

    </div>
  );
};
