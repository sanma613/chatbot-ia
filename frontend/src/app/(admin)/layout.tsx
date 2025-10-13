'use client';

import React from 'react';
import { Shield, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const adminNavItems = [
    {
        name: 'Panel de Escalación',
        href: '/escalate',
        icon: Shield,
        description: 'Gestionar tickets escalados'
    },
    {
        name: 'Usuarios',
        href: '/admin/users',
        icon: Users,
        description: 'Administrar usuarios'
    },
    {
        name: 'Reportes',
        href: '/admin/reports',
        icon: BarChart3,
        description: 'Ver estadísticas y reportes'
    },
    {
        name: 'Configuración',
        href: '/admin/settings',
        icon: Settings,
        description: 'Configuración del sistema'
    }
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-white">
            {/* Header de administrador */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo y título */}
                        <div className="flex items-center">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-3">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-dark">
                                    Panel de Administración
                                </h1>
                                <p className="text-sm text-dark">
                                    Sistema de Gestión Académica
                                </p>
                            </div>
                        </div>

                        {/* Navegación y perfil */}
                        <div className="flex items-center gap-4">
                            {/* Botón de cerrar sesión */}
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-dark hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navegación de pestañas */}
                <div className="mb-8">
                    <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border">
                        {adminNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || 
                                           (item.href === '/escalate' && pathname.startsWith('/escalate'));
                            
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        'flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors flex-1 justify-center',
                                        {
                                            'bg-blue-100 text-blue-700': isActive,
                                            'text-dark hover:text-primary hover:bg-gray': !isActive
                                        }
                                    )}
                                    title={item.description}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Contenido principal */}
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}