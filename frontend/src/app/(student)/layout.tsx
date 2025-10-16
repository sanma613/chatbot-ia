'use client';

import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import React from 'react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar que el usuario tiene el rol correcto
  const { loading } = useRoleRedirect('user');

  // Mostrar loading mientras verifica
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg text-dark">Verificando acceso...</span>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar />
        <main className="flex-1 bg-white overflow-y-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
