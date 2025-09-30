'use client';

import React, { useEffect } from 'react';
import { NotificationType } from '@/app/types/notification';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
}

const NotificationModal = ({
    isOpen,
    onClose,
    type,
    title,
    message,
    duration = 5000
}: NotificationModalProps) => {
    // Auto-cerrar después del tiempo especificado
    useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    // No renderizar si no está abierto
    if (!isOpen) return null;

    // Configuración de estilos según el tipo
    const getNotificationConfig = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return {
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    iconColor: 'text-green-600',
                    titleColor: 'text-green-800',
                    messageColor: 'text-green-700',
                    buttonColor: 'hover:bg-green-100 text-green-600',
                    Icon: CheckCircle
                };
            case 'error':
                return {
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    iconColor: 'text-red-600',
                    titleColor: 'text-red-800',
                    messageColor: 'text-red-700',
                    buttonColor: 'hover:bg-red-100 text-red-600',
                    Icon: XCircle
                };
            case 'warning':
                return {
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    iconColor: 'text-yellow-600',
                    titleColor: 'text-yellow-800',
                    messageColor: 'text-yellow-700',
                    buttonColor: 'hover:bg-yellow-100 text-yellow-600',
                    Icon: AlertTriangle
                };
            case 'info':
                return {
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    iconColor: 'text-blue-600',
                    titleColor: 'text-blue-800',
                    messageColor: 'text-blue-700',
                    buttonColor: 'hover:bg-blue-100 text-blue-600',
                    Icon: Info
                };
            default:
                return {
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    iconColor: 'text-dark',
                    titleColor: 'text-dark',
                    messageColor: 'text-dark',
                    buttonColor: 'hover:bg-gray-100 text-dark',
                    Icon: Info
                };
        }
    };

    const config = getNotificationConfig(type);
    const { Icon } = config;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all">
                <div className={clsx(
                    config.bgColor,
                    config.borderColor,
                    'border rounded-lg p-6'
                )}>
                    {/* Header con icono y botón cerrar */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Icon className={clsx('w-6 h-6', config.iconColor)} />
                            <h3 className={clsx('text-lg font-semibold', config.titleColor)}>
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className={clsx('p-1 rounded-full transition-colors', config.buttonColor)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Mensaje */}
                    <p className={clsx(config.messageColor, 'leading-relaxed mb-4')}>
                        {message}
                    </p>
                    
                    {/* Botón de acción */}
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className={clsx(
                                'px-4 py-2 rounded-md font-medium transition-colors',
                                config.buttonColor,
                                config.bgColor,
                                'border',
                                config.borderColor
                            )}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;