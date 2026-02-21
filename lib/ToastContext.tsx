import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    title: string;
    description?: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    /* Sound Effects (Base64 for reliability) */
    const playSound = (type: ToastType) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const now = audioContext.currentTime;

        if (type === 'success') {
            // Pleasant ascending chime
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, now); // C5
            oscillator.frequency.exponentialRampToValueAtTime(783.99, now + 0.1); // G5
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            oscillator.start(now);
            oscillator.stop(now + 0.5);
        } else if (type === 'error') {
            // Subtle low thud/buzz
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(150, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
        } else {
            // Neutral ping for info/warning
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, now); // A4
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
        }
    };

    const addToast = useCallback(({ title, description, type }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, type }]);

        // Play sound
        playSound(type);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 max-w-md w-full pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastComponent toast={toast} onRemove={() => removeToast(toast.id)} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastComponent: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
    const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;
    const colorClass = toast.type === 'success' ? 'text-emerald-400' : toast.type === 'error' ? 'text-red-400' : 'text-blue-400';
    const shadowClass = toast.type === 'success' ? 'shadow-emerald-500/20' : toast.type === 'error' ? 'shadow-red-500/20' : 'shadow-blue-500/20';

    return (
        <div className={`bg-[#121214]/95 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex gap-4 shadow-2xl ${shadowClass} animate-in slide-in-from-right-10 duration-300 relative group overflow-hidden`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />

            <div className={`p-2 rounded-xl bg-white/5 ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 space-y-1">
                <h4 className="text-[11px] font-black text-white uppercase tracking-wider">{toast.title}</h4>
                {toast.description && (
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{toast.description}</p>
                )}
            </div>

            <button
                onClick={onRemove}
                className="text-slate-600 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 shadow-inner">
                <style dangerouslySetInnerHTML={{
                    __html: `
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
          .animate-shrink {
            animation: shrink 5000ms linear forwards;
          }
        `}} />
                <div className={`h-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} animate-shrink`} />
            </div>
        </div>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
