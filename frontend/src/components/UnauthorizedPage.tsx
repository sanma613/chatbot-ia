import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, LogIn } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface UnauthorizedPageProps {
    title?: string;
    message?: string;
    showLoginButton?: boolean;
}

export default function UnauthorizedPage({ 
    title = "Acceso No Autorizado",
    message = "Debes iniciar sesión para acceder a esta página.",
    showLoginButton = true
}: UnauthorizedPageProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {/* Icono */}
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="w-10 h-10 text-red-600" />
                </div>
                
                {/* Título */}
                <h1 className="text-2xl font-bold text-dark mb-4">
                    {title}
                </h1>
                
                {/* Mensaje */}
                <p className="text-dark mb-8 leading-relaxed">
                    {message}
                </p>
                
                {/* Botones de acción */}
                <div className="space-y-4">
                    {showLoginButton && (
                        <Link
                            href="/login"
                            className={cn(
                                "w-full inline-flex items-center justify-center gap-2",
                                "px-6 py-3 bg-primary text-white rounded-lg",
                                "hover:bg-primary-dark transition-colors",
                                "font-medium"
                            )}
                        >
                            <LogIn className="w-5 h-5" />
                            Iniciar Sesión
                        </Link>
                    )}
                    
                    <Link
                        href="/"
                        className={cn(
                            "w-full inline-flex items-center justify-center gap-2",
                            "px-6 py-3 border border-gray-300 text-dark rounded-lg",
                            "hover:bg-gray-50 transition-colors"
                        )}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver al Inicio
                    </Link>
                </div>
                
                {/* Información adicional */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        💡 <strong>¿Necesitas una cuenta?</strong>
                        <br />
                        <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                            Regístrate aquí
                        </Link> para crear tu cuenta de estudiante.
                    </p>
                </div>
            </div>
        </div>
    );
}