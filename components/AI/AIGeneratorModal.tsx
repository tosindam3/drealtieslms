import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface AIGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: any) => void;
    type: 'module' | 'quiz' | 'assignment' | 'topic_blocks';
    context?: string;
    topicTitle?: string;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    type,
    context,
    topicTitle
}) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/api/admin/ai/generate', {
                type,
                prompt,
                context,
                topic_title: topicTitle
            });

            if (response.data.status === 'success') {
                setPreview(response.data.data);
            } else {
                setError(response.data.message || 'Failed to generate content');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred during generation');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (preview) {
            onGenerate(preview);
            onClose();
        }
    };

    const titles = {
        module: 'Generate Module with AI',
        quiz: 'Generate Quiz with AI',
        assignment: 'Generate Assignment with AI',
        topic_blocks: 'Generate Topic Content with AI'
    };

    const placeholders = {
        module: 'e.g., Introduction to Forex Trading Basics',
        quiz: 'e.g., Fundamentals of Support and Resistance',
        assignment: 'e.g., Create a 1-week demo account trading plan',
        topic_blocks: 'e.g., Explain the concept of Pips and Lot sizes'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white leading-tight">
                                {titles[type]}
                            </h3>
                            <p className="text-slate-400 text-sm mt-0.5">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!preview ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    What should the AI generate?
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={placeholders[type]}
                                    rows={4}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="bg-slate-800/50 rounded-lg p-4 text-xs text-slate-400 leading-relaxed">
                                <p><strong>Tip:</strong> Be specific! Instead of "Forex", try "Fundamental analysis for beginners focusing on interest rates and inflation".</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Check size={16} className="text-emerald-400" />
                                    Generation complete. Preview the result below:
                                </span>
                                <button
                                    onClick={() => setPreview(null)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                >
                                    Regenerate
                                </button>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                                    {JSON.stringify(preview, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        Cancel
                    </button>

                    {!preview ? (
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className={`
                px-8 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg shadow-indigo-500/20
                flex items-center gap-2 transition-all
                ${loading || !prompt.trim()
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}
              `}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Generate Progress
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleApply}
                            className="px-8 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                        >
                            <Check size={18} />
                            Apply to Builder
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
