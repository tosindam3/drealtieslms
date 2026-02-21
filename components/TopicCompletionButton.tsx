import React from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface TopicCompletionButtonProps {
    isEligible: boolean;
    isCompleted: boolean;
    timeRemaining: number;
    onComplete: () => void;
    isLoading?: boolean;
}

/**
 * Completion button with three states:
 * 1. Not eligible (< min time) - Shows countdown
 * 2. Eligible (>= min time) - Active completion button
 * 3. Completed - Shows checkmark
 */
export const TopicCompletionButton: React.FC<TopicCompletionButtonProps> = ({
    isEligible,
    isCompleted,
    timeRemaining,
    onComplete,
    isLoading = false
}) => {
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isCompleted) {
        return (
            <div className="flex items-center gap-3 px-8 py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-black uppercase tracking-widest rounded-2xl">
                <CheckCircle2 className="w-5 h-5" />
                Completed
            </div>
        );
    }

    if (!isEligible) {
        return (
            <div className="flex items-center gap-3 px-8 py-4 bg-slate-800/50 border border-slate-700 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-2xl cursor-not-allowed">
                <Clock className="w-5 h-5 animate-pulse" />
                Keep Learning... ({formatTime(timeRemaining)} remaining)
            </div>
        );
    }

    return (
        <button
            onClick={onComplete}
            disabled={isLoading}
            className="flex items-center gap-3 px-10 py-4 bg-[#D4AF37] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#D4AF37]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Completing...
                </>
            ) : (
                <>
                    <CheckCircle2 className="w-5 h-5" />
                    Mark as Complete
                </>
            )}
        </button>
    );
};
