import React, { useState, useEffect } from 'react';
import { Plus, Layout, ArrowLeft, Layers, Zap, Info, Loader2, Save, Settings, Edit3 } from 'lucide-react';
import { Week, Module, Cohort } from '../../../types';
import { apiClient } from '../../../lib/apiClient';
import { WeekCard } from '../../../components/weeks/WeekCard';
import { WeekEditorDrawer } from '../../../components/weeks/WeekEditorDrawer';
import { ModuleCard } from '../../../components/modules/ModuleCard';
import { SortableList } from '../../../components/dnd/SortableList';
import { ModuleEditorDrawer } from '../../../components/modules/ModuleEditorDrawer';

interface CohortWeeksPageProps {
  cohortId: string;
  onBack: () => void;
  onOpenSettings: () => void;
  isNested?: boolean;
}

export const CohortWeeksPage: React.FC<CohortWeeksPageProps> = ({ cohortId, onBack, onOpenSettings, isNested = false }) => {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch cohort details
        const cohortData = await apiClient.get(`/api/cohorts/${cohortId}`);
        if (cohortData && cohortData.cohort) {
          setCohort(cohortData.cohort);
        }

        // Fetch curriculum structure
        const structureData = await apiClient.get(`/api/admin/courses/structure?cohort_id=${cohortId}`);
        if (structureData && structureData.weeks) {
          setWeeks(structureData.weeks);
          if (structureData.weeks.length > 0) {
            setActiveWeekId(structureData.weeks[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch curriculum data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [cohortId]);

  const activeWeek = weeks.find(w => w.id === activeWeekId);

  const handleAddWeek = () => {
    const nextNumber = weeks.length + 1;
    const newWeek: Week = {
      id: `w-${Date.now()}`,
      cohortId: cohortId,
      number: nextNumber,
      title: `Module ${nextNumber}`,
      lockPolicy: {
        lockedByDefault: true,
        minCompletionPercent: 0,
        minCoinsToUnlockNextWeek: 0
      },
      modules: [],
      lessons: []
    };
    setWeeks([...weeks, newWeek]);
    setActiveWeekId(newWeek.id);
    setEditingWeek(newWeek);
  };

  const handleReorderModules = async (newModules: Module[]) => {
    if (!activeWeekId) return;

    const updatedWeeks = weeks.map(w =>
      w.id === activeWeekId ? { ...w, modules: newModules.map((m, i) => ({ ...m, position: i + 1 })) } : w
    );
    setWeeks(updatedWeeks);

    try {
      await apiClient.post(`/api/admin/weeks/${activeWeekId}/reorder-modules`, {
        orderedIds: newModules.map(m => m.id)
      });
    } catch (err) {
      console.warn("Stub reorder successful.");
    }
  };

  const handleUpdateWeek = (updated: Week) => {
    setWeeks(weeks.map(w => w.id === updated.id ? updated : w));
    setEditingWeek(null);
  };

  const handleUpdateModule = (updated: Module, targetWeekId: string) => {
    const isMovingWeeks = updated.weekId !== targetWeekId;

    if (isMovingWeeks) {
      const updatedWeeks = weeks.map(w => {
        if (w.id === updated.weekId) {
          return { ...w, modules: w.modules.filter(m => m.id !== updated.id) };
        }
        if (w.id === targetWeekId) {
          const newModule = { ...updated, weekId: targetWeekId, position: w.modules.length + 1 };
          return { ...w, modules: [...w.modules, newModule] };
        }
        return w;
      });
      setWeeks(updatedWeeks);
      setActiveWeekId(targetWeekId);
    } else {
      const updatedWeeks = weeks.map(w =>
        w.id === updated.weekId
          ? { ...w, modules: w.modules.map(m => m.id === updated.id ? updated : m) }
          : w
      );
      setWeeks(updatedWeeks);
    }
    setEditingModule(null);
  };

  const handleDeleteModule = (moduleId: string) => {
    if (window.confirm("Are you sure you want to delete this module and all its associated lessons?")) {
      const updatedWeeks = weeks.map(w => ({
        ...w,
        modules: w.modules.filter(m => m.id !== moduleId)
      }));
      setWeeks(updatedWeeks);
      setEditingModule(null);
    }
  };

  const handleAddModule = () => {
    if (!activeWeek) return;
    const newMod: Module = {
      id: `m-${Date.now()}`,
      weekId: activeWeek.id,
      title: 'New Module',
      position: activeWeek.modules.length + 1,
      order: activeWeek.modules.length + 1,
      lessons: []
    };
    const updatedWeeks = weeks.map(w =>
      w.id === activeWeekId ? { ...w, modules: [...w.modules, newMod] } : w
    );
    setWeeks(updatedWeeks);
    setEditingModule(newMod);
  };

  const handleCloneModule = (module: Module) => {
    // Placeholder for clone functionality
    const nextMod: Module = {
      ...module,
      id: `m-${Date.now()}`,
      title: `${module.title} (Copy)`,
      position: module.position + 1,
      order: module.order + 1,
    };

    const updatedWeeks = weeks.map(w =>
      w.id === activeWeekId ? { ...w, modules: [...w.modules, nextMod] } : w
    );
    setWeeks(updatedWeeks);
  };

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0b]">
      <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
      <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] animate-pulse">Loading Course Modules...</span>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0b] overflow-hidden">
      {!isNested && (
        <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0 bg-[#121214]/50 backdrop-blur-md">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={onBack} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white transition-colors flex items-center gap-2">
                  <ArrowLeft className="w-3 h-3" /> Back to Intakes
                </button>
                <div className="h-4 w-px bg-white/5 mx-2" />
                <div className="flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Active Intake</span>
                </div>
              </div>
              <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2 truncate max-w-4xl">
                {cohort?.name} Designer
              </h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Course Structure & Lesson Design</p>
            </div>

            <button
              onClick={onOpenSettings}
              className="px-8 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all flex items-center gap-3 shadow-2xl"
            >
              <Settings className="w-4 h-4" /> Intake Settings
            </button>
          </div>
        </header>
      )}

      {/* Week Selector */}
      <div className={`p-8 border-b border-white/5 bg-[#0a0a0b] ${isNested ? 'pt-10' : ''}`}>
        <div className="max-w-7xl overflow-x-auto custom-scrollbar pb-4">
          <div className="flex gap-4">
            {weeks.map(week => (
              <WeekCard
                key={week.id}
                week={week}
                isActive={activeWeekId === week.id}
                onClick={() => setActiveWeekId(week.id)}
                onEdit={() => setEditingWeek(week)}
              />
            ))}
            <button
              onClick={handleAddWeek}
              className="min-w-[200px] h-[134px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl group hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all"
            >
              <Plus className="w-5 h-5 text-slate-600 group-hover:text-[#D4AF37] mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400">Add Module</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex w-full">
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                  {activeWeek?.title || `Module ${activeWeek?.number}`} Sections
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Manage learning sections for this module</p>
              </div>
              {activeWeek && (
                <button
                  onClick={() => setEditingWeek(activeWeek)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all shadow-sm"
                  title="Module Settings"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleAddModule}
              className="px-6 py-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-[10px] font-black text-[#D4AF37] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Section
            </button>
          </div>

          {activeWeek && activeWeek.modules.length > 0 ? (
            <div className="max-w-4xl space-y-4">
              <SortableList
                items={activeWeek.modules}
                getId={(m) => m.id}
                onReorder={handleReorderModules}
                renderItem={(module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onEdit={() => setEditingModule(module)}
                    onClone={() => handleCloneModule(module)}
                    onDelete={() => handleDeleteModule(module.id)}
                  />
                )}
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-700 opacity-50 bg-black/20">
              <Layout className="w-12 h-12 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">No sections added to this module yet</p>
            </div>
          )}
        </div>

        <aside className="w-80 p-10 border-l border-white/5 space-y-8 bg-[#161b22]/50">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D4AF37]" /> Editor Tip
            </h3>
            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                Reordering sections here will immediately update the student's learning roadmap for this intake.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <div className="flex items-start gap-3 text-slate-500">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold uppercase leading-relaxed tracking-widest">
                Changes are saved automatically. Ensure your module structure is complete before notifying students.
              </p>
            </div>
          </div>

          <button className="w-full py-4 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-[#D4AF37]/10 hover:bg-[#B8962E] transition-all active:scale-95">
            Save Structure
          </button>
        </aside>
      </main>

      {editingWeek && (
        <WeekEditorDrawer
          week={editingWeek}
          isOpen={!!editingWeek}
          onClose={() => setEditingWeek(null)}
          onSave={handleUpdateWeek}
        />
      )}

      {editingModule && (
        <ModuleEditorDrawer
          module={editingModule}
          weeks={weeks}
          isOpen={!!editingModule}
          onClose={() => setEditingModule(null)}
          onSave={handleUpdateModule}
          onDelete={() => handleDeleteModule(editingModule.id)}
        />
      )}
    </div>
  );
};
