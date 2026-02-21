
import React, { useState, useEffect } from 'react';
import { Plus, Layout, ArrowLeft, Layers, Zap, Info, Loader2, Save, Users, ChevronRight, Calendar, GraduationCap, Copy } from 'lucide-react';
import { Cohort } from '../../../types';
import { apiClient } from '../../../lib/apiClient';
import { useToast } from '../../../lib/ToastContext';

export const ProgramWeeksPage: React.FC<{ programId: string; onSelectCohort: (id: string) => void }> = ({ programId, onSelectCohort }) => {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchCohorts = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get('/api/cohorts');
      if (data && data.cohorts) {
        setCohorts(data.cohorts);
      }
    } catch (err) {
      console.error("Failed to fetch cohorts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, [programId]);

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setIsDuplicating(id);
      await apiClient.post(`/api/admin/cohorts/${id}/duplicate`, {});
      await fetchCohorts();
    } catch (err) {
      console.error("Failed to duplicate cohort:", err);
      addToast({
        title: 'Deployment Failed',
        description: 'Failed to duplicate cohort instance. Please try again.',
        type: 'error'
      });
    } finally {
      setIsDuplicating(null);
    }
  };

  if (isLoading) return <div className="p-12 text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Initializing Designer...</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
      {/* HEADER */}
      <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Curriculum Designer</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Intake instances active</span>
          </div>
        </div>
        <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">Curriculum Manager</h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Manage course structures for individual intake instances.</p>
      </header>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-2 gap-8">
            {cohorts.map(cohort => (
              <div
                key={cohort.id}
                onClick={() => onSelectCohort(cohort.id)}
                className="text-left bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] group hover:border-[#D4AF37]/50 transition-all shadow-2xl relative overflow-hidden cursor-pointer"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-6 h-6 text-slate-500 group-hover:text-[#D4AF37]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDuplicate(e, cohort.id)}
                        disabled={isDuplicating === cohort.id}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all disabled:opacity-50"
                        title="Duplicate Intake"
                      >
                        {isDuplicating === cohort.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <div className="flex items-center gap-1 p-2.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2 group-hover:text-[#D4AF37] transition-colors">{cohort.name}</h3>

                  <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Duration
                      </span>
                      <span className="text-xs font-bold text-slate-400">{cohort.start_date} — {cohort.end_date}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-3 h-3" /> Enrollment
                      </span>
                      <span className="text-xs font-bold text-slate-400">{cohort.enrolled_count || 0} / {cohort.capacity} Students</span>
                    </div>
                  </div>
                </div>

                {/* Aesthetic Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div className="p-10 border border-dashed border-white/5 rounded-[3rem] text-center bg-black/10">
            <Layout className="w-10 h-10 text-slate-800 mx-auto mb-4" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Initialize new intake instances in the Admin Dashboard</p>
          </div>
        </div>
      </div>
    </div >
  );
};
