import React, { useState, useRef } from 'react';
import {
    X,
    CloudUpload,
    Link as LinkIcon,
    TextCursorInput,
    AlertCircle,
    CheckCircle2,
    FileText,
    Target,
    ArrowRight,
    ShieldCheck,
    Paperclip,
    Loader2,
    ExternalLink,
    Zap
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { RichTextRenderer } from '../common/RichTextRenderer';

interface StudentAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    block: any; // LessonBlock with payload
    onComplete?: (status: string) => void;
}

export const StudentAssignmentModal: React.FC<StudentAssignmentModalProps> = ({
    isOpen,
    onClose,
    block,
    onComplete
}) => {
    const [currentStep, setCurrentStep] = useState<'intro' | 'active' | 'success'>('intro');
    const [submission, setSubmission] = useState<{ file: File | null; link: string; text: string }>({
        file: null,
        link: '',
        text: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const assignmentData = block.payload || {};
    const submissionType = assignmentData.submissionType || 'file';

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size and extension
            const sizeMb = file.size / 1024 / 1024;
            if (sizeMb > (assignmentData.maxFileSize || 50)) {
                setError(`File size exceeds limit of ${assignmentData.maxFileSize || 50}MB`);
                return;
            }
            setSubmission({ ...submission, file });
            setError(null);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('blockId', block.id);

            if (submissionType === 'file' && submission.file) {
                formData.append('file', submission.file);
            } else if (submissionType === 'link') {
                formData.append('link', submission.link);
            } else if (submissionType === 'text') {
                formData.append('content', submission.text);
            }

            // Call API - Generic progress sync or specific assignment submit
            await apiClient.post('/api/student/progress/sync', formData);

            setCurrentStep('success');
            onComplete?.('submitted');
        } catch (e: any) {
            setError(e.response?.data?.message || e.message || "Submission failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-12 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#07070A]/95 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-[#121214] border border-white/5 rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <header className="px-6 lg:px-10 py-6 lg:py-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl lg:rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                            <Target className="w-5 h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div>
                            <h3 className="text-base lg:text-xl font-black text-white italic uppercase tracking-tighter leading-tight line-clamp-1">{block.title}</h3>
                            <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                {currentStep === 'intro' ? 'Assignment Briefing' : currentStep === 'active' ? 'Submission Terminal' : 'Transmission Confirmed'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 lg:p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                    {currentStep === 'intro' ? (
                        <div className="space-y-8 lg:space-y-10 py-2 lg:py-4">
                            <div className="space-y-6">
                                <h4 className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] lg:tracking-[0.4em]">Project Objectives</h4>
                                <div className="bg-white/5 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-3xl border border-white/5">
                                    <RichTextRenderer content={assignmentData.instructionsHtml || 'No instructions provided.'} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                <div className="p-5 lg:p-6 bg-white/5 border border-white/5 rounded-2xl lg:rounded-3xl space-y-1 text-center sm:text-left">
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Rewards</p>
                                    <p className="text-lg lg:text-xl font-black text-[#D4AF37]">+{block.coinReward || 20}XP</p>
                                </div>
                                <div className="p-5 lg:p-6 bg-white/5 border border-white/5 rounded-2xl lg:rounded-3xl space-y-1 text-center sm:text-left">
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Deadline</p>
                                    <p className="text-lg lg:text-xl font-black text-white">{assignmentData.deadline ? new Date(assignmentData.deadline).toLocaleDateString() : 'None Set'}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentStep('active')}
                                className="w-full py-6 bg-emerald-500 text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 group"
                            >
                                Start Submission
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : currentStep === 'active' ? (
                        <div className="space-y-10 py-4">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                                        {submissionType === 'file' ? <CloudUpload className="w-5 h-5 text-[#D4AF37]" /> : submissionType === 'link' ? <LinkIcon className="w-5 h-5 text-[#D4AF37]" /> : <TextCursorInput className="w-5 h-5 text-[#D4AF37]" />}
                                    </div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-[0.4em]">
                                        {submissionType === 'file' ? 'Upload Deliverables' : submissionType === 'link' ? 'Provide External URL' : 'Intel Summary'}
                                    </h4>
                                </div>

                                {submissionType === 'file' ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-16 text-center transition-all cursor-pointer group ${submission.file ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-black/20 border-white/10 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5'}`}
                                    >
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept={assignmentData.allowedExtensions?.join(',')} />
                                        {submission.file ? (
                                            <div className="space-y-4">
                                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-500/10 rounded-2xl lg:rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500">
                                                    <FileText className="w-8 h-8 lg:w-10 lg:h-10" />
                                                </div>
                                                <div>
                                                    <p className="text-lg lg:text-xl font-black text-white italic line-clamp-1 px-4">{submission.file.name}</p>
                                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{(submission.file.size / 1024 / 1024).toFixed(2)} MB • Ready for Sync</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSubmission({ ...submission, file: null }); }}
                                                    className="px-6 py-2 bg-red-500/10 text-red-500 text-[9px] lg:text-[10px] font-black uppercase rounded-lg border border-red-500/20"
                                                >
                                                    Replace File
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/5 rounded-2xl lg:rounded-[2rem] flex items-center justify-center mx-auto text-slate-500 group-hover:text-[#D4AF37] transition-all">
                                                    <CloudUpload className="w-8 h-8 lg:w-10 lg:h-10" />
                                                </div>
                                                <div>
                                                    <p className="text-lg lg:text-xl font-black text-white italic uppercase tracking-tighter">Drag or Click to Upload</p>
                                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 italic px-4">Allowed: {assignmentData.allowedExtensions?.join(', ') || 'Any'} • Max {assignmentData.maxFileSize || 50}MB</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : submissionType === 'link' ? (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://github.com/your-project"
                                            className="w-full bg-black/40 border border-white/5 px-8 py-5 rounded-2xl text-lg font-bold text-white outline-none focus:border-[#D4AF37]/50 shadow-inner"
                                            value={submission.link}
                                            onChange={(e) => setSubmission({ ...submission, link: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Submission Content</label>
                                        <textarea
                                            placeholder="Provide your text-based submission here..."
                                            className="w-full h-64 bg-black/40 border border-white/5 px-8 py-8 rounded-3xl text-lg font-medium italic text-white outline-none focus:border-[#D4AF37]/50 shadow-inner resize-none"
                                            value={submission.text}
                                            onChange={(e) => setSubmission({ ...submission, text: e.target.value })}
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 animate-in slide-in-from-top-2">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p className="text-xs font-bold italic">{error}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 lg:pt-6">
                                <button
                                    onClick={() => setCurrentStep('intro')}
                                    className="w-full sm:flex-1 py-4 lg:py-5 bg-white/5 border border-white/10 text-slate-500 text-[9px] lg:text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all order-2 sm:order-1"
                                >
                                    Back to Objectives
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (submissionType === 'file' && !submission.file) || (submissionType === 'link' && !submission.link) || (submissionType === 'text' && !submission.text)}
                                    className="w-full sm:flex-[2] py-4 lg:py-5 bg-[#D4AF37] text-black text-[11px] lg:text-[12px] font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-[#B8962E] transition-all disabled:opacity-50 flex items-center justify-center gap-4 order-1 sm:order-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    {isSubmitting ? 'Syncing...' : 'Secure Transmission'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto py-12 text-center space-y-12 animate-in zoom-in-95 duration-700">
                            <div className="w-32 h-32 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-500 shadow-2xl">
                                <CheckCircle2 className="w-16 h-16" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Transmission Confirmed</h2>
                                <p className="text-xl text-slate-400 font-medium italic">Your project deliverables have been successfully uploaded to the central ledger.</p>
                            </div>

                            <div className="p-8 bg-white/5 border border-white/5 rounded-3xl inline-flex items-center gap-4 text-[#D4AF37]">
                                <Zap className="w-6 h-6" />
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rewards Pending</p>
                                    <p className="text-xl font-black">+{block.coinReward || 20}XP Unofficial</p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-6 bg-white text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-slate-200 transition-all font-inter"
                            >
                                Return to Curriculum
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
