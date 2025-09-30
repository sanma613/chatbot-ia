import { useState, useCallback } from 'react';

interface ToastState {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
}

interface ShowToastParams {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

export function useToast() {
    const [toast, setToast] = useState<ToastState | null>(null);

    const showToast = useCallback(({ title, message, type }: ShowToastParams) => {
        const id = Math.random().toString(36).substr(2, 9);
        
        setToast({
            id,
            title,
            message,
            type,
            isVisible: true
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => 
            prev ? { ...prev, isVisible: false } : null
        );
        
        // Remove toast from state after animation completes
        setTimeout(() => {
            setToast(null);
        }, 300);
    }, []);

    // Convenience methods for different types
    const showSuccess = useCallback((title: string, message: string) => {
        showToast({ title, message, type: 'success' });
    }, [showToast]);

    const showError = useCallback((title: string, message: string) => {
        showToast({ title, message, type: 'error' });
    }, [showToast]);

    const showWarning = useCallback((title: string, message: string) => {
        showToast({ title, message, type: 'warning' });
    }, [showToast]);

    const showInfo = useCallback((title: string, message: string) => {
        showToast({ title, message, type: 'info' });
    }, [showToast]);

    return {
        toast,
        showToast,
        hideToast,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
}