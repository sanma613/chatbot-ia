'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
    children, 
    fallback = (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-3 text-lg text-dark">Verificando acceso...</span>
        </div>
    )
}: ProtectedRouteProps) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Si terminó de cargar y no hay usuario, redirigir a login
        if (!loading && !user) {
            const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
            router.push(loginUrl);
        }
    }, [user, loading, router, pathname]);

    // Mostrar fallback mientras carga
    if (loading) {
        return <>{fallback}</>;
    }

    // Si no hay usuario después de cargar, no mostrar contenido
    // (la redirección ya se activó en useEffect)
    if (!user) {
        return <>{fallback}</>;
    }

    // Usuario autenticado, mostrar contenido protegido
    return <>{children}</>;
}