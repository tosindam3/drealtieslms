import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Video,
  Type,
  Image as ImageIcon,
  GripVertical,
  Trash2,
  Save,
  Monitor,
  Layout,
  Layers,
  ChevronDown,
  X,
  BookOpen,
  FileText,
  CheckSquare,
  Upload,
  FileVideo,
  Loader2
} from 'lucide-react';
import { RichTextEditor } from '../common/RichTextEditor';
import { Topic, TopicBlock, TopicBlockType } from '../../types';
import { useToast } from '../../lib/ToastContext';
import { apiClient, normalizeUrl } from '../../lib/apiClient';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TopicEditorProps {
  topic: Topic;
  onBack: () => void;
  onSave: (updatedTopic: Topic) => void;
}

export const TopicEditor: React.FC<TopicEditorProps> = ({ topic, onBack, onSave }) => {
  const [formData, setFormData] = useState<Topic>(topic);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  React.useEffect(() => {
    setFormData(topic);
  }, [topic]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      addToast({
        title: 'Topic Synchronized',
        description: 'The topic content has been successfully persisted to the curriculum database.',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to save topic:', error);
      addToast({
        title: 'Synchronization Failed',
        description: 'We encountered an error while attempting to persist the topic. Please verify your connection.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.blocks.findIndex((b) => b.id === active.id);
      const newIndex = formData.blocks.findIndex((b) => b.id === over.id);
      const newBlocks = arrayMove(formData.blocks, oldIndex, newIndex);
      setFormData({ ...formData, blocks: newBlocks });
    }
  };

  const addBlock = (type: TopicBlockType) => {
    const newBlock: TopicBlock = {
      id: `tb-${Date.now()}`,
      type,
      payload: type === 'video' ? { sourceType: 'url', url: '', posterUrl: '', enableManualCompletion: false } :
        type === 'text' ? { content: '' } :
          type === 'photo' ? { images: [] } : {}
    };
    setFormData({ ...formData, blocks: [...formData.blocks, newBlock] });
    setActiveBlockId(newBlock.id);
    addToast({
      title: 'Content Added',
      description: `New ${type.toUpperCase()} block added to topic`,
      type: 'success'
    });
  };

  const deleteBlock = (id: string) => {
    if (window.confirm("Are you sure you want to remove this content block?")) {
      const updatedBlocks = formData.blocks.filter(b => b.id !== id);
      setFormData({ ...formData, blocks: updatedBlocks });
      if (activeBlockId === id) setActiveBlockId(null);
      addToast({
        title: 'Content Removed',
        description: 'Block removed from topic',
        type: 'success'
      });
    }
  };

  const updateBlockPayload = (id: string, updates: any) => {
    setFormData({
      ...formData,
      blocks: formData.blocks.map(b => b.id === id ? { ...b, payload: { ...b.payload, ...updates } } : b)
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, thumbnailUrl: url });
    }
  };

  return (
    <div className="space-y-12 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            type="button"
            className="p-3 bg-white/5 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Topic Content Editor</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Arranging Learning Materials</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          type="button"
          className="px-8 py-3 bg-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-[#D4AF37]/10 hover:bg-[#B8962E] transition-all flex items-center gap-3 active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving Topic...' : 'Save Topic'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-8 space-y-10">
          {/* Topic Identity */}
          <section className="bg-[#121214] border border-slate-800 rounded-[2.5rem] p-8 shadow-inner">
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-[#D4AF37] mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Topic Definition</span>
              </div>
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Topic Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-black/30 border border-slate-800 px-6 py-5 rounded-2xl text-lg font-black text-white outline-none focus:border-[#D4AF37]/50 transition-all shadow-inner"
                      placeholder="Enter topic title..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Description / Objectives</label>
                    <RichTextEditor
                      content={formData.description || ''}
                      onChange={content => setFormData({ ...formData, description: content })}
                      placeholder="Summarize what the student will achieve in this topic..."
                    />
                  </div>
                </div>
                <div className="col-span-4 space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Main Thumbnail</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-black/40 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center group cursor-pointer hover:border-[#D4AF37]/30 transition-all relative overflow-hidden"
                  >
                    {formData.thumbnailUrl ? (
                      <img src={formData.thumbnailUrl} className="w-full h-full object-cover opacity-60" alt="Topic Thumbnail" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-700 group-hover:text-[#D4AF37] mb-2" />
                        <span className="text-[8px] font-black text-slate-600 uppercase">Set Asset</span>
                      </>
                    )}
                    {formData.thumbnailUrl && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Block Orchestration */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#D4AF37]">
                <Layout className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Content Blocks</span>
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={formData.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {formData.blocks.length === 0 ? (
                    <div className="p-20 border-2 border-dashed border-slate-800 rounded-[3rem] text-center bg-black/20 group">
                      <Monitor className="w-12 h-12 text-slate-800 mx-auto mb-6 group-hover:text-slate-700 transition-colors" />
                      <p className="text-xs font-black text-slate-600 uppercase tracking-[0.3em]">No content added to this topic yet</p>
                    </div>
                  ) : (
                    formData.blocks.map((block, index) => (
                      <SortableTopicBlock
                        key={block.id}
                        block={block}
                        index={index}
                        isActive={activeBlockId === block.id}
                        onToggle={() => setActiveBlockId(activeBlockId === block.id ? null : block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        onUpdate={(u) => updateBlockPayload(block.id, u)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        </div>

        {/* Sidebar: Palette */}
        <div className="col-span-4">
          <div className="sticky top-32 space-y-6">
            <div className="bg-[#121214] border border-slate-800 rounded-[2rem] p-8 shadow-2xl">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                <Plus className="w-4 h-4 text-[#D4AF37]" /> Add Content
              </h3>
              <div className="space-y-3">
                <PaletteItem
                  icon={Video}
                  label="Video Stream"
                  color="text-red-400"
                  onClick={() => addBlock('video')}
                />
                <PaletteItem
                  icon={Type}
                  label="Text Content"
                  color="text-blue-400"
                  onClick={() => addBlock('text')}
                />
                <PaletteItem
                  icon={ImageIcon}
                  label="Image Gallery"
                  color="text-emerald-400"
                  onClick={() => addBlock('photo')}
                />
              </div>
            </div>

            <div className="p-8 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-[2rem]">
              <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-2 flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" /> Editor Tip
              </h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                Topics are displayed to students in the order shown here. Use the drag handles to reorder content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaletteItem: React.FC<{ icon: any; label: string; color: string; onClick: () => void }> = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    type="button"
    className="w-full flex items-center justify-between p-4 bg-black/20 border border-slate-800 rounded-2xl hover:border-[#D4AF37]/30 transition-all group active:scale-95"
  >
    <div className="flex items-center gap-4 text-left">
      <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
    </div>
    <Plus className="w-3.5 h-3.5 text-slate-700 group-hover:text-[#D4AF37]" />
  </button>
);

const SortableTopicBlock: React.FC<{
  block: TopicBlock;
  index: number;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: any) => void;
}> = ({ block, index, isActive, onToggle, onDelete, onUpdate }) => {
  const { addToast } = useToast();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.6 : 1 };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosterUploading, setIsPosterUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);

  const handleInternalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Initialize Upload
      const initResponse = await apiClient.post('/api/admin/media/upload-init', {
        fileName: file.name
      });

      const { uploadId } = initResponse;
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 2. Upload Chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i.toString());
        formData.append('file', chunk);

        await apiClient.post('/api/admin/media/upload-chunk', formData);

        // Update progress
        const progress = Math.round(((i + 1) / totalChunks) * 90); // Up to 90%
        setUploadProgress(progress);
      }

      // 3. Complete Upload
      const completeResponse = await apiClient.post('/api/admin/media/upload-complete', {
        uploadId,
        fileName: file.name,
        totalChunks
      });

      if (completeResponse.url) {
        onUpdate({
          url: completeResponse.url,
          fileName: completeResponse.originalName || file.name,
          sourceType: 'upload'
        });
        addToast({
          title: 'Video Stream Prepared',
          description: 'High-volume asset has been successfully reassembled and stored.',
          type: 'success'
        });
      }
      setUploadProgress(100);
    } catch (error) {
      console.error("Video synchronization failed:", error);
      addToast({
        title: 'Buffer Overflow',
        description: 'Failed to synchronize video segments. Please check your network stability.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeGalleryIndex === null) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const response = await apiClient.post('/api/admin/media/upload', formData);
      if (response.url) {
        const newImgs = [...(block.payload.images || [])];
        newImgs[activeGalleryIndex] = { ...newImgs[activeGalleryIndex], url: response.url };
        onUpdate({ images: newImgs });
        addToast({
          title: 'Image Synchronized',
          description: 'Gallery asset has been successfully uploaded.',
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Gallery upload failed:", error);
      addToast({
        title: 'Upload Failed',
        description: 'Failed to persist gallery asset. Please verify connection.',
        type: 'error'
      });
    } finally {
      setActiveGalleryIndex(null);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
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

      const response = await apiClient.post('/api/admin/media/upload', formData);
      if (response.url) {
        onUpdate({ posterUrl: response.url });
        addToast({
          title: 'Poster Updated',
          description: 'Thumbnail image uploaded successfully',
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Poster upload failed:", error);
      addToast({
        title: 'Poster Upload Failed',
        description: 'Failed to upload poster image.',
        type: 'error'
      });
    } finally {
      setIsPosterUploading(false);
    }
  };

  const Icon = block.type === 'video' ? Video : block.type === 'text' ? Type : ImageIcon;
  const color = block.type === 'video' ? 'text-red-400' : block.type === 'text' ? 'text-blue-400' : 'text-emerald-400';

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className={`bg-[#121214] border rounded-[1.5rem] transition-all overflow-hidden ${isActive ? 'border-[#D4AF37]/50 shadow-2xl ring-1 ring-[#D4AF37]/20' : 'border-slate-800 hover:border-slate-700 shadow-sm'}`}>
        <div className="flex items-center justify-between p-4 bg-black/10">
          <div className="flex items-center gap-4 text-left">
            <button {...attributes} {...listeners} type="button" className="p-2 cursor-grab text-slate-700 hover:text-slate-400 transition-colors">
              <GripVertical className="w-4 h-4" />
            </button>
            <div className={`w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${color}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{index + 1}. {block.type === 'photo' ? 'IMAGE GALLERY' : block.type.toUpperCase()}</h4>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">Content Module</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              type="button"
              className={`p-2 rounded-lg transition-all ${isActive ? 'bg-[#D4AF37] text-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isActive ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              type="button"
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isActive && (
          <div className="p-8 border-t border-slate-800 bg-black/20 animate-in slide-in-from-top-2 duration-300">
            {block.type === 'text' && (
              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Rich Text Content Builder</label>
                <RichTextEditor
                  content={block.payload.content || ''}
                  onChange={content => onUpdate({ content })}
                  placeholder="Design your educational narrative here..."
                />
              </div>
            )}

            {block.type === 'video' && (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Video Source</label>
                    <select
                      value={block.payload.sourceType}
                      onChange={e => onUpdate({ sourceType: e.target.value, url: '', fileName: '' })}
                      className="w-full bg-[#0a0a0b] border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none"
                    >
                      <option value="url">External Link (YouTube/Vimeo)</option>
                      <option value="upload">Internal Upload</option>
                    </select>
                  </div>

                  {block.payload.sourceType === 'upload' ? (
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Asset</label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="video/*"
                        onChange={handleInternalUpload}
                      />
                      <div
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group ${isUploading ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-800 bg-black/40 hover:border-[#D4AF37]/30 hover:bg-black/60'}`}
                      >
                        {isUploading ? (
                          <div className="w-full space-y-3">
                            <div className="flex justify-between text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                              <div className="h-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        ) : block.payload.url ? (
                          <>
                            <div className="p-3 bg-[#D4AF37]/10 rounded-xl">
                              <FileVideo className="w-6 h-6 text-[#D4AF37]" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[200px]">
                                {block.payload.fileName || 'Video Uploaded'}
                              </p>
                              <p className="text-[8px] text-slate-600 font-bold uppercase mt-1">Ready • Click to replace</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                              <Upload className="w-6 h-6 text-slate-600 group-hover:text-[#D4AF37]" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Select Video</p>
                              <p className="text-[8px] text-slate-600 font-bold uppercase mt-1">MP4, WEBM, MOV</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Video URL</label>
                      <input
                        type="text"
                        value={block.payload.url || ''}
                        onChange={e => onUpdate({ url: e.target.value })}
                        className="w-full bg-[#0a0a0b] border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-2xl group transition-all hover:border-[#D4AF37]/20">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Manual Completion</h4>
                      </div>
                      <p className="text-[7px] text-slate-600 font-bold uppercase">Show "Mark as Done" toggle for students</p>
                    </div>
                    <button
                      onClick={() => onUpdate({ enableManualCompletion: !block.payload.enableManualCompletion })}
                      className={`w-9 h-4.5 rounded-full relative transition-all duration-500 ${block.payload.enableManualCompletion ? 'bg-[#D4AF37]' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all duration-500 ${block.payload.enableManualCompletion ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <input
                    type="file"
                    ref={posterInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePosterUpload}
                  />
                  <div
                    onClick={() => !isPosterUploading && posterInputRef.current?.click()}
                    className="aspect-video bg-[#0a0a0b] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center group cursor-pointer hover:border-[#D4AF37]/30 transition-all relative overflow-hidden"
                  >
                    {isPosterUploading ? (
                      <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                    ) : block.payload.posterUrl ? (
                      <>
                        <img src={normalizeUrl(block.payload.posterUrl)} className="w-full h-full object-cover opacity-60" alt="Poster" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Monitor className="w-8 h-8 text-slate-800 mb-2 group-hover:text-[#D4AF37] transition-colors" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Add Poster Image</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {block.type === 'photo' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Image Matrix</label>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdate({ images: [...(block.payload.images || []), { id: String(Date.now()), url: '', caption: '' }] }); }}
                    type="button"
                    className="px-4 py-1.5 bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all text-white"
                  >
                    + Add Image
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleGalleryImageUpload}
                  />
                  {(block.payload.images || []).map((img: any, i: number) => (
                    <div key={img.id} className="bg-[#0a0a0b] border border-slate-800 rounded-2xl p-4 space-y-4 group/img relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdate({ images: block.payload.images.filter((_: any, idx: number) => idx !== i) }); }}
                        type="button"
                        className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div
                        onClick={() => { setActiveGalleryIndex(i); galleryInputRef.current?.click(); }}
                        className="aspect-video bg-black/40 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden cursor-pointer group/upload"
                      >
                        {img.url ? (
                          <img src={normalizeUrl(img.url)} className="w-full h-full object-cover transition-transform group-hover/upload:scale-105" alt={`Gallery ${i}`} />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-800 group-hover/upload:text-[#D4AF37] transition-colors" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 bg-black/60 transition-opacity">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-5 h-5 text-white" />
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Upload Image</span>
                          </div>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={img.caption || ''}
                        onChange={e => {
                          const newImgs = [...block.payload.images];
                          newImgs[i] = { ...newImgs[i], caption: e.target.value };
                          onUpdate({ images: newImgs });
                        }}
                        className="w-full bg-black/20 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-300 outline-none focus:border-[#D4AF37]/30"
                        placeholder="Add a caption..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};