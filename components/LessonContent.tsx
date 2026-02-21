import React, { useState, useRef } from 'react';
import {
  Plus,
  Video,
  FileText,
  Activity,
  Target,
  Users,
  GripVertical,
  Trash2,
  ChevronDown,
  ExternalLink,
  Trophy,
  AlertTriangle,
  Settings,
  MousePointer2,
  ArrowRight,
  Upload,
  CheckCircle2,
  Loader2,
  Youtube,
  Cloud,
  Globe,
  Link as LinkIcon,
  Terminal,
  Radio,
  Tv,
  Eye,
  RefreshCw,
  Zap as ZapIcon,
  Image as ImageIcon,
  FileVideo,
  HardDrive,
  X,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { ConfirmationModal } from './common/ConfirmationModal';
import { useToast } from '../lib/ToastContext';
import { RichTextEditor } from './common/RichTextEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lesson, LessonBlock, LessonBlockType } from '../types';
import { apiClient, normalizeUrl } from '../lib/apiClient';

interface LessonBlocksEditorProps {
  lesson: Lesson;
  onUpdate: (updatedLesson: Lesson) => void;
  onNext: () => void;
  onEditQuiz: (blockId: string) => void;
  onEditAssignment: (blockId: string) => void;
  onEditLive: (blockId: string) => void;
  onAIGenerate: (type: 'quiz' | 'assignment', context: string) => void;
}

export const LessonBlocksEditor: React.FC<LessonBlocksEditorProps> = ({
  lesson,
  onUpdate,
  onNext,
  onEditQuiz,
  onEditAssignment,
  onEditLive,
  onAIGenerate
}) => {
  const { addToast } = useToast();
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activePaletteItem, setActivePaletteItem] = useState<LessonBlockType | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createNewBlock = (type: LessonBlockType): LessonBlock => ({
    id: `block-${Date.now()}`,
    type,
    title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Block`,
    payload: type === 'video' ? {
      sourceType: 'youtube',
      url: '',
      assetId: '',
      posterUrl: '',
      minWatchPercent: 90,
      autoPlay: false,
      loop: false,
      isHls: false
    } :
      type === 'quiz' ? { questions: [], passScore: 70, attemptsAllowed: 2 } :
        type === 'assignment' ? { instructionsHtml: '', maxPoints: 10, submissionType: 'file' } :
          type === 'live' ? { joinUrl: '', startAt: '', duration: 60, platform: 'zoom' } : {},
    coinReward: 50,
    required: true
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePaletteItem(null);

    if (!over) return;

    if (active.id.toString().startsWith('palette-')) {
      const type = active.data.current?.type as LessonBlockType;
      const newBlock = createNewBlock(type);

      const safeBlocks = Array.isArray(lesson.lessonBlocks) ? lesson.lessonBlocks : [];
      const overIndex = safeBlocks.findIndex((b) => b.id === over.id);
      const newBlocks = [...safeBlocks];

      if (overIndex !== -1) {
        newBlocks.splice(overIndex, 0, newBlock);
      } else {
        newBlocks.push(newBlock);
      }

      onUpdate({ ...lesson, lessonBlocks: newBlocks });
      setActiveBlockId(newBlock.id);
      addToast({
        title: 'Block Added',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} block added to lesson`,
        type: 'success'
      });
      return;
    }

    if (active.id !== over.id) {
      const safeBlocks = Array.isArray(lesson.lessonBlocks) ? lesson.lessonBlocks : [];
      const oldIndex = safeBlocks.findIndex((b) => b.id === active.id);
      const newIndex = safeBlocks.findIndex((b) => b.id === over.id);
      const newBlocks = arrayMove(safeBlocks, oldIndex, newIndex);
      onUpdate({ ...lesson, lessonBlocks: newBlocks });
    }
  };

  const addBlockByClick = (type: LessonBlockType) => {
    const safeBlocks = Array.isArray(lesson.lessonBlocks) ? lesson.lessonBlocks : [];
    const newBlock = createNewBlock(type);
    onUpdate({ ...lesson, lessonBlocks: [...safeBlocks, newBlock] });
    setActiveBlockId(newBlock.id);
    setShowQuickAdd(false);
    addToast({
      title: 'Block Added',
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} block added to lesson`,
      type: 'success'
    });
  };

  /* State for confirmation modal */
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const deleteBlock = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      const safeBlocks = Array.isArray(lesson.lessonBlocks) ? lesson.lessonBlocks : [];
      onUpdate({ ...lesson, lessonBlocks: safeBlocks.filter(b => b.id !== deleteConfirmId) });
      if (activeBlockId === deleteConfirmId) setActiveBlockId(null);
      setDeleteConfirmId(null);
      addToast({
        title: 'Block Deleted',
        description: 'Content block removed from lesson',
        type: 'success'
      });
    }
  };

  const updateBlock = (id: string, updates: Partial<LessonBlock>) => {
    const safeBlocks = Array.isArray(lesson.lessonBlocks) ? lesson.lessonBlocks : [];
    const updatedBlocks = safeBlocks.map(b =>
      b.id === id ? { ...b, ...updates } : b
    );
    onUpdate({ ...lesson, lessonBlocks: updatedBlocks });
  };

  const updateBlockPayload = (id: string, payloadUpdates: any) => {
    const safeBlocks = Array.isArray(lesson.lessonBlocks) ? lesson.lessonBlocks : [];
    const block = safeBlocks.find(b => b.id === id);
    if (block) {
      updateBlock(id, { payload: { ...block.payload, ...payloadUpdates } });
    }
  };

  return (
    <div className="space-y-12 py-4 animate-in fade-in duration-500">
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Remove Content Block?"
        description="This action cannot be undone. The content configured in this block will be permanently lost."
        confirmLabel="Delete Block"
        variant="danger"
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActivePaletteItem(e.active.data.current?.type)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Lesson Content Sequence</h3>
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Active Curriculum View</p>
            </div>

            <SortableContext
              items={(Array.isArray(lesson.lessonBlocks) ? lesson.lessonBlocks : []).map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 min-h-[400px]">
                {(!Array.isArray(lesson.lessonBlocks) || lesson.lessonBlocks.length === 0) ? (
                  <div className="p-24 border-2 border-dashed border-white/5 rounded-[3rem] text-center flex flex-col items-center bg-black/10 group">
                    <BookOpen className="w-16 h-16 text-slate-800 mb-8 group-hover:scale-110 transition-transform group-hover:text-slate-700" />
                    <h4 className="text-2xl font-black text-slate-600 italic uppercase tracking-tighter mb-2">No Content Yet</h4>
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em] max-w-xs leading-relaxed">
                      Add content blocks using the button below or drag them from the library.
                    </p>
                  </div>
                ) : (
                  (Array.isArray(lesson.lessonBlocks) ? lesson.lessonBlocks : []).map((block, index) => (
                    <SortableBlockItem
                      key={block.id}
                      block={block}
                      index={index}
                      isActive={activeBlockId === block.id}
                      onToggle={() => setActiveBlockId(activeBlockId === block.id ? null : block.id)}
                      onDelete={() => deleteBlock(block.id)}
                      onUpdate={(u) => updateBlock(block.id, u)}
                      onUpdatePayload={(up) => updateBlockPayload(block.id, up)}
                      onEditQuiz={() => onEditQuiz(block.id)}
                      onEditAssignment={() => onEditAssignment(block.id)}
                      onEditLive={() => onEditLive(block.id)}
                      onAIGenerate={onAIGenerate}
                    />
                  ))
                )}

                {/* ADD NEW BLOCK UI */}
                <div className="pt-8 flex flex-col items-center gap-6">
                  {!showQuickAdd ? (
                    <button
                      onClick={() => setShowQuickAdd(true)}
                      className="group flex items-center gap-4 px-12 py-6 bg-[#D4AF37]/5 border border-dashed border-[#D4AF37]/30 rounded-[2.5rem] text-[#D4AF37] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all active:scale-95 shadow-xl hover:shadow-[#D4AF37]/10"
                    >
                      <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
                      Add New Content Block
                    </button>
                  ) : (
                    <div className="w-full bg-[#121214] border border-[#D4AF37]/30 rounded-[3rem] p-12 animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden ring-1 ring-[#D4AF37]/20">
                      <div className="absolute top-8 right-8">
                        <button
                          onClick={() => setShowQuickAdd(false)}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all hover:bg-white/10"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-center mb-12">
                        <h4 className="text-lg font-black text-white uppercase tracking-[0.3em] italic">Select Block Type</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Choose a block to add to this lesson...</p>
                      </div>
                      <div className="grid grid-cols-5 gap-8">
                        <QuickAddButton icon={Video} label="Video" color="text-red-400" onClick={() => addBlockByClick('video')} />
                        <QuickAddButton icon={FileText} label="Text" color="text-blue-400" onClick={() => addBlockByClick('text')} />
                        <QuickAddButton icon={Activity} label="Quiz" color="text-[#D4AF37]" onClick={() => addBlockByClick('quiz')} />
                        <QuickAddButton icon={Target} label="Assignment" color="text-emerald-400" onClick={() => addBlockByClick('assignment')} />
                        <QuickAddButton icon={Users} label="Live Session" color="text-blue-400" onClick={() => addBlockByClick('live')} />
                      </div>
                      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            </SortableContext>

            <div className="flex justify-end pt-12 border-t border-white/5">
              <button
                onClick={onNext}
                type="button"
                className="px-12 py-5 bg-white/5 border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all group flex items-center gap-4 active:scale-95"
              >
                Save Lesson Content
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="col-span-4 space-y-8">
            <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl sticky top-32 ring-1 ring-white/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                  <Plus className="w-4 h-4 text-[#D4AF37]" /> Block Library
                </h3>
                <div className="p-1.5 bg-[#D4AF37]/10 rounded border border-[#D4AF37]/20">
                  <MousePointer2 className="w-3 h-3 text-[#D4AF37]" />
                </div>
              </div>

              <div className="space-y-3">
                <DraggablePaletteItem type="video" icon={Video} label="Video Content" color="text-red-400" onClick={() => addBlockByClick('video')} />
                <DraggablePaletteItem type="text" icon={FileText} label="Reading Material" color="text-blue-400" onClick={() => addBlockByClick('text')} />
                <DraggablePaletteItem type="quiz" icon={Activity} label="Knowledge Quiz" color="text-[#D4AF37]" onClick={() => addBlockByClick('quiz')} />
                <DraggablePaletteItem type="assignment" icon={Target} label="Assignment" color="text-emerald-400" onClick={() => addBlockByClick('assignment')} />
                <DraggablePaletteItem type="live" icon={Users} label="Live Workshop" color="text-blue-400" onClick={() => addBlockByClick('live')} />
              </div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } }
          }),
        }}>
          {activePaletteItem ? (
            <div className="w-[300px] flex items-center justify-between p-5 bg-[#121214] border border-[#D4AF37] rounded-3xl shadow-[0_20px_50px_rgba(212,175,55,0.3)] opacity-95 scale-105 pointer-events-none">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-900 border border-white/5 text-[#D4AF37]">
                  {activePaletteItem === 'video' ? <Video className="w-5 h-5" /> :
                    activePaletteItem === 'text' ? <FileText className="w-5 h-5" /> :
                      activePaletteItem === 'quiz' ? <Activity className="w-5 h-5" /> :
                        activePaletteItem === 'assignment' ? <Target className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  Add {activePaletteItem.toUpperCase()} Block
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

const QuickAddButton: React.FC<{ icon: any; label: string; color: string; onClick: () => void }> = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-8 bg-black/20 border border-white/5 rounded-[2.5rem] hover:border-[#D4AF37]/50 transition-all group active:scale-95 shadow-inner hover:bg-[#D4AF37]/5"
  >
    <div className={`p-4 bg-slate-900 border border-white/5 rounded-2xl group-hover:scale-110 transition-transform mb-4 shadow-2xl ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{label}</span>
  </button>
);

const DraggablePaletteItem: React.FC<{
  type: LessonBlockType;
  icon: any;
  label: string;
  onClick: () => void;
  color: string;
}> = ({ type, icon: Icon, label, onClick, color }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type }
  });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} {...listeners} {...attributes}>
      <button
        onClick={onClick}
        type="button"
        className={`w-full flex items-center justify-between p-5 bg-black/20 border border-white/5 rounded-2xl hover:border-[#D4AF37]/30 transition-all group active:scale-95 shadow-sm ${isDragging ? 'opacity-0' : ''}`}
      >
        <div className="flex items-center gap-4 text-left">
          <div className={`p-3 rounded-xl bg-slate-900 border border-white/5 transition-transform group-hover:scale-110 ${color} shadow-lg`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
        </div>
        <GripVertical className="w-4 h-4 text-slate-800 group-hover:text-[#D4AF37]" />
      </button>
    </div>
  );
};

const SortableBlockItem: React.FC<{
  block: LessonBlock;
  index: number;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<LessonBlock>) => void;
  onUpdatePayload: (updates: any) => void;
  onEditQuiz: () => void;
  onEditAssignment: () => void;
  onEditLive: () => void;
  onAIGenerate: (type: 'quiz' | 'assignment', context: string) => void;
}> = ({ block, index, isActive, onToggle, onDelete, onUpdate, onUpdatePayload, onEditQuiz, onEditAssignment, onEditLive, onAIGenerate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.6 : 1 };

  const { addToast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosterUploading, setIsPosterUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const handleInternalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'video');

      setUploadProgress(50);

      const res = await apiClient.post('/api/admin/media/upload', formData);

      setUploadProgress(100);

      if (res.url) {
        onUpdatePayload({
          url: res.url,
          assetId: res.path, // Store path as asset ID just in case
          fileName: res.originalName || file.name,
          sourceType: 'internal'
        });
        addToast({
          title: 'Video Uploaded',
          description: 'Video file uploaded successfully',
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Upload failed", error);
      addToast({
        title: 'Upload Failed',
        description: 'Failed to upload video. Please check the file size and try again.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsPosterUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const res = await apiClient.post('/api/admin/media/upload', formData);

      if (res.url) {
        onUpdatePayload({ posterUrl: res.url });
        addToast({
          title: 'Poster Updated',
          description: 'Video poster image uploaded successfully',
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Poster upload failed", error);
      addToast({
        title: 'Upload Failed',
        description: 'Failed to upload poster image.',
        type: 'error'
      });
    } finally {
      setIsPosterUploading(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className={`bg-[#121214] border rounded-[2rem] transition-all overflow-hidden ${isActive ? 'border-[#D4AF37]/50 shadow-[0_0_50px_rgba(212,175,55,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
        <div className="flex items-center justify-between p-6 bg-black/10">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <button {...attributes} {...listeners} className="p-2 cursor-grab text-slate-700 hover:text-slate-400 transition-colors shrink-0">
              <GripVertical className="w-4 h-4" />
            </button>
            <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center font-black italic tracking-tighter text-lg shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-slate-600'}`}>
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-4 text-left">
                <h4 className="text-sm font-black text-white uppercase tracking-widest truncate">
                  {index + 1}. {block.title}
                </h4>
                {block.required && (
                  <span className="text-[9px] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20 text-[#D4AF37] uppercase font-black tracking-[0.2em] shrink-0">
                    Mandatory
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-600 uppercase font-bold tracking-[0.3em] mt-1.5">Block Type: {block.type.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 pl-4">
            <button
              onClick={() => onUpdate({ required: !block.required })}
              title={block.required ? "Set as Optional" : "Set as Mandatory"}
              className={`p-2 rounded-lg transition-all ${block.required ? 'text-[#D4AF37]' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              type="button"
              className={`p-3 rounded-xl transition-all ${isActive ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isActive ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              type="button"
              className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isActive && (
          <div className="p-10 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-4 duration-500 space-y-10">
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Block Label</label>
                <input
                  type="text"
                  value={block.title}
                  onChange={e => onUpdate({ title: e.target.value })}
                  className="w-full bg-[#0a0a0b] border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-[#D4AF37]/40 shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Points Awarded</label>
                <div className="relative">
                  <input
                    type="number"
                    value={block.coinReward}
                    onChange={e => onUpdate({ coinReward: Number(e.target.value) })}
                    className="w-full bg-[#0a0a0b] border border-white/5 px-6 py-4 rounded-2xl text-base font-black text-[#D4AF37] italic outline-none focus:border-[#D4AF37]/40 shadow-inner"
                  />
                  <Trophy className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800" />
                </div>
              </div>
            </div>

            {block.type === 'video' && (
              <div className="grid grid-cols-12 gap-10 pt-6 border-t border-white/5">
                <div className="col-span-7 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Video Provider</label>
                      <div className="relative group">
                        <select
                          value={block.payload.sourceType}
                          onChange={(e) => onUpdatePayload({ sourceType: e.target.value, url: '', assetId: '', fileName: '' })}
                          className="w-full bg-[#0a0a0b] border border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-[#D4AF37]/40 appearance-none cursor-pointer"
                        >
                          <option value="youtube">YouTube</option>
                          <option value="vimeo">Vimeo</option>
                          <option value="direct">Direct URL (MP4/HLS)</option>
                          <option value="internal">Local Upload</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none group-hover:text-[#D4AF37] transition-colors" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Playback Options</label>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {block.payload.sourceType === 'internal' ? 'Storage' : 'Link'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-slate-600 font-black">AUTOPLAY</span>
                          <button
                            onClick={() => onUpdatePayload({ autoPlay: !block.payload.autoPlay })}
                            className={`w-8 h-4 rounded-full relative transition-all ${block.payload.autoPlay ? 'bg-[#D4AF37]' : 'bg-slate-800'}`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${block.payload.autoPlay ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {block.payload.sourceType === 'internal' ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Upload Video</label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleInternalUpload}
                        accept="video/*"
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-[1.5rem] p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${isUploading ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/5 bg-black/40 hover:border-[#D4AF37]/30 hover:bg-black/60'
                          }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                            <div className="w-full max-w-xs space-y-2">
                              <div className="flex justify-between text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                                <div className="h-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          </>
                        ) : block.payload.fileName ? (
                          <>
                            <div className="p-4 bg-[#D4AF37]/10 rounded-2xl">
                              <FileVideo className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-white uppercase tracking-widest truncate max-w-sm">{block.payload.fileName}</p>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Ready • Click to change</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                              <Upload className="w-8 h-8 text-slate-600 group-hover:text-[#D4AF37]" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white">Choose Video File</p>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">MP4, WEBM, or MOV supported</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">
                          {block.payload.sourceType === 'direct' ? 'Video URL (MP4 / .m3u8)' : 'Video URL or Asset ID'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={block.payload.url || block.payload.assetId || ''}
                            onChange={e => onUpdatePayload({ url: e.target.value, assetId: e.target.value })}
                            className="w-full bg-[#0a0a0b] border border-white/5 px-8 py-5 rounded-2xl text-xs font-bold text-blue-400 outline-none focus:border-[#D4AF37]/50 shadow-inner pr-16"
                            placeholder={block.payload.sourceType === 'youtube' ? "e.g. dQw4w9WgXcQ" : "Paste URL or ID here..."}
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            {block.payload.sourceType === 'youtube' ? <Youtube className="w-5 h-5 text-red-500" /> : <LinkIcon className="w-5 h-5 text-slate-700" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-5 space-y-6">
                  <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-[#D4AF37]" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Video Controls</h4>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {block.payload.sourceType === 'direct' && (
                        <div className="pb-4 border-b border-white/5">
                          <ToggleItemSmall
                            label="HLS Adaptive Stream"
                            active={block.payload.isHls}
                            onClick={() => onUpdatePayload({ isHls: !block.payload.isHls })}
                          />
                        </div>
                      )}
                      <ToggleItemSmall label="Loop Video" active={block.payload.loop} onClick={() => onUpdatePayload({ loop: !block.payload.loop })} />
                      <div className="pt-4 border-t border-white/5">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Min. Completion (%)</label>
                        <input
                          type="range"
                          min="0" max="100"
                          value={block.payload.minWatchPercent}
                          onChange={e => onUpdatePayload({ minWatchPercent: Number(e.target.value) })}
                          className="w-full accent-[#D4AF37] bg-black h-1 rounded-full appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-2 text-[8px] font-black text-[#D4AF37]">
                          <span>0%</span>
                          <span>{block.payload.minWatchPercent}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Poster Image</label>
                      <button
                        onClick={() => posterInputRef.current?.click()}
                        className="text-[9px] font-black text-[#D4AF37] uppercase hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={posterInputRef}
                      onChange={handlePosterUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => !block.payload.posterUrl && posterInputRef.current?.click()}
                      className="aspect-video bg-black/60 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center relative cursor-pointer group/poster"
                    >
                      {isPosterUploading ? (
                        <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                      ) : block.payload.posterUrl ? (
                        <>
                          <img src={normalizeUrl(block.payload.posterUrl)} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black text-white uppercase">Replace Image</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-6 h-6 text-slate-800 mx-auto mb-2" />
                          <span className="text-[8px] font-black text-slate-600 uppercase">Set Poster</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {block.type === 'text' && (
              <div className="space-y-3 pt-6 border-t border-white/5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Content Editor (Rich Text)</label>
                <RichTextEditor
                  content={block.payload.content || ''}
                  onChange={content => onUpdatePayload({ content })}
                  placeholder="Enter your lesson content here..."
                />
              </div>
            )}

            {(block.type === 'quiz' || block.type === 'assignment' || block.type === 'live') && (
              <div className="pt-10 border-t border-white/5 flex flex-col items-center justify-center py-20 bg-black/20 rounded-[2.5rem] border border-dashed border-white/10 group">
                <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform">
                  {block.type === 'quiz' ? <Activity className="w-10 h-10 text-[#D4AF37]" /> :
                    block.type === 'assignment' ? <Target className="w-10 h-10 text-emerald-400" /> :
                      <Users className="w-10 h-10 text-blue-400" />}
                </div>
                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Block Not Configured</h4>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-10">Configure the content and settings for this {block.type}.</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onAIGenerate(block.type as any, `Generate a ${block.type} for lesson: ${block.title}`)}
                    className="px-6 py-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/10 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" /> AI Generate {block.type === 'quiz' ? 'Questions' : 'Task'}
                  </button>
                  <button
                    onClick={() => block.type === 'quiz' ? onEditQuiz() : block.type === 'assignment' ? onEditAssignment() : onEditLive()}
                    className="px-6 py-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-3 shadow-2xl active:scale-95"
                  >
                    <Settings className="w-4 h-4" /> Open Configuration
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ToggleItemSmall: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <div className="flex items-center justify-between">
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    <button
      onClick={onClick}
      className={`w-8 h-4 rounded-full relative transition-all ${active ? 'bg-[#D4AF37]' : 'bg-slate-800'}`}
    >
      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  </div>
);
