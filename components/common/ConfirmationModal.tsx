import React from 'react';
import { AlertTriangle, X, Check, Info } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    icon: AlertTriangle,
                    iconColor: 'text-red-500',
                    iconBg: 'bg-red-500/10',
                    buttonBg: 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    iconColor: 'text-[#D4AF37]',
                    iconBg: 'bg-[#D4AF37]/10',
                    buttonBg: 'bg-[#D4AF37] hover:bg-[#B8962E] text-black shadow-[#D4AF37]/20'
                };
            case 'info':
            default:
                return {
                    icon: Info,
                    iconColor: 'text-blue-500',
                    iconBg: 'bg-blue-500/10',
                    buttonBg: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
                };
        }
    };

    const styles = getVariantStyles();
    const Icon = styles.icon;

    React.useEffect(() => {
        if (isOpen) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const now = audioContext.currentTime;

            // Subtle "pop" sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

            oscillator.start(now);
            oscillator.stop(now + 0.1);
        }
    }, [isOpen]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center mx-auto mb-6`}>
                        <Icon className={`w-8 h-8 ${styles.iconColor}`} />
                    </div>

                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                        {title}
                    </h3>

                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">
                        {description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                        >
                            {cancelLabel}
                        </button>

                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${styles.buttonBg}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
