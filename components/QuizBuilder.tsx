import React, { useState } from 'react';
import {
   ChevronDown,
   GripVertical,
   Trash2,
   Plus,
   ArrowLeft,
   Save,
   Activity,
   Type,
   CheckCircle,
   X,
   Target,
   ShieldCheck,
   Zap,
   Layout,
   Eye,
   Settings,
   AlertCircle,
   Lock,
   Cpu,
   Monitor,
   CheckCircle2,
   BookOpen
} from 'lucide-react';
import { LessonBlock } from '../types';

interface QuizBuilderProps {
   block: LessonBlock;
   onSave: (updatedPayload: any) => void;
   onCancel: () => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ block, onSave, onCancel }) => {
   const [formData, setFormData] = useState({
      questions: block.payload.questions || [],
      passScore: block.payload.passScore || 70,
      attemptsAllowed: block.payload.attemptsAllowed || 2,
      duration: block.payload.duration || 20,
      title: block.title || "Assessment Quiz"
   });

   const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
   const [isPreviewMode, setIsPreviewMode] = useState(false);

   const addQuestion = (type: 'mcq' | 'tf' | 'short') => {
      const newQuestion = {
         id: `q-${Date.now()}`,
         type,
         text: type === 'mcq' ? 'Enter multiple choice question...' : type === 'tf' ? 'Enter true/false statement...' : 'Enter short answer prompt...',
         options: type === 'mcq' ? [
            { id: 'opt-1', text: 'Option A', isCorrect: true },
            { id: 'opt-2', text: 'Option B', isCorrect: false }
         ] : type === 'tf' ? [
            { id: 'opt-t', text: 'TRUE', isCorrect: true },
            { id: 'opt-f', text: 'FALSE', isCorrect: false }
         ] : [],
         points: 10,
         hint: ""
      };
      setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
      setActiveQuestionId(newQuestion.id);
   };

   const updateQuestion = (id: string, updates: any) => {
      setFormData({
         ...formData,
         questions: formData.questions.map((q: any) => q.id === id ? { ...q, ...updates } : q)
      });
   };

   const deleteQuestion = (id: string) => {
      setFormData({
         ...formData,
         questions: formData.questions.filter((q: any) => q.id !== id)
      });
   };

   const addOption = (qId: string) => {
      const question = formData.questions.find((q: any) => q.id === qId);
      if (!question) return;
      const newOption = { id: `opt-${Date.now()}`, text: 'New Option', isCorrect: false };
      updateQuestion(qId, { options: [...question.options, newOption] });
   };

   const handleSave = () => {
      // Transform questions to use correctAnswers array instead of isCorrect on options
      const transformedQuestions = formData.questions.map((q: any) => {
         const transformed: any = {
            id: q.id,
            type: q.type,
            text: q.text,
            points: q.points
         };

         // Add hint if it exists
         if (q.hint) {
            transformed.hint = q.hint;
         }

         // For MCQ and True/False questions, extract correctAnswers from options
         if (q.type === 'mcq' || q.type === 'tf') {
            // Remove isCorrect from options and create correctAnswers array
            transformed.options = q.options.map((opt: any) => ({
               id: opt.id,
               text: opt.text
            }));
            
            // Extract IDs of correct options into correctAnswers array
            transformed.correctAnswers = q.options
               .filter((opt: any) => opt.isCorrect)
               .map((opt: any) => opt.id);
         } else if (q.type === 'short') {
            // For short answer, correctAnswers should be an array of acceptable answers
            // If not already set, initialize as empty array
            transformed.correctAnswers = q.correctAnswers || [];
         }

         return transformed;
      });

      const transformedPayload = {
         ...formData,
         questions: transformedQuestions
      };

      onSave(transformedPayload);
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
                     <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Quiz Builder</h1>
                     <div className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                        <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Editor Active</span>
                     </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Editing: {formData.title}</p>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${isPreviewMode ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                     }`}
               >
                  {isPreviewMode ? <Settings className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {isPreviewMode ? 'Back to Editor' : 'Preview Quiz'}
               </button>
               <button
                  onClick={handleSave}
                  className="px-10 py-3 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-[#D4AF37]/20 hover:bg-[#B8962E] transition-all active:scale-95 flex items-center gap-3"
               >
                  <Save className="w-4 h-4" /> Save Quiz
               </button>
            </div>
         </header>

         <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-[#0a0a0b]">
               {isPreviewMode ? (
                  <QuizPreview matrix={formData} />
               ) : (
                  <div className="max-w-4xl mx-auto space-y-12">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                           <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Question List</h2>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{formData.questions.length} Questions</span>
                           <div className="h-4 w-px bg-white/5" />
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Points: {formData.questions.reduce((a: number, b: any) => a + (b.points || 0), 0)}</span>
                        </div>
                     </div>

                     <div className="space-y-6">
                        {formData.questions.length === 0 ? (
                           <div className="py-32 border-2 border-dashed border-white/5 rounded-[3rem] text-center bg-black/20 flex flex-col items-center justify-center group">
                              <Monitor className="w-20 h-20 text-slate-800 mb-8 group-hover:scale-110 transition-transform group-hover:text-slate-700" />
                              <h3 className="text-2xl font-black text-slate-600 uppercase italic tracking-tighter">No Questions Added</h3>
                              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em] mt-3">Use the sidebar to add your first question.</p>
                           </div>
                        ) : (
                           formData.questions.map((q: any, idx: number) => (
                              <QuestionItem
                                 key={q.id}
                                 question={q}
                                 index={idx}
                                 isActive={activeQuestionId === q.id}
                                 onToggle={() => setActiveQuestionId(activeQuestionId === q.id ? null : q.id)}
                                 onDelete={() => deleteQuestion(q.id)}
                                 onUpdate={(u: any) => updateQuestion(q.id, u)}
                                 onAddOption={() => addOption(q.id)}
                              />
                           ))
                        )}
                     </div>
                  </div>
               )}
            </div>

            {!isPreviewMode && (
               <aside className="w-[420px] border-l border-white/5 bg-[#121214]/50 backdrop-blur-md p-10 space-y-10 overflow-y-auto custom-scrollbar shadow-2xl">
                  <section className="space-y-8">
                     <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-[#D4AF37]" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Quiz Settings</h3>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Pass Score Threshold</label>
                           <div className="relative">
                              <input
                                 type="range"
                                 min="0"
                                 max="100"
                                 value={formData.passScore}
                                 onChange={e => setFormData({ ...formData, passScore: Number(e.target.value) })}
                                 className="w-full accent-[#D4AF37] h-1.5 bg-black rounded-full appearance-none cursor-pointer mb-2"
                              />
                              <div className="flex justify-between items-center bg-black/40 border border-white/5 px-5 py-3 rounded-xl">
                                 <span className="text-xl font-black text-[#D4AF37] italic tracking-tighter">{formData.passScore}%</span>
                                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Required Score</span>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Max Retries</label>
                              <input
                                 type="number"
                                 value={formData.attemptsAllowed}
                                 onChange={e => setFormData({ ...formData, attemptsAllowed: Number(e.target.value) })}
                                 className="w-full bg-black/40 border border-white/5 px-4 py-3 rounded-xl text-sm font-black text-white outline-none focus:border-[#D4AF37]/50 shadow-inner"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Time Limit (Mins)</label>
                              <input
                                 type="number"
                                 value={formData.duration}
                                 onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                                 className="w-full bg-black/40 border border-white/5 px-4 py-3 rounded-xl text-sm font-black text-white outline-none focus:border-[#D4AF37]/50 shadow-inner"
                              />
                           </div>
                        </div>
                     </div>
                  </section>

                  <div className="h-px bg-white/5" />

                  <section className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Plus className="w-4 h-4 text-[#D4AF37]" />
                           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Add New Question</h3>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <AddQuestionButton
                           icon={Layout}
                           label="Multiple Choice"
                           color="text-blue-400"
                           onClick={() => addQuestion('mcq')}
                        />
                        <AddQuestionButton
                           icon={ShieldCheck}
                           label="True / False"
                           color="text-emerald-400"
                           onClick={() => addQuestion('tf')}
                        />
                        <AddQuestionButton
                           icon={Type}
                           label="Short Answer"
                           color="text-purple-400"
                           onClick={() => addQuestion('short')}
                        />
                     </div>
                  </section>
               </aside>
            )}
         </div>
      </div>
   );
};

const QuestionItem: React.FC<{
   question: any;
   index: number;
   isActive: boolean;
   onToggle: () => void;
   onDelete: () => void;
   onUpdate: (updates: any) => void;
   onAddOption: () => void;
}> = ({ question, index, isActive, onToggle, onDelete, onUpdate, onAddOption }) => {
   return (
      <div className={`bg-[#121214] border rounded-[2rem] transition-all overflow-hidden ${isActive ? 'border-[#D4AF37]/50 shadow-2xl bg-[#161b22]' : 'border-white/5 hover:border-white/10'}`}>
         <div className="flex items-center justify-between p-6 bg-black/10">
            <div className="flex items-center gap-6">
               <div className="p-2 text-slate-700 cursor-grab hover:text-slate-400 transition-colors">
                  <GripVertical className="w-4 h-4" />
               </div>
               <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center font-black italic tracking-tighter text-lg ${isActive ? 'text-[#D4AF37]' : 'text-slate-600'}`}>
                  {index + 1}
               </div>
               <div>
                  <div className="flex items-center gap-3">
                     <h4 className="text-xs font-black text-white uppercase tracking-widest truncate max-w-md">{question.text}</h4>
                     <span className={`text-[8px] px-2 py-0.5 rounded border border-white/5 uppercase font-black tracking-widest ${question.type === 'mcq' ? 'bg-blue-500/10 text-blue-400' :
                           question.type === 'tf' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>{question.type}</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <button
                  onClick={onToggle}
                  className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
               >
                  <Settings className={`w-4 h-4 transition-transform duration-500 ${isActive ? 'rotate-180' : ''}`} />
               </button>
               <button
                  onClick={onDelete}
                  className="p-2.5 text-slate-700 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
         </div>

         {isActive && (
            <div className="p-10 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-300 space-y-10">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Question Text</label>
                  <textarea
                     value={question.text}
                     onChange={e => onUpdate({ text: e.target.value })}
                     rows={3}
                     className="w-full bg-[#0a0a0b] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/40 shadow-inner resize-none transition-all"
                     placeholder="Enter question text..."
                  />
               </div>

               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Answers</label>
                        {question.type === 'mcq' && (
                           <button onClick={onAddOption} className="text-[9px] font-black text-[#D4AF37] uppercase hover:underline flex items-center gap-2">
                              <Plus className="w-3.5 h-3.5" /> Add Choice
                           </button>
                        )}
                     </div>

                     <div className="space-y-3">
                        {question.options.map((opt: any) => (
                           <div key={opt.id} className="flex items-center gap-4 group/opt">
                              <button
                                 onClick={() => onUpdate({ options: question.options.map((o: any) => ({ ...o, isCorrect: o.id === opt.id })) })}
                                 className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center shrink-0 ${opt.isCorrect ? 'bg-[#D4AF37] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-white/10 hover:border-[#D4AF37]/50'}`}
                              >
                                 {opt.isCorrect && <CheckCircle className="w-4 h-4 text-black fill-current" />}
                              </button>
                              <input
                                 type="text"
                                 value={opt.text}
                                 onChange={e => onUpdate({ options: question.options.map((o: any) => o.id === opt.id ? { ...o, text: e.target.value } : o) })}
                                 className="flex-1 bg-black/40 border border-white/5 px-5 py-3 rounded-xl text-xs font-bold text-slate-400 focus:text-white outline-none focus:border-[#D4AF37]/30 transition-all"
                              />
                              {question.type === 'mcq' && question.options.length > 2 && (
                                 <button
                                    onClick={() => onUpdate({ options: question.options.filter((o: any) => o.id !== opt.id) })}
                                    className="p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all bg-white/5 rounded-lg"
                                 >
                                    <X className="w-4 h-4" />
                                 </button>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Points</label>
                        <div className="relative">
                           <input
                              type="number"
                              value={question.points}
                              onChange={e => onUpdate({ points: Number(e.target.value) })}
                              className="w-full bg-[#0a0a0b] border border-white/5 rounded-2xl px-6 py-4 text-sm font-black text-[#D4AF37] outline-none shadow-inner"
                           />
                           <Zap className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Feedback/Explanation</label>
                        <input
                           type="text"
                           value={question.hint || ""}
                           onChange={e => onUpdate({ hint: e.target.value })}
                           className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-slate-300 outline-none"
                           placeholder="Explain the correct answer..."
                        />
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const AddQuestionButton: React.FC<{ icon: any; label: string; color: string; onClick: () => void }> = ({ icon: Icon, label, color, onClick }) => (
   <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-6 bg-black/30 border border-white/5 rounded-[1.5rem] hover:border-[#D4AF37]/30 transition-all group active:scale-95 shadow-inner"
   >
      <div className="flex items-center gap-5">
         <div className={`p-3 bg-slate-900 border border-white/5 rounded-2xl group-hover:scale-110 transition-transform ${color} shadow-lg`}>
            <Icon className="w-5 h-5" />
         </div>
         <span className="text-[11px] font-black text-slate-500 group-hover:text-white uppercase tracking-[0.2em] transition-colors">{label}</span>
      </div>
      <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#D4AF37] transition-all">
         <Plus className="w-4 h-4 text-slate-600 group-hover:text-black" />
      </div>
   </button>
);

const QuizPreview: React.FC<{ matrix: any }> = ({ matrix }) => {
   return (
      <div className="max-w-3xl mx-auto space-y-12 py-10 animate-in zoom-in-95 duration-500">
         <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-[2rem] border border-[#D4AF37]/20 flex items-center justify-center mb-4">
               <Target className="w-10 h-10 text-[#D4AF37] animate-pulse" />
            </div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{matrix.title}</h2>
            <div className="flex items-center gap-8 pt-4">
               <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{matrix.passScore}% Required to Pass</span>
               </div>
               <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{matrix.questions.length} Questions Total</span>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            {matrix.questions.map((q: any, i: number) => (
               <div key={q.id} className="bg-[#121214] border border-white/10 p-10 rounded-[3rem] shadow-2xl relative">
                  <span className="absolute -top-4 -left-4 w-12 h-12 bg-[#D4AF37] text-black font-black italic text-xl flex items-center justify-center rounded-2xl shadow-2xl border-4 border-[#0a0a0b]">
                     {i + 1}
                  </span>
                  <h4 className="text-lg font-black text-white uppercase tracking-widest leading-relaxed mb-10 pl-6">
                     {q.text}
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                     {q.options.map((opt: any) => (
                        <button key={opt.id} className="w-full text-left p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all group flex items-center gap-6">
                           <div className="w-4 h-4 rounded-full border-2 border-slate-700 group-hover:border-[#D4AF37] transition-colors" />
                           <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">{opt.text}</span>
                        </button>
                     ))}
                     {q.type === 'short' && (
                        <input type="text" className="w-full bg-black/40 border border-white/10 p-6 rounded-2xl outline-none focus:border-[#D4AF37] text-white" placeholder="Type your answer here..." />
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};
