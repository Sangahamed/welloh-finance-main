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

// ─── Config ───────────────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, {
    border: string; bg: string; glow: string;
    icon: React.FC<any>; iconColor: string; iconBg: string; bar: string;
}> = {
    success: {
        border: 'border-neon-green/40',
        bg: 'from-neon-green/10 via-transparent to-transparent',
        glow: 'hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]',
        icon: CheckCircleIcon,
        iconColor: 'text-neon-green',
        iconBg: 'bg-neon-green/15',
        bar: 'bg-neon-green',
    },
    error: {
        border: 'border-red-500/40',
        bg: 'from-red-500/10 via-transparent to-transparent',
        glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-red-400',
        iconBg: 'bg-red-500/15',
        bar: 'bg-red-500',
    },
    warning: {
        border: 'border-yellow-400/40',
        bg: 'from-yellow-400/10 via-transparent to-transparent',
        glow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-yellow-400',
        iconBg: 'bg-yellow-400/15',
        bar: 'bg-yellow-400',
    },
    info: {
        border: 'border-neon-cyan/40',
        bg: 'from-neon-cyan/10 via-transparent to-transparent',
        glow: 'hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]',
        icon: SparklesIcon,
        iconColor: 'text-neon-cyan',
        iconBg: 'bg-neon-cyan/15',
        bar: 'bg-neon-cyan',
    },
};

// ─── Single Toast Item ─────────────────────────────────────────────────────────
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(100);
    const config = TOAST_CONFIG[toast.type];
    const Icon = config.icon;
    const duration = toast.duration ?? 4500;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef<number>(Date.now());
    const elapsedRef = useRef<number>(0);

    const startTimer = useCallback(() => {
        startRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = elapsedRef.current + (Date.now() - startRef.current);
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining === 0) {
                clearInterval(intervalRef.current!);
                dismiss();
            }
        }, 40);
    }, [duration]);

    const pauseTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            elapsedRef.current += Date.now() - startRef.current;
        }
    }, []);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        startTimer();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const dismiss = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setExiting(true);
        setTimeout(() => onRemove(toast.id), 400);
    }, [onRemove, toast.id]);

    const handleMouseEnter = () => {
        setPaused(true);
        pauseTimer();
    };

    const handleMouseLeave = () => {
        setPaused(false);
        startTimer();
    };

    return (
        <div
            onClick={dismiss}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="alert"
            aria-live="assertive"
            className={[
                'relative overflow-hidden rounded-xl border backdrop-blur-md',
                'bg-[#0d1117]/95 bg-gradient-to-r',
                config.bg, config.border, config.glow,
                'shadow-xl min-w-[300px] max-w-sm w-full cursor-pointer select-none',
                'transition-all duration-400 ease-out group',
                visible && !exiting
                    ? 'translate-x-0 opacity-100 scale-100'
                    : exiting
                        ? 'translate-x-full opacity-0 scale-95'
                        : 'translate-x-full opacity-0 scale-95',
            ].join(' ')}
            style={{ transition: 'transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.35s ease, scale 0.35s ease' }}
        >
            {/* Content */}
            <div className="flex items-start gap-3 p-4 pr-10">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
                    {toast.message && (
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{toast.message}</p>
                    )}
                </div>
            </div>

            {/* Dismiss hint */}
            <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-gray-600 group-hover:text-white group-hover:bg-white/10 transition-all duration-200">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                <div
                    className={`h-full ${config.bar} opacity-80`}
                    style={{
                        width: `${progress}%`,
                        transition: paused ? 'none' : 'width 40ms linear',
                    }}
                />
            </div>
        </div>
    );
};

// ─── Toast Container ───────────────────────────────────────────────────────────
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;
    return (
        <div
            className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
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
            const next = [...prev, { ...toast, id }];
            return next.length > 4 ? next.slice(next.length - 4) : next;
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
