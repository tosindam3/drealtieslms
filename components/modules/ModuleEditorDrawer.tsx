import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Box, Image as ImageIcon, ChevronRight, Layers, Trash2, Edit3, Upload } from 'lucide-react';
import { Module, Week } from '../../types';
import { apiClient } from '../../lib/apiClient';

interface ModuleEditorDrawerProps {
  module: Module;
  weeks: Week[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedModule: Module, targetWeekId: string) => void;
  onDelete?: () => void;
}

export const ModuleEditorDrawer: React.FC<ModuleEditorDrawerProps> = ({ 
  module, 
  weeks, 
  isOpen, 
  onClose, 
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<Module>(module);
  const [targetWeekId, setTargetWeekId] = useState<string>(module.weekId);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(module);
    setTargetWeekId(module.weekId);
    setThumbnailFile(null);
  }, [module]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, thumbnailUrl: url });
    }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      let updatedModule = { ...formData };

      // If there's a new thumbnail file, upload it first
      if (thumbnailFile) {
        const formDataToUpload = new FormData();
        formDataToUpload.append('file', thumbnailFile);
        formDataToUpload.append('type', 'image');

        const uploadResponse = await apiClient.post('/api/admin/media/upload', formDataToUpload);
        updatedModule.thumbnailUrl = uploadResponse.url;
      }

      // Now save the module with the uploaded thumbnail URL
      onSave(updatedModule, targetWeekId);
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      alert('Failed to upload thumbnail. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0a0a0b] h-full border-l border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500">
        <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
              <Edit3 className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Module Editor</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Configure Module Settings</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          {/* Identity Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Module Details
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Module Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Market Analysis"
                className="w-full bg-[#121214] border border-slate-800 rounded-xl px-5 py-4 text-sm font-bold text-white focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all shadow-inner"
              />
            </div>
          </section>

          {/* Media Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> Module Thumbnail
            </h3>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video bg-[#121214] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center group cursor-pointer hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all overflow-hidden relative"
            >
              {formData.thumbnailUrl ? (
                <img src={formData.thumbnailUrl} className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110" alt="Module Thumbnail" />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-slate-600 group-hover:text-[#D4AF37] transition-colors" />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300">
                  {formData.thumbnailUrl ? 'Change Thumbnail' : 'Set Thumbnail'}
                </span>
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Week Allocation
            </h3>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Assign to Week</label>
              <div className="relative group">
                <select 
                  value={targetWeekId}
                  onChange={e => setTargetWeekId(e.target.value)}
                  className="w-full bg-[#121214] border border-slate-800 rounded-xl px-5 py-4 text-xs font-black uppercase tracking-widest text-white focus:border-[#D4AF37]/50 outline-none appearance-none cursor-pointer"
                >
                  {weeks.map(w => (
                    <option key={w.id} value={w.id}>
                      WEEK {w.number}: {w.title ? w.title.toUpperCase() : 'Untitled Week'}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-[#D4AF37] transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          </section>

          {onDelete && (
            <section className="pt-8 border-t border-slate-800">
               <button 
                 onClick={onDelete}
                 className="flex items-center gap-3 text-[9px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors"
               >
                 <Trash2 className="w-4 h-4" /> Delete Module
               </button>
            </section>
          )}
        </div>

        <footer className="p-6 border-t border-slate-800 bg-[#121214] flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            disabled={isUploading}
            className="flex-[2] py-4 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[0_10px_30px_rgba(212,175,55,0.15)] flex items-center justify-center gap-3 hover:bg-[#B8962E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> {isUploading ? 'Uploading...' : 'Save Module'}
          </button>
        </footer>
      </div>
    </div>
  );
};