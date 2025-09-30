import clsx from 'clsx';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
    onClose: () => void;
    autoClose?: boolean;
    duration?: number;
}

export default function Toast({
    title,
    message,
    type,
    isVisible,
    onClose,
    autoClose = true,
    duration = 5000
}: ToastProps) {
    // Auto close functionality
    if (autoClose && isVisible) {
        setTimeout(() => {
            onClose();
        }, duration);
    }

    const iconMap = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info
    };

    const Icon = iconMap[type];

    return (
        <div
            className={clsx(
                'fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out transform',
                {
                    'opacity-100 translate-y-0': isVisible,
                    'opacity-0 -translate-y-2 pointer-events-none': !isVisible
                }
            )}
        >
            <div
                className={clsx(
                    'min-w-80 max-w-md p-4 rounded-lg shadow-lg border backdrop-blur-sm',
                    {
                        'bg-green-50/95 border-green-200 text-green-800': type === 'success',
                        'bg-red-50/95 border-red-200 text-red-800': type === 'error',
                        'bg-yellow-50/95 border-yellow-200 text-yellow-800': type === 'warning',
                        'bg-blue-50/95 border-blue-200 text-blue-800': type === 'info'
                    }
                )}
            >
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon
                            className={clsx(
                                'w-5 h-5',
                                {
                                    'text-green-600': type === 'success',
                                    'text-red-600': type === 'error',
                                    'text-yellow-600': type === 'warning',
                                    'text-blue-600': type === 'info'
                                }
                            )}
                        />
                    </div>
                    <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium mb-1">
                            {title}
                        </h4>
                        <p className="text-sm opacity-90">
                            {message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className={clsx(
                                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                                {
                                    'text-green-600 hover:bg-green-100 focus:ring-green-500': type === 'success',
                                    'text-red-600 hover:bg-red-100 focus:ring-red-500': type === 'error',
                                    'text-yellow-600 hover:bg-yellow-100 focus:ring-yellow-500': type === 'warning',
                                    'text-blue-600 hover:bg-blue-100 focus:ring-blue-500': type === 'info'
                                }
                            )}
                        >
                            <span className="sr-only">Cerrar</span>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* Progress bar for auto-close */}
                {autoClose && isVisible && (
                    <div className="mt-3 -mb-1 -mx-1">
                        <div
                            className={clsx(
                                'h-1 rounded-full opacity-30 transition-all ease-linear',
                                {
                                    'bg-green-600': type === 'success',
                                    'bg-red-600': type === 'error',
                                    'bg-yellow-600': type === 'warning',
                                    'bg-blue-600': type === 'info'
                                }
                            )}
                            style={{
                                width: '100%',
                                animation: `toast-progress ${duration}ms linear forwards`
                            }}
                        />
                    </div>
                )}
            </div>
            
            <style jsx>{`
                @keyframes toast-progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `}</style>
        </div>
    );
}