import React, { useState } from 'react';
import { RichTextEditor } from './common/RichTextEditor';
import {
  ChevronDown,
  ArrowLeft,
  Save,
  Type,
  X,
  Target,
  ShieldCheck,
  Zap,
  Layout,
  Settings,
  FileCode,
  CloudUpload,
  Link,
  TextCursorInput,
  AlertCircle,
  Terminal,
  MousePointer2,
  Calendar,
  Trophy,
  Paperclip,
  ShieldAlert,
  FileUp,
  Cpu
} from 'lucide-react';
import { LessonBlock } from '../types';

interface AssignmentBuilderProps {
  block: LessonBlock;
  onSave: (updatedPayload: any) => void;
  onCancel: () => void;
}

export const AssignmentBuilder: React.FC<AssignmentBuilderProps> = ({ block, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: block.title || "Course Assignment",
    instructionsHtml: block.payload?.instructionsHtml || '',
    maxPoints: block.payload?.maxPoints || 100,
    submissionType: block.payload?.submissionType || 'file',
    allowedExtensions: block.payload?.allowedExtensions || ['.zip', '.pdf', '.unitypackage'],
    maxFileSize: block.payload?.maxFileSize || 50,
    allowResubmission: block.payload?.allowResubmission ?? true,
    deadline: block.payload?.deadline || '',
    referenceAssets: block.payload?.referenceAssets || []
  });

  const submissionTypes = [
    { id: 'file', label: 'File Upload', icon: CloudUpload, desc: 'Accept documents, zip files, or media.' },
    { id: 'link', label: 'External Link', icon: Link, desc: 'Accept URLs for hosted repositories or portfolios.' },
    { id: 'text', label: 'Text Input', icon: TextCursorInput, desc: 'Direct text input for short answers.' },
  ];

  const handleAddExtension = (ext: string) => {
    if (!formData.allowedExtensions.includes(ext)) {
      setFormData({ ...formData, allowedExtensions: [...formData.allowedExtensions, ext] });
    }
  };

  const removeExtension = (ext: string) => {
    setFormData({ ...formData, allowedExtensions: formData.allowedExtensions.filter((e: string) => e !== ext) });
  };

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
                <Terminal className="w-6 h-6 text-[#D4AF37]" />
                Assignment Setup
              </h1>
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Drafting</span>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Assignment: {formData.title}</p>
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
            <Save className="w-4 h-4" /> Save Assignment
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#0a0a0b]">
          <div className="max-w-5xl mx-auto space-y-12 pb-20">

            <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Assignment Brief</h2>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Assignment Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 px-8 py-5 rounded-[1.5rem] text-xl font-black text-white outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all"
                    placeholder="e.g. Portfolio Strategy Review..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Instructions</label>
                  <RichTextEditor
                    content={formData.instructionsHtml}
                    onChange={content => setFormData({ ...formData, instructionsHtml: content })}
                    placeholder="Provide detailed instructions for the students..."
                  />
                </div>
              </div>
            </section>

            <section className="space-y-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-3">
                <CloudUpload className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Submission Settings</h2>
              </div>

              <div className="grid grid-cols-12 gap-10">
                <div className="col-span-7 space-y-8">
                  <div className="grid grid-cols-3 gap-4">
                    {submissionTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setFormData({ ...formData, submissionType: type.id })}
                        className={`p-6 rounded-[2rem] border transition-all text-left group relative overflow-hidden flex flex-col ${formData.submissionType === type.id
                          ? 'bg-emerald-500/5 border-emerald-500/40 shadow-2xl ring-1 ring-emerald-500/20'
                          : 'bg-black/20 border-white/5 hover:border-white/10'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all ${formData.submissionType === type.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-500 group-hover:text-white'
                          }`}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${formData.submissionType === type.id ? 'text-white' : 'text-slate-500'}`}>
                          {type.label}
                        </h4>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-5">
                  <div className="bg-[#161b22] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grading Weight</h4>
                    <div className="space-y-3">
                      <input
                        type="number"
                        value={formData.maxPoints}
                        onChange={e => setFormData({ ...formData, maxPoints: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-4xl font-black text-[#D4AF37] italic tracking-tighter outline-none"
                      />
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Maximum Points available for this assignment.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside className="w-[420px] border-l border-white/5 bg-[#121214]/50 backdrop-blur-md p-10 space-y-10 overflow-y-auto custom-scrollbar shadow-2xl">
          <section className="space-y-8">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Deadlines & Retakes</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Submission Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-black/30 border border-white/5 rounded-2xl group transition-all hover:border-[#D4AF37]/20 shadow-lg">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Allow Resubmissions</h4>
                  <p className="text-[8px] text-slate-600 font-bold uppercase">Students can update work after feedback</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, allowResubmission: !formData.allowResubmission })}
                  className={`w-12 h-6 rounded-full relative transition-all duration-500 ${formData.allowResubmission ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-500 ${formData.allowResubmission ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};