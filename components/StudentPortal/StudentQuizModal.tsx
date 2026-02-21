import React, { useState, useEffect } from 'react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Timer,
    Trophy,
    AlertCircle,
    CheckCircle2,
    Zap,
    Activity,
    ArrowRight,
    ShieldCheck,
    Coins
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface Question {
    id: string;
    type: 'mcq' | 'tf' | 'short';
    text: string;
    options?: { id: string, text: string }[];
    points: number;
}

interface StudentQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    block: any; // LessonBlock with payload
    quizId?: string; // Optional if we have a model ID
    onComplete?: (score: number, coins: number) => void;
}

export const StudentQuizModal: React.FC<StudentQuizModalProps> = ({
    isOpen,
    onClose,
    block,
    quizId,
    onComplete
}) => {
    const [currentStep, setCurrentStep] = useState<'intro' | 'active' | 'results'>('intro');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<{ score: number; passed: boolean; coins: number } | null>(null);

    const quizData = block.payload || {};
    const questions: Question[] = quizData.questions || [];
    const duration = quizData.duration || 20; // Minutes

    useEffect(() => {
        if (isOpen && currentStep === 'active' && duration > 0) {
            setTimeLeft(duration * 60);
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen, currentStep]);

    if (!isOpen) return null;

    const handleStart = () => {
        setCurrentStep('active');
    };

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers({ ...answers, [questionId]: optionId });
    };

    const handleTextChange = (questionId: string, text: string) => {
        setAnswers({ ...answers, [questionId]: text });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // If we have a real quiz ID from the database, use the proper API
            if (quizId) {
                // Format answers for backend API
                const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
                    question_id: parseInt(questionId),
                    answer: answer
                }));

                // Submit to backend
                const response = await apiClient.post(`/api/quizzes/${quizId}/submit`, {
                    attempt_id: block.attemptId, // This should be set when starting the quiz
                    answers: formattedAnswers
                });

                const result = response.data.results;
                setResults({
                    score: Math.round(result.percentage),
                    passed: result.passed,
                    coins: result.coins_earned
                });
                setCurrentStep('results');
                onComplete?.(result.percentage, result.coins_earned);
            } else {
                // Fallback: Local scoring for lesson-embedded quizzes (JSON-based)
                let score = 0;
                let totalPoints = 0;

                questions.forEach(q => {
                    totalPoints += q.points;
                    const userAnswer = answers[q.id];

                    // Find the original question from the block payload
                    const originalQuestion = quizData.questions.find((oq: any) => oq.id === q.id);
                    if (originalQuestion && originalQuestion.correctAnswers) {
                        // Check if user's answer is in the correctAnswers array
                        if (Array.isArray(originalQuestion.correctAnswers)) {
                            if (originalQuestion.correctAnswers.includes(userAnswer)) {
                                score += q.points;
                            }
                        } else if (originalQuestion.correctAnswers === userAnswer) {
                            score += q.points;
                        }
                    }
                });

                const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
                const passed = percentage >= (quizData.passScore || 70);
                const coinsAwarded = passed ? (block.coinReward || 10) : 0;

                // Save completion to backend
                try {
                    await apiClient.post(`/api/lessons/${block.lessonId}/blocks/${block.id}/complete`, {
                        block_type: 'quiz',
                        score_percentage: percentage,
                        score_points: score,
                        total_points: totalPoints,
                        passed: passed,
                        coins_awarded: coinsAwarded,
                        completion_data: {
                            answers: answers,
                            questions: questions.length,
                            pass_score: quizData.passScore || 70,
                            timestamp: new Date().toISOString()
                        }
                    });
                } catch (saveError) {
                    console.error('Failed to save quiz completion:', saveError);
                    // Continue anyway - we'll still show results
                }

                setResults({ score: Math.round(percentage), passed, coins: coinsAwarded });
                setCurrentStep('results');
                onComplete?.(percentage, coinsAwarded);
            }
        } catch (e) {
            console.error("Quiz submission failed", e);
            alert("Failed to submit quiz. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-12 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#07070A]/95 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-[#121214] border border-white/5 rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <header className="px-6 lg:px-10 py-6 lg:py-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl lg:rounded-2xl flex items-center justify-center text-[#D4AF37] shrink-0">
                            <Activity className="w-5 h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div>
                            <h3 className="text-base lg:text-xl font-black text-white italic uppercase tracking-tighter leading-tight line-clamp-1">{block.title}</h3>
                            <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                {currentStep === 'intro' ? 'Assessment Briefing' : currentStep === 'active' ? `Question ${currentQuestionIndex + 1} of ${questions.length}` : 'Performance Review'}
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
                        <div className="max-w-2xl mx-auto space-y-8 lg:space-y-12 py-6 lg:py-10">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[9px] lg:text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Security Verified
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">Ready for Evaluation?</h2>
                                <p className="text-slate-400 text-sm lg:text-base font-medium italic">Complete this assessment to certify your knowledge and earn rewards.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                                <div className="p-4 lg:p-6 bg-white/5 border border-white/5 rounded-2xl lg:rounded-3xl text-center space-y-2">
                                    <Timer className="w-5 h-5 lg:w-6 lg:h-6 text-[#D4AF37] mx-auto opacity-50" />
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Limit</p>
                                    <p className="text-lg lg:text-xl font-black text-white">{duration}m</p>
                                </div>
                                <div className="p-4 lg:p-6 bg-white/5 border border-white/5 rounded-2xl lg:rounded-3xl text-center space-y-2">
                                    <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-500 mx-auto opacity-50" />
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Pass Score</p>
                                    <p className="text-lg lg:text-xl font-black text-white">{quizData.passScore || 70}%</p>
                                </div>
                                <div className="p-4 lg:p-6 bg-white/5 border border-white/5 rounded-2xl lg:rounded-3xl text-center space-y-2">
                                    <Coins className="w-5 h-5 lg:w-6 lg:h-6 text-[#D4AF37] mx-auto opacity-50" />
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Rewards</p>
                                    <p className="text-lg lg:text-xl font-black text-white">+{block.coinReward || 10}XP</p>
                                </div>
                            </div>

                            <button
                                onClick={handleStart}
                                className="w-full py-6 bg-[#D4AF37] text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-[#B8962E] transition-all flex items-center justify-center gap-4 group"
                            >
                                Initiate Assessment
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : currentStep === 'active' ? (
                        <div className="space-y-12">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="w-full sm:flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#D4AF37] transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-4 px-6 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 shrink-0">
                                    <Timer className="w-4 h-4 animate-pulse" />
                                    <span className="text-sm font-black tabular-nums">{formatTime(timeLeft)}</span>
                                </div>
                            </div>

                            <div className="space-y-8 lg:space-y-10">
                                <div className="space-y-4">
                                    <span className="text-[9px] lg:text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] lg:tracking-[0.4em]">Question {currentQuestionIndex + 1}</span>
                                    <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">{currentQuestion.text}</h2>
                                </div>

                                <div className="grid grid-cols-1 gap-3 lg:gap-4">
                                    {currentQuestion.type === 'mcq' || currentQuestion.type === 'tf' ? (
                                        currentQuestion.options?.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                                className={`group p-5 lg:p-6 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 ${answers[currentQuestion.id] === option.id
                                                    ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                                                    }`}
                                            >
                                                <span className="text-base lg:text-lg font-bold italic tracking-tight leading-snug">{option.text}</span>
                                                <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${answers[currentQuestion.id] === option.id
                                                    ? 'border-[#D4AF37] bg-[#D4AF37]'
                                                    : 'border-slate-700'
                                                    }`}>
                                                    {answers[currentQuestion.id] === option.id && <CheckCircle2 className="w-4 h-4 text-black" />}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <textarea
                                            placeholder="Type your response here..."
                                            className="w-full h-32 lg:h-40 bg-black/40 border border-white/10 rounded-2xl p-5 lg:p-6 text-white text-base lg:text-lg font-medium italic outline-none focus:border-[#D4AF37]/50"
                                            value={answers[currentQuestion.id] || ''}
                                            onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 lg:pt-10 border-t border-white/5">
                                <button
                                    disabled={currentQuestionIndex === 0}
                                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                    className="w-full sm:w-auto px-6 lg:px-8 py-3 lg:py-4 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-0 transition-all flex items-center justify-center sm:justify-start gap-3"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Previous Question
                                </button>

                                {currentQuestionIndex === questions.length - 1 ? (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto px-8 lg:px-12 py-4 lg:py-5 bg-emerald-500 text-black text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] rounded-xl shadow-2xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Finalize & Submit'}
                                        {!isSubmitting && <ShieldCheck className="w-4 h-4" />}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                        className="w-full sm:w-auto px-8 lg:px-10 py-4 lg:py-4 bg-white text-black text-[9px] lg:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-4"
                                    >
                                        Next Question <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto py-6 lg:py-10 space-y-8 lg:space-y-12 text-center animate-in zoom-in-95 duration-700">
                            <div className={`w-24 h-24 lg:w-32 lg:h-32 rounded-[2rem] lg:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl ${results?.passed ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                                <Trophy className="w-12 h-12 lg:w-16 lg:h-16" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl lg:text-6xl font-black text-white italic uppercase tracking-tighter leading-tight">
                                    {results?.passed ? 'Mission Success!' : 'Review Required'}
                                </h2>
                                <p className="text-base lg:text-xl text-slate-400 font-medium italic">
                                    Your institutional performance has been evaluated.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                <div className="p-6 lg:p-8 bg-white/5 border border-white/5 rounded-2xl lg:rounded-3xl space-y-2">
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Composite Score</p>
                                    <p className={`text-3xl lg:text-4xl font-black ${results?.passed ? 'text-emerald-500' : 'text-red-500'}`}>{results?.score}%</p>
                                </div>
                                <div className="p-6 lg:p-8 bg-white/5 border border-white/5 rounded-2xl lg:rounded-3xl space-y-2">
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Rewards Unlocked</p>
                                    <p className="text-3xl lg:text-4xl font-black text-[#D4AF37]">+{results?.coins}XP</p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-6 bg-white text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-slate-200 transition-all"
                            >
                                Close Terminal
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
