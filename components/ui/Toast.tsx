import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, BoltIcon, SparklesIcon } from '../icons/Icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextValue {
    showToast: (toast: Omit<Toast, 'id'>) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

// ─── Single Toast Item ────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { border: string; bg: string; icon: React.FC<any>; iconColor: string; bar: string }> = {
    success: {
        border: 'border-neon-green/40',
        bg: 'from-neon-green/10 to-transparent',
        icon: CheckCircleIcon,
        iconColor: 'text-neon-green',
        bar: 'bg-neon-green',
    },
    error: {
        border: 'border-red-500/40',
        bg: 'from-red-500/10 to-transparent',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-red-400',
        bar: 'bg-red-500',
    },
    warning: {
        border: 'border-yellow-400/40',
        bg: 'from-yellow-400/10 to-transparent',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-yellow-400',
        bar: 'bg-yellow-400',
    },
    info: {
        border: 'border-neon-cyan/40',
        bg: 'from-neon-cyan/10 to-transparent',
        icon: SparklesIcon,
        iconColor: 'text-neon-cyan',
        bar: 'bg-neon-cyan',
    },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const config = TOAST_CONFIG[toast.type];
    const Icon = config.icon;
    const duration = toast.duration ?? 4000;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Slide in
        requestAnimationFrame(() => setVisible(true));

        // Progress bar
        const start = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining === 0) {
                clearInterval(intervalRef.current!);
                handleRemove();
            }
        }, 50);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const handleRemove = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setExiting(true);
        setTimeout(() => onRemove(toast.id), 350);
    };

    return (
        <div
            onClick={handleRemove}
            className={`
                relative overflow-hidden rounded-xl border backdrop-blur-md
                bg-dark-800/90 bg-gradient-to-r ${config.bg} ${config.border}
                shadow-lg min-w-[300px] max-w-sm w-full cursor-pointer
                transition-all duration-350 ease-out group
                ${visible && !exiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
            style={{ transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease' }}
        >
            {/* Content */}
            <div className="flex items-start gap-3 p-4 pr-10">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor} group-hover:scale-110 transition-transform`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{toast.title}</p>
                    {toast.message && (
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>
                    )}
                </div>
            </div>

            {/* Close button - now legacy as the whole toast is clickable, but kept for visual hint */}
            <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors rounded-md group-hover:bg-white/10">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                <div
                    className={`h-full ${config.bar} transition-none`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// ─── Toast Container ──────────────────────────────────────────────────────────
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;
    return (
        <div
            className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
            aria-live="polite"
            aria-label="Notifications"
        >
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
                    <ToastItem toast={toast} onRemove={onRemove} />
                </div>
            ))}
        </div>
    );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        setToasts(prev => {
            // Limit to 5 toasts
            const next = [...prev, { ...toast, id }];
            return next.length > 5 ? next.slice(next.length - 5) : next;
        });
    }, []);

    const success = useCallback((title: string, message?: string) => showToast({ type: 'success', title, message }), [showToast]);
    const error = useCallback((title: string, message?: string) => showToast({ type: 'error', title, message }), [showToast]);
    const warning = useCallback((title: string, message?: string) => showToast({ type: 'warning', title, message }), [showToast]);
    const info = useCallback((title: string, message?: string) => showToast({ type: 'info', title, message }), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

export default ToastProvider;
