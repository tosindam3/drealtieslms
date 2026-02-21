import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Layers,
  Zap,
  Save,
  Activity,
  Box,
  Layout,
  Settings,
  Trash2,
  FileText,
  ArrowRight,
  Sparkles,
  Calendar,
  Grid,
  MousePointer2,
  Target,
  Eye,
  Loader2,
  Monitor,
  Lock,
  Percent,
  Coins,
  Image as ImageIcon,
  Globe,
  Database,
  Edit3,
  GripVertical,
  Unlock,
  BookOpen,
  List,
  Upload
} from 'lucide-react';
import { ProgramStructure, Week, Module, Lesson, Topic } from '../../../types';
import { LessonBlocksEditor } from '../../../components/LessonContent';
import { TopicEditor } from '../../../components/topics/TopicEditor';
import { QuizBuilder } from '../../../components/QuizBuilder';
import { AssignmentBuilder } from '../../../components/AssignmentBuilder';
import { LiveSessionSetup } from '../../../components/LiveSessionSetup';
import { WeekEditorDrawer } from '../../../components/weeks/WeekEditorDrawer';
import { ModuleEditorDrawer } from '../../../components/modules/ModuleEditorDrawer';
import { SortableList } from '../../../components/dnd/SortableList';
import { ModuleCard } from '../../../components/modules/ModuleCard';
import { apiClient } from '../../../lib/apiClient';
import { useToast } from '../../../lib/ToastContext';
import { AIGeneratorModal } from '../../../components/AI/AIGeneratorModal';

interface AdminBuilderProps {
  structure: ProgramStructure;
  onStructureUpdate: (structure: ProgramStructure) => void;
  onPreviewLesson?: (lesson: Lesson) => void;
}

export const AdminBuilder: React.FC<AdminBuilderProps> = ({ structure, onStructureUpdate, onPreviewLesson }) => {
  const [isCohortSelected, setIsCohortSelected] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeQuizBlockId, setActiveQuizBlockId] = useState<string | null>(null);
  const [activeAssignmentBlockId, setActiveAssignmentBlockId] = useState<string | null>(null);
  const [activeLiveBlockId, setActiveLiveBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'blocks'>('overview');
  const [viewMode, setViewMode] = useState<'main' | 'quiz-editor' | 'assignment-editor' | 'live-editor'>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isWeekDrawerOpen, setIsWeekDrawerOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const courseThumbnailInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const [aiModal, setAiModal] = useState<{
    isOpen: boolean;
    type: 'module' | 'quiz' | 'assignment' | 'topic_blocks';
    context?: string;
    topicTitle?: string;
  }>({
    isOpen: false,
    type: 'module'
  });

  useEffect(() => {
    if (selectedLesson) {
      const updated = structure.weeks
        .flatMap(w => w.modules)
        .flatMap(m => m.lessons)
        .find(l => l.id === selectedLesson.id);
      if (updated) {
        setSelectedLesson(updated);
        // Also update selectedTopic if it exists
        if (selectedTopic) {
          const updatedTopic = updated.topics.find(t => t.id === selectedTopic.id);
          if (updatedTopic) setSelectedTopic(updatedTopic);
        }
      }
    }
    if (selectedWeek) {
      const updated = structure.weeks.find(w => w.id === selectedWeek.id);
      if (updated) setSelectedWeek(updated);
    }
  }, [structure]);

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.post('/api/admin/courses/persist-structure', {
        courseId: structure.id,
        structure,
        updatedAt: new Date().toISOString()
      });
      addToast({ title: 'Architecture Saved', description: "Course structure successfully committed to the primary ledger.", type: 'success' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddModule = async (weekId: string) => {
    setIsLoading(true);
    const nextOrder = (structure.weeks.find(w => w.id === weekId)?.modules.length || 0) + 1;
    const newModule: Module = {
      id: `m-${Date.now()}`,
      weekId,
      title: 'New Module',
      order: nextOrder,
      position: nextOrder,
      lessons: []
    };

    const response = await apiClient.post(`/api/admin/weeks/${weekId}/modules/create`, newModule);
    const persistedModule = response.module || response; // Handle different response formats

    const updatedWeeks = structure.weeks.map(w => {
      if (w.id === weekId) {
        return { ...w, modules: [...w.modules, persistedModule] };
      }
      return w;
    });
    onStructureUpdate({ ...structure, weeks: updatedWeeks });
    setEditingModule(persistedModule);
    setIsLoading(false);
  };

  const handleReorderModules = async (weekId: string, newModules: Module[]) => {
    const updatedWeeks = structure.weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          modules: newModules.map((m, i) => ({ ...m, position: i + 1, order: i + 1 }))
        };
      }
      return w;
    });
    onStructureUpdate({ ...structure, weeks: updatedWeeks });
    await apiClient.patch(`/api/admin/weeks/${weekId}/modules/reorder`, {
      moduleIds: newModules.map(m => m.id)
    });
  };

  const handleAddLesson = async (moduleId: string) => {
    setIsLoading(true);
    const newLesson: Lesson = {
      id: `l-${Date.now()}`,
      number: 'X.X', // Corrected later in state
      title: 'Untitled Lesson',
      thumbnailUrl: '',
      order: 0,
      status: 'draft',
      isFree: false,
      topics: [],
      lessonBlocks: []
    };

    const response = await apiClient.post(`/api/admin/modules/${moduleId}/lessons/create`, newLesson);
    const persistedLesson = response.lesson || response;

    const updatedWeeks = structure.weeks.map(w => ({
      ...w,
      modules: w.modules.map(m => {
        if (m.id === moduleId) {
          const lessonNum = `${w.number}.${m.lessons.length + 1}`;
          return {
            ...m,
            lessons: [...m.lessons, { ...persistedLesson, number: lessonNum, order: m.lessons.length + 1 }]
          };
        }
        return m;
      })
    }));
    onStructureUpdate({ ...structure, weeks: updatedWeeks });
    setIsLoading(false);
  };

  const handleAddTopic = async (lessonId: string) => {
    setIsLoading(true);
    const newTopic: Topic = {
      id: `t-${Date.now()}`,
      title: 'New Topic',
      description: '',
      thumbnailUrl: '',
      order: 0,
      blocks: []
    };

    const response = await apiClient.post(`/api/admin/lessons/${lessonId}/topics/create`, newTopic);
    const persistedTopic = response.topic || response;

    const updatedWeeks = structure.weeks.map(w => ({
      ...w,
      modules: w.modules.map(m => ({
        ...m,
        lessons: m.lessons.map(l => {
          if (l.id === lessonId) {
            return { ...l, topics: [...l.topics, { ...persistedTopic, order: l.topics.length + 1 }] };
          }
          return l;
        })
      }))
    }));
    onStructureUpdate({ ...structure, weeks: updatedWeeks });

    const lesson = structure.weeks.flatMap(w => w.modules).flatMap(m => m.lessons).find(l => l.id === lessonId);
    if (lesson) {
      setSelectedLesson(lesson);
      setSelectedTopic(persistedTopic);
      setActiveTab('topics');
    }
    setIsLoading(false);
  };

  const handleDelete = async (type: 'week' | 'module' | 'lesson' | 'topic', id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      setIsLoading(true);
      await apiClient.delete(`/api/admin/curriculum/${type}/${id}`);

      const updatedWeeks = structure.weeks.filter(w => type === 'week' ? w.id !== id : true).map(w => ({
        ...w,
        modules: w.modules.filter(m => type === 'module' ? m.id !== id : true).map(m => ({
          ...m,
          lessons: m.lessons.filter(l => type === 'lesson' ? l.id !== id : true).map(l => ({
            ...l,
            topics: l.topics.filter(t => type === 'topic' ? t.id !== id : true)
          }))
        }))
      }));
      onStructureUpdate({ ...structure, weeks: updatedWeeks });
      if (selectedLesson?.id === id || selectedTopic?.id === id || selectedWeek?.id === id) {
        setSelectedLesson(null);
        setSelectedTopic(null);
        setSelectedWeek(null);
        setIsCohortSelected(true);
      }

      addToast({
        type: 'success',
        title: 'Deleted Successfully',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been removed from the curriculum.`
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: error.message || `Failed to delete ${type}. Please try again.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSelectedLesson = async (updates: Partial<Lesson>) => {
    if (!selectedLesson) return;
    const updatedWeeks = structure.weeks.map(w => ({
      ...w,
      modules: w.modules.map(m => ({
        ...m,
        lessons: m.lessons.map(l => l.id === selectedLesson.id ? { ...l, ...updates } : l)
      }))
    }));
    onStructureUpdate({ ...structure, weeks: updatedWeeks });
    await apiClient.patch(`/api/admin/lessons/${selectedLesson.id}`, updates);
  };

  const updateSelectedWeek = async (updated: Week) => {
    const updatedWeeks = structure.weeks.map(w => w.id === updated.id ? updated : w);
    onStructureUpdate({ ...structure, weeks: updatedWeeks });
    await apiClient.patch(`/api/admin/weeks/${updated.id}`, updated);
    setIsWeekDrawerOpen(false);
  };

  const handleUpdateModule = async (updated: Module, targetWeekId: string) => {
    const isMovingWeeks = updated.weekId !== targetWeekId;

    if (isMovingWeeks) {
      await apiClient.patch(`/api/admin/modules/${updated.id}/move`, { targetWeekId });
      const updatedWeeks = structure.weeks.map(w => {
        if (w.id === updated.weekId) {
          return { ...w, modules: w.modules.filter(m => m.id !== updated.id) };
        }
        if (w.id === targetWeekId) {
          const newModule = { ...updated, weekId: targetWeekId, position: w.modules.length + 1 };
          return { ...w, modules: [...w.modules, newModule] };
        }
        return w;
      });
      onStructureUpdate({ ...structure, weeks: updatedWeeks });
    } else {
      await apiClient.patch(`/api/admin/modules/${updated.id}`, updated);
      const updatedWeeks = structure.weeks.map(w => ({
        ...w,
        modules: w.modules.map(m => m.id === updated.id ? updated : m)
      }));
      onStructureUpdate({ ...structure, weeks: updatedWeeks });
    }
    setEditingModule(null);
  };

  const handleSaveTopic = async (updatedTopic: Topic) => {
    if (!selectedLesson) return;
    await apiClient.patch(`/api/admin/topics/${updatedTopic.id}`, updatedTopic);
    const updatedWeeks = structure.weeks.map(w => ({
      ...w,
      modules: w.modules.map(m => ({
        ...m,
        lessons: m.lessons.map(l => {
          if (l.id === selectedLesson.id) {
            return {
              ...l,
              topics: l.topics.map(t => t.id === updatedTopic.id ? updatedTopic : t)
            };
          }
          return l;
        })
      }))
    }));
    onStructureUpdate({ ...structure, weeks: updatedWeeks });
    setSelectedTopic(null);
  };

  const handleEditQuizBlock = (blockId: string) => {
    setActiveQuizBlockId(blockId);
    setViewMode('quiz-editor');
  };

  const handleEditAssignmentBlock = (blockId: string) => {
    setActiveAssignmentBlockId(blockId);
    setViewMode('assignment-editor');
  };

  const handleEditLiveBlock = (blockId: string) => {
    setActiveLiveBlockId(blockId);
    setViewMode('live-editor');
  };

  const handleSaveMatrix = async (payload: any, type: 'quiz' | 'assignment' | 'live') => {
    if (!selectedLesson) return;
    const blockId = type === 'quiz' ? activeQuizBlockId : type === 'assignment' ? activeAssignmentBlockId : activeLiveBlockId;
    if (!blockId) return;

    const updatedBlocks = selectedLesson.lessonBlocks.map(b =>
      b.id === blockId ? { ...b, payload, title: payload.title || b.title } : b
    );

    updateSelectedLesson({ lessonBlocks: updatedBlocks });
    setViewMode('main');
    setActiveQuizBlockId(null);
    setActiveAssignmentBlockId(null);
    setActiveLiveBlockId(null);
  };

  if (isLoading) return <LoadingState />;

  const handleCloneModule = async (moduleId: string, weekId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/api/admin/modules/${moduleId}/duplicate`, {});
      const newModule = response.module;

      const updatedWeeks = structure.weeks.map(w => {
        if (w.id === weekId) {
          // Add new module to end of list
          return { ...w, modules: [...w.modules, newModule] };
        }
        return w;
      });
      onStructureUpdate({ ...structure, weeks: updatedWeeks });
      addToast({
        title: 'Cloning Complete',
        description: 'Module duplicated successfully within the curriculum.',
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'Cloning Failed',
        description: 'Failed to duplicate module. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAIModal = (type: typeof aiModal.type, context?: string, topicTitle?: string) => {
    setAiModal({
      isOpen: true,
      type,
      context,
      topicTitle
    });
  };

  const handleAIGenerated = async (data: any) => {
    setIsLoading(true);
    try {
      if (aiModal.type === 'module') {
        // Generate a new module from AI data
        const weekId = selectedWeek?.id || structure.weeks[0]?.id;
        if (!weekId) throw new Error('No week selected');

        const nextOrder = (structure.weeks.find(w => w.id === weekId)?.modules.length || 0) + 1;
        const newModule: Module = {
          id: `m-${Date.now()}`,
          weekId,
          title: data.title || 'AI Module',
          description: data.description,
          order: nextOrder,
          position: nextOrder,
          lessons: (data.lessons || []).map((l: any, i: number) => ({
            id: `l-${Date.now()}-${i}`,
            number: `${structure.weeks.find(w => w.id === weekId)?.number || 1}.${nextOrder}.${i + 1}`,
            title: l.title,
            description: l.description,
            estimated_duration: l.estimated_duration,
            order: i + 1,
            status: 'draft',
            isFree: false,
            topics: (l.topics || []).map((t: any, j: number) => ({
              id: `t-${Date.now()}-${i}-${j}`,
              title: t.title,
              description: t.description,
              order: j + 1,
              blocks: []
            })),
            lessonBlocks: []
          }))
        };

        const response = await apiClient.post(`/api/admin/weeks/${weekId}/modules/create`, newModule);
        const persistedModule = response.module || response;

        // Note: For deep nesting, we might need a more robust persistence logic 
        // if the backend createModule doesn't handle children.
        // Assuming we might need to manually create lessons/topics if backend is simple.

        const updatedWeeks = structure.weeks.map(w => {
          if (w.id === weekId) {
            return { ...w, modules: [...w.modules, persistedModule] };
          }
          return w;
        });
        onStructureUpdate({ ...structure, weeks: updatedWeeks });
        setEditingModule(persistedModule);
        addToast({ title: 'AI Module Created', description: 'Curriculum structure has been updated with AI generated content.', type: 'success' });
      } else if (aiModal.type === 'topic_blocks') {
        if (selectedTopic) {
          handleSaveTopic({
            ...selectedTopic,
            blocks: [...(selectedTopic.blocks || []), ...data]
          });
          addToast({ title: 'Content Generated', description: 'AI generated blocks added to topic.', type: 'success' });
        }
      } else if (aiModal.type === 'quiz') {
        const payload = {
          title: data.title || 'AI Generated Quiz',
          description: data.description,
          passing_score: data.passing_score || 70,
          questions: data.questions || []
        };
        handleSaveMatrix(payload, 'quiz');
        addToast({ title: 'Quiz Generated', description: 'Assessment created with AI questions.', type: 'success' });
      } else if (aiModal.type === 'assignment') {
        const payload = {
          title: data.title || 'AI Generated Assignment',
          description: data.description,
          instructions_html: data.instructions_html,
          max_points: data.max_points || 100,
          submission_type: data.submission_type || 'file'
        };
        handleSaveMatrix(payload, 'assignment');
        addToast({ title: 'Assignment Generated', description: 'Task created from AI prompt.', type: 'success' });
      }
    } catch (err: any) {
      addToast({ title: 'AI Integration Error', description: err.message || 'Failed to apply AI content.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (targetStatus?: string) => {
    if (!structure.id) return;
    setIsSaving(true);
    try {
      const res = await apiClient.post(`/api/admin/cohorts/${structure.id}/publish`, {
        status: targetStatus
      });

      onStructureUpdate({ ...structure, status: res.status });

      addToast({
        title: 'Status Updated',
        description: `Course is now in ${res.status} mode.`,
        type: 'success'
      });
    } catch (e) {
      addToast({
        title: 'Publication Error',
        description: 'Failed to update publication status.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0b] selection:bg-[#D4AF37]/30">
      <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0 bg-[#121214]/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Academy Course Management</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Editor Online</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">Course Builder</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Design and manage your professional curriculum.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              <button
                onClick={() => handlePublish('draft')}
                disabled={isSaving || structure.status === 'draft'}
                className={`px-6 py-4 text-[10px] font-black uppercase transition-all flex items-center gap-2 ${structure.status === 'draft'
                  ? 'bg-orange-500/20 text-orange-400 border-r border-white/10'
                  : 'text-slate-500 hover:text-white hover:bg-white/5 border-r border-white/10'
                  }`}
              >
                <Edit3 className="w-4 h-4" />
                Draft
              </button>
              <button
                onClick={() => handlePublish('published')}
                disabled={isSaving || (structure.status === 'published' || structure.status === 'active')}
                className={`px-6 py-4 text-[10px] font-black uppercase transition-all flex items-center gap-2 ${(structure.status === 'published' || structure.status === 'active')
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Globe className="w-4 h-4" />
                Live
              </button>
            </div>

            <button
              onClick={handleGlobalSave}
              disabled={isSaving}
              className="px-10 py-4 bg-[#D4AF37] text-black text-[10px] font-black uppercase rounded-xl shadow-2xl shadow-[#D4AF37]/20 hover:bg-[#B8962E] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-12 items-start">
          <div className="col-span-4 sticky top-0">
            <div className="bg-[#161b22] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5">
              <div
                onClick={() => { setIsCohortSelected(true); setSelectedWeek(null); setSelectedLesson(null); setSelectedTopic(null); }}
                className={`p-8 border-b border-white/5 flex items-center justify-between cursor-pointer group transition-all ${isCohortSelected ? 'bg-[#D4AF37]/5' : 'bg-black/20'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg transition-all ${isCohortSelected ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_#D4AF37]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isCohortSelected ? 'text-white' : 'text-slate-300'}`}>Curriculum Explorer</h2>
                </div>
              </div>

              <div className="p-8 space-y-3">
                {structure.weeks.map(week => (
                  <TreeWeek
                    key={week.id}
                    week={week}
                    isActive={selectedWeek?.id === week.id}
                    onAddModule={() => handleAddModule(week.id)}
                    onAddLesson={handleAddLesson}
                    onAddTopic={handleAddTopic}
                    onDelete={handleDelete}
                    onEditWeek={() => { setSelectedWeek(week); setSelectedLesson(null); setSelectedTopic(null); setIsCohortSelected(false); setIsWeekDrawerOpen(true); }}
                    onSelectWeek={(w) => { setSelectedWeek(w); setSelectedLesson(null); setSelectedTopic(null); setIsCohortSelected(false); }}
                    onSelectLesson={(l) => { setSelectedLesson(l); setSelectedWeek(null); setSelectedTopic(null); setIsCohortSelected(false); setActiveTab('overview'); }}
                    onSelectTopic={(l, t) => { setSelectedLesson(l); setSelectedWeek(null); setSelectedTopic(t); setIsCohortSelected(false); setActiveTab('topics'); }}
                    activeLessonId={selectedLesson?.id}
                    activeTopicId={selectedTopic?.id}
                    labelOverride="Module"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-8">
            {isCohortSelected ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_15px_#D4AF37]" />
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {structure.title} Settings
                      </h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                        Primary Course Metadata & Global Parameters
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161b22] border border-white/5 rounded-[3rem] p-12 shadow-2xl ring-1 ring-white/5 space-y-12">
                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#D4AF37]/10 rounded-lg"><Globe className="w-5 h-5 text-[#D4AF37]" /></div>
                      <h4 className="text-xs font-black text-white uppercase tracking-[0.4em]">Primary Metadata</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Course Alias</label>
                        <input
                          type="text"
                          value={structure.title}
                          onChange={e => onStructureUpdate({ ...structure, title: e.target.value })}
                          className="w-full bg-black/40 border border-white/5 px-8 py-5 rounded-2xl text-xl font-black text-white outline-none focus:border-[#D4AF37]/50 shadow-inner"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            ) : selectedWeek ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_15px_#D4AF37]" />
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                        Module {selectedWeek.number}: {selectedWeek.title || 'Drafting'}
                      </h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                        Section Configuration for this module
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161b22] border border-white/5 rounded-[3rem] p-12 shadow-2xl ring-1 ring-white/5 space-y-12">
                  <section className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#D4AF37]/10 rounded-lg"><Layout className="w-5 h-5 text-[#D4AF37]" /></div>
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.4em]">Course Sections</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenAIModal('module')}
                          className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" /> AI Generate Section
                        </button>
                        <button
                          onClick={() => handleAddModule(selectedWeek.id)}
                          className="px-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-[10px] font-black text-[#D4AF37] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
                        >
                          <Plus className="w-4 h-4" /> Add Section
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <SortableList<Module>
                        items={selectedWeek.modules}
                        getId={(m) => m.id}
                        onReorder={(items) => handleReorderModules(selectedWeek.id, items)}
                        renderItem={(module) => (
                          <ModuleCard
                            key={module.id}
                            module={module}
                            onEdit={() => setEditingModule(module)}
                            onClone={() => handleCloneModule(module.id, selectedWeek.id)}
                            onDelete={() => handleDelete('module', module.id)}
                          />
                        )}
                      />
                    </div>
                  </section>
                </div>
              </div>
            ) : selectedLesson ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_15px_#D4AF37]" />
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {selectedLesson.title}
                      </h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                        Configuring Lesson {selectedLesson.number}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreviewLesson?.(selectedLesson)}
                    className="px-6 py-3 bg-white/5 border border-[#D4AF37]/30 text-[10px] font-black uppercase text-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/10 transition-all flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Live Preview
                  </button>
                </div>

                <div className="bg-[#161b22] border border-white/5 rounded-[3rem] p-1 shadow-2xl overflow-hidden ring-1 ring-white/5">
                  <nav className="flex items-center gap-2 p-6 border-b border-white/5 bg-black/20">
                    {['overview', 'blocks', 'topics'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        {t === 'overview' ? 'Settings' : t === 'blocks' ? 'Content' : 'Topics'}
                      </button>
                    ))}
                  </nav>
                  <div className="p-10">
                    {activeTab === 'overview' && <LessonOverviewTab lesson={selectedLesson} onUpdate={updateSelectedLesson} onNext={() => setActiveTab('blocks')} />}
                    {activeTab === 'blocks' && viewMode === 'main' && (
                      <LessonBlocksEditor
                        lesson={selectedLesson}
                        onUpdate={updateSelectedLesson}
                        onNext={() => setActiveTab('topics')}
                        onEditQuiz={handleEditQuizBlock}
                        onEditAssignment={handleEditAssignmentBlock}
                        onEditLive={handleEditLiveBlock}
                        onAIGenerate={handleOpenAIModal}
                      />
                    )}
                    {activeTab === 'topics' && !selectedTopic && (
                      <TopicsListEditor
                        lesson={selectedLesson}
                        onSelectTopic={setSelectedTopic}
                        onDeleteTopic={(tid) => handleDelete('topic', tid)}
                        onAddTopic={() => handleAddTopic(selectedLesson.id)}
                        onAIGenerate={() => handleOpenAIModal('module', `Generate more topics for lesson: ${selectedLesson.title}`)}
                      />
                    )}
                    {activeTab === 'topics' && selectedTopic && (
                      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0b]/50">
                        <div className="max-w-7xl mx-auto p-12">
                          <TopicEditor
                            key={selectedTopic.id}
                            topic={selectedTopic}
                            onSave={handleSaveTopic}
                            onBack={() => {
                              setSelectedTopic(null);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[700px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] text-slate-800 opacity-20">
                <BookOpen className="w-32 h-32 mb-10" />
                <p className="text-5xl font-black italic uppercase tracking-tighter">Ready to Build</p>
                <p className="text-xs font-bold uppercase tracking-[0.4em] mt-4">Select an element from the explorer to begin configuration.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedWeek && (
        <WeekEditorDrawer
          week={selectedWeek}
          isOpen={isWeekDrawerOpen}
          onClose={() => setIsWeekDrawerOpen(false)}
          onSave={updateSelectedWeek}
        />
      )}

      {editingModule && (
        <ModuleEditorDrawer
          module={editingModule}
          weeks={structure.weeks}
          isOpen={!!editingModule}
          onClose={() => setEditingModule(null)}
          onSave={handleUpdateModule}
          onDelete={() => handleDelete('module', editingModule.id)}
        />
      )}

      {viewMode === 'quiz-editor' && activeQuizBlockId && selectedLesson && (
        <div className="fixed inset-0 z-[150] bg-[#0a0a0b] animate-in fade-in duration-300">
          <QuizBuilder
            block={selectedLesson.lessonBlocks.find(b => b.id === activeQuizBlockId)!}
            onSave={(data) => handleSaveMatrix(data, 'quiz')}
            onCancel={() => { setViewMode('main'); setActiveQuizBlockId(null); }}
          />
        </div>
      )}

      {viewMode === 'assignment-editor' && activeAssignmentBlockId && selectedLesson && (
        <div className="fixed inset-0 z-[150] bg-[#0a0a0b] animate-in fade-in duration-300">
          <AssignmentBuilder
            block={selectedLesson.lessonBlocks.find(b => b.id === activeAssignmentBlockId)!}
            onSave={(data) => handleSaveMatrix(data, 'assignment')}
            onCancel={() => { setViewMode('main'); setActiveAssignmentBlockId(null); }}
          />
        </div>
      )}

      {viewMode === 'live-editor' && activeLiveBlockId && selectedLesson && (
        <div className="fixed inset-0 z-[150] bg-[#0a0a0b] animate-in fade-in duration-300">
          <LiveSessionSetup
            block={selectedLesson.lessonBlocks.find(b => b.id === activeLiveBlockId)!}
            onSave={(data) => handleSaveMatrix(data, 'live')}
            onCancel={() => { setViewMode('main'); setActiveLiveBlockId(null); }}
          />
        </div>
      )}

      <AIGeneratorModal
        isOpen={aiModal.isOpen}
        type={aiModal.type}
        context={aiModal.context}
        topicTitle={aiModal.topicTitle}
        onClose={() => setAiModal({ ...aiModal, isOpen: false })}
        onGenerate={handleAIGenerated}
      />
    </div>
  );
};

const TreeWeek: React.FC<{
  week: Week;
  isActive: boolean;
  onAddModule: () => void;
  onAddLesson: (mid: string) => void;
  onAddTopic: (lid: string) => void;
  onDelete: (type: any, id: string) => void;
  onEditWeek: () => void;
  onSelectWeek: (w: Week) => void;
  onSelectLesson: (l: Lesson) => void;
  onSelectTopic: (l: Lesson, t: Topic) => void;
  activeLessonId?: string;
  activeTopicId?: string;
  labelOverride?: string;
}> = ({ week, isActive, onAddModule, onAddLesson, onAddTopic, onDelete, onEditWeek, onSelectWeek, onSelectLesson, onSelectTopic, activeLessonId, activeTopicId, labelOverride }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="space-y-1">
      <div
        className={`group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${isActive ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30' : 'hover:bg-white/5'
          }`}
        onClick={() => { setIsOpen(!isOpen); onSelectWeek(week); }}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isActive ? 'bg-[#D4AF37] border-white/20' : week.isFree ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
            {week.isFree ? <Unlock className={`w-5 h-5 ${isActive ? 'text-black' : 'text-emerald-500'}`} /> : <Calendar className={`w-5 h-5 ${isActive ? 'text-black' : 'text-blue-400'}`} />}
          </div>
          <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-[#D4AF37]' : 'text-white'}`}>
            {week.number === 0 ? 'Foundation' : `${labelOverride || 'Week'} ${week.number}`}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEditWeek(); }} className="p-2 text-slate-500 hover:text-[#D4AF37]"><Edit3 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); onAddModule(); }} className="p-2 text-slate-500 hover:text-white"><Plus className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete('week', week.id); }} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {isOpen && (
        <div className="pl-12 border-l border-white/5 ml-9 space-y-1 py-1">
          {week.modules.map(module => (
            <TreeModule
              key={module.id}
              module={module}
              onAddLesson={() => onAddLesson(module.id)}
              onAddTopic={onAddTopic}
              onDelete={onDelete}
              onSelectLesson={onSelectLesson}
              onSelectTopic={onSelectTopic}
              activeLessonId={activeLessonId}
              activeTopicId={activeTopicId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeModule: React.FC<{
  module: Module;
  onAddLesson: () => void;
  onAddTopic: (lid: string) => void;
  onDelete: (type: any, id: string) => void;
  onSelectLesson: (l: Lesson) => void;
  onSelectTopic: (l: Lesson, t: Topic) => void;
  activeLessonId?: string;
  activeTopicId?: string;
}> = ({ module, onAddLesson, onAddTopic, onDelete, onSelectLesson, onSelectTopic, activeLessonId, activeTopicId }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="space-y-1">
      <div className="group flex items-center justify-between p-3 rounded-2xl hover:bg-black/20 transition-all cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
            <Grid className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Section</span>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{module.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onAddLesson(); }} className="p-1.5 text-slate-600 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete('module', module.id); }} className="p-1.5 text-slate-600 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {isOpen && (
        <div className="pl-10 border-l border-white/5 ml-7 space-y-1 py-1">
          {module.lessons.map(lesson => (
            <TreeLesson
              key={lesson.id}
              lesson={lesson}
              onAddTopic={() => onAddTopic(lesson.id)}
              onDelete={() => onDelete('lesson', lesson.id)}
              onDeleteTopic={(tid) => onDelete('topic', tid)}
              onSelect={() => onSelectLesson(lesson)}
              onSelectTopic={(t) => onSelectTopic(lesson, t)}
              isActive={activeLessonId === lesson.id}
              activeTopicId={activeTopicId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeLesson: React.FC<{
  lesson: Lesson;
  onAddTopic: () => void;
  onDelete: () => void;
  onDeleteTopic: (tid: string) => void;
  onSelect: () => void;
  onSelectTopic: (t: Topic) => void;
  isActive?: boolean;
  activeTopicId?: string;
}> = ({ lesson, onAddTopic, onDelete, onDeleteTopic, onSelect, onSelectTopic, isActive, activeTopicId }) => {
  const [isOpen, setIsOpen] = useState(isActive || (lesson.topics || []).some(t => t.id === activeTopicId));

  return (
    <div className="space-y-1">
      <div className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#D4AF37]/5 transition-all">
        <div className="flex items-center gap-2 flex-1">
          {(lesson.topics || []).length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              className="p-1 hover:bg-white/5 rounded transition-all"
            >
              {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
            </button>
          )}
          <div
            className="flex items-center gap-4 flex-1 cursor-pointer"
            onClick={onSelect}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isActive ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]/30' : lesson.isFree ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
              {lesson.isFree ? <Unlock className={`w-3 h-3 ${isActive ? 'text-black' : 'text-emerald-500'}`} /> : <FileText className={`w-3 h-3 ${isActive ? 'text-black' : 'text-orange-500'}`} />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-all ${isActive ? 'text-[#D4AF37]' : 'text-slate-400 group-hover:text-white'}`}>{lesson.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onAddTopic(); }} className="p-1.5 text-slate-600 hover:text-[#D4AF37]"><Plus className="w-3 h-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-slate-600 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>

      {isOpen && (lesson.topics || []).length > 0 && (
        <div className="pl-10 border-l border-white/5 ml-8 space-y-1 py-1">
          {(lesson.topics || []).map(topic => (
            <TreeTopic
              key={topic.id}
              topic={topic}
              isActive={activeTopicId === topic.id}
              onSelect={() => onSelectTopic(topic)}
              onDelete={() => onDeleteTopic(topic.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeTopic: React.FC<{ topic: Topic; isActive: boolean; onSelect: () => void; onDelete: () => void }> = ({ topic, isActive, onSelect, onDelete }) => (
  <div className={`group flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${isActive ? 'bg-[#D4AF37]/10' : 'hover:bg-blue-500/5'}`}>
    <div className="flex items-center gap-4 flex-1" onClick={onSelect}>
      <div className={`w-4 h-4 rounded flex items-center justify-center border ${isActive ? 'bg-[#D4AF37] border-white/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
        <Target className={`w-2.5 h-2.5 ${isActive ? 'text-black' : 'text-blue-500'}`} />
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest transition-all ${isActive ? 'text-[#D4AF37]' : 'text-slate-500 group-hover:text-blue-400'}`}>{topic.title}</span>
    </div>
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-700 hover:text-red-500"><Trash2 className="w-2.5 h-2.5" /></button>
    </div>
  </div>
);

const LessonOverviewTab: React.FC<{
  lesson: Lesson;
  onUpdate: (updates: Partial<Lesson>) => void;
  onNext: () => void;
}> = ({ lesson, onUpdate, onNext }) => (
  <div className="grid grid-cols-1 gap-12 animate-in fade-in duration-500">
    <div className="space-y-8">
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Lesson Name</label>
        <input
          type="text"
          value={lesson.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full bg-black/40 border border-white/5 px-8 py-5 rounded-2xl text-xl font-black text-white outline-none focus:border-[#D4AF37]/50 shadow-inner"
        />
      </div>

      <div className="flex items-center justify-between p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-emerald-500" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Free Introductory Access</h4>
          </div>
          <p className="text-[8px] text-slate-500 font-bold uppercase">Open this lesson for the foundation tier</p>
        </div>
        <button
          onClick={() => onUpdate({ isFree: !lesson.isFree })}
          className={`w-12 h-6 rounded-full relative transition-all duration-500 ${lesson.isFree ? 'bg-emerald-500' : 'bg-slate-800'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${lesson.isFree ? 'right-1' : 'left-1'}`} />
        </button>
      </div>
    </div>
    <button onClick={onNext} className="w-full py-6 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[11px] font-black uppercase tracking-[0.5em] rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all group shadow-2xl">
      Continue to Content <ArrowRight className="w-4 h-4 inline ml-3 group-hover:translate-x-2 transition-transform" />
    </button>
  </div>
);

const TopicsListEditor: React.FC<{
  lesson: Lesson;
  onSelectTopic: (t: Topic) => void;
  onDeleteTopic: (topicId: string) => void;
  onAddTopic: () => void;
  onAIGenerate?: () => void;
}> = ({ lesson, onSelectTopic, onDeleteTopic, onAddTopic, onAIGenerate }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <List className="w-5 h-5 text-blue-400" />
        <h3 className="text-xs font-black text-white uppercase tracking-widest">Active Topics</h3>
      </div>
      <div className="flex items-center gap-3">
        {onAIGenerate && (
          <button
            onClick={onAIGenerate}
            className="px-6 py-2.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-xl border border-indigo-500/20 flex items-center gap-2 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10"
          >
            <Sparkles className="w-4 h-4" /> AI Generate Topics
          </button>
        )}
        <button onClick={onAddTopic} className="px-6 py-2.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black uppercase rounded-xl border border-[#D4AF37]/20 flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-all">
          <Plus className="w-4 h-4" /> New Topic
        </button>
      </div>
    </div>
    <div className="space-y-4">
      {(lesson.topics || []).map(t => (
        <div key={t.id} className="p-6 bg-black/20 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center font-black italic text-[#D4AF37]">T</div>
            <span className="text-xs font-black text-white uppercase tracking-widest">{t.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onSelectTopic(t)} className="px-6 py-2 rounded-xl bg-white/5 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all">Edit Content</button>
            <button onClick={() => onDeleteTopic(t.id)} className="p-2.5 text-slate-600 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LoadingState = () => (
  <div className="h-screen flex items-center justify-center bg-[#0a0a0b]">
    <div className="flex flex-col items-center gap-8">
      <div className="w-20 h-20 border-[8px] border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin shadow-[0_0_50px_rgba(212,175,55,0.1)]" />
      <span className="text-[12px] font-black text-[#D4AF37] uppercase tracking-[0.8em] animate-pulse">Initializing Designer</span>
    </div>
  </div>
);
